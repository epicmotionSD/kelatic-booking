// =============================================================================
// TWILIO STATUS CALLBACK WEBHOOK
// Updates message delivery status (delivered, failed, etc.)
// POST /api/webhooks/twilio/status
// =============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    
    // Extract Twilio status callback fields
    const messageSid = formData.get('MessageSid') as string
    const messageStatus = formData.get('MessageStatus') as string
    const errorCode = formData.get('ErrorCode') as string | null
    const errorMessage = formData.get('ErrorMessage') as string | null
    const price = formData.get('Price') as string | null
    const priceUnit = formData.get('PriceUnit') as string | null
    
    if (!messageSid || !messageStatus) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Map Twilio status to our status enum
    const statusMap: Record<string, string> = {
      'queued': 'queued',
      'sending': 'sent',
      'sent': 'sent',
      'delivered': 'delivered',
      'undelivered': 'undelivered',
      'failed': 'failed',
    }
    
    const mappedStatus = statusMap[messageStatus] || 'failed'
    
    // Update the message record
    const updateData: Record<string, unknown> = {
      status: mappedStatus,
      twilio_status: messageStatus,
    }
    
    // Add timing fields based on status
    if (messageStatus === 'delivered') {
      updateData.delivered_at = new Date().toISOString()
    } else if (messageStatus === 'failed' || messageStatus === 'undelivered') {
      updateData.failed_at = new Date().toISOString()
      if (errorCode) updateData.error_code = errorCode
      if (errorMessage) updateData.error_message = errorMessage
    }
    
    // Add price if provided
    if (price) {
      updateData.price = Math.abs(parseFloat(price)) // Twilio sends negative values
      updateData.price_unit = priceUnit || 'USD'
    }
    
    const { error } = await supabase
      .from('campaign_messages')
      .update(updateData)
      .eq('twilio_sid', messageSid)
    
    if (error) {
      console.error('Failed to update message status:', error)
      // Still return 200 to acknowledge
    }
    
    return NextResponse.json({ received: true })
    
  } catch (error) {
    console.error('Status webhook error:', error)
    return NextResponse.json({ received: true }) // Always 200 for Twilio
  }
}
