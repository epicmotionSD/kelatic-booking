"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Suspense } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [isPlatform, setIsPlatform] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectTo = searchParams.get('redirect') || '/admin';
  const loginType = searchParams.get('type') || 'admin';

  // Detect if we're on the platform root (no subdomain)
  useEffect(() => {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isRootDomain = hostname === 'x3o.ai' || hostname === 'www.x3o.ai';
    const hasNoSubdomain = isLocalhost || isRootDomain || hostname.endsWith('.vercel.app');
    setIsPlatform(hasNoSubdomain);
  }, []);

  const platformTitles: Record<string, { title: string; subtitle: string }> = {
    admin: { title: 'Command Center', subtitle: 'Access your AI Board of Directors' },
    stylist: { title: 'Stylist Portal', subtitle: 'View your appointments' },
    client: { title: 'Client Login', subtitle: 'View your bookings' },
  };

  const tenantTitles: Record<string, { title: string; subtitle: string }> = {
    admin: { title: 'Admin Login', subtitle: 'Sign in to admin dashboard' },
    stylist: { title: 'Stylist Portal', subtitle: 'View your appointments' },
    client: { title: 'Client Login', subtitle: 'View your bookings' },
  };

  const titles = isPlatform ? platformTitles : tenantTitles;
  const { title, subtitle } = titles[loginType] || titles.admin;

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetLoading(true);
    setError("");
    setResetSent(false);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/reset-password"
    });
    setResetLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // For stylist/client logins, verify role
      if (loginType === 'stylist' || loginType === 'client') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
        .eq('id', data.user.id)
        .single();

      if (loginType === 'stylist' && !['stylist', 'admin', 'owner'].includes(profile?.role || '')) {
        setError('This account is not registered as a stylist');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (loginType === 'client' && profile?.role !== 'client') {
        // For admins/stylists trying to access client portal, still allow
        // They can see it from client perspective
      }
    }

    setLoading(false);
    router.push(redirectTo);
  } catch (networkError) {
    setLoading(false);
    setError('Network error - try incognito mode or disable browser extensions');
    console.error('Login network error:', networkError);
  }
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
      <div className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l to-transparent ${isPlatform ? 'from-violet-500/5' : 'from-amber-500/5'}`} />
      <div className={`absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-r to-transparent ${isPlatform ? 'from-fuchsia-500/5' : 'from-amber-500/5'}`} />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center mb-8">
          {isPlatform ? (
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center font-bold text-white text-lg">
                x3
              </div>
              <span className="text-2xl font-bold text-white">x3o.ai</span>
            </div>
          ) : (
            <img
              src="/logo.png"
              alt="Kelatic Hair Lounge"
              className="h-16 w-auto"
            />
          )}
        </Link>

        <form
          onSubmit={handleLogin}
          className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl"
        >
          <h1 className="text-2xl font-black text-white mb-2 text-center">{title}</h1>
          <p className="text-white/50 text-center mb-8">{subtitle}</p>

          <div className="space-y-5">
            <div>
              <label className="block mb-2 text-sm font-medium text-white/70">Email</label>
              <input
                type="email"
                className={`w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none transition-all ${
                  isPlatform
                    ? 'focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/50'
                    : 'focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50'
                }`}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                suppressHydrationWarning
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-white/70">Password</label>
              <input
                type="password"
                className={`w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none transition-all ${
                  isPlatform
                    ? 'focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/50'
                    : 'focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50'
                }`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                suppressHydrationWarning
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {resetSent && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm">
              Password reset email sent! Check your inbox.
            </div>
          )}

          <button
            type="submit"
            className={`w-full mt-6 py-3.5 rounded-xl font-bold transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 ${
              isPlatform
                ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:shadow-lg hover:shadow-violet-500/30'
                : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:shadow-lg hover:shadow-amber-500/30'
            }`}
            disabled={loading}
            suppressHydrationWarning
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <button
            type="button"
            className={`w-full mt-3 text-sm transition-colors ${
              isPlatform
                ? 'text-violet-400/70 hover:text-violet-400'
                : 'text-amber-400/70 hover:text-amber-400'
            }`}
            onClick={handleResetPassword}
            disabled={resetLoading || !email}
          >
            {resetLoading ? "Sending reset email..." : "Forgot password?"}
          </button>
        </form>

        <p className="text-center mt-6 text-white/30 text-sm">
          <Link href="/" className={`transition-colors ${isPlatform ? 'hover:text-violet-400' : 'hover:text-amber-400'}`}>
            ← Back to {isPlatform ? 'platform' : 'website'}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
