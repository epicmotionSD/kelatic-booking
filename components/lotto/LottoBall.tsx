interface Props {
  n: number;
  hit?: boolean;
  size?: 'sm' | 'lg';
}

export default function LottoBall({ n, hit = false, size = 'sm' }: Props) {
  const dims = size === 'lg' ? 'h-14 w-14 text-xl' : 'h-10 w-10 text-sm';
  return (
    <div
      aria-label={`${n}${hit ? ' (hit)' : ''}`}
      className={`flex items-center justify-center rounded-full font-black tabular-nums shadow-inner transition-colors ${dims} ${
        hit
          ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-200'
          : 'bg-white text-slate-900 ring-1 ring-slate-300'
      }`}
    >
      {n}
    </div>
  );
}
