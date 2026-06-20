// Primary Orchestrator API — Attract / Retain / Serve.
//
// GET  /api/agents/orchestrator              → readiness for all three agents
// GET  /api/agents/orchestrator?agent=serve  → readiness for one agent
// POST /api/agents/orchestrator              → route + dispatch an intent or tool
//        body: { intent?, toolId?, businessId?, payload?, query? }
import { NextRequest, NextResponse } from 'next/server';
import {
  getPrimaryOrchestrator,
  type AgentIntent,
  type PrimaryAgentId,
} from '@/lib/agents/primary';

export async function GET(request: NextRequest) {
  try {
    const orchestrator = getPrimaryOrchestrator();
    const agent = request.nextUrl.searchParams.get('agent') as PrimaryAgentId | null;

    if (agent) {
      const readiness = orchestrator.getReadinessFor(agent);
      if (!readiness) {
        return NextResponse.json(
          { success: false, error: `Unknown agent: ${agent}` },
          { status: 404 },
        );
      }
      return NextResponse.json({ success: true, data: readiness });
    }

    return NextResponse.json({ success: true, data: orchestrator.getReadiness() });
  } catch (error: any) {
    console.error('Orchestrator readiness error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { intent, toolId, businessId, payload, query } = body as {
      intent?: AgentIntent;
      toolId?: string;
      businessId?: string | null;
      payload?: Record<string, unknown>;
      query?: Record<string, string>;
    };

    if (!intent && !toolId) {
      return NextResponse.json(
        { success: false, error: 'Provide an `intent` or a `toolId`.' },
        { status: 400 },
      );
    }

    const orchestrator = getPrimaryOrchestrator();
    // Dispatch server-side against this deployment's own origin.
    const ctx = { baseUrl: request.nextUrl.origin, businessId, payload, query };

    const result = intent
      ? await orchestrator.dispatchIntent(intent, ctx)
      : await orchestrator.dispatchTool(toolId as string, ctx);

    return NextResponse.json(
      { success: result.ok, data: result },
      { status: result.ok ? 200 : result.status || 400 },
    );
  } catch (error: any) {
    console.error('Orchestrator dispatch error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
