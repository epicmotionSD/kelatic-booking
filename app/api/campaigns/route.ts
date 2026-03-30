// =============================================================================
// CAMPAIGNS LIST API
// /app/api/campaigns/route.ts
// Returns all campaigns for the authenticated business
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canCreateCampaign } from '@/lib/usage/enforcement'

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
        metrics,
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
      const totalDays = getCadenceTotalDays(c.cadence_config)
      const metrics = (c.metrics || {}) as CampaignMetrics

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
          sent: numberOrZero(metrics.sent),
          responses: numberOrZero(metrics.responses ?? metrics.responded),
          bookings: numberOrZero(metrics.bookings ?? metrics.booked),
          revenue: numberOrZero(metrics.revenue),
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

function numberOrZero(value: number | null | undefined) {
  return typeof value === 'number' ? value : 0
}

// =============================================================================
// CREATE CAMPAIGN
// =============================================================================
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user's business
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get business ID
    const { data: member } = await supabase
      .from('business_members')
      .select('business_id')
      .eq('user_id', user.id)
      .single()

    if (!member?.business_id) {
      return NextResponse.json({ error: 'No business found' }, { status: 404 })
    }

    const businessId = member.business_id

    // CHECK USAGE LIMITS BEFORE CREATING
    const usageCheck = await canCreateCampaign(businessId)

    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: usageCheck.reason,
          current: usageCheck.current,
          limit: usageCheck.limit,
          upgradeRequired: true,
        },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      name,
      description,
      segment,
      script_variant,
      script_template,
      total_leads,
      daily_send_limit,
    } = body

    // Validate required fields
    if (!name || !segment || !script_template) {
      return NextResponse.json(
        { error: 'Missing required fields: name, segment, script_template' },
        { status: 400 }
      )
    }

    // Create campaign
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert([
        {
          business_id: businessId,
          name,
          description,
          segment,
          script_variant: script_variant || 'direct_inquiry',
          script_template,
          total_leads: total_leads || 0,
          daily_send_limit: daily_send_limit || 100,
          status: 'draft',
          created_by: user.id,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
