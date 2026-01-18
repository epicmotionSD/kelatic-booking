import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/client'
import { EventWebhook } from '@sendgrid/eventwebhook'

function getAuthSecret(req: NextRequest) {
  const headerSecret = req.headers.get('x-webhook-secret')
  if (headerSecret) return headerSecret
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.replace('Bearer ', '')
  return null
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    const publicKey = process.env.SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY
    if (publicKey) {
      const signature = req.headers.get('x-twilio-email-event-webhook-signature')
      const timestamp = req.headers.get('x-twilio-email-event-webhook-timestamp')

      if (!signature || !timestamp) {
        return NextResponse.json({ error: 'Missing SendGrid signature headers' }, { status: 401 })
      }

      const eventWebhook = new EventWebhook()
      const isValid = eventWebhook.verifySignature({
        publicKey,
        payload: rawBody,
        signature,
        timestamp,
      })

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid SendGrid signature' }, { status: 401 })
      }
    } else {
      const expectedSecret = process.env.SENDGRID_EVENT_WEBHOOK_SECRET
      if (expectedSecret) {
        const provided = getAuthSecret(req)
        if (!provided || provided !== expectedSecret) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
      }
    }

    const events = JSON.parse(rawBody)
    if (!Array.isArray(events)) {
      return NextResponse.json({ error: 'Expected an array of events' }, { status: 400 })
    }

    const supabase = createAdminClient()

    for (const event of events) {
      const eventType = event?.event
      const timestamp = typeof event?.timestamp === 'number'
        ? new Date(event.timestamp * 1000).toISOString()
        : new Date().toISOString()

      const campaignMessageId = event?.custom_args?.campaign_message_id
      const sendgridMessageId = event?.sg_message_id || event?.smtp_id || null

      const update: Record<string, any> = {}

      if (sendgridMessageId) {
        update.sendgrid_message_id = sendgridMessageId
      }

      switch (eventType) {
        case 'delivered':
          update.status = 'delivered'
          update.delivered_at = timestamp
          break
        case 'open':
          update.opened_at = timestamp
          break
        case 'click':
          update.clicked_at = timestamp
          update.click_url = event?.url || null
          break
        case 'bounce':
        case 'dropped':
        case 'deferred':
        case 'blocked':
        case 'spamreport':
          update.status = 'failed'
          update.failed_at = timestamp
          update.error_message = event?.reason || event?.response || eventType
          break
        case 'unsubscribe':
        case 'group_unsubscribe':
          update.is_opt_out = true
          update.failed_at = timestamp
          break
        default:
          break
      }

      if (Object.keys(update).length === 0) {
        continue
      }

      let query = supabase.from('campaign_messages').update(update)

      if (campaignMessageId) {
        query = query.eq('id', campaignMessageId)
      } else if (sendgridMessageId) {
        query = query.or(`sendgrid_message_id.eq.${sendgridMessageId},twilio_sid.eq.${sendgridMessageId}`)
      } else {
        continue
      }

      const { error } = await query
      if (error) {
        console.error('SendGrid webhook update failed:', error)
      }
    }

    return NextResponse.json({ received: events.length })
  } catch (error) {
    return NextResponse.json({ error: 'Webhook processing failed', details: String(error) }, { status: 500 })
  }
}
