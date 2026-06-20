import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import {
  getProgramForBusiness,
  updateProgram,
  LoyaltyModuleError,
} from '@/lib/agents/modules/loyalty';
import { requireAdminBusiness, isGuardErr } from '@/lib/commerce/guard';

// GET /api/agents/loyalty/program?businessId=<uuid>
// Returns the active program config (name, currency label, earn rules,
// tiers) so the admin UI and any customer-facing surface can render it.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json({ error: 'businessId is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const program = await getProgramForBusiness(supabase, businessId);

    if (!program) {
      return NextResponse.json({ error: 'No active loyalty program' }, { status: 404 });
    }

    return NextResponse.json({ program });
  } catch (error) {
    console.error('Loyalty program error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program' },
      { status: 500 }
    );
  }
}

// PATCH /api/agents/loyalty/program
// Body: { name?, currencyLabel?, description?, earnRules?, tierConfig?, pointsExpireDays?, isActive? }
// Admin-only update of the active program.
export async function PATCH(request: NextRequest) {
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const body = await request.json();
    const supabase = createAdminClient();
    const program = await updateProgram(supabase, {
      businessId: guard.business.id,
      name: body.name,
      currencyLabel: body.currencyLabel,
      description: body.description,
      earnRules: body.earnRules,
      tierConfig: body.tierConfig,
      pointsExpireDays: body.pointsExpireDays,
      isActive: body.isActive,
    });
    return NextResponse.json({ program });
  } catch (error) {
    if (error instanceof LoyaltyModuleError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Loyalty program update error:', error);
    return NextResponse.json(
      { error: 'Failed to update program' },
      { status: 500 }
    );
  }
}
