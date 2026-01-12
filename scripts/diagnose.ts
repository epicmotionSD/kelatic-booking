import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function diagnose() {
  const businessId = 'f0c07a53-c001-486b-a30d-c1102b4dfadf';
  
  console.log('=== KELATIC BOOKING DIAGNOSIS ===\n');
  
  // 1. Check services count
  const { data: services, error: sErr } = await supabase
    .from('services')
    .select('id, name, is_active')
    .eq('business_id', businessId);
  console.log('1. Services for Kelatic:', services?.length || 0, '| Error:', sErr?.message || 'none');
  
  // 2. Check stylists (profiles with stylist role)
  const { data: stylists, error: stErr } = await supabase
    .from('profiles')
    .select('id, email, first_name, role, business_id')
    .eq('business_id', businessId)
    .eq('role', 'stylist');
  console.log('2. Stylists for Kelatic:', stylists?.length || 0, '| Error:', stErr?.message || 'none');
  stylists?.forEach(s => console.log('   -', s.email, '|', s.first_name));
  
  // 3. Check stylist_services mappings
  const { data: mappings, error: mErr } = await supabase
    .from('stylist_services')
    .select('stylist_id, service_id, is_active')
    .eq('business_id', businessId);
  console.log('3. Stylist-Service mappings:', mappings?.length || 0, '| Error:', mErr?.message || 'none');
  
  // 4. Check business_settings
  const { data: settings, error: setErr } = await supabase
    .from('business_settings')
    .select('*')
    .eq('business_id', businessId)
    .single();
  console.log('4. Business settings exists:', !!settings, '| Error:', setErr?.message || 'none');
  if (settings?.business_hours) {
    console.log('   business_hours format:', Object.keys(settings.business_hours).slice(0, 3).join(', '));
  }
  
  // 5. Check stylist_availability table exists and has data
  const { data: availability, error: avErr } = await supabase
    .from('stylist_availability')
    .select('*')
    .limit(5);
  console.log('5. Stylist availability records:', availability?.length || 0, '| Error:', avErr?.message || 'none');
  
  // 6. Check if stylists have any services assigned
  const stylistIds = stylists?.map(s => s.id) || [];
  if (stylistIds.length > 0) {
    const { data: stylistMappings } = await supabase
      .from('stylist_services')
      .select('stylist_id, service_id')
      .in('stylist_id', stylistIds);
    console.log('6. Mappings for actual stylists:', stylistMappings?.length || 0);
  }
  
  // 7. Check appointments table for existing data
  const { data: appointments, error: appErr } = await supabase
    .from('appointments')
    .select('id, status')
    .eq('business_id', businessId)
    .limit(5);
  console.log('7. Appointments for Kelatic:', appointments?.length || 0, '| Error:', appErr?.message || 'none');
  
  console.log('\n=== END DIAGNOSIS ===');
}

diagnose();
