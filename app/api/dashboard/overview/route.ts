// =============================================================================
// DASHBOARD OVERVIEW API
// /app/api/dashboard/overview/route.ts
// Returns aggregated metrics for the dashboard overview page
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user's business
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get business ID from user metadata or profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('business_id')
      .eq('id', user.id)
      .single()

    if (!profile?.business_id) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 })
    }

    const businessId = profile.business_id
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

    // Fetch campaigns for metrics
    const { data: allCampaigns } = await supabase
      .from('campaigns')
      .select('*')
      .eq('business_id', businessId)

    // Current period (last 30 days)
    const currentPeriodCampaigns = allCampaigns?.filter(c => 
      new Date(c.created_at) >= thirtyDaysAgo
    ) || []

    // Previous period (30-60 days ago)
    const previousPeriodCampaigns = allCampaigns?.filter(c => 
      new Date(c.created_at) >= sixtyDaysAgo && 
      new Date(c.created_at) < thirtyDaysAgo
    ) || []

    // Calculate metrics
    const currentRevenue = currentPeriodCampaigns.reduce((sum, c) => sum + (c.revenue_generated || 0), 0)
    const previousRevenue = previousPeriodCampaigns.reduce((sum, c) => sum + (c.revenue_generated || 0), 0)
    const revenueChange = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100 
      : currentRevenue > 0 ? 100 : 0

    const currentBookings = currentPeriodCampaigns.reduce((sum, c) => sum + (c.bookings_made || 0), 0)
    const previousBookings = previousPeriodCampaigns.reduce((sum, c) => sum + (c.bookings_made || 0), 0)
    const bookingsChange = previousBookings > 0 
      ? ((currentBookings - previousBookings) / previousBookings) * 100 
      : currentBookings > 0 ? 100 : 0

    // Get active leads count
    const { count: activeLeads } = await supabase
      .from('campaign_leads')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId)
      .in('status', ['pending', 'contacted', 'responded'])

    // Calculate response rate
    const totalSent = allCampaigns?.reduce((sum, c) => sum + (c.messages_sent || 0), 0) || 0
    const totalResponses = allCampaigns?.reduce((sum, c) => sum + (c.responses_received || 0), 0) || 0
    const responseRate = totalSent > 0 ? (totalResponses / totalSent) * 100 : 0

    // Get active campaigns
    const { data: activeCampaigns } = await supabase
      .from('campaigns')
      .select('id, name, status, started_at, cadence_config, positive_responses')
      .eq('business_id', businessId)
      .eq('status', 'active')
      .order('started_at', { ascending: false })
      .limit(5)

    // Get hot lead counts per campaign
    const activeCampaignIds = activeCampaigns?.map(c => c.id) || []
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
    const formattedActiveCampaigns = activeCampaigns?.map(c => {
      const cadence = c.cadence_config as { steps?: Array<{ day: number }> } | null
      const totalDays = cadence?.steps?.length 
        ? Math.max(...cadence.steps.map(s => s.day))
        : 7

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
    }) || []

    // Get hot leads (positive responses not yet booked)
    const { data: hotLeads } = await supabase
      .from('campaign_leads')
      .select(`
        id,
        client_name,
        client_phone,
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

    const formattedHotLeads = hotLeads?.map(lead => {
      const campaigns = lead.campaigns as { name: string }[] | null
      return {
        id: lead.id,
        name: lead.client_name || 'Unknown',
        phone: formatPhone(lead.client_phone),
        response: lead.last_response_text || '',
        campaignName: campaigns?.[0]?.name || 'Unknown Campaign',
        respondedAt: formatTimeAgo(lead.last_response_at),
      }
    }) || []

    // Get recent activity from campaign_messages
    const { data: recentMessages } = await supabase
      .from('campaign_messages')
      .select(`
        id,
        direction,
        status,
        sentiment,
        created_at,
        campaign_leads(client_name)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(10)

    const recentActivity = recentMessages?.map(msg => {
      const campaignLeads = msg.campaign_leads as { client_name: string }[] | null
      const clientName = campaignLeads?.[0]?.client_name || 'Unknown'
      
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
    }) || []

    return NextResponse.json({
      metrics: {
        totalRevenue: allCampaigns?.reduce((sum, c) => sum + (c.revenue_generated || 0), 0) || 0,
        revenueChange: Math.round(revenueChange * 10) / 10,
        totalBookings: allCampaigns?.reduce((sum, c) => sum + (c.bookings_made || 0), 0) || 0,
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
