// =============================================================================
// HOT LEADS API
// /app/api/hot-leads/route.ts
// Returns all positive responses (hot leads) across all campaigns
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type HotLeadRow = {
  id: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  email: string | null
  status: string
  response_sentiment: string | null
  last_response_text: string | null
  last_response_at: string | null
  campaign_id: string
  created_at: string
  campaigns: { id: string; name: string }[] | { id: string; name: string } | null
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

    // Get all hot leads (positive sentiment, not yet booked)
    const { data: hotLeads, error } = await supabase
      .from('campaign_leads')
      .select(`
        id,
        first_name,
        last_name,
        phone,
        email,
        status,
        response_sentiment,
        last_response_text,
        last_response_at,
        campaign_id,
        created_at,
        campaigns(id, name)
      `)
      .eq('business_id', businessId)
      .eq('response_sentiment', 'positive')
      .order('last_response_at', { ascending: false })

    if (error) throw error

    const rows = (hotLeads || []) as HotLeadRow[]

    // Calculate stats
    const stats = {
      total: rows.length,
      needToCall: rows.filter((lead) => lead.status === 'responded').length,
      contacted: rows.filter((lead) => lead.status === 'in_progress').length,
      booked: rows.filter((lead) => lead.status === 'booked').length,
    }

    // Format leads
    const formattedLeads = rows.map((lead) => {
      const campaigns = normalizeCampaignRelation(lead.campaigns)
      const fullName = `${lead.first_name || ''} ${lead.last_name || ''}`.trim()

      return {
        id: lead.id,
        name: fullName || 'Unknown',
        phone: formatPhone(lead.phone),
        rawPhone: lead.phone,
        email: lead.email,
        status: lead.status,
        response: lead.last_response_text || '',
        respondedAt: lead.last_response_at,
        respondedAtFormatted: formatTimeAgo(lead.last_response_at),
        contactedAt: lead.status === 'in_progress' ? lead.last_response_at : null,
        bookedAt: lead.status === 'booked' ? lead.last_response_at : null,
        campaignId: lead.campaign_id,
        campaignName: campaigns?.name || 'Unknown',
        // Extract booking intent from response
        bookingIntent: extractBookingIntent(lead.last_response_text || ''),
      }
    })

    return NextResponse.json({
      leads: formattedLeads,
      stats,
    })
  } catch (error) {
    console.error('Error fetching hot leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch hot leads' },
      { status: 500 }
    )
  }
}

// Update lead status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user's business
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { leadId, status } = body

    if (!leadId || !status) {
      return NextResponse.json({ error: 'leadId and status required' }, { status: 400 })
    }

    if (!['in_progress', 'booked', 'completed', 'responded'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Build update object
    const updateData: Record<string, unknown> = { status }

    if (status === 'booked') {
      updateData.converted_to_booking = true
    }

    const { data, error } = await supabase
      .from('campaign_leads')
      .update(updateData)
      .eq('id', leadId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, lead: data })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Failed to update lead' },
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

function normalizeCampaignRelation(campaigns: HotLeadRow['campaigns']) {
  if (Array.isArray(campaigns)) {
    return campaigns[0] || null
  }

  return campaigns
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
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

function extractBookingIntent(response: string): string | null {
  const lower = response.toLowerCase()
  
  // Look for day mentions
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const foundDay = days.find(day => lower.includes(day))
  if (foundDay) {
    return `Mentioned ${foundDay}`
  }

  // Look for time mentions
  const timeMatch = lower.match(/(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)/i)
  if (timeMatch) {
    return `Mentioned ${timeMatch[0]}`
  }

  // Look for "tomorrow", "today", "next week"
  if (lower.includes('tomorrow')) return 'Wants tomorrow'
  if (lower.includes('today')) return 'Wants today'
  if (lower.includes('next week')) return 'Wants next week'
  if (lower.includes('this week')) return 'Wants this week'

  // Generic positive intent
  if (lower.includes('yes') || lower.includes('sure') || lower.includes('ok')) {
    return 'Ready to book'
  }

  return null
}
