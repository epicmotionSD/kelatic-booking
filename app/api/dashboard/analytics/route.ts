import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { queryBluehost } from '@/lib/mysql/bluehost'

type RangeKey = '7d' | '30d' | '90d' | 'all'

type CampaignRow = {
  id: string
  name: string
  segment: string | null
  status: string | null
  created_at: string | null
  started_at: string | null
  total_leads: number | null
  sms_cost: number | null
  metrics: {
    sent?: number
    delivered?: number
    failed?: number
    responses?: number
    responded?: number
    positive_responses?: number
    negative_responses?: number
    opt_outs?: number
    bookings?: number
    booked?: number
    revenue?: number
  } | null
}

type CampaignLeadRow = {
  campaign_id: string
  segment: string | null
  status: string | null
  response_sentiment: string | null
  email: string | null
  phone: string | null
}

type CampaignMessageRow = {
  campaign_id: string
  direction: 'outbound' | 'inbound'
  status: string | null
  price: number | null
  created_at: string | null
}

type AmeliaBookingRow = {
  email: string | null
  phone: string | null
  bookingStart: string
  appointmentId: number
  bookingValue: number | null
}

type AttributedBooking = {
  campaignId: string
  segment: string
  bookingStart: string
  bookingValue: number
}

type TrendBucket = {
  month: string
  start: Date
  end: Date
}

const VALID_RANGES: RangeKey[] = ['7d', '30d', '90d', 'all']
const MS_PER_DAY = 24 * 60 * 60 * 1000
const ATTRIBUTION_WINDOW_DAYS = 45
const INVALID_BOOKING_STATUSES = ['canceled', 'rejected', 'no-show']

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const requestedRange = url.searchParams.get('range')
    const range = isRangeKey(requestedRange) ? requestedRange : '30d'

    const businessId = await getBusinessId(supabase, user.id)
    if (!businessId) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 })
    }

    const now = new Date()
    const rangeConfig = getRangeConfig(range, now)

    const [{ data: campaigns, error: campaignsError }, { data: leads, error: leadsError }, { data: messages, error: messagesError }] = await Promise.all([
      supabase
        .from('campaigns')
        .select('id, name, segment, status, created_at, started_at, total_leads, sms_cost, metrics')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false }),
      supabase
        .from('campaign_leads')
        .select('campaign_id, segment, status, response_sentiment, email, phone')
        .eq('business_id', businessId),
      supabase
        .from('campaign_messages')
        .select('campaign_id, direction, status, price, created_at')
        .eq('business_id', businessId),
    ])

    if (campaignsError) throw campaignsError
    if (leadsError) throw leadsError
    if (messagesError) throw messagesError

    const campaignRows = (campaigns || []) as CampaignRow[]
    const leadRows = (leads || []) as CampaignLeadRow[]
    const messageRows = (messages || []) as CampaignMessageRow[]

    const bookings = await fetchAttributedBookings(campaignRows, leadRows, rangeConfig.previousStart)

    const leadCountsByCampaign = new Map<string, number>()
    for (const lead of leadRows) {
      leadCountsByCampaign.set(lead.campaign_id, (leadCountsByCampaign.get(lead.campaign_id) || 0) + 1)
    }

    const bookingStatsByCampaign = buildBookingStatsByCampaign(bookings, rangeConfig)
    const messageStatsByCampaign = buildMessageStatsByCampaign(messageRows, rangeConfig)

    const campaignPeriodStats = campaignRows.map((campaign) => {
      const effectiveStart = new Date(campaign.started_at || campaign.created_at || now.toISOString())
      const currentBookings = bookingStatsByCampaign.current.get(campaign.id) || { revenue: 0, bookings: 0 }
      const previousBookings = bookingStatsByCampaign.previous.get(campaign.id) || { revenue: 0, bookings: 0 }
      const currentMessages = messageStatsByCampaign.current.get(campaign.id) || { sent: 0, responses: 0, cost: 0 }
      const previousMessages = messageStatsByCampaign.previous.get(campaign.id) || { sent: 0, responses: 0, cost: 0 }
      const leadCount = leadCountsByCampaign.get(campaign.id) || campaign.total_leads || 0
      const metricSnapshot = campaign.metrics || {}

      return {
        id: campaign.id,
        name: campaign.name,
        segment: normalizeSegment(campaign.segment),
        effectiveStart,
        totalLeads: leadCount,
        currentRevenue: currentBookings.revenue,
        previousRevenue: previousBookings.revenue,
        currentBookings: currentBookings.bookings,
        previousBookings: previousBookings.bookings,
        currentSent: currentMessages.sent,
        previousSent: previousMessages.sent,
        currentResponses: currentMessages.responses,
        previousResponses: previousMessages.responses,
        currentCost: currentMessages.cost,
        previousCost: previousMessages.cost,
        fallbackRevenue: numberOrZero(metricSnapshot.revenue),
        fallbackBookings: numberOrZero(metricSnapshot.bookings ?? metricSnapshot.booked),
      }
    })

    const campaignsInRange = campaignPeriodStats.filter((campaign) => {
      if (range === 'all') return true

      const launchedInRange = rangeConfig.currentStart
        ? isBetween(campaign.effectiveStart, rangeConfig.currentStart, rangeConfig.currentEnd)
        : false

      return (
        campaign.currentRevenue > 0 ||
        campaign.currentBookings > 0 ||
        campaign.currentSent > 0 ||
        campaign.currentResponses > 0 ||
        launchedInRange
      )
    })

    const currentRevenue = sumBy(campaignPeriodStats, (campaign) => campaign.currentRevenue)
    const previousRevenue = sumBy(campaignPeriodStats, (campaign) => campaign.previousRevenue)
    const currentBookingsCount = sumBy(campaignPeriodStats, (campaign) => campaign.currentBookings)
    const previousBookingsCount = sumBy(campaignPeriodStats, (campaign) => campaign.previousBookings)
    const currentSent = sumBy(campaignPeriodStats, (campaign) => campaign.currentSent)
    const currentResponses = sumBy(campaignPeriodStats, (campaign) => campaign.currentResponses)
    const currentCost = sumBy(campaignPeriodStats, (campaign) => campaign.currentCost)

    const responseRate = currentSent > 0 ? (currentResponses / currentSent) * 100 : 0
    const avgROI = currentCost > 0 ? ((currentRevenue - currentCost) / currentCost) * 100 : 0

    const monthlyTrend = rangeConfig.trendBuckets.map((bucket) => {
      const bucketRevenue = bookings.reduce((sum, booking) => {
        const bookingDate = new Date(booking.bookingStart)
        return isBetween(bookingDate, bucket.start, bucket.end) ? sum + booking.bookingValue : sum
      }, 0)

      const bucketBookings = bookings.reduce((sum, booking) => {
        const bookingDate = new Date(booking.bookingStart)
        return isBetween(bookingDate, bucket.start, bucket.end) ? sum + 1 : sum
      }, 0)

      const bucketCampaigns = campaignPeriodStats.reduce((sum, campaign) => {
        return isBetween(campaign.effectiveStart, bucket.start, bucket.end) ? sum + 1 : sum
      }, 0)

      return {
        month: bucket.month,
        revenue: roundMoney(bucketRevenue),
        bookings: bucketBookings,
        campaigns: bucketCampaigns,
      }
    })

    const segmentPerformanceMap = new Map<string, { leads: number; responses: number; bookings: number; revenue: number }>()
    for (const campaign of campaignsInRange) {
      const segment = campaign.segment
      const existing = segmentPerformanceMap.get(segment) || { leads: 0, responses: 0, bookings: 0, revenue: 0 }
      existing.leads += campaign.totalLeads
      existing.responses += campaign.currentResponses
      existing.bookings += campaign.currentBookings
      existing.revenue += campaign.currentRevenue
      segmentPerformanceMap.set(segment, existing)
    }

    const segmentOrder = ['ghost', 'near_miss', 'vip']
    const segmentPerformance = segmentOrder
      .filter((segment) => segmentPerformanceMap.has(segment))
      .map((segment) => {
        const stats = segmentPerformanceMap.get(segment) || { leads: 0, responses: 0, bookings: 0, revenue: 0 }
        return {
          segment: formatSegmentLabel(segment),
          leads: stats.leads,
          responses: stats.responses,
          bookings: stats.bookings,
          revenue: roundMoney(stats.revenue),
          conversionRate: stats.leads > 0 ? roundRate((stats.bookings / stats.leads) * 100) : 0,
        }
      })

    const topCampaigns = campaignsInRange
      .map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
        revenue: roundMoney(campaign.currentRevenue),
        bookings: campaign.currentBookings,
        roi: campaign.currentCost > 0
          ? roundRate(((campaign.currentRevenue - campaign.currentCost) / campaign.currentCost) * 100)
          : 0,
      }))
      .sort((left, right) => right.revenue - left.revenue)
      .slice(0, 5)

    return NextResponse.json({
      overview: {
        totalRevenue: roundMoney(currentRevenue),
        revenueChange: range === 'all' ? 0 : roundRate(percentChange(currentRevenue, previousRevenue)),
        totalBookings: currentBookingsCount,
        bookingsChange: range === 'all' ? 0 : roundRate(percentChange(currentBookingsCount, previousBookingsCount)),
        avgResponseRate: roundRate(responseRate),
        avgROI: roundRate(avgROI),
      },
      monthlyTrend,
      segmentPerformance,
      topCampaigns,
    })
  } catch (error) {
    console.error('Error fetching analytics dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

function isRangeKey(value: string | null): value is RangeKey {
  return value !== null && VALID_RANGES.includes(value as RangeKey)
}

async function getBusinessId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const [{ data: membership }, { data: profile }] = await Promise.all([
    supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('business_id')
      .eq('id', userId)
      .maybeSingle(),
  ])

  return membership?.business_id || profile?.business_id || null
}

function getRangeConfig(range: RangeKey, now: Date) {
  const currentEnd = now

  if (range === '7d') {
    const currentStart = addDays(startOfDay(now), -6)
    const previousStart = addDays(currentStart, -7)
    return {
      currentStart,
      currentEnd,
      previousStart,
      previousEnd: currentStart,
      trendBuckets: buildDailyBuckets(currentStart, 7),
    }
  }

  if (range === '30d') {
    const currentStart = addDays(startOfDay(now), -29)
    const previousStart = addDays(currentStart, -30)
    return {
      currentStart,
      currentEnd,
      previousStart,
      previousEnd: currentStart,
      trendBuckets: buildRollingBuckets(currentStart, 6, 5, 'short'),
    }
  }

  if (range === '90d') {
    const currentStart = addDays(startOfDay(now), -89)
    const previousStart = addDays(currentStart, -90)
    return {
      currentStart,
      currentEnd,
      previousStart,
      previousEnd: currentStart,
      trendBuckets: buildRollingBuckets(currentStart, 3, 30, 'month'),
    }
  }

  const recentStart = startOfMonth(addMonths(now, -5))
  return {
    currentStart: null,
    currentEnd,
    previousStart: null,
    previousEnd: null,
    trendBuckets: buildMonthlyBuckets(recentStart, 6),
  }
}

async function fetchAttributedBookings(
  campaigns: CampaignRow[],
  leads: CampaignLeadRow[],
  previousStart: Date | null,
): Promise<AttributedBooking[]> {
  const campaignLookup = new Map<string, { startedAt: Date; segment: string }>()
  for (const campaign of campaigns) {
    campaignLookup.set(campaign.id, {
      startedAt: new Date(campaign.started_at || campaign.created_at || new Date().toISOString()),
      segment: normalizeSegment(campaign.segment),
    })
  }

  const leadCampaignsByEmail = new Map<string, Array<{ campaignId: string; startedAt: Date; segment: string }>>()
  for (const lead of leads) {
    const email = normalizeEmail(lead.email)
    if (!email) continue

    const campaign = campaignLookup.get(lead.campaign_id)
    if (!campaign) continue

    const existing = leadCampaignsByEmail.get(email) || []
    existing.push({
      campaignId: lead.campaign_id,
      startedAt: campaign.startedAt,
      segment: campaign.segment,
    })
    leadCampaignsByEmail.set(email, existing)
  }

  for (const entries of leadCampaignsByEmail.values()) {
    entries.sort((left, right) => left.startedAt.getTime() - right.startedAt.getTime())
  }

  const emails = Array.from(leadCampaignsByEmail.keys())
  if (emails.length === 0) {
    return []
  }

  const minBookingDate = previousStart ? previousStart.toISOString().slice(0, 19).replace('T', ' ') : null
  const attributed: AttributedBooking[] = []

  for (const emailChunk of chunk(emails, 200)) {
    const placeholders = emailChunk.map(() => '?').join(', ')
    const params: Array<string> = [...emailChunk]
    const dateParams: Array<string> = []
    let dateClause = ''

    if (minBookingDate) {
      dateClause = ' AND a.bookingStart >= ?'
      dateParams.push(minBookingDate)
    }

    let rows: AmeliaBookingRow[] = []

    try {
      rows = await queryBluehost<AmeliaBookingRow>(`
        SELECT
          LOWER(TRIM(u.email)) AS email,
          u.phone AS phone,
          DATE_FORMAT(a.bookingStart, '%Y-%m-%dT%H:%i:%sZ') AS bookingStart,
          a.id AS appointmentId,
          COALESCE(NULLIF(cb.aggregatedPrice, 0), NULLIF(cb.price, 0), pts.price, s.price, 0) AS bookingValue
        FROM gzf_amelia_users u
        JOIN gzf_amelia_customer_bookings cb ON cb.customerId = u.id
        JOIN gzf_amelia_appointments a ON a.id = cb.appointmentId
        LEFT JOIN gzf_amelia_services s ON s.id = a.serviceId
        LEFT JOIN gzf_amelia_providers_to_services pts ON pts.serviceId = a.serviceId AND pts.userId = a.providerId
        WHERE u.type = 'customer'
          AND u.email IS NOT NULL
          AND u.email != ''
          AND LOWER(TRIM(u.email)) IN (${placeholders})
          AND cb.status NOT IN (${INVALID_BOOKING_STATUSES.map(() => '?').join(', ')})
          AND a.status NOT IN (${INVALID_BOOKING_STATUSES.map(() => '?').join(', ')})
          ${dateClause}
        ORDER BY a.bookingStart ASC
      `, [...params, ...INVALID_BOOKING_STATUSES, ...INVALID_BOOKING_STATUSES, ...dateParams])
    } catch (error) {
      console.error('Bluehost analytics booking query failed:', error)
      continue
    }

    for (const row of rows) {
      const email = normalizeEmail(row.email)
      if (!email) continue

      const campaignsForLead = leadCampaignsByEmail.get(email)
      if (!campaignsForLead || campaignsForLead.length === 0) continue

      const bookingDate = new Date(row.bookingStart)
      const bookingTimestamp = bookingDate.getTime()
      const attributedCampaign = [...campaignsForLead]
        .reverse()
        .find((campaign) => {
          const startTimestamp = campaign.startedAt.getTime()
          const attributionEnds = startTimestamp + ATTRIBUTION_WINDOW_DAYS * MS_PER_DAY
          return bookingTimestamp >= startTimestamp && bookingTimestamp <= attributionEnds
        })

      if (!attributedCampaign) continue

      attributed.push({
        campaignId: attributedCampaign.campaignId,
        segment: attributedCampaign.segment,
        bookingStart: row.bookingStart,
        bookingValue: numberOrZero(row.bookingValue),
      })
    }
  }

  return attributed
}

function buildBookingStatsByCampaign(bookings: AttributedBooking[], rangeConfig: ReturnType<typeof getRangeConfig>) {
  const current = new Map<string, { revenue: number; bookings: number }>()
  const previous = new Map<string, { revenue: number; bookings: number }>()

  for (const booking of bookings) {
    const bookingDate = new Date(booking.bookingStart)

    if (!rangeConfig.currentStart || isBetween(bookingDate, rangeConfig.currentStart, rangeConfig.currentEnd)) {
      const stats = current.get(booking.campaignId) || { revenue: 0, bookings: 0 }
      stats.revenue += booking.bookingValue
      stats.bookings += 1
      current.set(booking.campaignId, stats)
    }

    if (rangeConfig.previousStart && rangeConfig.previousEnd && isBetween(bookingDate, rangeConfig.previousStart, rangeConfig.previousEnd)) {
      const stats = previous.get(booking.campaignId) || { revenue: 0, bookings: 0 }
      stats.revenue += booking.bookingValue
      stats.bookings += 1
      previous.set(booking.campaignId, stats)
    }
  }

  return { current, previous }
}

function buildMessageStatsByCampaign(messages: CampaignMessageRow[], rangeConfig: ReturnType<typeof getRangeConfig>) {
  const current = new Map<string, { sent: number; responses: number; cost: number }>()
  const previous = new Map<string, { sent: number; responses: number; cost: number }>()

  for (const message of messages) {
    if (!message.created_at) continue

    const createdAt = new Date(message.created_at)
    const status = message.status || ''
    const isOutboundSent = message.direction === 'outbound' && ['queued', 'sent', 'delivered'].includes(status)
    const isInboundResponse = message.direction === 'inbound'

    if (!rangeConfig.currentStart || isBetween(createdAt, rangeConfig.currentStart, rangeConfig.currentEnd)) {
      const stats = current.get(message.campaign_id) || { sent: 0, responses: 0, cost: 0 }
      if (isOutboundSent) {
        stats.sent += 1
        stats.cost += numberOrZero(message.price)
      }
      if (isInboundResponse) {
        stats.responses += 1
      }
      current.set(message.campaign_id, stats)
    }

    if (rangeConfig.previousStart && rangeConfig.previousEnd && isBetween(createdAt, rangeConfig.previousStart, rangeConfig.previousEnd)) {
      const stats = previous.get(message.campaign_id) || { sent: 0, responses: 0, cost: 0 }
      if (isOutboundSent) {
        stats.sent += 1
        stats.cost += numberOrZero(message.price)
      }
      if (isInboundResponse) {
        stats.responses += 1
      }
      previous.set(message.campaign_id, stats)
    }
  }

  return { current, previous }
}

function buildDailyBuckets(start: Date, count: number): TrendBucket[] {
  return Array.from({ length: count }, (_, index) => {
    const bucketStart = addDays(start, index)
    const bucketEnd = addDays(bucketStart, 1)
    return {
      month: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(bucketStart),
      start: bucketStart,
      end: bucketEnd,
    }
  })
}

function buildRollingBuckets(start: Date, count: number, daysPerBucket: number, labelStyle: 'short' | 'month'): TrendBucket[] {
  return Array.from({ length: count }, (_, index) => {
    const bucketStart = addDays(start, index * daysPerBucket)
    const bucketEnd = addDays(bucketStart, daysPerBucket)
    return {
      month: labelStyle === 'month'
        ? new Intl.DateTimeFormat('en-US', { month: 'short' }).format(bucketStart)
        : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(bucketStart),
      start: bucketStart,
      end: bucketEnd,
    }
  })
}

function buildMonthlyBuckets(start: Date, count: number): TrendBucket[] {
  return Array.from({ length: count }, (_, index) => {
    const bucketStart = startOfMonth(addMonths(start, index))
    const bucketEnd = startOfMonth(addMonths(bucketStart, 1))
    return {
      month: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(bucketStart),
      start: bucketStart,
      end: bucketEnd,
    }
  })
}

function normalizeSegment(segment: string | null | undefined) {
  return (segment || 'ghost').replace('-', '_').toLowerCase()
}

function formatSegmentLabel(segment: string) {
  if (segment === 'near_miss') return 'Near-Miss'
  if (segment === 'vip') return 'VIP'
  return 'Ghost'
}

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() || ''
}

function numberOrZero(value: number | string | null | undefined) {
  return typeof value === 'number' ? value : Number(value || 0)
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100
}

function roundRate(value: number) {
  return Math.round(value * 10) / 10
}

function percentChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

function sumBy<T>(items: T[], selector: (item: T) => number) {
  return items.reduce((sum, item) => sum + selector(item), 0)
}

function isBetween(date: Date, start: Date, end: Date) {
  return date.getTime() >= start.getTime() && date.getTime() < end.getTime()
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addMonths(date: Date, months: number) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + months)
  return next
}

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function startOfMonth(date: Date) {
  const next = new Date(date)
  next.setDate(1)
  next.setHours(0, 0, 0, 0)
  return next
}