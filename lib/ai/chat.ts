import Anthropic from '@anthropic-ai/sdk';
import { getAvailability, createBooking } from '../booking/service';
import { createAdminClient } from '../supabase/client';

// Lazy initialize to avoid build-time errors
let anthropicClient: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }
  return anthropicClient;
}

// ============================================
// SYSTEM PROMPT
// ============================================

const SYSTEM_PROMPT = `You are Kela, the friendly AI assistant for KeLatic Hair Lounge, a Black-owned hair salon specializing in locs, braids, and natural hair care.

Your role is to:
- Answer questions about services, pricing, and availability
- Help clients book, reschedule, or cancel appointments
- Provide basic hair care advice
- Be warm, professional, and reflect the welcoming vibe of the salon

Key information:
- Location: [SALON ADDRESS]
- Hours: Tuesday-Saturday, 9am-6pm (closed Sunday-Monday)
- Walk-ins welcome but appointments recommended for longer services
- Deposits required for services over 2 hours to secure appointments

When helping with bookings:
1. First ask what service they're interested in
2. Ask if they have a preferred stylist (or any available)
3. Check availability and offer options
4. Collect their information if they're a new client
5. Confirm the booking details

Be conversational and helpful. If you don't know something specific, offer to have someone from the salon follow up.`;

// ============================================
// TOOLS FOR CLAUDE
// ============================================

const tools: Anthropic.Tool[] = [
  {
    name: 'get_services',
    description: 'Get list of all services offered at the salon with pricing and duration',
    input_schema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category: locs, braids, natural, silk_press, treatments, or all',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_availability',
    description: 'Check available appointment times for a specific service and date',
    input_schema: {
      type: 'object' as const,
      properties: {
        service_id: {
          type: 'string',
          description: 'The ID of the service',
        },
        date: {
          type: 'string',
          description: 'Date to check in YYYY-MM-DD format',
        },
        stylist_id: {
          type: 'string',
          description: 'Optional specific stylist ID',
        },
      },
      required: ['service_id', 'date'],
    },
  },
  {
    name: 'get_stylists',
    description: 'Get list of stylists and their specialties',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'create_booking',
    description: 'Create a new appointment booking',
    input_schema: {
      type: 'object' as const,
      properties: {
        service_id: {
          type: 'string',
          description: 'The service being booked',
        },
        stylist_id: {
          type: 'string',
          description: 'The stylist for the appointment',
        },
        start_time: {
          type: 'string',
          description: 'Appointment start time in ISO format',
        },
        client_name: {
          type: 'string',
          description: 'Client name (for new clients)',
        },
        client_email: {
          type: 'string',
          description: 'Client email',
        },
        client_phone: {
          type: 'string',
          description: 'Client phone number',
        },
        notes: {
          type: 'string',
          description: 'Any special requests or notes',
        },
      },
      required: ['service_id', 'stylist_id', 'start_time', 'client_email'],
    },
  },
];

// ============================================
// TOOL HANDLERS
// ============================================

async function handleToolCall(
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<string> {
  const supabase = createAdminClient();

  switch (toolName) {
    case 'get_services': {
      let query = supabase
        .from('services')
        .select('id, name, description, category, base_price, duration, deposit_required, deposit_amount')
        .eq('is_active', true)
        .order('category')
        .order('sort_order');

      if (toolInput.category && toolInput.category !== 'all') {
        query = query.eq('category', toolInput.category);
      }

      const { data: services } = await query;

      if (!services?.length) {
        return 'No services found.';
      }

      return services
        .map(
          (s) =>
            `${s.name} (${s.category}): $${s.base_price} - ${s.duration} mins${
              s.deposit_required ? ` (Deposit: $${s.deposit_amount})` : ''
            }\nID: ${s.id}\n${s.description || ''}`
        )
        .join('\n\n');
    }

    case 'get_availability': {
      const availability = await getAvailability({
        service_id: toolInput.service_id as string,
        stylist_id: toolInput.stylist_id as string | undefined,
        date: toolInput.date as string,
      });

      const availableSlots = availability.slots.filter((s) => s.available);

      if (!availableSlots.length) {
        return `No availability on ${availability.date}. Would you like to check another date?`;
      }

      return `Available times on ${availability.date}:\n${availableSlots
        .map(
          (s) =>
            `- ${formatTime(s.start_time)} with ${s.stylist_name}`
        )
        .join('\n')}`;
    }

    case 'get_stylists': {
      const { data: stylists } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, bio, specialties')
        .eq('role', 'stylist')
        .eq('is_active', true);

      if (!stylists?.length) {
        return 'No stylists found.';
      }

      return stylists
        .map(
          (s) =>
            `${s.first_name} ${s.last_name}\nID: ${s.id}\n${s.bio || ''}\nSpecializes in: ${
              s.specialties?.join(', ') || 'All services'
            }`
        )
        .join('\n\n');
    }

    case 'create_booking': {
      // For now, return a summary - actual booking requires client authentication
      return `Booking request received:
- Service: ${toolInput.service_id}
- Stylist: ${toolInput.stylist_id}  
- Time: ${formatTime(toolInput.start_time as string)}
- Contact: ${toolInput.client_email}
${toolInput.notes ? `- Notes: ${toolInput.notes}` : ''}

To complete this booking, the client will need to confirm via the booking link sent to their email.`;
    }

    default:
      return `Unknown tool: ${toolName}`;
  }
}

// ============================================
// CHAT FUNCTION
// ============================================

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function chat(
  messages: ChatMessage[],
  conversationId?: string
): Promise<{ response: string; conversationId: string }> {
  const supabase = createAdminClient();

  // Create or get conversation
  let convId: string = conversationId || '';
  if (!convId) {
    const { data } = await supabase
      .from('chat_conversations')
      .insert({ session_id: crypto.randomUUID() })
      .select('id')
      .single();
    convId = data?.id || crypto.randomUUID();
  }

  // Format messages for Claude
  const claudeMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Initial API call
  let response = await getAnthropicClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools,
    messages: claudeMessages,
  });

  // Handle tool use
  while (response.stop_reason === 'tool_use') {
    const toolUseBlock = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
    );

    if (!toolUseBlock) break;

    const toolResult = await handleToolCall(
      toolUseBlock.name,
      toolUseBlock.input as Record<string, unknown>
    );

    // Continue conversation with tool result
    claudeMessages.push({
      role: 'assistant',
      content: response.content,
    });

    claudeMessages.push({
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: toolUseBlock.id,
          content: toolResult,
        },
      ],
    });

    response = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools,
      messages: claudeMessages,
    });
  }

  // Extract text response
  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  );

  const responseText = textBlock?.text || 'I apologize, I had trouble processing that. Could you try again?';

  // Save messages to database
  await supabase.from('chat_messages').insert([
    {
      conversation_id: convId,
      role: 'user',
      content: messages[messages.length - 1].content,
    },
    {
      conversation_id: convId,
      role: 'assistant',
      content: responseText,
    },
  ]);

  return {
    response: responseText,
    conversationId: convId,
  };
}

// ============================================
// HELPERS
// ============================================

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
