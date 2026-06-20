import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { requireAdminBusiness, isGuardErr } from '@/lib/commerce/guard';
import {
  applyReferralCode,
  LoyaltyModuleError,
} from '@/lib/agents/modules/loyalty';

// POST /api/agents/loyalty/referrals/apply
// Body: { code, refereeClientId }
// Validates the code, creates a pending referral, and awards the referee's
// signup bonus immediately. The referrer's reward fires later in
// `triggerReferralConversion` when the referee earns from a real paid event.
//
// Admin-guarded today since the only caller is the admin tool. When the
// customer-facing signup flow needs this, we'll add a public-facing
// variant that resolves refereeClientId from the signed-in user.
export async function POST(request: NextRequest) {
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body = await request.json();
    const { code, refereeClientId } = body ?? {};
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'code is required' }, { status: 400 });
    }
    if (!refereeClientId || typeof refereeClientId !== 'string') {
      return NextResponse.json(
        { error: 'refereeClientId is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const result = await applyReferralCode(supabase, {
      businessId: guard.business.id,
      code,
      refereeClientId,
    });
    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof LoyaltyModuleError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Referral apply error:', error);
    return NextResponse.json(
      { error: 'Failed to apply referral code' },
      { status: 500 }
    );
  }
}
