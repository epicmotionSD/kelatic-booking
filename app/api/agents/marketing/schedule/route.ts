import { NextRequest, NextResponse } from 'next/server';
import { createMarketingAgent } from '@/lib/agents/functional/marketing';

// GET /api/agents/marketing/schedule - Get scheduled posts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const status = searchParams.get('status') as 'scheduled' | 'published' | 'failed' | undefined;

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    const agent = createMarketingAgent(businessId);
    const posts = await agent.getScheduledPosts(status || undefined);

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Get scheduled posts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scheduled posts' },
      { status: 500 }
    );
  }
}

// POST /api/agents/marketing/schedule - Schedule a new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, campaignId, platform, content, mediaUrls, scheduledFor } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    if (!platform || !content || !scheduledFor) {
      return NextResponse.json(
        { error: 'platform, content, and scheduledFor are required' },
        { status: 400 }
      );
    }

    const validPlatforms = ['instagram', 'facebook', 'twitter', 'email', 'sms'];
    if (!validPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` },
        { status: 400 }
      );
    }

    const agent = createMarketingAgent(businessId);
    const post = await agent.schedulePost({
      campaignId,
      platform,
      content,
      mediaUrls,
      scheduledFor: new Date(scheduledFor),
    });

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Schedule post error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule post' },
      { status: 500 }
    );
  }
}

// PATCH /api/agents/marketing/schedule - Mark post as published/failed
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, postId, action, engagementMetrics, error } = body;

    if (!businessId || !postId || !action) {
      return NextResponse.json(
        { error: 'businessId, postId, and action are required' },
        { status: 400 }
      );
    }

    const agent = createMarketingAgent(businessId);

    if (action === 'publish') {
      await agent.markPostPublished(postId, engagementMetrics);
    } else if (action === 'fail') {
      await agent.markPostFailed(postId, error || 'Unknown error');
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Must be "publish" or "fail"' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update post status error:', error);
    return NextResponse.json(
      { error: 'Failed to update post status' },
      { status: 500 }
    );
  }
}
