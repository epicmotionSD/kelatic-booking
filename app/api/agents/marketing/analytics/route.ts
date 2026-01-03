import { NextRequest, NextResponse } from 'next/server';
import { createMarketingAgent } from '@/lib/agents/functional/marketing';

// GET /api/agents/marketing/analytics - Get campaign analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const campaignId = searchParams.get('campaignId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    const agent = createMarketingAgent(businessId);

    if (campaignId) {
      // Get specific campaign analytics
      const analytics = await agent.getCampaignAnalytics(
        campaignId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined
      );
      return NextResponse.json({ analytics });
    }

    // Get all campaigns with their performance
    const campaigns = await agent.getCampaigns();
    const performances = await Promise.all(
      campaigns.slice(0, 10).map(async (campaign) => {
        try {
          return await agent.analyzeCampaign(campaign.id);
        } catch {
          return null;
        }
      })
    );

    return NextResponse.json({
      campaigns: performances.filter(Boolean),
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// POST /api/agents/marketing/analytics - Record analytics data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessId,
      campaignId,
      date,
      impressions,
      clicks,
      conversions,
      revenue,
      cost,
      metadata,
    } = body;

    if (!businessId || !campaignId) {
      return NextResponse.json(
        { error: 'businessId and campaignId are required' },
        { status: 400 }
      );
    }

    const agent = createMarketingAgent(businessId);
    await agent.recordAnalytics(campaignId, {
      date: date ? new Date(date) : new Date(),
      impressions: impressions || 0,
      clicks: clicks || 0,
      conversions: conversions || 0,
      revenue: revenue || 0,
      cost: cost || 0,
      metadata,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Record analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to record analytics' },
      { status: 500 }
    );
  }
}
