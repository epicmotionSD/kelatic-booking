import { NextRequest, NextResponse } from 'next/server';
import { createMarketingAgent } from '@/lib/agents/functional/marketing';
import { createAdminClient } from '@/lib/supabase/client';

// GET /api/agents/marketing/campaigns - List campaigns
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const status = searchParams.get('status') as any;

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    const agent = createMarketingAgent(businessId);
    const campaigns = await agent.getCampaigns(status || undefined);

    return NextResponse.json({ campaigns });
  } catch (error) {
    console.error('Get campaigns error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    );
  }
}

// POST /api/agents/marketing/campaigns - Create campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, ...campaignData } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    if (!campaignData.name) {
      return NextResponse.json(
        { error: 'Campaign name is required' },
        { status: 400 }
      );
    }

    const agent = createMarketingAgent(businessId);
    const campaign = await agent.createCampaign({
      name: campaignData.name,
      description: campaignData.description,
      campaignType: campaignData.campaignType || 'multi_channel',
      targetAudience: campaignData.targetAudience,
      goals: campaignData.goals,
      budget: campaignData.budget,
      startDate: campaignData.startDate ? new Date(campaignData.startDate) : undefined,
      endDate: campaignData.endDate ? new Date(campaignData.endDate) : undefined,
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error('Create campaign error:', error);
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

// PATCH /api/agents/marketing/campaigns - Update campaign status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, campaignId, status } = body;

    if (!businessId || !campaignId || !status) {
      return NextResponse.json(
        { error: 'businessId, campaignId, and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const agent = createMarketingAgent(businessId);
    await agent.updateCampaignStatus(campaignId, status);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update campaign error:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}
