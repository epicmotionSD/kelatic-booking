import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const KELATIC_BUSINESS_ID = 'f0c07a53-c001-486b-a30d-c1102b4dfadf';

async function checkAndFixSchedules() {
  console.log('=== CHECKING STYLIST SCHEDULES ===\n');
  
  // Get all stylists
  const { data: stylists } = await supabase
    .from('profiles')
    .select('id, first_name, email')
    .eq('business_id', KELATIC_BUSINESS_ID)
    .eq('role', 'stylist');
  
  console.log('Stylists:', stylists?.length);
  
  // Check schedules
  const { data: schedules, error } = await supabase
    .from('stylist_schedules')
    .select('*');
  
  console.log('Total schedules:', schedules?.length, '| Error:', error?.message || 'none');
  
  if (!schedules?.length && stylists?.length) {
    console.log('\nNo schedules found. Creating default schedules for stylists...');
    
    // Create default schedules for each stylist (Tue-Sat 9am-6pm)
    const defaultSchedules = [];
    for (const stylist of stylists!) {
      // Days 2-6 (Tue-Sat)
      for (let day = 2; day <= 6; day++) {
        defaultSchedules.push({
          stylist_id: stylist.id,
          business_id: KELATIC_BUSINESS_ID,
          day_of_week: day,
          start_time: '09:00:00',
          end_time: '18:00:00',
          is_active: true
        });
      }
    }
    
    const { data: inserted, error: insertErr } = await supabase
      .from('stylist_schedules')
      .insert(defaultSchedules)
      .select();
    
    if (insertErr) {
      console.log('Insert error:', insertErr.message);
    } else {
      console.log('Created', inserted?.length, 'schedule records');
    }
  } else {
    // Show existing schedules by stylist
    const byStylelist: Record<string, number> = {};
    schedules?.forEach(s => {
      byStylelist[s.stylist_id] = (byStylelist[s.stylist_id] || 0) + 1;
    });
    
    console.log('\nSchedules per stylist:');
    for (const [id, count] of Object.entries(byStylelist)) {
      const stylist = stylists?.find(s => s.id === id);
      console.log(' -', stylist?.first_name || id, ':', count, 'schedules');
    }
    
    // Check if schedules have business_id
    const withoutBid = schedules?.filter(s => !s.business_id);
    if (withoutBid?.length) {
      console.log('\nFixing', withoutBid.length, 'schedules without business_id...');
      const { error: updateErr } = await supabase
        .from('stylist_schedules')
        .update({ business_id: KELATIC_BUSINESS_ID })
        .is('business_id', null);
      
      if (updateErr) {
        console.log('Update error:', updateErr.message);
      } else {
        console.log('Fixed!');
      }
    }
  }
  
  // Also check stylist_time_off
  const { data: timeOff, error: toErr } = await supabase
    .from('stylist_time_off')
    .select('*');
  console.log('\nTime off records:', timeOff?.length, '| Error:', toErr?.message || 'none');
}

checkAndFixSchedules();
