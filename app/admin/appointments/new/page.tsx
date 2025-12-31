'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';

interface Service {
  id: string;
  name: string;
  category: string;
  base_price: number;
  duration: number;
}

interface Stylist {
  id: string;
  first_name: string;
  last_name: string;
}

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

interface TimeSlot {
  start_time: string;
  end_time: string;
  stylist_id: string;
  stylist_name: string;
  available: boolean;
}

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={<NewAppointmentLoading />}>
      <NewAppointmentContent />
    </Suspense>
  );
}

function NewAppointmentLoading() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-9 h-9 bg-white/5 rounded-lg animate-pulse" />
        <div>
          <div className="h-7 w-40 bg-white/5 rounded animate-pulse mb-1" />
          <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex-1 h-1 rounded-full bg-white/10" />
        ))}
      </div>
      <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
        <div className="h-6 w-32 bg-white/10 rounded animate-pulse mb-4" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

function NewAppointmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedClientId = searchParams.get('client');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Data
  const [services, setServices] = useState<Service[]>([]);
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch initial data
  useEffect(() => {
    fetchServices();
    fetchStylists();
    fetchClients();
  }, []);

  // Pre-select client if passed in URL
  useEffect(() => {
    if (preselectedClientId && clients.length > 0) {
      const client = clients.find(c => c.id === preselectedClientId);
      if (client) {
        setSelectedClient(client);
      }
    }
  }, [preselectedClientId, clients]);

  // Fetch availability when date/service/stylist changes
  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchAvailability();
    }
  }, [selectedDate, selectedService, selectedStylist]);

  async function fetchServices() {
    try {
      const res = await fetch('/api/services');
      const data = await res.json();
      setServices(data.services || []);
    } catch (err) {
      console.error('Failed to fetch services:', err);
    }
  }

  async function fetchStylists() {
    try {
      const res = await fetch('/api/stylists');
      const data = await res.json();
      setStylists(data.stylists || []);
    } catch (err) {
      console.error('Failed to fetch stylists:', err);
    }
  }

  async function fetchClients() {
    try {
      const res = await fetch('/api/admin/clients');
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  }

  async function fetchAvailability() {
    if (!selectedService || !selectedDate) return;

    try {
      const params = new URLSearchParams({
        service_id: selectedService.id,
        date: selectedDate,
      });
      if (selectedStylist) {
        params.set('stylist_id', selectedStylist.id);
      }

      const res = await fetch(`/api/availability?${params}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (err) {
      console.error('Failed to fetch availability:', err);
      setSlots([]);
    }
  }

  async function handleSubmit() {
    if (!selectedService || !selectedSlot) {
      setError('Please complete all required fields');
      return;
    }

    if (!isWalkIn && !selectedClient) {
      setError('Please select a client or mark as walk-in');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: selectedService.id,
          stylist_id: selectedSlot.stylist_id,
          start_time: selectedSlot.start_time,
          client_id: selectedClient?.id || null,
          is_walk_in: isWalkIn,
          walk_in_name: isWalkIn ? walkInName : null,
          notes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create appointment');
      }

      router.push('/admin/appointments');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function formatTime(isoString: string) {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  const availableSlots = slots.filter(s => s.available);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/appointments"
          className="p-2 hover:bg-white/5 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">New Appointment</h1>
          <p className="text-white/50">Book a new appointment</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full ${
              s <= step ? 'bg-amber-400' : 'bg-white/10'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Select Service */}
      {step === 1 && (
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
          <h2 className="font-semibold text-white mb-4">Select Service</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedService?.id === service.id
                    ? 'border-amber-400 bg-amber-400/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-white">{service.name}</p>
                    <p className="text-sm text-white/50">{service.duration} min</p>
                  </div>
                  <p className="font-semibold text-amber-400">
                    {formatCurrency(service.base_price * 100)}
                  </p>
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-3 mt-6">
            <Link
              href="/admin/appointments"
              className="flex-1 py-3 bg-white/5 border border-white/10 text-white text-center rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Cancel
            </Link>
            <button
              onClick={() => setStep(2)}
              disabled={!selectedService}
              className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select Stylist & Date/Time */}
      {step === 2 && (
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
          <h2 className="font-semibold text-white mb-4">Select Stylist & Time</h2>

          {/* Stylist Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/70 mb-2">
              Stylist (optional)
            </label>
            <select
              value={selectedStylist?.id || ''}
              onChange={(e) => {
                const stylist = stylists.find(s => s.id === e.target.value);
                setSelectedStylist(stylist || null);
                setSelectedSlot(null);
              }}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50"
            >
              <option value="">Any Available</option>
              {stylists.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/70 mb-2">
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedSlot(null);
              }}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50"
            />
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Available Times
              </label>
              {availableSlots.length === 0 ? (
                <p className="text-center text-white/50 py-4">
                  No available times on this date
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={`${slot.start_time}-${slot.stylist_id}-${index}`}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-3 rounded-lg text-center transition-all ${
                        selectedSlot?.start_time === slot.start_time &&
                        selectedSlot?.stylist_id === slot.stylist_id
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold'
                          : 'bg-white/5 border border-white/10 text-white hover:border-amber-400/50'
                      }`}
                    >
                      <p className="font-medium">{formatTime(slot.start_time)}</p>
                      {!selectedStylist && (
                        <p className="text-xs opacity-70">
                          {slot.stylist_name.split(' ')[0]}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(1)}
              className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!selectedSlot}
              className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Select Client */}
      {step === 3 && (
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
          <h2 className="font-semibold text-white mb-4">Select Client</h2>

          {/* Walk-in Toggle */}
          <div className="flex items-center gap-3 mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <input
              type="checkbox"
              id="walkIn"
              checked={isWalkIn}
              onChange={(e) => {
                setIsWalkIn(e.target.checked);
                if (e.target.checked) setSelectedClient(null);
              }}
              className="w-4 h-4 rounded border-white/30 bg-transparent text-amber-400 focus:ring-amber-400/50"
            />
            <label htmlFor="walkIn" className="text-white cursor-pointer">
              Walk-in (no client record)
            </label>
          </div>

          {isWalkIn ? (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Walk-in Name (optional)
              </label>
              <input
                type="text"
                value={walkInName}
                onChange={(e) => setWalkInName(e.target.value)}
                placeholder="Enter name..."
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Search Clients
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedClient?.id === client.id
                        ? 'border-amber-400 bg-amber-400/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    }`}
                  >
                    <p className="font-medium text-white">
                      {client.first_name} {client.last_name}
                    </p>
                    <p className="text-sm text-white/50">{client.email}</p>
                  </button>
                ))}
                {clients.length === 0 && (
                  <p className="text-center text-white/50 py-4">
                    No clients found.{' '}
                    <Link href="/admin/clients/new" className="text-amber-400">
                      Add one
                    </Link>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setStep(2)}
              className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={!isWalkIn && !selectedClient}
              className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review & Confirm */}
      {step === 4 && (
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
          <h2 className="font-semibold text-white mb-4">Review & Confirm</h2>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/60">Service</span>
              <span className="text-white font-medium">{selectedService?.name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/60">Stylist</span>
              <span className="text-white font-medium">{selectedSlot?.stylist_name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/60">Date & Time</span>
              <span className="text-white font-medium">
                {selectedDate && new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                at {selectedSlot && formatTime(selectedSlot.start_time)}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-white/10">
              <span className="text-white/60">Client</span>
              <span className="text-white font-medium">
                {isWalkIn
                  ? walkInName || 'Walk-in'
                  : `${selectedClient?.first_name} ${selectedClient?.last_name}`}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-white/60">Price</span>
              <span className="text-amber-400 font-bold">
                {formatCurrency((selectedService?.base_price || 0) * 100)}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/70 mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any special requests or notes..."
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(3)}
              disabled={loading}
              className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black" />
                  Creating...
                </>
              ) : (
                'Create Appointment'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
