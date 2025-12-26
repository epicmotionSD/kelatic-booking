# KeLatic Hair Lounge - Booking System

A modern, AI-powered booking platform for KeLatic Hair Lounge and the upcoming Loc Training Academy.

## Tech Stack

- **Frontend**: Next.js 16.1.1 (App Router) + TypeScript + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Payments**: Stripe (Online + Terminal POS)
- **AI**: Claude API (Anthropic) + Trinity AI Content Generation
- **Email**: SendGrid
- **SMS**: Twilio
- **Deployment**: Vercel

## Features

### Phase 1: Core Booking (MVP) ✅ COMPLETE
- [x] Public landing page with services, team, testimonials
- [x] Client booking portal (5-step wizard at /book)
- [x] Service selection with add-ons
- [x] Stylist selection with profiles
- [x] Date/time picker with availability
- [x] Client info form with validation
- [x] Stripe payment integration (deposits)
- [x] Admin dashboard with analytics
- [x] Appointment management (list/calendar views)
- [x] Client management (profiles, history)
- [x] Service management (CRUD)
- [x] Team management (CRUD with schedules)
- [x] Reports & Analytics (4 tabs)
- [x] Email/SMS confirmations (SendGrid + Twilio)
- [x] Automated reminders (24hr & 2hr via cron)
- [x] Appointment rescheduling (client-facing)
- [x] Appointment cancellation
- [x] Fixed service duration data corruption (5400min → 90min)
- [x] Resolved React hydration mismatches
- [x] Separated currency utilities for Stripe compatibility
- [x] Enhanced availability API performance

### Phase 1.5: AI Content Generation ✅ COMPLETE
- [x] Trinity AI content generation (blog, social, email)
- [x] Marketing content creation
- [x] Educational content for academy
- [x] AI-powered content workflows

### Phase 2: Enhanced Experience 🔄 50% COMPLETE
- [x] AI chatbot for booking assistance
- [x] Stripe Terminal POS integration
- [ ] Photo upload for client hair history
- [ ] Automated rebooking reminders
- [ ] Walk-in flow in POS
- [ ] Instagram DMs integration
- [ ] SMS chatbot

### Phase 3: Academy Integration ❌ NOT STARTED
- [ ] Class registration system
- [ ] Student progress tracking
- [ ] Certificate generation
- [ ] Instructor scheduling

## Project Structure

```
kelatic-booking/
├── app/
│   ├── page.tsx                    # Landing page with services & booking CTA
│   ├── (public)/
│   │   ├── book/page.tsx           # 5-step booking wizard
│   │   └── appointments/[id]/
│   │       ├── page.tsx            # View appointment
│   │       └── reschedule/page.tsx # Reschedule appointment
│   ├── (admin)/
│   │   ├── layout.tsx              # Admin sidebar layout
│   │   ├── page.tsx                # Dashboard home
│   │   ├── appointments/page.tsx   # Manage appointments
│   │   ├── clients/page.tsx        # Client management
│   │   ├── services/page.tsx       # Service CRUD
│   │   ├── team/
│   │   │   ├── page.tsx            # Team list
│   │   │   └── [id]/schedule/      # Schedule management
│   │   ├── reports/page.tsx        # Analytics
│   │   ├── pos/page.tsx            # Point of Sale
│   │   └── trinity/
│   │       ├── page.tsx            # Trinity AI dashboard
│   │       ├── content/            # Content generation pages
│   │       └── marketing/          # Marketing content pages
│   └── api/
│       ├── appointments/[id]/      # Appointment CRUD, reschedule, cancel
│       ├── admin/                  # Admin endpoints
│       ├── bookings/               # Create bookings
│       ├── availability/           # Check availability
│       ├── notifications/          # Send emails/SMS
│       ├── chat/                   # AI chatbot
│       ├── pos/                    # POS endpoints
│       ├── cron/reminders/         # Auto-send reminders
│       ├── trinity/                # Trinity AI content generation
│       └── webhooks/stripe/        # Payment webhooks
├── components/
│   ├── booking/                    # Booking wizard components
│   ├── chat/chat-widget.tsx        # AI assistant widget
│   ├── pos/                        # POS components
│   └── trinity/                    # Trinity AI components
├── lib/
│   ├── supabase/client.ts          # Database clients
│   ├── stripe/index.ts             # Payment utilities
│   ├── currency.ts                 # Currency formatting utilities
│   ├── booking/service.ts          # Booking logic
│   ├── ai/chat.ts                  # Chatbot
│   ├── trinity/                    # Trinity AI services
│   └── notifications/service.ts    # Email/SMS
├── types/database.ts               # TypeScript definitions
├── supabase/migrations/            # Database schema
└── vercel.json                     # Cron configuration
```

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Stripe account
- SendGrid account (for email)
- Twilio account (for SMS)
- Anthropic API key (for AI features)

### Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_TERMINAL_LOCATION_ID=tml_xxx

# AI
ANTHROPIC_API_KEY=sk-ant-xxx

# Email (SendGrid)
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=bookings@kelatic.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE_NUMBER=+1234567890

# Cron Security
CRON_SECRET=your-random-secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

```bash
# Clone and install
cd kelatic-booking
npm install

# Set up database
npx supabase db push

# Seed initial data (optional)
npx supabase db seed

# Run development server
npm run dev
```

### Site Structure
- **/** - Landing page with services overview and booking CTA
- **/book** - Complete 5-step booking wizard
- **/admin** - Admin dashboard for business management
- **/appointments/[id]** - Client appointment viewing and management

## Deployment to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add all environment variables
4. Deploy
5. Cron job for reminders runs automatically (hourly)

## Testing the Booking Flow

1. **Landing Page**: Visit `/` to see the marketing page with service overview
2. **Start Booking**: Click "Book Your Appointment" to go to `/book`
3. **Complete Flow**: Test the 5-step booking process:
   - Service selection
   - Stylist selection
   - Date/time selection
   - Client information
   - Payment processing
4. **Admin Dashboard**: Visit `/admin` to manage appointments, clients, and services

## Troubleshooting

### Common Issues

**Hydration Mismatches**: If you see React hydration errors, ensure `suppressHydrationWarning={true}` is set on affected components (common with browser extensions).

**Service Duration Issues**: Run the migration script to fix corrupted duration data:
```bash
npx tsx scripts/migrate-amelia.ts
```

**Stripe Connection Issues**: Ensure all Stripe environment variables are set correctly and test with Stripe's test mode first.

**Availability API Slow**: The availability endpoint is optimized but may take time for complex stylist schedules.

## Data Migration from Amelia

1. Export Amelia tables from WordPress database:
   - `wp_amelia_users` → `clients`
   - `wp_amelia_appointments` → `appointments`
   - `wp_amelia_services` → `services`
   - `wp_amelia_payments` → `payments`

2. Use the migration script:
   ```bash
   npm run migrate:amelia -- --input ./amelia-export.csv
   ```

## Stripe Terminal Setup

For in-salon POS:

1. Order Stripe Terminal reader (BBPOS WisePOS E recommended)
2. Create a Terminal Location in Stripe Dashboard
3. Add `STRIPE_TERMINAL_LOCATION_ID` to env
4. Register reader via admin dashboard

## AI Features

### AI Chatbot Capabilities
The integrated AI assistant can:
- Answer service/pricing questions
- Check availability and book appointments
- Handle rescheduling requests
- Send appointment reminders
- Provide aftercare recommendations

### Trinity AI Content Generation
The Trinity AI system provides:
- **Blog Content**: Generate educational articles about loc care and natural hair
- **Social Media**: Create Instagram/Facebook posts and captions
- **Email Marketing**: Craft promotional emails and newsletters
- **Educational Content**: Develop training materials for the Loc Academy
- **Marketing Copy**: Generate website content, service descriptions, and testimonials
