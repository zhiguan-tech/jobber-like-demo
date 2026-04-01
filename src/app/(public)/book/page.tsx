'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Upload, CheckCircle } from 'lucide-react';
import { useApp } from '@/lib/app-context';

export default function BookingForm() {
  const { addClient, addRequest, clients, generateId } = useApp();
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
    agreeEmail: true,
    agreeSms: false,
    street: '',
    unit: '',
    city: '',
    province: '',
    postalCode: '',
    serviceDetails: '',
    preferredDate1: '',
    preferredDate2: '',
    preferredTime: 'any',
  });

  const update = (field: string, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if client with same email already exists
    const existing = clients.find(c => c.email === form.email);
    let clientId: string;

    if (existing) {
      clientId = existing.id;
    } else {
      clientId = generateId('c');
      addClient({
        id: clientId,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        companyName: form.companyName,
        address: {
          street: form.street,
          city: form.city,
          province: form.province,
          postalCode: form.postalCode,
        },
        tags: [],
        createdAt: new Date().toISOString().split('T')[0],
      });
    }

    addRequest({
      id: generateId('r'),
      clientId,
      status: 'new',
      serviceDetails: form.serviceDetails,
      preferredDate1: form.preferredDate1,
      preferredDate2: form.preferredDate2 || undefined,
      preferredTime: form.preferredTime as 'any' | 'morning' | 'afternoon',
      createdAt: new Date().toISOString().split('T')[0],
    });

    setSubmitted(true);
    setTimeout(() => {
      router.push('/requests');
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center bg-white">
        {/* Header */}
        <div className="w-full border-b border-gray-100 py-6 text-center">
          <div className="flex items-center justify-center gap-2">
            <div className="w-10 h-10 bg-[#1a3a4a] rounded-lg flex items-center justify-center text-white font-bold text-sm">
              SP
            </div>
            <span className="text-2xl font-bold text-[#1a3a4a]">Service Provider</span>
          </div>
        </div>

        {/* Confirmation */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="mx-auto mb-6 w-32 h-32 bg-[#f5f0e8] rounded-2xl flex items-center justify-center">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Your request has been confirmed!</h2>
            <p className="text-gray-500 text-sm">
              We will follow up via email or text to confirm the request.
            </p>
            <p className="text-gray-400 text-xs mt-4">Redirecting to requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="w-full border-b border-gray-100 py-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-10 h-10 bg-[#1a3a4a] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            SP
          </div>
          <span className="text-2xl font-bold text-[#1a3a4a]">Service Provider</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-xl mx-auto px-6 py-10">
        {/* Contact Details */}
        <h2 className="text-xl font-bold text-gray-900 mb-6">Contact details</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">First name</label>
            <input
              type="text"
              value={form.firstName}
              onChange={e => update('firstName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Last name</label>
            <input
              type="text"
              value={form.lastName}
              onChange={e => update('lastName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Company name</label>
          <input
            type="text"
            value={form.companyName}
            onChange={e => update('companyName', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
        </div>

        <div className="mb-2">
          <label className="block text-xs text-gray-500 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={e => update('email', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            required
          />
        </div>

        <label className="flex items-start gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={form.agreeEmail}
            onChange={e => update('agreeEmail', e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span className="text-xs text-gray-500 leading-relaxed">
            I agree to receive marketing emails and promotions. You can unsubscribe at anytime. Even if you don&apos;t check this box, you&apos;ll still receive important transactional messages like reminders and updates.
          </span>
        </label>

        <div className="mb-2">
          <label className="block text-xs text-gray-500 mb-1">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => update('phone', e.target.value)}
            placeholder="(780) 555-1325"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
        </div>

        <label className="flex items-start gap-2 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={form.agreeSms}
            onChange={e => update('agreeSms', e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span className="text-xs text-gray-500 leading-relaxed">
            I agree to receive marketing text messages (SMS), such as special offers and promotions, from Guest Provider. Message and data rates may apply. Frequency varies. Opt out by replying STOP. Even if you don&apos;t check this box, you&apos;ll still receive important transactional messages like reminders and updates. Opt out of all messaging by replying STOP.
          </span>
        </label>

        {/* Address */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Address</h2>

        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Street address</label>
          <input
            type="text"
            value={form.street}
            onChange={e => update('street', e.target.value)}
            placeholder="8141 127 Avenue Northwest"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Unit, apartment, suite, etc. (optional)</label>
          <input
            type="text"
            value={form.unit}
            onChange={e => update('unit', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div>
            <label className="block text-xs text-gray-500 mb-1">City</label>
            <input
              type="text"
              value={form.city}
              onChange={e => update('city', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Province</label>
            <input
              type="text"
              value={form.province}
              onChange={e => update('province', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Postal Code</label>
            <input
              type="text"
              value={form.postalCode}
              onChange={e => update('postalCode', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </div>
        </div>

        {/* Service Details */}
        <h2 className="text-lg font-bold text-gray-900 mb-1">Service Details</h2>
        <p className="text-sm text-gray-500 mb-3">
          Please provide as much information as you can <span className="badge badge-gray text-[10px] ml-1">Required</span>
        </p>
        <textarea
          value={form.serviceDetails}
          onChange={e => update('serviceDetails', e.target.value)}
          rows={4}
          placeholder="I need some work done"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 resize-none mb-8"
          required
        />

        {/* Availability */}
        <h2 className="text-lg font-bold text-gray-900 mb-1">Your Availability</h2>

        <div className="mb-4 mt-4">
          <label className="block text-sm text-gray-700 mb-2">
            Which day would be best for an assessment of the work? <span className="badge badge-gray text-[10px] ml-1">Required</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={form.preferredDate1}
              onChange={e => update('preferredDate1', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 pr-10"
              required
            />
            <CalendarDays size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-2">
            What is another day that works for you?
          </label>
          <div className="relative">
            <input
              type="date"
              value={form.preferredDate2}
              onChange={e => update('preferredDate2', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 pr-10"
            />
            <CalendarDays size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <div className="mb-8">
          <p className="text-sm text-gray-700 mb-3">What are your preferred arrival times?</p>
          <div className="space-y-2.5">
            {(['any', 'morning', 'afternoon'] as const).map(time => (
              <label key={time} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.preferredTime === time}
                  onChange={() => update('preferredTime', time)}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 capitalize">{time === 'any' ? 'Any time' : time}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Upload Images */}
        <h2 className="text-lg font-bold text-gray-900 mb-1">Upload images</h2>
        <p className="text-sm text-gray-500 mb-3">
          Share images of the work to be done <span className="text-xs text-gray-400 ml-2">0/10</span>
        </p>
        <button
          type="button"
          className="w-full border-2 border-dashed border-gray-300 rounded-lg py-4 flex items-center justify-center gap-2 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors mb-10"
        >
          <Upload size={16} />
          Add Images
        </button>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
          <p className="text-[11px] text-gray-400">
            This site is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.
          </p>
          <button
            type="submit"
            className="btn btn-primary px-8 py-2.5"
          >
            Submit
          </button>
        </div>
      </form>
    </div>
  );
}
