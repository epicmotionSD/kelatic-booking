'use client';

import { useState } from 'react';
import { Clock, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';
import type { Service } from '@/types/database';

interface QuickBookingProps {
  services: Service[];
  onServiceSelect: (service: Service) => void;
  onViewStylists: () => void;
}

export default function QuickBooking({ services, onServiceSelect, onViewStylists }: QuickBookingProps) {
  const [loading, setLoading] = useState<string | null>(null);

  // Get popular services (hardcoded for now, could be from API)
  const popularServices = services.filter(service =>
    ['consultaton', 'shampoo retwist', 'maintenance', 'loc'].some(keyword =>
      service.name.toLowerCase().includes(keyword)
    )
  ).slice(0, 4);

  const handleQuickBook = async (service: Service) => {
    setLoading(service.id);
    try {
      onServiceSelect(service);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mb-8 p-6 bg-white border border-[#e7ddcd] shadow-sm rounded-2xl">
      <h3 className="text-lg font-semibold text-stone-800 mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-[#b08344]" />
        Quick Book Popular Services
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {popularServices.map((service) => (
          <button
            key={service.id}
            onClick={() => handleQuickBook(service)}
            disabled={loading === service.id}
            className="text-left p-4 bg-white border border-[#e7ddcd] rounded-xl hover:border-[#b08344]/40 hover:bg-[#f3ede3] transition-all disabled:opacity-50"
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-stone-800">{service.name}</h4>
                <p className="text-sm text-stone-500">{service.duration} min</p>
              </div>
              <span className="text-[#8a5a2b] font-bold">
                {formatCurrency(service.base_price * 100)}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="border-t border-[#e7ddcd] pt-4">
        <button
          onClick={onViewStylists}
          className="w-full py-2 px-4 bg-white border border-[#e7ddcd] rounded-xl text-stone-600 hover:bg-[#f3ede3] hover:text-stone-800 transition-all flex items-center justify-center gap-2"
        >
          <Users className="w-4 h-4" />
          Or browse all stylists first
        </button>
      </div>
    </div>
  );
}