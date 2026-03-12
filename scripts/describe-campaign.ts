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
  console.error('Usage: tsx scripts/describe-campaign.ts <campaignId>');
  process.exit(1);
}

async function run() {
  const { data, error } = await supabase
    .from('campaigns')
    .select('id,name,status,cadence_type,cadence_config,script_variant,script_variables,daily_send_limit,current_day')
    .eq('id', campaignId)
    .single();

  if (error) {
    console.error('Failed to fetch campaign:', error.message);
    process.exit(1);
  }

  console.log(JSON.stringify(data, null, 2));
}

run().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
