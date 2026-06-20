import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { requireAdminBusiness, isGuardErr } from '@/lib/commerce/guard';
import {
  updateReward,
  deleteReward,
  LoyaltyModuleError,
} from '@/lib/agents/modules/loyalty';

// PATCH /api/agents/loyalty/rewards/[id]
// DELETE /api/agents/loyalty/rewards/[id]
// Tenant + admin scoped via requireAdminBusiness; the module helpers enforce
// the program belongs to the current business so we can't cross-edit.

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const supabase = createAdminClient();
    const reward = await updateReward(supabase, {
      businessId: guard.business.id,
      rewardId: id,
      name: body.name,
      description: body.description,
      costPoints: body.costPoints,
      rewardType: body.rewardType,
      serviceId: body.serviceId,
      productId: body.productId,
      config: body.config,
      tierRequired: body.tierRequired,
      isActive: body.isActive,
      sortOrder: body.sortOrder,
    });
    return NextResponse.json({ reward });
  } catch (error) {
    if (error instanceof LoyaltyModuleError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Loyalty reward update error:', error);
    return NextResponse.json(
      { error: 'Failed to update reward' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { id } = await context.params;
    const supabase = createAdminClient();
    await deleteReward(supabase, guard.business.id, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof LoyaltyModuleError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Loyalty reward delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete reward' },
      { status: 500 }
    );
  }
}
