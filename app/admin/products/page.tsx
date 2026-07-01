'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/currency';
import {
  Package,
  Plus,
  Edit,
  Power,
  Star,
  X,
  Trash2,
  Tag,
} from 'lucide-react';
import type { Product, ProductCategory } from '@/types/commerce';

interface OptionDraft { name: string; price_delta: string; is_default: boolean }
interface GroupDraft { name: string; min_select: number; max_select: number; options: OptionDraft[] }

interface FormState {
  id?: string;
  name: string;
  category_id: string;
  description: string;
  image_url: string;
  price: string; // dollars
  tags: string; // comma separated
  is_featured: boolean;
  is_active: boolean;
  track_inventory: boolean;
  stock_quantity: string;
  option_groups: GroupDraft[];
}

const EMPTY_FORM: FormState = {
  name: '',
  category_id: '',
  description: '',
  image_url: '',
  price: '',
  tags: '',
  is_featured: false,
  is_active: true,
  track_inventory: false,
  stock_quantity: '',
  option_groups: [],
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [activeCat, setActiveCat] = useState<string>('all');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const [pRes, cRes] = await Promise.all([
        fetch('/api/admin/products'),
        fetch('/api/admin/products/categories'),
      ]);
      const pData = await pRes.json();
      const cData = await cRes.json();
      setProducts(pData.products || []);
      setCategories(cData.categories || []);
    } catch (e) {
      console.error('Failed to load products', e);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setForm({
      id: p.id,
      name: p.name,
      category_id: p.category_id || '',
      description: p.description || '',
      image_url: p.image_url || '',
      price: (p.price_cents / 100).toFixed(2),
      tags: (p.tags || []).join(', '),
      is_featured: p.is_featured,
      is_active: p.is_active,
      track_inventory: p.track_inventory,
      stock_quantity: p.stock_quantity != null ? String(p.stock_quantity) : '',
      option_groups: (p.option_groups || []).map((g) => ({
        name: g.name,
        min_select: g.min_select,
        max_select: g.max_select,
        options: (g.options || []).map((o) => ({
          name: o.name,
          price_delta: (o.price_delta_cents / 100).toFixed(2),
          is_default: o.is_default,
        })),
      })),
    });
    setModalOpen(true);
  }

  async function addCategory() {
    if (!newCategory.trim()) return;
    const res = await fetch('/api/admin/products/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCategory.trim() }),
    });
    if (res.ok) {
      const { category } = await res.json();
      setCategories((c) => [...c, category]);
      setForm((f) => ({ ...f, category_id: category.id }));
      setNewCategory('');
    }
  }

  async function save() {
    if (!form.name.trim() || !form.price) {
      alert('Name and price are required');
      return;
    }
    setSaving(true);
    try {
      const price_cents = Math.round(parseFloat(form.price) * 100);
      const payload = {
        name: form.name.trim(),
        category_id: form.category_id || null,
        description: form.description || null,
        image_url: form.image_url.trim() || null,
        price_cents,
        tags: form.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        is_featured: form.is_featured,
        is_active: form.is_active,
        track_inventory: form.track_inventory,
        stock_quantity: form.track_inventory ? parseInt(form.stock_quantity || '0', 10) : null,
        option_groups: form.option_groups
          .filter((g) => g.name.trim())
          .map((g) => ({
            name: g.name.trim(),
            min_select: g.min_select,
            max_select: g.max_select,
            options: g.options
              .filter((o) => o.name.trim())
              .map((o) => ({
                name: o.name.trim(),
                price_delta_cents: Math.round(parseFloat(o.price_delta || '0') * 100),
                is_default: o.is_default,
              })),
          })),
      };

      const res = form.id
        ? await fetch(`/api/admin/products/${form.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to save product');
        return;
      }
      setModalOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: Product) {
    await fetch(`/api/admin/products/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !p.is_active }),
    });
    load();
  }

  async function remove(p: Product) {
    if (!confirm(`Remove "${p.name}"? It will be deactivated.`)) return;
    await fetch(`/api/admin/products/${p.id}`, { method: 'DELETE' });
    load();
  }

  function addGroup() {
    setForm((f) => ({
      ...f,
      option_groups: [...f.option_groups, { name: '', min_select: 0, max_select: 1, options: [] }],
    }));
  }
  function updateGroup(i: number, patch: Partial<GroupDraft>) {
    setForm((f) => {
      const g = [...f.option_groups];
      g[i] = { ...g[i], ...patch };
      return { ...f, option_groups: g };
    });
  }
  function removeGroup(i: number) {
    setForm((f) => ({ ...f, option_groups: f.option_groups.filter((_, idx) => idx !== i) }));
  }
  function addOption(gi: number) {
    setForm((f) => {
      const g = [...f.option_groups];
      g[gi] = { ...g[gi], options: [...g[gi].options, { name: '', price_delta: '0.00', is_default: false }] };
      return { ...f, option_groups: g };
    });
  }
  function updateOption(gi: number, oi: number, patch: Partial<OptionDraft>) {
    setForm((f) => {
      const g = [...f.option_groups];
      const opts = [...g[gi].options];
      opts[oi] = { ...opts[oi], ...patch };
      g[gi] = { ...g[gi], options: opts };
      return { ...f, option_groups: g };
    });
  }
  function removeOption(gi: number, oi: number) {
    setForm((f) => {
      const g = [...f.option_groups];
      g[gi] = { ...g[gi], options: g[gi].options.filter((_, idx) => idx !== oi) };
      return { ...f, option_groups: g };
    });
  }

  const catName = (id: string | null) =>
    categories.find((c) => c.id === id)?.name || 'Uncategorized';

  const filtered =
    activeCat === 'all' ? products : products.filter((p) => p.category_id === activeCat);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="w-6 h-6 text-[#00ffb2]" /> Products
          </h1>
          <p className="text-sm text-muted-foreground">Manage your menu items and pricing.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-[#00ffb2] hover:brightness-95 text-black px-4 py-2 rounded-lg text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> <span className="sm:hidden">New</span><span className="hidden sm:inline">New Product</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setActiveCat('all')}
          className={`px-3 py-1.5 rounded-full text-sm ${
            activeCat === 'all' ? 'bg-[#00ffb2] text-black' : 'bg-white/5 text-muted-foreground'
          }`}
        >
          All ({products.length})
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveCat(c.id)}
            className={`px-3 py-1.5 rounded-full text-sm ${
              activeCat === c.id ? 'bg-[#00ffb2] text-black' : 'bg-white/5 text-muted-foreground'
            }`}
          >
            {c.name} ({products.filter((p) => p.category_id === c.id).length})
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <Package className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
          <p className="text-muted-foreground">No products yet. Add your first menu item.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((p) => (
            <div
              key={p.id}
              className={`flex items-center justify-between bg-card border rounded-xl p-4 ${
                p.is_active ? 'border-border' : 'border-border opacity-60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {p.image_url && (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-12 h-12 rounded-lg object-cover border border-border shrink-0"
                  />
                )}
                <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground truncate">{p.name}</span>
                  {p.is_featured && <Star className="w-4 h-4 text-amber-500 fill-amber-400" />}
                  {!p.is_active && (
                    <span className="text-xs bg-white/5 text-muted-foreground px-2 py-0.5 rounded">Hidden</span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                  <span>{catName(p.category_id)}</span>
                  {p.track_inventory && (
                    <span className="text-xs text-muted-foreground">· {p.stock_quantity ?? 0} in stock</span>
                  )}
                  {p.tags?.length > 0 && (
                    <span className="text-xs text-[#00ffb2] flex items-center gap-1">
                      <Tag className="w-3 h-3" /> {p.tags.join(', ')}
                    </span>
                  )}
                </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-semibold text-foreground">{formatCurrency(p.price_cents)}</span>
                <button onClick={() => openEdit(p)} className="p-2 text-muted-foreground hover:text-[#00ffb2]" title="Edit">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => toggleActive(p)} className="p-2 text-muted-foreground hover:text-[#f59e0b]" title="Toggle visibility">
                  <Power className="w-4 h-4" />
                </button>
                <button onClick={() => remove(p)} className="p-2 text-muted-foreground hover:text-[#ef4444]" title="Remove">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 overflow-y-auto p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg my-8 shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{form.id ? 'Edit Product' : 'New Product'}</h2>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-1">Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm"
                  placeholder="Sea Moss Smoothie"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground/90 mb-1">Price (USD) *</label>
                  <input
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    inputMode="decimal"
                    className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm"
                    placeholder="9.50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/90 mb-1">Category</label>
                  <select
                    value={form.category_id}
                    onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                    className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm bg-card"
                  >
                    <option value="">Uncategorized</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="+ Add a new category"
                  className="flex-1 border border-border bg-background rounded-lg px-3 py-1.5 text-sm"
                />
                <button onClick={addCategory} className="text-sm text-[#00ffb2] font-medium px-3">
                  Add
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm"
                  placeholder="Blended sea moss, mango, pineapple…"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-1">
                  Image <span className="text-muted-foreground font-normal">(path or URL)</span>
                </label>
                <div className="flex items-start gap-3">
                  {form.image_url ? (
                    <img
                      src={form.image_url}
                      alt="Preview"
                      className="w-16 h-16 rounded-lg object-cover border border-border bg-background shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg border border-dashed border-border bg-background flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm"
                      placeholder="/vitality/products/hibiscus-lemonade.jpg"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Drop the file in <code className="text-[#00ffb2]">public/vitality/products/</code> and reference it as <code>/vitality/products/your-file.jpg</code>, or paste a full image URL.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-1">
                  Tags <span className="text-muted-foreground font-normal">(comma separated)</span>
                </label>
                <input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full border border-border bg-background rounded-lg px-3 py-2 text-sm"
                  placeholder="dairy-free, no-refined-sugar, vegan"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_featured}
                    onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                  />
                  Featured
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                  Active (visible)
                </label>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.track_inventory}
                    onChange={(e) => setForm({ ...form, track_inventory: e.target.checked })}
                  />
                  Track inventory
                </label>
                {form.track_inventory && (
                  <input
                    value={form.stock_quantity}
                    onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
                    inputMode="numeric"
                    placeholder="Qty"
                    className="w-24 border border-border bg-background rounded-lg px-3 py-1.5 text-sm"
                  />
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground/90">Modifiers (size, temp, add-ins)</span>
                  <button onClick={addGroup} className="text-sm text-[#00ffb2] font-medium">
                    + Group
                  </button>
                </div>
                {form.option_groups.map((g, gi) => (
                  <div key={gi} className="border border-border bg-background rounded-lg p-3 mb-2">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        value={g.name}
                        onChange={(e) => updateGroup(gi, { name: e.target.value })}
                        placeholder="Group name (e.g. Size)"
                        className="flex-1 border border-border bg-background rounded px-2 py-1 text-sm"
                      />
                      <button onClick={() => removeGroup(gi)} className="text-muted-foreground hover:text-[#ef4444]">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {g.options.map((o, oi) => (
                      <div key={oi} className="flex items-center gap-2 mb-1 pl-2">
                        <input
                          value={o.name}
                          onChange={(e) => updateOption(gi, oi, { name: e.target.value })}
                          placeholder="Option (e.g. Large)"
                          className="flex-1 border border-border bg-background rounded px-2 py-1 text-sm"
                        />
                        <span className="text-xs text-muted-foreground">+$</span>
                        <input
                          value={o.price_delta}
                          onChange={(e) => updateOption(gi, oi, { price_delta: e.target.value })}
                          inputMode="decimal"
                          className="w-16 border border-border bg-background rounded px-2 py-1 text-sm"
                        />
                        <button onClick={() => removeOption(gi, oi)} className="text-muted-foreground hover:text-[#ef4444]">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addOption(gi)} className="text-xs text-[#00ffb2] mt-1 pl-2">
                      + Option
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-5 border-t">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-muted-foreground">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="px-4 py-2 bg-[#00ffb2] hover:brightness-95 disabled:opacity-50 text-black rounded-lg text-sm font-medium"
              >
                {saving ? 'Saving…' : form.id ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
