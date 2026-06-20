import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { requireBusiness } from '@/lib/tenant/server';
import { previewRedemption } from '@/lib/agents/modules/loyalty';

// POST /api/loyalty/redemption-preview
// Body: { email, subtotalCents }
//
// Customer-facing: shows which rewards a checkout cart is eligible to
// redeem. Returns { customerView: null } for unknown emails so the UI can
// hide the section without leaking whether the email exists elsewhere.
export async function POST(request: NextRequest) {
  let business;
  try {
    business = await requireBusiness();
  } catch {
    return NextResponse.json({ customerView: null, eligibleRewards: [] });
  }

  try {
    const body = await request.json();
    const email: string = (body.email ?? '').trim();
    const subtotalCents = Math.max(0, Math.round(body.subtotalCents ?? 0));
    if (!email || subtotalCents <= 0) {
      return NextResponse.json({ customerView: null, eligibleRewards: [] });
    }

    const supabase = createAdminClient();
    const preview = await previewRedemption(supabase, {
      businessId: business.id,
      customerEmail: email,
      subtotalCents,
    });
    return NextResponse.json(preview);
  } catch (error) {
    console.error('Redemption preview error:', error);
    return NextResponse.json({ customerView: null, eligibleRewards: [] });
  }
}
