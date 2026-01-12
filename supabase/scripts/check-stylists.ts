/**
 * Check current stylists in database
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkStylists() {
  console.log('Checking current stylists in database...\n');
  
  const { data: stylists, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role, amelia_user_id')
    .eq('role', 'stylist');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Current stylists:');
  stylists?.forEach(s => {
    console.log(`  - ${s.first_name} ${s.last_name} (${s.email}) - Amelia ID: ${s.amelia_user_id || 'none'}`);
  });
  console.log(`\nTotal: ${stylists?.length || 0} stylists`);
}

checkStylists();
