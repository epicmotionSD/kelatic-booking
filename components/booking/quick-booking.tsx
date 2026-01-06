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
    <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-amber-400" />
        Quick Book Popular Services
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {popularServices.map((service) => (
          <button
            key={service.id}
            onClick={() => handleQuickBook(service)}
            disabled={loading === service.id}
            className="text-left p-4 bg-white/5 border border-white/10 rounded-xl hover:border-amber-400/50 hover:bg-amber-400/5 transition-all disabled:opacity-50"
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-white">{service.name}</h4>
                <p className="text-sm text-white/50">{service.duration} min</p>
              </div>
              <span className="text-amber-400 font-bold">
                {formatCurrency(service.base_price * 100)}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="border-t border-white/10 pt-4">
        <button
          onClick={onViewStylists}
          className="w-full py-2 px-4 bg-white/5 border border-white/10 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <Users className="w-4 h-4" />
          Or browse all stylists first
        </button>
      </div>
    </div>
  );
}