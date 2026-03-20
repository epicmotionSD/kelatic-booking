// =============================================================================
// GET /api/reactivation/ghost-clients
// Queries Bluehost Amelia MySQL to find clients who haven't visited in 45+ days
// Returns SegmentedLead[] ready to feed directly into /api/reactivation/launch
//
// Segmentation:
//   ghost     → last visit > 90 days ago  (cold, hardest to reactivate)
//   near-miss → last visit 45–90 days ago (warm, highest conversion rate)
//
// Usage:
//   GET /api/reactivation/ghost-clients              → all 45+ days
//   GET /api/reactivation/ghost-clients?minDays=60   → 60+ days only
//   GET /api/reactivation/ghost-clients?segment=ghost → 90+ days only
//   GET /api/reactivation/ghost-clients?limit=100
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { queryBluehost } from '@/lib/mysql/bluehost'
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
  // Repeat clients weighted slightly higher
  const base = 135
  const loyaltyBonus = Math.min(totalVisits * 5, 40)
  return base + loyaltyBonus
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const minDays  = Number(searchParams.get('minDays') || '45')
    const maxDays  = Number(searchParams.get('maxDays') || '99999')
    const segment  = searchParams.get('segment') as Segment | null
    const limit    = Math.min(Number(searchParams.get('limit') || '500'), 1000)

    // Resolve minDays from segment filter shorthand
    const effectiveMinDays = segment === 'ghost' ? Math.max(minDays, 90)
      : segment === 'near-miss' ? minDays
      : minDays

    const effectiveMaxDays = segment === 'near-miss' ? Math.min(maxDays, 89)
      : maxDays

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

    const leads: SegmentedLead[] = rows.map((row) => {
      const seg   = segmentFromDays(row.daysSince)
      const risk  = riskFromDays(row.daysSince, row.totalVisits)
      const value = estimateValue(row.totalVisits)

      return {
        id: `amelia_${row.userId}`,
        firstName: row.firstName,
        lastName:  row.lastName,
        email:     row.email,
        phone:     cleanPhone(row.phone),
        source:    'amelia',
        firstContact: row.firstVisit,
        lastContact:  row.lastVisit,
        segment:   seg,
        riskProfile:  risk,
        estimatedValue: value,
        daysSinceContact: row.daysSince,
        recommendedScript: scriptFromSegment(seg),
      }
    })

    // Summary stats
    const summary = {
      total:    leads.length,
      ghost:    leads.filter(l => l.segment === 'ghost').length,
      nearMiss: leads.filter(l => l.segment === 'near-miss').length,
      totalEstimatedValue: leads.reduce((s, l) => s + l.estimatedValue, 0),
      avgDaysSince: leads.length
        ? Math.round(leads.reduce((s, l) => s + l.daysSinceContact, 0) / leads.length)
        : 0,
    }

    return NextResponse.json({ leads, summary })
  } catch (error) {
    console.error('[GhostClients] MySQL error:', error)
    return NextResponse.json({ error: 'Failed to fetch ghost clients' }, { status: 500 })
  }
}
