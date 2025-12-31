'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, Share2 } from 'lucide-react';
import { getBlogPost, getRecentPosts, type BlogPost } from '@/lib/blog-posts';
import { notFound } from 'next/navigation';

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

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  const recentPosts = getRecentPosts(3).filter((p) => p.slug !== slug);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center">
                <img
                  src="/logo.png"
                  alt="Kelatic Hair Lounge"
                  className="h-10 w-auto"
                />
              </Link>
              <Link href="/blog" className="flex items-center gap-2 text-white/70 hover:text-amber-400 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Blog</span>
              </Link>
            </div>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-amber-400 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Article Header */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium border ${
                CATEGORY_COLORS[post.category]
              }`}
            >
              {CATEGORY_LABELS[post.category]}
            </span>
            <span className="text-white/40 text-sm flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readTime} min read
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 leading-tight">
            {post.title}
          </h1>
          <p className="text-lg text-white/60 mb-8">{post.excerpt}</p>
          <div className="flex items-center gap-4 pb-8 border-b border-white/10">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center">
              <span className="text-black font-bold">TLG</span>
            </div>
            <div>
              <p className="font-medium">{post.author}</p>
              <p className="text-white/40 text-sm flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(post.publishedAt)}
              </p>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <article className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:text-white prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-white/70 prose-p:leading-relaxed prose-strong:text-amber-400 prose-li:text-white/70 prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline">
          {post.content.split('\n').map((paragraph, index) => {
            // Handle headings
            if (paragraph.startsWith('## ')) {
              return (
                <h2 key={index} className="text-2xl font-bold text-white mt-10 mb-4">
                  {paragraph.replace('## ', '')}
                </h2>
              );
            }
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={index} className="text-xl font-bold text-white mt-8 mb-3">
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            // Handle bold text and lists
            if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
              return (
                <p key={index} className="font-bold text-amber-400 mt-4 mb-2">
                  {paragraph.replace(/\*\*/g, '')}
                </p>
              );
            }
            if (paragraph.startsWith('- ') || paragraph.startsWith('1. ')) {
              return (
                <p key={index} className="text-white/70 ml-4 my-1">
                  {paragraph}
                </p>
              );
            }
            // Regular paragraphs
            if (paragraph.trim()) {
              return (
                <p key={index} className="text-white/70 leading-relaxed my-4">
                  {paragraph}
                </p>
              );
            }
            return null;
          })}
        </article>

        {/* CTA */}
        <section className="mt-16 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-2xl border border-amber-500/20 p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready for Your Loc Journey?</h2>
          <p className="text-white/60 mb-6 max-w-xl mx-auto">
            Book a consultation with The Loc Gawd and experience the difference professional expertise makes.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
          >
            Book Your Appointment
          </Link>
        </section>

        {/* Related Posts */}
        {recentPosts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-bold mb-6">More from the Loc Chop</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {recentPosts.slice(0, 2).map((relatedPost) => (
                <Link
                  key={relatedPost.slug}
                  href={`/blog/${relatedPost.slug}`}
                  className="block group"
                >
                  <article className="bg-zinc-900/50 rounded-xl border border-white/10 p-6 hover:border-amber-400/50 transition-all">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border mb-3 ${
                        CATEGORY_COLORS[relatedPost.category]
                      }`}
                    >
                      {CATEGORY_LABELS[relatedPost.category]}
                    </span>
                    <h3 className="font-bold mb-2 group-hover:text-amber-400 transition-colors line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    <p className="text-white/50 text-sm line-clamp-2">{relatedPost.excerpt}</p>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black/30 border-t border-white/5 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/40">
            <Link href="/blog" className="hover:text-amber-400 transition-colors">
              ← Back to all articles
            </Link>
            <p>
              <a href="tel:+17134854000" className="text-amber-400 hover:text-amber-300">
                (713) 485-4000
              </a>{' '}
              | 9430 Richmond Ave, Houston, TX 77063
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
