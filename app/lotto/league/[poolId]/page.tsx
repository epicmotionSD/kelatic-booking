'use client';

import { useParams } from 'next/navigation';
import AuthGate from '@/components/lotto/AuthGate';
import LeagueBoard from '@/components/lotto/LeagueBoard';

export default function LeaguePage() {
  const { poolId } = useParams<{ poolId: string }>();
  return (
    <AuthGate heading="Sign in to see the board">
      {(session) => <LeagueBoard poolId={poolId} session={session} />}
    </AuthGate>
  );
}
