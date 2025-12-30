import { useState, useRef, useEffect } from 'react';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch('/api/notifications/logs')
        .then((res) => res.json())
        .then((data) => setNotifications(data.notifications || []))
        .finally(() => setLoading(false));
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

  // Show red dot if there are notifications
  const hasNotifications = notifications.length > 0;

  return (
    <div className="relative">
      <button
        ref={bellRef}
        className="relative p-2 text-gray-600 hover:text-gray-900"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {hasNotifications && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b font-semibold">Notifications</div>
          {loading ? (
            <div className="p-4 text-gray-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-gray-500">No notifications</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map((n) => (
                <li key={n.id} className="p-4 hover:bg-gray-50">
                  <div className="text-sm font-medium text-gray-900">
                    {n.notification_type.charAt(0).toUpperCase() + n.notification_type.slice(1)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Appointment ID: {n.appointment_id}<br />
                    {n.created_at ? new Date(n.created_at).toLocaleString() : ''}
                  </div>
                  {n.recipient_email && (
                    <div className="text-xs text-gray-400 mt-1">To: {n.recipient_email}</div>
                  )}
                  {n.recipient_phone && (
                    <div className="text-xs text-gray-400">SMS: {n.recipient_phone}</div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}