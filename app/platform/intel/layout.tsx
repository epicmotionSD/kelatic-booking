import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function IntelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/platform/intel&type=admin');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080c14', color: '#f0f4ff' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        borderRight: '1px solid #1e2d45',
        background: '#0a0f1a',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #1e2d45' }}>
          <Link href="/platform" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, background: '#e8a020', borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 14, color: '#000',
              }}>x</div>
              <span style={{ fontWeight: 700, fontSize: 15, color: '#f0f4ff' }}>
                x3o<span style={{ fontSize: 10, color: '#e8a020', verticalAlign: 'super', marginLeft: 2 }}>intelligence</span>
              </span>
            </div>
          </Link>
        </div>

        <nav style={{ padding: '12px 8px', flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NavItem href="/platform/intel" icon="📊" label="Dashboard" />
          <NavItem href="/platform/intel/competitive" icon="🎯" label="Competitive Intel" />
          <NavItem href="/platform/intel/trinity" icon="🔮" label="Trinity AI" />

          <div style={{ height: 1, background: '#1e2d45', margin: '12px 0' }} />
          <div style={{ padding: '4px 12px', fontSize: 10, color: '#4a5a78', letterSpacing: '0.08em', textTransform: 'uppercase' as const }}>Coming Soon</div>
          <NavItem href="#" icon="📈" label="Social Metrics" disabled />
          <NavItem href="#" icon="📅" label="Content Calendar" disabled />
          <NavItem href="#" icon="👻" label="Ghost Recovery" disabled />
          <NavItem href="#" icon="💰" label="Campaign ROI" disabled />
        </nav>

        <div style={{ padding: '12px 16px', borderTop: '1px solid #1e2d45', fontSize: 11, color: '#4a5a78' }}>
          {user.email}
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, disabled }: { href: string; icon: string; label: string; disabled?: boolean }) {
  return (
    <Link
      href={disabled ? '#' : href}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 12px',
        borderRadius: 6,
        fontSize: 13,
        color: disabled ? '#2a3555' : '#8899bb',
        textDecoration: 'none',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      {label}
    </Link>
  );
}
