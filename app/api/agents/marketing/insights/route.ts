import { NextRequest, NextResponse } from 'next/server';
import { createMarketingAgent } from '@/lib/agents/functional/marketing';

// GET /api/agents/marketing/insights - Get AI-powered marketing insights
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    const agent = createMarketingAgent(businessId);
    const insights = await agent.getMarketingInsights();

    return NextResponse.json({ insights });
  } catch (error) {
    console.error('Get insights error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    );
  }
}
