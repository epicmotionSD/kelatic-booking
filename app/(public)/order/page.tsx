'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Leaf, Printer, Smartphone, LayoutGrid } from 'lucide-react';

const ORDER_URL = 'https://kelaticvitalityhouse.com/shop';

export default function OrderQrPage() {
  // If the page is opened on a different host than the printed target,
  // still show the canonical URL that the QR encodes.
  const [host, setHost] = useState<string>('');
  useEffect(() => {
    setHost(window.location.origin);
  }, []);

  return (
    <div className="min-h-screen bg-[#f7f4ec] text-[#1f3d2b] flex flex-col items-center justify-center px-5 py-10">
      {/* Print button — hidden on paper */}
      <button
        onClick={() => window.print()}
        className="no-print fixed top-5 right-5 inline-flex items-center gap-2 bg-[#3f7d4f] hover:bg-[#356b44] text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm"
      >
        <Printer className="w-4 h-4" /> Print / Save PDF
      </button>

      <Link
        href="/order/print"
        className="no-print fixed top-5 left-5 inline-flex items-center gap-2 bg-white hover:bg-[#eef4ec] text-[#3f7d4f] border border-[#3f7d4f]/30 px-4 py-2 rounded-full text-sm font-medium shadow-sm"
      >
        <LayoutGrid className="w-4 h-4" /> Multi-up sheet
      </Link>

      {/* Signage card */}
      <div className="print-card w-full max-w-md bg-white rounded-3xl shadow-sm border border-[#1f3d2b]/10 px-8 py-10 text-center">
        <div className="flex items-center justify-center gap-2 text-[#3f7d4f]">
          <Leaf className="w-5 h-5" />
          <span className="uppercase tracking-[0.2em] text-xs font-semibold">Kelatic Vitality House</span>
        </div>

        <h1 className="font-playfair text-4xl font-medium mt-4 leading-tight">
          Scan to Order
        </h1>
        <p className="text-[#1f3d2b]/60 mt-2 flex items-center justify-center gap-1.5 text-sm">
          <Smartphone className="w-4 h-4" /> Point your camera at the code
        </p>

        {/* QR */}
        <div className="mt-7 mx-auto w-64 h-64 bg-white rounded-2xl border-4 border-[#3f7d4f] p-3 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/vitality/order-qr.svg" alt="Scan to order online" className="w-full h-full" />
        </div>

        <p className="mt-6 text-[#3f7d4f] font-semibold break-all text-sm">
          kelaticvitalityhouse.com/shop
        </p>
        <p className="mt-1 text-xs uppercase tracking-wide text-[#1f3d2b]/50">
          Fresh · Uplifting · Naturally Healing
        </p>

        <div className="mt-6 pt-5 border-t border-[#1f3d2b]/10 text-xs text-[#1f3d2b]/50">
          Order ahead · Pickup only
        </div>
      </div>

      {/* On-screen helper (never printed) */}
      <p className="no-print mt-6 text-xs text-[#1f3d2b]/40 text-center max-w-md">
        This code links to <span className="font-medium">{ORDER_URL}</span>
        {host && host !== 'https://kelaticvitalityhouse.com' && (
          <> · You are viewing on {host}</>
        )}
      </p>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #ffffff !important; }
          .print-card {
            box-shadow: none !important;
            border-color: #1f3d2b33 !important;
          }
          @page { margin: 1cm; }
        }
      `}</style>
    </div>
  );
}
