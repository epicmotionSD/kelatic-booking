# Trinity AI Integration Plan

**Case Study:** Rockal (Kelatic Anchor Customer)
**Trial Add-ons:** Marketing Builder + Content Creation Builder

---

## Trinity AI Architecture

```
Trinity AI (Claude-powered)
├── Existing: AI Receptionist (chat widget for booking)
├── NEW: Marketing Builder
│   ├── Social Post Generator
│   ├── Email Campaign Creator
│   └── Promo Graphics Generator
└── NEW: Content Creation Builder
    ├── Blog/SEO Article Writer
    ├── Video Script Generator
    └── Client Education Creator
```

---

## Phase 1: Marketing Builder

### 1.1 Social Post Generator
**Location:** `/admin/trinity/marketing/social`

Features:
- Generate Instagram/Facebook captions
- Hashtag suggestions for loc community
- Post scheduling suggestions (best times)
- Content themes: Before/after, tips, promos, testimonials

**Prompts powered by:**
- Service catalog (auto-include pricing)
- Brand voice (Kelatic tone)
- Trending loc hashtags

### 1.2 Email Campaign Creator
**Location:** `/admin/trinity/marketing/email`

Features:
- Promotional emails (sales, new services)
- Re-engagement emails ("We miss you!")
- Seasonal campaigns (holidays, back-to-school)
- Template library

**Integration:**
- SendGrid for sending
- Client list from Supabase

### 1.3 Promo Graphics Generator
**Location:** `/admin/trinity/marketing/graphics`

Features:
- Service highlight flyers
- Special offer graphics
- Story templates
- Appointment reminder visuals

**Tech:**
- Claude for copy/layout suggestions
- Canvas-based editor or integration with Canva API
- Export as PNG/JPG for social

---

## Phase 2: Content Creation Builder

### 2.1 Blog/SEO Article Writer
**Location:** `/admin/trinity/content/blog`

Features:
- Loc care tips and guides
- Styling tutorials
- Product recommendations
- SEO-optimized titles and meta

**Output:**
- Markdown/HTML for website
- Social snippets for sharing

### 2.2 Video Script Generator
**Location:** `/admin/trinity/content/video`

Features:
- TikTok/Reels scripts (15-60 sec)
- YouTube tutorial outlines
- Talking points for live streams
- Hook suggestions

**Format:**
- Scene-by-scene breakdown
- Estimated timing
- B-roll suggestions

### 2.3 Client Education Creator
**Location:** `/admin/trinity/content/education`

Features:
- Aftercare instruction cards
- Loc journey milestone guides
- Product usage guides
- FAQ generators

**Output:**
- Printable PDFs
- Email-ready content
- SMS snippets

---

## Technical Implementation

### New Files Structure:
```
app/
├── (admin)/
│   └── trinity/
│       ├── layout.tsx          # Trinity AI sidebar
│       ├── page.tsx            # Trinity dashboard
│       ├── marketing/
│       │   ├── page.tsx        # Marketing hub
│       │   ├── social/page.tsx
│       │   ├── email/page.tsx
│       │   └── graphics/page.tsx
│       └── content/
│           ├── page.tsx        # Content hub
│           ├── blog/page.tsx
│           ├── video/page.tsx
│           └── education/page.tsx
├── api/
│   └── trinity/
│       ├── generate/route.ts   # Main generation endpoint
│       ├── social/route.ts
│       ├── email/route.ts
│       ├── blog/route.ts
│       └── video/route.ts
lib/
└── trinity/
    ├── prompts.ts              # System prompts for each feature
    ├── templates.ts            # Output templates
    └── service.ts              # Core Trinity AI logic
components/
└── trinity/
    ├── generator-form.tsx      # Reusable generation UI
    ├── output-preview.tsx      # Preview generated content
    └── history-list.tsx        # Past generations
```

### Database (Supabase):
```sql
-- Store generated content
CREATE TABLE trinity_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL, -- 'social', 'email', 'blog', 'video', 'education'
  prompt TEXT NOT NULL,
  output TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);
```

---

## UI/UX Design

### Trinity Dashboard
- Card grid showing each tool
- Recent generations
- Usage stats (generations this month)
- Quick actions

### Generation Flow
1. Select content type
2. Fill in context (service, audience, tone)
3. Click "Generate with Trinity"
4. Preview output
5. Edit if needed
6. Copy/Download/Send

---

## Pricing Model (Future)

| Tier | Generations/mo | Price |
|------|----------------|-------|
| Trial | 50 | Free |
| Starter | 200 | $29/mo |
| Pro | Unlimited | $79/mo |

---

## Success Metrics for Rockal Trial

- [ ] Generates 10+ social posts
- [ ] Creates 2+ email campaigns
- [ ] Writes 1+ blog article
- [ ] Produces 5+ video scripts
- [ ] Creates aftercare guides for top 3 services
- [ ] Feedback: "Would pay for this"

---

## Timeline

1. **Week 1:** Core Trinity module + Social Post Generator
2. **Week 2:** Email Campaign Creator + Blog Writer
3. **Week 3:** Video Scripts + Education Creator
4. **Week 4:** Polish, Rockal feedback, iterate

---

## Next Steps

1. Create Trinity AI admin section structure
2. Build core generation API with Claude
3. Implement Social Post Generator (first feature)
4. Test with Rockal
5. Iterate based on feedback
