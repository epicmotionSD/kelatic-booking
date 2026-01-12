import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listUsers() {
  const { data: users, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.log('Error:', error);
    return;
  }
  
  console.log('All auth users:');
  users?.users?.forEach(u => console.log('-', u.email, '|', u.id));
  
  // Also check profiles table for stylists
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role')
    .or('role.eq.stylist,role.eq.owner,role.eq.admin');
  
  console.log('\nProfiles with stylist/owner/admin role:');
  profiles?.forEach(p => console.log('-', p.email, '|', p.first_name, p.last_name, '|', p.role));
}

listUsers();
