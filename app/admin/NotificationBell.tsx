'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, Clock, AlertCircle, Calendar, CreditCard, User, Settings } from 'lucide-react';
import type { InAppNotification } from '@/types/database';

interface NotificationData extends InAppNotification {
  timeAgo?: string;
  isNew?: boolean;
}

interface SetupStatus {
  googleCalendar: boolean;
  smsEmail: boolean;
  businessHours: boolean;
  businessInfo: boolean;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingAsRead, setMarkingAsRead] = useState<string | null>(null);
  const [setupStatus, setSetupStatus] = useState<SetupStatus>({
    googleCalendar: false,
    smsEmail: false,
    businessHours: true, // Assume completed
    businessInfo: true   // Assume completed
  });
  const [setupLoading, setSetupLoading] = useState(true);
  const bellRef = useRef<HTMLButtonElement>(null);

  // Check setup completion status
  const checkSetupStatus = async () => {
    setSetupLoading(true);
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      
      if (data.success && data.settings) {
        setSetupStatus({
          googleCalendar: data.settings.googleCalendarConnected || false,
          smsEmail: data.settings.smsEmailEnabled || false,
          businessHours: true, // Always true since it has defaults
          businessInfo: !!(data.settings.name && data.settings.email && data.settings.phone)
        });
      }
    } catch (error) {
      console.error('Failed to check setup status:', error);
    } finally {
      setSetupLoading(false);
    }
  };

  // Check if setup is incomplete
  const isSetupIncomplete = !setupLoading && (!setupStatus.googleCalendar || !setupStatus.smsEmail);

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications/in-app');
      const data = await response.json();
      
      if (data.success) {
        const notificationsWithTime = data.notifications.map((n: InAppNotification) => ({
          ...n,
          timeAgo: formatTimeAgo(n.created_at),
          isNew: !n.is_read && isRecent(n.created_at)
        }));
        setNotifications(notificationsWithTime);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    setMarkingAsRead(notificationId);
    try {
      await fetch('/api/notifications/in-app/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, is_read: true, isNew: false }
            : n
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    } finally {
      setMarkingAsRead(null);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/in-app/mark-all-read', {
        method: 'POST'
      });
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true, isNew: false }))
      );
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: NotificationData) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'medium': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'low': return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
      default: return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    }
  };

  // Get type icon
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmation': 
      case 'booking_cancellation':
      case 'booking_reschedule':
        return <Calendar className="w-4 h-4" />;
      case 'payment_received':
      case 'payment_failed':
        return <CreditCard className="w-4 h-4" />;
      case 'reminder_24hr':
      case 'reminder_2hr':
      case 'reminder_30min':
        return <Clock className="w-4 h-4" />;
      case 'stylist_assigned':
      case 'stylist_unavailable':
        return <User className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  // Utility functions
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return time.toLocaleDateString();
  };

  const isRecent = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    return diff < 24 * 60 * 60 * 1000; // 24 hours
  };

  // Effects
  useEffect(() => {
    checkSetupStatus(); // Check setup status on mount
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
      checkSetupStatus(); // Refresh setup status when opening
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

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (open) {
        fetchNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [open]);

  // Show indicator if there are unread notifications or setup is incomplete
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const hasUrgent = notifications.some(n => !n.is_read && n.priority === 'urgent');
  const shouldShowIndicator = unreadCount > 0 || isSetupIncomplete;

  return (
    <div className="relative">
      <button
        ref={bellRef}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
      >
        <Bell className={`w-5 h-5 ${hasUrgent || isSetupIncomplete ? 'text-red-500 animate-pulse' : ''}`} />
        {shouldShowIndicator && (
          <span className={`absolute -top-1 -right-1 min-w-[1.25rem] h-5 flex items-center justify-center rounded-full text-xs font-bold text-white ${
            hasUrgent || isSetupIncomplete ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
          }`}>
            {isSetupIncomplete && unreadCount === 0 ? '!' : unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Setup Status Alert */}
          {isSetupIncomplete && (
            <div className="p-4 bg-amber-50 border-b border-amber-200">
              <div className="flex items-start gap-3">
                <Settings className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h4 className="font-medium text-amber-900 text-sm">
                    Complete Your Setup
                  </h4>
                  <p className="text-amber-700 text-sm mt-1">
                    Some integrations are not configured:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {!setupStatus.googleCalendar && (
                      <li className="flex items-center gap-2 text-amber-700">
                        <Calendar className="w-3 h-3" />
                        Google Calendar
                      </li>
                    )}
                    {!setupStatus.smsEmail && (
                      <li className="flex items-center gap-2 text-amber-700">
                        <Bell className="w-3 h-3" />
                        SMS & Email Notifications
                      </li>
                    )}
                  </ul>
                  <button
                    onClick={() => {
                      setOpen(false);
                      window.location.href = '/admin/settings?tab=integrations';
                    }}
                    className="mt-2 text-xs font-medium text-amber-800 hover:text-amber-900 underline"
                  >
                    Go to Settings →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
                {unreadCount > 0 && (
                  <span className="text-sm text-gray-500">({unreadCount} unread)</span>
                )}
              </h3>
              <div className="flex gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <p className="text-gray-500 mt-2">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No notifications</p>
                <p className="text-gray-400 text-sm">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.is_read ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Type Icon */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center ${
                        getPriorityColor(notification.priority)
                      }`}>
                        {getTypeIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`font-medium text-sm ${
                            !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                            {notification.isNew && (
                              <span className="inline-block ml-2 w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </h4>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {notification.timeAgo}
                          </span>
                        </div>
                        
                        <p className={`text-sm mt-1 ${
                          !notification.is_read ? 'text-gray-600' : 'text-gray-500'
                        }`}>
                          {notification.message}
                        </p>

                        {/* Action Button */}
                        {notification.action_label && notification.action_url && (
                          <div className="mt-2">
                            <span className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-800">
                              {notification.action_label}
                              <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Mark as read button */}
                      {!notification.is_read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          disabled={markingAsRead === notification.id}
                          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                        >
                          {markingAsRead === notification.id ? (
                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t bg-gray-50">
              <button
                onClick={() => {
                  setOpen(false);
                  window.location.href = '/admin/notifications';
                }}
                className="w-full text-center text-sm text-gray-600 hover:text-gray-800 font-medium flex items-center justify-center gap-2"
              >
                <Settings className="w-4 h-4" />
                View all notifications & settings
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}