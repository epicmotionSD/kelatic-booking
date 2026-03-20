import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

let anthropic: Anthropic | null = null;
function getClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return anthropic;
}

const SYSTEM_PROMPT = `You are the Kelatic AI Business Operator — an intelligent advisor embedded inside the Kelatic Hair Lounge admin dashboard. You have full context on this business and act like a smart, fast-thinking COO.

BUSINESS CONTEXT:
- Kelatic Hair Lounge | Houston, TX | 9430 Richmond Ave
- Specialty: Locs ONLY (no braids, no silk press, no general natural hair)
- Brand: "The Loc Gawd" — premium, professional, community-rooted
- Team: 2 Content Managers (Manager 1 handles Social & Video, Manager 2 handles Email & Blog)
- AI Tools: Trinity content suite powered by Claude
- Stack: Next.js + Supabase + Stripe + Amelia booking + Vercel

YOUR 6 OPERATING DOMAINS:
1. Social Intelligence — engagement patterns, best post times, platform performance
2. Competitor Radar — market positioning vs other Houston loc salons
3. Campaign Analytics — ROI on email/SMS campaigns, conversion rates
4. Booking Funnel AI — where clients drop off, recovery tactics, no-show patterns
5. Content Engine — content calendar strategy, what to post and when
6. Client Re-engagement — lapsed clients, win-back messaging, loyalty signals

RESPONSE STYLE:
- Direct, concise, and action-oriented — like a sharp operator, not a generic chatbot
- Use numbers and specifics when you have them
- Lead with the answer, then explain
- When suggesting content or copy, actually write it
- For tactical tasks (assigning to managers, scheduling posts), be explicit about who does what
- Keep responses under 250 words unless writing actual copy/scripts
- Use markdown for structure when helpful (headers, bullets, bold)

You can help with: analyzing metrics, writing content, scheduling strategy, client follow-up scripts, competitor positioning, operational decisions, and anything else running this business requires.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, snapshot } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response('Bad request', { status: 400 });
    }

    // Inject snapshot context as first assistant turn if provided
    const contextualMessages = snapshot
      ? [
          {
            role: 'user' as const,
            content: `[BUSINESS SNAPSHOT — use this as current context]\n${JSON.stringify(snapshot, null, 2)}`,
          },
          {
            role: 'assistant' as const,
            content: 'Got it — I have your current business snapshot loaded. What do you need?',
          },
          ...messages,
        ]
      : messages;

    const stream = await getClient().messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: contextualMessages,
    });

    // Stream SSE back to client
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const data = JSON.stringify({ text: event.delta.text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (e) {
          controller.error(e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (err) {
    console.error('[insights/chat] Error:', err);
    return new Response('Internal server error', { status: 500 });
  }
}
