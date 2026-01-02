'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BoardVisualizer } from '@/components/board/board-visualizer';
import { Target, Wrench, TrendingUp, DollarSign, Zap, ArrowRight, Play } from 'lucide-react';

export default function PlatformLandingPage() {
  const [email, setEmail] = useState('');

  const boardMembers = [
    {
      icon: Target,
      name: 'Atlas',
      role: 'CEO',
      color: '#22c55e',
      description: 'Strategic planning, coordination, and decision approval for your agency.',
    },
    {
      icon: Wrench,
      name: 'Nova',
      role: 'CTO',
      color: '#3b82f6',
      description: 'Platform management, template deployment, and technical operations.',
    },
    {
      icon: TrendingUp,
      name: 'Pulse',
      role: 'CMO',
      color: '#a855f7',
      description: 'Growth marketing, campaign optimization, and lead generation.',
    },
    {
      icon: DollarSign,
      name: 'Apex',
      role: 'CFO',
      color: '#f59e0b',
      description: 'Revenue analytics, subscription management, and financial forecasting.',
    },
  ];

  const features = [
    {
      icon: '📅',
      title: 'Smart Booking',
      description: 'AI-powered scheduling that handles deposits, reminders, and no-show prevention.',
    },
    {
      icon: '✨',
      title: 'AI Content Studio',
      description: 'Generate social posts, emails, and marketing content tailored to your brand.',
    },
    {
      icon: '💳',
      title: 'Integrated Payments',
      description: 'Accept cards online and in-person with Stripe. Track revenue in real-time.',
    },
    {
      icon: '🎨',
      title: 'Your Brand, Your Domain',
      description: 'Full white-label with custom domains. Your clients see your brand, not ours.',
    },
    {
      icon: '📧',
      title: 'Email & SMS',
      description: 'Automated confirmations, reminders, and marketing campaigns.',
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description: 'Track bookings, revenue, and client retention at a glance.',
    },
  ];

  const pricingTiers = [
    {
      name: 'Starter',
      price: 49,
      description: 'Perfect for solo stylists',
      features: [
        '1 location',
        'Unlimited bookings',
        'Online payments',
        '50 AI generations/month',
        'Email support',
      ],
      cta: 'Start Free Trial',
      highlighted: false,
    },
    {
      name: 'Professional',
      price: 149,
      description: 'For growing businesses',
      features: [
        'Up to 5 locations',
        'Unlimited bookings',
        'POS terminal support',
        'Unlimited AI generations',
        'Custom domain',
        'Priority support',
      ],
      cta: 'Start Free Trial',
      highlighted: true,
    },
    {
      name: 'Agency',
      price: 497,
      description: 'White-label for agencies',
      features: [
        'Unlimited locations',
        'Resell to your clients',
        'Your branding only',
        'Stripe Connect revenue share',
        'API access',
        'Dedicated support',
      ],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center font-bold text-sm">
                x3
              </div>
              <span className="text-xl font-bold">x3o.ai</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-zinc-400 hover:text-white transition">Features</a>
              <a href="#pricing" className="text-zinc-400 hover:text-white transition">Pricing</a>
              <a href="#demo" className="text-zinc-400 hover:text-white transition">Demo</a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-zinc-400 hover:text-white transition">
                Sign In
              </Link>
              <Link
                href="/onboarding"
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-4 py-2 rounded-lg font-medium transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm text-zinc-400">Now with AI Content Generation</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Launch Your Own
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent"> Booking Platform</span>
          </h1>

          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            White-label booking software with AI-powered marketing. Perfect for salons, barbershops, spas, and agencies.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full sm:w-80 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:border-violet-500 transition"
            />
            <button className="w-full sm:w-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-8 py-3 rounded-lg font-semibold transition">
              Start Free Trial
            </button>
          </div>

          <p className="text-sm text-zinc-500">14-day free trial. No credit card required.</p>
        </div>

        {/* Board of Directors Visualization */}
        <div className="max-w-5xl mx-auto mt-16 px-4">
          <BoardVisualizer variant="hero" interactive={true} />
        </div>
      </section>

      {/* Board of Directors Section */}
      <section className="py-20 px-4 bg-zinc-900/30 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 mb-6">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 font-medium">AI-Powered Operations</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Your AI <span className="text-cyan-400">Board of Directors</span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Four specialized AI agents work 24/7 to grow your agency, optimize operations, and maximize revenue.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {boardMembers.map((member, index) => {
              const Icon = member.icon;
              return (
                <div
                  key={index}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 hover:border-opacity-60 transition-all group"
                  style={{ borderColor: `${member.color}30` }}
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${member.color}20` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: member.color }} />
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold">{member.name}</h3>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${member.color}20`, color: member.color }}
                    >
                      {member.role}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-sm">{member.description}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/admin/command-center"
              className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 px-6 py-3 rounded-lg font-medium transition"
            >
              <Play className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400">See Command Center Demo</span>
              <ArrowRight className="w-4 h-4 text-cyan-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need to Run Your Business</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              From booking to payments to marketing, all under your brand.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-violet-500/50 transition"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-6">
                <span className="text-violet-400 font-medium">AI-Powered</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Content That Sounds Like <span className="text-violet-400">You</span>
              </h2>
              <p className="text-zinc-400 mb-8">
                Our AI learns your brand voice and generates social posts, email campaigns, and marketing content that resonates with your audience.
              </p>
              <ul className="space-y-4">
                {[
                  'Instagram captions & hashtags',
                  'Email marketing campaigns',
                  'Blog articles & SEO content',
                  'Video scripts for TikTok/Reels',
                  'Client education materials',
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-violet-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                      </svg>
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
                  ✨
                </div>
                <div>
                  <p className="font-medium">AI Content Generator</p>
                  <p className="text-sm text-zinc-500">Powered by Claude</p>
                </div>
              </div>
              <div className="bg-zinc-950 rounded-lg p-4 mb-4">
                <p className="text-sm text-zinc-500 mb-2">Generate a social post about:</p>
                <p className="text-zinc-300">"Summer hair care tips for natural hair"</p>
              </div>
              <div className="bg-zinc-950 rounded-lg p-4 border-l-2 border-violet-500">
                <p className="text-sm mb-2">☀️ Summer is here and your curls need extra love!</p>
                <p className="text-sm text-zinc-400">
                  Here are 3 tips to keep your natural hair thriving in the heat...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-zinc-400">Start free, upgrade when you're ready.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {pricingTiers.map((tier, index) => (
              <div
                key={index}
                className={`rounded-2xl p-8 ${
                  tier.highlighted
                    ? 'bg-gradient-to-b from-violet-600/20 to-fuchsia-600/20 border-2 border-violet-500'
                    : 'bg-zinc-900 border border-zinc-800'
                }`}
              >
                {tier.highlighted && (
                  <div className="text-sm font-medium text-violet-400 mb-4">Most Popular</div>
                )}
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <p className="text-zinc-400 mb-6">{tier.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${tier.price}</span>
                  <span className="text-zinc-500">/month</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, fIndex) => (
                    <li key={fIndex} className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                      </svg>
                      <span className="text-zinc-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 rounded-lg font-semibold transition ${
                    tier.highlighted
                      ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500'
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Launch Your Platform?</h2>
          <p className="text-zinc-400 mb-10 text-lg">
            Join hundreds of salons and agencies already using x3o.ai
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 px-8 py-4 rounded-lg font-semibold text-lg transition"
          >
            Start Your Free Trial
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center font-bold text-sm">
                x3
              </div>
              <span className="text-xl font-bold">x3o.ai</span>
            </div>
            <div className="flex items-center gap-8">
              <a href="#" className="text-zinc-400 hover:text-white transition">Privacy</a>
              <a href="#" className="text-zinc-400 hover:text-white transition">Terms</a>
              <a href="#" className="text-zinc-400 hover:text-white transition">Contact</a>
            </div>
            <p className="text-zinc-500 text-sm">© 2025 x3o.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
