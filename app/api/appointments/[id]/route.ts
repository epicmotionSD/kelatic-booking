import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET - Fetch appointment details (public access with appointment ID)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        status,
        quoted_price,
        final_price,
        client_notes,
        service:services (
          id,
          name,
          duration,
          base_price
        ),
        stylist:profiles!appointments_stylist_id_fkey (
          id,
          first_name,
          last_name
        ),
        client:profiles!appointments_client_id_fkey (
          id,
          first_name,
          last_name,
          email
        ),
        appointment_addons (
          service:services (
            id,
            name,
            base_price
          ),
          price,
          duration
        )
      `)
      .eq('id', id)
      .single();

    if (error || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
