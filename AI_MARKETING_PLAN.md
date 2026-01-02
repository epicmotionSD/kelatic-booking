# AI Marketing Automation - Multi-Tenant Content Generation

**Platform:** x3o.ai
**Powered by:** x3o.ai's Board of Directors
**Status:** Implemented with multi-tenant support
**Anchor Tenant:** Kelatic Hair Lounge (kelatic.x3o.ai)

---

## Overview

AI Marketing Automation is the AI-powered content generation engine for the x3o.ai platform. Each tenant gets personalized AI content that reflects their unique brand voice, colors, and business context.

All generated content automatically includes x3o.ai links and branding.

## Architecture

```
AI Marketing Automation (Claude-powered)
├── Multi-Tenant Context System
│   ├── Business name, tagline, brand voice
│   ├── Primary/secondary colors
│   ├── Custom hashtags
│   └── AI tone settings
├── Content Generators
│   ├── Social Post Generator (Instagram/Facebook)
│   ├── Email Campaign Creator
│   ├── Blog/SEO Article Writer
│   ├── Video Script Generator
│   ├── Promo Graphics Copy
│   └── Client Education Materials
└── Generation Storage
    └── trinity_generations (with business_id)
```

---

## Multi-Tenant Implementation

### Business Context Flow

```typescript
// lib/trinity/prompts.ts
export function buildBaseContext(ctx: BusinessContext): string {
  const { business, settings } = ctx;

  return `
You are creating content for ${business.name}.
${business.tagline ? `Tagline: "${business.tagline}"` : ''}
Business type: ${business.business_type}
Brand voice: ${settings?.ai_tone || 'professional'}
${settings?.ai_brand_context || ''}

Brand Colors:
- Primary: ${business.primary_color}
- Secondary: ${business.secondary_color}

${settings?.ai_hashtags?.length ? `Default hashtags: ${settings.ai_hashtags.join(' ')}` : ''}
  `.trim();
}
```

### Per-Tenant Prompts

Each content type uses business context:

| Type | Context Used |
|------|--------------|
| Social | Business name, hashtags, brand voice, colors, booking URL |
| Email | Business name, tagline, brand voice, contact info, x3o.ai footer |
| Blog | Business type, brand context, SEO keywords, booking link |
| Video | Brand voice, tagline, business type, x3o.ai branding |
| Education | Services, aftercare info, brand voice, booking link |

### x3o.ai Branding in Content

All generated content includes:
- Business-specific booking URLs (e.g., `https://kelatic.x3o.ai/book`)
- "Powered by x3o.ai" footer/tagline where appropriate
- x3o.ai links in CTAs

---

## Content Types

### 1. Social Post Generator

**Path:** `/admin/trinity/marketing/social`

**Features:**
- Instagram/Facebook captions
- Auto-include tenant's hashtags
- Brand-aware tone
- Booking link inclusion
- x3o.ai bio reference

### 2. Email Campaign Creator

**Path:** `/admin/trinity/marketing/email`

**Features:**
- Promotional emails
- Re-engagement campaigns
- Seasonal content
- Branded templates with tenant colors
- "Powered by x3o.ai" footer

### 3. Blog/SEO Article Writer

**Path:** `/admin/trinity/content/blog`

**Features:**
- SEO-optimized articles
- Service-related content
- Educational guides
- Internal booking links
- x3o.ai mention in CTA

### 4. Video Script Generator

**Path:** `/admin/trinity/content/video`

**Features:**
- TikTok/Reels scripts (15-60 sec)
- YouTube tutorials
- Live stream talking points
- Booking URL in end cards
- x3o.ai branding

### 5. Client Education Materials

**Path:** `/admin/trinity/content/education`

**Features:**
- Aftercare instructions
- Service preparation guides
- FAQ generators
- Product recommendations
- Follow-up booking links

---

## UI Components

### AI Marketing Dashboard

**Location:** `/admin/trinity/page.tsx`

**Shows:**
- Content type cards (6 generators)
- Recent generations (tenant-scoped)
- Usage stats for current business
- "Powered by x3o.ai's Board of Directors" branding

---

## Pricing Integration

AI Marketing usage is tracked per tenant for billing:

| Plan | AI Generations/Month |
|------|---------------------|
| Starter | 50 |
| Professional | Unlimited |
| Agency | Unlimited (for all sub-tenants) |

---

## Example: Kelatic Configuration

```json
{
  "business": {
    "name": "Kelatic Hair Lounge",
    "tagline": "Houston's Premier Loc Specialists",
    "business_type": "salon",
    "primary_color": "#f59e0b",
    "secondary_color": "#eab308"
  },
  "settings": {
    "ai_brand_context": "Kelatic is a brand ecosystem serving the loc and natural hair community with three sub-brands: Loc Shop (professional services), Loc Academy (training), and Loc Vitality (products). Brand voice is warm, professional, and empowering. Celebrates Black beauty and natural hair culture.",
    "ai_hashtags": [
      "#houstonlocs",
      "#houstonstylist",
      "#kelatic",
      "#locjourney",
      "#naturalhair"
    ],
    "ai_tone": "warm"
  }
}
```

**Sample Output:**

> *Social Post:*
> "Your locs tell your story. Every retwist, every style, every stage of the journey matters. At Kelatic, we're here to nurture that growth with you.
>
> Book your next session: kelatic.x3o.ai/book
>
> #houstonlocs #houstonstylist #kelatic #locjourney #naturalhair
>
> Powered by x3o.ai"

---

## Files Structure

```
lib/trinity/
├── prompts.ts      # Multi-tenant prompt builders with x3o.ai links
├── service.ts      # Generation service with business_id
└── templates.ts    # Output formatting templates

app/api/trinity/
├── generate/route.ts  # Main generation endpoint

components/trinity/
├── generator-form.tsx
├── output-preview.tsx
└── history-list.tsx

app/(admin)/trinity/
├── page.tsx           # Dashboard
├── marketing/
│   ├── social/page.tsx
│   └── email/page.tsx
└── content/
    ├── blog/page.tsx
    └── video/page.tsx
```

---

## Future Enhancements

- [ ] Image generation for promo graphics (DALL-E/Midjourney)
- [ ] Scheduled posting to social platforms
- [ ] A/B testing for email subject lines
- [ ] Analytics on content performance
- [ ] Template library per business type
- [ ] Multi-language support
