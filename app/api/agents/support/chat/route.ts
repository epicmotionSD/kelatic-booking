import { NextRequest, NextResponse } from 'next/server';
import { createSupportAgent } from '@/lib/agents/functional/support';
import { v4 as uuidv4 } from 'uuid';

// POST /api/agents/support/chat - Handle chat message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, message, sessionId, userId, context } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }

    // Generate session ID if not provided
    const chatSessionId = sessionId || uuidv4();

    const agent = createSupportAgent(businessId);
    const response = await agent.handleChat({
      sessionId: chatSessionId,
      message,
      userId,
      context,
    });

    return NextResponse.json({
      ...response,
      sessionId: chatSessionId,
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
