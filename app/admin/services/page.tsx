'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/currency';
import type { Service, ServiceCategory, Profile } from '@/types/database';

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  locs: 'Locs',
  braids: 'Braids',
  natural: 'Natural Hair',
  silk_press: 'Silk Press',
  color: 'Color',
  treatments: 'Treatments',
  barber: 'Barber',
  other: 'Other',
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceStylistCounts, setServiceStylistCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'all'>('all');

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      const res = await fetch('/api/admin/services');
      const data = await res.json();
      setServices(data.services || []);
      
      // Fetch stylist counts for each service
      const counts: Record<string, number> = {};
      for (const service of data.services || []) {
        try {
          const stylistRes = await fetch(`/api/admin/services/${service.id}/stylists`);
          if (stylistRes.ok) {
            const stylistData = await stylistRes.json();
            counts[service.id] = (stylistData.stylistIds || []).length;
          }
        } catch (error) {
          console.error(`Failed to fetch stylists for service ${service.id}:`, error);
          counts[service.id] = 0;
        }
      }
      setServiceStylistCounts(counts);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  }

  function openModal(service?: Service) {
    setEditingService(service || null);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingService(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
      fetchServices();
    } catch (error) {
      console.error('Failed to delete service:', error);
    }
  }

  async function handleToggleActive(service: Service) {
    try {
      await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !service.is_active }),
      });
      fetchServices();
    } catch (error) {
      console.error('Failed to toggle service:', error);
    }
  }

  // Group and filter services
  const filteredServices =
    activeCategory === 'all'
      ? services
      : services.filter((s) => s.category === activeCategory);

  const categories = Object.keys(CATEGORY_LABELS) as ServiceCategory[];
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat] = services.filter((s) => s.category === cat).length;
    return acc;
  }, {} as Record<ServiceCategory, number>);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Services</h1>
          <p className="text-white/50">Manage your service menu and pricing</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all flex items-center gap-2 w-fit"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Service
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            activeCategory === 'all'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black'
              : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
          }`}
        >
          All ({services.length})
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeCategory === category
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black'
                : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
            }`}
          >
            {CATEGORY_LABELS[category]} ({categoryCounts[category]})
          </button>
        ))}
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-12 text-center">
          <svg
            className="w-12 h-12 mx-auto text-white/20 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <p className="text-white/50 mb-4">No services found</p>
          <button
            onClick={() => openModal()}
            className="text-amber-400 hover:text-amber-300"
          >
            Create your first service →
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`bg-white/5 backdrop-blur rounded-xl border border-white/10 p-6 ${
                !service.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-xs font-medium text-amber-400 uppercase tracking-wide">
                    {CATEGORY_LABELS[service.category]}
                  </span>
                  <h3 className="font-semibold text-white mt-1">
                    {service.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {!service.is_active && (
                    <span className="px-2 py-1 bg-white/10 text-white/50 text-xs rounded-full">
                      Inactive
                    </span>
                  )}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        const menu = e.currentTarget.nextElementSibling;
                        menu?.classList.toggle('hidden');
                      }}
                      className="p-1 text-white/40 hover:text-white"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    <div className="hidden absolute right-0 mt-1 w-36 bg-zinc-900 rounded-xl shadow-lg border border-white/10 py-1 z-10">
                      <button
                        onClick={() => openModal(service)}
                        className="w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(service)}
                        className="w-full text-left px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
                      >
                        {service.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-white/5"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {service.description && (
                <p className="text-sm text-white/50 mb-4 line-clamp-2">
                  {service.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">{service.duration} min</span>
                <span className="font-semibold text-amber-400">
                  {formatCurrency(service.base_price * 100)}
                </span>
              </div>

              {(service.deposit_required || serviceStylistCounts[service.id] > 0) && (
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
                  {service.deposit_required && (
                    <span className="px-2 py-1 bg-amber-400/10 text-amber-400 text-xs rounded-full">
                      ${service.deposit_amount} deposit
                    </span>
                  )}
                  {serviceStylistCounts[service.id] > 0 && (
                    <span className="px-2 py-1 bg-blue-400/10 text-blue-400 text-xs rounded-full flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {serviceStylistCounts[service.id]} stylist{serviceStylistCounts[service.id] !== 1 ? 's' : ''}
                    </span>
                  )}
                  {serviceStylistCounts[service.id] === 0 && (
                    <span className="px-2 py-1 bg-orange-400/10 text-orange-400 text-xs rounded-full">
                      No stylists assigned
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Service Modal */}
      {isModalOpen && (
        <ServiceModal
          service={editingService}
          onClose={closeModal}
          onSave={() => {
            closeModal();
            fetchServices();
          }}
        />
      )}
    </div>
  );
}

interface ServiceModalProps {
  service: Service | null;
  onClose: () => void;
  onSave: () => void;
}

function ServiceModal({ service, onClose, onSave }: ServiceModalProps) {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    category: service?.category || 'other',
    base_price: service?.base_price?.toString() || '',
    duration: service?.duration?.toString() || '60',
    deposit_required: service?.deposit_required || false,
    deposit_amount: service?.deposit_amount?.toString() || '',
  });
  const [stylists, setStylists] = useState<Profile[]>([]);
  const [selectedStylists, setSelectedStylists] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch stylists and current assignments when modal opens
  useEffect(() => {
    async function fetchStylists() {
      try {
        const res = await fetch('/api/admin/stylists');
        const data = await res.json();
        const stylistProfiles = (data.stylists || []).filter((s: Profile) => s.role === 'stylist');
        setStylists(stylistProfiles);

        // If editing a service, fetch current stylist assignments
        if (service) {
          const assignRes = await fetch(`/api/admin/services/${service.id}/stylists`);
          if (assignRes.ok) {
            const assignData = await assignRes.json();
            setSelectedStylists(assignData.stylistIds || []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch stylists:', error);
      }
    }
    
    fetchStylists();
  }, [service]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name,
        description: formData.description || null,
        category: formData.category,
        base_price: parseFloat(formData.base_price),
        duration: parseInt(formData.duration),
        deposit_required: formData.deposit_required,
        deposit_amount: formData.deposit_required
          ? parseFloat(formData.deposit_amount)
          : null,
        stylistIds: selectedStylists, // Include stylist assignments
      };

      const res = await fetch(
        service
          ? `/api/admin/services/${service.id}`
          : '/api/admin/services',
        {
          method: service ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save service');
      }

      onSave();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleStylist(stylistId: string) {
    setSelectedStylists(prev =>
      prev.includes(stylistId)
        ? prev.filter(id => id !== stylistId)
        : [...prev, stylistId]
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {service ? 'Edit Service' : 'Add Service'}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Service Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ServiceCategory })}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="15"
                step="15"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="deposit_required"
              checked={formData.deposit_required}
              onChange={(e) =>
                setFormData({ ...formData, deposit_required: e.target.checked })
              }
              className="w-4 h-4 rounded border-white/30 bg-transparent text-amber-400 focus:ring-amber-400/50"
            />
            <label htmlFor="deposit_required" className="text-sm text-white/70">
              Require deposit for booking
            </label>
          </div>

          {formData.deposit_required && (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">
                Deposit Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.deposit_amount}
                onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-amber-400/50 focus:ring-1 focus:ring-amber-400/50"
                required={formData.deposit_required}
              />
            </div>
          )}

          {/* Stylist Assignment */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-3">
              Assign Locticians/Stylists
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {stylists.length > 0 ? (
                stylists.map((stylist) => (
                  <label
                    key={stylist.id}
                    className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStylists.includes(stylist.id)}
                      onChange={() => toggleStylist(stylist.id)}
                      className="w-4 h-4 rounded border-white/30 bg-transparent text-amber-400 focus:ring-amber-400/50"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {stylist.first_name} {stylist.last_name}
                      </p>
                      {stylist.specialties && stylist.specialties.length > 0 && (
                        <p className="text-xs text-amber-400">
                          {stylist.specialties.slice(0, 2).join(', ')}
                        </p>
                      )}
                    </div>
                  </label>
                ))
              ) : (
                <p className="text-white/40 text-sm text-center py-4">No stylists found</p>
              )}
            </div>
            <p className="text-xs text-white/40 mt-2">
              Select which locticians/stylists can perform this service
            </p>
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
              className="flex-1 py-2 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-xl font-semibold hover:shadow-lg hover:shadow-amber-500/30 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
