import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get stylist profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    if (profile.role !== 'stylist' && profile.role !== 'admin' && profile.role !== 'owner') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const view = searchParams.get('view') || 'day'; // day, week, upcoming

    // Build query
    let query = supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        status,
        quoted_price,
        client_notes,
        stylist_notes,
        is_walk_in,
        walk_in_name,
        walk_in_phone,
        client:profiles!appointments_client_id_fkey(id, first_name, last_name, phone, email),
        service:services(id, name, duration)
      `)
      .eq('stylist_id', profile.id)
      .order('start_time', { ascending: true });

    // Apply date filters based on view
    if (view === 'day' && date) {
      const startOfDay = `${date}T00:00:00`;
      const endOfDay = `${date}T23:59:59`;
      query = query.gte('start_time', startOfDay).lte('start_time', endOfDay);
    } else if (view === 'week' && date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 7);
      query = query.gte('start_time', startDate.toISOString()).lte('start_time', endDate.toISOString());
    } else if (view === 'upcoming') {
      query = query.gte('start_time', new Date().toISOString());
      query = query.limit(20);
    }

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    } else {
      // Exclude cancelled by default for cleaner view
      query = query.neq('status', 'cancelled');
    }

    const { data: appointments, error } = await query;

    if (error) {
      console.error('Error fetching stylist appointments:', error);
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }

    // Transform data for easier frontend consumption
    const formattedAppointments = appointments?.map(apt => {
      // Supabase returns joined data - handle both array and object cases
      const client = Array.isArray(apt.client) ? apt.client[0] : apt.client;
      const service = Array.isArray(apt.service) ? apt.service[0] : apt.service;

      return {
        id: apt.id,
        start_time: apt.start_time,
        end_time: apt.end_time,
        status: apt.status,
        quoted_price: apt.quoted_price,
        client_notes: apt.client_notes,
        stylist_notes: apt.stylist_notes,
        is_walk_in: apt.is_walk_in,
        client_name: apt.is_walk_in
          ? apt.walk_in_name
          : client
            ? `${client.first_name} ${client.last_name}`
            : 'Unknown',
        client_phone: apt.is_walk_in ? apt.walk_in_phone : client?.phone,
        client_email: client?.email,
        service_name: service?.name || 'Service',
        service_duration: service?.duration || 60,
      };
    }) || [];

    return NextResponse.json({
      appointments: formattedAppointments,
      stylist: {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
      }
    });
  } catch (error) {
    console.error('Stylist appointments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
