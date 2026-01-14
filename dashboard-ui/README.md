# x3o.ai Campaign Dashboard UI

Complete React dashboard for monitoring lead reactivation campaigns.

## Pages

### `/dashboard` - Overview
- Key metrics (revenue, bookings, leads, response rate)
- Hot leads preview with call buttons
- Active campaign progress
- Recent activity feed

### `/dashboard/campaigns` - Campaign List
- All campaigns with search/filter
- Status badges (Active, Paused, Completed)
- Progress indicators
- Revenue metrics per campaign
- Hot lead counts

### `/dashboard/campaigns/[campaignId]` - Campaign Detail
- Real-time campaign progress (Day 1/7)
- Metrics: sent, delivered, responses, bookings, revenue, ROI
- Hot leads panel with "📞 Call Now" buttons
- Activity feed (auto-refreshes every 10s)
- Pause/Resume/Cancel controls
- Lead breakdown by status

### `/dashboard/campaigns/new` - New Campaign Wizard
- Step 1: Upload CSV/Excel/vCard
- Step 2: Analyze leads (segmentation, TCPA check, ROI projection)
- Step 3: Configure (name, segment, script, timing)
- Step 4: Launch

### `/dashboard/hot-leads` - Hot Leads (Money Page)
- All positive responses across campaigns
- Quick call/text buttons
- Status tracking (New → Contacted → Booked)
- Search and filter by status
- Booking intent extraction

## API Routes

### `GET /api/campaigns`
Returns all campaigns with summary stats.

### `GET /api/campaigns/[campaignId]`
Returns detailed campaign data including:
- Campaign info + business
- Metrics (sent, delivered, responses, bookings, revenue, ROI)
- Lead counts by status
- Progress (currentDay, totalDays, percentComplete)
- Hot leads (last 10 positive responses)
- Recent activity (last 20 messages)

### `PATCH /api/campaigns/[campaignId]`
Campaign actions: `pause`, `resume`, `cancel`

## Integration

Copy these files to your `kelatic-booking` project:

```
app/
├── dashboard/
│   ├── layout.tsx              # Sidebar + navigation
│   ├── page.tsx                # Overview dashboard
│   ├── campaigns/
│   │   ├── page.tsx            # Campaign list
│   │   ├── new/
│   │   │   └── page.tsx        # New campaign wizard
│   │   └── [campaignId]/
│   │       └── page.tsx        # Campaign detail
│   └── hot-leads/
│       └── page.tsx            # Hot leads page
├── api/
│   └── campaigns/
│       └── route.ts            # Campaign list API
```

## Features

- **Real-time polling**: Campaign detail refreshes every 10s
- **Mobile responsive**: Full sidebar on desktop, hamburger menu on mobile
- **Dark theme**: Zinc-based color palette with emerald accents
- **Quick actions**: One-click call/text buttons for hot leads
- **Status management**: Mark leads as contacted/booked/no-show

## Dependencies

Uses only standard Next.js 14+ with:
- `lucide-react` for icons
- Tailwind CSS for styling

## Mock Data

Overview page and Hot Leads page currently use mock data. Replace the `setTimeout` blocks with actual API calls:

```typescript
// Replace this:
setTimeout(() => {
  setData({ ... })
}, 500)

// With this:
const res = await fetch('/api/dashboard')
const data = await res.json()
setData(data)
```

## Colors

- Primary: `emerald-500` (#10b981)
- Secondary: `cyan-400` (#22d3ee)
- Hot/Urgent: `orange-500` (#f97316)
- Danger: `red-400` (#f87171)
- Background: `zinc-950` (#09090b)
- Card: `zinc-900` (#18181b)
- Border: `zinc-800` (#27272a)
