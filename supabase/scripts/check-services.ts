/**
 * Check services in the database
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkServices() {
  console.log('Checking services...');

  const { data: services } = await supabase
    .from('services')
    .select('id, name, duration, buffer_time')
    .limit(10);

  console.log('Services:');
  services?.forEach(s => {
    console.log(`- ${s.name}: ${s.duration}min + ${s.buffer_time}min buffer`);
  });
}

checkServices().catch(console.error);