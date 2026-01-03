import { NextRequest, NextResponse } from 'next/server';
import { createMarketingAgent } from '@/lib/agents/functional/marketing';

// POST /api/agents/marketing/generate - Generate AI content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, type, platform, topic, tone } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    if (!type || !topic) {
      return NextResponse.json(
        { error: 'type and topic are required' },
        { status: 400 }
      );
    }

    const validTypes = ['social', 'email', 'promotion'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const agent = createMarketingAgent(businessId);
    const content = await agent.generateContent({
      type,
      platform,
      topic,
      tone,
    });

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Generate content error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
