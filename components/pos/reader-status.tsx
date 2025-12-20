'use client';

import { useState, useEffect } from 'react';

interface Reader {
  id: string;
  label: string;
  status: 'online' | 'offline';
  device_type: string;
  serial_number: string;
}

export function ReaderStatus() {
  const [reader, setReader] = useState<Reader | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchReaderStatus();
    // Poll every 30 seconds
    const interval = setInterval(fetchReaderStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchReaderStatus() {
    try {
      const res = await fetch('/api/pos/reader-status');
      const data = await res.json();
      setReader(data.reader);
    } catch (error) {
      console.error('Failed to fetch reader status:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
        <span className="text-sm text-gray-500">Checking reader...</span>
      </div>
    );
  }

  if (!reader) {
    return (
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
      >
        <div className="w-2 h-2 bg-red-500 rounded-full" />
        <span className="text-sm text-red-700">No reader found</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
          reader.status === 'online'
            ? 'bg-green-50 hover:bg-green-100'
            : 'bg-yellow-50 hover:bg-yellow-100'
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            reader.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'
          }`}
        />
        <span
          className={`text-sm font-medium ${
            reader.status === 'online' ? 'text-green-700' : 'text-yellow-700'
          }`}
        >
          {reader.label || 'Stripe Reader'}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isExpanded && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Device</p>
              <p className="text-sm font-medium text-gray-900">
                {reader.device_type === 'stripe_s700' ? 'Stripe S700' : reader.device_type}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Serial Number</p>
              <p className="text-sm font-mono text-gray-900">{reader.serial_number}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p
                className={`text-sm font-medium ${
                  reader.status === 'online' ? 'text-green-600' : 'text-yellow-600'
                }`}
              >
                {reader.status === 'online' ? 'Online & Ready' : 'Offline'}
              </p>
            </div>
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={fetchReaderStatus}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
