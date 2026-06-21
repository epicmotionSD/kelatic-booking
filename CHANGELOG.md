# Changelog

## 2026-06-20

### Primary-agent orchestrator, loyalty actions + x3o terminal-green rebrand
- **Orchestrator**: added `PrimaryOrchestrator` (`lib/agents/primary/orchestrator.ts`) — routes intents to the Attract/Retain/Serve registry, dispatches tools to their API routes, and produces a readiness snapshot. Exposed at `GET/POST /api/agents/orchestrator`; the readiness summary + per-agent wired/runnable status now render on `/admin/agents`.
- **Loyalty**: surfaced `members` + `referrals` as agent tools and added inline run-actions (check balance, rewards catalog, program config, members, referrals) to the Serve detail view via new `loyalty-list` / `loyalty-balance` action kinds.
- **Tenant fixes**: `trinity/history` now resolves `businessId` from tenant context (was hardcoded `default`); clarified that reactivation lead persistence happens at `/api/reactivation/launch`.
- **Brand**: terminal-green x3o identity (accent `#00ffb2` on `#010409`) — new `favicon.svg`, `x3o-logo.svg` (wordmark with prompt cursor), maskable PWA icons, and a 1200×630 `og-image.png`. KeLatic beauty `logo.png` left unchanged.
- **SEO**: rewrote `manifest.json` for x3o (name / shortcuts → Dashboard·Agents·Campaigns·Loyalty / dark theme), wired OpenGraph image + Twitter `summary_large_image` and tightened platform JSON-LD (`offers`, `provider`, `url`) in `app/layout.tsx`, and added `/platform` to the sitemap.

### Kelatic Vitality House (commerce) + 3-agent platform + docs cleanup
- **Commerce tenant**: new `vitality` tenant (Kelatic Vitality House, café). Migration `050_vitality_house_commerce.sql` adds products/categories/modifiers/orders/order_items + `payments.order_id` (pickup-only). Admin product entry, orders queue, commerce dashboard, and in-person POS register. Public storefront (`/shop`, `/checkout` with Stripe Payment Element, success) + shop APIs. Stripe webhook fulfills product orders via `metadata.order_id`.
- **Tenant-aware admin nav**: commerce tenants get a simplified top level (Dashboard / POS / Orders / Products) with salon tools under a collapsible **Booking** group. New wellness landing for the Vitality House domain.
- **Three primary agents**: introduced **Attract / Retain / Serve** as the owner-facing layer (`lib/agents/primary/` registry). Trinity content moved into `lib/agents/modules/content`; `app/api/trinity/*` now delegate. Admin UI at `/admin/agents` (board + detail) is registry-driven, with inline live actions (content/campaign generation, find-gaps, ghost-clients, tickets, knowledge search, support chat).
- **x3o.ai marketing site**: rebuilt `app/platform/page.tsx` in an openconductor.ai-style single-scroll design (dark + mint) that showcases the three agents. Positioning in `docs/proposals/X3O_POSITIONING.md`.
- **Docs**: added `ARCHITECTURE.md` and `docs/INDEX.md`; archived historical/phase docs to `docs/archive/`.

## 2026-03-19

### Refactor x3o marketing copy and align brand-split messaging
- Replaced `X3O_AI_ALIGNMENT.md` with the v2 brand-split realignment document.
- Refactored x3o marketing website copy in `app/platform/page.tsx` to integration-first, multi-industry revenue-recovery positioning.
- Updated x3o platform metadata in `app/(platform)/layout.tsx`.
- Updated onboarding funnel copy in `app/(platform)/onboarding/page.tsx` for consistent messaging.
- Updated root platform SEO metadata and JSON-LD description in `app/layout.tsx`.
- Released in commit `5fc6bfe` on `master`.
