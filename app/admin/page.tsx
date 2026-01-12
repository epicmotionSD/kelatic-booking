'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';
import { Calendar, CreditCard, Users, TrendingUp, AlertTriangle, CheckCircle, Settings, Zap, Target, Clock, ArrowUpRight, ArrowDownRight, PlusCircle } from 'lucide-react';

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
          paymentSetup: true
        });
      }
    } catch (error) {
      console.error('Failed to check setup status:', error);
    }
  }

  const generateInsights = (): BusinessInsight[] => {
    const insights: BusinessInsight[] = [];
    
    if (!setupStatus) return insights;

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

    if (metrics) {
      if ((metrics.pendingDeposits || 0) > 0) {
        insights.push({
          type: 'warning',
          title: 'Pending Payments',
          description: `${metrics.pendingDeposits} appointment${metrics.pendingDeposits !== 1 ? 's' : ''} awaiting payment confirmation.`,
          action: {
            label: 'View Pending',
            href: '/admin/appointments?status=pending',
            variant: 'secondary'
          },
          icon: <AlertTriangle className="w-5 h-5" />
        });
      }

      if ((metrics.todayAppointments || 0) === 0 && new Date().getHours() > 10) {
        insights.push({
          type: 'info',
          title: 'No Appointments Today',
          description: 'Reach out to your clients or create a promotion.',
          action: {
            label: 'Create Appointment',
            href: '/admin/appointments/new',
            variant: 'primary'
          },
          icon: <Target className="w-5 h-5" />
        });
      }

      if ((metrics.newClients || 0) > 5) {
        insights.push({
          type: 'success',
          title: 'Client Growth',
          description: `${metrics.newClients} new clients have joined this month!`,
          icon: <TrendingUp className="w-5 h-5" />
        });
      }
    }

    return insights;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-amber-400 shadow-lg" />
      </div>
    );
  }

  const insights = generateInsights();
  const weeklyGrowth = metrics?.weekRevenue && metrics?.todayRevenue 
    ? Math.round((((metrics.todayRevenue || 0) / ((metrics.weekRevenue || 1) / 7)) - 1) * 100) 
    : 0;

  const stats = [
    {
      label: "Today's Appointments",
      value: metrics?.todayAppointments || 0,
      icon: <Calendar className="w-6 h-6" />,
      color: 'from-gold-400 to-amber-500',
      bgColor: 'bg-gradient-to-br from-gold-500/20 to-amber-400/20',
      change: metrics?.weekAppointments ? `${Math.round((((metrics.todayAppointments || 0) / ((metrics.weekAppointments || 1) / 7)) - 1) * 100)}%` : null,
      trend: (metrics?.todayAppointments || 0) > ((metrics?.weekAppointments || 0) / 7) ? 'up' : 'down'
    },
    {
      label: "Today's Revenue",
      value: formatCurrency((metrics?.todayRevenue || 0) * 100),
      icon: <CreditCard className="w-6 h-6" />,
      color: 'from-emerald-400 to-green-500',
      bgColor: 'bg-gradient-to-br from-emerald-500/20 to-green-400/20',
      change: weeklyGrowth ? `${weeklyGrowth}%` : null,
      trend: weeklyGrowth > 0 ? 'up' : 'down'
    },
    {
      label: 'This Week',
      value: metrics?.weekAppointments || 0,
      subtitle: 'appointments',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-orange-400 to-amber-500',
      bgColor: 'bg-gradient-to-br from-orange-500/20 to-amber-400/20'
    },
    {
      label: 'New Clients',
      value: metrics?.newClients || 0,
      subtitle: 'this month',
      icon: <Users className="w-6 h-6" />,
      color: 'from-purple-400 to-pink-500',
      bgColor: 'bg-gradient-to-br from-purple-500/20 to-pink-400/20'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Premium Dark Header */}
      <div className="bg-zinc-900 p-8 rounded-2xl border border-white/10 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-playfair font-bold mb-3">
              <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-400 bg-clip-text text-transparent">
                Welcome back!
              </span>
            </h1>
            <p className="text-white/70 text-lg font-medium">
              Master your craft • {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Link
              href="/admin/appointments/new"
              className="px-8 py-4 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-2xl font-bold hover:shadow-xl hover:shadow-amber-500/30 transition-all flex items-center gap-3 hover:scale-105 transform shadow-lg"
            >
              <Calendar className="w-6 h-6" />
              New Appointment
            </Link>
          </div>
        </div>
      </div>

      {/* Business Insights */}
      {insights.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-playfair font-bold text-white flex items-center gap-3">
            <Zap className="w-6 h-6 text-amber-400" />
            Business Insights
          </h2>
          <div className="grid gap-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`bg-zinc-900 p-6 rounded-2xl border shadow-lg hover:shadow-xl transition-all ${
                  insight.type === 'success' 
                    ? 'border-emerald-500/30' 
                    : insight.type === 'warning' 
                    ? 'border-amber-500/30'
                    : insight.type === 'action'
                    ? 'border-amber-500/30'
                    : 'border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-2xl shadow-lg ${
                      insight.type === 'success' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : insight.type === 'warning' 
                        ? 'bg-amber-500/20 text-amber-400'
                        : insight.type === 'action'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-white/10 text-white/70'
                    }`}>
                      {insight.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg">{insight.title}</h3>
                      <p className="text-white/60 mt-1">{insight.description}</p>
                    </div>
                  </div>
                  {insight.action && (
                    <Link
                      href={insight.action.href}
                      className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 transform ${
                        insight.action.variant === 'primary'
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:shadow-amber-500/40'
                          : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      {insight.action.label}
                      <ArrowUpRight className="w-4 h-4" />
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
            className="bg-zinc-900 rounded-2xl border border-white/10 p-6 hover:shadow-lg transition-all group shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 rounded-2xl bg-white/5 shadow-sm border border-white/10">
                <div className={`text-amber-400`}>
                  {stat.icon}
                </div>
              </div>
              {stat.change && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm font-bold ${
                    stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className="text-3xl font-bold text-white mb-2">{stat.value}</p>
              <p className="text-white/70 font-medium">{stat.label}</p>
              {stat.subtitle && (
                <p className="text-white/50 text-sm font-light">{stat.subtitle}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upcoming Appointments */}
        <div className="bg-zinc-900 rounded-2xl border border-white/10 shadow-lg">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-playfair font-bold text-white flex items-center gap-3">
              <Clock className="w-6 h-6 text-amber-400" />
              Today's Appointments
            </h2>
            <Link
              href="/admin/appointments"
              className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
            >
              View All Appointments
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-white/10">
            {metrics?.upcomingAppointments?.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-amber-400" />
                </div>
                <p className="text-white/60 mb-4">No appointments scheduled for today</p>
                <Link
                  href="/admin/appointments/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Book First Appointment
                </Link>
              </div>
            ) : (
              metrics?.upcomingAppointments?.slice(0, 5).map((appointment) => (
                <div key={appointment.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400/20 to-purple-500/20 rounded-full flex items-center justify-center border border-blue-400/30">
                      <span className="text-sm text-blue-400 font-bold">
                        {appointment.client_name?.charAt(0) || 'W'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {appointment.client_name}
                      </p>
                      <p className="text-sm text-white/50">
                        {appointment.service_name} • {appointment.stylist_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-amber-400">
                        {appointment.time}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        appointment.status === 'confirmed' 
                          ? 'bg-green-500/20 text-green-400' 
                          : appointment.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-zinc-900 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-playfair font-bold text-white flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-emerald-400" />
              Revenue
            </h2>
            <Link
              href="/admin/reports"
              className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
            >
              View Reports
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-white/10">
            {metrics?.recentPayments?.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CreditCard className="w-10 h-10 text-emerald-400" />
                </div>
                <p className="text-white/60">No divine payments yet</p>
              </div>
            ) : (
              metrics?.recentPayments?.slice(0, 5).map((payment) => (
                <div key={payment.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">
                        {payment.client_name}
                      </p>
                      <p className="text-sm text-white/60">
                        {payment.service_name} • {payment.time_ago}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-400">
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
        <div className="bg-zinc-900 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl">
          <div className="p-6 border-b border-white/10">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              Popular Services This Week
            </h2>
          </div>
          <div className="p-6">
            {metrics?.topServices?.map((service, index) => (
              <div key={service.name} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white flex items-center gap-2">
                    <span className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center text-xs text-amber-400 font-bold">
                      {index + 1}
                    </span>
                    {service.name}
                  </span>
                  <span className="text-sm text-white/60">{service.count} bookings</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-yellow-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${(service.count / (metrics?.topServices?.[0]?.count || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {(!metrics?.topServices || metrics.topServices.length === 0) && (
              <p className="text-center text-white/60">No data yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-zinc-900 backdrop-blur-xl rounded-xl border border-white/10 shadow-xl">
          <div className="p-6 border-b border-white/10">
            <h2 className="font-semibold text-white">Quick Actions</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <Link
              href="/admin/pos"
              className="flex flex-col items-center justify-center p-4 bg-emerald-500/10 rounded-xl hover:bg-emerald-500/20 transition-colors border border-emerald-500/30 group"
            >
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-sm font-medium text-white">Open POS</span>
            </Link>

            <Link
              href="/admin/appointments/new"
              className="flex flex-col items-center justify-center p-4 bg-blue-500/10 rounded-xl hover:bg-blue-500/20 transition-colors border border-blue-500/30 group"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-sm font-medium text-white">Book Appointment</span>
            </Link>

            <Link
              href="/admin/clients/new"
              className="flex flex-col items-center justify-center p-4 bg-purple-500/10 rounded-xl hover:bg-purple-500/20 transition-colors border border-purple-500/30 group"
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-sm font-medium text-white">Add Client</span>
            </Link>

            <Link
              href="/admin/services"
              className="flex flex-col items-center justify-center p-4 bg-amber-500/10 rounded-xl hover:bg-amber-500/20 transition-colors border border-amber-500/30 group"
            >
              <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Settings className="w-6 h-6 text-amber-400" />
              </div>
              <span className="text-sm font-medium text-white">Manage Services</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Pending Actions Alert */}
      {(metrics?.pendingDeposits || 0) > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-amber-400">
              {metrics?.pendingDeposits} pending deposit{metrics?.pendingDeposits !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-amber-400/70">
              These appointments haven&apos;t been confirmed with payment yet
            </p>
          </div>
          <Link
            href="/admin/appointments?status=pending"
            className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all text-sm flex items-center gap-2"
          >
            View Pending
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}