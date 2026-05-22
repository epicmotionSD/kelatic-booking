import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireBusiness, getBusinessBySlug } from '@/lib/tenant/server';

// Reduce a phone number to its last 10 digits so country codes, formatting,
// and storage differences don't block matching.
function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

function localDateStringInTz(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function localDayBoundsUtc(localDate: string, timeZone: string): { start: Date; end: Date } {
  const probe = new Date(`${localDate}T00:00:00Z`);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = fmt.formatToParts(probe).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== 'literal') acc[p.type] = p.value;
    return acc;
  }, {});
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  const offsetMs = asUtc - probe.getTime();
  const startUtc = new Date(probe.getTime() - offsetMs);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  return { start: startUtc, end: endUtc };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone } = body || {};

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      );
    }

    let business = await requireBusiness().catch(() => null);
    if (!business) {
      business = await getBusinessBySlug('kelatic');
    }
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const admin = createAdminClient();
    const timeZone = business.timezone || 'America/Chicago';
    const todayLocal = localDateStringInTz(new Date(), timeZone);
    const { start: dayStart, end: dayEnd } = localDayBoundsUtc(todayLocal, timeZone);

    const normalizedPhone = normalizePhone(phone);

    // Try to auto-link to a booked appointment today by matching phone.
    // We look at both registered-client profiles AND walk-in phone columns
    // because a customer who booked online via the new flow has a profile,
    // but customers from before the profile-creation fix are walk-in rows.
    let matchedAppointment: { id: string; client_name: string; status: string; start_time: string } | null = null;

    if (normalizedPhone) {
      const { data: candidates } = await admin
        .from('appointments')
        .select(`
          id,
          status,
          start_time,
          is_walk_in,
          walk_in_name,
          walk_in_phone,
          client:profiles!appointments_client_id_fkey (first_name, last_name, phone)
        `)
        .eq('business_id', business.id)
        .gte('start_time', dayStart.toISOString())
        .lt('start_time', dayEnd.toISOString())
        .not('status', 'in', '("cancelled","no_show","completed")')
        .order('start_time', { ascending: true });

      for (const apt of (candidates as any[]) || []) {
        const clientArr = Array.isArray(apt.client) ? apt.client : [apt.client];
        const c = clientArr[0];
        const profilePhone = normalizePhone(c?.phone);
        const walkInPhone = normalizePhone(apt.walk_in_phone);
        if (profilePhone === normalizedPhone || walkInPhone === normalizedPhone) {
          matchedAppointment = {
            id: apt.id,
            client_name: c
              ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim()
              : apt.walk_in_name || name.trim(),
            status: apt.status,
            start_time: apt.start_time,
          };
          break;
        }
      }
    }

    if (matchedAppointment) {
      // Flip the appointment to in_progress so staff sees them as "checked in"
      // in the POS list. If it's still pending (deposit unpaid), leave the
      // status alone — that would mask an unpaid deposit.
      if (matchedAppointment.status === 'confirmed') {
        await admin
          .from('appointments')
          .update({ status: 'in_progress' })
          .eq('id', matchedAppointment.id);
      }

      return NextResponse.json({
        success: true,
        matched: true,
        appointmentId: matchedAppointment.id,
        clientName: matchedAppointment.client_name,
      });
    }

    // No matching booking — record as a walk-in request for staff triage.
    const { data, error } = await admin
      .from('walk_in_requests')
      .insert({
        business_id: business.id,
        name: name.trim(),
        phone: phone.trim(),
        status: 'new',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Walk-in request error:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to check in' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      matched: false,
      requestId: data?.id || null,
    });
  } catch (error: any) {
    console.error('Walk-in request API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
