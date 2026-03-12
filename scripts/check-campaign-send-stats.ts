import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const campaignId = process.argv[2];
if (!campaignId) {
  console.error('Usage: tsx scripts/check-campaign-send-stats.ts <campaignId>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

async function run() {
  const { data: messages, error: messagesError } = await supabase
    .from('campaign_messages')
    .select('status, channel, cadence_day', { count: 'exact' })
    .eq('campaign_id', campaignId);

  if (messagesError) {
    console.error('Failed to fetch campaign messages:', messagesError.message);
    process.exit(1);
  }

  const messageSummary = (messages || []).reduce<Record<string, number>>((acc, msg) => {
    const key = `${msg.cadence_day || 'none'}:${msg.channel || 'unknown'}:${msg.status || 'unknown'}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const { data: leads, error: leadsError } = await supabase
    .from('campaign_leads')
    .select('status', { count: 'exact' })
    .eq('campaign_id', campaignId);

  if (leadsError) {
    console.error('Failed to fetch campaign leads:', leadsError.message);
    process.exit(1);
  }

  const leadSummary = (leads || []).reduce<Record<string, number>>((acc, lead) => {
    const key = lead.status || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  console.log('Messages:', JSON.stringify(messageSummary, null, 2));
  console.log('Leads:', JSON.stringify(leadSummary, null, 2));
}

run().catch((error) => {
  console.error('Unexpected error:', error.message || error);
  process.exit(1);
});
