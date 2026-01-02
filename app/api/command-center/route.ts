// Command Center API - Board of Directors Dashboard
import { NextRequest, NextResponse } from 'next/server';
import { getOrchestrator, getAgentService } from '@/lib/agents';

// GET /api/command-center - Get full command center summary
export async function GET(request: NextRequest) {
  try {
    const orchestrator = getOrchestrator();
    await orchestrator.initialize();

    const [summary, commandCenterData] = await Promise.all([
      getAgentService().getCommandCenterSummary(),
      orchestrator.getCommandCenterSummary(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...summary,
        orchestrator: commandCenterData.orchestrator,
        recentDecisions: commandCenterData.recentDecisions,
        activeAlerts: commandCenterData.activeAlerts,
        pendingApprovals: commandCenterData.pendingApprovals,
      },
    });
  } catch (error: any) {
    console.error('Command Center API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/command-center - Execute command center actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    const orchestrator = getOrchestrator();
    await orchestrator.initialize();

    let result: any;

    switch (action) {
      case 'start_all':
        await orchestrator.startAll();
        result = { message: 'All agents started' };
        break;

      case 'stop_all':
        await orchestrator.stopAll();
        result = { message: 'All agents stopped' };
        break;

      case 'start_agent':
        await orchestrator.startAgent(params.role);
        result = { message: `Agent ${params.role} started` };
        break;

      case 'stop_agent':
        await orchestrator.stopAgent(params.role);
        result = { message: `Agent ${params.role} stopped` };
        break;

      case 'send_task':
        const task = await orchestrator.sendTaskToAgent(
          params.fromRole || null,
          params.toRole,
          params.taskType,
          params.title,
          params.payload || {},
          { priority: params.priority, description: params.description }
        );
        result = { message: 'Task created', task };
        break;

      case 'approve_decision':
        await orchestrator.approveDecision(params.decisionId, params.approvedBy);
        result = { message: 'Decision approved' };
        break;

      case 'reject_decision':
        await orchestrator.rejectDecision(params.decisionId, params.rejectedBy, params.reason);
        result = { message: 'Decision rejected' };
        break;

      case 'analyze_opportunity':
        await orchestrator.analyzeGrowthOpportunity(params);
        result = { message: 'Analysis task created' };
        break;

      case 'onboard_agency':
        await orchestrator.initiateAgencyOnboarding(params);
        result = { message: 'Onboarding initiated' };
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Command Center action error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
