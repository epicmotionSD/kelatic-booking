#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const managerEmails = [
  'mariah_drake@yahoo.com',
  'bessiewright247@gmail.com',
];

function splitNameFromEmail(email: string) {
  const local = email.split('@')[0] ?? '';
  const cleaned = local.replace(/[._-]+/g, ' ').trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);

  const first = parts[0]
    ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
    : 'Manager';

  const last = parts[1]
    ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1)
    : 'Manager';

  return { firstName: first, lastName: last };
}

function makeTempPassword() {
  const random = Math.random().toString(36).slice(2, 10);
  return `Temp!${random}A1`;
}

async function findAuthUserByEmail(email: string) {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;

    const users = data.users ?? [];
    const found = users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (found) return found;

    if (users.length < perPage) break;
    page += 1;
  }

  return null;
}

async function run() {
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, slug, name')
    .eq('slug', 'kelatic')
    .single();

  if (businessError || !business) {
    throw new Error(`Could not find business with slug 'kelatic': ${businessError?.message ?? 'unknown error'}`);
  }

  console.log(`Using business: ${business.name} (${business.slug}) -> ${business.id}`);

  for (const email of managerEmails) {
    console.log(`\nProcessing ${email}...`);

    const { firstName, lastName } = splitNameFromEmail(email);
    let user = await findAuthUserByEmail(email);
    let tempPassword: string | null = null;

    if (!user) {
      tempPassword = makeTempPassword();

      const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role: 'admin',
        },
      });

      if (createError || !created.user) {
        throw new Error(`Failed to create auth user ${email}: ${createError?.message ?? 'unknown error'}`);
      }

      user = created.user;
      console.log(`- Created auth user: ${user.id}`);
    } else {
      console.log(`- Auth user exists: ${user.id}`);
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          role: 'admin',
          business_id: business.id,
          is_active: true,
        },
        { onConflict: 'id' }
      );

    if (profileError) {
      throw new Error(`Failed to upsert profile for ${email}: ${profileError.message}`);
    }
    console.log('- Profile upserted as admin');

    const { error: membershipError } = await supabase
      .from('business_members')
      .upsert(
        {
          business_id: business.id,
          user_id: user.id,
          role: 'admin',
          is_active: true,
          accepted_at: new Date().toISOString(),
        },
        { onConflict: 'business_id,user_id' }
      );

    if (membershipError) {
      throw new Error(`Failed to upsert business membership for ${email}: ${membershipError.message}`);
    }
    console.log('- business_members upserted as admin');

    if (tempPassword) {
      console.log(`- TEMP PASSWORD for ${email}: ${tempPassword}`);
    }
  }

  console.log('\nDone. Both manager accounts are set as admin.');
}

run().catch((error) => {
  console.error('Failed:', error);
  process.exit(1);
});
