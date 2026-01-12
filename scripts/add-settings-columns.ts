// Run this script to add missing columns to business_settings table
// Usage: npx tsx scripts/add-settings-columns.ts

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function addSettingsColumns() {
  console.log('Adding missing columns to business_settings table...');

  // Add missing columns using Supabase's sql function
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql_query: `
      ALTER TABLE business_settings 
      ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Chicago',
      ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD',
      ADD COLUMN IF NOT EXISTS closed_days INTEGER[] DEFAULT ARRAY[0, 1],
      ADD COLUMN IF NOT EXISTS google_calendar_connected BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS sms_email_enabled BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS stripe_connected BOOLEAN DEFAULT false;
    `
  });

  if (alterError) {
    console.log('Note: ALTER TABLE via RPC not available, columns may already exist or need manual addition');
    console.log('Error:', alterError.message);
  } else {
    console.log('Columns added successfully');
  }

  // Update Kelatic business settings
  console.log('Updating Kelatic business settings...');
  
  // First get the Kelatic business
  const { data: business, error: bizError } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', 'kelatic')
    .single();

  if (bizError || !business) {
    console.error('Could not find kelatic business:', bizError);
    return;
  }

  console.log('Found Kelatic business:', business.id);

  // Update business_settings with numeric day keys for business_hours
  const { error: updateError } = await supabase
    .from('business_settings')
    .upsert({
      business_id: business.id,
      business_hours: {
        "0": null,
        "1": null,
        "2": { open: "10:00", close: "19:00" },
        "3": { open: "10:00", close: "19:00" },
        "4": { open: "10:00", close: "19:00" },
        "5": { open: "10:00", close: "19:00" },
        "6": { open: "09:00", close: "17:00" }
      },
      timezone: 'America/Chicago',
      currency: 'USD',
      closed_days: [0, 1],
      google_calendar_connected: false,
      sms_email_enabled: false,
      stripe_connected: true
    }, { 
      onConflict: 'business_id' 
    });

  if (updateError) {
    console.error('Error updating business_settings:', updateError);
  } else {
    console.log('Business settings updated successfully!');
  }

  // Verify the update
  const { data: settings, error: fetchError } = await supabase
    .from('business_settings')
    .select('*')
    .eq('business_id', business.id)
    .single();

  if (fetchError) {
    console.error('Error fetching settings:', fetchError);
  } else {
    console.log('Current settings:', JSON.stringify(settings, null, 2));
  }
}

addSettingsColumns().catch(console.error);
