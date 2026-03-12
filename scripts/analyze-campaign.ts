import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

const CAMPAIGN_ID = 'f05080d1-0bf5-4576-b164-0aef984d22d2' // Jan 21 email campaign

async function analyzeCampaign() {
  console.log('Analyzing Jan 21 Email Campaign (1,101 leads)...\n')

  // Get detailed message breakdown
  const { data: messages } = await supabase
    .from('campaign_messages')
    .select('status, direction, channel, error_message, cadence_day')
    .eq('campaign_id', CAMPAIGN_ID)

  if (!messages || messages.length === 0) {
    console.log('No messages found')
    return
  }

  // Group by status
  const statusBreakdown: Record<string, number> = {}
  const channelBreakdown: Record<string, number> = {}
  const errorTypes: Record<string, number> = {}
  const dayBreakdown: Record<number, number> = {}

  messages.forEach(msg => {
    statusBreakdown[msg.status] = (statusBreakdown[msg.status] || 0) + 1
    channelBreakdown[msg.channel] = (channelBreakdown[msg.channel] || 0) + 1
    if (msg.error_message) {
      errorTypes[msg.error_message] = (errorTypes[msg.error_message] || 0) + 1
    }
    if (msg.cadence_day) {
      dayBreakdown[msg.cadence_day] = (dayBreakdown[msg.cadence_day] || 0) + 1
    }
  })

  console.log('Message Status:')
  Object.entries(statusBreakdown).forEach(([status, count]) => {
    const pct = ((count / messages.length) * 100).toFixed(1)
    console.log(`  ${status}: ${count} (${pct}%)`)
  })

  console.log('\nChannel Breakdown:')
  Object.entries(channelBreakdown).forEach(([channel, count]) => {
    console.log(`  ${channel}: ${count}`)
  })

  console.log('\nCadence Day:')
  Object.entries(dayBreakdown).forEach(([day, count]) => {
    console.log(`  Day ${day}: ${count} messages`)
  })

  if (Object.keys(errorTypes).length > 0) {
    console.log('\nErrors Found:')
    Object.entries(errorTypes).forEach(([error, count]) => {
      console.log(`  ${error}: ${count}`)
    })
  }

  // Check for sample messages
  const { data: sampleMessages } = await supabase
    .from('campaign_messages')
    .select('*')
    .eq('campaign_id', CAMPAIGN_ID)
    .limit(3)

  if (sampleMessages && sampleMessages.length > 0) {
    console.log('\nSample Message:')
    const msg = sampleMessages[0]
    console.log(`  Status: ${msg.status}`)
    console.log(`  Channel: ${msg.channel}`)
    console.log(`  To: ${msg.to_email || msg.to_phone}`)
    console.log(`  Twilio SID: ${msg.twilio_sid || '(none)'}`)
    console.log(`  SendGrid ID: ${msg.sendgrid_message_id || '(none)'}`)
    console.log(`  Sent At: ${msg.sent_at ? new Date(msg.sent_at).toLocaleString() : 'Not sent'}`)
    console.log(`  Delivered At: ${msg.delivered_at || '(none)'}`)
  }
}

analyzeCampaign().catch(console.error)
