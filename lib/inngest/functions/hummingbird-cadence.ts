// =============================================================================
// HUMMINGBIRD CADENCE FUNCTION
// The core campaign execution engine
// Handles the 7-day reactivation protocol with intelligent pacing
// =============================================================================

import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'
import { sendCampaignSMS } from '@/lib/twilio/campaign-sms'

// Hummingbird cadence schedule
const HUMMINGBIRD_CADENCE = [
  { day: 1, delayHours: 0, script: 'direct_inquiry', channel: 'sms' },
  { day: 2, delayHours: 24, script: 'voicemail', channel: 'voice' },
  { day: 4, delayHours: 72, script: 'file_closure', channel: 'sms' },
  { day: 7, delayHours: 144, script: 'breakup', channel: 'sms' },
] as const

// Script templates (Dean Jackson 9-word framework)
const SCRIPTS = {
  direct_inquiry: 'Hi {firstName}, are you still looking to get {service} done? - {businessName}',
  file_closure: 'Hi {firstName}, I was about to close your file. Should I keep it open? - {businessName}',
  gift: 'Hi {firstName}, I have a complimentary {service} upgrade for you. Want me to save you a spot? - {businessName}',
  breakup: 'Hi {firstName}, I\'ll take you off our list. Text back if you ever need {service}. - {businessName}',
  voicemail: 'Hi {firstName}, this is {businessName}. Just checking if you\'re still interested in {service}. Give us a call back when you get a chance.',
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
    
    // Step 3: Execute each day of the cadence
    for (const cadenceStep of HUMMINGBIRD_CADENCE) {
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
      
      // Send messages in batches (respect daily limit)
      const dailyLimit = campaign.daily_send_limit || 100
      const batches = chunkArray(activeLeads, Math.min(50, dailyLimit))
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex]
        
        await step.run(`send-batch-day-${cadenceStep.day}-batch-${batchIndex}`, async () => {
          const supabase = await createClient()
          const results = []
          
          for (const lead of batch) {
            // Personalize the script
            const script = SCRIPTS[cadenceStep.script as keyof typeof SCRIPTS]
            const personalizedMessage = script
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
                script_variant: cadenceStep.script,
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
                script_variant: cadenceStep.script,
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
