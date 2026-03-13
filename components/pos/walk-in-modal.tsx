'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/currency';

interface Service {
  id: string;
  name: string;
  base_price: number;
  duration: number;
  category: string;
}

interface Stylist {
  id: string;
  first_name: string;
  last_name: string;
}

interface WalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (appointmentId: string) => void;
  prefill?: {
    name?: string;
    phone?: string;
    email?: string;
  } | null;
}

export function WalkInModal({ isOpen, onClose, onComplete, prefill }: WalkInModalProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [allStylists, setAllStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInEmail, setWalkInEmail] = useState('');
  const [walkInNote, setWalkInNote] = useState('');
  const [pricingMode, setPricingMode] = useState<'service' | 'custom'>('service');
  const [customAmount, setCustomAmount] = useState('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedStylist, setSelectedStylist] = useState<string>('');
  const [serviceSearch, setServiceSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchData();
      // Reset or prefill form
      setWalkInName(prefill?.name || '');
      setWalkInPhone(prefill?.phone || '');
      setWalkInEmail(prefill?.email || '');
      setWalkInNote('');
      setPricingMode('service');
      setCustomAmount('');
      setSelectedService('');
      setSelectedStylist('');
      setServiceSearch('');
      setError(null);
    }
  }, [isOpen, prefill]);

  // When service changes, fetch stylists who can perform that service
  useEffect(() => {
    if (pricingMode === 'custom') {
      setStylists(allStylists);
      return;
    }

    if (selectedService) {
      fetchStylistsForService(selectedService);
    } else {
      setStylists(allStylists);
    }
    // Clear stylist selection when service changes
    setSelectedStylist('');
  }, [selectedService, allStylists, pricingMode]);

  async function fetchStylistsForService(serviceId: string) {
    try {
      const res = await fetch(`/api/stylists?serviceId=${serviceId}`);
      const data = await res.json();
      setStylists(data.stylists || []);
    } catch (err) {
      console.error('Failed to fetch stylists for service:', err);
      setStylists(allStylists);
    }
  }

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [servicesRes, stylistsRes] = await Promise.all([
        fetch('/api/services'), // Use public API that works without strict auth
        fetch('/api/stylists'),
      ]);

      if (!servicesRes.ok) {
        throw new Error('Failed to load services');
      }
      if (!stylistsRes.ok) {
        throw new Error('Failed to load stylists');
      }

      const servicesData = await servicesRes.json();
      const stylistsData = await stylistsRes.json();

      console.log('Loaded services:', servicesData.services?.length || 0);
      console.log('Loaded stylists:', stylistsData.stylists?.length || 0);

      setServices(servicesData.services || []);
      setAllStylists(stylistsData.stylists || []);
      setStylists(stylistsData.stylists || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load services and stylists');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!walkInName.trim()) {
      setError('Please enter customer name');
      return;
    }

    if (!walkInPhone.trim()) {
      setError('Please enter customer phone number');
      return;
    }

    if (pricingMode === 'service' && !selectedService) {
      setError('Please select a service');
      return;
    }

    if (pricingMode === 'custom') {
      const amount = parseFloat(customAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        setError('Please enter a valid custom amount');
        return;
      }
    }

    if (!selectedStylist) {
      setError('Please select a stylist');
      return;
    }

    setSubmitting(true);

    try {
      // Create walk-in appointment
      const service = services.find(s => s.id === selectedService);
      const now = new Date();
      const endTime = new Date(now.getTime() + (service?.duration || 60) * 60000);
      const normalizedCustomAmount = parseFloat(customAmount || '0');

      const res = await fetch('/api/pos/walk-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walk_in_name: walkInName.trim(),
          walk_in_phone: walkInPhone.trim(),
          walk_in_email: walkInEmail.trim() || null,
          notes: walkInNote.trim() || null,
          service_id: pricingMode === 'service' ? selectedService : null,
          custom_amount: pricingMode === 'custom' ? normalizedCustomAmount : null,
          stylist_id: selectedStylist,
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
          quoted_price: pricingMode === 'custom' ? normalizedCustomAmount : (service?.base_price || 0),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create walk-in');
      }

      const { appointment } = await res.json();
      onComplete(appointment.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create walk-in');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedServiceData = services.find(s => s.id === selectedService);
  const filteredServices = services.filter((service) => {
    if (!serviceSearch.trim()) return true;
    const query = serviceSearch.toLowerCase();
    return (
      service.name.toLowerCase().includes(query) ||
      service.category.toLowerCase().includes(query)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">New Walk-in</h2>
          <button
            type="button"
            onClick={onClose}
            title="Close walk-in modal"
            aria-label="Close walk-in modal"
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Customer Info (Optional) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    placeholder="Customer full name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    placeholder="(555) 555-5555"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-gray-400">(marketing follow-up)</span>
                </label>
                <input
                  type="email"
                  value={walkInEmail}
                  onChange={(e) => setWalkInEmail(e.target.value)}
                  placeholder="customer@email.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={walkInNote}
                  onChange={(e) => setWalkInNote(e.target.value)}
                  placeholder="Client note for checkout/stylist"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pricing Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPricingMode('service');
                      setCustomAmount('');
                    }}
                    className={`px-3 py-2 rounded-lg border font-medium transition-colors ${
                      pricingMode === 'service'
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Select Service
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPricingMode('custom');
                      setSelectedService('');
                      setServiceSearch('');
                    }}
                    className={`px-3 py-2 rounded-lg border font-medium transition-colors ${
                      pricingMode === 'custom'
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Custom Amount
                  </button>
                </div>
              </div>

              {pricingMode === 'service' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service *
                  </label>
                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="Search services..."
                    className="w-full mb-3 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {services.length === 0 ? (
                    <p className="text-sm text-amber-600 italic py-4 text-center bg-amber-50 rounded-lg">
                      No services available. Please add services in Settings.
                    </p>
                  ) : filteredServices.length === 0 ? (
                    <p className="text-sm text-gray-500 italic py-4 text-center bg-gray-50 rounded-lg">
                      No services match your search.
                    </p>
                  ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                    {filteredServices.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setSelectedService(service.id)}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                          selectedService === service.id
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-gray-900">{service.name}</p>
                            <p className="text-sm text-gray-500">{service.duration} min</p>
                          </div>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(service.base_price * 100)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Use this for clients booked/paid deposit on your legacy system.
                  </p>
                </div>
              )}

              {/* Stylist Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stylist *
                </label>
                {pricingMode === 'service' && !selectedService ? (
                  <p className="text-sm text-gray-500 italic py-4 text-center bg-gray-50 rounded-lg">
                    Select a service first to see available stylists
                  </p>
                ) : stylists.length === 0 ? (
                  <p className="text-sm text-amber-600 italic py-4 text-center bg-amber-50 rounded-lg">
                    No stylists available for this service
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {stylists.map((stylist) => (
                      <button
                        key={stylist.id}
                        type="button"
                        onClick={() => setSelectedStylist(stylist.id)}
                        className={`px-4 py-3 rounded-lg border transition-colors ${
                          selectedStylist === stylist.id
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-gray-900">
                          {stylist.first_name} {stylist.last_name}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              {pricingMode === 'service' && selectedServiceData && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total</span>
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(selectedServiceData.base_price * 100)}
                    </span>
                  </div>
                </div>
              )}

              {pricingMode === 'custom' && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total</span>
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(Math.round((parseFloat(customAmount || '0') || 0) * 100))}
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    submitting ||
                    !selectedStylist ||
                    (pricingMode === 'service' && !selectedService) ||
                    (pricingMode === 'custom' && (!customAmount || parseFloat(customAmount) <= 0))
                  }
                  className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Continue to Checkout'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
