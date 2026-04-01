'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import Modal from '@/components/Modal';
import { Package, Plus, Pencil, Trash2, Search, ChevronDown, ChevronRight } from 'lucide-react';
import type { Product } from '@/lib/types';

export default function ProductsPage() {
  const { products, addProduct, updateProduct, deleteProduct, generateId } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [category, setCategory] = useState('');
  const [active, setActive] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setUnitPrice('');
    setCategory('');
    setActive(true);
    setEditingProduct(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description);
    setUnitPrice(product.unitPrice.toString());
    setCategory(product.category || '');
    setActive(product.active);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(unitPrice);
    if (isNaN(price)) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name,
        description,
        unitPrice: price,
        category: category || undefined,
        active,
      });
    } else {
      addProduct({
        id: generateId('prod'),
        name,
        description,
        unitPrice: price,
        category: category || undefined,
        active,
      });
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product/service?')) {
      deleteProduct(id);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);

  const truncate = (text: string, maxLen: number) =>
    text.length > maxLen ? text.slice(0, maxLen) + '...' : text;

  const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent';

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Package size={24} className="text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Products &amp; Services</h1>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} />
          New Product
        </button>
      </div>

      <div className="card">
        <div className="mb-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name, description, or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Unit Price</th>
              <th>Category</th>
              <th>Status</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(product => (
              <tr key={product.id}>
                <td className="font-medium text-gray-900">
                  <div className="flex items-start gap-1.5">
                    {product.description ? (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleExpand(product.id); }}
                        className="mt-0.5 text-gray-400 hover:text-gray-600 shrink-0"
                      >
                        {expandedIds.has(product.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    ) : (
                      <span className="w-[14px] shrink-0" />
                    )}
                    <div>
                      <span>{product.name}</span>
                      {expandedIds.has(product.id) && product.description && (
                        <p className="text-xs text-gray-500 font-normal mt-1 whitespace-pre-wrap leading-relaxed">{product.description}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="text-gray-900 font-medium">{formatPrice(product.unitPrice)}</td>
                <td className="text-gray-600">{product.category || '—'}</td>
                <td>
                  <span className={`badge ${product.active ? 'badge-green' : 'badge-gray'}`}>
                    {product.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="text-right">
                  <button
                    type="button"
                    onClick={() => openEditModal(product)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-colors mr-1"
                  >
                    <Pencil size={12} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(product.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-colors"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-8">
                  {search ? (
                    <>No products found matching &quot;{search}&quot;</>
                  ) : (
                    <>No products or services yet. Click &quot;New Product&quot; to add one.</>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={closeModal} title={editingProduct ? 'Edit Product' : 'New Product'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Power-washing"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the product or service..."
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={e => setUnitPrice(e.target.value)}
                  placeholder="0.00"
                  className={`${inputClass} pl-7`}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={category}
                onChange={e => setCategory(e.target.value)}
                placeholder="e.g. Cleaning, Landscaping"
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={e => setActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
            </label>
            <span className="text-sm text-gray-700">Active</span>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={closeModal} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary">
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
