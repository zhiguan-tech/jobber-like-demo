'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { getTotal } from '@/lib/types';
import type { ClientContact, InternalNote } from '@/lib/types';
import Link from 'next/link';
import Modal from '@/components/Modal';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Plus,
  User,
  Calendar,
  Clock,
  AlertCircle,
  Paperclip,
  FileIcon,
  StickyNote,
} from 'lucide-react';

const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500';

export default function ClientDetailPage() {
  const { clients, quotes, jobs, invoices, tasks, getTeamMember, updateClient, generateId } = useApp();
  const params = useParams();
  const router = useRouter();
  const client = clients.find(c => c.id === params.id);
  const [activeTab, setActiveTab] = useState<'active' | 'quotes' | 'tasks' | 'jobs' | 'invoices'>('active');
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [noteText, setNoteText] = useState('');
  const [noteFile, setNoteFile] = useState<{ name: string; dataUrl: string } | null>(null);

  if (!client) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="card text-center py-12">
          <p className="text-gray-500">Client not found.</p>
          <button onClick={() => router.push('/clients')} className="btn btn-outline mt-4">
            <ArrowLeft size={16} /> Back to Clients
          </button>
        </div>
      </div>
    );
  }

  const clientQuotes = quotes.filter(q => q.clientId === client.id);
  const clientTasks = tasks.filter(t => t.clientId === client.id);
  const clientJobs = jobs.filter(j => j.clientId === client.id);
  const clientInvoices = invoices.filter(i => i.clientId === client.id);

  // Active work: active jobs + recent quotes + active tasks
  const activeJobs = clientJobs.filter(j => j.status === 'active' || j.status === 'requires-invoicing');
  const activeWork = [
    ...activeJobs.map(j => ({
      type: 'job' as const,
      id: j.id,
      label: `Job #${j.jobNumber} - ${j.title}`,
      status: j.status,
      statusLabel: j.status === 'requires-invoicing' ? 'REQUIRES INVOICING' : j.status === 'active' ? 'SCHEDULED/IN PROGRESS' : j.status.toUpperCase(),
      address: `${client.address.street}, ${client.address.city}, ${client.address.province} ${client.address.postalCode}`,
      amount: j.lineItems ? j.lineItems.reduce((s, li) => s + li.qty * li.unitPrice, 0) : 0,
      date: j.visits[0]?.date || j.createdAt,
      href: `/jobs/${j.id}`,
      isUpcoming: j.visits.some(v => v.status === 'scheduled' && new Date(v.date) >= new Date()),
      isOverdue: j.visits.some(v => v.status === 'scheduled' && new Date(v.date) < new Date()),
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  // All visits for this client's jobs (for Schedule section)
  const allVisits = clientJobs.flatMap(j =>
    j.visits.map(v => ({
      ...v,
      jobTitle: j.title,
      jobNumber: j.jobNumber,
      jobId: j.id,
    }))
  ).sort((a, b) => a.date.localeCompare(b.date));

  const upcomingVisits = allVisits.filter(v => v.status !== 'completed');
  const overdueVisits = upcomingVisits.filter(v => new Date(v.date) < new Date());
  const scheduledVisits = upcomingVisits.filter(v => new Date(v.date) >= new Date());

  const totalBilled = clientInvoices.reduce((sum, inv) => sum + getTotal(inv.lineItems, inv.discount, inv.taxRate), 0);
  const totalPaid = clientInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const balance = totalBilled - totalPaid;

  const tagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'residential': return 'badge-blue';
      case 'commercial': return 'badge-purple';
      case 'recurring': return 'badge-green';
      case 'vip': return 'badge-yellow';
      default: return 'badge-gray';
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'paid': case 'completed': case 'approved': return 'badge-green';
      case 'active': case 'sent': case 'viewed': return 'badge-blue';
      case 'draft': return 'badge-gray';
      case 'past-due': case 'requires-invoicing': return 'badge-yellow';
      case 'converted': return 'badge-purple';
      default: return 'badge-gray';
    }
  };

  const contacts = client.contacts || [];

  const handleAddContact = () => {
    if (!contactName.trim()) return;
    const newContact: ClientContact = {
      id: generateId('cc'),
      name: contactName.trim(),
      role: contactRole.trim(),
      phone: contactPhone.trim(),
      email: contactEmail.trim(),
    };
    updateClient(client.id, {
      contacts: [...contacts, newContact],
    });
    setContactName(''); setContactRole(''); setContactPhone(''); setContactEmail('');
    setShowContactModal(false);
  };

  const tabs = [
    { key: 'active' as const, label: 'Active Work', count: activeWork.length },
    { key: 'quotes' as const, label: 'Quotes', count: clientQuotes.length },
    { key: 'tasks' as const, label: 'Tasks', count: clientTasks.length },
    { key: 'jobs' as const, label: 'Jobs', count: clientJobs.length },
    { key: 'invoices' as const, label: 'Invoices', count: clientInvoices.length },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        {client.companyName && <span className="text-gray-400">{client.companyName}</span>}
        {client.companyName && <span className="text-gray-300">&gt;</span>}
        <span className="text-gray-900 font-medium">{client.firstName} {client.lastName}</span>
      </div>

      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{client.firstName} {client.lastName}</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Main content */}
        <div className="col-span-2 space-y-6">

          {/* Properties */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Properties</h2>
              <button className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                <Plus size={14} /> New Property
              </button>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-gray-900">{client.address.street}</span>
                    <span className="text-gray-600">{client.address.city}</span>
                    <span className="text-gray-600">{client.address.province} {client.address.postalCode}</span>
                  </div>
                </div>
              </div>
              {client.gstRate !== undefined && (
                <p className="text-xs text-gray-400 mt-2 ml-7">Tax rate: GST ({(client.gstRate * 100).toFixed(1)}%) (Default)</p>
              )}
            </div>
            {client.billingAddressSame === false && client.billingAddress && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 mt-2">
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Billing Address</p>
                    <p className="text-sm text-gray-900">{client.billingAddress.street}, {client.billingAddress.city}, {client.billingAddress.province} {client.billingAddress.postalCode}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          {client.description && (
            <div className="card">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{client.description}</p>
            </div>
          )}

          {/* Contacts Table */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Contacts</h2>
              <button
                onClick={() => setShowContactModal(true)}
                className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
              >
                <Plus size={14} /> Add
              </button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left pb-2 font-medium text-gray-500 text-xs">Name</th>
                  <th className="text-left pb-2 font-medium text-gray-500 text-xs">Role</th>
                  <th className="text-left pb-2 font-medium text-gray-500 text-xs">Phone</th>
                  <th className="text-left pb-2 font-medium text-gray-500 text-xs">Email</th>
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-gray-400 py-6">No contacts found</td>
                  </tr>
                ) : (
                  contacts.map(c => (
                    <tr key={c.id} className="border-b border-gray-100">
                      <td className="py-2.5 text-gray-900">{c.name}</td>
                      <td className="py-2.5 text-gray-600">{c.role || '—'}</td>
                      <td className="py-2.5 text-gray-600">{c.phone || '—'}</td>
                      <td className="py-2.5 text-gray-600">{c.email || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Overview Tabs */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Overview</h2>
              <Link href={`/quotes?clientId=${client.id}`} className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1">
                <Plus size={14} /> New Quote
              </Link>
            </div>
            <div className="flex border-b border-gray-200 mb-4">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === tab.key
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active Work Tab */}
            {activeTab === 'active' && (
              activeWork.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No active work for this client.</p>
              ) : (
                <div className="space-y-3">
                  {activeWork.map(item => (
                    <Link
                      key={item.id}
                      href={item.href}
                      className="block p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">{item.label}</span>
                            {item.isUpcoming && <span className="badge badge-green text-[10px]">Upcoming</span>}
                            {item.isOverdue && <span className="badge badge-red text-[10px]">Overdue</span>}
                          </div>
                          <p className="text-xs text-gray-500">{item.statusLabel} &middot; {item.date}</p>
                          <p className="text-xs text-gray-400 mt-1">{item.address}</p>
                        </div>
                        {item.amount > 0 && (
                          <span className="text-sm font-medium text-gray-900">${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}

            {/* Quotes Tab */}
            {activeTab === 'quotes' && (
              clientQuotes.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No quotes for this client.</p>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Quote #</th><th>Title</th><th>Status</th><th>Total</th><th>Created</th></tr></thead>
                  <tbody>
                    {clientQuotes.map(q => (
                      <tr key={q.id} onClick={() => router.push(`/quotes/${q.id}`)}>
                        <td className="font-medium">#{q.quoteNumber}</td>
                        <td><Link href={`/quotes/${q.id}`} className="text-green-600 hover:text-green-700">{q.title}</Link></td>
                        <td><span className={`badge ${statusBadge(q.status)}`}>{q.status}</span></td>
                        <td>${getTotal(q.lineItems, q.discount, q.taxRate).toFixed(2)}</td>
                        <td className="text-gray-500">{q.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              clientTasks.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No tasks for this client.</p>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Task #</th><th>Title</th><th>Status</th><th>Jobs</th><th>Created</th></tr></thead>
                  <tbody>
                    {clientTasks.map(t => (
                      <tr key={t.id} onClick={() => router.push(`/tasks/${t.id}`)}>
                        <td className="font-medium">#{t.taskNumber}</td>
                        <td><Link href={`/tasks/${t.id}`} className="text-green-600 hover:text-green-700">{t.title}</Link></td>
                        <td><span className={`badge ${statusBadge(t.status)}`}>{t.status}</span></td>
                        <td className="text-gray-600">{t.jobIds.length}</td>
                        <td className="text-gray-500">{t.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* Jobs Tab */}
            {activeTab === 'jobs' && (
              clientJobs.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No jobs for this client.</p>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Job #</th><th>Title</th><th>Status</th><th>Type</th><th>Created</th></tr></thead>
                  <tbody>
                    {clientJobs.map(j => (
                      <tr key={j.id} onClick={() => router.push(`/jobs/${j.id}`)}>
                        <td className="font-medium">#{j.jobNumber}</td>
                        <td><Link href={`/jobs/${j.id}`} className="text-green-600 hover:text-green-700">{j.title}</Link></td>
                        <td><span className={`badge ${statusBadge(j.status)}`}>{j.status === 'requires-invoicing' ? 'Req. Invoicing' : j.status}</span></td>
                        <td className="text-gray-600 capitalize">{j.jobType}</td>
                        <td className="text-gray-500">{j.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              clientInvoices.length === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">No invoices for this client.</p>
              ) : (
                <table className="data-table">
                  <thead><tr><th>Invoice #</th><th>Status</th><th>Total</th><th>Paid</th><th>Due Date</th></tr></thead>
                  <tbody>
                    {clientInvoices.map(inv => (
                      <tr key={inv.id} onClick={() => router.push(`/invoices/${inv.id}`)}>
                        <td><Link href={`/invoices/${inv.id}`} className="font-medium text-green-600 hover:text-green-700">#{inv.invoiceNumber}</Link></td>
                        <td><span className={`badge ${statusBadge(inv.status)}`}>{inv.status}</span></td>
                        <td>${getTotal(inv.lineItems, inv.discount, inv.taxRate).toFixed(2)}</td>
                        <td>${inv.amountPaid.toFixed(2)}</td>
                        <td className="text-gray-500">{inv.dueDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>

          {/* Schedule Section */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">Schedule</h2>
            </div>

            {overdueVisits.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2 flex items-center gap-1">
                  <AlertCircle size={12} /> Overdue
                </p>
                <div className="space-y-2">
                  {overdueVisits.map(v => {
                    const assignee = v.assignedTo[0] ? getTeamMember(v.assignedTo[0]) : null;
                    return (
                      <Link
                        key={v.id}
                        href={`/jobs/${v.jobId}`}
                        className="flex items-center justify-between p-3 rounded-lg border border-red-100 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Calendar size={14} className="text-red-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{v.jobTitle}</p>
                            {client.siteContact && (
                              <p className="text-xs text-gray-500">{client.siteContact.name} at {client.siteContact.phone}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{v.date}</span>
                          {assignee && <span>Assigned to {assignee.name}</span>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {scheduledVisits.length > 0 ? (
              <div className="space-y-2">
                {scheduledVisits.slice(0, 5).map(v => {
                  const assignee = v.assignedTo[0] ? getTeamMember(v.assignedTo[0]) : null;
                  return (
                    <Link
                      key={v.id}
                      href={`/jobs/${v.jobId}`}
                      className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Calendar size={14} className="text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Visit for Job #{v.jobNumber} - {v.jobTitle}</p>
                          {v.startTime && v.endTime && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock size={10} /> {v.startTime} - {v.endTime}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{v.date}</span>
                        {assignee && <span>Assigned to {assignee.name}</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              overdueVisits.length === 0 && (
                <p className="text-sm text-gray-400 py-4 text-center">No upcoming visits scheduled.</p>
              )
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Contact info</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Primary contact</span>
                <span className="text-gray-900">{client.firstName} {client.lastName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Main</span>
                <span className="text-gray-900">{client.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Email</span>
                <a href={`mailto:${client.email}`} className="text-green-600 hover:text-green-700 truncate ml-2">{client.email}</a>
              </div>
              {client.source && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Lead Source</span>
                  <span className="text-gray-900">{client.source}</span>
                </div>
              )}
              {client.siteContact && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Site Contact</span>
                  <span className="text-gray-900">{client.siteContact.name} at {client.siteContact.phone}</span>
                </div>
              )}
              {client.ownerType && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Owner</span>
                  <span className="text-gray-900">{client.ownerType}</span>
                </div>
              )}
              {client.propertyManagementFirm && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">PM Firm</span>
                  <span className="text-gray-900 truncate ml-2">{client.propertyManagementFirm}</span>
                </div>
              )}
              {client.website && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Website</span>
                  <span className="text-green-600 truncate ml-2">{client.website}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">Tags</h2>
              <button
                onClick={() => {
                  const input = prompt('Enter tags (comma-separated):', client.tags.join(', '));
                  if (input !== null) {
                    updateClient(client.id, { tags: input.split(',').map(t => t.trim()).filter(Boolean) });
                  }
                }}
                className="text-xs text-green-600 hover:text-green-700 font-medium"
              >
                + New Tag
              </button>
            </div>
            {client.tags.length > 0 ? (
              <div className="flex gap-2 flex-wrap">
                {client.tags.map(tag => (
                  <span key={tag} className={`badge ${tagColor(tag)}`}>{tag}</span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">This client has no tags</p>
            )}
          </div>

          {/* Billing History */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Billing history</h2>
            {clientInvoices.length === 0 ? (
              <>
                <p className="text-sm text-gray-400">No billing history</p>
                <p className="text-xs text-gray-400">This client hasn&apos;t been billed yet.</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-700">Current balance</span>
                  <span className="text-sm font-semibold text-gray-900">$0.00</span>
                </div>
              </>
            ) : (
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Total billed</span>
                  <span className="text-gray-900 font-medium">${totalBilled.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Total paid</span>
                  <span className="text-green-600 font-medium">${totalPaid.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-700 font-medium">Current balance</span>
                  <span className={`font-semibold ${balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>${balance.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Internal Notes */}
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Internal notes</h2>
            <p className="text-xs text-gray-400 mb-3">Internal notes will only be seen by your team.</p>

            {/* Add Note Form */}
            <div className="space-y-2 mb-4">
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                rows={3}
                placeholder="Write a note..."
                className={`${inputClass} resize-y text-sm`}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 cursor-pointer">
                  <Paperclip size={13} />
                  {noteFile ? (
                    <span className="text-green-600">{noteFile.name}</span>
                  ) : (
                    <span>Attach file</span>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setNoteFile({ name: file.name, dataUrl: '' });
                    }}
                  />
                </label>
                <button
                  onClick={() => {
                    if (!noteText.trim() && !noteFile) return;
                    const newNote: InternalNote = {
                      id: generateId('note'),
                      text: noteText.trim(),
                      fileName: noteFile?.name,
                      fileDataUrl: noteFile?.dataUrl,
                      createdAt: new Date().toISOString(),
                      author: 'You',
                    };
                    updateClient(client.id, {
                      notes: [newNote, ...(client.notes || [])],
                    });
                    setNoteText('');
                    setNoteFile(null);
                  }}
                  disabled={!noteText.trim() && !noteFile}
                  className="text-xs font-medium px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Add Note
                </button>
              </div>
            </div>

            {/* Notes Timeline */}
            {(client.notes && client.notes.length > 0) && (
              <div className="border-t border-gray-200 pt-3">
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200" />

                  <div className="space-y-4">
                    {client.notes.map(note => (
                      <div key={note.id} className="relative pl-8">
                        {/* Timeline dot */}
                        <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-gray-900">{note.author}</span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(note.createdAt).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {note.text && (
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.text}</p>
                          )}
                          {note.fileName && (
                            <div className="flex items-center gap-1.5 mt-1.5 px-2 py-1 bg-gray-50 rounded border border-gray-200 w-fit">
                              <FileIcon size={12} className="text-gray-400" />
                              <span className="text-xs text-gray-600">{note.fileName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      <Modal isOpen={showContactModal} onClose={() => setShowContactModal(false)} title="Add Contact">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} className={inputClass} placeholder="Contact name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <input type="text" value={contactRole} onChange={e => setContactRole(e.target.value)} className={inputClass} placeholder="e.g. Property Manager" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowContactModal(false)} className="btn btn-outline">Cancel</button>
            <button onClick={handleAddContact} disabled={!contactName.trim()} className="btn btn-primary disabled:opacity-50">Add Contact</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
