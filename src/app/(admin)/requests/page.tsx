'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import Modal from '@/components/Modal';
import { Plus, Search } from 'lucide-react';

const statusBadge: Record<string, string> = {
  new: 'badge badge-blue',
  assessed: 'badge badge-yellow',
  converted: 'badge badge-green',
  archived: 'badge badge-gray',
};

export default function RequestsPage() {
  const router = useRouter();
  const { requests, clients, getClientName, addRequest, generateId } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state
  const [clientId, setClientId] = useState('');
  const [serviceDetails, setServiceDetails] = useState('');
  const [preferredDate1, setPreferredDate1] = useState('');
  const [preferredDate2, setPreferredDate2] = useState('');
  const [preferredTime, setPreferredTime] = useState<'any' | 'morning' | 'afternoon'>('any');

  const filtered = requests.filter(r => {
    const clientName = getClientName(r.clientId).toLowerCase();
    const matchesSearch =
      clientName.includes(search.toLowerCase()) ||
      r.serviceDetails.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const resetForm = () => {
    setClientId('');
    setServiceDetails('');
    setPreferredDate1('');
    setPreferredDate2('');
    setPreferredTime('any');
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    addRequest({
      id: generateId('r'),
      clientId,
      status: 'new',
      serviceDetails,
      preferredDate1,
      preferredDate2: preferredDate2 || undefined,
      preferredTime,
      createdAt: today,
    });
    resetForm();
    setShowCreateModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Requests</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} />
          New Request
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search requests..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="assessed">Assessed</option>
            <option value="converted">Converted</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0">
        <table className="data-table">
          <thead>
            <tr>
              <th>Client Name</th>
              <th>Service Details</th>
              <th>Preferred Date</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-8">
                  No requests found.
                </td>
              </tr>
            ) : (
              filtered.map(req => (
                <tr
                  key={req.id}
                  onClick={() => router.push(`/requests/${req.id}`)}
                >
                  <td className="font-medium">{getClientName(req.clientId)}</td>
                  <td className="text-gray-600 max-w-xs truncate">
                    {req.serviceDetails.length > 60
                      ? req.serviceDetails.slice(0, 60) + '...'
                      : req.serviceDetails}
                  </td>
                  <td>{req.preferredDate1}</td>
                  <td>
                    <span className={statusBadge[req.status]}>{req.status}</span>
                  </td>
                  <td className="text-gray-500">{req.createdAt}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Request">
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select required value={clientId} onChange={e => setClientId(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="">Select a client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}{c.companyName ? ` (${c.companyName})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Details *</label>
            <textarea required value={serviceDetails} onChange={e => setServiceDetails(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date *</label>
              <input type="date" required value={preferredDate1} onChange={e => setPreferredDate1(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Date</label>
              <input type="date" value={preferredDate2} onChange={e => setPreferredDate2(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Time</label>
            <select value={preferredTime} onChange={e => setPreferredTime(e.target.value as 'any' | 'morning' | 'afternoon')} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option value="any">Any time</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary">Create Request</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
