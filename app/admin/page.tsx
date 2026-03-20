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
  import RevenueMigrationDashboard from '@/components/dashboard/revenue-migration-dashboard';

  export default function AdminDashboard() {
    return <RevenueMigrationDashboard maxWidthClass="max-w-none mx-0" />;
  }
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