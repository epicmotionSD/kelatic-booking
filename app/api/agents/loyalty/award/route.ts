import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { requireAdminBusiness, isGuardErr } from '@/lib/commerce/guard';
import { awardPoints, LoyaltyModuleError } from '@/lib/agents/modules/loyalty';
import type { LoyaltyReason } from '@/lib/agents/modules/loyalty';

const ALLOWED_REASONS: LoyaltyReason[] = [
  'adjust',
  'referral',
  'signup_bonus',
  'expire',
];

// POST /api/agents/loyalty/award
// Body: { clientId, delta, reason?, note?, metadata? }
// Manual signed award from an owner/admin (referrals, recovery, expirations).
// Earn from paid events is handled by the Stripe webhook, not this route.
export async function POST(request: NextRequest) {
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body = await request.json();
    const { clientId, delta, reason = 'adjust', note, metadata } = body ?? {};

    if (!clientId || typeof clientId !== 'string') {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 });
    }
    if (!Number.isInteger(delta) || delta === 0) {
      return NextResponse.json(
        { error: 'delta must be a non-zero integer' },
        { status: 400 }
      );
    }
    if (!ALLOWED_REASONS.includes(reason)) {
      return NextResponse.json(
        { error: `reason must be one of: ${ALLOWED_REASONS.join(', ')}` },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const result = await awardPoints(supabase, {
      businessId: guard.business.id,
      clientId,
      delta,
      reason,
      note,
      metadata,
      createdBy: guard.userId,
    });

    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof LoyaltyModuleError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Loyalty award error:', error);
    return NextResponse.json(
      { error: 'Failed to award loyalty points' },
      { status: 500 }
    );
  }
}
