/**
 * Check profiles in the database
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkProfiles() {
  console.log('Checking profiles...');

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, role, is_active')
    .order('role');

  console.log('Profiles:');
  profiles?.forEach(p => {
    console.log(`- ${p.first_name} ${p.last_name} (${p.email}) - ${p.role} - ${p.is_active ? 'active' : 'inactive'}`);
  });
}

checkProfiles().catch(console.error);