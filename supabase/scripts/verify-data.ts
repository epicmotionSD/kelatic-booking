import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyData() {
  console.log('\n=== VERIFYING SEEDED DATA ===\n');

  // 1. Check services
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, name, category, base_price, duration')
    .order('category')
    .order('name');

  if (servicesError) {
    console.error('Error fetching services:', servicesError.message);
  } else {
    console.log(`✅ Total services: ${services.length}`);
    
    // Count by category
    const categoryCounts: Record<string, number> = {};
    services.forEach(s => {
      categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
    });
    console.log('   By category:');
    Object.entries(categoryCounts).sort().forEach(([cat, count]) => {
      console.log(`   - ${cat}: ${count}`);
    });
  }

  // 2. Check stylists
  const { data: stylists, error: stylistsError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, is_active, is_barber')
    .eq('role', 'stylist');

  if (stylistsError) {
    console.error('Error fetching stylists:', stylistsError.message);
  } else {
    console.log(`\n✅ Total stylists: ${stylists.length}`);
    stylists.forEach(s => {
      console.log(`   - ${s.first_name} ${s.last_name} (active: ${s.is_active}, barber: ${s.is_barber || false})`);
    });
  }

  // 3. Check stylist-service mappings
  const { data: mappings, error: mappingsError } = await supabase
    .from('stylist_services')
    .select(`
      id,
      stylist_id,
      service_id,
      custom_price,
      profiles!inner(first_name, last_name),
      services!inner(name)
    `);

  if (mappingsError) {
    console.error('Error fetching stylist-service mappings:', mappingsError.message);
  } else {
    console.log(`\n✅ Total stylist-service mappings: ${mappings.length}`);
    
    // Count per stylist
    const stylistCounts: Record<string, number> = {};
    mappings.forEach((m: any) => {
      const name = `${m.profiles.first_name} ${m.profiles.last_name}`;
      stylistCounts[name] = (stylistCounts[name] || 0) + 1;
    });
    console.log('   Services per stylist:');
    Object.entries(stylistCounts).sort((a, b) => b[1] - a[1]).forEach(([name, count]) => {
      console.log(`   - ${name}: ${count} services`);
    });
  }

  // 4. Check for any orphaned data
  const { data: orphanedMappings } = await supabase
    .from('stylist_services')
    .select('id, stylist_id, service_id')
    .or('stylist_id.is.null,service_id.is.null');

  if (orphanedMappings && orphanedMappings.length > 0) {
    console.log(`\n⚠️  Warning: ${orphanedMappings.length} orphaned stylist-service mappings`);
  } else {
    console.log('\n✅ No orphaned mappings found');
  }

  console.log('\n=== VERIFICATION COMPLETE ===\n');
}

verifyData().catch(console.error);
