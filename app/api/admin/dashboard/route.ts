import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';

export async function GET() {
  try {
    const business = await requireBusiness();
    const supabase = await createClient();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's appointments count (include walk-ins, require service_id)
    const { count: todayAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .gte('start_time', todayStart.toISOString())
      .lt('start_time', todayEnd.toISOString())
      .not('status', 'in', '("cancelled","no_show")')
      .not('service_id', 'is', null);

    // This week's appointments (include walk-ins, require service_id)
    const { count: weekAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .gte('start_time', weekStart.toISOString())
      .lt('start_time', todayEnd.toISOString())
      .not('status', 'in', '("cancelled","no_show")')
      .not('service_id', 'is', null);

    // Today's revenue from completed appointments
    const { data: todayPayments } = await supabase
      .from('payments')
      .select('total_amount, appointments!inner(business_id)')
      .gte('created_at', todayStart.toISOString())
      .lt('created_at', todayEnd.toISOString())
      .eq('status', 'paid')
      .eq('appointments.business_id', business.id);

    const todayRevenue = todayPayments?.reduce((sum, p) => sum + p.total_amount, 0) || 0;

    // Week revenue
    const { data: weekPayments } = await supabase
      .from('payments')
      .select('total_amount, appointments!inner(business_id)')
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', todayEnd.toISOString())
      .eq('status', 'paid')
      .eq('appointments.business_id', business.id);

    const weekRevenue = weekPayments?.reduce((sum, p) => sum + p.total_amount, 0) || 0;

    // New clients this month
    const { count: newClients } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .eq('role', 'client')
      .gte('created_at', monthStart.toISOString());

    // Pending deposits
    const { count: pendingDeposits } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', business.id)
      .eq('status', 'pending')
      .not('service_id', 'is', null)
      .not('start_time', 'is', null)
      .gte('start_time', todayStart.toISOString());

    // Upcoming appointments today
    const { data: upcomingAppointmentsRaw } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        status,
        services!inner(name),
        profiles!appointments_stylist_id_fkey(first_name, last_name),
        client:profiles!appointments_client_id_fkey(first_name, last_name),
        walk_in_name
      `)
      .eq('business_id', business.id)
      .gte('start_time', now.toISOString())
      .lt('start_time', todayEnd.toISOString())
      .not('status', 'in', '("cancelled","no_show","completed")')
      .order('start_time')
      .limit(5);

    const upcomingAppointments = upcomingAppointmentsRaw?.map((apt: any) => ({
      id: apt.id,
      client_name: apt.client 
        ? `${apt.client.first_name} ${apt.client.last_name}`
        : apt.walk_in_name || 'Walk-in',
      service_name: apt.services?.name,
      stylist_name: apt.profiles 
        ? `${apt.profiles.first_name} ${apt.profiles.last_name}`
        : 'Unassigned',
      time: new Date(apt.start_time).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      status: apt.status,
    })) || [];

    // Recent payments
    const { data: recentPaymentsRaw } = await supabase
      .from('payments')
      .select(`
        id,
        total_amount,
        method,
        created_at,
        appointments!inner(
          business_id,
          services!inner(name),
          client:profiles!appointments_client_id_fkey(first_name, last_name),
          walk_in_name
        )
      `)
      .eq('appointments.business_id', business.id)
      .eq('status', 'succeeded')
      .order('created_at', { ascending: false })
      .limit(5);

    const recentPayments = recentPaymentsRaw?.map((payment: any) => {
      const apt = payment.appointments;
      const createdAt = new Date(payment.created_at);
      const diffMs = now.getTime() - createdAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      
      let time_ago = '';
      if (diffMins < 60) {
        time_ago = `${diffMins}m ago`;
      } else if (diffHours < 24) {
        time_ago = `${diffHours}h ago`;
      } else {
        time_ago = createdAt.toLocaleDateString();
      }

      return {
        id: payment.id,
        client_name: apt?.client
          ? `${apt.client.first_name} ${apt.client.last_name}`
          : apt?.walk_in_name || 'Walk-in',
        service_name: apt?.services?.name,
        amount: payment.total_amount,
        method: payment.method,
        time_ago,
      };
    }) || [];

    // Top services this week
    const { data: topServicesRaw } = await supabase
      .from('appointments')
      .select('services!inner(name)')
      .eq('business_id', business.id)
      .gte('start_time', weekStart.toISOString())
      .lt('start_time', todayEnd.toISOString())
      .eq('status', 'completed');

    const serviceCounts = topServicesRaw?.reduce((acc: any, apt: any) => {
      const name = apt.services.name;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {}) || {};

    const topServices = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return NextResponse.json({
      todayAppointments: todayAppointments || 0,
      weekAppointments: weekAppointments || 0,
      todayRevenue,
      weekRevenue,
      newClients: newClients || 0,
      pendingDeposits: pendingDeposits || 0,
      upcomingAppointments,
      recentPayments,
      topServices,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
