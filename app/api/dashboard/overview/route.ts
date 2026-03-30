// =============================================================================
// DASHBOARD OVERVIEW API
// /app/api/dashboard/overview/route.ts
// Returns aggregated metrics for the dashboard overview page
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type CampaignMetrics = {
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
}

type CampaignRow = {
  id: string
  name: string
  status: string
  created_at: string
  started_at: string | null
  cadence_config: unknown
  metrics: CampaignMetrics | null
}

type HotLeadRow = {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  last_response_text: string | null
  last_response_at: string | null
  campaigns: { name: string }[] | { name: string } | null
}

type RecentMessageRow = {
  id: string
  direction: 'inbound' | 'outbound'
  status: string
  sentiment: string | null
  created_at: string
  campaign_leads: { first_name?: string | null; last_name?: string | null }[] | { first_name?: string | null; last_name?: string | null } | null
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user's business
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const businessId = await getBusinessId(supabase, user.id)

    if (!businessId) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 })
    }
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Fetch campaigns for metrics
    const { data: allCampaigns } = await supabase
      .from('campaigns')
      .select('id, name, status, created_at, started_at, cadence_config, metrics')
      .eq('business_id', businessId)

    const campaigns = (allCampaigns || []) as CampaignRow[]

    // Current period (last 30 days)
    const currentPeriodCampaigns = campaigns.filter(c => 
      new Date(c.created_at) >= thirtyDaysAgo
    )

    // Previous period (30-60 days ago)
    const previousPeriodCampaigns = campaigns.filter(c => 
      new Date(c.created_at) >= sixtyDaysAgo && 
      new Date(c.created_at) < thirtyDaysAgo
    )

    // Calculate metrics
    const currentRevenue = currentPeriodCampaigns.reduce((sum, c) => sum + numberOrZero(c.metrics?.revenue), 0)
    const previousRevenue = previousPeriodCampaigns.reduce((sum, c) => sum + numberOrZero(c.metrics?.revenue), 0)
    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : currentRevenue > 0 ? 100 : 0

    const currentBookings = currentPeriodCampaigns.reduce((sum, c) => sum + numberOrZero(c.metrics?.bookings ?? c.metrics?.booked), 0)
    const previousBookings = previousPeriodCampaigns.reduce((sum, c) => sum + numberOrZero(c.metrics?.bookings ?? c.metrics?.booked), 0)
    const bookingsChange = previousBookings > 0 
      ? ((currentBookings - previousBookings) / previousBookings) * 100 
      : currentBookings > 0 ? 100 : 0

    // Get active leads count
    const { count: activeLeads } = await supabase
      .from('campaign_leads')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .in('status', ['pending', 'in_progress', 'responded'])

    // Calculate response rate
    const totalSent = campaigns.reduce((sum, c) => sum + numberOrZero(c.metrics?.sent), 0)
    const totalResponses = campaigns.reduce((sum, c) => sum + numberOrZero(c.metrics?.responses ?? c.metrics?.responded), 0)
    const responseRate = totalSent > 0 ? (totalResponses / totalSent) * 100 : 0

    // Get active campaigns
    const { data: activeCampaigns } = await supabase
      .from('campaigns')
      .select('id, name, status, started_at, cadence_config, metrics')
      .eq('business_id', businessId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(5)

    const activeCampaignRows = (activeCampaigns || []) as CampaignRow[]

    // Get hot lead counts per campaign
    const activeCampaignIds = activeCampaignRows.map(c => c.id)
    const { data: hotLeadCounts } = await supabase
      .from('campaign_leads')
      .select('campaign_id')
      .in('campaign_id', activeCampaignIds)
      .eq('response_sentiment', 'positive')
      .neq('status', 'booked')

    const hotLeadMap: Record<string, number> = {}
    hotLeadCounts?.forEach(hl => {
      hotLeadMap[hl.campaign_id] = (hotLeadMap[hl.campaign_id] || 0) + 1
    })

    // Format active campaigns
    const formattedActiveCampaigns = activeCampaignRows.map(c => {
      const totalDays = getCadenceTotalDays(c.cadence_config)

      let currentDay = 0
      if (c.started_at) {
        const startDate = new Date(c.started_at)
        currentDay = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        currentDay = Math.min(currentDay, totalDays)
      }

      const progress = Math.round((currentDay / totalDays) * 100)

      return {
        id: c.id,
        name: c.name,
        progress,
        hotLeads: hotLeadMap[c.id] || 0,
        status: c.status,
      }
    })

    // Get hot leads (positive responses not yet booked)
    const { data: hotLeads } = await supabase
      .from('campaign_leads')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        last_response_text,
        last_response_at,
        campaign_id,
        campaigns(name)
      `)
      .eq('business_id', businessId)
      .eq('response_sentiment', 'positive')
      .neq('status', 'booked')
      .order('last_response_at', { ascending: false })
      .limit(5)

    const hotLeadRows = (hotLeads || []) as HotLeadRow[]

    const formattedHotLeads = hotLeadRows.map(lead => {
      const campaign = normalizeCampaign(lead.campaigns)
      const name = `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
      return {
        id: lead.id,
        name: name || 'Unknown',
        phone: formatPhone(lead.phone),
        response: lead.last_response_text || '',
        campaignName: campaign?.name || 'Unknown Campaign',
        respondedAt: formatTimeAgo(lead.last_response_at),
      }
    })

    // Get recent activity from campaign_messages
    const { data: recentMessages } = await supabase
      .from('campaign_messages')
      .select(`
        id,
        direction,
        status,
        sentiment,
        created_at,
        campaign_leads(first_name, last_name)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(10)

    const recentMessageRows = (recentMessages || []) as RecentMessageRow[]

    const recentActivity = recentMessageRows.map(msg => {
      const campaignLead = normalizeCampaignLead(msg.campaign_leads)
      const clientName = `${campaignLead?.first_name || ''} ${campaignLead?.last_name || ''}`.trim() || 'Unknown'
      
      let type: 'booking' | 'response' | 'opt_out' | 'campaign_started' = 'response'
      let message = ''

      if (msg.direction === 'inbound') {
        if (msg.sentiment === 'positive') {
          type = 'response'
          message = `Positive response from ${clientName}`
        } else if (msg.sentiment === 'negative') {
          type = 'opt_out'
          message = `${clientName} opted out`
        } else {
          type = 'response'
          message = `New response from ${clientName}`
        }
      } else {
        message = `Message sent to ${clientName}`
      }

      return {
        id: msg.id,
        type,
        message,
        timestamp: formatTimeAgo(msg.created_at),
      }
    })

    return NextResponse.json({
      metrics: {
        totalRevenue: campaigns.reduce((sum, c) => sum + numberOrZero(c.metrics?.revenue), 0),
        revenueChange: Math.round(revenueChange * 10) / 10,
        totalBookings: campaigns.reduce((sum, c) => sum + numberOrZero(c.metrics?.bookings ?? c.metrics?.booked), 0),
        bookingsChange: Math.round(bookingsChange * 10) / 10,
        activeLeads: activeLeads || 0,
        leadsChange: 0, // TODO: Calculate lead change
        responseRate: Math.round(responseRate * 10) / 10,
        responseRateChange: 0, // TODO: Calculate rate change
      },
      activeCampaigns: formattedActiveCampaigns,
      hotLeads: formattedHotLeads,
      recentActivity,
    })
  } catch (error) {
    console.error('Error fetching dashboard overview:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
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

function getCadenceTotalDays(cadenceConfig: unknown) {
  if (Array.isArray(cadenceConfig) && cadenceConfig.length > 0) {
    return Math.max(...cadenceConfig.map((step) => Number((step as { day?: number }).day || 0)), 7)
  }

  const cadence = cadenceConfig as { steps?: Array<{ day?: number }> } | null
  if (cadence?.steps?.length) {
    return Math.max(...cadence.steps.map((step) => Number(step.day || 0)), 7)
  }

  return 7
}

function normalizeCampaign(campaigns: HotLeadRow['campaigns']) {
  if (Array.isArray(campaigns)) {
    return campaigns[0] || null
  }

  return campaigns
}

function normalizeCampaignLead(campaignLead: RecentMessageRow['campaign_leads']) {
  if (Array.isArray(campaignLead)) {
    return campaignLead[0] || null
  }

  return campaignLead
}

function numberOrZero(value: number | null | undefined) {
  return typeof value === 'number' ? value : 0
}

function formatPhone(phone: string | null): string {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  return phone
}

function formatTimeAgo(dateString: string | null): string {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  
  return date.toLocaleDateString()
}
