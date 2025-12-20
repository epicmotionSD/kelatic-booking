import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const status = searchParams.get('status');
    const stylistId = searchParams.get('stylist_id');

    const supabase = createAdminClient();

    let query = supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        status,
        quoted_price,
        services!inner(name),
        stylist:profiles!appointments_stylist_id_fkey(first_name, last_name),
        client:profiles!appointments_client_id_fkey(first_name, last_name, phone),
        walk_in_name,
        walk_in_phone,
        payments(total_amount, is_deposit, status)
      `)
      .order('start_time');

    // Filter by date
    if (date) {
      const startOfDay = new Date(date + 'T00:00:00');
      const endOfDay = new Date(date + 'T23:59:59');
      query = query
        .gte('start_time', startOfDay.toISOString())
        .lte('start_time', endOfDay.toISOString());
    }

    // Filter by status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter by stylist
    if (stylistId && stylistId !== 'all') {
      query = query.eq('stylist_id', stylistId);
    }

    const { data: appointmentsRaw, error } = await query;

    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }

    const appointments = appointmentsRaw?.map((apt: any) => {
      const depositPayment = apt.payments?.find(
        (p: any) => p.is_deposit && p.status === 'succeeded'
      );

      return {
        id: apt.id,
        start_time: apt.start_time,
        end_time: apt.end_time,
        status: apt.status,
        quoted_price: apt.quoted_price,
        service_name: apt.services?.name,
        stylist_name: apt.stylist
          ? `${apt.stylist.first_name} ${apt.stylist.last_name}`
          : 'Unassigned',
        client_name: apt.client
          ? `${apt.client.first_name} ${apt.client.last_name}`
          : apt.walk_in_name,
        client_phone: apt.client?.phone || apt.walk_in_phone,
        deposit_paid: depositPayment?.total_amount || 0,
      };
    }) || [];

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error('Appointments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
