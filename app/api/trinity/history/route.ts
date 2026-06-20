import { NextRequest, NextResponse } from 'next/server';
import { listContentHistory, getContentStats } from '@/lib/agents/modules/content';
import { getTenantContext } from '@/lib/tenant/server';
import type { ContentType } from '@/lib/trinity/prompts';

export const dynamic = 'force-dynamic';

// Thin delegator — backed by the ATTRACT agent's Content Studio module.
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = (searchParams.get('type') as ContentType | null) || undefined;
    const limit = parseInt(searchParams.get('limit') || '10');
    const includeStats = searchParams.get('stats') === 'true';

    // Resolve tenant: explicit ?businessId= wins, then the request's tenant
    // context (subdomain / custom domain), and only then the shared default.
    const tenant = await getTenantContext().catch(() => null);
    const businessId =
      searchParams.get('businessId') || tenant?.business?.id || 'default';
    const generations = await listContentHistory(businessId, type, limit);

    const response: {
      generations: typeof generations;
      stats?: Awaited<ReturnType<typeof getContentStats>>;
    } = { generations };

    if (includeStats) {
      resp