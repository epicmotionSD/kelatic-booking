'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MessageSquare,
  Mail,
  CheckCircle,
  Clock,
  DollarSign,
  Shield,
  Zap,
  ArrowLeft,
  Loader2,
  Building2,
  Globe,
  MapPin,
  Phone,
  Hash,
} from 'lucide-react'

interface A2PFormData {
  legalName: string
  ein: string
  businessType: 'llc' | 'corporation' | 'sole_proprietor' | 'nonprofit' | ''
  website: string
  street: string
  city: string
  state: string
  zip: string
  vertical: string
  monthlyVolume: number
  contactName: string
  contactPhone: string
  contactEmail: string
}

export default function UpgradeSMSPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState<A2PFormData>({
    legalName: '',
    ein: '',
    businessType: '',
    website: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    vertical: 'professional_services',
    monthlyVolume: 1000,
    contactName: '',
    contactPhone: '',
    contactEmail: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/sms/a2p-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) throw new Error('Submission failed')

      setSubmitted(true)
    } catch (error) {
      alert('Failed to submit request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white">
        <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <button
              onClick={() => router.push('/dashboard/settings')}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Settings
            </button>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500/10 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Request Submitted!</h1>
          <p className="text-xl text-zinc-400 mb-8">
            We'll activate SMS for your account within 7 days.
          </p>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-left mb-8">
            <h2 className="font-semibold mb-4">What happens next:</h2>
            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </span>
                <div>
                  <p className="font-medium">Day 1-3: Brand Registration</p>
                  <p className="text-sm text-zinc-400">
                    We register your business with The Campaign Registry
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </span>
                <div>
                  <p className="font-medium">Day 3-7: Carrier Approval</p>
                  <p className="text-sm text-zinc-400">
                    Carriers review and approve your messaging campaign
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </span>
                <div>
                  <p className="font-medium">Day 7: SMS Activated</p>
                  <p className="text-sm text-zinc-400">
                    You'll receive an email when SMS is ready. Create campaigns with SMS + Email!
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <button
            onClick={() => router.push('/dashboard/campaigns')}
            className="px-6 py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition"
          >
            Continue with Email Campaigns
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </button>
          <h1 className="text-2xl font-bold">Add SMS to Your Campaigns</h1>
          <p className="text-zinc-400">Reach customers via text message - ready in 7 days</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Feature Comparison */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-8 h-8 text-cyan-400" />
              <div>
                <h3 className="font-semibold">Email (Active)</h3>
                <p className="text-sm text-emerald-400">Ready now</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                90%+ deliverability
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Rich content (images, styling)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Open & click tracking
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                $0.0001 per email
              </li>
            </ul>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <MessageSquare className="w-8 h-8 text-emerald-400" />
              <div>
                <h3 className="font-semibold">SMS (Upgrade)</h3>
                <p className="text-sm text-emerald-400">7 days to activate</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-zinc-400">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                98%+ open rate
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Immediate delivery
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Higher response rate
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                $0.0079 per SMS
              </li>
            </ul>
          </div>
        </div>

        {/* Benefits Banner */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Why Add SMS?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <Zap className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Faster Response</h3>
                <p className="text-sm text-zinc-400">
                  Most people read texts within 3 minutes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Higher ROI</h3>
                <p className="text-sm text-zinc-400">
                  SMS converts 3-5x better than email
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">We Handle Compliance</h3>
                <p className="text-sm text-zinc-400">
                  Full A2P 10DLC registration included
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Setup Timeline
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center font-bold">
                  1
                </div>
                <div className="w-0.5 h-full bg-zinc-800 mt-2" />
              </div>
              <div className="pb-6">
                <p className="font-medium">Submit Form (5 minutes)</p>
                <p className="text-sm text-zinc-400">
                  Provide business info below
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center font-bold">
                  2
                </div>
                <div className="w-0.5 h-full bg-zinc-800 mt-2" />
              </div>
              <div className="pb-6">
                <p className="font-medium">We Register Your Brand (Day 1-3)</p>
                <p className="text-sm text-zinc-400">
                  Submit to The Campaign Registry on your behalf
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center font-bold">
                  3
                </div>
                <div className="w-0.5 h-full bg-zinc-800 mt-2" />
              </div>
              <div className="pb-6">
                <p className="font-medium">Carrier Approval (Day 3-7)</p>
                <p className="text-sm text-zinc-400">
                  Carriers review your messaging use case
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">SMS Activated (Day 7)</p>
                <p className="text-sm text-zinc-400">
                  Start sending SMS campaigns immediately
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* A2P Registration Form */}
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-6">Business Information</h2>

          <div className="space-y-6">
            {/* Legal Business Name */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Legal Business Name *
              </label>
              <input
                type="text"
                required
                value={formData.legalName}
                onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                placeholder="Kelatic Hair Lounge LLC"
              />
              <p className="text-xs text-zinc-500 mt-1">
                Must match your official business registration
              </p>
            </div>

            {/* EIN / Tax ID */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Hash className="w-4 h-4 inline mr-2" />
                EIN / Tax ID *
              </label>
              <input
                type="text"
                required
                value={formData.ein}
                onChange={(e) => setFormData({ ...formData, ein: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                placeholder="12-3456789"
              />
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Business Type *</label>
              <select
                required
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value as A2PFormData['businessType'] })}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select...</option>
                <option value="llc">LLC</option>
                <option value="corporation">Corporation</option>
                <option value="sole_proprietor">Sole Proprietor</option>
                <option value="nonprofit">Non-Profit</option>
              </select>
            </div>

            {/* Website */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Globe className="w-4 h-4 inline mr-2" />
                Business Website *
              </label>
              <input
                type="url"
                required
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                placeholder="https://kelatic.com"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Business Address *
              </label>
              <input
                type="text"
                required
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 mb-2"
                placeholder="Street Address"
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="City"
                />
                <input
                  type="text"
                  required
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="State"
                  maxLength={2}
                />
                <input
                  type="text"
                  required
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="ZIP"
                />
              </div>
            </div>

            {/* Industry Vertical */}
            <div>
              <label className="block text-sm font-medium mb-2">Industry Vertical *</label>
              <select
                required
                value={formData.vertical}
                onChange={(e) => setFormData({ ...formData, vertical: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="professional_services">Professional Services</option>
                <option value="healthcare">Healthcare</option>
                <option value="beauty_wellness">Beauty & Wellness</option>
                <option value="retail">Retail</option>
                <option value="hospitality">Hospitality</option>
                <option value="automotive">Automotive</option>
                <option value="real_estate">Real Estate</option>
                <option value="education">Education</option>
                <option value="nonprofit">Non-Profit</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Monthly Volume */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Estimated Monthly SMS Volume *
              </label>
              <select
                required
                value={formData.monthlyVolume}
                onChange={(e) => setFormData({ ...formData, monthlyVolume: Number(e.target.value) })}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                <option value={500}>500 messages/month</option>
                <option value={1000}>1,000 messages/month</option>
                <option value={2500}>2,500 messages/month</option>
                <option value={5000}>5,000 messages/month</option>
                <option value={10000}>10,000+ messages/month</option>
              </select>
            </div>

            {/* Contact Info */}
            <div className="border-t border-zinc-800 pt-6">
              <h3 className="font-semibold mb-4">Primary Contact</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  required
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Full Name"
                />
                <input
                  type="tel"
                  required
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Phone Number"
                />
                <input
                  type="email"
                  required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Email"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 pt-6 border-t border-zinc-800">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <MessageSquare className="w-5 h-5" />
                  Request SMS Activation
                </>
              )}
            </button>
            <p className="text-center text-sm text-zinc-500 mt-4">
              Free setup • SMS ready in 7 days • No commitment
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}
