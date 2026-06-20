import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { requireAdminBusiness, isGuardErr } from '@/lib/commerce/guard';
import { listReferrals } from '@/lib/agents/modules/loyalty';

const STATUSES = ['pending', 'converted', 'expired'] as const;
type Status = (typeof STATUSES)[number];

// GET /api/agents/loyalty/referrals?status=...&limit=...
// Admin-only list of referrals for the current tenant.
export async function GET(request: NextRequest) {
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const status = STATUSES.includes(statusParam as Status)
      ? (statusParam as Status)
      : undefined;
    const limitRaw = searchParams.get('limit');
    const limit = limitRaw ? Math.min(parseInt(limitRaw, 10) || 50, 500) : 50;

    const supabase = createAdminClient();
    const referrals = await listReferrals(supabase, guard.business.id, {
      status,
      limit,
    });
    return NextResponse.json({ referrals });
  } catch (error) {
    console.error('Referrals list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referrals' },
      { status: 500 }
    );
  }
}
