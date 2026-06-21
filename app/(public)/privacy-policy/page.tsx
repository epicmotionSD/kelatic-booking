import React from 'react';
import Link from 'next/link';
import { PublicAuthLinks } from '@/components/layout/public-auth-links';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#faf7f2] text-stone-800">
      <header className="bg-[#faf7f2]/85 backdrop-blur-xl border-b border-[#e7ddcd] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Kelatic Hair Lounge" className="h-10 w-auto" />
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

      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8 text-stone-700">
        <h1 className="font-playfair text-3xl font-medium mb-6 text-stone-900">Privacy Policy</h1>
        <p className="mb-4">Kelatic (“we”, “us”, or “our”) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.</p>
        <h2 className="font-playfair text-xl font-medium mt-8 mb-2 text-stone-900">Information We Collect</h2>
        <ul className="list-disc ml-6 mb-4">
          <li>Personal identification information (name, email address, phone number, etc.)</li>
          <li>Appointment and booking details</li>
          <li>Payment and transaction information</li>
          <li>Device and usage data (IP address, browser type, etc.)</li>
        </ul>
        <h2 className="font-playfair text-xl font-medium mt-8 mb-2 text-stone-900">How We Use Your Information</h2>
        <ul className="list-disc ml-6 mb-4">
          <li>To provide and manage our services</li>
          <li>To communicate with you about appointments, promotions, and updates</li>
          <li>To improve our website and services</li>
          <li>To comply with legal obligations</li>
        </ul>
        <h2 className="font-playfair text-xl font-medium mt-8 mb-2 text-stone-900">SMS Consent</h2>
        <p className="mb-4">By providing your phone number and opting in, you consent to receive SMS messages from Kelatic regarding appointments, reminders, promotions, and important updates. Message and data rates may apply. You can opt out at any time by replying STOP to any message.</p>
        <h2 className="font-playfair text-xl font-medium mt-8 mb-2 text-stone-900">Sharing Your Information</h2>
        <p className="mb-4">We do not sell or rent your personal information. We may share your information with trusted third parties who assist us in operating our website and services, as long as those parties agree to keep this information confidential.</p>
        <h2 className="font-playfair text-xl font-medium mt-8 mb-2 text-stone-900">Your Rights</h2>
        <ul className="list-disc ml-6 mb-4">
          <li>Access, update, or delete your personal information</li>
          <li>Opt out of marketing communications</li>
          <li>Request information about how your data is used</li>
        </ul>
        <h2 className="font-playfair text-xl font-medium mt-8 mb-2 text-stone-900">Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at info@kelatic.com.</p>
      </div>
    </div>
  );
}
