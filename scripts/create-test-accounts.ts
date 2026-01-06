#!/usr/bin/env tsx
/**
 * Create test accounts for client and stylist testing
 * Run with: npx tsx scripts/create-test-accounts.ts
 */

import { createClient } from '@supabase/supabase-js';

// Initialize admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function createTestAccounts() {
  console.log('🚀 Creating test accounts...\n');

  // Test credentials
  const testPassword = 'TestPassword123!';
  
  const testClient = {
    email: 'testclient@kelatic.com',
    password: testPassword,
    first_name: 'Test',
    last_name: 'Client',
    phone: '+15551234567',
    role: 'client' as const,
  };

  const testStylist = {
    email: 'teststylist@kelatic.com', 
    password: testPassword,
    first_name: 'Test',
    last_name: 'Stylist',
    phone: '+15551234568',
    role: 'stylist' as const,
    bio: 'Test stylist account for development and testing',
    specialties: ['locs', 'braids', 'natural'],
    commission_rate: 60.00,
    is_active: true,
  };

  try {
    // Create test client account
    console.log('👤 Creating test client account...');
    
    // First, create the auth user
    const { data: clientAuthData, error: clientAuthError } = await supabase.auth.admin.createUser({
      email: testClient.email,
      password: testClient.password,
      email_confirm: true,
      user_metadata: {
        first_name: testClient.first_name,
        last_name: testClient.last_name,
        role: testClient.role,
      }
    });

    if (clientAuthError) {
      console.error('❌ Error creating client auth user:', clientAuthError);
    } else if (clientAuthData.user) {
      // Create profile record
      const { data: clientProfile, error: clientProfileError } = await supabase
        .from('profiles')
        .insert({
          id: clientAuthData.user.id,
          email: testClient.email,
          first_name: testClient.first_name,
          last_name: testClient.last_name,
          phone: testClient.phone,
          role: testClient.role,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (clientProfileError) {
        console.error('❌ Error creating client profile:', clientProfileError);
      } else {
        console.log('✅ Test client created successfully!');
        console.log(`   Email: ${testClient.email}`);
        console.log(`   Password: ${testClient.password}`);
        console.log(`   Login at: /account\n`);
      }
    }

    // Create test stylist account
    console.log('💇‍♀️ Creating test stylist account...');
    
    // First, create the auth user  
    const { data: stylistAuthData, error: stylistAuthError } = await supabase.auth.admin.createUser({
      email: testStylist.email,
      password: testStylist.password,
      email_confirm: true,
      user_metadata: {
        first_name: testStylist.first_name,
        last_name: testStylist.last_name,
        role: testStylist.role,
      }
    });

    if (stylistAuthError) {
      console.error('❌ Error creating stylist auth user:', stylistAuthError);
    } else if (stylistAuthData.user) {
      // Create profile record
      const { data: stylistProfile, error: stylistProfileError } = await supabase
        .from('profiles')
        .insert({
          id: stylistAuthData.user.id,
          email: testStylist.email,
          first_name: testStylist.first_name,
          last_name: testStylist.last_name,
          phone: testStylist.phone,
          role: testStylist.role,
          bio: testStylist.bio,
          specialties: testStylist.specialties,
          commission_rate: testStylist.commission_rate,
          is_active: testStylist.is_active,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (stylistProfileError) {
        console.error('❌ Error creating stylist profile:', stylistProfileError);
      } else {
        console.log('✅ Test stylist created successfully!');
        console.log(`   Email: ${testStylist.email}`);
        console.log(`   Password: ${testStylist.password}`);
        console.log(`   Login at: /stylist\n`);

        // Add stylist schedule (Monday-Friday 9am-6pm)
        const schedules = [
          { day_of_week: 1, start_time: '09:00', end_time: '18:00' }, // Monday
          { day_of_week: 2, start_time: '09:00', end_time: '18:00' }, // Tuesday
          { day_of_week: 3, start_time: '09:00', end_time: '18:00' }, // Wednesday
          { day_of_week: 4, start_time: '09:00', end_time: '18:00' }, // Thursday
          { day_of_week: 5, start_time: '09:00', end_time: '18:00' }, // Friday
        ];

        const { error: scheduleError } = await supabase
          .from('stylist_schedules')
          .insert(
            schedules.map(schedule => ({
              stylist_id: stylistAuthData.user!.id,
              ...schedule,
              is_active: true,
            }))
          );

        if (scheduleError) {
          console.error('❌ Error creating stylist schedule:', scheduleError);
        } else {
          console.log('✅ Test stylist schedule created (Mon-Fri 9am-6pm)');
        }

        // Add some sample services for the stylist
        console.log('🔧 Adding services for test stylist...');
        
        // First get available services
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('id, name')
          .in('category', ['locs', 'braids', 'natural'])
          .limit(5);

        if (servicesError) {
          console.error('❌ Error fetching services:', servicesError);
        } else if (services && services.length > 0) {
          const { error: stylistServicesError } = await supabase
            .from('stylist_services')
            .insert(
              services.map(service => ({
                stylist_id: stylistAuthData.user!.id,
                service_id: service.id,
                is_active: true,
              }))
            );

          if (stylistServicesError) {
            console.error('❌ Error creating stylist services:', stylistServicesError);
          } else {
            console.log(`✅ Added ${services.length} services for test stylist`);
          }
        }
      }
    }

    console.log('\n🎉 Test accounts setup complete!');
    console.log('\n📋 Account Summary:');
    console.log('==================');
    console.log('CLIENT ACCOUNT:');
    console.log(`  Email: ${testClient.email}`);
    console.log(`  Password: ${testPassword}`);
    console.log('  Login URL: /login?type=client');
    console.log('  Dashboard: /account');
    console.log('');
    console.log('STYLIST ACCOUNT:');
    console.log(`  Email: ${testStylist.email}`);
    console.log(`  Password: ${testPassword}`);
    console.log('  Login URL: /login?type=stylist');
    console.log('  Dashboard: /stylist');
    console.log('');
    console.log('You can now test both client and stylist functionality!');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the script
createTestAccounts().catch(console.error);