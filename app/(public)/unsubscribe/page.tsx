'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { PublicAuthLinks } from '@/components/layout/public-auth-links';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <header className="bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <img
                src="/logo.png"
                alt="Kelatic Hair Lounge"
                className="h-10 w-auto"
              />
            </Link>
            <div className="flex items-center gap-4">
              <PublicAuthLinks />
              <Link href="/" className="text-sm text-white/50 hover:text-amber-400 transition-colors">
                ← Back to site
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">

        {success === 'true' ? (
          <>
            <div className="text-6xl mb-6">👋</div>
            <h1 className="text-2xl font-bold mb-4">You&apos;ve Been Unsubscribed</h1>
            <p className="text-white/60 mb-8">
              We&apos;re sorry to see you go! You&apos;ve been removed from our mailing list and won&apos;t receive any more newsletters from us.
            </p>
            <p className="text-white/40 text-sm mb-8">
              Changed your mind? You can always resubscribe by visiting our website.
            </p>
          </>
        ) : error ? (
          <>
            <div className="text-6xl mb-6">😕</div>
            <h1 className="text-2xl font-bold mb-4">Something Went Wrong</h1>
            <p className="text-white/60 mb-8">
              {error === 'missing-email' && 'Email address is missing from the unsubscribe link.'}
              {error === 'invalid-token' && 'The unsubscribe link is invalid or has expired.'}
              {error === 'failed' && 'We couldn\'t process your unsubscribe request. Please try again.'}
            </p>
            <p className="text-white/40 text-sm mb-8">
              If you continue to have issues, please contact us directly at (713) 485-4000.
            </p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-6">📧</div>
            <h1 className="text-2xl font-bold mb-4">Email Preferences</h1>
            <p className="text-white/60 mb-8">
              Looking to manage your email preferences? Visit your account page or contact us directly.
            </p>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-white/10 border border-white/10 text-white rounded-full font-medium hover:bg-white/20 transition-all"
          >
            Return Home
          </Link>
          <Link
            href="/book"
            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
          >
            Book Appointment
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <p className="text-white/40 text-sm">
            Kelatic Hair Lounge<br />
            9430 Richmond Ave, Houston, TX 77063<br />
            <a href="tel:+17134854000" className="text-amber-400 hover:text-amber-300">
              (713) 485-4000
            </a>
          </p>
        </div>
        </div>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-400"></div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
