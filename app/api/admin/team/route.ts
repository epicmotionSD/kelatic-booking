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

    // Validate required fields
    if (!first_name || !last_name || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
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

    // Create the team member
    const { data: newMember, error } = await supabase
      .from('profiles')
      .insert({
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
      })
      .select()
      .single();

    if (error) throw error;

    // Create default schedule
    const defaultSchedule = {
      monday: { enabled: true, blocks: [{ id: '1', start: '09:00', end: '17:00' }] },
      tuesday: { enabled: true, blocks: [{ id: '1', start: '09:00', end: '17:00' }] },
      wednesday: { enabled: true, blocks: [{ id: '1', start: '09:00', end: '17:00' }] },
      thursday: { enabled: true, blocks: [{ id: '1', start: '09:00', end: '17:00' }] },
      friday: { enabled: true, blocks: [{ id: '1', start: '09:00', end: '17:00' }] },
      saturday: { enabled: true, blocks: [{ id: '1', start: '10:00', end: '16:00' }] },
      sunday: { enabled: false, blocks: [] },
    };

    await supabase
      .from('stylist_schedules')
      .insert({
        stylist_id: newMember.id,
        weekly_schedule: defaultSchedule,
        blocked_dates: [],
      });

    return NextResponse.json(newMember, { status: 201 });
  } catch (error) {
    console.error('Create team member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
