import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

let anthropic: Anthropic | null = null;
function getClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return anthropic;
}

// ─── Pull live snapshot from DB ─────────────────────────────────────────────
async function resolveBusinessId(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string | null> {
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;
  if (!user) return null;

  const [{ data: profile }, { data: member }] = await Promise.all([
    supabase.from('profiles').select('business_id').eq('id', user.id).maybeSingle(),
    supabase.from('business_members').select('business_id').eq('user_id', user.id).maybeSingle(),
  ]);

  return profile?.business_id || member?.business_id || null;
}

async function gatherBusinessSnapshot() {
  const supabase = await createClient();
  const businessId = await resolveBusinessId(supabase);

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const thirtyAgo = new Date(now.getTime() - 30 * 864e5).toISOString();
  const sixtyAgo  = new Date(now.getTime() - 60 * 864e5).toISOString();
  const sevenAgo  = new Date(now.getTime() -  7 * 864e5).toISOString();

  // Helper to scope a query to the resolved business when present. Untyped
  // because Supabase query-builder generics blow past TS's recursion limit
  // when threaded through a wrapper.
  const scope = (q: any) => (businessId ? q.eq('business_id', businessId) : q);

  // Today's appointments (include walk-in fields to support correct client counting)
  const { data: todayAppts } = await scope(
    supabase
      .from('appointments')
      .select('id, status, quoted_price, final_price, start_time')
      .gte('start_time', `${today}T00:00:00`)
      .lte('start_time', `${today}T23:59:59`)
  );

  // Last 30 days — pull walk-in identity fields so we can count actual customers
  const { data: appts30 } = await scope(
    supabase
      .from('appointments')
      .select('id, status, quoted_price, final_price, start_time, service_id, client_id, is_walk_in, walk_in_email, walk_in_phone')
      .gte('start_time', thirtyAgo)
  );

  // Prior 30-60 days (for comparison)
  const { data: apptsPrev } = await scope(
    supabase
      .from('appointments')
      .select('id, status, quoted_price, final_price, start_time')
      .gte('start_time', sixtyAgo)
      .lt('start_time', thirtyAgo)
  );

  // Client profiles in this business (used as the baseline; walk-ins layered on below)
  const { count: totalProfileClients } = await scope(
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'client')
  );

  const { count: newProfileClients30 } = await scope(
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'client')
      .gte('created_at', thirtyAgo)
  );

  // Services breakdown — schema is base_price / duration (NOT price / duration_minutes)
  const { data: services } = await scope(
    supabase
      .from('services')
      .select('id, name, base_price, duration, is_active')
  );

  // Calendar posts (Trinity content)
  const { data: calendarPosts } = await scope(
    supabase
      .from('trinity_calendar_posts')
      .select('scheduled_date, platform, status, assigned_to, content_type')
      .gte('scheduled_date', today)
      .order('scheduled_date', { ascending: true })
      .limit(30)
  );

  // Assets and newsletter — these tables may not be business-scoped; try with scope, fall back without
  const { count: assetCount } = await scope(
    supabase.from('trinity_assets').select('*', { count: 'exact', head: true })
  );

  const { count: subscribers } = await scope(
    supabase
      .from('newsletter_subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
  );

  // Recent cancellations
  const { count: cancellations7d } = await scope(
    supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .gte('start_time', sevenAgo)
      .in('status', ['cancelled', 'no_show'])
  );

  // ── Revenue recognition ───────────────────────────────────────────────────
  // Recognize revenue from any appointment that (a) has happened (start_time < now)
  // and (b) wasn't cancelled or no-show. There is no completion workflow that
  // flips status to 'completed', so filtering to 'completed' produced $0.
  const isRecognized = (a: { status: string | null; start_time: string }) =>
    a.status !== 'cancelled' &&
    a.status !== 'no_show' &&
    new Date(a.start_time) < now;

  const recognized30  = (appts30  || []).filter(isRecognized);
  const recognizedPrev = (apptsPrev || []).filter(isRecognized);

  const sumPrice = (s: number, a: any) => s + Number(a.final_price ?? a.quoted_price ?? 0);
  const rev30   = recognized30.reduce(sumPrice, 0);
  const revPrev = recognizedPrev.reduce(sumPrice, 0);
  const revChange = revPrev > 0 ? ((rev30 - revPrev) / revPrev) * 100 : (rev30 > 0 ? 100 : 0);

  const bookings30   = (appts30 || []).length;
  const bookingsPrev = (apptsPrev || []).length;
  const bookingsChange = bookingsPrev > 0
    ? ((bookings30 - bookingsPrev) / bookingsPrev) * 100
    : (bookings30 > 0 ? 100 : 0);

  // ── Customer counts that include walk-ins ─────────────────────────────────
  // Until the recent profile-creation fix, every new customer was stored as a
  // walk-in (is_walk_in=true with email/phone on the appointment). To correctly
  // distinguish new vs. returning walk-ins, we need each identity's *first*
  // appointment date — which means walking ALL their appointments, not just
  // last-30-day ones. We aggregate client-side because PostgREST doesn't
  // expose GROUP BY easily.
  const { data: walkinAllRows } = await scope(
    supabase
      .from('appointments')
      .select('walk_in_email, walk_in_phone, start_time')
      .eq('is_walk_in', true)
  );

  const walkInKey = (a: { walk_in_email?: string | null; walk_in_phone?: string | null }) =>
    (a.walk_in_email?.toLowerCase()?.trim() || a.walk_in_phone?.trim() || '');

  const walkinIdentities = new Map<string, { first: number; last: number }>();
  for (const a of (walkinAllRows as any[]) || []) {
    const key = walkInKey(a);
    if (!key) continue;
    const t = new Date(a.start_time).getTime();
    const existing = walkinIdentities.get(key);
    if (!existing) {
      walkinIdentities.set(key, { first: t, last: t });
    } else {
      if (t < existing.first) existing.first = t;
      if (t > existing.last) existing.last = t;
    }
  }

  const thirtyAgoMs = new Date(thirtyAgo).getTime();
  let walkinTrulyNew30 = 0;
  let walkinReturning30 = 0;
  for (const v of walkinIdentities.values()) {
    if (v.first >= thirtyAgoMs) {
      walkinTrulyNew30 += 1;
    } else if (v.last >= thirtyAgoMs) {
      walkinReturning30 += 1;
    }
  }

  const totalCustomers = (totalProfileClients ?? 0) + walkinIdentities.size;
  const newCustomers30 = (newProfileClients30 ?? 0) + walkinTrulyNew30;
  const returningCustomers30 = walkinReturning30; // profile clients are all new (per the recent fix), so returning are walk-in only for now

  // Platform coverage in upcoming calendar
  const upcomingPosts = calendarPosts || [];
  const platformCoverage = upcomingPosts.reduce((acc: Record<string, number>, p: any) => {
    acc[p.platform] = (acc[p.platform] || 0) + 1;
    return acc;
  }, {});

  const postsByStatus = upcomingPosts.reduce((acc: Record<string, number>, p: any) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return {
    timestamp: now.toISOString(),
    business: {
      name: 'Kelatic Hair Lounge',
      location: 'Houston, TX',
      specialty: 'Loc specialists',
      scopedById: !!businessId,
    },
    revenue: {
      last30Days: Math.round(rev30),
      prev30Days: Math.round(revPrev),
      changePercent: Math.round(revChange),
      basis: 'recognized: appointments past start_time, not cancelled/no_show. Uses final_price when set, else quoted_price.',
    },
    appointments: {
      today: (todayAppts || []).length,
      last30Days: bookings30,
      prev30Days: bookingsPrev,
      changePercent: Math.round(bookingsChange),
      cancellationsLast7Days: cancellations7d ?? 0,
      recognizedRate30d: bookings30 > 0
        ? Math.round((recognized30.length / bookings30) * 100)
        : 0,
    },
    clients: {
      total: totalCustomers,
      newLast30Days: newCustomers30,
      returningLast30Days: returningCustomers30,
      newProfileClients30: newProfileClients30 ?? 0,
      newWalkInIdentities30: walkinTrulyNew30,
      returningWalkInIdentities30: walkinReturning30,
      totalWalkInIdentitiesAllTime: walkinIdentities.size,
      note: 'Walk-in identities dedupe by lowercased email or phone across all appointments (all-time). new = first appointment within 30d. returning = previously seen, booked again in last 30d.',
    },
    content: {
      upcomingPostsCount: upcomingPosts.length,
      postsByPlatform: platformCoverage,
      postsByStatus,
      assetsInLibrary: assetCount ?? 0,
    },
    marketing: {
      newsletterSubscribers: subscribers ?? 0,
    },
    services: ((services as any[]) || [])
      .filter((s: any) => s.is_active)
      .map((s: any) => ({ name: s.name, price: Number(s.base_price ?? 0), durationMinutes: s.duration }))
      .slice(0, 10),
  };
}

// ─── Route ───────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const snapshot = await gatherBusinessSnapshot();

    const systemPrompt = `You are the Kelatic AI Advisor — a senior business intelligence assistant for Kelatic Hair Lounge, Houston's premier loc specialist salon. You analyze real business data and return sharp, actionable insights.

Your role: Analyze the business snapshot and produce a structured JSON report with:
1. An overall performance score (0-100)
2. 4-6 insight cards covering revenue, bookings, content, clients, and opportunities
3. 3-5 priority actions the team should take THIS WEEK
4. A one-line "pulse" summary (the overall vibe of the business right now)

Rules:
- Be direct and specific — no generic advice
- Reference real numbers from the data
- Flag drops, gaps, and wins clearly
- Content calendar insights should help the 2 managers know what to focus on
- Keep each insight to 2-3 sentences max
- Priority actions must be concrete and completable in a day

Respond ONLY with valid JSON in this exact structure:
{
  "score": 75,
  "pulse": "Strong bookings momentum but content pipeline is thin for the next 2 weeks.",
  "insights": [
    {
      "id": "revenue",
      "category": "Revenue",
      "icon": "DollarSign",
      "title": "Short title",
      "body": "2-3 sentence insight",
      "trend": "up" | "down" | "neutral",
      "value": "optional metric string like '$4,200' or '+18%'",
      "priority": "high" | "medium" | "low"
    }
  ],
  "actions": [
    {
      "id": "action-1",
      "title": "Action title",
      "description": "What to do and why",
      "owner": "Manager 1" | "Manager 2" | "Admin" | "Both Managers",
      "urgency": "today" | "this_week" | "this_month",
      "category": "content" | "bookings" | "marketing" | "operations"
    }
  ]
}`;

    const userMessage = `Here is today's business snapshot for Kelatic Hair Lounge. Analyze it and return your structured insight report:\n\n${JSON.stringify(snapshot, null, 2)}`;

    const response = await getClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Strip markdown fences if present
    const jsonMatch = rawText.match(/```json\n?([\s\S]*?)\n?```/) || rawText.match(/(\{[\s\S]*\})/);
    const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : rawText;

    let insights;
    try {
      insights = JSON.parse(jsonStr);
    } catch {
      insights = { score: 50, pulse: 'Unable to parse insights.', insights: [], actions: [] };
    }

    return NextResponse.json({
      ...insights,
      snapshot,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[trinity/insights] Error:', err);
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
