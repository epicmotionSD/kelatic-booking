'use client';

import Link from 'next/link';
import { useState } from 'react';
import { 
  DollarSign, 
  Zap, 
  ArrowRight, 
  Users, 
  MessageSquare, 
  Clock, 
  TrendingUp,
  CheckCircle,
  Phone,
  Mail,
  Calendar,
  BarChart3,
  Shield,
  Sparkles
} from 'lucide-react';

export default function PlatformLandingPage() {
  const [businessName, setBusinessName] = useState('');

  const problemStats = [
    { stat: '67%', label: 'of first-time clients do not rebook without follow-up' },
    { stat: '$4,200', label: 'average monthly revenue leakage from inactive demand' },
    { stat: '23%', label: 'of inbound conversations go cold before booking' },
  ];

  const sprintDeliverables = [
    {
      icon: Users,
      title: 'Ghost Client Revival',
      description: 'AI identifies and re-engages clients who have not booked in 60+ days with personalized outreach.',
    },
    {
      icon: MessageSquare,
      title: 'Conversation Recovery',
      description: 'Trinity AI detects cold conversations and follows up automatically across your channels.',
    },
    {
      icon: Calendar,
      title: 'Instant Slot Filling',
      description: 'When a cancellation happens, AI messages your waitlist and fills the slot in minutes.',
    },
    {
      icon: BarChart3,
      title: 'Revenue Dashboard',
      description: 'Track recovered revenue, response rates, and fill rate in one operational dashboard.',
    },
  ];

  const comparisonData = [
    { feature: 'Reactivate ghost clients', us: true, them: false },
    { feature: 'Auto-respond to DMs 24/7', us: true, them: false },
    { feature: 'Fill last-minute cancellations', us: true, them: false },
    { feature: 'Show "Recovered Revenue" metrics', us: true, them: false },
    { feature: 'Works with your existing booking tool', us: true, them: true },
    { feature: 'Native booking UI included', us: false, them: true },
    { feature: 'Monthly subscription', us: true, them: true },
  ];

  const testimonials = [
    {
      quote: "In the first week, Trinity recovered clients I thought were gone for good. That revenue would have stayed lost.",
      author: 'Jasmine T.',
      role: 'Salon Owner, Atlanta',
      revenue: '$2,400/mo recovered',
    },
    {
      quote: "I stopped paying my VA to chase cold conversations. Trinity follows up instantly and consistently.",
      author: 'Marcus R.',
      role: 'Gym Operator, Chicago',
      revenue: '$1,800/mo recovered',
    },
    {
      quote: "Ghost client reactivation alone paid for the service quickly. The dashboard made ROI obvious.",
      author: 'Keisha W.',
      role: 'Wellness Clinic, Houston',
      revenue: '$3,100/mo recovered',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white" suppressHydrationWarning>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-sm">
                x3
              </div>
              <span className="text-xl font-bold">x3o.ai</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#problem" className="text-zinc-400 hover:text-white transition">The Problem</a>
              <a href="#solution" className="text-zinc-400 hover:text-white transition">How It Works</a>
              <a href="#proof" className="text-zinc-400 hover:text-white transition">Results</a>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-zinc-400 hover:text-white transition">
                Sign In
              </Link>
              <Link
                href="/onboarding"
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 px-4 py-2 rounded-lg font-medium transition"
              >
                Start Revenue Sprint
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-8">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">Revenue Recovery AI for Service Businesses</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Recover Revenue
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"> From Existing Demand</span>
          </h1>

          <p className="text-xl text-zinc-400 mb-4 max-w-3xl mx-auto">
            Ghost clients. Cold conversations. Last-minute cancellations.
          </p>
          <p className="text-2xl text-white mb-10 max-w-3xl mx-auto font-semibold">
            We plug the leaks while your current booking tool stays in place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/onboarding"
              className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 px-8 py-4 rounded-lg font-semibold text-lg transition flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Start Revenue Sprint
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <p className="text-sm text-zinc-500 mb-12">
            $1,500 one-time • See recovered revenue in 7 days or money back
          </p>

          {/* Problem Stats */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {problemStats.map((item, index) => (
              <div key={index} className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                <div className="text-4xl font-bold text-red-400 mb-2">{item.stat}</div>
                <p className="text-zinc-400 text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-20 px-4 bg-zinc-900/30 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Keep Your Booking Stack.
              <span className="text-red-400"> Recover What It Misses.</span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              x3o.ai is the recovery layer on top of your existing booking platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Ghost Clients</h3>
                    <p className="text-zinc-400 text-sm">
                      They booked before, then stopped returning. Automated outreach brings them back.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Dead DMs</h3>
                    <p className="text-zinc-400 text-sm">
                      Inquiries stall before booking. Trinity follows up until they convert or opt out.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Empty Chairs</h3>
                    <p className="text-zinc-400 text-sm">
                      Cancellations create wasted capacity. x3o.ai fills openings from your waitlist instantly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-8">
              <div className="text-center">
                <div className="text-6xl font-bold text-red-400 mb-2">$4,200</div>
                <p className="text-zinc-400 mb-6">Average monthly revenue lost to client leakage</p>
                <div className="h-px bg-zinc-800 mb-6"></div>
                <p className="text-sm text-zinc-500">
                  Illustrative baseline for service businesses with recurring clients and limited follow-up capacity
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Integration-First Revenue Recovery</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Meet <span className="text-emerald-400">Trinity</span> — Your AI Revenue Agent
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              Not another booking UI. Trinity runs the recovery workflows your team does not have time to run.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {sprintDeliverables.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-zinc-900/80 border border-emerald-500/20 rounded-2xl p-6 hover:border-emerald-500/40 transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110">
                      <Icon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                      <p className="text-zinc-400">{item.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-zinc-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The 7-Day Revenue Sprint</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              We deploy Trinity on top of your current system and measure recovered revenue in real time.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { day: 'Day 1-2', title: 'Connect & Analyze', desc: 'We connect to your booking system and analyze your client database for revenue leaks.' },
              { day: 'Day 3-4', title: 'Launch Recovery Flows', desc: 'Trinity activates ghost revival, conversation recovery, and slot-filling workflows.' },
              { day: 'Day 5-6', title: 'Optimize Messaging', desc: 'We tune script variants from live response data to improve conversion.' },
              { day: 'Day 7', title: 'Revenue Report', desc: 'You receive a full recovered-revenue report and ongoing plan recommendation.' },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-emerald-400 font-bold">{index + 1}</span>
                </div>
                <div className="text-emerald-400 text-sm font-medium mb-2">{step.day}</div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-zinc-400 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Built to Layer on Top of
              <span className="text-zinc-500 line-through"> Your Existing Booking Stack</span>
            </h2>
            <p className="text-zinc-400">
              Booking tools schedule appointments. x3o.ai recovers the demand they do not capture.
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 bg-zinc-800/50 p-4">
              <div className="font-medium">Feature</div>
              <div className="text-center font-medium text-emerald-400">x3o.ai</div>
              <div className="text-center font-medium text-zinc-400">Booking Platforms</div>
            </div>
            {comparisonData.map((row, index) => (
              <div key={index} className="grid grid-cols-3 p-4 border-t border-zinc-800">
                <div className="text-zinc-300">{row.feature}</div>
                <div className="text-center">
                  {row.us ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-zinc-600 rounded-full mx-auto" />
                  )}
                </div>
                <div className="text-center">
                  {row.them ? (
                    <CheckCircle className="w-5 h-5 text-zinc-400 mx-auto" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-zinc-600 rounded-full mx-auto" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="proof" className="py-20 px-4 bg-zinc-900/30 border-y border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Real Money. <span className="text-emerald-400">Real Recovery.</span>
            </h2>
            <p className="text-zinc-400">From stylists who plugged their revenue leaks.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="text-emerald-400 font-bold text-lg">{testimonial.revenue}</div>
                </div>
                <p className="text-zinc-300 mb-6 italic">"{testimonial.quote}"</p>
                <div>
                  <div className="font-medium">{testimonial.author}</div>
                  <div className="text-sm text-zinc-500">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Start with Results. Continue with Scale.</h2>
            <p className="text-zinc-400">Sprint first, then ongoing recovery automation.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Sprint Package */}
            <div className="bg-gradient-to-b from-emerald-600/20 to-cyan-600/20 border-2 border-emerald-500 rounded-2xl p-8">
              <div className="text-sm font-medium text-emerald-400 mb-4">Most Popular</div>
              <h3 className="text-2xl font-bold mb-2">7-Day Revenue Sprint</h3>
              <p className="text-zinc-400 mb-6">Find your leaks. Plug them. Verify ROI.</p>
              <div className="mb-6">
                <span className="text-5xl font-bold">$1,500</span>
                <span className="text-zinc-500"> one-time</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Full client database analysis',
                  'Ghost client reactivation campaign',
                  'Trinity AI deployment (7 days)',
                  'Conversation and cancellation recovery system',
                  'Revenue recovery dashboard',
                  'Strategy call with results',
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/onboarding"
                className="block w-full py-4 rounded-lg font-semibold text-center bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 transition"
              >
                Start Revenue Sprint
              </Link>
              <p className="text-center text-sm text-zinc-500 mt-4">
                💰 Money-back guarantee if we don't recover at least $500
              </p>
            </div>

            {/* Ongoing */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <div className="text-sm font-medium text-zinc-500 mb-4">After Sprint</div>
              <h3 className="text-2xl font-bold mb-2">Trinity Agent</h3>
              <p className="text-zinc-400 mb-6">Keep the AI workforce running 24/7.</p>
              <div className="mb-6">
                <span className="text-5xl font-bold">$297</span>
                <span className="text-zinc-500">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Continuous ghost reactivation',
                  '24/7 DM response',
                  'Instant cancellation filling',
                  'Monthly revenue reports',
                  'Priority support',
                  'Works with any calendar system',
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-zinc-400" />
                    <span className="text-zinc-300">{feature}</span>
                  </li>
                ))}
              </ul>
              <button className="w-full py-4 rounded-lg font-semibold bg-zinc-800 hover:bg-zinc-700 transition">
                Available After Sprint
              </button>
              <p className="text-center text-sm text-zinc-500 mt-4">
                Cancel anytime. No long-term contracts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-b from-zinc-950 to-emerald-950/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            How Much Revenue Is Slipping Through Right Now?
          </h2>
          <p className="text-zinc-400 mb-10 text-lg">
            The average service business leaks thousands each month from missed follow-up and unused capacity.
            <br />
            <span className="text-white font-semibold">Let’s map your leakage and recover it fast.</span>
          </p>
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 px-8 py-4 rounded-lg font-semibold text-lg transition"
          >
            <Zap className="w-5 h-5" />
            Start Revenue Sprint
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-sm text-zinc-500 mt-6">
            $1,500 one-time • Results in 7 days or money back
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-sm">
                x3
              </div>
              <span className="text-xl font-bold">x3o.ai</span>
            </div>
            <div className="flex items-center gap-8">
              <a href="#" className="text-zinc-400 hover:text-white transition">Privacy</a>
              <a href="#" className="text-zinc-400 hover:text-white transition">Terms</a>
              <a href="mailto:hey@x3o.ai" className="text-zinc-400 hover:text-white transition">Contact</a>
            </div>
            <p className="text-zinc-500 text-sm">© 2026 x3o.ai. Revenue Recovery AI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
