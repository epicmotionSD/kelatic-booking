'use client'

import { useState } from 'react'
import './x3o-styles.css'

type TabKey = 'overview' | 'architecture' | 'casestudy' | 'marketplace' | 'pricing' | 'gtm'

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

export default function PlatformPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'architecture', label: 'Architecture' },
    { key: 'casestudy', label: 'Case Study · KeLatic' },
    { key: 'marketplace', label: 'Marketplace' },
    { key: 'pricing', label: 'Pricing' },
    { key: 'gtm', label: 'GTM Strategy' },
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
              Live Demo → kelatic.x3o.ai
            </a>
            <a href="#pricing" className="x3o-btn x3o-btn-primary" onClick={(e) => { e.preventDefault(); setActiveTab('pricing') }}>
              Get Started
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

      {/* ══════════════ Tab: Overview ══════════════ */}
      {activeTab === 'overview' && (
        <main className="x3o-main">
          <div className="x3o-hero-strip">
            <h1>x3o Intelligence</h1>
            <p className="x3o-hero-sub">Claude-Powered B2B Intelligence Marketplace</p>
            <p style={{ color: 'var(--x3o-muted)', maxWidth: 620, margin: '0 auto' }}>
              We deploy Claude as domain-specific AI operators for service businesses.
              Each vertical gets a white-label intelligence layer — social metrics,
              competitor intel, campaign performance, booking funnel analysis, content
              calendars, and automated client re-engagement — all orchestrated through
              Anthropic&apos;s API.
            </p>
          </div>

          <div className="x3o-g4">
            <div className="x3o-card" style={{ textAlign: 'center' }}>
              <div className="x3o-metric">$297</div>
              <div className="x3o-metric-label">Avg MRR / Tenant</div>
            </div>
            <div className="x3o-card" style={{ textAlign: 'center' }}>
              <div className="x3o-metric">18.5×</div>
              <div className="x3o-metric-label">Client ROI (KeLatic)</div>
            </div>
            <div className="x3o-card" style={{ textAlign: 'center' }}>
              <div className="x3o-metric">6</div>
              <div className="x3o-metric-label">Verticals Targeted</div>
            </div>
            <div className="x3o-card" style={{ textAlign: 'center' }}>
              <div className="x3o-metric">~$1.2M</div>
              <div className="x3o-metric-label">Year-1 Revenue Target</div>
            </div>
          </div>

          {/* Problem / Solution */}
          <div className="x3o-g2">
            <div className="x3o-card">
              <Tag color="red">Problem</Tag>
              <h3 style={{ margin: '12px 0 8px' }}>Service Businesses Are Flying Blind</h3>
              <ul style={{ color: 'var(--x3o-muted)', lineHeight: 1.7, paddingLeft: 18 }}>
                <li>No visibility into social engagement trends</li>
                <li>Manual competitor monitoring (or none at all)</li>
                <li>No data-driven content calendar</li>
                <li>Ghost clients disappear without follow-up</li>
                <li>Campaign ROI is a guess</li>
              </ul>
            </div>
            <div className="x3o-card-accent">
              <Tag color="green">Solution</Tag>
              <h3 style={{ margin: '12px 0 8px' }}>Claude as Your Business AI Operator</h3>
              <ul style={{ color: 'var(--x3o-muted)', lineHeight: 1.7, paddingLeft: 18 }}>
                <li><strong>Social Intelligence</strong> — real-time engagement analysis</li>
                <li><strong>Competitor Radar</strong> — automated positioning alerts</li>
                <li><strong>Campaign Analytics</strong> — ROI tracking &amp; optimization</li>
                <li><strong>Booking Funnel AI</strong> — drop-off detection &amp; recovery</li>
                <li><strong>Content Engine</strong> — AI-generated calendar &amp; copy</li>
                <li><strong>Client Re-engagement</strong> — automated win-back sequences</li>
              </ul>
            </div>
          </div>

          {/* Claude Ecosystem */}
          <div className="x3o-card" style={{ marginTop: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Claude Ecosystem Mapping</h3>
            <div className="x3o-g3">
              <div style={{ padding: 16, background: 'rgba(255,255,255,.03)', borderRadius: 8 }}>
                <Tag color="purple">Claude API</Tag>
                <p style={{ marginTop: 8, fontSize: 13, color: 'var(--x3o-muted)' }}>
                  Powers all AI intelligence — social analysis, content generation,
                  campaign recommendations, and natural-language dashboard queries.
                </p>
              </div>
              <div style={{ padding: 16, background: 'rgba(255,255,255,.03)', borderRadius: 8 }}>
                <Tag color="blue">MCP Server</Tag>
                <p style={{ marginTop: 8, fontSize: 13, color: 'var(--x3o-muted)' }}>
                  Exposes x3o tools to Claude Desktop &amp; third-party agents via
                  the Model Context Protocol. Each vertical becomes an MCP toolset.
                </p>
              </div>
              <div style={{ padding: 16, background: 'rgba(255,255,255,.03)', borderRadius: 8 }}>
                <Tag color="green">Marketplace Listing</Tag>
                <p style={{ marginTop: 8, fontSize: 13, color: 'var(--x3o-muted)' }}>
                  Listed on Anthropic&apos;s marketplace as a B2B intelligence
                  provider — giving Claude users direct access to vertical-specific
                  business tools.
                </p>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ══════════════ Tab: Architecture ══════════════ */}
      {activeTab === 'architecture' && (
        <main className="x3o-main">
          <h2>System Architecture</h2>
          <p style={{ color: 'var(--x3o-muted)', marginBottom: 24 }}>
            x3o Intelligence is built as a composable pipeline: ingest → enrich → act.
            Claude sits at the centre of every decision node.
          </p>

          {/* Data Flow */}
          <div className="x3o-card" style={{ marginBottom: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Data Flow</h3>
            <div className="x3o-arch-flow">
              <div className="x3o-arch-node">
                <div className="x3o-arch-node-title">Data Sources</div>
                <div className="x3o-arch-node-body">
                  Instagram API · Google Business · Stripe · Booking System · CRM
                </div>
              </div>
              <div className="x3o-arch-arrow">→</div>
              <div className="x3o-arch-node x3o-arch-node-highlight">
                <div className="x3o-arch-node-title">Claude API</div>
                <div className="x3o-arch-node-body">
                  Analysis · Classification · Generation · Recommendations
                </div>
              </div>
              <div className="x3o-arch-arrow">→</div>
              <div className="x3o-arch-node">
                <div className="x3o-arch-node-title">Intelligence Layer</div>
                <div className="x3o-arch-node-body">
                  Dashboards · Alerts · Automations · Content Calendar
                </div>
              </div>
              <div className="x3o-arch-arrow">→</div>
              <div className="x3o-arch-node">
                <div className="x3o-arch-node-title">Business Outcomes</div>
                <div className="x3o-arch-node-body">
                  Revenue ↑ · Retention ↑ · Costs ↓ · Time Saved
                </div>
              </div>
            </div>
          </div>

          {/* Code Samples */}
          <div className="x3o-g2">
            <div className="x3o-card">
              <h4 style={{ marginBottom: 12 }}>Claude API Integration</h4>
              <pre className="x3o-code">{`const analysis = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  system: verticalPrompts[business.vertical],
  messages: [{
    role: "user",
    content: \`Analyze engagement trends:
    \${JSON.stringify(metrics)}\`
  }]
});`}</pre>
            </div>
            <div className="x3o-card">
              <h4 style={{ marginBottom: 12 }}>MCP Server Config</h4>
              <pre className="x3o-code">{`{
  "mcpServers": {
    "x3o-intelligence": {
      "url": "https://x3o.ai/mcp",
      "tools": [
        "analyze_social_metrics",
        "get_competitor_intel",
        "generate_content_calendar",
        "check_booking_funnel",
        "run_campaign_analysis"
      ]
    }
  }
}`}</pre>
            </div>
          </div>

          {/* Vertical System Prompts */}
          <div className="x3o-card" style={{ marginTop: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Vertical System Prompts</h3>
            <p style={{ color: 'var(--x3o-muted)', marginBottom: 16 }}>
              Each vertical gets a specialized Claude system prompt that understands
              domain-specific metrics, terminology, and success patterns.
            </p>
            <div className="x3o-table-wrap">
              <table className="x3o-table">
                <thead>
                  <tr><th>Vertical</th><th>Key Metrics</th><th>Domain Knowledge</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td><Tag color="purple">Beauty &amp; Locs</Tag></td>
                    <td>Rebooking rate, avg ticket, ghost client %</td>
                    <td>Service duration, product upsells, seasonal trends</td>
                  </tr>
                  <tr>
                    <td><Tag color="amber">Restaurants</Tag></td>
                    <td>Table turnover, avg check, review velocity</td>
                    <td>Menu optimization, peak hours, delivery mix</td>
                  </tr>
                  <tr>
                    <td><Tag color="green">Fitness</Tag></td>
                    <td>Member retention, class fill rate, LTV</td>
                    <td>Session packages, trainer utilization, churn signals</td>
                  </tr>
                  <tr>
                    <td><Tag color="blue">Retail</Tag></td>
                    <td>Foot traffic, conversion rate, basket size</td>
                    <td>Inventory turns, seasonal planning, loyalty program</td>
                  </tr>
                  <tr>
                    <td><Tag color="teal">Med Spas</Tag></td>
                    <td>Treatment rebooking, package conversion, referral rate</td>
                    <td>Treatment protocols, consent flows, provider scheduling</td>
                  </tr>
                  <tr>
                    <td><Tag color="red">Legal</Tag></td>
                    <td>Consultation conversion, case pipeline, billing efficiency</td>
                    <td>Practice area routing, intake qualification, trust accounting</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* ══════════════ Tab: Case Study · KeLatic ══════════════ */}
      {activeTab === 'casestudy' && (
        <main className="x3o-main">
          <div className="x3o-cs-hero">
            <Tag color="green">Live · Production</Tag>
            <h2 style={{ margin: '12px 0 4px' }}>
              KeLatic — Loc Intelligence Platform
            </h2>
            <p style={{ color: 'var(--x3o-muted)' }}>
              First x3o vertical deployment. Full-stack AI operations for a premium
              loc studio in Phoenix, AZ.
            </p>
            <a
              href="https://kelatic.x3o.ai"
              className="x3o-btn x3o-btn-primary"
              style={{ marginTop: 16 }}
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit kelatic.x3o.ai →
            </a>
          </div>

          {/* Metrics */}
          <div className="x3o-g4">
            <div className="x3o-card" style={{ textAlign: 'center' }}>
              <div className="x3o-metric" style={{ color: '#22c55e' }}>+$5,510</div>
              <div className="x3o-metric-label">Monthly Revenue Recovered</div>
            </div>
            <div className="x3o-card" style={{ textAlign: 'center' }}>
              <div className="x3o-metric">18.5×</div>
              <div className="x3o-metric-label">ROI on $297/mo plan</div>
            </div>
            <div className="x3o-card" style={{ textAlign: 'center' }}>
              <div className="x3o-metric">23%</div>
              <div className="x3o-metric-label">Ghost Client Recovery</div>
            </div>
            <div className="x3o-card" style={{ textAlign: 'center' }}>
              <div className="x3o-metric">142</div>
              <div className="x3o-metric-label">Active Clients Managed</div>
            </div>
          </div>

          {/* Deployed Modules */}
          <h3 style={{ margin: '32px 0 16px' }}>Deployed Intelligence Modules</h3>
          <div className="x3o-g3">
            {[
              {
                icon: '📊',
                title: 'Social Intelligence',
                desc: 'Instagram engagement analysis, optimal posting times, hashtag performance, competitor content monitoring.',
                tag: { color: 'green', label: 'Active' },
              },
              {
                icon: '👻',
                title: 'Ghost Client Recovery',
                desc: '90-day no-show detection, personalized win-back sequences, automated SMS/email campaigns with Claude-generated copy.',
                tag: { color: 'green', label: 'Active' },
              },
              {
                icon: '📅',
                title: 'Content Calendar AI',
                desc: 'Weekly content plans generated by Claude, aligned with booking availability, holidays, and trending topics.',
                tag: { color: 'green', label: 'Active' },
              },
              {
                icon: '🔍',
                title: 'Competitor Radar',
                desc: 'Automated monitoring of competitor pricing, services, reviews, and social engagement within 10-mile radius.',
                tag: { color: 'amber', label: 'Beta' },
              },
              {
                icon: '📈',
                title: 'Campaign Analytics',
                desc: 'Track ROI across email, SMS, and social campaigns. Claude provides optimization recommendations.',
                tag: { color: 'amber', label: 'Beta' },
              },
              {
                icon: '🎯',
                title: 'Booking Funnel AI',
                desc: 'Drop-off detection at each funnel stage, price sensitivity analysis, and conversion optimization.',
                tag: { color: 'blue', label: 'Development' },
              },
            ].map((mod) => (
              <div className="x3o-card" key={mod.title}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <span style={{ fontSize: 24 }}>{mod.icon}</span>
                  <Tag color={mod.tag.color}>{mod.tag.label}</Tag>
                </div>
                <h4 style={{ margin: '8px 0 4px' }}>{mod.title}</h4>
                <p style={{ fontSize: 13, color: 'var(--x3o-muted)', lineHeight: 1.6 }}>{mod.desc}</p>
              </div>
            ))}
          </div>

          {/* ROI Breakdown */}
          <div className="x3o-card" style={{ marginTop: 24 }}>
            <h3 style={{ marginBottom: 16 }}>ROI Breakdown</h3>
            <div className="x3o-table-wrap">
              <table className="x3o-table">
                <thead>
                  <tr><th>Revenue Stream</th><th>Monthly Impact</th><th>Method</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Ghost Client Recovery</td>
                    <td style={{ color: '#22c55e' }}>+$3,200</td>
                    <td>AI-generated win-back campaigns</td>
                  </tr>
                  <tr>
                    <td>Rebooking Optimization</td>
                    <td style={{ color: '#22c55e' }}>+$1,100</td>
                    <td>Smart scheduling &amp; reminders</td>
                  </tr>
                  <tr>
                    <td>Social-Driven Bookings</td>
                    <td style={{ color: '#22c55e' }}>+$680</td>
                    <td>Optimized content calendar</td>
                  </tr>
                  <tr>
                    <td>Upsell Intelligence</td>
                    <td style={{ color: '#22c55e' }}>+$530</td>
                    <td>Service recommendations</td>
                  </tr>
                  <tr style={{ fontWeight: 600, borderTop: '1px solid rgba(255,255,255,.1)' }}>
                    <td>Total Monthly Lift</td>
                    <td style={{ color: '#22c55e' }}>+$5,510</td>
                    <td>18.5× ROI on $297/mo</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* ══════════════ Tab: Marketplace ══════════════ */}
      {activeTab === 'marketplace' && (
        <main className="x3o-main">
          <h2>Vertical Marketplace</h2>
          <p style={{ color: 'var(--x3o-muted)', marginBottom: 24 }}>
            Each vertical is a standalone intelligence product with domain-specific
            Claude prompts, metrics, and automations. Businesses subscribe to their
            vertical — we deploy the full intelligence stack.
          </p>

          <div className="x3o-g3">
            {[
              {
                icon: '💇',
                title: 'Beauty & Locs',
                desc: 'Rebooking AI, ghost client recovery, social content for stylists.',
                status: 'Live',
                statusColor: 'green' as const,
                tenant: 'kelatic.x3o.ai',
              },
              {
                icon: '🍽️',
                title: 'Restaurants',
                desc: 'Review management, menu optimization, reservation intelligence.',
                status: 'Q2 2025',
                statusColor: 'amber' as const,
                tenant: 'Coming soon',
              },
              {
                icon: '🏋️',
                title: 'Fitness',
                desc: 'Member retention AI, class scheduling, churn prediction.',
                status: 'Q2 2025',
                statusColor: 'amber' as const,
                tenant: 'Coming soon',
              },
              {
                icon: '🛍️',
                title: 'Retail',
                desc: 'Inventory intelligence, foot traffic analysis, loyalty optimization.',
                status: 'Q3 2025',
                statusColor: 'blue' as const,
                tenant: 'Coming soon',
              },
              {
                icon: '💉',
                title: 'Med Spas',
                desc: 'Treatment rebooking, consent automation, provider scheduling.',
                status: 'Q3 2025',
                statusColor: 'blue' as const,
                tenant: 'Coming soon',
              },
              {
                icon: '⚖️',
                title: 'Legal',
                desc: 'Intake qualification, case pipeline, billing analytics.',
                status: 'Q4 2025',
                statusColor: 'purple' as const,
                tenant: 'Coming soon',
              },
            ].map((v) => (
              <div className="x3o-vert-card" key={v.title}>
                <span style={{ fontSize: 32 }}>{v.icon}</span>
                <h3>{v.title}</h3>
                <p>{v.desc}</p>
                <Tag color={v.statusColor}>{v.status}</Tag>
                <div className="x3o-vert-tenant">{v.tenant}</div>
              </div>
            ))}
          </div>

          {/* Revenue Model */}
          <div className="x3o-card" style={{ marginTop: 32 }}>
            <h3 style={{ marginBottom: 16 }}>Revenue Model</h3>
            <div className="x3o-table-wrap">
              <table className="x3o-table">
                <thead>
                  <tr><th>Stream</th><th>Model</th><th>Target Y1</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>SaaS Subscriptions</td>
                    <td>$97–$897/mo per tenant</td>
                    <td>$720K</td>
                  </tr>
                  <tr>
                    <td>Anthropic Revenue Share</td>
                    <td>Marketplace referral fees</td>
                    <td>$180K</td>
                  </tr>
                  <tr>
                    <td>API / MCP Access</td>
                    <td>Usage-based for integrators</td>
                    <td>$120K</td>
                  </tr>
                  <tr>
                    <td>White-Label Licensing</td>
                    <td>Per-vertical reseller agreements</td>
                    <td>$96K</td>
                  </tr>
                  <tr>
                    <td>Setup &amp; Onboarding</td>
                    <td>One-time deployment fee</td>
                    <td>$84K</td>
                  </tr>
                  <tr style={{ fontWeight: 600, borderTop: '1px solid rgba(255,255,255,.1)' }}>
                    <td>Total</td>
                    <td />
                    <td>~$1.2M</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* ══════════════ Tab: Pricing ══════════════ */}
      {activeTab === 'pricing' && (
        <main className="x3o-main">
          <h2>Pricing</h2>
          <p style={{ color: 'var(--x3o-muted)', marginBottom: 24 }}>
            Every plan includes Claude-powered intelligence. Pick your tier, we deploy
            your vertical.
          </p>

          <div className="x3o-g3">
            {/* Starter */}
            <div className="x3o-price-card">
              <Tag color="green">Starter</Tag>
              <div className="x3o-price">$97<span className="x3o-price-period">/mo</span></div>
              <ul className="x3o-price-features">
                <li><Dot color="#22c55e" />Social intelligence dashboard</li>
                <li><Dot color="#22c55e" />Ghost client detection</li>
                <li><Dot color="#22c55e" />Monthly content calendar</li>
                <li><Dot color="#22c55e" />Basic competitor monitoring</li>
                <li><Dot color="#22c55e" />Email support</li>
              </ul>
              <button className="x3o-btn x3o-btn-ghost" style={{ width: '100%' }}>Start Free Trial</button>
            </div>

            {/* Growth — Featured */}
            <div className="x3o-price-card x3o-price-featured">
              <Tag color="amber">Most Popular</Tag>
              <div className="x3o-price">$297<span className="x3o-price-period">/mo</span></div>
              <ul className="x3o-price-features">
                <li><Dot color="#22c55e" />Everything in Starter</li>
                <li><Dot color="#f59e0b" />Automated win-back campaigns</li>
                <li><Dot color="#f59e0b" />Campaign ROI analytics</li>
                <li><Dot color="#f59e0b" />Booking funnel optimization</li>
                <li><Dot color="#f59e0b" />Weekly AI content generation</li>
                <li><Dot color="#f59e0b" />Priority support + Slack</li>
              </ul>
              <button className="x3o-btn x3o-btn-primary" style={{ width: '100%' }}>Start Free Trial</button>
            </div>

            {/* Enterprise */}
            <div className="x3o-price-card">
              <Tag color="purple">Enterprise</Tag>
              <div className="x3o-price">$897<span className="x3o-price-period">/mo</span></div>
              <ul className="x3o-price-features">
                <li><Dot color="#22c55e" />Everything in Growth</li>
                <li><Dot color="#a78bfa" />Multi-location support</li>
                <li><Dot color="#a78bfa" />Custom Claude system prompts</li>
                <li><Dot color="#a78bfa" />API / MCP access</li>
                <li><Dot color="#a78bfa" />Dedicated account manager</li>
                <li><Dot color="#a78bfa" />White-label option</li>
              </ul>
              <button className="x3o-btn x3o-btn-ghost" style={{ width: '100%' }}>Contact Sales</button>
            </div>
          </div>

          {/* Comparison */}
          <div className="x3o-card" style={{ marginTop: 32 }}>
            <h3 style={{ marginBottom: 16 }}>Competitive Comparison</h3>
            <div className="x3o-table-wrap">
              <table className="x3o-table">
                <thead>
                  <tr>
                    <th>Capability</th>
                    <th style={{ color: '#f59e0b' }}>x3o Intelligence</th>
                    <th>Generic CRM</th>
                    <th>Manual / Agency</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>AI-Powered Analysis</td>
                    <td style={{ color: '#22c55e' }}>✓ Claude</td>
                    <td style={{ color: '#ef4444' }}>✗</td>
                    <td style={{ color: '#ef4444' }}>✗</td>
                  </tr>
                  <tr>
                    <td>Vertical-Specific</td>
                    <td style={{ color: '#22c55e' }}>✓</td>
                    <td style={{ color: '#ef4444' }}>✗ Generic</td>
                    <td style={{ color: '#f59e0b' }}>~ Varies</td>
                  </tr>
                  <tr>
                    <td>Automated Campaigns</td>
                    <td style={{ color: '#22c55e' }}>✓</td>
                    <td style={{ color: '#f59e0b' }}>~ Basic</td>
                    <td style={{ color: '#22c55e' }}>✓ Manual</td>
                  </tr>
                  <tr>
                    <td>Content Generation</td>
                    <td style={{ color: '#22c55e' }}>✓ AI</td>
                    <td style={{ color: '#ef4444' }}>✗</td>
                    <td style={{ color: '#22c55e' }}>✓ Human</td>
                  </tr>
                  <tr>
                    <td>Setup Time</td>
                    <td style={{ color: '#22c55e' }}>24 hours</td>
                    <td>1–2 weeks</td>
                    <td>2–4 weeks</td>
                  </tr>
                  <tr>
                    <td>Monthly Cost</td>
                    <td style={{ color: '#22c55e' }}>$97–$897</td>
                    <td>$200–$500</td>
                    <td>$2,000–$5,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* ══════════════ Tab: GTM Strategy ══════════════ */}
      {activeTab === 'gtm' && (
        <main className="x3o-main">
          <h2>Go-to-Market Strategy</h2>
          <p style={{ color: 'var(--x3o-muted)', marginBottom: 24 }}>
            Three-phase approach: prove with KeLatic → expand verticals → scale
            through Anthropic marketplace.
          </p>

          {/* Phases */}
          <div className="x3o-g3">
            <div className="x3o-card-accent">
              <Tag color="green">Phase 1 · NOW</Tag>
              <h3 style={{ margin: '12px 0 8px' }}>Prove</h3>
              <ul style={{ color: 'var(--x3o-muted)', lineHeight: 1.8, paddingLeft: 18 }}>
                <li>KeLatic as flagship case study</li>
                <li>Document ROI with real numbers</li>
                <li>Build MCP server for Anthropic</li>
                <li>Submit to Claude marketplace</li>
                <li>Target: 10 beauty vertical clients</li>
              </ul>
            </div>
            <div className="x3o-card">
              <Tag color="amber">Phase 2 · Q2 2025</Tag>
              <h3 style={{ margin: '12px 0 8px' }}>Expand</h3>
              <ul style={{ color: 'var(--x3o-muted)', lineHeight: 1.8, paddingLeft: 18 }}>
                <li>Launch restaurant &amp; fitness verticals</li>
                <li>Build vertical-specific system prompts</li>
                <li>Hire 2 vertical specialists</li>
                <li>Partnership with POS / booking platforms</li>
                <li>Target: 50 total tenants</li>
              </ul>
            </div>
            <div className="x3o-card">
              <Tag color="blue">Phase 3 · Q3-Q4 2025</Tag>
              <h3 style={{ margin: '12px 0 8px' }}>Scale</h3>
              <ul style={{ color: 'var(--x3o-muted)', lineHeight: 1.8, paddingLeft: 18 }}>
                <li>All 6 verticals live</li>
                <li>Anthropic marketplace traction</li>
                <li>White-label reseller program</li>
                <li>API access for integrators</li>
                <li>Target: 200 tenants, $100K MRR</li>
              </ul>
            </div>
          </div>

          {/* Anthropic Partnership */}
          <div className="x3o-card" style={{ marginTop: 32 }}>
            <h3 style={{ marginBottom: 16 }}>Anthropic Partnership Pitch</h3>
            <div className="x3o-g3">
              <div style={{ padding: 16, background: 'rgba(255,255,255,.03)', borderRadius: 8 }}>
                <h4 style={{ color: '#f59e0b', marginBottom: 8 }}>For Anthropic</h4>
                <ul style={{ color: 'var(--x3o-muted)', lineHeight: 1.7, paddingLeft: 18 }}>
                  <li>Showcase Claude in B2B vertical AI</li>
                  <li>Real revenue attribution (18.5× ROI)</li>
                  <li>MCP adoption use case</li>
                  <li>Marketplace content &amp; listings</li>
                </ul>
              </div>
              <div style={{ padding: 16, background: 'rgba(255,255,255,.03)', borderRadius: 8 }}>
                <h4 style={{ color: '#f59e0b', marginBottom: 8 }}>For x3o</h4>
                <ul style={{ color: 'var(--x3o-muted)', lineHeight: 1.7, paddingLeft: 18 }}>
                  <li>Featured marketplace placement</li>
                  <li>API credits / discount program</li>
                  <li>Co-marketing opportunities</li>
                  <li>Early access to new Claude features</li>
                </ul>
              </div>
              <div style={{ padding: 16, background: 'rgba(255,255,255,.03)', borderRadius: 8 }}>
                <h4 style={{ color: '#f59e0b', marginBottom: 8 }}>Mutual Value</h4>
                <ul style={{ color: 'var(--x3o-muted)', lineHeight: 1.7, paddingLeft: 18 }}>
                  <li>Prove AI-driven SMB transformation</li>
                  <li>Template for vertical AI deployments</li>
                  <li>Revenue share on marketplace referrals</li>
                  <li>Joint case studies &amp; PR</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="x3o-card" style={{ marginTop: 24 }}>
            <h3 style={{ marginBottom: 16 }}>Execution Timeline</h3>
            <div className="x3o-timeline">
              <div className="x3o-tl-item x3o-tl-done">
                <div className="x3o-tl-dot" />
                <div>
                  <strong>Jan 2025</strong>
                  <p>KeLatic deployment complete, collecting production data</p>
                </div>
              </div>
              <div className="x3o-tl-item x3o-tl-active">
                <div className="x3o-tl-dot" />
                <div>
                  <strong>Feb 2025</strong>
                  <p>MCP server live, Anthropic marketplace submission, x3o.ai relaunch</p>
                </div>
              </div>
              <div className="x3o-tl-item x3o-tl-future">
                <div className="x3o-tl-dot" />
                <div>
                  <strong>Mar 2025</strong>
                  <p>10 beauty tenants, optimize onboarding funnel</p>
                </div>
              </div>
              <div className="x3o-tl-item x3o-tl-future">
                <div className="x3o-tl-dot" />
                <div>
                  <strong>Q2 2025</strong>
                  <p>Restaurant &amp; fitness verticals launch, 50 tenants</p>
                </div>
              </div>
              <div className="x3o-tl-item x3o-tl-future">
                <div className="x3o-tl-dot" />
                <div>
                  <strong>Q3 2025</strong>
                  <p>Retail &amp; med spa verticals, white-label program</p>
                </div>
              </div>
              <div className="x3o-tl-item x3o-tl-future">
                <div className="x3o-tl-dot" />
                <div>
                  <strong>Q4 2025</strong>
                  <p>Legal vertical, 200 tenants, $100K MRR milestone</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  )
}