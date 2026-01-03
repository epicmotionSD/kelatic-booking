import { NextRequest, NextResponse } from 'next/server';
import { createMarketingAgent } from '@/lib/agents/functional/marketing';

// GET /api/agents/marketing/calendar - Get content calendar
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    // Default to current month if no dates provided
    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate
      ? new Date(endDate)
      : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const agent = createMarketingAgent(businessId);
    const calendar = await agent.getContentCalendar(start, end);

    return NextResponse.json({ calendar });
  } catch (error) {
    console.error('Get calendar error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar' },
      { status: 500 }
    );
  }
}

// POST /api/agents/marketing/calendar - Generate AI content calendar
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, month, year, themes, platforms, postsPerWeek, campaignId } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    // Default to next month if not specified
    const targetMonth = month || new Date().getMonth() + 2; // Next month (1-indexed)
    const targetYear = year || new Date().getFullYear();

    const agent = createMarketingAgent(businessId);
    const calendar = await agent.generateContentCalendar({
      month: targetMonth,
      year: targetYear,
      themes: themes || ['seasonal', 'self-care', 'promotions'],
      platforms: platforms || ['instagram', 'facebook'],
      postsPerWeek: postsPerWeek || 3,
      campaignId,
    });

    return NextResponse.json({
      calendar,
      message: `Generated ${calendar.length} content items for ${targetMonth}/${targetYear}`,
    });
  } catch (error) {
    console.error('Generate calendar error:', error);
    return NextResponse.json(
      { error: 'Failed to generate calendar' },
      { status: 500 }
    );
  }
}

// PATCH /api/agents/marketing/calendar - Update calendar item
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, itemId, ...updates } = body;

    if (!businessId || !itemId) {
      return NextResponse.json(
        { error: 'businessId and itemId are required' },
        { status: 400 }
      );
    }

    const agent = createMarketingAgent(businessId);
    await agent.updateCalendarItem(itemId, {
      title: updates.title,
      description: updates.description,
      scheduledDate: updates.scheduledDate ? new Date(updates.scheduledDate) : undefined,
      platforms: updates.platforms,
      status: updates.status,
      tags: updates.tags,
      assignedTo: updates.assignedTo,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update calendar item error:', error);
    return NextResponse.json(
      { error: 'Failed to update calendar item' },
      { status: 500 }
    );
  }
}
