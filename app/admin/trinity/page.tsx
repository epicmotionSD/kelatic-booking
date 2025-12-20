'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  totalGenerations: number;
  thisMonth: number;
  byType: Record<string, number>;
}

const TOOLS = [
  {
    name: 'Social Post Generator',
    description: 'Create engaging Instagram & Facebook posts with hashtags',
    href: '/admin/trinity/marketing/social',
    icon: '📱',
    category: 'Marketing',
  },
  {
    name: 'Email Campaign Creator',
    description: 'Build promotional emails and newsletters',
    href: '/admin/trinity/marketing/email',
    icon: '📧',
    category: 'Marketing',
  },
  {
    name: 'Promo Graphics Copy',
    description: 'Generate copy for flyers and promotional graphics',
    href: '/admin/trinity/marketing/graphics',
    icon: '🎨',
    category: 'Marketing',
  },
  {
    name: 'Blog Article Writer',
    description: 'Write SEO-optimized blog posts about loc care',
    href: '/admin/trinity/content/blog',
    icon: '📝',
    category: 'Content',
  },
  {
    name: 'Video Script Generator',
    description: 'Scripts for TikTok, Reels, and YouTube',
    href: '/admin/trinity/content/video',
    icon: '🎬',
    category: 'Content',
  },
  {
    name: 'Client Education',
    description: 'Aftercare guides and educational materials',
    href: '/admin/trinity/content/education',
    icon: '📚',
    category: 'Content',
  },
];

export default function TrinityDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

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

  const marketingTools = TOOLS.filter((t) => t.category === 'Marketing');
  const contentTools = TOOLS.filter((t) => t.category === 'Content');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Trinity AI</h1>
        <p className="text-gray-600 mt-1">
          AI-powered marketing and content creation for Kelatic
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-3xl font-bold text-purple-600">
            {loading ? '...' : stats?.totalGenerations || 0}
          </div>
          <div className="text-gray-600 text-sm mt-1">Total Generations</div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="text-3xl font-bold text-purple-600">
            {loading ? '...' : stats?.thisMonth || 0}
          </div>
          <div className="text-gray-600 text-sm mt-1">This Month</div>
        </div>
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
          <div className="text-3xl font-bold">Trial</div>
          <div className="text-purple-200 text-sm mt-1">50 generations/month</div>
        </div>
      </div>

      {/* Marketing Builder */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Marketing Builder
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {marketingTools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group"
            >
              <div className="text-3xl mb-3">{tool.icon}</div>
              <h3 className="font-semibold text-gray-900 group-hover:text-purple-600">
                {tool.name}
              </h3>
              <p className="text-gray-600 text-sm mt-1">{tool.description}</p>
              {stats && stats.byType[tool.href.split('/').pop() || ''] > 0 && (
                <div className="mt-3 text-xs text-purple-600">
                  {stats.byType[tool.href.split('/').pop() || '']} generated
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Content Creation Builder */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Content Creation Builder
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contentTools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group"
            >
              <div className="text-3xl mb-3">{tool.icon}</div>
              <h3 className="font-semibold text-gray-900 group-hover:text-purple-600">
                {tool.name}
              </h3>
              <p className="text-gray-600 text-sm mt-1">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Generations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Generations
          </h2>
          <Link
            href="/admin/trinity/history"
            className="text-sm text-purple-600 hover:text-purple-700"
          >
            View all →
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-gray-500 text-center py-8">
            No content generated yet. Choose a tool above to get started!
          </p>
        </div>
      </div>
    </div>
  );
}
