import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { notifyStylistNewBooking, type AppointmentDetails } from '@/lib/notifications/service';

export const dynamic = 'force-dynamic';

// POST /api/admin/notifications/resend-stylist
// Resends branded stylist notifications for all upcoming confirmed/pending appointments
export async function POST(request: NextRequest) {
  try {
    const admin = createAdminClient();
    const now = new Date().toISOString();

    // Fetch all upcoming appointments (confirmed or pending) with full relations
    const { data: appointments, error } = await admin
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
        notes,
        quoted_price,
        client:profiles!appointments_client_id_fkey (
          id, first_name, last_name, email, phone
        ),
        stylist:profiles!appointments_stylist_id_fkey (
          id, first_name, last_name, email, phone
        ),
        service:services (
          id, name, duration
        ),
        appointment_addons (
          service:services ( name )
        )
      `)
      .in('status', ['confirmed', 'pending'])
      .gte('start_time', now)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('[ResendStylist] Failed to fetch appointments:', error);
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({ message: 'No upcoming appointments found', sent: 0 });
    }

    const results: { appointmentId: string; stylistEmail: string; status: string }[] = [];

    for (const appointment of appointments) {
      try {
        const client = Array.isArray(appointment.client) ? appointment.client[0] : appointment.client;
        const stylist = Array.isArray(appointment.stylist) ? appointment.stylist[0] : appointment.stylist;
        const service = Array.isArray(appointment.service) ? appointment.service[0] : appointment.service;

        // Skip if no stylist email
        if (!stylist?.email) {
          results.push({ appointmentId: appointment.id, stylistEmail: 'none', status: 'skipped - no stylist email' });
          continue;
        }

        // Fetch business + settings
        const { data: businessRow } = await admin
          .from('businesses')
          .select('*')
          .eq('id', appointment.business_id)
          .single();

        const { data: settingsRow } = await admin
          .from('business_settings')
          .select('*')
          .eq('business_id', appointment.business_id)
          .single();

        if (!businessRow) {
          results.push({ appointmentId: appointment.id, stylistEmail: stylist.email, status: 'skipped - business not found' });
          continue;
        }

        const timezone = businessRow.timezone || 'America/Chicago';
        const startTime = new Date(appointment.start_time);
        const appointmentDate = startTime.toLocaleDateString('en-CA', { timeZone: timezone });
        const appointmentTime = startTime.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: timezone,
        });

        const clientName = client
          ? `${client.first_name} ${client.last_name}`
          : appointment.walk_in_name || 'Guest';
        const clientEmail = client?.email || appointment.walk_in_email || '';
        const clientPhone = client?.phone || appointment.walk_in_phone;

        const appointmentDetails: AppointmentDetails = {
          id: appointment.id,
          status: appointment.status,
          client_name: clientName,
          client_email: clientEmail,
          client_phone: clientPhone || undefined,
          stylist_name: `${stylist.first_name} ${stylist.last_name}`,
          service_name: service?.name || 'Service',
          service_duration: service?.duration || 60,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          total_amount: appointment.quoted_price || undefined,
          add_ons: (appointment.appointment_addons as any[])
            ?.map((a: any) => (Array.isArray(a.service) ? a.service[0]?.name : a.service?.name))
            .filter(Boolean),
          notes: appointment.notes || undefined,
        };

        await notifyStylistNewBooking(
          stylist.email,
          stylist.phone || null,
          appointmentDetails,
          { business: businessRow, settings: settingsRow || null }
        );

        results.push({ appointmentId: appointment.id, stylistEmail: stylist.email, status: 'sent' });
      } catch (err) {
        console.error('[ResendStylist] Error for appointment', appointment.id, err);
        results.push({ appointmentId: appointment.id, stylistEmail: 'error', status: String(err) });
      }
    }

    const sent = results.filter(r => r.status === 'sent').length;
    const skipped = results.filter(r => r.status.startsWith('skipped')).length;

    return NextResponse.json({
      message: `Resent stylist notifications for ${sent} upcoming appointments`,
      sent,
      skipped,
      total: appointments.length,
      results,
    });
  } catch (error) {
    console.error('[ResendStylist] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
