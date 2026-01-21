'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PublicAuthLinks } from '@/components/layout/public-auth-links';
import {
  Calendar,
  Clock,
  User,
  Scissors,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from 'lucide-react';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  service: {
    id: string;
    name: string;
    duration: number;
    base_price: number;
  };
  stylist: {
    id: string;
    first_name: string;
    last_name: string;
  };
  client: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function ReschedulePage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reschedule state
  const [step, setStep] = useState<'select' | 'confirm' | 'success'>('select');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

  useEffect(() => {
    if (selectedDate && appointment) {
      fetchAvailability();
    }
  }, [selectedDate, appointment]);

  const fetchAppointment = async () => {
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Appointment not found');
        } else {
          setError('Failed to load appointment');
        }
        return;
      }
      const data = await res.json();
      
      // Check if appointment can be rescheduled
      if (data.status === 'cancelled' || data.status === 'completed') {
        setError('This appointment cannot be rescheduled');
        return;
      }

      // Check if appointment is in the past
      if (new Date(data.start_time) < new Date()) {
        setError('Cannot reschedule past appointments');
        return;
      }

      setAppointment(data);
    } catch (err) {
      setError('Failed to load appointment');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async () => {
    if (!selectedDate || !appointment) return;

    setLoadingSlots(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const res = await fetch(
        `/api/availability?stylist_id=${appointment.stylist.id}&date=${dateStr}&duration=${appointment.service.duration}&exclude_appointment=${appointmentId}`
      );
      
      if (res.ok) {
        const data = await res.json();
        setAvailableSlots(data.slots || []);
      }
    } catch (err) {
      console.error('Failed to fetch availability:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime || !appointment) return;

    setSubmitting(true);
    try {
      const newStartTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      newStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const res = await fetch(`/api/appointments/${appointmentId}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          new_start_time: newStartTime.toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reschedule');
      }

      setStep('success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  if (error && !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">{error}</h1>
          <p className="text-gray-600 mb-6">
            Please contact us if you need assistance with your appointment.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Appointment Rescheduled!</h1>
          <p className="text-gray-600 mb-6">
            Your appointment has been successfully rescheduled. A confirmation has been sent to your email.
          </p>
          
          {selectedDate && selectedTime && (
            <div className="bg-purple-50 rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span className="text-gray-900 font-medium">{formatDate(selectedDate)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-purple-600" />
                <span className="text-gray-900 font-medium">{formatTime(selectedTime)}</span>
              </div>
            </div>
          )}

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-purple-600">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <PublicAuthLinks />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Reschedule Appointment</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Current Appointment Info */}
        {appointment && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
              Current Appointment
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Service</div>
                  <div className="font-medium text-gray-900">{appointment.service.name}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Stylist</div>
                  <div className="font-medium text-gray-900">
                    {appointment.stylist.first_name} {appointment.stylist.last_name}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Original Date</div>
                  <div className="font-medium text-gray-900">
                    {formatDate(new Date(appointment.start_time))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-500">Original Time</div>
                  <div className="font-medium text-gray-900">
                    {formatTime(new Date(appointment.start_time).toTimeString().slice(0, 5))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {step === 'select' && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Calendar */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select New Date</h2>
              
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-medium text-gray-900">
                  {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                  className="p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Day Labels */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {getDaysInMonth(currentMonth).map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const isDisabled = isDateDisabled(date);
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  const isToday = date.toDateString() === new Date().toDateString();

                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => !isDisabled && setSelectedDate(date)}
                      disabled={isDisabled}
                      className={`
                        aspect-square rounded-lg text-sm font-medium transition-colors
                        ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-900 hover:bg-purple-50'}
                        ${isSelected ? 'bg-purple-600 text-white hover:bg-purple-700' : ''}
                        ${isToday && !isSelected ? 'ring-2 ring-purple-200' : ''}
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select New Time</h2>
              
              {!selectedDate ? (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Please select a date first</p>
                </div>
              ) : loadingSlots ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No available times on this date</p>
                  <p className="text-sm mt-1">Please try another date</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                  {availableSlots
                    .filter((slot) => slot.available)
                    .map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => setSelectedTime(slot.time)}
                        className={`
                          py-2 px-3 rounded-lg text-sm font-medium transition-colors
                          ${selectedTime === slot.time
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-600'
                          }
                        `}
                      >
                        {formatTime(slot.time)}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'confirm' && selectedDate && selectedTime && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Confirm New Time</h2>
            
            <div className="bg-green-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <span className="text-gray-900 font-medium">{formatDate(selectedDate)}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-green-600" />
                <span className="text-gray-900 font-medium">{formatTime(selectedTime)}</span>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Please confirm you want to reschedule your appointment to this new date and time.
              A confirmation email will be sent to you.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('select')}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleReschedule}
                disabled={submitting}
                className="flex-1 py-3 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Rescheduling...
                  </>
                ) : (
                  'Confirm Reschedule'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {step === 'select' && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setStep('confirm')}
              disabled={!selectedDate || !selectedTime}
              className="px-8 py-3 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
