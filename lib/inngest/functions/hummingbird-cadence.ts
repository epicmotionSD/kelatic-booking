// =============================================================================
// HUMMINGBIRD CADENCE FUNCTION
// The core campaign execution engine
// Handles the 7-day reactivation protocol with intelligent pacing
// =============================================================================

import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'
import { sendCampaignSMS } from '@/lib/twilio/campaign-sms'

// Hummingbird cadence schedule (fallback)
const HUMMINGBIRD_CADENCE = [
  { day: 1, delayHours: 0, script: 'direct_inquiry', channel: 'sms' },
  { day: 2, delayHours: 24, script: 'voicemail', channel: 'voice' },
  { day: 4, delayHours: 72, script: 'file_closure', channel: 'sms' },
  { day: 7, delayHours: 144, script: 'breakup', channel: 'sms' },
] as const

// Script templates (Dean Jackson 9-word framework)
// TCPA COMPLIANCE: All SMS messages MUST include opt-out language
const SCRIPTS = {
  direct_inquiry: 'Hi {firstName}, are you still looking to get {service} done? - {businessName}\n\nReply STOP to opt out',
  file_closure: 'Hi {firstName}, I was about to close your file. Should I keep it open? - {businessName}\n\nReply STOP to opt out',
  gift: 'Hi {firstName}, I have a complimentary {service} upgrade for you. Want me to save you a spot? - {businessName}\n\nReply STOP to opt out',
  breakup: 'Hi {firstName}, I\'ll take you off our list. Text back if you ever need {service}. - {businessName}',
  voicemail: 'Hi {firstName}, this is {businessName}. Just checking if you\'re still interested in {service}. Give us a call back when you get a chance.',
}

type CadenceStepConfig = {
  day: number
  delayHours: number
  channel: 'sms' | 'voice' | 'email'
  template: string
  scriptVariant?: string
}

function buildCadenceConfig(campaign: { cadence_config?: unknown; script_variant?: string }) {
  const raw = Array.isArray(campaign.cadence_config) ? campaign.cadence_config : []

  if (raw.length > 0) {
    return raw
      .map((step: any) => {
        const day = Number(step.day)
        const channel = (step.channel || step.type || 'sms') as CadenceStepConfig['channel']
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
          scriptVariant: step.script || campaign.script_variant,
        } satisfies CadenceStepConfig
      })
      .filter((step): step is CadenceStepConfig => Boolean(step))
  }

  return HUMMINGBIRD_CADENCE.map((step) => ({
    day: step.day,
    delayHours: step.delayHours,
    channel: step.channel,
    template: SCRIPTS[step.script as keyof typeof SCRIPTS],
    scriptVariant: step.script,
  }))
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
    // Before window - wait until start
    return (SEND_WINDOW.startHour - currentHour) * 60 * 60 * 1000
  } else if (currentHour >= SEND_WINDOW.endHour) {
    // After window - wait until tomorrow 9am
    return ((24 - currentHour) + SEND_WINDOW.startHour) * 60 * 60 * 1000
  }
  return 0 // Within window
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
  
  if (!compliance) {
    // No A2P registration - use minimum safe limit
    return 50
  }
  
  // Use configured limit or calculate from trust score
  if (compliance.daily_message_limit) {
    return compliance.daily_message_limit
  }
  
  // Trust score thresholds from migration 026
  const trustScore = compliance.trust_score || 0
  if (trustScore >= 75) return 2000
  if (trustScore >= 50) return 500
  return 50 // Low trust or unverified
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
      limit: 10, // Max 10 campaigns running simultaneously
    },
  },
  { event: 'campaign/started' },
  async ({ event, step }) => {
    const { campaignId, businessId } = event.data
    
    // Step 1: Load campaign and leads
    const { campaign, leads, business } = await step.run('load-campaign-data', async () => {
      const supabase = await createClient()
      
      const [campaignResult, leadsResult, businessResult] = await Promise.all([
        supabase
          .from('campaigns')
          .select('*')
          .eq('id', campaignId)
          .single(),
        supabase
          .from('campaign_leads')
          .select('*')
          .eq('campaign_id', campaignId)
          .eq('status', 'pending')
          .order('estimated_value', { ascending: false }), // High value first
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
    
    if (leads.length === 0) {
      return { status: 'no_leads', campaignId }
    }
    
    // Step 2: Mark campaign as active
    await step.run('activate-campaign', async () => {
      const supabase = await createClient()
      await supabase
        .from('campaigns')
        .update({
          status: 'active',
          started_at: new Date().toISOString(),
          current_day: 1,
        })
        .eq('id', campaignId)
    })
    
    const cadenceConfig = buildCadenceConfig(campaign)

    // Step 3: Execute each day of the cadence
    for (const cadenceStep of cadenceConfig) {
      // Check if campaign was paused/cancelled
      const shouldContinue = await step.run(`check-status-day-${cadenceStep.day}`, async () => {
        const supabase = await createClient()
        const { data } = await supabase
          .from('campaigns')
          .select('status')
          .eq('id', campaignId)
          .single()
        
        return data?.status === 'active'
      })
      
      if (!shouldContinue) {
        return { status: 'paused_or_cancelled', stoppedAtDay: cadenceStep.day }
      }
      
      // Wait for the scheduled delay (except Day 1)
      if (cadenceStep.delayHours > 0) {
        await step.sleep(`wait-for-day-${cadenceStep.day}`, `${cadenceStep.delayHours}h`)
      }
      
      // Get leads that haven't responded or opted out
      const activeLeads = await step.run(`get-active-leads-day-${cadenceStep.day}`, async () => {
        const supabase = await createClient()
        const { data } = await supabase
          .from('campaign_leads')
          .select('*')
          .eq('campaign_id', campaignId)
          .in('status', ['pending', 'in_progress'])
          .eq('has_responded', false)
        
        return data || []
      })
      
      if (activeLeads.length === 0) {
        // Everyone responded or opted out - early completion!
        break
      }
      
      // Send messages in batches (respect daily limit based on trust score)
      const dailyLimit = await getDailyLimitForBusiness(businessId)
      const effectiveLimit = Math.min(dailyLimit, campaign.daily_send_limit || dailyLimit)
      const batches = chunkArray(activeLeads.slice(0, effectiveLimit), Math.min(50, effectiveLimit))
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]
        
        // COMPLIANCE: Check if within send window before each batch
        const waitMs = getNextSendWindowMs()
        if (waitMs > 0) {
          console.log(`[COMPLIANCE] Outside send window. Waiting ${Math.round(waitMs / 3600000)}h until 9am`)
          await step.sleep(`wait-for-send-window-day-${cadenceStep.day}-batch-${batchIndex}`, `${Math.ceil(waitMs / 60000)}m`)
        }
        
        await step.run(`send-batch-day-${cadenceStep.day}-batch-${batchIndex}`, async () => {
          const supabase = await createClient()
          const results = []
          
          for (const lead of batch) {
            // COMPLIANCE: Pre-send verification - check if lead opted out since batch was created
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
            
            if (cadenceStep.channel !== 'sms') {
              console.log(`[CADENCE] Skipping non-SMS step on day ${cadenceStep.day}`)
              continue
            }

            // Personalize the script
            const personalizedMessage = cadenceStep.template
              .replace('{firstName}', lead.first_name || 'there')
              .replace('{service}', campaign.script_variables?.service || 'your appointment')
              .replace('{businessName}', business.name)
            
            try {
              // Send SMS via Twilio
              const twilioResult = await sendCampaignSMS({
                to: lead.phone,
                from: business.twilio_phone_number,
                body: personalizedMessage,
                accountSid: business.twilio_account_sid_encrypted, // Decrypt in function
                authToken: business.twilio_auth_token_encrypted,
              })
              
              // Record the message
              await supabase.from('campaign_messages').insert({
                campaign_id: campaignId,
                campaign_lead_id: lead.id,
                business_id: businessId,
                direction: 'outbound',
                channel: cadenceStep.channel,
                to_phone: lead.phone,
                from_phone: business.twilio_phone_number,
                body: personalizedMessage,
                cadence_day: cadenceStep.day,
                script_variant: cadenceStep.scriptVariant || campaign.script_variant,
                status: twilioResult.status === 'queued' ? 'sent' : 'failed',
                twilio_sid: twilioResult.sid,
                sent_at: new Date().toISOString(),
                price: twilioResult.price,
              })
              
              // Update lead status
              await supabase
                .from('campaign_leads')
                .update({
                  status: 'in_progress',
                  current_cadence_day: cadenceStep.day,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', lead.id)
              
              results.push({ leadId: lead.id, success: true, sid: twilioResult.sid })
              
            } catch (error) {
              console.error(`Failed to send to ${lead.phone}:`, error)
              
              // Record failed message
              await supabase.from('campaign_messages').insert({
                campaign_id: campaignId,
                campaign_lead_id: lead.id,
                business_id: businessId,
                direction: 'outbound',
                channel: cadenceStep.channel,
                to_phone: lead.phone,
                from_phone: business.twilio_phone_number,
                body: personalizedMessage,
                cadence_day: cadenceStep.day,
                script_variant: cadenceStep.scriptVariant || campaign.script_variant,
                status: 'failed',
                error_message: String(error),
                failed_at: new Date().toISOString(),
              })
              
              results.push({ leadId: lead.id, success: false, error: String(error) })
            }
            
            // Rate limiting: 1 message per second
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
          
          return results
        })
        
        // Pause between batches
        if (batchIndex < batches.length - 1) {
          await step.sleep(`batch-cooldown-day-${cadenceStep.day}-${batchIndex}`, '5m')
        }
      }
      
      // Update campaign progress
      await step.run(`update-progress-day-${cadenceStep.day}`, async () => {
        const supabase = await createClient()
        await supabase
          .from('campaigns')
          .update({ current_day: cadenceStep.day })
          .eq('id', campaignId)
      })
      
      // Emit day complete event
      await step.sendEvent(`day-${cadenceStep.day}-complete`, {
        name: 'cadence/day-complete',
        data: {
          campaignId,
          day: cadenceStep.day,
          sent: activeLeads.length,
          failed: 0, // TODO: Calculate from results
        },
      })
    }
    
    // Step 4: Mark campaign as complete
    const finalMetrics = await step.run('complete-campaign', async () => {
      const supabase = await createClient()
      
      // Get final metrics
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
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          metrics,
        })
        .eq('id', campaignId)
      
      return metrics
    })
    
    // Emit completion event
    await step.sendEvent('campaign-completed', {
      name: 'campaign/completed',
      data: {
        campaignId,
        metrics: finalMetrics,
      },
    })
    
    return {
      status: 'completed',
      campaignId,
      metrics: finalMetrics,
    }
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
