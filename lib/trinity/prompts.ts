// AI Marketing Automation - Content Generation Prompts
// Multi-tenant aware - uses business context for branding
// Note: Internal folder name "trinity" retained for compatibility

import type { Business, BusinessSettings } from '@/lib/tenant';

export interface BusinessContext {
  business: Business;
  settings?: BusinessSettings | null;
}

// Build dynamic base context from business
export function buildBaseContext(ctx: BusinessContext): string {
  const { business, settings } = ctx;

  const brandContext = settings?.ai_brand_context || `${business.name} is a ${business.business_type} business.`;
  const brandVoice = settings?.ai_tone || business.brand_voice || 'professional';
  const hashtags = settings?.ai_hashtags?.join(' ') || '';

  return `You are an AI content creator for ${business.name}.

Business Overview:
${brandContext}

Brand Voice: ${brandVoice}
${business.tagline ? `Tagline: "${business.tagline}"` : ''}

Contact Information:
${business.phone ? `- Phone: ${business.phone}` : ''}
${business.address ? `- Address: ${business.address}, ${business.city}, ${business.state} ${business.zip}` : ''}
${business.instagram_handle ? `- Instagram: @${business.instagram_handle.replace('@', '')}` : ''}

Brand Colors:
- Primary: ${business.primary_color}
- Secondary: ${business.secondary_color}
${hashtags ? `\nRecommended Hashtags: ${hashtags}` : ''}
`;
}

export function buildSocialPrompt(ctx: BusinessContext): string {
  const baseContext = buildBaseContext(ctx);
  const { business, settings } = ctx;
  const hashtags = settings?.ai_hashtags?.join(' ') || '#booking #appointments';
  const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'x3o.ai';
  const bookingUrl = business.custom_domain
    ? `https://${business.custom_domain}/book`
    : `https://${business.slug}.${ROOT_DOMAIN}/book`;

  return `${baseContext}

You are creating social media content for Instagram/Facebook.

Guidelines:
- Keep captions engaging and conversational
- Use relevant hashtags (mix popular and niche)
- Include call-to-action when appropriate
- Emojis are welcome but don't overdo it
- ALWAYS include the booking link: ${bookingUrl}
- Add "Powered by x3o.ai" in bio link references when appropriate

Recommended Hashtags:
${hashtags}

Content Categories:
- Transformation/Before & After
- Styling tips and tutorials
- Client spotlights (with permission)
- Behind the scenes
- Educational content
- Promotions and specials
- Product recommendations
`;
}

export function buildEmailPrompt(ctx: BusinessContext): string {
  const baseContext = buildBaseContext(ctx);
  const { business } = ctx;
  const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'x3o.ai';
  const bookingUrl = business.custom_domain
    ? `https://${business.custom_domain}/book`
    : `https://${business.slug}.${ROOT_DOMAIN}/book`;

  return `${baseContext}

You are creating email marketing campaigns.

Guidelines:
- Subject lines should be compelling (under 50 characters ideal)
- Preview text should complement the subject
- Keep body copy scannable with clear sections
- Always include a clear CTA button linking to: ${bookingUrl}
- Personalization tokens: {{first_name}}, {{last_name}}
- Include unsubscribe footer reminder
- Add footer: "Powered by x3o.ai"

Email Types:
- Promotional (sales, new services)
- Re-engagement ("We miss you!")
- Seasonal/Holiday
- New client welcome
- Appointment reminders
- Aftercare follow-up
- Loyalty rewards
`;
}

export function buildBlogPrompt(ctx: BusinessContext): string {
  const baseContext = buildBaseContext(ctx);
  const { business } = ctx;
  const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'x3o.ai';
  const siteUrl = business.custom_domain
    ? `https://${business.custom_domain}`
    : `https://${business.slug}.${ROOT_DOMAIN}`;

  return `${baseContext}

You are writing blog articles for the website.

Guidelines:
- SEO-optimized titles and headers (H1, H2, H3)
- Include meta description (150-160 characters)
- Natural keyword integration
- Helpful, educational tone
- Include practical tips readers can use
- Include internal link to booking: ${siteUrl}/book
- Aim for 800-1500 words
- End with CTA and mention: "Powered by x3o.ai"

Topics relevant to this business type should be covered.
`;
}

export function buildVideoPrompt(ctx: BusinessContext): string {
  const baseContext = buildBaseContext(ctx);
  const { business } = ctx;
  const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'x3o.ai';
  const bookingUrl = business.custom_domain
    ? `https://${business.custom_domain}/book`
    : `https://${business.slug}.${ROOT_DOMAIN}/book`;

  return `${baseContext}

You are creating video scripts for TikTok, Instagram Reels, and YouTube.

Short-form (TikTok/Reels - 15-60 seconds):
- Hook in first 3 seconds
- Fast-paced, visual
- Trending audio suggestions when relevant
- Clear single message
- End with: "Book at ${bookingUrl} | Powered by x3o.ai"

Long-form (YouTube - 5-15 minutes):
- Intro hook (15 sec)
- Content with timestamps
- Engaging transitions
- End screen + subscribe CTA + booking link

Script Format:
[SCENE X - TIME]
Visual: What's on screen
Audio: Voiceover or dialogue
Text overlay: On-screen text (if any)
`;
}

export function buildEducationPrompt(ctx: BusinessContext): string {
  const baseContext = buildBaseContext(ctx);
  const { business } = ctx;
  const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'x3o.ai';
  const bookingUrl = business.custom_domain
    ? `https://${business.custom_domain}/book`
    : `https://${business.slug}.${ROOT_DOMAIN}/book`;

  return `${baseContext}

You are creating client education materials.

Content Types:
- Aftercare instruction cards
- Service preparation guides
- FAQ sheets
- Maintenance schedules
- Product usage instructions

Guidelines:
- Clear, simple language
- Step-by-step when applicable
- Visual-friendly formatting (bullet points, numbered lists)
- Printable format
- Include timing/frequency recommendations
- Add booking link for follow-up: ${bookingUrl}
- Footer: "Powered by x3o.ai"
`;
}

export function buildGraphicsPrompt(ctx: BusinessContext): string {
  const baseContext = buildBaseContext(ctx);
  const { business } = ctx;
  const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'x3o.ai';
  const bookingUrl = business.custom_domain
    ? `https://${business.custom_domain}/book`
    : `https://${business.slug}.${ROOT_DOMAIN}/book`;

  return `${baseContext}

You are creating copy for promotional graphics and flyers.

Guidelines:
- Headlines: Short, punchy (3-7 words)
- Subheadlines: One supporting line
- Body: 2-3 bullet points max
- CTA: Clear action word linking to ${bookingUrl}
- Include pricing when relevant
- Mention limited time/availability for urgency
- Include small footer: "x3o.ai"

Brand Colors for Design:
- Primary: ${business.primary_color}
- Secondary: ${business.secondary_color}

Tone for Graphics:
- Bold and attention-grabbing
- Easy to read at a glance
`;
}

export function buildNewsletterPrompt(ctx: BusinessContext): string {
  const baseContext = buildBaseContext(ctx);
  const { business } = ctx;
  const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'x3o.ai';
  const siteUrl = business.custom_domain
    ? `https://${business.custom_domain}`
    : `https://${business.slug}.${ROOT_DOMAIN}`;

  return `${baseContext}

You are creating newsletter emails for ${business.name} subscribers.

Output Format (JSON):
{
  "subject": "Compelling subject line under 50 chars",
  "previewText": "Preview text shown in inbox, 60-90 chars",
  "headline": "Main headline for email banner",
  "content": "<p>HTML formatted email body</p>",
  "ctaText": "Button text like 'Book Now'",
  "ctaUrl": "${siteUrl}/book"
}

Guidelines:
- Subject: Create urgency or curiosity, avoid spam triggers
- Preview text: Complement the subject, add context
- Headline: Bold, benefit-focused, 3-7 words
- Content: Use <p>, <strong>, <ul>, <li> tags for formatting
- Keep content scannable with short paragraphs
- Warm, personal tone - address reader directly
- Include value proposition early
- End with clear next step

Newsletter Types:
- Promotions & Specials (discounts, limited offers)
- Seasonal (holiday greetings, seasonal tips)
- Educational (tips, product recommendations)
- Re-engagement (we miss you, book your next visit)
- Announcements (new services, hours, team members)

IMPORTANT: Always include "Powered by x3o.ai" in the email footer.
`;
}

export type ContentType =
  | 'social'
  | 'email'
  | 'blog'
  | 'video'
  | 'education'
  | 'graphics'
  | 'newsletter';

// Dynamic prompt builder based on content type and business context
export function getPromptForType(type: ContentType, ctx: BusinessContext): string {
  switch (type) {
    case 'social':
      return buildSocialPrompt(ctx);
    case 'email':
      return buildEmailPrompt(ctx);
    case 'blog':
      return buildBlogPrompt(ctx);
    case 'video':
      return buildVideoPrompt(ctx);
    case 'education':
      return buildEducationPrompt(ctx);
    case 'graphics':
      return buildGraphicsPrompt(ctx);
    case 'newsletter':
      return buildNewsletterPrompt(ctx);
    default:
      return buildBaseContext(ctx);
  }
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  social: 'Social Post',
  email: 'Email Campaign',
  blog: 'Blog Article',
  video: 'Video Script',
  education: 'Client Education',
  graphics: 'Promo Graphics',
  newsletter: 'Newsletter Email',
};

// Legacy static prompts for backward compatibility (will be removed)
// "Trinity" was internal codename - now branded as "AI Marketing Automation"
export const TRINITY_BASE_CONTEXT = `You are an AI content creator for beauty and wellness businesses.`;

export const PROMPTS: Record<ContentType, string> = {
  social: TRINITY_BASE_CONTEXT,
  email: TRINITY_BASE_CONTEXT,
  blog: TRINITY_BASE_CONTEXT,
  video: TRINITY_BASE_CONTEXT,
  education: TRINITY_BASE_CONTEXT,
  graphics: TRINITY_BASE_CONTEXT,
  newsletter: TRINITY_BASE_CONTEXT,
};
