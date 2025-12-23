'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/currency';
import type { Service, ServiceCategory } from '@/types/database';

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  locs: 'Locs',
  braids: 'Braids',
  natural: 'Natural Hair',
  silk_press: 'Silk Press',
  color: 'Color',
  treatments: 'Treatments',
  other: 'Other',
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
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
          <h1 className="text-2xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-500">Manage your service menu and pricing</p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 w-fit"
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
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeCategory === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({services.length})
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeCategory === category
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {CATEGORY_LABELS[category]} ({categoryCounts[category]})
          </button>
        ))}
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <svg
            className="w-12 h-12 mx-auto text-gray-300 mb-4"
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
          <p className="text-gray-500 mb-4">No services found</p>
          <button
            onClick={() => openModal()}
            className="text-purple-600 hover:text-purple-700"
          >
            Create your first service →
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-xl border border-gray-200 p-6 ${
                !service.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                    {CATEGORY_LABELS[service.category]}
                  </span>
                  <h3 className="font-semibold text-gray-900 mt-1">
                    {service.name}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {!service.is_active && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                      Inactive
                    </span>
                  )}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        const menu = e.currentTarget.nextElementSibling;
                        menu?.classList.toggle('hidden');
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    <div className="hidden absolute right-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                      <button
                        onClick={() => openModal(service)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleActive(service)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {service.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {service.description && (
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {service.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{service.duration} min</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(service.base_price * 100)}
                </span>
              </div>

              {service.deposit_required && (
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                  <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                    ${service.deposit_amount} deposit
                  </span>
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {service ? 'Edit Service' : 'Add Service'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Service Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ServiceCategory })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes)
              </label>
              <input
                type="number"
                min="15"
                step="15"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="deposit_required" className="text-sm text-gray-700">
              Require deposit for booking
            </label>
          </div>

          {formData.deposit_required && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deposit Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.deposit_amount}
                onChange={(e) => setFormData({ ...formData, deposit_amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required={formData.deposit_required}
              />
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
