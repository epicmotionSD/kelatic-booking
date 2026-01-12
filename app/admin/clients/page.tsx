'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/currency';
import { UserCheck, Plus, Upload, Search, Users, Calendar, DollarSign, Eye } from 'lucide-react';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  created_at: string;
  last_visit_at: string | null;
  total_spent: number;
  visit_count: number;
  hair_type?: string;
  texture?: string;
  allergies?: string[];
  notes?: string;
  // New fields
  preferred_contact?: 'sms' | 'email' | 'both';
  sms_opt_in?: boolean;
  marketing_opt_in?: boolean;
  birthday?: string;
  zip_code?: string;
  preferred_stylist_id?: string;
  preferred_times?: string[];
  referral_source?: string;
  ai_notes?: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'recent' | 'spent'>('recent');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    try {
      const res = await fetch('/api/admin/clients');
      const data = await res.json();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter((line) => line.trim());
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

      const clients = lines.slice(1).map((line) => {
        const values = parseCSVLine(line);
        const client: Record<string, string | null> = {};
        headers.forEach((header, index) => {
          const value = values[index]?.trim() || null;
          if (header === 'email') client.email = value;
          else if (header === 'phone') client.phone = value;
          else if (header === 'first name' || header === 'first_name') client.first_name = value || '';
          else if (header === 'last name' || header === 'last_name') client.last_name = value || '';
          else if (header === 'country') client.country = value || 'US';
          else if (header === 'zip' || header === 'zip_code') client.zip_code = value;
        });
        return client;
      });

      const res = await fetch('/api/admin/clients/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clients }),
      });

      const result = await res.json();
      setImportResult(result);
      fetchClients(); // Refresh the list
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({ imported: 0, skipped: 0, errors: ['Failed to parse file'] });
    } finally {
      setImporting(false);
    }
  }

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  // Filter and sort clients
  const filteredClients = clients
    .filter((client) => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        client.first_name.toLowerCase().includes(searchLower) ||
        client.last_name.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower) ||
        client.phone?.includes(search)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.first_name} ${a.last_name}`.localeCompare(
            `${b.first_name} ${b.last_name}`
          );
        case 'spent':
          return b.total_spent - a.total_spent;
        case 'recent':
        default:
          return (
            new Date(b.last_visit_at || 0).getTime() -
            new Date(a.last_visit_at || 0).getTime()
          );
      }
    });

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-stone-900 flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-amber-600" />
            Clients
          </h1>
          <p className="text-stone-600">{clients.length} total clients</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-white border border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 transition-colors flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Import
          </button>
          <Link
            href="/admin/clients/new"
            className="px-4 py-2 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Client
          </Link>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-amber-200 shadow-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or phone..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2 bg-white border border-stone-300 rounded-xl text-stone-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          >
            <option value="recent">Most Recent Visit</option>
            <option value="name">Name (A-Z)</option>
            <option value="spent">Highest Spending</option>
          </select>
        </div>
      </div>

      {/* Clients List */}
      <div className="bg-white rounded-xl border border-amber-200 shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-amber-300 mb-4" />
            <p className="text-white/50">
              {search ? 'No clients match your search' : 'No clients yet'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">
                    Visits
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">
                    Last Visit
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-white/50 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-amber-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <span className="text-amber-700 font-medium">
                            {client.first_name[0]}
                            {client.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-stone-900">
                            {client.first_name} {client.last_name}
                          </p>
                          {client.hair_type && (
                            <p className="text-xs text-stone-600">
                              {client.hair_type}
                              {client.texture && ` • ${client.texture}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-stone-900">{client.email}</p>
                      <p className="text-sm text-stone-600">{client.phone}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-stone-900 flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        {client.visit_count}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-amber-600 flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {formatCurrency(client.total_spent * 100)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-stone-600">
                        {formatDate(client.last_visit_at)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedClient(client)}
                          className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <Link
                          href={`/admin/appointments/new?client=${client.id}`}
                          className="text-stone-600 hover:text-stone-900 text-sm font-medium flex items-center gap-1"
                        >
                          <Calendar className="w-4 h-4" />
                          Book
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Client Detail Modal */}
      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-amber-200 rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-playfair font-semibold text-stone-900">Import Clients</h2>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                }}
                className="text-white/40 hover:text-white"
                title="Close"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!importResult ? (
              <>
                <p className="text-sm text-white/60 mb-4">
                  Upload a CSV file with columns: Email, Phone, First Name, Last Name, Country, Zip
                </p>

                <label className="block">
                  <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-amber-400/50 transition-colors cursor-pointer">
                    {importing ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
                        <p className="text-white/60">Importing...</p>
                      </div>
                    ) : (
                      <>
                        <svg className="w-10 h-10 mx-auto text-white/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-white font-medium">Click to upload CSV</p>
                        <p className="text-sm text-white/40 mt-1">or drag and drop</p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileImport}
                    className="hidden"
                    disabled={importing}
                  />
                </label>

                <div className="mt-4 p-3 bg-amber-400/10 border border-amber-400/30 rounded-xl">
                  <p className="text-sm text-amber-200">
                    <strong>Tip:</strong> Existing clients (matched by email or phone) will be skipped.
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">{importResult.imported}</p>
                    <p className="text-sm text-green-400/70">Imported</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                    <p className="text-2xl font-bold text-white">{importResult.skipped}</p>
                    <p className="text-sm text-white/50">Skipped</p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                    <p className="text-sm font-medium text-red-400 mb-1">Errors:</p>
                    <ul className="text-sm text-red-400/70 list-disc list-inside max-h-32 overflow-y-auto">
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li>...and {importResult.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportResult(null);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface ClientDetailModalProps {
  client: Client;
  onClose: () => void;
}

function ClientDetailModal({ client, onClose }: ClientDetailModalProps) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientHistory();
  }, [client.id]);

  async function fetchClientHistory() {
    try {
      const res = await fetch(`/api/admin/clients/${client.id}/history`);
      const data = await res.json();
      setAppointments(data.appointments || []);
    } catch (error) {
      console.error('Failed to fetch client history:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-400/10 rounded-full flex items-center justify-center">
              <span className="text-amber-400 font-semibold text-lg">
                {client.first_name[0]}
                {client.last_name[0]}
              </span>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {client.first_name} {client.last_name}
              </h2>
              <p className="text-sm text-white/50">{client.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <p className="text-2xl font-bold text-white">
                {client.visit_count}
              </p>
              <p className="text-sm text-white/50">Total Visits</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <p className="text-2xl font-bold text-amber-400">
                {formatCurrency(client.total_spent * 100)}
              </p>
              <p className="text-sm text-white/50">Total Spent</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
              <p className="text-2xl font-bold text-white">
                {client.visit_count > 0
                  ? formatCurrency((client.total_spent / client.visit_count) * 100)
                  : '$0'}
              </p>
              <p className="text-sm text-white/50">Avg. per Visit</p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mb-6">
            <h3 className="font-medium text-white mb-2">Contact</h3>
            <div className="space-y-1 text-sm">
              <p className="text-white/60">{client.phone}</p>
              <p className="text-white/60">{client.email}</p>
            </div>
          </div>

          {/* Hair Profile */}
          {(client.hair_type || client.texture || client.allergies?.length) && (
            <div className="mb-6">
              <h3 className="font-medium text-white mb-2">Hair Profile</h3>
              <div className="space-y-1 text-sm">
                {client.hair_type && (
                  <p className="text-white/60">Type: {client.hair_type}</p>
                )}
                {client.texture && (
                  <p className="text-white/60">Texture: {client.texture}</p>
                )}
                {client.allergies?.length && (
                  <p className="text-red-400">
                    Allergies: {client.allergies.join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Visit History */}
          <div>
            <h3 className="font-medium text-white mb-2">Recent Visits</h3>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-400" />
              </div>
            ) : appointments.length === 0 ? (
              <p className="text-sm text-white/50">No visit history</p>
            ) : (
              <div className="space-y-2">
                {appointments.slice(0, 5).map((apt) => (
                  <div
                    key={apt.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10"
                  >
                    <div>
                      <p className="font-medium text-white">
                        {apt.service_name}
                      </p>
                      <p className="text-sm text-white/50">
                        {new Date(apt.start_time).toLocaleDateString()} •{' '}
                        {apt.stylist_name}
                      </p>
                    </div>
                    <p className="font-medium text-amber-400">
                      {formatCurrency(apt.total_paid * 100)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
            <Link
              href={`/admin/appointments/new?client=${client.id}`}
              className="flex-1 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-center rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
            >
              Book Appointment
            </Link>
            <Link
              href={`/admin/clients/${client.id}`}
              className="flex-1 py-2 bg-white/5 border border-white/10 text-white text-center rounded-xl hover:bg-white/10 transition-colors"
            >
              Edit Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
