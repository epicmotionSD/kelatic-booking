import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

// GET /api/admin/team/[id] - Get single team member
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;

    const { data: member, error } = await supabase
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
      .eq('id', id)
      .eq('role', 'stylist')
      .single();

    if (error || !member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    // Get stats
    const { count: appointmentCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('stylist_id', id);

    const { count: serviceCount } = await supabase
      .from('stylist_services')
      .select('*', { count: 'exact', head: true })
      .eq('stylist_id', id);

    // Get total revenue
    const { data: completedAppts } = await supabase
      .from('appointments')
      .select('quoted_price')
      .eq('stylist_id', id)
      .eq('status', 'completed');

    const totalRevenue = completedAppts?.reduce((sum, a) => sum + (a.quoted_price || 0), 0) || 0;

    return NextResponse.json({
      ...member,
      appointment_count: appointmentCount || 0,
      service_count: serviceCount || 0,
      total_revenue: totalRevenue,
    });
  } catch (error) {
    console.error('Get team member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/team/[id] - Update team member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;
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
      is_active,
    } = body;

    // Check if member exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .eq('role', 'stylist')
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    // Check email uniqueness if changing email
    if (email) {
      const { data: emailExists } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .neq('id', id)
        .single();

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email is already in use by another team member' },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updates: Record<string, any> = {};
    if (first_name !== undefined) updates.first_name = first_name;
    if (last_name !== undefined) updates.last_name = last_name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    if (specialties !== undefined) updates.specialties = specialties;
    if (instagram_handle !== undefined) updates.instagram_handle = instagram_handle;
    if (commission_rate !== undefined) updates.commission_rate = commission_rate;
    if (is_active !== undefined) updates.is_active = is_active;

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update team member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/team/[id] - Soft delete (deactivate) team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createAdminClient();
    const { id } = await params;

    // Check for upcoming appointments
    const { count: upcomingAppts } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('stylist_id', id)
      .gte('start_time', new Date().toISOString())
      .in('status', ['pending', 'confirmed']);

    if (upcomingAppts && upcomingAppts > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot deactivate stylist with upcoming appointments',
          upcoming_appointments: upcomingAppts 
        },
        { status: 400 }
      );
    }

    // Soft delete - just deactivate
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Team member deactivated' });
  } catch (error) {
    console.error('Delete team member error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
