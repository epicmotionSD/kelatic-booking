import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';
import { createPaymentIntent } from '@/lib/stripe';
import { toCents } from '@/lib/currency';

// Helper to send confirmation notifications
async function sendConfirmationNotifications(appointmentId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/notifications`;
    console.log('[BookingAPI] Sending confirmation notification for appointment:', appointmentId);
    console.log('[BookingAPI][DEBUG] Notification API URL:', url);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId,
        type: 'confirmation',
      }),
    });
    const text = await res.text();
    console.log('[BookingAPI][DEBUG] Notification API fetch result:', {
      status: res.status,
      statusText: res.statusText,
      body: text,
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
    const business = await requireBusiness();
    const body: BookingRequestBody = await request.json();

    // Validate required fields
    if (!body.service_id || !body.stylist_id || !body.start_time || !body.client) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get service details (filtered by business)
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', body.service_id)
      .eq('business_id', business.id)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }


    // Fetch stylist profile to determine deposit amount
    const { data: stylistProfile, error: stylistError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .eq('id', body.stylist_id)
      .eq('business_id', business.id)
      .single();

    // Calculate end time
    let totalDuration = service.duration;
    let totalPrice = service.base_price;

    // Add add-ons (filtered by business)
    if (body.addon_ids?.length) {
      const { data: addons } = await supabase
        .from('services')
        .select('id, base_price, duration')
        .in('id', body.addon_ids)
        .eq('business_id', business.id);

      if (addons) {
        for (const addon of addons) {
          totalDuration += addon.duration;
          totalPrice += addon.base_price;
        }
      }
    }

    const startTime = new Date(body.start_time);
    const endTime = new Date(startTime.getTime() + totalDuration * 60000);

    // Check for conflicts (within business)
    const { data: conflicts } = await supabase
      .from('appointments')
      .select('id')
      .eq('stylist_id', body.stylist_id)
      .eq('business_id', business.id)
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

    // Find or create client profile
    let clientId: string | null = null;

    // Check if client exists by email (within business)
    const { data: existingClient } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', body.client.email.toLowerCase())
      .eq('business_id', business.id)
      .single();

    if (existingClient) {
      clientId = existingClient.id;
      
      // Update phone if provided
      if (body.client.phone) {
        await supabase
          .from('profiles')
          .update({ phone: body.client.phone })
          .eq('id', clientId);
      }
    } else {
      // Create new client profile for this business
      const { data: newClient, error: clientError } = await supabase
        .from('profiles')
        .insert({
          first_name: body.client.first_name,
          last_name: body.client.last_name,
          email: body.client.email.toLowerCase(),
          phone: body.client.phone || null,
          role: 'client',
          business_id: business.id,
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

    // Create appointment
    const appointmentData: any = {
      service_id: body.service_id,
      stylist_id: body.stylist_id,
      business_id: business.id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      quoted_price: totalPrice,
      client_notes: body.notes || null,
      status: service.deposit_required ? 'pending' : 'confirmed',
    };

    if (clientId) {
      appointmentData.client_id = clientId;
    } else {
      // Store as walk-in with contact info if client creation failed
      appointmentData.is_walk_in = true;
      appointmentData.walk_in_name = `${body.client.first_name} ${body.client.last_name}`;
      appointmentData.walk_in_phone = body.client.phone;
    }

    const { data: appointment, error: appointmentError } = await supabase
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
      const { data: addons } = await supabase
        .from('services')
        .select('id, base_price, duration')
        .in('id', body.addon_ids);

      if (addons?.length) {
        await supabase.from('appointment_addons').insert(
          addons.map((addon) => ({
            appointment_id: appointment.id,
            service_id: addon.id,
            price: addon.base_price,
            duration: addon.duration,
          }))
        );
      }
    }

    // Create payment intent if deposit required (per stylist logic)
    let paymentIntent = null;
    let depositAmount = null;
    if (service.deposit_required) {
      // Determine deposit amount by stylist
      if (stylistProfile && stylistProfile.first_name && stylistProfile.first_name.trim().toLowerCase() === 'rockal') {
        depositAmount = 50;
      } else {
        depositAmount = 25;
      }

      paymentIntent = await createPaymentIntent({
        amount: toCents(depositAmount),
        appointmentId: appointment.id,
        isDeposit: true,
        metadata: {
          client_email: body.client.email,
          client_name: `${body.client.first_name} ${body.client.last_name}`,
        },
      });

      // Record pending payment
      await supabase.from('payments').insert({
        appointment_id: appointment.id,
        client_id: clientId,
        amount: depositAmount,
        tip_amount: 0,
        total_amount: depositAmount,
        status: 'pending',
        method: 'card_online',
        stripe_payment_intent_id: paymentIntent.id,
        is_deposit: true,
      });
    }

    // Send confirmation notifications for all bookings (don't await to avoid blocking response)
    console.log('[BookingAPI] Triggering sendConfirmationNotifications for appointment:', appointment.id);
    sendConfirmationNotifications(appointment.id).catch((err) => {
      console.error('[BookingAPI] Error sending confirmation notifications:', err);
    });

    return NextResponse.json({
      appointment,
      paymentIntent: paymentIntent
        ? {
            clientSecret: paymentIntent.client_secret,
            id: paymentIntent.id,
          }
        : null,
    });
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
