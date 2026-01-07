'use client';

import { useState } from 'react';
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
  HelpCircle 
} from 'lucide-react';

const NAV_ITEMS = [
  {
    label: 'Divine Throne',
    href: '/admin',
    icon: <Home className="w-5 h-5" />,
  },
  {
    label: 'Divine Marketing',
    href: '/admin/trinity',
    icon: <Zap className="w-5 h-5" />,
  },
  {
    label: 'Sacred Sessions',
    href: '/admin/appointments',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    label: 'Divine Till',
    href: '/admin/pos',
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    label: 'Sacred Arts',
    href: '/admin/services',
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    label: 'Divine Locticians',
    href: '/admin/stylists',
    icon: <Users className="w-5 h-5" />,
  },
  {
    label: 'Blessed Disciples',
    href: '/admin/clients',
    icon: <UserCheck className="w-5 h-5" />,
  },
  {
    label: 'Divine Insights',
    href: '/admin/reports',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: 'Divine Config',
    href: '/admin/settings',
    icon: <Settings className="w-5 h-5" />,
  },
  {
    label: 'Divine Wisdom',
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

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-amber-200 shadow-xl transform transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-amber-200">
          <Link href="/admin" className="flex items-center">
            <h1 className="text-xl font-playfair font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              ✨ Loctician Gods
            </h1>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
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

        {/* Divine User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-amber-200">
          <div className="flex items-center gap-3 px-4 py-3 bg-cream-50 rounded-xl border border-amber-200">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-sm text-white font-bold">✨</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-stone-900 font-bold truncate">Divine Admin</p>
              <p className="text-xs text-stone-600 truncate">kelatic@gods.com</p>
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
        {/* Divine Top Bar */}
        <header className="h-16 bg-white border-b border-amber-200 shadow-sm flex items-center px-4 lg:px-8 sticky top-0 z-30">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-stone-600 hover:text-amber-900 lg:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Page title - populated by page */}
          <div className="flex-1" />

          {/* Divine Quick Actions */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="text-sm text-stone-600 hover:text-amber-600 transition-colors hidden sm:block font-medium"
            >
              View Divine Site ✨
            </Link>
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
