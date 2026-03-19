'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type AgentId = 'oracle' | 'sentinel' | 'sage';

interface Agent {
  id: AgentId;
  name: string;
  icon: string;
  color: string;
  tagline: string;
  description: string;
  greeting: string;
}

const agents: Agent[] = [
  {
    id: 'oracle',
    name: 'Oracle',
    icon: '🔮',
    color: '#a855f7',
    tagline: 'Strategic Intelligence',
    description: 'Market analysis, positioning strategy, growth opportunities, and business intelligence.',
    greeting: "I'm Oracle, your strategic intelligence agent. I analyze market positioning, competitive dynamics, and growth opportunities for your business. What would you like to explore?",
  },
  {
    id: 'sentinel',
    name: 'Sentinel',
    icon: '🛡️',
    color: '#ef4444',
    tagline: 'Competitive Monitoring',
    description: 'Threat detection, competitor tracking, reputation alerts, and market shift warnings.',
    greeting: "I'm Sentinel, your competitive monitoring agent. I track threats, monitor competitors, and alert you to market shifts that could impact your business. What should I investigate?",
  },
  {
    id: 'sage',
    name: 'Sage',
    icon: '📊',
    color: '#22c55e',
    tagline: 'Data & Analytics',
    description: 'Performance metrics, trend analysis, data-driven recommendations, and reporting.',
    greeting: "I'm Sage, your data analytics agent. I interpret your metrics, identify trends, and provide data-driven recommendations to optimize your operations. What data shall we analyze?",
  },
];

export default function TrinityPage() {
  const [activeAgent, setActiveAgent] = useState<Agent | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function selectAgent(agent: Agent) {
    setActiveAgent(agent);
    setMessages([{ role: 'assistant', content: agent.greeting }]);
    setConversationId(null);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function resetAgent() {
    setActiveAgent(null);
    setMessages([]);
    setConversationId(null);
    setInput('');
  }

  async function sendMessage() {
    if (!input.trim() || loading || !activeAgent) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    const newMessages: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newMessages);

    try {
      const res = await fetch('/api/intel/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          agent: activeAgent.id,
          conversationId,
        }),
      });

      if (!res.ok) throw new Error('Failed to get response');

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      if (data.conversationId) setConversationId(data.conversationId);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Agent selection screen
  if (!activeAgent) {
    return (
      <div style={{ padding: 32, maxWidth: 960, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#f0f4ff', margin: 0 }}>
            Trinity AI
          </h1>
          <p style={{ fontSize: 14, color: '#6b7fa3', marginTop: 6 }}>
            Choose an intelligence agent to start a conversation
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => selectAgent(agent)}
              style={{
                background: '#0d1424',
                border: '1px solid #1e2d45',
                borderRadius: 12,
                padding: 28,
                cursor: 'pointer',
                textAlign: 'left' as const,
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column' as const,
                gap: 16,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = agent.color;
                (e.currentTarget as HTMLElement).style.background = '#111b2e';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = '#1e2d45';
                (e.currentTarget as HTMLElement).style.background = '#0d1424';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 10,
                  background: `${agent.color}18`,
                  border: `1px solid ${agent.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>
                  {agent.icon}
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f4ff' }}>{agent.name}</div>
                  <div style={{ fontSize: 11, color: agent.color, fontWeight: 600, letterSpacing: '0.03em' }}>
                    {agent.tagline}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#6b7fa3', lineHeight: 1.5, margin: 0 }}>
                {agent.description}
              </p>
              <div style={{
                marginTop: 'auto',
                fontSize: 12,
                color: agent.color,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                Start conversation →
              </div>
            </button>
          ))}
        </div>

        {/* Feature overview */}
        <div style={{
          marginTop: 40,
          padding: 24,
          background: '#0d1424',
          border: '1px solid #1e2d45',
          borderRadius: 10,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#8899bb', marginBottom: 16 }}>
            How Trinity AI works
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { step: '1', title: 'Select an agent', desc: 'Each agent specializes in a different domain of business intelligence.' },
              { step: '2', title: 'Ask anything', desc: 'Natural language questions about your market, competitors, or performance.' },
              { step: '3', title: 'Get actionable intel', desc: 'Data-driven insights and strategic recommendations for your business.' },
            ].map(item => (
              <div key={item.step} style={{ display: 'flex', gap: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#e8a02018', border: '1px solid #e8a02040',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: '#e8a020', flexShrink: 0,
                }}>
                  {item.step}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#c8d6e5' }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: '#4a5a78', lineHeight: 1.5, marginTop: 4 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Chat interface
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Chat header */}
      <div style={{
        padding: '14px 24px',
        borderBottom: '1px solid #1e2d45',
        background: '#0a0f1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `${activeAgent.color}18`,
            border: `1px solid ${activeAgent.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>
            {activeAgent.icon}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f4ff' }}>
              {activeAgent.name}
            </div>
            <div style={{ fontSize: 11, color: activeAgent.color }}>{activeAgent.tagline}</div>
          </div>
        </div>
        <button
          onClick={resetAgent}
          style={{
            background: '#111b2e',
            border: '1px solid #1e2d45',
            borderRadius: 6,
            padding: '6px 14px',
            fontSize: 12,
            color: '#8899bb',
            cursor: 'pointer',
          }}
        >
          ← Switch Agent
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              gap: 10,
            }}
          >
            {msg.role === 'assistant' && (
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: `${activeAgent.color}18`,
                border: `1px solid ${activeAgent.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, flexShrink: 0, marginTop: 2,
              }}>
                {activeAgent.icon}
              </div>
            )}
            <div style={{
              maxWidth: '70%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              background: msg.role === 'user' ? '#1a3a6a' : '#111b2e',
              border: `1px solid ${msg.role === 'user' ? '#234a7a' : '#1e2d45'}`,
              fontSize: 13,
              lineHeight: 1.6,
              color: msg.role === 'user' ? '#dbe8ff' : '#c8d6e5',
              whiteSpace: 'pre-wrap' as const,
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: `${activeAgent.color}18`,
              border: `1px solid ${activeAgent.color}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, flexShrink: 0,
            }}>
              {activeAgent.icon}
            </div>
            <div style={{
              padding: '12px 16px',
              borderRadius: '14px 14px 14px 4px',
              background: '#111b2e',
              border: '1px solid #1e2d45',
              fontSize: 13,
              color: '#6b7fa3',
            }}>
              <span style={{ display: 'inline-flex', gap: 4 }}>
                <span style={{ animation: 'pulse 1.4s infinite', animationDelay: '0s' }}>●</span>
                <span style={{ animation: 'pulse 1.4s infinite', animationDelay: '0.2s' }}>●</span>
                <span style={{ animation: 'pulse 1.4s infinite', animationDelay: '0.4s' }}>●</span>
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid #1e2d45',
        background: '#0a0f1a',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex',
          gap: 10,
          maxWidth: 800,
          margin: '0 auto',
        }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${activeAgent.name} anything...`}
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 8,
              border: '1px solid #1e2d45',
              background: '#0d1424',
              color: '#f0f4ff',
              fontSize: 13,
              outline: 'none',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            style={{
              padding: '12px 20px',
              borderRadius: 8,
              border: 'none',
              background: loading || !input.trim() ? '#1e2d45' : activeAgent.color,
              color: loading || !input.trim() ? '#4a5a78' : '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: loading || !input.trim() ? 'default' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            Send
          </button>
        </div>
        <div style={{ textAlign: 'center' as const, marginTop: 8, fontSize: 11, color: '#2a3555' }}>
          Trinity AI provides intelligence analysis. Always verify critical decisions with your own research.
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; }
          40% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
