import { NextRequest, NextResponse } from 'next/server';
import { createSchedulingAgent } from '@/lib/agents/functional/scheduling';

// GET /api/agents/scheduling - Get scheduling recommendations and insights
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const type = searchParams.get('type');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    const agent = createSchedulingAgent(businessId);

    switch (type) {
      case 'recommendations':
        const recommendations = await agent.getRecommendations();
        return NextResponse.json({ recommendations });

      case 'optimal-slots':
        const clientId = searchParams.get('clientId') || undefined;
        const serviceId = searchParams.get('serviceId') || undefined;
        const preferredDate = searchParams.get('preferredDate') || undefined;
        const slots = await agent.getOptimalSlots({
          clientId,
          serviceId,
          preferredDate,
        });
        return NextResponse.json({ slots });

      default:
        // Return both recommendations and a summary
        const recs = await agent.getRecommendations();
        const atRisk = await agent.getAtRiskAppointments();
        const gaps = await agent.getOpenGaps();

        return NextResponse.json({
          summary: {
            atRiskCount: atRisk.length,
            openGapsCount: gaps.length,
            recommendationsCount: recs.length,
          },
          recommendations: recs.slice(0, 5),
          atRiskAppointments: atRisk.slice(0, 5),
          openGaps: gaps.slice(0, 5),
        });
    }
  } catch (error) {
    console.error('Scheduling agent error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduling data' },
      { status: 500 }
    );
  }
}

// POST /api/agents/scheduling - Execute scheduling task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, taskType, input } = body;

    if (!businessId || !taskType) {
      return NextResponse.json(
        { error: 'businessId and taskType are required' },
        { status: 400 }
      );
    }

    const validTasks = [
      'predict_cancellation',
      'predict_all',
      'analyze_gaps',
      'get_optimal_slots',
      'update_patterns',
      'get_recommendations',
    ];

    if (!validTasks.includes(taskType)) {
      return NextResponse.json(
        { error: `Invalid taskType. Must be one of: ${validTasks.join(', ')}` },
        { status: 400 }
      );
    }

    const agent = createSchedulingAgent(businessId);

    // Create and execute task
    const task = await agent.createTask(taskType, input || {});
    const result = await agent.execute(task);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Execute scheduling task error:', error);
    return NextResponse.json(
      { error: 'Failed to execute task' },
      { status: 500 }
    );
  }
}
