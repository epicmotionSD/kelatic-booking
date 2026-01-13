// =============================================================================
// CAMPAIGNS LIST API
// /app/api/campaigns/route.ts
// Returns all campaigns for the authenticated business
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

    // Fetch all campaigns with lead counts
    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select(`
        id,
        name,
        status,
        segment,
        script_variant,
        cadence_config,
        total_leads,
        messages_sent,
        messages_delivered,
        responses_received,
        positive_responses,
        bookings_made,
        revenue_generated,
        started_at,
        completed_at,
        created_at,
        updated_at
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Get hot lead counts for each campaign
    const campaignIds = campaigns?.map(c => c.id) || []
    
    const { data: hotLeadCounts } = await supabase
      .from('campaign_leads')
      .select('campaign_id')
      .in('campaign_id', campaignIds)
      .eq('response_sentiment', 'positive')
      .neq('status', 'booked')

    // Count hot leads per campaign
    const hotLeadMap: Record<string, number> = {}
    hotLeadCounts?.forEach(hl => {
      hotLeadMap[hl.campaign_id] = (hotLeadMap[hl.campaign_id] || 0) + 1
    })

    // Format campaigns
    const formattedCampaigns = campaigns?.map(c => {
      // Calculate progress
      const cadence = c.cadence_config as { steps?: Array<{ day: number }> } | null
      const totalDays = cadence?.steps?.length 
        ? Math.max(...cadence.steps.map(s => s.day))
        : 7

      let currentDay = 0
      if (c.started_at) {
        const startDate = new Date(c.started_at)
        const now = new Date()
        currentDay = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        currentDay = Math.min(currentDay, totalDays)
      }

      const percentComplete = c.status === 'completed' 
        ? 100 
        : c.status === 'active' 
          ? Math.round((currentDay / totalDays) * 100)
          : 0

      return {
        id: c.id,
        name: c.name,
        status: c.status,
        segment: c.segment,
        totalLeads: c.total_leads || 0,
        metrics: {
          sent: c.messages_sent || 0,
          responses: c.responses_received || 0,
          bookings: c.bookings_made || 0,
          revenue: c.revenue_generated || 0,
        },
        progress: {
          currentDay,
          totalDays,
          percentComplete,
        },
        hotLeadCount: hotLeadMap[c.id] || 0,
        startedAt: c.started_at,
        createdAt: c.created_at,
      }
    }) || []

    // Calculate summary
    const summary = {
      total: formattedCampaigns.length,
      active: formattedCampaigns.filter(c => c.status === 'active').length,
      totalRevenue: formattedCampaigns.reduce((sum, c) => sum + c.metrics.revenue, 0),
      totalBookings: formattedCampaigns.reduce((sum, c) => sum + c.metrics.bookings, 0),
    }

    return NextResponse.json({
      campaigns: formattedCampaigns,
      summary,
    })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}
