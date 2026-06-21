'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';
import { InstagramGallery } from '@/components/instagram/gallery';
import { Footer } from '@/components/layout/footer';
import { PublicAuthLinks } from '@/components/layout/public-auth-links';
import type { Service, ServiceCategory, Profile } from '@/types/database';
import { Clock, Users, Sparkles, Star, Crown, ArrowRight, Instagram } from 'lucide-react';

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  locs: 'Locs',
  braids: 'Braids', 
  natural: 'Natural Hair',
  silk_press: 'Silk Press',
  color: 'Color',
  treatments: 'Treatments',
  barber: 'Barber',
  other: 'Other',
};

const CATEGORY_DESCRIPTIONS: Record<ServiceCategory, string> = {
  locs: 'Professional loc maintenance, repairs, and starter locs',
  braids: 'Traditional and modern braiding styles',
  natural: 'Styling and care for natural hair textures',
  silk_press: 'Smooth, silky hair transformations',
  color: 'Creative color treatments and highlights',
  treatments: 'Deep conditioning and hair health treatments',
  barber: 'Precision cuts and beard grooming',
  other: 'Additional specialized services',
};

const CATEGORY_ICONS: Record<ServiceCategory, React.ElementType> = {
  locs: Crown,
  braids: Sparkles,
  natural: Star,
  silk_press: Sparkles,
  color: Star,
  treatments: Sparkles,
  barber: Star,
  other: Sparkles,
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'all'>('all');

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      setServices((data.services || []).filter((s: Service) => s.is_active));
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  }

  // Group and filter services
  const filteredServices = activeCategory === 'all' 
    ? services 
    : services.filter((s) => s.category === activeCategory);

  const categories = Object.keys(CATEGORY_LABELS) as ServiceCategory[];
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = services.filter((s) => s.category === cat).length;
    return acc;
  }, {} as Record<ServiceCategory, number>);

  const servicesByCategory = categories.reduce((acc, cat) => {
    acc[cat] = services.filter((s) => s.category === cat);
    return acc;
  }, {} as Record<ServiceCategory, Service[]>);

  // Warm salon palette — refined gold on ivory/espresso, elegant serif headings.
  const btnGold = 'bg-[#b08344] text-white hover:bg-[#9a6f33] shadow-sm hover:shadow-md hover:shadow-[#b08344]/20';

  return (
    <div className="min-h-screen bg-[#faf7f2] text-stone-800">
      {/* Header */}
      <header className="bg-[#faf7f2]/85 backdrop-blur-xl border-b border-[#e7ddcd] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#b08344] rounded-xl flex items-center justify-center shadow-sm">
                <span className="text-white font-playfair font-medium">K</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-stone-800">KELATIC</span>
                <span className="text-[9px] tracking-widest text-[#8a5a2b]">SERVICES</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <PublicAuthLinks />
              <Link
                href="/book"
                className={`px-6 py-2 rounded-full font-semibold transition-all hover:scale-[1.03] ${btnGold}`}
              >
                Book Now
              </Link>
              <Link href="/" className="text-sm text-stone-500 hover:text-[#8a5a2b] transition-colors">
                ← Back to site
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-[#faf7f2] to-[#f3ede3] py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-playfair font-medium text-stone-900 mb-4">
            Our Services
          </h1>
          <p className="text-xl text-stone-600 mb-8 max-w-2xl mx-auto">
            Professional loc care, natural hair styling, and specialized treatments by Houston's premier locticians
          </p>
          <Link
            href="/book"
            className={`inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold transition-all hover:scale-[1.03] ${btnGold}`}
          >
            Book Your Appointment
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-8">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-[#b08344] text-white shadow-sm'
                : 'bg-white text-stone-600 hover:bg-[#f3ede3] border border-[#e7ddcd]'
            }`}
          >
            All Services ({services.length})
          </button>
          {categories.filter(cat => categoryCounts[cat] > 0).map((category) => {
            const Icon = CATEGORY_ICONS[category];
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeCategory === category
                    ? 'bg-[#b08344] text-white shadow-sm'
                    : 'bg-white text-stone-600 hover:bg-[#f3ede3] border border-[#e7ddcd]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {CATEGORY_LABELS[category]} ({categoryCounts[category]})
              </button>
            );
          })}
        </div>

        {/* Services Display */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#b08344]" />
          </div>
        ) : activeCategory === 'all' ? (
          /* Show by category sections */
          <div className="space-y-12">
            {categories.filter(cat => servicesByCategory[cat].length > 0).map((category) => {
              const Icon = CATEGORY_ICONS[category];
              const categoryServices = servicesByCategory[category];
              
              return (
                <section key={category}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-[#f4e9d6] rounded-xl flex items-center justify-center border border-[#e7ddcd]">
                      <Icon className="w-6 h-6 text-[#b08344]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-playfair font-medium text-stone-900">{CATEGORY_LABELS[category]}</h2>
                      <p className="text-stone-500">{CATEGORY_DESCRIPTIONS[category]}</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryServices.map((service) => (
                      <ServiceCard key={service.id} service={service} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          /* Show filtered services */
          <div>
            {filteredServices.length > 0 && (
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-[#f4e9d6] rounded-xl flex items-center justify-center border border-[#e7ddcd]">
                  {React.createElement(CATEGORY_ICONS[activeCategory as ServiceCategory], { className: "w-6 h-6 text-[#b08344]" })}
                </div>
                <div>
                  <h2 className="text-2xl font-playfair font-medium text-stone-900">{CATEGORY_LABELS[activeCategory as ServiceCategory]}</h2>
                  <p className="text-stone-500">{CATEGORY_DESCRIPTIONS[activeCategory as ServiceCategory]}</p>
                </div>
              </div>
            )}
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          </div>
        )}

        {filteredServices.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-white border border-[#e7ddcd] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Sparkles className="w-8 h-8 text-stone-400" />
            </div>
            <h3 className="text-xl font-semibold text-stone-600 mb-2">No services found</h3>
            <p className="text-stone-400">Try selecting a different category</p>
          </div>
        )}
      </main>

      {/* Instagram Portfolio Gallery */}
      <section className="bg-[#f3ede3] border-t border-[#e7ddcd] py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Instagram className="w-8 h-8 text-[#b08344]" />
              <h2 className="text-3xl font-playfair font-medium text-stone-900">Our Work</h2>
              <Instagram className="w-8 h-8 text-[#b08344]" />
            </div>
            <p className="text-xl text-stone-600 mb-4">
              See the latest transformations from our talented locticians
            </p>
            <a
              href="https://instagram.com/kelatichairlounge_"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#8a5a2b] hover:text-[#b08344] transition-colors"
            >
              <span>@kelatichairlounge_</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          
          <InstagramGallery
            limit={12}
            category={activeCategory === 'all' ? undefined : activeCategory as string}
            className="mb-8"
          />
          
          <div className="text-center">
            <a
              href="https://instagram.com/kelatichairlounge_"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-[#e0d4c0] text-stone-700 rounded-full hover:border-[#b08344]/40 hover:text-[#8a5a2b] transition-all shadow-sm"
            >
              <Instagram className="w-5 h-5" />
              View More on Instagram
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#f3ede3] border-t border-[#e7ddcd] py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-playfair font-medium text-stone-900 mb-4">Ready to Book?</h2>
          <p className="text-xl text-stone-600 mb-8">
            Experience Houston's premier loc and natural hair care
          </p>
          <Link
            href="/book"
            className={`inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all hover:scale-[1.03] ${btnGold}`}
          >
            <Users className="w-6 h-6" />
            Book Your Appointment
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Shared Footer with AI Chatbot */}
      <Footer />
    </div>
  );
}

interface ServiceCardProps {
  service: Service;
}

function ServiceCard({ service }: ServiceCardProps) {
  return (
    <div className="bg-white border border-[#e7ddcd] shadow-sm rounded-2xl p-6 hover:border-[#b08344]/40 hover:shadow-lg hover:shadow-stone-900/5 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-playfair font-medium text-stone-900 text-lg mb-1 group-hover:text-[#8a5a2b] transition-colors">
            {service.name}
          </h3>
          <span className="text-xs font-medium text-[#8a5a2b] uppercase tracking-wide">
            {CATEGORY_LABELS[service.category]}
          </span>
        </div>
        <div className="text-right">
          <div className="font-playfair text-2xl font-medium text-[#8a5a2b]">
            {formatCurrency(service.base_price * 100)}
          </div>
          {service.deposit_required && (
            <div className="text-xs text-stone-500 mt-1">
              ${service.deposit_amount} deposit
            </div>
          )}
        </div>
      </div>

      {service.description && (
        <p className="text-stone-500 text-sm mb-4 line-clamp-3 leading-relaxed">
          {service.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-stone-500">
          <Clock className="w-4 h-4" />
          <span>{service.duration} minutes</span>
        </div>

        <Link
          href={`/book?service=${service.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#f4e9d6] text-[#8a5a2b] rounded-full hover:bg-[#b08344] hover:text-white transition-all font-medium"
        >
          <span>Book Now</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}