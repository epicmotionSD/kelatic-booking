'use client';

import { useState } from 'react';

// ─── Demo Data ─────────────────────────────────────────────────────────────────
const competitors = [
  { name: 'KeLatic Hair Lounge', handle: '@kelatichairlounge', yelp: 4.8, ig: 18240, engagement: 7.4, platform: 'Instagram', specialty: 'Locs Only', threat: 'self', isUs: true },
  { name: 'Houston Loc Fairy', handle: '@houstonlocfairy', yelp: 4.9, ig: 12000, engagement: 5.8, platform: 'Instagram', specialty: 'Locs + Braids', threat: 'high' },
  { name: "Angie's Locs & Natural Style", handle: '@angieslocs', yelp: 4.7, ig: 8400, engagement: 4.2, platform: 'Instagram', specialty: 'Natural Styles', threat: 'medium' },
  { name: 'Royal Locs & Crowns', handle: '@royallocs', yelp: 4.6, ig: 6200, engagement: 3.9, platform: 'Instagram', specialty: 'Locs', threat: 'medium' },
  { name: 'Loc Addicts', handle: '@locaddicts', yelp: 4.5, ig: 5100, engagement: 5.1, platform: 'Instagram', specialty: 'Locs', threat: 'medium' },
  { name: 'Mystic Locs', handle: '@mysticlocs', yelp: 4.4, ig: 4300, engagement: 3.2, platform: 'Instagram', specialty: 'Locs + Color', threat: 'low' },
  { name: 'Scotty Locs', handle: '@scottylocs', yelp: 4.3, ig: 3800, engagement: 4.5, platform: 'Instagram', specialty: 'Men + Women', threat: 'low' },
  { name: "Z'Maji Thee Loctician", handle: '@zmaji_locs', yelp: 4.5, ig: 3200, engagement: 3.8, platform: 'Instagram', specialty: 'Locs', threat: 'low' },
  { name: 'The Loc Den', handle: '@thelocden_htx', yelp: 4.2, ig: 2900, engagement: 2.9, platform: 'Instagram', specialty: 'Locs', threat: 'low' },
  { name: 'Lock Spa Beauty Empire', handle: '@lockspabeauty', yelp: 4.1, ig: 2400, engagement: 2.5, platform: 'Instagram', specialty: 'Locs + Spa', threat: 'low' },
];

const swot = {
  strengths: [
    'Largest Instagram following (18.2K)',
    'Highest engagement rate (7.4%)',
    'Loc-only positioning = strong niche authority',
    'Superior booking technology (x3o platform)',
    'Strong brand voice & content strategy',
  ],
  weaknesses: [
    'Lower Yelp ranking than Loc Fairy (#2 vs #1)',
    'No YouTube presence',
    'No product line for revenue diversification',
    'Limited B2B / education positioning',
    'TikTok presence underdeveloped',
  ],
  opportunities: [
    'YouTube loc education series (untapped market)',
    'Branded product line (higher margins)',
    'Loc Fairy overflow capture during peak booking',
    'Loc Academy B2B model for aspiring locticians',
    'TikTok short-form for younger demographics',
  ],
  threats: [
    'Houston Loc Fairy Yelp dominance',
    'New entrants with aggressive social strategy',
    'Market saturation in Houston loc niche',
    'Platform risk — Instagram algorithm changes',
    'Economic downturn reducing discretionary spend',
  ],
};

const gapCategories = ['IG Reach', 'TikTok', 'Yelp', 'Education', 'Products', 'YouTube', 'Booking Tech'];
const gapKelatic = [95, 15, 85, 20, 10, 5, 95];
const gapFairy = [65, 40, 95, 30, 25, 35, 40];

const attacks = [
  { days: 30, title: 'Yelp Review Blitz', desc: 'Automated post-appointment SMS requesting Yelp reviews. Target: 20 new 5-star reviews in 30 days.', action: 'Draft SMS', color: '#22c55e' },
  { days: 60, title: 'YouTube Loc Education Series', desc: 'Weekly 10-min tutorials on loc care, styling, maintenance. Position as Houston loc authority.', action: 'Plan Series', color: '#3b82f6' },
  { days: 60, title: 'KeLatic Branded Product Line', desc: 'Launch loc oil, moisturizer, and styling gel. Upsell through booking confirmation + in-salon retail.', action: 'Product Launch', color: '#8b5cf6' },
  { days: 90, title: 'Loc Fairy Overflow Capture', desc: "Target Houston Loc Fairy's 2-3 week wait times. Run geo-targeted IG ads: 'Can't wait? Book KeLatic today.'", action: 'Build Campaign', color: '#e8a020' },
  { days: 90, title: 'Loc Academy B2B Positioning', desc: 'Launch online masterclass for aspiring locticians. Revenue stream + brand authority builder.', action: 'Scale Academy', color: '#ef4444' },
];

// ─── Component ─────────────────────────────────────────────────────────────────
export default function CompetitiveIntelPage() {
  const [expandedThreat, setExpandedThreat] = useState(true);
  const maxIG = Math.max(...competitors.map(c => c.ig));
  const totalIG = competitors.reduce((s, c) => s + c.ig, 0);

  return (
    <div className="x3o-main" style={{ color: 'var(--x3o-t2)' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div>
          <h1 className="x3o-sec-title">
            Houston Loc Market <span style={{ color: 'var(--x3o-t3)' }}>·</span> Competitive Intelligence
          </h1>
          <p className="text-xs" style={{ color: 'var(--x3o-t3)' }}>
            KeLatic Hair Lounge vs top 9 Houston loc salons · Data sourced Dec 2025 – Mar 2026
          </p>
        </div>
        <div className="flex gap-2">
          <button className="x3o-btn-ghost">Export Report</button>
          <button className="x3o-btn-ghost">Share</button>
        </div>
      </div>

      {/* Insight Callout */}
      <div className="x3o-insight flex items-center gap-3">
        <span className="text-lg">🟢</span>
        <p className="m-0">
          <strong>KeLatic leads the market on Instagram</strong> — 18,240 followers vs #2 Houston Loc Fairy&apos;s 12,000.
          7.4% engagement rate is 2.8% above market average. Primary vulnerability: Yelp ranking (#2 behind Loc Fairy).
        </p>
      </div>

      {/* Key Metrics */}
      <div className="x3o-g4">
        <MetricCard label="KeLatic IG Rank" value="#1" sub="Houston loc salons" color="var(--x3o-green)" />
        <MetricCard label="Yelp Ranking" value="Top 10" sub="Behind Loc Fairy #1" color="var(--x3o-accent)" />
        <MetricCard label="Engagement Lead" value="+2.8%" sub="vs market avg 4.6%" color="var(--x3o-green)" />
        <MetricCard label="Follower Gap to #2" value="+6,240" sub="vs Houston Loc Fairy" color="var(--x3o-green)" />
      </div>

      {/* Competitive Landscape Table */}
      <SectionTitle>Full Competitive Landscape</SectionTitle>
      <div className="overflow-x-auto mb-7">
        <table className="x3o-table">
          <thead>
            <tr>
              {['Salon', 'Yelp', 'IG Followers', 'Engagement', 'Platform', 'Specialty', 'Threat'].map(h => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {competitors.map((c, i) => (
              <tr key={i} style={{ background: c.isUs ? 'var(--x3o-bg3)' : undefined }}>
                <td>
                  <div style={{ fontWeight: c.isUs ? 700 : 500, color: c.isUs ? 'var(--x3o-accent)' : 'var(--x3o-t1)' }}>{c.name}</div>
                  <div className="text-xs" style={{ color: 'var(--x3o-t3)' }}>{c.handle}</div>
                </td>
                <td><span style={{ color: c.yelp >= 4.7 ? 'var(--x3o-green)' : undefined }}>⭐ {c.yelp}</span></td>
                <td>{c.ig.toLocaleString()}</td>
                <td>{c.engagement}%</td>
                <td>{c.platform}</td>
                <td>{c.specialty}</td>
                <td><ThreatBadge level={c.threat} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts Row */}
      <div className="x3o-g2">
        <div className="x3o-card">
          <h3 className="x3o-h3 mb-3">Instagram Follower Comparison</h3>
          <div className="flex flex-col gap-2">
            {competitors.map((c, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-28 text-right text-xs shrink-0" style={{ color: c.isUs ? 'var(--x3o-accent)' : 'var(--x3o-t3)' }}>
                  {c.name.length > 16 ? c.name.slice(0, 16) + '…' : c.name}
                </div>
                <div className="flex-1 h-5 rounded" style={{ background: 'var(--x3o-bg4)' }}>
                  <div className="h-full rounded flex items-center justify-end pr-1.5" style={{
                    width: `${(c.ig / maxIG) * 100}%`,
                    background: c.isUs ? 'linear-gradient(90deg, var(--x3o-accent), var(--x3o-accent2))' : 'var(--x3o-border2)',
                  }}>
                    <span className="text-[10px] font-semibold" style={{ color: c.isUs ? '#000' : 'var(--x3o-t3)' }}>
                      {c.ig >= 1000 ? `${(c.ig / 1000).toFixed(1)}K` : c.ig}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="x3o-card">
          <h3 className="x3o-h3 mb-4">Market Share (Houston IG Presence)</h3>
          <div className="flex items-center justify-center gap-6">
            <DonutChart data={[
              { label: 'KeLatic', pct: Math.round((18240 / totalIG) * 100), color: '#e8a020' },
              { label: 'Loc Fairy', pct: Math.round((12000 / totalIG) * 100), color: '#3b82f6' },
              { label: 'Royal Locs', pct: Math.round((6200 / totalIG) * 100), color: '#8b5cf6' },
              { label: 'Others', pct: Math.round(((totalIG - 18240 - 12000 - 6200) / totalIG) * 100), color: '#1e2d45' },
            ]} />
          </div>
        </div>
      </div>

      {/* Primary Threat */}
      <div className="x3o-card mb-7">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpandedThreat(!expandedThreat)}>
          <h3 className="x3o-h3">
            Primary Threat Analysis — <span style={{ color: 'var(--x3o-red)' }}>Houston Loc Fairy</span>
          </h3>
          <span style={{ color: 'var(--x3o-t3)' }}>{expandedThreat ? '▾' : '▸'}</span>
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--x3o-t3)' }}>Reyna · @houstonlocfairy · 12,000 IG followers</p>
        {expandedThreat && (
          <div className="x3o-g3 mt-4 !mb-0">
            <ThreatColumn title="What They Do Well" color="var(--x3o-red)" items={[
              'Yelp #1 ranking (4.9 stars, 380+ reviews)',
              'Strong word-of-mouth referral network',
              'Diverse services — locs + braids expands market',
              'Consistent Instagram content schedule',
            ]} />
            <ThreatColumn title="Weaknesses to Exploit" color="var(--x3o-green)" items={[
              'Long booking lead times (2-3 weeks)',
              'No booking tech — phone/DM only',
              'Smaller IG following (12K vs 18.2K)',
              'No education or product extension',
            ]} />
            <ThreatColumn title="KeLatic Counter Strategy" color="var(--x3o-blue)" items={[
              'Same-day/next-day booking availability ads',
              'Highlight x3o booking tech as competitive edge',
              'Yelp review campaign to close rating gap',
              'YouTube education series to build authority',
            ]} />
          </div>
        )}
      </div>

      {/* SWOT */}
      <SectionTitle>SWOT Analysis</SectionTitle>
      <div className="x3o-g2">
        <SwotCard title="Strengths" color="var(--x3o-green)" icon="💪" items={swot.strengths} />
        <SwotCard title="Weaknesses" color="var(--x3o-red)" icon="⚠️" items={swot.weaknesses} />
        <SwotCard title="Opportunities" color="var(--x3o-blue)" icon="🚀" items={swot.opportunities} />
        <SwotCard title="Threats" color="var(--x3o-accent)" icon="🛡️" items={swot.threats} />
      </div>

      {/* Gap Analysis Radar */}
      <div className="x3o-card mb-7">
        <h3 className="x3o-h3 mb-4">Gap Analysis — KeLatic vs Houston Loc Fairy</h3>
        <div className="flex justify-center">
          <RadarChart categories={gapCategories} seriesA={gapKelatic} seriesB={gapFairy} labelA="KeLatic" labelB="Loc Fairy" />
        </div>
      </div>

      {/* Attack Opportunities */}
      <SectionTitle>Immediate Attack Opportunities</SectionTitle>
      <div className="flex flex-col gap-3 mb-8">
        {attacks.map((a, i) => (
          <div key={i} className="x3o-card flex items-center gap-4">
            <div className="w-13 h-13 rounded-lg flex flex-col items-center justify-center shrink-0"
              style={{ background: `${a.color}18` }}>
              <span className="text-base font-extrabold" style={{ color: a.color }}>{a.days}</span>
              <span className="text-[9px]" style={{ color: a.color }}>days</span>
            </div>
            <div className="flex-1">
              <div className="x3o-h3">{a.title}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--x3o-t2)', lineHeight: 1.4 }}>{a.desc}</div>
            </div>
            <button className="x3o-btn-ghost whitespace-nowrap" style={{ borderColor: a.color, color: a.color }}>
              {a.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="x3o-metric">
      <div className="x3o-metric-label">{label}</div>
      <div className="x3o-metric-val" style={{ color }}>{value}</div>
      <div className="x3o-metric-sub x3o-muted">{sub}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="x3o-sec-label mb-3">{children ? String(children).toUpperCase() : ''}</h2>;
}

function ThreatBadge({ level }: { level: string }) {
  const classMap: Record<string, string> = { high: 'x3o-tag-red', medium: 'x3o-tag-amber', low: 'x3o-tag-green', self: 'x3o-tag-purple' };
  return (
    <span className={`x3o-tag ${classMap[level] || ''}`}>
      {level === 'self' ? 'You' : level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

function ThreatColumn({ title, color, items }: { title: string; color: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs font-bold mb-2" style={{ color }}>{title}</div>
      <ul className="m-0 pl-4">
        {items.map((item, i) => (
          <li key={i} className="text-xs leading-relaxed" style={{ color: 'var(--x3o-t2)' }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function SwotCard({ title, color, icon, items }: { title: string; color: string; icon: string; items: string[] }) {
  return (
    <div className="x3o-card">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">{icon}</span>
        <span className="font-bold text-sm" style={{ color }}>{title}</span>
      </div>
      <ul className="m-0 pl-4">
        {items.map((item, i) => (
          <li key={i} className="text-xs leading-7" style={{ color: 'var(--x3o-t2)' }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

// ─── SVG Charts ────────────────────────────────────────────────────────────────

function DonutChart({ data }: { data: { label: string; pct: number; color: string }[] }) {
  const size = 160;
  const cx = size / 2, cy = size / 2, r = 60, stroke = 24;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((seg, i) => {
          const dash = (seg.pct / 100) * circumference;
          const currentOffset = offset;
          offset += dash;
          return (
            <circle key={i} cx={cx} cy={cy} r={r}
              fill="none" stroke={seg.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-currentOffset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--x3o-t1)" fontSize="18" fontWeight="800">33%</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--x3o-t2)" fontSize="9">KeLatic</text>
      </svg>
      <div className="flex flex-col gap-1.5">
        {data.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: seg.color }} />
            <span style={{ color: 'var(--x3o-t2)' }}>{seg.label}</span>
            <span style={{ color: 'var(--x3o-t3)' }}>{seg.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RadarChart({ categories, seriesA, seriesB, labelA, labelB }: {
  categories: string[]; seriesA: number[]; seriesB: number[]; labelA: string; labelB: string;
}) {
  const size = 320, cx = size / 2, cy = size / 2, maxR = 120;
  const n = categories.length;

  function polarToXY(angle: number, r: number) {
    const a = (angle - 90) * (Math.PI / 180);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function getPoints(values: number[]) {
    return values.map((v, i) => {
      const angle = (360 / n) * i;
      return polarToXY(angle, (v / 100) * maxR);
    });
  }

  const ptsA = getPoints(seriesA);
  const ptsB = getPoints(seriesB);
  const polyA = ptsA.map(p => `${p.x},${p.y}`).join(' ');
  const polyB = ptsB.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid rings */}
        {[20, 40, 60, 80, 100].map(pct => {
          const pts = Array.from({ length: n }, (_, i) => {
            const p = polarToXY((360 / n) * i, (pct / 100) * maxR);
            return `${p.x},${p.y}`;
          }).join(' ');
          return <polygon key={pct} points={pts} fill="none" stroke="var(--x3o-border)" strokeWidth={0.5} />;
        })}
        {/* Axis lines */}
        {categories.map((_, i) => {
          const p = polarToXY((360 / n) * i, maxR);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--x3o-border)" strokeWidth={0.5} />;
        })}
        {/* Series */}
        <polygon points={polyA} fill="rgba(232,160,32,0.15)" stroke="var(--x3o-accent)" strokeWidth={2} />
        <polygon points={polyB} fill="rgba(59,130,246,0.1)" stroke="var(--x3o-blue)" strokeWidth={1.5} strokeDasharray="4 2" />
        {/* Dots */}
        {ptsA.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="var(--x3o-accent)" />)}
        {ptsB.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="var(--x3o-blue)" />)}
        {/* Labels */}
        {categories.map((cat, i) => {
          const p = polarToXY((360 / n) * i, maxR + 18);
          return (
            <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fill="var(--x3o-t2)" fontSize={10}>
              {cat}
            </text>
          );
        })}
      </svg>
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-3.5 h-0.5 rounded-sm" style={{ background: 'var(--x3o-accent)' }} />
          <span style={{ color: 'var(--x3o-accent)' }}>{labelA}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-3.5 h-0.5 rounded-sm border-dashed" style={{ background: 'var(--x3o-blue)' }} />
          <span style={{ color: 'var(--x3o-blue)' }}>{labelB}</span>
        </div>
      </div>
    </div>
  );
}

