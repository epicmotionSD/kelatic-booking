'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/currency';
import type { Service, ServiceCategory } from '@/types/database';

interface ServiceSelectionProps {
  selectedService: Service | null;
  selectedAddons: Service[];
  onSelect: (service: Service, addons: Service[]) => void;
  categoryFilter?: ServiceCategory; // Filter to only show services from this category
}

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

const CATEGORY_ORDER: ServiceCategory[] = [
  'locs',
  'braids',
  'natural',
  'silk_press',
  'color',
  'treatments',
  'barber',
  'other',
];

export function ServiceSelection({
  selectedService,
  selectedAddons,
  onSelect,
  categoryFilter,
}: ServiceSelectionProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'all'>(categoryFilter || 'all');
  const [selected, setSelected] = useState<Service | null>(selectedService);
  const [addons, setAddons] = useState<Service[]>(selectedAddons);
  const [showAddons, setShowAddons] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      setServices(data.services || []);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  }

  // If category filter is set, filter base services first
  const baseServices = categoryFilter
    ? services.filter((s) => s.category === categoryFilter)
    : services;

  // Group services by category
  const servicesByCategory = baseServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<ServiceCategory, Service[]>);

  // Get categories that have services
  const availableCategories = CATEGORY_ORDER.filter(
    (cat) => servicesByCategory[cat]?.length > 0
  );

  // Filter services by active category
  const filteredServices =
    activeCategory === 'all'
      ? baseServices
      : baseServices.filter((s) => s.category === activeCategory);

  // Add-on services (treatments)
  const addonServices = services.filter(
    (s) => s.category === 'treatments' && s.id !== selected?.id
  );

  function handleServiceSelect(service: Service) {
    setSelected(service);
    setAddons([]);
    setShowAddons(true);
  }

  function toggleAddon(addon: Service) {
    setAddons((prev) =>
      prev.find((a) => a.id === addon.id)
        ? prev.filter((a) => a.id !== addon.id)
        : [...prev, addon]
    );
  }

  function handleContinue() {
    if (selected) {
      onSelect(selected, addons);
    }
  }

  const totalPrice =
    (selected?.base_price || 0) +
    addons.reduce((sum, addon) => sum + addon.base_price, 0);

  const totalDuration =
    (selected?.duration || 0) +
    addons.reduce((sum, addon) => sum + addon.duration, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">
        {categoryFilter ? `Select a ${CATEGORY_LABELS[categoryFilter]} Service` : 'Select a Service'}
      </h2>

      {/* Category Tabs - hide when filtered to single category */}
      {!categoryFilter && (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 -mx-4 px-4">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
            }`}
          >
            All Services
          </button>
          {availableCategories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeCategory === category
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
              }`}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
      )}

      {/* Service List */}
      <div className="space-y-3">
        {filteredServices.map((service) => (
          <button
            key={service.id}
            onClick={() => handleServiceSelect(service)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              selected?.id === service.id
                ? 'border-amber-400 bg-amber-400/10'
                : 'border-white/10 bg-white/5 hover:border-amber-400/50 hover:bg-white/10'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-white">{service.name}</h3>
                  {service.deposit_required && (
                    <span className="px-2 py-0.5 bg-amber-400/20 text-amber-400 text-xs rounded-full border border-amber-400/30">
                      Deposit Required
                    </span>
                  )}
                </div>
                {service.description && (
                  <p className="text-sm text-white/50 mt-1">{service.description}</p>
                )}
                <p className="text-sm text-white/40 mt-2">
                  {service.duration} minutes
                </p>
              </div>
              <div className="text-right ml-4">
                <p className="font-bold text-amber-400">
                  {formatCurrency(service.base_price * 100)}
                </p>
                {service.deposit_required && service.deposit_amount && (
                  <p className="text-xs text-white/40">
                    {formatCurrency(service.deposit_amount * 100)} deposit
                  </p>
                )}
              </div>
            </div>

            {/* Selection indicator */}
            <div
              className={`mt-3 flex items-center justify-center py-2 rounded-lg transition-all ${
                selected?.id === service.id
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-semibold'
                  : 'bg-white/5 text-white/60'
              }`}
            >
              {selected?.id === service.id ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Selected
                </span>
              ) : (
                'Select'
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Add-ons Section */}
      {showAddons && selected && addonServices.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-white mb-4">
            Add a Treatment (Optional)
          </h3>
          <div className="space-y-2">
            {addonServices.map((addon) => {
              const isSelected = addons.find((a) => a.id === addon.id);
              return (
                <button
                  key={addon.id}
                  onClick={() => toggleAddon(addon)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-amber-400 bg-amber-400/10'
                      : 'border-white/10 bg-white/5 hover:border-amber-400/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400'
                          : 'border-white/30'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-white">{addon.name}</p>
                      <p className="text-sm text-white/50">+{addon.duration} min</p>
                    </div>
                  </div>
                  <p className="font-semibold text-amber-400">
                    +{formatCurrency(addon.base_price * 100)}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary & Continue */}
      {selected && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 p-4 shadow-lg">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-white">{selected.name}</p>
                {addons.length > 0 && (
                  <p className="text-sm text-white/50">
                    + {addons.map((a) => a.name).join(', ')}
                  </p>
                )}
                <p className="text-sm text-white/40">{totalDuration} minutes</p>
              </div>
              <p className="text-xl font-bold text-amber-400">
                {formatCurrency(totalPrice * 100)}
              </p>
            </div>
            <button
              onClick={handleContinue}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Spacer for fixed bottom bar */}
      {selected && <div className="h-32" />}
    </div>
  );
}
