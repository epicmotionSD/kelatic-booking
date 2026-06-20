import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/client';
import { requireAdminBusiness, isGuardErr } from '@/lib/commerce/guard';
import { listMembers } from '@/lib/agents/modules/loyalty';

// GET /api/agents/loyalty/members?search=...&limit=...
// Admin-only list of loyalty accounts for the current tenant's program,
// joined to the clients row so the UI can render names/email/phone.
export async function GET(request: NextRequest) {
  const guard = await requireAdminBusiness();
  if (isGuardErr(guard)) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? undefined;
    const limitRaw = searchParams.get('limit');
    const limit = limitRaw ? Math.min(parseInt(limitRaw, 10) || 100, 500) : 100;

    const supabase = createAdminClient();
    const members = await listMembers(supabase, guard.business.id, { search, limit });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Loyalty members error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}
