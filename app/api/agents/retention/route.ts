import { NextRequest, NextResponse } from 'next/server';
import { createRetentionAgent } from '@/lib/agents/functional/retention';

// GET /api/agents/retention - Get retention dashboard and recommendations
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

    const agent = createRetentionAgent(businessId);

    switch (type) {
      case 'dashboard':
        const dashboard = await agent.getDashboard();
        return NextResponse.json(dashboard);

      case 'recommendations':
        const recommendations = await agent.getRecommendations();
        return NextResponse.json({ recommendations });

      case 'at-risk':
        const atRisk = await agent.getAtRiskClients();
        return NextResponse.json({ clients: atRisk });

      case 'vip':
        const vipClients = await agent.getVipClients();
        return NextResponse.json({ clients: vipClients });

      case 'campaigns':
        const campaigns = await agent.getCampaigns();
        return NextResponse.json({ campaigns });

      default:
        // Return dashboard by default
        const defaultDashboard = await agent.getDashboard();
        const defaultRecs = await agent.getRecommendations();
        return NextResponse.json({
          dashboard: defaultDashboard,
          recommendations: defaultRecs.slice(0, 5),
        });
    }
  } catch (error) {
    console.error('Retention agent error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch retention data' },
      { status: 500 }
    );
  }
}

// POST /api/agents/retention - Execute retention task
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
      'calculate_health',
      'calculate_all_health',
      'evaluate_vip',
      'check_triggers',
      'create_campaign',
      'get_recommendations',
    ];

    if (!validTasks.includes(taskType)) {
      return NextResponse.json(
        { error: `Invalid taskType. Must be one of: ${validTasks.join(', ')}` },
        { status: 400 }
      );
    }

    const agent = createRetentionAgent(businessId);

    // Create and execute task
    const task = await agent.createTask(taskType, input || {});
    const result = await agent.execute(task);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Execute retention task error:', error);
    return NextResponse.json(
      { error: 'Failed to execute task' },
      { status: 500 }
    );
  }
}
