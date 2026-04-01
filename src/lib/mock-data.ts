import { Client, ServiceRequest, Quote, Job, Invoice, TeamMember, Product, Task } from './types';

export const teamMembers: TeamMember[] = [
  { id: 'tm1', name: 'Joe Smith', email: 'joe@spjobber.com', phone: '(780) 555-1001', role: 'Field Technician', userRole: 'teamMember', color: '#16a34a', active: true },
  { id: 'tm2', name: 'Sarah Chen', email: 'sarah@spjobber.com', phone: '(780) 555-1002', role: 'Field Technician', userRole: 'teamMember', color: '#2563eb', active: true },
  { id: 'tm3', name: 'Mike Johnson', email: 'mike@spjobber.com', phone: '(780) 555-1003', role: 'Manager', userRole: 'admin', color: '#9333ea', active: true },
];

export const products: Product[] = [
  { id: 'prod1', name: 'Window Cleaning', description: 'Interior and exterior window cleaning service. Includes squeegee, detailing, and screen cleaning.', unitPrice: 8.00, category: 'Cleaning', active: true },
  { id: 'prod2', name: 'Power Washing', description: 'High-pressure washing for driveways, walkways, building exteriors, and parking areas.', unitPrice: 0.50, category: 'Cleaning', active: true },
  { id: 'prod3', name: 'Gutter Cleaning', description: 'Full gutter cleanout including downspout flushing. Debris removal and inspection.', unitPrice: 4.00, category: 'Maintenance', active: true },
  { id: 'prod4', name: 'Building Maintenance', description: 'General building maintenance including minor repairs, caulking, and touch-up painting.', unitPrice: 85.00, category: 'Maintenance', active: true },
  { id: 'prod5', name: 'Carpet Cleaning', description: 'Professional hot water extraction carpet cleaning per room.', unitPrice: 60.00, category: 'Cleaning', active: true },
  { id: 'prod6', name: 'Lawn Mowing', description: 'Weekly lawn mowing service including edging and clippings removal.', unitPrice: 80.00, category: 'Landscaping', active: true },
  { id: 'prod7', name: 'Garden Maintenance', description: 'Weeding, pruning, mulching, and seasonal planting.', unitPrice: 200.00, category: 'Landscaping', active: true },
];

export const tasks: Task[] = [];

export const clients: Client[] = [
  {
    id: 'c1',
    firstName: 'EPS 960',
    lastName: '- Latitude',
    email: 'arkhive@latitude.ca',
    phone: '(604) 834-9518',
    companyName: 'Knightsbridge Enterprises Inc.',
    address: { street: '14358 60 Avenue', city: 'Surrey', province: 'British Columbia', postalCode: 'V3X 0G3', country: 'Canada' },
    billingAddressSame: true,
    gstRate: 0.05,
    ownerType: 'House',
    propertyManagementFirm: 'Knightsbridge Enterprises Inc.',
    website: 'www.latitude-surrey.ca',
    description: 'High-rise residential complex, 25 stories, built 2018. Exterior materials: glass curtain wall, aluminum composite panel. Annual window cleaning required for all balconies and common areas.',
    siteContact: { name: 'Zderika', email: 'reiki4west@gmail.com', phone: '(778) 995-0180' },
    source: 'Referral',
    status: 'active',
    tags: ['Commercial', 'Recurring'],
    createdAt: '2025-08-15',
  },
  {
    id: 'c2',
    firstName: 'NW2804',
    lastName: '- Yorkson Manor',
    email: 'emily.w@yorksonmanor.com',
    phone: '(604) 555-8842',
    companyName: 'Williams Enterprises',
    address: { street: '9507 206 Street', city: 'Langley Township', province: 'British Columbia', postalCode: 'V1M 3Z7', country: 'Canada' },
    billingAddressSame: true,
    gstRate: 0.05,
    ownerType: 'House',
    propertyManagementFirm: 'Centurion Property Associates',
    description: 'Mid-rise strata, 6 stories, 120 units. Built 2012. Cedar siding with vinyl windows. Power washing of common walkways needed quarterly.',
    siteContact: { name: 'Tom Henderson', email: 'tom@centurionpa.ca', phone: '(604) 555-7721' },
    source: 'Website',
    status: 'active',
    tags: ['Commercial'],
    createdAt: '2025-07-20',
  },
  {
    id: 'c3',
    firstName: 'EP83997',
    lastName: '- Crescentview',
    email: 'david.park@gmail.com',
    phone: '(604) 555-3917',
    address: { street: '210 Connaught Crescent', city: 'North Vancouver', province: 'British Columbia', postalCode: 'V7N 4H6', country: 'Canada' },
    billingAddressSame: true,
    gstRate: 0.05,
    ownerType: 'House',
    description: 'Low-rise wood-frame building, 4 stories, 48 units. Built 1995. Needs annual gutter cleaning and exterior window wash.',
    status: 'active',
    tags: ['Residential'],
    createdAt: '2025-09-01',
  },
  {
    id: 'c4',
    firstName: 'EPS 1080',
    lastName: '- Castle Field',
    email: 'p.sutherland@castlefield.ca',
    phone: '(604) 555-6104',
    companyName: 'Sutherland Strata Mgmt',
    address: { street: '45225 Wells Road', city: 'Chilliwack', province: 'British Columbia', postalCode: 'V2P 1Y9', country: 'Canada' },
    billingAddressSame: false,
    billingAddress: { street: '100-8678 Greenall Ave', city: 'Burnaby', province: 'British Columbia', postalCode: 'V5J 3M6', country: 'Canada' },
    gstRate: 0.05,
    ownerType: 'House',
    propertyManagementFirm: 'Sutherland Strata Mgmt',
    website: 'www.castlefieldstrata.ca',
    description: 'Townhouse complex, 32 units across 4 blocks. Built 2005. Hardie board siding. Annual power wash and gutter clean required.',
    siteContact: { name: 'Patricia Sutherland', email: 'p.sutherland@castlefield.ca', phone: '(604) 555-6104' },
    source: 'Cold Call',
    status: 'active',
    tags: ['Residential', 'VIP'],
    createdAt: '2025-06-10',
  },
  {
    id: 'c5',
    firstName: 'Robert',
    lastName: 'Alvarez',
    email: 'r.alvarez@company.ca',
    phone: '(587) 555-2200',
    companyName: 'Alvarez Property Mgmt',
    address: { street: '11403 University Ave NW', city: 'Edmonton', province: 'Alberta', postalCode: 'T6G 1Y9', country: 'Canada' },
    billingAddressSame: true,
    gstRate: 0.05,
    propertyManagementFirm: 'Alvarez Property Mgmt',
    status: 'active',
    tags: ['Commercial', 'Recurring'],
    createdAt: '2025-05-22',
  },
];

export const requests: ServiceRequest[] = [
  {
    id: 'r1',
    clientId: 'c1',
    status: 'converted',
    serviceDetails: 'I need some work done - regular cleaning service on a weekly basis.',
    preferredDate1: '2025-09-30',
    preferredDate2: '2025-10-03',
    preferredTime: 'any',
    createdAt: '2025-09-28',
  },
  {
    id: 'r2',
    clientId: 'c3',
    status: 'new',
    serviceDetails: 'Need lawn mowing and garden maintenance for spring season.',
    preferredDate1: '2025-10-15',
    preferredTime: 'morning',
    createdAt: '2025-10-10',
  },
  {
    id: 'r3',
    clientId: 'c4',
    status: 'assessed',
    serviceDetails: 'Window cleaning for 2-story house, inside and outside.',
    preferredDate1: '2025-10-20',
    preferredDate2: '2025-10-22',
    preferredTime: 'afternoon',
    createdAt: '2025-10-12',
  },
  {
    id: 'r4',
    clientId: 'c2',
    status: 'new',
    serviceDetails: 'Office deep cleaning after renovation. Approx 3000 sqft.',
    preferredDate1: '2025-11-01',
    preferredTime: 'any',
    createdAt: '2025-10-18',
  },
];

export const quotes: Quote[] = [
  {
    id: 'q1',
    quoteNumber: 10,
    clientId: 'c1',
    requestId: 'r1',
    title: 'Weekly Cleaning Service',
    status: 'approved',
    lineItems: [
      { id: 'ql1', name: 'Weekly Service', description: 'Regular cleaning service on a weekly basis, maintaining cleanliness by dusting, vacuuming, and mopping of all rooms.', qty: 1, unitPrice: 250 },
      { id: 'ql2', name: 'Initial Service', description: 'Extra charge for the first cleaning session, focusing on bringing the space to baseline.', qty: 1, unitPrice: 100 },
    ],
    discount: 0,
    taxRate: 0.05,
    depositRequired: 26.25,
    validUntil: '2025-10-29',
    createdAt: '2025-09-29',
    sentAt: '2025-09-29',
    approvedAt: '2025-09-30',
    salesperson: 'Joe',
    rateOpportunity: 4,
  },
  {
    id: 'q2',
    quoteNumber: 11,
    clientId: 'c3',
    title: 'Lawn Maintenance Package',
    status: 'sent',
    lineItems: [
      { id: 'ql3', name: 'Lawn Mowing', description: 'Weekly lawn mowing service', qty: 4, unitPrice: 80 },
      { id: 'ql4', name: 'Garden Maintenance', description: 'Weeding, pruning, and mulching', qty: 1, unitPrice: 200 },
    ],
    discount: 20,
    taxRate: 0.05,
    depositRequired: 50,
    validUntil: '2025-11-15',
    createdAt: '2025-10-12',
    sentAt: '2025-10-12',
    salesperson: 'Sarah',
    rateOpportunity: 3,
  },
  {
    id: 'q3',
    quoteNumber: 12,
    clientId: 'c4',
    title: 'Window Cleaning - Full House',
    status: 'draft',
    lineItems: [
      { id: 'ql5', name: 'Exterior Windows', description: 'All exterior window cleaning, 2 stories', qty: 1, unitPrice: 300 },
      { id: 'ql6', name: 'Interior Windows', description: 'All interior window cleaning', qty: 1, unitPrice: 150 },
      { id: 'ql7', name: 'Screen Cleaning', description: 'Removal, cleaning, and reinstallation of screens', qty: 1, unitPrice: 75 },
    ],
    discount: 0,
    taxRate: 0.05,
    depositRequired: 0,
    validUntil: '2025-11-20',
    createdAt: '2025-10-15',
    salesperson: 'Mike',
    rateOpportunity: 5,
  },
];

export const jobs: Job[] = [];

export const invoices: Invoice[] = [];

// Helper lookups
export function getClient(id: string): Client | undefined {
  return clients.find(c => c.id === id);
}

export function getClientName(id: string): string {
  const c = getClient(id);
  return c ? `${c.firstName} ${c.lastName}` : 'Unknown';
}

export function getQuote(id: string): Quote | undefined {
  return quotes.find(q => q.id === id);
}

export function getJob(id: string): Job | undefined {
  return jobs.find(j => j.id === id);
}

export function getTeamMember(id: string): TeamMember | undefined {
  return teamMembers.find(t => t.id === id);
}
