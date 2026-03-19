x3o.ai × kelatic.com

**Brand Split — Realignment Document**

Decision locked · March 19, 2026 · Sonnier Ventures

Supersedes: CASE_STUDY_X3O_AI_V2.md · Alignment Doc v1.0 (Feb 12, 2026)

|  |
| --- |
| **DECISION LOCKED**  **Option C — Brand Split is selected. No further evaluation needed on Options A or B.**  **kelatic-booking** → Renamed and scoped as the **kelatic.com ecosystem**. Beauty-industry specific. Owned by Rockal / KeLatic Hair Lounge.  **x3o.ai** → New standalone project. Revenue Recovery AI. Horizontal (any industry). Multi-tenant SaaS. |

# **1. The Two Products — Defined**

|  |  |
| --- | --- |
| **kelatic.com Ecosystem** | **x3o.ai — Revenue Recovery AI** |
| **Repo:**  kelatic-booking | **Repo:**  x3o-intelligence (new) |
| **Audience:** | **Audience:**  Any service business (salons, gyms, medical, legal). Multi-industry. Multi-tenant. |
| **Core function:**  Full-stack booking platform + CRM + AI chatbot for beauty business operations. | **Core function:**  Revenue recovery AI — ghost client reactivation, conversation recovery, slot filling. |
| **Booking:**  ✓ Native 5-step booking wizard. Keeps it. | **Booking:**  ✗ No booking UI. Integrates with Calendly, Mindbody, Square, etc. |
| **Pricing:**  $97/mo booking platform + $197/mo revenue add-on | **Pricing:**  $297/mo subscription + $1,500 revenue sprint |
| **Vertical:**  Beauty only (salons, spas, barbershops, loc specialists) | **Vertical:**  Beauty → Fitness → Medical → Legal → API (horizontal) |
| **Status:**  ✓ Live. Customer #1 = KeLatic Hair Lounge. | **Status:**  ◯ New project. KeLatic becomes first customer. |

# **2. kelatic.com Ecosystem — Scope & Boundaries**

|  |
| --- |
| Mission statement  The complete operating system for KeLatic Hair Lounge — and the white-label platform for any beauty business that needs booking + CRM without the enterprise price tag. |

## **2.1 What Stays in kelatic-booking**

* 5-step booking wizard (full native booking — do not decouple)
* Multi-stylist scheduling + time-off management
* Client management CRM + hair history tracking
* Stripe payments + POS terminal (Stripe Terminal)
* Email / SMS appointment reminders (SendGrid + Twilio)
* Kela AI chatbot — Claude Sonnet 4.5 booking assistant
* Trinity content generator (social posts, emails, blogs)
* Campaign infrastructure (ghost client reactivation — Hummingbird cadence)
* TCPA compliance + A2P 10DLC A2H registration
* Loc Academy B2B pipeline (Q2 2026)
* Multi-tenant architecture with subdomain per business

## **2.2 What Moves to x3o.ai (Not Rebuilt in kelatic)**

* Horizontal multi-industry revenue recovery → x3o.ai owns this
* Booking tool integrations (Calendly, Mindbody, Square) → x3o.ai adapter layer
* MCP client / Trust Stack cross-industry governance → x3o.ai infrastructure
* Public API / Developer SDK → x3o.ai product

## **2.3 What Needs to Be Built (kelatic only)**

|  |  |  |
| --- | --- | --- |
| **Feature** | **Current State** | **Priority** |
| **Stripe subscription billing** | ❌ Not implemented | WEEK 1 — CRITICAL |
| **Campaign dashboard UI** | ⚠️ Prototype, not integrated | WEEK 2 — HIGH |
| **Abandoned conversation detection** | ⚠️ Chatbot exists, no DM detection | WEEK 3 — HIGH |
| **Instant slot filling (waitlist)** | ❌ Not implemented | WEEK 4 — MEDIUM |
| **Realtime campaign metrics** | ⚠️ DB triggers only, no live UI | WEEK 4 — MEDIUM |
| **Loc Academy enrollment flow** | ❌ Not implemented | Q2 2026 |
| **White-label domain support** | ✅ Subdomain per business | Live |

# **3. x3o.ai — New Project Architecture**

|  |
| --- |
| Mission statement  Revenue Recovery AI that integrates with any existing booking tool. Not a booking platform. The Ferrari Engine — you bring the car. |

## **3.1 Core Revenue Recovery Features (MVP Scope)**

|  |  |  |  |
| --- | --- | --- | --- |
| **Module** | **What it does** | **Target KPI** | **Status** |
| **Ghost Client Revival** | Hummingbird 4-day SMS cadence for dormant clients. Segments by 30/90/180/249+ day inactivity. | 8–12% reactivation | **MIGRATE FROM KELATIC** |
| **Conversation Recovery** | Detect abandoned DMs / chat threads. Auto follow-up after 24hr inactivity across Instagram, Facebook, website chat. | 23% conversion | **BUILD IN x3o** |
| **Instant Slot Filling** | On cancellation, auto-match waitlist clients by service + date range. SMS top 3 matches with instant booking link. | 67% fill rate | **BUILD IN x3o** |
| **Booking Tool Adapters** | BaseAdapter interface + Calendly, Mindbody, Square, Booksy adapters. Decoupled from any booking DB. | 3+ platforms Q3 | **BUILD IN x3o** |
| **x3o Intelligence Dashboard** | Claude-powered BI dashboard: social performance, competitor radar, budget migration tracker, content calendar, hashtag radar. | $297/mo anchor | **BUILT (x3o MVP)** |

## **3.2 x3o.ai Tech Stack**

* Framework: Next.js 15 · App Router · TypeScript
* Database: Supabase (Postgres) — shared infra with kelatic-booking is allowed; separate project
* AI: Claude Sonnet 4.5 · vertical-specific system prompts · streaming responses
* Messaging: Twilio A2P 10DLC (multi-tenant per-business credentials)
* Billing: Stripe subscriptions ($297/mo) + Checkout ($1,500 sprint)
* Jobs: Inngest for Hummingbird cadence + cron-based conversation detection
* MCP: x3o-intelligence MCP server → listed in OpenConductor registry
* Compliance: Trust Stack SDK · ERC-8004 agent registration · EU AI Act audit logs
* Deployment: Vercel (managed via Empire MCP server)

## **3.3 KeLatic as x3o Customer #1**

KeLatic Hair Lounge is the proof-of-concept customer and the case study that opens every sales conversation. The booking operations remain in kelatic-booking. x3o.ai connects to kelatic-booking via the KelaticAdapter (first adapter built) and layers revenue recovery on top.

* KelaticAdapter reads appointments, cancellations, and client lists from kelatic-booking Supabase
* x3o ghost client campaigns pull inactive clients from kelatic-booking CRM
* x3o conversation recovery detects abandoned Kela chatbot sessions and triggers follow-up
* x3o Intelligence dashboard is the BI layer — social intel, competitor radar, Google Ads migration
* ROI documented: 18.5× return on $297/mo subscription (live case study)

# **4. Prioritized Action Plan**

|  |  |  |  |
| --- | --- | --- | --- |
| **Timeline** | **Task** | **Repo** | **Priority** |
| **Week 1** | Initialize x3o-intelligence repo. Next.js 15 + Supabase + Stripe. | x3o-intelligence | **CRITICAL** |
| **Week 1** | Implement Stripe $297/mo subscription + $1,500 sprint billing. | x3o-intelligence | **CRITICAL** |
| **Week 1** | Register Trinity AI on Trust Stack (openconductor.ai/register). Get Token ID. | x3o-intelligence | **CRITICAL** |
| **Week 1** | Migrate Hummingbird cadence + campaign infrastructure from kelatic-booking. | x3o-intelligence | **HIGH** |
| **Week 2** | Build KelaticAdapter (first booking adapter). Connect x3o to kelatic-booking. | x3o-intelligence | **HIGH** |
| **Week 2** | Integrate campaign dashboard UI into x3o /admin/campaigns. | x3o-intelligence | **HIGH** |
| **Week 2** | kelatic-booking: integrate campaign UI into /admin (keep native copy). | kelatic-booking | **HIGH** |
| **Week 3** | Build abandoned conversation detection (abandoned_conversations table + Inngest cron). | x3o-intelligence | **HIGH** |
| **Week 3** | kelatic-booking: Stripe subscription billing ($97/mo + $197/mo add-on). | kelatic-booking | **HIGH** |
| **Week 4** | Build instant slot filling — waitlist table + cancellation → SMS matching algorithm. | x3o-intelligence | **MEDIUM** |
| **Week 4** | Add Trust Stack branding to x3o dashboard + chat + marketing site. | x3o-intelligence | **MEDIUM** |
| **Month 2** | Calendly API adapter (second booking integration after KelaticAdapter). | x3o-intelligence | **MEDIUM** |
| **Month 2** | kelatic-booking: Loc Academy enrollment flow + billing. | kelatic-booking | **MEDIUM** |
| **Q2 2026** | Fitness vertical: Mindbody adapter + Trinity system prompt + 10 pilot customers. | x3o-intelligence | **PLANNED** |
| **Q2 2026** | OpenConductor MCP listing for x3o-intelligence. | x3o-intelligence | **PLANNED** |
| **Q3 2026** | Public API + developer portal. OAuth 2.0. Rate limiting. | x3o-intelligence | **PLANNED** |
| **Q4 2026** | API/SDK launch (@x3o/js-sdk). Revenue-as-a-service for developers. | x3o-intelligence | **PLANNED** |

# **5. Shared Code Strategy**

Both repos are separate — no monorepo. Shared logic is extracted to npm packages under the @x3o scope. This keeps deployment independent while avoiding duplication of core AI and compliance utilities.

|  |  |  |
| --- | --- | --- |
| **Package** | **What it contains** | **Used by** |
| @x3o/hummingbird | SMS cadence engine, script variants, TCPA opt-out logic | **Both repos** |
| @x3o/trinity-ai | Claude prompt orchestration, vertical system prompts, streaming | **Both repos** |
| @x3o/trust-stack | ERC-8004 registration, audit logging, EU AI Act compliance | **x3o-intelligence (primary)** |
| @x3o/booking-adapters | BaseAdapter + Calendly, Mindbody, Square, KelaticAdapter | **x3o-intelligence only** |
| @x3o/analytics | Supabase realtime metrics, campaign dashboards, ROI calculations | **Both repos** |

# **6. Success Metrics**

## **6.1 x3o.ai Targets**

* $297/mo per customer. KeLatic is Customer #1.
* $1,700 MRR by end of March 2026 (≈ 6 customers)
* $10K MRR by Q2 2026 (≈ 34 customers)
* 8–12% ghost client reactivation rate
* 23% abandoned conversation → booking conversion
* 67% cancellation fill rate via waitlist
* 18.5× average customer ROI (KeLatic benchmark)
* Trust Stack Token ID registered before EU AI Act deadline (August 2, 2026)
* 3+ booking platform integrations by Q3 2026
* Multi-industry live (beauty + fitness) by Q2 2026

## **6.2 kelatic.com Ecosystem Targets**

* KeLatic Hair Lounge full stack live and generating revenue
* $1,700 MRR across Kelatic Book ($97/mo) + Revenue Add-On ($197/mo)
* Loc Academy enrollment pipeline live Q2 2026
* 5 Houston beauty businesses on platform by Q2 2026
* White-label Kelatic Book to 3 additional salons by Q3 2026

*Document Version: 2.0 · Decision Date: March 19, 2026 · Author: Shawn Sonnier / Sonnier Ventures · AI assist: Claude Sonnet 4.6*

*Supersedes CASE_STUDY_X3O_AI_V2.md and Alignment Doc v1.0 (Feb 12, 2026). Options A and B are retired.*