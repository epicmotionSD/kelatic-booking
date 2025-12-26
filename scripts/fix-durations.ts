/**
 * Fix service durations in the database
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixDurations() {
  console.log('Fixing service durations...');

  // Get all services
  const { data: services } = await supabase
    .from('services')
    .select('id, name, duration');

  if (!services) return;

  for (const service of services) {
    let newDuration = service.duration;

    // If duration is over 1000 minutes (16+ hours), it's probably wrong
    if (service.duration > 1000) {
      // Try to estimate based on service name
      const name = service.name.toLowerCase();

      if (name.includes('consult') || name.includes('style only') || name.includes('cut')) {
        newDuration = 60; // 1 hour
      } else if (name.includes('retwist') || name.includes('maintenance') || name.includes('conditioning')) {
        newDuration = 90; // 1.5 hours
      } else if (name.includes('starter') || name.includes('braids') || name.includes('locs') || name.includes('color')) {
        newDuration = 180; // 3 hours
      } else if (name.includes('extensions') || name.includes('micro')) {
        newDuration = 240; // 4 hours
      } else {
        newDuration = 120; // 2 hours default
      }

      console.log(`Updating ${service.name}: ${service.duration}min -> ${newDuration}min`);

      await supabase
        .from('services')
        .update({ duration: newDuration })
        .eq('id', service.id);
    }
  }

  console.log('Duration fix complete');
}

fixDurations().catch(console.error);