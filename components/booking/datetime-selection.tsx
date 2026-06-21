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
  wednesdayOnly?: boolean;
  closedDays?: number[];
}

export function DateTimeSelection({
  serviceId,
  stylistId,
  selectedDate,
  selectedSlot,
  onSelect,
  onBack,
  wednesdayOnly = false,
  closedDays = [0],
}: DateTimeSelectionProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [date, setDate] = useState<string | null>(selectedDate);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slot, setSlot] = useState<TimeSlot | null>(selectedSlot);
  const [loadingSlots, setLoadingSlots] = useState(false);
  // Days of week (0-6) this specific stylist works. null = not yet loaded / any stylist.
  const [stylistWorkingDays, setStylistWorkingDays] = useState<number[] | null>(null);

  // When a specific stylist is selected, fetch which days of the week they work
  useEffect(() => {
    if (!stylistId) { setStylistWorkingDays(null); return; }
    fetch(`/api/availability/stylist-days?stylist_id=${stylistId}`)
      .then(r => r.json())
      .then(d => setStylistWorkingDays(d.working_days ?? null))
      .catch(() => setStylistWorkingDays(null));
  }, [stylistId]);

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

    const dayOfWeek = dateToCheck.getDay();

    // Block business closed days
    if (closedDays.includes(dayOfWeek)) return false;

    // Block days this specific stylist doesn't work
    if (stylistWorkingDays !== null && !stylistWorkingDays.includes(dayOfWeek)) return false;

    // Wednesday-only restriction for special offers
    if (wednesdayOnly && dayOfWeek !== 3) return false;

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
      <h2 className="font-playfair text-xl font-medium text-stone-900 mb-2">Pick a Date & Time</h2>
      <p className="text-stone-500 mb-6">Choose when you&apos;d like to come in</p>

      {/* Wednesday-only notice for special offers */}
      {wednesdayOnly && (
        <div className="mb-4 p-4 bg-[#f4e9d6] border border-[#e0d4c0] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#eaddc3] rounded-full flex items-center justify-center">
              <span className="text-lg">🌟</span>
            </div>
            <div>
              <p className="font-semibold text-[#8a5a2b]">Wednesday Special</p>
              <p className="text-sm text-stone-600">This special offer is only available on Wednesdays</p>
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-[#e7ddcd] shadow-sm p-4 mb-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={previousMonth}
            disabled={
              currentMonth.getMonth() === today.getMonth() &&
              currentMonth.getFullYear() === today.getFullYear()
            }
            className="p-2 hover:bg-[#f3ede3] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="font-semibold text-stone-800">{monthName}</h3>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-[#f3ede3] rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <div
              key={day}
              className={`text-center text-xs font-medium py-2 ${
                wednesdayOnly && index === 3
                  ? 'text-[#8a5a2b] font-semibold'
                  : 'text-stone-400'
              }`}
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
                    ? 'bg-[#b08344] text-white border border-[#b08344] hover:bg-[#9a6f33] font-bold'
                    : isSelectable
                    ? 'hover:bg-[#f3ede3] text-stone-700'
                    : 'text-stone-300 cursor-not-allowed'
                } ${isToday && !isSelected ? 'ring-2 ring-[#b08344] ring-inset' : ''}`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#e7ddcd] text-xs text-stone-400">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded ring-2 ring-[#b08344] ring-inset" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-[#f3ede3]" />
            <span>Closed / Unavailable</span>
          </div>
        </div>
      </div>

      {/* Time Slots */}
      {date && (
        <div>
          <h3 className="font-semibold text-stone-800 mb-3">
            Available Times for{' '}
            {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h3>

          {loadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#b08344]" />
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-xl border border-[#e7ddcd] shadow-sm">
              <p className="text-stone-500">No available times on this date</p>
              <p className="text-sm text-stone-400 mt-1">Try selecting a different day</p>
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
                        ? 'bg-[#b08344] text-white border border-[#b08344] hover:bg-[#9a6f33] font-bold'
                        : 'bg-white border border-[#e0d4c0] text-stone-700 hover:border-[#b08344]/50'
                    }`}
                  >
                    <p className="font-medium">{formatTime(s.start_time)}</p>
                    {!stylistId && (
                      <p className={`text-xs mt-0.5 ${isSelected ? 'text-white/70' : 'text-stone-500'}`}>
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
          className="flex-1 py-3 bg-white border border-[#e0d4c0] text-stone-700 rounded-full font-semibold hover:border-[#b08344]/50 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!date || !slot}
          className={`flex-1 py-3 rounded-full font-bold transition-all ${
            date && slot
              ? 'bg-[#b08344] text-white hover:bg-[#9a6f33] shadow-sm hover:shadow-md hover:shadow-[#b08344]/20'
              : 'bg-[#f3ede3] text-stone-400 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
