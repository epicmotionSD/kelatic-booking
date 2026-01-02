// Agents API - Board of Directors members
import { NextRequest, NextResponse } from 'next/server';
import { getAgentService } from '@/lib/agents';

// GET /api/command-center/agents - Get all board members
export async function GET(request: NextRequest) {
  try {
    const service = getAgentService();
    const agents = await service.getBoardMembers();

    return NextResponse.json({
      success: true,
      data: agents,
    });
  } catch (error: any) {
    console.error('Agents API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
