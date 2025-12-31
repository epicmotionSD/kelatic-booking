"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const router = useRouter();

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
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.push("/admin");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-500/5 to-transparent" />
      <div className="absolute bottom-0 left-0 w-1/2 h-full bg-gradient-to-r from-amber-500/5 to-transparent" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-500/20">
            <span className="text-black font-black text-2xl">K</span>
          </div>
        </Link>

        <form
          onSubmit={handleLogin}
          className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl"
        >
          <h1 className="text-2xl font-black text-white mb-2 text-center">Welcome Back</h1>
          <p className="text-white/50 text-center mb-8">Sign in to admin dashboard</p>

          <div className="space-y-5">
            <div>
              <label className="block mb-2 text-sm font-medium text-white/70">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50 transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-white/70">Password</label>
              <input
                type="password"
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
            className="w-full mt-6 py-3.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <button
            type="button"
            className="w-full mt-3 text-amber-400/70 hover:text-amber-400 text-sm transition-colors"
            onClick={handleResetPassword}
            disabled={resetLoading || !email}
          >
            {resetLoading ? "Sending reset email..." : "Forgot password?"}
          </button>
        </form>

        <p className="text-center mt-6 text-white/30 text-sm">
          <Link href="/" className="hover:text-amber-400 transition-colors">
            ← Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}
