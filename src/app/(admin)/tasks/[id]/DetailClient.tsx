'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { getSubtotal, getTax, getTotal } from '@/lib/types';
import Link from 'next/link';
import Modal from '@/components/Modal';
import ExpandableDescription from '@/components/ExpandableDescription';
import {
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  Briefcase,
  Plus,
  MapPin,
  Mail,
  Phone,
  FileText,
  CheckCircle2,
} from 'lucide-react';

const statusBadge = (status: string) => {
  switch (status) {
    case 'active': return 'bg-blue-100 text-blue-700';
    case 'completed': return 'bg-green-100 text-green-700';
    case 'archived': return 'bg-gray-100 text-gray-600';
    case 'draft': return 'bg-gray-100 text-gray-600';
    case 'requires-invoicing': return 'bg-yellow-100 text-yellow-700';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { tasks, invoices, getClient, getClientName, getJob, getQuote, allocateJobFromTask, getAssignableMembers, updateTask } = useApp();
  const router = useRouter();
  const [showAllocateModal, setShowAllocateModal] = useState(false);

  const task = tasks.find(t => t.id === id);

  if (!task) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="card text-center py-12">
          <p className="text-gray-500">Task not found.</p>
          <Link href="/tasks" className="text-green-600 hover:text-green-700 text-sm mt-2 inline-block">Back to Tasks</Link>
        </div>
      </div>
    );
  }

  const client = getClient(task.clientId);
  const quote = getQuote(task.quoteId);
  const totalQty = task.lineItems.reduce((s, li) => s + li.qty, 0);
  const allocatedQty = task.lineItems.reduce((s, li) => s + li.allocatedQty, 0);
  const completedQty = task.lineItems.reduce((s, li) => s + li.completedQty, 0);

  // Calculate invoiced qty: sum line item qtys from invoices linked to this task's jobs
  const taskInvoices = invoices.filter(inv => inv.jobId && task.jobIds.includes(inv.jobId));
  const invoicedMap = new Map<string, number>();
  for (const inv of taskInvoices) {
    for (const li of inv.lineItems) {
      invoicedMap.set(li.name, (invoicedMap.get(li.name) || 0) + li.qty);
    }
  }
  const invoicedQty = task.lineItems.reduce((s, li) => s + (invoicedMap.get(li.name) || 0), 0);

  const allocPct = totalQty > 0 ? Math.round((allocatedQty / totalQty) * 100) : 0;
  const completePct = totalQty > 0 ? Math.round((completedQty / totalQty) * 100) : 0;
  const invoicePct = totalQty > 0 ? Math.round((invoicedQty / totalQty) * 100) : 0;
  const subtotal = getSubtotal(task.lineItems, task.discount);
  const tax = getTax(task.lineItems, task.discount, task.taxRate);
  const total = getTotal(task.lineItems, task.discount, task.taxRate);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link href="/tasks" className="flex items-center gap-1 hover:text-green-600 transition-colors">
          <ArrowLeft size={16} /> Tasks
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-900">Task #{task.taskNumber}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ClipboardList size={20} className="text-gray-400" />
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(task.status)}`}>
            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
          </span>
          <h1 className="text-xl font-bold text-gray-900">{task.title}</h1>
        </div>
        {task.status === 'active' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateTask(id, { status: 'completed' })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <CheckCircle2 size={13} className="text-green-500" /> Mark Complete
            </button>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Main content */}
        <div className="col-span-2 space-y-6">

          {/* Progress card — 3 bars */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Progress</h2>
            <div className="space-y-4">
              {/* Allocated */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-blue-700">Allocated</span>
                  <span className="text-sm text-gray-500">{allocatedQty}/{totalQty} <span className="font-semibold text-blue-700">{allocPct}%</span></span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${allocPct === 100 ? 'bg-blue-600' : 'bg-blue-400'}`} style={{ width: `${allocPct}%` }} />
                </div>
              </div>
              {/* Completed */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-green-700">Completed</span>
                  <span className="text-sm text-gray-500">{completedQty}/{totalQty} <span className="font-semibold text-green-700">{completePct}%</span></span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${completePct === 100 ? 'bg-green-600' : 'bg-green-400'}`} style={{ width: `${completePct}%` }} />
                </div>
              </div>
              {/* Invoiced */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-purple-700">Invoiced</span>
                  <span className="text-sm text-gray-500">{invoicedQty}/{totalQty} <span className="font-semibold text-purple-700">{invoicePct}%</span></span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${invoicePct === 100 ? 'bg-purple-600' : 'bg-purple-400'}`} style={{ width: `${invoicePct}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Product / Service</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left pb-2 font-medium text-gray-600">Line Item</th>
                  <th className="text-right pb-2 font-medium text-gray-600 w-20">Total</th>
                  <th className="text-right pb-2 font-medium text-gray-600 w-24">Allocated</th>
                  <th className="text-right pb-2 font-medium text-gray-600 w-24">Completed</th>
                  <th className="text-right pb-2 font-medium text-gray-600 w-24">Invoiced</th>
                  <th className="text-right pb-2 font-medium text-gray-600 w-24">Unit Price</th>
                  <th className="text-right pb-2 font-medium text-gray-600 w-28">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {task.lineItems.map(li => {
                  const remaining = li.qty - li.allocatedQty;
                  return (
                    <tr key={li.id} className="border-b border-gray-100">
                      <td className="py-3 align-top">
                        <p className="font-medium text-gray-900">{li.name}</p>
                        {li.description && <ExpandableDescription text={li.description} />}
                      </td>
                      <td className="py-3 text-right text-gray-900">{li.qty}</td>
                      <td className="py-3 text-right">
                        <span className={li.allocatedQty > 0 ? 'text-blue-700 font-medium' : 'text-gray-400'}>{li.allocatedQty}</span>
                        {remaining > 0 && <div className="text-[10px] text-yellow-600">{remaining} remaining</div>}
                      </td>
                      <td className="py-3 text-right">
                        <span className={li.completedQty > 0 ? 'text-green-700 font-medium' : 'text-gray-400'}>{li.completedQty}</span>
                      </td>
                      <td className="py-3 text-right">
                        <span className={(invoicedMap.get(li.name) || 0) > 0 ? 'text-purple-700 font-medium' : 'text-gray-400'}>{invoicedMap.get(li.name) || 0}</span>
                      </td>
                      <td className="py-3 text-right text-gray-900">${li.unitPrice.toFixed(2)}</td>
                      <td className="py-3 text-right font-medium text-gray-900">${(li.qty * li.unitPrice).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="border-t border-gray-200 mt-4 pt-4">
              <div className="flex justify-end">
                <div className="w-72 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  {task.discount > 0 && <div className="flex justify-between"><span className="text-gray-500">Discount</span><span className="text-red-600">-${task.discount.toFixed(2)}</span></div>}
                  <div className="flex justify-between"><span className="text-gray-500">Tax (GST {(task.taxRate * 100).toFixed(1)}%)</span><span>${tax.toFixed(2)}</span></div>
                  <div className="flex justify-between font-semibold text-base border-t border-gray-200 pt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
                </div>
              </div>
            </div>
          </div>

          {/* Jobs */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Jobs ({task.jobIds.length})</h2>
              {task.lineItems.some(li => li.allocatedQty < li.qty) && (
                <button
                  onClick={() => setShowAllocateModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                >
                  <Plus size={13} /> Create / Allocate Job
                </button>
              )}
            </div>
            {task.jobIds.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No jobs allocated yet.</p>
            ) : (
              <div className="space-y-2">
                {task.jobIds.map(jid => {
                  const job = getJob(jid);
                  if (!job) return null;
                  return (
                    <Link key={jid} href={`/jobs/${jid}`} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Briefcase size={16} className="text-gray-400" />
                        <div>
                          <span className="text-sm font-medium text-gray-900">Job #{job.jobNumber}</span>
                          <span className="text-xs text-gray-500 ml-2">{job.title}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-gray-500">
                          {job.lineItems?.map(li => `${li.qty}x ${li.name}`).join(', ')}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Client */}
          {client && (
            <div className="card">
              <h2 className="text-base font-semibold mb-3 text-gray-900">Client</h2>
              <Link href={`/clients/${client.id}`} className="text-sm text-green-600 hover:text-green-700 font-medium">
                {client.firstName} {client.lastName}
              </Link>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2"><MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" /><span>{client.address.street}, {client.address.city}, {client.address.province} {client.address.postalCode}</span></div>
                {client.email && <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /><span>{client.email}</span></div>}
                {client.phone && <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /><span>{client.phone}</span></div>}
              </div>
            </div>
          )}

          {/* Source Quote */}
          {quote && (
            <div className="card">
              <h2 className="text-base font-semibold mb-3 text-gray-900">Source Quote</h2>
              <Link href={`/quotes/${quote.id}`} className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium">
                <FileText size={14} /> Quote #{quote.quoteNumber}
              </Link>
              <p className="text-xs text-gray-500 mt-1">{quote.title}</p>
            </div>
          )}
        </div>
      </div>

      {/* Allocate Job Modal */}
      {showAllocateModal && (
        <Modal isOpen onClose={() => setShowAllocateModal(false)} title="Create / Allocate Job" size="lg">
          <AllocateJobForm
            task={task}
            onAllocate={(allocations, options) => {
              const jId = allocateJobFromTask(id, allocations, options);
              if (jId) setShowAllocateModal(false);
            }}
            onCancel={() => setShowAllocateModal(false)}
          />
        </Modal>
      )}
    </div>
  );
}

// ── Allocate Job Form ─────────────────────────────────────────────
import type { Task } from '@/lib/types';

type AllocateOptions = {
  assignedTo: string[]; visitDate: string; startTime?: string; endTime?: string;
  scheduleLater?: boolean; anytime?: boolean; jobNotes?: string; visitInstructions?: string;
};

function AllocateJobForm({ task, onAllocate, onCancel }: {
  task: Task;
  onAllocate: (allocations: { lineItemId: string; qty: number }[], options: AllocateOptions) => void;
  onCancel: () => void;
}) {
  const { getAssignableMembers } = useApp();
  const members = getAssignableMembers();

  const availableItems = task.lineItems.filter(li => li.allocatedQty < li.qty);
  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    availableItems.forEach(li => { init[li.id] = 0; });
    return init;
  });
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [scheduleLater, setScheduleLater] = useState(false);
  const [anytime, setAnytime] = useState(false);
  const [jobNotes, setJobNotes] = useState('');
  const [visitInstructions, setVisitInstructions] = useState('');

  const toggleAssignee = (memberId: string) => {
    setAssignedTo(prev => prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]);
  };

  const hasAllocation = Object.values(allocations).some(q => q > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const allocs = Object.entries(allocations)
      .filter(([, qty]) => qty > 0)
      .map(([lineItemId, qty]) => ({ lineItemId, qty }));
    if (allocs.length === 0) return;
    onAllocate(allocs, {
      assignedTo, visitDate, startTime: startTime || undefined, endTime: endTime || undefined,
      scheduleLater, anytime, jobNotes, visitInstructions,
    });
  };

  const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Line items allocation */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Allocate quantities</h3>
        <div className="space-y-3">
          {availableItems.map(li => {
            const remaining = li.qty - li.allocatedQty;
            return (
              <div key={li.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{li.name}</p>
                  <p className="text-xs text-gray-500">Remaining: {remaining} of {li.qty} (${li.unitPrice.toFixed(2)} each)</p>
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    min="0"
                    max={remaining}
                    value={allocations[li.id] || 0}
                    onChange={e => setAllocations(prev => ({ ...prev, [li.id]: Math.min(parseInt(e.target.value) || 0, remaining) }))}
                    className={inputClass}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule */}
      <div className="border-t border-gray-200 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Schedule</h3>
          {!scheduleLater && <span className="text-xs text-gray-400">Total visits: 1 · On {visitDate}</span>}
        </div>

        {!scheduleLater && (
          <>
            <div className="grid grid-cols-4 gap-3 mb-3">
              <div>
                <label className={labelClass}>Date</label>
                <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Start time</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={inputClass} disabled={anytime} />
              </div>
              <div>
                <label className={labelClass}>End time</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={inputClass} disabled={anytime} />
              </div>
              <div>
                <label className={labelClass}>Assign</label>
                <div className="flex flex-wrap gap-1">
                  {members.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleAssignee(m.id)}
                      title={m.name}
                      className={`w-8 h-8 rounded-full text-xs font-bold text-white flex items-center justify-center transition-all ${
                        assignedTo.includes(m.id) ? 'ring-2 ring-offset-1 ring-green-500' : 'opacity-40 hover:opacity-70'
                      }`}
                      style={{ backgroundColor: m.color }}
                    >
                      {m.name.split(' ').map(n => n[0]).join('')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={anytime} onChange={e => setAnytime(e.target.checked)} className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                <span className="text-sm text-gray-700">Anytime</span>
              </label>
            </div>
          </>
        )}

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={scheduleLater} onChange={e => setScheduleLater(e.target.checked)} className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
          <span className="text-sm text-gray-700">Schedule later</span>
        </label>
      </div>

      {/* Job Notes */}
      <div>
        <label className={labelClass}>Job Notes</label>
        <input type="text" value={jobNotes} onChange={e => setJobNotes(e.target.value)} className={inputClass} placeholder="We can find..." />
      </div>

      {/* Visit Instructions */}
      <div>
        <label className={labelClass}>Visit Instructions</label>
        <textarea value={visitInstructions} onChange={e => setVisitInstructions(e.target.value)} rows={3} className={`${inputClass} resize-y`} placeholder="Instructions for this visit..." />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
        <button type="button" onClick={onCancel} className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          Cancel
        </button>
        <button
          type="submit"
          disabled={!hasAllocation}
          className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Save Job
        </button>
      </div>
    </form>
  );
}
