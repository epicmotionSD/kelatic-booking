'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, Calendar, Share2 } from 'lucide-react';
import { getBlogPost, getRecentPosts, type BlogPost } from '@/lib/blog-posts';
import { notFound } from 'next/navigation';
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
    <div className="min-h-screen bg-[#faf7f2] text-stone-800">
      {/* Header */}
      <header className="bg-[#faf7f2]/85 backdrop-blur-xl border-b border-[#e7ddcd] sticky top-0 z-50">
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
              <Link href="/blog" className="flex items-center gap-2 text-stone-600 hover:text-[#8a5a2b] transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Blog</span>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <PublicAuthLinks />
              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-sm text-stone-500 hover:text-[#8a5a2b] transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
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
            <span className="text-stone-400 text-sm flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {post.readTime} min read
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-playfair font-medium mb-6 leading-tight text-stone-900">
            {post.title}
          </h1>
          <p className="text-lg text-stone-600 mb-8 leading-relaxed">{post.excerpt}</p>
          <div className="flex items-center gap-4 pb-8 border-b border-[#e7ddcd]">
            <div className="w-12 h-12 rounded-full bg-[#b08344] flex items-center justify-center">
              <span className="text-white font-bold">TLG</span>
            </div>
            <div>
              <p className="font-medium text-stone-700">{post.author}</p>
              <p className="text-stone-400 text-sm flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(post.publishedAt)}
              </p>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <article className="prose prose-lg max-w-none prose-headings:font-playfair prose-headings:font-medium prose-headings:text-stone-900 prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-stone-700 prose-p:leading-relaxed prose-strong:text-[#8a5a2b] prose-li:text-stone-700 prose-a:text-[#8a5a2b] prose-a:no-underline hover:prose-a:underline">
          {post.content.split('\n').map((paragraph, index) => {
            // Handle headings
            if (paragraph.startsWith('## ')) {
              return (
                <h2 key={index} className="text-2xl font-playfair font-medium text-stone-900 mt-10 mb-4">
                  {paragraph.replace('## ', '')}
                </h2>
              );
            }
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={index} className="text-xl font-playfair font-medium text-stone-900 mt-8 mb-3">
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            // Handle bold text and lists
            if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
              return (
                <p key={index} className="font-semibold text-[#8a5a2b] mt-4 mb-2">
                  {paragraph.replace(/\*\*/g, '')}
                </p>
              );
            }
            if (paragraph.startsWith('- ') || paragraph.startsWith('1. ')) {
              return (
                <p key={index} className="text-stone-700 ml-4 my-1">
                  {paragraph}
                </p>
              );
            }
            // Regular paragraphs
            if (paragraph.trim()) {
              return (
                <p key={index} className="text-stone-700 leading-relaxed my-4">
                  {paragraph}
                </p>
              );
            }
            return null;
          })}
        </article>

        {/* CTA */}
        <section className="mt-16 bg-gradient-to-br from-[#f7edda] to-[#f1e2c6] rounded-2xl border border-[#e3cda8] p-8 text-center">
          <h2 className="text-2xl font-playfair font-medium mb-4 text-stone-900">Ready for Your Loc Journey?</h2>
          <p className="text-stone-600 mb-6 max-w-xl mx-auto leading-relaxed">
            Book a consultation with The Loc Gawd and experience the difference professional expertise makes.
          </p>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#b08344] text-white rounded-full font-semibold hover:bg-[#9a6f33] shadow-sm hover:shadow-md hover:shadow-[#b08344]/20 transition-all hover:scale-[1.03]"
          >
            Book Your Appointment
          </Link>
        </section>

        {/* Related Posts */}
        {recentPosts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl font-playfair font-medium mb-6 text-stone-900">More from the Loc Chop</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {recentPosts.slice(0, 2).map((relatedPost) => (
                <Link
                  key={relatedPost.slug}
                  href={`/blog/${relatedPost.slug}`}
                  className="block group"
                >
                  <article className="bg-white rounded-xl border border-[#e7ddcd] shadow-sm p-6 hover:border-[#b08344]/40 hover:shadow-lg hover:shadow-stone-900/5 transition-all">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border mb-3 ${
                        CATEGORY_COLORS[relatedPost.category]
                      }`}
                    >
                      {CATEGORY_LABELS[relatedPost.category]}
                    </span>
                    <h3 className="font-playfair font-medium text-lg mb-2 text-stone-900 group-hover:text-[#8a5a2b] transition-colors line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    <p className="text-stone-600 text-sm line-clamp-2 leading-relaxed">{relatedPost.excerpt}</p>
                  </article>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#f3ede3] border-t border-[#e7ddcd] mt-12">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-stone-500">
            <Link href="/blog" className="hover:text-[#8a5a2b] transition-colors">
              ← Back to all articles
            </Link>
            <p>
              <a href="tel:+17134854000" className="text-[#8a5a2b] hover:text-[#b08344]">
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
