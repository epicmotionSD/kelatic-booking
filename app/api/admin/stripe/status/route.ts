import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { requireAdminBusiness, isGuardErr } from '@/lib/commerce/guard';
import { fetchAccountSummary } from '@/lib/stripe/connect';

/**
 * GET /api/admin/stripe/status
 *
 * Refreshes the connected-account status from Stripe and writes the
 * derived state back to businesses.stripe_account_status so the next page
 * render shows the correct badge without re-hitting Stripe.
 *
 * Called by the admin settings/payments page on mount (and after the user
 * returns from the Stripe-hosted onboarding flow via ?stripe_return=1).
 */
export async function GET(_request: NextRequest) {
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  if (!guard.business.stripe_account_id) {
    return NextResponse.json({ connected: false });
  }

  try {
    const summary = await fetchAccountSummary(guard.business.stripe_account_id);
    const supabase = createAdminClient();
    await supabase
      .from('businesses')
      .update({ stripe_account_status: summary.status })
      .eq('id', guard.business.id);
    return NextResponse.json({ connected: true, summary });
  } catch (err) {
    console.error('Stripe status refresh error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Stripe error' },
      { status: 500 }
    );
  }
}
