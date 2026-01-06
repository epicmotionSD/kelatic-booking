'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/currency';
import type { Service, Profile } from '@/types/database';
import { Clock, Users, Sparkles, Crown, Star } from 'lucide-react';

interface PriceTier {
  id: string;
  name: string;
  description: string;
  priceRange: string;
  minPrice: number;
  maxPrice: number;
  icon: React.ElementType;
  color: string;
  features: string[];
}

const PRICE_TIERS: PriceTier[] = [
  {
    id: 'essential',
    name: 'Essential',
    description: 'Quick maintenance & touch-ups',
    priceRange: '$50 - $99',
    minPrice: 50,
    maxPrice: 99,
    icon: Sparkles,
    color: 'from-emerald-400 to-teal-500',
    features: ['Retwist maintenance', 'Quick touch-ups', '60-90 min sessions'],
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Full service treatments',
    priceRange: '$100 - $199',
    minPrice: 100,
    maxPrice: 199,
    icon: Star,
    color: 'from-amber-400 to-yellow-500',
    features: ['Full retwist & style', 'Loc repairs', 'Detox treatments'],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Complete transformations',
    priceRange: '$200+',
    minPrice: 200,
    maxPrice: 9999,
    icon: Crown,
    color: 'from-purple-400 to-pink-500',
    features: ['Starter locs', 'Extensions', 'Major repairs', 'Color services'],
  },
];

interface PriceTierSelectionProps {
  onSelectTier: (tier: PriceTier, services: Service[]) => void;
  onSelectStylist: (stylist: Profile) => void;
}

export function PriceTierSelection({ onSelectTier, onSelectStylist }: PriceTierSelectionProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'price' | 'stylist'>('price');
  const [selectedTier, setSelectedTier] = useState<PriceTier | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [servicesRes, stylistsRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/stylists'),
      ]);

      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setServices(data.services || []);
      }

      if (stylistsRes.ok) {
        const data = await stylistsRes.json();
        setStylists(data.stylists || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getServicesForTier(tier: PriceTier): Service[] {
    return services.filter(
      (s) => s.base_price >= tier.minPrice && s.base_price <= tier.maxPrice
    );
  }

  function handleTierSelect(tier: PriceTier) {
    const tierServices = getServicesForTier(tier);
    onSelectTier(tier, tierServices);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Book Your Appointment</h2>
        <p className="text-white/60 mb-6">Choose how you'd like to start your booking</p>
      </div>

      {/* Quick Booking Options */}
      <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          Popular Services
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.filter(s => ['$75 Shampoo Retwist', 'Consultaton', 'Shampoo Retwist w/style'].includes(s.name)).slice(0, 4).map((service) => (
            <button
              key={service.id}
              onClick={() => {
                const tier = PRICE_TIERS.find(t => service.base_price >= t.minPrice && service.base_price <= t.maxPrice);
                if (tier) {
                  onSelectTier(tier, [service]);
                }
              }}
              className="text-left p-4 bg-white/5 border border-white/10 rounded-xl hover:border-amber-400/50 hover:bg-amber-400/5 transition-all"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-white">{service.name}</h4>
                  <p className="text-sm text-white/50">{service.duration} min</p>
                </div>
                <span className="text-amber-400 font-bold">{formatCurrency(service.base_price * 100)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setViewMode('stylist')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
            viewMode === 'stylist'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
          }`}
        >
          <Users className="w-5 h-5 inline-block mr-2" />
          Choose Stylist First
        </button>
        <button
          onClick={() => setViewMode('price')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
            viewMode === 'price'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
          }`}
        >
          <Sparkles className="w-5 h-5 inline-block mr-2" />
          Browse by Price Range
        </button>
      </div>

      {viewMode === 'stylist' ? (
        /* Stylist Selection */
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Select Your Stylist</h3>
          {stylists.map((stylist) => (
            <button
              key={stylist.id}
              onClick={() => onSelectStylist(stylist)}
              className="w-full text-left p-4 rounded-xl border-2 border-white/10 bg-white/5 hover:border-amber-400/50 hover:bg-white/10 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/20 to-transparent flex items-center justify-center border border-white/10">
                  <span className="text-2xl font-black text-white/80">
                    {stylist.first_name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-white text-lg">
                    {stylist.first_name} {stylist.last_name}
                  </h4>
                  {stylist.specialties && stylist.specialties.length > 0 && (
                    <p className="text-amber-400 text-sm">
                      {stylist.specialties.slice(0, 3).join(' • ')}
                    </p>
                  )}
                  {stylist.bio && (
                    <p className="text-white/50 text-sm mt-1 line-clamp-1">{stylist.bio}</p>
                  )}
                </div>
                <div className="text-amber-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}

          {/* Any Available Option */}
          <button
            onClick={() => onSelectStylist({ id: 'any', first_name: 'Any', last_name: 'Available' } as Profile)}
            className="w-full text-left p-4 rounded-xl border-2 border-dashed border-white/20 bg-white/5 hover:border-amber-400/50 hover:bg-white/10 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center border border-white/10">
                <Users className="w-8 h-8 text-white/50" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white text-lg">Any Available Stylist</h4>
                <p className="text-white/50 text-sm">First available appointment</p>
              </div>
              <div className="text-amber-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        </div>
      ) : (
        /* Price Tier Selection */
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Select Your Service Level</h3>
          {PRICE_TIERS.map((tier) => {
            const tierServices = getServicesForTier(tier);
            const Icon = tier.icon;

            return (
              <button
                key={tier.id}
                onClick={() => handleTierSelect(tier)}
                className="w-full text-left p-5 rounded-xl border-2 border-white/10 bg-white/5 hover:border-amber-400/50 hover:bg-white/10 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-white text-lg">{tier.name}</h4>
                      <span className="text-xl font-black text-amber-400">{tier.priceRange}</span>
                    </div>
                    <p className="text-white/60 text-sm mb-3">{tier.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {tier.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-white/5 border border-white/10 rounded-full text-xs text-white/70"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                    {tierServices.length > 0 && (
                      <p className="text-white/40 text-xs mt-3">
                        {tierServices.length} service{tierServices.length !== 1 ? 's' : ''} available
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
