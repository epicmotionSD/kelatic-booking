// =============================================================================
// GET /api/reactivation/ghost-clients
// Merges inactive clients from BOTH databases:
//   1. Bluehost MySQL (Amelia WordPress) — historical bookings
//   2. Supabase — current platform bookings
// Deduplicates by email (Supabase takes precedence for fresher data)
// Returns SegmentedLead[] ready to feed into /api/reactivation/launch
//
// Segmentation:
//   ghost     → last visit > 90 days ago  (cold, hardest to reactivate)
//   near-miss → last visit 45–90 days ago (warm, highest conversion rate)
//
// Usage:
//   GET /api/reactivation/ghost-clients                         → all 45+ days (both DBs)
//   GET /api/reactivation/ghost-clients?minDays=60              → 60+ days only
//   GET /api/reactivation/ghost-clients?segment=ghost           → 90+ days only
//   GET /api/reactivation/ghost-clients?limit=100
//   GET /api/reactivation/ghost-clients?businessId=<uuid>       → include Supabase clients
//   GET /api/reactivation/ghost-clients?source=amelia           → Amelia only
//   GET /api/reactivation/ghost-clients?source=supabase         → Supabase only
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { queryBluehost } from '@/lib/mysql/bluehost'
import { createAdminClient } from '@/lib/supabase/client'
import type { SegmentedLead, Segment, RiskProfile, ScriptVariant } from '@/types/reactivation'

interface AmeliaClientRow {
  userId: number
  firstName: string
  lastName: string
  email: string
  phone: string | null
  lastVisit: string
  firstVisit: string
  daysSince: number
  totalVisits: number
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function cleanPhone(raw: string | null): string {
  if (!raw) return ''
  return raw.replace(/\D/g, '').slice(-10)
}

function segmentFromDays(days: number): Segment {
  if (days >= 90) return 'ghost'
  return 'near-miss'
}

function riskFromDays(days: number, totalVisits: number): RiskProfile {
  if (days >= 180) return 'high'
  if (days >= 90 || totalVisits <= 1) return 'medium'
  return 'low'
}

function scriptFromSegment(segment: Segment): ScriptVariant {
  if (segment === 'ghost') return 'file-closure'
  return 'direct-inquiry'
}

function estimateValue(totalVisits: number): number {
  // KeLatic average service value ~$125–$175
  const base = 135
  const loyaltyBonus = Math.min(totalVisits * 5, 40)
  return base + loyaltyBonus
}

// ---------------------------------------------------------------------------
// Source 1: Bluehost MySQL (Amelia)
// ---------------------------------------------------------------------------

async function fetchAmeliaLeads(
  effectiveMinDays: number,
  effectiveMaxDays: number,
  limit: number,
): Promise<Map<string, SegmentedLead>> {
  const leadMap = new Map<string, SegmentedLead>()

  try {
    const rows = await queryBluehost<AmeliaClientRow>(`
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
      HAVING daysSince >= ? AND daysSince <= ?
      ORDER BY daysSince DESC
      LIMIT ?
    `, [effectiveMinDays, effectiveMaxDays, limit])

    for (const row of rows) {
      const email = row.email.toLowerCase().trim()
      if (!email) continue

      const seg   = segmentFromDays(row.daysSince)
      const risk  = riskFromDays(row.daysSince, row.totalVisits)
      const value = estimateValue(row.totalVisits)

      leadMap.set(email, {
        id:               `amelia_${row.userId}`,
        firstName:        row.firstName,
        lastName:         row.lastName,
        email,
        phone:            cleanPhone(row.phone),
        source:           'amelia',
        firstContact:     row.firstVisit,
        lastContact:      row.lastVisit,
        segment:          seg,
        riskProfile:      risk,
        estimatedValue:   value,
        daysSinceContact: row.daysSince,
        recommendedScript: scriptFromSegment(seg),
      })
    }
  } catch (err) {
    console.error('[GhostClients] Amelia query failed (non-blocking):', err)
  }

  return leadMap
}

// ---------------------------------------------------------------------------
// Source 2: Supabase (kelatic-booking platform appointments)
// ---------------------------------------------------------------------------

async function fetchSupabaseLeads(
  businessId: string,
  effectiveMinDays: number,
  effectiveMaxDays: number,
): Promise<Map<string, SegmentedLead>> {
  const leadMap = new Map<string, SegmentedLead>()

  try {
    const admin = createAdminClient()

    // Pull all confirmed appointments — includes both registered clients (client_id set)
    // and walk-ins (client_id null, data in walk_in_name/phone/email columns).
    // Most KeLatic appointments are walk-ins, so we must handle both paths.
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

    if (error) {
      console.error('[GhostClients] Supabase query failed:', error)
      return leadMap
    }

    // Aggregate per unique client key (profile ID or walk-in email)
    type ClientAgg = {
      key: string
      firstName: string
      lastName: string
      email: string
      phone: string | null
      lastVisit: string
      firstVisit: string
      totalVisits: number
    }

    const clientAgg = new Map<string, ClientAgg>()

    for (const appt of appts ?? []) {
      let email: string | null = null
      let firstName = ''
      let lastName = ''
      let phone: string | null = null
      let key: string

      if (appt.client_id) {
        // Registered client — pull from profiles join
        const clientArr = Array.isArray(appt.client) ? appt.client : [appt.client]
        const client = clientArr[0]
        if (!client?.email) continue
        email = client.email.toLowerCase().trim()
        firstName = client.first_name ?? ''
        lastName = client.last_name ?? ''
        phone = client.phone ?? null
        key = `profile_${appt.client_id}`
      } else if (appt.walk_in_email) {
        // Walk-in — use walk_in_* columns
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

      const existing = clientAgg.get(key)
      if (!existing) {
        clientAgg.set(key, {
          key, firstName, lastName, email, phone,
          lastVisit:  appt.start_time,
          firstVisit: appt.start_time,
          totalVisits: 1,
        })
      } else {
        // Earlier appointment (DESC order) — update firstVisit and increment count
        existing.firstVisit = appt.start_time
        existing.totalVisits++
      }
    }

    const now = Date.now()

    for (const agg of clientAgg.values()) {
      const lastVisitMs  = new Date(agg.lastVisit).getTime()
      const daysSince    = Math.floor((now - lastVisitMs) / 86_400_000)

      if (daysSince < effectiveMinDays || daysSince > effectiveMaxDays) continue
      if (!agg.email) continue

      const seg   = segmentFromDays(daysSince)
      const risk  = riskFromDays(daysSince, agg.totalVisits)
      const value = estimateValue(agg.totalVisits)

      leadMap.set(agg.email, {
        id:               `supabase_${agg.key}`,
        firstName:        agg.firstName,
        lastName:         agg.lastName,
        email:            agg.email,
        phone:            cleanPhone(agg.phone),
        source:           'supabase',
        firstContact:     agg.firstVisit,
        lastContact:      agg.lastVisit,
        segment:          seg,
        riskProfile:      risk,
        estimatedValue:   value,
        daysSinceContact: daysSince,
        recommendedScript: scriptFromSegment(seg),
      })
    }
  } catch (err) {
    console.error('[GhostClients] Supabase aggregation failed (non-blocking):', err)
  }

  return leadMap
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const minDays    = Number(searchParams.get('minDays')  || '45')
    const maxDays    = Number(searchParams.get('maxDays')  || '99999')
    const segment    = searchParams.get('segment') as Segment | null
    const limit      = Math.min(Number(searchParams.get('limit') || '500'), 1000)
    const businessId = searchParams.get('businessId') || null
    const source     = searchParams.get('source')    || 'both' // 'both' | 'amelia' | 'supabase'

    // Resolve effective date range from segment shorthand
    const effectiveMinDays = segment === 'ghost'
      ? Math.max(minDays, 90)
      : minDays

    const effectiveMaxDays = segment === 'near-miss'
      ? Math.min(maxDays, 89)
      : maxDays

    // -----------------------------------------------------------------
    // Fetch from each source (parallel where possible)
    // -----------------------------------------------------------------
    const [ameliaMap, supabaseMap] = await Promise.all([
      source !== 'supabase'
        ? fetchAmeliaLeads(effectiveMinDays, effectiveMaxDays, limit)
        : Promise.resolve(new Map<string, SegmentedLead>()),
      source !== 'amelia' && businessId
        ? fetchSupabaseLeads(businessId, effectiveMinDays, effectiveMaxDays)
        : Promise.resolve(new Map<string, SegmentedLead>()),
    ])

    // -----------------------------------------------------------------
    // Merge: Supabase data wins on email collision (fresher platform data)
    // -----------------------------------------------------------------
    const merged = new Map<string, SegmentedLead>()

    // Insert Amelia leads first
    for (const [email, lead] of ameliaMap) {
      merged.set(email, lead)
    }

    // Supabase leads overwrite any Amelia duplicate
    for (const [email, lead] of supabaseMap) {
      merged.set(email, lead)
    }

    // Sort by daysSince DESC, cap at limit
    const leads: SegmentedLead[] = [...merged.values()]
      .sort((a, b) => b.daysSinceContact - a.daysSinceContact)
      .slice(0, limit)

    // Summary stats
    const summary = {
      total:    leads.length,
      ghost:    leads.filter(l => l.segment === 'ghost').length,
      nearMiss: leads.filter(l => l.segment === 'near-miss').length,
      fromAmelia:   leads.filter(l => l.source === 'amelia').length,
      fromSupabase: leads.filter(l => l.source === 'supabase').length,
      totalEstimatedValue: leads.reduce((s, l) => s + l.estimatedValue, 0),
      avgDaysSince: leads.length
        ? Math.round(leads.reduce((s, l) => s + l.daysSinceContact, 0) / leads.length)
        : 0,
    }

    return NextResponse.json({ leads, summary })
  } catch (error) {
    console.error('[GhostClients] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch ghost clients' }, { status: 500 })
  }
}
