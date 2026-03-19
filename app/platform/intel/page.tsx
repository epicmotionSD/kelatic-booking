import Link from 'next/link';

const tagClasses: Record<string, string> = {
  '#22c55e': 'x3o-tag x3o-tag-green',
  '#6366f1': 'x3o-tag x3o-tag-purple',
  '#4a5a78': 'x3o-tag',
};

const valueColors: Record<string, string> = {
  '#22c55e': 'var(--x3o-green)',
  '#e8a020': 'var(--x3o-accent)',
  '#6366f1': 'var(--x3o-purple)',
};

export default function IntelDashboard() {
  return (
    <div className="x3o-main">
      <div className="mb-8">
        <h1 className="x3o-sec-title">Intelligence Dashboard</h1>
        <p className="x3o-sec-sub">Real-time competitive intelligence powered by Trinity AI</p>
      </div>

      {/* Quick Stats */}
      <div className="x3o-g3 mb-8">
        <StatCard label="Market Position" value="#1" sub="Houston loc salon by IG followers" color="#22c55e" />
        <StatCard label="Threats Monitored" value="9" sub="Active competitors tracked" color="#e8a020" />
        <StatCard label="AI Conversations" value="∞" sub="Oracle · Sentinel · Sage ready" color="#6366f1" />
      </div>

      {/* Navigation Cards */}
      <h2 className="x3o-sec-label mb-4">INTELLIGENCE MODULES</h2>
      <div className="x3o-g2">
        <NavCard
          href="/platform/intel/competitive"
          icon="🎯"
          title="Competitive Intelligence"
          description="Full competitive landscape analysis. Track 9 Houston loc salons with Instagram, Yelp, engagement metrics, SWOT analysis, and actionable attack opportunities."
          tag="Live Data"
          tagColor="#22c55e"
        />
        <NavCard
          href="/platform/intel/trinity"
          icon="🔮"
          title="Trinity AI Chat"
          description="Conversational intelligence with 3 specialized agents. Oracle for strategy, Sentinel for threat monitoring, Sage for data-driven recommendations."
          tag="3 Agents"
          tagColor="#6366f1"
        />
        <NavCard
          href="#"
          icon="📈"
          title="Social Metrics"
          description="Deep-dive social media analytics across Instagram, TikTok, YouTube. Track follower growth, engagement trends, and content performance."
          tag="Coming Soon"
          tagColor="#4a5a78"
          disabled
        />
        <NavCard
          href="#"
          icon="👻"
          title="Ghost Client Recovery"
          description="AI-powered identification and win-back campaigns for inactive clients. Automated SMS/email sequences with personalized re-engagement offers."
          tag="Coming Soon"
          tagColor="#4a5a78"
          disabled
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="x3o-metric">
      <div className="x3o-metric-label">{label}</div>
      <div className="x3o-metric-val" style={{ color: valueColors[color] || color }}>{value}</div>
      <div className="x3o-metric-sub">{sub}</div>
    </div>
  );
}

function NavCard({ href, icon, title, description, tag, tagColor, disabled }: {
  href: string; icon: string; title: string; description: string; tag: string; tagColor: string; disabled?: boolean;
}) {
  return (
    <Link href={disabled ? '#' : href} className="no-underline">
      <div className={`x3o-vert-card${disabled ? ' opacity-50 pointer-events-none' : ''}`}>
        <div className="flex items-center gap-2.5 mb-2.5">
          <span className="text-xl">{icon}</span>
          <span className="x3o-h3">{title}</span>
          <span className={`${tagClasses[tagColor] || 'x3o-tag'} ml-auto`}>{tag}</span>
        </div>
        <p className="x3o-sec-sub" style={{ margin: 0, lineHeight: 1.5 }}>{description}</p>
      </div>
    </Link>
  );
}
