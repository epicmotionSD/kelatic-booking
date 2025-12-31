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

    // Get client profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, phone')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'upcoming'; // upcoming, past, all
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query for client's appointments
    let query = supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        status,
        quoted_price,
        final_price,
        client_notes,
        stylist:profiles!appointments_stylist_id_fkey(id, first_name, last_name),
        service:services(id, name, duration, category)
      `)
      .eq('client_id', profile.id)
      .order('start_time', { ascending: view === 'upcoming' });

    // Apply view filters
    const now = new Date().toISOString();
    if (view === 'upcoming') {
      query = query.gte('start_time', now).neq('status', 'cancelled');
    } else if (view === 'past') {
      query = query.lt('start_time', now);
    }

    query = query.limit(limit);

    const { data: appointments, error } = await query;

    if (error) {
      console.error('Error fetching client appointments:', error);
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }

    // Transform data
    const formattedAppointments = appointments?.map(apt => ({
      id: apt.id,
      start_time: apt.start_time,
      end_time: apt.end_time,
      status: apt.status,
      quoted_price: apt.quoted_price,
      final_price: apt.final_price,
      client_notes: apt.client_notes,
      stylist_name: apt.stylist ? `${apt.stylist.first_name} ${apt.stylist.last_name}` : 'TBD',
      stylist_id: apt.stylist?.id,
      service_name: apt.service?.name || 'Service',
      service_duration: apt.service?.duration || 60,
      service_category: apt.service?.category,
    })) || [];

    return NextResponse.json({
      appointments: formattedAppointments,
      client: {
        id: profile.id,
        name: `${profile.first_name} ${profile.last_name}`,
        email: profile.email,
        phone: profile.phone,
      }
    });
  } catch (error) {
    console.error('Client appointments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
