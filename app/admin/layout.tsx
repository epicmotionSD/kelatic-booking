'use client';

import { useState, useEffect } from 'react';
import NotificationBell from './NotificationBell';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Zap, 
  Calendar, 
  CreditCard, 
  Briefcase, 
  Users, 
  UserCheck, 
  BarChart3, 
  Settings, 
  HelpCircle,
  Menu,
  X
} from 'lucide-react';
import { SkipLink, useAriaLiveRegion } from '@/lib/accessibility';

const NAV_ITEMS = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: <Home className="w-5 h-5" />,
  },
  {
    label: 'Marketing',
    href: '/admin/trinity',
    icon: <Zap className="w-5 h-5" />,
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { announce } = useAriaLiveRegion();

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
    const pageName = NAV_ITEMS.find(item => item.href === pathname)?.label || 'Page';
    announce(`Navigated to ${pageName}`);
  }, [pathname, announce]);

  const handleSidebarToggle = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    announce(newState ? 'Navigation menu opened' : 'Navigation menu closed');
  };

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Skip Links */}
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      <SkipLink href="#navigation">Skip to navigation</SkipLink>
      
      {/* Mobile menu button */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-amber-200 shadow-sm">
        <Link href="/admin" className="flex items-center">
          <h1 className="text-xl font-playfair font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Kelatic Admin
          </h1>
        </Link>
        <button
          onClick={handleSidebarToggle}
          aria-expanded={sidebarOpen}
          aria-controls="sidebar-navigation"
          aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
          className="p-2 rounded-md text-stone-600 hover:bg-amber-50 hover:text-amber-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar-navigation"
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-amber-200 shadow-xl transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-amber-200">
          <Link href="/admin" className="flex items-center focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-md">
            <h1 className="text-xl font-playfair font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              Kelatic Admin
            </h1>
          </Link>
        </div>

        {/* Navigation */}
        <nav id="navigation" className="p-3 space-y-1" role="navigation" aria-label="Admin panel navigation">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => isMobile && setSidebarOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                  isActive
                    ? 'bg-amber-500 text-white font-bold shadow-lg'
                    : 'text-stone-700 hover:bg-amber-100 hover:text-amber-900 hover:shadow-md'
                }`}
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-amber-200">
          <div className="flex items-center gap-3 px-4 py-3 bg-cream-50 rounded-xl border border-amber-200">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-sm text-white font-bold">K</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-stone-900 font-bold truncate">Admin</p>
              <p className="text-xs text-stone-600 truncate">kelatic@admin.com</p>
            </div>
            <button
              className="text-xs text-red-600 hover:text-red-700 transition-colors font-medium"
              onClick={async () => {
                const supabase = (await import('@/lib/supabase/client')).createClient();
                await supabase.auth.signOut();
                window.location.href = '/login';
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-amber-200 shadow-sm flex items-center px-4 lg:px-8 sticky top-0 z-30">
          {/* Mobile menu button */}
          <button
            onClick={handleSidebarToggle}
            aria-label="Open navigation menu"
            className="p-2 -ml-2 text-stone-600 hover:text-amber-900 lg:hidden focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-md"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Page title - populated by page */}
          <div className="flex-1" />

          {/* Quick Actions */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="text-sm text-stone-600 hover:text-amber-600 transition-colors hidden sm:block font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-md px-2 py-1"
              rel="noopener noreferrer"
            >
              View Site
            </Link>
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" className="p-4 lg:p-8" role="main" aria-label="Main content area">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
