import { NextRequest, NextResponse } from 'next/server';
import { listContentHistory, getContentStats } from '@/lib/agents/modules/content';
import type { ContentType } from '@/lib/trinity/prompts';

export const dynamic = 'force-dynamic';

// Thin delegator — backed by the ATTRACT agent's Content Studio module.
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = (searchParams.get('type') as ContentType | null) || undefined;
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeStats = searchParams.get('stats') === 'true';

    // TODO: In multi-tenant, get business ID from session
    const defaultBusinessId = 'default';
    const generations = await listContentHistory(defaultBusinessId, type, limit);

    const response: {
      generations: typeof generations;
      stats?: Awaited<ReturnType<typeof getContentStats>>;
    } = { generations };

    if (includeStats) {
      response.stats = await getContentStats(defaultBusinessId);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Trinity history error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}
