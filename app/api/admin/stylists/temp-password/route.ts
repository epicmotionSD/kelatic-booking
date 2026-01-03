import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { createClient } from '@supabase/supabase-js';

// Generate a secure temporary password
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, userId } = body;

    if (!email && !userId) {
      return NextResponse.json({ error: 'Email or userId required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Find the user profile
    let query = supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role');

    if (email) {
      query = query.eq('email', email);
    } else {
      query = query.eq('id', userId);
    }

    const { data: profile, error: profileError } = await query.single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user has stylist, admin, or owner role
    if (!['stylist', 'admin', 'owner'].includes(profile.role)) {
      return NextResponse.json({ error: 'Can only set temporary passwords for stylists, admins, or owners' }, { status: 400 });
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();

    // Create admin auth client for password updates
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const adminAuth = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Update the user's password
    const { error: updateError } = await adminAuth.auth.admin.updateUserById(
      profile.id,
      { password: tempPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json({ error: 'Failed to set temporary password' }, { status: 500 });
    }

    // Log the password reset activity
    await supabase.from('notification_logs').insert({
      business_id: null, // System-level action
      type: 'temp_password_set',
      recipient: profile.email,
      status: 'sent',
      metadata: {
        target_user: profile.id,
        target_name: `${profile.first_name} ${profile.last_name}`,
        target_role: profile.role,
        set_at: new Date().toISOString()
      }
    });

    return NextResponse.json({
      success: true,
      message: `Temporary password set for ${profile.first_name} ${profile.last_name}`,
      user: {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
        email: profile.email,
        role: profile.role
      },
      tempPassword,
      instructions: 'User should change this password immediately after logging in'
    });

  } catch (error) {
    console.error('Temp password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}