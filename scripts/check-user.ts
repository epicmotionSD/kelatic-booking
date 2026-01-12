import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  // Get the user by email
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  const user = users?.users?.find(u => u.email === 'shawnsonnier04@gmail.com');
  
  if (!user) {
    console.log('User not found in auth');
    return;
  }
  
  console.log('Auth User ID:', user.id);
  console.log('Email:', user.email);
  
  // Check business_members table
  const { data: members, error: memberError } = await supabase
    .from('business_members')
    .select('*, businesses(id, name, slug)')
    .eq('user_id', user.id);
  
  console.log('\nBusiness Memberships:', JSON.stringify(members, null, 2));
  if (memberError) console.log('Member Error:', memberError);
  
  // Check profiles table
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  console.log('\nProfile:', JSON.stringify(profile, null, 2));
  if (profileError) console.log('Profile Error:', profileError);
  
  // Get Kelatic business ID
  const { data: kelatic } = await supabase
    .from('businesses')
    .select('id, name, slug')
    .eq('slug', 'kelatic')
    .single();
  
  console.log('\nKelatic Business:', JSON.stringify(kelatic, null, 2));
}

check();
