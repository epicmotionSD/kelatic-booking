// =============================================================================
// HOT LEAD NOTIFICATION HANDLER
// Triggered when a lead responds positively or shows booking intent
// Notifies the business owner so they can follow up
// =============================================================================

import { inngest } from '../client'
import { createClient } from '@/lib/supabase/server'
import { sendCampaignSMS } from '@/lib/twilio/campaign-sms'

export const handleHotLead = inngest.createFunction(
  {
    id: 'handle-hot-lead',
    name: 'Handle Hot Lead Alert',
    retries: 2,
  },
  { event: 'lead/hot' },
  async ({ event, step }) => {
    const { campaignId, leadId, leadName, phone, responseText, extractedIntent } = event.data
    
    // Step 1: Get campaign and business details
    const { campaign, business, owner } = await step.run('get-context', async () => {
      const supabase = await createClient()
      
      const { data: campaignData } = await supabase
        .from('campaigns')
        .select(`
          id,
          name,
          business_id,
          businesses (
            id,
            name,
            owner_id,
            twilio_phone_number,
            twilio_account_sid_encrypted,
            twilio_auth_token_encrypted,
            profiles!businesses_owner_id_fkey (
              id,
              phone,
              email,
              first_name,
              last_name
            )
          )
        `)
        .eq('id', campaignId)
        .single()
      
      if (!campaignData) {
        throw new Error(`Campaign ${campaignId} not found`)
      }
      
      return {
        campaign: campaignData,
        business: campaignData.businesses as any,
        owner: (campaignData.businesses as any)?.profiles,
      }
    })
    
    // Step 2: Update lead as "hot" in database
    await step.run('flag-lead', async () => {
      const supabase = await createClient()
      
      await supabase
        .from('campaign_leads')
        .update({
          status: 'responded',
          response_sentiment: 'positive',
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)
    })
    
    // Step 3: Send SMS notification to business owner
    if (owner?.phone && business?.twilio_phone_number) {
      await step.run('notify-owner-sms', async () => {
        const intentText = extractedIntent 
          ? ` They mentioned: "${extractedIntent}"`
          : ''
        
        const alertMessage = `🔥 HOT LEAD from ${campaign.name}!\n\n${leadName} (${phone}) replied:\n"${responseText}"${intentText}\n\nReply to this number or call them now!`
        
        try {
          await sendCampaignSMS({
            to: owner.phone,
            from: business.twilio_phone_number,
            body: alertMessage,
            accountSid: business.twilio_account_sid_encrypted,
            authToken: business.twilio_auth_token_encrypted,
          })
        } catch (error) {
          console.error('Failed to send hot lead SMS alert:', error)
          // Don't throw - we'll try email next
        }
      })
    }
    
    // Step 4: Send email notification (if configured)
    // TODO: Implement email notification via Resend/SendGrid
    // if (owner?.email) {
    //   await step.run('notify-owner-email', async () => {
    //     await sendEmail({
    //       to: owner.email,
    //       subject: `🔥 Hot Lead: ${leadName} wants to book!`,
    //       template: 'hot-lead-alert',
    //       data: { leadName, phone, responseText, extractedIntent, campaignName: campaign.name }
    //     })
    //   })
    // }
    
    // Step 5: Create a task/notification in the dashboard
    await step.run('create-dashboard-notification', async () => {
      // You might have a notifications table - if not, this is a TODO
      // const supabase = await createClient()
      // await supabase.from('notifications').insert({
      //   business_id: business.id,
      //   user_id: owner.id,
      //   type: 'hot_lead',
      //   title: `Hot Lead: ${leadName}`,
      //   body: responseText,
      //   metadata: { campaignId, leadId, phone, extractedIntent },
      //   read: false,
      // })
      
      console.log(`📢 Dashboard notification created for hot lead: ${leadName}`)
    })
    
    return {
      success: true,
      leadId,
      notificationsSent: {
        sms: !!owner?.phone,
        email: false, // TODO
        dashboard: true,
      },
    }
  }
)
