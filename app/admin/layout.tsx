'use client';

import { useState, useEffect } from 'react';
import NotificationBell from './NotificationBell';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Layers,
  Calendar,
  CalendarOff,
  CreditCard,
  Briefcase,
  Users,
  UserCheck,
  BarChart3,
  Settings,
  HelpCircle,
  Menu,
  X,
  ShoppingBag,
  Package,
  ChevronDown
} from 'lucide-react';
import { SkipLink, useAriaLiveRegion } from '@/lib/accessibility';
import { Clock } from '@/components/terminal';

type NavItem = {
  label: string;
  href?: string;
  icon: React.ReactNode;
  children?: { label: string; href: string; icon: React.ReactNode }[];
};

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: <Home className="w-5 h-5" />,
  },
  {
    label: 'Agents',
    href: '/admin/agents',
    icon: <Layers className="w-5 h-5" />,
  },
  {
    label: 'Appointments',
    href: '/admin/appointments',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    label: 'Point of Sale',
    href: '/admin/pos',
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    label: 'Services',
    href: '/admin/services',
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    label: 'Stylists',
    href: '/admin/stylists',
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: 'Schedules',
    href: '/admin/stylists/schedule',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    label: 'Closures',
    href: '/admin/closures',
    icon: <CalendarOff className="w-5 h-5" />,
  },
  {
    label: 'Clients',
    href: '/admin/clients',
    icon: <UserCheck className="w-5 h-5" />,
  },
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: <Settings className="w-5 h-5" />,
  },
  {
    label: 'Help',
    href: '/admin/help',
    icon: <HelpCircle className="w-5 h-5" />,
  },
];

// Simplified navigation for commerce/cafe tenants (e.g. Kelatic Vitality House).
// Hides all salon-specific links — only Dashboard, POS, Orders, Products.
const COMMERCE_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <Home className="w-5 h-5" /> },
  { label: 'Point of Sale', href: '/admin/register', icon: <CreditCard className="w-5 h-5" /> },
  { label: 'Orders', href: '/admin/orders', icon: <ShoppingBag className="w-5 h-5" /> },
  { label: 'Products', href: '/admin/products', icon: <Package className="w-5 h-5" /> },
  {
    label: 'Booking',
    icon: <Calendar className="w-5 h-5" />,
    children: [
      { label: 'Agents', href: '/admin/agents', icon: <Layers className="w-4 h-4" /> },
      { label: 'Appointments', href: '/admin/appointments', icon: <Calendar className="w-4 h-4" /> },
      { label: 'Appointments POS', href: '/admin/pos', icon: <CreditCard className="w-4 h-4" /> },
      { label: 'Services', href: '/admin/services', icon: <Briefcase className="w-4 h-4" /> },
      { label: 'Stylists', href: '/admin/stylists', icon: <Users className="w-4 h-4" /> },
      { label: 'Schedules', href: '/admin/stylists/schedule', icon: <Calendar className="w-4 h-4" /> },
      { label: 'Closures', href: '/admin/closures', icon: <CalendarOff className="w-4 h-4" /> },
      { label: 'Clients', href: '/admin/clients', icon: <UserCheck className="w-4 h-4" /> },
      { label: 'Reports', href: '/admin/reports', icon: <BarChart3 className="w-4 h-4" /> },
      { label: 'Settings', href: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
      { label: 'Help', href: '/admin/help', icon: <HelpCircle className="w-4 h-4" /> },
    ],
  },
];

// Tenant slugs that use the simplified commerce navigation.
const COMMERCE_TENANTS = ['vitality'];

function readTenantSlug(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)x-tenant-slug=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>(NAV_ITEMS);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [brandLabel, setBrandLabel] = useState('Kelatic Admin');
  const { announce } = useAriaLiveRegion();

  // Pick navigation based on the current tenant (commerce vs salon)
  useEffect(() => {
    const slug = readTenantSlug();
    if (slug && COMMERCE_TENANTS.includes(slug)) {
      setNavItems(COMMERCE_NAV);
      setBrandLabel('Vitality House');
    }
  }, []);

  // Mobile detection and responsive handling
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setSidebarOpen(false); // Close sidebar on desktop
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Announce page changes for screen readers
  useEffect(() => {
    const pageName = navItems.find(item => item.href === pathname)?.label || 'Page';
    announce(`Navigated to ${pageName}`);
  }, [pathname, announce, navItems]);

  const handleSidebarToggle = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    announce(newState ? 'Navigation menu opened' : 'Navigation menu closed');
  };

  return (
    <div className="x3o-term min-h-screen">
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#navigation">Skip to navigation</SkipLink>

      {/* Mobile bar */}
      <div className="lg:hidden flex items-center justify-between px-4 h-12 bg-card border-b border-border">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="term-dot text-[#00ffb2]" />
          <span className="font-bold tracking-tight">x3o<span className="text-[#00ffb2]">.ai</span></span>
        </Link>
        <button
          onClick={handleSidebarToggle}
          aria-expanded={sidebarOpen ? 'true' : 'false'}
          aria-controls="sidebar-navigation"
          aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="p-2 rounded text-muted-foreground hover:text-foreground"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && isMobile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar-navigation"
        className={`fixed top-0 left-0 z-50 h-full w-60 bg-card border-r border-border flex flex-col transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <div className="h-12 shrink-0 flex items-center gap-2 px-4 border-b border-border">
          <span className="term-dot text-[#00ffb2]" />
          <Link href="/admin" className="font-bold tracking-tight">x3o<span className="text-[#00ffb2]">.ai</span></Link>
          <span className="ml-auto term-label text-muted-foreground truncate max-w-[96px]">{brandLabel}</span>
        </div>

        {/* Navigation */}
        <nav id="navigation" className="flex-1 overflow-y-auto p-2 space-y-0.5" role="navigation" aria-label="Admin panel navigation">
          {navItems.map((item) => {
            if (item.children) {
              const open = openGroups[item.label] ?? false;
              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => setOpenGroups((g) => ({ ...g, [item.label]: !open }))}
                    aria-expanded={open}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors focus:outline-none focus:ring-1 focus:ring-[#00ffb2]"
                  >
                    {item.icon}
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <div className="ml-3 mt-0.5 space-y-0.5 border-l border-border pl-2">
                      {item.children.map((child) => {
                        const childActive =
                          pathname === child.href ||
                          (child.href !== '/admin' && pathname.startsWith(child.href));
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => isMobile && setSidebarOpen(false)}
                            aria-current={childActive ? 'page' : undefined}
                            className={`flex items-center gap-2.5 px-3 py-1.5 rounded text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-[#00ffb2] ${
                              childActive
                                ? 'text-[#00ffb2] bg-[#00ffb2]/10'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                            }`}
                          >
                            {child.icon}
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive =
              pathname === item.href ||
              (!!item.href && item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href!}
                onClick={() => isMobile && setSidebarOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-2.5 px-3 py-2 rounded text-sm border-l-2 transition-colors focus:outline-none focus:ring-1 focus:ring-[#00ffb2] ${
                  isActive
                    ? 'border-[#00ffb2] text-[#00ffb2] bg-[#00ffb2]/10 font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User / logout */}
        <div className="shrink-0 p-2 border-t border-border">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-8 h-8 rounded bg-[#00ffb2]/15 text-[#00ffb2] flex items-center justify-center text-xs font-bold data-mono">x3</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">Admin</p>
              <p className="text-[10px] text-muted-foreground truncate data-mono">{brandLabel}</p>
            </div>
            <button
              className="term-label text-[#ef4444] hover:text-red-300 transition-colors"
              onClick={async () => {
                const supabase = (await import('@/lib/supabase/client')).createClient();
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
            >
              Exit
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-60">
        <header className="h-12 bg-card/80 backdrop-blur border-b border-border flex items-center px-4 lg:px-6 sticky top-0 z-30 gap-4">
          <button
            onClick={handleSidebarToggle}
            aria-label="Open navigation menu"
            className="p-1.5 -ml-1 text-muted-foreground hover:text-foreground lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2">
            <span className="term-dot text-[#00ffb2]" />
            <span className="term-label text-muted-foreground truncate max-w-[160px]">{brandLabel} · live</span>
          </div>

          <div className="flex-1" />

          <Clock className="text-xs text-muted-foreground hidden sm:block" />
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-[#00ffb2] transition-colors hidden sm:block"
          >
            View Site
          </Link>
          <NotificationBell />
        </header>

        <main id="main-content" className="p-4 lg:p-6" role="main" aria-label="Main content area">
          <div className="max-w-[1400px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
