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

// Only show locs and barber categories in public booking - Kelatic specializes in locs
const PUBLIC_CATEGORIES: ServiceCategory[] = ['locs', 'barber'];

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-playfair font-bold text-stone-900 mb-6">
        {categoryFilter ? `Select a ${CATEGORY_LABELS[categoryFilter]} Service` : 'Choose Your Perfect Service'}
      </h2>

      {/* Category Tabs - hide when filtered to single category */}
      {!categoryFilter && (
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 -mx-4 px-4">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === 'all'
                ? 'bg-amber-500 text-white shadow-lg'
                : 'bg-white text-stone-700 hover:bg-amber-50 border border-stone-200'
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
                  ? 'bg-amber-500 text-white shadow-lg'
                  : 'bg-white text-stone-700 hover:bg-amber-50 border border-stone-200'
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
            className={`w-full text-left p-6 rounded-xl border-2 transition-all hover:shadow-lg ${
              selected?.id === service.id
                ? 'border-amber-500 bg-amber-50 shadow-lg'
                : 'border-stone-200 bg-white hover:border-amber-300 hover:bg-amber-50'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-stone-900 text-lg">{service.name}</h3>
                  {service.deposit_required && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full border border-amber-200">
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
                <p className="font-bold text-2xl text-amber-600">
                  {formatCurrency(service.base_price * 100)}
                </p>
                {service.deposit_required && service.deposit_amount && (
                  <p className="text-sm text-stone-500 mt-1">
                    {formatCurrency(service.deposit_amount * 100)} deposit
                  </p>
                )}
              </div>
              </div>
            </div>

            {/* Selection indicator */}
            <div
              className={`mt-4 flex items-center justify-center py-3 rounded-lg transition-all ${
                selected?.id === service.id
                  ? 'bg-amber-500 text-white font-semibold shadow-lg'
                  : 'bg-stone-100 text-stone-600 hover:bg-amber-100'
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
        <div className="mt-8 p-6 bg-stone-50 rounded-xl border border-stone-200">
          <h3 className="text-lg font-playfair font-semibold text-stone-900 mb-4">
            Enhance Your Experience (Optional)
          </h3>
          <div className="space-y-3">
            {addonServices.map((addon) => {
              const isSelected = addons.find((a) => a.id === addon.id);
              return (
                <button
                  key={addon.id}
                  onClick={() => toggleAddon(addon)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    isSelected
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-stone-200 bg-white hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500'
                          : 'border-stone-300'
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
                  <p className="font-semibold text-amber-600">
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
        <div className="sticky bottom-4 mt-8 bg-white rounded-xl border border-amber-200 shadow-lg p-6">
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
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrency(totalPrice * 100)}
              </p>
            </div>
          </div>
          <button
            onClick={handleContinue}
            className="w-full py-4 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all shadow-lg flex items-center justify-center gap-2"
          >
            Continue to Stylist Selection
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
