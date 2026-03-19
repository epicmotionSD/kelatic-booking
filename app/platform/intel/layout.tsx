import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import '../x3o-styles.css';

export default async function IntelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/platform/intel&type=admin');
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--x3o-bg)', color: 'var(--x3o-t1)' }}>
      <aside className="x3o-sidebar">
        <Link href="/platform" className="x3o-sidebar-logo">
          <div className="logo-mark">x</div>
          <span className="logo-text">
            x3o<sup>intelligence</sup>
          </span>
        </Link>

        <nav>
          <NavItem href="/platform/intel" icon="📊" label="Dashboard" />
          <NavItem href="/platform/intel/competitive" icon="🎯" label="Competitive Intel" />
          <NavItem href="/platform/intel/trinity" icon="🔮" label="Trinity AI" />

          <div className="x3o-divider" style={{ margin: '12px 0' }} />
          <div className="x3o-sec-label" style={{ padding: '4px 12px' }}>Coming Soon</div>
          <NavItem href="#" icon="📈" label="Social Metrics" disabled />
          <NavItem href="#" icon="📅" label="Content Calendar" disabled />
          <NavItem href="#" icon="👻" label="Ghost Recovery" disabled />
          <NavItem href="#" icon="💰" label="Campaign ROI" disabled />
        </nav>

        <div className="x3o-sidebar-footer">
          {user.email}
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, icon, label, disabled }: { href: string; icon: string; label: string; disabled?: boolean }) {
  return (
    <Link
      href={disabled ? '#' : href}
      className={`x3o-nav-item${disabled ? ' disabled' : ''}`}
    >
      <span style={{ fontSize: 14 }}>{icon}</span>
      {label}
    </Link>
  );
}
