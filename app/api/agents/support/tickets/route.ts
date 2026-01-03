import { NextRequest, NextResponse } from 'next/server';
import { createSupportAgent } from '@/lib/agents/functional/support';

// GET /api/agents/support/tickets - Get open tickets
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

    const agent = createSupportAgent(businessId);
    const tickets = await agent.getOpenTickets();

    return NextResponse.json({ tickets });
  } catch (error) {
    console.error('Get tickets error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

// POST /api/agents/support/tickets - Create support ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      businessId,
      subject,
      description,
      priority,
      category,
      conversationId,
      userId,
    } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    if (!subject || !description) {
      return NextResponse.json(
        { error: 'subject and description are required' },
        { status: 400 }
      );
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      );
    }

    const agent = createSupportAgent(businessId);
    const ticket = await agent.createTicket({
      subject,
      description,
      priority,
      category,
      conversationId,
      userId,
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

// PATCH /api/agents/support/tickets - Update ticket status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, ticketId, status, resolution } = body;

    if (!businessId || !ticketId || !status) {
      return NextResponse.json(
        { error: 'businessId, ticketId, and status are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['open', 'in_progress', 'waiting', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const agent = createSupportAgent(businessId);
    await agent.updateTicketStatus(ticketId, status, resolution);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update ticket error:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
