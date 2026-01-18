'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import type { Service, Profile, ServiceCategory } from '@/types/database';
import { Clock, Users, Sparkles, Crown, Star, ChevronDown, ChevronRight, Scissors } from 'lucide-react';

interface PriceTier {
  id: string;
  name: string;
  description: string;
  priceRange: string;
  minPrice: number;
  maxPrice: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  features: string[];
}

const PRICE_TIERS: PriceTier[] = [
  {
    id: 'essential',
    name: 'Essential',
    description: 'Quick maintenance & touch-ups',
    priceRange: 'Under $100',
    minPrice: 0,
    maxPrice: 99.99,
    icon: Sparkles,
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    features: ['Consultations', 'Quick touch-ups', 'Basic maintenance'],
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Full service treatments',
    priceRange: '$100 - $199',
    minPrice: 100,
    maxPrice: 199.99,
    icon: Star,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
    features: ['Full retwist & style', 'Loc repairs', 'Detox treatments'],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Complete transformations',
    priceRange: '$200+',
    minPrice: 200,
    maxPrice: 99999,
    icon: Crown,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
    features: ['Starter locs', 'Extensions', 'Major repairs', 'Color services'],
  },
];

// Category display names and icons
const CATEGORY_CONFIG: Record<string, { name: string; icon: string; description: string }> = {
  locs: { name: 'Locs', icon: '🔒', description: 'Retwists, maintenance & styling' },
  braids: { name: 'Braids', icon: '✨', description: 'Protective braided styles' },
  natural: { name: 'Natural Hair', icon: '🌿', description: 'Natural hair care & styling' },
  color: { name: 'Color Services', icon: '🎨', description: 'Professional color treatments' },
  treatments: { name: 'Treatments', icon: '💆', description: 'Deep conditioning & repairs' },
  barber: { name: 'Barber Services', icon: '💈', description: 'Cuts, fades & grooming' },
  other: { name: 'Other Services', icon: '⭐', description: 'Additional services' },
  silk_press: { name: 'Silk Press', icon: '✨', description: 'Silky smooth straightening' },
};

interface PriceTierSelectionProps {
  onSelectTier: (tier: PriceTier, services: Service[]) => void;
  onSelectStylist: (stylist: Profile) => void;
  viewMode?: 'services' | 'stylist';
  onViewModeChange?: (mode: 'services' | 'stylist') => void;
}

export function PriceTierSelection({
  onSelectTier,
  onSelectStylist,
  viewMode: controlledViewMode,
  onViewModeChange,
}: PriceTierSelectionProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalViewMode, setInternalViewMode] = useState<'services' | 'stylist'>('services');
  const viewMode = controlledViewMode ?? internalViewMode;
  const setViewMode = onViewModeChange ?? setInternalViewMode;
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedTier, setExpandedTier] = useState<string | null>(null);

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

  // Organize services by category → price tier
  const servicesByCategory = useMemo(() => {
    const grouped: Record<string, { 
      category: string; 
      config: typeof CATEGORY_CONFIG[string];
      tiers: Record<string, Service[]>;
      totalCount: number;
    }> = {};

    services.forEach((service) => {
      const cat = service.category || 'other';
      if (!grouped[cat]) {
        grouped[cat] = {
          category: cat,
          config: CATEGORY_CONFIG[cat] || { name: cat, icon: '📋', description: '' },
          tiers: { essential: [], standard: [], premium: [] },
          totalCount: 0,
        };
      }

      // Determine which tier this service belongs to
      const tier = PRICE_TIERS.find(
        (t) => service.base_price >= t.minPrice && service.base_price <= t.maxPrice
      );
      if (tier) {
        grouped[cat].tiers[tier.id].push(service);
        grouped[cat].totalCount++;
      }
    });

    // Sort categories by total service count (most popular first)
    return Object.values(grouped).sort((a, b) => b.totalCount - a.totalCount);
  }, [services]);

  function handleServiceSelect(service: Service) {
    const tier = PRICE_TIERS.find(
      (t) => service.base_price >= t.minPrice && service.base_price <= t.maxPrice
    );
    if (tier) {
      onSelectTier(tier, [service]);
    }
  }

  function toggleCategory(category: string) {
    setExpandedCategory(expandedCategory === category ? null : category);
    setExpandedTier(null);
  }

  function toggleTier(tierId: string) {
    setExpandedTier(expandedTier === tierId ? null : tierId);
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
      <div className="mb-8 p-6 bg-zinc-900 border border-white/10 rounded-2xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-400" />
          Popular Services
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services
            .filter(s => s.base_price >= 75 && s.base_price <= 150)
            .sort((a, b) => a.base_price - b.base_price)
            .slice(0, 4)
            .map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceSelect(service)}
                className="text-left p-4 bg-white/5 border border-white/10 rounded-xl hover:border-amber-400/50 hover:bg-amber-500/10 transition-all"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-white text-sm">{service.name}</h4>
                    <p className="text-xs text-white/50">{service.duration} min</p>
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
          onClick={() => setViewMode('services')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
            viewMode === 'services'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-zinc-900 text-white/60 hover:bg-zinc-800 border border-white/10'
          }`}
        >
          <Scissors className="w-5 h-5 inline-block mr-2" />
          Browse Services
        </button>
        <button
          onClick={() => setViewMode('stylist')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
            viewMode === 'stylist'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-500/20'
              : 'bg-zinc-900 text-white/60 hover:bg-zinc-800 border border-white/10'
          }`}
        >
          <Users className="w-5 h-5 inline-block mr-2" />
          Choose Stylist First
        </button>
      </div>

      {viewMode === 'services' ? (
        /* Category → Price Tier → Service Selection */
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Browse by Service Category</h3>
          
          {servicesByCategory.map(({ category, config, tiers, totalCount }) => (
            <div key={category} className="border border-white/10 rounded-xl overflow-hidden bg-zinc-900">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full text-left p-4 hover:bg-white/5 transition-colors flex items-center gap-4"
              >
                <span className="text-2xl">{config.icon}</span>
                <div className="flex-1">
                  <h4 className="font-bold text-white">{config.name}</h4>
                  <p className="text-sm text-white/50">{config.description}</p>
                </div>
                <span className="text-sm text-white/40 mr-2">{totalCount} services</span>
                {expandedCategory === category ? (
                  <ChevronDown className="w-5 h-5 text-amber-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-white/40" />
                )}
              </button>

              {/* Expanded Category - Show Tiers */}
              {expandedCategory === category && (
                <div className="border-t border-white/10 bg-black/30 p-4 space-y-3">
                  {PRICE_TIERS.map((tier) => {
                    const tierServices = tiers[tier.id] || [];
                    if (tierServices.length === 0) return null;

                    const Icon = tier.icon;
                    const tierKey = `${category}-${tier.id}`;

                    return (
                      <div key={tier.id} className={`rounded-lg border ${tier.bgColor} overflow-hidden`}>
                        {/* Tier Header */}
                        <button
                          onClick={() => toggleTier(tierKey)}
                          className="w-full text-left p-3 flex items-center gap-3 hover:opacity-90 transition-opacity"
                        >
                          <Icon className={`w-5 h-5 ${tier.color}`} />
                          <div className="flex-1">
                            <span className={`font-semibold ${tier.color}`}>{tier.name}</span>
                            <span className="text-white/50 text-sm ml-2">({tier.priceRange})</span>
                          </div>
                          <span className="text-xs text-white/50">{tierServices.length} options</span>
                          {expandedTier === tierKey ? (
                            <ChevronDown className={`w-4 h-4 ${tier.color}`} />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-white/40" />
                          )}
                        </button>

                        {/* Expanded Tier - Show Services */}
                        {expandedTier === tierKey && (
                          <div className="border-t border-white/10 p-2 space-y-2">
                            {tierServices
                              .sort((a, b) => a.base_price - b.base_price)
                              .map((service) => (
                                <button
                                  key={service.id}
                                  onClick={() => handleServiceSelect(service)}
                                  className="w-full text-left p-3 bg-black/40 rounded-lg hover:bg-black/60 transition-all border border-white/10 hover:border-amber-500/50"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h5 className="font-medium text-white">{service.name}</h5>
                                      <p className="text-xs text-white/50 mt-1">
                                        {service.duration} min
                                        {service.description && ` • ${service.description.slice(0, 50)}${service.description.length > 50 ? '...' : ''}`}
                                      </p>
                                    </div>
                                    <span className="font-bold text-amber-400 ml-4">
                                      {formatCurrency(service.base_price * 100)}
                                    </span>
                                  </div>
                                </button>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Stylist Selection */
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Select Your Stylist</h3>
          {stylists.map((stylist) => (
            <button
              key={stylist.id}
              onClick={() => {
                onSelectStylist(stylist);
                setViewMode('services');
              }}
              className="w-full text-left p-4 rounded-xl border border-white/10 bg-zinc-900 hover:border-amber-400/50 hover:bg-zinc-800 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/20 to-transparent flex items-center justify-center border border-white/10">
                  <span className="text-2xl font-black text-amber-400">
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
            onClick={() => {
              onSelectStylist({ id: 'any', first_name: 'Any', last_name: 'Available' } as Profile);
              setViewMode('services');
            }}
            className="w-full text-left p-4 rounded-xl border border-dashed border-amber-500/50 bg-amber-500/10 hover:border-amber-400 hover:bg-amber-500/20 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/20 to-transparent flex items-center justify-center border border-amber-500/30">
                <Users className="w-8 h-8 text-amber-400" />
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
      )}
    </div>
  );
}

// Export PRICE_TIERS for use in other components
export { PRICE_TIERS };
export type { PriceTier };
