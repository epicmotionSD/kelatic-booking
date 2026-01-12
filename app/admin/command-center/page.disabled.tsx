'use client';

import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  DollarSign,
  Zap,
  Target,
  Wrench,
  BarChart3,
  Wallet
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  title: string;
  status: 'idle' | 'active' | 'paused' | 'error';
  avatar: string;
  metrics: {
    tasksCompleted: number;
    successRate: number;
    avgResponseTime: number;
  };
}

interface Decision {
  id: string;
  agentRole: string;
  title: string;
  description: string;
  reasoning: string;
  confidence: number;
  impact: string;
  approved: boolean;
  createdAt: string;
}

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  createdAt: string;
}

interface CommandCenterData {
  activeAgents: number;
  pendingTasks: number;
  pendingDecisions: number;
  activeAlertsCount: number;
  decisionsToday: number;
  totalBusinesses: number;
  newBusinessesToday: number;
  monthlyMrr: number;
  orchestrator: {
    isRunning: boolean;
    agents: Agent[];
    summary: {
      totalTasksCompleted: number;
      totalTasksPending: number;
    };
  };
  recentDecisions: Decision[];
  activeAlerts: Alert[];
  pendingApprovals: Decision[];
}

const agentIcons: Record<string, any> = {
  ceo: Target,
  cto: Wrench,
  cmo: BarChart3,
  cfo: Wallet,
};

const agentColors: Record<string, string> = {
  ceo: 'bg-purple-500',
  cto: 'bg-blue-500',
  cmo: 'bg-green-500',
  cfo: 'bg-amber-500',
};

export default function CommandCenterPage() {
  const [data, setData] = useState<CommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/command-center');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch command center data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const executeAction = async (action: string, params: Record<string, any> = {}) => {
    setActionLoading(action);
    try {
      const response = await fetch('/api/command-center', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...params }),
      });
      const result = await response.json();
      if (result.success) {
        await fetchData();
      }
    } catch (error) {
      console.error('Action failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-red-500">
        Failed to load Command Center data
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Command Center
          </h1>
          <p className="text-gray-400 mt-1">Board of Directors AI Orchestration</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchData()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          {data.orchestrator.isRunning ? (
            <button
              onClick={() => executeAction('stop_all')}
              disabled={actionLoading === 'stop_all'}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
            >
              <Pause className="w-4 h-4" />
              Stop All
            </button>
          ) : (
            <button
              onClick={() => executeAction('start_all')}
              disabled={actionLoading === 'start_all'}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
            >
              <Play className="w-4 h-4" />
              Start All
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Zap className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Active Agents</p>
              <p className="text-2xl font-bold">{data.activeAgents}/4</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Businesses</p>
              <p className="text-2xl font-bold">{data.totalBusinesses}</p>
              {data.newBusinessesToday > 0 && (
                <p className="text-xs text-green-400">+{data.newBusinessesToday} today</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Monthly MRR</p>
              <p className="text-2xl font-bold">${data.monthlyMrr.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Decisions Today</p>
              <p className="text-2xl font-bold">{data.decisionsToday}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Board of Directors */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Board of Directors</h2>
        <div className="grid grid-cols-4 gap-4">
          {data.orchestrator.agents.map((agent) => {
            const Icon = agentIcons[agent.role] || Target;
            const colorClass = agentColors[agent.role] || 'bg-gray-500';

            return (
              <div
                key={agent.id}
                className="bg-gray-900 rounded-xl p-4 border border-gray-800 hover:border-gray-700 transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${colorClass} rounded-lg`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold">{agent.name}</p>
                      <p className="text-xs text-gray-400">{agent.role.toUpperCase()}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs ${
                    agent.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    agent.status === 'idle' ? 'bg-gray-500/20 text-gray-400' :
                    agent.status === 'paused' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {agent.status}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="text-gray-400">Tasks</p>
                    <p className="font-semibold">{agent.metrics.tasksCompleted}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Success</p>
                    <p className="font-semibold">{(agent.metrics.successRate * 100).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Avg Time</p>
                    <p className="font-semibold">{agent.metrics.avgResponseTime}s</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  {agent.status === 'active' ? (
                    <button
                      onClick={() => executeAction('stop_agent', { role: agent.role })}
                      className="flex-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-xs transition"
                    >
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={() => executeAction('start_agent', { role: agent.role })}
                      className="flex-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 rounded text-xs transition"
                    >
                      Start
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h3 className="font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Pending Approvals ({data.pendingApprovals.length})
            </h3>
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {data.pendingApprovals.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No pending approvals</p>
            ) : (
              data.pendingApprovals.map((decision) => (
                <div key={decision.id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">{decision.agentRole.toUpperCase()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      decision.impact === 'critical' ? 'bg-red-500/20 text-red-400' :
                      decision.impact === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {decision.impact}
                    </span>
                  </div>
                  <p className="font-medium text-sm mb-1">{decision.title}</p>
                  <p className="text-xs text-gray-400 mb-3">{decision.reasoning}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => executeAction('approve_decision', { decisionId: decision.id, approvedBy: 'admin' })}
                      className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-xs transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => executeAction('reject_decision', { decisionId: decision.id, rejectedBy: 'admin', reason: 'Manual rejection' })}
                      className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-xs transition"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Decisions */}
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h3 className="font-semibold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Recent Decisions ({data.recentDecisions.length})
            </h3>
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {data.recentDecisions.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No recent decisions</p>
            ) : (
              data.recentDecisions.slice(0, 10).map((decision) => (
                <div key={decision.id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">{decision.agentRole.toUpperCase()}</span>
                    <span className={`text-xs ${decision.approved ? 'text-green-400' : 'text-amber-400'}`}>
                      {decision.approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                  <p className="font-medium text-sm">{decision.title}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Confidence: {(decision.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Active Alerts */}
      {data.activeAlerts.length > 0 && (
        <div className="mt-6 bg-gray-900 rounded-xl border border-gray-800">
          <div className="p-4 border-b border-gray-800">
            <h3 className="font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              Active Alerts ({data.activeAlerts.length})
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {data.activeAlerts.map((alert: any) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg ${
                  alert.severity === 'critical' ? 'bg-red-500/10 border border-red-500/30' :
                  alert.severity === 'error' ? 'bg-orange-500/10 border border-orange-500/30' :
                  alert.severity === 'warning' ? 'bg-amber-500/10 border border-amber-500/30' :
                  'bg-blue-500/10 border border-blue-500/30'
                }`}
              >
                <p className="font-medium text-sm">{alert.title}</p>
                <p className="text-xs text-gray-400">{alert.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
