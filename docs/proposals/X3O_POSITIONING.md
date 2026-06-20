# x3o.ai — Positioning Refactor

**Status:** Positioning strategy (drives the rebuilt `/platform` landing page)
**Date:** 2026-06-20
**Decisions locked:** Frame = **agentic business platform** · Audience = **prospective tenant businesses (SMB owners)**

---

## 1. The shift

**From** (today's page): *"x3o Intelligence — a Claude-powered B2B intelligence marketplace."* It reads like an
investor deck — dashboards, ROI tables, GTM phases, an Anthropic partnership pitch. The hero sells
*insight*: charts, alerts, competitor radar.

**To**: *x3o is a team of AI agents that **run** your business.* Not another dashboard to check — operators
that do the work. The owner sets the goal; the agents execute. The whole operational stack (booking,
storefront, POS, payments, messaging) runs underneath them.

Insight tells you what's wrong. **Agents fix it.** That's the whole repositioning.

---

## 2. Category & one-liner

- **Category:** Agentic business platform — "AI agents that run your business."
- **Primary tagline:** **Your business, run by a team of AI agents.**
- **Alternates:**
  - "Hire your AI operations team. Live in a day."
  - "The agents that run the back office, so you run the room."
  - "Less software to check. More business getting done."
- **Descriptor line:** x3o gives every local business a team of AI agents — for marketing, retention,
  scheduling, support, and content — running on top of a full booking, storefront, and payments platform.

---

## 3. Audience & their problem

**Who:** owners of local service & retail businesses — salons, barbershops, cafés, studios, spas. Often
solo or lean teams. Tech-comfortable but time-poor. (Kelatic Hair Lounge and Kelatic Vitality House are
the live proof.)

**Their problem — the owner wears every hat:**
- Marketing slips because there's no time to post or run campaigns.
- Past clients quietly disappear; no one follows up.
- The calendar has gaps no one fills.
- Messages and questions pile up after hours.
- "AI tools" so far just mean more dashboards to read — more work, not less.

**The reframe:** you don't need more reports. You need the work done. x3o's agents do it.

---

## 4. Your AI team (the agents — all real in the codebase)

Each agent is named as an operator with a job, not a feature.

| Agent | Role | What it does for the owner |
|-------|------|----------------------------|
| **Trinity** | Content & brand creative | Writes posts, captions, and campaigns in your brand voice; keeps a content calendar full. |
| **Marketing agent** | Campaign operator | Plans and runs email/SMS/social campaigns; schedules and tracks them. |
| **Retention agent** | Win-back operator | Spots clients who've gone quiet and runs personalized win-back sequences automatically. |
| **Scheduling agent** | Calendar operator | Finds and fills gaps, sends reminders, reduces no-shows. |
| **Support agent** | Front-desk operator | Answers client questions, handles tickets, works from your knowledge base 24/7. |

**Underneath the agents — the platform that actually runs the business:**
online booking, a branded storefront + checkout, in-person POS (Stripe Terminal), payments, client
records, and email/SMS messaging. The agents act *on* this stack, which is why they can do real work, not
just talk about it.

---

## 5. Messaging pillars (the four things the page must land)

1. **A team, not a dashboard.** x3o agents take action — they post, message, follow up, and book — instead
   of handing you another chart to interpret.
2. **Runs the whole business.** Booking, storefront, POS, payments, and client comms are built in, so the
   agents operate a real operation end-to-end.
3. **Live in a day, ROI you can see.** Fast white-glove setup; Kelatic recovers **+$5,510/mo** at **18.5×**
   ROI on the growth plan. (Real, from the existing case study.)
4. **In your brand, on your domain.** Fully white-label — your name, your colors, your custom domain
   (kelatic.com, kelaticvitalityhouse.com). The customer never sees "x3o."

---

## 6. Page outline (rebuilt `/platform`, tabbed, owner-facing)

1. **Overview** — hero (tagline + descriptor + "Start free trial" / "See it live"); the owner's problem vs.
   the agentic solution; proof metric strip (ROI, revenue recovered, clients managed); CTA.
2. **Your AI Team** — the five agents as operator cards (role + plain-language outcome), then the
   "platform underneath" band (booking, storefront, POS, payments, comms).
3. **Proof · Kelatic** — the live case study: outcome metrics + a short revenue-lift breakdown, reframed as
   owner outcomes ("what the agents recovered"). Links to kelatic.x3o.ai and kelaticvitalityhouse.com.
4. **Pricing** — Starter $97 / Growth $297 (most popular) / Enterprise $897, with features reframed around
   *which agents and outcomes* you get. "Every plan is white-label and live in a day."
5. **Get Started** — 3 steps (Tell us about your business → We deploy your agents & site in ~24h → Approve
   and go live), a short FAQ, and a final CTA.

**Dropped from the SMB page** (it was investor-facing): the GTM phases, revenue model, and Anthropic
partnership pitch. Keep those in a separate investor deck, not the owner-facing site.

---

## 7. Voice & tone

Plain, confident, owner-to-owner. Short sentences. Outcomes over jargon. Say "fills your calendar," not
"booking-funnel optimization." Avoid hype words ("revolutionary," "cutting-edge"). Let the Kelatic numbers
carry credibility. Keep "Powered by Claude" as a quiet trust signal, not the headline.

---

## 8. Before → after (headline test)

| | Before | After |
|---|--------|-------|
| Hero | "x3o Intelligence — Claude-Powered B2B Intelligence Marketplace" | "Your business, run by a team of AI agents." |
| Solution | "Claude as your business AI operator" (dashboards) | "Five agents that market, rebook, schedule, support, and create — for you." |
| Proof | ROI table for investors | "What Kelatic's agents recovered: +$5,510/mo, 18.5× ROI." |
| CTA | "Get Started" → pricing | "Start free trial" / "See it live → kelatic.x3o.ai" |

---

## 9. Open choices for you

- **Name of the team/agents** — keep "Trinity" for content; do you want the other four to have names too
  (e.g. a named "crew"), or stay descriptive ("Marketing agent")? Named agents are stickier but more to
  maintain.
- **Lead tagline** — confirm "Your business, run by a team of AI agents," or pick an alternate from §2.
- **Pricing** — keep the current $97 / $297 / $897 tiers, or revisit now that the storefront/POS/commerce
  features (Vitality House) are part of the platform?
