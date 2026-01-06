'use client';

import { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Monitor, Save, Check, X } from 'lucide-react';
import { PushPreferences } from '@/components/notifications/push-preferences';
import type { NotificationType, NotificationPreference } from '@/types/database';

interface NotificationSettings {
  global: {
    email: boolean;
    sms: boolean;
    push: boolean;
    in_app: boolean;
    marketing: boolean;
  };
  preferences: Record<NotificationType, {
    email: boolean;
    sms: boolean;
    push: boolean;
    in_app: boolean;
  }>;
}

const NOTIFICATION_TYPES: Array<{
  type: NotificationType;
  label: string;
  description: string;
  category: string;
}> = [
  // Booking Notifications
  { type: 'booking_confirmation', label: 'Booking Confirmations', description: 'When appointments are confirmed', category: 'Appointments' },
  { type: 'booking_cancellation', label: 'Cancellations', description: 'When appointments are cancelled', category: 'Appointments' },
  { type: 'booking_reschedule', label: 'Reschedules', description: 'When appointments are rescheduled', category: 'Appointments' },
  
  // Reminder Notifications  
  { type: 'reminder_24hr', label: '24-Hour Reminders', description: 'Day before appointment reminders', category: 'Reminders' },
  { type: 'reminder_2hr', label: '2-Hour Reminders', description: 'Same day appointment reminders', category: 'Reminders' },
  { type: 'reminder_30min', label: '30-Minute Reminders', description: 'Final appointment reminders', category: 'Reminders' },
  
  // Payment Notifications
  { type: 'payment_received', label: 'Payment Confirmations', description: 'When payments are processed successfully', category: 'Payments' },
  { type: 'payment_failed', label: 'Payment Issues', description: 'When payments fail or are declined', category: 'Payments' },
  
  // Service Notifications
  { type: 'stylist_assigned', label: 'Stylist Assignments', description: 'When a stylist is assigned to your appointment', category: 'Service' },
  { type: 'stylist_unavailable', label: 'Stylist Changes', description: 'When your stylist becomes unavailable', category: 'Service' },
  { type: 'service_completed', label: 'Service Completed', description: 'When your appointment is finished', category: 'Service' },
  
  // Marketing & Reviews
  { type: 'review_request', label: 'Review Requests', description: 'Requests to review your experience', category: 'Marketing' },
  { type: 'newsletter_welcome', label: 'Welcome Messages', description: 'Welcome emails for new subscribers', category: 'Marketing' },
  { type: 'promotion_alert', label: 'Promotions & Offers', description: 'Special offers and discounts', category: 'Marketing' },
  
  // System Alerts
  { type: 'system_alert', label: 'System Alerts', description: 'Important system notifications', category: 'System' }
];

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>({
    global: {
      email: true,
      sms: true,
      push: true,
      in_app: true,
      marketing: true
    },
    preferences: {} as any
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);

  // Check for push notification support
  useEffect(() => {
    setPushSupported('serviceWorker' in navigator && 'PushManager' in window);
  }, []);

  // Load settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/notifications/preferences');
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save settings
  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  // Update global setting
  const updateGlobal = (channel: keyof NotificationSettings['global'], enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      global: {
        ...prev.global,
        [channel]: enabled
      }
    }));
  };

  // Update specific preference
  const updatePreference = (type: NotificationType, channel: string, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [type]: {
          ...prev.preferences[type],
          [channel]: enabled
        }
      }
    }));
  };

  // Request push permission
  const requestPushPermission = async () => {
    if (!pushSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Register service worker and get subscription
        const registration = await navigator.serviceWorker.register('/sw.js');
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        });

        // Save subscription to server
        await fetch('/api/notifications/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
              auth: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!)))
            }
          })
        });

        updateGlobal('push', true);
        return true;
      }
    } catch (error) {
      console.error('Push permission error:', error);
    }
    return false;
  };

  // Group notifications by category
  const groupedTypes = NOTIFICATION_TYPES.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof NOTIFICATION_TYPES>);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-6 h-6 text-blue-500" />
          Notification Settings
        </h1>
        <p className="text-gray-600 mt-2">
          Manage how and when you receive notifications
        </p>
      </div>

      {/* Global Settings */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Global Notification Channels</h2>
        <p className="text-gray-600 text-sm mb-6">
          Turn off any channel to disable all notifications of that type
        </p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Email */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Email</h3>
                <p className="text-sm text-gray-500">Detailed notifications</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.global.email}
                onChange={(e) => updateGlobal('email', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* SMS */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">SMS</h3>
                <p className="text-sm text-gray-500">Quick alerts</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.global.sms}
                onChange={(e) => updateGlobal('sms', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          {/* Push */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                pushSupported ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                <Smartphone className={`w-5 h-5 ${
                  pushSupported ? 'text-purple-600' : 'text-gray-400'
                }`} />
              </div>
              <div>
                <h3 className={`font-medium ${pushSupported ? 'text-gray-900' : 'text-gray-400'}`}>
                  Push
                </h3>
                <p className="text-sm text-gray-500">
                  {pushSupported ? 'Instant notifications' : 'Not supported'}
                </p>
              </div>
            </div>
            {pushSupported ? (
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.global.push}
                  onChange={async (e) => {
                    if (e.target.checked) {
                      const granted = await requestPushPermission();
                      if (!granted) e.target.checked = false;
                    } else {
                      updateGlobal('push', false);
                    }
                  }}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            ) : (
              <div className="w-11 h-6 bg-gray-100 rounded-full"></div>
            )}
          </div>

          {/* In-App */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Monitor className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">In-App</h3>
                <p className="text-sm text-gray-500">Dashboard alerts</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.global.in_app}
                onChange={(e) => updateGlobal('in_app', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>
        </div>

        {/* Marketing Toggle */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">Marketing Communications</h3>
              <p className="text-sm text-gray-500">Promotional emails, newsletters, and special offers</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.global.marketing}
                onChange={(e) => updateGlobal('marketing', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Push Notification Management */}
      <div className="mb-6">
        <PushPreferences className="w-full" />
      </div>

      {/* Detailed Preferences */}
      <div className="space-y-6">
        {Object.entries(groupedTypes).map(([category, types]) => (
          <div key={category} className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{category}</h2>
            
            <div className="space-y-4">
              {types.map((item) => {
                const prefs = settings.preferences[item.type] || {
                  email: true,
                  sms: true,
                  push: true,
                  in_app: true
                };

                return (
                  <div key={item.type} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.label}</h3>
                        <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        {/* Email */}
                        <label className="flex flex-col items-center gap-1 cursor-pointer">
                          <Mail className="w-4 h-4 text-blue-500" />
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={prefs.email && settings.global.email}
                            disabled={!settings.global.email}
                            onChange={(e) => updatePreference(item.type, 'email', e.target.checked)}
                          />
                        </label>

                        {/* SMS */}
                        <label className="flex flex-col items-center gap-1 cursor-pointer">
                          <MessageSquare className="w-4 h-4 text-green-500" />
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                            checked={prefs.sms && settings.global.sms}
                            disabled={!settings.global.sms}
                            onChange={(e) => updatePreference(item.type, 'sms', e.target.checked)}
                          />
                        </label>

                        {/* Push */}
                        <label className="flex flex-col items-center gap-1 cursor-pointer">
                          <Smartphone className={`w-4 h-4 ${pushSupported ? 'text-purple-500' : 'text-gray-300'}`} />
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            checked={prefs.push && settings.global.push && pushSupported}
                            disabled={!settings.global.push || !pushSupported}
                            onChange={(e) => updatePreference(item.type, 'push', e.target.checked)}
                          />
                        </label>

                        {/* In-App */}
                        <label className="flex flex-col items-center gap-1 cursor-pointer">
                          <Monitor className="w-4 h-4 text-orange-500" />
                          <input
                            type="checkbox"
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            checked={prefs.in_app && settings.global.in_app}
                            disabled={!settings.global.in_app}
                            onChange={(e) => updatePreference(item.type, 'in_app', e.target.checked)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={saveSettings}
          disabled={saving}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium text-white shadow-lg transition-all ${
            saved 
              ? 'bg-green-500' 
              : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
          } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : saved ? (
            <Check className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}