'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface StylistVideo {
  id: string;
  youtube_url: string;
  title?: string;
  stylist: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
    specialties?: string[];
  };
}

// Fallback video for when no videos exist in DB yet
const FALLBACK_VIDEO = {
  id: 'fallback-1',
  youtube_url: 'https://youtube.com/shorts/b9kadh1jTD4',
  title: 'The Transformation',
  stylist: {
    id: '',
    first_name: 'Destiny',
    last_name: '',
    specialties: ['Loc Styling', 'Retwists'],
  },
};

export function StylistCarousel() {
  const [videos, setVideos] = useState<StylistVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
  });
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, []);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setCanScrollPrev(emblaApi.canScrollPrev());
      setCanScrollNext(emblaApi.canScrollNext());
    };

    emblaApi.on('select', onSelect);
    onSelect();

    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/stylist-videos');
      if (res.ok) {
        const data = await res.json();
        if (data.videos?.length > 0) {
          setVideos(data.videos);
        } else {
          // Use fallback if no videos in DB
          setVideos([FALLBACK_VIDEO]);
        }
      } else {
        setVideos([FALLBACK_VIDEO]);
      }
    } catch (e) {
      console.error('Failed to fetch videos:', e);
      setVideos([FALLBACK_VIDEO]);
    } finally {
      setLoading(false);
    }
  };

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // Extract YouTube video ID for embedding
  const getYouTubeId = (url: string) => {
    const match = url.match(/(?:shorts\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  if (loading) {
    return (
      <section id="video" className="py-24 bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded w-48 mx-auto mb-4" />
            <div className="h-4 bg-white/10 rounded w-64 mx-auto" />
          </div>
        </div>
      </section>
    );
  }

  // Single video - show simple layout without carousel (matches original)
  if (videos.length === 1) {
    const video = videos[0];
    const videoId = getYouTubeId(video.youtube_url);

    return (
      <section id="video" className="py-24 bg-zinc-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">See The Work</h2>
            <p className="text-white/50 text-lg">Watch the transformation</p>
          </div>

          {/* Video - same as original layout */}
          <div className="aspect-[9/16] max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-amber-500/10 border border-white/10">
            {videoId ? (
              <iframe
                className="w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}`}
                title={video.title || 'Stylist Video'}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                <span className="text-white/30">Video unavailable</span>
              </div>
            )}
          </div>

          {/* Stylist info below video */}
          {video.stylist.id && (
            <div className="max-w-md mx-auto mt-6 text-center">
              <p className="text-white/50 mb-3">
                Work by <span className="text-amber-400 font-semibold">{video.stylist.first_name} {video.stylist.last_name}</span>
              </p>
              <Link
                href={`/book?stylist=${video.stylist.id}`}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
              >
                <Calendar className="w-5 h-5" />
                Book with {video.stylist.first_name}
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Multiple videos - show carousel
  return (
    <section id="video" className="py-24 bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-black mb-4">See The Work</h2>
          <p className="text-white/50 text-lg">Watch transformations from our stylists</p>
        </div>

        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {videos.map((video) => {
                const videoId = getYouTubeId(video.youtube_url);
                return (
                  <div key={video.id} className="flex-none w-full md:w-1/2 lg:w-1/3 px-3">
                    <div className="bg-zinc-900 rounded-3xl overflow-hidden border border-white/10">
                      <div className="aspect-[9/16] max-h-[450px]">
                        {videoId ? (
                          <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${videoId}`}
                            title={video.title || 'Stylist Video'}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                            <span className="text-white/30">Video unavailable</span>
                          </div>
                        )}
                      </div>

                      <div className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400/20 to-transparent flex items-center justify-center border border-amber-400/30">
                            <span className="text-lg font-bold text-amber-400">
                              {video.stylist.first_name[0]}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-bold text-white">
                              {video.stylist.first_name} {video.stylist.last_name}
                            </h3>
                            {video.stylist.specialties && (
                              <p className="text-amber-400 text-sm">
                                {video.stylist.specialties.slice(0, 2).join(' | ')}
                              </p>
                            )}
                          </div>
                        </div>

                        {video.stylist.id && (
                          <Link
                            href={`/book?stylist=${video.stylist.id}`}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-bold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                          >
                            <Calendar className="w-5 h-5" />
                            Book with {video.stylist.first_name}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Arrows */}
          {videos.length > 1 && (
            <>
              <button
                onClick={scrollPrev}
                disabled={!canScrollPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/70 backdrop-blur rounded-full hover:bg-amber-400 hover:text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed z-10"
                aria-label="Previous video"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={scrollNext}
                disabled={!canScrollNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/70 backdrop-blur rounded-full hover:bg-amber-400 hover:text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed z-10"
                aria-label="Next video"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
