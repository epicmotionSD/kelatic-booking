# KeLatic Hair Lounge - Booking System

A modern, AI-powered booking platform for KeLatic Hair Lounge and the upcoming Loc Training Academy.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Payments**: Stripe (Online + Terminal POS)
- **AI**: Claude API (Anthropic)
- **Email**: SendGrid
- **SMS**: Twilio
- **Deployment**: Vercel

## Features

### Phase 1: Core Booking (MVP) ✅ COMPLETE
- [x] Public landing page with services, team, testimonials
- [x] Client booking portal (5-step wizard)
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

### Phase 2: Enhanced Experience
- [x] AI chatbot for booking assistance
- [x] Stripe Terminal POS integration
- [ ] Photo upload for client hair history
- [ ] Automated rebooking reminders
- [ ] Walk-in flow in POS
- [ ] Instagram DMs integration
- [ ] SMS chatbot

### Phase 3: Academy Integration
- [ ] Class registration system
- [ ] Student progress tracking
- [ ] Certificate generation
- [ ] Instructor scheduling

## Project Structure

```
kelatic-booking/
├── app/
│   ├── page.tsx                    # Public landing page
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
│   │   └── pos/page.tsx            # Point of Sale
│   └── api/
│       ├── appointments/[id]/      # Appointment CRUD, reschedule, cancel
│       ├── admin/                  # Admin endpoints
│       ├── bookings/               # Create bookings
│       ├── availability/           # Check availability
│       ├── notifications/          # Send emails/SMS
│       ├── chat/                   # AI chatbot
│       ├── pos/                    # POS endpoints
│       ├── cron/reminders/         # Auto-send reminders
│       └── webhooks/stripe/        # Payment webhooks
├── components/
│   ├── booking/                    # Booking wizard components
│   ├── chat/chat-widget.tsx        # AI assistant widget
│   └── pos/                        # POS components
├── lib/
│   ├── supabase/client.ts          # Database clients
│   ├── stripe/index.ts             # Payment utilities
│   ├── booking/service.ts          # Booking logic
│   ├── ai/chat.ts                  # Chatbot
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

# Seed initial data
npx supabase db seed

# Run development server
npm run dev
```

## Deployment to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add all environment variables
4. Deploy
5. Cron job for reminders runs automatically (hourly)

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

## AI Chatbot Capabilities

The integrated AI assistant can:
- Answer service/pricing questions
- Check availability and book appointments
- Handle rescheduling requests
- Send appointment reminders
- Provide aftercare recommendations

---

Built with ❤️ for KeLatic Hair Lounge
