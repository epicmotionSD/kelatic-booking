'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [clientName, setClientName] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login?redirect=/account&type=client');
      return;
    }

    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    if (profile) {
      setClientName(`${profile.first_name} ${profile.last_name}`);
    }
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

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center">
                <span className="text-black font-black text-lg">K</span>
              </div>
              <div className="hidden sm:block">
                <span className="font-bold">My Account</span>
              </div>
            </Link>

            {/* Nav */}
            <nav className="flex items-center gap-6">
              <Link
                href="/account"
                className={`text-sm font-medium transition-colors ${
                  pathname === '/account' ? 'text-amber-400' : 'text-white/70 hover:text-white'
                }`}
              >
                Appointments
              </Link>
              <Link
                href="/book"
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full text-sm font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
              >
                Book Now
              </Link>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-white/70 hidden sm:block">{clientName}</span>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
