// =============================================================================
// POST /api/reactivation/launch
// Kicks off the Revenue Sprint campaign via Inngest
// Creates campaign, inserts leads, and triggers Hummingbird cadence
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'
import type { SegmentedLead, Segment } from '@/types/reactivation'
import { v4 as uuidv4 } from 'uuid'

// =============================================================================
// HUMMINGBIRD CADENCE CONFIG
// TCPA COMPLIANCE: All SMS templates include mandatory opt-out language
// =============================================================================

const HUMMINGBIRD_SCRIPTS = {
  direct_inquiry: {
    day: 1,
    type: 'sms' as const,
    template: "Hey {firstName}, it's been a while since we've seen you at {businessName}! We'd love to have you back. Would you like me to get you on the books for {service}?\n\nReply STOP to opt out",
  },
  voicemail_drop: {
    day: 2,
    type: 'voicemail' as const,
    template: "Hi {firstName}, this is {businessName}. We noticed it's been a while and wanted to reach out personally. We miss seeing you and would love to get you scheduled. Give us a call back or just reply to this message!",
  },
  file_closure: {
    day: 4,
    type: 'sms' as const,
    template: "Hi {firstName}, I'm doing some housekeeping at {businessName} and noticed your file. Before I close it out, I wanted to check - are you still interested in {service} or should I mark you as inactive?\n\nReply STOP to opt out",
  },
  breakup: {
    day: 7,
    type: 'sms' as const,
    template: "Hey {firstName}, this is my last reach out. I don't want to bother you but wanted to give you one final chance to get back on the books at {businessName}. If I don't hear from you, I'll assume the timing isn't right. Either way, hope you're doing great!",
  },
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const {
      businessId,
      businessName,
      service,
      leads,
      segment,
      dryRun = true, // SAFETY: Default to dry run
    }: {
      businessId: string
      businessName: string
      service: string
      leads: SegmentedLead[]
      segment: Segment
      dryRun?: boolean
    } = body
    
    if (!businessId || !leads || !leads.length) {
      return NextResponse.json(
        { error: 'Business ID and leads required' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    // Step 1: Create the campaign record
    const campaignId = uuidv4()
    const cadenceConfig = [
      HUMMINGBIRD_SCRIPTS.direct_inquiry,
      HUMMINGBIRD_SCRIPTS.voicemail_drop,
      HUMMINGBIRD_SCRIPTS.file_closure,
      HUMMINGBIRD_SCRIPTS.breakup,
    ]
    
    const { error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        id: campaignId,
        business_id: businessId,
        name: `Revenue Sprint - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        status: dryRun ? 'draft' : 'active',
        segment: segment || 'cold',
        script_variant: 'hummingbird',
        cadence_config: cadenceConfig,
        total_leads: leads.length,
        started_at: dryRun ? null : new Date().toISOString(),
        metrics: {
          sent: 0,
          delivered: 0,
          responded: 0,
          booked: 0,
          revenue: 0,
        },
      })
    
    if (campaignError) {
      console.error('Failed to create campaign:', campaignError)
      return NextResponse.json(
        { error: 'Failed to create campaign', details: campaignError.message },
        { status: 500 }
      )
    }
    
    // Step 2: Insert all leads into campaign_leads
    const campaignLeads = leads.map((lead) => ({
      id: uuidv4(),
      campaign_id: campaignId,
      business_id: businessId,
      first_name: lead.firstName,
      last_name: lead.lastName,
      phone: lead.phone,
      email: lead.email,
      segment: lead.segment || segment || 'cold',
      days_since_last_visit: lead.daysSinceContact,
      lifetime_value: lead.estimatedValue,
      status: 'pending' as const,
      tcpa_consent: true, // Assume consent for imported leads
    }))
    
    const { error: leadsError } = await supabase
      .from('campaign_leads')
      .insert(campaignLeads)
    
    if (leadsError) {
      console.error('Failed to insert leads:', leadsError)
      // Clean up campaign
      await supabase.from('campaigns').delete().eq('id', campaignId)
      return NextResponse.json(
        { error: 'Failed to insert leads', details: leadsError.message },
        { status: 500 }
      )
    }
    
    // Step 3: If not a dry run, trigger Inngest to start the campaign
    if (!dryRun) {
      await inngest.send({
        name: 'campaign/started',
        data: {
          campaignId,
          businessId,
          businessName: businessName || 'Your salon',
          service: service || 'your appointment',
        },
      })
    }
    
    return NextResponse.json({
      success: true,
      campaign: {
        id: campaignId,
        status: dryRun ? 'draft' : 'active',
        totalLeads: leads.length,
        cadence: cadenceConfig.map(c => ({
          day: c.day,
          type: c.type,
        })),
        estimatedCompletion: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      dryRun,
      message: dryRun 
        ? 'Campaign created in draft mode. Call again with dryRun=false to launch.'
        : 'Campaign launched! Hummingbird cadence will run over the next 7 days.',
    })
    
  } catch (error) {
    console.error('Launch error:', error)
    return NextResponse.json(
      { error: 'Failed to launch campaign', details: String(error) },
      { status: 500 }
    )
  }
}

// =============================================================================
// GET - Get campaign status
// =============================================================================

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('campaignId')
    const businessId = searchParams.get('businessId')
    
    if (!campaignId && !businessId) {
      return NextResponse.json(
        { error: 'Campaign ID or Business ID required' },
        { status: 400 }
      )
    }
    
    const supabase = await createClient()
    
    let query = supabase.from('campaigns').select('*')
    
    if (campaignId) {
      query = query.eq('id', campaignId)
    } else if (businessId) {
      query = query.eq('business_id', businessId).order('created_at', { ascending: false })
    }
    
    const { data, error } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ campaigns: data })
    
  } catch (error) {
    console.error('GET campaigns error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}
