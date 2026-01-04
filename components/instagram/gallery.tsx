'use client';

import React, { useState, useEffect } from 'react';
import { Instagram, ExternalLink, Heart } from 'lucide-react';
import type { InstagramPost } from '@/lib/instagram/service';

interface InstagramGalleryProps {
  limit?: number;
  category?: string;
  showCaptions?: boolean;
  className?: string;
}

export function InstagramGallery({ 
  limit = 12, 
  category, 
  showCaptions = false,
  className = '' 
}: InstagramGalleryProps) {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [limit, category]);

  async function fetchPosts() {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        limit: limit.toString(),
      });

      if (category && category !== 'all') {
        params.set('category', category);
      }

      const res = await fetch(`/api/instagram/feed?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch Instagram posts');
      }

      setPosts(data.posts || []);
    } catch (err) {
      console.error('Error fetching Instagram posts:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <Instagram className="w-8 h-8 text-white/20" />
        </div>
        <p className="text-white/40 text-sm">{error}</p>
        <button 
          onClick={fetchPosts}
          className="text-amber-400 hover:text-amber-300 text-sm mt-2"
        >
          Try again
        </button>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <Instagram className="w-8 h-8 text-white/20" />
        </div>
        <p className="text-white/40 text-sm">No Instagram posts found</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {posts.map((post) => (
          <InstagramPostCard 
            key={post.id} 
            post={post} 
            showCaption={showCaptions}
          />
        ))}
      </div>
    </div>
  );
}

interface InstagramPostCardProps {
  post: InstagramPost;
  showCaption?: boolean;
}

function InstagramPostCard({ post, showCaption = false }: InstagramPostCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const altText = post.caption 
    ? post.caption.split('.')[0].substring(0, 100)
    : `Instagram post by ${post.username}`;

  return (
    <div className="group relative bg-white/5 rounded-xl overflow-hidden border border-white/10 hover:border-amber-400/30 transition-all">
      <div className="aspect-square relative overflow-hidden">
        {!imageFailed ? (
          <>
            <img
              src={post.media_url}
              alt={altText}
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageFailed(true)}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 bg-white/5 animate-pulse" />
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5">
            <Instagram className="w-8 h-8 text-white/20" />
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <a
            href={post.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
          >
            <Instagram className="w-4 h-4" />
            <span className="text-sm font-medium">View on Instagram</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {showCaption && post.caption && (
        <div className="p-3">
          <p className="text-white/70 text-xs line-clamp-2">
            {post.caption}
          </p>
          <div className="flex items-center gap-2 mt-2 text-white/40">
            <Instagram className="w-3 h-3" />
            <span className="text-xs">@{post.username}</span>
          </div>
        </div>
      )}
    </div>
  );
}