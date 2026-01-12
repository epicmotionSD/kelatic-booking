import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Barber service names that should be re-categorized
const BARBER_SERVICES = [
  'Cut w/Beard',
  'Full Cut', 
  'Line-Up',
  'Kids Cuts',
];

async function updateBarberServices() {
  console.log('\n=== UPDATING BARBER SERVICES CATEGORY ===\n');

  for (const serviceName of BARBER_SERVICES) {
    const { data, error } = await supabase
      .from('services')
      .update({ category: 'barber' })
      .eq('name', serviceName)
      .select('id, name, category');

    if (error) {
      console.error(`❌ Failed to update "${serviceName}":`, error.message);
    } else if (data && data.length > 0) {
      console.log(`✅ Updated "${serviceName}" to category: barber`);
    } else {
      console.log(`⚠️  Service "${serviceName}" not found`);
    }
  }

  // Verify the update
  const { data: barberServices } = await supabase
    .from('services')
    .select('name, category')
    .eq('category', 'barber');

  console.log(`\n✅ Total barber services now: ${barberServices?.length || 0}`);
  barberServices?.forEach(s => console.log(`   - ${s.name}`));

  console.log('\n=== UPDATE COMPLETE ===\n');
}

updateBarberServices().catch(console.error);
