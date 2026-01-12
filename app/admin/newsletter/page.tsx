'use client';

import { useState, useEffect } from 'react';
import { Mail, Send, Users, TrendingUp, Clock, CheckCircle, AlertCircle, Sparkles, X } from 'lucide-react';

interface Stats {
  totalSubscribers: number;
  totalUnsubscribed: number;
  sources: Record<string, number>;
}

interface Subscriber {
  id: string;
  email: string;
  first_name: string | null;
  source: string;
  created_at: string;
}

export default function NewsletterPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentSubscribers, setRecentSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);

  // Email form state
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [headline, setHeadline] = useState('');
  const [content, setContent] = useState('');
  const [ctaText, setCtaText] = useState('Book Now');
  const [ctaUrl, setCtaUrl] = useState('https://kelatic.com/book');

  // Send state
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // Trinity AI state
  const [showTrinityModal, setShowTrinityModal] = useState(false);
  const [trinityTopic, setTrinityTopic] = useState('');
  const [trinityTone, setTrinityTone] = useState<'professional' | 'casual' | 'playful' | 'inspiring'>('casual');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const res = await fetch('/api/admin/newsletter');
      const data = await res.json();
      setStats(data.stats);
      setRecentSubscribers(data.recentSubscribers || []);
    } catch (error) {
      console.error('Failed to load newsletter data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendTest() {
    if (!testEmail || !subject || !headline || !content) {
      setSendResult({ success: false, message: 'Please fill in all required fields and test email' });
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          previewText,
          headline,
          content,
          ctaText,
          ctaUrl,
          testEmail,
        }),
      });

      const data = await res.json();
      setSendResult({
        success: res.ok,
        message: data.message || data.error,
      });
    } catch (error) {
      setSendResult({ success: false, message: 'Failed to send test email' });
    } finally {
      setSending(false);
    }
  }

  async function handleSendAll() {
    if (!subject || !headline || !content) {
      setSendResult({ success: false, message: 'Please fill in all required fields' });
      return;
    }

    if (!confirm(`Are you sure you want to send this newsletter to ${stats?.totalSubscribers || 0} subscribers?`)) {
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          previewText,
          headline,
          content,
          ctaText,
          ctaUrl,
        }),
      });

      const data = await res.json();
      setSendResult({
        success: res.ok,
        message: data.message || data.error,
      });

      if (res.ok) {
        // Clear form on success
        setSubject('');
        setPreviewText('');
        setHeadline('');
        setContent('');
      }
    } catch (error) {
      setSendResult({ success: false, message: 'Failed to send newsletter' });
    } finally {
      setSending(false);
    }
  }

  async function handleTrinityGenerate() {
    if (!trinityTopic.trim()) {
      setGenerateError('Please describe what you want to create');
      return;
    }

    setGenerating(true);
    setGenerateError('');

    try {
      const res = await fetch('/api/trinity/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'newsletter',
          topic: trinityTopic,
          tone: trinityTone,
          additionalInstructions: 'Return ONLY valid JSON with no markdown code blocks or extra text.',
        }),
      });

      if (!res.ok) {
        throw new Error('Generation failed');
      }

      const data = await res.json();

      // Parse the JSON response
      let parsed;
      try {
        // Try to extract JSON if wrapped in code blocks
        let content = data.content;
        const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          content = jsonMatch[1] || jsonMatch[0];
        }
        parsed = JSON.parse(content);
      } catch {
        throw new Error('Failed to parse generated content');
      }

      // Populate the form fields
      if (parsed.subject) setSubject(parsed.subject);
      if (parsed.previewText) setPreviewText(parsed.previewText);
      if (parsed.headline) setHeadline(parsed.headline);
      if (parsed.content) setContent(parsed.content);
      if (parsed.ctaText) setCtaText(parsed.ctaText);
      if (parsed.ctaUrl) setCtaUrl(parsed.ctaUrl);

      // Close modal and reset
      setShowTrinityModal(false);
      setTrinityTopic('');
      setSendResult({ success: true, message: 'Newsletter generated! Review and send when ready.' });
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Mail className="w-7 h-7 text-amber-400" />
          Newsletter Manager
        </h1>
        <p className="text-white/50 mt-1">
          Send branded newsletters to your subscribers
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-amber-400" />
            <div>
              <div className="text-2xl font-bold text-white">
                {loading ? '...' : stats?.totalSubscribers || 0}
              </div>
              <div className="text-white/50 text-sm">Active Subscribers</div>
            </div>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <div>
              <div className="text-2xl font-bold text-white">
                {loading ? '...' : stats?.sources?.website || 0}
              </div>
              <div className="text-white/50 text-sm">From Website</div>
            </div>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-400" />
            <div>
              <div className="text-2xl font-bold text-white">
                {loading ? '...' : stats?.sources?.booking || 0}
              </div>
              <div className="text-white/50 text-sm">From Bookings</div>
            </div>
          </div>
        </div>
        <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <div>
              <div className="text-2xl font-bold text-white">
                {loading ? '...' : stats?.totalUnsubscribed || 0}
              </div>
              <div className="text-white/50 text-sm">Unsubscribed</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Newsletter Composer */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-400" />
              Compose Newsletter
            </h2>
            <button
              type="button"
              onClick={() => setShowTrinityModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-xl text-sm font-medium hover:bg-purple-500/30 transition-all border border-purple-500/30"
            >
              <Sparkles className="w-4 h-4" />
              Generate with AI
            </button>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Subject Line *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., New Year, New Locs: January Specials"
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
            />
          </div>

          {/* Preview Text */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Preview Text (shown in inbox preview)
            </label>
            <input
              type="text"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="e.g., Book your January loc retwist and save 15%"
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
            />
          </div>

          {/* Headline */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Email Headline *
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g., Start 2025 Fresh"
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Email Content * (HTML supported)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="<p>Hey Loc Fam!</p><p>New year, new vibes! Book your January appointment and treat your locs to some TLC.</p>"
              rows={8}
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all resize-none font-mono text-sm"
            />
            <p className="text-white/40 text-xs mt-1">Use HTML tags like &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt; for formatting</p>
          </div>

          {/* CTA */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Button Text
              </label>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => setCtaText(e.target.value)}
                placeholder="Book Now"
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Button URL
              </label>
              <input
                type="url"
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://kelatic.com/book"
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
              />
            </div>
          </div>

          {/* Result Message */}
          {sendResult && (
            <div className={`p-4 rounded-xl flex items-center gap-3 ${
              sendResult.success
                ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}>
              {sendResult.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {sendResult.message}
            </div>
          )}

          {/* Send Actions */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/10">
            <div className="flex-1 flex gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Test email address"
                className="flex-1 px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
              />
              <button
                onClick={handleSendTest}
                disabled={sending}
                className="px-6 py-3 bg-white/10 border border-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Send Test
              </button>
            </div>
            <button
              onClick={handleSendAll}
              disabled={sending || !stats?.totalSubscribers}
              className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send to All ({stats?.totalSubscribers || 0})
                </>
              )}
            </button>
          </div>
        </div>

        {/* Recent Subscribers */}
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            Recent Subscribers
          </h2>

          {loading ? (
            <div className="text-white/50 text-center py-8">Loading...</div>
          ) : recentSubscribers.length === 0 ? (
            <div className="text-white/50 text-center py-8">
              No subscribers yet
            </div>
          ) : (
            <div className="space-y-3">
              {recentSubscribers.map((sub) => (
                <div
                  key={sub.id}
                  className="p-3 bg-black/30 rounded-lg border border-white/5"
                >
                  <div className="text-white text-sm font-medium truncate">
                    {sub.email}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {sub.first_name && (
                      <span className="text-white/50 text-xs">{sub.first_name}</span>
                    )}
                    <span className="text-white/30 text-xs">
                      via {sub.source}
                    </span>
                    <span className="text-white/30 text-xs">
                      {new Date(sub.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Template Ideas */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="text-sm font-medium text-white/70 mb-3">Newsletter Ideas</h3>
            <div className="space-y-2 text-sm text-white/50">
              <p>- Monthly appointment reminders</p>
              <p>- Seasonal loc care tips</p>
              <p>- New service announcements</p>
              <p>- Special promotions & discounts</p>
              <p>- Holiday greetings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Trinity AI Generation Modal */}
      {showTrinityModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">AI Content Generator</h2>
                  <p className="text-white/50 text-sm">Describe your newsletter and let AI create it</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowTrinityModal(false);
                  setTrinityTopic('');
                  setGenerateError('');
                }}
                className="p-2 text-white/50 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  What kind of newsletter do you want to create?
                </label>
                <textarea
                  value={trinityTopic}
                  onChange={(e) => setTrinityTopic(e.target.value)}
                  placeholder="e.g., New year promotion offering 15% off all retwist services in January, targeting existing clients who haven't booked in 30+ days"
                  rows={4}
                  className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Tone
                </label>
                <div className="flex flex-wrap gap-2">
                  {(['casual', 'professional', 'playful', 'inspiring'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTrinityTone(t)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        trinityTone === t
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {generateError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {generateError}
                </div>
              )}

              {/* Quick Ideas */}
              <div className="pt-2">
                <p className="text-white/50 text-xs mb-2">Quick ideas (click to use):</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Monthly retwist reminder',
                    'New year special offer',
                    'Summer loc care tips',
                    'We miss you - come back!',
                  ].map((idea) => (
                    <button
                      key={idea}
                      type="button"
                      onClick={() => setTrinityTopic(idea)}
                      className="px-3 py-1 bg-white/5 text-white/60 rounded-lg text-xs hover:bg-white/10 transition-colors"
                    >
                      {idea}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-white/10 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowTrinityModal(false);
                  setTrinityTopic('');
                  setGenerateError('');
                }}
                className="flex-1 px-4 py-3 bg-white/5 text-white rounded-xl font-medium hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTrinityGenerate}
                disabled={generating || !trinityTopic.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Newsletter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
