/**
 * Seed script to map stylists to services based on GZF Amelia data
 * Run with: npx tsx supabase/scripts/seed-stylist-services.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Amelia service ID to service name mapping
const ameliaServiceIdToName: Record<number, string> = {
  3: 'Retwist w/Braided Plaits',
  5: '*Style Only*',
  8: 'Consultation', // Note: fixed typo from 'Consultaton'
  9: 'Loc Extensions $2500-$4500', // Note: fixed typo
  12: 'Retwist-UpDo/Bun',
  13: 'Tender Heads/Sensitive Loc Retwist',
  14: 'Half Head Starters $200-$600',
  15: 'Traditional Starters $300-$600',
  16: 'Small Starters',
  17: 'Repairs 6+',
  18: 'Inner Locking (traditional locs)',
  19: 'Spirals w/Retwist',
  34: 'Loc Maintenance',
  38: 'Micro Starter Retwist',
  43: 'Short Hair Two Strand',
  44: 'Retwist-Braided Plaits',
  47: 'Retwist & Simple Style',
  62: 'Starter Loc Retwist',
  63: 'Color Tips of Locs 300-500',
  65: '**3 Months+ Overdue Retwist**',
  67: 'Gray Touch-Up',
  68: 'Micro Locs Retwist $200-$350',
  69: 'Small Long Hair Starters $500-$1000',
  70: 'Loc Replacement $25.00',
  72: 'Shamp/Retwist',
  73: 'Shamp/Retwist/Simple Style',
  76: 'Short Hair Two-Strands',
  77: 'Retwist w/Rope Plaits',
  78: 'Color Locs/Full Head',
  79: 'Loc Reconstruction',
  80: 'Shamp/Retwist', // duplicate name, different ID - will use $75 version
  86: '*$hamp/Detox/Retwist*',
  97: '+(3+ Months Overdue Retwist)',
  102: 'Long Hair Two Strands',
  106: 'Deep Conditioning/Retwist/Style',
  108: 'Deep Conditioning/Retwist Style', // fixed typo
  109: 'Loc Academy Training',
  112: '+(6+ months over due retwist)',
  117: 'Starter Locs $300-$900',
  118: '+Shampoo-Retwist',
  119: '+Shampoo-Retwist-Style',
  121: '+Detox Locs',
  122: '+Tender Head Retwist',
  129: 'Retwist w/Feed-in Braids',
  131: 'Small Micro Loc Retwist',
  132: 'Medium Micro Loc Retwist',
  133: 'Large Micro Loc Retwist',
  134: '*Kids Retwist',
  136: 'Kid Retwist & Style',
  137: 'Kids Short Hair Two-Strands',
  138: 'Kids Long Loc Two-Strand',
  139: 'Kids Detox & Retwist',
  144: '(StarterLocRetwist)',
  149: "Children's Consultation Services",
  150: 'Loc Extensions',
  151: 'Loc Breakage Consultation',
  152: 'Micros',
  153: 'Feed-In Braided Plaits',
  154: 'Kids Micros',
  155: 'Tender-Headed Kid',
  156: 'Starter Loc Consultation',
  157: 'Inner Locking Consult',
  158: '****Loc Model Sign-Up****',
  159: 'Loc Grooming',
  160: 'Join Waiting List (Free)',
  161: 'Join Waiting List (Deposit)',
  162: '$75 Shampoo Retwist',
  163: '75 Wednesday W/Style',
  164: 'Retwist & Pedals',
  165: 'Pedals-Fishtails-Updos',
  166: 'Cut w/Beard',
  167: 'Full Cut',
  168: 'Kids Cuts',
  169: 'Line-Up',
  171: 'Loc Chop (Tapered Sides)',
  172: 'Pipe Cleaners',
  173: 'Micro (Inner Locking) Retie',
  174: 'Short Hair Two Strands',
  175: 'Shampoo Retwist w/style',
};

// Provider to services mapping from gzf_amelia_providers_to_services
// Format: ameliaUserId -> array of { serviceId, customPrice }
const providerServiceMappings: Record<number, { serviceId: number; price: number }[]> = {
  // Rockal Roberts (Amelia ID: 1)
  1: [
    { serviceId: 3, price: 175 },
    { serviceId: 5, price: 75 },
    { serviceId: 8, price: 25 },
    { serviceId: 9, price: 2500 },
    { serviceId: 13, price: 160 },
    { serviceId: 14, price: 400 },
    { serviceId: 15, price: 300 },
    { serviceId: 16, price: 400 },
    { serviceId: 17, price: 250 },
    { serviceId: 18, price: 200 },
    { serviceId: 19, price: 275 },
    { serviceId: 34, price: 15 },
    { serviceId: 38, price: 300 },
    { serviceId: 47, price: 140 },
    { serviceId: 62, price: 150 },
    { serviceId: 63, price: 300 },
    { serviceId: 65, price: 250 },
    { serviceId: 67, price: 75 },
    { serviceId: 68, price: 200 },
    { serviceId: 69, price: 500 },
    { serviceId: 70, price: 25 },
    { serviceId: 72, price: 125 },
    { serviceId: 73, price: 140 },
    { serviceId: 76, price: 200 },
    { serviceId: 77, price: 200 },
    { serviceId: 78, price: 500 },
    { serviceId: 79, price: 300 },
    { serviceId: 80, price: 125 },
    { serviceId: 86, price: 200 },
    { serviceId: 102, price: 300 },
    { serviceId: 108, price: 180 },
    { serviceId: 109, price: 600 },
    { serviceId: 112, price: 250 },
    { serviceId: 117, price: 300 },
    { serviceId: 129, price: 250 },
    { serviceId: 149, price: 25 },
    { serviceId: 150, price: 25 },
    { serviceId: 151, price: 25 },
    { serviceId: 152, price: 25 },
    { serviceId: 153, price: 300 },
    { serviceId: 156, price: 25 },
    { serviceId: 157, price: 25 },
    { serviceId: 158, price: 50 },
    { serviceId: 159, price: 250 },
    { serviceId: 160, price: 25 },
    { serviceId: 165, price: 175 },
    { serviceId: 166, price: 60 },
    { serviceId: 167, price: 50 },
    { serviceId: 168, price: 25 },
    { serviceId: 169, price: 25 },
    { serviceId: 172, price: 250 },
    { serviceId: 173, price: 300 },
    { serviceId: 174, price: 200 },
    { serviceId: 175, price: 140 },
  ],
  
  // London Renfro (Amelia ID: 87) - Barber
  87: [
    { serviceId: 166, price: 60 },
    { serviceId: 167, price: 50 },
    { serviceId: 168, price: 25 },
    { serviceId: 169, price: 25 },
    { serviceId: 171, price: 40 },
  ],
  
  // Destiny Harris (Amelia ID: 2157)
  2157: [
    { serviceId: 5, price: 75 },
    { serviceId: 8, price: 25 },
    { serviceId: 12, price: 150 },
    { serviceId: 13, price: 140 },
    { serviceId: 14, price: 400 },
    { serviceId: 15, price: 300 },
    { serviceId: 16, price: 400 },
    { serviceId: 43, price: 150 },
    { serviceId: 44, price: 150 },
    { serviceId: 69, price: 500 },
    { serviceId: 80, price: 90 },
    { serviceId: 97, price: 175 },
    { serviceId: 106, price: 140 },
    { serviceId: 112, price: 250 },
    { serviceId: 117, price: 300 },
    { serviceId: 118, price: 90 },
    { serviceId: 119, price: 115 },
    { serviceId: 121, price: 150 },
    { serviceId: 122, price: 150 },
    { serviceId: 129, price: 250 },
    { serviceId: 131, price: 200 },
    { serviceId: 132, price: 225 },
    { serviceId: 133, price: 200 },
    { serviceId: 134, price: 80 },
    { serviceId: 136, price: 100 },
    { serviceId: 137, price: 125 },
    { serviceId: 138, price: 150 },
    { serviceId: 139, price: 125 },
    { serviceId: 144, price: 125 },
    { serviceId: 149, price: 25 },
    { serviceId: 152, price: 25 },
    { serviceId: 154, price: 150 },
    { serviceId: 155, price: 125 },
    { serviceId: 156, price: 25 },
    { serviceId: 162, price: 90 },
    { serviceId: 163, price: 90 },
    { serviceId: 164, price: 150 },
  ],
  
  // Samira Jackson (Amelia ID: 2507)
  2507: [
    { serviceId: 5, price: 75 },
    { serviceId: 8, price: 25 },
    { serviceId: 12, price: 150 },
    { serviceId: 13, price: 140 },
    { serviceId: 17, price: 250 },
    { serviceId: 43, price: 150 },
    { serviceId: 44, price: 150 },
    { serviceId: 68, price: 200 },
    { serviceId: 80, price: 90 },
    { serviceId: 97, price: 175 },
    { serviceId: 102, price: 200 },
    { serviceId: 106, price: 140 },
    { serviceId: 112, price: 250 },
    { serviceId: 118, price: 90 },
    { serviceId: 119, price: 115 },
    { serviceId: 121, price: 150 },
    { serviceId: 122, price: 150 },
    { serviceId: 132, price: 225 },
    { serviceId: 133, price: 200 },
    { serviceId: 134, price: 80 },
    { serviceId: 136, price: 100 },
    { serviceId: 137, price: 125 },
    { serviceId: 138, price: 150 },
    { serviceId: 139, price: 125 },
    { serviceId: 144, price: 125 },
    { serviceId: 154, price: 150 },
    { serviceId: 155, price: 125 },
    { serviceId: 162, price: 75 },
    { serviceId: 163, price: 90 },
    { serviceId: 164, price: 150 },
  ],
  
  // Chera (Shoop) Green (Amelia ID: 2529)
  2529: [
    { serviceId: 5, price: 75 },
    { serviceId: 8, price: 25 },
    { serviceId: 12, price: 150 },
    { serviceId: 13, price: 140 },
    { serviceId: 43, price: 150 },
    { serviceId: 44, price: 150 },
    { serviceId: 97, price: 175 },
    { serviceId: 102, price: 200 },
    { serviceId: 106, price: 140 },
    { serviceId: 112, price: 250 },
    { serviceId: 118, price: 90 },
    { serviceId: 119, price: 115 },
    { serviceId: 121, price: 150 },
    { serviceId: 122, price: 150 },
    { serviceId: 131, price: 200 },
    { serviceId: 132, price: 225 },
    { serviceId: 133, price: 200 },
    { serviceId: 136, price: 100 },
    { serviceId: 138, price: 150 },
    { serviceId: 139, price: 125 },
    { serviceId: 144, price: 125 },
    { serviceId: 154, price: 150 },
    { serviceId: 155, price: 125 },
    { serviceId: 158, price: 50 },
    { serviceId: 162, price: 75 },
    { serviceId: 163, price: 90 },
  ],
  
  // Justice Nevaeh (Amelia ID: 2977)
  2977: [
    { serviceId: 5, price: 75 },
    { serviceId: 8, price: 25 },
    { serviceId: 12, price: 150 },
    { serviceId: 43, price: 150 },
    { serviceId: 44, price: 150 },
    { serviceId: 97, price: 175 },
    { serviceId: 106, price: 140 },
    { serviceId: 119, price: 115 },
    { serviceId: 121, price: 150 },
    { serviceId: 122, price: 150 },
    { serviceId: 131, price: 200 },
    { serviceId: 132, price: 225 },
    { serviceId: 133, price: 200 },
    { serviceId: 136, price: 100 },
    { serviceId: 138, price: 150 },
    { serviceId: 139, price: 125 },
    { serviceId: 144, price: 125 },
    { serviceId: 154, price: 150 },
    { serviceId: 155, price: 125 },
    { serviceId: 158, price: 50 },
    { serviceId: 162, price: 75 },
    { serviceId: 163, price: 90 },
    { serviceId: 164, price: 150 },
  ],
};

async function seedStylistServices() {
  console.log('🚀 Starting Stylist-Services Mapping...\n');

  // Get all stylists with their Amelia IDs
  const { data: stylists, error: stylistError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, amelia_user_id')
    .eq('role', 'stylist');

  if (stylistError) {
    console.error('Error fetching stylists:', stylistError);
    return;
  }

  console.log(`Found ${stylists?.length || 0} stylists\n`);

  // Get all services
  const { data: services, error: serviceError } = await supabase
    .from('services')
    .select('id, name');

  if (serviceError) {
    console.error('Error fetching services:', serviceError);
    return;
  }

  console.log(`Found ${services?.length || 0} services\n`);

  // Create a map of service name -> Supabase UUID
  const serviceNameToId: Record<string, string> = {};
  for (const service of services || []) {
    serviceNameToId[service.name] = service.id;
  }

  // Clear existing stylist_services
  console.log('🗑️  Clearing existing stylist_services...');
  const { error: clearError } = await supabase
    .from('stylist_services')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');

  if (clearError) {
    console.error('Error clearing stylist_services:', clearError);
    return;
  }
  console.log('   ✅ Cleared\n');

  // Process each stylist
  let totalMappings = 0;
  let unmatchedServices: string[] = [];

  for (const stylist of stylists || []) {
    const ameliaId = stylist.amelia_user_id;
    if (!ameliaId || !providerServiceMappings[ameliaId]) {
      console.log(`⚠️  No mapping found for ${stylist.first_name} ${stylist.last_name} (Amelia ID: ${ameliaId})`);
      continue;
    }

    const mappings = providerServiceMappings[ameliaId];
    const stylistServices: { stylist_id: string; service_id: string; custom_price: number | null }[] = [];

    for (const mapping of mappings) {
      const serviceName = ameliaServiceIdToName[mapping.serviceId];
      if (!serviceName) {
        console.log(`   ⚠️  Unknown Amelia service ID: ${mapping.serviceId}`);
        continue;
      }

      const supabaseServiceId = serviceNameToId[serviceName];
      if (!supabaseServiceId) {
        if (!unmatchedServices.includes(serviceName)) {
          unmatchedServices.push(serviceName);
        }
        continue;
      }

      // Check for duplicates (same stylist + service)
      const isDuplicate = stylistServices.some(s => s.service_id === supabaseServiceId);
      if (isDuplicate) {
        continue; // Skip duplicate
      }

      stylistServices.push({
        stylist_id: stylist.id,
        service_id: supabaseServiceId,
        custom_price: mapping.price,
      });
    }

    if (stylistServices.length > 0) {
      const { error: insertError } = await supabase
        .from('stylist_services')
        .insert(stylistServices);

      if (insertError) {
        console.error(`Error inserting services for ${stylist.first_name}:`, insertError);
      } else {
        console.log(`✅ ${stylist.first_name} ${stylist.last_name}: ${stylistServices.length} services`);
        totalMappings += stylistServices.length;
      }
    }
  }

  console.log(`\n📊 Total mappings created: ${totalMappings}`);

  if (unmatchedServices.length > 0) {
    console.log(`\n⚠️  Unmatched services (not found in Supabase):`);
    unmatchedServices.forEach(s => console.log(`   - ${s}`));
  }

  console.log('\n✅ Stylist-Services mapping complete!');
}

seedStylistServices().catch(console.error);
