'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, X, Calendar, Clock, User, ChevronRight } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';

interface Appointment {
  id: string;
  start_time: string;
  status: string;
  clients?: { first_name: string; last_name: string } | null;
  services?: { name: string } | null;
  business_members?: { display_name: string } | null;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Fetch upcoming appointments
  const fetchAppointments = async () => {
    setLoading(true);
    try {
      // Fetch pending and today's confirmed appointments
      const response = await fetch('/api/admin/appointments?status=all&limit=20');
      const data = await response.json();
      
      if (data.success) {
        // Filter to pending + upcoming confirmed (today/tomorrow)
        const now = new Date();
        const filtered = data.appointments.filter((apt: Appointment) => {
          const aptDate = parseISO(apt.start_time);
          const isPending = apt.status === 'pending';
          const isUpcoming = apt.status === 'confirmed' && (isToday(aptDate) || isTomorrow(aptDate)) && aptDate > now;
          return isPending || isUpcoming;
        });
        
        // Sort by start_time
        filtered.sort((a: Appointment, b: Appointment) => 
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );
        
        setAppointments(filtered.slice(0, 10)); // Max 10
      }
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatAppointmentTime = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, 'h:mm a')}`;
    }
    return format(date, 'MMM d, h:mm a');
  };

  // Effects
  useEffect(() => {
    fetchAppointments(); // Initial fetch
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchAppointments, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      fetchAppointments();
    }
  }, [open]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [open]);

  // Count pending appointments
  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const upcomingCount = appointments.filter(a => a.status === 'confirmed').length;
  const totalCount = pendingCount + upcomingCount;

  return (
    <div className="relative">
      <button
        ref={bellRef}
        className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <Bell className={`w-5 h-5 ${pendingCount > 0 ? 'text-[#00ffb2]' : ''}`} />
        {totalCount > 0 && (
          <span className={`absolute -top-1 -right-1 min-w-[1.25rem] h-5 flex items-center justify-center rounded-full text-xs font-bold text-white ${
            pendingCount > 0 ? 'bg-[#00ffb2]' : 'bg-blue-500'
          }`}>
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b bg-muted">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Appointments
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-muted-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {(pendingCount > 0 || upcomingCount > 0) && (
              <div className="flex gap-3 mt-2 text-xs">
                {pendingCount > 0 && (
                  <span className="px-2 py-1 bg-[#00ffb2] text-[#00ffb2] rounded-full font-medium">
                    {pendingCount} pending
                  </span>
                )}
                {upcomingCount > 0 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                    {upcomingCount} upcoming
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Appointments List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <p className="text-muted-foreground mt-2">Loading...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No upcoming appointments</p>
                <p className="text-muted-foreground text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {appointments.map((appointment) => (
                  <a
                    key={appointment.id}
                    href={`/admin/appointments?highlight=${appointment.id}`}
                    className={`block p-4 hover:bg-muted transition-colors ${
                      appointment.status === 'pending' ? 'bg-[#00ffb2]/10' : ''
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Status Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                        appointment.status === 'pending' 
                          ? 'bg-[#00ffb2] text-[#00ffb2]' 
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {appointment.status === 'pending' ? (
                          <Clock className="w-5 h-5" />
                        ) : (
                          <Calendar className="w-5 h-5" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-medium text-sm text-foreground truncate">
                            {appointment.clients 
                              ? `${appointment.clients.first_name} ${appointment.clients.last_name}`
                              : 'Unknown Client'
                            }
                          </h4>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            appointment.status === 'pending'
                              ? 'bg-[#00ffb2] text-[#00ffb2]'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {appointment.status === 'pending' ? 'Pending' : 'Confirmed'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {appointment.services?.name || 'Service'}
                        </p>
                        
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatAppointmentTime(appointment.start_time)}
                          </span>
                          {appointment.business_members?.display_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {appointment.business_members.display_name}
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t bg-muted">
            <a
              href="/admin/appointments"
              onClick={() => setOpen(false)}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground font-medium flex items-center justify-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              View all appointments
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
