'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { getTotal } from '@/lib/types';
import Link from 'next/link';
import { Plus, Layers, Trash2 } from 'lucide-react';
import Modal from '@/components/Modal';

const statusBadge = (status: string) => { switch (status) { case 'draft': return 'badge-gray'; case 'sent': return 'badge-yellow'; case 'paid': return 'badge-green'; case 'past-due': return 'badge-red'; default: return 'badge-gray'; } };
const statusLabel = (status: string) => { switch (status) { case 'sent': return 'Awaiting Payment'; case 'past-due': return 'Past Due'; default: return status.charAt(0).toUpperCase() + status.slice(1); } };
const formatCurrency = (n: number) => new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n);

export default function InvoicesPage() {
  const { invoices, clients, getClientName, getClient, addInvoice, nextInvoiceNumber, generateId } = useApp();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  // New invoice form state
  const [newClientId, setNewClientId] = useState('');
  const [newLineItems, setNewLineItems] = useState([{ id: '1', name: '', description: '', qty: 1, unitPrice: 0 }]);
  const [newDiscount, setNewDiscount] = useState(0);
  const [newTaxRate, setNewTaxRate] = useState(0.05);
  const [newDueDate, setNewDueDate] = useState('');

  const filtered = invoices.filter(inv => { if (!search) return true; const q = search.toLowerCase(); const clientName = getClientName(inv.clientId).toLowerCase(); return (clientName.includes(q) || inv.invoiceNumber.toString().includes(q) || inv.status.includes(q)); });
  const overdueCount = invoices.filter(i => i.status === 'past-due').length;
  const totals = invoices.map(i => getTotal(i.lineItems, i.discount, i.taxRate));
  const avgInvoice = totals.length > 0 ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
  const invoiceCount = invoices.length;

  const resetNewForm = () => {
    setNewClientId('');
    setNewLineItems([{ id: '1', name: '', description: '', qty: 1, unitPrice: 0 }]);
    setNewDiscount(0);
    setNewTaxRate(0.05);
    setNewDueDate('');
  };

  const addLineItem = () => {
    setNewLineItems(prev => [...prev, { id: String(Date.now()), name: '', description: '', qty: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (id: string) => {
    if (newLineItems.length <= 1) return;
    setNewLineItems(prev => prev.filter(li => li.id !== id));
  };

  const updateLineItem = (id: string, field: string, value: string | number) => {
    setNewLineItems(prev => prev.map(li => li.id === id ? { ...li, [field]: value } : li));
  };

  const handleCreateInvoice = () => {
    if (!newClientId || !newDueDate) return;
    const today = new Date().toISOString().split('T')[0];
    addInvoice({
      id: generateId('i'),
      invoiceNumber: nextInvoiceNumber(),
      clientId: newClientId,
      status: 'draft',
      lineItems: newLineItems.map(li => ({ id: generateId('il'), name: li.name, description: li.description, qty: li.qty, unitPrice: li.unitPrice })),
      discount: newDiscount,
      taxRate: newTaxRate,
      issuedAt: today,
      dueDate: newDueDate,
      amountPaid: 0,
    });
    setShowNewModal(false);
    resetNewForm();
  };

  return (<div className="max-w-7xl mx-auto">
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
      <div className="flex gap-2">
        <button className="btn btn-outline" onClick={() => alert('Batch operations coming soon')}><Layers size={16} />Batch</button>
        <button className="btn btn-primary" onClick={() => setShowNewModal(true)}><Plus size={16} />New Invoice</button>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="card"><div className="text-sm text-gray-500 mb-1">Overdue</div><div className="text-2xl font-bold text-red-600">{overdueCount}</div></div>
      <div className="card"><div className="text-sm text-gray-500 mb-1">Average Invoice</div><div className="text-2xl font-bold text-gray-900">{formatCurrency(avgInvoice)}</div></div>
      <div className="card"><div className="text-sm text-gray-500 mb-1">Invoice Count</div><div className="text-2xl font-bold text-gray-900">{invoiceCount}</div></div>
    </div>

    {/* Search Input */}
    <div className="mb-4">
      <input
        type="text"
        placeholder="Search by client, invoice #, or status..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
      />
    </div>

    <div className="card"><table className="data-table">
      <thead><tr><th>Invoice #</th><th>Client</th><th>Property Address</th><th>Invoice Date</th><th>Due Date</th><th>Total</th><th>Status</th></tr></thead>
      <tbody>
        {filtered.map(inv => { const client = getClient(inv.clientId); const total = getTotal(inv.lineItems, inv.discount, inv.taxRate); return (
          <tr key={inv.id} className="cursor-pointer" onClick={() => router.push(`/invoices/${inv.id}`)}>
            <td><Link href={`/invoices/${inv.id}`} className="font-medium text-gray-900 hover:text-green-600">{inv.invoiceNumber}</Link></td>
            <td className="text-gray-900">{getClientName(inv.clientId)}</td>
            <td className="text-gray-600">{client ? `${client.address.street}, ${client.address.city}` : '—'}</td>
            <td className="text-gray-600">{inv.issuedAt}</td>
            <td className="text-gray-600">{inv.dueDate}</td>
            <td className="text-gray-900 font-medium">{formatCurrency(total)}</td>
            <td><span className={`badge ${statusBadge(inv.status)}`}>{statusLabel(inv.status)}</span></td>
          </tr>); })}
        {filtered.length === 0 && (<tr><td colSpan={7} className="text-center text-gray-400 py-8">No invoices found.</td></tr>)}
      </tbody>
    </table></div>

    {/* New Invoice Modal */}
    <Modal isOpen={showNewModal} onClose={() => { setShowNewModal(false); resetNewForm(); }} title="New Invoice">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
          <select
            value={newClientId}
            onChange={e => setNewClientId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          >
            <option value="">Select a client...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Line Items</label>
            <button type="button" onClick={addLineItem} className="text-sm text-green-600 hover:text-green-700 font-medium">+ Add Item</button>
          </div>
          {newLineItems.map((li, idx) => (
            <div key={li.id} className="border border-gray-200 rounded-lg p-3 mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500">Item {idx + 1}</span>
                {newLineItems.length > 1 && (
                  <button type="button" onClick={() => removeLineItem(li.id)} className="text-gray-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={li.name}
                  onChange={e => updateLineItem(li.id, 'name', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={li.description}
                  onChange={e => updateLineItem(li.id, 'description', e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={li.qty}
                    onChange={e => updateLineItem(li.id, 'qty', Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Unit Price</label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={li.unitPrice}
                    onChange={e => updateLineItem(li.id, 'unitPrice', Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount ($)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={newDiscount}
              onChange={e => setNewDiscount(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={newTaxRate * 100}
              onChange={e => setNewTaxRate(Number(e.target.value) / 100)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
          <input
            type="date"
            value={newDueDate}
            onChange={e => setNewDueDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button className="btn btn-outline" onClick={() => { setShowNewModal(false); resetNewForm(); }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleCreateInvoice} disabled={!newClientId || !newDueDate}>Create Invoice</button>
        </div>
      </div>
    </Modal>
  </div>);
}
