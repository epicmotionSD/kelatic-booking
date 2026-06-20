'use client'

import { useState } from 'react'
import './x3o-styles.css'

type TabKey = 'overview' | 'team' | 'proof' | 'pricing' | 'start'

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return <span className={`x3o-tag x3o-tag-${color}`}>{children}</span>
}

function Dot({ color }: { color: string }) {
  return <span style={{
    display: 'inline-block',
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: color,
    marginRight: 8,
  }} />
}

const AGENTS = [
  { icon: '✍️', name: 'Trinity', role: 'Content & brand creative', desc: 'Writes posts, captions, and campaigns in your brand voice — and keeps your content calendar full.' },
  { icon: '📣', name: 'Marketing Agent', role: 'Campaign operator', desc: 'Plans and runs your email, SMS, and social campaigns, then tracks what actually drove bookings.' },
  { icon: '🔁', name: 'Retention Agent', role: 'Win-back operator', desc: 'Notices clients who have gone quiet and runs personalized win-back sequences automatically.' },
  { icon: '📅', name: 'Scheduling Agent', role: 'Calendar operator', desc: 'Finds and fills gaps in your calendar, sends reminders, and cuts down no-shows.' },
  { icon: '💬', name: 'Support Agent', role: 'Front-desk operator', desc: 'Answers client questions and handles requests 24/7 from your own knowledge base.' },
]

const PLATFORM = [
  { icon: '🗓️', label: 'Online booking' },
  { icon: '🛍️', label: 'Branded storefront + checkout' },
  { icon: '💳', label: 'In-person POS' },
  { icon: '💵', label: 'Payments' },
  { icon: '✉️', label: 'Email & SMS' },
  { icon: '👥', label: 'Client records' },
]

export default function PlatformPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'team', label: 'Your AI Team' },
    { key: 'proof', label: 'Proof · KeLatic' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'start', label: 'Get Started' },
  ]

  return (
    <div className="x3o-root">
      {/* ── Topbar ── */}
      <header className="x3o-topbar">
        <div className="x3o-topbar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="x3o-logo">x3o<span className="x3o-logo-dot">.ai</span></span>
            <Tag color="amber">Powered by Claude</Tag>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href="https://kelatic.x3o.ai" className="x3o-btn x3o-btn-ghost" target="_blank" rel="noopener noreferrer">
              See it live → kelatic.x3o.ai
            </a>
            <a href="#start" className="x3o-btn x3o-btn-primary" onClick={(e) => { e.preventDefault(); setActiveTab('start') }}>
              Start Free Trial
            </a>
          </div>
        </div>
      </header>

      {/* ── Navigation ── */}
      <nav className="x3o-nav">
        <div className="x3o-nav-inner">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`x3o-nav-tab${activeTab === t.key ? ' active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ══════════════ Overview ══════════════ */}
      {activeTab === 'overview' && (
        <main className="x3o-main">
          <div className="x3o-hero-strip">
            <h1>Your business, run by a team of AI agents.</h1>
            <p className="x3o-hero-sub">Hire your AI operations team — live in a day.</p>
            <p style={{ color: 'var(--x3o-muted)', maxWidth: 640, margin: '0 auto' }}>
              x3o gives every local business a team of AI agents — for marketing, retention, scheduling,
              support, and content — running on top of a full booking, storefront, and payments platform.
              You set the goal. The agents do the work.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
              <a href="#start" className="x3o-btn x3o-btn-primary" onClick={(e) => { e.preventDefault(); setActiveTab('start') }}>
                Start Free Trial
              </a>
              <a href="https://kelatic.x3o.ai" className="x3o-btn x3o-btn-ghost" target="_blank" rel="noopener noreferrer">
                See it live →
              </a>
            </div>
          </div>

          <div className="x3o-g4">
            <div className="x3o-card" style={{ textAlign: 'center' }}>
              <div className="x3o-metric-val x3o-val-green">+$5,510</div>
              <div className="x3o-metric-label">Revenue recovered / mo (KeLatic)</div>
            </div>
            <div className="x3o-card" style={{ textAlign: 'center' }}>
              <div className="x3o-metric-val">18.5×</div>
              <div className="x3o-metric-label">ROI on the Growth plan</div>
            </div>
            <div className="x3o-card" style={{ textAlign: 'center' }}>
              <div className="x3o-metric-val">5</div>
              <div className="x3o-metric-label">AI agents on your team</div>
            </div>
            <div className="x3o-card" style={{ textAlign: 'center' }}>
              <div className="x3o-metric-val">~24h</div>
              <div className="x3o-metric-label">From signup to live</div>
            </div>
          </div>

          {/* Problem / Solution */}
          <div className="x3o-g2">
            <div className="x3o-card">
              <Tag color="red">The problem</Tag>
              <h3 style={{ margin: '12px 0 8px' }}>You&apos;re wearing every hat</h3>
              <ul style={{ color: 'var(--x3o-muted)', lineHeight: 1.7, paddingLeft: 18 }}>
                <li>Marketing slips — no time to post or run campaigns</li>
                <li>Past clients quietly disappear, with no follow-up</li>
                <li>The calendar has gaps nobody fills</li>
                <li>Questions pile up after hours</li>
                <li>&quot;AI tools&quot; so far just mean more dashboards to read</li>
              </ul>
            </div>
            <div className="x3o-card-accent">
              <Tag color="green">The x3o way</Tag>
              <h3 style={{ margin: '12px 0 8px' }}>A team that does the work</h3>
              <ul style={{ color: 'var(--x3o-muted)', lineHeight: 1.7, paddingLeft: 18 }}>
                <li><strong>Trinity</strong> creates your content & campaigns</li>
                <li><strong>Marketing</strong> runs them across email, SMS & social</li>
                <li><strong>Retention</strong> wins back clients who drifted away</li>
                <li><strong>Scheduling</strong> fills your calendar & cuts no-shows</li>
                <li><strong>Support</strong> answers clients around the clock</li>
              </ul>
            </div>
          </div>

          {/* Why it's different */}
          <div className="x3o-g3" style={{ marginTop: 24 }}>
            <div className="x3o-card">
              <Tag color="purple">A team, not a dashboard</Tag>
              <p style={{ marginTop: 8, fontSize: 13, color: 'var(--x3o-muted)', lineHeight: 1.6 }}>
                x3o agents take action — they post, message, follow up, and book — instead of handing you
                another chart to interpret.
              </p>
            </div>
            <div className="x3o-card">
              <Tag color="blue">Runs the whole business</Tag>
              <p style={{ marginTop: 8, fontSize: 13, color: 'var(--x3o-muted)', lineHeight: 1.6 }}>
                Booking, storefront, POS, payments, and client comms are built in — so the agents operate a
                real business end-to-end.
              </p>
            </div>
            <div className="x3o-card">
              <Tag color="green">In your brand</Tag>
              <p style={{ marginTop: 8, fontSize: 13, color: 'var(--x3o-muted)', lineHeight: 1.6 }}>
                Fully white-label — your name, your colors, your domain. Your customers never see &quot;x3o.&quot;
              </p>
            </div>
          </div>
        </main>
      )}

      {/* ══════════════ Your AI Team ══════════════ */}
      {activeTab === 'team' && (
        <main className="x3o-main">
          <h2>Meet your AI team</h2>
          <p style={{ color: 'var(--x3o-muted)', marginBottom: 24, maxWidth: 680 }}>
            Five agents, each with a job. They work together, in your brand voice, on top of the platform
            that actually runs your business.
          </p>

          <div className="x3o-g3">
            {AGENTS.map((a) => (
              <div className="x3o-card" key={a.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <span style={{ fontSize: 26 }}>{a.icon}</span>
                  <Tag color="green">Active</Tag>
                </div>
                <h4 style={{ margin: '10px 0 2px' }}>{a.name}</h4>
                <div style={{ fontSize: 12, color: 'var(--x3o-accent)', marginBottom: 6 }}>{a.role}</div>
                <p style={{ fontSize: 13, color: 'var(--x3o-muted)', lineHeight: 1.6 }}>{a.desc}</p>
              </div>
            ))}
          </div>

          {/* Platform underneath */}
          <div className="x3o-card" style={{ marginTop: 32 }}>
            <h3 style={{ marginBottom: 6 }}>The platform underneath</h3>
            <p style={{ color: 'var(--x3o-muted)', marginBottom: 16, fontSize: 14 }}>
              The agents can do real work because they run on a real operational stack — all included.
            </p>
            <div className="x3o-g3">
              {PLATFORM.map((p) => (
                <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: 'rgba(255,255,255,.03)', borderRadius: 8 }}>
                  <span style={{ fontSize: 22 }}>{p.icon}</span>
                  <span style={{ fontSize: 14 }}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {/* ══════════════ Proof · KeLatic ══════════════ */}
      {activeTab === 'proof' && (
        <main className="x3o-main">
          <div className="x3o-cs-hero">
            <Tag color="green">Live · Production</Tag>
            <h2 style={{ margin: '12px 0 4px' }}>What KeLatic&apos;s agents recovered</h2>
            <p style={{ color: 'var(--x3o-muted)' }}>
              The first business run on x3o — a premium loc studio in Houston, TX. Same owner now runs a second
              brand, KeLatic Vitality House, on the same platform.
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <a href="https://kelatic.x3o.ai" className="x3o-btn x3o-btn-primary" target="_blank" rel="noopener noreferrer">
                Visit kelatic.x3o.ai →
              </a>
              <a href="https://kelaticvitalityhouse.com" className="x3o-btn x3o-btn-ghost" target="_blank" rel="noopener noreferrer">
                kelaticvitalityhouse.com →
              </a>
            </div>
          </div>

          <div className="x3o-g4">
            <div className="x3o-card" style={{ textAlign: 'center' }}>
              <div className="x3o-metric-val x3o-val-green">+$5,510</div>
              <div className="x3o-metric-label">Monthly revenue recovered</div>
            </div>
            <div className="x3o-card" style={{ textAlign: 'center' }}>
              <div className="x3o-metric-val">18.5×</div>
              <div className="x3o-metric-label">ROI on $297/mo plan</div>
            </div>
            <div className="x3o-card" style={{ textAlign: 'center' }}>
              <div className="x3o-metric-val">23%</div>
              <div className="x3o-metric-label">Ghost clients won back</div>
            </div>
            <div className="x3o-card" style={{ textAlign: 'center' }}>
              <div className="x3o-metric-val">142</div>
              <div className="x3o-metric-label">Active clients managed</div>
            </div>
          </div>

          <div className="x3o-card" style={{ marginTop: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Where the lift came from</h3>
            <div className="x3o-table-wrap">
              <table className="x3o-table">
                <thead>
                  <tr><th>Outcome</th><th>Monthly impact</th><th>Which agent</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Clients won back</td>
                    <td style={{ color: 'var(--x3o-green)' }}>+$3,200</td>
                    <td>Retention Agent</td>
                  </tr>
                  <tr>
                    <td>Calendar gaps filled</td>
                    <td style={{ color: 'var(--x3o-green)' }}>+$1,100</td>
                    <td>Scheduling Agent</td>
                  </tr>
                  <tr>
                    <td>Bookings from content</td>
                    <td style={{ color: 'var(--x3o-green)' }}>+$680</td>
                    <td>Trinity + Marketing</td>
                  </tr>
                  <tr>
                    <td>Upsells & add-ons</td>
                    <td style={{ color: 'var(--x3o-green)' }}>+$530</td>
                    <td>Marketing Agent</td>
                  </tr>
                  <tr style={{ fontWeight: 600, borderTop: '1px solid rgba(255,255,255,.1)' }}>
                    <td>Total monthly lift</td>
                    <td style={{ color: 'var(--x3o-green)' }}>+$5,510</td>
                    <td>18.5× ROI on $297/mo</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* ══════════════ Pricing ══════════════ */}
      {activeTab === 'pricing' && (
        <main className="x3o-main">
          <h2>Pricing</h2>
          <p style={{ color: 'var(--x3o-muted)', marginBottom: 24 }}>
            Every plan is white-label, includes the full platform, and is live in about a day. Pick how big a
            team you want working for you.
          </p>

          <div className="x3o-g3">
            <div className="x3o-price-card">
              <Tag color="green">Starter</Tag>
              <div className="x3o-price">$97<span className="x3o-price-period">/mo</span></div>
              <ul className="x3o-price-features">
                <li><Dot color="var(--x3o-green)" />Booking, storefront & payments</li>
                <li><Dot color="var(--x3o-green)" />Trinity content agent</li>
                <li><Dot color="var(--x3o-green)" />Monthly content calendar</li>
                <li><Dot color="var(--x3o-green)" />Client records & messaging</li>
                <li><Dot color="var(--x3o-green)" />Email support</li>
              </ul>
              <button className="x3o-btn x3o-btn-ghost" style={{ width: '100%' }} onClick={() => setActiveTab('start')}>Start Free Trial</button>
            </div>

            <div className="x3o-price-card x3o-price-featured">
              <Tag color="amber">Most Popular</Tag>
              <div className="x3o-price">$297<span className="x3o-price-period">/mo</span></div>
              <ul className="x3o-price-features">
                <li><Dot color="var(--x3o-green)" />Everything in Starter</li>
                <li><Dot color="var(--x3o-accent)" />Retention agent (auto win-back)</li>
                <li><Dot color="var(--x3o-accent)" />Marketing agent (email/SMS/social)</li>
                <li><Dot color="var(--x3o-accent)" />Scheduling agent (fill gaps)</li>
                <li><Dot color="var(--x3o-accent)" />Weekly AI content</li>
                <li><Dot color="var(--x3o-accent)" />Priority support + Slack</li>
              </ul>
              <button className="x3o-btn x3o-btn-primary" style={{ width: '100%' }} onClick={() => setActiveTab('start')}>Start Free Trial</button>
            </div>

            <div className="x3o-price-card">
              <Tag color="purple">Enterprise</Tag>
              <div className="x3o-price">$897<span className="x3o-price-period">/mo</span></div>
              <ul className="x3o-price-features">
                <li><Dot color="var(--x3o-green)" />Everything in Growth</li>
                <li><Dot color="var(--x3o-purple)" />Support agent (24/7 front desk)</li>
                <li><Dot color="var(--x3o-purple)" />Multi-location & multi-brand</li>
                <li><Dot color="var(--x3o-purple)" />Custom agent instructions</li>
                <li><Dot color="var(--x3o-purple)" />Dedicated account manager</li>
                <li><Dot color="var(--x3o-purple)" />Custom domain & white-label</li>
              </ul>
              <button className="x3o-btn x3o-btn-ghost" style={{ width: '100%' }} onClick={() => setActiveTab('start')}>Contact Sales</button>
            </div>
          </div>
        </main>
      )}

      {/* ══════════════ Get Started ══════════════ */}
      {activeTab === 'start' && (
        <main className="x3o-main" id="start">
          <h2>Live in about a day</h2>
          <p style={{ color: 'var(--x3o-muted)', marginBottom: 24, maxWidth: 640 }}>
            No long setup, no migration headache. Tell us about your business and your AI team goes to work.
          </p>

          <div className="x3o-g3">
            <div className="x3o-card-accent">
              <Tag color="green">Step 1</Tag>
              <h3 style={{ margin: '12px 0 8px' }}>Tell us about your business</h3>
              <p style={{ color: 'var(--x3o-muted)', lineHeight: 1.7, fontSize: 14 }}>
                Your services or menu, your brand, your hours. A few minutes is all it takes.
              </p>
            </div>
            <div className="x3o-card">
              <Tag color="amber">Step 2</Tag>
              <h3 style={{ margin: '12px 0 8px' }}>We deploy your site & agents</h3>
              <p style={{ color: 'var(--x3o-muted)', lineHeight: 1.7, fontSize: 14 }}>
                Within ~24 hours: a branded booking site or storefront, payments, and your AI team configured.
              </p>
            </div>
            <div className="x3o-card">
              <Tag color="blue">Step 3</Tag>
              <h3 style={{ margin: '12px 0 8px' }}>Approve and go live</h3>
              <p style={{ color: 'var(--x3o-muted)', lineHeight: 1.7, fontSize: 14 }}>
                Review your site and first campaigns, point your domain, and your agents start working.
              </p>
            </div>
          </div>

          <div style={{ textAlign: 'center', margin: '32px 0' }}>
            <a href="https://kelatic.x3o.ai" className="x3o-btn x3o-btn-primary" target="_blank" rel="noopener noreferrer">
              Start Free Trial
            </a>
          </div>

          {/* FAQ */}
          <div className="x3o-card">
            <h3 style={{ marginBottom: 16 }}>Common questions</h3>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <strong>Do my customers see &quot;x3o&quot;?</strong>
                <p style={{ color: 'var(--x3o-muted)', fontSize: 14, marginTop: 4 }}>No. Everything is white-label — your name, your colors, your domain (like kelatic.com or kelaticvitalityhouse.com).</p>
              </div>
              <div>
                <strong>Do the agents act on their own?</strong>
                <p style={{ color: 'var(--x3o-muted)', fontSize: 14, marginTop: 4 }}>They draft and run the work; you stay in control and can review or approve campaigns and messages.</p>
              </div>
              <div>
                <strong>What kinds of businesses is this for?</strong>
                <p style={{ color: 'var(--x3o-muted)', fontSize: 14, marginTop: 4 }}>Local service & retail — salons, barbershops, cafés, studios, spas. If you book appointments or sell products, x3o fits.</p>
              </div>
              <div>
                <strong>Is payment processing included?</strong>
                <p style={{ color: 'var(--x3o-muted)', fontSize: 14, marginTop: 4 }}>Yes — online checkout and in-person POS run on Stripe, built in.</p>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ── Footer ── */}
      <footer className="x3o-footer">
        <p>x3o.ai — your business, run by a team of AI agents.</p>
        <p style={{ marginTop: 8 }}>
          © {new Date().getFullYear()} Sonnier Ventures. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
