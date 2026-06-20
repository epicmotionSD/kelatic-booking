'use client';

import { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Megaphone,
  RotateCcw,
  MessageCircle,
  Check,
  Menu,
  X,
} from 'lucide-react';

const MINT = '#00FFB2';

// The three agents — showcased as the product.
const AGENTS = [
  {
    name: 'Attract',
    tagline: 'Fills the top of your funnel.',
    color: '#a78bfa',
    icon: Megaphone,
    body: 'Keeps your storefront and content fresh and runs campaigns on its own, so new and returning customers keep coming in.',
    items: ['On-brand content & posts', 'Email, SMS & social campaigns'],
  },
  {
    name: 'Retain',
    tagline: 'Brings customers back.',
    color: '#2dd4bf',
    icon: RotateCcw,
    body: 'Notices when someone drifts away and reaches out automatically, and quietly fills the gaps in your calendar.',
    items: ['Automatic customer win-back', 'Rebooking & fewer no-shows'],
  },
  {
    name: 'Serve',
    tagline: 'Looks after your customers.',
    color: '#60a5fa',
    icon: MessageCircle,
    body: 'Answers client questions day or night and keeps everyone informed with timely reminders.',
    items: ['24/7 client answers', 'Reminders & notifications'],
  },
];

const INCLUDED = ['Online booking', 'Branded storefront', 'In-person POS', 'Payments', 'Email & SMS', 'Customer records'];

const PLANS = [
  { name: 'Starter', price: '$97', popular: false, features: ['Booking, storefront & payments', 'The Attract agent', 'Customer records & messaging', 'Email support'] },
  { name: 'Growth', price: '$297', popular: true, features: ['Everything in Starter', 'Add the Retain agent', 'Win-back + a calendar that fills itself', 'Campaigns across email, SMS & social', 'Priority support'] },
  { name: 'Enterprise', price: '$897', popular: false, features: ['Everything in Growth', 'Add the Serve agent (24/7)', 'Multiple locations & brands', 'Custom domain & white-label', 'Dedicated account manager'] },
];

export default function PlatformPage() {
  const [menu, setMenu] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white antialiased">
      {/* Announcement bar */}
      <div className="w-full text-center text-xs sm:text-sm py-2.5 px-4 border-b border-white/10 text-white/70">
        Now live: <span className="text-white">Kelatic Hair Lounge</span> &amp;{' '}
        <span className="text-white">Kelatic Vitality House</span> run on x3o
        <span className="hidden sm:inline"> · Powered by Claude</span>
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 bg-[#0a0a0a]/80 backdrop-blur border-b border-white/10">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <a href="#top" className="text-xl font-bold tracking-tight">
            x3o<span style={{ color: MINT }}>.ai</span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-sm text-white/70">
            <a href="#agents" className="hover:text-white">The agents</a>
            <a href="#proof" className="hover:text-white">Results</a>
            <a href="#pricing" className="hover:text-white">Pricing</a>
            <a href="https://kelatic.x3o.ai" target="_blank" rel="noopener noreferrer" className="hover:text-white">See it live</a>
            <a href="/get-started" className="px-4 py-2 rounded-full font-semibold text-black" style={{ backgroundColor: MINT }}>
              Start free trial
            </a>
          </nav>
          <button className="md:hidden p-2 text-white/80" onClick={() => setMenu((v) => !v)} aria-label="Menu">
            {menu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menu && (
          <div className="md:hidden border-t border-white/10 px-5 py-4 flex flex-col gap-3 text-sm text-white/80">
            <a href="#agents" onClick={() => setMenu(false)}>The agents</a>
            <a href="#proof" onClick={() => setMenu(false)}>Results</a>
            <a href="#pricing" onClick={() => setMenu(false)}>Pricing</a>
            <a href="https://kelatic.x3o.ai" target="_blank" rel="noopener noreferrer">See it live</a>
            <a href="/get-started" onClick={() => setMenu(false)} className="px-4 py-2 rounded-full font-semibold text-black text-center" style={{ backgroundColor: MINT }}>
              Start free trial
            </a>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-20" style={{ backgroundColor: MINT }} />
        <div className="relative max-w-4xl mx-auto px-5 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold mb-6" style={{ color: MINT }}>
            <Sparkles className="w-4 h-4" /> The AI business platform
          </div>
          <h1 className="text-4xl sm:text-6xl font-black leading-[1.05] tracking-tight">
            Three AI agents that run{' '}
            <span style={{ color: MINT }}>your whole business.</span>
          </h1>
          <p className="text-lg text-white/60 mt-6 max-w-2xl mx-auto">
            Meet Attract, Retain, and Serve — they handle your marketing, your rebooking, and your front desk,
            so you can focus on customers instead of running ten apps.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-9">
            <a href="/get-started" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold text-black" style={{ backgroundColor: MINT }}>
              Start free trial <ArrowRight className="w-4 h-4" />
            </a>
            <a href="#agents" className="px-6 py-3.5 rounded-full font-semibold border border-white/20 text-white/90 hover:bg-white/5">
              Meet the agents →
            </a>
          </div>
          <p className="text-xs text-white/40 mt-5">Live in about a day · No setup headaches · Powered by Claude</p>
        </div>
      </section>

      {/* Problem */}
      <section className="border-t border-white/10 bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-widest font-semibold text-white/40 mb-2">The problem</div>
            <h2 className="text-3xl sm:text-4xl font-bold">Running a local business is too many jobs</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { t: 'Marketing falls behind', b: 'There’s never enough time to post, email, and run promotions — so growth stalls.' },
              { t: 'Customers slip away', b: 'Regulars quietly stop coming, and no one follows up to bring them back.' },
              { t: 'The front desk never sleeps', b: 'Questions and bookings pile up after hours, and no-shows eat into the day.' },
            ].map((c) => (
              <div key={c.t} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                <h3 className="font-semibold text-lg">{c.t}</h3>
                <p className="text-white/55 text-sm mt-2 leading-relaxed">{c.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The three agents */}
      <section id="agents" className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: MINT }}>Your AI team</div>
            <h2 className="text-3xl sm:text-4xl font-bold">Meet your three agents</h2>
            <p className="text-white/55 mt-3 max-w-2xl mx-auto">
              You set the goal. Attract, Retain, and Serve handle the rest — quietly, in your brand, around the clock.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {AGENTS.map((a) => (
              <div key={a.name} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: `${a.color}22`, color: a.color }}>
                  <a.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">{a.name}</h3>
                <p className="text-sm font-medium mb-3" style={{ color: a.color }}>{a.tagline}</p>
                <p className="text-white/55 text-sm leading-relaxed flex-1">{a.body}</p>
                <ul className="mt-4 space-y-2">
                  {a.items.map((it) => (
                    <li key={it} className="flex items-start gap-2 text-sm text-white/75">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: MINT }} /> {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Included band */}
          <div className="mt-10 bg-white/[0.03] border border-white/10 rounded-2xl p-6">
            <div className="text-sm text-white/50 mb-3">All three run on one platform — everything included, no extra tools to buy:</div>
            <div className="flex flex-wrap gap-2">
              {INCLUDED.map((i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border border-white/10 text-white/80">
                  <Check className="w-3.5 h-3.5" style={{ color: MINT }} /> {i}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Proof */}
      <section id="proof" className="border-t border-white/10 bg-[#0d0d0d]">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: MINT }}>Real results</div>
            <h2 className="text-3xl sm:text-4xl font-bold">What the agents did for Kelatic</h2>
            <p className="text-white/55 mt-3">A Houston studio — now running a second brand on the same platform.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { v: '+$5,510', l: 'recovered every month' },
              { v: '18.5×', l: 'return on the Growth plan' },
              { v: '23%', l: 'of lost clients won back' },
              { v: '~24h', l: 'from signup to live' },
            ].map((s) => (
              <div key={s.l} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 text-center">
                <div className="text-3xl font-black" style={{ color: MINT }}>{s.v}</div>
                <div className="text-xs text-white/50 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <a href="https://kelaticvitalityhouse.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
              See the second brand → kelaticvitalityhouse.com
            </a>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="text-center mb-12">
            <div className="text-xs uppercase tracking-widest font-semibold mb-2" style={{ color: MINT }}>Pricing</div>
            <h2 className="text-3xl sm:text-4xl font-bold">Add agents as you grow</h2>
            <p className="text-white/55 mt-3">White-label and live in about a day. Cancel anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl p-6 border ${p.popular ? 'bg-white/[0.05]' : 'bg-white/[0.03] border-white/10'}`}
                style={p.popular ? { borderColor: MINT } : undefined}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{p.name}</span>
                  {p.popular && (
                    <span className="text-[10px] uppercase tracking-wide font-bold px-2 py-1 rounded-full text-black" style={{ backgroundColor: MINT }}>
                      Most popular
                    </span>
                  )}
                </div>
                <div className="mt-4 text-4xl font-black">
                  {p.price}<span className="text-base font-medium text-white/40">/mo</span>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/75">
                      <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: MINT }} /> {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="/get-started"
                  className={`mt-6 block text-center px-4 py-2.5 rounded-full font-semibold ${p.popular ? 'text-black' : 'border border-white/20 text-white hover:bg-white/5'}`}
                  style={p.popular ? { backgroundColor: MINT } : undefined}
                >
                  {p.name === 'Enterprise' ? 'Contact sales' : 'Start free trial'}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="start" className="border-t border-white/10 bg-[#0d0d0d]">
        <div className="max-w-3xl mx-auto px-5 py-20 text-center">
          <h2 className="text-3xl sm:text-5xl font-black leading-tight">
            Your three agents can be working{' '}
            <span style={{ color: MINT }}>by tomorrow.</span>
          </h2>
          <p className="text-white/60 mt-5">
            Tell us about your business and we&apos;ll have your site, payments, and agents live in about a day.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <a href="https://kelatic.x3o.ai" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-black" style={{ backgroundColor: MINT }}>
              Start free trial <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/50">
          <div className="text-white font-bold">x3o<span style={{ color: MINT }}>.ai</span></div>
          <div>© {new Date().getFullYear()} Sonnier Ventures. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}
