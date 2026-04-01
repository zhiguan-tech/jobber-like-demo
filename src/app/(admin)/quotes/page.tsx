'use client';

import { useState, useEffect, Suspense } from 'react';
import { useApp } from '@/lib/app-context';
import { getTotal } from '@/lib/types';
import type { QuoteLineItem } from '@/lib/types';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Trash2, MapPin, Phone, Mail } from 'lucide-react';
import Modal from '@/components/Modal';

const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500';

const statusBadge = (status: string) => {
  switch (status) {
    case 'draft': return 'badge-gray';
    case 'sent': return 'badge-yellow';
    case 'approved': return 'badge-green';
    case 'archived': return 'badge-gray';
    default: return 'badge-gray';
  }
};

const statusLabel = (status: string) => {
  if (status === 'sent') return 'Awaiting Response';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const DEFAULT_CONTRACT = `Knightsbridge Enterprises Inc. ("Knightsbridge") operates under the trade name "Knightsbridge Property Services". We carry a $5,000,000 General Liability Insurance Policy with Special Risk Insurance Managers (Policy #SRM065017) and all our workers have full WorkSafe BC coverage (#20007S2201).

We are able to serve local communities for over 40 years with safe records and customer satisfaction thanks to our service agreement. Please take time to read and understand it. By accepting this quote, you automatically agree and give consent to it.`;

export default function QuotesPageWrapper() {
  return (
    <Suspense>
      <QuotesPage />
    </Suspense>
  );
}

function QuotesPage() {
  const { quotes, clients, products, teamMembers, getClientName, getClient, addQuote, generateId, nextQuoteNumber } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [salesperson, setSalesperson] = useState('');
  const [estimator, setEstimator] = useState('');
  const [source, setSource] = useState('');
  const [division, setDivision] = useState('');
  const [lineItems, setLineItems] = useState<(QuoteLineItem & { longDesc?: string })[]>([
    { id: 'new-1', name: '', description: '', qty: 1, unitPrice: 0 },
  ]);
  const [discount, setDiscount] = useState(0);
  const [showDiscount, setShowDiscount] = useState(false);
  const [taxRate, setTaxRate] = useState(0.05);
  const [depositRequired, setDepositRequired] = useState(0);
  const [showDeposit, setShowDeposit] = useState(false);
  const [validUntil, setValidUntil] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [contractText, setContractText] = useState(DEFAULT_CONTRACT);
  const [noteText, setNoteText] = useState('');

  // Auto-open modal if clientId is in URL
  useEffect(() => {
    const cid = searchParams.get('clientId');
    if (cid) {
      setClientId(cid);
      setShowModal(true);
    }
  }, [searchParams]);

  const selectedClient = clientId ? getClient(clientId) : null;

  const resetForm = () => {
    setClientId(''); setTitle(''); setSalesperson(''); setEstimator(''); setSource(''); setDivision('');
    setLineItems([{ id: 'new-1', name: '', description: '', qty: 1, unitPrice: 0 }]);
    setDiscount(0); setShowDiscount(false); setTaxRate(0.05);
    setDepositRequired(0); setShowDeposit(false);
    const d = new Date(); d.setDate(d.getDate() + 30);
    setValidUntil(d.toISOString().split('T')[0]);
    setContractText(DEFAULT_CONTRACT); setNoteText('');
  };

  const removeLineItem = (idx: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateLineItem = (idx: number, field: string, value: string | number) => {
    setLineItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const subtotal = lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0);
  const discountedSubtotal = subtotal - discount;
  const tax = discountedSubtotal * taxRate;
  const total = discountedSubtotal + tax;

  const handleSubmit = () => {
    if (!clientId || !title) return;
    const newId = generateId('q');
    const today = new Date().toISOString().split('T')[0];
    addQuote({
      id: newId,
      quoteNumber: nextQuoteNumber(),
      clientId,
      title,
      status: 'draft',
      lineItems: lineItems.map(li => ({ id: generateId('ql'), name: li.name, description: li.description, qty: li.qty, unitPrice: li.unitPrice })),
      discount,
      taxRate,
      depositRequired,
      validUntil,
      createdAt: today,
      salesperson: salesperson || 'Unassigned',
      estimator: estimator || undefined,
      source: source || undefined,
      division: division || undefined,
      contractText,
      rateOpportunity: 3,
    });
    setShowModal(false);
    resetForm();
    router.push('/quotes/' + newId);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Quote
        </button>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Quote #</th>
              <th>Client</th>
              <th>Title</th>
              <th>Total</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {quotes.map(quote => {
              const t = getTotal(quote.lineItems, quote.discount, quote.taxRate);
              return (
                <tr key={quote.id} className="cursor-pointer" onClick={() => router.push(`/quotes/${quote.id}`)}>
                  <td className="font-medium text-gray-900">
                    <Link href={`/quotes/${quote.id}`} className="hover:text-green-600">#{quote.quoteNumber}</Link>
                  </td>
                  <td className="text-gray-600">{getClientName(quote.clientId)}</td>
                  <td className="text-gray-600">{quote.title}</td>
                  <td className="font-medium text-gray-900">${t.toFixed(2)}</td>
                  <td><span className={`badge ${statusBadge(quote.status)}`}>{statusLabel(quote.status)}</span></td>
                  <td className="text-gray-500">{quote.createdAt}</td>
                </tr>
              );
            })}
            {quotes.length === 0 && (
              <tr><td colSpan={6} className="text-center text-gray-400 py-8">No quotes yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Quote Modal */}
      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title="New Quote" size="lg">
        <div className="space-y-6">

          {/* Client Selection + Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Client *</label>
            <select className={inputClass} value={clientId} onChange={e => setClientId(e.target.value)}>
              <option value="">Select a client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
              ))}
            </select>
            {selectedClient && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                <p className="text-sm font-medium text-green-600">{selectedClient.firstName} {selectedClient.lastName}</p>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin size={11} /> {selectedClient.address.street}, {selectedClient.address.city}, {selectedClient.address.province} {selectedClient.address.postalCode}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Phone size={11} /> {selectedClient.phone}</span>
                  <span className="flex items-center gap-1"><Mail size={11} /> {selectedClient.email}</span>
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" className={inputClass} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Window Cleaning 2026" />
          </div>

          {/* Quote fields grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quote #</label>
              <input type="text" className={`${inputClass} bg-gray-50`} value={nextQuoteNumber()} readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Salesperson</label>
              <select className={inputClass} value={salesperson} onChange={e => setSalesperson(e.target.value)}>
                <option value="">Select...</option>
                {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <input type="text" className={inputClass} value={source} onChange={e => setSource(e.target.value)} placeholder="Source" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimator</label>
              <select className={inputClass} value={estimator} onChange={e => setEstimator(e.target.value)}>
                <option value="">Select...</option>
                {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
              <input type="text" className={inputClass} value={division} onChange={e => setDivision(e.target.value)} placeholder="Division" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
              <input type="date" className={inputClass} value={validUntil} onChange={e => setValidUntil(e.target.value)} />
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Product / Service */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">Product / Service</h3>
            <div className="space-y-4">
              {lineItems.map((item, idx) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-400 w-5">{idx + 1}</span>
                    <select
                      className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                      value={item.name}
                      onChange={e => {
                        const prod = products.find(p => p.name === e.target.value);
                        if (prod) {
                          setLineItems(prev => prev.map((li, i) => i === idx ? { ...li, name: prod.name, description: prod.description, unitPrice: prod.unitPrice } : li));
                        }
                      }}
                    >
                      <option value="">Select product...</option>
                      {products.filter(p => p.active).map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Qty</label>
                      <input type="number" className="w-16 border border-gray-300 rounded-md px-2 py-1.5 text-sm text-right" value={item.qty} onChange={e => updateLineItem(idx, 'qty', Number(e.target.value))} />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500">Unit price</label>
                      <input type="number" className="w-24 border border-gray-300 rounded-md px-2 py-1.5 text-sm text-right" value={item.unitPrice} onChange={e => updateLineItem(idx, 'unitPrice', Number(e.target.value))} />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-24 text-right">${(item.qty * item.unitPrice).toFixed(2)}</span>
                    {lineItems.length > 1 && (
                      <button type="button" className="p-1 text-red-400 hover:text-red-600" onClick={() => removeLineItem(idx)}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="ml-5">
                    <textarea
                      rows={2}
                      className="w-full border border-gray-200 rounded-md px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-y"
                      placeholder="Description"
                      value={item.description}
                      onChange={e => updateLineItem(idx, 'description', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <button type="button" className="text-sm font-medium text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-md transition-colors" onClick={() => setLineItems(prev => [...prev, { id: `new-${Date.now()}`, name: '', description: '', qty: 1, unitPrice: 0 }])}>
                Add Line Item
              </button>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-80 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="text-gray-900">${subtotal.toFixed(2)}</span></div>
              {showDiscount ? (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Discount</span>
                  <input type="number" className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-right" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
                </div>
              ) : (
                <button onClick={() => setShowDiscount(true)} className="text-xs text-green-600 hover:text-green-700 text-right w-full">Add Discount</button>
              )}
              <div className="flex justify-between"><span className="text-gray-500">Tax GST ({(taxRate * 100).toFixed(1)}%) Default</span><span className="text-gray-900">${tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold text-base border-t border-gray-200 pt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
              {showDeposit ? (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Deposit Required</span>
                  <input type="number" className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-right" value={depositRequired} onChange={e => setDepositRequired(Number(e.target.value))} />
                </div>
              ) : (
                <button onClick={() => setShowDeposit(true)} className="text-xs text-green-600 hover:text-green-700 text-right w-full">Add Deposit or Payment Schedule</button>
              )}
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Contract / Disclaimer */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Contract / Disclaimer</h3>
            <textarea
              rows={5}
              value={contractText}
              onChange={e => setContractText(e.target.value)}
              className={`${inputClass} resize-y text-sm text-gray-600`}
            />
            <label className="flex items-center gap-2 mt-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
              <span className="text-xs text-gray-500">Apply to all future quotes</span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Notes</h3>
            <textarea
              rows={3}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Leave a note..."
              className={`${inputClass} resize-y`}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <button onClick={() => { setShowModal(false); resetForm(); }} className="btn btn-outline">Cancel</button>
            <button onClick={handleSubmit} disabled={!clientId || !title} className="btn btn-primary disabled:opacity-50">Save Quote</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
