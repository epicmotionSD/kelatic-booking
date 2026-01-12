import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const businessId = 'f0c07a53-c001-486b-a30d-c1102b4dfadf';

async function addMemberByEmail(email: string, role: 'owner' | 'admin' | 'stylist' | 'client') {
  // Find user by email
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users?.users?.find(u => u.email === email);
  
  if (!user) {
    console.log(`User ${email} not found in auth`);
    return;
  }
  
  console.log('Found user:', user.id, user.email);
  
  // Check if already exists
  const { data: existing } = await supabase
    .from('business_members')
    .select('*')
    .eq('user_id', user.id)
    .eq('business_id', businessId);
  
  if (existing && existing.length > 0) {
    console.log('Already a member:', existing[0].role);
    return;
  }
  
  const { data, error } = await supabase
    .from('business_members')
    .insert({
      user_id: user.id,
      business_id: businessId,
      role: role,
      is_active: true
    })
    .select();
  
  if (error) {
    console.log('Error:', error);
  } else {
    console.log('Added as', role);
  }
}

// Add all stylists
const stylists = [
  'kelatic@gmail.com',
  'destinyiharris@yahoo.com',
  'jacksonsamira6@gmail.com',
  'nevaehsomone@gmail.com',
  'bigshoopbiz@gmail.com',
  'londonthebarber@gmail.com'
];

async function addAll() {
  for (const email of stylists) {
    await addMemberByEmail(email, 'stylist');
  }
  
  // Verify all members
  const { data: members } = await supabase
    .from('business_members')
    .select('role, profiles(email, first_name, last_name)')
    .eq('business_id', businessId);
  
  console.log('\nAll business members:');
  members?.forEach(m => {
    const p = m.profiles as any;
    console.log('-', p?.email, '|', p?.first_name, p?.last_name, '|', m.role);
  });
}

addAll();
