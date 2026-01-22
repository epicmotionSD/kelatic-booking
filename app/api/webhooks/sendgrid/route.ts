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

    const allowUnsigned = process.env.SENDGRID_EVENT_WEBHOOK_ALLOW_UNSIGNED === 'true'
    if (allowUnsigned) {
      const events = JSON.parse(rawBody)
      return NextResponse.json({ received: Array.isArray(events) ? events.length : 0 })
    }

    const publicKey = process.env.SENDGRID_EVENT_WEBHOOK_PUBLIC_KEY
    const expectedSecret = process.env.SENDGRID_EVENT_WEBHOOK_SECRET
    const signature = req.headers.get('x-twilio-email-event-webhook-signature')
    const timestamp = req.headers.get('x-twilio-email-event-webhook-timestamp')

    let authorized = false

    if (publicKey && signature && timestamp) {
      const eventWebhook = new EventWebhook()
      const isValid = eventWebhook.verifySignature(publicKey, rawBody, signature, timestamp)
      if (isValid) {
        authorized = true
      }
    }

    if (!authorized && expectedSecret) {
      const provided = getAuthSecret(req)
      if (provided && provided === expectedSecret) {
        authorized = true
      }
    }

    if (!authorized && (publicKey || expectedSecret)) {
      console.warn('SendGrid webhook unauthorized', {
        hasPublicKey: Boolean(publicKey),
        hasSecret: Boolean(expectedSecret),
        hasSignature: Boolean(signature),
        hasTimestamp: Boolean(timestamp),
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
      const rawMessageId = event?.sg_message_id || event?.smtp_id || null
      const normalizedMessageId = typeof rawMessageId === 'string'
        ? rawMessageId.split('.')[0]
        : null

      const update: Record<string, any> = {}

      if (rawMessageId) {
        update.sendgrid_message_id = rawMessageId
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
      } else if (rawMessageId || normalizedMessageId) {
        const orParts = [] as string[]
        if (rawMessageId) {
          orParts.push(`sendgrid_message_id.eq.${rawMessageId}`)
          orParts.push(`twilio_sid.eq.${rawMessageId}`)
        }
        if (normalizedMessageId && normalizedMessageId !== rawMessageId) {
          orParts.push(`sendgrid_message_id.eq.${normalizedMessageId}`)
          orParts.push(`twilio_sid.eq.${normalizedMessageId}`)
        }
        if (orParts.length) {
          query = query.or(orParts.join(','))
        }
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
