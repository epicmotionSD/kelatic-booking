import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function test() {
  // Check RLS policies
  const { data: policies, error: policyError } = await supabase
    .rpc('get_policies', { table_name: 'clients' });
  
  console.log('Policies error:', policyError?.message);
  
  // Check if RLS is enabled
  const { data: rlsStatus } = await supabase
    .from('clients')
    .select('id')
    .limit(1);
  
  console.log('Service role can read:', rlsStatus?.length, 'records');
  
  // Try with anon key to simulate user
  const anonSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  
  const { data: anonData, error: anonError } = await anonSupabase
    .from('clients')
    .select('id')
    .eq('business_id', 'f0c07a53-c001-486b-a30d-c1102b4dfadf')
    .limit(5);
  
  console.log('Anon key error:', anonError?.message);
  console.log('Anon key count:', anonData?.length);
}

test();
