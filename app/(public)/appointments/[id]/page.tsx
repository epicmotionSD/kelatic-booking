'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDate, formatTime, formatDuration, formatDateForCal } from '@/lib/date-utils';
import { PublicAuthLinks } from '@/components/layout/public-auth-links';
import {
  Calendar,
  Clock,
  User,
  Scissors,
  MapPin,
  Phone,
  Mail,
  Check,
  AlertCircle,
  Loader2,
  ArrowLeft,
  CalendarClock,
  X,
  Download,
} from 'lucide-react';

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  quoted_price: number;
  final_price: number;
  client_notes?: string;
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
  appointment_addons?: Array<{
    service: {
      id: string;
      name: string;
      base_price: number;
    };
    price: number;
    duration: number;
  }>;
}

const SALON_PHONE = '(713) 485-4000';
const SALON_ADDRESS = '9430 Richmond Ave, Houston, TX 77063';

export default function AppointmentPage() {
  const params = useParams();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

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
      setAppointment(await res.json());
    } catch (err) {
      setError('Failed to load appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/appointments/${appointmentId}/cancel`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel');
      }

      // Refresh appointment data
      await fetchAppointment();
      setShowCancelConfirm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  const addToCalendar = () => {
    if (!appointment) return;

    const startDate = new Date(appointment.start_time);
    const endDate = new Date(appointment.end_time);

    const event = {
      title: `${appointment.service.name} at KeLatic Hair Lounge`,
      start: formatDateForCal(startDate),
      end: formatDateForCal(endDate),
      description: `Service: ${appointment.service.name}\nStylist: ${appointment.stylist.first_name} ${appointment.stylist.last_name}`,
      location: SALON_ADDRESS,
    };

    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${event.start}/${event.end}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
    
    window.open(googleUrl, '_blank');
  };



  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-red-100 text-red-800',
    };

    const labels: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      in_progress: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      no_show: 'No Show',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const canReschedule = appointment && 
    ['pending', 'confirmed'].includes(appointment.status) &&
    new Date(appointment.start_time) > new Date();

  const canCancel = appointment && 
    ['pending', 'confirmed'].includes(appointment.status) &&
    new Date(appointment.start_time) > new Date();

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
            Please contact us if you need assistance.
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
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Your Appointment</h1>
            {appointment && getStatusBadge(appointment.status)}
          </div>
        </div>
      </div>

      {appointment && (
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Main Appointment Card */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
            {/* Status Banner */}
            {appointment.status === 'confirmed' && (
              <div className="bg-green-50 border-b border-green-100 px-6 py-3 flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">Your appointment is confirmed!</span>
              </div>
            )}
            {appointment.status === 'cancelled' && (
              <div className="bg-red-50 border-b border-red-100 px-6 py-3 flex items-center gap-2">
                <X className="w-5 h-5 text-red-600" />
                <span className="text-red-800 font-medium">This appointment has been cancelled</span>
              </div>
            )}

            <div className="p-6">
              {/* Date & Time */}
              <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
                <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-7 h-7 text-purple-600" />
                </div>
                <div>
                  <div className="text-xl font-semibold text-gray-900">
                    {formatDate(appointment.start_time)}
                  </div>
                  <div className="text-gray-600 flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4" />
                    {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                  </div>
                </div>
              </div>

              {/* Service & Stylist */}
              <div className="grid sm:grid-cols-2 gap-6 mb-6 pb-6 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Scissors className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Service</div>
                    <div className="font-semibold text-gray-900">{appointment.service.name}</div>
                    <div className="text-sm text-gray-500">{formatDuration(appointment.service.duration)}</div>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Stylist</div>
                    <div className="font-semibold text-gray-900">
                      {appointment.stylist.first_name} {appointment.stylist.last_name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Add-ons */}
              {appointment.appointment_addons && appointment.appointment_addons.length > 0 && (
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <div className="text-sm text-gray-500 mb-2">Add-ons</div>
                  <div className="flex flex-wrap gap-2">
                    {appointment.appointment_addons.map((addon, idx) => (
                      <span key={idx} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                        {addon.service.name} (+${addon.price})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {appointment.client_notes && (
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <div className="text-sm text-gray-500 mb-2">Your Notes</div>
                  <p className="text-gray-700">{appointment.client_notes}</p>
                </div>
              )}

              {/* Total */}
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total</span>
                <span className="text-2xl font-bold text-gray-900">
                  ${(appointment.final_price || appointment.quoted_price || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Location Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Location</h2>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">KeLatic Hair Lounge</div>
                <div className="text-gray-600">{SALON_ADDRESS}</div>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(SALON_ADDRESS)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-600 hover:text-purple-700 text-sm mt-1 inline-block"
                >
                  Get Directions →
                </a>
              </div>
            </div>
          </div>

          {/* Contact Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">Need Help?</h2>
            <div className="flex items-center gap-4">
              <a
                href={`tel:${SALON_PHONE.replace(/[^0-9]/g, '')}`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Phone className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700">{SALON_PHONE}</span>
              </a>
              <a
                href="mailto:hello@kelatic.com"
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Mail className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700">Email Us</span>
              </a>
            </div>
          </div>

          {/* Action Buttons */}
          {(canReschedule || canCancel) && (
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={addToCalendar}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Add to Calendar
              </button>
              {canReschedule && (
                <Link
                  href={`/appointments/${appointmentId}/reschedule`}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-full font-medium hover:bg-purple-700 transition-colors"
                >
                  <CalendarClock className="w-4 h-4" />
                  Reschedule
                </Link>
              )}
              {canCancel && (
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-50 text-red-600 border border-red-200 rounded-full font-medium hover:bg-red-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Cancel Appointment?</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel this appointment? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
                >
                  Keep Appointment
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelling ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Yes, Cancel'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
