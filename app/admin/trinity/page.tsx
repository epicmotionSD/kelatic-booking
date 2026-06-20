'use client';

import { useState } from 'react';
import { CalendarDays, FolderOpen, Sparkles, Brain } from 'lucide-react';
import ContentCalendar from '@/components/trinity/content-calendar';
import AssetsLibrary from '@/components/trinity/assets-library';
import AIInsights from '@/components/trinity/ai-insights';
import Link from 'next/link';

type Tab = 'insights' | 'calendar' | 'assets' | 'ai-tools';

const TABS: { id: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    id: 'insights',
    label: 'AI Operator',
    icon: <Brain className="w-4 h-4" />,
    desc: 'Claude-powered business intelligence — 6 operating modules',
  },
  {
    id: 'calendar',
    label: 'Content Calendar',
    icon: <CalendarDays className="w-4 h-4" />,
    desc: '30-day editable schedule',
  },
  {
    id: 'assets',
    label: 'Assets Library',
    icon: <FolderOpen className="w-4 h-4" />,
    desc: 'Upload & manage media',
  },
  {
    id: 'ai-tools',
    label: 'AI Tools',
    icon: <Sparkles className="w-4 h-4" />,
    desc: 'Generate content with AI',
  },
];

type Brand = { id: string; label: string; accent: string };

const BRANDS: Brand[] = [
  { id: 'kelatic', label: 'KeLatic / Loc Shop', accent: 'amber' },
  { id: 'loc-academy', label: 'Loc Academy', accent: 'amber' },
  { id: 'barber-block', label: 'Barber Block', accent: 'red' },
];

type ToolGroup = 'marketing' | 'content';

const TOOLS: { href: string; icon: string; title: string; desc: string; group: ToolGroup }[] = [
  {
    href: '/admin/trinity/marketing/social',
    icon: '📱',
    title: 'Social Post Generator',
    desc: 'Instagram & Facebook posts with hashtags',
    group: 'marketing',
  },
  {
    href: '/admin/trinity/marketing/email',
    icon: '📧',
    title: 'Email Campaign Creator',
    desc: 'Promotional emails and newsletters',
    group: 'marketing',
  },
  {
    href: '/admin/trinity/marketing/graphics',
    icon: '🎨',
    title: 'Promo Graphics Copy',
    desc: 'Copy for flyers and promotional graphics',
    group: 'marketing',
  },
  {
    href: '/admin/trinity/content/blog',
    icon: '📝',
    title: 'Blog Article Writer',
    desc: 'SEO-optimized blog posts',
    group: 'content',
  },
  {
    href: '/admin/trinity/content/video',
    icon: '🎬',
    title: 'Video Script Generator',
    desc: 'Scripts for TikTok, Reels, and YouTube',
    group: 'content',
  },
  {
    href: '/admin/trinity/content/education',
    icon: '📚',
    title: 'Client Education',
    desc: 'Aftercare guides and educational materials',
    group: 'content',
  },
];

function ToolCard({ href, icon, title, desc, accent }: { href: string; icon: string; title: string; desc: string; accent: string }) {
  // Tailwind needs the full class name in source for its extractor, so branch explicitly.
  const card =
    accent === 'red'
      ? 'bg-red-500/5 border-red-500/15 hover:border-red-500/35 hover:bg-red-500/10'
      : 'bg-white/3 border-white/8 hover:border-[#00ffb2]/30 hover:bg-white/6';
  const heading =
    accent === 'red' ? 'group-hover:text-red-300' : 'group-hover:text-[#00ffb2]';

  return (
    <Link href={href} className={`border rounded-xl p-5 transition-all group ${card}`}>
      <div className="text-2xl mb-3">{icon}</div>
      <h3 className={`font-semibold text-white transition-colors text-sm ${heading}`}>{title}</h3>
      <p className="text-white/40 text-xs mt-1">{desc}</p>
    </Link>
  );
}

export default function TrinityPage() {
  const [activeTab, setActiveTab] = useState<Tab>('insights');
  const [brandId, setBrandId] = useState<string>(BRANDS[0].id);

  const brand = BRANDS.find((b) => b.id === brandId) ?? BRANDS[0];
  const brandSuffix = brand.id === 'kelatic' ? '' : `?brand=${brand.id}`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#00ffb2]">
            Trinity Content Hub
          </h1>
          <p className="text-white/50 mt-1 text-sm">
            AI-powered business operator, content calendar, asset library, and marketing tools
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs text-green-400 font-medium">Claude API Connected</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/3 border border-white/8 rounded-2xl p-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap min-w-fit ${
              activeTab === tab.id
                ? 'bg-[#00ffb2] text-black '
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      <div className="text-xs text-white/30 -mt-4">{TABS.find((t) => t.id === activeTab)?.desc}</div>

      {/* Tab Content */}
      {activeTab === 'insights' && <AIInsights />}
      {activeTab === 'calendar' && <ContentCalendar />}
      {activeTab === 'assets' && <AssetsLibrary />}
      {activeTab === 'ai-tools' && (
        <div className="space-y-6">
          {/* Brand selector */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs uppercase tracking-wider text-white/40 font-semibold">Brand</span>
            <div className="flex gap-1 bg-white/3 border border-white/8 rounded-xl p-1">
              {BRANDS.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBrandId(b.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    b.id === brandId
                      ? b.accent === 'red'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-[#00ffb2]/20 text-[#00ffb2] border border-[#00ffb2]/30'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-white/30">
              Output is tailored to the selected brand voice.
            </span>
          </div>

          {/* Marketing Builder */}
          <div>
            <h2 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">🎨 Marketing Builder</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TOOLS.filter((t) => t.group === 'marketing').map((tool) => (
                <ToolCard
                  key={tool.href}
                  href={`${tool.href}${brandSuffix}`}
                  icon={tool.icon}
                  title={tool.title}
                  desc={tool.desc}
                  accent={brand.accent}
                />
              ))}
            </div>
          </div>

          {/* Content Creation */}
          <div>
            <h2 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">✨ Content Creation</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {TOOLS.filter((t) => t.group === 'content').map((tool) => (
                <ToolCard
                  key={tool.href}
                  href={`${tool.href}${brandSuffix}`}
                  icon={tool.icon}
                  title={tool.title}
                  desc={tool.desc}
                  accent={brand.accent}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
