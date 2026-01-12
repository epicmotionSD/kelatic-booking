'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  Search,
  Calendar,
  Star,
  Instagram,
  Mail,
  Phone,
  Edit2,
  X,
  Check,
} from 'lucide-react';

interface TeamMember {
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
  appointment_count?: number;
  service_count?: number;
}

const SPECIALTIES = [
  'Locs',
  'Braids',
  'Natural Hair',
  'Silk Press',
  'Color',
  'Treatments',
  'Extensions',
  'Cuts',
];

export default function TeamPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    specialties: [] as string[],
    instagram_handle: '',
    commission_rate: 50,
    is_active: true,
  });

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/admin/team');
      if (res.ok) {
        const data = await res.json();
        setTeam(data);
      }
    } catch (error) {
      console.error('Failed to fetch team:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (member?: TeamMember) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email,
        phone: member.phone || '',
        bio: member.bio || '',
        specialties: member.specialties || [],
        instagram_handle: member.instagram_handle || '',
        commission_rate: member.commission_rate || 50,
        is_active: member.is_active,
      });
    } else {
      setEditingMember(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        bio: '',
        specialties: [],
        instagram_handle: '',
        commission_rate: 50,
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMember(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingMember
        ? `/api/admin/team/${editingMember.id}`
        : '/api/admin/team';
      const method = editingMember ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        closeModal();
        fetchTeam();
      }
    } catch (error) {
      console.error('Failed to save team member:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const filteredTeam = team.filter(member => {
    const name = `${member.first_name} ${member.last_name}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-white/60">Manage your stylists and their schedules</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-lg font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Team Member
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          placeholder="Search team members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
        />
      </div>

      {/* Team Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
        </div>
      ) : filteredTeam.length === 0 ? (
        <div className="bg-zinc-900 rounded-xl border border-white/10 p-12 text-center">
          <Users className="w-12 h-12 text-white/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No team members found</h3>
          <p className="text-white/50 mb-4">
            {searchQuery ? 'Try a different search term' : 'Add your first team member to get started'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => openModal()}
              className="text-amber-400 hover:text-amber-300 font-medium"
            >
              + Add Team Member
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeam.map((member) => (
            <div
              key={member.id}
              className={`bg-zinc-900 rounded-xl border border-white/10 p-6 ${
                !member.is_active ? 'opacity-60' : ''
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center text-black font-bold text-lg">
                    {member.first_name.charAt(0)}{member.last_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">
                      {member.first_name} {member.last_name}
                    </h3>
                    {member.instagram_handle && (
                      <a
                        href={`https://instagram.com/${member.instagram_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-white/50 hover:text-amber-400"
                      >
                        <Instagram className="w-3 h-3" />
                        @{member.instagram_handle}
                      </a>
                    )}
                  </div>
                </div>
                {!member.is_active && (
                  <span className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-full">
                    Inactive
                  </span>
                )}
              </div>

              {/* Bio */}
              {member.bio && (
                <p className="text-sm text-white/60 mb-4 line-clamp-2">{member.bio}</p>
              )}

              {/* Specialties */}
              {member.specialties && member.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {member.specialties.slice(0, 3).map((specialty) => (
                    <span
                      key={specialty}
                      className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                  {member.specialties.length > 3 && (
                    <span className="px-2 py-1 bg-white/10 text-white/60 text-xs rounded-full">
                      +{member.specialties.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-white/50 mb-4 pb-4 border-b border-white/10">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{member.appointment_count || 0} appts</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  <span>{member.service_count || 0} services</span>
                </div>
                {member.commission_rate && (
                  <div className="text-amber-400 font-medium">
                    {member.commission_rate}%
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openModal(member)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-white/10 text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <Link
                  href={`/admin/team/${member.id}/schedule`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/20 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-zinc-900">
              <h2 className="text-lg font-semibold text-white">
                {editingMember ? 'Edit Team Member' : 'Add Team Member'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white/40" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-zinc-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Contact */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="w-full pl-10 pr-3 py-2 bg-zinc-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full pl-10 pr-3 py-2 bg-zinc-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 resize-none placeholder-white/40"
                  placeholder="A brief description of this stylist..."
                />
              </div>

              {/* Specialties */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Specialties
                </label>
                <div className="flex flex-wrap gap-2">
                  {SPECIALTIES.map((specialty) => (
                    <button
                      key={specialty}
                      type="button"
                      onClick={() => toggleSpecialty(specialty)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        formData.specialties.includes(specialty)
                          ? 'bg-amber-500 text-black'
                          : 'bg-white/10 text-white/70 hover:bg-white/20'
                      }`}
                    >
                      {specialty}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instagram */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Instagram Handle
                </label>
                <div className="relative">
                  <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={formData.instagram_handle}
                    onChange={(e) => setFormData(prev => ({ ...prev, instagram_handle: e.target.value.replace('@', '') }))}
                    placeholder="username"
                    className="w-full pl-10 pr-3 py-2 bg-zinc-800 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Commission Rate */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Commission Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-zinc-800 border border-white/20 rounded-lg text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-white">Active</div>
                  <div className="text-sm text-white/50">Allow this stylist to receive bookings</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    formData.is_active ? 'bg-amber-500' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      formData.is_active ? 'left-7' : 'left-1'
                    }`}
                  ></div>
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-white/10 text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-lg font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editingMember ? 'Save Changes' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
