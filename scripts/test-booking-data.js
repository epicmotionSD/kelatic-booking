const { createClient } = require('@supabase/supabase-js');
const { config } = require('dotenv');

// Load environment variables
config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testBookingData() {
  try {
    console.log('🔍 Testing Booking System Data...\n');

    // Test services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .limit(5);

    if (servicesError) throw servicesError;
    console.log(`✅ Services: ${services?.length || 0} found`);
    if (services?.length > 0) {
      console.log('   Sample services:');
      services.slice(0, 3).forEach(s => console.log(`   - ${s.name}: $${s.base_price} (${s.duration}min)`));
    }

    // Test stylists
    const { data: stylists, error: stylistsError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'stylist')
      .limit(5);

    if (stylistsError) throw stylistsError;
    console.log(`\n✅ Stylists: ${stylists?.length || 0} found`);
    if (stylists?.length > 0) {
      console.log('   Sample stylists:');
      stylists.slice(0, 3).forEach(s => console.log(`   - ${s.first_name} ${s.last_name}`));
    }

    // Test stylist-service assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('stylist_services')
      .select(`
        id,
        services!inner(name),
        profiles!inner(first_name, last_name)
      `)
      .limit(5);

    if (assignmentsError) throw assignmentsError;
    console.log(`\n✅ Stylist-Service Assignments: ${assignments?.length || 0} found`);
    if (assignments?.length > 0) {
      console.log('   Sample assignments:');
      assignments.slice(0, 3).forEach(a => {
        console.log(`   - ${a.profiles.first_name} ${a.profiles.last_name} can do ${a.services.name}`);
      });
    }

    // Test schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from('stylist_schedules')
      .select(`
        id,
        day_of_week,
        start_time,
        end_time,
        profiles!inner(first_name, last_name)
      `)
      .limit(5);

    if (schedulesError) throw schedulesError;
    console.log(`\n✅ Stylist Schedules: ${schedules?.length || 0} found`);
    if (schedules?.length > 0) {
      console.log('   Sample schedules:');
      schedules.slice(0, 3).forEach(s => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        console.log(`   - ${s.profiles.first_name} ${s.profiles.last_name}: ${days[s.day_of_week]} ${s.start_time}-${s.end_time}`);
      });
    }

    console.log('\n🎯 Booking System Status: READY ✨');
    console.log('\n📍 Test URLs to try:');
    console.log('   Main booking: http://localhost:3000/book');
    console.log('   With pre-selected service: http://localhost:3000/book?service=<service-id>');
    console.log('   With special offer: http://localhost:3000/book?special=tuesday-retwist');

  } catch (error) {
    console.error('❌ Error testing booking data:', error);
  }
}

testBookingData();