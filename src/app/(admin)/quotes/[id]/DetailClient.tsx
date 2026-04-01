'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { getSubtotal, getTax, getTotal } from '@/lib/types';
import type { QuoteLineItem, InternalNote } from '@/lib/types';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  MapPin,
  Mail,
  Phone,
  Calendar,
  User,
  FileText,
  ClipboardList,
  Send,
  Paperclip,
  Trash2,
} from 'lucide-react';

const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500';

const statusDot = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-gray-400';
    case 'sent': return 'bg-yellow-500';
    case 'approved': return 'bg-green-500';
    default: return 'bg-gray-400';
  }
};

const statusBadge = (status: string) => {
  switch (status) {
    case 'draft': return 'badge-gray';
    case 'sent': return 'badge-yellow';
    case 'approved': return 'badge-green';
    case 'archived': return 'badge-gray';
    default: return 'badge-gray';
  }
};

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const {
    quotes, tasks, products, getClient, getClientName, updateQuote, addQuote,
    convertQuoteToTask, generateId, nextQuoteNumber,
  } = useApp();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteFileName, setNoteFileName] = useState('');

  const quote = quotes.find(q => q.id === id);

  const [editItems, setEditItems] = useState<QuoteLineItem[]>([]);

  useEffect(() => {
    if (quote) setEditItems(quote.lineItems.map(li => ({ ...li })));
  }, [quote]);


  if (!quote) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="card text-center py-12">
          <p className="text-gray-500">Quote not found.</p>
          <Link href="/quotes" className="text-green-600 hover:text-green-700 text-sm mt-2 inline-block">Back to Quotes</Link>
        </div>
      </div>
    );
  }

  const client = getClient(quote.clientId);
  const clientName = getClientName(quote.clientId);
  const displayItems = editing ? editItems : quote.lineItems;
  const subtotal = getSubtotal(displayItems, quote.discount);
  const tax = getTax(displayItems, quote.discount, quote.taxRate);
  const total = getTotal(displayItems, quote.discount, quote.taxRate);

  const existingTask = tasks.find(t => t.quoteId === id);

  const handleSaveEdit = () => {
    updateQuote(id, { lineItems: editItems, status: 'sent', sentAt: new Date().toISOString().split('T')[0] });
    setEditing(false);
  };

  const updateEditItem = (idx: number, field: keyof QuoteLineItem, value: string | number) => {
    setEditItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleAddNote = () => {
    if (!noteText.trim() && !noteFileName) return;
    const newNote: InternalNote = {
      id: generateId('note'),
      text: noteText.trim(),
      fileName: noteFileName || undefined,
      createdAt: new Date().toISOString(),
      author: 'You',
    };
    updateQuote(id, {
      internalNotes: [newNote, ...(quote.internalNotes || [])],
    });
    setNoteText('');
    setNoteFileName('');
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/quotes" className="flex items-center gap-1 hover:text-green-600 transition-colors">
          <ArrowLeft size={16} /> Quotes
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-900">Quote #{quote.quoteNumber}</span>
      </div>

      {/* Status + Action buttons — one row */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 overflow-x-auto">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDot(quote.status)}`} />
        <span className={`badge shrink-0 ${statusBadge(quote.status)}`}>
          {quote.status === 'sent' ? 'Awaiting Response' : quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
        </span>
        <div className="flex-1" />
        {/* Status toggle */}
        {quote.status !== 'archived' && (
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 shrink-0">
            {(['draft', 'sent', 'approved'] as const).map(s => {
              const label = s === 'sent' ? 'Awaiting Response' : s.charAt(0).toUpperCase() + s.slice(1);
              const isActive = quote.status === s;
              return (
                <button
                  key={s}
                  onClick={() => {
                    if (!confirm(`Change status to "${label}"?`)) return;
                    const updates: Record<string, unknown> = { status: s };
                    if (s === 'sent') updates.sentAt = new Date().toISOString().split('T')[0];
                    if (s === 'approved') updates.approvedAt = new Date().toISOString().split('T')[0];
                    updateQuote(id, updates);
                  }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        <div className="w-px h-6 bg-gray-300 shrink-0" />

        <button className="btn btn-outline text-xs shrink-0" onClick={() => alert('Email sent (demo)')}>
          <Mail size={13} /> Email
        </button>
        <button className="btn btn-outline text-xs shrink-0" onClick={() => window.print()}>
          Print or Save PDF
        </button>
        {quote.status !== 'archived' && (
          <button className="text-xs text-red-500 hover:text-red-700 px-3 py-1.5 border border-red-200 rounded-md hover:bg-red-50 transition-colors shrink-0" onClick={() => {
            updateQuote(id, { status: 'archived' });
          }}>
            Delete
          </button>
        )}

        {/* Convert to Task — rightmost, disabled when not approved */}
        {!existingTask ? (
          <button
            className="btn btn-primary text-xs shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={quote.status !== 'approved'}
            onClick={() => {
              const tId = convertQuoteToTask(id);
              if (tId) router.push('/tasks/' + tId);
            }}
          >
            <ClipboardList size={13} /> Convert to Task
          </button>
        ) : (
          <Link href={`/tasks/${existingTask.id}`} className="btn btn-outline text-xs shrink-0">
            View Task #{existingTask.taskNumber}
          </Link>
        )}
      </div>

      {/* Title */}
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{quote.title}</h1>
        {!editing && (
          <button onClick={() => setEditing(true)} className="p-1 text-gray-400 hover:text-gray-600">
            <Pencil size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Main content */}
        <div className="col-span-2 space-y-6">

          {/* Client info + quote fields */}
          <div className="card">
            {client && (
              <div className="mb-4 pb-4 border-b border-gray-100">
                <Link href={`/clients/${client.id}`} className="text-sm font-medium text-green-600 hover:text-green-700">{clientName}</Link>
                <div className="mt-1 space-y-0.5 text-xs text-gray-500">
                  <p className="flex items-center gap-1"><MapPin size={11} /> {client.address.street}, {client.address.city}, {client.address.province} {client.address.postalCode}</p>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1"><Phone size={11} /> {client.phone}</span>
                    <span className="flex items-center gap-1"><Mail size={11} /> {client.email}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Quote #</span><span className="text-gray-900">{quote.quoteNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Salesperson</span><span className="text-gray-900 flex items-center gap-1.5"><span className="w-5 h-5 bg-green-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">{quote.salesperson.charAt(0)}</span>{quote.salesperson}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Created</span><span className="text-gray-900">{quote.createdAt}</span></div>
              {quote.division && <div className="flex justify-between"><span className="text-gray-500">Division</span><span className="text-gray-900">{quote.division}</span></div>}
              {quote.source && <div className="flex justify-between"><span className="text-gray-500">Source</span><span className="text-gray-900">{quote.source}</span></div>}
              {quote.estimator && <div className="flex justify-between"><span className="text-gray-500">Estimator</span><span className="text-gray-900">{quote.estimator}</span></div>}
            </div>
          </div>

          {/* Product / Service */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Product / Service</h2>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="p-1 text-gray-400 hover:text-gray-600"><Pencil size={14} /></button>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
                    value=""
                    onChange={e => {
                      const prod = products.find(p => p.id === e.target.value);
                      if (prod) {
                        setEditItems(prev => [...prev, { id: generateId('ql'), name: prod.name, description: prod.description, qty: 1, unitPrice: prod.unitPrice }]);
                      }
                    }}
                  >
                    <option value="">+ Add from product...</option>
                    {products.filter(p => p.active).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <button className="btn btn-primary" onClick={handleSaveEdit}>Save</button>
                  <button className="btn btn-outline" onClick={() => { setEditing(false); setEditItems(quote.lineItems.map(li => ({ ...li }))); }}>Cancel</button>
                </div>
              )}
            </div>

            {editing ? (
              /* ── Editing mode ── */
              <div>
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_80px_100px_100px_32px] gap-3 pb-2 border-b border-gray-200 text-xs font-medium text-gray-500">
                  <span>Line Item</span>
                  <span className="text-center">Qty</span>
                  <span className="text-center">Unit Price</span>
                  <span className="text-right">Total</span>
                  <span />
                </div>

                <div className="divide-y divide-gray-100">
                  {editItems.map((item, idx) => (
                    <div key={item.id} className="py-4">
                      <div className="grid grid-cols-[1fr_80px_100px_100px_32px] gap-3 items-center">
                        {/* Product select */}
                        <select
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
                          value={item.name}
                          onChange={e => {
                            const prod = products.find(p => p.name === e.target.value);
                            if (prod) {
                              setEditItems(prev => prev.map((li, i) => i === idx ? { ...li, name: prod.name, description: prod.description, unitPrice: prod.unitPrice } : li));
                            }
                          }}
                        >
                          <option value="">Select product...</option>
                          {products.filter(p => p.active).map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                          {item.name && !products.find(p => p.name === item.name) && (
                            <option value={item.name}>{item.name}</option>
                          )}
                        </select>
                        {/* Qty */}
                        <input
                          type="number"
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-center text-gray-900"
                          value={item.qty}
                          onChange={e => updateEditItem(idx, 'qty', Number(e.target.value))}
                        />
                        {/* Unit Price */}
                        <input
                          type="number"
                          className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-center text-gray-900"
                          value={item.unitPrice}
                          onChange={e => updateEditItem(idx, 'unitPrice', Number(e.target.value))}
                        />
                        {/* Total */}
                        <span className="text-sm font-medium text-gray-900 text-right">${(item.qty * item.unitPrice).toFixed(2)}</span>
                        {/* Delete */}
                        {editItems.length > 1 && (
                          <button
                            onClick={() => setEditItems(prev => prev.filter((_, i) => i !== idx))}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      {/* Description */}
                      <div className="mt-2 grid grid-cols-[1fr_80px_100px_100px_32px] gap-3">
                        <textarea
                          className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 resize-y"
                          rows={2}
                          placeholder="Description..."
                          value={item.description}
                          onChange={e => updateEditItem(idx, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* ── Read-only mode ── */
              <div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left pb-2 font-medium text-gray-500">Line Item</th>
                      <th className="text-right pb-2 font-medium text-gray-500 w-20">Qty</th>
                      <th className="text-right pb-2 font-medium text-gray-500 w-24">Unit Price</th>
                      <th className="text-right pb-2 font-medium text-gray-500 w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayItems.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 align-top">
                        <td className="py-3">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          {item.description && <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap leading-relaxed">{item.description}</p>}
                        </td>
                        <td className="py-3 text-right text-gray-900">{item.qty}</td>
                        <td className="py-3 text-right text-gray-900">${item.unitPrice.toFixed(2)}</td>
                        <td className="py-3 text-right font-medium text-gray-900">${(item.qty * item.unitPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            <div className="border-t border-gray-200 mt-4 pt-4">
              <div className="flex justify-end">
                <div className="w-72 space-y-2 text-sm">
                  {quote.discount > 0 && (
                    <>
                      <div className="flex justify-between"><span className="text-gray-500">Subtotal (before discount)</span><span>${displayItems.reduce((s, i) => s + i.qty * i.unitPrice, 0).toFixed(2)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="text-red-600">-${quote.discount.toFixed(2)}</span></div>
                    </>
                  )}
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tax GST ({(quote.taxRate * 100).toFixed(1)}%) Default</span><span>${tax.toFixed(2)}</span></div>
                  <div className="flex justify-between font-semibold text-base border-t border-gray-200 pt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
                  {quote.depositRequired > 0 && (
                    <div className="flex justify-between"><span className="text-gray-500">Deposit Required</span><span>${quote.depositRequired.toFixed(2)}</span></div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contract / Disclaimer */}
          {quote.contractText && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-3">Contract / Disclaimer</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{quote.contractText}</p>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Internal Notes */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Notes</h2>
            <p className="text-xs text-gray-400 mb-3">Leave an internal note for yourself or a team member.</p>

            <div className="space-y-2 mb-3">
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                rows={3}
                placeholder="Leave a note..."
                className={`${inputClass} resize-y text-sm`}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 cursor-pointer">
                    <Paperclip size={13} />
                    {noteFileName ? (
                      <span className="text-green-600">{noteFileName}</span>
                    ) : (
                      <span>Attach file</span>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setNoteFileName(file.name);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setNoteFileName(`Quote_${quote.quoteNumber}_${quote.title.replace(/\s+/g, '_')}.pdf`)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700"
                  >
                    <FileText size={13} />
                    <span>Attach quote PDF</span>
                  </button>
                </div>
                <button
                  onClick={handleAddNote}
                  disabled={!noteText.trim() && !noteFileName}
                  className="text-xs font-medium px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Add Note
                </button>
              </div>
            </div>

            {(quote.internalNotes && quote.internalNotes.length > 0) && (
              <div className="border-t border-gray-200 pt-3">
                <div className="relative">
                  <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200" />
                  <div className="space-y-4">
                    {quote.internalNotes.map(note => (
                      <div key={note.id} className="relative pl-8 text-sm">
                        <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-gray-900">{note.author}</span>
                          <span className="text-[10px] text-gray-400">
                            {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {note.text && <p className="text-gray-600 whitespace-pre-wrap">{note.text}</p>}
                        {note.fileName && (
                          <div className="flex items-center gap-1.5 mt-1.5 px-2 py-1 bg-gray-50 rounded border border-gray-200 w-fit">
                            <FileText size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-600">{note.fileName}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
