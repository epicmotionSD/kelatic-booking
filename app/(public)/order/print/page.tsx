'use client';

import { useState } from 'react';
import { Leaf, Printer, LayoutGrid, StickyNote } from 'lucide-react';

type Mode = 'handout' | 'tent';

// A single compact QR card used for cut-out handouts.
function HandoutCard() {
  return (
    <div className="ho-card flex flex-col items-center justify-center text-center border border-dashed border-[#1f3d2b]/30 rounded-xl px-4 py-5">
      <div className="flex items-center gap-1.5 text-[#3f7d4f]">
        <Leaf className="w-3.5 h-3.5" />
        <span className="uppercase tracking-[0.15em] text-[9px] font-semibold">Kelatic Vitality House</span>
      </div>
      <div className="font-playfair text-xl font-medium mt-1">Scan to Order</div>
      <div className="mt-2 w-28 h-28 bg-white border-2 border-[#3f7d4f] rounded-lg p-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/vitality/order-qr.svg" alt="Scan to order online" className="w-full h-full" />
      </div>
      <div className="mt-2 text-[#3f7d4f] font-semibold text-[11px]">kelaticvitalityhouse.com/shop</div>
      <div className="text-[8px] uppercase tracking-wide text-[#1f3d2b]/50 mt-0.5">Order ahead · Pickup only</div>
    </div>
  );
}

// One face of a table tent.
function TentFace({ flipped = false }: { flipped?: boolean }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center h-full"
      style={flipped ? { transform: 'rotate(180deg)' } : undefined}
    >
      <div className="flex items-center gap-2 text-[#3f7d4f]">
        <Leaf className="w-4 h-4" />
        <span className="uppercase tracking-[0.2em] text-[10px] font-semibold">Kelatic Vitality House</span>
      </div>
      <div className="font-playfair text-2xl font-medium mt-1.5">Scan to Order</div>
      <div className="mt-3 w-36 h-36 bg-white border-4 border-[#3f7d4f] rounded-xl p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/vitality/order-qr.svg" alt="Scan to order online" className="w-full h-full" />
      </div>
      <div className="mt-3 text-[#3f7d4f] font-semibold text-sm">kelaticvitalityhouse.com/shop</div>
      <div className="text-[9px] uppercase tracking-wide text-[#1f3d2b]/50 mt-1">Fresh · Uplifting · Naturally Healing</div>
    </div>
  );
}

export default function OrderPrintPage() {
  const [mode, setMode] = useState<Mode>('handout');

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-[#1f3d2b]">
      {/* Controls — never printed */}
      <div className="no-print sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-[#1f3d2b]/10">
        <div className="max-w-4xl mx-auto px-5 py-3 flex flex-wrap items-center gap-3">
          <span className="font-semibold flex items-center gap-2">
            <Leaf className="w-4 h-4 text-[#3f7d4f]" /> Print QR Sheet
          </span>
          <div className="flex rounded-full bg-[#eef4ec] p-1 text-sm">
            <button
              onClick={() => setMode('handout')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${mode === 'handout' ? 'bg-[#3f7d4f] text-white' : 'text-[#1f3d2b]/70'}`}
            >
              <LayoutGrid className="w-4 h-4" /> Handout cards (6)
            </button>
            <button
              onClick={() => setMode('tent')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${mode === 'tent' ? 'bg-[#3f7d4f] text-white' : 'text-[#1f3d2b]/70'}`}
            >
              <StickyNote className="w-4 h-4" /> Table tents (2)
            </button>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 bg-[#3f7d4f] hover:bg-[#356b44] text-white px-4 py-2 rounded-full text-sm font-medium"
          >
            <Printer className="w-4 h-4" /> Print / Save PDF
          </button>
        </div>
        <p className="max-w-4xl mx-auto px-5 pb-3 text-xs text-[#1f3d2b]/50">
          {mode === 'handout'
            ? 'Six cut-out cards per Letter page. Print, then cut along the dashed lines.'
            : 'Two fold-over tents per Letter page. Cut apart, fold along the center dotted line so both faces stand upright.'}
        </p>
      </div>

      {/* Printable sheet */}
      <div className="flex justify-center py-8 print:py-0">
        <div className="sheet bg-white shadow-sm print:shadow-none">
          {mode === 'handout' ? (
            <div className="grid grid-cols-2 grid-rows-3 gap-3 h-full">
              {Array.from({ length: 6 }).map((_, i) => (
                <HandoutCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-rows-2 gap-4 h-full">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="tent border border-dashed border-[#1f3d2b]/30 rounded-xl overflow-hidden grid grid-rows-2">
                  {/* Top face is rotated so it reads right-side up once folded back */}
                  <div className="border-b border-dotted border-[#1f3d2b]/40 p-3">
                    <TentFace flipped />
                  </div>
                  <div className="p-3">
                    <TentFace />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .sheet {
          width: 8.5in;
          height: 11in;
          padding: 0.4in;
          box-sizing: border-box;
        }
        @media print {
          .no-print { display: none !important; }
          body { background: #ffffff !important; }
          .sheet { width: 100%; height: 100%; padding: 0.4in; box-shadow: none !important; }
          @page { size: letter portrait; margin: 0; }
        }
      `}</style>
    </div>
  );
}
