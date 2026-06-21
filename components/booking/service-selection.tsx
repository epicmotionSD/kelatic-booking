'use client';

import { useState, useEffect } from 'react';
import { Clock, Check, Plus, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import type { Service, ServiceCategory } from '@/types/database';

interface ServiceSelectionProps {
  selectedService: Service | null;
  selectedAddons: Service[];
  onSelect: (service: Service, addons: Service[]) => void;
  categoryFilter?: ServiceCategory; // Filter to only show services from this category
}

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  locs: 'Loc Services',
  braids: 'Braids',
  natural: 'Natural Hair',
  silk_press: 'Silk Press',
  color: 'Color',
  treatments: 'Treatments',
  barber: 'Barber',
  other: 'Other',
};

// Category display order
const CATEGORY_ORDER: ServiceCategory[] = ['locs', 'barber', 'braids', 'natural', 'silk_press', 'color', 'treatments', 'other'];

// Categories shown in public booking
const PUBLIC_CATEGORIES: ServiceCategory[] = ['locs', 'barber', 'braids'];

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

  // Filter to only public categories (locs & barber) - Kelatic specializes in locs
  // If specific category filter is set, use that; otherwise show all public categories
  const baseServices = categoryFilter
    ? services.filter((s) => s.category === categoryFilter)
    : services.filter((s) => PUBLIC_CATEGORIES.includes(s.category));

  // Group services by category
  const servicesByCategory = baseServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<ServiceCategory, Service[]>);

  // Get categories that have services - only show public categories (locs & barber)
  const availableCategories = CATEGORY_ORDER.filter(
    (cat) => PUBLIC_CATEGORIES.includes(cat) && servicesByCategory[cat]?.length > 0
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#b08344]" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-playfair font-medium text-stone-900 mb-6">
        {categoryFilter ? `Select a ${CATEGORY_LABELS[categoryFilter]} Service` : 'Choose Your Perfect Service'}
      </h2>

      {/* Category Tabs - hide when filtered to single category */}
      {!categoryFilter && (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 -mx-4 px-4">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-[#b08344] text-white shadow-sm'
                : 'bg-white text-stone-700 hover:border-[#b08344]/40 border border-[#e7ddcd]'
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
                  ? 'bg-[#b08344] text-white shadow-sm'
                  : 'bg-white text-stone-700 hover:border-[#b08344]/40 border border-[#e7ddcd]'
              }`}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
      )}

      {/* Service List */}
      <div className="grid gap-4">
        {filteredServices.map((service) => (
          <button
            key={service.id}
            onClick={() => handleServiceSelect(service)}
            className={`w-full text-left p-6 rounded-xl border-2 transition-all hover:shadow-sm ${
              selected?.id === service.id
                ? 'border-[#b08344] bg-[#f4e9d6] shadow-sm'
                : 'border-[#e7ddcd] bg-white hover:border-[#b08344]/40'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-stone-900 text-lg">{service.name}</h3>
                  {service.deposit_required && (
                    <span className="px-2 py-1 bg-[#f4e9d6] text-[#8a5a2b] text-xs rounded-full border border-[#e0d4c0]">
                      Deposit Required
                    </span>
                  )}
                </div>
                {service.description && (
                  <p className="text-stone-600 mt-1 mb-3 leading-relaxed">{service.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-stone-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {service.duration} minutes
                  </span>
                </div>
              </div>
              <div className="text-right ml-6">
                <p className="font-playfair font-medium text-2xl text-[#8a5a2b]">
                  {formatCurrency(service.base_price * 100)}
                </p>
                {service.deposit_required && service.deposit_amount && (
                  <p className="text-sm text-stone-500 mt-1">
                    {formatCurrency(service.deposit_amount * 100)} deposit
                  </p>
                )}
              </div>
            </div>

            {/* Selection indicator */}
            <div
              className={`mt-4 flex items-center justify-center py-3 rounded-lg transition-all ${
                selected?.id === service.id
                  ? 'bg-[#b08344] text-white font-semibold shadow-sm'
                  : 'bg-[#f3ede3] text-stone-600 hover:bg-[#f4e9d6]'
              }`}
            >
              {selected?.id === service.id ? (
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Selected
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Choose This Service
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Add-ons Section */}
      {showAddons && selected && addonServices.length > 0 && (
        <div className="mt-8 p-6 bg-[#f3ede3] rounded-xl border border-[#e7ddcd]">
          <h3 className="text-lg font-playfair font-medium text-stone-900 mb-4">
            Enhance Your Experience (Optional)
          </h3>
          <div className="space-y-3">
            {addonServices.map((addon) => {
              const isSelected = addons.find((a) => a.id === addon.id);
              return (
                <button
                  key={addon.id}
                  onClick={() => toggleAddon(addon)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-sm ${
                    isSelected
                      ? 'border-[#b08344] bg-[#f4e9d6]'
                      : 'border-[#e7ddcd] bg-white hover:border-[#b08344]/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-[#b08344] bg-[#b08344]'
                          : 'border-[#e0d4c0]'
                      }`}
                    >
                      {isSelected && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-stone-900">{addon.name}</p>
                      <p className="text-sm text-stone-600 flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        +{addon.duration} min
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold text-[#8a5a2b]">
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
        <div className="sticky bottom-4 mt-8 bg-white rounded-xl border border-[#e0d4c0] shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="font-semibold text-stone-900 text-lg">{selected.name}</p>
              {addons.length > 0 && (
                <p className="text-stone-600 mt-1">
                  + {addons.map((a) => a.name).join(', ')}
                </p>
              )}
              <div className="flex items-center gap-1 text-stone-500 mt-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{totalDuration} minutes total</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-playfair font-medium text-[#8a5a2b]">
                {formatCurrency(totalPrice * 100)}
              </p>
            </div>
          </div>
          <button
            onClick={handleContinue}
            className="w-full py-4 bg-[#b08344] text-white rounded-full font-semibold hover:bg-[#9a6f33] transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            Continue to Stylist Selection
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
