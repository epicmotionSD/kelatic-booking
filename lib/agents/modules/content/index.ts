// Content Module — a tool/module owned by the ATTRACT primary agent.
//
// This is the home for what used to live inline in the Trinity routes.
// Trinity's content generation, history, and stats are now exposed here as
// reusable tools so any agent surface (API route, orchestrator, future UI)
// can call them the same way. The Trinity API routes delegate to this module.

import {
  generateContent,
  getRecentGenerations,
  getGenerationStats,
  type GenerationRequest,
  type GenerationResult,
} from '@/lib/trinity/service';
import {
  BARBER_BLOCK_CONTEXT,
  KELATIC_DEFAULT_CONTEXT,
  LOC_ACADEMY_CONTEXT,
  type BusinessContext,
  type ContentType,
} from '@/lib/trinity/prompts';

/** A typed error the API layer can translate into an HTTP status. */
export class ContentModuleError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ContentModuleError';
    this.status = status;
  }
}

export const CONTENT_TYPES: ContentType[] = [
  'social',
  'email',
  'blog',
  'video',
  'education',
  'graphics',
  'newsletter',
];

/** Resolve a brand slug to its content/business context. */
export function resolveBrandContext(brand?: string): BusinessContext {
  switch (brand) {
    case 'barber-block':
      return BARBER_BLOCK_CONTEXT;
    case 'loc-academy':
      return LOC_ACADEMY_CONTEXT;
    default:
      return KELATIC_DEFAULT_CONTEXT;
  }
}

export interface ContentGenerateInput {
  type: ContentType;
  topic: string;
  context?: string;
  tone?: 'professional' | 'casual' | 'playful' | 'inspiring';
  targetAudience?: string;
  additionalInstructions?: string;
  /** Brand slug used to resolve a default business context. */
  brand?: string;
  /** Explicit business context overrides `brand`. */
  businessContext?: BusinessContext;
}

// ============================================================
// TOOLS
// ============================================================

/** Tool: generate a piece of content. Validates input, then runs Trinity. */
export async function runContentGeneration(
  input: ContentGenerateInput
): Promise<GenerationResult> {
  if (!input.type || !input.topic) {
    throw new ContentModuleError('Missing required fields: type and topic');
  }
  if (!CONTENT_TYPES.includes(input.type)) {
    throw new ContentModuleError(
      `Invalid type. Must be one of: ${CONTENT_TYPES.join(', ')}`
    );
  }

  const request: GenerationRequest = {
    type: input.type,
    topic: input.topic,
    context: input.context,
    tone: input.tone,
    targetAudience: input.targetAudience,
    additionalInstructions: input.additionalInstructions,
    businessContext: input.businessContext || resolveBrandContext(input.brand),
  };

  return generateContent(request);
}

/** Tool: list recent generated content for a business. */
export async function listContentHistory(
  businessId: string,
  type?: ContentType,
  limit = 10
) {
  return getRecentGenerations(businessId, type, limit);
}

/** Tool: aggregate content stats for a business. */
export async function getContentStats(businessId: string) {
  return getGenerationStats(businessId);
}

// ============================================================
// MODULE MANIFEST (consumed by the primary-agent registry)
// ============================================================

export const contentModuleManifest = {
  id: 'content',
  name: 'Content Studio',
  description:
    'On-brand content creation (formerly Trinity): social posts, emails, blogs, video scripts, newsletters, and the content calendar.',
  icon: 'sparkles',
  adminPath: '/admin/trinity',
  tools: [
    { id: 'content.generate', name: 'Generate content', endpoint: '/api/trinity/generate', method: 'POST', action: 'generate-content' },
    { id: 'content.history', name: 'Content history', endpoint: '/api/trinity/history', method: 'GET' },
    { id: 'content.insights', name: 'Content insights', endpoint: '/api/trinity/insights', method: 'GET' },
  ],
} as const;
