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
        title: 'Complete Your Divine Setup',
        description: `${!setupStatus.googleCalendar ? 'Divine Calendar' : ''}${!setupStatus.googleCalendar && !setupStatus.smsEmail ? ' and ' : ''}${!setupStatus.smsEmail ? 'Sacred SMS notifications' : ''} ${(!setupStatus.googleCalendar && !setupStatus.smsEmail) ? 'are' : 'is'} not connected to your divine throne.`,
        action: {
          label: 'Ascend to Completion',
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
          title: 'Divine Offerings Pending',
          description: `${metrics.pendingDeposits} sacred session${metrics.pendingDeposits !== 1 ? 's' : ''} awaiting golden payment confirmation.`,
          action: {
            label: 'Collect Divine Offerings',
            href: '/admin/appointments?status=pending',
            variant: 'secondary'
          },
          icon: <AlertTriangle className="w-5 h-5" />
        });
      }

      if ((metrics.todayAppointments || 0) === 0 && new Date().getHours() > 10) {
        insights.push({
          type: 'info',
          title: 'No Divine Sessions Today',
          description: 'Reach out to your disciples or bless them with a divine promotion.',
          action: {
            label: 'Create Divine Session',
            href: '/admin/appointments/new',
            variant: 'primary'
          },
          icon: <Target className="w-5 h-5" />
        });
      }

      if ((metrics.newClients || 0) > 5) {
        insights.push({
          type: 'success',
          title: 'Divine Disciples Growing',
          description: `${metrics.newClients} new disciples have joined your sacred craft this month! Your divine reign expands.`,
          icon: <TrendingUp className="w-5 h-5" />
        });
      }
    }

    return insights;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold-500/20 border-t-gold-400 shadow-lg" />
      </div>
    );
  }

  const insights = generateInsights();
  const weeklyGrowth = metrics?.weekRevenue && metrics?.todayRevenue 
    ? Math.round((((metrics.todayRevenue || 0) / ((metrics.weekRevenue || 1) / 7)) - 1) * 100) 
    : 0;

  const stats = [
    {
      label: "Today's Divine Sessions",
      value: metrics?.todayAppointments || 0,
      icon: <Calendar className="w-6 h-6" />,
      color: 'from-gold-400 to-amber-500',
      bgColor: 'bg-gradient-to-br from-gold-500/20 to-amber-400/20',
      change: metrics?.weekAppointments ? `${Math.round((((metrics.todayAppointments || 0) / ((metrics.weekAppointments || 1) / 7)) - 1) * 100)}%` : null,
      trend: (metrics?.todayAppointments || 0) > ((metrics?.weekAppointments || 0) / 7) ? 'up' : 'down'
    },
    {
      label: "Today's Golden Revenue",
      value: formatCurrency((metrics?.todayRevenue || 0) * 100),
      icon: <CreditCard className="w-6 h-6" />,
      color: 'from-emerald-400 to-green-500',
      bgColor: 'bg-gradient-to-br from-emerald-500/20 to-green-400/20',
      change: weeklyGrowth ? `${weeklyGrowth}%` : null,
      trend: weeklyGrowth > 0 ? 'up' : 'down'
    },
    {
      label: 'This Divine Week',
      value: metrics?.weekAppointments || 0,
      subtitle: 'blessed appointments',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-orange-400 to-amber-500',
      bgColor: 'bg-gradient-to-br from-orange-500/20 to-amber-400/20'
    },
    {
      label: 'New Disciples',
      value: metrics?.newClients || 0,
      subtitle: 'joining the divine craft',
      icon: <Users className="w-6 h-6" />,
      color: 'from-purple-400 to-pink-500',
      bgColor: 'bg-gradient-to-br from-purple-500/20 to-pink-400/20'
    },
  ];

  return (
    <div className="space-y-8">
      {/* Premium Glass Header */}
      <div className="glass-header p-8 rounded-3xl border border-white/10 backdrop-blur-xl bg-gradient-to-r from-gold-500/20 to-amber-400/20 shadow-2xl shadow-gold-500/10">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-3">
              <span className="bg-gradient-to-r from-gold-300 via-amber-200 to-orange-200 bg-clip-text text-transparent">
                ✨ Welcome back, Divine Loctician! 
              </span>
            </h1>
            <p className="text-amber-100/80 text-lg font-medium">
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
              className="px-8 py-4 bg-gradient-to-r from-gold-400 via-amber-400 to-orange-400 text-black rounded-2xl font-bold hover:shadow-xl hover:shadow-gold-500/40 transition-all flex items-center gap-3 hover:scale-105 transform shadow-lg"
            >
              <Calendar className="w-6 h-6" />
              New Divine Appointment
            </Link>
          </div>
        </div>
      </div>

      {/* Divine Business Insights */}
      {insights.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gold-300 to-amber-200 bg-clip-text text-transparent flex items-center gap-3">
            <Zap className="w-6 h-6 text-gold-400" />
            Divine Business Insights
          </h2>
          <div className="grid gap-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`stats-card p-6 rounded-2xl border backdrop-blur-sm shadow-lg hover:shadow-xl transition-all ${
                  insight.type === 'success' 
                    ? 'bg-gradient-to-r from-emerald-500/20 to-green-400/20 border-emerald-500/30' 
                    : insight.type === 'warning' 
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-400/20 border-amber-500/30'
                    : insight.type === 'action'
                    ? 'bg-gradient-to-r from-gold-500/20 to-amber-400/20 border-gold-500/30'
                    : 'bg-gradient-to-r from-white/10 to-white/5 border-white/20'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-2xl shadow-lg ${
                      insight.type === 'success' 
                        ? 'bg-gradient-to-br from-emerald-500/30 to-green-400/30 text-emerald-300' 
                        : insight.type === 'warning' 
                        ? 'bg-gradient-to-br from-amber-500/30 to-orange-400/30 text-amber-300'
                        : insight.type === 'action'
                        ? 'bg-gradient-to-br from-gold-500/30 to-amber-400/30 text-gold-300'
                        : 'bg-gradient-to-br from-white/20 to-white/10 text-white/70'
                    }`}>
                      {insight.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-amber-100 text-lg">{insight.title}</h3>
                      <p className="text-amber-200/70 mt-1">{insight.description}</p>
                    </div>
                  </div>
                  {insight.action && (
                    <Link
                      href={insight.action.href}
                      className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 transform ${
                        insight.action.variant === 'primary'
                          ? 'bg-gradient-to-r from-gold-400 via-amber-400 to-orange-400 text-black hover:shadow-gold-500/40'
                          : 'bg-gradient-to-r from-white/20 to-white/10 text-amber-200 hover:from-white/30 hover:to-white/20'
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

      {/* Divine Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="stats-card backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:scale-105 transition-all group shadow-xl hover:shadow-2xl"
            style={{ background: stat.bgColor }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm shadow-lg">
                <div className={`bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.icon}
                </div>
              </div>
              {stat.change && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm">
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
              <p className="text-3xl font-bold bg-gradient-to-r from-white to-amber-100 bg-clip-text text-transparent mb-2">{stat.value}</p>
              <p className="text-amber-200/80 font-medium">{stat.label}</p>
              {stat.subtitle && (
                <p className="text-amber-300/60 text-sm font-light">{stat.subtitle}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Divine Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Divine Upcoming Sessions */}
        <div className="stats-card backdrop-blur-xl rounded-2xl border border-gold-500/20 shadow-xl">
          <div className="p-6 border-b border-gold-500/20 flex items-center justify-between">
            <h2 className="text-xl font-bold bg-gradient-to-r from-gold-300 to-amber-200 bg-clip-text text-transparent flex items-center gap-3">
              <Clock className="w-6 h-6 text-gold-400" />
              Divine Sessions Today
            </h2>
            <Link
              href="/admin/appointments"
              className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1 font-medium"
            >
              View All Sacred Sessions
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-white/10">
            {metrics?.upcomingAppointments?.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-blue-400" />
                </div>
                <p className="text-white/50 mb-4">No appointments scheduled for today</p>
                <Link
                  href="/admin/appointments/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
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

        {/* Divine Golden Payments */}
        <div className="stats-card backdrop-blur-xl rounded-2xl border border-gold-500/20 shadow-xl">
          <div className="p-6 border-b border-gold-500/20 flex items-center justify-between">
            <h2 className="text-xl font-bold bg-gradient-to-r from-gold-300 to-amber-200 bg-clip-text text-transparent flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-emerald-400" />
              Divine Golden Revenue
            </h2>
            <Link
              href="/admin/reports"
              className="text-sm text-gold-400 hover:text-gold-300 flex items-center gap-1 font-medium"
            >
              View Sacred Reports
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gold-500/10">
            {metrics?.recentPayments?.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-green-400/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CreditCard className="w-10 h-10 text-emerald-400" />
                </div>
                <p className="text-amber-200/60">No divine payments yet</p>
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
                      <p className="font-semibold text-green-400">
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
                  <span className="text-sm text-white/50">{service.count} bookings</span>
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
              className="flex flex-col items-center justify-center p-4 bg-green-500/10 rounded-xl hover:bg-green-500/20 transition-colors border border-green-500/20 group"
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6 text-green-400" />
              </div>
              <span className="text-sm font-medium text-white">Open POS</span>
            </Link>

            <Link
              href="/admin/appointments/new"
              className="flex flex-col items-center justify-center p-4 bg-blue-500/10 rounded-xl hover:bg-blue-500/20 transition-colors border border-blue-500/20 group"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-sm font-medium text-white">Book Appointment</span>
            </Link>

            <Link
              href="/admin/clients/new"
              className="flex flex-col items-center justify-center p-4 bg-purple-500/10 rounded-xl hover:bg-purple-500/20 transition-colors border border-purple-500/20 group"
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-sm font-medium text-white">Add Client</span>
            </Link>

            <Link
              href="/admin/services"
              className="flex flex-col items-center justify-center p-4 bg-amber-500/10 rounded-xl hover:bg-amber-500/20 transition-colors border border-amber-500/20 group"
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
        <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-400/20 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
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