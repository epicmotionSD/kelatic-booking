import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    const supabase = createAdminClient();
    const now = new Date();

    // Calculate date range based on range parameter
    let startDate: Date;
    let previousStartDate: Date;
    let previousEndDate: Date;

    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        break;
      case '12m':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        previousEndDate = startDate;
    }

    const endDate = now;

    // Current period appointments with related data
    const { data: currentAppointments } = await supabase
      .from('appointments')
      .select(`
        id, status, quoted_price, start_time, client_id, stylist_id,
        services(id, name, category),
        stylist:profiles!appointments_stylist_id_fkey(id, first_name, last_name)
      `)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString());

    // Previous period appointments for comparison
    const { data: previousAppointments } = await supabase
      .from('appointments')
      .select('id, status, quoted_price')
      .gte('start_time', previousStartDate.toISOString())
      .lt('start_time', previousEndDate.toISOString());

    // New clients in current period
    const { data: newClients } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'client')
      .gte('created_at', startDate.toISOString());

    // Previous period new clients
    const { data: previousNewClients } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'client')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', previousEndDate.toISOString());

    // Calculate summary metrics
    const completedAppointments = currentAppointments?.filter(a => a.status === 'completed') || [];
    const previousCompleted = previousAppointments?.filter(a => a.status === 'completed') || [];

    const totalRevenue = completedAppointments.reduce((sum, a) => sum + (a.quoted_price || 0), 0);
    const previousRevenue = previousCompleted.reduce((sum, a) => sum + (a.quoted_price || 0), 0);

    const totalBookings = currentAppointments?.length || 0;
    const previousBookings = previousAppointments?.length || 0;

    const averageTicket = completedAppointments.length > 0 
      ? totalRevenue / completedAppointments.length 
      : 0;
    const previousAvgTicket = previousCompleted.length > 0
      ? previousRevenue / previousCompleted.length
      : 0;

    const noShows = currentAppointments?.filter(a => a.status === 'no_show').length || 0;
    const completed = completedAppointments.length;

    // Calculate percentage changes
    const revenueChange = previousRevenue > 0 
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
      : 0;
    const bookingsChange = previousBookings > 0 
      ? ((totalBookings - previousBookings) / previousBookings) * 100 
      : 0;
    const ticketChange = previousAvgTicket > 0
      ? ((averageTicket - previousAvgTicket) / previousAvgTicket) * 100
      : 0;
    const newClientsChange = (previousNewClients?.length || 0) > 0
      ? (((newClients?.length || 0) - (previousNewClients?.length || 0)) / (previousNewClients?.length || 1)) * 100
      : 0;

    // Revenue by day (last 7 days for chart)
    const revenueByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
      const dayAppointments = completedAppointments.filter(a => {
        const appDate = new Date(a.start_time);
        return appDate.toDateString() === date.toDateString();
      });
      revenueByDay.push({
        date: dateStr,
        revenue: dayAppointments.reduce((sum, a) => sum + (a.quoted_price || 0), 0),
        bookings: dayAppointments.length,
      });
    }

    // Revenue by service category
    const categoryMap = new Map<string, { revenue: number; count: number }>();
    completedAppointments.forEach((a: any) => {
      const category = a.services?.category || 'Other';
      const current = categoryMap.get(category) || { revenue: 0, count: 0 };
      categoryMap.set(category, {
        revenue: current.revenue + (a.quoted_price || 0),
        count: current.count + 1,
      });
    });
    const revenueByService = Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.revenue - a.revenue);

    // Top services
    const serviceMap = new Map<string, { name: string; count: number; revenue: number }>();
    completedAppointments.forEach((a: any) => {
      const serviceName = a.services?.name || 'Unknown';
      const current = serviceMap.get(serviceName) || { name: serviceName, count: 0, revenue: 0 };
      serviceMap.set(serviceName, {
        name: serviceName,
        count: current.count + 1,
        revenue: current.revenue + (a.quoted_price || 0),
      });
    });
    const topServices = Array.from(serviceMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Stylist performance
    const stylistMap = new Map<string, {
      id: string;
      name: string;
      bookings: number;
      revenue: number;
      completed: number;
    }>();
    currentAppointments?.forEach((a: any) => {
      const stylist = a.stylist;
      if (!stylist) return;
      const id = stylist.id;
      const name = `${stylist.first_name} ${stylist.last_name}`;
      const current = stylistMap.get(id) || { id, name, bookings: 0, revenue: 0, completed: 0 };
      stylistMap.set(id, {
        id,
        name,
        bookings: current.bookings + 1,
        revenue: current.revenue + (a.status === 'completed' ? (a.quoted_price || 0) : 0),
        completed: current.completed + (a.status === 'completed' ? 1 : 0),
      });
    });
    const stylistPerformance = Array.from(stylistMap.values())
      .map(s => ({
        ...s,
        avgRating: 4.5 + Math.random() * 0.5, // Mock - would come from reviews table
        completionRate: s.bookings > 0 ? Math.round((s.completed / s.bookings) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Peak hours
    const hourMap = new Map<number, number>();
    for (let h = 9; h <= 18; h++) {
      hourMap.set(h, 0);
    }
    currentAppointments?.forEach(a => {
      const hour = new Date(a.start_time).getHours();
      if (hour >= 9 && hour <= 18) {
        hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
      }
    });
    const peakHours = Array.from(hourMap.entries())
      .map(([hour, bookings]) => ({ hour, bookings }))
      .sort((a, b) => a.hour - b.hour);

    // Client retention
    const uniqueClients = new Set(currentAppointments?.map(a => a.client_id));
    const clientRetention = {
      newClients: newClients?.length || 0,
      returning: Math.max(0, uniqueClients.size - (newClients?.length || 0)),
      vip: Math.floor(uniqueClients.size * 0.15), // Approximate VIP as 15%
    };

    // Calculate rebooking rate
    const clientAppointmentCounts = new Map<string, number>();
    currentAppointments?.forEach(a => {
      if (a.client_id) {
        clientAppointmentCounts.set(a.client_id, (clientAppointmentCounts.get(a.client_id) || 0) + 1);
      }
    });
    const rebookingClients = Array.from(clientAppointmentCounts.values()).filter(c => c >= 2).length;
    const rebookingRate = uniqueClients.size > 0 
      ? (rebookingClients / uniqueClients.size) * 100 
      : 0;

    return NextResponse.json({
      summary: {
        totalRevenue,
        revenueChange: Math.round(revenueChange * 10) / 10,
        totalBookings,
        bookingsChange: Math.round(bookingsChange * 10) / 10,
        averageTicket: Math.round(averageTicket * 100) / 100,
        ticketChange: Math.round(ticketChange * 10) / 10,
        newClients: newClients?.length || 0,
        newClientsChange: Math.round(newClientsChange * 10) / 10,
        completionRate: totalBookings > 0 ? Math.round((completed / totalBookings) * 1000) / 10 : 0,
        noShowRate: totalBookings > 0 ? Math.round((noShows / totalBookings) * 1000) / 10 : 0,
        rebookingRate: Math.round(rebookingRate * 10) / 10,
      },
      revenueByDay,
      revenueByService,
      topServices,
      stylistPerformance,
      peakHours,
      clientRetention,
    });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
