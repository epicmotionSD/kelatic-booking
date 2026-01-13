import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
  // Check all profiles
  const { data: profs } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role, email')
    .eq('business_id', 'f0c07a53-c001-486b-a30d-c1102b4dfadf')
    .limit(10);
  console.log('Profiles in business:', profs?.map(p => `${p.first_name} ${p.last_name} (${p.role})`));
}
main();
