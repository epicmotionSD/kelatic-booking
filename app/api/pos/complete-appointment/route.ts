import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';
import { awardPointsForEvent } from '@/lib/agents/modules/loyalty';

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

    // Get the appointment with client info (incl. contact for loyalty earn)
    const { data: appointment } = await supabase
      .from('appointments')
      .select(`
        *,
        client:profiles!appointments_client_id_fkey (id, email, phone, first_name, last_name),
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

    // Loyalty earn for the completed appointment. Runs after the response
    // so a slow earn / notification can't stall the POS flow. Idempotent on
    // appointment_id, so re-completing the same appointment is a no-op.
    after(async () => {
      try {
        const admin = createAdminClient();
        const profile = Array.isArray(appointment.client)
          ? appointment.client[0]
          : appointment.client;
        await awardPointsForEvent(admin, {
          businessId: business_id,
          trigger: 'appointment.completed',
          appointmentId,
          customerEmail: profile?.email ?? undefined,
          customerPhone: profile?.phone ?? appointment.walk_in_phone ?? undefined,
          customerName:
            [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
            appointment.walk_in_name ||
            undefined,
 