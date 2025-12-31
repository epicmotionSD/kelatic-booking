'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const HAIR_TYPES = [
  '1A - Straight (Fine)',
  '1B - Straight (Medium)',
  '1C - Straight (Coarse)',
  '2A - Wavy (Fine)',
  '2B - Wavy (Medium)',
  '2C - Wavy (Coarse)',
  '3A - Curly (Loose)',
  '3B - Curly (Medium)',
  '3C - Curly (Tight)',
  '4A - Coily (Soft)',
  '4B - Coily (Wiry)',
  '4C - Coily (Tight)',
  'Locs',
];

const TEXTURES = ['Fine', 'Medium', 'Coarse', 'Mixed'];

const COMMON_ALLERGIES = [
  'Latex',
  'Ammonia',
  'PPD (Hair Dye)',
  'Fragrance',
  'Formaldehyde',
  'Sulfates',
  'Parabens',
  'Gluten',
];

const REFERRAL_SOURCES = [
  'Instagram',
  'Facebook',
  'Google Search',
  'Friend/Family',
  'Walk-in',
  'Yelp',
  'TikTok',
  'Other',
];

const PREFERRED_TIMES = [
  { value: 'morning', label: 'Morning (9am-12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm-4pm)' },
  { value: 'evening', label: 'Evening (4pm-7pm)' },
];

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    hair_type: '',
    texture: '',
    allergies: [] as string[],
    notes: '',
    // New fields
    birthday: '',
    zip_code: '',
    preferred_contact: 'both' as 'sms' | 'email' | 'both',
    sms_opt_in: true,
    marketing_opt_in: false,
    referral_source: '',
    preferred_times: [] as string[],
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function toggleAllergy(allergy: string) {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.includes(allergy)
        ? prev.allergies.filter((a) => a !== allergy)
        : [...prev.allergies, allergy],
    }));
  }

  function togglePreferredTime(time: string) {
    setFormData((prev) => ({
      ...prev,
      preferred_times: prev.preferred_times.includes(time)
        ? prev.preferred_times.filter((t) => t !== time)
        : [...prev.preferred_times, time],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate required fields
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('First and last name are required');
      setLoading(false);
      return;
    }

    if (!formData.email.trim() && !formData.phone.trim()) {
      setError('Either email or phone is required');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          hair_type: formData.hair_type || null,
          texture: formData.texture || null,
          allergies: formData.allergies.length > 0 ? formData.allergies : null,
          notes: formData.notes.trim() || null,
          // New fields
          birthday: formData.birthday || null,
          zip_code: formData.zip_code.trim() || null,
          preferred_contact: formData.preferred_contact,
          sms_opt_in: formData.sms_opt_in,
          marketing_opt_in: formData.marketing_opt_in,
          referral_source: formData.referral_source || null,
          preferred_times: formData.preferred_times.length > 0 ? formData.preferred_times : null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create client');
      }

      // Redirect to clients list or the new client's page
      router.push('/admin/clients');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/clients"
          className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Add New Client</h1>
          <p className="text-white/50">Create a new client profile</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Basic Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                First Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
                placeholder="Enter first name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Last Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
                placeholder="Enter last name"
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Contact Information</h2>
          <p className="text-sm text-white/50 mb-4">
            At least one contact method is required
          </p>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
                placeholder="client@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
                placeholder="(713) 555-0123"
              />
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Birthday
              </label>
              <input
                type="date"
                name="birthday"
                value={formData.birthday}
                onChange={handleChange}
                title="Birthday"
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Zip Code
              </label>
              <input
                type="text"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
                placeholder="77001"
                maxLength={10}
              />
            </div>
          </div>
        </div>

        {/* Communication Preferences */}
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Communication Preferences</h2>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Preferred Contact Method
              </label>
              <select
                name="preferred_contact"
                value={formData.preferred_contact}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
              >
                <option value="both">Both SMS & Email</option>
                <option value="sms">SMS Only</option>
                <option value="email">Email Only</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                How did they find us?
              </label>
              <select
                name="referral_source"
                value={formData.referral_source}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
              >
                <option value="">Select source</option>
                {REFERRAL_SOURCES.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.sms_opt_in}
                onChange={(e) => setFormData((prev) => ({ ...prev, sms_opt_in: e.target.checked }))}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-amber-400 focus:ring-amber-400/50"
              />
              <div>
                <p className="text-white font-medium">SMS Notifications</p>
                <p className="text-sm text-white/50">Receive appointment reminders via text</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.marketing_opt_in}
                onChange={(e) => setFormData((prev) => ({ ...prev, marketing_opt_in: e.target.checked }))}
                className="w-5 h-5 rounded border-white/20 bg-white/5 text-amber-400 focus:ring-amber-400/50"
              />
              <div>
                <p className="text-white font-medium">Marketing Messages</p>
                <p className="text-sm text-white/50">Receive promos, specials, and updates</p>
              </div>
            </label>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-white/70 mb-2">
              Preferred Appointment Times
            </label>
            <div className="flex flex-wrap gap-2">
              {PREFERRED_TIMES.map((time) => (
                <button
                  key={time.value}
                  type="button"
                  onClick={() => togglePreferredTime(time.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    formData.preferred_times.includes(time.value)
                      ? 'bg-amber-400/20 text-amber-400 border border-amber-400/30'
                      : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {time.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hair Profile */}
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Hair Profile</h2>
          <p className="text-sm text-white/50 mb-4">
            Optional - helps stylists prepare for appointments
          </p>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Hair Type
              </label>
              <select
                name="hair_type"
                value={formData.hair_type}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
              >
                <option value="">Select hair type</option>
                {HAIR_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Texture
              </label>
              <select
                name="texture"
                value={formData.texture}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
              >
                <option value="">Select texture</option>
                {TEXTURES.map((texture) => (
                  <option key={texture} value={texture}>
                    {texture}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Allergies */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Allergies / Sensitivities
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_ALLERGIES.map((allergy) => (
                <button
                  key={allergy}
                  type="button"
                  onClick={() => toggleAllergy(allergy)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    formData.allergies.includes(allergy)
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {formData.allergies.includes(allergy) && (
                    <span className="mr-1">!</span>
                  )}
                  {allergy}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Additional Notes</h2>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50 resize-none"
            placeholder="Any special notes about this client (preferences, reminders, etc.)"
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Creating Client...
              </span>
            ) : (
              'Create Client'
            )}
          </button>
          <Link
            href="/admin/clients"
            className="px-6 py-3 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
