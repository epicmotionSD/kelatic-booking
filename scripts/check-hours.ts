import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkHours() {
  const { data, error } = await supabase
    .from('business_settings')
    .select('business_hours')
    .eq('business_id', 'f0c07a53-c001-486b-a30d-c1102b4dfadf')
    .single();
  
  console.log('Current business_hours in DB:');
  console.log(JSON.stringify(data?.business_hours, null, 2));
  console.log('\nKeys:', Object.keys(data?.business_hours || {}));
  console.log('Error:', error?.message || 'none');
}

checkHours();
