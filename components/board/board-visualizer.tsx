"use client"

import React, { useState, useEffect } from 'react'
import { Target, Wrench, TrendingUp, DollarSign, Zap, Lightbulb, BarChart3, Shield } from 'lucide-react'

// Board of Directors Agents
const BOARD_MEMBERS = [
  {
    id: 'atlas',
    name: 'Atlas',
    role: 'CEO',
    icon: Target,
    color: '#22c55e',
    gradient: 'from-green-500 to-emerald-600',
    description: 'Strategic planning & coordination',
    capabilities: [
      { name: 'Strategic Planning', accuracy: 96 },
      { name: 'Task Delegation', accuracy: 94 },
      { name: 'Decision Approval', accuracy: 92 }
    ]
  },
  {
    id: 'nova',
    name: 'Nova',
    role: 'CTO',
    icon: Wrench,
    color: '#3b82f6',
    gradient: 'from-blue-500 to-cyan-600',
    description: 'Platform & technical operations',
    capabilities: [
      { name: 'Template Deployment', accuracy: 98 },
      { name: 'Performance Monitoring', accuracy: 95 },
      { name: 'Security Audits', accuracy: 93 }
    ]
  },
  {
    id: 'pulse',
    name: 'Pulse',
    role: 'CMO',
    icon: TrendingUp,
    color: '#a855f7',
    gradient: 'from-purple-500 to-pink-600',
    description: 'Growth & agency acquisition',
    capabilities: [
      { name: 'Campaign Management', accuracy: 91 },
      { name: 'Lead Generation', accuracy: 89 },
      { name: 'Conversion Optimization', accuracy: 87 }
    ]
  },
  {
    id: 'apex',
    name: 'Apex',
    role: 'CFO',
    icon: DollarSign,
    color: '#f59e0b',
    gradient: 'from-amber-500 to-orange-600',
    description: 'Revenue & financial operations',
    capabilities: [
      { name: 'Revenue Analysis', accuracy: 97 },
      { name: 'Budget Management', accuracy: 94 },
      { name: 'Subscription Analytics', accuracy: 92 }
    ]
  }
]

interface BoardVisualizerProps {
  variant?: 'hero' | 'full'
  showStats?: boolean
  interactive?: boolean
  onAgentClick?: (agentId: string) => void
}

export function BoardVisualizer({
  variant = 'hero',
  showStats = false,
  interactive = false,
  onAgentClick
}: BoardVisualizerProps) {
  const [activeAgent, setActiveAgent] = useState(0)
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null)
  const [dataFlows, setDataFlows] = useState<number[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAgent(prev => (prev + 1) % 4)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  // Simulate data flow particles
  useEffect(() => {
    const interval = setInterval(() => {
      setDataFlows(prev => {
        const newFlows = [...prev, Date.now()]
        return newFlows.slice(-8) // Keep last 8 particles
      })
    }, 800)
    return () => clearInterval(interval)
  }, [])

  const handleAgentClick = (index: number) => {
    if (interactive) {
      setSelectedAgent(selectedAgent === index ? null : index)
      if (onAgentClick) {
        onAgentClick(BOARD_MEMBERS[index].id)
      }
    }
  }

  if (variant === 'full') {
    return <FullVisualizer activeAgent={activeAgent} selectedAgent={selectedAgent} onAgentClick={handleAgentClick} dataFlows={dataFlows} />
  }

  return <HeroVisualizer activeAgent={activeAgent} selectedAgent={selectedAgent} onAgentClick={handleAgentClick} dataFlows={dataFlows} />
}

function HeroVisualizer({
  activeAgent,
  selectedAgent,
  onAgentClick,
  dataFlows
}: {
  activeAgent: number
  selectedAgent: number | null
  onAgentClick: (index: number) => void
  dataFlows: number[]
}) {
  return (
    <div className="relative py-12">
      {/* Central Hub with Pulse Rings */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
        {/* Outer pulse ring */}
        <div className="absolute inset-0 -m-16 md:-m-24">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border border-cyan-500/20 animate-ping" style={{ animationDuration: '3s' }} />
        </div>
        {/* Middle pulse ring */}
        <div className="absolute inset-0 -m-10 md:-m-16">
          <div className="w-20 h-20 md:w-32 md:h-32 rounded-full border border-cyan-500/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
        </div>
        {/* Central orb */}
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/50">
          <Zap className="w-8 h-8 md:w-10 md:h-10 text-white" />
        </div>
      </div>

      {/* Agents Layout */}
      <div className="relative flex items-center justify-center gap-4 md:gap-8 lg:gap-12 z-10 flex-wrap">
        {BOARD_MEMBERS.map((agent, index) => {
          const Icon = agent.icon
          const isActive = activeAgent === index
          const isSelected = selectedAgent === index

          return (
            <div
              key={agent.id}
              className="relative group cursor-pointer"
              onClick={() => onAgentClick(index)}
            >
              {/* Glow effect */}
              {isActive && (
                <div
                  className="absolute inset-0 -m-4 rounded-3xl blur-xl opacity-30 animate-pulse"
                  style={{ backgroundColor: agent.color }}
                />
              )}

              {/* Agent card */}
              <div
                className={`relative p-4 md:p-5 rounded-2xl border-2 transition-all duration-500 backdrop-blur-sm ${
                  isActive || isSelected
                    ? 'scale-110 bg-slate-900/90'
                    : 'bg-slate-900/50 hover:bg-slate-900/70 hover:scale-105'
                }`}
                style={{
                  borderColor: isActive || isSelected ? agent.color : '#1f2937',
                  boxShadow: isActive ? `0 0 40px ${agent.color}40, 0 0 80px ${agent.color}20` : 'none'
                }}
              >
                {/* Spinning ring for active agent */}
                {isActive && (
                  <div
                    className="absolute -inset-1 rounded-2xl border-2 border-dashed"
                    style={{
                      borderColor: `${agent.color}50`,
                      animation: 'spin 8s linear infinite'
                    }}
                  />
                )}

                {/* Icon */}
                <div
                  className={`w-12 h-12 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mx-auto mb-2 transition-all duration-500 bg-gradient-to-br ${agent.gradient}`}
                  style={{
                    boxShadow: isActive ? `0 0 30px ${agent.color}60` : `0 4px 20px ${agent.color}20`
                  }}
                >
                  <Icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>

                {/* Label */}
                <div className="text-center">
                  <h3 className="text-sm md:text-lg font-bold text-white">{agent.name}</h3>
                  <p className="text-xs font-medium" style={{ color: agent.color }}>{agent.role}</p>
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ backgroundColor: agent.color, animationDelay: '0ms' }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ backgroundColor: agent.color, animationDelay: '150ms' }}
                    />
                    <div
                      className="w-1.5 h-1.5 rounded-full animate-bounce"
                      style={{ backgroundColor: agent.color, animationDelay: '300ms' }}
                    />
                  </div>
                )}
              </div>

              {/* Capability tooltip on hover */}
              <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-xs whitespace-nowrap">
                  <p className="text-gray-400 mb-1">{agent.description}</p>
                  <p style={{ color: agent.color }} className="font-medium">Click to see capabilities</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Active agent description bar */}
      <div className="mt-12 text-center">
        <div
          className="inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 transition-all duration-500 backdrop-blur-sm"
          style={{
            borderColor: BOARD_MEMBERS[activeAgent].color,
            backgroundColor: `${BOARD_MEMBERS[activeAgent].color}15`,
            boxShadow: `0 0 30px ${BOARD_MEMBERS[activeAgent].color}20`
          }}
        >
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{ backgroundColor: BOARD_MEMBERS[activeAgent].color }}
          />
          <span className="text-sm md:text-base text-gray-200 font-medium">{BOARD_MEMBERS[activeAgent].description}</span>
          <Zap className="w-4 h-4" style={{ color: BOARD_MEMBERS[activeAgent].color }} />
        </div>
      </div>

      {/* Selected Agent Detail Panel */}
      {selectedAgent !== null && (
        <div
          className="mt-8 max-w-md mx-auto bg-slate-900/90 border-2 rounded-2xl p-6 backdrop-blur-sm transition-all duration-500"
          style={{ borderColor: BOARD_MEMBERS[selectedAgent].color }}
        >
          <div className="flex items-center gap-3 mb-4">
            {React.createElement(BOARD_MEMBERS[selectedAgent].icon, {
              className: "w-6 h-6",
              style: { color: BOARD_MEMBERS[selectedAgent].color }
            })}
            <h4 className="text-lg font-bold text-white">{BOARD_MEMBERS[selectedAgent].name} Capabilities</h4>
          </div>
          <div className="space-y-3">
            {BOARD_MEMBERS[selectedAgent].capabilities.map((cap, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-300">{cap.name}</span>
                  <span style={{ color: BOARD_MEMBERS[selectedAgent].color }}>{cap.accuracy}%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${cap.accuracy}%`,
                      background: `linear-gradient(90deg, ${BOARD_MEMBERS[selectedAgent].color}80, ${BOARD_MEMBERS[selectedAgent].color})`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function FullVisualizer({
  activeAgent,
  selectedAgent,
  onAgentClick,
  dataFlows
}: {
  activeAgent: number
  selectedAgent: number | null
  onAgentClick: (index: number) => void
  dataFlows: number[]
}) {
  return (
    <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6 md:p-12 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,212,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,212,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full"
            style={{
              backgroundColor: BOARD_MEMBERS[i % 4].color,
              left: `${10 + (i * 5)}%`,
              top: `${20 + (i * 4) % 60}%`,
              animation: `float ${3 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.3}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="text-center mb-10 relative">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-full backdrop-blur-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm text-cyan-400 font-medium">Board of Directors Active</span>
        </div>
      </div>

      {/* Main Flow Visualization */}
      <div className="relative">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8 relative z-10">
          {/* Input: Your Agency */}
          <div className="text-center group">
            <div className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700 hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
              <div className="text-3xl mb-2">🏢</div>
              <p className="text-sm font-bold text-white">Your Agency</p>
              <p className="text-xs text-gray-500">Beauty & Wellness</p>
            </div>
          </div>

          {/* Animated Arrow */}
          <div className="text-cyan-400 relative">
            <div className="hidden md:flex items-center gap-1">
              <div className="w-8 h-0.5 bg-gradient-to-r from-cyan-400/50 to-cyan-400" />
              <div className="w-0 h-0 border-t-4 border-b-4 border-l-8 border-transparent border-l-cyan-400" />
            </div>
            <div className="block md:hidden text-2xl animate-bounce">↓</div>
          </div>

          {/* Board Members */}
          <div className="grid grid-cols-2 md:flex gap-4 md:gap-6">
            {BOARD_MEMBERS.map((agent, index) => {
              const Icon = agent.icon
              const isActive = activeAgent === index

              return (
                <div
                  key={agent.id}
                  className={`relative p-4 md:p-5 rounded-2xl border-2 transition-all duration-500 cursor-pointer backdrop-blur-sm ${
                    isActive ? 'bg-slate-800/90 scale-105' : 'bg-slate-800/50 hover:bg-slate-800/70 hover:scale-105'
                  }`}
                  style={{
                    borderColor: isActive ? agent.color : '#374151',
                    boxShadow: isActive ? `0 0 30px ${agent.color}30, inset 0 0 20px ${agent.color}10` : 'none'
                  }}
                  onClick={() => onAgentClick(index)}
                >
                  {/* Active glow ring */}
                  {isActive && (
                    <div
                      className="absolute -inset-2 rounded-2xl animate-pulse"
                      style={{
                        background: `radial-gradient(circle, ${agent.color}20 0%, transparent 70%)`
                      }}
                    />
                  )}

                  <div
                    className={`relative w-10 h-10 md:w-14 md:h-14 rounded-xl flex items-center justify-center mx-auto mb-2 bg-gradient-to-br ${agent.gradient}`}
                    style={{
                      boxShadow: isActive ? `0 0 20px ${agent.color}50` : 'none'
                    }}
                  >
                    <Icon className="w-5 h-5 md:w-7 md:h-7 text-white" />
                  </div>
                  <div className="text-center relative">
                    <p className="font-bold text-white text-sm">{agent.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: agent.color }}>{agent.role}</p>
                  </div>

                  {/* Processing indicator */}
                  {isActive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Animated Arrow */}
          <div className="text-cyan-400 relative">
            <div className="hidden md:flex items-center gap-1">
              <div className="w-8 h-0.5 bg-gradient-to-r from-cyan-400 to-cyan-400/50" />
              <div className="w-0 h-0 border-t-4 border-b-4 border-l-8 border-transparent border-l-cyan-400" />
            </div>
            <div className="block md:hidden text-2xl animate-bounce">↓</div>
          </div>

          {/* Output: Growth */}
          <div className="text-center group">
            <div className="p-5 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl border border-cyan-500/30 hover:border-cyan-500/60 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
              <div className="text-3xl mb-2 animate-pulse">📈</div>
              <p className="text-sm font-bold text-white">Autonomous Growth</p>
              <p className="text-xs text-cyan-400">24/7 Operations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom stats */}
      <div className="mt-12 grid grid-cols-4 gap-4 pt-8 border-t border-slate-800">
        {[
          { value: '97%', label: 'Uptime', color: '#22c55e', icon: Shield },
          { value: '<100ms', label: 'Response', color: '#3b82f6', icon: Zap },
          { value: '100%', label: 'Auditable', color: '#a855f7', icon: Lightbulb },
          { value: '24/7', label: 'Active', color: '#f59e0b', icon: BarChart3 }
        ].map((stat, i) => {
          const Icon = stat.icon
          return (
            <div key={i} className="text-center group cursor-pointer">
              <div className="flex justify-center mb-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${stat.color}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-xl md:text-2xl font-bold transition-all group-hover:scale-110" style={{ color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BoardVisualizer
