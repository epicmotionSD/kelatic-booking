import { NextRequest, NextResponse } from 'next/server';
import { getRecentGenerations, getGenerationStats } from '@/lib/trinity/service';
import { ContentType } from '@/lib/trinity/prompts';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as ContentType | null;
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeStats = searchParams.get('stats') === 'true';

    const generations = await getRecentGenerations(type || undefined, limit);

    const response: {
      generations: typeof generations;
      stats?: Awaited<ReturnType<typeof getGenerationStats>>;
    } = { generations };

    if (includeStats) {
      response.stats = await getGenerationStats();
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Trinity history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
