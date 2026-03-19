import Link from 'next/link';

export default function IntelDashboard() {
  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f4ff', margin: 0 }}>
          Intelligence Dashboard
        </h1>
        <p style={{ fontSize: 13, color: '#6b7fa3', marginTop: 4 }}>
          Real-time competitive intelligence powered by Trinity AI
        </p>
      </div>

      {/* Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Market Position" value="#1" sub="Houston loc salon by IG followers" color="#22c55e" />
        <StatCard label="Threats Monitored" value="9" sub="Active competitors tracked" color="#e8a020" />
        <StatCard label="AI Conversations" value="∞" sub="Oracle · Sentinel · Sage ready" color="#6366f1" />
      </div>

      {/* Navigation Cards */}
      <h2 style={{ fontSize: 14, fontWeight: 600, color: '#8899bb', marginBottom: 16, letterSpacing: '0.04em' }}>
        INTELLIGENCE MODULES
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
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
    <div style={{
      background: '#0d1424', border: '1px solid #1e2d45', borderRadius: 10, padding: '20px 24px',
    }}>
      <div style={{ fontSize: 11, color: '#6b7fa3', marginBottom: 8, letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: '#4a5a78' }}>{sub}</div>
    </div>
  );
}

function NavCard({ href, icon, title, description, tag, tagColor, disabled }: {
  href: string; icon: string; title: string; description: string; tag: string; tagColor: string; disabled?: boolean;
}) {
  return (
    <Link href={disabled ? '#' : href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#0d1424', border: '1px solid #1e2d45', borderRadius: 10, padding: '24px',
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
        transition: 'border-color 0.15s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 20 }}>{icon}</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#f0f4ff' }}>{title}</span>
          <span style={{
            fontSize: 10, fontWeight: 600, color: tagColor, background: `${tagColor}18`,
            padding: '2px 8px', borderRadius: 4, marginLeft: 'auto',
          }}>{tag}</span>
        </div>
        <p style={{ fontSize: 12, color: '#6b7fa3', lineHeight: 1.5, margin: 0 }}>{description}</p>
      </div>
    </Link>
  );
}
