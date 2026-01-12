'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Settings, Clock, CreditCard, Plug, Save } from 'lucide-react';

interface BusinessSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
  currency: string;
  bookingLeadTime: number;
  bookingWindowDays: number;
  cancellationPolicy: string;
  depositPolicy: string;
  closedDays: number[];
  businessHours: {
    [key: number]: { open: string; close: string } | null;
  };
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get('tab') as 'general' | 'hours' | 'booking' | 'integrations' || 'general';
  
  const [settings, setSettings] = useState<BusinessSettings>({
    name: 'KeLatic Hair Lounge',
    address: '9430 Richmond Ave, Houston, TX 77063',
    phone: '(713) 485-4000',
    email: 'kelatic@gmail.com',
    timezone: 'America/Chicago',
    currency: 'USD',
    bookingLeadTime: 2,
    bookingWindowDays: 60,
    cancellationPolicy: '24 hours notice required for cancellations. Deposits are non-refundable for no-shows.',
    depositPolicy: 'A deposit is required to secure your appointment for services over $100.',
    closedDays: [0, 1], // Sunday and Monday
    businessHours: {
      0: null, // Closed
      1: null, // Closed
      2: { open: '10:00', close: '19:00' },
      3: { open: '10:00', close: '19:00' },
      4: { open: '10:00', close: '19:00' },
      5: { open: '10:00', close: '19:00' },
      6: { open: '09:00', close: '17:00' },
    },
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'hours' | 'booking' | 'integrations'>(initialTab);
  const [integrationStatus, setIntegrationStatus] = useState({
    googleCalendar: false,
    smsEmail: false,
    stripe: true
  });
  const [setupLoading, setSetupLoading] = useState<string | null>(null);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      
      if (data.success && data.settings) {
        setSettings(data.settings);
        setIntegrationStatus({
          googleCalendar: data.settings.googleCalendarConnected || false,
          smsEmail: data.settings.smsEmailEnabled || false,
          stripe: data.settings.stripeConnected || true
        });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async function handleSave() {
    setLoading(true);
    setSaved(false);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: {
            ...settings,
            googleCalendarConnected: integrationStatus.googleCalendar,
            smsEmailEnabled: integrationStatus.smsEmail,
            stripeConnected: integrationStatus.stripe
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Show error to user
    } finally {
      setLoading(false);
    }
  }

  async function handleConnectGoogle() {
    setSetupLoading('google-calendar');
    try {
      const response = await fetch('/api/admin/integrations/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider: 'google-calendar' }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIntegrationStatus(prev => ({ ...prev, googleCalendar: true }));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        throw new Error(data.error || 'Failed to connect Google Calendar');
      }
    } catch (error) {
      console.error('Failed to connect Google Calendar:', error);
    } finally {
      setSetupLoading(null);
    }
  }

  async function handleSetupNotifications() {
    setSetupLoading('notifications');
    try {
      const response = await fetch('/api/admin/notifications/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: 'sms-email',
          settings: {
            sms: true,
            email: true,
            reminders: true,
            confirmations: true
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setIntegrationStatus(prev => ({ ...prev, smsEmail: true }));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        throw new Error(data.error || 'Failed to setup notifications');
      }
    } catch (error) {
      console.error('Failed to setup notifications:', error);
    } finally {
      setSetupLoading(null);
    }
  }

  function toggleClosedDay(day: number) {
    const newClosedDays = settings.closedDays.includes(day)
      ? settings.closedDays.filter((d) => d !== day)
      : [...settings.closedDays, day];

    const newBusinessHours = { ...settings.businessHours };
    if (newClosedDays.includes(day)) {
      newBusinessHours[day] = null;
    } else {
      newBusinessHours[day] = { open: '10:00', close: '19:00' };
    }

    setSettings({
      ...settings,
      closedDays: newClosedDays,
      businessHours: newBusinessHours,
    });
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-stone-900 flex items-center gap-3">
            <Settings className="w-8 h-8 text-amber-600" />
            Settings
          </h1>
          <p className="text-stone-600">Manage your business settings and preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-3 bg-amber-500 text-stone-900 rounded-xl font-semibold hover:bg-amber-600 transition-all flex items-center gap-2 w-fit disabled:opacity-50 shadow-lg"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Saved!
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-stone-200 mb-6">
        {(['general', 'hours', 'booking', 'integrations'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === tab
                ? 'text-amber-600 border-amber-600'
                : 'text-stone-600 border-transparent hover:text-amber-600'
            }`}
          >
            {tab === 'general' && <Settings className="w-4 h-4" />}
            {tab === 'hours' && <Clock className="w-4 h-4" />}
            {tab === 'booking' && <CreditCard className="w-4 h-4" />}
            {tab === 'integrations' && <Plug className="w-4 h-4" />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-lg p-6 space-y-6">
          <h2 className="font-playfair font-semibold text-stone-900">Business Information</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                placeholder="kelatic@gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                placeholder="(713) 485-4000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-4 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                placeholder="9430 Richmond Ave, Houston, TX 77063"
              />
            </div>
          </div>
        </div>
      )}

      {/* Business Hours */}
      {activeTab === 'hours' && (
        <div className="bg-white rounded-xl border border-amber-200 shadow-lg p-6 space-y-6">
          <h2 className="font-playfair font-semibold text-stone-900">Business Hours</h2>

          <div className="space-y-4">
            {DAYS.map((day, index) => {
              const isClosed = settings.closedDays.includes(index);
              const hours = settings.businessHours[index];

              return (
                <div
                  key={day}
                  className="flex items-center gap-4 py-3 border-b border-white/10 last:border-0"
                >
                  <div className="w-28 font-medium text-stone-900">{day}</div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!isClosed}
                      onChange={() => toggleClosedDay(index)}
                      className="w-4 h-4 rounded border-white/30 bg-transparent text-amber-400 focus:ring-amber-400/50"
                    />
                    <span className="text-sm text-stone-900/60">Open</span>
                  </label>

                  {!isClosed && hours && (
                    <div className="flex items-center gap-2 ml-auto">
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            businessHours: {
                              ...settings.businessHours,
                              [index]: { ...hours, open: e.target.value },
                            },
                          })
                        }
                        className="px-3 py-1 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                      <span className="text-stone-600">to</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            businessHours: {
                              ...settings.businessHours,
                              [index]: { ...hours, close: e.target.value },
                            },
                          })
                        }
                        className="px-3 py-1 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  )}

                  {isClosed && (
                    <span className="text-sm text-stone-900/40 ml-auto">Closed</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Booking Settings */}
      {activeTab === 'booking' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-amber-200 shadow-lg p-6 space-y-6">
            <h2 className="font-playfair font-semibold text-stone-900">Booking Rules</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Minimum Lead Time (hours)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.bookingLeadTime}
                  onChange={(e) =>
                    setSettings({ ...settings, bookingLeadTime: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <p className="text-sm text-stone-900/40 mt-1">
                  How far in advance clients must book
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  Booking Window (days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.bookingWindowDays}
                  onChange={(e) =>
                    setSettings({ ...settings, bookingWindowDays: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
                <p className="text-sm text-stone-900/40 mt-1">
                  How far ahead clients can book
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-amber-200 shadow-lg p-6 space-y-6">
            <h2 className="font-playfair font-semibold text-stone-900">Policies</h2>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Cancellation Policy
              </label>
              <textarea
                value={settings.cancellationPolicy}
                onChange={(e) =>
                  setSettings({ ...settings, cancellationPolicy: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                Deposit Policy
              </label>
              <textarea
                value={settings.depositPolicy}
                onChange={(e) =>
                  setSettings({ ...settings, depositPolicy: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Integrations */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          {/* Stripe */}
          <div className="bg-white rounded-xl border border-amber-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#635BFF] rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-stone-900" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900">Stripe</h3>
                  <p className="text-sm text-stone-600">Payment processing & POS</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                Connected
              </span>
            </div>
            <div className="flex gap-2">
              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-white/5 text-stone-900 rounded-xl hover:bg-white/10 transition-colors text-sm border border-white/10"
              >
                Open Dashboard
              </a>
              <button className="px-4 py-2 bg-white/5 text-stone-900 rounded-xl hover:bg-white/10 transition-colors text-sm border border-white/10">
                Manage Terminal
              </button>
            </div>
          </div>

          {/* SMS/Email */}
          <div className="bg-white rounded-xl border border-amber-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                  <svg className="w-6 h-6 text-stone-900/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900">SMS & Email</h3>
                  <p className="text-sm text-stone-600">Appointment reminders & confirmations</p>
                </div>
              </div>
              <span className={`px-3 py-1 text-sm rounded-full ${
                integrationStatus.smsEmail 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-white/10 text-stone-600'
              }`}>
                {integrationStatus.smsEmail ? 'Enabled' : 'Not Configured'}
              </span>
            </div>
            <button 
              onClick={handleSetupNotifications}
              disabled={setupLoading === 'notifications' || integrationStatus.smsEmail}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {setupLoading === 'notifications' ? 'Setting Up...' : 
               integrationStatus.smsEmail ? 'Configured' : 'Set Up Notifications'}
            </button>
          </div>

          {/* Google Calendar */}
          <div className="bg-white rounded-xl border border-amber-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                  <svg className="w-6 h-6 text-stone-900/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900">Google Calendar</h3>
                  <p className="text-sm text-stone-600">Sync appointments with Google</p>
                </div>
              </div>
              <span className={`px-3 py-1 text-sm rounded-full ${
                integrationStatus.googleCalendar 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-white/10 text-stone-600'
              }`}>
                {integrationStatus.googleCalendar ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            <button 
              onClick={handleConnectGoogle}
              disabled={setupLoading === 'google-calendar' || integrationStatus.googleCalendar}
              className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {setupLoading === 'google-calendar' ? 'Connecting...' : 
               integrationStatus.googleCalendar ? 'Connected' : 'Connect Google'}
            </button>
          </div>

          {/* Instagram */}
          <div className="bg-white rounded-xl border border-amber-200 shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-stone-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-stone-900">Instagram</h3>
                  <p className="text-sm text-stone-600">@kelatic_</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full">
                Coming Soon
              </span>
            </div>
            <button disabled className="px-4 py-2 bg-white/5 text-stone-900/30 rounded-xl cursor-not-allowed text-sm border border-white/10">
              Connect Instagram
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
