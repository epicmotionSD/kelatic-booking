import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { requireAdminBusiness, isGuardErr } from '@/lib/commerce/guard';
import {
  getOrCreateReferralCode,
  LoyaltyModuleError,
} from '@/lib/agents/modules/loyalty';

// GET /api/agents/loyalty/referrals/code?clientId=<uuid>
// Returns the client's referral code, creating one on first call.
// Admin-only for now -- the customer-facing endpoint will be a separate
// route once the customer surface is built (it'd resolve clientId from
// the signed-in user, not pass it directly).
export async function GET(request: NextRequest) {
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const code = await getOrCreateReferralCode(supabase, guard.business.id, clientId);
    return NextResponse.json({ code });
  } catch (error) {
    if (error instanceof LoyaltyModuleError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Referral code error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral code' },
      { status: 500 }
    );
  }
}
