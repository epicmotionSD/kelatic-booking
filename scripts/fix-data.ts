import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const KELATIC_BUSINESS_ID = 'f0c07a53-c001-486b-a30d-c1102b4dfadf';

async function fixData() {
  console.log('=== FIXING KELATIC DATA ===\n');
  
  // 1. Update all services to have Kelatic business_id
  console.log('1. Fixing services business_id...');
  const { data: updatedServices, error: sErr } = await supabase
    .from('services')
    .update({ business_id: KELATIC_BUSINESS_ID })
    .is('business_id', null)
    .select('id');
  
  if (sErr) {
    console.log('   Error:', sErr.message);
  } else {
    console.log('   Updated', updatedServices?.length || 0, 'services');
  }
  
  // 2. Update all stylist_services to have Kelatic business_id
  console.log('2. Fixing stylist_services business_id...');
  const { data: updatedMappings, error: mErr } = await supabase
    .from('stylist_services')
    .update({ business_id: KELATIC_BUSINESS_ID })
    .is('business_id', null)
    .select('id');
  
  if (mErr) {
    console.log('   Error:', mErr.message);
  } else {
    console.log('   Updated', updatedMappings?.length || 0, 'stylist-service mappings');
  }
  
  // 3. Fix business_hours format (convert string keys to numeric)
  console.log('3. Fixing business_hours format...');
  const { data: settings } = await supabase
    .from('business_settings')
    .select('id, business_hours')
    .eq('business_id', KELATIC_BUSINESS_ID)
    .single();
  
  if (settings?.business_hours) {
    const oldHours = settings.business_hours as Record<string, any>;
    // Check if it's using string day names
    if (oldHours.sunday !== undefined || oldHours.monday !== undefined) {
      const dayMap: Record<string, number> = {
        sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6
      };
      
      const newHours: Record<number, any> = {};
      Object.entries(dayMap).forEach(([name, num]) => {
        newHours[num] = oldHours[name] ?? null;
      });
      
      const { error: hErr } = await supabase
        .from('business_settings')
        .update({ business_hours: newHours })
        .eq('business_id', KELATIC_BUSINESS_ID);
      
      if (hErr) {
        console.log('   Error:', hErr.message);
      } else {
        console.log('   Converted to numeric keys:', Object.keys(newHours).join(', '));
      }
    } else {
      console.log('   Already using numeric keys');
    }
  }
  
  // 4. Verify fixes
  console.log('\n=== VERIFICATION ===');
  
  const { count: sCount } = await supabase
    .from('services')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', KELATIC_BUSINESS_ID);
  console.log('Services with Kelatic business_id:', sCount);
  
  const { count: mCount } = await supabase
    .from('stylist_services')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', KELATIC_BUSINESS_ID);
  console.log('Mappings with Kelatic business_id:', mCount);
  
  const { data: newSettings } = await supabase
    .from('business_settings')
    .select('business_hours')
    .eq('business_id', KELATIC_BUSINESS_ID)
    .single();
  console.log('Business hours keys:', Object.keys(newSettings?.business_hours || {}).join(', '));
  
  console.log('\n=== DONE ===');
}

fixData();
