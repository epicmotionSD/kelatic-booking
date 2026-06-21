'use client';

import { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '@/lib/currency';
import type { Service, Profile, ServiceCategory } from '@/types/database';
import { Clock, Users, Sparkles, Crown, Star, ChevronDown, ChevronRight, Scissors, CalendarDays } from 'lucide-react';

// Curated popular service IDs – shown in the "Popular Services" section
const POPULAR_SERVICE_IDS = [
  '3c4386c5-96c4-451e-9b30-177cb43ef060', // +Detox Locs ($150)
  'f5f0a325-e5e0-4677-a93e-fd39d65712c4', // +(3+ Months Overdue Retwist) ($175)
  'e7e8b9e6-9054-44a5-a364-f6f417149911', // Short Hair Two Strand ($150)
  '3917add9-46bd-4153-bd1b-33d7d94c4e86', // Long Hair Two Strands ($200)
];

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
    color: 'text-[#5b7a52]',
    bgColor: 'bg-[#eef3ea] border-[#cdddc4]',
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
    color: 'text-[#8a5a2b]',
    bgColor: 'bg-[#f4e9d6] border-[#e0d4c0]',
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
    color: 'text-[#b08344]',
    bgColor: 'bg-[#efe1cc] border-[#e3cda8]',
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
  onWednesdaySpecial?: () => void;
  viewMode?: 'services' | 'stylist';
  onViewModeChange?: (mode: 'services' | 'stylist') => void;
  categoryFilter?: ServiceCategory; // Only show services from this category
  selectedStylistId?: string | null; // When set, filter services to only this stylist's
}

export function PriceTierSelection({
  onSelectTier,
  onSelectStylist,
  onWednesdaySpecial,
  viewMode: controlledViewMode,
  onViewModeChange,
  categoryFilter,
  selectedStylistId,
}: PriceTierSelectionProps) {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [stylistServices, setStylistServices] = useState<Service[] | null>(null);
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

  // When a stylist is selected, fetch their specific services
  useEffect(() => {
    if (selectedStylistId && selectedStylistId !== 'any') {
      fetchStylistServices(selectedStylistId);
    } else {
      setStylistServices(null);
    }
  }, [selectedStylistId]);

  async function fetchStylistServices(stylistId: string) {
    try {
      const res = await fetch(`/api/stylists/${stylistId}/services`);
      if (res.ok) {
        const data = await res.json();
        setStylistServices(data.services || []);
      }
    } catch (error) {
      console.error('Failed to fetch stylist services:', error);
    }
  }

  // Use stylist-specific services when a stylist is selected, otherwise all services
  const services = stylistServices ?? allServices;

  async function fetchData() {
    try {
      const [servicesRes, stylistsRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/stylists'),
      ]);

      if (servicesRes.ok) {
        const data = await servicesRes.json();
        setAllServices(data.services || []);
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

    // If a category filter is applied, only include services from that category
    const filteredServices = categoryFilter
      ? services.filter((s) => s.category === categoryFilter)
      : services;

    filteredServices.forEach((service) => {
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
  }, [services, categoryFilter]);

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b08344]" />
      </div>
    );
  }

  // Get selected stylist's name for display
  const selectedStylist = selectedStylistId
    ? stylists.find((s) => s.id === selectedStylistId)
    : null;

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="font-playfair text-2xl md:text-3xl font-medium text-stone-900 mb-2">
          {selectedStylist
            ? `Book with ${selectedStylist.first_name}`
            : categoryFilter && CATEGORY_CONFIG[categoryFilter]
            ? `Book ${CATEGORY_CONFIG[categoryFilter].name}`
            : 'Book Your Appointment'}
        </h2>
        <p className="text-stone-600 mb-6">
          {selectedStylist
            ? `Showing ${selectedStylist.first_name}'s available services`
            : categoryFilter && CATEGORY_CONFIG[categoryFilter]
            ? CATEGORY_CONFIG[categoryFilter].description
            : "Choose how you'd like to start your booking"}
        </p>
      </div>

      {/* Quick Booking Options */}
      <div className="mb-8 p-6 bg-white border border-[#e7ddcd] shadow-sm rounded-2xl">
        <h3 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#b08344]" />
          Popular Services
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Wednesday Special Card */}
          {!categoryFilter && onWednesdaySpecial && (
            <button
              onClick={onWednesdaySpecial}
              className="text-left p-4 bg-gradient-to-br from-[#f7edda] to-[#f1e2c6] border border-[#e3cda8] rounded-xl hover:border-[#b08344]/60 hover:from-[#f4e6cf] hover:to-[#eedab5] transition-all relative overflow-hidden"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-stone-800 text-sm flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-[#b08344]" />
                    Wednesday Special
                    <span className="text-[10px] font-bold bg-[#b08344] text-white px-2 py-0.5 rounded-full">SPECIAL</span>
                  </h4>
                  <p className="text-xs text-stone-500">Shampoo &amp; Retwist &bull; Wed Only</p>
                </div>
                <span className="text-[#8a5a2b] font-bold">$75</span>
              </div>
            </button>
          )}

          {/* Curated Popular Services */}
          {services
            .filter(s => POPULAR_SERVICE_IDS.includes(s.id))
            .sort((a, b) => POPULAR_SERVICE_IDS.indexOf(a.id) - POPULAR_SERVICE_IDS.indexOf(b.id))
            .map((service) => (
              <button
                key={service.id}
                onClick={() => handleServiceSelect(service)}
                className="text-left p-4 bg-white border border-[#e7ddcd] rounded-xl hover:border-[#b08344]/40 hover:bg-[#f3ede3] transition-all"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-stone-800 text-sm">{service.name}</h4>
                    <p className="text-xs text-stone-500">{service.duration} min</p>
                  </div>
                  <span className="text-[#8a5a2b] font-bold">{formatCurrency(service.base_price * 100)}</span>
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
              ? 'bg-[#b08344] text-white shadow-sm hover:bg-[#9a6f33]'
              : 'bg-white text-stone-600 hover:bg-[#f3ede3] border border-[#e7ddcd]'
          }`}
        >
          <Scissors className="w-5 h-5 inline-block mr-2" />
          Browse Services
        </button>
        <button
          onClick={() => setViewMode('stylist')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
            viewMode === 'stylist'
              ? 'bg-[#b08344] text-white shadow-sm hover:bg-[#9a6f33]'
              : 'bg-white text-stone-600 hover:bg-[#f3ede3] border border-[#e7ddcd]'
          }`}
        >
          <Users className="w-5 h-5 inline-block mr-2" />
          Choose Stylist First
        </button>
      </div>

      {viewMode === 'services' ? (
        /* Category → Price Tier → Service Selection */
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-stone-800 mb-4">Browse by Service Category</h3>

          {servicesByCategory.map(({ category, config, tiers, totalCount }) => (
            <div key={category} className="border border-[#e7ddcd] rounded-xl overflow-hidden bg-white shadow-sm">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full text-left p-4 hover:bg-[#f3ede3] transition-colors flex items-center gap-4"
              >
                <span className="text-2xl">{config.icon}</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-stone-800">{config.name}</h4>
                  <p className="text-sm text-stone-500">{config.description}</p>
                </div>
                <span className="text-sm text-stone-400 mr-2">{totalCount} services</span>
                {expandedCategory === category ? (
                  <ChevronDown className="w-5 h-5 text-[#b08344]" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-stone-400" />
                )}
              </button>

              {/* Expanded Category - Show Tiers */}
              {expandedCategory === category && (
                <div className="border-t border-[#e7ddcd] bg-[#faf7f2] p-4 space-y-3">
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
                            <span className="text-stone-500 text-sm ml-2">({tier.priceRange})</span>
                          </div>
                          <span className="text-xs text-stone-500">{tierServices.length} options</span>
                          {expandedTier === tierKey ? (
                            <ChevronDown className={`w-4 h-4 ${tier.color}`} />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-stone-400" />
                          )}
                        </button>

                        {/* Expanded Tier - Show Services */}
                        {expandedTier === tierKey && (
                          <div className="border-t border-[#e0d4c0] p-2 space-y-2">
                            {tierServices
                              .sort((a, b) => a.base_price - b.base_price)
                              .map((service) => (
                                <button
                                  key={service.id}
                                  onClick={() => handleServiceSelect(service)}
                                  className="w-full text-left p-3 bg-white rounded-lg hover:bg-[#f3ede3] transition-all border border-[#e7ddcd] hover:border-[#b08344]/40"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h5 className="font-medium text-stone-800">{service.name}</h5>
                                      <p className="text-xs text-stone-500 mt-1">
                                        {service.duration} min
                                        {service.description && ` • ${service.description.slice(0, 50)}${service.description.length > 50 ? '...' : ''}`}
                                      </p>
                                    </div>
                                    <span className="font-bold text-[#8a5a2b] ml-4">
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
          <h3 className="text-lg font-semibold text-stone-800 mb-4">Select Your Stylist</h3>
          {stylists.map((stylist) => (
            <button
              key={stylist.id}
              onClick={() => {
                onSelectStylist(stylist);
                setViewMode('services');
              }}
              className="w-full text-left p-4 rounded-xl border border-[#e7ddcd] bg-white shadow-sm hover:border-[#b08344]/40 hover:bg-[#f3ede3] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f4e9d6] to-transparent flex items-center justify-center border border-[#e7ddcd]">
                  <span className="font-playfair text-2xl font-medium text-[#8a5a2b]">
                    {stylist.first_name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-stone-800 text-lg">
                    {stylist.first_name} {stylist.last_name}
                  </h4>
                  {stylist.specialties && stylist.specialties.length > 0 && (
                    <p className="text-[#8a5a2b] text-sm">
                      {stylist.specialties.slice(0, 3).join(' • ')}
                    </p>
                  )}
                  {stylist.bio && (
                    <p className="text-stone-500 text-sm mt-1 line-clamp-1">{stylist.bio}</p>
                  )}
                </div>
                <div className="text-[#b08344]">
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
            className="w-full text-left p-4 rounded-xl border border-dashed border-[#b08344]/50 bg-[#f4e9d6] hover:border-[#b08344] hover:bg-[#efe1cc] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f4e9d6] to-transparent flex items-center justify-center border border-[#e3cda8]">
                <Users className="w-8 h-8 text-[#b08344]" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-stone-800 text-lg">Any Available Stylist</h4>
                <p className="text-stone-500 text-sm">First available appointment</p>
              </div>
              <div className="text-[#b08344]">
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
