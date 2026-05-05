#!/usr/bin/env tsx
/**
 * Seed Kyrah Prince as a stylist on Kelatic with her braid services.
 *
 * Pricing comes from the Kelatic team brief. Mid-back length is the
 * starting price; +$50 waist length / +$75 longer-than-waist is noted in
 * the description (no length-selector UI yet — stylist adjusts at checkout).
 *
 * Idempotent: re-running will skip rows that already exist.
 *
 * Usage:  npx tsx scripts/add-kyrah-prince.ts
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

const KYRAH = {
  email: 'kyrahp222@gmail.com',
  first_name: 'Kyrah',
  last_name: 'Prince',
  phone: '+13072210047',
  bio:
    'Braiding specialist — small, smedium, medium and large braids, plus braids over locs.',
  specialties: ['braids', 'protective styles', 'feed-in braids'],
  is_active: true,
  commission_rate: 60.0,
};

// Mon–Sat 9am–6pm. Adjust if Kyrah's hours differ.
const SCHEDULE = [
  { day_of_week: 1, start_time: '09:00', end_time: '18:00' },
  { day_of_week: 2, start_time: '09:00', end_time: '18:00' },
  { day_of_week: 3, start_time: '09:00', end_time: '18:00' },
  { day_of_week: 4, start_time: '09:00', end_time: '18:00' },
  { day_of_week: 5, start_time: '09:00', end_time: '18:00' },
  { day_of_week: 6, start_time: '09:00', end_time: '18:00' },
];

const LENGTH_NOTE =
  'Starting price for mid-back length. +$50 for waist length, +$75 for longer than waist length.';

const SERVICES = [
  {
    name: 'Small Braids',
    description: `Small braids by Kyrah Prince. ${LENGTH_NOTE}`,
    category: 'braids' as const,
    base_price: 300.0,
    duration: 420, // 7 hours
    buffer_time: 15,
    deposit_required: false,
    sort_order: 10,
  },
  {
    name: 'Smedium Braids',
    description: `Smedium braids by Kyrah Prince. ${LENGTH_NOTE}`,
    category: 'braids' as const,
    base_price: 275.0,
    duration: 330, // 5h 30m
    buffer_time: 15,
    deposit_required: false,
    sort_order: 11,
  },
  {
    name: 'Medium Braids',
    description: `Medium braids by Kyrah Prince. ${LENGTH_NOTE}`,
    category: 'braids' as const,
    base_price: 250.0,
    duration: 270, // 4h 30m
    buffer_time: 15,
    deposit_required: false,
    sort_order: 12,
  },
  {
    name: 'Large Braids',
    description: `Large braids by Kyrah Prince. ${LENGTH_NOTE}`,
    category: 'braids' as const,
    base_price: 200.0,
    duration: 120, // 2h
    buffer_time: 15,
    deposit_required: false,
    sort_order: 13,
  },
  {
    name: 'Braids Over Locs',
    description:
      'Braids installed over existing locs by Kyrah Prince. Flat rate.',
    category: 'braids' as const,
    base_price: 300.0,
    duration: 240, // 4h — reasonable default
    buffer_time: 15,
    deposit_required: false,
    sort_order: 14,
  },
];

async function main() {
  console.log('🚀 Adding Kyrah Prince to Kelatic\n');

  // 1. Kelatic business
  const { data: biz, error: bizErr } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', 'kelatic')
    .single();
  if (bizErr || !biz) throw new Error(`Kelatic business not found: ${bizErr?.message}`);
  const businessId = biz.id;
  console.log(`Kelatic business_id: ${businessId}`);

  // 2. Auth user — create if missing
  const { data: usersList } = await supabase.auth.admin.listUsers();
  let kyrahUser = usersList?.users?.find((u) => u.email === KYRAH.email);

  if (!kyrahUser) {
    console.log('Creating auth user (random password — Kyrah does not need to log in)…');
    const tempPassword = randomBytes(24).toString('base64');
    const { data, error } = await supabase.auth.admin.createUser({
      email: KYRAH.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        first_name: KYRAH.first_name,
        last_name: KYRAH.last_name,
        role: 'stylist',
      },
    });
    if (error) throw new Error(`auth.createUser: ${error.message}`);
    kyrahUser = data.user!;
    console.log(`✅ auth user created: ${kyrahUser.id}`);
  } else {
    console.log(`auth user exists: ${kyrahUser.id}`);
  }

  // 3. Profile — upsert
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', kyrahUser.id)
    .maybeSingle();

  if (!existingProfile) {
    const { error } = await supabase.from('profiles').insert({
      id: kyrahUser.id,
      email: KYRAH.email,
      first_name: KYRAH.first_name,
      last_name: KYRAH.last_name,
      phone: KYRAH.phone,
      role: 'stylist',
      bio: KYRAH.bio,
      specialties: KYRAH.specialties,
      is_active: KYRAH.is_active,
      commission_rate: KYRAH.commission_rate,
      business_id: businessId,
    });
    if (error) throw new Error(`profile insert: ${error.message}`);
    console.log('✅ profile created');
  } else {
    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: KYRAH.first_name,
        last_name: KYRAH.last_name,
        phone: KYRAH.phone,
        role: 'stylist',
        bio: KYRAH.bio,
        specialties: KYRAH.specialties,
        is_active: KYRAH.is_active,
        business_id: businessId,
      })
      .eq('id', kyrahUser.id);
    if (error) throw new Error(`profile update: ${error.message}`);
    console.log('✅ profile updated');
  }

  // 4. business_member
  const { data: existingBm } = await supabase
    .from('business_members')
    .select('id')
    .eq('user_id', kyrahUser.id)
    .eq('business_id', businessId)
    .maybeSingle();

  if (!existingBm) {
    const { error } = await supabase.from('business_members').insert({
      user_id: kyrahUser.id,
      business_id: businessId,
      role: 'stylist',
      is_active: true,
    });
    if (error) throw new Error(`business_members insert: ${error.message}`);
    console.log('✅ business_member created');
  } else {
    console.log('business_member exists');
  }

  // 5. Schedule — only insert rows that don't exist (UNIQUE on stylist_id+day_of_week)
  const { data: existingSched } = await supabase
    .from('stylist_schedules')
    .select('day_of_week')
    .eq('stylist_id', kyrahUser.id);
  const existingDays = new Set(existingSched?.map((s) => s.day_of_week) ?? []);
  const toInsert = SCHEDULE.filter((s) => !existingDays.has(s.day_of_week)).map((s) => ({
    stylist_id: kyrahUser.id,
    business_id: businessId,
    is_active: true,
    ...s,
  }));
  if (toInsert.length > 0) {
    const { error } = await supabase.from('stylist_schedules').insert(toInsert);
    if (error) throw new Error(`stylist_schedules insert: ${error.message}`);
    console.log(`✅ schedule rows inserted: ${toInsert.length} (Mon-Sat 9am-6pm)`);
  } else {
    console.log('schedule already populated');
  }

  // 6. Services — insert only if name missing within Kelatic
  const { data: existingServices } = await supabase
    .from('services')
    .select('id, name')
    .eq('business_id', businessId)
    .in(
      'name',
      SERVICES.map((s) => s.name)
    );
  const existingByName = new Map(existingServices?.map((s) => [s.name, s.id]) ?? []);

  const serviceIdByName = new Map<string, string>();
  for (const svc of SERVICES) {
    const existingId = existingByName.get(svc.name);
    if (existingId) {
      serviceIdByName.set(svc.name, existingId);
      console.log(`service exists: ${svc.name}`);
      continue;
    }
    const { data, error } = await supabase
      .from('services')
      .insert({ ...svc, business_id: businessId, is_active: true })
      .select('id')
      .single();
    if (error) throw new Error(`service insert ${svc.name}: ${error.message}`);
    serviceIdByName.set(svc.name, data.id);
    console.log(`✅ service created: ${svc.name}`);
  }

  // 7. stylist_services — link Kyrah to each service
  const { data: existingLinks } = await supabase
    .from('stylist_services')
    .select('service_id')
    .eq('stylist_id', kyrahUser.id);
  const linkedIds = new Set(existingLinks?.map((l) => l.service_id) ?? []);
  const linksToInsert = [...serviceIdByName.values()]
    .filter((sid) => !linkedIds.has(sid))
    .map((service_id) => ({
      stylist_id: kyrahUser.id,
      service_id,
      business_id: businessId,
      is_active: true,
    }));
  if (linksToInsert.length > 0) {
    const { error } = await supabase.from('stylist_services').insert(linksToInsert);
    if (error) throw new Error(`stylist_services insert: ${error.message}`);
    console.log(`✅ stylist_services linked: ${linksToInsert.length}`);
  } else {
    console.log('stylist_services already linked');
  }

  console.log('\n🎉 Done. Kyrah Prince is live on Kelatic.');
  console.log(`   Stylist id: ${kyrahUser.id}`);
  console.log(`   Email: ${KYRAH.email}`);
  console.log(`   Phone: ${KYRAH.phone}`);
  console.log(`   Services: ${SERVICES.map((s) => s.name).join(', ')}`);
}

main().catch((e) => {
  console.error('💥', e);
  process.exit(1);
});
