// =============================================================================
// SETTINGS PAGE
// /app/dashboard/settings/page.tsx
// Account settings, notifications, and integrations
// =============================================================================

'use client'

import { useState } from 'react'
import {
  Settings,
  User,
  Bell,
  MessageSquare,
  Link2,
  Shield,
  CreditCard,
  Save,
  Check,
  Phone,
  Mail,
  Building,
  Globe,
  Key,
  Zap,
} from 'lucide-react'

type TabId = 'account' | 'notifications' | 'sms' | 'integrations' | 'billing'

interface Tab {
  id: TabId
  name: string
  icon: React.ElementType
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('account')
  const [saved, setSaved] = useState(false)

  const tabs: Tab[] = [
    { id: 'account', name: 'Account', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'sms', name: 'SMS Settings', icon: MessageSquare },
    { id: 'integrations', name: 'Integrations', icon: Link2 },
    { id: 'billing', name: 'Billing', icon: CreditCard },
  ]

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-4 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-zinc-400">Manage your account and preferences</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          }`}
        >
          {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:w-56 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.name}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 max-w-2xl">
          {activeTab === 'account' && <AccountSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'sms' && <SMSSettings />}
          {activeTab === 'integrations' && <IntegrationSettings />}
          {activeTab === 'billing' && <BillingSettings />}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// ACCOUNT SETTINGS
// =============================================================================
function AccountSettings() {
  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Business Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Business Name</label>
            <input
              type="text"
              defaultValue="KeLatic Hair Lounge"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Phone</label>
              <input
                type="tel"
                defaultValue="(305) 555-1234"
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
              <input
                type="email"
                defaultValue="info@kelatichairlounge.com"
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Address</label>
            <input
              type="text"
              defaultValue="123 Main Street, Miami, FL 33101"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Website</label>
            <input
              type="url"
              defaultValue="https://kelatichairlounge.com"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Account Owner */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Account Owner</h2>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white text-xl font-bold">
            RR
          </div>
          <div>
            <p className="text-white font-medium">Rockal Roberts</p>
            <p className="text-zinc-500 text-sm">Owner</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">First Name</label>
            <input
              type="text"
              defaultValue="Rockal"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Last Name</label>
            <input
              type="text"
              defaultValue="Roberts"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Security</h2>
        <div className="space-y-4">
          <button className="w-full flex items-center justify-between px-4 py-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition">
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5 text-zinc-400" />
              <span className="text-white">Change Password</span>
            </div>
            <span className="text-zinc-500 text-sm">Last changed 30 days ago</span>
          </button>
          <button className="w-full flex items-center justify-between px-4 py-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-zinc-400" />
              <span className="text-white">Two-Factor Authentication</span>
            </div>
            <span className="text-emerald-400 text-sm">Enabled</span>
          </button>
        </div>
      </div>
    </div>
  )
}


// =============================================================================
// NOTIFICATION SETTINGS
// =============================================================================
function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailBookings: true,
    emailCampaigns: true,
    emailReports: false,
    pushNewLeads: true,
    pushResponses: true,
    pushBookings: true,
  })

  const toggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Email Notifications</h2>
        <div className="space-y-4">
          <ToggleRow
            label="New Bookings"
            description="Get notified when a client books an appointment"
            enabled={settings.emailBookings}
            onToggle={() => toggle('emailBookings')}
          />
          <ToggleRow
            label="Campaign Updates"
            description="Receive updates about your active campaigns"
            enabled={settings.emailCampaigns}
            onToggle={() => toggle('emailCampaigns')}
          />
          <ToggleRow
            label="Weekly Reports"
            description="Get weekly performance summaries"
            enabled={settings.emailReports}
            onToggle={() => toggle('emailReports')}
          />
        </div>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Push Notifications</h2>
        <div className="space-y-4">
          <ToggleRow
            label="Hot Leads"
            description="Alert when a lead responds with interest"
            enabled={settings.pushNewLeads}
            onToggle={() => toggle('pushNewLeads')}
          />
          <ToggleRow
            label="Message Responses"
            description="Notify when contacts reply to campaigns"
            enabled={settings.pushResponses}
            onToggle={() => toggle('pushResponses')}
          />
          <ToggleRow
            label="New Bookings"
            description="Real-time booking confirmations"
            enabled={settings.pushBookings}
            onToggle={() => toggle('pushBookings')}
          />
        </div>
      </div>
    </div>
  )
}


// =============================================================================
// SMS SETTINGS
// =============================================================================
function SMSSettings() {
  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Twilio Configuration</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Account SID</label>
            <input
              type="password"
              defaultValue="AC••••••••••••••••••••••••••••••••"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Auth Token</label>
            <input
              type="password"
              defaultValue="••••••••••••••••••••••••••••••••"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Phone Number</label>
            <input
              type="tel"
              defaultValue="+1 (305) 555-9876"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-sm text-emerald-400">
          <Check className="w-4 h-4" />
          Connected and verified
        </div>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-6">SMS Defaults</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Default Sender Name</label>
            <input
              type="text"
              defaultValue="KeLatic Hair"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Opt-Out Message</label>
            <textarea
              rows={2}
              defaultValue="Reply STOP to unsubscribe"
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Usage This Month</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">247</p>
            <p className="text-sm text-zinc-500">SMS Sent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">89</p>
            <p className="text-sm text-zinc-500">Delivered</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-cyan-400">$12.35</p>
            <p className="text-sm text-zinc-500">Cost</p>
          </div>
        </div>
      </div>
    </div>
  )
}


// =============================================================================
// INTEGRATION SETTINGS
// =============================================================================
function IntegrationSettings() {
  const integrations = [
    { name: 'Twilio', description: 'SMS messaging provider', connected: true, icon: MessageSquare },
    { name: 'Stripe', description: 'Payment processing', connected: true, icon: CreditCard },
    { name: 'Google LSA', description: 'Local Services Ads leads', connected: true, icon: Globe },
    { name: 'Instagram', description: 'Social media integration', connected: false, icon: Zap },
    { name: 'Calendly', description: 'Appointment scheduling', connected: false, icon: Building },
  ]

  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Connected Services</h2>
        <div className="space-y-4">
          {integrations.map((integration) => {
            const Icon = integration.icon
            return (
              <div
                key={integration.name}
                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${integration.connected ? 'bg-emerald-500/10' : 'bg-zinc-700'}`}>
                    <Icon className={`w-5 h-5 ${integration.connected ? 'text-emerald-400' : 'text-zinc-400'}`} />
                  </div>
                  <div>
                    <p className="text-white font-medium">{integration.name}</p>
                    <p className="text-sm text-zinc-500">{integration.description}</p>
                  </div>
                </div>
                <button
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    integration.connected
                      ? 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }`}
                >
                  {integration.connected ? 'Manage' : 'Connect'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">API Access</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">API Key</label>
            <div className="flex gap-2">
              <input
                type="password"
                defaultValue="sk_live_••••••••••••••••••••••••"
                className="flex-1 px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white font-mono focus:outline-none focus:border-emerald-500"
              />
              <button className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-white transition">
                Reveal
              </button>
            </div>
          </div>
          <button className="text-sm text-emerald-400 hover:text-emerald-300 transition">
            Regenerate API Key
          </button>
        </div>
      </div>
    </div>
  )
}


// =============================================================================
// BILLING SETTINGS
// =============================================================================
function BillingSettings() {
  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">Current Plan</h2>
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-sm font-medium rounded-full">
            Pro
          </span>
        </div>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-zinc-500 text-sm">Monthly Cost</p>
            <p className="text-2xl font-bold text-white">$49/mo</p>
          </div>
          <div>
            <p className="text-zinc-500 text-sm">Next Billing</p>
            <p className="text-2xl font-bold text-white">Feb 1, 2025</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-medium transition">
            Upgrade Plan
          </button>
          <button className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-zinc-300 transition">
            View Invoices
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-6">Payment Method</h2>
        <div className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <CreditCard className="w-5 h-5 text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium">•••• •••• •••• 4242</p>
            <p className="text-sm text-zinc-500">Expires 12/2026</p>
          </div>
          <button className="text-sm text-emerald-400 hover:text-emerald-300 transition">
            Update
          </button>
        </div>
      </div>

      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Usage Summary</h2>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-zinc-400">Campaigns</span>
            <span className="text-white">4 / Unlimited</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Contacts</span>
            <span className="text-white">489 / 5,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">SMS Messages</span>
            <span className="text-white">247 / 1,000</span>
          </div>
        </div>
      </div>
    </div>
  )
}


// =============================================================================
// HELPER COMPONENTS
// =============================================================================
function ToggleRow({
  label,
  description,
  enabled,
  onToggle,
}: {
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-white font-medium">{label}</p>
        <p className="text-sm text-zinc-500">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-11 h-6 rounded-full transition ${
          enabled ? 'bg-emerald-500' : 'bg-zinc-700'
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
            enabled ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  )
}
