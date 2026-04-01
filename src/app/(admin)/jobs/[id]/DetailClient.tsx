'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/lib/app-context';
import type { InternalNote } from '@/lib/types';
import {
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Clock,
  StickyNote,
  Users,
  CheckCircle2,
  FileText,
  ClipboardList,
  Paperclip,
  FileIcon,
} from 'lucide-react';

const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500';

const statusBadge = (status: string) => {
  switch (status) {
    case 'active': return 'badge-green';
    case 'completed': return 'badge-blue';
    case 'requires-invoicing': return 'badge-yellow';
    case 'draft': return 'badge-gray';
    case 'archived': return 'badge-gray';
    default: return 'badge-gray';
  }
};

export default function JobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { jobs, tasks, teamMembers, getClient, getClientName, getQuote, getTeamMember, completeJob, createInvoiceFromJob, updateJob, generateId } = useApp();
  const router = useRouter();

  const job = jobs.find(j => j.id === jobId);
  const [noteText, setNoteText] = useState('');
  const [noteFileName, setNoteFileName] = useState('');

  if (!job) {
    return (
      <div className="max-w-4xl mx-auto text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
        <p className="text-gray-500 mb-6">The job you are looking for does not exist.</p>
        <Link href="/jobs" className="btn btn-outline"><ArrowLeft size={16} /> Back to Jobs</Link>
      </div>
    );
  }

  const client = getClient(job.clientId);
  const clientName = getClientName(job.clientId);
  const parentTask = job.taskId ? tasks.find(t => t.id === job.taskId) : null;
  const parentQuote = job.quoteId ? getQuote(job.quoteId) : null;
  const completedVisits = job.visits.filter(v => v.status === 'completed').length;
  const totalVisits = job.visits.length;
  const statusLabel = job.status === 'requires-invoicing' ? 'Requires Invoicing' : job.status.charAt(0).toUpperCase() + job.status.slice(1);

  const [showAllVisits, setShowAllVisits] = useState(false);
  const visitsToShow = showAllVisits ? job.visits : job.visits.slice(0, 10);
  const hasMoreVisits = job.visits.length > 10;

  const handleAddNote = () => {
    if (!noteText.trim() && !noteFileName) return;
    const newNote: InternalNote = {
      id: generateId('note'),
      text: noteText.trim(),
      fileName: noteFileName || undefined,
      createdAt: new Date().toISOString(),
      author: 'You',
    };
    updateJob(jobId, { internalNotes: [newNote, ...(job.internalNotes || [])] });
    setNoteText('');
    setNoteFileName('');
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back */}
      <Link href="/jobs" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4">
        <ArrowLeft size={16} /> Back to Jobs
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <span className={`badge ${statusBadge(job.status)}`}>{statusLabel}</span>
          </div>
          <p className="text-gray-500 text-sm">Job #{job.jobNumber}</p>
          {job.workforceUnit && <p className="text-sm text-gray-500 mt-0.5">Workforce Unit: {job.workforceUnit}</p>}
        </div>
        <div className="flex gap-2">
          {job.status === 'active' && (
            <button className="btn btn-primary" onClick={() => completeJob(jobId)}>
              <CheckCircle2 size={16} /> Complete Job
            </button>
          )}
          {(job.status === 'completed' || job.status === 'requires-invoicing') && (
            <button className="btn btn-primary" onClick={() => {
              const iId = createInvoiceFromJob(jobId);
              if (iId) router.push('/invoices/' + iId);
            }}>
              <FileText size={16} /> Create Invoice
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left column */}
        <div className="col-span-2 space-y-6">

          {/* Client + Job info card */}
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
              <div className="flex justify-between"><span className="text-gray-500">Job #</span><span className="text-gray-900">{job.jobNumber}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Salesperson</span>
                <span className="text-gray-900 flex items-center gap-1.5">
                  {job.assignedTo[0] && (() => {
                    const m = getTeamMember(job.assignedTo[0]);
                    return m ? <><span className="w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center font-bold" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</span>{m.name}</> : 'Unassigned';
                  })()}
                </span>
              </div>
              {parentQuote && (
                <div className="flex justify-between"><span className="text-gray-500">From Quote</span>
                  <Link href={`/quotes/${parentQuote.id}`} className="text-green-600 hover:text-green-700">#{parentQuote.quoteNumber}</Link>
                </div>
              )}
              {parentTask && (
                <div className="flex justify-between"><span className="text-gray-500">From Task</span>
                  <Link href={`/tasks/${parentTask.id}`} className="text-green-600 hover:text-green-700">#{parentTask.taskNumber}</Link>
                </div>
              )}
              <div className="flex justify-between"><span className="text-gray-500">Created</span><span className="text-gray-900">{job.createdAt}</span></div>
            </div>
          </div>

          {/* Job Type */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Job type</h2>
            <div className="flex gap-2">
              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${
                job.jobType === 'one-off' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
              }`}>One-off</span>
              <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${
                job.jobType === 'recurring' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'
              }`}>Recurring</span>
            </div>
          </div>

          {/* Schedule / Visits */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                <Calendar size={14} className="inline mr-1 -mt-0.5" />
                Schedule
              </h2>
              <span className="text-sm text-gray-500">
                Total visits: {totalVisits} &middot; {completedVisits} completed
              </span>
            </div>

            {totalVisits === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No visits scheduled. This job will appear in the unscheduled section of the calendar.</p>
            ) : (
              <div className="space-y-2">
                {visitsToShow.map(visit => {
                  const assignee = visit.assignedTo[0] ? getTeamMember(visit.assignedTo[0]) : null;
                  const isCompleted = visit.status === 'completed';
                  return (
                    <div key={visit.id} className={`flex items-center justify-between p-3 rounded-lg border ${isCompleted ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100'}`}>
                      <div className="flex items-center gap-3">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{visit.date}</p>
                          {visit.startTime && visit.endTime && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock size={10} /> {visit.startTime} &ndash; {visit.endTime}
                            </p>
                          )}
                          {!visit.startTime && <p className="text-xs text-gray-400">Anytime</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {assignee && (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-medium" style={{ backgroundColor: assignee.color }}>
                              {assignee.name.split(' ').map(n => n[0]).join('')}
                            </span>
                            <span className="text-xs text-gray-600">{assignee.name}</span>
                          </div>
                        )}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {hasMoreVisits && (
              <button onClick={() => setShowAllVisits(!showAllVisits)} className="w-full text-sm text-green-600 hover:text-green-700 font-medium mt-3 text-center">
                {showAllVisits ? 'Show less' : `+ Show all ${job.visits.length} visits`}
              </button>
            )}

            {/* Visit Instructions */}
            {job.visitInstructions && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Visit Instructions</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{job.visitInstructions}</p>
              </div>
            )}
          </div>

          {/* Product / Service (Line Items) */}
          {job.lineItems && job.lineItems.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Product / Service</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left pb-2 font-medium text-gray-500">Name</th>
                    <th className="text-right pb-2 font-medium text-gray-500 w-20">Quantity</th>
                    <th className="text-right pb-2 font-medium text-gray-500 w-24">Unit price</th>
                    <th className="text-right pb-2 font-medium text-gray-500 w-28">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {job.lineItems.map(li => (
                    <tr key={li.id} className="border-b border-gray-100 align-top">
                      <td className="py-3">
                        <p className="font-medium text-gray-900">{li.name}</p>
                        {li.description && <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap leading-relaxed">{li.description}</p>}
                      </td>
                      <td className="py-3 text-right text-gray-900">{li.qty}</td>
                      <td className="py-3 text-right text-gray-900">${li.unitPrice.toFixed(2)}</td>
                      <td className="py-3 text-right font-medium text-gray-900">${(li.qty * li.unitPrice).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Notes */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              <StickyNote size={14} className="inline mr-1 -mt-0.5" /> Notes
            </h2>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              {job.notes || 'No notes for this job.'}
            </p>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Parent Task */}
          {parentTask && (
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                <ClipboardList size={14} className="inline mr-1 -mt-0.5" /> Parent Task
              </h2>
              <Link href={`/tasks/${parentTask.id}`} className="text-sm font-medium text-green-600 hover:text-green-700">
                Task #{parentTask.taskNumber}
              </Link>
              <p className="text-xs text-gray-500 mt-1">{parentTask.title}</p>
            </div>
          )}

          {/* Assigned Team */}
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              <Users size={14} className="inline mr-1 -mt-0.5" /> Assigned Team
            </h2>
            <div className="flex flex-wrap gap-2">
              {teamMembers.filter(m => m.active !== false).map(member => {
                const isAssigned = job.assignedTo.includes(member.id);
                return (
                  <button
                    key={member.id}
                    onClick={() => {
                      const newAssigned = isAssigned
                        ? job.assignedTo.filter(id => id !== member.id)
                        : [...job.assignedTo, member.id];
                      updateJob(jobId, { assignedTo: newAssigned });
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                      isAssigned
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-medium"
                      style={{ backgroundColor: member.color }}
                    >
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </span>
                    <div className="text-left">
                      <p className={`text-xs font-medium ${isAssigned ? 'text-blue-700' : 'text-gray-700'}`}>{member.name}</p>
                      <p className="text-[10px] text-gray-400">{member.role}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

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
                <label className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 cursor-pointer">
                  <Paperclip size={13} />
                  {noteFileName ? <span className="text-green-600">{noteFileName}</span> : <span>Attach file</span>}
                  <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setNoteFileName(f.name); }} />
                </label>
                <button
                  onClick={handleAddNote}
                  disabled={!noteText.trim() && !noteFileName}
                  className="text-xs font-medium px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Add Note
                </button>
              </div>
            </div>

            {(job.internalNotes && job.internalNotes.length > 0) && (
              <div className="border-t border-gray-200 pt-3">
                <div className="relative">
                  <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200" />
                  <div className="space-y-4">
                    {job.internalNotes.map(note => (
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
    </div>
  );
}
