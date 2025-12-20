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
      <h2 className="text-xl font-bold text-gray-900 mb-2">Pick a Date & Time</h2>
      <p className="text-gray-500 mb-6">Choose when you&apos;d like to come in</p>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={previousMonth}
            disabled={
              currentMonth.getMonth() === today.getMonth() &&
              currentMonth.getFullYear() === today.getFullYear()
            }
            className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h3 className="font-semibold text-gray-900">{monthName}</h3>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-gray-500 py-2"
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
                className={`p-2 text-center rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-purple-600 text-white'
                    : isSelectable
                    ? 'hover:bg-purple-100 text-gray-900'
                    : 'text-gray-300 cursor-not-allowed'
                } ${isToday && !isSelected ? 'ring-2 ring-purple-600 ring-inset' : ''}`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded ring-2 ring-purple-600 ring-inset" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gray-200" />
            <span>Closed / Unavailable</span>
          </div>
        </div>
      </div>

      {/* Time Slots */}
      {date && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            Available Times for{' '}
            {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </h3>

          {loadingSlots ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
            </div>
          ) : availableSlots.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-gray-500">No available times on this date</p>
              <p className="text-sm text-gray-400 mt-1">Try selecting a different day</p>
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
                    className={`py-3 px-2 rounded-lg text-center transition-colors ${
                      isSelected
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900 hover:border-purple-300'
                    }`}
                  >
                    <p className="font-medium">{formatTime(s.start_time)}</p>
                    {!stylistId && (
                      <p className={`text-xs mt-0.5 ${isSelected ? 'text-purple-200' : 'text-gray-500'}`}>
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
          className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!date || !slot}
          className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
            date && slot
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
