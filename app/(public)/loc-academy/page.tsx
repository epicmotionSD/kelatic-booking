'use client';

import Link from 'next/link';
import { ArrowLeft, Award, Instagram, Mail } from 'lucide-react';
import { PublicAuthLinks } from '@/components/layout/public-auth-links';
import { Footer } from '@/components/layout/footer';

export default function LocAcademyPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="bg-black/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Kelatic Hair Lounge" className="h-12 w-auto" />
            </Link>
            <div className="flex items-center gap-4">
              <PublicAuthLinks />
              <Link
                href="/"
                className="flex items-center gap-2 text-sm text-white/50 hover:text-amber-400 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to site
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-amber-400 font-medium tracking-wider uppercase text-sm">Loc Academy</span>
            <h1 className="text-4xl md:text-5xl font-black mt-4 mb-6">Train with The Loc Gawd</h1>
            <p className="text-lg text-white/60 mb-8">
              Master starter to advanced loc techniques, scalp care, and business guidance with hands-on training.
            </p>
            <ul className="space-y-4 mb-10">
              {[
                'Hands-on training with real clients',
                'Certificate upon completion',
                'Business & marketing guidance',
                'Small class sizes with direct mentorship',
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/70">{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:kelatic@gmail.com?subject=Loc Academy Interest"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
              >
                <Mail className="w-5 h-5" />
                Get Notified
              </a>
              <a
                href="https://www.instagram.com/kelatichairlounge_"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/20 rounded-full font-semibold hover:bg-white/10 transition-colors"
              >
                <Instagram className="w-5 h-5" />
                Follow Updates
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/10 flex items-center justify-center">
              <div className="text-center">
                <div className="w-28 h-28 mx-auto bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-amber-500/30">
                  <Award className="w-14 h-14 text-black" />
                </div>
                <h3 className="text-2xl font-black mb-2">Get Certified</h3>
                <p className="text-white/50">Start your loc career</p>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full px-5 py-2 font-bold shadow-xl animate-float">
              Limited Spots!
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
