// Instagram Feed Service
// Integrates with Instagram Basic Display API to pull portfolio images

export interface InstagramPost {
  id: string;
  caption?: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  media_url: string;
  permalink: string;
  thumbnail_url?: string;
  timestamp: string;
  username: string;
}

export interface InstagramFeedResponse {
  posts: InstagramPost[];
  nextPageToken?: string;
  error?: string;
}

class InstagramService {
  private accessToken: string;
  private apiUrl = 'https://graph.instagram.com';

  constructor() {
    this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || '';
  }

  async getUserMedia(limit: number = 20): Promise<InstagramFeedResponse> {
    if (!this.accessToken) {
      return { 
        posts: [], 
        error: 'Instagram access token not configured' 
      };
    }

    try {
      const fields = [
        'id',
        'caption',
        'media_type', 
        'media_url',
        'permalink',
        'thumbnail_url',
        'timestamp',
        'username'
      ].join(',');

      const url = `${this.apiUrl}/me/media?fields=${fields}&limit=${limit}&access_token=${this.accessToken}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        console.error('Instagram API Error:', data);
        return { 
          posts: [], 
          error: data.error?.message || 'Failed to fetch Instagram posts' 
        };
      }

      const posts: InstagramPost[] = (data.data || [])
        .filter((post: any) => post.media_type === 'IMAGE' || post.media_type === 'CAROUSEL_ALBUM')
        .map((post: any) => ({
          id: post.id,
          caption: post.caption || '',
          media_type: post.media_type,
          media_url: post.media_url,
          permalink: post.permalink,
          thumbnail_url: post.thumbnail_url,
          timestamp: post.timestamp,
          username: post.username || 'kelatichairlounge_'
        }));

      return {
        posts,
        nextPageToken: data.paging?.next
      };

    } catch (error) {
      console.error('Instagram Service Error:', error);
      return { 
        posts: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async getHashtagMedia(hashtag: string, limit: number = 20): Promise<InstagramFeedResponse> {
    if (!this.accessToken) {
      return { 
        posts: [], 
        error: 'Instagram access token not configured' 
      };
    }

    try {
      // First get hashtag ID
      const hashtagUrl = `${this.apiUrl}/ig_hashtag_search?user_id=me&q=${hashtag}&access_token=${this.accessToken}`;
      const hashtagResponse = await fetch(hashtagUrl);
      const hashtagData = await hashtagResponse.json();

      if (!hashtagResponse.ok || !hashtagData.data?.[0]) {
        return { 
          posts: [], 
          error: `Hashtag #${hashtag} not found` 
        };
      }

      const hashtagId = hashtagData.data[0].id;

      // Get recent media for hashtag
      const fields = [
        'id',
        'caption',
        'media_type',
        'media_url',
        'permalink',
        'thumbnail_url',
        'timestamp',
        'username'
      ].join(',');

      const mediaUrl = `${this.apiUrl}/${hashtagId}/recent_media?fields=${fields}&limit=${limit}&access_token=${this.accessToken}`;
      const mediaResponse = await fetch(mediaUrl);
      const mediaData = await mediaResponse.json();

      if (!mediaResponse.ok) {
        return { 
          posts: [], 
          error: mediaData.error?.message || 'Failed to fetch hashtag posts' 
        };
      }

      const posts: InstagramPost[] = (mediaData.data || [])
        .filter((post: any) => post.media_type === 'IMAGE' || post.media_type === 'CAROUSEL_ALBUM')
        .map((post: any) => ({
          id: post.id,
          caption: post.caption || '',
          media_type: post.media_type,
          media_url: post.media_url,
          permalink: post.permalink,
          thumbnail_url: post.thumbnail_url,
          timestamp: post.timestamp,
          username: post.username || 'kelatichairlounge_'
        }));

      return { posts };

    } catch (error) {
      console.error('Instagram Hashtag Error:', error);
      return { 
        posts: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Helper to filter posts by service type based on captions/hashtags
  filterPostsByService(posts: InstagramPost[], serviceCategory: string): InstagramPost[] {
    const keywords: Record<string, string[]> = {
      locs: ['loc', 'locs', 'dreadlocks', 'retwist', 'starter', 'maintenance'],
      braids: ['braid', 'braids', 'cornrow', 'protective', 'twist'],
      natural: ['natural', 'textured', 'coily', 'kinky', 'afro'],
      silk_press: ['silk', 'press', 'straight', 'smooth', 'sleek'],
      color: ['color', 'highlight', 'blonde', 'dye', 'tint'],
      treatments: ['treatment', 'deep', 'condition', 'protein', 'moisture'],
      barber: ['cut', 'fade', 'beard', 'trim', 'edge'],
    };

    const categoryKeywords = keywords[serviceCategory] || [];
    
    return posts.filter(post => {
      const caption = (post.caption || '').toLowerCase();
      return categoryKeywords.some(keyword => caption.includes(keyword));
    });
  }

  // Generate alt text for accessibility
  generateAltText(post: InstagramPost): string {
    const caption = post.caption || '';
    if (caption.length > 0) {
      // Extract first sentence or 100 characters
      const firstSentence = caption.split('.')[0];
      return firstSentence.length < 100 ? firstSentence : caption.substring(0, 100) + '...';
    }
    return `Instagram post by ${post.username}`;
  }
}

export const instagramService = new InstagramService();