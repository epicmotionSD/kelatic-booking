'use client';

import { useState, useEffect } from 'react';
import { Users, Calendar, Star, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-playfair font-bold text-stone-900 mb-2">Choose Your Preferred Stylist</h2>
      <p className="text-stone-600 mb-8">Select your favorite stylist or let us find the next available expert</p>

      {/* Any Available Option */}
      <button
        onClick={handleAnyAvailable}
        className={`w-full text-left p-6 rounded-xl border-2 transition-all mb-6 hover:shadow-lg ${
          selectAny
            ? 'border-amber-500 bg-amber-50 shadow-lg'
            : 'border-stone-200 bg-white hover:border-amber-300 hover:bg-amber-50'
        }`}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-stone-900 text-lg">Any Available Stylist</h3>
            <p className="text-stone-600 mt-1">
              Get the next available expert for faster booking
            </p>
            <p className="text-amber-600 font-medium text-sm mt-2">✨ Recommended for quicker appointments</p>
          </div>
          <div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              selectAny
                ? 'border-amber-500 bg-amber-500'
                : 'border-stone-300'
            }`}
          >
            {selectAny && (
              <ArrowRight className="w-4 h-4 text-stone-900" />
            )}
          </div>
        </div>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-white/10" />
        <span className="text-sm text-stone-900/40">or choose a stylist</span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Stylists List */}
      <div className="space-y-3">
        {stylists.map((stylist) => (
          <button
            key={stylist.id}
            onClick={() => handleStylistSelect(stylist)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              selected?.id === stylist.id
                ? 'border-amber-500 bg-amber-50'
                : 'border-stone-200 bg-white hover:border-amber-300'
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
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400/20 to-transparent border border-stone-200 flex items-center justify-center">
                    <span className="text-xl font-bold text-stone-900/80">
                      {stylist.first_name[0]}
                      {stylist.last_name[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="font-semibold text-stone-900">
                  {stylist.first_name} {stylist.last_name}
                </h3>
                {stylist.specialties && stylist.specialties.length > 0 && (
                  <p className="text-sm text-amber-600">
                    {stylist.specialties.slice(0, 3).join(' • ')}
                  </p>
                )}
                {stylist.bio && (
                  <p className="text-sm text-stone-900/50 mt-1 line-clamp-2">
                    {stylist.bio}
                  </p>
                )}
                {stylist.instagram_handle && (
                  <p className="text-sm text-amber-600/70 mt-1">
                    @{stylist.instagram_handle}
                  </p>
                )}
              </div>

              {/* Selection indicator */}
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selected?.id === stylist.id
                    ? 'border-amber-500 bg-amber-400'
                    : 'border-white/30'
                }`}
              >
                {selected?.id === stylist.id && (
                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {stylists.length === 0 && (
        <div className="text-center py-8 bg-white rounded-xl border border-stone-200">
          <p className="text-stone-900/50">No stylists available for this service</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="flex-1 py-3 bg-white border border-stone-200 text-stone-900 rounded-xl font-semibold hover:bg-white/10 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!selected && !selectAny}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${
            selected || selectAny
              ? 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/30'
              : 'bg-white/10 text-stone-900/30 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
