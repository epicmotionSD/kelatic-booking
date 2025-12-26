/**
 * Check schedules for stylists
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchedules() {
  console.log('Checking schedules...');

  // Get one stylist
  const { data: stylist } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('role', 'stylist')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!stylist) {
    console.log('No stylists found');
    return;
  }

  console.log(`Checking schedules for ${stylist.first_name} ${stylist.last_name}`);

  const { data: schedules } = await supabase
    .from('stylist_schedules')
    .select('*')
    .eq('stylist_id', stylist.id);

  console.log('Schedules:');
  schedules?.forEach(s => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    console.log(`- ${days[s.day_of_week]}: ${s.start_time} - ${s.end_time} (${s.is_active ? 'active' : 'inactive'})`);
  });

  // Check stylist_services
  const { data: services } = await supabase
    .from('stylist_services')
    .select(`
      service_id,
      custom_duration,
      services (
        name,
        duration
      )
    `)
    .eq('stylist_id', stylist.id);

  console.log('Services:');
  services?.forEach(s => {
    const service = s.services as any;
    console.log(`- ${service.name} (${service.duration}min, custom: ${s.custom_duration || 'none'})`);
  });
}

checkSchedules().catch(console.error);