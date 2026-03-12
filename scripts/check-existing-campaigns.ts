import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

const KELATIC_BUSINESS_ID = 'f0c07a53-c001-486b-a30d-c1102b4dfadf'

async function checkExistingCampaigns() {
  console.log('Checking for existing Kelatic campaigns...\n')

  // Get campaigns
  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('business_id', KELATIC_BUSINESS_ID)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error:', error.message)
    return
  }

  if (!campaigns || campaigns.length === 0) {
    console.log('✅ No campaigns found - database is clean for fresh testing')
    return
  }

  console.log(`Found ${campaigns.length} campaign(s):\n`)

  for (const campaign of campaigns) {
    console.log(`Campaign: ${campaign.name}`)
    console.log(`  ID: ${campaign.id}`)
    console.log(`  Status: ${campaign.status}`)
    console.log(`  Segment: ${campaign.segment}`)
    console.log(`  Total Leads: ${campaign.total_leads}`)
    console.log(`  Current Day: ${campaign.current_day}`)
    console.log(`  Created: ${new Date(campaign.created_at).toLocaleString()}`)
    console.log(`  Started: ${campaign.started_at ? new Date(campaign.started_at).toLocaleString() : 'Not started'}`)

    // Get lead stats
    const { data: leads } = await supabase
      .from('campaign_leads')
      .select('status')
      .eq('campaign_id', campaign.id)

    if (leads) {
      const statusCounts: Record<string, number> = {}
      leads.forEach(lead => {
        statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1
      })

      console.log('  Lead Status:')
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`    ${status}: ${count}`)
      })
    }

    // Get message stats
    const { data: messages } = await supabase
      .from('campaign_messages')
      .select('status, direction, channel')
      .eq('campaign_id', campaign.id)

    if (messages && messages.length > 0) {
      const sent = messages.filter(m => m.direction === 'outbound').length
      const delivered = messages.filter(m => m.status === 'delivered').length
      const received = messages.filter(m => m.direction === 'inbound').length

      console.log('  Messages:')
      console.log(`    Sent: ${sent}`)
      console.log(`    Delivered: ${delivered}`)
      console.log(`    Received: ${received}`)
    }

    console.log('')
  }
}

checkExistingCampaigns().catch(console.error)
