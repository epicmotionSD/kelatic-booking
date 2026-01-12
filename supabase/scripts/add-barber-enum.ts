import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function addBarberEnum() {
  console.log('\n=== ADDING BARBER TO SERVICE_CATEGORY ENUM ===\n');

  // Use raw SQL to add the enum value
  const { error } = await supabase.rpc('exec_sql', {
    query: "ALTER TYPE service_category ADD VALUE IF NOT EXISTS 'barber'"
  });

  if (error) {
    // Try alternative approach - direct SQL via REST
    console.log('RPC not available, the enum may need to be added via Supabase Dashboard.');
    console.log('Go to: SQL Editor in Supabase Dashboard and run:');
    console.log("   ALTER TYPE service_category ADD VALUE IF NOT EXISTS 'barber';");
    console.log('\nThen re-run the update-barber-category.ts script.');
  } else {
    console.log('✅ Added barber to service_category enum');
  }
}

addBarberEnum().catch(console.error);
