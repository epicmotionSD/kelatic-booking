import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';
import {
  sendBookingConfirmation,
  notifyStylistNewBooking,
  type AppointmentDetails,
} from '@/lib/notifications/service';
import { queryBluehost } from '@/lib/mysql/bluehost';

// Send confirmation notifications directly (no internal HTTP fetch)
async function sendConfirmationNotifications(appointmentId: string) {
  try {
    console.log('[BookingAPI] Sending confirmation notification for appointment:', appointmentId);

    const admin = createAdminClient();

    // Fetch appointment with all related data
    const { data: appointment, error } = await admin
      .from('appointments')
      .select(`
        id,
        status,
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

    if (error || !appointment) {
      console.error('[BookingAPI] Appointment not found for notification:', { error, appointmentId });
      return;
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
    const clientName = client
      ? `${client.first_name} ${client.last_name}`
      : appointment.walk_in_name || 'Guest';
    const clientEmail = client?.email || appointment.walk_in_email;
    const clientPhone = client?.phone || appointment.walk_in_phone;

    if (!clientEmail) {
      console.error('[BookingAPI] No client email found, skipping notification');
      return;
    }

    // Fetch business data
    const { data: businessRow } = await admin
      .from('businesses')
      .select('*')
      .eq('id', appointment.business_id)
      .single();

    if (!businessRow) {
      console.error('[BookingAPI] Business not found for notification');
      return;
    }

    const { data: settingsRow } = await admin
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
      status: appointment.status,
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

    const ctx = {
      business: businessRow,
      settings: settingsRow || null,
    };

    // Send client confirmation
    const result = await sendBookingConfirmation(appointmentDetails, ctx as any);
    console.log('[BookingAPI] Confirmation notification result:', result);

    // Also notify stylist
    if (stylist?.email) {
      await notifyStylistNewBooking(
        stylist.email,
        stylist.phone,
        appointmentDetails,
        ctx as any
      );
      console.log('[BookingAPI] Stylist notified:', stylist.email);
    }

    // Log notification
    await admin.from('notification_logs').insert({
      appointment_id: appointmentId,
      notification_type: 'confirmation',
      email_sent: result?.email || false,
      sms_sent: result?.sms || false,
      recipient_email: clientEmail,
      recipient_phone: clientPhone,
    });
  } catch (error) {
    console.error('[BookingAPI] Failed to send notification:', error);
  }
}

interface BookingRequestBody {
  service_id: string;
  stylist_id: string;
  start_time: string;
  addon_ids?: string[];
  client: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    is_new: boolean;
  };
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BookingRequestBody = await request.json();

    // Validate required fields
    if (!body.service_id || !body.stylist_id || !body.start_time || !body.client) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    let businessId: string | null = null;

    try {
      const business = await requireBusiness();
      businessId = business.id;
    } catch (error) {
      const { data: serviceLookup } = await admin
        .from('services')
        .select('business_id')
        .eq('id', body.service_id)
        .single();

      businessId = serviceLookup?.business_id || null;

      if (!businessId) {
        return NextResponse.json(
          { error: 'Business not found' },
          { status: 404 }
        );
      }
    }

    // Get service details (filtered by business)
    const { data: service, error: serviceError } = await admin
      .from('services')
      .select('*')
      .eq('id', body.service_id)
      .eq('business_id', businessId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }


    // Fetch stylist profile to determine deposit amount
    const { data: stylistProfile, error: stylistError } = await admin
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('id', body.stylist_id)
      .eq('business_id', businessId)
      .single();

    // Calculate end time
    let totalDuration = service.duration;
    let totalPrice = service.base_price;

    // Add add-ons (filtered by business)
    if (body.addon_ids?.length) {
      const { data: addons } = await admin
        .from('services')
        .select('id, base_price, duration')
        .in('id', body.addon_ids)
        .eq('business_id', businessId);

      if (addons) {
        for (const addon of addons) {
          totalDuration += addon.duration;
          totalPrice += addon.base_price;
        }
      }
    }

    const { data: businessRow } = await admin
      .from('businesses')
      .select('timezone')
      .eq('id', businessId)
      .single();

    const timezone = businessRow?.timezone || 'America/Chicago';
    const startTime = zonedDateTimeToUtc(body.start_time, timezone);
    const endTime = new Date(startTime.getTime() + totalDuration * 60000);

    // Check for conflicts (within business)
    const { data: conflicts } = await admin
      .from('appointments')
      .select('id')
      .eq('stylist_id', body.stylist_id)
      .eq('business_id', businessId)
      .lt('start_time', endTime.toISOString())
      .gt('end_time', startTime.toISOString())
      .not('status', 'in', '("cancelled","no_show")')
      .limit(1);

    if (conflicts?.length) {
      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 409 }
      );
    }

    // Cross-check against Amelia (Bluehost MySQL) — prevents double-booking
    // between the kelatic.com WordPress booking system and this platform
    try {
      if (stylistProfile?.email) {
        const toMySQL = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' ');

        const ameliaUsers = await queryBluehost<{ id: number }>(
          `SELECT id FROM gzf_amelia_users WHERE email = ? AND type = 'provider' LIMIT 1`,
          [stylistProfile.email]
        );

        if (ameliaUsers.length) {
          const ameliaConflicts = await queryBluehost<{ id: number }>(
            `SELECT a.id FROM gzf_amelia_appointments a
             WHERE a.providerId = ?
               AND a.status NOT IN ('canceled', 'rejected', 'no-show')
               AND a.bookingStart < ?
               AND a.bookingEnd   > ?
             LIMIT 1`,
            [ameliaUsers[0].id, toMySQL(endTime), toMySQL(startTime)]
          );

          if (ameliaConflicts.length) {
            return NextResponse.json(
              { error: 'This time slot is not available — stylist has an existing appointment' },
              { status: 409 }
            );
          }
        }
      }
    } catch (ameliaError) {
      // Non-blocking: log but don't reject the booking if MySQL is unreachable
      console.error('[BookingAPI] Amelia cross-check failed (non-blocking):', ameliaError);
    }

    // Find or create client profile
    let clientId: string | null = null;

    // Check if client exists by email (within business)
    const { data: existingClient } = await admin
      .from('profiles')
      .select('id')
      .eq('email', body.client.email.toLowerCase())
      .eq('business_id', businessId)
      .single();

    if (existingClient) {
      clientId = existingClient.id;
      
      // Update phone if provided
      if (body.client.phone) {
        await admin
          .from('profiles')
          .update({ phone: body.client.phone })
          .eq('id', clientId);
      }
    } else {
      // Create new client profile for this business
      const { data: newClient, error: clientError } = await admin
        .from('profiles')
        .insert({
          first_name: body.client.first_name,
          last_name: body.client.last_name,
          email: body.client.email.toLowerCase(),
          phone: body.client.phone || null,
          role: 'client',
          business_id: businessId,
        })
        .select('id')
        .single();

      if (clientError) {
        console.error('Error creating client:', clientError);
        // Continue without client_id, store as walk-in
      } else {
        clientId = newClient.id;
      }
    }

    // Create appointment — deposits removed, all bookings go straight to confirmed
    const needsDeposit = false;
    const appointmentData: any = {
      service_id: body.service_id,
      stylist_id: body.stylist_id,
      business_id: businessId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      quoted_price: totalPrice,
      client_notes: body.notes || null,
      status: 'confirmed',
    };

    if (clientId) {
      appointmentData.client_id = clientId;
    } else {
      // Store as walk-in with contact info (including email for notifications)
      appointmentData.is_walk_in = true;
      appointmentData.walk_in_name = `${body.client.first_name} ${body.client.last_name}`;
      appointmentData.walk_in_email = body.client.email;
      appointmentData.walk_in_phone = body.client.phone;
    }

    const { data: appointment, error: appointmentError } = await admin
      .from('appointments')
      .insert(appointmentData)
      .select()
      .single();

    if (appointmentError || !appointment) {
      console.error('Error creating appointment:', appointmentError);
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 }
      );
    }

    // Create add-on records
    if (body.addon_ids?.length) {
      const { data: addons } = await admin
        .from('services')
        .select('id, base_price, duration')
        .in('id', body.addon_ids);

      if (addons?.length) {
        await admin.from('appointment_addons').insert(
          addons.map((addon) => ({
            appointment_id: appointment.id,
            service_id: addon.id,
            price: addon.base_price,
            duration: addon.duration,
          }))
        );
      }
    }

    // No deposit required — Stripe payment skipped
    const paymentIntent = null;

    // Use after() to send notifications after response — keeps function alive on Vercel
    const appointmentId = appointment.id;
    after(async () => {
      console.log('[BookingAPI] after() running for appointment:', appointmentId);
      await sendConfirmationNotifications(appointmentId);
    });

    return NextResponse.json({
      appointment,
      paymentIntent: null,
    });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function zonedDateTimeToUtc(dateTime: string, timeZone: string): Date {
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(dateTime)) {
    return new Date(dateTime);
  }
  const [datePart, timePartRaw] = dateTime.split('T');
  const timePart = timePartRaw || '00:00:00';
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map((v) => Number(v));

  const utcDate = new Date(Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0));
  const offset = getTimezoneOffset(utcDate, timeZone);
  return new Date(utcDate.getTime() - offset);
}

function getTimezoneOffset(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return asUtc - date.getTime();
}
