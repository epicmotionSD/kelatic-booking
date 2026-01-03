import { NextRequest, NextResponse } from 'next/server';
import { createSchedulingAgent } from '@/lib/agents/functional/scheduling';

// GET /api/agents/scheduling/gaps - Get open schedule gaps
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const analyze = searchParams.get('analyze') === 'true';

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    const agent = createSchedulingAgent(businessId);

    if (analyze) {
      // Full gap analysis
      const analysis = await agent.analyzeGaps(
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      return NextResponse.json(analysis);
    }

    // Just get open gaps
    const gaps = await agent.getOpenGaps();
    return NextResponse.json({ gaps });
  } catch (error) {
    console.error('Get gaps error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gaps' },
      { status: 500 }
    );
  }
}

// POST /api/agents/scheduling/gaps - Run gap analysis
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, startDate, endDate } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    const agent = createSchedulingAgent(businessId);
    const analysis = await agent.analyzeGaps(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Analyze gaps error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze gaps' },
      { status: 500 }
    );
  }
}

// PATCH /api/agents/scheduling/gaps - Fill a gap
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, gapId, clientId } = body;

    if (!businessId || !gapId || !clientId) {
      return NextResponse.json(
        { error: 'businessId, gapId, and clientId are required' },
        { status: 400 }
      );
    }

    const agent = createSchedulingAgent(businessId);
    await agent.fillGap(gapId, clientId);

    return NextResponse.json({
      success: true,
      message: 'Gap marked as filled',
    });
  } catch (error) {
    console.error('Fill gap error:', error);
    return NextResponse.json(
      { error: 'Failed to fill gap' },
      { status: 500 }
    );
  }
}
