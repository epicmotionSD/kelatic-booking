'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Copy, Check, Sparkles, FileText } from 'lucide-react';
import { blogPosts } from '@/lib/blog-posts';

export default function BlogArticleWriter() {
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState<'professional' | 'casual' | 'inspiring'>('professional');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    title: string;
    excerpt: string;
    content: string;
    slug: string;
    category: string;
    readTime: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/trinity/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'blog',
          topic,
          context: keywords,
          tone,
          additionalInstructions: `
            Generate a complete blog post in the following JSON format:
            {
              "title": "SEO-optimized title with main keyword",
              "excerpt": "Compelling 2-sentence summary for preview",
              "slug": "url-friendly-slug-with-keywords",
              "category": "care|style|history|tips|lifestyle",
              "readTime": estimated minutes to read,
              "content": "Full markdown content with ## headings and ### subheadings"
            }

            The content should be 800-1200 words, include H2 and H3 headings,
            reference Houston and Kelatic Hair Lounge naturally,
            and end with a call-to-action to book.
          `,
        }),
      });

      if (!res.ok) {
        throw new Error('Generation failed');
      }

      const data = await res.json();

      // Try to parse as JSON, if it's wrapped in code blocks, extract it
      let content = data.content;
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[1] || jsonMatch[0];
      }

      try {
        const parsed = JSON.parse(content);
        setResult(parsed);
      } catch {
        // If parsing fails, create a basic structure
        setResult({
          title: topic,
          excerpt: 'Generated blog post about ' + topic,
          content: data.content,
          slug: topic.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          category: 'tips',
          readTime: Math.ceil(data.content.split(' ').length / 200),
        });
      }
    } catch (err) {
      setError('Failed to generate content. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      const codeBlock = `  {
    slug: '${result.slug}',
    title: '${result.title.replace(/'/g, "\\'")}',
    excerpt: '${result.excerpt.replace(/'/g, "\\'")}',
    category: '${result.category}',
    author: 'The Loc Gawd',
    publishedAt: '${new Date().toISOString().split('T')[0]}',
    readTime: ${result.readTime},
    featured: false,
    content: \`
${result.content}
    \`.trim(),
  },`;
      navigator.clipboard.writeText(codeBlock);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/trinity"
            className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1 mb-2"
          >
            ← Back to Trinity AI
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Blog Article Generator
          </h1>
          <p className="text-gray-600 mt-1">
            Create SEO-optimized blog posts about loc care and styling
          </p>
        </div>
        <Link
          href="/blog"
          target="_blank"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-purple-600 border border-gray-200 px-3 py-2 rounded-lg"
        >
          <FileText className="w-4 h-4" />
          View Blog ({blogPosts.length} posts)
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blog Topic *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., How to care for starter locs in Houston's humidity"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target SEO Keywords
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., locs Houston, loc retwist, starter locs maintenance"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as typeof tone)}
              title="Select tone"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="professional">Professional & Authoritative</option>
              <option value="casual">Casual & Friendly</option>
              <option value="inspiring">Inspiring & Empowering</option>
            </select>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating Article...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Blog Post
              </>
            )}
          </button>
        </div>

        {/* Output */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {result ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full mb-2">
                    {result.category}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900">{result.title}</h2>
                  <p className="text-gray-600 text-sm mt-1">{result.excerpt}</p>
                  <p className="text-gray-400 text-xs mt-2">
                    ~{result.readTime} min read | Slug: {result.slug}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="prose prose-sm max-w-none max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-gray-700 bg-gray-50 p-4 rounded-lg text-sm">
                    {result.content}
                  </pre>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy as Code Block
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 text-center">
                Paste into lib/blog-posts.ts to add to the blog
              </p>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-16">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>Enter a topic and generate your blog post</p>
              <p className="text-sm mt-1">Trinity AI will create SEO-optimized content</p>
            </div>
          )}
        </div>
      </div>

      {/* Existing Posts */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-purple-600" />
          Existing Blog Posts ({blogPosts.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blogPosts.slice(0, 6).map((post) => (
            <div
              key={post.slug}
              className="bg-white p-4 rounded-lg border border-gray-200"
            >
              <span className="inline-block px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full mb-2">
                {post.category}
              </span>
              <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                {post.title}
              </h4>
              <p className="text-xs text-gray-500 mt-1">{post.readTime} min read</p>
            </div>
          ))}
        </div>
        {blogPosts.length > 6 && (
          <p className="text-sm text-gray-500 mt-4 text-center">
            +{blogPosts.length - 6} more posts
          </p>
        )}
      </div>

      {/* Topic Ideas */}
      <div className="bg-purple-50 rounded-xl p-6">
        <h3 className="font-semibold text-purple-900 mb-3">Blog Topic Ideas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-purple-800">Educational</h4>
            <ul className="text-purple-700 mt-1 space-y-1">
              <li>• Loc stages explained</li>
              <li>• Best products for locs</li>
              <li>• Common loc mistakes</li>
              <li>• How often to retwist</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-800">Lifestyle</h4>
            <ul className="text-purple-700 mt-1 space-y-1">
              <li>• Loc styles for [occasion]</li>
              <li>• Seasonal loc care</li>
              <li>• Locs in the workplace</li>
              <li>• Loc journey stories</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-purple-800">Houston-Specific</h4>
            <ul className="text-purple-700 mt-1 space-y-1">
              <li>• Locs and Houston humidity</li>
              <li>• Summer loc care in Texas</li>
              <li>• Best Houston locticians</li>
              <li>• Galveston beach loc prep</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
