import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const { stylist_id, email } = await request.json();

    if (!stylist_id || !email) {
      return NextResponse.json({ error: 'Missing stylist_id or email' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Check if stylist exists
    const { data: stylist, error: stylistError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role')
      .eq('id', stylist_id)
      .single();

    if (stylistError || !stylist) {
      return NextResponse.json({ error: 'Stylist not found' }, { status: 404 });
    }

    // Check if auth user already exists for this email
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      // User already has an auth account - send password reset instead
      const { error: resetError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login?type=stylist&redirect=/stylist`,
        },
      });

      if (resetError) {
        console.error('Password reset error:', resetError);
        return NextResponse.json({ error: 'Failed to send password reset' }, { status: 500 });
      }

      // Also send the reset email
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      });

      return NextResponse.json({
        success: true,
        message: 'Password reset email sent',
        type: 'reset',
      });
    }

    // Create new auth user with invite
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      email_confirm: false,
      user_metadata: {
        first_name: stylist.first_name,
        last_name: stylist.last_name,
      },
    });

    if (createError) {
      console.error('Create user error:', createError);
      return NextResponse.json({ error: 'Failed to create auth account' }, { status: 500 });
    }

    // Update the profile to link with the new auth user if IDs don't match
    if (newUser.user && newUser.user.id !== stylist_id) {
      // This means the profile was created with a different ID
      // We need to update the profile's ID to match auth user
      // OR update the auth user's ID to match profile
      // For simplicity, let's update the profile email to ensure consistency
      await supabase
        .from('profiles')
        .update({ email: email })
        .eq('id', stylist_id);
    }

    // Send invite email
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login?type=stylist&redirect=/stylist`,
      data: {
        first_name: stylist.first_name,
        last_name: stylist.last_name,
        role: 'stylist',
      },
    });

    if (inviteError) {
      console.error('Invite error:', inviteError);
      // User was created but invite failed - try password reset instead
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
      });

      return NextResponse.json({
        success: true,
        message: 'Account created, password setup email sent',
        type: 'created',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Invite email sent',
      type: 'invited',
    });
  } catch (error) {
    console.error('Invite stylist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
