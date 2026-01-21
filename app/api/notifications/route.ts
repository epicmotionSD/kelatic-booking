import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  sendBookingConfirmation,
  sendBookingCancellation,
  notifyStylistNewBooking,
  type AppointmentDetails,
} from '@/lib/notifications/service';

// POST - Send notification for a specific appointment
export async function POST(request: NextRequest) {
  try {
    console.log('[NotificationsAPI] Received POST to /api/notifications');
    const { appointmentId, type } = await request.json();
    console.log('[NotificationsAPI][DEBUG] ENV:', {
      SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 8) + '...'
    });

    if (!appointmentId || !type) {
      console.error('[NotificationsAPI] Missing appointmentId or type', { appointmentId, type });
      return NextResponse.json(
        { error: 'Missing appointmentId or type' },
        { status: 400 }
      );
    }

    const validTypes = ['confirmation', 'cancellation', 'reminder'];
    if (!validTypes.includes(type)) {
      console.error('[NotificationsAPI] Invalid notification type', { type });
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    const { createAdminClient } = await import('@/lib/supabase/server');
    const supabase = createAdminClient();

    // Fetch appointment with client and service details
    // Includes walk-in fields for new client bookings without profiles
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        business_id,
        is_walk_in,
        walk_in_name,
        walk_in_email,
        walk_in_phone,
        client:profiles!appointments_client_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        stylist:profiles!appointments_stylist_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        service:services (
          id,
          name,
          duration
        ),
        appointment_addons (
          service:services (
            name
          )
        )
      `)
      .eq('id', appointmentId)
      .single();

    console.log('[NotificationsAPI][DEBUG] Query result:', { error, appointment, appointmentId });

    if (error || !appointment) {
      console.error('[NotificationsAPI] Appointment not found', { error, appointmentId });
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 }
      );
    }

    // Handle Supabase join which may return arrays
    const client = Array.isArray(appointment.client)
      ? appointment.client[0]
      : appointment.client;
    const stylist = Array.isArray(appointment.stylist)
      ? appointment.stylist[0]
      : appointment.stylist;
    const service = Array.isArray(appointment.service)
      ? appointment.service[0]
      : appointment.service;

    // Fall back to walk-in data when no client profile exists
    // This ensures new clients without profiles still receive confirmation emails
    const clientName = client
      ? `${client.first_name} ${client.last_name}`
      : appointment.walk_in_name || 'Guest';
    const clientEmail = client?.email || appointment.walk_in_email;
    const clientPhone = client?.phone || appointment.walk_in_phone;

    // Log for debugging
    console.log('[NotificationsAPI] Client details:', {
      isWalkIn: appointment.is_walk_in,
      hasClientProfile: !!client,
      clientName,
      clientEmail: clientEmail ? '***@***' : 'MISSING',
    });

    const { data: businessRow } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', appointment.business_id)
      .single();

    const { data: settingsRow } = await supabase
      .from('business_settings')
      .select('*')
      .eq('business_id', appointment.business_id)
      .single();

    const timezone = businessRow?.timezone || 'America/Chicago';
    const startTime = new Date(appointment.start_time);
    const appointmentDate = startTime.toLocaleDateString('en-CA', { timeZone: timezone });
    const appointmentTime = startTime.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: timezone,
    });

    const appointmentDetails: AppointmentDetails = {
      id: appointment.id,
      client_name: clientName,
      client_email: clientEmail,
      client_phone: clientPhone || undefined,
      stylist_name: `${stylist?.first_name} ${stylist?.last_name}`,
      service_name: service?.name || 'Service',
      service_duration: service?.duration || 60,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      add_ons: appointment.appointment_addons?.map((a: any) => a.service?.name).filter(Boolean),
    };

    let result;
    console.log('[NotificationsAPI] Sending notification type:', type, 'for appointment:', appointmentId);

    if (!businessRow) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    const ctx = {
      business: businessRow,
      settings: settingsRow || null,
    };

    switch (type) {
      case 'confirmation':
        result = await sendBookingConfirmation(appointmentDetails, ctx as any);

        // Also notify stylist
        if (stylist?.email) {
          await notifyStylistNewBooking(
            stylist.email,
            stylist.phone,
            appointmentDetails,
            ctx as any
          );
        }
        break;

      case 'cancellation':
        result = await sendBookingCancellation(appointmentDetails, ctx as any);
        break;

      case 'reminder':
        // Calculate hours until appointment
        const now = new Date();
        const hoursUntil = Math.round((startTime.getTime() - now.getTime()) / (1000 * 60 * 60));

        const { sendBookingReminder } = await import('@/lib/notifications/service');
        result = await sendBookingReminder(appointmentDetails, hoursUntil, ctx as any);
        break;
    }

    // Log notification
    await supabase.from('notification_logs').insert({
      appointment_id: appointmentId,
      notification_type: type,
      email_sent: result?.email || false,
      sms_sent: result?.sms || false,
      recipient_email: appointmentDetails.client_email,
      recipient_phone: appointmentDetails.client_phone,
    });
    console.log('[NotificationsAPI] Notification result:', result);

    return NextResponse.json({
      success: true,
      email: result?.email || false,
      sms: result?.sms || false,
    });
  } catch (error) {
    console.error('[NotificationsAPI] Notification error:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
