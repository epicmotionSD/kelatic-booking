import type { Metadata } from 'next';
import Link from 'next/link';
import { Bricolage_Grotesque } from 'next/font/google';

const display = Bricolage_Grotesque({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-ld-display' });

const TITLE = 'LottoDuel | The Bingo Pool Manager';
const DESCRIPTION =
  'The bingo pool manager powered by official lottery drawings. Everyone gets 5 numbers plus the Powerball. First one to get all their numbers: BINGO!';

// Absolute title + full social tags so nothing from the x3o.ai root layout leaks onto LottoDuel
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  applicationName: 'LottoDuel',
  keywords: ['lottery pool', 'bingo pool', 'powerball pool', 'office lottery pool', 'lottery league', 'LottoDuel'],
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website', siteName: 'LottoDuel' },
  twitter: { card: 'summary', title: TITLE, description: DESCRIPTION },
};

export default function LottoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} lotto min-h-screen bg-[#0B0B1E] text-[#FFF8E7] [background-image:radial-gradient(ellipse_at_top,rgba(255,201,60,0.10),transparent_60%)]`}>
      <nav className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
        <Link href="/lotto" className="font-[family-name:var(--font-ld-display)] text-2xl font-extrabold tracking-tight">
          Lotto<span className="text-[#FFC93C]">Duel</span>
        </Link>
        <div className="flex gap-4 text-sm font-semibold">
          <Link href="/lotto/join" className="text-[#A7A9D6] hover:text-[#FFF8E7]">Join</Link>
          <Link href="/lotto/commissioner" className="text-[#FFC93C] hover:brightness-110">Start a pool</Link>
        </div>
      </nav>
      <main className="mx-auto max-w-2xl px-4 pb-16 pt-4">{children}</main>
      <footer className="mx-auto max-w-2xl px-4 pb-10 text-center text-xs text-[#A7A9D6]/60">
        LottoDuel is a free bingo game that uses official draw results. It is not affiliated with any lottery,
        sells no tickets, and pays no prizes.
      </footer>
    </div>
  );
}
