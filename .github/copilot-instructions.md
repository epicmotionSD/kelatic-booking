# x3o.ai - Multi-Tenant Booking Platform

This is a white-label booking platform built with Next.js 15, Supabase, and TypeScript. The system serves multiple tenants (salons/barbershops) under subdomains like `kelatic.x3o.ai`.

## Foundation Architecture

**Built on Platform SDK**: This codebase extends the [epicmotionSD/platform-sdk](https://github.com/epicmotionSD/platform-sdk), which provides the foundational multi-tenant subdomain architecture with:
- Subdomain extraction via Next.js middleware ([middleware.ts](middleware.ts))
- Dynamic tenant routing (`tenant.x3o.ai` → tenant-specific content)
- Redis-based tenant data storage pattern
- Shared UI components from shadcn/ui with `data-slot` attributes

**Multi-Tenant Setup**: Every request is filtered by `business_id` through Supabase Row-Level Security. The middleware extracts tenant slug from subdomains and sets context headers. Use `getTenantContext()` from [lib/tenant/server.ts](lib/tenant/server.ts) to access tenant data.

**Core Domain Model**: 
- `businesses` - Core tenant table with branding/settings
- `business_members` - Team associations with roles (owner, admin, stylist, client)  
- All tenant-scoped tables reference `business_id` and use RLS policies

**Database Patterns**: Always use `createClient()` from [lib/supabase/server.ts](lib/supabase/server.ts) for server components. Use `createAdminClient()` only for system operations that bypass RLS. See [types/database.ts](types/database.ts) for complete schema.

## Key Workflows

**Development Commands**:
```bash
npm run db:types        # Regenerate TypeScript types from Supabase
npm run db:reset         # Reset local database with seed data
npm run generate:vapid   # Generate VAPID keys for push notifications
```

**Platform SDK Inheritance**: Understands subdomain routing patterns from base SDK:
- Local dev: `tenant.localhost:3000`
- Preview: `tenant---branch.vercel.app` 
- Production: `tenant.x3o.ai`

**Booking Flow**: Service selection → DateTime → Client info → Payment ([components/booking/](components/booking/)). The [app/api/bookings/route.ts](app/api/bookings/route.ts) handles creation with Stripe payment intents and notification triggers.

**AI Integration**: Trinity AI ([lib/ai/chat.ts](lib/ai/chat.ts)) uses Claude API with function calling for booking assistance. System prompt is tenant-aware and specializes for each business type (e.g., Kelatic focuses on locs only).

## Project-Specific Patterns

**Route Organization**: 
- `app/(platform)/` - Platform root (x3o.ai) with onboarding
- `app/(public)/` - Tenant public pages (booking, services)
- `app/admin/` - Tenant admin dashboard
- `app/api/` - API routes with tenant context extraction

**Component Structure**: Use `'use client'` for interactive components. Server components automatically get tenant context. Example: [components/booking/service-selection.tsx](components/booking/service-selection.tsx) shows the async data fetching pattern.

**Supabase Patterns**: 
- Server components: `const supabase = await createClient()`
- Client components: `const supabase = createClient()` (from [lib/supabase/client.ts](lib/supabase/client.ts))
- All queries automatically filtered by tenant RLS policies

**Tenant Configuration**: Use [lib/tenant-config.ts](lib/tenant-config.ts) for domain-specific settings like analytics IDs. The [app/layout.tsx](app/layout.tsx) dynamically injects tenant branding and metadata.

**UI Component Pattern**: All shadcn/ui components include `data-slot` attributes inherited from Platform SDK for consistent styling and integration.

## Integration Points

**Payment**: Stripe Connect for platform + tenant payouts. Each business has `stripe_account_id` for direct payments.

**Notifications**: Multi-channel system (email/SMS/push) via [lib/notifications/](lib/notifications/). SendGrid templates and Twilio SMS are tenant-configured.

**External APIs**: Google Analytics per-tenant, Instagram feed integration, and Claude API for content generation.

## Conventions

**File Naming**: Use kebab-case for components, camelCase for utilities. API routes follow Next.js App Router conventions.

**Type Safety**: Import from [types/database.ts](types/database.ts) for all database types. Use `UserRole`, `AppointmentStatus`, etc. for type-safe operations.

**Error Handling**: API routes return standardized JSON errors. UI uses Sonner toasts via `toast.error()` patterns.

When working with this codebase, always consider tenant isolation and check if your changes affect the multi-tenant data model or routing logic.