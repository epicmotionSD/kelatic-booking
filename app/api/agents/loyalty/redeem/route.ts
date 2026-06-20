import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { requireAdminBusiness, isGuardErr } from '@/lib/commerce/guard';
import { redeemReward, LoyaltyModuleError } from '@/lib/agents/modules/loyalty';

// POST /api/agents/loyalty/redeem
// Body: { clientId, rewardId, orderId?, appointmentId? }
// Validates balance + tier, debits the account, records the redemption,
// and returns the reward shape so the caller can apply the discount to the
// current cart / appointment.
export async function POST(request: NextRequest) {
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body = await request.json();
    const { clientId, rewardId, orderId, appointmentId } = body ?? {};

    if (!clientId || typeof clientId !== 'string') {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }
    if (!rewardId || typeof rewardId !== 'string') {
      return NextResponse.json({ error: 'rewardId is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const result = await redeemReward(supabase, {
      businessId: guard.business.id,
      clientId,
      rewardId,
      orderId,
      appointmentId,
      createdBy: guard.userId,
    });

    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof LoyaltyModuleError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Loyalty redeem error:', error);
    return NextResponse.json(
      { error: 'Failed to redeem reward' },
      { status: 500 }
    );
  }
}
