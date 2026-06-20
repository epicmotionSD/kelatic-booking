'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stylist {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
}

export default function StylistsSchedulePage() {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStylists();
  }, []);

  async function fetchStylists() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/stylists');
      const data = await res.json();
      setStylists(data.stylists || []);
    } catch (error) {
      console.error('Failed to fetch stylists for schedule page:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-playfair font-bold text-white">Stylist Schedules</h1>
        <p className="text-white/60 mt-1">Select a stylist to edit weekly hours and time off</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00ffb2]" />
        </div>
      ) : stylists.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center text-white/60">
          No stylists found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stylists.map((stylist) => (
            <div
              key={stylist.id}
              className={`bg-card rounded-xl border border-border p-5 ${!stylist.is_active ? 'opacity-60' : ''}`}
            >
              <div className="mb-4">
                <p className="text-white font-semibold text-lg">
                  {stylist.first_name} {stylist.last_name}
                </p>
                <p className="text-white/60 text-sm">{stylist.email}</p>
              </div>

              <Link
                href={`/admin/team/${stylist.id}/schedule`}
                className="inline-flex items-center justify-center w-full px-4 py-2 rounded-xl bg-[#00ffb2] text-black font-semibold  transition-all"
              >
                Edit Schedule
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
