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
    <div className="min-h-screen bg-[#faf7f2] text-stone-800 flex flex-col">
      <header className="bg-[#faf7f2]/85 backdrop-blur-xl border-b border-[#e7ddcd]">
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
              <Link href="/" className="text-sm text-stone-500 hover:text-[#8a5a2b] transition-colors">
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
            <h1 className="font-playfair text-2xl font-medium mb-4 text-stone-900">You&apos;ve Been Unsubscribed</h1>
            <p className="text-stone-600 mb-8">
              We&apos;re sorry to see you go! You&apos;ve been removed from our mailing list and won&apos;t receive any more newsletters from us.
            </p>
            <p className="text-stone-400 text-sm mb-8">
              Changed your mind? You can always resubscribe by visiting our website.
            </p>
          </>
        ) : error ? (
          <>
            <div className="text-6xl mb-6">😕</div>
            <h1 className="font-playfair text-2xl font-medium mb-4 text-stone-900">Something Went Wrong</h1>
            <p className="text-stone-600 mb-8">
              {error === 'missing-email' && 'Email address is missing from the unsubscribe link.'}
              {error === 'invalid-token' && 'The unsubscribe link is invalid or has expired.'}
              {error === 'failed' && 'We couldn\'t process your unsubscribe request. Please try again.'}
            </p>
            <p className="text-stone-400 text-sm mb-8">
              If you continue to have issues, please contact us directly at (713) 485-4000.
            </p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-6">📧</div>
            <h1 className="font-playfair text-2xl font-medium mb-4 text-stone-900">Email Preferences</h1>
            <p className="text-stone-600 mb-8">
              Looking to manage your email preferences? Visit your account page or contact us directly.
            </p>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="px-6 py-3 bg-white border border-[#e0d4c0] text-stone-700 rounded-full font-medium hover:border-[#b08344]/40 hover:text-[#8a5a2b] transition-all shadow-sm"
          >
            Return Home
          </Link>
          <Link
            href="/book"
            className="px-6 py-3 bg-[#b08344] text-white rounded-full font-semibold hover:bg-[#9a6f33] shadow-sm hover:shadow-md hover:shadow-[#b08344]/20 transition-all"
          >
            Book Appointment
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-[#e7ddcd]">
          <p className="text-stone-400 text-sm">
            Kelatic Hair Lounge<br />
            9430 Richmond Ave, Houston, TX 77063<br />
            <a href="tel:+17134854000" className="text-[#8a5a2b] hover:text-[#b08344]">
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
      <div className="min-h-screen bg-[#faf7f2] text-stone-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#b08344]"></div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
