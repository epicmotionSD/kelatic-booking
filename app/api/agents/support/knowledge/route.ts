import { NextRequest, NextResponse } from 'next/server';
import { createSupportAgent } from '@/lib/agents/functional/support';

// GET /api/agents/support/knowledge - Search knowledge base
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const businessId = searchParams.get('businessId');
    const query = searchParams.get('query');
    const category = searchParams.get('category') || undefined;
    const limit = searchParams.get('limit');

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    if (!query) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      );
    }

    const agent = createSupportAgent(businessId);
    const results = await agent.searchKnowledge({
      query,
      category,
      limit: limit ? parseInt(limit) : 5,
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Knowledge search error:', error);
    return NextResponse.json(
      { error: 'Failed to search knowledge base' },
      { status: 500 }
    );
  }
}

// POST /api/agents/support/knowledge - Add knowledge article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, category, question, answer, keywords } = body;

    if (!businessId) {
      return NextResponse.json(
        { error: 'businessId is required' },
        { status: 400 }
      );
    }

    if (!category || !question || !answer) {
      return NextResponse.json(
        { error: 'category, question, and answer are required' },
        { status: 400 }
      );
    }

    const agent = createSupportAgent(businessId);
    const article = await agent.addKnowledgeArticle({
      category,
      question,
      answer,
      keywords,
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    console.error('Add knowledge error:', error);
    return NextResponse.json(
      { error: 'Failed to add knowledge article' },
      { status: 500 }
    );
  }
}

// PATCH /api/agents/support/knowledge - Update article feedback
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessId, articleId, helpful } = body;

    if (!businessId || !articleId || helpful === undefined) {
      return NextResponse.json(
        { error: 'businessId, articleId, and helpful are required' },
        { status: 400 }
      );
    }

    const agent = createSupportAgent(businessId);
    await agent.updateArticleFeedback(articleId, helpful);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}
