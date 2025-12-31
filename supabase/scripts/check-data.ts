/**
 * Check what's in the database
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkData() {
  console.log('Checking database data...');

  // Check services
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .limit(5);

  console.log('Services:', services?.length || 0);

  // Check profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .limit(5);

  console.log('Profiles:', profiles?.length || 0);

  // Check stylist_services
  const { data: stylistServices } = await supabase
    .from('stylist_services')
    .select('*')
    .limit(5);

  console.log('Stylist services:', stylistServices?.length || 0);

  // Check stylist_schedules
  const { data: schedules } = await supabase
    .from('stylist_schedules')
    .select('*')
    .limit(5);

  console.log('Schedules:', schedules?.length || 0);
}

checkData().catch(console.error);