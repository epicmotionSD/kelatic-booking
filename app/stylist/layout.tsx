'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function StylistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [stylistName, setStylistName] = useState('');
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login?redirect=/stylist&type=stylist');
      return;
    }

    // Check if user is a stylist
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, role')
      .eq('id', user.id)
      .single();

    if (!profile || !['stylist', 'admin', 'owner'].includes(profile.role)) {
      router.push('/');
      return;
    }

    setStylistName(`${profile.first_name} ${profile.last_name}`);
    setAuthorized(true);
    setLoading(false);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-amber-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/stylist" className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full blur-sm opacity-75" />
                <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full p-3">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2M21 9V7L15 1H5C3.89 1 3 1.89 3 3V19A2 2 0 0 0 5 21H11V19.5L19 11.5V9M12 8C15.31 8 18 10.69 18 14C18 17.31 15.31 20 12 20S6 17.31 6 14C6 10.69 8.69 8 12 8Z"/>
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-2xl bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Loctician Gods
                </span>
                <span className="text-sm font-medium text-amber-700/70">Stylist Portal</span>
              </div>
            </Link>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/stylist"
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full ${
                  pathname === '/stylist' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg transform scale-105' 
                    : 'text-amber-800 hover:bg-amber-100/80 hover:text-amber-900'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/stylist/schedule"
                className={`relative px-4 py-2 text-sm font-medium transition-all duration-200 rounded-full ${
                  pathname === '/stylist/schedule' 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg transform scale-105' 
                    : 'text-amber-800 hover:bg-amber-100/80 hover:text-amber-900'
                }`}
              >
                Schedule
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 flex items-center justify-center text-white font-bold text-sm">
                  {stylistName.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-amber-900">{stylistName}</span>
                  <span className="text-xs text-amber-700/70">Master Loctician</span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="px-6 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100/80 transition-all duration-200 rounded-full border border-amber-200 hover:border-amber-300 hover:shadow-md"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-8 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Inspirational Header */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent mb-2">
              Welcome Back, Loctician God ✨
            </h1>
            <p className="text-lg text-amber-800/70 font-medium">
              Craft beautiful locs and build legacies, one appointment at a time
            </p>
          </div>
          
          {/* Content with background pattern */}
          <div className="relative">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute inset-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f59e0b' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }} />
            </div>
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
