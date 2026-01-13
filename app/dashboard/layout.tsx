// =============================================================================
// DASHBOARD LAYOUT
// /app/dashboard/layout.tsx
// Sidebar navigation + main content area
// =============================================================================

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Flame,
  TrendingUp,
  ChevronRight,
  Zap,
} from 'lucide-react'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Campaigns', href: '/dashboard/campaigns', icon: MessageSquare },
  { name: 'Hot Leads', href: '/dashboard/hot-leads', icon: Flame },
  { name: 'Analytics', href: '/dashboard/analytics', icon: TrendingUp },
  { name: 'Contacts', href: '/dashboard/contacts', icon: Users },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-zinc-900" />
            </div>
            <span className="text-lg font-bold text-white">x3o.ai</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 hover:bg-zinc-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
                {item.name === 'Hot Leads' && (
                  <span className="ml-auto text-xs bg-orange-500/10 text-orange-400 px-1.5 py-0.5 rounded">
                    3
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800">
          {/* Quick Stats */}
          <div className="bg-zinc-800/50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-zinc-400">Active Campaigns</span>
              <span className="text-emerald-400 font-medium">2</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">This Month</span>
              <span className="text-cyan-400 font-medium">$4,250</span>
            </div>
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-medium">
              K
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">KeLatic Hair</p>
              <p className="text-xs text-zinc-500 truncate">Pro Plan</p>
            </div>
            <button className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 h-16 bg-zinc-900/50 backdrop-blur border-b border-zinc-800 lg:hidden">
          <div className="flex items-center justify-between h-full px-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-zinc-800 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-zinc-900" />
              </div>
              <span className="text-lg font-bold text-white">x3o.ai</span>
            </Link>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page Content */}
        <main>{children}</main>
      </div>
    </div>
  )
}
