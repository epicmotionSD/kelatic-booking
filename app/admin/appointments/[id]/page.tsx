import { createClient } from '@/lib/supabase/server';
import { requireBusiness } from '@/lib/tenant/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';
import AppointmentActions from './AppointmentActions';

type PageProps = {
  params?: Promise<{ id: string }>;
};

export default async function AppointmentDetailPage({ params }: PageProps) {
  const resolvedParams = params ? await params : { id: '' };
  const business = await requireBusiness();
  const supabase = await createClient();

  const { data: appointment, error } = await supabase
    .from('appointments')
    .select(`
      *,
      services(*),
      stylist:profiles!appointments_stylist_id_fkey(id, first_name, last_name, email, phone),
      client:profiles!appointments_client_id_fkey(id, first_name, last_name, email, phone),
      payments(*)
    `)
    .eq('id', resolvedParams.id)
    .eq('business_id', business.id)
    .single();

  if (error || !appointment) {
    notFound();
  }

  const clientName = appointment.is_walk_in
    ? appointment.walk_in_name || 'Walk-in'
    : appointment.client
    ? `${appointment.client.first_name} ${appointment.client.last_name}`
    : 'Unknown';

  const clientPhone = appointment.is_walk_in
    ? appointment.walk_in_phone
    : appointment.client?.phone;

  const clientEmail = appointment.client?.email;

  const stylistName = appointment.stylist
    ? `${appointment.stylist.first_name} ${appointment.stylist.last_name}`
    : 'Unassigned';

  const depositPaid = appointment.payments
    ?.filter((p: any) => p.is_deposit && p.status === 'paid')
    .reduce((sum: number, p: any) => sum + p.total_amount, 0) || 0;

  const totalPaid = appointment.payments
    ?.filter((p: any) => p.status === 'paid')
    .reduce((sum: number, p: any) => sum + p.total_amount, 0) || 0;

  const totalPrice = appointment.quoted_price || 0;
  const balanceDue = totalPrice - totalPaid;

  const statusConfig: Record<string, { bg: string; label: string }> = {
    pending: { bg: 'bg-amber-500/20 text-amber-400 border-amber-500/30', label: 'Pending' },
    confirmed: { bg: 'bg-green-500/20 text-green-400 border-green-500/30', label: 'Confirmed' },
    in_progress: { bg: 'bg-blue-500/20 text-blue-400 border-blue-500/30', label: 'In Progress' },
    completed: { bg: 'bg-white/10 text-white/60 border-white/20', label: 'Completed' },
    cancelled: { bg: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Cancelled' },
    no_show: { bg: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'No Show' },
  };

  const status = statusConfig[appointment.status] || statusConfig.pending;

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/appointments"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Appointment Details</h1>
              <p className="text-white/50 text-sm">
                Created {new Date(appointment.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-medium border ${status.bg}`}>
            {status.label}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date & Time */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Date & Time
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/50 text-sm">Date</p>
                  <p className="text-white text-lg">
                    {new Date(appointment.start_time).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-white/50 text-sm">Time</p>
                  <p className="text-white text-lg">
                    {new Date(appointment.start_time).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                    {appointment.end_time && (
                      <>
                        {' - '}
                        {new Date(appointment.end_time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Service */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                </svg>
                Service
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-white font-medium">{appointment.services?.name || 'Unknown Service'}</p>
                    <p className="text-white/50 text-sm">{appointment.services?.duration || 0} minutes</p>
                  </div>
                  <p className="text-white font-medium">
                    {formatCurrency((appointment.quoted_price || 0) * 100)}
                  </p>
                </div>
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <p className="text-white font-semibold">Total</p>
                  <p className="text-white font-semibold">{formatCurrency(totalPrice * 100)}</p>
                </div>
              </div>
            </div>

            {/* Notes */}
            {(appointment.client_notes || appointment.internal_notes) && (
              <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Notes
                </h2>
                {appointment.client_notes && (
                  <div className="mb-4">
                    <p className="text-white/50 text-sm mb-1">Client Notes</p>
                    <p className="text-white">{appointment.client_notes}</p>
                  </div>
                )}
                {appointment.internal_notes && (
                  <div>
                    <p className="text-white/50 text-sm mb-1">Internal Notes</p>
                    <p className="text-white">{appointment.internal_notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Client
              </h2>
              <p className="text-white font-medium text-lg mb-2">{clientName}</p>
              {appointment.is_walk_in && (
                <span className="inline-block px-2 py-1 bg-white/10 rounded text-xs text-white/50 mb-3">
                  Walk-in
                </span>
              )}
              {clientPhone && (
                <a
                  href={`tel:${clientPhone}`}
                  className="flex items-center gap-2 text-white/70 hover:text-white mb-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {clientPhone}
                </a>
              )}
              {clientEmail && (
                <a
                  href={`mailto:${clientEmail}`}
                  className="flex items-center gap-2 text-white/70 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {clientEmail}
                </a>
              )}
            </div>

            {/* Stylist */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                </svg>
                Stylist
              </h2>
              <p className="text-white font-medium">{stylistName}</p>
            </div>

            {/* Payment */}
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Payment
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-white/50">Total</span>
                  <span className="text-white">{formatCurrency(totalPrice * 100)}</span>
                </div>
                {depositPaid > 0 && (
                  <div className="flex justify-between">
                    <span className="text-white/50">Deposit Paid</span>
                    <span className="text-green-400">{formatCurrency(depositPaid * 100)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-white/10 pt-2">
                  <span className="text-white font-medium">Balance Due</span>
                  <span className={`font-medium ${balanceDue > 0 ? 'text-amber-400' : 'text-green-400'}`}>
                    {formatCurrency(balanceDue * 100)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <AppointmentActions appointment={appointment} />
          </div>
        </div>
      </div>
    </div>
  );
}