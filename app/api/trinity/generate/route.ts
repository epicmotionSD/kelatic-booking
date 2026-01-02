import { NextRequest, NextResponse } from 'next/server';
import { generateContent, GenerationRequest } from '@/lib/trinity/service';
import { ContentType } from '@/lib/trinity/prompts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.type || !body.topic) {
      return NextResponse.json(
        { error: 'Missing required fields: type and topic' },
        { status: 400 }
      );
    }

    // Validate content type
    const validTypes: ContentType[] = [
      'social',
      'email',
      'blog',
      'video',
      'education',
      'graphics',
      'newsletter',
    ];

    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // TODO: In multi-tenant, get business context from session/request
    const defaultBusinessContext = {
      business: {
        id: 'default',
        name: 'Kelatic',
        slug: 'kelatic',
        email: 'kelatic@gmail.com',
        business_type: 'salon',
        brand_voice: 'professional',
        primary_color: '#f59e0b',
        secondary_color: '#eab308',
      },
      settings: null,
    };

    const request_data: GenerationRequest = {
      type: body.type,
      topic: body.topic,
      context: body.context,
      tone: body.tone,
      targetAudience: body.targetAudience,
      additionalInstructions: body.additionalInstructions,
      businessContext: body.businessContext || defaultBusinessContext,
    };

    const result = await generateContent(request_data);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Trinity generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
