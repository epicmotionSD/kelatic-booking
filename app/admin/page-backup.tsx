'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';
import { Calendar, CreditCard, Users, TrendingUp, AlertTriangle, CheckCircle, Settings, Zap, Target, Clock } from 'lucide-react';

interface DashboardMetrics {
  todayAppointments: number;
  weekAppointments: number;
  todayRevenue: number;
  weekRevenue: number;
  newClients: number;
  pendingDeposits: number;
  upcomingAppointments: any[];
  recentPayments: any[];
  topServices: { name: string; count: number }[];
}

interface SetupStatus {
  googleCalendar: boolean;
  smsEmail: boolean;
  businessInfo: boolean;
  paymentSetup: boolean;
}

interface BusinessInsight {
  type: 'success' | 'warning' | 'info' | 'action';
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
    variant: 'primary' | 'secondary';
  };
  icon: React.ReactNode;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    Promise.all([fetchMetrics(), checkSetupStatus()]);
  }, []);

  async function fetchMetrics() {
    try {
      const res = await fetch('/api/admin/dashboard');
      const data = await res.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkSetupStatus() {
    try {
      const response = await fetch('/api/admin/settings');
      const data = await response.json();
      
      if (data.success && data.settings) {
        setSetupStatus({
          googleCalendar: data.settings.googleCalendarConnected || false,
          smsEmail: data.settings.smsEmailEnabled || false,
          businessInfo: !!(data.settings.name && data.settings.email && data.settings.phone),
          paymentSetup: true // Assume payment is set up if they have revenue
        });
      }
    } catch (error) {
      console.error('Failed to check setup status:', error);
    }
  }

  // Generate smart business insights
  const generateInsights = (): BusinessInsight[] => {
    const insights: BusinessInsight[] = [];
    
    if (!setupStatus) return insights;

    // Setup incomplete insights
    if (!setupStatus.googleCalendar || !setupStatus.smsEmail) {
      insights.push({
        type: 'action',
        title: 'Complete Your Setup',
        description: `${!setupStatus.googleCalendar ? 'Google Calendar' : ''}${!setupStatus.googleCalendar && !setupStatus.smsEmail ? ' and ' : ''}${!setupStatus.smsEmail ? 'SMS notifications' : ''} ${(!setupStatus.googleCalendar && !setupStatus.smsEmail) ? 'are' : 'is'} not connected.`,
        action: {
          label: 'Complete Setup',
          href: '/admin/settings?tab=integrations',
          variant: 'primary'
        },
        icon: <Settings className="w-5 h-5" />
      });
    }

    // Business performance insights
    if (metrics) {
      if (metrics.pendingDeposits > 0) {
        insights.push({
          type: 'warning',
          title: 'Pending Deposits',
          description: `${metrics.pendingDeposits} appointment${metrics.pendingDeposits !== 1 ? 's' : ''} awaiting payment confirmation.`,
          action: {
            label: 'Review Pending',
            href: '/admin/appointments?status=pending',
            variant: 'secondary'
          },
          icon: <AlertTriangle className="w-5 h-5" />
        });
      }

      if (metrics.todayAppointments === 0 && new Date().getHours() > 10) {
        insights.push({
          type: 'info',
          title: 'No Appointments Today',
          description: 'Consider reaching out to clients or running a promotion.',
          action: {
            label: 'Book Appointment',
            href: '/admin/appointments/new',
            variant: 'primary'
          },
          icon: <Target className="w-5 h-5" />
        });
      }

      if (metrics.newClients > 5) {
        insights.push({
          type: 'success',
          title: 'Growing Client Base',
          description: `${metrics.newClients} new clients this month! Your business is growing.`,
          icon: <TrendingUp className="w-5 h-5" />
        });
      }
    }

    return insights;
  };

  const insights = generateInsights();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
      </div>
    );
  }

  const stats = [
    {
      label: "Today's Appointments",
      value: metrics?.todayAppointments || 0,
      icon: <Calendar className="w-6 h-6" />,
      color: 'from-blue-400 to-blue-500',
      bgColor: 'bg-blue-500/10',
      change: metrics?.weekAppointments ? `${Math.round(((metrics.todayAppointments / metrics.weekAppointments) * 7 - 1) * 100)}%` : null
    },
    {
      label: "Today's Revenue",
      value: formatCurrency((metrics?.todayRevenue || 0) * 100),
      icon: <CreditCard className="w-6 h-6" />,
      color: 'from-emerald-400 to-green-500',
      bgColor: 'bg-emerald-500/10',
      change: metrics?.weekRevenue ? `${Math.round(((metrics.todayRevenue / metrics.weekRevenue) * 7 - 1) * 100)}%` : null
    },
    {
      label: 'This Week',
      value: metrics?.weekAppointments || 0,
      subtitle: 'appointments',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-amber-400 to-yellow-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      label: 'New Clients',
      value: metrics?.newClients || 0,
      subtitle: 'this month',
      icon: <Users className="w-6 h-6" />,
      color: 'from-purple-400 to-pink-500',
      bgColor: 'bg-purple-500/10'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header with Smart Insights */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back! 
            <span className="bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent"> ✨</span>
          </h1>
          <p className="text-white/60">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        {/* Quick Actions */}
        <div className="flex gap-3">
          <Link
            href="/admin/appointments/new"
            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center gap-2"
          >
            <Calendar className="w-5 h-5" />
            New Appointment
          </Link>
        </div>
      </div>

      {/* Smart Business Insights */}
      {insights.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Business Insights
          </h2>
          <div className="grid gap-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border backdrop-blur-sm ${
                  insight.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/20' 
                    : insight.type === 'warning' 
                    ? 'bg-amber-500/10 border-amber-500/20'
                    : insight.type === 'action'
                    ? 'bg-blue-500/10 border-blue-500/20'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      insight.type === 'success' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : insight.type === 'warning' 
                        ? 'bg-amber-500/20 text-amber-400'
                        : insight.type === 'action'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-white/10 text-white/60'
                    }`}>
                      {insight.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{insight.title}</h3>
                      <p className="text-sm text-white/60 mt-1">{insight.description}</p>
                    </div>
                  </div>
                  {insight.action && (
                    <Link
                      href={insight.action.href}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                        insight.action.variant === 'primary'
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:shadow-lg hover:shadow-amber-500/30'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {insight.action.label}
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6 hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <div className={`bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.icon}
                </div>
              </div>
              {stat.change && (
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  stat.change.startsWith('-') 
                    ? 'text-red-400 bg-red-500/10' 
                    : 'text-green-400 bg-green-500/10'
                }`}>
                  {stat.change}
                </span>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-white/50 text-sm">{stat.label}</p>
              {stat.subtitle && (
                <p className="text-white/30 text-xs">{stat.subtitle}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upcoming Appointments */}
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-semibold text-white">Upcoming Today</h2>
            <Link
              href="/admin/appointments"
              className="text-sm text-amber-400 hover:text-amber-300"
            >
              View All →
            </Link>
          </div>
          <div className="divide-y divide-white/10">
            {metrics?.upcomingAppointments?.length === 0 ? (
              <div className="p-6 text-center text-white/50">
                No appointments scheduled for today
              </div>
            ) : (
              metrics?.upcomingAppointments?.slice(0, 5).map((apt) => (
                <div key={apt.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-400/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-400 font-semibold">
                        {apt.client_name?.[0] || 'W'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {apt.client_name || 'Walk-in'}
                      </p>
                      <p className="text-sm text-white/50">{apt.service_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-white">{apt.time}</p>
                      <p className="text-sm text-white/50">{apt.stylist_name}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        apt.status === 'confirmed'
                          ? 'bg-green-500/20 text-green-400'
                          : apt.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-white/10 text-white/60'
                      }`}
                    >
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-semibold text-white">Recent Payments</h2>
            <Link
              href="/admin/reports"
              className="text-sm text-amber-400 hover:text-amber-300"
            >
              View Reports →
            </Link>
          </div>
          <div className="divide-y divide-white/10">
            {metrics?.recentPayments?.length === 0 ? (
              <div className="p-6 text-center text-white/50">
                No recent payments
              </div>
            ) : (
              metrics?.recentPayments?.slice(0, 5).map((payment) => (
                <div key={payment.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">
                        {payment.client_name}
                      </p>
                      <p className="text-sm text-white/50">
                        {payment.service_name} • {payment.time_ago}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-amber-400">
                        {formatCurrency(payment.amount * 100)}
                      </p>
                      <p className="text-xs text-white/50">
                        {payment.method === 'card_terminal' ? 'Card (POS)' :
                         payment.method === 'card_online' ? 'Card (Online)' :
                         payment.method === 'cash' ? 'Cash' : payment.method}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Services */}
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10">
          <div className="p-6 border-b border-white/10">
            <h2 className="font-semibold text-white">Popular Services This Week</h2>
          </div>
          <div className="p-6">
            {metrics?.topServices?.map((service, index) => (
              <div key={service.name} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">
                    {index + 1}. {service.name}
                  </span>
                  <span className="text-sm text-white/50">{service.count} bookings</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-yellow-500 h-2 rounded-full"
                    style={{
                      width: `${(service.count / (metrics?.topServices?.[0]?.count || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {(!metrics?.topServices || metrics.topServices.length === 0) && (
              <p className="text-center text-white/50">No data yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10">
          <div className="p-6 border-b border-white/10">
            <h2 className="font-semibold text-white">Quick Actions</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <Link
              href="/admin/pos"
              className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10"
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-white">Open POS</span>
            </Link>

            <Link
              href="/admin/appointments/new"
              className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-sm font-medium text-white">Book Appointment</span>
            </Link>

            <Link
              href="/admin/clients/new"
              className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10"
            >
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-white">Add Client</span>
            </Link>

            <Link
              href="/admin/services"
              className="flex flex-col items-center justify-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10"
            >
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="text-sm font-medium text-white">Manage Services</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Pending Actions Alert */}
      {(metrics?.pendingDeposits || 0) > 0 && (
        <div className="mt-8 bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-400/20 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-medium text-amber-400">
              {metrics?.pendingDeposits} pending deposit{metrics?.pendingDeposits !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-white/60">
              These appointments haven&apos;t been confirmed with payment yet
            </p>
          </div>
          <Link
            href="/admin/appointments?status=pending"
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all text-sm"
          >
            View Pending
          </Link>
        </div>
      )}
    </div>
  );
}
