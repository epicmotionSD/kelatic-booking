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
const limitRaw = process.argv[3];

if (!campaignId || !limitRaw) {
  console.error('Usage: tsx scripts/update-campaign-daily-limit.ts <campaignId> <dailyLimit>');
  process.exit(1);
}

const dailyLimit = Number(limitRaw);
if (!Number.isFinite(dailyLimit) || dailyLimit <= 0) {
  console.error('dailyLimit must be a positive number');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

async function run() {
  const { error } = await supabase
    .from('campaigns')
    .update({ daily_send_limit: dailyLimit })
    .eq('id', campaignId);

  if (error) {
    console.error('Failed to update daily send limit:', error.message);
    process.exit(1);
  }

  console.log(`Updated ${campaignId} daily_send_limit to ${dailyLimit}`);
}

run().catch((error) => {
  console.error('Unexpected error:', error.message || error);
  process.exit(1);
});
