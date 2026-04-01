'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import Link from 'next/link';
import { ClipboardList } from 'lucide-react';

const statusBadge = (status: string) => {
  switch (status) {
    case 'active': return 'bg-blue-100 text-blue-700';
    case 'completed': return 'bg-green-100 text-green-700';
    case 'archived': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
};

export default function TasksPage() {
  const { tasks, invoices, getClientName } = useApp();
  const router = useRouter();

  const sorted = useMemo(() => [...tasks].sort((a, b) => b.taskNumber - a.taskNumber), [tasks]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ClipboardList size={24} className="text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        </div>
        <span className="text-sm text-gray-400">Tasks are created from approved quotes</span>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Task #</th>
              <th>Title</th>
              <th>Client</th>
              <th>Progress</th>
              <th>Jobs</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(task => {
              const totalQty = task.lineItems.reduce((s, li) => s + li.qty, 0);
              const allocatedQty = task.lineItems.reduce((s, li) => s + li.allocatedQty, 0);
              const completedQty = task.lineItems.reduce((s, li) => s + li.completedQty, 0);
              const taskInvoices = invoices.filter(inv => inv.jobId && task.jobIds.includes(inv.jobId));
              let invoicedQty = 0;
              for (const inv of taskInvoices) { for (const li of inv.lineItems) { invoicedQty += li.qty; } }
              const allocPct = totalQty > 0 ? Math.round((allocatedQty / totalQty) * 100) : 0;
              const completePct = totalQty > 0 ? Math.round((completedQty / totalQty) * 100) : 0;
              const invoicePct = totalQty > 0 ? Math.round((invoicedQty / totalQty) * 100) : 0;

              return (
                <tr key={task.id} className="cursor-pointer" onClick={() => router.push(`/tasks/${task.id}`)}>
                  <td>
                    <Link href={`/tasks/${task.id}`} className="font-medium text-green-600 hover:text-green-700">
                      #{task.taskNumber}
                    </Link>
                  </td>
                  <td className="font-medium text-gray-900">{task.title}</td>
                  <td className="text-gray-600">{getClientName(task.clientId)}</td>
                  <td>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-blue-400 transition-all" style={{ width: `${allocPct}%` }} />
                        </div>
                        <span className="text-[10px] text-blue-600 whitespace-nowrap">{allocPct}% alloc</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-green-400 transition-all" style={{ width: `${completePct}%` }} />
                        </div>
                        <span className="text-[10px] text-green-600 whitespace-nowrap">{completePct}% done</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-purple-400 transition-all" style={{ width: `${invoicePct}%` }} />
                        </div>
                        <span className="text-[10px] text-purple-600 whitespace-nowrap">{invoicePct}% inv</span>
                      </div>
                    </div>
                  </td>
                  <td className="text-gray-600">{task.jobIds.length}</td>
                  <td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(task.status)}`}>
                      {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                    </span>
                  </td>
                  <td className="text-gray-500 text-sm">{task.createdAt}</td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-8">
                  No tasks yet. Approve a quote and convert it to a task to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
