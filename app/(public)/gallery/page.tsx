'use client';

import Link from 'next/link';
import { ArrowLeft, Camera } from 'lucide-react';
import { PublicAuthLinks } from '@/components/layout/public-auth-links';
import { Footer } from '@/components/layout/footer';

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
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

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-widest text-amber-400">
            <Camera className="w-4 h-4" />
            Gallery
          </div>
          <h1 className="text-4xl md:text-5xl font-playfair font-bold mt-6">Kelatic Gallery</h1>
          <p className="text-lg text-white/60 mt-4 max-w-2xl mx-auto">
            A curated look at our loc artistry, transformations, and signature styles.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 1, 2, 3, 4].map((num, idx) => (
            <div
              key={`${num}-${idx}`}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 hover:border-amber-400/30 transition-all duration-300"
            >
              <img
                src={`/gallery/image${num}.jpg`}
                alt={`Kelatic gallery ${num}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
          >
            Book Your Appointment
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
