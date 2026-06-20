import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import {
  listRewards,
  createReward,
  LoyaltyModuleError,
} from '@/lib/agents/modules/loyalty';
import type { LoyaltyRewardType } from '@/lib/agents/modules/loyalty';
import { requireAdminBusiness, isGuardErr } from '@/lib/commerce/guard';

const ALLOWED_REWARD_TYPES: LoyaltyRewardType[] = [
  'percent_off',
  'amount_off',
  'free_product',
  'free_service',
  'free_addon',
];

// GET /api/agents/loyalty/rewards?businessId=<uuid>&active=true
// Returns the program's reward catalog. `active=true` filters out disabled
// rewards (use for the customer-facing surface; admin sees everything).
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const activeOnly = searchParams.get('active') === 'true';

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const rewards = await listRewards(supabase, businessId, { activeOnly });

    return NextResponse.json({ rewards });
  } catch (error) {
    console.error('Loyalty rewards error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rewards' },
      { status: 500 }
    );
  }
}

// POST /api/agents/loyalty/rewards
// Body: { name, costPoints, rewardType, description?, serviceId?, productId?, config?, tierRequired?, sortOrder? }
// Admin-only reward creation.
export async function POST(request: NextRequest) {
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body = await request.json();
    const { name, costPoints, rewardType } = body ?? {};
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (!rewardType || typeof rewardType !== 'string') {
      return NextResponse.json({ error: 'rewardType is required' }, { status: 400 });
    }
    if (!ALLOWED_REWARD_TYPES.includes(rewardType as LoyaltyRewardType)) {
      return NextResponse.json(
        { error: `rewardType must be one of: ${ALLOWED_REWARD_TYPES.join(', ')}` },
        { status: 400 }
      );
    }
    if (!Number.isInteger(costPoints) || costPoints < 0) {
      return NextResponse.json(
        { error: 'costPoints must be a non-negative integer' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const reward = await createReward(supabase, {
      businessId: guard.business.id,
      name,
      costPoints,
      rewardType: rewardType as LoyaltyRewardType,
      description: body.description,
      serviceId: body.serviceId,
      productId: body.productId,
      config: body.config,
      tierRequired: body.tierRequired,
      sortOrder: body.sortOrder,
    });
    return NextResponse.json({ reward }, { status: 201 });
  } catch (error) {
    if (error instanceof LoyaltyModuleError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Loyalty reward create error:', error);
    return NextResponse.json(
      { error: 'Failed to create reward' },
      { status: 500 }
    );
  }
}
