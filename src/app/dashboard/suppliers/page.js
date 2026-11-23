'use client';

import { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Badge from '@/components/ui/Badge';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/States';
import { useLanguage } from '@/lib/LanguageContext';

export default function SuppliersPage() {
  const { t, lang } = useLanguage();
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
  });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/suppliers?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error('Failed to load suppliers');
      const data = await res.json();
      setSuppliers(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search]);

  const handleOpenAdd = () => {
    setFormData({ name: '', contact_person: '', email: '', phone: '', address: '', notes: '' });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setSelectedSupplier(sup);
    setFormData({
      name: sup.name,
      contact_person: sup.contact_person || '',
      email: sup.email || '',
      phone: sup.phone || '',
      address: sup.address || '',
      notes: sup.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create supplier');
      }
      setIsAddOpen(false);
      fetchSuppliers();
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
      const res = await fetch(`/api/suppliers/${selectedSupplier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update supplier');
      }
      setIsEditOpen(false);
      fetchSuppliers();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/suppliers/${selectedSupplier.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete supplier');
      }
      setIsDeleteOpen(false);
      fetchSuppliers();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-main tracking-tight">{t('suppliersTitle')}</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {t('suppliersSubtitle')}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAdd}>
          <Plus className="h-3.5 w-3.5" /> {t('addSupplier')}
        </Button>
      </div>

      {/* Search */}
      <div className="glass rounded-xl p-3.5">
        <div className="max-w-md">
          <Input
            placeholder={lang === 'kh' ? 'ស្វែងរកអ្នកផ្គត់ផ្គង់ អ្នកទំនាក់ទំនង ទូរស័ព្ទ...' : 'Search supplier, contact person, phone...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-3.5 w-3.5" />}
          />
        </div>
      </div>

      {/* Grid of suppliers */}
      {loading ? (
        <LoadingState message={t('loading')} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchSuppliers} />
      ) : suppliers.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={lang === 'kh' ? 'រកមិនឃើញអ្នកផ្គត់ផ្គង់ទេ' : 'No suppliers found'}
          message={lang === 'kh' ? 'ចុះឈ្មោះអ្នកផ្គត់ផ្គង់ដើម្បីភ្ជាប់ជាមួយការទិញ និងដឹកជញ្ជូនចូលស្តុក' : 'Register suppliers to associate with inventory purchases and deliveries'}
          action={
            <Button size="sm" onClick={handleOpenAdd}>
              <Plus className="h-3.5 w-3.5" /> {t('addSupplier')}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((sup) => (
            <div key={sup.id} className="glass rounded-xl p-4.5 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-text-main text-sm">{sup.name}</h3>
                  {sup.contact_person && (
                    <p className="text-xs text-text-secondary mt-0.5">
                      {t('contactPerson')}: {sup.contact_person}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(sup)}
                    className="p-1 text-text-muted hover:text-primary rounded-md hover:bg-bg-main"
                    title={t('edit')}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => { setSelectedSupplier(sup); setIsDeleteOpen(true); }}
                    className="p-1 text-text-muted hover:text-danger rounded-md hover:bg-danger-light"
                    title={t('delete')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-text-secondary border-t border-border-light pt-2.5">
                {sup.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-text-muted" />
                    <span>{sup.phone}</span>
                  </p>
                )}
                {sup.email && (
                  <p className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-text-muted" />
                    <span className="truncate">{sup.email}</span>
                  </p>
                )}
                {sup.address && (
                  <p className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-text-muted mt-0.5 flex-shrink-0" />
                    <span className="line-clamp-2">{sup.address}</span>
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-border-light flex items-center justify-between text-[11px]">
                <span className="text-text-muted">
                  {sup.item_count || 0} {t('linkedItems')}
                </span>
                <Badge variant="success" size="sm">{t('activePartner')}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={isAddOpen || isEditOpen}
        onClose={() => { setIsAddOpen(false); setIsEditOpen(false); }}
        title={isAddOpen ? t('addSupplier') : t('editSupplier')}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => { setIsAddOpen(false); setIsEditOpen(false); }} disabled={submitting}>
              {t('cancel')}
            </Button>
            <Button variant="primary" onClick={isAddOpen ? handleSubmitAdd : handleSubmitEdit} loading={submitting}>
              {t('save')}
            </Button>
          </>
        }
      >
        <form onSubmit={isAddOpen ? handleSubmitAdd : handleSubmitEdit} className="space-y-3.5">
          <Input
            label={lang === 'kh' ? 'ឈ្មោះក្រុមហ៊ុន / អ្នកផ្គត់ផ្គង់' : 'Supplier / Vendor Name'}
            required
            placeholder="e.g. InnoTech Supplies, Angkor Paper Co."
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3.5">
            <Input
              label={t('contactPerson')}
              placeholder="e.g. Mr. Sokha Chan"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
            />
            <Input
              label={t('phone')}
              placeholder="+855 23 888 999"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <Input
            label={t('email')}
            type="email"
            placeholder="sales@supplier.com.kh"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Input
            label={t('address')}
            placeholder="Kampong Thom city, National Road 6..."
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <Textarea
            label={t('notes')}
            rows={2}
            placeholder="Payment terms, delivery schedule, discounts..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={lang === 'kh' ? 'លុបអ្នកផ្គត់ផ្គង់' : 'Delete Supplier'}
        message={`${lang === 'kh' ? 'តើអ្នកប្រាកដជាចង់លុបអ្នកផ្គត់ផ្គង់' : 'Are you sure you want to delete supplier'} "${selectedSupplier?.name}"?`}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        variant="danger"
        loading={submitting}
      />
    </div>
  );
}
