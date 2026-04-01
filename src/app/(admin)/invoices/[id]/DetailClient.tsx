'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/lib/app-context';
import { getSubtotal, getTax, getTotal } from '@/lib/types';
import type { InternalNote } from '@/lib/types';
import Modal from '@/components/Modal';
import {
  ArrowLeft,
  Send,
  CreditCard,
  FileText,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  Paperclip,
  FileIcon,
} from 'lucide-react';

const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500';

const statusBadge = (status: string) => {
  switch (status) {
    case 'draft': return 'badge-gray';
    case 'sent': return 'badge-yellow';
    case 'paid': return 'badge-green';
    case 'past-due': return 'badge-red';
    default: return 'badge-gray';
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'sent': return 'Awaiting Payment';
    case 'past-due': return 'Past Due';
    default: return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(n);

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { invoices, quotes, getClient, getClientName, getJob, updateInvoice, generateId } = useApp();
  const invoice = invoices.find(i => i.id === params.id);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailAddress, setEmailAddress] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteFileName, setNoteFileName] = useState('');
  const [emailAttachments, setEmailAttachments] = useState<string[]>([]);

  if (!invoice) {
    return (
      <div className="max-w-7xl mx-auto">
        <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft size={16} /> Back to Invoices
        </Link>
        <div className="card text-center py-12"><p className="text-gray-400">Invoice not found.</p></div>
      </div>
    );
  }

  const client = getClient(invoice.clientId);
  const job = invoice.jobId ? getJob(invoice.jobId) : null;
  const sourceQuote = job?.quoteId ? quotes.find(q => q.id === job.quoteId) : null;
  const quotePdfName = sourceQuote ? `Quote_${sourceQuote.quoteNumber}_${sourceQuote.title.replace(/\s+/g, '_')}.pdf` : null;
  const subtotal = getSubtotal(invoice.lineItems, invoice.discount);
  const tax = getTax(invoice.lineItems, invoice.discount, invoice.taxRate);
  const total = getTotal(invoice.lineItems, invoice.discount, invoice.taxRate);
  const amountDue = total - invoice.amountPaid;

  const handleSendEmail = () => {
    if (!emailAddress.trim()) return;
    const emailNote: InternalNote = {
      id: generateId('note'),
      text: `Invoice emailed to ${emailAddress.trim()}`,
      createdAt: new Date().toISOString(),
      author: 'System',
    };
    updateInvoice(invoice.id, {
      status: 'sent',
      sentToEmail: emailAddress.trim(),
      internalNotes: [emailNote, ...(invoice.internalNotes || [])],
    });
    setShowEmailModal(false);
    setEmailSent(true);
  };

  const handleMarkPaid = () => {
    if (!confirm('Mark this invoice as paid?')) return;
    updateInvoice(invoice.id, { status: 'paid', paidAt: new Date().toISOString().split('T')[0], amountPaid: total });
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
    updateInvoice(invoice.id, { internalNotes: [newNote, ...(invoice.internalNotes || [])] });
    setNoteText('');
    setNoteFileName('');
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back */}
      <Link href="/invoices" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4">
        <ArrowLeft size={16} /> Back to Invoices
      </Link>

      {/* Success banner */}
      {emailSent && invoice.status === 'sent' && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle2 size={16} className="text-green-600" />
          <p className="text-sm text-green-700">Invoice email has been sent to <strong>{invoice.sentToEmail}</strong></p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Invoice #{invoice.invoiceNumber}</h1>
          <span className={`badge ${statusBadge(invoice.status)}`}>{statusLabel(invoice.status)}</span>
        </div>
        <div className="flex gap-2">
          {invoice.status === 'draft' && (
            <button className="btn btn-primary" onClick={() => { setEmailAddress(client?.email || ''); setEmailAttachments(quotePdfName ? [quotePdfName] : []); setShowEmailModal(true); }}>
              <Send size={16} /> Send Email
            </button>
          )}
          {(invoice.status === 'sent' || invoice.status === 'past-due') && (
            <>
              <button className="btn btn-outline" onClick={() => { setEmailAddress(client?.email || ''); setEmailAttachments(quotePdfName ? [quotePdfName] : []); setShowEmailModal(true); }}>
                <Send size={16} /> Resend Email
              </button>
              <button className="btn btn-primary" onClick={handleMarkPaid}>
                <CheckCircle2 size={16} /> Mark Invoice Done
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Main content */}
        <div className="col-span-2 space-y-6">

          {/* Client + Invoice info */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Invoice for {getClientName(invoice.clientId)}</h2>
            {client && (
              <div className="space-y-1.5 text-sm mb-4 pb-4 border-b border-gray-100">
                <Link href={`/clients/${client.id}`} className="text-green-600 hover:text-green-700 font-medium">{client.firstName} {client.lastName}</Link>
                {client.companyName && <p className="text-gray-500">{client.companyName}</p>}
                <div className="flex items-start gap-1.5 text-gray-500"><MapPin size={13} className="mt-0.5 shrink-0" /><span>{client.address.street}, {client.address.city}, {client.address.province} {client.address.postalCode}</span></div>
                <div className="flex items-center gap-4 text-gray-500">
                  <span className="flex items-center gap-1"><Phone size={13} /> {client.phone}</span>
                  <span className="flex items-center gap-1"><Mail size={13} /> {client.email}</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Invoice #</span><span className="text-gray-900">{invoice.invoiceNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Issue Date</span><span className="text-gray-900">{invoice.issuedAt}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Due Date</span><span className="text-gray-900">{invoice.dueDate}</span></div>
              {job && (
                <div className="flex justify-between"><span className="text-gray-500">From Job</span><Link href={`/jobs/${job.id}`} className="text-green-600 hover:text-green-700">#{job.jobNumber}</Link></div>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Line Items</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left pb-2 font-medium text-gray-500">Product / Service</th>
                  <th className="text-right pb-2 font-medium text-gray-500 w-20">Qty</th>
                  <th className="text-right pb-2 font-medium text-gray-500 w-24">Unit Price</th>
                  <th className="text-right pb-2 font-medium text-gray-500 w-28">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map(item => (
                  <tr key={item.id} className="border-b border-gray-100 align-top">
                    <td className="py-3">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      {item.description && <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap leading-relaxed">{item.description}</p>}
                    </td>
                    <td className="py-3 text-right text-gray-900">{item.qty}</td>
                    <td className="py-3 text-right text-gray-900">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(item.qty * item.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="border-t border-gray-200 mt-4 pt-4">
              <div className="flex justify-end">
                <div className="w-72 space-y-2 text-sm">
                  {invoice.discount > 0 && (
                    <>
                      <div className="flex justify-between"><span className="text-gray-500">Subtotal (before discount)</span><span>{formatCurrency(invoice.lineItems.reduce((s, i) => s + i.qty * i.unitPrice, 0))}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="text-red-600">-{formatCurrency(invoice.discount)}</span></div>
                    </>
                  )}
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tax GST ({(invoice.taxRate * 100).toFixed(1)}%)</span><span>{formatCurrency(tax)}</span></div>
                  <div className="flex justify-between font-semibold text-base border-t border-gray-200 pt-2"><span>Total</span><span>{formatCurrency(total)}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Terms &amp; Conditions</h2>
            <div className="text-sm text-gray-600 space-y-2">
              <p>Payment is due within the terms specified on this invoice. Late payments may be subject to a 2% monthly interest charge.</p>
              <p>All work has been completed as described above. Please contact us within 7 days if you have any concerns regarding the services provided.</p>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Payment Status */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Payment Status</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Invoice Total</span><span className="font-medium">{formatCurrency(total)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount Paid</span><span className="text-green-600 font-medium">{formatCurrency(invoice.amountPaid)}</span></div>
              <div className="flex justify-between font-semibold border-t border-gray-200 pt-2">
                <span>Amount Due</span>
                <span className={amountDue > 0 ? 'text-red-600' : 'text-green-600'}>{formatCurrency(amountDue)}</span>
              </div>
            </div>
            {invoice.status === 'paid' && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-sm font-medium text-green-700">Paid in Full</p>
                {invoice.paidAt && <p className="text-xs text-green-600 mt-1">Paid on {invoice.paidAt}</p>}
              </div>
            )}
            {amountDue > 0 && invoice.status !== 'draft' && (
              <button className="btn btn-primary w-full mt-4" onClick={handleMarkPaid}>
                <CheckCircle2 size={16} /> Mark Invoice Done
              </button>
            )}
          </div>

          {/* Internal Notes */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Internal notes</h2>
            <p className="text-xs text-gray-400 mb-3">Internal notes will only be seen by your team.</p>

            <div className="space-y-2 mb-3">
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={3} placeholder="Leave a note..." className={`${inputClass} resize-y text-sm`} />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 cursor-pointer">
                  <Paperclip size={13} />
                  {noteFileName ? <span className="text-green-600">{noteFileName}</span> : <span>Attach file</span>}
                  <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setNoteFileName(f.name); }} />
                </label>
                <button onClick={handleAddNote} disabled={!noteText.trim() && !noteFileName} className="text-xs font-medium px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  Add Note
                </button>
              </div>
            </div>

            {(invoice.internalNotes && invoice.internalNotes.length > 0) && (
              <div className="border-t border-gray-200 pt-3">
                <div className="relative">
                  <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200" />
                  <div className="space-y-4">
                    {invoice.internalNotes.map(note => (
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
                            <FileIcon size={12} className="text-gray-400" />
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

      {/* Send Email Modal */}
      <Modal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} title={`Email Invoice #${invoice.invoiceNumber}`}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Send to</label>
            <input
              type="email"
              value={emailAddress}
              onChange={e => setEmailAddress(e.target.value)}
              placeholder="Enter email address..."
              className={inputClass}
            />
          </div>

          {/* Email preview */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Email Preview</p>
            <div className="bg-white rounded p-4 border border-gray-200 text-sm">
              <p className="font-medium text-gray-900 mb-2">Invoice #{invoice.invoiceNumber} from Service Provider</p>
              <p className="text-gray-600 mb-2">Dear {getClientName(invoice.clientId)},</p>
              <p className="text-gray-600 mb-2">Please find attached invoice #{invoice.invoiceNumber} for {formatCurrency(total)}, due on {invoice.dueDate}.</p>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Total Due</span>
                  <span className="font-medium">{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-500">Due Date</span>
                  <span>{invoice.dueDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Attachments</label>
            <div className="space-y-1.5">
              {emailAttachments.map((name, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="flex items-center gap-2 text-sm text-gray-700">
                    <FileIcon size={14} className="text-gray-400" /> {name}
                  </span>
                  <button onClick={() => setEmailAttachments(prev => prev.filter((_, i) => i !== idx))} className="text-xs text-gray-400 hover:text-red-500">Remove</button>
                </div>
              ))}
            </div>
            <label className="inline-flex items-center gap-1.5 mt-2 text-xs text-green-600 hover:text-green-700 cursor-pointer font-medium">
              <Paperclip size={13} /> Attach additional file
              <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setEmailAttachments(prev => [...prev, f.name]); }} />
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <button className="btn btn-outline" onClick={() => setShowEmailModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSendEmail} disabled={!emailAddress.trim()}>
              <Send size={14} /> Send Invoice
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
