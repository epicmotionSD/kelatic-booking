import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST - Reschedule an appointment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { new_start_time } = await request.json();

    if (!new_start_time) {
      return NextResponse.json(
        { error: 'new_start_time is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch the current appointment
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        id,
        stylist_id,
        status,
        start_time,
        end_time,
        client_id,
        service:services (
          id,
          name,
          duration
        ),
        stylist:profiles!appointments_stylist_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        client:profiles!appointments_client_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        appointment_addons (
          duration
        )
      `)
      .eq('id', params.id)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Check if appointment can be rescheduled
    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return NextResponse.json(
        { error: 'This appointment cannot be rescheduled' },
        { status: 400 }
      );
    }

    // Check if original appointment is in the past
    if (new Date(appointment.start_time) < new Date()) {
      return NextResponse.json(
        { error: 'Cannot reschedule past appointments' },
        { status: 400 }
      );
    }

    // Calculate total duration including add-ons
    const service = Array.isArray(appointment.service)
      ? appointment.service[0]
      : appointment.service;
    let totalDuration = service?.duration || 60;
    if (appointment.appointment_addons?.length) {
      totalDuration += appointment.appointment_addons.reduce(
        (sum: number, addon: any) => sum + (addon.duration || 0),
        0
      );
    }

    // Calculate new end time
    const newStartTime = new Date(new_start_time);
    const newEndTime = new Date(newStartTime.getTime() + totalDuration * 60000);

    // Check if new time is in the past
    if (newStartTime < new Date()) {
      return NextResponse.json(
        { error: 'Cannot reschedule to a past time' },
        { status: 400 }
      );
    }

    // Check for conflicts with other appointments (excluding this one)
    const { data: conflicts } = await supabase
      .from('appointments')
      .select('id')
      .eq('stylist_id', appointment.stylist_id)
      .neq('id', params.id)
      .lt('start_time', newEndTime.toISOString())
      .gt('end_time', newStartTime.toISOString())
      .not('status', 'in', '("cancelled","no_show")')
      .limit(1);

    if (conflicts?.length) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 409 }
      );
    }

    // Check stylist availability (schedule and time off)
    const dayOfWeek = newStartTime.getDay();
    const timeStr = newStartTime.toTimeString().slice(0, 5);

    // Check if stylist works on this day/time
    const { data: schedules } = await supabase
      .from('stylist_schedules')
      .select('*')
      .eq('stylist_id', appointment.stylist_id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_active', true);

    if (!schedules?.length) {
      return NextResponse.json(
        { error: 'Stylist is not available on this day' },
        { status: 400 }
      );
    }

    // Check if time falls within any schedule block
    const isWithinSchedule = schedules.some((schedule) => {
      return timeStr >= schedule.start_time && timeStr < schedule.end_time;
    });

    if (!isWithinSchedule) {
      return NextResponse.json(
        { error: 'Stylist is not available at this time' },
        { status: 400 }
      );
    }

    // Check for time off
    const { data: timeOff } = await supabase
      .from('stylist_time_off')
      .select('*')
      .eq('stylist_id', appointment.stylist_id)
      .lte('start_datetime', newStartTime.toISOString())
      .gte('end_datetime', newStartTime.toISOString())
      .limit(1);

    if (timeOff?.length) {
      return NextResponse.json(
        { error: 'Stylist has time off scheduled during this time' },
        { status: 400 }
      );
    }

    // Store old time for notification
    const oldStartTime = appointment.start_time;

    // Update the appointment
    const { data: updatedAppointment, error: updateError } = await supabase
      .from('appointments')
      .update({
        start_time: newStartTime.toISOString(),
        end_time: newEndTime.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating appointment:', updateError);
      return NextResponse.json(
        { error: 'Failed to reschedule appointment' },
        { status: 500 }
      );
    }

    // Send reschedule notification
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      await fetch(`${baseUrl}/api/notifications/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: params.id,
          oldStartTime,
          newStartTime: newStartTime.toISOString(),
        }),
      });
    } catch (notifError) {
      console.error('Failed to send reschedule notification:', notifError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error('Reschedule error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
