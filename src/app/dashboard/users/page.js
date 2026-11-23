'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  UserCheck,
  Edit2,
  Lock,
  Phone,
  Mail,
  Building,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/States';
import { useLanguage } from '@/lib/LanguageContext';

export default function UsersPage() {
  const { t, lang } = useLanguage();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'staff',
    department: 'Inventory',
    phone: '',
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to load user accounts');
      const data = await res.json();
      setUsers(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = () => {
    setFormData({
      full_name: '',
      email: '',
      password: '',
      role: 'staff',
      department: 'Inventory',
      phone: '',
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (u) => {
    setSelectedUser(u);
    setFormData({
      full_name: u.full_name,
      email: u.email,
      password: '', // Leave blank unless changing
      role: u.role,
      department: u.department || '',
      phone: u.phone || '',
      is_active: u.is_active,
    });
    setIsEditOpen(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create user');
      }
      setIsAddOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update user');
      }
      setIsEditOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to deactivate user');
      }
      setIsDeactivateOpen(false);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <Badge variant="primary" size="sm">{t('admin')}</Badge>;
      case 'manager':
        return <Badge variant="info" size="sm">{t('manager')}</Badge>;
      case 'staff':
      default:
        return <Badge variant="default" size="sm">{t('staff')}</Badge>;
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-main tracking-tight">{t('usersTitle')}</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {t('usersSubtitle')}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAdd}>
          <Plus className="h-3.5 w-3.5" /> {t('addNewUser')}
        </Button>
      </div>

      {/* Search */}
      <div className="glass rounded-xl p-3.5">
        <div className="max-w-md">
          <Input
            placeholder={lang === 'kh' ? 'ស្វែងរកតាមឈ្មោះ អ៊ីមែល ផ្នែក...' : 'Search user by name, email, department...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-3.5 w-3.5" />}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="glass rounded-xl overflow-hidden">
        {loading ? (
          <LoadingState message={t('loading')} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchUsers} />
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={lang === 'kh' ? 'រកមិនឃើញអ្នកប្រើប្រាស់ទេ' : 'No users found'}
            message={lang === 'kh' ? 'បន្ថែមគណនីបុគ្គលិកដើម្បីផ្តល់សិទ្ធិចូលប្រើប្រាស់ប្រព័ន្ធ' : 'Add staff members to grant access to the inventory system'}
            action={
              <Button size="sm" onClick={handleOpenAdd}>
                <Plus className="h-3.5 w-3.5" /> {t('addNewUser')}
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="table-container hidden md:block">
              <table>
                <thead>
                  <tr>
                    <th>{lang === 'kh' ? 'គណនីបុគ្គលិក' : 'User Profile'}</th>
                    <th>{t('email')}</th>
                    <th>{t('role')}</th>
                    <th>{t('department')}</th>
                    <th>{t('phone')}</th>
                    <th>{t('status')}</th>
                    <th>{t('lastLogin')}</th>
                    <th className="text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary dark:text-cyan-300 border border-primary/25 flex items-center justify-center font-bold text-xs">
                            {u.full_name?.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-text-main text-xs">{u.full_name}</p>
                            <p className="text-[10px] text-text-muted">ID: #{u.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs text-text-secondary font-mono">{u.email}</td>
                      <td>{getRoleBadge(u.role)}</td>
                      <td className="text-xs text-text-secondary">{u.department || '—'}</td>
                      <td className="text-xs text-text-secondary">{u.phone || '—'}</td>
                      <td>
                        <Badge variant={u.is_active ? 'success' : 'default'} size="sm" dot>
                          {u.is_active ? (lang === 'kh' ? 'សកម្ម' : 'Active') : (lang === 'kh' ? 'អសកម្ម' : 'Deactivated')}
                        </Badge>
                      </td>
                      <td className="text-xs text-text-muted">
                        {u.last_login ? new Date(u.last_login).toLocaleDateString() : (lang === 'kh' ? 'មិនដែល' : 'Never')}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-text-muted hover:text-primary rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                            title={t('edit')}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {u.id !== 1 && u.is_active && (
                            <button
                              onClick={() => { setSelectedUser(u); setIsDeactivateOpen(true); }}
                              className="p-1.5 text-text-muted hover:text-danger rounded-md hover:bg-danger/10"
                              title={t('deactivate')}
                            >
                              <Shield className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Data Row Cards (No horizontal scroll on phones) */}
            <div className="md:hidden divide-y divide-border">
              {filteredUsers.map((u) => (
                <div key={u.id} className="p-3.5 space-y-2.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary dark:text-cyan-300 border border-primary/25 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {u.full_name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-text-main">{u.full_name}</h4>
                        <p className="text-[11px] font-mono text-text-muted">{u.email}</p>
                      </div>
                    </div>
                    {getRoleBadge(u.role)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-border text-[11px]">
                    <div>
                      <span className="text-text-muted block">{t('department')}:</span>
                      <span className="text-text-secondary truncate block">{u.department || '—'}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block">{t('status')}:</span>
                      <Badge variant={u.is_active ? 'success' : 'default'} size="sm" dot>
                        {u.is_active ? (lang === 'kh' ? 'សកម្ម' : 'Active') : (lang === 'kh' ? 'អសកម្ម' : 'Deactivated')}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-text-muted block">{t('phone')}:</span>
                      <span className="text-text-secondary">{u.phone || '—'}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block">{t('lastLogin')}:</span>
                      <span className="text-text-secondary">{u.last_login ? new Date(u.last_login).toLocaleDateString() : (lang === 'kh' ? 'មិនដែល' : 'Never')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1.5 pt-0.5">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleOpenEdit(u)}
                    >
                      <Edit2 className="h-3.5 w-3.5 mr-1 text-primary" /> {t('edit')}
                    </Button>
                    {u.id !== 1 && u.is_active && (
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => { setSelectedUser(u); setIsDeactivateOpen(true); }}
                        className="text-danger hover:bg-danger/10"
                      >
                        <Shield className="h-3.5 w-3.5 mr-1" /> {t('deactivate')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add User Modal */}
      <Modal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={t('addNewUser')}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={submitting}>
              {t('cancel')}
            </Button>
            <Button variant="primary" onClick={handleSubmitAdd} loading={submitting}>
              {lang === 'kh' ? 'បង្កើតគណនី' : 'Create Account'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitAdd} className="space-y-3.5">
          <Input
            label={t('fullName')}
            required
            placeholder="e.g. Chan Vanna"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3.5">
            <Input
              label={t('email')}
              type="email"
              required
              placeholder="vanna@innolab.kh"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label={lang === 'kh' ? 'ពាក្យសម្ងាត់ (យ៉ាងតិច ៦ តួ)' : 'Password (min 6 characters)'}
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <Select
              label={t('role')}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={[
                { value: 'staff', label: lang === 'kh' ? 'បុគ្គលិក (Staff)' : 'Staff (Stock movements & view inventory)' },
                { value: 'manager', label: lang === 'kh' ? 'អ្នកគ្រប់គ្រង (Manager)' : 'Manager (Manage inventory & view reports)' },
                { value: 'admin', label: lang === 'kh' ? 'រដ្ឋបាលជាន់ខ្ពស់ (Admin)' : 'Admin (Full system & user access)' },
              ]}
            />
            <Input
              label={t('department')}
              placeholder="e.g. Operations, IT, SME Hub"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>

          <Input
            label={t('phone')}
            placeholder="+855 12 345 678"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`${t('editUser')}: ${selectedUser?.full_name}`}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditOpen(false)} disabled={submitting}>
              {t('cancel')}
            </Button>
            <Button variant="primary" onClick={handleSubmitEdit} loading={submitting}>
              {t('saveChanges')}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitEdit} className="space-y-3.5">
          <Input
            label={t('fullName')}
            required
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3.5">
            <Select
              label={t('role')}
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={[
                { value: 'staff', label: t('staff') },
                { value: 'manager', label: t('manager') },
                { value: 'admin', label: t('admin') },
              ]}
            />
            <Input
              label={t('department')}
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>

          <Input
            label={t('phone')}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          <Input
            label={lang === 'kh' ? 'ពាក្យសម្ងាត់ថ្មី (មិនបំពេញក៏បាន)' : 'New Password (optional)'}
            type="password"
            placeholder={lang === 'kh' ? 'ទុកទំនេរប្រសិនបើមិនចង់ផ្លាស់ប្តូរ' : 'Leave blank to keep current password'}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-text-main">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-border text-primary focus:ring-primary"
              />
              {t('accountActive')}
            </label>
          </div>
        </form>
      </Modal>

      {/* Deactivate confirmation */}
      <ConfirmModal
        open={isDeactivateOpen}
        onClose={() => setIsDeactivateOpen(false)}
        onConfirm={handleDeactivate}
        title={t('deactivate')}
        message={`${lang === 'kh' ? 'តើអ្នកប្រាកដជាចង់ផ្អាកគណនី' : 'Deactivate account for'} "${selectedUser?.full_name}"? ${lang === 'kh' ? 'ពួកគេនឹងមិនអាចចូលប្រើប្រព័ន្ធបានទៀតទេ។' : 'They will no longer be able to log in.'}`}
        confirmText={t('deactivate')}
        cancelText={t('cancel')}
        variant="danger"
        loading={submitting}
      />
    </div>
  );
}
