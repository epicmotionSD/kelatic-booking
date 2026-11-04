'use client';

import { Suspense } from 'react';
import AuthGate from '@/components/lotto/AuthGate';
import JoinLeague from '@/components/lotto/JoinLeague';

export default function JoinPage() {
  return (
    <AuthGate heading="Claim your bingo card" subheading="Enter your email and we'll send a one-tap sign-in link.">
      {(session) => (
        <Suspense fallback={null}>
          <JoinLeague session={session} />
        </Suspense>
      )}
    </AuthGate>
  );
}
