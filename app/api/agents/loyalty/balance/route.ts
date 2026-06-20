import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { getLoyaltyBalance } from '@/lib/agents/modules/loyalty';

// GET /api/agents/loyalty/balance?businessId=<uuid>&clientId=<uuid>
// Returns the loyalty balance for a client in the tenant's program.
// 200 with { account: null } if the client has never earned.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const clientId = searchParams.get('clientId');

    if (!businessId || !clientId) {
      return NextResponse.json(
        { error: 'businessId and clientId are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const balance = await getLoyaltyBalance(supabase, businessId, clientId);

    if (!balance) {
      return NextResponse.json({ error: 'No active loyalty program' }, { status: 404 });
    }

    return NextResponse.json({ balance });
  } catch (error) {
    console.error('Loyalty balance error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch loyalty balance' },
      { status: 500 }
    );
  }
}
