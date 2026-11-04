import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Lotto Duel | Run a lottery league with friends',
  description: 'Start a free league, share a code, and watch every card light up live after each Powerball draw.',
  openGraph: {
    title: 'Lotto Duel',
    description: 'Tap the link, get your numbers, and race your friends to fill the card.',
    type: 'website',
  },
};

// Tenant shell: Lotto Duel branding only, nothing from the salon chrome.
export default function LottoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lotto min-h-screen bg-slate-950 text-slate-100">
      <nav className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
        <Link href="/lotto" className="text-xl font-black tracking-tight text-white">
          LOTTO<span className="text-amber-400">DUEL</span>
        </Link>
        <div className="flex gap-4 text-sm font-semibold">
          <Link href="/lotto/join" className="text-slate-300 hover:text-white">Join</Link>
          <Link href="/lotto/commissioner" className="text-amber-300 hover:text-amber-200">Start a league</Link>
        </div>
      </nav>
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-4">{children}</main>
      <footer className="mx-auto max-w-2xl px-4 pb-10 text-center text-xs text-slate-600">
        Lotto Duel is a free game for tracking official draw results. It is not affiliated with any lottery,
        sells no tickets, and pays no prizes.
      </footer>
    </div>
  );
}
