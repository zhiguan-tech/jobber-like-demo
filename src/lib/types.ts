export interface SiteContact {
  name: string;
  email: string;
  phone: string;
}

export interface ClientContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
}

export interface InternalNote {
  id: string;
  text: string;
  fileName?: string;
  fileDataUrl?: string;
  createdAt: string;
  author: string;
}

export interface PropertyAddress {
  id: string;
  street: string;
  street2?: string;
  city: string;
  province: string;
  postalCode: string;
  country?: string;
  gstRate?: number;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName?: string;
  address: {
    street: string;
    street2?: string;
    city: string;
    province: string;
    postalCode: string;
    country?: string;
  };
  billingAddressSame?: boolean;
  billingAddress?: {
    street: string;
    street2?: string;
    city: string;
    province: string;
    postalCode: string;
    country?: string;
  };
  gstRate?: number;
  referral?: string;
  ownerType?: string;
  propertyManagementFirm?: string;
  website?: string;
  description?: string;
  division?: string;
  apEmail?: string;
  siteContact?: SiteContact;
  contacts?: ClientContact[];
  additionalAddresses?: PropertyAddress[];
  notes?: InternalNote[];
  source?: string;
  status?: 'lead' | 'active' | 'inactive';
  tags: string[];
  createdAt: string;
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  status: 'new' | 'assessed' | 'converted' | 'archived';
  serviceDetails: string;
  preferredDate1: string;
  preferredDate2?: string;
  preferredTime: 'any' | 'morning' | 'afternoon';
  createdAt: string;
}

export interface QuoteLineItem {
  id: string;
  name: string;
  description: string;
  qty: number;
  unitPrice: number;
}

export interface Quote {
  id: string;
  quoteNumber: number;
  clientId: string;
  requestId?: string;
  title: string;
  status: 'draft' | 'sent' | 'approved' | 'archived';
  lineItems: QuoteLineItem[];
  discount: number;
  taxRate: number;
  depositRequired: number;
  validUntil: string;
  createdAt: string;
  sentAt?: string;
  approvedAt?: string;
  salesperson: string;
  estimator?: string;
  source?: string;
  division?: string;
  contractText?: string;
  internalNotes?: InternalNote[];
  rateOpportunity: number;
}

export interface Job {
  id: string;
  jobNumber: number;
  clientId: string;
  quoteId?: string;
  taskId?: string;
  title: string;
  workforceUnit?: string;
  status: 'draft' | 'active' | 'completed' | 'requires-invoicing' | 'archived';
  jobType: 'one-off' | 'recurring';
  visits: Visit[];
  assignedTo: string[];
  lineItems?: QuoteLineItem[];
  notes: string;
  visitInstructions?: string;
  internalNotes?: InternalNote[];
  createdAt: string;
}

export interface Visit {
  id: string;
  jobId: string;
  date: string;
  startTime?: string;
  endTime?: string;
  status: 'scheduled' | 'in-progress' | 'completed';
  assignedTo: string[];
}

export interface Invoice {
  id: string;
  invoiceNumber: number;
  clientId: string;
  jobId?: string;
  status: 'draft' | 'sent' | 'paid' | 'past-due';
  lineItems: QuoteLineItem[];
  discount: number;
  taxRate: number;
  issuedAt: string;
  dueDate: string;
  paidAt?: string;
  amountPaid: number;
  sentToEmail?: string;
  internalNotes?: InternalNote[];
}

export type UserRole = 'owner' | 'admin' | 'teamMember';

export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: string;
  userRole: UserRole;
  color: string;
  avatar?: string;
  active?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  unitPrice: number;
  category?: string;
  active: boolean;
}

export interface TaskLineItem extends QuoteLineItem {
  allocatedQty: number;
  completedQty: number;
}

export interface Task {
  id: string;
  taskNumber: number;
  clientId: string;
  quoteId: string;
  title: string;
  status: 'active' | 'completed' | 'archived';
  lineItems: TaskLineItem[];
  discount: number;
  taxRate: number;
  jobIds: string[];
  createdAt: string;
}

export function getSubtotal(lineItems: QuoteLineItem[], discount: number): number {
  const raw = lineItems.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);
  return raw - discount;
}

export function getTax(lineItems: QuoteLineItem[], discount: number, taxRate: number): number {
  return getSubtotal(lineItems, discount) * taxRate;
}

export function getTotal(lineItems: QuoteLineItem[], discount: number, taxRate: number): number {
  const subtotal = getSubtotal(lineItems, discount);
  return subtotal + subtotal * taxRate;
}
