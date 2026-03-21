// =============================================================================
// HUMMINGBIRD CADENCE FUNCTION
// The core campaign execution engine
// Handles the 7-day reactivation protocol with intelligent pacing
// =============================================================================

import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/client'
import { sendCampaignSMS } from '@/lib/twilio/campaign-sms'
import { sendEmailMessage } from '@/lib/notifications/providers'

// Hummingbird cadence schedule (SMS version)
const HUMMINGBIRD_CADENCE = [
  { day: 1, delayHours: 0, script: 'direct_inquiry', channel: 'sms' },
  { day: 2, delayHours: 24, script: 'voicemail', channel: 'voice' },
  { day: 4, delayHours: 72, script: 'file_closure', channel: 'sms' },
  { day: 7, delayHours: 144, script: 'breakup', channel: 'sms' },
] as const

// Email-only cadence (Phase 1 MVP)
const HUMMINGBIRD_CADENCE_EMAIL = [
  { day: 1, delayHours: 0, script: 'direct_inquiry', channel: 'email' },
  { day: 3, delayHours: 48, script: 'file_closure', channel: 'email' },
  { day: 7, delayHours: 144, script: 'breakup', channel: 'email' },
] as const

/**
 * Get default cadence based on feature flags
 * Email-only by default, SMS if enabled for business
 */
function getDefaultCadence(smsEnabled: boolean = false) {
  if (smsEnabled) {
    return HUMMINGBIRD_CADENCE
  }
  return HUMMINGBIRD_CADENCE_EMAIL
}

// Script templates (Dean Jackson 9-word framework)
// TCPA COMPLIANCE: All SMS messages MUST include opt-out language
const SCRIPTS = {
  direct_inquiry: 'Hi {firstName}, are you still looking to get {service} done? Grab your spot here: https://kelatic.com/book - {businessName}\n\nReply STOP to opt out',
  file_closure: 'Hi {firstName}, I was about to close your file. If you still want {service}, grab your spot here: https://kelatic.com/book - {businessName}\n\nReply STOP to opt out',
  gift: 'Hi {firstName}, I have a complimentary {service} upgrade for you. Want me to save you a spot? - {businessName}\n\nReply STOP to opt out',
  breakup: 'Hi {firstName}, I\'ll take you off our list. Text back if you ever need {service}. - {businessName}',
  voicemail: 'Hi {firstName}, this is {businessName}. Just checking if you\'re still interested in {service}. Give us a call back when you get a chance.',
}

const BOOKING_URL = process.env.PUBLIC_BOOKING_URL || 'https://kelatic.com/book'
const OFFER_URL = process.env.PUBLIC_SPECIAL_OFFERS_URL || 'https://kelatic.com/special-offers'

const EMAIL_TEMPLATES = {
  direct_inquiry: {
    subject: 'Welcome back — 20% off your next visit 🎉',
    headline: 'We\'ve missed you, {firstName}',
    body: 'It\'s been a while since we\'ve seen you at {businessName}, and we want you back. As a welcome-back gift, we\'re offering <strong>20% off your next {service}</strong> — just mention this email when you book.',
    ctaLabel: 'Claim 20% Off & Book Now',
    ctaUrl: BOOKING_URL,
    secondaryLabel: 'View current specials',
    secondaryUrl: OFFER_URL,
    offer: '20% OFF YOUR NEXT VISIT',
    offerSub: 'Welcome-back exclusive — mention this email at booking',
  },
  file_closure: {
    subject: 'Your 20% off is about to expire, {firstName}',
    headline: 'Last chance to claim your discount',
    body: 'Hi {firstName}, we sent you a welcome-back offer a couple days ago and wanted to make sure you saw it. Your <strong>20% off {service}</strong> is still waiting — but we can only hold it a little longer.',
    ctaLabel: 'Book Before It Expires',
    ctaUrl: BOOKING_URL,
    secondaryLabel: 'See current specials',
    secondaryUrl: OFFER_URL,
    offer: '20% OFF — EXPIRING SOON',
    offerSub: 'Mention this email at booking to redeem',
  },
  gift: {
    subject: 'A complimentary upgrade for your next visit',
    headline: 'We saved a bonus for you',
    body: 'Hi {firstName}, we\'d love to gift you a complimentary {service} upgrade on your next visit. Book now and we\'ll apply it for you.',
    ctaLabel: 'Claim the upgrade',
    ctaUrl: BOOKING_URL,
    secondaryLabel: 'Browse our specials',
    secondaryUrl: OFFER_URL,
    offer: 'COMPLIMENTARY UPGRADE',
    offerSub: 'Applied automatically at your next visit',
  },
  breakup: {
    subject: 'We\'ll always have a spot for you, {firstName}',
    headline: 'No hard feelings — we\'re still here',
    body: 'Hi {firstName}, we won\'t keep reaching out after this. But if you ever want to come back for {service}, your 20% welcome-back discount is still good — just mention this email when you book.',
    ctaLabel: 'Book Anytime',
    ctaUrl: BOOKING_URL,
    secondaryLabel: null,
    secondaryUrl: null,
    offer: null,
    offerSub: null,
  },
} as const

function interpolateTemplate(template: string, variables: Record<string, string>) {
  return Object.entries(variables).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
  }, template)
}

type CadenceStepConfig = {
  day: number
  delayHours: number
  channel: 'sms' | 'voice' | 'email'
  template: string
  scriptVariant: string
}

function buildCadenceConfig(campaign: { cadence_config?: unknown; script_variant?: string; sms_enabled?: boolean }) {
  const raw = Array.isArray(campaign.cadence_config) ? campaign.cadence_config : []

  if (raw.length > 0) {
    return raw
      .map((step: any) => {
        const day = Number(step.day)
        const channel = (step.channel || step.type || 'email') as CadenceStepConfig['channel']
        const template = step.template || SCRIPTS[step.script as keyof typeof SCRIPTS]
        const delayHours = Number(step.delayHours ?? (day > 0 ? (day - 1) * 24 : 0))

        if (!day || !template) {
          return null
        }

        return {
          day,
          delayHours,
          channel,
          template,
          scriptVariant: step.script || campaign.script_variant || 'direct_inquiry',
        } satisfies CadenceStepConfig
      })
      .filter((step): step is CadenceStepConfig => Boolean(step))
  }

  // Use email-only cadence by default (Phase 1 MVP)
  const smsEnabled = campaign.sms_enabled || process.env.SMS_ENABLED === 'true'
  const defaultCadence = getDefaultCadence(smsEnabled)

  return defaultCadence.map((step) => ({
    day: step.day,
    delayHours: step.delayHours,
    channel: step.channel,
    template: SCRIPTS[step.script as keyof typeof SCRIPTS],
    scriptVariant: step.script,
  }))
}

async function sendCampaignEmail(params: {
  to: string
  from: string
  subject: string
  html: string
  customArgs?: Record<string, string>
}): Promise<{ status: string; messageId?: string; errorMessage?: string } > {
  const result = await sendEmailMessage({
    to: params.to,
    fromEmail: params.from,
    subject: params.subject,
    html: params.html,
    customArgs: params.customArgs,
  })

  return {
    status: result.success ? 'sent' : 'failed',
    messageId: result.messageId,
    errorMessage: result.error,
  }
}

// =============================================================================
// COMPLIANCE: Time Window Enforcement (TCPA requires 8am-9pm local time)
// We use 9am-8pm for extra safety margin
// =============================================================================
const SEND_WINDOW = { startHour: 9, endHour: 20 } // 9am to 8pm

function isWithinSendWindow(timezone = 'America/New_York'): boolean {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: timezone,
  })
  const currentHour = parseInt(formatter.format(now), 10)
  return currentHour >= SEND_WINDOW.startHour && currentHour < SEND_WINDOW.endHour
}

function getNextSendWindowMs(timezone = 'America/New_York'): number {
  const now = new Date()
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    hour12: false,
    timeZone: timezone,
  })
  const currentHour = parseInt(formatter.format(now), 10)
  
  if (currentHour < SEND_WINDOW.startHour) {
    return (SEND_WINDOW.startHour - currentHour) * 60 * 60 * 1000
  } else if (currentHour >= SEND_WINDOW.endHour) {
    return ((24 - currentHour) + SEND_WINDOW.startHour) * 60 * 60 * 1000
  }
  return 0
}

// =============================================================================
// COMPLIANCE: Get daily limit based on A2P 10DLC trust score
// =============================================================================
async function getDailyLimitForBusiness(businessId: string): Promise<number> {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  
  const { data: compliance } = await supabase
    .from('business_compliance')
    .select('trust_score, daily_message_limit')
    .eq('business_id', businessId)
    .single()
  
  if (!compliance) return 50
  if (compliance.daily_message_limit) return compliance.daily_message_limit
  
  const trustScore = compliance.trust_score || 0
  if (trustScore >= 75) return 2000
  if (trustScore >= 50) return 500
  return 50
}

// =============================================================================
// MAIN CAMPAIGN EXECUTION FUNCTION
// Triggered by 'campaign/started' event
// =============================================================================

export const runHummingbirdCadence = inngest.createFunction(
  {
    id: 'hummingbird-cadence',
    name: 'Run Hummingbird Reactivation Cadence',
    retries: 3,
    concurrency: {
      limit: 5,
    },
  },
  { event: 'campaign/started' },
  async ({ event, step }) => {
    const { campaignId, businessId } = event.data
    
    const { campaign, leads, business } = await step.run('load-campaign-data', async () => {
      const supabase = createAdminClient()
      
      const [campaignResult, leadsResult, businessResult] = await Promise.all([
        supabase.from('campaigns').select('*').eq('id', campaignId).single(),
        supabase
          .from('campaign_leads')
          .select('*')
          .eq('campaign_id', campaignId)
          .eq('status', 'pending')
          .order('estimated_value', { ascending: false }),
        supabase
          .from('businesses')
          .select('name, twilio_phone_number, twilio_account_sid_encrypted, twilio_auth_token_encrypted')
          .eq('id', businessId)
          .single(),
      ])
      
      if (campaignResult.error) throw new Error(`Campaign not found: ${campaignResult.error.message}`)
      if (businessResult.error) throw new Error(`Business not found: ${businessResult.error.message}`)
      
      return {
        campaign: campaignResult.data,
        leads: leadsResult.data || [],
        business: businessResult.data,
      }
    })
    
    if (leads.length === 0) return { status: 'no_leads', campaignId }
    
    await step.run('activate-campaign', async () => {
      const supabase = createAdminClient()
      await supabase
        .from('campaigns')
        .update({ status: 'active', started_at: new Date().toISOString(), current_day: 1 })
        .eq('id', campaignId)
    })
    
    const cadenceConfig = buildCadenceConfig(campaign)

    for (const cadenceStep of cadenceConfig) {
      const shouldContinue = await step.run(`check-status-day-${cadenceStep.day}`, async () => {
        const supabase = createAdminClient()
        const { data } = await supabase.from('campaigns').select('status').eq('id', campaignId).single()
        return data?.status === 'active'
      })
      
      if (!shouldContinue) return { status: 'paused_or_cancelled', stoppedAtDay: cadenceStep.day }
      
      if (cadenceStep.delayHours > 0) {
        await step.sleep(`wait-for-day-${cadenceStep.day}`, `${cadenceStep.delayHours}h`)
      }
      
      const activeLeads = await step.run(`get-active-leads-day-${cadenceStep.day}`, async () => {
        const supabase = createAdminClient()
        const { data } = await supabase
          .from('campaign_leads')
          .select('*')
          .eq('campaign_id', campaignId)
          .in('status', ['pending', 'in_progress'])
          .eq('has_responded', false)
        return data || []
      })
      
      if (activeLeads.length === 0) break
      
      const dailyLimit = await getDailyLimitForBusiness(businessId)
      const channelLimit = cadenceStep.channel === 'email'
        ? (campaign.daily_send_limit || activeLeads.length)
        : Math.min(dailyLimit, campaign.daily_send_limit || dailyLimit)
      const effectiveLimit = Math.max(1, Math.min(channelLimit, activeLeads.length))
      const batches = chunkArray(activeLeads.slice(0, effectiveLimit), Math.min(50, effectiveLimit))
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]
        
        const waitMs = getNextSendWindowMs()
        if (waitMs > 0) {
          console.log(`[COMPLIANCE] Outside send window. Waiting ${Math.round(waitMs / 3600000)}h until 9am`)
          await step.sleep(`wait-for-send-window-day-${cadenceStep.day}-batch-${batchIndex}`, `${Math.ceil(waitMs / 60000)}m`)
        }
        
        await step.run(`send-batch-day-${cadenceStep.day}-batch-${batchIndex}`, async () => {
          const supabase = createAdminClient()
          const results = []
          
          for (const lead of batch) {
            const { data: optOutCheck } = await supabase
              .from('clients')
              .select('sms_opt_out')
              .eq('phone', lead.phone)
              .single()
            
            if (optOutCheck?.sms_opt_out) {
              console.log(`[COMPLIANCE] Skipping ${lead.phone} - opted out`)
              await supabase
                .from('campaign_leads')
                .update({ status: 'opted_out', updated_at: new Date().toISOString() })
                .eq('id', lead.id)
              continue
            }
            
            const personalizedMessage = cadenceStep.template
              .replace('{firstName}', lead.first_name || 'there')
              .replace('{service}', campaign.script_variables?.service || 'your appointment')
              .replace('{businessName}', business.name)
            
            try {
              let sendResult: { status: string; messageId?: string; errorMessage?: string } | null = null

              if (cadenceStep.channel === 'sms') {
                const twilioResult = await sendCampaignSMS({
                  to: lead.phone,
                  from: business.twilio_phone_number,
                  body: personalizedMessage,
                  accountSid: business.twilio_account_sid_encrypted,
                  authToken: business.twilio_auth_token_encrypted,
                })
                sendResult = {
                  status: twilioResult.status === 'queued' ? 'sent' : 'failed',
                  messageId: twilioResult.sid,
                  errorMessage: twilioResult.errorMessage,
                }
                await supabase.from('campaign_messages').insert({
                  campaign_id: campaignId,
                  campaign_lead_id: lead.id,
                  business_id: businessId,
                  direction: 'outbound',
                  channel: 'sms',
                  to_phone: lead.phone,
                  from_phone: business.twilio_phone_number,
                  body: personalizedMessage,
                  cadence_day: cadenceStep.day,
                  script_variant: cadenceStep.scriptVariant || campaign.script_variant,
                  status: sendResult.status,
                  twilio_sid: sendResult.messageId,
                  error_message: sendResult.errorMessage,
                  sent_at: new Date().toISOString(),
                })
              } else if (cadenceStep.channel === 'email') {
                if (!lead.email) {
                  console.log(`[CADENCE] Skipping email for lead ${lead.id} - missing email`)
                  continue
                }

                const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'info@kelatic.com'
                const emailTemplate = EMAIL_TEMPLATES[cadenceStep.scriptVariant as keyof typeof EMAIL_TEMPLATES] || EMAIL_TEMPLATES.direct_inquiry
                const templateVars = {
                  firstName: lead.first_name || 'there',
                  service: campaign.script_variables?.service || 'your appointment',
                  businessName: business.name,
                }
                const subject = interpolateTemplate(emailTemplate.subject, templateVars)
                const headline = interpolateTemplate(emailTemplate.headline, templateVars)
                const body = interpolateTemplate(emailTemplate.body, templateVars)
                const ctaLabel = interpolateTemplate(emailTemplate.ctaLabel, templateVars)
                const ctaUrl = emailTemplate.ctaUrl
                const secondaryLabel = emailTemplate.secondaryLabel
                  ? interpolateTemplate(emailTemplate.secondaryLabel, templateVars)
                  : null
                const secondaryUrl = emailTemplate.secondaryUrl
                const offer = 'offer' in emailTemplate ? emailTemplate.offer : null
                const offerSub = 'offerSub' in emailTemplate ? emailTemplate.offerSub : null

                const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <!-- HEADER -->
          <tr>
            <td style="background:#111111;padding:28px 40px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:800;letter-spacing:0.08em;color:#ffffff;text-transform:uppercase;">KeLatic</p>
              <p style="margin:4px 0 0;font-size:11px;color:#888888;letter-spacing:0.12em;text-transform:uppercase;">Hair Lounge</p>
            </td>
          </tr>
          \${offer ? \`
          <!-- OFFER BANNER -->
          <tr>
            <td style="background:#f59e0b;padding:20px 40px;text-align:center;">
              <p style="margin:0;font-size:18px;font-weight:800;color:#111111;letter-spacing:0.06em;">\${offer}</p>
              \${offerSub ? \`<p style="margin:4px 0 0;font-size:12px;color:#111111;opacity:0.75;">\${offerSub}</p>\` : ''}
            </td>
          </tr>\` : ''}
          <!-- BODY -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111111;line-height:1.3;">${headline}</h1>
              <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#444444;">${body}</p>
              <!-- CTA BUTTON -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="background:#f59e0b;border-radius:8px;">
                    <a href="${ctaUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:700;color:#111111;text-decoration:none;letter-spacing:0.02em;">${ctaLabel}</a>
                  </td>
                </tr>
              </table>
              \${secondaryLabel && secondaryUrl ? \`<p style="margin:0;font-size:13px;"><a href="\${secondaryUrl}" style="color:#f59e0b;text-decoration:underline;">\${secondaryLabel}</a></p>\` : ''}
            </td>
          </tr>
          <!-- DIVIDER -->
          <tr>
            <td style="padding:0 40px;">
              <hr style="border:none;border-top:1px solid #eeeeee;margin:0;" />
            </td>
          </tr>
          <!-- FOOTER -->
          <tr>
            <td style="padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#111111;">KeLatic Hair Lounge</p>
              <p style="margin:0 0 12px;font-size:12px;color:#888888;">Houston, TX · kelatic.com</p>
              <p style="margin:0;font-size:11px;color:#bbbbbb;line-height:1.6;">
                You're receiving this because you've visited us before.<br/>
                To stop receiving emails, simply reply with "unsubscribe" and we'll remove you right away.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
                const emailBodyText = `${headline}\n\n${body}\n\n${ctaLabel}: ${ctaUrl}${secondaryLabel && secondaryUrl ? `\n${secondaryLabel}: ${secondaryUrl}` : ''}`

                const { data: emailMessage, error: emailMessageError } = await supabase
                  .from('campaign_messages')
                  .insert({
                    campaign_id: campaignId,
                    campaign_lead_id: lead.id,
                    business_id: businessId,
                    direction: 'outbound',
                    channel: 'email',
                    to_email: lead.email,
                    from_email: fromEmail,
                    body: emailBodyText,
                    cadence_day: cadenceStep.day,
                    script_variant: cadenceStep.scriptVariant || campaign.script_variant,
                    status: 'queued',
                    queued_at: new Date().toISOString(),
                  })
                  .select('id')
                  .single()

                if (emailMessageError) {
                  throw new Error(`Failed to create email message record: ${emailMessageError.message}`)
                }

                sendResult = await sendCampaignEmail({
                  to: lead.email,
                  from: fromEmail,
                  subject,
                  html,
                  customArgs: {
                    campaign_message_id: emailMessage.id,
                    campaign_id: campaignId,
                    campaign_lead_id: lead.id,
                    business_id: businessId,
                  },
                })

                await supabase
                  .from('campaign_messages')
                  .update({
                    status: sendResult.status,
                    sendgrid_message_id: sendResult.messageId,
                    error_message: sendResult.errorMessage,
                    sent_at: sendResult.status === 'sent' ? new Date().toISOString() : null,
                    failed_at: sendResult.status === 'failed' ? new Date().toISOString() : null,
                  })
                  .eq('id', emailMessage.id)
              } else {
                console.log(`[CADENCE] Skipping unsupported channel ${cadenceStep.channel}`)
                continue
              }
              
              await supabase
                .from('campaign_leads')
                .update({
                  status: 'in_progress',
                  current_cadence_day: cadenceStep.day,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', lead.id)
              
              results.push({ leadId: lead.id, success: sendResult?.status === 'sent', sid: sendResult?.messageId })
              
            } catch (error) {
              console.error(`Failed to send to ${lead.phone}:`, error)
              await supabase.from('campaign_messages').insert({
                campaign_id: campaignId,
                campaign_lead_id: lead.id,
                business_id: businessId,
                direction: 'outbound',
                channel: cadenceStep.channel === 'email' ? 'email' : 'sms',
                to_phone: cadenceStep.channel === 'sms' ? lead.phone : null,
                from_phone: cadenceStep.channel === 'sms' ? business.twilio_phone_number : null,
                to_email: cadenceStep.channel === 'email' ? lead.email : null,
                from_email: cadenceStep.channel === 'email' ? process.env.SENDGRID_FROM_EMAIL || 'info@kelatic.com' : null,
                body: personalizedMessage,
                cadence_day: cadenceStep.day,
                script_variant: cadenceStep.scriptVariant || campaign.script_variant,
                status: 'failed',
                error_message: String(error),
                failed_at: new Date().toISOString(),
              })
              results.push({ leadId: lead.id, success: false, error: String(error) })
            }
            
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
          
          return results
        })
        
        if (batchIndex < batches.length - 1) {
          await step.sleep(`batch-cooldown-day-${cadenceStep.day}-${batchIndex}`, '5m')
        }
      }
      
      await step.run(`update-progress-day-${cadenceStep.day}`, async () => {
        const supabase = createAdminClient()
        await supabase
          .from('campaigns')
          .update({ current_day: cadenceStep.day })
          .eq('id', campaignId)
      })
      
      await step.sendEvent(`day-${cadenceStep.day}-complete`, {
        name: 'cadence/day-complete',
        data: { campaignId, day: cadenceStep.day, sent: activeLeads.length, failed: 0 },
      })
    }
    
    const finalMetrics = await step.run('complete-campaign', async () => {
      const supabase = createAdminClient()
      
      const { data: messages } = await supabase
        .from('campaign_messages')
        .select('status, direction, sentiment, is_opt_out')
        .eq('campaign_id', campaignId)
      
      const { data: bookings } = await supabase
        .from('campaign_leads')
        .select('booking_value')
        .eq('campaign_id', campaignId)
        .eq('converted_to_booking', true)
      
      const metrics = {
        sent: messages?.filter(m => m.direction === 'outbound' && m.status === 'delivered').length || 0,
        delivered: messages?.filter(m => m.status === 'delivered').length || 0,
        responses: messages?.filter(m => m.direction === 'inbound').length || 0,
        positive_responses: messages?.filter(m => m.sentiment === 'positive').length || 0,
        opt_outs: messages?.filter(m => m.is_opt_out).length || 0,
        bookings: bookings?.length || 0,
        revenue: bookings?.reduce((sum, b) => sum + (b.booking_value || 0), 0) || 0,
      }
      
      await supabase
        .from('campaigns')
        .update({ status: 'completed', completed_at: new Date().toISOString(), metrics })
        .eq('id', campaignId)
      
      return metrics
    })
    
    await step.sendEvent('campaign-completed', {
      name: 'campaign/completed',
      data: { campaignId, metrics: finalMetrics },
    })
    
    return { status: 'completed', campaignId, metrics: finalMetrics }
  }
)

// =============================================================================
// HELPER: Chunk array into batches
// =============================================================================

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}
