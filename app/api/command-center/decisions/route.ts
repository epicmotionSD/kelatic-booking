// Decisions API - Agent decision audit trail
import { NextRequest, NextResponse } from 'next/server';
import { getAgentService } from '@/lib/agents';

// GET /api/command-center/decisions - Get recent decisions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pending = searchParams.get('pending') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    const service = getAgentService();

    let decisions;
    if (pending) {
      decisions = await service.getPendingDecisions();
    } else {
      decisions = await service.getRecentDecisions(limit);
    }

    return NextResponse.json({
      success: true,
      data: decisions,
    });
  } catch (error: any) {
    console.error('Decisions API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/command-center/decisions - Approve or reject a decision
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { decisionId, action, userId, reason } = body;

    if (!decisionId || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing decisionId or action' },
        { status: 400 }
      );
    }

    const service = getAgentService();

    if (action === 'approve') {
      await service.approveDecision(decisionId, userId || 'system');
    } else if (action === 'reject') {
      await service.rejectDecision(decisionId, userId || 'system', reason || 'Rejected');
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Use "approve" or "reject"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { message: `Decision ${action}d successfully` },
    });
  } catch (error: any) {
    console.error('Decision action error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
