import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';
import { createPaymentIntent } from '@/lib/stripe';
import { toCents } from '@/lib/currency';
import {
  sendBookingConfirmation,
  notifyStylistNewBooking,
  type AppointmentDetails,
} from '@/lib/notifications/service';

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

interface BookingDiagnostics {
  requestId: string;
  stage: 'received' | 'conflict_supabase' | 'created' | 'failed';
  businessId: string | null;
  serviceId: string;
  stylistId: string;
  startTime: string;
  source: 'supabase' | 'booking_api';
  appointmentId?: string;
  reason?: string;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

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

    const baseDiagnostics = {
      requestId,
      businessId,
      serviceId: body.service_id,
      stylistId: body.stylist_id,
      startTime: body.start_time,
    };

    console.log('[BookingAPI] diagnostics', {
      ...baseDiagnostics,
      stage: 'received',
      source: 'booking_api',
    } satisfies BookingDiagnostics);

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
      console.warn('[BookingAPI] diagnostics', {
        ...baseDiagnostics,
        stage: 'conflict_supabase',
        source: 'supabase',
        reason: 'overlapping_appointment',
      } satisfies BookingDiagnostics);

      return NextResponse.json(
        { error: 'This time slot is no longer available' },
        { status: 409 }
      );
    }

    // Find or create client profile
    const clientEmail = body.client.email.toLowerCase();
    let clientId: string | null = null;

    // profiles.email is UNIQUE globally, so look up by email (not by email+business).
    // This also covers customers who previously booked at any business.
    const { data: existingClient } = await admin
      .from('profiles')
      .select('id, business_id')
      .eq('email', clientEmail)
      .maybeSingle();

    if (existingClient) {
      clientId = existingClient.id;

      // Backfill phone + business_id if missing
      const updates: Record<string, any> = {};
      if (body.client.phone) updates.phone = body.client.phone;
      if (!existingClient.business_id && businessId) updates.business_id = businessId;
      if (Object.keys(updates).length) {
        await admin.from('profiles').update(updates).eq('id', clientId);
      }
    } else {
      // No profile. profiles.id is FK to auth.users(id), so create an auth user first.
      // email_confirm=true skips the verify step — the booking confirmation email serves
      // as proof of ownership; customers can claim the account later via password reset.
      const { data: created, error: createUserError } = await admin.auth.admin.createUser({
        email: clientEmail,
        email_confirm: true,
        user_metadata: {
          first_name: body.client.first_name,
          last_name: body.client.last_name,
          phone: body.client.phone || null,
          role: 'client',
        },
      });

      let authUserId = created?.user?.id ?? null;

      if (!authUserId && createUserError) {
        // Most likely cause: an auth user exists for this email but no profile row.
        // Look them up via the admin Users list and reuse the id.
        const alreadyRegistered = /already.*(registered|exist)/i.test(createUserError.message || '');
        if (alreadyRegistered) {
          // listUsers has no email filter; page through until we find them.
          // Most installations have <1000 users, so a single page suffices.
          const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
          authUserId = list?.users?.find((u) => u.email?.toLowerCase() === clientEmail)?.id ?? null;
        }
        if (!authUserId) {
          console.error('[BookingAPI] auth.admin.createUser failed', {
            requestId,
            email: clientEmail,
            error: createUserError.message,
          });
        }
      }

      if (authUserId) {
        const { data: newClient, error: clientError } = await admin
          .from('profiles')
          .insert({
            id: authUserId,
            first_name: body.client.first_name,
            last_name: body.client.last_name,
            email: clientEmail,
            phone: body.client.phone || null,
            role: 'client',
            business_id: businessId,
          })
          .select('id')
          .single();

        if (clientError) {
          console.error('[BookingAPI] Failed to insert profile after auth user create', {
            requestId,
            email: clientEmail,
            authUserId,
            error: clientError.message,
          });
          // Fall through to walk-in
        } else {
          clientId = newClient.id;
        }
      }
    }

    // Deposit policy: per-service. A service requires a deposit only when
    // deposit_required=true AND deposit_amount>0 on the services row. No
    // category or stylist overrides — set the flags in the DB to control this.
    const needsDeposit =
      Boolean(service.deposit_required) &&
      typeof service.deposit_amount === 'number' &&
      service.deposit_amount > 0;
    const depositAmount = needsDeposit ? Number(service.deposit_amount) : 0;

    const appointmentData: any = {
      service_id: body.service_id,
      stylist_id: body.stylist_id,
      business_id: businessId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      quoted_price: totalPrice,
      client_notes: body.notes || null,
      status: needsDeposit ? 'pending' : 'confirmed',
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
      console.error('[BookingAPI] diagnostics', {
        ...baseDiagnostics,
        stage: 'failed',
        source: 'booking_api',
        reason: appointmentError?.message || 'appointment_insert_failed',
      } satisfies BookingDiagnostics);

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

    // Create a Stripe PaymentIntent for the deposit when required. The
    // appointment is created in 'pending' status above; the webhook flips it
    // to 'confirmed' on payment_intent.succeeded (see /api/webhooks/stripe).
    let paymentIntent: { id: string; client_secret: string | null } | null = null;
    if (needsDeposit) {
      try {
        const intent = await createPaymentIntent({
          amount: toCents(depositAmount),
          appointmentId: appointment.id,
          isDeposit: true,
          metadata: {
            client_email: body.client.email,
            client_name: `${body.client.first_name} ${body.client.last_name}`,
          },
        });

        paymentIntent = { id: intent.id, client_secret: intent.client_secret };

        await admin.from('payments').insert({
          appointment_id: appointment.id,
          client_id: clientId,
          amount: depositAmount,
          tip_amount: 0,
          total_amount: depositAmount,
          status: 'pending',
          method: 'card_online',
          stripe_payment_intent_id: intent.id,
          is_deposit: true,
        });
      } catch (stripeErr: any) {
        console.error('[BookingAPI] Stripe payment intent failed', {
          requestId,
          appointmentId: appointment.id,
          error: stripeErr?.message || String(stripeErr),
        });
        // Roll back the pending appointment so the slot frees up for retry.
        await admin.from('appointments').delete().eq('id', appointment.id);
        return NextResponse.json(
          { error: 'Could not start payment. Please try again.', requestId },
          { status: 502 }
        );
      }
    }

    // Use after() to send notifications after response — keeps function alive on Vercel.
    // Notifications fire even for deposit-pending appointments; the booking is
    // effectively reserved and the customer is moments away from paying.
    const appointmentId = appointment.id;
    console.log('[BookingAPI] diagnostics', {
      ...baseDiagnostics,
      stage: 'created',
      source: 'booking_api',
      appointmentId,
    } satisfies BookingDiagnostics);

    after(async () => {
      console.log('[BookingAPI] after() running for appointment:', appointmentId);
      await sendConfirmationNotifications(appointmentId);
    });

    return NextResponse.json({
      appointment,
      paymentIntent: paymentIntent?.client_secret
        ? { id: paymentIntent.id, clientSecret: paymentIntent.client_secret }
        : null,
    });
  } catch (error: any) {
    console.error('[BookingAPI] diagnostics', {
      requestId,
      stage: 'failed',
      businessId: null,
      serviceId: 'unknown',
      stylistId: 'unknown',
      startTime: 'unknown',
      source: 'booking_api',
      reason: error?.message || 'unexpected_error',
    } satisfies BookingDiagnostics);

    console.error('Booking error:', error);
    return NextResponse.json(
      {
        error: 'We hit a problem creating your booking. Please try again.',
        requestId,
      },
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
