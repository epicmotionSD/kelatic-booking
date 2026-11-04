'use client';

import AuthGate from '@/components/lotto/AuthGate';
import CreateLeague from '@/components/lotto/CreateLeague';

export default function CommissionerPage() {
  return (
    <AuthGate heading="Start a bingo pool" subheading="Sign in with your email. No password needed.">
      {(session) => <CreateLeague session={session} />}
    </AuthGate>
  );
}
