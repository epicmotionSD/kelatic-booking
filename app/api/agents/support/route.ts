import { NextRequest, NextResponse } from 'next/server';
import { createSupportAgent } from '@/lib/agents/functional/support';

// GET /api/agents/support - Get support metrics and status
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

    const agent = createSupportAgent(businessId);

    switch (type) {
      case 'metrics':
        const metrics = await agent.getMetrics();
        return NextResponse.json(metrics);

      case 'tickets':
        const tickets = await agent.getOpenTickets();
        return NextResponse.json({ tickets });

      default:
        // Return both metrics and open tickets summary
        const allMetrics = await agent.getMetrics();
        const openTickets = await agent.getOpenTickets();

        return NextResponse.json({
          metrics: allMetrics,
          openTickets: openTickets.slice(0, 5),
          openTicketCount: openTickets.length,
        });
    }
  } catch (error) {
    console.error('Support agent error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support data' },
      { status: 500 }
    );
  }
}

// POST /api/agents/support - Execute support task
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
      'chat',
      'search_knowledge',
      'create_ticket',
      'troubleshoot',
      'get_metrics',
      'add_knowledge',
    ];

    if (!validTasks.includes(taskType)) {
      return NextResponse.json(
        { error: `Invalid taskType. Must be one of: ${validTasks.join(', ')}` },
        { status: 400 }
      );
    }

    const agent = createSupportAgent(businessId);

    // For troubleshoot, handle directly
    if (taskType === 'troubleshoot') {
      if (!input?.issue) {
        return NextResponse.json(
          { error: 'issue is required for troubleshooting' },
          { status: 400 }
        );
      }

      const guide = await agent.createTroubleshootingGuide(
        input.issue,
        input.context
      );
      return NextResponse.json({ guide });
    }

    // Create and execute task
    const task = await agent.createTask(taskType, input || {});
    const result = await agent.execute(task);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Execute support task error:', error);
    return NextResponse.json(
      { error: 'Failed to execute task' },
      { status: 500 }
    );
  }
}
