import Anthropic from '@anthropic-ai/sdk';
import { createAdminClient } from '../supabase/client';
import { PROMPTS, ContentType, CONTENT_TYPE_LABELS } from './prompts';

// Lazy initialize to avoid build-time errors
let anthropic: Anthropic | null = null;
function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });
  }
  return anthropic;
}

export interface GenerationRequest {
  type: ContentType;
  topic: string;
  context?: string;
  tone?: 'professional' | 'casual' | 'playful' | 'inspiring';
  targetAudience?: string;
  additionalInstructions?: string;
}

export interface GenerationResult {
  id: string;
  type: ContentType;
  content: string;
  metadata: {
    topic: string;
    generatedAt: string;
    wordCount: number;
  };
}

export async function generateContent(
  request: GenerationRequest
): Promise<GenerationResult> {
  const supabase = createAdminClient();

  const systemPrompt = PROMPTS[request.type];

  const userPrompt = buildUserPrompt(request);

  const response = await getAnthropicClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  );

  const generatedContent = textBlock?.text || '';

  // Save to database
  const { data: saved } = await supabase
    .from('trinity_generations')
    .insert({
      type: request.type,
      prompt: userPrompt,
      output: generatedContent,
      metadata: {
        topic: request.topic,
        tone: request.tone,
        targetAudience: request.targetAudience,
      },
    })
    .select('id')
    .single();

  return {
    id: saved?.id || crypto.randomUUID(),
    type: request.type,
    content: generatedContent,
    metadata: {
      topic: request.topic,
      generatedAt: new Date().toISOString(),
      wordCount: generatedContent.split(/\s+/).length,
    },
  };
}

function buildUserPrompt(request: GenerationRequest): string {
  const parts: string[] = [];

  parts.push(`Create a ${CONTENT_TYPE_LABELS[request.type].toLowerCase()} about: ${request.topic}`);

  if (request.context) {
    parts.push(`\nAdditional context: ${request.context}`);
  }

  if (request.tone) {
    parts.push(`\nTone: ${request.tone}`);
  }

  if (request.targetAudience) {
    parts.push(`\nTarget audience: ${request.targetAudience}`);
  }

  if (request.additionalInstructions) {
    parts.push(`\nSpecial instructions: ${request.additionalInstructions}`);
  }

  // Add type-specific instructions
  switch (request.type) {
    case 'social':
      parts.push('\n\nProvide 3 variations of the post with different angles/hooks.');
      break;
    case 'email':
      parts.push('\n\nInclude: Subject line, Preview text, Email body with CTA.');
      break;
    case 'blog':
      parts.push('\n\nInclude: Meta description, Table of contents, Full article with headers.');
      break;
    case 'video':
      parts.push('\n\nFormat as a scene-by-scene script with timing estimates.');
      break;
    case 'education':
      parts.push('\n\nFormat for easy printing/sharing. Include step-by-step instructions.');
      break;
    case 'graphics':
      parts.push('\n\nProvide: Headline, Subheadline, Bullet points, CTA text.');
      break;
  }

  return parts.join('');
}

export async function getRecentGenerations(
  type?: ContentType,
  limit: number = 10
): Promise<GenerationResult[]> {
  const supabase = createAdminClient();

  let query = supabase
    .from('trinity_generations')
    .select('id, type, output, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (type) {
    query = query.eq('type', type);
  }

  const { data } = await query;

  return (data || []).map((row) => ({
    id: row.id,
    type: row.type as ContentType,
    content: row.output,
    metadata: {
      topic: row.metadata?.topic || '',
      generatedAt: row.created_at,
      wordCount: row.output.split(/\s+/).length,
    },
  }));
}

export async function getGenerationStats(): Promise<{
  totalGenerations: number;
  byType: Record<ContentType, number>;
  thisMonth: number;
}> {
  const supabase = createAdminClient();

  const { count: total } = await supabase
    .from('trinity_generations')
    .select('*', { count: 'exact', head: true });

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count: thisMonth } = await supabase
    .from('trinity_generations')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfMonth.toISOString());

  const { data: typeCounts } = await supabase
    .from('trinity_generations')
    .select('type');

  const byType: Record<ContentType, number> = {
    social: 0,
    email: 0,
    blog: 0,
    video: 0,
    education: 0,
    graphics: 0,
  };

  typeCounts?.forEach((row) => {
    if (row.type in byType) {
      byType[row.type as ContentType]++;
    }
  });

  return {
    totalGenerations: total || 0,
    byType,
    thisMonth: thisMonth || 0,
  };
}
