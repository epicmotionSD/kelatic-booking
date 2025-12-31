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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400" />
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/stylist" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center">
                <span className="text-black font-black text-lg">K</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-bold">Stylist Portal</span>
              </div>
            </Link>

            {/* Nav */}
            <nav className="flex items-center gap-6">
              <Link
                href="/stylist"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/stylist' ? 'text-amber-400' : 'text-white/70 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/stylist/schedule"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/stylist/schedule' ? 'text-amber-400' : 'text-white/70 hover:text-white'
                }`}
              >
                Schedule
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/70 hidden sm:block">{stylistName}</span>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
