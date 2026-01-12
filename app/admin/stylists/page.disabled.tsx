'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Plus, Mail, Phone, Instagram, Star, Edit, Trash2, MapPin, X } from 'lucide-react';

interface Stylist {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  specialties?: string[];
  instagram_handle?: string;
  commission_rate?: number;
  is_active: boolean;
  services_count: number;
  appointments_this_week: number;
}

export default function StylistsPage() {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStylist, setEditingStylist] = useState<Stylist | null>(null);
  const [inviting, setInviting] = useState<string | null>(null);
  const [inviteMessage, setInviteMessage] = useState<{ id: string; message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchStylists();
  }, []);

  async function fetchStylists() {
    try {
      const res = await fetch('/api/admin/stylists');
      const data = await res.json();
      setStylists(data.stylists || []);
    } catch (error) {
      console.error('Failed to fetch stylists:', error);
    } finally {
      setLoading(false);
    }
  }

  function openModal(stylist?: Stylist) {
    setEditingStylist(stylist || null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingStylist(null);
  }

  async function handleToggleActive(stylist: Stylist) {
    try {
      await fetch(`/api/admin/stylists/${stylist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !stylist.is_active }),
      });
      fetchStylists();
    } catch (error) {
      console.error('Failed to toggle stylist:', error);
    }
  }

  async function handleInvite(stylist: Stylist) {
    setInviting(stylist.id);
    setInviteMessage(null);
    try {
      const res = await fetch('/api/admin/stylists/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stylist_id: stylist.id, email: stylist.email }),
      });
      const data = await res.json();

      if (res.ok) {
        setInviteMessage({
          id: stylist.id,
          message: data.message || 'Invite sent!',
          type: 'success',
        });
      } else {
        setInviteMessage({
          id: stylist.id,
          message: data.error || 'Failed to send invite',
          type: 'error',
        });
      }
    } catch (error) {
      setInviteMessage({
        id: stylist.id,
        message: 'Failed to send invite',
        type: 'error',
      });
    } finally {
      setInviting(null);
      // Clear message after 5 seconds
      setTimeout(() => setInviteMessage(null), 5000);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-stone-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-amber-600" />
            Divine Stylists
          </h1>
          <p className="text-stone-600">Manage your talented team</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-6 py-3 bg-amber-500 text-stone-900 rounded-xl font-semibold hover:bg-amber-600 transition-all flex items-center gap-2 w-fit shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Add Stylist
        </button>
      </div>

      {/* Stylists Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
        </div>
      ) : stylists.length === 0 ? (
        <div className="bg-white rounded-xl border border-amber-200 shadow-lg p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-stone-300 mb-4" />
          <p className="text-stone-600 mb-4">No stylists yet</p>
          <button
            onClick={() => openModal()}
            className="text-amber-600 hover:text-amber-700"
          >
            Add your first stylist →
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stylists.map((stylist) => (
            <div
              key={stylist.id}
              className={`bg-white rounded-xl border border-amber-200 shadow-lg overflow-hidden ${
                !stylist.is_active ? 'opacity-60' : ''
              }`}
            >
              {/* Header */}
              <div className="p-6 border-b border-stone-200">
                <div className="flex items-start gap-4">
                  {stylist.avatar_url ? (
                    <img
                      src={stylist.avatar_url}
                      alt={stylist.first_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-amber-400/10 rounded-full flex items-center justify-center">
                      <span className="text-amber-600 font-semibold text-xl">
                        {stylist.first_name[0]}
                        {stylist.last_name[0]}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-stone-900">
                        {stylist.first_name} {stylist.last_name}
                      </h3>
                      {!stylist.is_active && (
                        <span className="px-2 py-1 bg-white/10 text-stone-600 text-xs rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    {stylist.instagram_handle && (
                      <p className="text-sm text-amber-600">
                        @{stylist.instagram_handle}
                      </p>
                    )}
                    {stylist.specialties && stylist.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {stylist.specialties.slice(0, 3).map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 bg-white/10 text-stone-900/60 text-xs rounded"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 divide-x divide-white/10 border-b border-stone-200">
                <div className="p-4 text-center">
                  <p className="text-2xl font-bold text-stone-900">
                    {stylist.services_count}
                  </p>
                  <p className="text-xs text-stone-600">Services</p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-2xl font-bold text-stone-900">
                    {stylist.appointments_this_week}
                  </p>
                  <p className="text-xs text-stone-600">This Week</p>
                </div>
              </div>

              {/* Invite Message */}
              {inviteMessage?.id === stylist.id && (
                <div
                  className={`mx-4 mb-2 px-3 py-2 rounded-xl text-sm ${
                    inviteMessage.type === 'success'
                      ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                      : 'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}
                >
                  {inviteMessage.message}
                </div>
              )}

              {/* Actions */}
              <div className="p-4 flex flex-wrap gap-2">
                <button
                  onClick={() => openModal(stylist)}
                  className="flex-1 py-2 bg-white/5 text-stone-900 rounded-xl hover:bg-amber-50 transition-colors text-sm border border-stone-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleInvite(stylist)}
                  disabled={inviting === stylist.id}
                  className="flex-1 py-2 bg-amber-500/10 text-amber-600 rounded-xl hover:bg-amber-500/20 transition-colors text-sm border border-amber-500/30 disabled:opacity-50"
                >
                  {inviting === stylist.id ? 'Sending...' : 'Invite'}
                </button>
                <button
                  onClick={() => handleToggleActive(stylist)}
                  className={`px-3 py-2 rounded-xl text-sm transition-colors ${
                    stylist.is_active
                      ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                      : 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30'
                  }`}
                >
                  {stylist.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stylist Modal */}
      {isModalOpen && (
        <StylistModal
          stylist={editingStylist}
          onClose={closeModal}
          onSave={() => {
            closeModal();
            fetchStylists();
          }}
        />
      )}
    </div>
  );
}

interface StylistModalProps {
  stylist: Stylist | null;
  onClose: () => void;
  onSave: () => void;
}

function StylistModal({ stylist, onClose, onSave }: StylistModalProps) {
  const [formData, setFormData] = useState({
    first_name: stylist?.first_name || '',
    last_name: stylist?.last_name || '',
    email: stylist?.email || '',
    phone: stylist?.phone || '',
    bio: stylist?.bio || '',
    instagram_handle: stylist?.instagram_handle || '',
    specialties: stylist?.specialties?.join(', ') || '',
    commission_rate: stylist?.commission_rate?.toString() || '50',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone || null,
        bio: formData.bio || null,
        instagram_handle: formData.instagram_handle || null,
        specialties: formData.specialties
          ? formData.specialties.split(',').map((s) => s.trim())
          : [],
        commission_rate: parseFloat(formData.commission_rate),
      };

      const res = await fetch(
        stylist ? `/api/admin/stylists/${stylist.id}` : '/api/admin/stylists',
        {
          method: stylist ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save stylist');
      }

      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-stone-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-stone-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">
            {stylist ? 'Edit Stylist' : 'Add Stylist'}
          </h2>
          <button onClick={onClose} className="text-stone-600 hover:text-stone-900">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-900/70 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-stone-900 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-900/70 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-stone-900 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-900/70 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-stone-900 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-900/70 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-stone-900 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-900/70 mb-1">
              Instagram Handle
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-900/40">
                @
              </span>
              <input
                type="text"
                value={formData.instagram_handle}
                onChange={(e) =>
                  setFormData({ ...formData, instagram_handle: e.target.value })
                }
                className="w-full pl-8 pr-4 py-2 bg-white/5 border border-white/20 rounded-xl text-stone-900 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
                placeholder="username"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-900/70 mb-1">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-stone-900 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
              placeholder="Brief description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-900/70 mb-1">
              Specialties
            </label>
            <input
              type="text"
              value={formData.specialties}
              onChange={(e) =>
                setFormData({ ...formData, specialties: e.target.value })
              }
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-stone-900 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
              placeholder="Locs, Braids, Color (comma-separated)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-900/70 mb-1">
              Commission Rate (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.commission_rate}
              onChange={(e) =>
                setFormData({ ...formData, commission_rate: e.target.value })
              }
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-stone-900 focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-white/5 border border-stone-200 text-stone-900 rounded-xl hover:bg-amber-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-amber-500 text-white hover:bg-amber-600 rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Stylist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
