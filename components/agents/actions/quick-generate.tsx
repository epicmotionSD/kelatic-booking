'use client';

import { useState } from 'react';
import { Loader2, Copy, Check, Wand2 } from 'lucide-react';

type ActionKind = 'generate-content' | 'generate-campaign';

const CONTENT_TYPES: { value: string; label: string }[] = [
  { value: 'social', label: 'Social Post' },
  { value: 'email', label: 'Email Campaign' },
  { value: 'blog', label: 'Blog Article' },
  { value: 'video', label: 'Video Script' },
  { value: 'education', label: 'Client Education' },
  { value: 'graphics', label: 'Promo Graphics' },
  { value: 'newsletter', label: 'Newsletter' },
];

const CAMPAIGN_TYPES: { value: string; label: string }[] = [
  { value: 'social', label: 'Social Post' },
  { value: 'email', label: 'Email' },
  { value: 'promotion', label: 'Promotion' },
];

const TONES = ['professional', 'casual', 'playful', 'inspiring'];

const inp = 'w-full border border-border bg-background text-foreground rounded px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#00ffb2]';

export default function QuickGenerate({
  action,
  businessId,
  color,
}: {
  action: ActionKind;
  businessId: string | null;
  color: string;
}) {
  const isCampaign = action === 'generate-campaign';
  const types = isCampaign ? CAMPAIGN_TYPES : CONTENT_TYPES;

  const [type, setType] = useState(types[0].value);
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('professional');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const needsBusiness = isCampaign && !businessId;

  async function run() {
    if (!topic.trim()) {
      setError('Add a topic first.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult('');
    try {
      const endpoint = isCampaign ? '/api/agents/marketing/generate' : '/api/trinity/generate';
      const body = isCampaign
        ? { businessId, type, topic: topic.trim(), tone }
        : { type, topic: topic.trim(), tone };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Generation failed.');
        return;
      }
      const text =
        typeof data.content === 'string'
          ? data.content
          : data.content?.content || JSON.stringify(data.content ?? data, null, 2);
      setResult(text);
    } catch (e) {
      console.error(e);
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-3 bg-muted/40 border border-border rounded p-3">
      {needsBusiness ? (
        <p className="text-sm text-muted-foreground">
          Connect a business to run campaign generation. Content generation works without one.
        </p>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-2 mb-2">
            <select value={type} onChange={(e) => setType(e.target.value)} className={inp}>
              {types.map((t) => (
                <option key={t.value} value={t.value} className="bg-background">{t.label}</option>
              ))}
            </select>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className={`${inp} capitalize`}>
              {TONES.map((t) => (
                <option key={t} value={t} className="bg-background capitalize">{t}</option>
              ))}
            </select>
            <button
              onClick={run}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 text-black text-sm font-medium rounded px-3 py-2 disabled:opacity-50"
              style={{ backgroundColor: color }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Generate
            </button>
          </div>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={isCampaign ? 'Campaign topic — e.g. Wednesday retwist special' : 'Topic — e.g. benefits of regular retwists'}
            className={inp}
            onKeyDown={(e) => { if (e.key === 'Enter') run(); }}
          />

          {error && <p className="text-sm text-[#ef4444] mt-2">{error}</p>}

          {result && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="term-label text-muted-foreground">Result</span>
                <button onClick={copy} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-foreground/90 bg-background border border-border rounded p-3 max-h-72 overflow-auto">
                {result}
              </pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
