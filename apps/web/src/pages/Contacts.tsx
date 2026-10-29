import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  ShieldCheck,
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import api from '../lib/api';

export const Contacts: React.FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [contacts, setContacts] = useState<any[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleGroup, setRoleGroup] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    roleGroup: 'MANAGEMENT',
    companyId: '',
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [companies, setCompanies] = useState<any[]>([]);

  const fetchContacts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/contacts', {
        params: {
          page,
          limit: 15,
          search: search || undefined,
          roleGroup: roleGroup || undefined,
        },
      });
      if (res.data?.success) {
        setContacts(res.data.data);
        setMeta(res.data.meta);
      }
    } catch (err) {
      console.error('Failed to fetch contacts:', err);
    } finally {
      setLoading(false);
    }
  }, [search, roleGroup]);

  useEffect(() => {
    fetchContacts(1);
    // Load companies list for dropdown
    api.get('/companies', { params: { limit: 100 } }).then((res) => {
      if (res.data?.success) setCompanies(res.data.data);
    }).catch(() => {});
  }, [fetchContacts]);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/contacts', {
        ...newContact,
        fullName: `${newContact.firstName} ${newContact.lastName}`.trim(),
        companyId: newContact.companyId || undefined,
      });
      setIsModalOpen(false);
      setNewContact({ firstName: '', lastName: '', email: '', phone: '', jobTitle: '', roleGroup: 'MANAGEMENT', companyId: '' });
      fetchContacts(1);
    } catch (err) {
      console.error('Error creating contact:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Contacts & Decision Makers</h1>
          <p className="text-sm text-slate-400">Target UAE corporate PROs, HR directors, IT leaders, and procurement heads</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="input-field pl-9 text-sm py-2"
          />
        </div>

        <select
          value={roleGroup}
          onChange={(e) => setRoleGroup(e.target.value)}
          className="input-field w-auto text-sm py-2"
        >
          <option value="">All Role Groups</option>
          <option value="PRO">PRO / Government Relations</option>
          <option value="HR">HR / People Ops</option>
          <option value="IT_TELECOM">IT & Telecom Buyer</option>
          <option value="MANAGEMENT">C-Level / General Management</option>
          <option value="FINANCE_PROCUREMENT">Finance & Procurement</option>
        </select>

        <button
          onClick={() => fetchContacts(1)}
          className="btn-secondary text-sm py-2 px-3"
        >
          <Filter className="w-4 h-4" />
          <span>Apply</span>
        </button>
      </div>

      {/* Contacts Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgba(99,102,241,0.15)] bg-[#0f1629]/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-3.5">Name / Title</th>
                <th className="px-4 py-3.5">Company</th>
                <th className="px-4 py-3.5">Direct Channels</th>
                <th className="px-4 py-3.5">Role Group</th>
                <th className="px-4 py-3.5 text-center">Compliance Opt-In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(99,102,241,0.08)] text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500">
                    Loading contacts...
                  </td>
                </tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-500">
                    No contacts found.
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-200">
                        {contact.fullName || `${contact.firstName} ${contact.lastName}`}
                      </div>
                      <div className="text-xs text-slate-400">{contact.jobTitle || 'Executive'}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      {contact.company ? (
                        <div className="flex items-center gap-1.5 text-indigo-300 font-medium text-xs">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>{contact.company.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">Independent</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 space-y-1">
                      {contact.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                          <Phone className="w-3 h-3 text-emerald-400" />
                          <span>{contact.phone}</span>
                        </div>
                      )}
                      {contact.email && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                          <Mail className="w-3 h-3 text-indigo-400" />
                          <span>{contact.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="badge-purple text-xs">{contact.roleGroup || 'MANAGEMENT'}</span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="inline-flex items-center gap-1 text-emerald-400 text-xs bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Verified Consent</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-[rgba(99,102,241,0.15)] bg-[#0f1629]/30 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {(meta.page - 1) * meta.limit + 1} to{' '}
            {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} contacts
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={meta.page <= 1}
              onClick={() => fetchContacts(meta.page - 1)}
              className="p-1 rounded bg-[#131d35] border border-[rgba(99,102,241,0.2)] disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span>
              Page {meta.page} of {meta.totalPages || 1}
            </span>
            <button
              disabled={meta.page >= meta.totalPages}
              onClick={() => fetchContacts(meta.page + 1)}
              className="p-1 rounded bg-[#131d35] border border-[rgba(99,102,241,0.2)] disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 shadow-2xl animate-fade-in">
            <h2 className="text-xl font-bold font-display text-white mb-4">Add UAE Decision Maker</h2>
            <form onSubmit={handleCreateContact} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newContact.firstName}
                    onChange={(e) => setNewContact({ ...newContact, firstName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newContact.lastName}
                    onChange={(e) => setNewContact({ ...newContact, lastName: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label">Associated Company</label>
                <select
                  value={newContact.companyId}
                  onChange={(e) => setNewContact({ ...newContact, companyId: e.target.value })}
                  className="input-field"
                >
                  <option value="">Select Company (Optional)</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.emirate || 'Dubai'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Job Title</label>
                  <input
                    type="text"
                    value={newContact.jobTitle}
                    onChange={(e) => setNewContact({ ...newContact, jobTitle: e.target.value })}
                    placeholder="e.g. Government Relations PRO"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Role Group</label>
                  <select
                    value={newContact.roleGroup}
                    onChange={(e) => setNewContact({ ...newContact, roleGroup: e.target.value })}
                    className="input-field"
                  >
                    <option value="PRO">PRO</option>
                    <option value="HR">HR</option>
                    <option value="IT_TELECOM">IT / Telecom</option>
                    <option value="MANAGEMENT">Management</option>
                    <option value="FINANCE_PROCUREMENT">Finance / Procurement</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">UAE Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    placeholder="+971 50 123 4567"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Email Address</label>
                  <input
                    type="email"
                    value={newContact.email}
                    onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                    placeholder="contact@company.ae"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(99,102,241,0.15)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
