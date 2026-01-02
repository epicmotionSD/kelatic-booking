// Tasks API - Agent task queue
import { NextRequest, NextResponse } from 'next/server';
import { getAgentService } from '@/lib/agents';

// GET /api/command-center/tasks - Get pending tasks
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');
    const status = searchParams.get('status') as any;

    const service = getAgentService();

    let tasks;
    if (agentId) {
      tasks = await service.getTasksForAgent(agentId, status || undefined);
    } else {
      tasks = await service.getPendingTasks();
    }

    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error: any) {
    console.error('Tasks API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST /api/command-center/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const service = getAgentService();

    const task = await service.createTask({
      fromAgentId: body.fromAgentId || null,
      toAgentId: body.toAgentId,
      taskType: body.taskType,
      title: body.title,
      description: body.description,
      payload: body.payload || {},
      priority: body.priority || 'medium',
      status: 'pending',
      deadline: body.deadline ? new Date(body.deadline) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error: any) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
