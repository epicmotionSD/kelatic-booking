import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  const { data, error, count } = await supabase
    .from('appointments')
    .select('id, walk_in_name, status, start_time, stylist_id', { count: 'exact' })
    .eq('business_id', 'f0c07a53-c001-486b-a30d-c1102b4dfadf')
    .order('start_time', { ascending: false })
    .limit(10);

  console.log('Error:', error?.message);
  console.log('Total count:', count);
  console.log('Appointments:', JSON.stringify(data, null, 2));
}

check();
