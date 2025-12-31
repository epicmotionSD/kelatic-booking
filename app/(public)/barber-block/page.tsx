'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Instagram, Scissors, ArrowLeft } from 'lucide-react';

interface Barber {
  id: string;
  first_name: string;
  last_name: string;
  bio?: string;
  specialties?: string[];
  avatar_url?: string;
  instagram_handle?: string;
}

export default function BarberBlockPage() {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    try {
      const res = await fetch('/api/stylists?barbers=true');
      if (res.ok) {
        const data = await res.json();
        setBarbers(data.stylists || []);
      }
    } catch (error) {
      console.error('Failed to fetch barbers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black border-b border-white/10 sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
                <Scissors className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">BARBER BLOCK</h1>
                <p className="text-white/40 text-xs tracking-widest">BY KELATIC</p>
              </div>
            </div>

            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-white/50 hover:text-red-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Kelatic
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 to-transparent" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-black mb-6">
            Fresh Cuts.{' '}
            <span className="bg-gradient-to-r from-red-400 to-red-600 text-transparent bg-clip-text">
              No Cap.
            </span>
          </h2>
          <p className="text-xl md:text-2xl text-white/60 max-w-2xl mx-auto mb-10">
            Premium barber services from Houston&apos;s finest. Fades, lineups, and cuts that speak for themselves.
          </p>
          {barbers.length > 0 && (
            <Link
              href={`/book?stylist=${barbers[0].id}`}
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-bold text-lg hover:shadow-xl hover:shadow-red-500/30 transition-all"
            >
              <Calendar className="w-6 h-6" />
              Book Your Cut
            </Link>
          )}
        </div>
      </section>

      {/* Barbers Grid */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-red-400 font-medium tracking-wider uppercase text-sm">The Team</span>
            <h3 className="text-4xl md:text-5xl font-black mt-2">Meet The Barbers</h3>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500" />
            </div>
          ) : barbers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-red-500/20 to-transparent rounded-full flex items-center justify-center">
                <Scissors className="w-12 h-12 text-red-400" />
              </div>
              <h4 className="text-2xl font-bold mb-3">Coming Soon</h4>
              <p className="text-white/50 max-w-md mx-auto">
                Our barber team is being assembled. Check back soon for booking availability.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 mt-8 px-6 py-3 border border-white/20 rounded-full hover:border-red-400 hover:text-red-400 transition-colors"
              >
                Explore Kelatic Services
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {barbers.map((barber) => (
                <div
                  key={barber.id}
                  className="bg-zinc-900 rounded-2xl border border-white/10 overflow-hidden hover:border-red-500/50 transition-colors group"
                >
                  {/* Avatar */}
                  <div className="aspect-square bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center relative overflow-hidden">
                    {barber.avatar_url ? (
                      <img
                        src={barber.avatar_url}
                        alt={barber.first_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-red-500/20 to-transparent flex items-center justify-center border border-red-500/30">
                        <span className="text-5xl font-black text-white/40">
                          {barber.first_name[0]}
                        </span>
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Info */}
                  <div className="p-6">
                    <h4 className="text-xl font-bold mb-2">
                      {barber.first_name} {barber.last_name}
                    </h4>
                    {barber.specialties && barber.specialties.length > 0 && (
                      <p className="text-red-400 text-sm mb-3">
                        {barber.specialties.join(' | ')}
                      </p>
                    )}
                    {barber.bio && (
                      <p className="text-white/50 text-sm mb-5 line-clamp-2">{barber.bio}</p>
                    )}

                    <div className="flex gap-3">
                      <Link
                        href={`/book?stylist=${barber.id}`}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-red-500/30 transition-all"
                      >
                        <Calendar className="w-5 h-5" />
                        Book Now
                      </Link>
                      {barber.instagram_handle && (
                        <a
                          href={`https://instagram.com/${barber.instagram_handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-red-500/50 transition-all"
                          title={`@${barber.instagram_handle}`}
                        >
                          <Instagram className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Services Teaser */}
      <section className="py-20 px-4 bg-zinc-950">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-3xl font-bold mb-6">What We Offer</h3>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { name: 'Fresh Fades', desc: 'Clean, crisp fades tailored to your style' },
              { name: 'Line-Ups', desc: 'Sharp edges and precise hairlines' },
              { name: 'Beard Trims', desc: 'Sculpted beards and grooming' },
            ].map((service) => (
              <div
                key={service.name}
                className="bg-zinc-900/50 border border-white/5 rounded-xl p-6 hover:border-red-500/30 transition-colors"
              >
                <h4 className="font-bold text-lg mb-2">{service.name}</h4>
                <p className="text-white/50 text-sm">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 rounded-lg flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold">Barber Block</span>
          </div>
          <p className="text-white/40 text-sm mb-6">A Kelatic Hair Lounge Experience</p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <Link href="/" className="text-white/50 hover:text-red-400 transition-colors">
              Kelatic Main Site
            </Link>
            <a href="tel:+17134854000" className="text-white/50 hover:text-red-400 transition-colors">
              (713) 485-4000
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
