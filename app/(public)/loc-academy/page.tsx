'use client';

import Link from 'next/link';
import { ArrowLeft, Award, Instagram, Mail } from 'lucide-react';
import { PublicAuthLinks } from '@/components/layout/public-auth-links';
import { Footer } from '@/components/layout/footer';

export default function LocAcademyPage() {
  return (
    <div className="min-h-screen bg-[#211a16] text-[#f7efe2]">
      <header className="bg-[#211a16]/85 backdrop-blur-xl border-b border-[#3a2f27] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Kelatic Hair Lounge" className="h-12 w-auto" />
            </Link>
            <div className="flex items-center gap-4">
              <PublicAuthLinks />
              <Link
                href="/"
                className="flex items-center gap-2 text-sm text-[#d8cbb6] hover:text-[#d6a85f] transition-colors"
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
            <span className="text-[#d6a85f] font-medium tracking-wider uppercase text-sm">Loc Academy</span>
            <h1 className="text-4xl md:text-5xl font-playfair font-medium mt-4 mb-6 text-[#f7efe2]">Train with The Loc Gawd</h1>
            <p className="text-lg text-[#d8cbb6] mb-8">
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
                  <div className="w-6 h-6 bg-[#b08344] rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-white/85">{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:info@kelatic.com?subject=Loc Academy Interest"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#b08344] text-white rounded-full font-semibold hover:bg-[#9a6f33] transition-all hover:scale-[1.03] shadow-sm hover:shadow-md hover:shadow-[#b08344]/20"
              >
                <Mail className="w-5 h-5" />
                Get Notified
              </a>
              <a
                href="https://www.instagram.com/kelatichairlounge_"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-[#3a2f27] rounded-full font-semibold text-[#f7efe2] hover:bg-white/10 transition-colors"
              >
                <Instagram className="w-5 h-5" />
                Follow Updates
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-[#2a211c] to-[#1c1612] border border-[#3a2f27] flex items-center justify-center">
              <div className="text-center">
                <div className="w-28 h-28 mx-auto bg-[#b08344] rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-[#b08344]/30">
                  <Award className="w-14 h-14 text-white" />
                </div>
                <h3 className="text-2xl font-playfair font-medium mb-2 text-[#f7efe2]">Get Certified</h3>
                <p className="text-[#d8cbb6]">Start your loc career</p>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 bg-[#b08344] text-white rounded-full px-5 py-2 font-semibold shadow-xl animate-float">
              Limited Spots!
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
