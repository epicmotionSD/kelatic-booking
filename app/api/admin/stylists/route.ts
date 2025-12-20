import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function GET() {
  try {
    const supabase = createAdminClient();

    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get stylists
    const { data: stylists, error } = await supabase
      .from('profiles')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        avatar_url,
        bio,
        specialties,
        instagram_handle,
        commission_rate,
        is_active
      `)
      .eq('role', 'stylist')
      .order('first_name');

    if (error) {
      console.error('Error fetching stylists:', error);
      return NextResponse.json({ error: 'Failed to fetch stylists' }, { status: 500 });
    }

    // Get service counts and appointments per stylist
    const stylistIds = stylists?.map((s) => s.id) || [];

    if (stylistIds.length === 0) {
      return NextResponse.json({ stylists: [] });
    }

    // Count services per stylist
    const { data: serviceCounts } = await supabase
      .from('stylist_services')
      .select('stylist_id')
      .in('stylist_id', stylistIds);

    // Count appointments this week
    const { data: appointmentCounts } = await supabase
      .from('appointments')
      .select('stylist_id')
      .in('stylist_id', stylistIds)
      .gte('start_time', weekStart.toISOString())
      .not('status', 'in', '("cancelled","no_show")');

    const servicesPerStylist: Record<string, number> = {};
    const appointmentsPerStylist: Record<string, number> = {};

    serviceCounts?.forEach((sc: any) => {
      servicesPerStylist[sc.stylist_id] = (servicesPerStylist[sc.stylist_id] || 0) + 1;
    });

    appointmentCounts?.forEach((ac: any) => {
      appointmentsPerStylist[ac.stylist_id] = (appointmentsPerStylist[ac.stylist_id] || 0) + 1;
    });

    const enrichedStylists = stylists?.map((stylist) => ({
      ...stylist,
      services_count: servicesPerStylist[stylist.id] || 0,
      appointments_this_week: appointmentsPerStylist[stylist.id] || 0,
    })) || [];

    return NextResponse.json({ stylists: enrichedStylists });
  } catch (error) {
    console.error('Stylists error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createAdminClient();

    // Check if email already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', body.email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }

    const { data: stylist, error } = await supabase
      .from('profiles')
      .insert({
        first_name: body.first_name,
        last_name: body.last_name,
        email: body.email.toLowerCase(),
        phone: body.phone,
        role: 'stylist',
        bio: body.bio,
        specialties: body.specialties,
        instagram_handle: body.instagram_handle,
        commission_rate: body.commission_rate,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating stylist:', error);
      return NextResponse.json({ error: 'Failed to create stylist' }, { status: 500 });
    }

    return NextResponse.json({ stylist });
  } catch (error) {
    console.error('Create stylist error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
