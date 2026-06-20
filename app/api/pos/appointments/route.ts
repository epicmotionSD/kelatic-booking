import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';

export const dynamic = 'force-dynamic';

type RangeKey = 'today' | 'yesterday' | 'past_7d' | 'past_30d';
const VALID_RANGES: RangeKey[] = ['today', 'yesterday', 'past_7d', 'past_30d'];

// Compute UTC bounds for a local date (YYYY-MM-DD) in a given timezone.
function localDayBoundsUtc(localDate: string, timeZone: string): { start: Date; end: Date } {
  // Get the timezone offset for the local date at midnight in that timezone.
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

function localDateStringInTz(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    let business: { id: string; timezone?: string | null } | null = null;

    try {
      business = (await requireBusiness()) as any;
    } catch {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('business_id')
        .eq('id', user.id)
        .single();

      let businessId = profile?.business_id || null;
      if (!businessId) {
        const { data: member } = await supabase
          .from('business_members')
          .select('business_id')
          .eq('user_id', user.id)
          .single();
        businessId = member?.business_id || null;
      }
      if (!businessId) {
        return NextResponse.json({ error: 'Business not found' }, { status: 404 });
      }

      const { data: businessRow } = await supabase
        .from('businesses')
        .select('id, timezone')
        .eq('id', businessId)
        .single();

      business = businessRow as any;
    }

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const timeZone = business.timezone || 'America/Chicago';
    const now = new Date();
    const { searchParams } = new URL(request.url);
    const requestedRange = searchParams.get('range') as RangeKey | null;
    const range: RangeKey = requestedRange && VALID_RANGES.includes(requestedRange) ? requestedRange : 'today';

    // Compute the date window in the business's timezone.
    const todayLocal = localDateStringInTz(now, timeZone);
    let startIso: string;
    let endIso: string;

    if (range === 'today') {
      const { start, end } = localDayBoundsUtc(todayLocal, timeZone);
      startIso = start.toISOString();
      endIso = end.toISOString();
    } else if (range === 'yesterday') {
      const yest = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yestLocal = localDateStringInTz(yest, timeZone);
      const { start, end } = localDayBoundsUtc(yestLocal, timeZone);
      startIso = start.toISOString();
      endIso = end.toISOString();
    } else {
      const days = range === 'past_7d' ? 7 : 30;
      const earliestLocal = localDateStringInTz(new Date(now.getTime() - (days - 1) * 86400000), timeZone);
      const { start } = localDayBoundsUtc(earliestLocal, timeZone);
      const { end } = localDayBoundsUtc(todayLocal, timeZone);
      startIso = start.toISOString();
      endIso = end.toISOString();
    }

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        *,
        client:profiles!appointments_client_id_fkey (
          id,
          first_name,
          last_name,
          phone,
          email
        ),
        stylist:profiles!appointments_stylist_id_fkey (
          id,
          first_name,
          last_name
        ),
        service:services (
          id,
          name,
          base_price,
          duration
        ),
        addons:appointment_addons (
          id,
          price,
          service:services (
            id,
            name
          )
        ),
        payments (
          id,
          amount,
          status,
          is_deposit
        )
      `)
      .eq('business_id', business.id)
      .gte('start_time', startIso)
      .lt('start_time', endIso)
      .order('start_time', { ascending: range === 'today' || range === 'yesterday' });

    if (error) {
      console.error('Error fetching appointments:', error);
      return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }

    return NextResponse.json({
      appointments,
      range,
      timezone: timeZone,
      window: { startIso, endIso },
    });
  } catch (error) {
    console.error('POS appointments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
