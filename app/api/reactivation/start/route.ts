// =============================================================================
// POST /api/reactivation/start
// One-shot endpoint: fetches merged ghost clients from both databases,
// creates the campaign record, inserts leads, and fires Inngest.
//
// Protected by CRON_SECRET bearer token.
//
// Body:
//   {
//     businessId: string          // required — Supabase business UUID
//     businessName?: string       // defaults to "KeLatic Hair Lounge"
//     service?: string            // defaults to "your appointment"
//     minDays?: number            // default 45
//     segment?: 'ghost' | 'near-miss'  // optional filter
//     limit?: number              // default 500
//     dryRun?: boolean            // default false — set true to preview only
//   }
//
// Response:
//   { campaign, summary, leads (dryRun only), dryRun }
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/client'
import { queryBluehost } from '@/lib/mysql/bluehost'
import { inngest } from '@/lib/inngest/client'
import { v4 as uuidv4 } from 'uuid'
import type { SegmentedLead, Segment, RiskProfile, ScriptVariant } from '@/types/reactivation'

// ---------------------------------------------------------------------------
// Helpers (duplicated from ghost-clients to keep routes independent)
// ---------------------------------------------------------------------------

function cleanPhone(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw.replace(/\D/g, '').slice(-10)
}

function segmentFromDays(days: number): Segment {
  return days >= 90 ? 'ghost' : 'near-miss'
}

function riskFromDays(days: number, totalVisits: number): RiskProfile {
  if (days >= 180) return 'high'
  if (days >= 90 || totalVisits <= 1) return 'medium'
  return 'low'
}

function estimateValue(totalVisits: number): number {
  return 135 + Math.min(totalVisits * 5, 40)
}

function scriptFromSegment(seg: Segment): ScriptVariant {
  return seg === 'ghost' ? 'file-closure' : 'direct-inquiry'
}

// ---------------------------------------------------------------------------
// Amelia source
// ---------------------------------------------------------------------------

async function getAmeliaLeads(minDays: number, limit: number): Promise<Map<string, SegmentedLead>> {
  const map = new Map<string, SegmentedLead>()
  try {
    const rows = await queryBluehost<{
      userId: number
      firstName: string
      lastName: string
      email: string
      phone: string | null
      lastVisit: string
      firstVisit: string
      daysSince: number
      totalVisits: number
    }>(`
      SELECT
        u.id                                          AS userId,
        u.firstName,
        u.lastName,
        u.email,
        u.phone,
        DATE_FORMAT(MAX(a.bookingStart), '%Y-%m-%dT%H:%i:%sZ')  AS lastVisit,
        DATE_FORMAT(MIN(a.bookingStart), '%Y-%m-%dT%H:%i:%sZ')  AS firstVisit,
        DATEDIFF(NOW(), MAX(a.bookingStart))          AS daysSince,
        COUNT(DISTINCT a.id)                          AS totalVisits
      FROM gzf_amelia_users u
      JOIN gzf_amelia_customer_bookings cb ON cb.customerId = u.id
      JOIN gzf_amelia_appointments a       ON a.id = cb.appointmentId
      WHERE u.type = 'customer'
        AND u.status = 'visible'
        AND u.email IS NOT NULL
        AND u.email != ''
        AND cb.status NOT IN ('canceled', 'rejected', 'no-show')
        AND a.status  NOT IN ('canceled', 'rejected', 'no-show')
      GROUP BY u.id, u.firstName, u.lastName, u.email, u.phone
      HAVING daysSince >= ?
      ORDER BY daysSince DESC
      LIMIT ?
    `, [minDays, limit])

    for (const row of rows) {
      const email = row.email.toLowerCase().trim()
      if (!email) continue
      const seg = segmentFromDays(row.daysSince)
      map.set(email, {
        id:               `amelia_${row.userId}`,
        firstName:        row.firstName,
        lastName:         row.lastName,
        email,
        phone:            cleanPhone(row.phone),
        source:           'amelia',
        firstContact:     row.firstVisit,
        lastContact:      row.lastVisit,
        segment:          seg,
        riskProfile:      riskFromDays(row.daysSince, row.totalVisits),
        estimatedValue:   estimateValue(row.totalVisits),
        daysSinceContact: row.daysSince,
        recommendedScript: scriptFromSegment(seg),
      })
    }
  } catch (err) {
    console.error('[ReactivationStart] Amelia fetch failed (non-blocking):', err)
  }
  return map
}

// ---------------------------------------------------------------------------
// Supabase source
// ---------------------------------------------------------------------------

async function getSupabaseLeads(businessId: string, minDays: number): Promise<Map<string, SegmentedLead>> {
  const map = new Map<string, SegmentedLead>()
  try {
    const admin = createAdminClient()
    // Select both registered-client fields AND walk-in fields.
    // Most appointments are walk-ins (client_id = null) with data in walk_in_* columns.
    const { data: appts, error } = await admin
      .from('appointments')
      .select(`
        id,
        client_id,
        start_time,
        walk_in_name,
        walk_in_phone,
        walk_in_email,
        client:profiles!appointments_client_id_fkey (
          id, first_name, last_name, email, phone
        )
      `)
      .eq('business_id', businessId)
      .eq('status', 'confirmed')
      .order('start_time', { ascending: false })
      .limit(5000)

    if (error || !appts) {
      console.error('[ReactivationStart] Supabase appts fetch error:', error)
      return map
    }

    type Agg = { key: string; firstName: string; lastName: string; email: string; phone: string | null; lastVisit: string; firstVisit: string; totalVisits: number }
    const agg = new Map<string, Agg>()

    for (const appt of appts) {
      // Resolve identity: registered client takes priority over walk-in
      let email: string | null = null
      let firstName = ''
      let lastName = ''
      let phone: string | null = null
      let key: string

      if (appt.client_id) {
        const clientArr = Array.isArray(appt.client) ? appt.client : [appt.client]
        const c = clientArr[0]
        if (!c?.email) continue
        email = c.email.toLowerCase().trim()
        firstName = c.first_name ?? ''
        lastName = c.last_name ?? ''
        phone = c.phone ?? null
        key = `profile_${appt.client_id}`
      } else if (appt.walk_in_email) {
        email = (appt.walk_in_email as string).toLowerCase().trim()
        const nameParts = ((appt.walk_in_name as string) ?? '').trim().split(' ')
        firstName = nameParts[0] ?? ''
        lastName = nameParts.slice(1).join(' ')
        phone = appt.walk_in_phone as string | null
        key = `walkin_${email}`
      } else {
        continue // no email — skip
      }

      if (!email) continue

      const existing = agg.get(key)
      if (!existing) {
        agg.set(key, { key, firstName, lastName, email, phone, lastVisit: appt.start_time, firstVisit: appt.start_time, totalVisits: 1 })
      } else {
        existing.firstVisit = appt.start_time
        existing.totalVisits++
      }
    }

    const now = Date.now()
    for (const a of agg.values()) {
      const daysSince = Math.floor((now - new Date(a.lastVisit).getTime()) / 86_400_000)
      if (daysSince < minDays) continue
      const seg = segmentFromDays(daysSince)
      map.set(a.email, {
        id:               `supabase_${a.key}`,
        firstName:        a.firstName,
        lastName:         a.lastName,
        email:            a.email,
        phone:            cleanPhone(a.phone),
        source:           'supabase',
        firstContact:     a.firstVisit,
        lastContact:      a.lastVisit,
        segment:          seg,
        riskProfile:      riskFromDays(daysSince, a.totalVisits),
        estimatedValue:   estimateValue(a.totalVisits),
        daysSinceContact: daysSince,
        recommendedScript: scriptFromSegment(seg),
      })
    }
  } catch (err) {
    console.error('[ReactivationStart] Supabase aggregation failed (non-blocking):', err)
  }
  return map
}

// ---------------------------------------------------------------------------
// Campaign launch config (email-only cadence)
// ---------------------------------------------------------------------------

const EMAIL_CADENCE = [
  { day: 1, delayHours: 0,   script: 'direct_inquiry', channel: 'email' as const,
    template: 'Hi {firstName}, are you still thinking about {service}? We\'d love to have you back. Book anytime at https://kelatic.com/book — {businessName}' },
  { day: 3, delayHours: 48,  script: 'file_closure',   channel: 'email' as const,
    template: 'Hi {firstName}, we were about to close your file. If you still want {service}, grab a spot before we do: https://kelatic.com/book — {businessName}' },
  { day: 7, delayHours: 144, script: 'breakup',        channel: 'email' as const,
    template: 'Hi {firstName}, this is our last check-in. If you ever want {service} again, we\'re here: https://kelatic.com/book — {businessName}' },
]

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // Authenticate
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const {
    businessId,
    businessName = 'KeLatic Hair Lounge',
    service      = 'your appointment',
    minDays      = 45,
    segment      = null,
    limit        = 500,
    dryRun       = false,
  }: {
    businessId:   string
    businessName?: string
    service?:      string
    minDays?:      number
    segment?:      Segment | null
    limit?:        number
    dryRun?:       boolean
  } = body

  if (!businessId) {
    return NextResponse.json({ error: 'businessId is required' }, { status: 400 })
  }

  const effectiveMin = segment === 'ghost' ? Math.max(minDays, 90) : minDays

  // -----------------------------------------------------------------
  // Fetch from both sources in parallel
  // -----------------------------------------------------------------
  const [ameliaMap, supabaseMap] = await Promise.all([
    getAmeliaLeads(effectiveMin, limit),
    getSupabaseLeads(businessId, effectiveMin),
  ])

  // Merge — Supabase wins on email collision
  const merged = new Map<string, SegmentedLead>()
  for (const [email, lead] of ameliaMap)   merged.set(email, lead)
  for (const [email, lead] of supabaseMap) merged.set(email, lead)

  // Apply segment filter and sort
  let leads: SegmentedLead[] = [...merged.values()]
    .filter(l => !segment || l.segment === segment)
    .sort((a, b) => b.daysSinceContact - a.daysSinceContact)
    .slice(0, limit)

  const summary = {
    total:           leads.length,
    ghost:           leads.filter(l => l.segment === 'ghost').length,
    nearMiss:        leads.filter(l => l.segment === 'near-miss').length,
    fromAmelia:      leads.filter(l => l.source === 'amelia').length,
    fromSupabase:    leads.filter(l => l.source === 'supabase').length,
    totalEstimatedValue: leads.reduce((s, l) => s + l.estimatedValue, 0),
    avgDaysSince:    leads.length
      ? Math.round(leads.reduce((s, l) => s + l.daysSinceContact, 0) / leads.length)
      : 0,
  }

  if (leads.length === 0) {
    return NextResponse.json({ success: false, error: 'No ghost clients found matching criteria', summary })
  }

  if (dryRun) {
    return NextResponse.json({
      success: true,
      dryRun: true,
      summary,
      leads,
      message: `Found ${leads.length} ghost clients. Call with dryRun=false to launch the campaign.`,
    })
  }

  // -----------------------------------------------------------------
  // Create campaign record
  // -----------------------------------------------------------------
  const admin = createAdminClient()
  const campaignId = uuidv4()
  const campaignName = `Reactivation Sprint — ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const { error: campaignError } = await admin.from('campaigns').insert({
    id:              campaignId,
    business_id:     businessId,
    name:            campaignName,
    status:          'active',
    segment:         segment || 'ghost',
    script_variant:  'direct_inquiry',
    script_template: EMAIL_CADENCE[0].template,
    script_variables: { service },
    cadence_type:    'hummingbird',
    cadence_config:  EMAIL_CADENCE,
    total_leads:     leads.length,
    started_at:      new Date().toISOString(),
    metrics:         { sent: 0, delivered: 0, responded: 0, booked: 0, revenue: 0 },
  })

  if (campaignError) {
    console.error('[ReactivationStart] Failed to create campaign:', campaignError)
    return NextResponse.json({ error: 'Failed to create campaign', details: campaignError.message }, { status: 500 })
  }

  // -----------------------------------------------------------------
  // Insert leads into campaign_leads
  // -----------------------------------------------------------------
  const campaignLeads = leads.map(lead => ({
    id:                    uuidv4(),
    campaign_id:           campaignId,
    business_id:           businessId,
    first_name:            lead.firstName,
    last_name:             lead.lastName,
    phone:                 lead.phone || null,
    email:                 lead.email,
    segment:               lead.segment,
    days_since_contact:    lead.daysSinceContact,
    estimated_value:       lead.estimatedValue,
    source_platform:       lead.source,
    original_first_contact: lead.firstContact || null,
    original_last_contact:  lead.lastContact  || null,
    status:                'pending' as const,
    tcpa_compliant:        true,
  }))

  const { error: leadsError } = await admin.from('campaign_leads').insert(campaignLeads)

  if (leadsError) {
    console.error('[ReactivationStart] Failed to insert leads:', leadsError)
    await admin.from('campaigns').delete().eq('id', campaignId)
    return NextResponse.json({ error: 'Failed to insert leads', details: leadsError.message }, { status: 500 })
  }

  // -----------------------------------------------------------------
  // Fire Inngest — Hummingbird email cadence
  // -----------------------------------------------------------------
  await inngest.send({
    name: 'campaign/started',
    data: {
      campaignId,
      businessId,
      businessName,
      service,
    },
  })

  return NextResponse.json({
    success: true,
    dryRun: false,
    summary,
    campaign: {
      id:               campaignId,
      name:             campaignName,
      status:           'active',
      totalLeads:       leads.length,
      cadenceDays:      EMAIL_CADENCE.map(s => s.day),
      estimatedRevenue: summary.totalEstimatedValue,
      estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    message: `Campaign launched! Hummingbird email cadence (Day 1 → Day 3 → Day 7) is now running for ${leads.length} ghost clients.`,
  })
}
