import { NextRequest, NextResponse } from 'next/server';
import {
  createAdminClient,
  createServerSupabaseClient,
} from '@/lib/supabase/client';

// Same shape as the check-slug route -- keep in sync.
const RESERVED_SLUGS = new Set([
  'admin', 'api', 'app', 'auth', 'book', 'dashboard', 'docs', 'get-started',
  'help', 'login', 'mail', 'onboarding', 'platform', 'register', 'reset-password',
  'shop', 'signup', 'staff', 'stripe', 'stylist', 'support', 'tenant', 'tenants',
  'www', 'kelatic', 'vitality', 'kelaticvitalityhouse', 'barbershopblock',
  'barber-block', 'x3o',
]);
const SLUG_PATTERN = /^[a-z][a-z0-9-]{1,30}[a-z0-9]$/;
const VALID_BUSINESS_TYPES = ['salon', 'barbershop', 'spa', 'cafe', 'retail'] as const;
const VALID_TEMPLATES = ['booking', 'commerce'] as const;
const VALID_TONES = ['warm', 'professional', 'playful', 'inspiring'] as const;

type Template = (typeof VALID_TEMPLATES)[number];

interface SignupBody {
  // Account
  ownerFirstName?: string;
  ownerLastName?: string;
  // Business
  slug?: string;
  businessName?: string;
  businessType?: string;
  city?: string;
  state?: string;
  timezone?: string;
  // Template + branding
  template?: Template;
  primaryColor?: string;
  brandVoice?: string;
}

function defaultFeatures(template: Template): Record<string, boolean> {
  if (template === 'commerce') {
    return { ai_content: true, pos_terminal: true, ecommerce: true, newsletter: true };
  }
  return { ai_content: true, pos_terminal: true, online_booking: true, newsletter: true };
}

// POST /api/platform/signup
// Body: { ownerFirstName, ownerLastName, slug, businessName, businessType,
//         city, state, timezone, template, primaryColor, brandVoice }
//
// Requires an authenticated session (from the magic-link callback). Creates
// the businesses + business_settings + business_members rows under the
// service-role client so RLS doesn't block, but only after we've verified
// the auth.uid() of the caller.
export async function POST(request: NextRequest) {
  // 1. Require auth
  const authClient = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: SignupBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 2. Validate input
  const slug = (body.slug ?? '').trim().toLowerCase();
  if (!SLUG_PATTERN.test(slug) || RESERVED_SLUGS.has(slug)) {
    return NextResponse.json({ error: 'Invalid or reserved slug' }, { status: 400 });
  }
  if (!body.businessName || !body.businessName.trim()) {
    return NextResponse.json({ error: 'businessName is required' }, { status: 400 });
  }
  if (!body.businessType || !VALID_BUSINESS_TYPES.includes(body.businessType as never)) {
    return NextResponse.json(
      { error: `businessType must be one of: ${VALID_BUSINESS_TYPES.join(', ')}` },
      { status: 400 }
    );
  }
  const template: Template = VALID_TEMPLATES.includes(body.template as Template)
    ? (body.template as Template)
    : 'booking';
  const brandVoice = VALID_TONES.includes((body.brandVoice ?? 'warm') as never)
    ? (body.brandVoice as string)
    : 'warm';
  const primaryColor = /^#[0-9a-fA-F]{6}$/.test(body.primaryColor ?? '')
    ? body.primaryColor!
    : '#00ffb2';

  const admin = createAdminClient();

  // 3. Slug uniqueness (race-tolerant: the UNIQUE constraint on businesses.slug
  // catches the collision below, but we also check up front for a friendlier error).
  const { data: existingSlug } = await admin
    .from('businesses')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (existingSlug) {
    return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });
  }

  // 4. Block this user from owning more than one business in v1
  const { data: existingOwn } = await admin
    .from('business_members')
    .select('business_id')
    .eq('user_id', user.id)
    .eq('role', 'owner')
    .maybeSingle();
  if (existingOwn) {
    return NextResponse.json(
      { error: 'You already own a business on this account' },
      { status: 409 }
    );
  }

  // 5. Create business
  const { data: business, error: businessError } = await admin
    .from('businesses')
    .insert({
      slug,
      name: body.businessName.trim(),
      email: user.email ?? null,
      city: body.city?.trim() || null,
      state: body.state?.trim() || null,
      timezone: body.timezone || 'America/Chicago',
      primary_color: primaryColor,
      business_type: body.businessType,
      brand_voice: brandVoice,
      features: defaultFeatures(template),
      plan: 'trial',
      is_active: true,
    })
    .select('id, slug, name')
    .single();
  if (businessError || !business) {
    return NextResponse.json(
      { error: `Failed to create business: ${businessError?.message ?? 'unknown'}` },
      { status: 500 }
    );
  }

  // 6. Create business_settings (best-effort -- failure shouldn't roll back
  // the business since the row can be created later via /admin/settings).
  await admin.from('business_settings').insert({
    business_id: business.id,
    ai_tone: brandVoice,
    ai_brand_context: `${business.name} is a ${body.businessType} business.`,
  });

  // 7. Promote the caller to owner
  const { error: memberError } = await admin.from('business_members').insert({
    business_id: business.id,
    user_id: user.id,
    role: 'owner',
  });
  if (memberError) {
    // Roll back the business so the next signup attempt can reuse the slug
    await admin.from('businesses').delete().eq('id', business.id);
    return NextResponse.json(
      { error: `Failed to register owner: ${memberError.message}` },
      { status: 500 }
    );
  }

  // 8. Set the owner's name on their profile if Supabase auto-created one
  if (body.ownerFirstName || body.ownerLastName) {
    await admin
      .from('profiles')
      .update({
        first_name: body.ownerFirstName?.trim() || '',
        last_name: body.ownerLastName?.trim() || '',
        business_id: business.id,
      })
      .eq('id', user.id);
  }

  return NextResponse.json({
    business: {
      id: business.id,
      slug: business.slug,
      name: business.name,
      template,
    },
  });
}
