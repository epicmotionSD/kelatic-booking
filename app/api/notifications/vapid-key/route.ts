// API endpoint for getting VAPID public key
// app/api/notifications/vapid-key/route.ts

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    
    if (!vapidPublicKey) {
      console.error('VAPID_PUBLIC_KEY environment variable is not set');
      return NextResponse.json(
        { error: 'Push notifications not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      publicKey: vapidPublicKey
    });

  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}