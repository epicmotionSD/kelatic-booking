'use client';

import { useState, useEffect } from 'react';
import type { Profile } from '@/types/database';

interface StylistSelectionProps {
  serviceId: string;
  selectedStylist: Profile | null;
  anyAvailable: boolean;
  onSelect: (stylist: Profile | null, anyAvailable: boolean) => void;
  onBack: () => void;
}

interface StylistWithAvailability extends Profile {
  next_available?: string;
}

export function StylistSelection({
  serviceId,
  selectedStylist,
  anyAvailable,
  onSelect,
  onBack,
}: StylistSelectionProps) {
  const [stylists, setStylists] = useState<StylistWithAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Profile | null>(selectedStylist);
  const [selectAny, setSelectAny] = useState(anyAvailable);

  useEffect(() => {
    fetchStylists();
  }, [serviceId]);

  async function fetchStylists() {
    try {
      const res = await fetch(`/api/stylists?serviceId=${serviceId}`);
      const data = await res.json();
      setStylists(data.stylists || []);
    } catch (error) {
      console.error('Failed to fetch stylists:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleStylistSelect(stylist: Profile) {
    setSelected(stylist);
    setSelectAny(false);
  }

  function handleAnyAvailable() {
    setSelected(null);
    setSelectAny(true);
  }

  function handleContinue() {
    onSelect(selected, selectAny);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Choose Your Stylist</h2>
      <p className="text-gray-500 mb-6">Select a stylist or let us find the first available</p>

      {/* Any Available Option */}
      <button
        onClick={handleAnyAvailable}
        className={`w-full text-left p-4 rounded-xl border-2 transition-all mb-4 ${
          selectAny
            ? 'border-purple-600 bg-purple-50'
            : 'border-gray-200 bg-white hover:border-purple-300'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">First Available</h3>
            <p className="text-sm text-gray-500">
              We&apos;ll book you with whoever has the soonest opening
            </p>
          </div>
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              selectAny
                ? 'border-purple-600 bg-purple-600'
                : 'border-gray-300'
            }`}
          >
            {selectAny && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm text-gray-500">or choose a stylist</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Stylists List */}
      <div className="space-y-3">
        {stylists.map((stylist) => (
          <button
            key={stylist.id}
            onClick={() => handleStylistSelect(stylist)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              selected?.id === stylist.id
                ? 'border-purple-600 bg-purple-50'
                : 'border-gray-200 bg-white hover:border-purple-300'
            }`}
          >
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="relative">
                {stylist.avatar_url ? (
                  <img
                    src={stylist.avatar_url}
                    alt={stylist.first_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-xl font-semibold text-gray-500">
                      {stylist.first_name[0]}
                      {stylist.last_name[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">
                  {stylist.first_name} {stylist.last_name}
                </h3>
                {stylist.specialties && stylist.specialties.length > 0 && (
                  <p className="text-sm text-gray-500">
                    {stylist.specialties.slice(0, 3).join(' • ')}
                  </p>
                )}
                {stylist.bio && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {stylist.bio}
                  </p>
                )}
                {stylist.instagram_handle && (
                  <p className="text-sm text-purple-600 mt-1">
                    @{stylist.instagram_handle}
                  </p>
                )}
              </div>

              {/* Selection indicator */}
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selected?.id === stylist.id
                    ? 'border-purple-600 bg-purple-600'
                    : 'border-gray-300'
                }`}
              >
                {selected?.id === stylist.id && (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {stylists.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-xl">
          <p className="text-gray-500">No stylists available for this service</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!selected && !selectAny}
          className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
            selected || selectAny
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
