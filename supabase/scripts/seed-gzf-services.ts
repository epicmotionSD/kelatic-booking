/**
 * Seed script to populate GZF Amelia Services
 * Run with: npx tsx supabase/scripts/seed-gzf-services.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  console.error('\nMake sure .env.local exists with these variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Service {
  name: string;
  description: string;
  category: string;
  base_price: number;
  duration: number;
  price_varies: boolean;
  min_price: number | null;
  max_price: number | null;
  deposit_required: boolean;
  deposit_amount: number | null;
  is_active: boolean;
}

const gzfServices: Service[] = [
  // Retwist Services (Locs)
  { name: 'Shampoo Retwist w/style', description: 'Shampoo, retwist and styling service', category: 'locs', base_price: 140.00, duration: 90, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 35.00, is_active: true },
  { name: 'Retwist w/Braided Plaits', description: 'Retwist with braided plait styling', category: 'locs', base_price: 175.00, duration: 120, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 40.00, is_active: true },
  { name: 'Retwist-UpDo/Bun', description: 'Retwist with updo or bun styling', category: 'locs', base_price: 150.00, duration: 135, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 40.00, is_active: true },
  { name: 'Tender Heads/Sensitive Loc Retwist', description: 'Gentle retwist for sensitive scalps', category: 'locs', base_price: 140.00, duration: 150, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 35.00, is_active: true },
  { name: 'Spirals w/Retwist', description: 'Retwist with spiral styling', category: 'locs', base_price: 275.00, duration: 120, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 70.00, is_active: true },
  { name: 'Micro Starter Retwist', description: 'Retwist for micro starter locs', category: 'locs', base_price: 300.00, duration: 150, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 75.00, is_active: true },
  { name: '*$hamp/Detox/Retwist*', description: 'Shampoo, detox treatment, and retwist', category: 'locs', base_price: 200.00, duration: 90, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 50.00, is_active: true },
  { name: 'Retwist-Braided Plaits', description: 'Retwist with braided plaits', category: 'locs', base_price: 150.00, duration: 120, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 40.00, is_active: true },
  { name: 'Retwist & Simple Style', description: 'Basic retwist with simple styling', category: 'locs', base_price: 140.00, duration: 60, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 35.00, is_active: true },
  { name: 'Starter Loc Retwist', description: 'Retwist for starter locs', category: 'locs', base_price: 150.00, duration: 90, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 40.00, is_active: true },
  { name: '**3 Months+ Overdue Retwist**', description: 'Retwist for locs 3+ months overdue', category: 'locs', base_price: 250.00, duration: 90, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 65.00, is_active: true },
  { name: 'Micro Locs Retwist $200-$350', description: 'Retwist for micro locs', category: 'locs', base_price: 200.00, duration: 120, price_varies: true, min_price: 200.00, max_price: 350.00, deposit_required: true, deposit_amount: 50.00, is_active: true },
  { name: 'Shamp/Retwist', description: 'Shampoo and retwist service', category: 'locs', base_price: 125.00, duration: 60, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 30.00, is_active: true },
  { name: 'Shamp/Retwist/Simple Style', description: 'Shampoo, retwist, and simple style', category: 'locs', base_price: 140.00, duration: 60, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 35.00, is_active: true },
  { name: 'Retwist w/Rope Plaits', description: 'Retwist with rope plait styling', category: 'locs', base_price: 200.00, duration: 90, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 50.00, is_active: true },
  { name: 'Deep Conditioning/Retwist Style', description: 'Deep conditioning with retwist and style', category: 'treatments', base_price: 180.00, duration: 90, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 45.00, is_active: true },
  { name: 'Deep Conditioning/Retwist/Style', description: 'Deep conditioning, retwist, and styling', category: 'treatments', base_price: 140.00, duration: 90, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 35.00, is_active: true },
  { name: '+(3+ Months Overdue Retwist)', description: 'Add-on for 3+ months overdue', category: 'locs', base_price: 175.00, duration: 120, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 45.00, is_active: true },
  { name: 'Small Micro Loc Retwist', description: 'Retwist for small micro locs', category: 'locs', base_price: 200.00, duration: 240, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 50.00, is_active: true },
  { name: '+(6+ months over due retwist)', description: 'Add-on for 6+ months overdue', category: 'locs', base_price: 250.00, duration: 120, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 65.00, is_active: true },
  { name: '$75 Shampoo Retwist', description: 'Budget shampoo and retwist', category: 'locs', base_price: 75.00, duration: 60, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },
  { name: '+Shampoo-Retwist', description: 'Add-on shampoo and retwist', category: 'locs', base_price: 90.00, duration: 90, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },
  { name: '+Shampoo-Retwist-Style', description: 'Add-on shampoo, retwist, and style', category: 'locs', base_price: 115.00, duration: 90, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },
  { name: '+Tender Head Retwist', description: 'Add-on tender head retwist', category: 'locs', base_price: 150.00, duration: 120, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 40.00, is_active: true },
  { name: 'Medium Micro Loc Retwist', description: 'Retwist for medium micro locs', category: 'locs', base_price: 225.00, duration: 210, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 55.00, is_active: true },
  { name: 'Large Micro Loc Retwist', description: 'Retwist for large micro locs', category: 'locs', base_price: 200.00, duration: 150, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 50.00, is_active: true },
  { name: '(StarterLocRetwist)', description: 'Starter loc retwist service', category: 'locs', base_price: 125.00, duration: 120, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 30.00, is_active: true },
  { name: '75 Wednesday W/Style', description: 'Wednesday special retwist with style', category: 'locs', base_price: 90.00, duration: 90, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },
  { name: 'Retwist & Pedals', description: 'Retwist with pedal styling', category: 'locs', base_price: 150.00, duration: 120, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 40.00, is_active: true },

  // Starter Locs
  { name: 'Traditional Starters $300-$600', description: 'Traditional starter loc installation', category: 'locs', base_price: 300.00, duration: 90, price_varies: true, min_price: 300.00, max_price: 600.00, deposit_required: true, deposit_amount: 100.00, is_active: true },
  { name: 'Small Starters', description: 'Small starter loc installation', category: 'locs', base_price: 400.00, duration: 180, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 100.00, is_active: true },
  { name: 'Half Head Starters $200-$600', description: 'Half head starter loc installation', category: 'locs', base_price: 400.00, duration: 180, price_varies: true, min_price: 200.00, max_price: 600.00, deposit_required: true, deposit_amount: 100.00, is_active: true },
  { name: 'Starter Locs $300-$900', description: 'Full starter loc installation', category: 'locs', base_price: 300.00, duration: 180, price_varies: true, min_price: 300.00, max_price: 900.00, deposit_required: true, deposit_amount: 100.00, is_active: true },
  { name: 'Small Long Hair Starters $500-$1000', description: 'Starter locs for small long hair', category: 'locs', base_price: 500.00, duration: 210, price_varies: true, min_price: 500.00, max_price: 1000.00, deposit_required: true, deposit_amount: 150.00, is_active: true },

  // Loc Extensions
  { name: 'Loc Extensions $2500-$4500', description: 'Full loc extension installation', category: 'locs', base_price: 2500.00, duration: 600, price_varies: true, min_price: 2500.00, max_price: 4500.00, deposit_required: true, deposit_amount: 500.00, is_active: true },
  { name: 'Loc Extensions', description: 'Loc extension consultation/booking', category: 'locs', base_price: 25.00, duration: 30, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },

  // Loc Repairs & Maintenance
  { name: 'Repairs 6+', description: 'Repair for 6+ broken locs', category: 'locs', base_price: 250.00, duration: 120, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 65.00, is_active: true },
  { name: 'Loc Maintenance', description: 'General loc maintenance', category: 'locs', base_price: 15.00, duration: 15, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },
  { name: 'Loc Reconstruction', description: 'Full loc reconstruction service', category: 'locs', base_price: 300.00, duration: 120, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 75.00, is_active: true },
  { name: 'Loc Replacement $25.00', description: 'Single loc replacement', category: 'locs', base_price: 25.00, duration: 30, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },
  { name: 'Loc Grooming', description: 'Comprehensive loc grooming service', category: 'locs', base_price: 250.00, duration: 90, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 65.00, is_active: true },

  // Inner Locking
  { name: 'Inner Locking (traditional locs)', description: 'Inner locking for traditional locs', category: 'locs', base_price: 200.00, duration: 120, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 50.00, is_active: true },
  { name: 'Micro (Inner Locking) Retie', description: 'Inner locking retie for micro locs', category: 'locs', base_price: 300.00, duration: 180, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 75.00, is_active: true },
  { name: 'Inner Locking Consult', description: 'Consultation for inner locking', category: 'locs', base_price: 25.00, duration: 30, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },

  // Two Strand Styles
  { name: 'Short Hair Two Strand', description: 'Two strand twist for short hair', category: 'natural', base_price: 150.00, duration: 150, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 40.00, is_active: true },
  { name: 'Short Hair Two-Strands', description: 'Two strand twist for short hair', category: 'natural', base_price: 200.00, duration: 90, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 50.00, is_active: true },
  { name: 'Long Hair Two Strands', description: 'Two strand twist for long hair', category: 'natural', base_price: 200.00, duration: 150, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 50.00, is_active: true },
  { name: 'Short Hair Two Strands', description: 'Two strand twist styling', category: 'natural', base_price: 200.00, duration: 120, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 50.00, is_active: true },

  // Styling
  { name: '*Style Only*', description: 'Styling service only (no wash)', category: 'other', base_price: 75.00, duration: 30, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },
  { name: 'Pedals-Fishtails-Updos', description: 'Advanced styling options', category: 'other', base_price: 175.00, duration: 90, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 45.00, is_active: true },

  // Color Services
  { name: 'Color Tips of Locs 300-500', description: 'Color tips of locs', category: 'color', base_price: 300.00, duration: 90, price_varies: true, min_price: 300.00, max_price: 500.00, deposit_required: true, deposit_amount: 100.00, is_active: true },
  { name: 'Gray Touch-Up', description: 'Gray hair touch-up service', category: 'color', base_price: 75.00, duration: 60, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },
  { name: 'Color Locs/Full Head', description: 'Full head loc coloring', category: 'color', base_price: 500.00, duration: 120, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 150.00, is_active: true },

  // Consultations
  { name: "Children's Consultation Services", description: 'Consultation for children services', category: 'other', base_price: 25.00, duration: 30, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },
  { name: 'Consultation', description: 'General consultation', category: 'other', base_price: 25.00, duration: 15, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },
  { name: 'Loc Breakage Consultation', description: 'Consultation for loc breakage issues', category: 'locs', base_price: 25.00, duration: 30, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },
  { name: 'Starter Loc Consultation', description: 'Consultation for starting locs', category: 'locs', base_price: 25.00, duration: 30, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },

  // Treatments
  { name: '+Detox Locs', description: 'Add-on loc detox treatment', category: 'treatments', base_price: 150.00, duration: 90, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 40.00, is_active: true },

  // Kids Services
  { name: 'Kids Micros', description: 'Micro locs for children', category: 'locs', base_price: 150.00, duration: 180, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 40.00, is_active: true },
  { name: 'Tender-Headed Kid', description: 'Service for tender-headed children', category: 'locs', base_price: 125.00, duration: 150, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 30.00, is_active: true },
  { name: '*Kids Retwist', description: 'Kid retwist service', category: 'locs', base_price: 80.00, duration: 120, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },
  { name: 'Kid Retwist & Style', description: 'Kid retwist with styling', category: 'locs', base_price: 100.00, duration: 150, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },
  { name: 'Kids Short Hair Two-Strands', description: 'Two strand twist for kids with short hair', category: 'natural', base_price: 125.00, duration: 180, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 30.00, is_active: true },
  { name: 'Kids Long Loc Two-Strand', description: 'Two strand twist for kids with long locs', category: 'locs', base_price: 150.00, duration: 120, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 40.00, is_active: true },
  { name: 'Kids Detox & Retwist', description: 'Detox and retwist for kids', category: 'locs', base_price: 125.00, duration: 120, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 30.00, is_active: true },
  { name: 'Kids Cuts', description: 'Haircuts for children', category: 'other', base_price: 25.00, duration: 30, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },

  // Braids
  { name: 'Retwist w/Feed-in Braids', description: 'Retwist with feed-in braids', category: 'braids', base_price: 250.00, duration: 150, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 65.00, is_active: true },
  { name: 'Feed-In Braided Plaits', description: 'Feed-in braided plait style', category: 'braids', base_price: 300.00, duration: 150, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 75.00, is_active: true },

  // Micros Category
  { name: 'Micros', description: 'Micro loc service', category: 'locs', base_price: 25.00, duration: 30, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },

  // Training & Specials
  { name: 'Loc Academy Training', description: 'Professional loc training session', category: 'other', base_price: 600.00, duration: 240, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 150.00, is_active: true },
  { name: '****Loc Model Sign-Up****', description: 'Sign up to be a loc model', category: 'other', base_price: 50.00, duration: 240, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },
  { name: 'Join Waiting List (Free)', description: 'Join waiting list (free)', category: 'other', base_price: 0.00, duration: 30, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },
  { name: 'Join Waiting List (Deposit)', description: 'Join waiting list (deposit)', category: 'other', base_price: 25.00, duration: 90, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },

  // Pipe Cleaners
  { name: 'Pipe Cleaners', description: 'Pipe cleaner loc style', category: 'locs', base_price: 250.00, duration: 180, price_varies: false, min_price: null, max_price: null, deposit_required: true, deposit_amount: 65.00, is_active: true },

  // Barber Services
  { name: 'Cut w/Beard', description: 'Haircut with beard trim', category: 'other', base_price: 60.00, duration: 60, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },
  { name: 'Full Cut', description: 'Full haircut service', category: 'other', base_price: 50.00, duration: 30, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },
  { name: 'Line-Up', description: 'Line-up/edge-up service', category: 'other', base_price: 25.00, duration: 30, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },
  { name: 'Loc Chop (Tapered Sides)', description: 'Loc chop with tapered sides', category: 'locs', base_price: 40.00, duration: 30, price_varies: false, min_price: null, max_price: null, deposit_required: false, deposit_amount: null, is_active: true },
];

async function seedGZFServices() {
  console.log('🚀 Starting GZF Services Seeding...\n');

  // First check if there are any appointments referencing services
  const { data: appointmentsWithServices, error: apptError } = await supabase
    .from('appointments')
    .select('id, service_id')
    .not('service_id', 'is', null)
    .limit(1);

  if (apptError) {
    console.error('Error checking appointments:', apptError);
    return;
  }

  if (appointmentsWithServices && appointmentsWithServices.length > 0) {
    console.log('⚠️  Found existing appointments with services.');
    console.log('   Clearing stylist_services first, then replacing services...\n');
  }

  // Clear stylist_services first (to avoid foreign key issues)
  console.log('🗑️  Clearing stylist_services...');
  const { error: clearStylistServicesError } = await supabase
    .from('stylist_services')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (clearStylistServicesError) {
    console.error('Error clearing stylist_services:', clearStylistServicesError);
    return;
  }
  console.log('   ✅ stylist_services cleared\n');

  // Clear existing services
  console.log('🗑️  Clearing existing services...');
  const { error: clearError } = await supabase
    .from('services')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

  if (clearError) {
    console.error('Error clearing services:', clearError);
    return;
  }
  console.log('   ✅ Services cleared\n');

  // Insert new services
  console.log('📦 Inserting GZF services...');
  const { data: insertedServices, error: insertError } = await supabase
    .from('services')
    .insert(gzfServices)
    .select();

  if (insertError) {
    console.error('Error inserting services:', insertError);
    return;
  }

  console.log(`   ✅ Inserted ${insertedServices?.length || 0} services\n`);

  // Display summary by category
  const categoryCounts: Record<string, number> = {};
  for (const service of gzfServices) {
    categoryCounts[service.category] = (categoryCounts[service.category] || 0) + 1;
  }

  console.log('📊 Services by category:');
  for (const [category, count] of Object.entries(categoryCounts).sort()) {
    console.log(`   ${category}: ${count}`);
  }

  console.log('\n✅ GZF Services seeding complete!');
}

// Run the seed
seedGZFServices().catch(console.error);
