'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, MapPin, Phone, Clock, CheckCircle2, CalendarPlus } from 'lucide-react';
import { useApp } from '@/lib/app-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Modal from '@/components/Modal';

const DAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

function getSunday(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}

function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
}

function formatHour(hour: number): string {
  if (hour === 0 || hour === 12) return `12 ${hour < 12 ? 'AM' : 'PM'}`;
  return `${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? 'PM' : 'AM'}`;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7);

interface VisitInfo {
  visitId: string;
  jobId: string;
  jobNumber: number;
  jobTitle: string;
  clientName: string;
  clientId: string;
  address: string;
  phone: string;
  date: string;
  startTime?: string;
  endTime?: string;
  assignedTo: string[];
  color: string;
  teamMemberName: string;
  status: string;
}

function visitColors(status: string, hasAssignee: boolean) {
  if (status === 'completed') return { bg: '#dcfce7', border: '#16a34a', text: '#166534' };
  if (hasAssignee) return { bg: '#dbeafe', border: '#2563eb', text: '#1e40af' };
  return { bg: '#f3f4f6', border: '#9ca3af', text: '#6b7280' };
}

export default function SchedulePage() {
  const { jobs, clients, teamMembers, getTeamMember, updateJob, completeJob, addJob, generateId, nextJobNumber } = useApp();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'Month' | 'Week' | 'Day'>('Month');
  const [weekStart, setWeekStart] = useState<Date>(() => getSunday(new Date()));
  const [selectedDay, setSelectedDay] = useState<Date>(() => new Date());
  const [selectedVisit, setSelectedVisit] = useState<VisitInfo | null>(null);
  const [showFinalVisitModal, setShowFinalVisitModal] = useState(false);
  const [finalVisitJobId, setFinalVisitJobId] = useState('');
  const [showScheduleNewVisit, setShowScheduleNewVisit] = useState(false);
  const [newVisitDate, setNewVisitDate] = useState('');
  const [newVisitStart, setNewVisitStart] = useState('');
  const [newVisitEnd, setNewVisitEnd] = useState('');
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  // Drag: move a visit to a new date
  const handleDropVisit = (targetDateStr: string) => {
    setDragOverDate(null);
    const data = sessionStorage.getItem('dnd-schedule');
    if (!data) return;
    const parsed = JSON.parse(data) as { type: 'visit'; jobId: string; visitId: string } | { type: 'unscheduled-job'; jobId: string };

    if (parsed.type === 'visit') {
      const job = jobs.find(j => j.id === parsed.jobId);
      if (!job) return;
      const updatedVisits = job.visits.map(v => v.id === parsed.visitId ? { ...v, date: targetDateStr } : v);
      updateJob(parsed.jobId, { visits: updatedVisits });
    } else if (parsed.type === 'unscheduled-job') {
      const job = jobs.find(j => j.id === parsed.jobId);
      if (!job) return;
      const newVisit = {
        id: generateId('v'),
        jobId: parsed.jobId,
        date: targetDateStr,
        startTime: undefined,
        endTime: undefined,
        status: 'scheduled' as const,
        assignedTo: job.assignedTo,
      };
      updateJob(parsed.jobId, { visits: [...job.visits, newVisit] });
    }
    sessionStorage.removeItem('dnd-schedule');
  };

  const today = useMemo(() => new Date(), []);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  // All visits for the week
  const weekVisits = useMemo<VisitInfo[]>(() => {
    const result: VisitInfo[] = [];
    for (const job of jobs) {
      const client = clients.find(c => c.id === job.clientId);
      if (!client) continue;
      for (const visit of job.visits) {
        const visitDate = new Date(visit.date + 'T00:00:00');
        if (visitDate < weekStart || visitDate > weekEnd) continue;
        const member = visit.assignedTo[0] ? teamMembers.find(t => t.id === visit.assignedTo[0]) : null;
        result.push({
          visitId: visit.id,
          jobId: job.id,
          jobNumber: job.jobNumber,
          jobTitle: job.title,
          clientName: `${client.firstName} ${client.lastName}`,
          clientId: client.id,
          address: `${client.address.street}, ${client.address.city}, ${client.address.province} ${client.address.postalCode}`,
          phone: client.phone,
          date: visit.date,
          startTime: visit.startTime,
          endTime: visit.endTime,
          assignedTo: visit.assignedTo,
          color: member?.color || '#6b7280',
          teamMemberName: member?.name || 'Unassigned',
          status: visit.status,
        });
      }
    }
    return result;
  }, [weekStart, weekEnd, jobs, clients, teamMembers]);

  // Month grid: weeks of the current month
  const monthWeeks = useMemo(() => {
    const monthStart = new Date(weekStart.getFullYear(), weekStart.getMonth(), 1);
    const firstSunday = getSunday(monthStart);
    const weeks: Date[][] = [];
    let current = firstSunday;
    for (let w = 0; w < 6; w++) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(new Date(current));
        current = addDays(current, 1);
      }
      weeks.push(week);
      if (current.getMonth() !== weekStart.getMonth() && current.getDate() > 7) break;
    }
    return weeks;
  }, [weekStart]);

  // All visits (not filtered by week — for month/day views)
  const allVisits = useMemo<VisitInfo[]>(() => {
    const result: VisitInfo[] = [];
    for (const job of jobs) {
      const client = clients.find(c => c.id === job.clientId);
      if (!client) continue;
      for (const visit of job.visits) {
        const member = visit.assignedTo[0] ? teamMembers.find(t => t.id === visit.assignedTo[0]) : null;
        result.push({
          visitId: visit.id, jobId: job.id, jobNumber: job.jobNumber, jobTitle: job.title,
          clientName: `${client.firstName} ${client.lastName}`, clientId: client.id,
          address: `${client.address.street}, ${client.address.city}, ${client.address.province} ${client.address.postalCode}`,
          phone: client.phone, date: visit.date, startTime: visit.startTime, endTime: visit.endTime,
          assignedTo: visit.assignedTo, color: member?.color || '#6b7280', teamMemberName: member?.name || 'Unassigned',
          status: visit.status,
        });
      }
    }
    return result;
  }, [jobs, clients, teamMembers]);

  const getVisitsForDate = (dateStr: string) => allVisits.filter(v => v.date === dateStr);

  // Unscheduled jobs (no visits or all visits have no date)
  const unscheduledJobs = useMemo(() => {
    return jobs.filter(j => j.status === 'active' && j.visits.length === 0);
  }, [jobs]);

  const getVisitsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return weekVisits.filter(v => v.date === dateStr);
  };

  const handleMarkComplete = (visitInfo: VisitInfo) => {
    // Mark this visit as completed
    const job = jobs.find(j => j.id === visitInfo.jobId);
    if (!job) return;
    const updatedVisits = job.visits.map(v => v.id === visitInfo.visitId ? { ...v, status: 'completed' as const } : v);
    updateJob(visitInfo.jobId, { visits: updatedVisits });

    // Check if this was the last scheduled visit
    const remainingScheduled = updatedVisits.filter(v => v.status !== 'completed');
    if (remainingScheduled.length === 0) {
      setFinalVisitJobId(visitInfo.jobId);
      setShowFinalVisitModal(true);
    }
    setSelectedVisit(null);
  };

  const handleCloseJob = () => {
    completeJob(finalVisitJobId);
    setShowFinalVisitModal(false);
    router.push(`/jobs/${finalVisitJobId}`);
  };

  const handleScheduleNewVisit = () => {
    if (!newVisitDate) return;
    const job = jobs.find(j => j.id === finalVisitJobId);
    if (!job) return;
    const newVisit = {
      id: generateId('v'),
      jobId: finalVisitJobId,
      date: newVisitDate,
      startTime: newVisitStart || undefined,
      endTime: newVisitEnd || undefined,
      status: 'scheduled' as const,
      assignedTo: job.assignedTo,
    };
    updateJob(finalVisitJobId, { visits: [...job.visits, newVisit] });
    setShowFinalVisitModal(false);
    setShowScheduleNewVisit(false);
    setNewVisitDate('');
    setNewVisitStart('');
    setNewVisitEnd('');
  };

  return (
    <div className="max-w-full mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <button onClick={() => { setWeekStart(getSunday(today)); setSelectedDay(new Date(today)); }} className="px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-md hover:bg-gray-50">
            Today
          </button>
          <div className="flex items-center gap-1">
            <button onClick={() => {
              if (viewMode === 'Day') setSelectedDay(addDays(selectedDay, -1));
              else if (viewMode === 'Week') setWeekStart(addDays(weekStart, -7));
              else setWeekStart(new Date(weekStart.getFullYear(), weekStart.getMonth() - 1, 1));
            }} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"><ChevronLeft size={20} /></button>
            <span className="text-sm font-semibold text-gray-800 min-w-[200px] text-center">
              {viewMode === 'Day'
                ? selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
                : viewMode === 'Week'
                  ? `${formatDate(weekStart)} – ${formatDate(weekEnd)}, ${weekEnd.getFullYear()}`
                  : weekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              }
            </span>
            <button onClick={() => {
              if (viewMode === 'Day') setSelectedDay(addDays(selectedDay, 1));
              else if (viewMode === 'Week') setWeekStart(addDays(weekStart, 7));
              else setWeekStart(new Date(weekStart.getFullYear(), weekStart.getMonth() + 1, 1));
            }} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600"><ChevronRight size={20} /></button>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['Month', 'Week', 'Day'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        {/* Day View */}
        {viewMode === 'Day' && (
          <div className="flex-1 card overflow-hidden p-0">
            <div className="min-w-[400px]">
              {/* Day header */}
              <div className="grid grid-cols-[60px_1fr] border-b border-gray-200">
                <div className="p-2" />
                <div className={`p-2 text-center border-l border-gray-200 ${isSameDay(selectedDay, today) ? 'bg-green-50' : ''}`}>
                  <div className="text-[10px] font-medium text-gray-500">{DAY_LABELS[selectedDay.getDay()]}</div>
                  <div className={`text-lg font-semibold mt-0.5 ${isSameDay(selectedDay, today) ? 'text-white bg-green-600 w-8 h-8 rounded-full flex items-center justify-center mx-auto' : 'text-gray-900'}`}>
                    {selectedDay.getDate()}
                  </div>
                </div>
              </div>
              <div className="relative">
                {HOURS.map(hour => (
                  <div key={hour} className="grid grid-cols-[60px_1fr] border-b border-gray-100" style={{ height: 48 }}>
                    <div className="pr-2 pt-0 text-right"><span className="text-[10px] text-gray-400 relative -top-2">{formatHour(hour)}</span></div>
                    <div className={`border-l border-gray-200 ${isSameDay(selectedDay, today) ? 'bg-green-50/30' : ''}`} />
                  </div>
                ))}
                <div className="absolute inset-0 grid grid-cols-[60px_1fr]" style={{ pointerEvents: 'none' }}>
                  <div />
                  <div className="relative border-l border-transparent">
                    {(() => {
                      const dateStr = selectedDay.toISOString().split('T')[0];
                      const visits = getVisitsForDate(dateStr);
                      return (
                        <>
                          {visits.filter(v => !v.startTime || !v.endTime).map((visit, idx) => {
                            const vc = visitColors(visit.status, visit.assignedTo.length > 0);
                            return (
                              <div key={visit.visitId} className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 overflow-hidden cursor-pointer hover:opacity-80"
                                style={{ top: `${idx * 26}px`, height: '24px', backgroundColor: vc.bg, borderLeft: `3px solid ${vc.border}`, pointerEvents: 'auto' }}
                                onClick={() => setSelectedVisit(visit)}>
                                <p className="text-[10px] font-semibold truncate" style={{ color: vc.text }}>{visit.clientName} - {visit.jobTitle}</p>
                              </div>
                            );
                          })}
                          {visits.filter(v => v.startTime && v.endTime).map(visit => {
                            const top = (parseTime(visit.startTime!) - 7) * 48;
                            const height = Math.max((parseTime(visit.endTime!) - parseTime(visit.startTime!)) * 48, 24);
                            const vc = visitColors(visit.status, visit.assignedTo.length > 0);
                            return (
                              <div key={visit.visitId} className="absolute left-0.5 right-0.5 rounded px-1.5 py-1 overflow-hidden cursor-pointer hover:opacity-80"
                                style={{ top: `${top}px`, height: `${height}px`, backgroundColor: vc.bg, borderLeft: `3px solid ${vc.border}`, pointerEvents: 'auto' }}
                                onClick={() => setSelectedVisit(visit)}>
                                <p className="text-[10px] font-semibold truncate" style={{ color: vc.text }}>{visit.clientName}</p>
                                <p className="text-[9px] text-gray-600 truncate">{visit.startTime} – {visit.endTime}</p>
                                {height >= 60 && <p className="text-[9px] text-gray-500 truncate">{visit.jobTitle}</p>}
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Month View */}
        {viewMode === 'Month' && (
          <div className="flex-1 card overflow-hidden p-0">
            <table className="w-full border-collapse table-fixed">
              <thead>
                <tr>
                  {DAY_LABELS.map(d => (
                    <th key={d} className="p-2 text-[10px] font-medium text-gray-500 border-b border-gray-200 text-center w-[14.28%]">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthWeeks.map((week, wi) => (
                  <tr key={wi}>
                    {week.map((day, di) => {
                      const dateStr = day.toISOString().split('T')[0];
                      const visits = getVisitsForDate(dateStr);
                      const isCurrentMonth = day.getMonth() === weekStart.getMonth();
                      const isToday = isSameDay(day, today);
                      return (
                        <td
                          key={di}
                          className={`border border-gray-100 align-top p-1 h-24 overflow-hidden transition-colors ${isCurrentMonth ? '' : 'bg-gray-50'} ${dragOverDate === dateStr ? 'bg-green-100' : ''}`}
                          onDragOver={e => { e.preventDefault(); setDragOverDate(dateStr); }}
                          onDragLeave={() => setDragOverDate(null)}
                          onDrop={e => { e.preventDefault(); handleDropVisit(dateStr); }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-medium ${isToday ? 'text-white bg-green-600 w-5 h-5 rounded-full flex items-center justify-center' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                              {day.getDate()}
                            </span>
                          </div>
                          <div className="space-y-0.5">
                            {visits.slice(0, 3).map(v => {
                              const vc = visitColors(v.status, v.assignedTo.length > 0);
                              return (
                                <div
                                  key={v.visitId}
                                  draggable
                                  onDragStart={() => { sessionStorage.setItem('dnd-schedule', JSON.stringify({ type: 'visit', jobId: v.jobId, visitId: v.visitId })); }}
                                  className="rounded px-1 py-0.5 cursor-grab active:cursor-grabbing hover:opacity-80 truncate"
                                  style={{ backgroundColor: vc.bg, borderLeft: `2px solid ${vc.border}` }}
                                  onClick={() => setSelectedVisit(v)}
                                >
                                  <p className="text-[9px] font-medium truncate" style={{ color: vc.text }}>{v.clientName}</p>
                                </div>
                              );
                            })}
                            {visits.length > 3 && <p className="text-[9px] text-gray-400 pl-1">+{visits.length - 3} more</p>}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Week View */}
        {viewMode === 'Week' && (
        <div className="flex-1 card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Day headers */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-200">
                <div className="p-2" />
                {weekDays.map((day, i) => {
                  const isToday = isSameDay(day, today);
                  const dayVisits = getVisitsForDay(day);
                  return (
                    <div key={i} className={`p-2 text-center border-l border-gray-200 ${isToday ? 'bg-green-50' : ''}`}>
                      <div className="text-[10px] font-medium text-gray-500">{DAY_LABELS[i]}</div>
                      <div className={`text-lg font-semibold mt-0.5 ${isToday ? 'text-white bg-green-600 w-8 h-8 rounded-full flex items-center justify-center mx-auto' : 'text-gray-900'}`}>
                        {day.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time grid */}
              <div className="relative">
                {HOURS.map(hour => (
                  <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-100" style={{ height: 48 }}>
                    <div className="pr-2 pt-0 text-right">
                      <span className="text-[10px] text-gray-400 relative -top-2">{formatHour(hour)}</span>
                    </div>
                    {weekDays.map((day, i) => (
                      <div key={i} className={`border-l border-gray-200 ${isSameDay(day, today) ? 'bg-green-50/30' : ''}`} />
                    ))}
                  </div>
                ))}

                {/* Visit blocks */}
                <div className="absolute inset-0 grid grid-cols-[60px_repeat(7,1fr)]" style={{ pointerEvents: 'none' }}>
                  <div />
                  {weekDays.map((day, dayIndex) => {
                    const dateStr = day.toISOString().split('T')[0];
                    const visits = getVisitsForDay(day);
                    return (
                      <div
                        key={dayIndex}
                        className={`relative border-l border-transparent transition-colors ${dragOverDate === dateStr ? 'bg-green-100/50' : ''}`}
                        style={{ pointerEvents: 'auto' }}
                        onDragOver={e => { e.preventDefault(); setDragOverDate(dateStr); }}
                        onDragLeave={() => setDragOverDate(null)}
                        onDrop={e => { e.preventDefault(); handleDropVisit(dateStr); }}
                      >
                        {/* Anytime / no-time visits at the top */}
                        {visits.filter(v => !v.startTime || !v.endTime).map((visit, idx) => {
                          const vc = visitColors(visit.status, visit.assignedTo.length > 0);
                          return (
                            <div
                              key={visit.visitId}
                              draggable
                              onDragStart={e => { e.stopPropagation(); sessionStorage.setItem('dnd-schedule', JSON.stringify({ type: 'visit', jobId: visit.jobId, visitId: visit.visitId })); }}
                              className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 overflow-hidden cursor-grab active:cursor-grabbing hover:opacity-80 transition-opacity"
                              style={{
                                top: `${idx * 26}px`,
                                height: '24px',
                                backgroundColor: vc.bg,
                                borderLeft: `3px solid ${vc.border}`,
                                pointerEvents: 'auto',
                              }}
                              onClick={() => setSelectedVisit(visit)}
                            >
                              <p className="text-[10px] font-semibold truncate" style={{ color: vc.text }}>{visit.clientName}</p>
                            </div>
                          );
                        })}
                        {/* Timed visits */}
                        {visits.filter(v => v.startTime && v.endTime).map(visit => {
                          const startHour = parseTime(visit.startTime!);
                          const endHour = parseTime(visit.endTime!);
                          const top = (startHour - 7) * 48;
                          const height = Math.max((endHour - startHour) * 48, 24);
                          const vc = visitColors(visit.status, visit.assignedTo.length > 0);
                          return (
                            <div
                              key={visit.visitId}
                              draggable
                              onDragStart={e => { e.stopPropagation(); sessionStorage.setItem('dnd-schedule', JSON.stringify({ type: 'visit', jobId: visit.jobId, visitId: visit.visitId })); }}
                              className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 overflow-hidden cursor-grab active:cursor-grabbing hover:opacity-80 transition-opacity"
                              style={{
                                top: `${top}px`,
                                height: `${height}px`,
                                backgroundColor: vc.bg,
                                borderLeft: `3px solid ${vc.border}`,
                              }}
                              onClick={() => setSelectedVisit(visit)}
                            >
                              <p className="text-[10px] font-semibold truncate" style={{ color: vc.text }}>{visit.clientName}</p>
                              <p className="text-[9px] text-gray-600 truncate">{visit.jobTitle}</p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Visit counts */}
              <div className="grid grid-cols-[60px_repeat(7,1fr)] border-t border-gray-200">
                <div className="p-1" />
                {weekDays.map((day, i) => {
                  const count = getVisitsForDay(day).length;
                  return (
                    <div key={i} className="p-1 text-center border-l border-gray-200">
                      <span className="text-[10px] text-gray-400">{count} Visit{count !== 1 ? 's' : ''}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Unscheduled sidebar */}
        <div className="w-64 shrink-0">
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Unscheduled</h3>
            {unscheduledJobs.length === 0 ? (
              <p className="text-xs text-gray-400">No unscheduled jobs</p>
            ) : (
              <div className="space-y-2">
                {unscheduledJobs.map(job => {
                  const client = clients.find(c => c.id === job.clientId);
                  return (
                    <div
                      key={job.id}
                      draggable
                      onDragStart={() => { sessionStorage.setItem('dnd-schedule', JSON.stringify({ type: 'unscheduled-job', jobId: job.id })); }}
                      className="block p-2 rounded-lg border border-yellow-200 bg-yellow-50 hover:bg-yellow-100 transition-colors cursor-grab active:cursor-grabbing"
                    >
                      <p className="text-xs font-medium text-gray-900 truncate">{job.title}</p>
                      {client && <p className="text-[10px] text-gray-500 truncate">{client.firstName} {client.lastName}</p>}
                      {job.lineItems && job.lineItems.length > 0 && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{job.lineItems.length} item{job.lineItems.length > 1 ? 's' : ''}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visit Detail Popup */}
      {selectedVisit && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => setSelectedVisit(null)} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-5 z-10">
            <button onClick={() => setSelectedVisit(null)} className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded"><X size={18} className="text-gray-400" /></button>

            <div className="mb-4">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${selectedVisit.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {selectedVisit.status.charAt(0).toUpperCase() + selectedVisit.status.slice(1)}
              </span>
              <h3 className="text-lg font-semibold text-gray-900 mt-2">{selectedVisit.jobTitle}</h3>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <p className="text-gray-500">Job #{selectedVisit.jobNumber}</p>
              <div className="flex items-start gap-2"><MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" /><span className="text-gray-700">{selectedVisit.address}</span></div>
              <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /><span className="text-gray-700">{selectedVisit.phone}</span></div>
              {selectedVisit.startTime && selectedVisit.endTime && (
                <div className="flex items-center gap-2"><Clock size={14} className="text-gray-400" /><span className="text-gray-700">{selectedVisit.date} &middot; {selectedVisit.startTime} – {selectedVisit.endTime}</span></div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-500">Team:</span>
                  {selectedVisit.assignedTo.length > 0 ? (
                    <div className="flex items-center gap-1">
                      {selectedVisit.assignedTo.map(id => {
                        const m = getTeamMember(id);
                        return m ? (
                          <span key={id} className="inline-flex items-center gap-1 text-xs">
                            <span className="w-5 h-5 rounded-full text-white text-[9px] flex items-center justify-center font-bold" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</span>
                            {m.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  ) : <span className="text-gray-400">Unassigned</span>}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {teamMembers.filter(m => m.active !== false).map(m => {
                    const isAssigned = selectedVisit.assignedTo.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          const job = jobs.find(j => j.id === selectedVisit.jobId);
                          if (!job) return;
                          const newAssigned = isAssigned
                            ? selectedVisit.assignedTo.filter(id => id !== m.id)
                            : [...selectedVisit.assignedTo, m.id];
                          const updatedVisits = job.visits.map(v =>
                            v.id === selectedVisit.visitId ? { ...v, assignedTo: newAssigned } : v
                          );
                          updateJob(selectedVisit.jobId, { visits: updatedVisits, assignedTo: Array.from(new Set(updatedVisits.flatMap(v => v.assignedTo))) });
                          setSelectedVisit({ ...selectedVisit, assignedTo: newAssigned });
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-colors ${
                          isAssigned
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span className="w-4 h-4 rounded-full text-white text-[8px] flex items-center justify-center font-bold" style={{ backgroundColor: m.color }}>{m.name.charAt(0)}</span>
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4">
              <Link href={`/jobs/${selectedVisit.jobId}`} className="btn btn-outline text-xs flex-1 justify-center" onClick={() => setSelectedVisit(null)}>
                View Details
              </Link>
              {selectedVisit.status !== 'completed' && (
                <button
                  className="btn btn-primary text-xs flex-1 justify-center"
                  onClick={() => handleMarkComplete(selectedVisit)}
                >
                  <CheckCircle2 size={13} /> Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Final Visit Completed Modal */}
      <Modal isOpen={showFinalVisitModal} onClose={() => setShowFinalVisitModal(false)} title="Final visit completed">
        {!showScheduleNewVisit ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">All visits for this job have been completed. What would you like to do?</p>
            <div className="flex flex-col gap-3">
              <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left" onClick={handleCloseJob}>
                <CheckCircle2 size={20} className="text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Close Job</p>
                  <p className="text-xs text-gray-500">Work is finished. Job status will change to &quot;Requires Invoicing&quot;.</p>
                </div>
              </button>
              <button className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left" onClick={() => setShowScheduleNewVisit(true)}>
                <CalendarPlus size={20} className="text-blue-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Schedule New Visit</p>
                  <p className="text-xs text-gray-500">Work is not finished. Schedule another day to continue.</p>
                </div>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Schedule a new visit for this job:</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
                <input type="date" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={newVisitDate} onChange={e => setNewVisitDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Start time</label>
                <input type="time" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={newVisitStart} onChange={e => setNewVisitStart(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">End time</label>
                <input type="time" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" value={newVisitEnd} onChange={e => setNewVisitEnd(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button className="btn btn-outline text-xs" onClick={() => setShowScheduleNewVisit(false)}>Back</button>
              <button className="btn btn-primary text-xs" disabled={!newVisitDate} onClick={handleScheduleNewVisit}>Save</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
