import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { intelChat } from '@/lib/ai/intel-agents';

const VALID_AGENTS = ['oracle', 'sentinel', 'sage'] as const;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, agent, conversationId } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    if (!agent || !VALID_AGENTS.includes(agent)) {
      return NextResponse.json({ error: 'Valid agent is required (oracle, sentinel, sage)' }, { status: 400 });
    }

    const result = await intelChat(messages, agent, conversationId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Intel chat error:', error);
    return NextResponse.json({ error: 'Failed to process chat message' }, { status: 500 });
  }
}
