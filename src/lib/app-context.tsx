'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Client, ServiceRequest, Quote, QuoteLineItem, Job, Invoice, TeamMember, Product, Task, TaskLineItem } from './types';
import {
  clients as seedClients,
  requests as seedRequests,
  quotes as seedQuotes,
  jobs as seedJobs,
  invoices as seedInvoices,
  teamMembers as seedTeamMembers,
  products as seedProducts,
  tasks as seedTasks,
} from './mock-data';

// ── localStorage persistence ──────────────────────────────────────────

const STORAGE_KEY = 'jobber-demo-data';

interface PersistedState {
  clients: Client[];
  requests: ServiceRequest[];
  quotes: Quote[];
  jobs: Job[];
  invoices: Invoice[];
  teamMembers: TeamMember[];
  products: Product[];
  tasks: Task[];
}

function loadState(): PersistedState {
  if (typeof window === 'undefined') return seedState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedState;
      // basic validation – if any array is missing fall back to seed
      if (parsed.clients && parsed.requests && parsed.quotes && parsed.jobs && parsed.invoices && parsed.teamMembers && parsed.products && parsed.tasks) {
        return parsed;
      }
    }
  } catch { /* corrupted – ignore */ }
  return seedState();
}

function seedState(): PersistedState {
  return {
    clients: seedClients,
    requests: seedRequests,
    quotes: seedQuotes,
    jobs: seedJobs,
    invoices: seedInvoices,
    teamMembers: seedTeamMembers,
    products: seedProducts,
    tasks: seedTasks,
  };
}

function saveState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded – ignore */ }
}

// ── Context types ─────────────────────────────────────────────────────

interface AppContextValue extends PersistedState {
  // Client CRUD
  addClient: (client: Client) => void;
  updateClient: (id: string, data: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Request CRUD
  addRequest: (req: ServiceRequest) => void;
  updateRequest: (id: string, data: Partial<ServiceRequest>) => void;
  deleteRequest: (id: string) => void;

  // Quote CRUD
  addQuote: (quote: Quote) => void;
  updateQuote: (id: string, data: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;

  // Job CRUD
  addJob: (job: Job) => void;
  updateJob: (id: string, data: Partial<Job>) => void;
  deleteJob: (id: string) => void;

  // Invoice CRUD
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, data: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  // TeamMember CRUD
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (id: string, data: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;

  // Product CRUD
  addProduct: (product: Product) => void;
  updateProduct: (id: string, data: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Task CRUD
  updateTask: (id: string, data: Partial<Task>) => void;

  // Business flow transitions
  convertRequestToQuote: (requestId: string) => string | null;
  convertRequestToJob: (requestId: string) => string | null;
  convertQuoteToTask: (quoteId: string) => string | null;
  allocateJobFromTask: (taskId: string, allocations: { lineItemId: string; qty: number }[], options: { assignedTo: string[]; visitDate: string; startTime?: string; endTime?: string; scheduleLater?: boolean; anytime?: boolean; jobNotes?: string; visitInstructions?: string }) => string | null;
  completeJob: (jobId: string) => void;
  createInvoiceFromJob: (jobId: string) => string | null;

  // Lookups
  getClient: (id: string) => Client | undefined;
  getClientName: (id: string) => string;
  getQuote: (id: string) => Quote | undefined;
  getJob: (id: string) => Job | undefined;
  getTeamMember: (id: string) => TeamMember | undefined;
  getAssignableMembers: () => TeamMember[];

  // ID generation helpers
  nextQuoteNumber: () => number;
  nextJobNumber: () => number;
  nextInvoiceNumber: () => number;
  generateId: (prefix: string) => string;

  // Reset to seed data
  resetData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [clients, setClients] = useState<Client[]>(() => loadState().clients);
  const [requests, setRequests] = useState<ServiceRequest[]>(() => loadState().requests);
  const [quotes, setQuotes] = useState<Quote[]>(() => loadState().quotes);
  const [jobs, setJobs] = useState<Job[]>(() => loadState().jobs);
  const [invoices, setInvoices] = useState<Invoice[]>(() => loadState().invoices);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => loadState().teamMembers);
  const [products, setProducts] = useState<Product[]>(() => loadState().products);
  const [tasks, setTasks] = useState<Task[]>(() => loadState().tasks);

  // Persist to localStorage on every state change (skip initial mount)
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    saveState({ clients, requests, quotes, jobs, invoices, teamMembers, products, tasks });
  }, [clients, requests, quotes, jobs, invoices, teamMembers, products, tasks]);

  // Reset to seed data
  const resetData = useCallback(() => {
    const seed = seedState();
    setClients(seed.clients);
    setRequests(seed.requests);
    setQuotes(seed.quotes);
    setJobs(seed.jobs);
    setInvoices(seed.invoices);
    setTeamMembers(seed.teamMembers);
    setProducts(seed.products);
    setTasks(seed.tasks);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // ID helpers
  const generateId = useCallback((prefix: string) => `${prefix}${Date.now()}`, []);
  const nextQuoteNumber = useCallback(() => {
    const max = quotes.reduce((m, q) => Math.max(m, q.quoteNumber), 0);
    return max + 1;
  }, [quotes]);
  const nextJobNumber = useCallback(() => {
    const max = jobs.reduce((m, j) => Math.max(m, j.jobNumber), 0);
    return max + 1;
  }, [jobs]);
  const nextInvoiceNumber = useCallback(() => {
    const max = invoices.reduce((m, i) => Math.max(m, i.invoiceNumber), 0);
    return max + 1;
  }, [invoices]);

  // Lookups
  const getClient = useCallback((id: string) => clients.find(c => c.id === id), [clients]);
  const getClientName = useCallback((id: string) => {
    const c = clients.find(cl => cl.id === id);
    return c ? `${c.firstName} ${c.lastName}` : 'Unknown';
  }, [clients]);
  const getQuote = useCallback((id: string) => quotes.find(q => q.id === id), [quotes]);
  const getJob = useCallback((id: string) => jobs.find(j => j.id === id), [jobs]);
  const getTeamMember = useCallback((id: string) => teamMembers.find(t => t.id === id), [teamMembers]);

  // Client CRUD
  const addClient = useCallback((client: Client) => setClients(prev => [...prev, client]), []);
  const updateClient = useCallback((id: string, data: Partial<Client>) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);
  const deleteClient = useCallback((id: string) => setClients(prev => prev.filter(c => c.id !== id)), []);

  // Request CRUD
  const addRequest = useCallback((req: ServiceRequest) => setRequests(prev => [...prev, req]), []);
  const updateRequest = useCallback((id: string, data: Partial<ServiceRequest>) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
  }, []);
  const deleteRequest = useCallback((id: string) => setRequests(prev => prev.filter(r => r.id !== id)), []);

  // Quote CRUD
  const addQuote = useCallback((quote: Quote) => setQuotes(prev => [...prev, quote]), []);
  const updateQuote = useCallback((id: string, data: Partial<Quote>) => {
    setQuotes(prev => prev.map(q => q.id === id ? { ...q, ...data } : q));
  }, []);
  const deleteQuote = useCallback((id: string) => setQuotes(prev => prev.filter(q => q.id !== id)), []);

  // Job CRUD
  const addJob = useCallback((job: Job) => setJobs(prev => [...prev, job]), []);
  const updateJob = useCallback((id: string, data: Partial<Job>) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...data } : j));
  }, []);
  const deleteJob = useCallback((id: string) => setJobs(prev => prev.filter(j => j.id !== id)), []);

  // Invoice CRUD
  const addInvoice = useCallback((invoice: Invoice) => setInvoices(prev => [...prev, invoice]), []);
  const updateInvoice = useCallback((id: string, data: Partial<Invoice>) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
  }, []);
  const deleteInvoice = useCallback((id: string) => setInvoices(prev => prev.filter(i => i.id !== id)), []);

  // TeamMember CRUD
  const addTeamMember = useCallback((member: TeamMember) => setTeamMembers(prev => [...prev, member]), []);
  const updateTeamMember = useCallback((id: string, data: Partial<TeamMember>) => {
    setTeamMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
  }, []);
  const deleteTeamMember = useCallback((id: string) => setTeamMembers(prev => prev.filter(m => m.id !== id)), []);

  // Product CRUD
  const addProduct = useCallback((product: Product) => setProducts(prev => [...prev, product]), []);
  const updateProduct = useCallback((id: string, data: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);
  const deleteProduct = useCallback((id: string) => setProducts(prev => prev.filter(p => p.id !== id)), []);

  // Task CRUD
  const updateTask = useCallback((id: string, data: Partial<Task>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, []);

  // Lookup: assignable members (active teamMembers)
  const getAssignableMembers = useCallback(() => {
    return teamMembers.filter(m => m.active !== false && (m.userRole === 'teamMember' || m.userRole === 'admin'));
  }, [teamMembers]);

  // Business flow: Request → Quote
  const convertRequestToQuote = useCallback((requestId: string): string | null => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return null;
    const client = clients.find(c => c.id === req.clientId);
    const qNum = quotes.reduce((m, q) => Math.max(m, q.quoteNumber), 0) + 1;
    const newId = `q${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const newQuote: Quote = {
      id: newId,
      quoteNumber: qNum,
      clientId: req.clientId,
      requestId: req.id,
      title: req.serviceDetails.slice(0, 60),
      status: 'draft',
      lineItems: [
        { id: `ql${Date.now()}`, name: 'Service', description: req.serviceDetails, qty: 1, unitPrice: 0 },
      ],
      discount: 0,
      taxRate: 0.05,
      depositRequired: 0,
      validUntil: validUntil.toISOString().split('T')[0],
      createdAt: today,
      salesperson: client ? `${client.firstName}` : 'Unassigned',
      rateOpportunity: 3,
    };

    setQuotes(prev => [...prev, newQuote]);
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'converted' as const } : r));
    return newId;
  }, [requests, clients, quotes]);

  // Business flow: Request → Job (direct)
  const convertRequestToJob = useCallback((requestId: string): string | null => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return null;
    const jNum = jobs.reduce((m, j) => Math.max(m, j.jobNumber), 0) + 1;
    const newId = `j${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    const newJob: Job = {
      id: newId,
      jobNumber: jNum,
      clientId: req.clientId,
      title: req.serviceDetails.slice(0, 60),
      status: 'active',
      jobType: 'one-off',
      visits: [
        {
          id: `v${Date.now()}`,
          jobId: newId,
          date: req.preferredDate1,
          startTime: req.preferredTime === 'morning' ? '09:00' : req.preferredTime === 'afternoon' ? '14:00' : '10:00',
          endTime: req.preferredTime === 'morning' ? '12:00' : req.preferredTime === 'afternoon' ? '17:00' : '13:00',
          status: 'scheduled',
          assignedTo: ['tm1'],
        },
      ],
      assignedTo: ['tm1'],
      notes: req.serviceDetails,
      createdAt: today,
    };

    setJobs(prev => [...prev, newJob]);
    setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'converted' as const } : r));
    return newId;
  }, [requests, jobs]);

  // Business flow: Quote → Task
  const convertQuoteToTask = useCallback((quoteId: string): string | null => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote || quote.status !== 'approved') return null;
    const tNum = tasks.reduce((m, t) => Math.max(m, t.taskNumber), 0) + 1;
    const newId = `task${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    const taskLineItems: TaskLineItem[] = quote.lineItems.map(li => ({
      ...li,
      id: `tli${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
      allocatedQty: 0,
      completedQty: 0,
    }));

    const newTask: Task = {
      id: newId,
      taskNumber: tNum,
      clientId: quote.clientId,
      quoteId: quote.id,
      title: quote.title,
      status: 'active',
      lineItems: taskLineItems,
      discount: quote.discount,
      taxRate: quote.taxRate,
      jobIds: [],
      createdAt: today,
    };

    setTasks(prev => [...prev, newTask]);
    return newId;
  }, [quotes, tasks]);

  // Business flow: Allocate Job from Task
  const allocateJobFromTask = useCallback((
    taskId: string,
    allocations: { lineItemId: string; qty: number }[],
    options: { assignedTo: string[]; visitDate: string; startTime?: string; endTime?: string; scheduleLater?: boolean; anytime?: boolean; jobNotes?: string; visitInstructions?: string }
  ): string | null => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return null;
    const jNum = jobs.reduce((m, j) => Math.max(m, j.jobNumber), 0) + 1;
    const newJobId = `j${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];

    // Build job line items from allocations
    const jobLineItems: QuoteLineItem[] = allocations.map(alloc => {
      const taskLi = task.lineItems.find(li => li.id === alloc.lineItemId);
      return {
        id: `jli${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        name: taskLi?.name || '',
        description: taskLi?.description || '',
        qty: alloc.qty,
        unitPrice: taskLi?.unitPrice || 0,
      };
    });

    const visits = options.scheduleLater ? [] : [{
      id: `v${Date.now()}`,
      jobId: newJobId,
      date: options.visitDate,
      startTime: options.anytime ? undefined : options.startTime,
      endTime: options.anytime ? undefined : options.endTime,
      status: 'scheduled' as const,
      assignedTo: options.assignedTo,
    }];

    const newJob: Job = {
      id: newJobId,
      jobNumber: jNum,
      clientId: task.clientId,
      quoteId: task.quoteId,
      taskId: taskId,
      title: `${task.title} - Job #${jNum}`,
      status: 'active',
      jobType: 'one-off',
      visits,
      assignedTo: options.assignedTo,
      lineItems: jobLineItems,
      notes: options.jobNotes || '',
      visitInstructions: options.visitInstructions || undefined,
      createdAt: today,
    };

    setJobs(prev => [...prev, newJob]);

    // Update task: increment allocatedQty and add jobId
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const updatedLineItems = t.lineItems.map(li => {
        const alloc = allocations.find(a => a.lineItemId === li.id);
        if (!alloc) return li;
        return { ...li, allocatedQty: li.allocatedQty + alloc.qty };
      });
      return { ...t, lineItems: updatedLineItems, jobIds: [...t.jobIds, newJobId] };
    }));

    return newJobId;
  }, [tasks, jobs]);

  // Business flow: Complete Job → requires-invoicing + update task completedQty
  const completeJobFn = useCallback((jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    setJobs(prev => prev.map(j => {
      if (j.id !== jobId) return j;
      return {
        ...j,
        status: 'requires-invoicing' as const,
        visits: j.visits.map(v => ({ ...v, status: 'completed' as const })),
      };
    }));

    // Update parent task's completedQty
    if (job?.taskId && job.lineItems) {
      setTasks(prev => prev.map(t => {
        if (t.id !== job.taskId) return t;
        const updatedLineItems = t.lineItems.map(tli => {
          const jobLi = job.lineItems?.find(jli => jli.name === tli.name);
          if (!jobLi) return tli;
          return { ...tli, completedQty: tli.completedQty + jobLi.qty };
        });
        const allCompleted = updatedLineItems.every(li => li.completedQty >= li.qty);
        return { ...t, lineItems: updatedLineItems, status: allCompleted ? 'completed' as const : t.status };
      }));
    }
  }, [jobs]);

  // Business flow: Job → Invoice
  const createInvoiceFromJob = useCallback((jobId: string): string | null => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return null;
    const quote = job.quoteId ? quotes.find(q => q.id === job.quoteId) : null;
    const iNum = invoices.reduce((m, i) => Math.max(m, i.invoiceNumber), 0) + 1;
    const newId = `i${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    // Prefer job's own lineItems (from task allocation), fallback to quote, then placeholder
    const invoiceLineItems: QuoteLineItem[] = job.lineItems && job.lineItems.length > 0
      ? job.lineItems.map(li => ({ ...li, id: `il${Date.now()}${Math.random().toString(36).slice(2, 6)}` }))
      : quote
        ? quote.lineItems.map(li => ({ ...li, id: `il${Date.now()}${Math.random().toString(36).slice(2, 6)}` }))
        : [{ id: `il${Date.now()}`, name: job.title, description: 'Service completed', qty: 1, unitPrice: 0 }];

    const newInvoice: Invoice = {
      id: newId,
      invoiceNumber: iNum,
      clientId: job.clientId,
      jobId: job.id,
      status: 'draft',
      lineItems: invoiceLineItems,
      discount: quote?.discount ?? 0,
      taxRate: quote?.taxRate ?? 0.05,
      issuedAt: today,
      dueDate: dueDate.toISOString().split('T')[0],
      amountPaid: 0,
    };

    setInvoices(prev => [...prev, newInvoice]);

    // Update job status to completed after invoice created
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'completed' as const } : j));

    return newId;
  }, [jobs, quotes, invoices]);

  const value: AppContextValue = {
    clients, requests, quotes, jobs, invoices, teamMembers, products, tasks,
    addClient, updateClient, deleteClient,
    addRequest, updateRequest, deleteRequest,
    addQuote, updateQuote, deleteQuote,
    addJob, updateJob, deleteJob,
    addInvoice, updateInvoice, deleteInvoice,
    addTeamMember, updateTeamMember, deleteTeamMember,
    addProduct, updateProduct, deleteProduct,
    updateTask,
    convertRequestToQuote, convertRequestToJob,
    convertQuoteToTask, allocateJobFromTask,
    completeJob: completeJobFn, createInvoiceFromJob,
    getClient, getClientName, getQuote, getJob, getTeamMember, getAssignableMembers,
    nextQuoteNumber, nextJobNumber, nextInvoiceNumber, generateId,
    resetData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
