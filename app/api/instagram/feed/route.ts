import { NextRequest, NextResponse } from 'next/server';
import { instagramService } from '@/lib/instagram/service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');
    const serviceCategory = searchParams.get('category');
    const hashtag = searchParams.get('hashtag');

    let feedResponse;

    if (hashtag) {
      // Get posts by hashtag
      feedResponse = await instagramService.getHashtagMedia(hashtag, limit);
    } else {
      // Get user's media (kelatichairlounge_)
      feedResponse = await instagramService.getUserMedia(limit);
    }

    if (feedResponse.error) {
      return NextResponse.json(
        { error: feedResponse.error },
        { status: 500 }
      );
    }

    let posts = feedResponse.posts;

    // Filter by service category if specified
    if (serviceCategory && serviceCategory !== 'all') {
      posts = instagramService.filterPostsByService(posts, serviceCategory);
    }

    return NextResponse.json({
      posts,
      total: posts.length,
      nextPageToken: feedResponse.nextPageToken
    });

  } catch (error) {
    console.error('Instagram feed error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Instagram feed' },
      { status: 500 }
    );
  }
}