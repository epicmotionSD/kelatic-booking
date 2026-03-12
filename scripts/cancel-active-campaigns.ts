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

const args = process.argv.slice(2);
const getArg = (flag: string) => {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  return args[idx + 1] || null;
};

const businessIdArg = getArg('--businessId');
const domainArg = getArg('--domain') || 'kelatic.com';
const slugArg = getArg('--slug') || 'kelatic';

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

async function resolveBusinessId() {
  if (businessIdArg) return businessIdArg;

  let { data: business } = await supabase
    .from('businesses')
    .select('id, custom_domain, slug')
    .eq('custom_domain', domainArg)
    .single();

  if (!business) {
    const { data: slugBusiness } = await supabase
      .from('businesses')
      .select('id, custom_domain, slug')
      .eq('slug', slugArg)
      .single();
    business = slugBusiness || null;
  }

  if (!business) {
    throw new Error('Business not found');
  }

  return business.id;
}

async function run() {
  const businessId = await resolveBusinessId();

  const { data: campaigns, error } = await supabase
    .from('campaigns')
    .select('id,status')
    .eq('business_id', businessId)
    .in('status', ['active', 'paused', 'draft', 'scheduled']);

  if (error) {
    throw new Error(error.message);
  }

  if (!campaigns?.length) {
    console.log('No active/paused/draft campaigns to cancel.');
    return;
  }

  const ids = campaigns.map((c) => c.id);
  const { error: updateError } = await supabase
    .from('campaigns')
    .update({
      status: 'cancelled',
      completed_at: new Date().toISOString(),
      paused_at: null,
    })
    .in('id', ids);

  if (updateError) {
    throw new Error(updateError.message);
  }

  console.log(`Cancelled ${ids.length} campaigns for business ${businessId}.`);
}

run().catch((error) => {
  console.error('Failed to cancel campaigns:', error.message || error);
  process.exit(1);
});
