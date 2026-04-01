'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import {
  ArrowLeft,
  Calendar,
  Clock,
  FileText,
  ChevronDown,
  MoreHorizontal,
  StickyNote,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';

const statusBadge: Record<string, string> = {
  new: 'badge badge-blue',
  assessed: 'badge badge-yellow',
  converted: 'badge badge-green',
  archived: 'badge badge-gray',
};

const timeLabels: Record<string, string> = {
  any: 'Any time',
  morning: 'Morning',
  afternoon: 'Afternoon',
};

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { requests, getClient, getClientName, updateRequest, deleteRequest, convertRequestToQuote, convertRequestToJob } = useApp();
  const [moreOpen, setMoreOpen] = useState(false);
  const [note, setNote] = useState('');
  const [notes, setNotes] = useState<{ text: string; date: string }[]>([]);

  const request = requests.find(r => r.id === params.id);

  if (!request) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="card text-center py-12">
          <p className="text-gray-500">Request not found.</p>
          <button
            onClick={() => router.push('/requests')}
            className="btn btn-outline mt-4"
          >
            Back to Requests
          </button>
        </div>
      </div>
    );
  }

  const client = getClient(request.clientId);
  const clientName = getClientName(request.clientId);

  const handleAddNote = () => {
    if (!note.trim()) return;
    setNotes(prev => [{ text: note.trim(), date: new Date().toISOString().split('T')[0] }, ...prev]);
    setNote('');
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => router.push('/requests')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Requests
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            Request for {clientName}
          </h1>
          <span className={statusBadge[request.status]}>{request.status}</span>
        </div>

        <div className="flex items-center gap-2">
          {request.status === 'new' && (
            <button
              className="btn btn-primary"
              onClick={() => updateRequest(request.id, { status: 'assessed' })}
            >
              <Calendar size={16} />
              Schedule Assessment
            </button>
          )}

          {/* More dropdown */}
          {request.status !== 'converted' && (
            <div className="relative">
              <button
                className="btn btn-outline"
                onClick={() => setMoreOpen(!moreOpen)}
              >
                More
                <ChevronDown size={14} />
              </button>
              {moreOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMoreOpen(false)}
                  />
                  <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                    {(request.status === 'new' || request.status === 'assessed') && (
                      <>
                        <button
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                          onClick={() => { const qId = convertRequestToQuote(request.id); if (qId) router.push('/quotes/' + qId); setMoreOpen(false); }}
                        >
                          <FileText size={14} className="text-gray-400" />
                          Convert to Quote
                        </button>
                        <button
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                          onClick={() => { const jId = convertRequestToJob(request.id); if (jId) router.push('/jobs/' + jId); setMoreOpen(false); }}
                        >
                          <FileText size={14} className="text-gray-400" />
                          Convert to Job
                        </button>
                      </>
                    )}
                    <hr className="my-1 border-gray-100" />
                    {request.status !== 'archived' && (
                      <button
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-600"
                        onClick={() => { updateRequest(request.id, { status: 'archived' }); setMoreOpen(false); }}
                      >
                        Archive
                      </button>
                    )}
                    <button
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600"
                      onClick={() => { deleteRequest(request.id); router.push('/requests'); }}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left column - Overview */}
        <div className="col-span-2 space-y-6">
          {/* Service Details */}
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText size={18} className="text-gray-400" />
              Overview
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Service Details
                </label>
                <p className="mt-1 text-sm text-gray-800 leading-relaxed">
                  {request.serviceDetails}
                </p>
              </div>

              <hr className="border-gray-100" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Preferred Date
                  </label>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-800">
                    <Calendar size={14} className="text-gray-400" />
                    {request.preferredDate1}
                  </div>
                </div>

                {request.preferredDate2 && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Alternate Date
                    </label>
                    <div className="mt-1 flex items-center gap-2 text-sm text-gray-800">
                      <Calendar size={14} className="text-gray-400" />
                      {request.preferredDate2}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Preferred Time
                  </label>
                  <div className="mt-1 flex items-center gap-2 text-sm text-gray-800">
                    <Clock size={14} className="text-gray-400" />
                    {timeLabels[request.preferredTime]}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Created
                  </label>
                  <p className="mt-1 text-sm text-gray-800">{request.createdAt}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Client Info */}
          {client && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4">Client Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Mail size={14} className="text-gray-400" />
                  {client.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Phone size={14} className="text-gray-400" />
                  {client.phone}
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-700 col-span-2">
                  <MapPin size={14} className="text-gray-400 mt-0.5" />
                  {client.address.street}, {client.address.city}, {client.address.province} {client.address.postalCode}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column - Notes */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <StickyNote size={18} className="text-gray-400" />
              Notes
            </h2>

            <div className="mb-4">
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Add a note..."
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
              <button
                onClick={handleAddNote}
                disabled={!note.trim()}
                className="btn btn-primary mt-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Note
              </button>
            </div>

            {notes.length === 0 ? (
              <p className="text-sm text-gray-400">No notes yet.</p>
            ) : (
              <div className="space-y-3">
                {notes.map((n, i) => (
                  <div key={i} className="border-b border-gray-100 pb-3 last:border-0">
                    <p className="text-sm text-gray-800">{n.text}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
