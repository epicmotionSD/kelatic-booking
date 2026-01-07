'use client';

import Link from 'next/link';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import { blogPosts, type BlogPost } from '@/lib/blog-posts';
import { Footer } from '@/components/layout/footer';

const CATEGORY_LABELS: Record<BlogPost['category'], string> = {
  care: 'Loc Care',
  style: 'Styling',
  history: 'History & Culture',
  tips: 'Tips & Guides',
  lifestyle: 'Lifestyle',
};

const CATEGORY_COLORS: Record<BlogPost['category'], string> = {
  care: 'bg-green-500/20 text-green-400 border-green-500/30',
  style: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  history: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  tips: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  lifestyle: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function BlogPage() {
  const sortedPosts = [...blogPosts].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const featuredPost = sortedPosts.find((p) => p.featured) || sortedPosts[0];
  const otherPosts = sortedPosts.filter((p) => p.slug !== featuredPost?.slug);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <img
                src="/logo.png"
                alt="Kelatic Hair Lounge"
                className="h-12 w-auto"
              />
            </Link>
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-white/50 hover:text-amber-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to site
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 bg-gradient-to-b from-amber-950/20 to-transparent">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-playfair font-bold mb-4">
            The{' '}
            <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-transparent bg-clip-text">
              Loc Chop
            </span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Expert advice, tips, and insights from Houston&apos;s premier loc specialists.
            Everything you need to know about your loc journey.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Featured Post */}
        {featuredPost && (
          <section className="mb-16">
            <h2 className="text-sm font-medium text-amber-400 uppercase tracking-wider mb-6">
              Featured Article
            </h2>
            <Link href={`/blog/${featuredPost.slug}`} className="block group">
              <article className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 rounded-2xl border border-white/10 p-8 hover:border-amber-400/50 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      CATEGORY_COLORS[featuredPost.category]
                    }`}
                  >
                    {CATEGORY_LABELS[featuredPost.category]}
                  </span>
                  <span className="text-white/40 text-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {featuredPost.readTime} min read
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-playfair font-bold mb-4 group-hover:text-amber-400 transition-colors">
                  {featuredPost.title}
                </h3>
                <p className="text-white/60 text-lg mb-6">{featuredPost.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
                      <span className="text-black font-bold text-sm">TLG</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{featuredPost.author}</p>
                      <p className="text-white/40 text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(featuredPost.publishedAt)}
                      </p>
                    </div>
                  </div>
                  <span className="text-amber-400 font-medium group-hover:translate-x-1 transition-transform">
                    Read article →
                  </span>
                </div>
              </article>
            </Link>
          </section>
        )}

        {/* Other Posts */}
        <section>
          <h2 className="text-sm font-medium text-amber-400 uppercase tracking-wider mb-6">
            All Articles
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
                <article className="h-full bg-zinc-900/50 rounded-xl border border-white/10 p-6 hover:border-amber-400/50 transition-all flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                        CATEGORY_COLORS[post.category]
                      }`}
                    >
                      {CATEGORY_LABELS[post.category]}
                    </span>
                    <span className="text-white/40 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime} min
                    </span>
                  </div>
                  <h3 className="font-bold mb-2 group-hover:text-amber-400 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-white/50 text-sm mb-4 line-clamp-3 flex-1">{post.excerpt}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <p className="text-white/40 text-xs">{formatDate(post.publishedAt)}</p>
                    <span className="text-amber-400 text-sm font-medium">Read →</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 text-center bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-2xl border border-amber-500/20 p-12">
          <h2 className="text-2xl font-playfair font-bold mb-4">Ready to Start Your Loc Journey?</h2>
          <p className="text-white/60 mb-6 max-w-xl mx-auto">
            Book a consultation with Houston&apos;s premier loc specialists and let&apos;s create
            something beautiful together.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
          >
            Book Now
          </Link>
        </section>
      </main>

      {/* Shared Footer with AI Chatbot */}
      <Footer />
    </div>
  );
}
