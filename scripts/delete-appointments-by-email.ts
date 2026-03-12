import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error('Usage: tsx scripts/delete-appointments-by-email.ts <email>');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const normalizedEmail = email.trim().toLowerCase();

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id,email')
    .ilike('email', normalizedEmail);

  if (profileError) {
    console.error('Failed to fetch profiles:', profileError.message);
    process.exit(1);
  }

  const profileIds = (profiles || []).map((p) => p.id);

  const appointmentIds = new Set<string>();

  if (profileIds.length > 0) {
    const { data: clientAppointments, error: clientError } = await supabase
      .from('appointments')
      .select('id, client_id, walk_in_email, start_time')
      .in('client_id', profileIds);

    if (clientError) {
      console.error('Failed to fetch client appointments:', clientError.message);
      process.exit(1);
    }

    (clientAppointments || []).forEach((apt) => appointmentIds.add(apt.id));
  }

  const { data: walkInAppointments, error: walkInError } = await supabase
    .from('appointments')
    .select('id, client_id, walk_in_email, start_time')
    .ilike('walk_in_email', normalizedEmail);

  if (walkInError) {
    console.error('Failed to fetch walk-in appointments:', walkInError.message);
    process.exit(1);
  }

  (walkInAppointments || []).forEach((apt) => appointmentIds.add(apt.id));

  if (appointmentIds.size === 0) {
    console.log(`No appointments found for ${normalizedEmail}.`);
    return;
  }

  const ids = Array.from(appointmentIds);
  console.log(`Deleting ${ids.length} appointments for ${normalizedEmail}...`);

  const { error: deleteError } = await supabase
    .from('appointments')
    .delete()
    .in('id', ids);

  if (deleteError) {
    console.error('Delete failed:', deleteError.message);
    process.exit(1);
  }

  console.log('Delete complete.');
}

run().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
