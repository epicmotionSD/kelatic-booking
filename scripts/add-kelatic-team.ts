#!/usr/bin/env tsx
/**
 * Create the "Kelatic Team" stylist — a placeholder profile that appears
 * in the booking stylist picker. When clients pick it, the appointment
 * is assigned to this profile so Kelatic admins can reassign it to a
 * specific stylist later from the dashboard.
 *
 * Booking notifications route to TEAM_NOTIFY_EMAIL — set below.
 *
 * Idempotent: re-running skips rows that already exist.
 *
 * Usage:  npx tsx scripts/add-kelatic-team.ts
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { randomBytes } from 'crypto';
config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Profile email must be unique in the DB. This is also where booking
// notifications get sent — change if a different inbox should receive them.
const TEAM_PROFILE_EMAIL = 'team@kelatic.com';

const TEAM = {
  email: TEAM_PROFILE_EMAIL,
  first_name: 'Kelatic',
  last_name: 'Team',
  phone: '+17134854000', // Kelatic main number from migration 010
  bio:
    "Let the Kelatic Team match you with the right stylist. Pick this option and we'll assign the best available expert for your service.",
  specialties: ['locs', 'braids', 'natural', 'silk press', 'barber'],
  is_active: true,
  commission_rate: 0,
};

// Mon–Sun 9am–8pm — wide enough that Kelatic Team is bookable any time
// the salon is open. Admins can tighten in the dashboard if needed.
const SCHEDULE = [0, 1, 2, 3, 4, 5, 6].map((day_of_week) => ({
  day_of_week,
  start_time: '09:00',
  end_time: '20:00',
}));

async function main() {
  console.log('🚀 Creating Kelatic Team stylist\n');

  // 1. Kelatic business
  const { data: biz, error: bizErr } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', 'kelatic')
    .single();
  if (bizErr || !biz) throw new Error(`Kelatic business not found: ${bizErr?.message}`);
  const businessId = biz.id;
  console.log(`Kelatic business_id: ${businessId}`);

  // 2. Auth user
  const { data: usersList } = await supabase.auth.admin.listUsers();
  let teamUser = usersList?.users?.find((u) => u.email === TEAM.email);

  if (!teamUser) {
    console.log('Creating auth user (random password — placeholder, no login)…');
    const tempPassword = randomBytes(24).toString('base64');
    const { data, error } = await supabase.auth.admin.createUser({
      email: TEAM.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: TEAM.first_name,
        last_name: TEAM.last_name,
        role: 'stylist',
      },
    });
    if (error) throw new Error(`auth.createUser: ${error.message}`);
    teamUser = data.user!;
    console.log(`✅ auth user created: ${teamUser.id}`);
  } else {
    console.log(`auth user exists: ${teamUser.id}`);
  }

  // 3. Profile
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', teamUser.id)
    .maybeSingle();

  if (!existingProfile) {
    const { error } = await supabase.from('profiles').insert({
      id: teamUser.id,
      email: TEAM.email,
      first_name: TEAM.first_name,
      last_name: TEAM.last_name,
      phone: TEAM.phone,
      role: 'stylist',
      bio: TEAM.bio,
      specialties: TEAM.specialties,
      is_active: TEAM.is_active,
      commission_rate: TEAM.commission_rate,
      business_id: businessId,
    });
    if (error) throw new Error(`profile insert: ${error.message}`);
    console.log('✅ profile created');
  } else {
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: TEAM.first_name,
        last_name: TEAM.last_name,
        phone: TEAM.phone,
        role: 'stylist',
        bio: TEAM.bio,
        specialties: TEAM.specialties,
        is_active: TEAM.is_active,
        business_id: businessId,
      })
      .eq('id', teamUser.id);
    if (error) throw new Error(`profile update: ${error.message}`);
    console.log('✅ profile updated');
  }

  // 4. business_member
  const { data: existingBm } = await supabase
    .from('business_members')
    .select('id')
    .eq('user_id', teamUser.id)
    .eq('business_id', businessId)
    .maybeSingle();

  if (!existingBm) {
    const { error } = await supabase.from('business_members').insert({
      user_id: teamUser.id,
      business_id: businessId,
      role: 'stylist',
      is_active: true,
    });
    if (error) throw new Error(`business_members insert: ${error.message}`);
    console.log('✅ business_member created');
  } else {
    console.log('business_member exists');
  }

  // 5. Schedule
  const { data: existingSched } = await supabase
    .from('stylist_schedules')
    .select('day_of_week')
    .eq('stylist_id', teamUser.id);
  const existingDays = new Set(existingSched?.map((s) => s.day_of_week) ?? []);
  const toInsert = SCHEDULE.filter((s) => !existingDays.has(s.day_of_week)).map((s) => ({
    stylist_id: teamUser.id,
    business_id: businessId,
    is_active: true,
    ...s,
  }));
  if (toInsert.length > 0) {
    const { error } = await supabase.from('stylist_schedules').insert(toInsert);
    if (error) throw new Error(`stylist_schedules insert: ${error.message}`);
    console.log(`✅ schedule rows inserted: ${toInsert.length} (Sun-Sat 9am-8pm)`);
  } else {
    console.log('schedule already populated');
  }

  // 6. Link to every active service in Kelatic so the Kelatic Team option
  //    appears for every bookable service.
  const { data: services, error: svcErr } = await supabase
    .from('services')
    .select('id, name')
    .eq('business_id', businessId)
    .eq('is_active', true);
  if (svcErr) throw new Error(`services fetch: ${svcErr.message}`);
  console.log(`Found ${services?.length ?? 0} active services in Kelatic`);

  const { data: existingLinks } = await supabase
    .from('stylist_services')
    .select('service_id')
    .eq('stylist_id', teamUser.id);
  const linkedIds = new Set(existingLinks?.map((l) => l.service_id) ?? []);

  const linksToInsert =
    services
      ?.filter((s) => !linkedIds.has(s.id))
      .map((s) => ({
        stylist_id: teamUser.id,
        service_id: s.id,
        business_id: businessId,
        is_active: true,
      })) ?? [];

  if (linksToInsert.length > 0) {
    const { error } = await supabase.from('stylist_services').insert(linksToInsert);
    if (error) throw new Error(`stylist_services insert: ${error.message}`);
    console.log(`✅ stylist_services linked: ${linksToInsert.length}`);
  } else {
    console.log('stylist_services already linked');
  }

  console.log('\n🎉 Done. Kelatic Team is live as a stylist option.');
  console.log(`   Stylist id: ${teamUser.id}`);
  console.log(`   Profile email (notifications inbox): ${TEAM.email}`);
  console.log(`   Linked to ${services?.length ?? 0} services`);
}

main().catch((e) => {
  console.error('💥', e);
  process.exit(1);
});
