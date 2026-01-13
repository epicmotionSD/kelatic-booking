// =============================================================================
// CAMPAIGN DASHBOARD API
// GET /api/campaigns/[campaignId]
// Returns campaign details, metrics, and recent activity
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const supabase = await createClient()
    const { campaignId } = await params
    
    // Get campaign with aggregated data
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select(`
        *,
        businesses (
          id,
          name
        )
      `)
      .eq('id', campaignId)
      .single()
    
    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }
    
    // Get lead stats by status
    const { data: leadStats } = await supabase
      .from('campaign_leads')
      .select('status, response_sentiment')
      .eq('campaign_id', campaignId)
    
    const leadCounts = {
      total: leadStats?.length || 0,
      pending: leadStats?.filter(l => l.status === 'pending').length || 0,
      inProgress: leadStats?.filter(l => l.status === 'in_progress').length || 0,
      responded: leadStats?.filter(l => l.status === 'responded').length || 0,
      booked: leadStats?.filter(l => l.status === 'booked').length || 0,
      optedOut: leadStats?.filter(l => l.status === 'opted_out').length || 0,
      completed: leadStats?.filter(l => l.status === 'completed').length || 0,
      positive: leadStats?.filter(l => l.response_sentiment === 'positive').length || 0,
      negative: leadStats?.filter(l => l.response_sentiment === 'negative').length || 0,
    }
    
    // Get recent messages (last 20)
    const { data: recentMessages } = await supabase
      .from('campaign_messages')
      .select(`
        id,
        direction,
        body,
        status,
        sentiment,
        is_booking_intent,
        created_at,
        campaign_leads (
          first_name,
          last_name,
          phone
        )
      `)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .limit(20)
    
    // Get hot leads (positive responses)
    const { data: hotLeads } = await supabase
      .from('campaign_leads')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        last_response_at,
        last_response_text,
        campaign_messages (
          extracted_datetime
        )
      `)
      .eq('campaign_id', campaignId)
      .eq('response_sentiment', 'positive')
      .order('last_response_at', { ascending: false })
      .limit(10)
    
    // Calculate progress
    const cadenceConfig = campaign.cadence_config as Array<{ day: number }> | null
    const totalDays = cadenceConfig ? Math.max(...cadenceConfig.map(c => c.day)) : 7
    const currentDay = campaign.current_day || 0
    const progress = {
      currentDay,
      totalDays,
      percentComplete: Math.round((currentDay / totalDays) * 100),
      estimatedCompletion: campaign.started_at
        ? new Date(new Date(campaign.started_at).getTime() + totalDays * 24 * 60 * 60 * 1000).toISOString()
        : null,
    }
    
    // Calculate ROI
    const metrics = campaign.metrics as { revenue?: number } | null
    const revenue = metrics?.revenue || 0
    const cost = campaign.sms_cost || 0
    const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0
    
    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        segment: campaign.segment,
        scriptVariant: campaign.script_variant,
        startedAt: campaign.started_at,
        completedAt: campaign.completed_at,
        business: campaign.businesses,
      },
      metrics: {
        ...(metrics || {}),
        smsCost: campaign.sms_cost,
        roi: Math.round(roi),
      },
      leads: leadCounts,
      progress,
      hotLeads: hotLeads?.map(lead => ({
        id: lead.id,
        name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unknown',
        phone: lead.phone,
        respondedAt: lead.last_response_at,
        response: lead.last_response_text,
        extractedIntent: lead.campaign_messages?.[0]?.extracted_datetime,
      })) || [],
      recentActivity: recentMessages?.map(msg => {
        const leadData = msg.campaign_leads as { first_name?: string; last_name?: string } | null
        return {
          id: msg.id,
          direction: msg.direction,
          body: msg.body.substring(0, 100) + (msg.body.length > 100 ? '...' : ''),
          status: msg.status,
          sentiment: msg.sentiment,
          isHot: msg.is_booking_intent,
          leadName: leadData
            ? `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim()
            : 'Unknown',
          timestamp: msg.created_at,
        }
      }) || [],
    })
    
  } catch (error) {
    console.error('Campaign dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign data' },
      { status: 500 }
    )
  }
}

// =============================================================================
// PATCH - Update campaign (pause/resume/cancel)
// =============================================================================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const supabase = await createClient()
    const { campaignId } = await params
    const body = await req.json()
    
    const { action } = body as { action: 'pause' | 'resume' | 'cancel' }
    
    const updates: Record<string, unknown> = {}
    
    switch (action) {
      case 'pause':
        updates.status = 'paused'
        updates.paused_at = new Date().toISOString()
        break
      case 'resume':
        updates.status = 'active'
        updates.paused_at = null
        break
      case 'cancel':
        updates.status = 'cancelled'
        updates.completed_at = new Date().toISOString()
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('campaigns')
      .update(updates)
      .eq('id', campaignId)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, action })
    
  } catch (error) {
    console.error('Campaign update error:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}
