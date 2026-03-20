'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Calendar,
  Users,
  Megaphone,
  Target,
  RefreshCw,
  Send,
  Loader2,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Radio,
  BarChart3,
  ShieldAlert,
  MessageSquare,
  Sparkles,
  UserCheck,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Insight {
  id: string;
  category: string;
  icon: string;
  title: string;
  body: string;
  trend: 'up' | 'down' | 'neutral';
  value?: string;
  priority: 'high' | 'medium' | 'low';
}

interface Action {
  id: string;
  title: string;
  description: string;
  owner: string;
  urgency: 'today' | 'this_week' | 'this_month';
  category: string;
}

interface InsightsReport {
  score: number;
  pulse: string;
  insights: Insight[];
  actions: Action[];
  snapshot?: Record<string, unknown>;
  generatedAt?: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Icon map ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ReactNode> = {
  DollarSign:   <DollarSign className="w-4 h-4" />,
  Calendar:     <Calendar className="w-4 h-4" />,
  Users:        <Users className="w-4 h-4" />,
  Megaphone:    <Megaphone className="w-4 h-4" />,
  Target:       <Target className="w-4 h-4" />,
  TrendingUp:   <TrendingUp className="w-4 h-4" />,
  BarChart3:    <BarChart3 className="w-4 h-4" />,
  Brain:        <Brain className="w-4 h-4" />,
  Zap:          <Zap className="w-4 h-4" />,
  Radio:        <Radio className="w-4 h-4" />,
  ShieldAlert:  <ShieldAlert className="w-4 h-4" />,
  UserCheck:    <UserCheck className="w-4 h-4" />,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

const PRIORITY_STYLES = {
  high:   'border-red-500/40 bg-red-500/8',
  medium: 'border-amber-500/40 bg-amber-500/8',
  low:    'border-white/10 bg-white/3',
};

const PRIORITY_DOT = {
  high:   'bg-red-400',
  medium: 'bg-amber-400',
  low:    'bg-white/30',
};

const TREND_ICON = {
  up:      <TrendingUp  className="w-3.5 h-3.5 text-green-400" />,
  down:    <TrendingDown className="w-3.5 h-3.5 text-red-400" />,
  neutral: <Minus        className="w-3.5 h-3.5 text-white/40" />,
};

const URGENCY_CONFIG = {
  today:      { label: 'Today',      color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  this_week:  { label: 'This Week',  color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  this_month: { label: 'This Month', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
};

const OWNER_DOT: Record<string, string> = {
  'Manager 1':    'bg-purple-400',
  'Manager 2':    'bg-amber-400',
  'Both Managers':'bg-gradient-to-r from-purple-400 to-amber-400',
  'Admin':        'bg-green-400',
};

function InsightCard({ insight }: { insight: Insight }) {
  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-2 ${PRIORITY_STYLES[insight.priority]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-amber-400 shrink-0">
            {ICON_MAP[insight.icon] || <Brain className="w-4 h-4" />}
          </div>
          <span className="text-xs text-white/40 font-medium uppercase tracking-wider">{insight.category}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {insight.value && (
            <span className="text-xs font-bold text-white/80 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
              {insight.value}
            </span>
          )}
          {TREND_ICON[insight.trend]}
          <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[insight.priority]}`} />
        </div>
      </div>
      <h4 className="text-sm font-semibold text-white leading-tight">{insight.title}</h4>
      <p className="text-xs text-white/50 leading-relaxed">{insight.body}</p>
    </div>
  );
}

function ActionCard({ action }: { action: Action }) {
  const urgency = URGENCY_CONFIG[action.urgency];
  return (
    <div className="flex items-start gap-3 bg-white/3 border border-white/8 rounded-xl p-3 hover:border-white/15 transition-colors">
      <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
        <ChevronRight className="w-3 h-3 text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-white leading-tight">{action.title}</p>
          <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${urgency.color}`}>
            {urgency.label}
          </span>
        </div>
        <p className="text-xs text-white/40 mt-1 leading-relaxed">{action.description}</p>
        <div className="flex items-center gap-1.5 mt-2">
          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${OWNER_DOT[action.owner] ?? 'bg-white/30'}`} />
          <span className="text-xs text-white/30">{action.owner}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Pillar cards (static AI operator modules) ─────────────────────────────

const PILLARS = [
  {
    id: 'social',
    icon: <Radio className="w-5 h-5" />,
    title: 'Social Intelligence',
    desc: 'Real-time engagement analysis — best post times, platform ROI, hashtag performance.',
    color: 'from-pink-500/15 to-purple-500/5 border-pink-500/25',
    prompt: 'Give me a social media intelligence report for Kelatic right now. What platforms are performing, when should we post, and what content types get the most engagement for a Houston loc salon?',
  },
  {
    id: 'competitor',
    icon: <ShieldAlert className="w-5 h-5" />,
    title: 'Competitor Radar',
    desc: 'Automated positioning alerts — who\'s gaining ground in Houston and how to counter.',
    color: 'from-red-500/15 to-orange-500/5 border-red-500/25',
    prompt: 'Run a competitor radar check for Kelatic. What are other Houston loc salons doing on social media and what positioning moves should Kelatic make to stay ahead?',
  },
  {
    id: 'campaigns',
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Campaign Analytics',
    desc: 'ROI tracking & optimization — which campaigns convert and which need to be cut.',
    color: 'from-blue-500/15 to-cyan-500/5 border-blue-500/25',
    prompt: 'Analyze Kelatic\'s current marketing campaigns. What\'s the ROI breakdown and what optimizations should we make to the email, SMS, and social campaigns this week?',
  },
  {
    id: 'funnel',
    icon: <Target className="w-5 h-5" />,
    title: 'Booking Funnel AI',
    desc: 'Drop-off detection & recovery — where clients abandon and how to recover them.',
    color: 'from-amber-500/15 to-yellow-500/5 border-amber-500/25',
    prompt: 'Analyze the Kelatic booking funnel. Where are clients dropping off before completing a booking? What are the top 3 recovery tactics we should implement this week to reduce no-shows and abandoned bookings?',
  },
  {
    id: 'content',
    icon: <Sparkles className="w-5 h-5" />,
    title: 'Content Engine',
    desc: 'AI-generated calendar & copy — 30 days of content strategy, auto-assigned to managers.',
    color: 'from-purple-500/15 to-violet-500/5 border-purple-500/25',
    prompt: 'Build a 2-week content strategy for Kelatic Hair Lounge. Give me specific post ideas for Instagram, TikTok, and email — with which day, what type of content, and assign each to Manager 1 (Social/Video) or Manager 2 (Email/Blog).',
  },
  {
    id: 'reengagement',
    icon: <UserCheck className="w-5 h-5" />,
    title: 'Client Re-engagement',
    desc: 'Automated win-back sequences — lapsed clients, loyalty signals, personalized outreach.',
    color: 'from-green-500/15 to-emerald-500/5 border-green-500/25',
    prompt: 'Create a client re-engagement strategy for Kelatic. Which client segments need win-back campaigns? Write the actual SMS and email copy for a 3-touch re-engagement sequence targeting clients who haven\'t visited in 60+ days.',
  },
];

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 75 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#f87171';

  return (
    <svg width="96" height="96" className="rotate-[-90deg]">
      <circle cx="48" cy="48" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
      <circle
        cx="48" cy="48" r={r} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={circ}
        strokeDashoffset={circ - filled}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }}
      />
      <text
        x="48" y="52" textAnchor="middle" dominantBaseline="middle"
        fill="white" fontSize="18" fontWeight="700"
        style={{ transform: 'rotate(90deg)', transformOrigin: '48px 48px' }}
      >
        {score}
      </text>
    </svg>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function AIInsights() {
  const [report, setReport]     = useState<InsightsReport | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'chat'>('overview');
  const [activePillar, setActivePillar] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput]       = useState('');
  const [streaming, setStreaming] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/trinity/insights');
      if (!res.ok) throw new Error('Failed to fetch insights');
      const data = await res.json();
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInsights(); }, [fetchInsights]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || streaming) return;

    const userMsg: ChatMessage = { role: 'user', content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setStreaming(true);
    setActiveView('chat');

    // Add empty assistant message to stream into
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/trinity/insights/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          snapshot: report?.snapshot ?? null,
        }),
      });

      if (!res.ok || !res.body) throw new Error('Stream failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const payload = line.slice(6);
            if (payload === '[DONE]') break;
            try {
              const { text } = JSON.parse(payload);
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: 'assistant',
                  content: updated[updated.length - 1].content + text,
                };
                return updated;
              });
            } catch { /* skip parse errors */ }
          }
        }
      }
    } catch (e) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: 'Sorry, I ran into an error. Please try again.',
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  const handlePillarClick = (pillar: typeof PILLARS[0]) => {
    setActivePillar(pillar.id);
    sendMessage(pillar.prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Skeleton loader ────────────────────────────────────────────────────────
  if (loading && !report) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-24 h-24 bg-white/5 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-white/5 rounded-lg w-2/3" />
            <div className="h-3 bg-white/5 rounded-lg w-1/2" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 bg-white/3 border border-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-amber-400" />
            Claude as Your Business AI Operator
          </h2>
          <p className="text-white/40 text-sm mt-0.5">
            6 intelligence modules powered by your connected Claude API
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              activeView === 'overview'
                ? 'bg-amber-400 text-black'
                : 'bg-white/5 text-white/50 hover:text-white border border-white/10'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveView('chat')}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              activeView === 'chat'
                ? 'bg-amber-400 text-black'
                : 'bg-white/5 text-white/50 hover:text-white border border-white/10'
            }`}
          >
            Chat
            {messages.length > 0 && (
              <span className="ml-1.5 text-xs bg-amber-400/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                {messages.filter(m => m.role === 'user').length}
              </span>
            )}
          </button>
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/40 hover:text-white transition-colors"
            title="Refresh insights"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ══ DASHBOARD VIEW ══════════════════════════════════════════════════ */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Score + Pulse */}
          {report && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 bg-white/3 border border-white/8 rounded-2xl p-5">
              <div className="shrink-0">
                <ScoreRing score={report.score} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-white/40 uppercase tracking-wider font-medium">Business Health Score</span>
                  {report.score >= 75 ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  ) : report.score >= 50 ? (
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  )}
                </div>
                <p className="text-white font-medium leading-snug">{report.pulse}</p>
                {report.generatedAt && (
                  <p className="text-xs text-white/25 mt-1">
                    Generated {new Date(report.generatedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
              {/* Snapshot KPIs */}
              {report.snapshot && (() => {
                const snap = report.snapshot as {
                  revenue?: { last30Days?: number; changePercent?: number };
                  appointments?: { today?: number; last30Days?: number };
                  clients?: { newLast30Days?: number };
                  content?: { upcomingPostsCount?: number };
                };
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
                    {[
                      { label: 'Revenue 30d', val: `$${(snap.revenue?.last30Days ?? 0).toLocaleString()}`, change: snap.revenue?.changePercent },
                      { label: 'Appts Today', val: String(snap.appointments?.today ?? 0), change: null },
                      { label: 'New Clients', val: String(snap.clients?.newLast30Days ?? 0), change: null },
                      { label: 'Posts Ahead', val: String(snap.content?.upcomingPostsCount ?? 0), change: null },
                    ].map(kpi => (
                      <div key={kpi.label} className="text-center bg-white/4 border border-white/8 rounded-xl px-3 py-2">
                        <div className="text-lg font-bold text-white leading-none">{kpi.val}</div>
                        <div className="text-xs text-white/30 mt-0.5">{kpi.label}</div>
                        {kpi.change !== null && kpi.change !== undefined && (
                          <div className={`text-xs mt-0.5 font-medium ${kpi.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {kpi.change >= 0 ? '+' : ''}{kpi.change}%
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 6 AI Operator Pillars */}
          <div>
            <h3 className="text-xs text-white/40 uppercase tracking-wider font-medium mb-3">AI Operating Modules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PILLARS.map((pillar) => (
                <button
                  key={pillar.id}
                  onClick={() => handlePillarClick(pillar)}
                  className={`text-left bg-gradient-to-br ${pillar.color} border rounded-xl p-4 hover:scale-[1.01] transition-all group`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-white/70 group-hover:text-amber-400 transition-colors">
                      {pillar.icon}
                    </div>
                    <Zap className="w-3.5 h-3.5 text-white/20 group-hover:text-amber-400 transition-colors" />
                  </div>
                  <h4 className="text-sm font-semibold text-white mb-1">{pillar.title}</h4>
                  <p className="text-xs text-white/40 leading-relaxed">{pillar.desc}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-amber-400/60 group-hover:text-amber-400 transition-colors">
                    <span>Ask Claude</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Insight Cards */}
          {report && report.insights.length > 0 && (
            <div>
              <h3 className="text-xs text-white/40 uppercase tracking-wider font-medium mb-3">Today&apos;s Intelligence Report</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.insights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            </div>
          )}

          {/* Priority Actions */}
          {report && report.actions.length > 0 && (
            <div>
              <h3 className="text-xs text-white/40 uppercase tracking-wider font-medium mb-3">Priority Actions</h3>
              <div className="space-y-2">
                {report.actions.map((action) => (
                  <ActionCard key={action.id} action={action} />
                ))}
              </div>
            </div>
          )}

          {/* Quick Chat Prompt */}
          <div className="bg-white/3 border border-white/8 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium text-white/70">Ask your AI Operator</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { sendMessage(input); }
                }}
                placeholder="e.g. 'Write a win-back SMS for clients who missed their retwist appointment...'"
                className="flex-1 bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || streaming}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold rounded-xl text-sm hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ CHAT VIEW ════════════════════════════════════════════════════════ */}
      {activeView === 'chat' && (
        <div className="flex flex-col h-[calc(100vh-280px)] min-h-[500px]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 pb-4">
            {messages.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <Brain className="w-12 h-12 mx-auto text-white/10" />
                <p className="text-white/30 text-sm">Your AI Business Operator is ready.</p>
                <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                  {[
                    'What should we post this week?',
                    'Write a re-engagement SMS',
                    'How\'s our booking funnel?',
                    'Analyze our content gaps',
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="text-xs bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-amber-500/50 px-3 py-1.5 rounded-full transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shrink-0 mr-2.5 mt-0.5">
                      <Brain className="w-3.5 h-3.5 text-black" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-amber-400/15 border border-amber-400/30 text-white'
                        : 'bg-white/5 border border-white/10 text-white/80'
                    }`}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="whitespace-pre-wrap prose-invert prose-sm max-w-none">
                        {msg.content || (
                          <span className="flex items-center gap-2 text-white/30">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Thinking...
                          </span>
                        )}
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t border-white/8 pt-4">
            {/* Pillar quick-access row */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {PILLARS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePillarClick(p)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs whitespace-nowrap border transition-colors ${
                    activePillar === p.id
                      ? 'bg-amber-400/20 border-amber-400/50 text-amber-400'
                      : 'bg-white/3 border-white/10 text-white/40 hover:text-white/70'
                  }`}
                >
                  <span className="text-xs">{p.icon}</span>
                  {p.title.split(' ')[0]}
                </button>
              ))}
            </div>

            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything — content strategy, client scripts, analytics, positioning..."
                className="flex-1 bg-white/5 border border-white/10 text-white placeholder-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500 resize-none overflow-hidden"
                disabled={streaming}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || streaming}
                className="p-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl hover:shadow-lg hover:shadow-amber-500/20 transition-all disabled:opacity-50 shrink-0"
              >
                {streaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-white/20 mt-2 text-center">
              Powered by Kelatic&apos;s connected Claude API · Shift+Enter for new line
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
