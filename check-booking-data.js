const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkBookingData() {
  console.log('📋 Checking booking system data...\n');
  
  try {
    // Check services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name, category, base_price, is_active');
    
    console.log('🔧 Services:', services?.length || 0);
    if (services?.length > 0) {
      services.slice(0, 5).forEach(s => {
        console.log(`  - ${s.name} (${s.category}) - $${s.base_price} - Active: ${s.is_active}`);
      });
    } else {
      console.log('  ❌ No services found!');
    }
    
    // Check stylists
    const { data: stylists, error: stylistsError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, is_active')
      .eq('role', 'stylist');
    
    console.log('\n💇‍♀️ Stylists:', stylists?.length || 0);
    if (stylists?.length > 0) {
      stylists.forEach(s => {
        console.log(`  - ${s.first_name} ${s.last_name} (${s.email}) - Active: ${s.is_active}`);
      });
    } else {
      console.log('  ❌ No stylists found!');
    }
    
    // Check stylist services
    const { data: stylistServices, error: stylistServicesError } = await supabase
      .from('stylist_services')
      .select(`
        stylist_id,
        service_id,
        is_active,
        services(name),
        profiles(first_name, last_name)
      `);
    
    console.log('\n🎯 Stylist-Service Assignments:', stylistServices?.length || 0);
    if (stylistServices?.length > 0) {
      stylistServices.forEach(ss => {
        console.log(`  - ${ss.profiles?.first_name} ${ss.profiles?.last_name} can do: ${ss.services?.name}`);
      });
    } else {
      console.log('  ⚠️  No stylist-service assignments found!');
    }
    
    // Check stylist schedules
    const { data: schedules, error: schedulesError } = await supabase
      .from('stylist_schedules')
      .select(`
        stylist_id,
        day_of_week,
        start_time,
        end_time,
        is_active,
        profiles(first_name, last_name)
      `);
    
    console.log('\n📅 Stylist Schedules:', schedules?.length || 0);
    if (schedules?.length > 0) {
      schedules.forEach(s => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        console.log(`  - ${s.profiles?.first_name} ${s.profiles?.last_name}: ${days[s.day_of_week]} ${s.start_time}-${s.end_time}`);
      });
    } else {
      console.log('  ⚠️  No stylist schedules found!');
    }
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  }
}

checkBookingData();