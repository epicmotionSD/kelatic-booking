'use client';

import { useState, useEffect } from 'react';
import type { TimeSlot } from '@/types/database';

interface DateTimeSelectionProps {
  serviceId: string;
  stylistId?: string;
  selectedDate: string | null;
  selectedSlot: TimeSlot | null;
  onSelect: (date: string, slot: TimeSlot) => void;
  onBack: () => void;
}

export function DateTimeSelection({
  serviceId,
  stylistId,
  selectedDate,
  selectedSlot,
  onSelect,
  onBack,
}: DateTimeSelectionProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [date, setDate] = useState<string | null>(selectedDate);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slot, setSlot] = useState<TimeSlot | null>(selectedSlot);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Fetch availability when date changes
  useEffect(() => {
    if (date) {
      fetchAvailability(date);
    }
  }, [date, serviceId, stylistId]);

  async function fetchAvailability(selectedDate: string) {
    setLoadingSlots(true);
    setSlot(null);

    try {
      const params = new URLSearchParams({
        service_id: serviceId,
        date: selectedDate,
      });
      if (stylistId) {
        params.set('stylist_id', stylistId);
      }

      const res = await fetch(`/api/availability?${params}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  function handleContinue() {
    if (date && slot) {
      onSelect(date, slot);
    }
  }

  // Calendar helpers
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  ).getDay();

  const monthName = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  function previousMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  }

  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  }

  function isDateSelectable(day: number): boolean {
    const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    dateToCheck.setHours(0, 0, 0, 0);

    // Can't book in the past
    if (dateToCheck < today) return false;

    // Can't book more than 60 days out
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 60);
    if (dateToCheck > maxDate) return false;

    // Check day of week (salon closed Sunday and Monday)
    const dayOfWeek = dateToCheck.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 1) return false;

    return true;
  }

  function formatDateString(day: number): string {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return d.toISOString().split('T')[0];
  }

  function formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  // Group slots by stylist for "any available" mode
  const availableSlots = slots.filter((s) => s.available);

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-2">Pick a Date & Time</h2>
      <p className="text-white/50 mb-6">Choose when you&apos;d like to come in</p>

      {/* Calendar */}
      <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-4 mb-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={previousMonth}
            disabled={
              currentMonth.getMonth() === today.getMonth() &&
              currentMonth.getFullYear() === today.getFullYear()
            }
            className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="font-semibold text-white">{monthName}</h3>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-white/40 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before the 1st */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="p-2" />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateString = formatDateString(day);
            const isSelected = date === dateString;
            const isSelectable = isDateSelectable(day);
            const isToday =
              day === today.getDate() &&
              currentMonth.getMonth() === today.getMonth() &&
              currentMonth.getFullYear() === today.getFullYear();

            return (
              <button
                key={day}
                onClick={() => isSelectable && setDate(dateString)}
                disabled={!isSelectable}
                className={`p-2 text-center rounded-lg transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold'
                    : isSelectable
                    ? 'hover:bg-white/10 text-white'
                    : 'text-white/20 cursor-not-allowed'
                } ${isToday && !isSelected ? 'ring-2 ring-amber-400 ring-inset' : ''}`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10 text-xs text-white/40">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded ring-2 ring-amber-400 ring-inset" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-white/10" />
            <span>Closed / Unavailable</span>
          </div>
        </div>
      </div>

      {/* Time Slots */}
      {date && (
        <div>
          <h3 className="font-semibold text-white mb-3">
            Available Times for{' '}
            {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h3>

          {loadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-400" />
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-8 bg-white/5 rounded-xl border border-white/10">
              <p className="text-white/50">No available times on this date</p>
              <p className="text-sm text-white/30 mt-1">Try selecting a different day</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableSlots.map((s, index) => {
                const isSelected =
                  slot?.start_time === s.start_time &&
                  slot?.stylist_id === s.stylist_id;

                return (
                  <button
                    key={`${s.start_time}-${s.stylist_id}-${index}`}
                    onClick={() => setSlot(s)}
                    className={`py-3 px-2 rounded-lg text-center transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold'
                        : 'bg-white/5 border border-white/10 text-white hover:border-amber-400/50'
                    }`}
                  >
                    <p className="font-medium">{formatTime(s.start_time)}</p>
                    {!stylistId && (
                      <p className={`text-xs mt-0.5 ${isSelected ? 'text-black/60' : 'text-white/50'}`}>
                        {s.stylist_name.split(' ')[0]}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="flex-1 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!date || !slot}
          className={`flex-1 py-3 rounded-xl font-bold transition-all ${
            date && slot
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:shadow-lg hover:shadow-amber-500/30'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
