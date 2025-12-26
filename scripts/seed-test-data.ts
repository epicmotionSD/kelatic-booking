/**
 * Seed script to populate test data for stylists and schedules
 * Run with: npx tsx scripts/seed-test-data.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedTestData() {
  console.log('Seeding test data...');

  // Create test stylists
  const stylists = [
    {
      email: 'stylist1@kelatic.com',
      first_name: 'Sarah',
      last_name: 'Johnson',
      phone: '+12345678901',
      role: 'stylist',
      bio: 'Specializing in locs and natural hair styling',
      specialties: ['locs', 'natural', 'braids'],
      commission_rate: 60.00,
      is_active: true,
    },
    {
      email: 'stylist2@kelatic.com',
      first_name: 'Maria',
      last_name: 'Garcia',
      phone: '+12345678902',
      role: 'stylist',
      bio: 'Expert in braids and protective styles',
      specialties: ['braids', 'locs', 'natural'],
      commission_rate: 60.00,
      is_active: true,
    },
  ];

  const stylistIds: string[] = [];

  for (const stylist of stylists) {
    // Check if stylist already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', stylist.email)
      .single();

    if (existing) {
      console.log(`Stylist ${stylist.first_name} ${stylist.last_name} already exists`);
      stylistIds.push(existing.id);
      continue;
    }

    // Create auth user (this would normally be done through Supabase Auth)
    // For testing, we'll insert directly
    const { data: newStylist, error } = await supabase
      .from('profiles')
      .insert(stylist)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating stylist:', error);
      continue;
    }

    console.log(`Created stylist: ${stylist.first_name} ${stylist.last_name}`);
    stylistIds.push(newStylist.id);
  }

  // Create schedules for stylists (Monday-Friday, 9 AM - 6 PM)
  for (const stylistId of stylistIds) {
    for (let day = 1; day <= 5; day++) { // Monday = 1, Friday = 5
      const { error } = await supabase
        .from('stylist_schedules')
        .insert({
          stylist_id: stylistId,
          day_of_week: day,
          start_time: '09:00:00',
          end_time: '18:00:00',
          is_active: true,
        });

      if (error && !error.message.includes('duplicate key')) {
        console.error('Error creating schedule:', error);
      }
    }
  }

  console.log('Created schedules for stylists');

  // Link stylists to services
  const { data: services } = await supabase
    .from('services')
    .select('id')
    .eq('is_active', true);

  if (services) {
    for (const stylistId of stylistIds) {
      for (const service of services) {
        const { error } = await supabase
          .from('stylist_services')
          .insert({
            stylist_id: stylistId,
            service_id: service.id,
            is_active: true,
          });

        if (error && !error.message.includes('duplicate key')) {
          console.error('Error linking stylist to service:', error);
        }
      }
    }
  }

  console.log('Linked stylists to services');
  console.log('Seeding complete!');
}

seedTestData().catch(console.error);