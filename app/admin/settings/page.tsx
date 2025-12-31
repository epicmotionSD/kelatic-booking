'use client';

import { useState, useEffect } from 'react';

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
  const [activeTab, setActiveTab] = useState<'general' | 'hours' | 'booking' | 'integrations'>('general');

  async function handleSave() {
    setLoading(true);
    setSaved(false);

    try {
      // In production, save to API
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
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
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-white/50">Manage your business settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center gap-2 w-fit disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black" />
              Saving...
            </>
          ) : saved ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 mb-6">
        {(['general', 'hours', 'booking', 'integrations'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'text-amber-400 border-amber-400'
                : 'text-white/50 border-transparent hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6 space-y-6">
          <h2 className="font-semibold text-white">Business Information</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Business Name
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Email
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
                placeholder="kelatic@gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Phone
              </label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
                placeholder="(713) 485-4000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-white/70 mb-1">
                Address
              </label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
                placeholder="9430 Richmond Ave, Houston, TX 77063"
              />
            </div>
          </div>
        </div>
      )}

      {/* Business Hours */}
      {activeTab === 'hours' && (
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6 space-y-6">
          <h2 className="font-semibold text-white">Business Hours</h2>

          <div className="space-y-4">
            {DAYS.map((day, index) => {
              const isClosed = settings.closedDays.includes(index);
              const hours = settings.businessHours[index];

              return (
                <div
                  key={day}
                  className="flex items-center gap-4 py-3 border-b border-white/10 last:border-0"
                >
                  <div className="w-28 font-medium text-white">{day}</div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!isClosed}
                      onChange={() => toggleClosedDay(index)}
                      className="w-4 h-4 rounded border-white/30 bg-transparent text-amber-400 focus:ring-amber-400/50"
                    />
                    <span className="text-sm text-white/60">Open</span>
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
                        className="px-3 py-1 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
                      />
                      <span className="text-white/50">to</span>
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
                        className="px-3 py-1 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
                      />
                    </div>
                  )}

                  {isClosed && (
                    <span className="text-sm text-white/40 ml-auto">Closed</span>
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
          <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6 space-y-6">
            <h2 className="font-semibold text-white">Booking Rules</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Minimum Lead Time (hours)
                </label>
                <input
                  type="number"
                  min="0"
                  value={settings.bookingLeadTime}
                  onChange={(e) =>
                    setSettings({ ...settings, bookingLeadTime: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
                />
                <p className="text-sm text-white/40 mt-1">
                  How far in advance clients must book
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Booking Window (days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.bookingWindowDays}
                  onChange={(e) =>
                    setSettings({ ...settings, bookingWindowDays: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
                />
                <p className="text-sm text-white/40 mt-1">
                  How far ahead clients can book
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6 space-y-6">
            <h2 className="font-semibold text-white">Policies</h2>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Cancellation Policy
              </label>
              <textarea
                value={settings.cancellationPolicy}
                onChange={(e) =>
                  setSettings({ ...settings, cancellationPolicy: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Deposit Policy
              </label>
              <textarea
                value={settings.depositPolicy}
                onChange={(e) =>
                  setSettings({ ...settings, depositPolicy: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Integrations */}
      {activeTab === 'integrations' && (
        <div className="space-y-6">
          {/* Stripe */}
          <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#635BFF] rounded-xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Stripe</h3>
                  <p className="text-sm text-white/50">Payment processing & POS</p>
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
                className="px-4 py-2 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors text-sm border border-white/10"
              >
                Open Dashboard
              </a>
              <button className="px-4 py-2 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors text-sm border border-white/10">
                Manage Terminal
              </button>
            </div>
          </div>

          {/* SMS/Email */}
          <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                  <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">SMS & Email</h3>
                  <p className="text-sm text-white/50">Appointment reminders & confirmations</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-white/10 text-white/50 text-sm rounded-full">
                Not Configured
              </span>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all text-sm">
              Set Up Notifications
            </button>
          </div>

          {/* Google Calendar */}
          <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                  <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Google Calendar</h3>
                  <p className="text-sm text-white/50">Sync appointments with Google</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-white/10 text-white/50 text-sm rounded-full">
                Not Connected
              </span>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all text-sm">
              Connect Google
            </button>
          </div>

          {/* Instagram */}
          <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Instagram</h3>
                  <p className="text-sm text-white/50">@kelatic_</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full">
                Coming Soon
              </span>
            </div>
            <button disabled className="px-4 py-2 bg-white/5 text-white/30 rounded-xl cursor-not-allowed text-sm border border-white/10">
              Connect Instagram
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
