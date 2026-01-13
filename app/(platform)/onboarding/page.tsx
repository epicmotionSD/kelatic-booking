'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, 
  Users, 
  MessageSquare, 
  Calendar, 
  ArrowRight, 
  CheckCircle,
  Zap,
  TrendingUp,
  Clock,
  AlertTriangle
} from 'lucide-react';

type Step = 'audit' | 'leaks' | 'estimate' | 'sprint' | 'complete';

interface BusinessData {
  name: string;
  slug: string;
  email: string;
  phone: string;
  businessType: string;
  city: string;
  state: string;
  timezone: string;
  // Revenue audit questions
  monthlyClients: string;
  averageTicket: string;
  repeatRate: string;
  currentSystem: string;
  biggestPain: string[];
  // Contact preferences
  contactMethod: string;
}

const businessTypes = [
  { value: 'salon', label: 'Hair Salon', icon: '💇' },
  { value: 'barbershop', label: 'Barbershop', icon: '💈' },
  { value: 'spa', label: 'Spa & Wellness', icon: '🧖' },
  { value: 'nails', label: 'Nail Salon', icon: '💅' },
  { value: 'lashes', label: 'Lash Studio', icon: '👁️' },
  { value: 'other', label: 'Other Beauty', icon: '✨' },
];

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time' },
  { value: 'America/Chicago', label: 'Central Time' },
  { value: 'America/Denver', label: 'Mountain Time' },
  { value: 'America/Los_Angeles', label: 'Pacific Time' },
];

const currentSystems = [
  { value: 'square', label: 'Square Appointments' },
  { value: 'vagaro', label: 'Vagaro' },
  { value: 'fresha', label: 'Fresha' },
  { value: 'acuity', label: 'Acuity/Squarespace' },
  { value: 'boulevard', label: 'Boulevard' },
  { value: 'dms', label: 'DMs Only (No System)' },
  { value: 'other', label: 'Other' },
];

const painPoints = [
  { value: 'ghosts', label: 'Clients disappear after 1-2 visits', icon: Users },
  { value: 'dms', label: 'DMs go unanswered or drop off', icon: MessageSquare },
  { value: 'cancellations', label: 'Last-minute cancellations hurt', icon: Clock },
  { value: 'notime', label: 'No time to follow up with everyone', icon: Calendar },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('audit');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BusinessData>({
    name: '',
    slug: '',
    email: '',
    phone: '',
    businessType: 'salon',
    city: '',
    state: '',
    timezone: 'America/Chicago',
    monthlyClients: '',
    averageTicket: '',
    repeatRate: '',
    currentSystem: '',
    biggestPain: [],
    contactMethod: 'email',
  });

  // Calculate estimated revenue leak
  const calculateLeak = () => {
    const clients = parseInt(data.monthlyClients) || 100;
    const ticket = parseInt(data.averageTicket) || 75;
    const repeatRate = parseInt(data.repeatRate) || 30;
    const churnRate = 100 - repeatRate;
    
    // Lost clients per month * ticket = monthly leak
    const lostClients = Math.round(clients * (churnRate / 100));
    const monthlyLeak = lostClients * ticket;
    
    return {
      lostClients,
      monthlyLeak,
      yearlyLeak: monthlyLeak * 12,
      recoverableMonthly: Math.round(monthlyLeak * 0.35), // 35% recoverable
    };
  };

  const updateData = (field: keyof BusinessData, value: string | string[]) => {
    setData((prev) => ({ ...prev, [field]: value }));

    if (field === 'name') {
      const slug = (value as string)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setData((prev) => ({ ...prev, slug }));
    }
  };

  const togglePain = (pain: string) => {
    setData((prev) => ({
      ...prev,
      biggestPain: prev.biggestPain.includes(pain)
        ? prev.biggestPain.filter((p) => p !== pain)
        : [...prev.biggestPain, pain],
    }));
  };

  const steps: { key: Step; label: string }[] = [
    { key: 'audit', label: 'Your Business' },
    { key: 'leaks', label: 'Revenue Leaks' },
    { key: 'estimate', label: 'Your Estimate' },
    { key: 'sprint', label: 'Start Sprint' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === step);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          // Map to expected API fields
          address: '',
          zip: '',
          primaryColor: '#10b981',
          secondaryColor: '#06b6d4',
          tagline: '',
          instagramHandle: '',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create business');
      }

      setStep('complete');
    } catch (error) {
      console.error('Onboarding error:', error);
      alert('Something went wrong. Please try again or contact hey@x3o.ai');
    } finally {
      setLoading(false);
    }
  };

  const goToNext = () => {
    const stepOrder: Step[] = ['audit', 'leaks', 'estimate', 'sprint', 'complete'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex < stepOrder.length - 1) {
      setStep(stepOrder[currentIndex + 1]);
    }
  };

  const goToPrev = () => {
    const stepOrder: Step[] = ['audit', 'leaks', 'estimate', 'sprint', 'complete'];
    const currentIndex = stepOrder.indexOf(step);
    if (currentIndex > 0) {
      setStep(stepOrder[currentIndex - 1]);
    }
  };

  const leak = calculateLeak();

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <div className="border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center font-bold">
              x3
            </div>
            <div>
              <h1 className="text-xl font-bold">7-Day Revenue Sprint</h1>
              <p className="text-sm text-zinc-500">Let's find your revenue leaks</p>
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
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-zinc-500'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index < currentStepIndex 
                      ? 'bg-emerald-500 text-white' 
                      : index === currentStepIndex 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500' 
                        : 'bg-zinc-800 text-zinc-500'
                  }`}>
                    {index < currentStepIndex ? '✓' : index + 1}
                  </span>
                  <span className="hidden sm:inline text-sm font-medium">{s.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-2 ${
                      index < currentStepIndex ? 'bg-emerald-500' : 'bg-zinc-700'
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
        {/* Step 1: Business Audit */}
        {step === 'audit' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Let's audit your revenue</h2>
              <p className="text-zinc-400">First, tell us about your business so we can find your leaks.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Business Name *</label>
                <input
                  type="text"
                  value={data.name}
                  onChange={(e) => updateData('name', e.target.value)}
                  placeholder="e.g., Bella's Hair Studio"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">What type of business?</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {businessTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => updateData('businessType', type.value)}
                      className={`p-4 rounded-lg border transition text-left ${
                        data.businessType === type.value
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
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
                  <label className="block text-sm font-medium mb-2">Your Email *</label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => updateData('email', e.target.value)}
                    placeholder="you@email.com"
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone (for sprint updates)</label>
                  <input
                    type="tel"
                    value={data.phone}
                    onChange={(e) => updateData('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">City</label>
                  <input
                    type="text"
                    value={data.city}
                    onChange={(e) => updateData('city', e.target.value)}
                    placeholder="Atlanta"
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">State</label>
                  <input
                    type="text"
                    value={data.state}
                    onChange={(e) => updateData('state', e.target.value)}
                    placeholder="GA"
                    className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" id="timezone-label">Timezone</label>
                <select
                  value={data.timezone}
                  onChange={(e) => updateData('timezone', e.target.value)}
                  aria-labelledby="timezone-label"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-emerald-500 transition"
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

        {/* Step 2: Revenue Leaks */}
        {step === 'leaks' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Where are you losing money?</h2>
              <p className="text-zinc-400">Help us understand your current situation.</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2" id="monthly-clients-label">How many clients do you see per month?</label>
                <select
                  value={data.monthlyClients}
                  onChange={(e) => updateData('monthlyClients', e.target.value)}
                  aria-labelledby="monthly-clients-label"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="">Select...</option>
                  <option value="30">Less than 50</option>
                  <option value="75">50-100</option>
                  <option value="150">100-200</option>
                  <option value="300">200-400</option>
                  <option value="500">400+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" id="avg-ticket-label">What's your average service price?</label>
                <select
                  value={data.averageTicket}
                  onChange={(e) => updateData('averageTicket', e.target.value)}
                  aria-labelledby="avg-ticket-label"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="">Select...</option>
                  <option value="35">Under $50</option>
                  <option value="65">$50-$80</option>
                  <option value="100">$80-$120</option>
                  <option value="150">$120-$180</option>
                  <option value="225">$180-$250</option>
                  <option value="350">$250+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" id="repeat-rate-label">What percent of clients come back within 8 weeks?</label>
                <select
                  value={data.repeatRate}
                  onChange={(e) => updateData('repeatRate', e.target.value)}
                  aria-labelledby="repeat-rate-label"
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-emerald-500 transition"
                >
                  <option value="">Select...</option>
                  <option value="20">Less than 25%</option>
                  <option value="35">25-40%</option>
                  <option value="50">40-60%</option>
                  <option value="70">60-80%</option>
                  <option value="85">80%+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">What booking system do you use now?</label>
                <div className="grid grid-cols-2 gap-3">
                  {currentSystems.map((system) => (
                    <button
                      key={system.value}
                      onClick={() => updateData('currentSystem', system.value)}
                      className={`p-3 rounded-lg border transition text-left text-sm ${
                        data.currentSystem === system.value
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {system.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-2">
                  ✓ Trinity works alongside your existing system—no migration needed
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">What's hurting your revenue most? (select all)</label>
                <div className="space-y-3">
                  {painPoints.map((pain) => {
                    const Icon = pain.icon;
                    const isSelected = data.biggestPain.includes(pain.value);
                    return (
                      <button
                        key={pain.value}
                        onClick={() => togglePain(pain.value)}
                        className={`w-full p-4 rounded-lg border transition text-left flex items-center gap-4 ${
                          isSelected
                            ? 'bg-red-500/10 border-red-500/50'
                            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-red-500/20' : 'bg-zinc-800'
                        }`}>
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-red-400' : 'text-zinc-400'}`} />
                        </div>
                        <span className={isSelected ? 'text-red-300' : 'text-zinc-300'}>{pain.label}</span>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-red-400 ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Revenue Estimate */}
        {step === 'estimate' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Your Revenue Leak Report</h2>
              <p className="text-zinc-400">Based on your numbers, here's what we found.</p>
            </div>

            {/* Big Number */}
            <div className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 rounded-2xl p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertTriangle className="w-6 h-6 text-red-400" />
                <span className="text-red-400 font-medium">Estimated Monthly Revenue Leak</span>
              </div>
              <div className="text-6xl font-bold text-red-400 mb-2">
                ${leak.monthlyLeak.toLocaleString()}
              </div>
              <p className="text-zinc-400">
                ~{leak.lostClients} clients not returning × ${data.averageTicket || 75} avg ticket
              </p>
            </div>

            {/* Breakdown */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <div className="text-sm text-zinc-500 mb-1">Yearly Impact</div>
                <div className="text-3xl font-bold text-red-400">${leak.yearlyLeak.toLocaleString()}</div>
                <p className="text-xs text-zinc-500 mt-1">Lost revenue per year</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
                <div className="text-sm text-emerald-400 mb-1">Recoverable</div>
                <div className="text-3xl font-bold text-emerald-400">${leak.recoverableMonthly.toLocaleString()}/mo</div>
                <p className="text-xs text-zinc-500 mt-1">What Trinity can bring back</p>
              </div>
            </div>

            {/* Pain Points Selected */}
            {data.biggestPain.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                <h3 className="font-semibold mb-4">Trinity will attack these leaks:</h3>
                <div className="space-y-3">
                  {data.biggestPain.map((pain) => {
                    const painInfo = painPoints.find((p) => p.value === pain);
                    if (!painInfo) return null;
                    const Icon = painInfo.icon;
                    return (
                      <div key={pain} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                          <Icon className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="text-zinc-300">{painInfo.label}</span>
                        <ArrowRight className="w-4 h-4 text-zinc-600" />
                        <span className="text-emerald-400 text-sm">
                          {pain === 'ghosts' && 'AI reactivation campaigns'}
                          {pain === 'dms' && '24/7 DM response & booking'}
                          {pain === 'cancellations' && 'Instant waitlist filling'}
                          {pain === 'notime' && 'Automated follow-ups'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Guarantee */}
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
              <div className="text-2xl">💰</div>
              <div>
                <h4 className="font-semibold text-emerald-400">Revenue Recovery Guarantee</h4>
                <p className="text-sm text-zinc-300">
                  If Trinity doesn't recover at least $500 in your 7-Day Sprint, you get a full refund.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Start Sprint */}
        {step === 'sprint' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">Start Your 7-Day Revenue Sprint</h2>
              <p className="text-zinc-400">Here's exactly what happens next.</p>
            </div>

            {/* Sprint Timeline */}
            <div className="space-y-4">
              {[
                { day: 'Today', title: 'Kickoff Call Scheduled', desc: 'We\'ll connect your systems and set up Trinity in 30 min.' },
                { day: 'Day 1-2', title: 'Database Analysis', desc: 'We identify your ghost clients and dead conversations.' },
                { day: 'Day 3-5', title: 'Trinity Goes Live', desc: 'AI starts reactivating clients and responding to DMs.' },
                { day: 'Day 6-7', title: 'Results & Strategy', desc: 'You see recovered revenue + recommendations for scale.' },
              ].map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-emerald-500 text-white' : 'bg-zinc-800 text-zinc-400'
                    }`}>
                      {index === 0 ? <Zap className="w-5 h-5" /> : index + 1}
                    </div>
                    {index < 3 && <div className="w-0.5 h-full bg-zinc-800 mt-2" />}
                  </div>
                  <div className="pb-6">
                    <div className="text-emerald-400 text-sm font-medium">{item.day}</div>
                    <h4 className="font-semibold">{item.title}</h4>
                    <p className="text-sm text-zinc-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Investment */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">7-Day Revenue Sprint</h3>
                  <p className="text-sm text-zinc-400">One-time investment</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-emerald-400">$1,500</div>
                  <div className="text-xs text-zinc-500">Money-back guarantee</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  'Full database analysis',
                  'Ghost client campaigns',
                  'Trinity AI (7 days)',
                  'Cancellation recovery',
                  'Revenue dashboard',
                  'Strategy call',
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preferred Contact */}
            <div>
              <label className="block text-sm font-medium mb-3">How should we reach you for kickoff?</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateData('contactMethod', 'email')}
                  className={`p-4 rounded-lg border transition ${
                    data.contactMethod === 'email'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-2xl mb-2">📧</div>
                  <div className="font-medium">Email</div>
                  <div className="text-xs text-zinc-500">{data.email || 'your@email.com'}</div>
                </button>
                <button
                  onClick={() => updateData('contactMethod', 'phone')}
                  className={`p-4 rounded-lg border transition ${
                    data.contactMethod === 'phone'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-2xl mb-2">📱</div>
                  <div className="font-medium">Phone/Text</div>
                  <div className="text-xs text-zinc-500">{data.phone || 'Add phone above'}</div>
                </button>
              </div>
            </div>

            {/* Fine Print */}
            <p className="text-xs text-zinc-500 text-center">
              After clicking "Start Sprint", you'll be redirected to secure checkout. 
              Your kickoff call will be scheduled within 24 hours.
            </p>
          </div>
        )}

        {/* Step 5: Complete */}
        {step === 'complete' && (
          <div className="text-center space-y-8">
            <div className="text-6xl">🚀</div>
            <div>
              <h2 className="text-2xl font-bold mb-2">You're In!</h2>
              <p className="text-zinc-400">
                We're preparing your Revenue Sprint for{' '}
                <span className="text-emerald-400 font-medium">{data.name}</span>
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                What Happens Next:
              </h3>
              <ul className="space-y-4">
                {[
                  { time: 'Within 1 hour', action: 'Check your email for kickoff call booking link' },
                  { time: 'On the call', action: 'We\'ll connect your systems (takes ~30 min)' },
                  { time: 'Day 1', action: 'Trinity starts analyzing your client database' },
                  { time: 'Day 3', action: 'First reactivation messages go out' },
                  { time: 'Day 7', action: 'You get your Revenue Recovery Report' },
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 text-xs font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </div>
                    <div>
                      <span className="text-emerald-400 text-sm font-medium">{item.time}</span>
                      <p className="text-zinc-300">{item.action}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
              <p className="text-sm text-zinc-300">
                Questions? Reply to your confirmation email or text us at{' '}
                <span className="text-emerald-400 font-medium">(555) 123-4567</span>
              </p>
            </div>

            <button
              onClick={() => window.location.href = `mailto:hey@x3o.ai?subject=Sprint%20Kickoff%20-%20${data.name}`}
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 px-8 py-3 rounded-lg font-semibold transition"
            >
              Contact Us Now
            </button>
          </div>
        )}

        {/* Navigation */}
        {step !== 'complete' && (
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-zinc-800">
            <button
              onClick={goToPrev}
              disabled={step === 'audit'}
              className={`px-6 py-3 rounded-lg font-medium transition ${
                step === 'audit'
                  ? 'text-zinc-600 cursor-not-allowed'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              Back
            </button>
            {step === 'sprint' ? (
              <button
                onClick={handleSubmit}
                disabled={loading || !data.name || !data.email}
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 px-8 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  'Processing...'
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Start Sprint — $1,500
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={goToNext}
                disabled={step === 'audit' && (!data.name || !data.email)}
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 px-8 py-3 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {step === 'leaks' ? 'See My Revenue Leak' : 'Continue'}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
