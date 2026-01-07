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
      {/* Premium Light Header */}
      <div className="bg-white/90 backdrop-blur-xl p-8 rounded-3xl border border-amber-200/30 shadow-2xl bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-3">
              <span className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-600 bg-clip-text text-transparent">
                ✨ Welcome back, Divine Loctician! 
              </span>
            </h1>
            <p className="text-gray-700 text-lg font-medium">
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
              className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-bold hover:shadow-xl hover:shadow-amber-500/30 transition-all flex items-center gap-3 hover:scale-105 transform shadow-lg"
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
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Zap className="w-6 h-6 text-amber-600" />
            Divine Business Insights
          </h2>
          <div className="grid gap-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`bg-white/90 backdrop-blur-xl p-6 rounded-2xl border shadow-xl hover:shadow-2xl transition-all ${
                  insight.type === 'success' 
                    ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300/50' 
                    : insight.type === 'warning' 
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300/50'
                    : insight.type === 'action'
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300/50'
                    : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-300/50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 rounded-2xl shadow-lg ${
                      insight.type === 'success' 
                        ? 'bg-emerald-100 text-emerald-600' 
                        : insight.type === 'warning' 
                        ? 'bg-amber-100 text-amber-600'
                        : insight.type === 'action'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {insight.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg">{insight.title}</h3>
                      <p className="text-gray-600 mt-1">{insight.description}</p>
                    </div>
                  </div>
                  {insight.action && (
                    <Link
                      href={insight.action.href}
                      className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg hover:shadow-xl hover:scale-105 transform ${
                        insight.action.variant === 'primary'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-amber-500/40'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            className="bg-white/90 backdrop-blur-xl rounded-2xl border border-amber-200/30 p-6 hover:scale-105 transition-all group shadow-xl hover:shadow-2xl"
            style={{ background: `linear-gradient(135deg, ${stat.bgColor?.replace('from-', 'rgba(').replace('to-', 'rgba(').replace('/20', ', 0.1)').replace('/20', ', 0.15)')} )` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-amber-200/30">
                <div className={`bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {stat.icon}
                </div>
              </div>
              {stat.change && (
                <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-amber-200/30">
                  {stat.trend === 'up' ? (
                    <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-bold ${
                    stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</p>
              <p className="text-gray-700 font-medium">{stat.label}</p>
              {stat.subtitle && (
                <p className="text-gray-600 text-sm font-light">{stat.subtitle}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Divine Content Grid */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Divine Upcoming Sessions */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-amber-200/30 shadow-xl">
          <div className="p-6 border-b border-amber-200/30 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <Clock className="w-6 h-6 text-blue-600" />
              Divine Sessions Today
            </h2>
            <Link
              href="/admin/appointments"
              className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1 font-medium"
            >
              View All Sacred Sessions
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-amber-200/30">
            {metrics?.upcomingAppointments?.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-gray-600 mb-4">No appointments scheduled for today</p>
                <Link
                  href="/admin/appointments/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Book First Appointment
                </Link>
              </div>
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

        {/* Divine Revenue */}
        <div className="stats-card backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl">
          <div className="p-6 border-b border-white/20 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-emerald-400" />
              Divine Revenue
            </h2>
            <Link
              href="/admin/reports"
              className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1 font-medium"
            >
              View Sacred Reports
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-amber-200/30">
            {metrics?.recentPayments?.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CreditCard className="w-10 h-10 text-emerald-600" />
                </div>
                <p className="text-gray-600">No divine payments yet</p>
              </div>
            ) : (
              metrics?.recentPayments?.slice(0, 5).map((payment) => (
                <div key={payment.id} className="p-4 hover:bg-amber-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {payment.client_name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {payment.service_name} • {payment.time_ago}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(payment.amount * 100)}
                      </p>
                      <p className="text-xs text-gray-600">
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
        <div className="bg-white/90 backdrop-blur-xl rounded-xl border border-amber-200/30 shadow-xl">
          <div className="p-6 border-b border-amber-200/30">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600" />
              Popular Services This Week
            </h2>
          </div>
          <div className="p-6">
            {metrics?.topServices?.map((service, index) => (
              <div key={service.name} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-xs text-amber-600 font-bold">
                      {index + 1}
                    </span>
                    {service.name}
                  </span>
                  <span className="text-sm text-gray-600">{service.count} bookings</span>
                </div>
                <div className="w-full bg-amber-100 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${(service.count / (metrics?.topServices?.[0]?.count || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {(!metrics?.topServices || metrics.topServices.length === 0) && (
              <p className="text-center text-gray-600">No data yet</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/90 backdrop-blur-xl rounded-xl border border-amber-200/30 shadow-xl">
          <div className="p-6 border-b border-amber-200/30">
            <h2 className="font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            <Link
              href="/admin/pos"
              className="flex flex-col items-center justify-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors border border-green-200 group"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Open POS</span>
            </Link>

            <Link
              href="/admin/appointments/new"
              className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200 group"
            >
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Book Appointment</span>
            </Link>

            <Link
              href="/admin/clients/new"
              className="flex flex-col items-center justify-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors border border-purple-200 group"
            >
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Add Client</span>
            </Link>

            <Link
              href="/admin/services"
              className="flex flex-col items-center justify-center p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors border border-amber-200 group"
            >
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Settings className="w-6 h-6 text-amber-600" />
              </div>
              <span className="text-sm font-medium text-gray-900">Manage Services</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Pending Actions Alert */}
      {(metrics?.pendingDeposits || 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-amber-800">
              {metrics?.pendingDeposits} pending deposit{metrics?.pendingDeposits !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-amber-700">
              These appointments haven&apos;t been confirmed with payment yet
            </p>
          </div>
          <Link
            href="/admin/appointments?status=pending"
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all text-sm flex items-center gap-2"
          >
            View Pending
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}