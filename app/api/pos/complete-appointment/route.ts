import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';

export async function POST(request: NextRequest) {
  try {
    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Missing appointment ID' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const business = await requireBusiness();
    const business_id = business.id;

    // Get the appointment with client info
    const { data: appointment } = await supabase
      .from('appointments')
      .select(`
        *,
        client:profiles!appointments_client_id_fkey (id),
        service:services (id, name)
      `)
      .eq('id', appointmentId)
      .eq('business_id', business_id)
      .single();

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Update appointment status
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        status: 'completed',
        final_price: appointment.quoted_price, // Could be adjusted if price changed
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Error updating appointment:', updateError);
      return NextResponse.json(
        { error: 'Failed to update appointment' },
        { status: 500 }
      );
    }

    // Update client's last visit date
    if (appointment.client?.id) {
      await supabase
        .from('profiles')
        .update({ last_visit_at: new Date().toISOString() })
        .eq('id', appointment.client.id);

      // Create rebooking reminder for maintenance services (locs, etc.)
      if (appointment.service?.name?.toLowerCase().includes('retwist')) {
        const reminderDate = new Date();
        reminderDate.setDate(reminderDate.getDate() + 42); // 6 weeks

        await supabase.from('rebooking_reminders').insert({
          client_id: appointment.client.id,
          service_id: appointment.service.id,
          last_appointment_at: new Date().toISOString(),
          recommended_interval_days: 42,
          reminder_date: reminderDate.toISOString().split('T')[0],
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Complete appointment error:', error);
    return NextResponse.json(
      { error: 'Failed to complete appointment' },
      { status: 500 }
    );
  }
}
