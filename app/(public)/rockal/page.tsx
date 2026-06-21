'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, Clock, DollarSign, Sparkles, Instagram, Phone } from 'lucide-react';
import { PublicAuthLinks } from '@/components/layout/public-auth-links';

interface Service {
  id: string;
  name: string;
  category: string;
  base_price: number;
  duration: number;
  description: string;
  deposit_required: boolean;
  deposit_amount: number | null;
}

interface Stylist {
  id: string;
  first_name: string;
  last_name: string;
  bio?: string;
  specialties?: string[];
  avatar_url?: string;
  instagram_handle?: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  locs: 'Loc Services',
  braids: 'Braids & Plaits',
  natural: 'Natural Hair',
  color: 'Color Services',
  treatments: 'Treatments',
  other: 'Other Services',
};

// Words that flag a service as consultation or kids — Rockal wants these excluded
const EXCLUDED_KEYWORDS = /\b(consult|consultation|kid|kids|children|child|waiting\s*list|model\s*sign|join\s*waiting)\b/i;
const MIN_PRICE = 125;

// Order categories for display
const CATEGORY_ORDER = ['locs', 'braids', 'natural', 'color', 'treatments', 'other'];

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function RockalPage() {
  const [rockal, setRockal] = useState<Stylist | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // First fetch Rockal's profile so we have her ID
      const stylistsRes = await fetch('/api/stylists');
      if (!stylistsRes.ok) throw new Error('Failed to fetch stylists');

      const stylistsData = await stylistsRes.json();
      const rockalProfile = (stylistsData.stylists || []).find(
        (s: Stylist) => s.first_name === 'Rockal'
      );
      if (rockalProfile) {
        setRockal(rockalProfile);

        // Now fetch only her assigned services (with custom prices)
        const servicesRes = await fetch(`/api/stylists/${rockalProfile.id}/services`);
        if (servicesRes.ok) {
          const data = await servicesRes.json();
          const allServices: Service[] = data.services || [];

          // Apply Rockal's filters:
          // 1. No barber services (she's a loctician)
          // 2. No consultations or kids services
          // 3. Nothing under $125
          const filtered = allServices.filter((s) => {
            if (s.category === 'barber') return false;
            if (EXCLUDED_KEYWORDS.test(s.name)) return false;
            if (s.base_price < MIN_PRICE) return false;
            return true;
          });

          setServices(filtered);
        }
      }
    } catch (err) {
      console.error('Failed to fetch Rockal data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group services by category
  const grouped = useMemo(() => {
    const map: Record<string, Service[]> = {};
    for (const s of services) {
      if (!map[s.category]) map[s.category] = [];
      map[s.category].push(s);
    }
    // Sort each group by price
    for (const cat of Object.keys(map)) {
      map[cat].sort((a, b) => a.base_price - b.base_price);
    }
    return map;
  }, [services]);

  const visibleCategories = CATEGORY_ORDER.filter((c) => grouped[c]?.length);

  const filteredCategories =
    activeCategory === 'all'
      ? visibleCategories
      : visibleCategories.filter((c) => c === activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf7f2] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-[#b08344] rounded-xl flex items-center justify-center shadow-sm animate-pulse">
            <span className="text-white font-playfair font-medium text-sm">K</span>
          </div>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#b08344]" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf7f2] text-stone-800">
      {/* Header */}
      <header className="bg-[#faf7f2]/85 border-b border-[#e7ddcd] sticky top-0 z-50 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#b08344] rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-playfair font-medium text-xs">K</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-stone-800">KeLatic</span>
                <span className="text-[9px] tracking-widest text-[#8a5a2b]">HAIR LOUNGE</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <PublicAuthLinks />
              <Link
                href="/"
                className="text-sm text-stone-600 hover:text-[#8a5a2b] transition-colors"
              >
                Back to Kelatic
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-28 px-4 relative overflow-hidden bg-gradient-to-b from-[#faf7f2] to-[#f3ede3]">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#e9d7bd]/40 blur-3xl" />
        <div className="relative max-w-4xl mx-auto text-center">
          {/* Avatar */}
          <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-[#e3cda8] shadow-xl shadow-stone-900/5">
            {rockal?.avatar_url ? (
              <img
                src={rockal.avatar_url}
                alt="Rockal Roberts"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#efe1cc] to-[#e3cda8] flex items-center justify-center">
                <span className="text-5xl font-playfair font-medium text-[#8a5a2b]">R</span>
              </div>
            )}
          </div>

          <h1 className="font-playfair text-4xl md:text-6xl font-medium mb-2 text-stone-900">Rockal Roberts</h1>
          <p className="font-playfair text-xl md:text-2xl font-medium italic text-[#b08344] mb-4">
            The Loc Gawd
          </p>
          <p className="text-lg text-stone-500 max-w-xl mx-auto mb-4 leading-relaxed">
            {rockal?.bio || 'Expert loctician specializing in retwists, starter locs, micro locs, extensions, and everything in between.'}
          </p>
          {rockal?.specialties && rockal.specialties.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {[...new Set(rockal.specialties)].map((s) => (
                <span
                  key={s}
                  className="px-3 py-1 bg-white border border-[#e7ddcd] rounded-full text-[#8a5a2b] text-sm shadow-sm"
                >
                  {s}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href={rockal ? `/book?stylist=${rockal.id}` : '/book'}
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#b08344] text-white rounded-full font-semibold text-lg hover:bg-[#9a6f33] shadow-sm hover:shadow-md hover:shadow-[#b08344]/20 transition-all hover:scale-[1.03]"
            >
              <Calendar className="w-6 h-6" />
              Book with Rockal
            </Link>
            <a
              href="tel:+17134854000"
              className="inline-flex items-center gap-2 px-6 py-4 border border-[#d8cbb6] rounded-full text-stone-700 hover:border-[#b08344]/50 hover:text-[#8a5a2b] hover:bg-white transition-all font-medium"
            >
              <Phone className="w-5 h-5" />
              (713) 485-4000
            </a>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="sticky top-[73px] z-40 bg-[#f3ede3]/90 backdrop-blur-xl border-b border-[#e7ddcd]">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === 'all'
                  ? 'bg-[#b08344] text-white shadow-sm'
                  : 'bg-white border border-[#e7ddcd] text-stone-600 hover:text-[#8a5a2b] hover:border-[#b08344]/40'
              }`}
            >
              All Services ({services.length})
            </button>
            {visibleCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-[#b08344] text-white shadow-sm'
                    : 'bg-white border border-[#e7ddcd] text-stone-600 hover:text-[#8a5a2b] hover:border-[#b08344]/40'
                }`}
              >
                {CATEGORY_LABELS[cat] || cat} ({grouped[cat].length})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-12">
          {filteredCategories.map((cat) => (
            <div key={cat}>
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-5 h-5 text-[#b08344]" />
                <h2 className="font-playfair text-2xl font-medium text-stone-900">{CATEGORY_LABELS[cat] || cat}</h2>
                <span className="text-stone-400 text-sm">({grouped[cat].length})</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {grouped[cat].map((service) => (
                  <Link
                    key={service.id}
                    href={rockal ? `/book?stylist=${rockal.id}&service=${service.id}` : `/book?service=${service.id}`}
                    className="group bg-white border border-[#e7ddcd] rounded-2xl p-5 hover:border-[#b08344]/40 hover:shadow-lg hover:shadow-stone-900/5 transition-all shadow-sm"
                  >
                    <h3 className="font-playfair font-medium text-base mb-2 text-stone-900 group-hover:text-[#8a5a2b] transition-colors leading-tight">
                      {service.name.replace(/[*+()]/g, '').trim()}
                    </h3>
                    <p className="text-stone-500 text-sm mb-4 line-clamp-2 leading-relaxed">{service.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-[#8a5a2b] font-semibold">
                          <DollarSign className="w-4 h-4" />
                          {service.base_price}
                        </span>
                        <span className="flex items-center gap-1 text-stone-400 text-sm">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDuration(service.duration)}
                        </span>
                      </div>
                      {service.deposit_required && service.deposit_amount && (
                        <span className="text-xs text-stone-400">
                          ${service.deposit_amount} deposit
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="font-playfair text-3xl font-medium mb-4 text-stone-900">Ready to Book?</h3>
          <p className="text-stone-500 mb-8 leading-relaxed">
            Choose a service above or go straight to booking — pick your date and time online, 24/7.
          </p>
          <Link
            href={rockal ? `/book?stylist=${rockal.id}` : '/book'}
            className="inline-flex items-center gap-3 px-8 py-4 bg-[#b08344] text-white rounded-full font-semibold text-lg hover:bg-[#9a6f33] shadow-sm hover:shadow-md hover:shadow-[#b08344]/20 transition-all hover:scale-[1.03]"
          >
            <Calendar className="w-6 h-6" />
            Book with Rockal
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-[#e7ddcd] bg-[#f3ede3]">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#b08344] rounded-lg flex items-center justify-center">
              <span className="text-white font-playfair font-medium text-xs">K</span>
            </div>
            <span className="font-bold text-stone-800">KeLatic Hair Lounge</span>
          </div>
          <p className="text-stone-500 text-sm mb-4">9430 Richmond Ave, Houston, TX 77063</p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <a href="tel:+17134854000" className="text-stone-600 hover:text-[#8a5a2b] transition-colors">
              (713) 485-4000
            </a>
            <Link href="/" className="text-stone-600 hover:text-[#8a5a2b] transition-colors">
              Kelatic Main Site
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
