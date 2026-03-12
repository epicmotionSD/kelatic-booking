import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/client'

function getAuthSecret(req: NextRequest) {
  const headerSecret = req.headers.get('x-webhook-secret')
  if (headerSecret) return headerSecret
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.replace('Bearer ', '')
  const fromQuery = req.nextUrl.searchParams.get('secret')
  if (fromQuery) return fromQuery
  return null
}

function parseMailchimpEvents(rawBody: string): any[] {
  try {
    const parsed = JSON.parse(rawBody)
    if (Array.isArray(parsed)) return parsed
    if (Array.isArray(parsed?.events)) return parsed.events
  } catch {
  }

  try {
    const params = new URLSearchParams(rawBody)
    const payload = params.get('mandrill_events')
    if (!payload) return []
    const parsed = JSON.parse(payload)
    if (Array.isArray(parsed)) return parsed
  } catch {
  }

  return []
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()

    const allowUnsigned = process.env.MAILCHIMP_WEBHOOK_ALLOW_UNSIGNED === 'true'
    const expectedSecret = process.env.MAILCHIMP_WEBHOOK_SECRET

    if (!allowUnsigned && expectedSecret) {
      const provided = getAuthSecret(req)
      if (!provided || provided !== expectedSecret) {
        console.warn('Mailchimp webhook unauthorized', {
          hasSecret: Boolean(expectedSecret),
          hasProvidedSecret: Boolean(provided),
        })
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const events = parseMailchimpEvents(rawBody)
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'Expected webhook events payload' }, { status: 400 })
    }

    const supabase = createAdminClient()

    for (const event of events) {
      const eventType = event?.event
      const msg = event?.msg || {}
      const timestamp = typeof event?.ts === 'number'
        ? new Date(event.ts * 1000).toISOString()
        : new Date().toISOString()

      const campaignMessageId = msg?.metadata?.campaign_message_id
      const rawMessageId = msg?._id || msg?.id || null

      const update: Record<string, any> = {}
      if (rawMessageId) {
        update.sendgrid_message_id = rawMessageId
      }

      switch (eventType) {
        case 'send':
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
        case 'hard_bounce':
        case 'soft_bounce':
        case 'reject':
        case 'deferral':
        case 'spam':
          update.status = 'failed'
          update.failed_at = timestamp
          update.error_message = event?.reason || eventType
          break
        case 'unsub':
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
      } else if (rawMessageId) {
        query = query.or(`sendgrid_message_id.eq.${rawMessageId},twilio_sid.eq.${rawMessageId}`)
      } else {
        continue
      }

      const { error } = await query
      if (error) {
        console.error('Mailchimp webhook update failed:', error)
      }
    }

    return NextResponse.json({ received: events.length })
  } catch (error) {
    return NextResponse.json({ error: 'Webhook processing failed', details: String(error) }, { status: 500 })
  }
}
