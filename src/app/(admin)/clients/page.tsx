'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import Modal from '@/components/Modal';
import Link from 'next/link';
import { Plus, Search, ChevronDown } from 'lucide-react';

const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500';

export default function ClientsPage() {
  const { clients, quotes, jobs, addClient, generateId } = useApp();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form state — Primary Contact
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  // Address
  const [street, setStreet] = useState('');
  const [street2, setStreet2] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('British Columbia');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('Canada');
  const [gstRate, setGstRate] = useState('5');
  const [billingAddressSame, setBillingAddressSame] = useState(true);
  // Extended fields
  const [referral, setReferral] = useState('');
  const [ownerType, setOwnerType] = useState('House');
  const [propertyManagementFirm, setPropertyManagementFirm] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [division, setDivision] = useState('');
  const [apEmail, setApEmail] = useState('');
  const [source, setSource] = useState('');
  // Site Contact
  const [siteContactName, setSiteContactName] = useState('');
  const [siteContactEmail, setSiteContactEmail] = useState('');
  const [siteContactPhone, setSiteContactPhone] = useState('');
  // Tags
  const [tags, setTags] = useState('');

  // KPI calculations
  const newLeads = clients.filter(c => c.status === 'lead').length;
  const newClients = clients.filter(c => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return new Date(c.createdAt) >= thirtyDaysAgo;
  }).length;
  const totalActive = clients.filter(c => c.status !== 'inactive').length;

  // All unique tags
  const allTags = Array.from(new Set(clients.flatMap(c => c.tags)));

  // Filtering
  const filtered = clients.filter(c => {
    if (filterTag !== 'all' && !c.tags.includes(filterTag)) return false;
    if (filterStatus !== 'all' && (c.status || 'active') !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        (c.companyName && c.companyName.toLowerCase().includes(q)) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.address.street.toLowerCase().includes(q) ||
        c.address.city.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const tagColor = (tag: string) => {
    switch (tag.toLowerCase()) {
      case 'residential': return 'badge-blue';
      case 'commercial': return 'badge-purple';
      case 'recurring': return 'badge-green';
      case 'vip': return 'badge-yellow';
      default: return 'badge-gray';
    }
  };

  // Last activity for a client
  const getLastActivity = (clientId: string) => {
    const dates: string[] = [];
    quotes.filter(q => q.clientId === clientId).forEach(q => dates.push(q.createdAt));
    jobs.filter(j => j.clientId === clientId).forEach(j => dates.push(j.createdAt));
    if (dates.length === 0) return null;
    return dates.sort().reverse()[0];
  };

  const resetForm = () => {
    setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setCompanyName('');
    setStreet(''); setStreet2(''); setCity(''); setProvince('British Columbia'); setPostalCode(''); setCountry('Canada');
    setGstRate('5'); setBillingAddressSame(true);
    setReferral(''); setOwnerType('House'); setPropertyManagementFirm(''); setWebsite('');
    setDescription(''); setDivision(''); setApEmail(''); setSource('');
    setSiteContactName(''); setSiteContactEmail(''); setSiteContactPhone('');
    setTags('');
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    addClient({
      id: generateId('c'),
      firstName,
      lastName,
      email,
      phone,
      companyName: companyName || undefined,
      address: { street, street2: street2 || undefined, city, province, postalCode, country },
      billingAddressSame,
      gstRate: parseFloat(gstRate) / 100,
      referral: referral || undefined,
      ownerType: ownerType || undefined,
      propertyManagementFirm: propertyManagementFirm || undefined,
      website: website || undefined,
      description: description || undefined,
      division: division || undefined,
      apEmail: apEmail || undefined,
      source: source || undefined,
      siteContact: siteContactName ? {
        name: siteContactName,
        email: siteContactEmail,
        phone: siteContactPhone,
      } : undefined,
      status: 'active',
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      createdAt: today,
    });
    resetForm();
    setShowCreateModal(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> New Client
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card">
          <p className="text-sm text-gray-500">New leads</p>
          <p className="text-2xl font-bold text-gray-900">{newLeads}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">New clients</p>
          <p className="text-2xl font-bold text-gray-900">{newClients} <span className="text-sm font-normal text-gray-400">last 30 days</span></p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total active clients</p>
          <p className="text-2xl font-bold text-gray-900">{totalActive}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>
          <div className="relative">
            <select
              value={filterTag}
              onChange={e => setFilterTag(e.target.value)}
              className="appearance-none border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            >
              <option value="all">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="appearance-none border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            >
              <option value="all">All Status</option>
              <option value="lead">Leads</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-3">Filtered clients ({filtered.length} results)</p>

        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Tags</th>
              <th>Status</th>
              <th>Last Activity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(client => {
              const lastActivity = getLastActivity(client.id);
              return (
                <tr key={client.id} className="cursor-pointer" onClick={() => router.push(`/clients/${client.id}`)}>
                  <td>
                    <Link href={`/clients/${client.id}`} className="font-medium text-gray-900 hover:text-green-600">
                      {client.firstName} {client.lastName}
                    </Link>
                    {client.companyName && <p className="text-xs text-gray-500">{client.companyName}</p>}
                  </td>
                  <td className="text-gray-600 text-sm">
                    {client.address.street}, {client.address.city}, {client.address.province}
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {client.tags.map(tag => (
                        <span key={tag} className={`badge ${tagColor(tag)}`}>{tag}</span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${
                      (client.status || 'active') === 'active' ? 'badge-green' :
                      client.status === 'lead' ? 'badge-blue' : 'badge-gray'
                    }`}>
                      {(client.status || 'active').charAt(0).toUpperCase() + (client.status || 'active').slice(1)}
                    </span>
                  </td>
                  <td className="text-gray-500 text-sm">{lastActivity || '—'}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-8">No clients found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); resetForm(); }} title="New Client" size="lg">
        <form onSubmit={handleCreateClient} className="space-y-6">

          {/* Primary Contact Details */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Primary contact details</h3>
            <p className="text-xs text-gray-500 mb-4">Provide the main point of contact to ensure smooth communication and reliable client records.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} className={inputClass} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} className={inputClass} />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Extended Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Referral</label>
              <input type="text" value={referral} onChange={e => setReferral(e.target.value)} placeholder="Referral" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
              <select value={ownerType} onChange={e => setOwnerType(e.target.value)} className={inputClass}>
                <option value="House">House</option>
                <option value="Strata">Strata</option>
                <option value="Commercial">Commercial</option>
                <option value="Government">Government</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Management Firm</label>
              <input type="text" value={propertyManagementFirm} onChange={e => setPropertyManagementFirm(e.target.value)} placeholder="Property Management Firm" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <input type="text" value={website} onChange={e => setWebsite(e.target.value)} placeholder="Website" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Division</label>
              <input type="text" value={division} onChange={e => setDivision(e.target.value)} placeholder="Division" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">AP Email</label>
              <input type="email" value={apEmail} onChange={e => setApEmail(e.target.value)} placeholder="AP Email" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <input type="text" value={source} onChange={e => setSource(e.target.value)} placeholder="Source" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
              <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. Residential, VIP" className={inputClass} />
            </div>
          </div>

          {/* Description (rich text / multi-line) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Building details: age, materials, number of units, special requirements..."
              className={`${inputClass} resize-y`}
            />
          </div>

          <hr className="border-gray-200" />

          {/* Site Contact Section */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Site Contact</h3>
            <p className="text-xs text-gray-500 mb-4">On-site contact person for scheduling and access.</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input type="text" value={siteContactName} onChange={e => setSiteContactName(e.target.value)} placeholder="Contact name" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={siteContactEmail} onChange={e => setSiteContactEmail(e.target.value)} placeholder="Contact email" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={siteContactPhone} onChange={e => setSiteContactPhone(e.target.value)} placeholder="Contact phone" className={inputClass} />
              </div>
            </div>
          </div>

          <hr className="border-gray-200" />

          {/* Property Address */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">Property address</h3>
            <p className="text-xs text-gray-500 mb-4">Enter the primary service address, billing address, or any additional locations where services may take place.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street 1 *</label>
                <input type="text" required value={street} onChange={e => setStreet(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Street 2</label>
                <input type="text" value={street2} onChange={e => setStreet2(e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input type="text" required value={city} onChange={e => setCity(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Province *</label>
                  <input type="text" required value={province} onChange={e => setProvince(e.target.value)} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code *</label>
                  <input type="text" required value={postalCode} onChange={e => setPostalCode(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select value={country} onChange={e => setCountry(e.target.value)} className={inputClass}>
                    <option value="Canada">Canada</option>
                    <option value="United States">United States</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST</label>
                  <input type="text" value={`${gstRate}%`} readOnly className={`${inputClass} bg-gray-50 text-gray-500`} />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={billingAddressSame} onChange={e => setBillingAddressSame(e.target.checked)} className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500" />
                <span className="text-sm text-gray-700">Billing address is the same as property address</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }} className="btn btn-outline">Cancel</button>
            <button type="submit" className="btn btn-primary">Create Client</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
