// =============================================================================
// TWILIO INBOUND SMS WEBHOOK
// Handles incoming SMS responses to campaigns
// POST /api/webhooks/twilio/inbound
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { inngest } from '@/lib/inngest/client'
import {
  isOptOutMessage,
  analyzeResponseSentiment,
  extractBookingIntent,
} from '@/lib/twilio/campaign-sms'

// Twilio sends form-urlencoded data
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    
    // Extract Twilio webhook fields
    const from = formData.get('From') as string
    const to = formData.get('To') as string
    const body = formData.get('Body') as string
    const messageSid = formData.get('MessageSid') as string
    // const accountSid = formData.get('AccountSid') as string
    
    if (!from || !to || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Step 1: Find the business by the "to" phone number
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name, owner_id')
      .eq('twilio_phone_number', to)
      .single()
    
    if (!business) {
      console.warn(`No business found for phone: ${to}`)
      // Still return 200 to acknowledge receipt
      return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
        headers: { 'Content-Type': 'text/xml' },
      })
    }
    
    // Step 2: Find the campaign lead by phone number
    const { data: campaignLead } = await supabase
      .from('campaign_leads')
      .select('id, campaign_id, first_name, last_name, status')
      .eq('business_id', business.id)
      .eq('phone', normalizePhone(from))
      .in('status', ['pending', 'in_progress', 'responded'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    // Step 3: Analyze the response
    const sentiment = analyzeResponseSentiment(body)
    const isOptOut = sentiment === 'opt_out'
    const bookingIntent = extractBookingIntent(body)
    const isHotLead = sentiment === 'positive' || bookingIntent !== null
    const normalizedBody = body.trim().toLowerCase()
    const autoReply = getAutoReply(normalizedBody)
    
    // Step 4: Record the inbound message
    const messageData = {
      campaign_id: campaignLead?.campaign_id || null,
      campaign_lead_id: campaignLead?.id || null,
      business_id: business.id,
      direction: 'inbound' as const,
      channel: 'sms' as const,
      to_phone: to,
      from_phone: from,
      body: body,
      status: 'received' as const,
      twilio_sid: messageSid,
      received_at: new Date().toISOString(),
      sentiment: sentiment,
      is_opt_out: isOptOut,
      is_booking_intent: isHotLead,
      extracted_datetime: bookingIntent,
    }
    
    const { error: messageError } = await supabase
      .from('campaign_messages')
      .insert(messageData)
      .select()
      .single()
    
    if (messageError) {
      console.error('Failed to save inbound message:', messageError)
    }
    
    // Step 5: Handle opt-out - TCPA COMPLIANCE CRITICAL
    if (isOptOut) {
      // Update campaign lead if exists
      if (campaignLead) {
        await supabase
          .from('campaign_leads')
          .update({
            status: 'opted_out',
            opted_out_at: new Date().toISOString(),
          })
          .eq('id', campaignLead.id)
      }
      
      // COMPLIANCE: Also update the master clients table to prevent future messages
      const normalizedPhone = normalizePhone(from)
      await supabase
        .from('clients')
        .update({
          sms_opt_out: true,
          sms_opt_out_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('phone', normalizedPhone)
        .eq('business_id', business.id)
      
      // Log opt-out for compliance audit trail
      console.log(`[COMPLIANCE] Opt-out processed: ${normalizedPhone} for business ${business.id}`)
      
      // Auto-reply confirming opt-out (required by TCPA)
      return new NextResponse(
        `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Message>You've been unsubscribed and won't receive any more messages from us.</Message>
        </Response>`,
        { headers: { 'Content-Type': 'text/xml' } }
      )
    }

    if (autoReply) {
      return new NextResponse(
        buildTwimlMessage(autoReply),
        { headers: { 'Content-Type': 'text/xml' } }
      )
    }
    
    // Step 6: If HOT LEAD, emit event for dashboard notification
    if (isHotLead && campaignLead) {
      await inngest.send({
        name: 'lead/hot',
        data: {
          campaignId: campaignLead.campaign_id,
          leadId: campaignLead.id,
          leadName: `${campaignLead.first_name || ''} ${campaignLead.last_name || ''}`.trim() || 'Unknown',
          phone: from,
          responseText: body,
          extractedIntent: bookingIntent || undefined,
        },
      })
      
      // Update lead status to responded
      await supabase
        .from('campaign_leads')
        .update({
          status: 'responded',
          has_responded: true,
          response_sentiment: sentiment,
          last_response_at: new Date().toISOString(),
          last_response_text: body,
        })
        .eq('id', campaignLead.id)
    }
    
    // Step 7: Log for non-campaign messages (could be general inquiries)
    if (!campaignLead) {
      console.log(`Non-campaign inbound from ${from}: "${body}"`)
      // TODO: Route to general inbox or Trinity AI
    }
    
    // Return empty TwiML (no auto-reply for positive responses - human should handle)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    )
    
  } catch (error) {
    console.error('Inbound webhook error:', error)
    // Always return 200 to Twilio to prevent retries
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { headers: { 'Content-Type': 'text/xml' } }
    )
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function normalizePhone(phone: string): string {
  // Remove +1 and all non-digits to match stored format
  return phone.replace(/^\+1/, '').replace(/\D/g, '')
}

function buildTwimlMessage(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${message}</Message>
</Response>`
}

function getAutoReply(normalizedBody: string): string | null {
  if (isPriceInquiry(normalizedBody)) {
    return 'The $75 Wednesday Special requires a $25 deposit to lock it in. Book here: https://kelatic.com/special-offers'
  }

  if (isIdentityInquiry(normalizedBody)) {
    return 'Kelatic VIP Concierge service. Book here: https://kelatic.com/special-offers'
  }

  return null
}

function isPriceInquiry(normalizedBody: string): boolean {
  const priceKeywords = [
    'price',
    'cost',
    'how much',
    'rates',
    'special',
    '$75',
    '75',
    '$25',
    '25',
    'deposit',
  ]

  return priceKeywords.some((keyword) => normalizedBody.includes(keyword))
}

function isIdentityInquiry(normalizedBody: string): boolean {
  const identityKeywords = [
    'who is this',
    'who are you',
    'who is this?',
    'who are you?',
    'who dis',
    'who this',
    'what is this',
    'kelatic',
  ]

  return identityKeywords.some((keyword) => normalizedBody.includes(keyword))
}
