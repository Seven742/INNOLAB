'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  Calendar,
  User,
  Check,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/States';
import { useLanguage } from '@/lib/LanguageContext';

export default function BorrowPage() {
  const { t, lang } = useLanguage();
  const [records, setRecords] = useState([]);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    item_id: '',
    borrower_name: '',
    borrower_department: 'Operations',
    borrower_contact: '',
    borrow_date: new Date().toISOString().split('T')[0],
    expected_return_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    notes: '',
  });

  const [returnForm, setReturnForm] = useState({
    actual_return_date: new Date().toISOString().split('T')[0],
    condition_on_return: 'Good condition / fully functional',
    notes: '',
  });

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter,
      });

      const res = await fetch(`/api/borrow?${params}`);
      if (!res.ok) throw new Error('Failed to load borrow records');
      const data = await res.json();
      setRecords(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter]);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/inventory?all=true');
      if (res.ok) setItems(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleOpenAdd = () => {
    setFormData({
      item_id: items[0]?.id || '',
      borrower_name: '',
      borrower_department: 'Operations',
      borrower_contact: '',
      borrow_date: new Date().toISOString().split('T')[0],
      expected_return_date: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      notes: '',
    });
    setIsAddOpen(true);
  };

  const handleOpenReturn = (record) => {
    setSelectedRecord(record);
    setReturnForm({
      actual_return_date: new Date().toISOString().split('T')[0],
      condition_on_return: lang === 'kh' ? 'ស្ថានភាពល្អ / ដំណើរការធម្មតា' : 'Good condition / fully functional',
      notes: '',
    });
    setIsReturnOpen(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/borrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record borrow');
      }
      setIsAddOpen(false);
      fetchRecords();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/borrow/${selectedRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'return',
          ...returnForm,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to mark returned');
      }
      setIsReturnOpen(false);
      fetchRecords();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (r) => {
    if (r.status === 'overdue') {
      return (
        <Badge variant="danger" dot size="sm">
          {lang === 'kh' ? `ហួសកំណត់ (${r.days_overdue || 1} ថ្ងៃ)` : `Overdue (${r.days_overdue || 1}d)`}
        </Badge>
      );
    }
    if (r.status === 'borrowed') {
      return <Badge variant="info" dot size="sm">{t('borrowed')}</Badge>;
    }
    return <Badge variant="success" size="sm">{t('returned')}</Badge>;
  };

  const overdueCount = records.filter(r => r.status === 'overdue').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-main tracking-tight">{t('borrowTitle')}</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {t('borrowSubtitle')}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAdd}>
          <Plus className="h-3.5 w-3.5" /> {t('borrowEquipment')}
        </Button>
      </div>

      {/* Overdue alert banner if any */}
      {overdueCount > 0 && (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300">
          <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0" />
          <p className="text-xs font-medium">
            {lang === 'kh' ? (
              <>ចំណាំ៖ មាន <span className="font-bold underline">ឧបករណ៍ចំនួន {overdueCount} បានហួសកាលកំណត់សង</span> ត្រឡប់មកវិញ។</>
            ) : (
              <>Attention: There are <span className="font-bold underline">{overdueCount} overdue equipment items</span> that have passed their expected return date.</>
            )}
          </p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="glass rounded-xl p-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            {[
              { id: '', label: lang === 'kh' ? 'ឧបករណ៍ទាំងអស់' : 'All Equipment' },
              { id: 'borrowed', label: lang === 'kh' ? 'កំពុងខ្ចី' : 'Currently Borrowed' },
              { id: 'overdue', label: lang === 'kh' ? 'ហួសកំណត់' : 'Overdue Alerts' },
              { id: 'returned', label: lang === 'kh' ? 'ប្រវត្តិនៃការសង' : 'Returned History' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setStatusFilter(tab.id); setPagination(p => ({ ...p, page: 1 })); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${statusFilter === tab.id
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-main hover:bg-bg-main'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <Input
              placeholder={lang === 'kh' ? 'ស្វែងរកឧបករណ៍ ឬអ្នកខ្ចី...' : 'Search equipment, borrower...'}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
              leftIcon={<Search className="h-3.5 w-3.5" />}
            />
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="glass rounded-xl overflow-hidden">
        {loading ? (
          <LoadingState message={t('loading')} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchRecords} />
        ) : records.length === 0 ? (
          <EmptyState
            icon={RefreshCw}
            title={lang === 'kh' ? 'មិនមានឧបករណ៍កំពុងខ្ចីទេ' : 'No equipment borrowed'}
            message={lang === 'kh' ? 'រាល់ឧបករណ៍ និងសម្ភារៈការិយាល័យទាំងអស់គឺមាននៅក្នុងឃ្លាំង' : 'All office equipment and gadgets are currently accounted for in storage'}
            action={
              <Button size="sm" onClick={handleOpenAdd}>
                <Plus className="h-3.5 w-3.5" /> {t('borrowEquipment')}
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="table-container hidden md:block">
              <table>
                <thead>
                  <tr>
                    <th>{t('equipmentItem')}</th>
                    <th>{t('borrowerName')}</th>
                    <th>{t('department')}</th>
                    <th>{t('borrowDate')}</th>
                    <th>{t('expectedReturnDate')}</th>
                    <th>{t('status')}</th>
                    <th className="text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => {
                    const isOverdue = r.status === 'overdue';
                    return (
                      <tr key={r.id} className={isOverdue ? 'bg-rose-500/10' : ''}>
                        <td>
                          <div>
                            <p className="font-semibold text-text-main text-xs">{r.item_name}</p>
                            <span className="font-mono text-[11px] text-primary">{r.item_code}</span>
                          </div>
                        </td>
                        <td>
                          <p className="font-medium text-text-main text-xs">{r.borrower_name}</p>
                          {r.borrower_contact && (
                            <p className="text-[10px] text-text-muted">{r.borrower_contact}</p>
                          )}
                        </td>
                        <td className="text-xs text-text-secondary">
                          {r.borrower_department || '—'}
                        </td>
                        <td className="text-xs text-text-secondary whitespace-nowrap">
                          {r.borrow_date ? r.borrow_date.split('T')[0] : '—'}
                        </td>
                        <td className="text-xs font-medium whitespace-nowrap">
                          <span className={isOverdue ? 'text-danger font-bold' : 'text-text-main'}>
                            {r.expected_return_date ? r.expected_return_date.split('T')[0] : '—'}
                          </span>
                        </td>
                        <td>{getStatusBadge(r)}</td>
                        <td className="text-right">
                          {r.status !== 'returned' ? (
                            <Button
                              variant="secondary"
                              size="xs"
                              onClick={() => handleOpenReturn(r)}
                            >
                              <Check className="h-3 w-3" /> {t('markReturned')}
                            </Button>
                          ) : (
                            <span className="text-[11px] text-text-muted">
                              {lang === 'kh' ? 'បានសង' : 'Returned'} {r.actual_return_date ? r.actual_return_date.split('T')[0] : ''}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Data Row Cards (No horizontal scroll on phones) */}
            <div className="md:hidden divide-y divide-border">
              {records.map((r) => {
                const isOverdue = r.status === 'overdue';
                return (
                  <div key={r.id} className={`p-3.5 space-y-2.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${isOverdue ? 'bg-rose-500/5' : ''}`}>
                    {/* Top: Item Name + Code + Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-text-main">{r.item_name}</h4>
                        <span className="font-mono text-[11px] font-bold text-primary dark:text-cyan-400">{r.item_code}</span>
                      </div>
                      {getStatusBadge(r)}
                    </div>

                    {/* Middle: Borrower Information */}
                    <div className="p-2.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-border text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-text-muted font-medium">{t('borrowerName')}:</span>
                        <span className="font-semibold text-text-main">{r.borrower_name}</span>
                      </div>
                      {r.borrower_department && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-text-muted">{t('department')}:</span>
                          <span className="text-text-secondary">{r.borrower_department}</span>
                        </div>
                      )}
                      {r.borrower_contact && (
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-text-muted">Contact:</span>
                          <span className="text-text-secondary">{r.borrower_contact}</span>
                        </div>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-text-muted block">{t('borrowDate')}:</span>
                        <span className="font-medium text-text-main">{r.borrow_date ? r.borrow_date.split('T')[0] : '—'}</span>
                      </div>
                      <div>
                        <span className="text-text-muted block">{t('expectedReturnDate')}:</span>
                        <span className={`font-semibold ${isOverdue ? 'text-danger' : 'text-text-main'}`}>
                          {r.expected_return_date ? r.expected_return_date.split('T')[0] : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end pt-1">
                      {r.status !== 'returned' ? (
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => handleOpenReturn(r)}
                          className="w-full sm:w-auto"
                        >
                          <Check className="h-3 w-3 mr-1" /> {t('markReturned')}
                        </Button>
                      ) : (
                        <span className="text-[11px] text-text-muted">
                          {lang === 'kh' ? 'បានសង' : 'Returned'}: {r.actual_return_date ? r.actual_return_date.split('T')[0] : ''}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="p-3 border-t border-border-light">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(page) => setPagination(p => ({ ...p, page }))}
          />
        </div>
      </div>

      {/* Borrow Modal */}
      <Modal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={t('borrowEquipment')}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={submitting}>
              {t('cancel')}
            </Button>
            <Button variant="primary" onClick={handleSubmitAdd} loading={submitting}>
              {lang === 'kh' ? 'បញ្ជាក់ការខ្ចី' : 'Confirm Borrow'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitAdd} className="space-y-3.5">
          <Select
            label={t('equipmentItem')}
            required
            value={formData.item_id}
            onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
            options={items.map(i => ({ value: String(i.id), label: `${i.item_code} - ${i.name}` }))}
          />

          <div className="grid grid-cols-2 gap-3.5">
            <Input
              label={t('borrowerName')}
              required
              placeholder="e.g. Sokunthea Pich"
              value={formData.borrower_name}
              onChange={(e) => setFormData({ ...formData, borrower_name: e.target.value })}
            />
            <Input
              label={t('borrowerContact')}
              placeholder="+855 12 345 678"
              value={formData.borrower_contact}
              onChange={(e) => setFormData({ ...formData, borrower_contact: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <Input
              label={t('department')}
              placeholder="e.g. SME Incubation, Media"
              value={formData.borrower_department}
              onChange={(e) => setFormData({ ...formData, borrower_department: e.target.value })}
            />
            <Input
              label={t('borrowDate')}
              type="date"
              required
              value={formData.borrow_date}
              onChange={(e) => setFormData({ ...formData, borrow_date: e.target.value })}
            />
          </div>

          <Input
            label={t('expectedReturnDate')}
            type="date"
            required
            value={formData.expected_return_date}
            onChange={(e) => setFormData({ ...formData, expected_return_date: e.target.value })}
          />

          <Textarea
            label={lang === 'kh' ? 'គោលបំណង / ព័ត៌មានលម្អិត' : 'Purpose / Notes'}
            rows={2}
            placeholder={lang === 'kh' ? 'ចុះទៅកសិដ្ឋានសហគ្រាស, បទបង្ហាញក្នុងសិក្ខាសាលា...' : 'Field visit to SME farms, workshop presentation...'}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </form>
      </Modal>

      {/* Return Modal */}
      <Modal
        open={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        title={t('markReturned')}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsReturnOpen(false)} disabled={submitting}>
              {t('cancel')}
            </Button>
            <Button variant="primary" onClick={handleSubmitReturn} loading={submitting}>
              {lang === 'kh' ? 'បញ្ជាក់ការសង' : 'Confirm Return'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitReturn} className="space-y-3.5">
          <Input
            label={t('actualReturnDate')}
            type="date"
            required
            value={returnForm.actual_return_date}
            onChange={(e) => setReturnForm({ ...returnForm, actual_return_date: e.target.value })}
          />

          <Input
            label={t('returnCondition')}
            required
            placeholder="e.g. Good condition, all cables present"
            value={returnForm.condition_on_return}
            onChange={(e) => setReturnForm({ ...returnForm, condition_on_return: e.target.value })}
          />

          <Textarea
            label={t('notes')}
            rows={2}
            placeholder={lang === 'kh' ? 'សម្គាល់ការខូចខាត ឬបញ្ហាណាមួយ...' : 'Any damage or issues noticed...'}
            value={returnForm.notes}
            onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}
