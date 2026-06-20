import { NextRequest, NextResponse } from 'next/server';
import { runContentGeneration, ContentModuleError } from '@/lib/agents/modules/content';

// Thin delegator — content generation now lives in the ATTRACT agent's
// Content Studio module (lib/agents/modules/content). This route just adapts
// the HTTP request/response around the module tool.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await runContentGeneration({
      type: body.type,
      topic: body.topic,
      context: body.context,
      tone: body.tone,
      targetAudience: body.targetAudience,
      additionalInstructions: body.additionalInstructions,
      brand: body.brand,
      businessContext: body.businessContext,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ContentModuleError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Trinity generation error:', error);
    return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
  }
}
