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
    <div style={{ padding: '32px 40px', maxWidth: 1200, color: '#c8d6e5' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f4ff', margin: 0 }}>
            Houston Loc Market <span style={{ color: '#4a5a78' }}>·</span> Competitive Intelligence
          </h1>
          <p style={{ fontSize: 12, color: '#4a5a78', marginTop: 4 }}>
            KeLatic Hair Lounge vs top 9 Houston loc salons · Data sourced Dec 2025 – Mar 2026
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={btnStyle}>Export Report</button>
          <button style={btnStyle}>Share</button>
        </div>
      </div>

      {/* Insight Callout */}
      <div style={{
        background: '#0d2818', border: '1px solid #166534', borderRadius: 8, padding: '14px 20px',
        marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 18 }}>🟢</span>
        <p style={{ margin: 0, fontSize: 13, color: '#86efac', lineHeight: 1.5 }}>
          <strong>KeLatic leads the market on Instagram</strong> — 18,240 followers vs #2 Houston Loc Fairy&apos;s 12,000. 
          7.4% engagement rate is 2.8% above market average. Primary vulnerability: Yelp ranking (#2 behind Loc Fairy).
        </p>
      </div>

      {/* Key Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <MetricCard label="KeLatic IG Rank" value="#1" sub="Houston loc salons" color="#22c55e" />
        <MetricCard label="Yelp Ranking" value="Top 10" sub="Behind Loc Fairy #1" color="#e8a020" />
        <MetricCard label="Engagement Lead" value="+2.8%" sub="vs market avg 4.6%" color="#22c55e" />
        <MetricCard label="Follower Gap to #2" value="+6,240" sub="vs Houston Loc Fairy" color="#22c55e" />
      </div>

      {/* Competitive Landscape Table */}
      <SectionTitle>Full Competitive Landscape</SectionTitle>
      <div style={{ overflowX: 'auto', marginBottom: 28 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e2d45' }}>
              {['Salon', 'Yelp', 'IG Followers', 'Engagement', 'Platform', 'Specialty', 'Threat'].map(h => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#6b7fa3', fontWeight: 600, fontSize: 11 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {competitors.map((c, i) => (
              <tr key={i} style={{
                borderBottom: '1px solid #151d2e',
                background: c.isUs ? '#0d1a2e' : 'transparent',
              }}>
                <td style={{ padding: '10px 12px' }}>
                  <div style={{ fontWeight: c.isUs ? 700 : 500, color: c.isUs ? '#e8a020' : '#c8d6e5' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#4a5a78' }}>{c.handle}</div>
                </td>
                <td style={cellStyle}>
                  <span style={{ color: c.yelp >= 4.7 ? '#22c55e' : '#c8d6e5' }}>⭐ {c.yelp}</span>
                </td>
                <td style={cellStyle}>{c.ig.toLocaleString()}</td>
                <td style={cellStyle}>{c.engagement}%</td>
                <td style={cellStyle}>{c.platform}</td>
                <td style={cellStyle}>{c.specialty}</td>
                <td style={cellStyle}><ThreatBadge level={c.threat} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* IG Bar Chart */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Instagram Follower Comparison</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {competitors.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 110, fontSize: 11, color: c.isUs ? '#e8a020' : '#6b7fa3', textAlign: 'right', flexShrink: 0 }}>
                  {c.name.length > 16 ? c.name.slice(0, 16) + '…' : c.name}
                </div>
                <div style={{ flex: 1, background: '#151d2e', borderRadius: 4, height: 20, position: 'relative' }}>
                  <div style={{
                    width: `${(c.ig / maxIG) * 100}%`,
                    background: c.isUs ? 'linear-gradient(90deg, #e8a020, #f59e0b)' : '#1e3a5f',
                    height: '100%', borderRadius: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6,
                  }}>
                    <span style={{ fontSize: 10, color: c.isUs ? '#000' : '#6b7fa3', fontWeight: 600 }}>
                      {c.ig >= 1000 ? `${(c.ig / 1000).toFixed(1)}K` : c.ig}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Market Share Donut */}
        <div style={cardStyle}>
          <h3 style={cardTitleStyle}>Market Share (Houston IG Presence)</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginTop: 16 }}>
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
      <div style={{ ...cardStyle, marginBottom: 28 }}>
        <div
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setExpandedThreat(!expandedThreat)}
        >
          <h3 style={{ ...cardTitleStyle, marginBottom: 0 }}>
            Primary Threat Analysis — <span style={{ color: '#ef4444' }}>Houston Loc Fairy</span>
          </h3>
          <span style={{ color: '#4a5a78', fontSize: 14 }}>{expandedThreat ? '▾' : '▸'}</span>
        </div>
        <p style={{ fontSize: 12, color: '#4a5a78', marginTop: 4 }}>Reyna · @houstonlocfairy · 12,000 IG followers</p>
        {expandedThreat && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 16 }}>
            <ThreatColumn title="What They Do Well" color="#ef4444" items={[
              'Yelp #1 ranking (4.9 stars, 380+ reviews)',
              'Strong word-of-mouth referral network',
              'Diverse services — locs + braids expands market',
              'Consistent Instagram content schedule',
            ]} />
            <ThreatColumn title="Weaknesses to Exploit" color="#22c55e" items={[
              'Long booking lead times (2-3 weeks)',
              'No booking tech — phone/DM only',
              'Smaller IG following (12K vs 18.2K)',
              'No education or product extension',
            ]} />
            <ThreatColumn title="KeLatic Counter Strategy" color="#3b82f6" items={[
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <SwotCard title="Strengths" color="#22c55e" icon="💪" items={swot.strengths} />
        <SwotCard title="Weaknesses" color="#ef4444" icon="⚠️" items={swot.weaknesses} />
        <SwotCard title="Opportunities" color="#3b82f6" icon="🚀" items={swot.opportunities} />
        <SwotCard title="Threats" color="#e8a020" icon="🛡️" items={swot.threats} />
      </div>

      {/* Gap Analysis Radar */}
      <div style={{ ...cardStyle, marginBottom: 28 }}>
        <h3 style={cardTitleStyle}>Gap Analysis — KeLatic vs Houston Loc Fairy</h3>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          <RadarChart categories={gapCategories} seriesA={gapKelatic} seriesB={gapFairy} labelA="KeLatic" labelB="Loc Fairy" />
        </div>
      </div>

      {/* Attack Opportunities */}
      <SectionTitle>Immediate Attack Opportunities</SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        {attacks.map((a, i) => (
          <div key={i} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 8, background: `${a.color}18`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: a.color }}>{a.days}</span>
              <span style={{ fontSize: 9, color: a.color }}>days</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#f0f4ff', fontSize: 14 }}>{a.title}</div>
              <div style={{ fontSize: 12, color: '#6b7fa3', marginTop: 2, lineHeight: 1.4 }}>{a.desc}</div>
            </div>
            <button style={{
              padding: '8px 16px', borderRadius: 6, border: `1px solid ${a.color}`,
              background: 'transparent', color: a.color, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}>
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
    <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: 8, padding: '16px 20px' }}>
      <div style={{ fontSize: 11, color: '#6b7fa3', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 11, color: '#4a5a78', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 14, fontWeight: 600, color: '#8899bb', marginBottom: 12, letterSpacing: '0.04em' }}>
      {children ? String(children).toUpperCase() : ''}
    </h2>
  );
}

function ThreatBadge({ level }: { level: string }) {
  const colors: Record<string, string> = { high: '#ef4444', medium: '#e8a020', low: '#22c55e', self: '#6366f1' };
  const c = colors[level] || '#4a5a78';
  return (
    <span style={{ fontSize: 10, fontWeight: 600, color: c, background: `${c}18`, padding: '2px 8px', borderRadius: 4 }}>
      {level === 'self' ? 'You' : level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}

function ThreatColumn({ title, color, items }: { title: string; color: string; items: string[] }) {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color, marginBottom: 8 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 16 }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: 12, color: '#c8d6e5', lineHeight: 1.6 }}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function SwotCard({ title, color, icon, items }: { title: string; color: string; icon: string; items: string[] }) {
  return (
    <div style={{ background: '#0d1424', border: '1px solid #1e2d45', borderRadius: 8, padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontWeight: 700, color, fontSize: 14 }}>{title}</span>
      </div>
      <ul style={{ margin: 0, paddingLeft: 16 }}>
        {items.map((item, i) => (
          <li key={i} style={{ fontSize: 12, color: '#c8d6e5', lineHeight: 1.7 }}>{item}</li>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
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
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#f0f4ff" fontSize="18" fontWeight="800">33%</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#6b7fa3" fontSize="9">KeLatic</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.map((seg, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
            <span style={{ color: '#c8d6e5' }}>{seg.label}</span>
            <span style={{ color: '#4a5a78' }}>{seg.pct}%</span>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Grid rings */}
        {[20, 40, 60, 80, 100].map(pct => {
          const pts = Array.from({ length: n }, (_, i) => {
            const p = polarToXY((360 / n) * i, (pct / 100) * maxR);
            return `${p.x},${p.y}`;
          }).join(' ');
          return <polygon key={pct} points={pts} fill="none" stroke="#1e2d45" strokeWidth={0.5} />;
        })}
        {/* Axis lines */}
        {categories.map((_, i) => {
          const p = polarToXY((360 / n) * i, maxR);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#1e2d45" strokeWidth={0.5} />;
        })}
        {/* Series */}
        <polygon points={polyA} fill="rgba(232,160,32,0.15)" stroke="#e8a020" strokeWidth={2} />
        <polygon points={polyB} fill="rgba(59,130,246,0.1)" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 2" />
        {/* Dots */}
        {ptsA.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#e8a020" />)}
        {ptsB.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#3b82f6" />)}
        {/* Labels */}
        {categories.map((cat, i) => {
          const p = polarToXY((360 / n) * i, maxR + 18);
          return (
            <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fill="#6b7fa3" fontSize={10}>
              {cat}
            </text>
          );
        })}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ width: 14, height: 3, background: '#e8a020', borderRadius: 2 }} />
          <span style={{ color: '#e8a020' }}>{labelA}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
          <span style={{ width: 14, height: 3, background: '#3b82f6', borderRadius: 2, borderStyle: 'dashed' }} />
          <span style={{ color: '#3b82f6' }}>{labelB}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Shared Styles ─────────────────────────────────────────────────────────────
const cellStyle: React.CSSProperties = { padding: '10px 12px', fontSize: 13 };
const cardStyle: React.CSSProperties = { background: '#0d1424', border: '1px solid #1e2d45', borderRadius: 10, padding: '24px' };
const cardTitleStyle: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: '#f0f4ff', margin: 0, marginBottom: 4 };
const btnStyle: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 6, border: '1px solid #1e2d45',
  background: '#0d1424', color: '#8899bb', fontSize: 12, fontWeight: 500, cursor: 'pointer',
};
