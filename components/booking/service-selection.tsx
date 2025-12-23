'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/currency';
import type { Service, ServiceCategory } from '@/types/database';

interface ServiceSelectionProps {
  selectedService: Service | null;
  selectedAddons: Service[];
  onSelect: (service: Service, addons: Service[]) => void;
}

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  locs: 'Locs',
  braids: 'Braids',
  natural: 'Natural Hair',
  silk_press: 'Silk Press',
  color: 'Color',
  treatments: 'Treatments',
  other: 'Other',
};

const CATEGORY_ORDER: ServiceCategory[] = [
  'locs',
  'braids',
  'natural',
  'silk_press',
  'color',
  'treatments',
  'other',
];

export function ServiceSelection({
  selectedService,
  selectedAddons,
  onSelect,
}: ServiceSelectionProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'all'>('all');
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

  // Group services by category
  const servicesByCategory = services.reduce((acc, service) => {
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
      ? services
      : services.filter((s) => s.category === activeCategory);

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-6">Select a Service</h2>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 -mx-4 px-4">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            activeCategory === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Services
        </button>
        {availableCategories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === category
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      {/* Service List */}
      <div className="space-y-3">
        {filteredServices.map((service) => (
          <button
            key={service.id}
            onClick={() => handleServiceSelect(service)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              selected?.id === service.id
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-200 bg-white hover:border-purple-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  {service.deposit_required && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                      Deposit Required
                    </span>
                  )}
                </div>
                {service.description && (
                  <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {service.duration} minutes
                </p>
              </div>
              <div className="text-right ml-4">
                <p className="font-bold text-gray-900">
                  {formatCurrency(service.base_price * 100)}
                </p>
                {service.deposit_required && service.deposit_amount && (
                  <p className="text-xs text-gray-500">
                    {formatCurrency(service.deposit_amount * 100)} deposit
                  </p>
                )}
              </div>
            </div>

            {/* Selection indicator */}
            <div
              className={`mt-3 flex items-center justify-center py-2 rounded-lg transition-colors ${
                selected?.id === service.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600'
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
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
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-purple-600 bg-purple-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">{addon.name}</p>
                      <p className="text-sm text-gray-500">+{addon.duration} min</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">
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
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-medium text-gray-900">{selected.name}</p>
                {addons.length > 0 && (
                  <p className="text-sm text-gray-500">
                    + {addons.map((a) => a.name).join(', ')}
                  </p>
                )}
                <p className="text-sm text-gray-500">{totalDuration} minutes</p>
              </div>
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(totalPrice * 100)}
              </p>
            </div>
            <button
              onClick={handleContinue}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors"
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
