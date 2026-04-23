import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

// GET /api/admin/team - List all team members
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();

    const { data: team, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        bio,
        specialties,
        instagram_handle,
        commission_rate,
        is_active,
        avatar_url,
        created_at
      `)
      .eq('role', 'stylist')
      .order('first_name');

    if (error) throw error;

    // Get appointment counts for each stylist
    const teamWithStats = await Promise.all(
      (team || []).map(async (member) => {
        const { count: appointmentCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('stylist_id', member.id);

        const { count: serviceCount } = await supabase
          .from('stylist_services')
          .select('*', { count: 'exact', head: true })
          .eq('stylist_id', member.id);

        return {
          ...member,
          appointment_count: appointmentCount || 0,
          service_count: serviceCount || 0,
        };
      })
    );

    return NextResponse.json(teamWithStats);
  } catch (error) {
    console.error('Team list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/team - Create new team member
export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const body = await request.json();

    const {
      first_name,
      last_name,
      email,
      phone,
      bio,
      specialties,
      instagram_handle,
      commission_rate,
      is_active = true,
    } = body;

    if (!first_name || !last_name || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Check if email already exists in profiles
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'A team member with this email already exists' },
        { status: 400 }
      );
    }

    // profiles.id must reference auth.users(id) — create the auth user first.
    // A random temporary password is set; the stylist resets it via email.
    const tempPassword = crypto.randomUUID();
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { first_name, last_name, role: 'stylist' },
    });

    if (authError || !authData.user) {
      console.error('Auth user creation error:', authError);
      return NextResponse.json(
        { error: authError?.message || 'Failed to create auth user' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Get the business_id for Kelatic so the profile is correctly scoped
    const { data: biz } = await supabase
      .from('businesses')
      .select('id')
      .eq('slug', 'kelatic')
      .single();
    const businessId = biz?.id || null;

    // Insert the profile row — id matches the new auth user
    const { data: newMember, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        first_name,
        last_name,
        email,
        phone,
        bio,
        specialties: specialties || [],
        instagram_handle,
        commission_rate: commission_rate || 0,
        is_active,
        role: 'stylist',
        business_id: businessId,
      })
      .select()
      .single();

    if (profileError) {
      // Roll back the auth user so we don't leave an orphan
      await supabase.auth.admin.deleteUser(userId);
      console.error('Profile insert error:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Create default schedule — one row per day (the actual schema)
    // Mon–Fri 9am–5pm active, Sat 10am–4pm active, Sun closed
    const defaultDays = [
      { day_of_week: 0, is_active: false, start_time: '10:00:00', end_time: '17:00:00' },
      { day_of_week: 1, is_active: true,  start_time: '09:00:00', end_time: '17:00:00' },
      { day_of_week: 2, is_active: true,  start_time: '09:00:00', end_time: '17:00:00' },
      { day_of_week: 3, is_active: true,  start_time: '09:00:00', end_time: '17:00:00' },
      { day_of_week: 4, is_active: true,  start_time: '09:00:00', end_time: '17:00:00' },
      { day_of_week: 5, is_active: true,  start_time: '09:00:00', end_time: '17:00:00' },
      { day_of_week: 6, is_active: true,  start_time: '10:00:00', end_time: '16:00:00' },
    ];

    await supabase.from('stylist_schedules').insert(
      defaultDays.map(d => ({
        stylist_id: userId,
        business_id: businessId,
        ...d,
      }))
    );

    // Send password reset so they can set their own password
    await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Create team member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
