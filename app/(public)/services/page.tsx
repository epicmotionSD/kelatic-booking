'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';
import { InstagramGallery } from '@/components/instagram/gallery';
import { Footer } from '@/components/layout/footer';
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

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <span className="text-black font-black">K</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm">KELATIC</span>
                <span className="text-[9px] tracking-widest text-amber-400">SERVICES</span>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link 
                href="/book"
                className="px-6 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
              >
                Book Now
              </Link>
              <Link href="/" className="text-sm text-white/50 hover:text-amber-400 transition-colors">
                ← Back to site
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-black/30 to-transparent py-16">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold text-white mb-4">
            Our Services
          </h1>
          <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            Professional loc care, natural hair styling, and specialized treatments by Houston's premier locticians
          </p>
          <Link 
            href="/book"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
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
            className={`px-6 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
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
                className={`px-6 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeCategory === category
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-500/20'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400" />
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
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400/20 to-transparent rounded-xl flex items-center justify-center border border-white/10">
                      <Icon className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-playfair font-bold text-white">{CATEGORY_LABELS[category]}</h2>
                      <p className="text-white/50">{CATEGORY_DESCRIPTIONS[category]}</p>
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
                <div className="w-12 h-12 bg-gradient-to-br from-amber-400/20 to-transparent rounded-xl flex items-center justify-center border border-white/10">
                  {React.createElement(CATEGORY_ICONS[activeCategory as ServiceCategory], { className: "w-6 h-6 text-amber-400" })}
                </div>
                <div>
                  <h2 className="text-2xl font-playfair font-bold text-white">{CATEGORY_LABELS[activeCategory as ServiceCategory]}</h2>
                  <p className="text-white/50">{CATEGORY_DESCRIPTIONS[activeCategory as ServiceCategory]}</p>
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
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white/20" />
            </div>
            <h3 className="text-xl font-semibold text-white/70 mb-2">No services found</h3>
            <p className="text-white/40">Try selecting a different category</p>
          </div>
        )}
      </main>

      {/* Instagram Portfolio Gallery */}
      <section className="bg-black/30 border-t border-white/5 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Instagram className="w-8 h-8 text-amber-400" />
              <h2 className="text-3xl font-playfair font-bold text-white">Our Work</h2>
              <Instagram className="w-8 h-8 text-amber-400" />
            </div>
            <p className="text-xl text-white/70 mb-4">
              See the latest transformations from our talented locticians
            </p>
            <a
              href="https://instagram.com/kelatichairlounge_"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:border-amber-400/50 hover:bg-white/10 transition-all"
            >
              <Instagram className="w-5 h-5" />
              View More on Instagram
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-amber-400/10 to-yellow-500/10 border-t border-white/10 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-playfair font-bold text-white mb-4">Ready to Book?</h2>
          <p className="text-xl text-white/70 mb-8">
            Experience Houston's premier loc and natural hair care
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-amber-500/30 transition-all"
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
    <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6 hover:border-amber-400/30 hover:bg-white/10 transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-white text-lg mb-1 group-hover:text-amber-400 transition-colors">
            {service.name}
          </h3>
          <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">
            {CATEGORY_LABELS[service.category]}
          </span>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-amber-400">
            {formatCurrency(service.base_price * 100)}
          </div>
          {service.deposit_required && (
            <div className="text-xs text-white/50 mt-1">
              ${service.deposit_amount} deposit
            </div>
          )}
        </div>
      </div>

      {service.description && (
        <p className="text-white/60 text-sm mb-4 line-clamp-3">
          {service.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-white/50">
          <Clock className="w-4 h-4" />
          <span>{service.duration} minutes</span>
        </div>
        
        <Link 
          href={`/book?service=${service.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400/20 to-yellow-500/20 text-amber-400 rounded-lg hover:from-amber-400 hover:to-yellow-500 hover:text-black transition-all font-medium"
        >
          <span>Book Now</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}