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
async function gatherBusinessSnapshot() {
  const supabase = await createClient();

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const thirtyAgo = new Date(now.getTime() - 30 * 864e5).toISOString();
  const sixtyAgo  = new Date(now.getTime() - 60 * 864e5).toISOString();
  const sevenAgo  = new Date(now.getTime() -  7 * 864e5).toISOString();

  // Today's appointments
  const { data: todayAppts } = await supabase
    .from('appointments')
    .select('id, status, quoted_price, final_price, start_time')
    .gte('start_time', `${today}T00:00:00`)
    .lte('start_time', `${today}T23:59:59`);

  // Last 30 days
  const { data: appts30 } = await supabase
    .from('appointments')
    .select('id, status, quoted_price, final_price, start_time, service_id')
    .gte('start_time', thirtyAgo);

  // Prior 30-60 days (for comparison)
  const { data: apptsPrev } = await supabase
    .from('appointments')
    .select('id, status, quoted_price, final_price')
    .gte('start_time', sixtyAgo)
    .lt('start_time', thirtyAgo);

  // Clients (total + recent)
  const { count: totalClients } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'client');

  const { count: newClients30 } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'client')
    .gte('created_at', thirtyAgo);

  // Services breakdown
  const { data: services } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes, is_active');

  // Calendar posts (Trinity content)
  const { data: calendarPosts } = await supabase
    .from('trinity_calendar_posts')
    .select('scheduled_date, platform, status, assigned_to, content_type')
    .gte('scheduled_date', today)
    .order('scheduled_date', { ascending: true })
    .limit(30);

  // Assets count
  const { count: assetCount } = await supabase
    .from('trinity_assets')
    .select('*', { count: 'exact', head: true });

  // Newsletter subscribers
  const { count: subscribers } = await supabase
    .from('newsletter_subscribers')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Recent cancellations
  const { count: cancellations7d } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .gte('start_time', sevenAgo)
    .in('status', ['cancelled', 'no_show']);

  // ── Aggregate ──────────────────────────────────────────────────────────────
  const completed30  = (appts30 || []).filter(a => a.status === 'completed');
  const completedPrev = (apptsPrev || []).filter(a => a.status === 'completed');

  const rev30  = completed30.reduce((s, a)  => s + (a.final_price ?? a.quoted_price ?? 0), 0);
  const revPrev = completedPrev.reduce((s, a) => s + (a.final_price ?? a.quoted_price ?? 0), 0);
  const revChange = revPrev > 0 ? ((rev30 - revPrev) / revPrev) * 100 : (rev30 > 0 ? 100 : 0);

  const bookings30   = (appts30 || []).length;
  const bookingsPrev = (apptsPrev || []).length;
  const bookingsChange = bookingsPrev > 0
    ? ((bookings30 - bookingsPrev) / bookingsPrev) * 100
    : (bookings30 > 0 ? 100 : 0);

  // Platform coverage in upcoming calendar
  const upcomingPosts = calendarPosts || [];
  const platformCoverage = upcomingPosts.reduce((acc: Record<string, number>, p) => {
    acc[p.platform] = (acc[p.platform] || 0) + 1;
    return acc;
  }, {});

  const postsByStatus = upcomingPosts.reduce((acc: Record<string, number>, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return {
    timestamp: now.toISOString(),
    business: {
      name: 'Kelatic Hair Lounge',
      location: 'Houston, TX',
      specialty: 'Loc specialists',
    },
    revenue: {
      last30Days: Math.round(rev30),
      prev30Days: Math.round(revPrev),
      changePercent: Math.round(revChange),
    },
    appointments: {
      today: (todayAppts || []).length,
      todayCompleted: (todayAppts || []).filter(a => a.status === 'completed').length,
      last30Days: bookings30,
      prev30Days: bookingsPrev,
      changePercent: Math.round(bookingsChange),
      cancellationsLast7Days: cancellations7d ?? 0,
      completionRate30d: bookings30 > 0
        ? Math.round((completed30.length / bookings30) * 100)
        : 0,
    },
    clients: {
      total: totalClients ?? 0,
      newLast30Days: newClients30 ?? 0,
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
    services: (services || [])
      .filter(s => s.is_active)
      .map(s => ({ name: s.name, price: s.price, duration: s.duration_minutes }))
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
