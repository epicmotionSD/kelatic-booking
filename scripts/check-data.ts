import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  // Check services business_id
  const { data: services } = await supabase.from('services').select('id, name, business_id').limit(5);
  console.log('Sample services:');
  services?.forEach(s => console.log('  -', s.name.substring(0,30), '| business_id:', s.business_id));
  
  // Check stylist_services business_id
  const { data: mappings } = await supabase.from('stylist_services').select('id, business_id').limit(5);
  console.log('\nSample mappings business_id:', mappings?.map(m => m.business_id));
  
  // Total services
  const { count } = await supabase.from('services').select('*', { count: 'exact', head: true });
  console.log('\nTotal services:', count);
  
  // Services with null business_id
  const { count: nullCount } = await supabase.from('services').select('*', { count: 'exact', head: true }).is('business_id', null);
  console.log('Services with NULL business_id:', nullCount);
}

check();
