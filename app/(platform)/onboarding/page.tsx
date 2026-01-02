'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Step = 'business' | 'branding' | 'services' | 'integrations' | 'board' | 'complete';

interface BusinessData {
  name: string;
  slug: string;
  email: string;
  phone: string;
  businessType: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  timezone: string;
  primaryColor: string;
  secondaryColor: string;
  tagline: string;
  instagramHandle: string;
}

const businessTypes = [
  { value: 'salon', label: 'Hair Salon', icon: '💇' },
  { value: 'barbershop', label: 'Barbershop', icon: '💈' },
  { value: 'spa', label: 'Spa & Wellness', icon: '🧖' },
  { value: 'nails', label: 'Nail Salon', icon: '💅' },
  { value: 'lashes', label: 'Lash Studio', icon: '👁️' },
  { value: 'other', label: 'Other', icon: '✨' },
];

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
];

const colorPresets = [
  { primary: '#f59e0b', secondary: '#eab308', name: 'Gold' },
  { primary: '#8b5cf6', secondary: '#a78bfa', name: 'Violet' },
  { primary: '#ec4899', secondary: '#f472b6', name: 'Pink' },
  { primary: '#10b981', secondary: '#34d399', name: 'Emerald' },
  { primary: '#3b82f6', secondary: '#60a5fa', name: 'Blue' },
  { primary: '#000000', secondary: '#374151', name: 'Black' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('business');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BusinessData>({
    name: '',
    slug: '',
    email: '',
    phone: '',
    businessType: 'salon',
    address: '',
    city: '',
    state: '',
    zip: '',
    timezone: 'America/Chicago',
    primaryColor: '#8b5cf6',
    secondaryColor: '#a78bfa',
    tagline: '',
    instagramHandle: '',
  });

  const updateData = (field: keyof BusinessData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));

    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setData((prev) => ({ ...prev, slug }));
    }
  };

  const steps: { key: Step; label: string; icon: string }[] = [
    { key: 'business', label: 'Business Info', icon: '🏪' },
    { key: 'branding', label: 'Branding', icon: '🎨' },
    { key: 'services', label: 'Services', icon: '📋' },
    { key: 'integrations', label: 'Integrations', icon: '🔗' },
    { key: 'board', label: 'AI Board', icon: '🤖' },
    { key: 'complete', label: 'Complete', icon: '🎉' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create business');
      }

      setStep('complete');
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Failed to create business. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goToNext = () => {
    const stepOrder: Step[] = ['business', 'branding', 'services', 'integrations', 'board', 'complete'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    }
  };

  const goToPrev = () => {
    const stepOrder: Step[] = ['business', 'branding', 'services', 'integrations', 'board', 'complete'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center font-bold">
              x3
            </div>
            <div>
              <h1 className="text-xl font-bold">Set Up Your Platform</h1>
              <p className="text-sm text-zinc-500">Let's get your booking system ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((s, index) => (
              <div key={s.key} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${
                    index <= currentStepIndex
                      ? 'bg-violet-500/10 text-violet-400'
                      : 'text-zinc-500'
                  }`}
                >
                  <span>{s.icon}</span>
                  <span className="hidden sm:inline text-sm font-medium">{s.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-2 ${
                      index < currentStepIndex ? 'bg-violet-500' : 'bg-zinc-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Step 1: Business Info */}
        {step === 'business' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Tell us about your business</h2>
              <p className="text-zinc-400">This information will appear on your booking site.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Business Name *</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => updateData('name', e.target.value)}
                  placeholder="e.g., Bella's Hair Studio"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-violet-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Your URL</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={data.slug}
                    onChange={(e) => updateData('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="your-business"
                    className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-l-lg focus:outline-none focus:border-violet-500 transition"
                  />
                  <span className="px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-r-lg text-zinc-400">
                    .x3o.ai
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Business Type *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {businessTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => updateData('businessType', type.value)}
                      className={`p-4 rounded-lg border transition text-left ${
                        data.businessType === type.value
                          ? 'bg-violet-500/10 border-violet-500 text-violet-400'
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-2xl">{type.icon}</span>
                      <p className="mt-2 font-medium text-sm">{type.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => updateData('email', e.target.value)}
                    placeholder="hello@yourbusiness.com"
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-violet-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={data.phone}
                    onChange={(e) => updateData('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-violet-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Address</label>
                <input
                  type="text"
                  value={data.address}
                  onChange={(e) => updateData('address', e.target.value)}
                  placeholder="123 Main St"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-violet-500 transition mb-3"
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={data.city}
                    onChange={(e) => updateData('city', e.target.value)}
                    placeholder="City"
                    className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-violet-500 transition"
                  />
                  <input
                    type="text"
                    value={data.state}
                    onChange={(e) => updateData('state', e.target.value)}
                    placeholder="State"
                    className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-violet-500 transition"
                  />
                  <input
                    type="text"
                    value={data.zip}
                    onChange={(e) => updateData('zip', e.target.value)}
                    placeholder="ZIP"
                    className="px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-violet-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Timezone</label>
                <select
                  value={data.timezone}
                  onChange={(e) => updateData('timezone', e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-violet-500 transition"
                >
                  {timezones.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Branding */}
        {step === 'branding' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Customize Your Brand</h2>
              <p className="text-zinc-400">Make it yours with custom colors and messaging.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Brand Colors</label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => {
                        updateData('primaryColor', preset.primary);
                        updateData('secondaryColor', preset.secondary);
                      }}
                      className={`aspect-square rounded-xl border-2 transition ${
                        data.primaryColor === preset.primary
                          ? 'border-white'
                          : 'border-transparent hover:border-zinc-600'
                      }`}
                      style={{
                        background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)`,
                      }}
                      title={preset.name}
                    />
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs text-zinc-500 mb-1">Primary</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={data.primaryColor}
                        onChange={(e) => updateData('primaryColor', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={data.primaryColor}
                        onChange={(e) => updateData('primaryColor', e.target.value)}
                        className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-zinc-500 mb-1">Secondary</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={data.secondaryColor}
                        onChange={(e) => updateData('secondaryColor', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={data.secondaryColor}
                        onChange={(e) => updateData('secondaryColor', e.target.value)}
                        className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tagline</label>
                <input
                  type="text"
                  value={data.tagline}
                  onChange={(e) => updateData('tagline', e.target.value)}
                  placeholder="e.g., Where beauty meets artistry"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-violet-500 transition"
                />
                <p className="text-xs text-zinc-500 mt-1">Appears on your booking page and emails</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Instagram Handle</label>
                <div className="flex items-center">
                  <span className="px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-l-lg text-zinc-400">
                    @
                  </span>
                  <input
                    type="text"
                    value={data.instagramHandle}
                    onChange={(e) => updateData('instagramHandle', e.target.value.replace('@', ''))}
                    placeholder="yourbusiness"
                    className="flex-1 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-r-lg focus:outline-none focus:border-violet-500 transition"
                  />
                </div>
              </div>

              {/* Preview */}
              <div>
                <label className="block text-sm font-medium mb-3">Preview</label>
                <div
                  className="rounded-xl border border-zinc-800 overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${data.primaryColor}20 0%, ${data.secondaryColor}10 100%)`,
                  }}
                >
                  <div
                    className="p-6 text-center"
                    style={{
                      borderBottom: `2px solid ${data.primaryColor}`,
                    }}
                  >
                    <h3 className="text-xl font-bold">{data.name || 'Your Business'}</h3>
                    {data.tagline && <p className="text-sm text-zinc-400 mt-1">{data.tagline}</p>}
                  </div>
                  <div className="p-4 text-center">
                    <button
                      className="px-6 py-2 rounded-full font-medium"
                      style={{
                        background: `linear-gradient(135deg, ${data.primaryColor} 0%, ${data.secondaryColor} 100%)`,
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Services */}
        {step === 'services' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Add Your Services</h2>
              <p className="text-zinc-400">You can add more services later from your dashboard.</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="font-semibold mb-2">Services Setup</h3>
              <p className="text-zinc-400 text-sm mb-4">
                We'll set up a few starter services for you based on your business type.
                You can customize them in your dashboard.
              </p>
              <div className="inline-flex items-center gap-2 text-violet-400 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                </svg>
                Default services will be created for {businessTypes.find((t) => t.value === data.businessType)?.label || 'your business'}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Integrations */}
        {step === 'integrations' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Connect Your Tools</h2>
              <p className="text-zinc-400">Optional integrations to supercharge your business.</p>
            </div>

            <div className="space-y-4">
              {[
                {
                  name: 'Stripe',
                  description: 'Accept payments online and in-person',
                  icon: '💳',
                  status: 'Set up after launch',
                },
                {
                  name: 'SendGrid',
                  description: 'Send branded email notifications',
                  icon: '📧',
                  status: 'Uses platform default',
                },
                {
                  name: 'Twilio',
                  description: 'SMS reminders and notifications',
                  icon: '📱',
                  status: 'Uses platform default',
                },
              ].map((integration) => (
                <div
                  key={integration.name}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">{integration.icon}</div>
                    <div>
                      <h3 className="font-medium">{integration.name}</h3>
                      <p className="text-sm text-zinc-400">{integration.description}</p>
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500 bg-zinc-800 px-3 py-1 rounded-full">
                    {integration.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
              <p className="text-sm text-zinc-300">
                Don't worry! You can connect all integrations from your dashboard after setup.
                Your platform will work with our default settings until then.
              </p>
            </div>
          </div>
        )}

        {/* Step 5: AI Board of Directors */}
        {step === 'board' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Meet Your AI Board of Directors</h2>
              <p className="text-zinc-400">Four AI agents work 24/7 to grow and optimize your business.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                {
                  name: 'Atlas',
                  role: 'CEO',
                  icon: '🎯',
                  color: '#22c55e',
                  description: 'Strategic planning, task delegation, and decision approval.',
                },
                {
                  name: 'Nova',
                  role: 'CTO',
                  icon: '🔧',
                  color: '#3b82f6',
                  description: 'Platform management, template deployment, and tech operations.',
                },
                {
                  name: 'Pulse',
                  role: 'CMO',
                  icon: '📈',
                  color: '#a855f7',
                  description: 'Growth marketing, campaign optimization, and lead generation.',
                },
                {
                  name: 'Apex',
                  role: 'CFO',
                  icon: '💰',
                  color: '#f59e0b',
                  description: 'Revenue analytics, subscription management, and forecasting.',
                },
              ].map((agent) => (
                <div
                  key={agent.name}
                  className="bg-zinc-900 border rounded-xl p-5 transition-all hover:scale-[1.02]"
                  style={{ borderColor: `${agent.color}30` }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{ backgroundColor: `${agent.color}20` }}
                    >
                      {agent.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{agent.name}</h3>
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${agent.color}20`, color: agent.color }}
                      >
                        {agent.role}
                      </span>
                    </div>
                  </div>
                  <p className="text-zinc-400 text-sm">{agent.description}</p>
                </div>
              ))}
            </div>

            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <div className="text-2xl">✨</div>
                <div>
                  <h4 className="font-semibold text-cyan-400 mb-1">Always Working for You</h4>
                  <p className="text-sm text-zinc-300">
                    Your AI Board of Directors monitors your business 24/7, making smart decisions
                    and sending you approval requests for critical actions. Access the Command Center
                    from your dashboard anytime.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === 'complete' && (
          <div className="text-center space-y-8">
            <div className="text-6xl">🎉</div>
            <div>
              <h2 className="text-2xl font-bold mb-2">You're All Set!</h2>
              <p className="text-zinc-400">
                Your platform is ready at{' '}
                <span className="text-violet-400 font-medium">{data.slug}.x3o.ai</span>
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left">
              <h3 className="font-semibold mb-4">Next Steps:</h3>
              <ul className="space-y-3">
                {[
                  'Add your team members',
                  'Customize your services and pricing',
                  'Connect Stripe to accept payments',
                  'Upload your logo',
                  'Share your booking link!',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-violet-500/20 rounded-full flex items-center justify-center text-violet-400 text-sm font-medium">
                      {index + 1}
                    </div>
                    <span className="text-zinc-300">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => window.location.href = `https://${data.slug}.x3o.ai/admin`}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-8 py-3 rounded-lg font-semibold transition"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {/* Navigation */}
        {step !== 'complete' && (
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-zinc-800">
            <button
              onClick={goToPrev}
              disabled={step === 'business'}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                step === 'business'
                  ? 'text-zinc-600 cursor-not-allowed'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              Back
            </button>
            {step === 'board' ? (
              <button
                onClick={handleSubmit}
                disabled={loading || !data.name || !data.slug || !data.email}
                className="bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 px-8 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Launch My Platform'}
              </button>
            ) : (
              <button
                onClick={goToNext}
                disabled={step === 'business' && (!data.name || !data.slug || !data.email)}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-8 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
