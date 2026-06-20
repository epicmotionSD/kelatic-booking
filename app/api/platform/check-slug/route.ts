import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';

// Reserved subdomains that can't be used as a tenant slug.
// Mirrors the middleware's special-cased routes + things we want to keep.
const RESERVED_SLUGS = new Set([
  'admin',
  'api',
  'app',
  'auth',
  'book',
  'dashboard',
  'docs',
  'get-started',
  'help',
  'login',
  'mail',
  'onboarding',
  'platform',
  'register',
  'reset-password',
  'shop',
  'signup',
  'staff',
  'stripe',
  'stylist',
  'support',
  'tenant',
  'tenants',
  'www',
  // existing tenant slugs we don't want someone else to claim
  'kelatic',
  'vitality',
  'kelaticvitalityhouse',
  'barbershopblock',
  'barber-block',
  'x3o',
]);

const SLUG_PATTERN = /^[a-z][a-z0-9-]{1,30}[a-z0-9]$/;

/** Normalize an input string into a candidate slug. */
function normalizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

// GET /api/platform/check-slug?slug=foo
// Returns: { slug, available, reason? }
//
// Public route -- used by the onboarding wizard for live availability hints.
// Doesn't leak tenant names: only ever returns true/false for the input.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get('slug') ?? '';
  const slug = normalizeSlug(raw);

  if (!slug) {
    return NextResponse.json({ slug, available: false, reason: 'empty' });
  }
  if (!SLUG_PATTERN.test(slug)) {
    return NextResponse.json({
      slug,
      available: false,
      reason: 'invalid_format',
    });
  }
  if (RESERVED_SLUGS.has(slug)) {
    return NextResponse.json({ slug, available: false, reason: 'reserved' });
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from('businesses')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (data) {
    return NextResponse.json({ slug, available: false, reason: 'taken' });
  }

  return NextResponse.json({ slug, available: true });
}
