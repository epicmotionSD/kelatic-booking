import Anthropic from '@anthropic-ai/sdk';
import { getAvailability } from '../booking/service';
import { createAdminClient } from '../supabase/client';
import { requireBusiness } from '@/lib/tenant/server';

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

const SYSTEM_PROMPT = `You are Kela, the friendly AI assistant for KeLatic Hair Lounge, Houston's premier loc specialists. Founded by "The Loc Gawd" with 15+ years of experience.

IMPORTANT: KeLatic specializes in LOCS ONLY. We are loc specialists - we do NOT offer braids, silk press, or general natural hair styling. Our barbers (Barber Block) do offer cuts and fades.

Your role is to:
- Answer questions about loc services, pricing, and availability
- Help clients book, reschedule, or cancel appointments
- Provide loc care advice and tips
- Be warm, professional, and reflect the welcoming vibe of the salon

Key information:
- Location: 9430 Richmond Ave, Houston, TX 77063
- Phone: (713) 485-4000
- Email: kelatic@gmail.com
- Instagram: @kelatic_
- Hours: Monday-Friday 9am-6pm, Saturday 9am-5pm (closed Sunday)
- Walk-ins welcome but appointments recommended for longer services
- Deposits required for services over 2 hours to secure appointments
- $75 Wednesday Special for loc retwists!

Popular loc services:
- Loc Retwist: $75-125 (90 min)
- Starter Locs: $200-900 (3+ hrs)
- Loc Clarifying Treatment: $150 (2 hrs)
- Loc Repair/Reconstruction: varies
- Loc Styling (updos, etc): varies

Barber Block services (for cuts):
- Fades, lineups, and men's cuts available

When helping with bookings:
1. First ask what service they're interested in
2. Ask if they have a preferred stylist (or any available)
3. Check availability and offer options
4. Collect their information if they're a new client
5. Confirm the booking details

Be conversational and helpful. Use the tools available to look up real-time service info and availability. If you don't know something specific, offer to have someone from the salon follow up.

If someone asks about braids, silk press, or other non-loc services, politely let them know we specialize in locs only.

Formatting guidelines:
- Keep responses concise and scannable
- When listing services, don't repeat everything verbatim - summarize or highlight what's relevant
- NO markdown formatting (no ##, **, etc) - this is plain text chat
- Use simple bullet points (•) or dashes (-) for lists
- Avoid emojis except sparingly
- The [id:xxx] in tool results is for your internal use when booking - never show IDs to clients`;

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

      // Group services by category for cleaner output
      const grouped: Record<string, typeof services> = {};
      for (const s of services) {
        if (!grouped[s.category]) grouped[s.category] = [];
        grouped[s.category].push(s);
      }

      const categoryNames: Record<string, string> = {
        locs: 'Locs',
        braids: 'Braids',
        natural: 'Natural Hair',
        silk_press: 'Silk Press',
        treatments: 'Treatments',
      };

      return Object.entries(grouped)
        .map(([cat, items]) => {
          const title = categoryNames[cat] || cat;
          const list = items
            .map((s) => `• ${s.name} – $${s.base_price} (${Math.round(s.duration / 60 * 10) / 10}hrs) [id:${s.id}]`)
            .join('\n');
          return `${title}:\n${list}`;
        })
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
      const business = await requireBusiness();
      const supabase = createAdminClient();

      const clientEmail = String(toolInput.client_email || '').toLowerCase();
      const clientPhone = toolInput.client_phone ? String(toolInput.client_phone) : null;
      const clientName = String(toolInput.client_name || '').trim();
      const [firstName, ...lastParts] = clientName.split(' ');
      const lastName = lastParts.join(' ') || 'Client';

      if (!clientEmail || !toolInput.service_id || !toolInput.stylist_id || !toolInput.start_time) {
        return 'I still need the service, stylist, time, and email to complete your booking.';
      }

      const { data: service } = await supabase
        .from('services')
        .select('id, name, duration, base_price, deposit_required')
        .eq('id', toolInput.service_id)
        .eq('business_id', business.id)
        .single();

      if (!service) {
        return 'That service is no longer available. Want me to check another option?';
      }

      const startTime = new Date(String(toolInput.start_time));
      const endTime = new Date(startTime.getTime() + service.duration * 60000);

      const { data: conflicts } = await supabase
        .from('appointments')
        .select('id')
        .eq('stylist_id', toolInput.stylist_id)
        .eq('business_id', business.id)
        .lt('start_time', endTime.toISOString())
        .gt('end_time', startTime.toISOString())
        .not('status', 'in', '("cancelled","no_show")')
        .limit(1);

      if (conflicts?.length) {
        return 'That time just got booked. Want me to find the next available slot?';
      }

      let clientId: string | null = null;

      const { data: existingClient } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', clientEmail)
        .eq('business_id', business.id)
        .single();

      if (existingClient) {
        clientId = existingClient.id;
        if (clientPhone) {
          await supabase.from('profiles').update({ phone: clientPhone }).eq('id', clientId);
        }
      } else {
        const { data: newClient } = await supabase
          .from('profiles')
          .insert({
            first_name: firstName || 'Client',
            last_name: lastName,
            email: clientEmail,
            phone: clientPhone,
            role: 'client',
            business_id: business.id,
          })
          .select('id')
          .single();

        if (newClient?.id) {
          clientId = newClient.id;
        }
      }

      const appointmentData: Record<string, any> = {
        service_id: toolInput.service_id,
        stylist_id: toolInput.stylist_id,
        business_id: business.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        quoted_price: service.base_price,
        client_notes: toolInput.notes ? String(toolInput.notes) : null,
        status: service.deposit_required ? 'pending' : 'confirmed',
      };

      if (clientId) {
        appointmentData.client_id = clientId;
      } else {
        appointmentData.is_walk_in = true;
        appointmentData.walk_in_name = clientName || 'Client';
        appointmentData.walk_in_email = clientEmail;
        appointmentData.walk_in_phone = clientPhone;
      }

      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert(appointmentData)
        .select('id')
        .single();

      if (error || !appointment) {
        return 'I had trouble booking that slot. Want me to try another time?';
      }

      const bookingUrl = process.env.PUBLIC_BOOKING_URL || 'https://kelatic.com/book';

      return `You’re booked! I reserved your ${service.name} for ${formatTime(startTime.toISOString())}.

If a deposit is required, we’ll send you a confirmation email with next steps. You can also manage or update your appointment here: ${bookingUrl}`;
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
