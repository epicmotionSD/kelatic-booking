import { NextResponse } from 'next/server';
import { createAdminClient, createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';

// Helper to get date boundaries in a specific timezone
function getDateBoundaries(timezone: string) {
  const now = new Date();
  
  // Get current time in the business timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayStr = formatter.format(now); // YYYY-MM-DD in business timezone
  
  // Create date boundaries using the business's local date
  const [year, month, day] = todayStr.split('-').map(Number);
  
  // Get the offset for the timezone to calculate UTC times
  const tempDate = new Date(`${todayStr}T00:00:00`);
  const utcOffset = getTimezoneOffset(timezone, tempDate);
  
  // Today start/end in UTC (accounting for timezone offset)
  const todayStart = new Date(`${todayStr}T00:00:00.000Z`);
  todayStart.setMinutes(todayStart.getMinutes() + utcOffset);
  
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(Date.UTC(year, month - 1, 1) + utcOffset * 60 * 1000);
  
  return { now, todayStart, todayEnd, weekStart, monthStart };
}

// Get timezone offset in minutes
function getTimezoneOffset(timezone: string, date: Date): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  return (utcDate.getTime() - tzDate.getTime()) / 60000;
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const supabase = await createClient();
    let business = null as any;

    try {
      business = await requireBusiness();
    } catch (error) {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: profile } = await admin
        .from('profiles')
        .select('business_id')
        .eq('id', user.id)
        .single();

      let businessId = profile?.business_id || null;

      if (!businessId) {
        const { data: member } = await admin
          .from('business_members')
          .select('business_id')
          .eq('user_id', user.id)
          .single();

        businessId = member?.business_id || null;
      }

      if (!businessId) {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      }

      const { data: businessRow } = await admin
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();

      business = businessRow;
    }
    
    // Use business timezone for date calculations (default to Chicago if not set)
    const timezone = business?.timezone || 'America/Chicago';
    const { now, todayStart, todayEnd, weekStart, monthStart } = getDateBoundaries(timezone);
    const sevenDaysOut = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const activeStatuses = '("cancelled","no_show")';

    // Counts — today, week-to-date, month-to-date
    const [{ count: todayAppointments }, { count: weekAppointments }, { count: monthAppointments }] = await Promise.all([
      supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .gte('start_time', todayStart.toISOString())
        .lt('start_time', todayEnd.toISOString())
        .not('status', 'in', activeStatuses)
        .not('service_id', 'is', null),
      supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .gte('start_time', weekStart.toISOString())
        .lt('start_time', todayEnd.toISOString())
        .not('status', 'in', activeStatuses)
        .not('service_id', 'is', null),
      supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .gte('start_time', monthStart.toISOString())
        .lt('start_time', todayEnd.toISOString())
        .not('status', 'in', activeStatuses)
        .not('service_id', 'is', null),
    ]);

    // Revenue from appointments.quoted_price (Stripe/deposits are disabled; payments
    // table is no longer populated by the booking flow, so we use quoted_price as
    // the revenue-recognized figure for confirmed/completed appointments).
    const [{ data: weekRevenueRows }, { data: monthRevenueRows }] = await Promise.all([
      supabase
        .from('appointments')
        .select('quoted_price')
        .eq('business_id', business.id)
        .gte('start_time', weekStart.toISOString())
        .lt('start_time', todayEnd.toISOString())
        .not('status', 'in', activeStatuses)
        .not('service_id', 'is', null),
      supabase
        .from('appointments')
        .select('quoted_price')
        .eq('business_id', business.id)
        .gte('start_time', monthStart.toISOString())
        .lt('start_time', todayEnd.toISOString())
        .not('status', 'in', activeStatuses)
        .not('service_id', 'is', null),
    ]);

    const weekRevenue = (weekRevenueRows || []).reduce((sum, a) => sum + (a.quoted_price || 0), 0);
    const monthRevenue = (monthRevenueRows || []).reduce((sum, a) => sum + (a.quoted_price || 0), 0);

    // Upcoming appointments — next 7 days (rolling). Used to populate the dashboard list.
    const { data: upcomingAppointmentsRaw } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        status,
        quoted_price,
        is_walk_in,
        services!inner(name),
        stylist:profiles!appointments_stylist_id_fkey(first_name, last_name),
        client:profiles!appointments_client_id_fkey(first_name, last_name)
      `)
      .eq('business_id', business.id)
      .gte('start_time', now.toISOString())
      .lt('start_time', sevenDaysOut.toISOString())
      .not('status', 'in', activeStatuses)
      .not('service_id', 'is', null)
      .order('start_time')
      .limit(50);

    const upcomingAppointments = upcomingAppointmentsRaw?.map((apt: any) => ({
      id: apt.id,
      client_name: apt.client
        ? `${apt.client.first_name} ${apt.client.last_name}`.trim()
        : apt.is_walk_in
        ? 'Walk-in'
        : 'Guest',
      service_name: apt.services?.name,
      stylist_name: apt.stylist
        ? `${apt.stylist.first_name} ${apt.stylist.last_name}`.trim()
        : 'Unassigned',
      start_time: apt.start_time,
      status: apt.status,
      quoted_price: apt.quoted_price || 0,
    })) || [];

    return NextResponse.json({
      timezone,
      counts: {
        today: todayAppointments || 0,
        week: weekAppointments || 0,
        month: monthAppointments || 0,
      },
      revenue: {
        week: weekRevenue,
        month: monthRevenue,
      },
      upcomingAppointments,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
