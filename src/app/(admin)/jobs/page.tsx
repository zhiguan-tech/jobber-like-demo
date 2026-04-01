'use client';

import { useApp } from '@/lib/app-context';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function JobsPage() {
  const { jobs, tasks, getClientName } = useApp();
  const router = useRouter();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <span className="text-sm text-gray-400">Jobs are created from Tasks</span>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Job #</th>
              <th>Client</th>
              <th>Title</th>
              <th>Task</th>
              <th>Type</th>
              <th>Status</th>
              <th>Visits</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => {
              const completedVisits = job.visits.filter(v => v.status === 'completed').length;
              const totalVisits = job.visits.length;
              const parentTask = job.taskId ? tasks.find(t => t.id === job.taskId) : null;

              return (
                <tr key={job.id} className="cursor-pointer" onClick={() => router.push(`/jobs/${job.id}`)}>
                  <td className="font-medium text-gray-900">
                    <Link href={`/jobs/${job.id}`} className="hover:text-green-600">
                      #{job.jobNumber}
                    </Link>
                  </td>
                  <td className="text-gray-700">{getClientName(job.clientId)}</td>
                  <td>
                    <Link href={`/jobs/${job.id}`} className="font-medium text-gray-900 hover:text-green-600">
                      {job.title}
                    </Link>
                  </td>
                  <td>
                    {parentTask ? (
                      <Link
                        href={`/tasks/${parentTask.id}`}
                        className="text-green-600 hover:text-green-700 text-sm"
                        onClick={e => e.stopPropagation()}
                      >
                        #{parentTask.taskNumber}
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      job.jobType === 'recurring'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {job.jobType === 'recurring' ? 'Recurring' : 'One-off'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${statusBadge(job.status)}`}>
                      {job.status === 'requires-invoicing' ? 'Requires Invoicing' : job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </td>
                  <td className="text-gray-600">
                    {completedVisits} of {totalVisits} completed
                  </td>
                  <td className="text-gray-500">{job.createdAt}</td>
                </tr>
              );
            })}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-gray-400 py-8">
                  No jobs yet. Create jobs from the Tasks page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
