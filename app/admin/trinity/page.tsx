'use client';

import { useState, useEffect } from 'react';

interface Stats {
  totalGenerations: number;
  thisMonth: number;
  byType: Record<string, number>;
}

interface GenerationResult {
  id: string;
  type: string;
  content: string;
  metadata: {
    topic: string;
    generatedAt: string;
    wordCount: number;
  };
}

const TOOLS = [
  {
    id: 'social',
    name: 'Social Post Generator',
    description: 'Create engaging Instagram & Facebook posts with hashtags',
    icon: '📱',
    category: 'Marketing',
    placeholder: 'e.g., "New year loc refresh specials" or "Client transformation spotlight"',
  },
  {
    id: 'email',
    name: 'Email Campaign Creator',
    description: 'Build promotional emails and newsletters',
    icon: '📧',
    category: 'Marketing',
    placeholder: 'e.g., "Holiday booking reminder" or "New service announcement"',
  },
  {
    id: 'graphics',
    name: 'Promo Graphics Copy',
    description: 'Generate copy for flyers and promotional graphics',
    icon: '🎨',
    category: 'Marketing',
    placeholder: 'e.g., "Summer loc special flyer" or "Referral program poster"',
  },
  {
    id: 'blog',
    name: 'Blog Article Writer',
    description: 'Write SEO-optimized blog posts about loc care',
    icon: '📝',
    category: 'Content',
    placeholder: 'e.g., "How to maintain locs in winter" or "Starter locs: What to expect"',
  },
  {
    id: 'video',
    name: 'Video Script Generator',
    description: 'Scripts for TikTok, Reels, and YouTube',
    icon: '🎬',
    category: 'Content',
    placeholder: 'e.g., "60-second loc maintenance tips" or "Day in the life at the salon"',
  },
  {
    id: 'education',
    name: 'Client Education',
    description: 'Aftercare guides and educational materials',
    icon: '📚',
    category: 'Content',
    placeholder: 'e.g., "First 30 days aftercare guide" or "Products to avoid with locs"',
  },
];

export default function TrinityDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<typeof TOOLS[0] | null>(null);
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<'professional' | 'casual' | 'playful' | 'inspiring'>('professional');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/trinity/history?stats=true&limit=0');
        const data = await res.json();
        setStats(data.stats);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  async function handleGenerate() {
    if (!selectedTool || !topic.trim()) return;

    setGenerating(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/trinity/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedTool.id,
          topic: topic.trim(),
          tone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate content');
      }

      setResult(data);
      // Refresh stats
      const statsRes = await fetch('/api/trinity/history?stats=true&limit=0');
      const statsData = await statsRes.json();
      setStats(statsData.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function closeModal() {
    setSelectedTool(null);
    setTopic('');
    setResult(null);
    setError('');
  }

  const marketingTools = TOOLS.filter((t) => t.category === 'Marketing');
  const contentTools = TOOLS.filter((t) => t.category === 'Content');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Trinity AI</h1>
        <p className="text-white/50 mt-1">
          AI-powered marketing and content creation for Kelatic
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
          <div className="text-3xl font-bold text-purple-400">
            {loading ? '...' : stats?.totalGenerations || 0}
          </div>
          <div className="text-white/50 text-sm mt-1">Total Generations</div>
        </div>
        <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
          <div className="text-3xl font-bold text-purple-400">
            {loading ? '...' : stats?.thisMonth || 0}
          </div>
          <div className="text-white/50 text-sm mt-1">This Month</div>
        </div>
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
          <div className="text-3xl font-bold">Active</div>
          <div className="text-purple-200 text-sm mt-1">Powered by Claude AI</div>
        </div>
      </div>

      {/* Marketing Builder */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Marketing Builder
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {marketingTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool)}
              className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all group text-left"
            >
              <div className="text-3xl mb-3">{tool.icon}</div>
              <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                {tool.name}
              </h3>
              <p className="text-white/50 text-sm mt-1">{tool.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Content Creation Builder */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Content Creation Builder
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contentTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool)}
              className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all group text-left"
            >
              <div className="text-3xl mb-3">{tool.icon}</div>
              <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                {tool.name}
              </h3>
              <p className="text-white/50 text-sm mt-1">{tool.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Generation Modal */}
      {selectedTool && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedTool.icon}</span>
                <div>
                  <h2 className="text-lg font-bold text-white">{selectedTool.name}</h2>
                  <p className="text-white/50 text-sm">{selectedTool.description}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-white/50 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {!result ? (
                <div className="space-y-6">
                  {/* Topic Input */}
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      What do you want to create?
                    </label>
                    <textarea
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder={selectedTool.placeholder}
                      className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Tone Selection */}
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">
                      Tone
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {(['professional', 'casual', 'playful', 'inspiring'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setTone(t)}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            tone === t
                              ? 'bg-purple-500 text-white'
                              : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                          }`}
                        >
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !topic.trim()}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {generating ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Generating with Claude AI...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate Content
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Result Header */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-white/50">
                      {result.metadata.wordCount} words generated
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCopy}
                        className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-sm hover:bg-white/10 transition-colors flex items-center gap-2"
                      >
                        {copied ? (
                          <>
                            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setResult(null)}
                        className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-xl text-sm hover:bg-purple-500/30 transition-colors"
                      >
                        Generate Another
                      </button>
                    </div>
                  </div>

                  {/* Generated Content */}
                  <div className="bg-black/50 border border-white/10 rounded-xl p-6">
                    <pre className="whitespace-pre-wrap text-white/90 font-sans text-sm leading-relaxed">
                      {result.content}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
