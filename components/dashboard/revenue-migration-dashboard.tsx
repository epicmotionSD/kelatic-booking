'use client'

import { useEffect, useState } from 'react'

// ─── Booking Conflict Panel ───────────────────────────────────────────────────

interface AmeliaConflict {
  appt_1_id: number
  appt_2_id: number
  stylist: string
  service: string
  slot_1_start: string
  slot_1_end: string
  slot_2_start: string
  slot_2_end: string
}

function fmt(dt: string) {
  const d = new Date(dt)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

function overlapMinutes(c: AmeliaConflict) {
  const overlapStart = Math.max(new Date(c.slot_1_start).getTime(), new Date(c.slot_2_start).getTime())
  const overlapEnd   = Math.min(new Date(c.slot_1_end).getTime(),   new Date(c.slot_2_end).getTime())
  return Math.round((overlapEnd - overlapStart) / 60000)
}

function ConflictPanel() {
  const [conflicts, setConflicts] = useState<AmeliaConflict[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(false)

  useEffect(() => {
    fetch('/api/bookings/conflicts')
      .then(r => r.json())
      .then(d => { setConflicts(d.conflicts ?? []); setLoading(false) })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="rounded-[14px] border border-white/10 bg-zinc-900 p-4 flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      <span className="text-xs text-white/40 tracking-widest uppercase">Scanning Amelia for conflicts…</span>
    </div>
  )

  if (error) return (
    <div className="rounded-[14px] border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-red-400" />
      <span className="text-xs text-red-400 tracking-widest uppercase">Bluehost MySQL unreachable — check env vars</span>
    </div>
  )

  const count = conflicts.length

  return (
    <div className={`rounded-[14px] border p-4 md:p-5 ${
      count === 0
        ? 'border-emerald-500/20 bg-emerald-500/5'
        : 'border-red-500/30 bg-red-500/5'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${count === 0 ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`} />
          <h2 className="text-xs uppercase tracking-[0.12em] font-semibold text-white/40">
            Amelia Double-Booking Monitor
          </h2>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
          count === 0
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {count === 0 ? '✓ No Conflicts' : `${count} Conflict${count > 1 ? 's' : ''} Detected`}
        </span>
      </div>

      {count === 0 ? (
        <p className="text-sm text-white/40">All Amelia appointments are clean — no overlapping bookings.</p>
      ) : (
        <div className="space-y-3 mt-2">
          {conflicts.map((c, i) => (
            <div key={i} className="rounded-[10px] border border-red-500/20 bg-zinc-900 p-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-white">{c.stylist}</p>
                  <p className="text-xs text-white/50 mt-0.5">{c.service}</p>
                </div>
                <span className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                  {overlapMinutes(c)} min overlap
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="rounded-[8px] bg-zinc-800 border border-white/6 p-3">
                  <p className="text-[10px] text-white/30 uppercase tracking-widest mb-1">Appt #{c.appt_1_id}</p>
                  <p className="text-xs text-white/70">{fmt(c.slot_1_start)}</p>
                  <p className="text-xs text-white/40">→ {fmt(c.slot_1_end)}</p>
                </div>
                <div className="rounded-[8px] bg-zinc-800 border border-red-500/20 p-3">
                  <p className="text-[10px] text-red-400/60 uppercase tracking-widest mb-1">Appt #{c.appt_2_id} ⚠</p>
                  <p className="text-xs text-white/70">{fmt(c.slot_2_start)}</p>
                  <p className="text-xs text-white/40">→ {fmt(c.slot_2_end)}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <a
                  href={`https://kelatic.com/hair-lounge/wp-admin/admin.php?page=wpamelia-appointments&id=${c.appt_1_id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-amber-400 hover:text-amber-300 border border-amber-500/20 px-2 py-1 rounded-md tracking-widest uppercase transition-colors"
                >
                  Appt #{c.appt_1_id} →
                </a>
                <a
                  href={`https://kelatic.com/hair-lounge/wp-admin/admin.php?page=wpamelia-appointments&id=${c.appt_2_id}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-[10px] text-amber-400 hover:text-amber-300 border border-amber-500/20 px-2 py-1 rounded-md tracking-widest uppercase transition-colors"
                >
                  Appt #{c.appt_2_id} →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Dashboard data ───────────────────────────────────────────────────────────

const topMetrics = [
  { label: 'Google ads spend', value: '$280/mo', sublabel: 'Target: $0' },
  { label: 'Migration complete', value: '67%', sublabel: '33% remaining' },
  { label: 'Social revenue', value: '$14,280', sublabel: 'Replacing ads' },
  { label: 'Month to full cut', value: '6 wks', sublabel: 'If steps followed' },
]

const gapItems = [
  {
    title: 'Google Business Profile not fully optimized',
    detail: 'Organic Google discovery is still being subsidized by paid. GBP needs to carry that load.',
  },
  {
    title: 'No Yelp review velocity campaign',
    detail: 'Houston Loc Fairy ranks #1 organically on Yelp. KeLatic is not in that slot. Paid ads compensate.',
  },
  {
    title: 'Link-click → booking conversion leaking',
    detail: 'Only 15% of booking page visits convert. Fix this before pulling paid traffic or bookings drop.',
  },
  {
    title: 'No paid social budget yet reallocated',
    detail: 'The $280/mo freed budget needs a destination (IG/TikTok boosts) or total bookings dip temporarily.',
  },
]

const budgetAllocation = [
  { name: 'Instagram Reels boost (top 2/mo)', amount: '$120' },
  { name: 'TikTok Spark Ads (boost viral posts)', amount: '$80' },
  { name: 'Instagram retargeting (profile visitors)', amount: '$50' },
  { name: 'Influencer barter (product/service value)', amount: '$30' },
]

const weeklyPlan = [
  {
    week: 'Week 1-2',
    title: 'Fix the booking conversion leak first',
    impactLabel: 'Impact if fixed',
    impactValue: '+$2,100/mo',
    impactSub: 'at same traffic',
    accentClass: 'border-l-red-500',
    weekChipClass: 'bg-red-500/10 text-red-400 border-red-500/20',
    metricClass: 'text-emerald-400',
    bullets: [
      'Audit the booking page — load time, mobile UX, CTA clarity. The 15% conversion rate is the biggest revenue lever before pulling ads.',
      'Add urgency: "3 slots left this week" scarcity indicator on booking page and in bio link.',
      'Switch bio link from linktree friction to direct booking URL. Every extra tap costs conversions.',
      'Add "Book now" sticker to every Instagram Story — direct booking sticker, not a swipe-up poll.',
    ],
  },
  {
    week: 'Week 2-3',
    title: 'Claim the organic Google search slot',
    impactLabel: 'Replaces',
    impactValue: 'Google Ads',
    impactSub: 'free discovery',
    accentClass: 'border-l-amber-500',
    weekChipClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    metricClass: 'text-amber-400',
    bullets: [
      'Rewrite Google Business Profile services with keyword-rich descriptions ("starter locs Houston", "loc retwist near me", "loc maintenance Houston TX").',
      'Upload 20+ photos to GBP — before/afters, salon interior, process shots. Rich photo profiles rank higher in local pack.',
      'Post to GBP weekly (offers, new service announcements, holiday hours). GBP activity is a direct ranking signal.',
      'Respond to every existing Google review — response recency is a local SEO signal most salons ignore.',
    ],
  },
  {
    week: 'Week 3-4',
    title: 'Yelp review blitz — close the #1 gap',
    impactLabel: 'Target',
    impactValue: 'Yelp #1',
    impactSub: '60 days',
    accentClass: 'border-l-amber-600',
    weekChipClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    metricClass: 'text-amber-400',
    bullets: [
      'Text every client post-appointment: "Mind leaving us a Yelp review? Here\'s the link 👇" — keep it personal, not a bulk blast. Aim for 10+ new reviews in 30 days.',
      'Yelp check-in offer: "Check in on Yelp, get 10% off a loc styling add-on." Drives check-ins = ranking signal.',
      'Complete Yelp Business profile: hours, all services listed with prices, 20+ photos uploaded, "Request a Quote" enabled.',
      'Houston Loc Fairy is #1 on Yelp — but she can\'t take new clients. Reviews + availability = KeLatic captures overflow.',
    ],
  },
  {
    week: 'Week 4-5',
    title: 'Activate paid social — redeploy the $280',
    impactLabel: 'Expected ROAS',
    impactValue: '4-6×',
    impactSub: 'vs Google 1.8×',
    accentClass: 'border-l-lime-600',
    weekChipClass: 'bg-lime-500/10 text-lime-400 border-lime-500/20',
    metricClass: 'text-lime-400',
    bullets: [
      'Boost top 2 organic Reels per month ($60/each). Pick posts already performing well — boost what\'s proven, not cold content.',
      'TikTok Spark Ads: $80/mo on top-performing videos. Spark Ads use your organic post — authentic, not ad-feeling. Targets Houston + 25mi radius.',
      'IG retargeting: $50/mo targeting people who visited your profile in last 30 days but didn\'t book. "Still thinking about your locs? Only 3 slots this month."',
      'Lookalike audience from existing booking list — upload client emails to Meta for a lookalike campaign. Highest conversion rate ad type.',
    ],
  },
  {
    week: 'Week 5-6',
    title: 'UGC flywheel — turn clients into free ads',
    impactLabel: 'Cost per client',
    impactValue: '$0',
    impactSub: 'UGC + referral',
    accentClass: 'border-l-lime-700',
    weekChipClass: 'bg-lime-500/10 text-lime-400 border-lime-500/20',
    metricClass: 'text-lime-400',
    bullets: [
      'Ask every client to film a 15-sec reaction video at the reveal. Text: "Film yourself seeing your locs for the first time — we\'ll share it!" Most will say yes.',
      'Salon hashtag push: #KeLatic + #KeLaticLocs on every client post = free content + organic search visibility.',
      'Referral offer: "Tag a friend in our latest Reel = both of you get $20 off your next visit." Viral loop with booking incentive.',
      'Reach out to @houstonlocgirl and @naturalhtx for service-barter collabs — zero cash, $0 ad cost, 8–11% engagement audiences.',
    ],
  },
  {
    week: 'Week 6',
    title: 'Cut Google Ads. Final day.',
    impactLabel: 'Migration',
    impactValue: '100%',
    impactSub: 'done',
    accentClass: 'border-l-green-500',
    weekChipClass: 'bg-green-500/10 text-green-400 border-green-500/20',
    metricClass: 'text-green-400',
    bullets: [
      'Confirm GBP organic traffic is holding — check Google Search Console for "kelatic" + "Houston locs" impressions before pulling the plug.',
      'Verify booking calendar has 80%+ fill rate for 2 consecutive weeks from organic + social alone.',
      'Pause Google Ads (don\'t delete the account — keep the data and pixel for 30-day safety window).',
      'After 30 days with stable bookings: close the account completely. $280/mo permanent savings locked in.',
    ],
  },
]

const pillars = [
  {
    title: 'Google Business Profile',
    detail: 'Captures "locs near me" and "Houston loctician" searches for free. Needs 20+ photos + keyword-rich service descriptions + weekly activity to rank in local 3-pack.',
    badge: 'Free',
    timeline: 'Week 2',
  },
  {
    title: 'Yelp organic ranking',
    detail: 'Review velocity is the #1 Yelp ranking signal. 10 new reviews in 30 days can shift KeLatic from top-10 to top-3. Houston Loc Fairy\'s limited hours mean she can\'t serve overflow demand.',
    badge: 'Free',
    timeline: 'Week 3',
  },
  {
    title: 'Instagram + TikTok organic reach',
    detail: 'Already driving 63% of social bookings. TikTok\'s 89K monthly views is the growth engine — loc education content ranks in TikTok search for "starter locs", which converts to direct bookings.',
    badge: 'Live now',
    timeline: 'Scale week 4',
  },
]

const revenueBridge = [
  { label: 'Current Google Ads bookings', value: '22/mo · $2,000', positive: false },
  { label: 'Conversion fix (+35% rate)', value: '+$2,100/mo', positive: true },
  { label: 'GBP + Yelp organic (replaces ads)', value: '+$1,800/mo', positive: true },
  { label: 'Paid social ROAS on $280', value: '+$840–1,680/mo', positive: true },
  { label: 'Google Ads cost eliminated', value: '+$280/mo', positive: true },
  { label: 'Net monthly gain post-cut', value: '+$5,020–6,860', positive: true, emphasis: true },
]

const safetyChecks = [
  'Booking calendar 80%+ filled for 2 consecutive weeks from organic sources only',
  'GBP appearing in "locs Houston" local 3-pack in Google Maps',
  'Yelp profile in top 5 for "locs Houston" — at least 25 total reviews',
  'IG booking link CTR above 3.5% (up from current ~2.5%)',
  'Paid social campaigns active and delivering — at least 1 week of data before cutting Google',
  'x3o SMS reactivation campaign active — ghost clients as revenue buffer during transition',
]

function SectionCard({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-[14px] border border-white/10 bg-zinc-900 p-4 md:p-5 ${className}`}>
      <h2 className="text-xs uppercase tracking-[0.12em] text-white/40 mb-3 font-semibold">{title}</h2>
      {children}
    </section>
  )
}

export default function RevenueMigrationDashboard({
  maxWidthClass = 'max-w-[1400px] mx-auto',
}: {
  maxWidthClass?: string
}) {
  return (
    <div className={`p-4 lg:p-8 space-y-6 ${maxWidthClass}`}>
      <div>
        <h1 className="text-[26px] font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
          KeLatic Revenue Migration Dashboard
        </h1>
        <p className="text-white/50 mt-1 text-sm">From Google Ads dependency to organic + social-led bookings.</p>
      </div>

      {/* Booking conflict monitor */}
      <ConflictPanel />

      {/* Top metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {topMetrics.map((metric) => (
          <div key={metric.label} className="rounded-[12px] border border-white/10 bg-zinc-900 p-5">
            <p className="text-xs uppercase tracking-[0.12em] text-white/40 font-semibold">{metric.label}</p>
            <p className="text-[38px] font-bold mt-2 leading-none text-white">{metric.value}</p>
            <p className="text-xs text-white/50 mt-1">{metric.sublabel}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <SectionCard title="Why 33% remains — the gaps">
          <ul className="space-y-3">
            {gapItems.map((item) => (
              <li key={item.title} className="border-b border-white/8 pb-3 last:border-b-0 last:pb-0">
                <p className="text-sm font-semibold text-white">• {item.title}</p>
                <p className="text-sm text-white/50 mt-1">{item.detail}</p>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Budget reallocation — where $280 goes">
          <div className="space-y-2">
            {budgetAllocation.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <span className="text-white/70">{item.name}</span>
                <span className="font-semibold text-white">{item.amount}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between">
            <span className="text-white/70 font-medium">Total reallocated</span>
            <span className="text-emerald-400 font-bold">$280</span>
          </div>
          <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-sm text-emerald-400">
            Social paid drives 3–5× higher intent than Google Ads for local beauty search.
          </div>
        </SectionCard>
      </div>

      {/* 6-week plan */}
      <div className="space-y-3">
        <h2 className="text-sm uppercase tracking-[0.12em] text-white/40">6-week system plan</h2>
        {weeklyPlan.map((section) => (
          <section
            key={section.title}
            className={`rounded-[14px] border border-white/10 bg-zinc-900 p-4 md:p-5 border-l-4 ${section.accentClass}`}
          >
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2">
              <div>
                <p className={`inline-flex text-xs px-2 py-1 rounded-md border ${section.weekChipClass}`}>{section.week}</p>
                <h3 className="text-xl font-semibold text-white mt-2">{section.title}</h3>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs uppercase tracking-[0.12em] text-white/40">{section.impactLabel}</p>
                <p className={`text-3xl font-bold mt-1 ${section.metricClass}`}>{section.impactValue}</p>
                <p className="text-xs text-white/40">{section.impactSub}</p>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="text-sm text-white/60 border-b border-white/8 pb-2 last:border-b-0 last:pb-0 leading-relaxed">
                  • {bullet}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <SectionCard title="The three organic pillars replacing Google">
          <div className="space-y-3">
            {pillars.map((pillar) => (
              <div key={pillar.title} className="rounded-[12px] border border-white/10 bg-white/3 p-4">
                <h3 className="font-semibold text-white">{pillar.title}</h3>
                <p className="text-sm text-white/50 mt-1">{pillar.detail}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">{pillar.badge}</span>
                  <span className="text-xs text-white/40">{pillar.timeline}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Revenue bridge — before & after">
          <div className="space-y-2">
            {revenueBridge.map((row) => (
              <div
                key={row.label}
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  row.emphasis
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : 'bg-white/5 border border-white/8'
                }`}
              >
                <span className={`${row.emphasis ? 'font-semibold text-white' : 'text-white/70'} text-sm`}>{row.label}</span>
                <span className={`text-sm font-semibold ${row.positive ? 'text-emerald-400' : 'text-white'}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/30 mt-3">
            Revenue bridge assumes $160 avg ticket. Conversion fix alone covers the Google Ads revenue 2× over.
          </p>
        </SectionCard>
      </div>

      <SectionCard title="Safety checks before final cut">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {safetyChecks.map((check, index) => (
            <div
              key={check}
              className="rounded-[12px] border border-white/10 bg-white/3 px-3 py-3 text-sm text-white/60 flex items-start gap-2"
            >
              <span
                className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border text-xs ${
                  index === 0
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/20 text-white/20'
                }`}
              >
                {index === 0 ? '✓' : ''}
              </span>
              <span>{check}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
