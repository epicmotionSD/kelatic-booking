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
      <div className="x3o-main" style={{ maxWidth: 960 }}>
        <div className="mb-8">
          <h1 className="x3o-sec-title">Trinity AI</h1>
          <p className="x3o-sec-sub">Choose an intelligence agent to start a conversation</p>
        </div>

        <div className="x3o-g3">
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => selectAgent(agent)}
              className="x3o-agent-card"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[10px] flex items-center justify-center text-[22px] shrink-0"
                  style={{ background: `${agent.color}18`, border: `1px solid ${agent.color}40` }}>
                  {agent.icon}
                </div>
                <div>
                  <div className="text-base font-bold" style={{ color: 'var(--x3o-t1)' }}>{agent.name}</div>
                  <div className="text-[11px] font-semibold tracking-wide" style={{ color: agent.color }}>
                    {agent.tagline}
                  </div>
                </div>
              </div>
              <p className="text-[13px] leading-relaxed m-0 mt-4" style={{ color: 'var(--x3o-t2)' }}>
                {agent.description}
              </p>
              <div className="mt-auto pt-2 text-xs font-semibold flex items-center gap-1.5" style={{ color: agent.color }}>
                Start conversation →
              </div>
            </button>
          ))}
        </div>

        {/* Feature overview */}
        <div className="x3o-card mt-10">
          <div className="text-[13px] font-semibold mb-4" style={{ color: 'var(--x3o-t2)' }}>
            How Trinity AI works
          </div>
          <div className="x3o-g3 !mb-0">
            {[
              { step: '1', title: 'Select an agent', desc: 'Each agent specializes in a different domain of business intelligence.' },
              { step: '2', title: 'Ask anything', desc: 'Natural language questions about your market, competitors, or performance.' },
              { step: '3', title: 'Get actionable intel', desc: 'Data-driven insights and strategic recommendations for your business.' },
            ].map(item => (
              <div key={item.step} className="flex gap-3">
                <div className="x3o-tl-dot active shrink-0">{item.step}</div>
                <div>
                  <div className="text-[13px] font-semibold" style={{ color: 'var(--x3o-t1)' }}>{item.title}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--x3o-t3)', lineHeight: 1.5 }}>{item.desc}</div>
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
    <div className="x3o-chat-wrap">
      {/* Chat header */}
      <div className="x3o-chat-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
            style={{ background: `${activeAgent.color}18`, border: `1px solid ${activeAgent.color}40` }}>
            {activeAgent.icon}
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: 'var(--x3o-t1)' }}>{activeAgent.name}</div>
            <div className="text-[11px]" style={{ color: activeAgent.color }}>{activeAgent.tagline}</div>
          </div>
        </div>
        <button onClick={resetAgent} className="x3o-btn-ghost">← Switch Agent</button>
      </div>

      {/* Messages */}
      <div className="x3o-chat-messages flex flex-col gap-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5"
                style={{ background: `${activeAgent.color}18`, border: `1px solid ${activeAgent.color}30` }}>
                {activeAgent.icon}
              </div>
            )}
            <div className={msg.role === 'user' ? 'x3o-msg-user' : 'x3o-msg-assistant'}
              style={{ fontSize: 13, lineHeight: 1.6, color: msg.role === 'user' ? '#dbe8ff' : 'var(--x3o-t2)', whiteSpace: 'pre-wrap' }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-sm shrink-0"
              style={{ background: `${activeAgent.color}18`, border: `1px solid ${activeAgent.color}30` }}>
              {activeAgent.icon}
            </div>
            <div className="x3o-msg-assistant" style={{ color: 'var(--x3o-t2)' }}>
              <span className="inline-flex gap-1" style={{ animation: 'x3o-pulse 1.4s infinite' }}>● ● ●</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="x3o-chat-input-wrap">
        <div className="flex gap-2.5 max-w-[800px] mx-auto">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${activeAgent.name} anything...`}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-lg text-[13px] outline-none"
            style={{ border: '1px solid var(--x3o-border)', background: 'var(--x3o-bg)', color: 'var(--x3o-t1)' }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-5 py-3 rounded-lg text-[13px] font-semibold transition-all"
            style={{
              background: loading || !input.trim() ? 'var(--x3o-border)' : activeAgent.color,
              color: loading || !input.trim() ? 'var(--x3o-t3)' : '#fff',
              border: 'none',
              cursor: loading || !input.trim() ? 'default' : 'pointer',
            }}
          >
            Send
          </button>
        </div>
        <div className="text-center mt-2 text-[11px]" style={{ color: 'var(--x3o-t4)' }}>
          Trinity AI provides intelligence analysis. Always verify critical decisions with your own research.
        </div>
      </div>
    </div>
  );
}
