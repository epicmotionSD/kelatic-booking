'use client';

import { useState } from 'react';
import { CalendarDays, FolderOpen, Sparkles, Users, Brain } from 'lucide-react';
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

const AI_TOOLS = [
  {
    href: '/admin/trinity/marketing/social',
    icon: '📱',
    title: 'Social Post Generator',
    desc: 'Instagram & Facebook posts with hashtags',
    manager: 'Manager 1',
  },
  {
    href: '/admin/trinity/marketing/email',
    icon: '📧',
    title: 'Email Campaign Creator',
    desc: 'Promotional emails and newsletters',
    manager: 'Manager 2',
  },
  {
    href: '/admin/trinity/marketing/graphics',
    icon: '🎨',
    title: 'Promo Graphics Copy',
    desc: 'Copy for flyers and promotional graphics',
    manager: 'Manager 1',
  },
  {
    href: '/admin/trinity/content/blog',
    icon: '📝',
    title: 'Blog Article Writer',
    desc: 'SEO-optimized blog posts about loc care',
    manager: 'Manager 2',
  },
  {
    href: '/admin/trinity/content/video',
    icon: '🎬',
    title: 'Video Script Generator',
    desc: 'Scripts for TikTok, Reels, and YouTube',
    manager: 'Manager 1',
  },
  {
    href: '/admin/trinity/content/education',
    icon: '📚',
    title: 'Client Education',
    desc: 'Aftercare guides and educational materials',
    manager: 'Manager 2',
  },
];

export default function TrinityPage() {
  const [activeTab, setActiveTab] = useState<Tab>('insights');

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
            Trinity Content Hub
          </h1>
          <p className="text-white/50 mt-1 text-sm">
            AI-powered business operator, content calendar, asset library, and marketing tools
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Live badge */}
          <div className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-green-400 font-medium">Claude API Connected</span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <Users className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="text-sm">
              <div className="text-white/80 font-medium leading-tight">2 Managers Active</div>
              <div className="text-white/40 text-xs">Manager 1 · Manager 2</div>
            </div>
          </div>
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
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-lg shadow-amber-500/20'
                : 'text-white/50 hover:text-white/80 hover:bg-white/5'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Tab Description */}
      <div className="text-xs text-white/30 -mt-4">
        {TABS.find((t) => t.id === activeTab)?.desc}
      </div>

      {/* Tab Content */}
      {activeTab === 'insights'  && <AIInsights />}
      {activeTab === 'calendar'  && <ContentCalendar />}
      {activeTab === 'assets'    && <AssetsLibrary />}
      {activeTab === 'ai-tools'  && (
        <div className="space-y-6">
          {/* Manager Assignments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                name: 'Manager 1',
                color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
                dot: 'bg-purple-400',
                focus: 'Social & Video Content',
                tools: ['Social Posts', 'Video Scripts', 'Promo Graphics'],
              },
              {
                name: 'Manager 2',
                color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
                dot: 'bg-amber-400',
                focus: 'Email & Blog Content',
                tools: ['Email Campaigns', 'Blog Articles', 'Client Education'],
              },
            ].map((mgr) => (
              <div key={mgr.name} className={`bg-gradient-to-br ${mgr.color} border rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${mgr.dot}`} />
                  <span className="text-white font-semibold">{mgr.name}</span>
                </div>
                <p className="text-white/50 text-xs mb-2">Primary Focus: {mgr.focus}</p>
                <div className="flex flex-wrap gap-1">
                  {mgr.tools.map((t) => (
                    <span key={t} className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Marketing Builder */}
          <div>
            <h2 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">🎨 Marketing Builder</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {AI_TOOLS.filter((t) => ['📱', '📧', '🎨'].includes(t.icon)).map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="bg-white/3 border border-white/8 rounded-xl p-5 hover:border-amber-500/30 hover:bg-white/6 transition-all group"
                >
                  <div className="text-2xl mb-3">{tool.icon}</div>
                  <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors text-sm">
                    {tool.title}
                  </h3>
                  <p className="text-white/40 text-xs mt-1">{tool.desc}</p>
                  <div className="mt-3 flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${tool.manager === 'Manager 1' ? 'bg-purple-400' : 'bg-amber-400'}`} />
                    <span className="text-xs text-white/30">{tool.manager}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Content Creation Builder */}
          <div>
            <h2 className="text-sm font-semibold text-white/60 mb-3 uppercase tracking-wider">✨ Content Creation</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {AI_TOOLS.filter((t) => ['📝', '🎬', '📚'].includes(t.icon)).map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="bg-white/3 border border-white/8 rounded-xl p-5 hover:border-amber-500/30 hover:bg-white/6 transition-all group"
                >
                  <div className="text-2xl mb-3">{tool.icon}</div>
                  <h3 className="font-semibold text-white group-hover:text-amber-400 transition-colors text-sm">
                    {tool.title}
                  </h3>
                  <p className="text-white/40 text-xs mt-1">{tool.desc}</p>
                  <div className="mt-3 flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${tool.manager === 'Manager 1' ? 'bg-purple-400' : 'bg-amber-400'}`} />
                    <span className="text-xs text-white/30">{tool.manager}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
