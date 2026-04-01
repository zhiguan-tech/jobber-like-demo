'use client';

import { useApp } from '@/lib/app-context';
import { getTotal } from '@/lib/types';
import Link from 'next/link';
import {
  AlertCircle,
  Clock,
  DollarSign,
  Briefcase,
  FileText,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export default function Dashboard() {
  const { clients, jobs, invoices, quotes, requests, getClientName, teamMembers } = useApp();
  const activeJobs = jobs.filter(j => j.status === 'active');
  const overdueInvoices = invoices.filter(i => i.status === 'past-due');
  const pendingQuotes = quotes.filter(q => q.status === 'sent');
  const newRequests = requests.filter(r => r.status === 'new');

  const totalRevenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, inv) => sum + inv.amountPaid, 0);

  const totalOutstanding = invoices
    .filter(i => ['sent', 'past-due', 'viewed'].includes(i.status))
    .reduce((sum, inv) => sum + getTotal(inv.lineItems, inv.discount, inv.taxRate), 0);

  const today = new Date('2025-10-20');
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const upcomingVisits = jobs
    .filter(j => j.status === 'active')
    .flatMap(j => j.visits.map(v => ({ ...v, jobTitle: j.title, clientId: j.clientId })))
    .filter(v => {
      const d = new Date(v.date);
      return d >= today && d <= nextWeek && v.status === 'scheduled';
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const actionItems = [
    ...overdueInvoices.map(inv => ({
      icon: AlertCircle,
      text: `Follow up on past due invoice #${inv.invoiceNumber} for ${getClientName(inv.clientId)}`,
      link: `/invoices`,
      color: 'text-red-500',
    })),
    ...pendingQuotes.map(q => ({
      icon: FileText,
      text: `Follow up on quote #${q.quoteNumber} sent to ${getClientName(q.clientId)}`,
      link: `/quotes`,
      color: 'text-yellow-500',
    })),
    ...newRequests.map(r => ({
      icon: Clock,
      text: `New request from ${getClientName(r.clientId)} needs assessment`,
      link: `/requests`,
      color: 'text-blue-500',
    })),
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Home</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Revenue (This Month)</span>
            <DollarSign size={18} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp size={14} className="text-green-500" />
            <span className="text-xs text-green-600">+12% from last month</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Outstanding</span>
            <DollarSign size={18} className="text-yellow-500" />
          </div>
          <p className="text-2xl font-bold">${totalOutstanding.toFixed(2)}</p>
          <span className="text-xs text-gray-500">{overdueInvoices.length} past due</span>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Active Jobs</span>
            <Briefcase size={18} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold">{activeJobs.length}</p>
          <span className="text-xs text-gray-500">{clients.length} total clients</span>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Pending Quotes</span>
            <FileText size={18} className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold">{pendingQuotes.length}</p>
          <span className="text-xs text-gray-500">{newRequests.length} new requests</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Action Items */}
        <div className="col-span-2 card">
          <h2 className="text-lg font-semibold mb-4">Recommended Actions</h2>
          {actionItems.length === 0 ? (
            <p className="text-gray-400 text-sm">All caught up!</p>
          ) : (
            <div className="space-y-3">
              {actionItems.map((item, i) => (
                <Link
                  key={i}
                  href={item.link}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <item.icon size={18} className={item.color} />
                  <span className="text-sm flex-1">{item.text}</span>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Team */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Team Assignments</h2>
          <div className="space-y-3">
            {teamMembers.map(member => {
              const memberVisits = upcomingVisits.filter(v => v.assignedTo.includes(member.id));
              return (
                <div key={member.id} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium"
                    style={{ background: member.color }}
                  >
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{member.name}</p>
                    <p className="text-xs text-gray-500">
                      {memberVisits.length} upcoming visit{memberVisits.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upcoming Jobs */}
      <div className="card mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Upcoming Jobs</h2>
          <Link href="/schedule" className="text-sm text-green-600 hover:text-green-700 font-medium">
            View Schedule
          </Link>
        </div>
        {upcomingVisits.length === 0 ? (
          <p className="text-gray-400 text-sm">No upcoming visits in the next 7 days.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Job</th>
                <th>Client</th>
                <th>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {upcomingVisits.map(visit => (
                <tr key={visit.id}>
                  <td>{visit.date}</td>
                  <td>{visit.startTime || 'Anytime'} - {visit.endTime || ''}</td>
                  <td className="font-medium">{visit.jobTitle}</td>
                  <td>{getClientName(visit.clientId)}</td>
                  <td>
                    <div className="flex gap-1">
                      {visit.assignedTo.map(id => {
                        const tm = teamMembers.find(t => t.id === id);
                        return tm ? (
                          <span
                            key={id}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-white"
                            style={{ background: tm.color }}
                          >
                            {tm.name.split(' ')[0]}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
