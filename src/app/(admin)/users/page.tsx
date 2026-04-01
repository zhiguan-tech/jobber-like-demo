'use client';

import { useState } from 'react';
import { useApp } from '@/lib/app-context';
import Modal from '@/components/Modal';
import { Plus, Edit, Trash2, Search, Shield, ShieldCheck, UserRound } from 'lucide-react';
import type { UserRole } from '@/lib/types';

const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  teamMember: 'Team Member',
};

const ROLE_BADGE: Record<UserRole, string> = {
  owner: 'badge badge-purple',
  admin: 'badge badge-blue',
  teamMember: 'badge badge-green',
};

const ROLE_ICON: Record<UserRole, typeof Shield> = {
  owner: ShieldCheck,
  admin: Shield,
  teamMember: UserRound,
};

const COLOR_OPTIONS = [
  '#16a34a', '#2563eb', '#9333ea', '#dc2626', '#ea580c', '#0891b2', '#4f46e5', '#be185d',
];

export default function UsersPage() {
  const { teamMembers, addTeamMember, updateTeamMember, deleteTeamMember, generateId } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formUserRole, setFormUserRole] = useState<UserRole>('teamMember');
  const [formColor, setFormColor] = useState(COLOR_OPTIONS[0]);
  const [formActive, setFormActive] = useState(true);

  const resetForm = () => {
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormRole('');
    setFormUserRole('teamMember');
    setFormColor(COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]);
    setFormActive(true);
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (id: string) => {
    const m = teamMembers.find(t => t.id === id);
    if (!m) return;
    setFormName(m.name);
    setFormEmail(m.email || '');
    setFormPhone(m.phone || '');
    setFormRole(m.role);
    setFormUserRole(m.userRole || 'teamMember');
    setFormColor(m.color);
    setFormActive(m.active !== false);
    setEditingId(id);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    if (editingId) {
      updateTeamMember(editingId, {
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        role: formRole.trim(),
        userRole: formUserRole,
        color: formColor,
        active: formActive,
      });
    } else {
      addTeamMember({
        id: generateId('tm'),
        name: formName.trim(),
        email: formEmail.trim(),
        phone: formPhone.trim(),
        role: formRole.trim() || 'Field Technician',
        userRole: formUserRole,
        color: formColor,
        active: formActive,
      });
    }
    setShowModal(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteTeamMember(id);
    }
  };

  // Filtered & searched list
  const filtered = teamMembers.filter(m => {
    if (filterRole !== 'all' && m.userRole !== filterRole) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        m.name.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        m.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    all: teamMembers.length,
    owner: teamMembers.filter(m => m.userRole === 'owner').length,
    admin: teamMembers.filter(m => m.userRole === 'admin').length,
    teamMember: teamMembers.filter(m => m.userRole === 'teamMember').length,
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">Manage team members, admins, and owners</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary flex items-center gap-2">
          <Plus size={16} /> New User
        </button>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {([['all', 'All Users', 'text-gray-500'], ['owner', 'Owners', 'text-purple-600'], ['admin', 'Admins', 'text-blue-600'], ['teamMember', 'Team Members', 'text-green-600']] as const).map(
          ([key, label, color]) => (
            <button
              key={key}
              onClick={() => setFilterRole(key)}
              className={`card text-left transition-all ${filterRole === key ? 'ring-2 ring-green-500' : ''}`}
            >
              <p className={`text-sm font-medium ${color}`}>{label}</p>
              <p className="text-2xl font-bold mt-1">{counts[key]}</p>
            </button>
          )
        )}
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
          />
        </div>
      </div>

      {/* Users table */}
      <div className="card p-0 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Job Title</th>
              <th>Role</th>
              <th>Status</th>
              <th className="w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-8">No users found</td>
              </tr>
            )}
            {filtered.map(m => {
              const RoleIcon = ROLE_ICON[m.userRole || 'teamMember'];
              return (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                        style={{ backgroundColor: m.color }}
                      >
                        {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="font-medium text-gray-900">{m.name}</span>
                    </div>
                  </td>
                  <td className="text-gray-600">{m.email || '-'}</td>
                  <td className="text-gray-600">{m.phone || '-'}</td>
                  <td className="text-gray-600">{m.role}</td>
                  <td>
                    <span className={ROLE_BADGE[m.userRole || 'teamMember']}>
                      <RoleIcon size={12} className="inline mr-1" />
                      {ROLE_LABELS[m.userRole || 'teamMember']}
                    </span>
                  </td>
                  <td>
                    {m.active !== false ? (
                      <span className="badge badge-green">Active</span>
                    ) : (
                      <span className="badge badge-gray">Inactive</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(m.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingId ? 'Edit User' : 'New User'}
      >
        <div className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              placeholder="e.g. John Doe"
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                placeholder="john@company.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={formPhone}
                onChange={e => setFormPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                placeholder="(604) 555-0000"
              />
            </div>
          </div>

          {/* Job Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
            <input
              type="text"
              value={formRole}
              onChange={e => setFormRole(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              placeholder="e.g. Field Technician, Manager"
            />
          </div>

          {/* System Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">System Role *</label>
            <div className="grid grid-cols-2 gap-3">
              {(['admin', 'teamMember'] as UserRole[]).map(role => {
                const Icon = ROLE_ICON[role];
                const isSelected = formUserRole === role;
                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFormUserRole(role)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <Icon size={24} className={isSelected ? 'text-green-600' : 'text-gray-400'} />
                    <span className={`text-sm font-medium ${isSelected ? 'text-green-700' : 'text-gray-600'}`}>
                      {ROLE_LABELS[role]}
                    </span>
                    <span className="text-[10px] text-gray-400 text-center leading-tight">
                      {role === 'owner' && 'Full access, manage everything'}
                      {role === 'admin' && 'Manage users, view reports'}
                      {role === 'teamMember' && 'Assignable to jobs & visits'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Avatar Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Avatar Color</label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    formColor === c ? 'ring-2 ring-offset-2 ring-green-500 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Active</label>
              <p className="text-xs text-gray-500">Inactive users cannot be assigned to jobs</p>
            </div>
            <button
              type="button"
              onClick={() => setFormActive(!formActive)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                formActive ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  formActive ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-2">Preview</p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium"
                style={{ backgroundColor: formColor }}
              >
                {formName ? formName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{formName || 'User Name'}</p>
                <p className="text-xs text-gray-500">{formRole || 'Job Title'}</p>
              </div>
              <span className={`ml-auto ${ROLE_BADGE[formUserRole]}`}>
                {ROLE_LABELS[formUserRole]}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
            <button
              onClick={() => { setShowModal(false); resetForm(); }}
              className="btn btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!formName.trim()}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {editingId ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
