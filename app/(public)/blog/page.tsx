'use client';

import Link from 'next/link';
import { ArrowLeft, Clock, Calendar } from 'lucide-react';
import { blogPosts, type BlogPost } from '@/lib/blog-posts';
import { Footer } from '@/components/layout/footer';
import { PublicAuthLinks } from '@/components/layout/public-auth-links';

const CATEGORY_LABELS: Record<BlogPost['category'], string> = {
  care: 'Loc Care',
  style: 'Styling',
  history: 'History & Culture',
  tips: 'Tips & Guides',
  lifestyle: 'Lifestyle',
};

const CATEGORY_COLORS: Record<BlogPost['category'], string> = {
  care: 'bg-[#e6efe2] text-[#5b7a52] border-[#cfe0c5]',
  style: 'bg-[#efe7f3] text-[#7a5b86] border-[#e0d0e8]',
  history: 'bg-[#f4e9d6] text-[#8a5a2b] border-[#e7d6b8]',
  tips: 'bg-[#e3edf3] text-[#4f6f86] border-[#d0dfe8]',
  lifestyle: 'bg-[#f6e6ec] text-[#9a4b34] border-[#ecd0d8]',
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
    <div className="min-h-screen bg-[#faf7f2] text-stone-800">
      {/* Header */}
      <header className="bg-[#faf7f2]/85 backdrop-blur-xl border-b border-[#e7ddcd] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <img
                src="/logo.png"
                alt="Kelatic Hair Lounge"
                className="h-12 w-auto"
              />
            </Link>
            <div className="flex items-center gap-4">
              <PublicAuthLinks />
              <Link
                href="/"
                className="flex items-center gap-2 text-sm text-stone-500 hover:text-[#8a5a2b] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to site
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 px-4 bg-gradient-to-b from-[#f3ede3] to-transparent">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-playfair font-medium mb-4 text-stone-900">
            The{' '}
            <span className="italic text-[#b08344]">
              Loc Chop
            </span>
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Expert advice, tips, and insights from Houston&apos;s premier loc specialists.
            Everything you need to know about your loc journey.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Featured Post */}
        {featuredPost && (
          <section className="mb-16">
            <h2 className="text-sm font-medium text-[#8a5a2b] uppercase tracking-wider mb-6">
              Featured Article
            </h2>
            <Link href={`/blog/${featuredPost.slug}`} className="block group">
              <article className="bg-white rounded-2xl border border-[#e7ddcd] shadow-sm p-8 hover:border-[#b08344]/40 hover:shadow-lg hover:shadow-stone-900/5 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      CATEGORY_COLORS[featuredPost.category]
                    }`}
                  >
                    {CATEGORY_LABELS[featuredPost.category]}
                  </span>
                  <span className="text-stone-400 text-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {featuredPost.readTime} min read
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-playfair font-medium mb-4 text-stone-900 group-hover:text-[#8a5a2b] transition-colors">
                  {featuredPost.title}
                </h3>
                <p className="text-stone-600 text-lg mb-6 leading-relaxed">{featuredPost.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#b08344] flex items-center justify-center">
                      <span className="text-white font-bold text-sm">TLG</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm text-stone-700">{featuredPost.author}</p>
                      <p className="text-stone-400 text-xs flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(featuredPost.publishedAt)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[#8a5a2b] font-medium group-hover:translate-x-1 transition-transform">
                    Read article →
                  </span>
                </div>
              </article>
            </Link>
          </section>
        )}

        {/* Other Posts */}
        <section>
          <h2 className="text-sm font-medium text-[#8a5a2b] uppercase tracking-wider mb-6">
            All Articles
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherPosts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="block group">
                <article className="h-full bg-white rounded-xl border border-[#e7ddcd] shadow-sm p-6 hover:border-[#b08344]/40 hover:shadow-lg hover:shadow-stone-900/5 transition-all flex flex-col">
                  <div className="flex items-center gap-2 mb-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                        CATEGORY_COLORS[post.category]
                      }`}
                    >
                      {CATEGORY_LABELS[post.category]}
                    </span>
                    <span className="text-stone-400 text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime} min
                    </span>
                  </div>
                  <h3 className="font-playfair font-medium text-lg mb-2 text-stone-900 group-hover:text-[#8a5a2b] transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-stone-600 text-sm mb-4 line-clamp-3 flex-1 leading-relaxed">{post.excerpt}</p>
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#f0e8da]">
                    <p className="text-stone-400 text-xs">{formatDate(post.publishedAt)}</p>
                    <span className="text-[#8a5a2b] text-sm font-medium">Read →</span>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 text-center bg-gradient-to-br from-[#f7edda] to-[#f1e2c6] rounded-2xl border border-[#e3cda8] p-12">
          <h2 className="text-2xl font-playfair font-medium mb-4 text-stone-900">Ready to Start Your Loc Journey?</h2>
          <p className="text-stone-600 mb-6 max-w-xl mx-auto leading-relaxed">
            Book a consultation with Houston&apos;s premier loc specialists and let&apos;s create
            something beautiful together.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#b08344] text-white rounded-full font-semibold hover:bg-[#9a6f33] shadow-sm hover:shadow-md hover:shadow-[#b08344]/20 transition-all hover:scale-[1.03]"
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
