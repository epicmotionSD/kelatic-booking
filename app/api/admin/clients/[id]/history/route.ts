import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        status,
        quoted_price,
        services!inner(name),
        stylist:profiles!appointments_stylist_id_fkey(first_name, last_name),
        payments(total_amount, status)
      `)
      .eq('client_id', params.id)
      .order('start_time', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching client history:', error);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    const formattedAppointments = appointments?.map((apt: any) => {
      const successfulPayments = apt.payments?.filter(
        (p: any) => p.status === 'succeeded'
      );
      const totalPaid = successfulPayments?.reduce(
        (sum: number, p: any) => sum + p.total_amount,
        0
      ) || 0;

      return {
        id: apt.id,
        start_time: apt.start_time,
        status: apt.status,
        service_name: apt.services?.name,
        stylist_name: apt.stylist
          ? `${apt.stylist.first_name} ${apt.stylist.last_name}`
          : 'N/A',
        quoted_price: apt.quoted_price,
        total_paid: totalPaid,
      };
    }) || [];

    return NextResponse.json({ appointments: formattedAppointments });
  } catch (error) {
    console.error('Client history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
