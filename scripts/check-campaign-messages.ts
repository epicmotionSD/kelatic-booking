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

const supabase = createClient(supabaseUrl, serviceRoleKey);

const campaignId = process.argv[2];
if (!campaignId) {
  console.error('Usage: tsx scripts/check-campaign-messages.ts <campaignId>');
  process.exit(1);
}

async function run() {
  const { data, error } = await supabase
    .from('campaign_messages')
    .select('cadence_day,status,channel', { count: 'exact' })
    .eq('campaign_id', campaignId);

  if (error) {
    console.error('Failed to fetch campaign messages:', error.message);
    process.exit(1);
  }

  const summary = (data || []).reduce<Record<string, number>>((acc, msg) => {
    const key = `${msg.cadence_day || 'none'}:${msg.channel || 'unknown'}:${msg.status || 'unknown'}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  console.log(JSON.stringify(summary, null, 2));
}

run().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
