import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { requireAdminBusiness, isGuardErr } from '@/lib/commerce/guard';
import {
  createConnectExpressAccount,
  createOnboardingAccountLink,
} from '@/lib/stripe/connect';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'x3o.ai';

/**
 * POST /api/admin/stripe/connect
 *
 * Idempotent start-or-resume of the Stripe Connect Express onboarding flow.
 * - If the business already has a stripe_account_id, mints a fresh
 *   AccountLink (existing links expire ~5 min).
 * - Otherwise, creates an Express account first, persists the id, then mints
 *   the link.
 *
 * Returns { url } — the client redirects there. Stripe sends the user back
 * to /admin/settings/payments when they finish (or abandon).
 */
export async function POST(_request: NextRequest) {
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const business = guard.business;
  const supabase = createAdminClient();

  try {
    let accountId = business.stripe_account_id ?? null;

    if (!accountId) {
      accountId = await createConnectExpressAccount({
        email: business.email,
        businessName: business.name,
      });
      const { error } = await supabase
        .from('businesses')
        .update({
          stripe_account_id: accountId,
          stripe_account_status: 'pending',
        })
        .eq('id', business.id);
      if (error) {
        return NextResponse.json(
          { error: `Failed to persist Stripe account: ${error.message}` },
          { status: 500 }
        );
      }
    }

    const baseUrl = businessBaseUrl(business);
    const url = await createOnboardingAccountLink({
      accountId,
      refreshUrl: `${baseUrl}/admin/settings/payments?stripe_refresh=1`,
      returnUrl: `${baseUrl}/admin/settings/payments?stripe_return=1`,
    });

    return NextResponse.json({ url });
  } catch (err) {
    console.error('Stripe Connect onboarding error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Stripe error' },
      { status: 500 }
    );
  }
}

function businessBaseUrl(business: {
  slug: string;
  custom_domain?: string | null;
  custom_domain_verified?: boolean | null;
}): string {
  if (business.custom_domain && business.custom_domain_verified) {
    return `https://${business.custom_domain}`;
  }
  return `https://${business.slug}.${ROOT_DOMAIN}`;
}
