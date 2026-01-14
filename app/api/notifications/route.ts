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
    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        notes,
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

    // Build appointment details object
    const startTime = new Date(appointment.start_time);
    const appointmentDetails: AppointmentDetails = {
      id: appointment.id,
      client_name: `${client?.first_name} ${client?.last_name}`,
      client_email: client?.email,
      client_phone: client?.phone || undefined,
      stylist_name: `${stylist?.first_name} ${stylist?.last_name}`,
      service_name: service?.name || 'Service',
      service_duration: service?.duration || 60,
      appointment_date: startTime.toISOString().split('T')[0],
      appointment_time: startTime.toTimeString().slice(0, 5),
      total_amount: appointment.total_amount || 0,
      add_ons: appointment.appointment_addons?.map((a: any) => a.service?.name).filter(Boolean),
      notes: appointment.notes || undefined,
    };

    let result;
    console.log('[NotificationsAPI] Sending notification type:', type, 'for appointment:', appointmentId);

    // TODO: In multi-tenant, fetch business context from appointment
    const defaultCtx = {
      business: {
        id: 'default',
        name: 'Kelatic',
        slug: 'kelatic',
        email: 'kelatic@gmail.com',
        business_type: 'salon',
        brand_voice: 'professional',
        primary_color: '#f59e0b',
        secondary_color: '#eab308',
      },
      settings: null,
    };

    switch (type) {
      case 'confirmation':
        result = await sendBookingConfirmation(appointmentDetails, defaultCtx as any);

        // Also notify stylist
        if (stylist?.email) {
          await notifyStylistNewBooking(
            stylist.email,
            stylist.phone,
            appointmentDetails,
            defaultCtx as any
          );
        }
        break;

      case 'cancellation':
        result = await sendBookingCancellation(appointmentDetails, defaultCtx as any);
        break;

      case 'reminder':
        // Calculate hours until appointment
        const now = new Date();
        const hoursUntil = Math.round((startTime.getTime() - now.getTime()) / (1000 * 60 * 60));

        const { sendBookingReminder } = await import('@/lib/notifications/service');
        result = await sendBookingReminder(appointmentDetails, hoursUntil, defaultCtx as any);
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
