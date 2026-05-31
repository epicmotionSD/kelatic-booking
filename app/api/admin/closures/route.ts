import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/client';

async function getAuthedBusiness() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Authentication required' as const };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, business_id')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.business_id) {
    return { error: 'No business found' as const };
  }
  if (!['admin', 'owner'].includes(profile.role)) {
    return { error: 'Insufficient permissions' as const };
  }

  const admin = createAdminClient();
  const { data: business } = await admin
    .from('businesses')
    .select('id, timezone')
    .eq('id', profile.business_id)
    .maybeSingle();

  if (!business) return { error: 'Business not found' as const };
  return { admin, business };
}

// Convert a local-date string (YYYY-MM-DD) in a timezone to UTC bounds for that day
function localDayBoundsUtc(localDate: string, timeZone: string): { start: Date; end: Date } {
  const probe = new Date(`${localDate}T00:00:00Z`);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
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
  return { start: startUtc, end: new Date(startUtc.getTime() + 24 * 60 * 60 * 1000) };
}

export async function GET() {
  const ctx = await getAuthedBusiness();
  if ('error' in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: 401 });
  }
  const { admin, business } = ctx;

  // Business-wide closures only (stylist_id IS NULL), business-scoped, ending in the future
  const nowIso = new Date().toISOString();
  const { data, error } = await admin
    .from('stylist_time_off')
    .select('id, start_datetime, end_datetime, reason, created_at')
    .is('stylist_id', null)
    .eq('business_id', business.id)
    .gte('end_datetime', nowIso)
    .order('start_datetime', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ closures: data || [], timezone: business.timezone });
}

export async function POST(request: NextRequest) {
  const ctx = await getAuthedBusiness();
  if ('error' in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: 401 });
  }
  const { admin, business } = ctx;

  const body = await request.json();
  const { start_date, end_date, reason } = body || {};

  if (!start_date || !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
    return NextResponse.json({ error: 'start_date must be YYYY-MM-DD' }, { status: 400 });
  }
  const endDate = end_date || start_date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return NextResponse.json({ error: 'end_date must be YYYY-MM-DD' }, { status: 400 });
  }
  if (endDate < start_date) {
    return NextResponse.json({ error: 'end_date cannot be before start_date' }, { status: 400 });
  }
  if (!reason?.trim()) {
    return NextResponse.json({ error: 'reason is required' }, { status: 400 });
  }

  const timeZone = business.timezone || 'America/Chicago';
  // start = midnight local on start_date, end = midnight local on the day AFTER end_date
  const { start: startUtc } = localDayBoundsUtc(start_date, timeZone);
  const { end: endUtc } = localDayBoundsUtc(endDate, timeZone);

  const { data, error } = await admin
    .from('stylist_time_off')
    .insert({
      stylist_id: null,
      business_id: business.id,
      start_datetime: startUtc.toISOString(),
      end_datetime: endUtc.toISOString(),
      reason: reason.trim(),
      is_recurring: false,
    })
    .select('id, start_datetime, end_datetime, reason')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ closure: data });
}
