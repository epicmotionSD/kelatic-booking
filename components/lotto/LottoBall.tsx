// LottoDuel palette
//   ink #0B0B1E · panel #16163A · line #2A2A5A · gold #FFC93C
//   bingo red #FF4D6D · hit teal #22D3B6 · cream #FFF8E7 · muted #A7A9D6

interface BallProps {
  n: number;
  hit?: boolean;
  special?: boolean;
  size?: 'sm' | 'lg';
}

export default function LottoBall({ n, hit = false, special = false, size = 'sm' }: BallProps) {
  const dims = size === 'lg' ? 'h-14 w-14 text-xl' : 'h-10 w-10 text-sm';
  const look = special
    ? hit
      ? 'bg-[#FF4D6D] text-white ring-2 ring-[#FF4D6D]/60 shadow-[0_0_16px_rgba(255,77,109,0.6)]'
      : 'bg-[#FFF8E7] text-[#FF4D6D] ring-2 ring-[#FF4D6D]'
    : hit
      ? 'bg-[#22D3B6] text-[#0B0B1E] ring-2 ring-[#22D3B6]/50 shadow-[0_0_14px_rgba(34,211,182,0.5)]'
      : 'bg-[#FFF8E7] text-[#0B0B1E] ring-1 ring-black/10';
  return (
    <div
      aria-label={`${special ? 'Special ball ' : ''}${n}${hit ? ' (hit)' : ''}`}
      className={`flex shrink-0 items-center justify-center rounded-full font-black tabular-nums transition-all ${dims} ${look}`}
    >
      {n}
    </div>
  );
}

interface CardProps {
  numbers: number[];
  special: number;
  matched?: number[];
  specialMatched?: boolean;
  size?: 'sm' | 'lg';
}

// A full LottoDuel card: 5 numbers + the special ball, set apart by a divider
export function BingoCard({ numbers, special, matched = [], specialMatched = false, size = 'sm' }: CardProps) {
  return (
    <div className={`flex items-center ${size === 'lg' ? 'gap-2' : 'gap-1.5'}`}>
      {numbers.map((n) => (
        <LottoBall key={n} n={n} hit={matched.includes(n)} size={size} />
      ))}
      <span className="mx-0.5 h-6 w-px bg-[#2A2A5A]" aria-hidden />
      <LottoBall n={special} special hit={specialMatched} size={size} />
    </div>
  );
}
