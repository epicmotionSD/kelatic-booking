"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Supabase passes the access token in the URL hash
    // The client library will automatically pick it up
    const supabase = createClient();

    // Check if we have a valid session from the reset link
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Also check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true);
      }
    });
  }, []);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <div className="text-green-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Password Reset!</h1>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleResetPassword}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Reset Your Password</h1>

        {!ready && (
          <div className="text-amber-600 bg-amber-50 p-3 rounded mb-4 text-sm">
            Waiting for authentication... If this persists, please request a new reset link.
          </div>
        )}

        <label className="block mb-2 text-sm font-medium">New Password</label>
        <input
          type="password"
          className="w-full p-2 border rounded mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          disabled={!ready}
        />

        <label className="block mb-2 text-sm font-medium">Confirm Password</label>
        <input
          type="password"
          className="w-full p-2 border rounded mb-4"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          disabled={!ready}
        />

        {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}

        <button
          type="submit"
          className="w-full bg-purple-600 text-white py-2 rounded font-semibold hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || !ready}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-600">
          <a href="/login" className="text-purple-600 hover:underline">
            Back to Login
          </a>
        </p>
      </form>
    </div>
  );
}
