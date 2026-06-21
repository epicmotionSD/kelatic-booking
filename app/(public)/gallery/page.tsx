'use client';

import Link from 'next/link';
import { ArrowLeft, Camera } from 'lucide-react';
import { PublicAuthLinks } from '@/components/layout/public-auth-links';
import { Footer } from '@/components/layout/footer';

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-[#faf7f2] text-stone-800">
      <header className="bg-[#faf7f2]/85 backdrop-blur-xl border-b border-[#e7ddcd] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <img src="/logo.png" alt="Kelatic Hair Lounge" className="h-12 w-auto" />
            </Link>
            <div className="flex items-center gap-4">
              <PublicAuthLinks />
              <Link
                href="/"
                className="flex items-center gap-2 text-sm text-stone-500 hover:text-[#8a5a2b] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to site
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#e7ddcd] text-xs uppercase tracking-widest text-[#8a5a2b]">
            <Camera className="w-4 h-4" />
            Gallery
          </div>
          <h1 className="text-4xl md:text-5xl font-playfair font-medium mt-6 text-stone-900">Kelatic Gallery</h1>
          <p className="text-lg text-stone-600 mt-4 max-w-2xl mx-auto">
            A curated look at our loc artistry, transformations, and signature styles.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 1, 2, 3, 4].map((num, idx) => (
            <div
              key={`${num}-${idx}`}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-[#e7ddcd] border border-[#e0d4c0] hover:border-[#b08344]/40 transition-all duration-300 shadow-sm"
            >
              <img
                src={`/gallery/image${num}.jpg`}
                alt={`Kelatic gallery ${num}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#b08344] text-white rounded-full font-semibold hover:bg-[#9a6f33] transition-all hover:scale-[1.03] shadow-sm hover:shadow-md hover:shadow-[#b08344]/20"
          >
            Book Your Appointment
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
