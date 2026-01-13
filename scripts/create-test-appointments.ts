import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const BUSINESS_ID = 'f0c07a53-c001-486b-a30d-c1102b4dfadf';

async function createTestAppointments() {
  console.log('Creating test appointments...\n');

  // Get services
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, name, duration, base_price')
    .eq('business_id', BUSINESS_ID)
    .eq('is_active', true)
    .limit(4);

  if (servicesError || !services?.length) {
    console.error('Could not fetch services:', servicesError);
    return;
  }
  console.log('Services:', services.map(s => s.name));

  // Get stylists (business_members with profiles)
  const { data: members, error: membersError } = await supabase
    .from('business_members')
    .select('id, user_id, role')
    .eq('business_id', BUSINESS_ID)
    .in('role', ['stylist', 'owner']);

  if (membersError || !members?.length) {
    console.error('Could not fetch members:', membersError);
    return;
  }

  // Get their profile names
  const userIds = members.map(m => m.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('id', userIds);

  const stylists = members.map(m => {
    const profile = profiles?.find(p => p.id === m.user_id);
    return {
      memberId: m.id,
      userId: m.user_id,
      name: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown'
    };
  }).filter(s => s.name !== 'Unknown');

  console.log('Stylists:', stylists.map(s => s.name));

  if (stylists.length === 0) {
    console.error('No stylists found');
    return;
  }

  // Create test appointments - use walk-in mode (no client account needed)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const testClients = [
    { name: 'Marcus Johnson', phone: '555-0101' },
    { name: 'Aaliyah Williams', phone: '555-0102' },
    { name: 'Dwayne Carter', phone: '555-0103' },
    { name: 'Jasmine Brown', phone: '555-0104' },
  ];

  const appointments = [
    {
      // Today, confirmed, in 2 hours
      start_time: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      status: 'confirmed',
      is_walk_in: true,
      walk_in_name: testClients[0].name,
      walk_in_phone: testClients[0].phone,
      stylist_id: stylists[0].userId,
      service_id: services[0].id,
      quoted_price: services[0].base_price,
      business_id: BUSINESS_ID,
    },
    {
      // Today, pending, in 4 hours
      start_time: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
      is_walk_in: true,
      walk_in_name: testClients[1].name,
      walk_in_phone: testClients[1].phone,
      stylist_id: stylists[stylists.length > 1 ? 1 : 0].userId,
      service_id: services[services.length > 1 ? 1 : 0].id,
      quoted_price: services[services.length > 1 ? 1 : 0].base_price,
      business_id: BUSINESS_ID,
    },
    {
      // Tomorrow 10 AM, confirmed
      start_time: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 10, 0).toISOString(),
      end_time: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 11, 0).toISOString(),
      status: 'confirmed',
      is_walk_in: true,
      walk_in_name: testClients[2].name,
      walk_in_phone: testClients[2].phone,
      stylist_id: stylists[0].userId,
      service_id: services[services.length > 2 ? 2 : 0].id,
      quoted_price: services[services.length > 2 ? 2 : 0].base_price,
      business_id: BUSINESS_ID,
    },
    {
      // Tomorrow 2 PM, pending
      start_time: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 14, 0).toISOString(),
      end_time: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 15, 0).toISOString(),
      status: 'pending',
      is_walk_in: true,
      walk_in_name: testClients[3].name,
      walk_in_phone: testClients[3].phone,
      stylist_id: stylists[stylists.length > 1 ? 1 : 0].userId,
      service_id: services[0].id,
      quoted_price: services[0].base_price,
      business_id: BUSINESS_ID,
    },
  ];

  console.log('\nInserting appointments...');
  for (const apt of appointments) {
    const { data, error } = await supabase
      .from('appointments')
      .insert(apt)
      .select('id, walk_in_name, status, start_time')
      .single();

    if (error) {
      console.error(`Failed to create appointment for ${apt.walk_in_name}:`, error.message);
    } else {
      console.log(`✓ Created: ${data.walk_in_name} - ${data.status} at ${new Date(data.start_time).toLocaleString()}`);
    }
  }

  console.log('\nDone!');
}

createTestAppointments();
