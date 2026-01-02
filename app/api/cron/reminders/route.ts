import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  sendBookingReminder,
  type AppointmentDetails,
} from '@/lib/notifications/service';

// This endpoint should be called by a cron job (Vercel Cron, Railway Cron, etc.)
// Recommended: Run every hour to catch both 24hr and 2hr reminders

// Security: Verify cron secret
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify cron secret (for production security)
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const now = new Date();

    // Define reminder windows
    const reminderWindows = [
      { hours: 24, label: '24hr' },
      { hours: 2, label: '2hr' },
    ];

    const results = {
      processed: 0,
      sent: { email: 0, sms: 0 },
      errors: 0,
    };

    for (const window of reminderWindows) {
      // Calculate time range for this reminder window
      // We look for appointments starting in the next window.hours +/- 30 minutes
      const windowStart = new Date(now.getTime() + (window.hours - 0.5) * 60 * 60 * 1000);
      const windowEnd = new Date(now.getTime() + (window.hours + 0.5) * 60 * 60 * 1000);

      // Fetch appointments in this window that haven't received this reminder
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          total_amount,
          notes,
          client:profiles!appointments_client_id_fkey (
            id,
            first_name,
            last_name,
            email,
            phone
          ),
          stylist:profiles!appointments_stylist_id_fkey (
            first_name,
            last_name
          ),
          service:services (
            name,
            duration
          ),
          appointment_addons (
            addon:service_addons (
              name
            )
          )
        `)
        .eq('status', 'confirmed')
        .gte('start_time', windowStart.toISOString())
        .lt('start_time', windowEnd.toISOString());

      if (error) {
        console.error(`Error fetching appointments for ${window.label} reminder:`, error);
        continue;
      }

      if (!appointments?.length) {
        console.log(`No appointments found for ${window.label} reminder window`);
        continue;
      }

      // Check which appointments haven't received this reminder yet
      for (const appointment of appointments) {
        // Check if reminder already sent
        const { data: existingLog } = await supabase
          .from('notification_logs')
          .select('id')
          .eq('appointment_id', appointment.id)
          .eq('notification_type', `reminder_${window.label}`)
          .single();

        if (existingLog) {
          // Already sent this reminder
          continue;
        }

        results.processed++;

        try {
          const startTime = new Date(appointment.start_time);
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

          if (!client || !stylist || !service) {
            console.error(`Missing related data for appointment ${appointment.id}`);
            continue;
          }

          const appointmentDetails: AppointmentDetails = {
            id: appointment.id,
            client_name: `${client.first_name} ${client.last_name}`,
            client_email: client.email,
            client_phone: client.phone || undefined,
            stylist_name: `${stylist.first_name} ${stylist.last_name}`,
            service_name: service.name,
            service_duration: service.duration,
            appointment_date: startTime.toISOString().split('T')[0],
            appointment_time: startTime.toTimeString().slice(0, 5),
            total_amount: appointment.total_amount || 0,
            add_ons: appointment.appointment_addons?.map((a: any) => a.addon?.name).filter(Boolean),
            notes: appointment.notes || undefined,
          };

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
          const result = await sendBookingReminder(appointmentDetails, window.hours, defaultCtx as any);

          if (result.email) results.sent.email++;
          if (result.sms) results.sent.sms++;

          // Log the reminder
          await supabase.from('notification_logs').insert({
            appointment_id: appointment.id,
            notification_type: `reminder_${window.label}`,
            email_sent: result.email,
            sms_sent: result.sms,
            recipient_email: appointmentDetails.client_email,
            recipient_phone: appointmentDetails.client_phone,
          });
        } catch (err) {
          console.error(`Error sending ${window.label} reminder for appointment ${appointment.id}:`, err);
          results.errors++;
        }
      }
    }

    console.log(`[Cron] Reminder job complete:`, results);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      ...results,
    });
  } catch (error) {
    console.error('Cron reminder error:', error);
    return NextResponse.json(
      { error: 'Failed to process reminders' },
      { status: 500 }
    );
  }
}

// Also support POST for flexibility with different cron providers
export async function POST(request: NextRequest) {
  return GET(request);
}
