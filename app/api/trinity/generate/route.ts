import { NextRequest, NextResponse } from 'next/server';
import { generateContent, GenerationRequest } from '@/lib/trinity/service';
import {
  BARBER_BLOCK_CONTEXT,
  ContentType,
  LOC_ACADEMY_CONTEXT,
} from '@/lib/trinity/prompts';

function getBrandContext(brand?: string) {
  switch (brand) {
    case 'barber-block':
      return BARBER_BLOCK_CONTEXT;
    case 'loc-academy':
      return LOC_ACADEMY_CONTEXT;
    default:
      return {
        business: {
          id: 'default',
          name: 'Kelatic',
          slug: 'kelatic',
          email: 'info@kelatic.com',
          business_type: 'salon',
          brand_voice: 'professional',
          primary_color: '#f59e0b',
          secondary_color: '#eab308',
        },
        settings: null,
      };
  }
}

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

    const request_data: GenerationRequest = {
      type: body.type,
      topic: body.topic,
      context: body.context,
      tone: body.tone,
      targetAudience: body.targetAudience,
      additionalInstructions: body.additionalInstructions,
      businessContext: body.businessContext || getBrandContext(body.brand),
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
