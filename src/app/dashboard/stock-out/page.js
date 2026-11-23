'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowUpFromLine,
  Plus,
  Search,
  Download,
  AlertCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/States';
import { useLanguage } from '@/lib/LanguageContext';

export default function StockOutPage() {
  const { t, lang } = useLanguage();
  const [records, setRecords] = useState([]);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    item_id: '',
    quantity: 1,
    reason: 'Internal Department Use',
    department: 'Operations',
    recipient: '',
    out_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const selectedItemMeta = items.find(i => String(i.id) === String(formData.item_id));

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search,
        startDate,
        endDate,
      });

      const res = await fetch(`/api/stock-out?${params}`);
      if (!res.ok) throw new Error('Failed to load stock out records');
      const data = await res.json();
      setRecords(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, startDate, endDate]);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/inventory?all=true');
      if (res.ok) {
        const data = await res.json();
        setItems(data || []);
      }
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
    const available = items.filter(i => i.quantity > 0);
    setFormData({
      item_id: available[0]?.id || items[0]?.id || '',
      quantity: 1,
      reason: 'Internal Department Use',
      department: 'Operations',
      recipient: '',
      out_date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedItemMeta && formData.quantity > selectedItemMeta.quantity) {
      alert(lang === 'kh' ? `មិនអាចដកទំនិញ ${formData.quantity} ${selectedItemMeta.unit} បានទេ ព្រោះក្នុងស្តុកមានត្រឹមតែ ${selectedItemMeta.quantity} ប៉ុណ្ណោះ។` : `Cannot dispatch ${formData.quantity} ${selectedItemMeta.unit}. Only ${selectedItemMeta.quantity} available.`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/stock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record stock out');
      }
      setIsModalOpen(false);
      fetchRecords();
      fetchItems(); // Refresh quantities
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = () => {
    if (!records.length) return;
    const headers = ['Date', 'Item Code', 'Item Name', 'Quantity', 'Unit', 'Reason', 'Department', 'Recipient', 'Recorded By'];
    const rows = records.map(r => [
      `"${r.out_date ? r.out_date.split('T')[0] : ''}"`,
      `"${r.item_code}"`,
      `"${r.item_name}"`,
      r.quantity,
      `"${r.unit}"`,
      `"${r.reason || ''}"`,
      `"${r.department || ''}"`,
      `"${r.recipient || ''}"`,
      `"${r.recorder_name || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `innolab-stock-out-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-main tracking-tight">{t('stockOutTitle')}</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {t('stockOutSubtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!records.length}>
            <Download className="h-3.5 w-3.5" /> {t('exportCSV')}
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenAdd}>
            <Plus className="h-3.5 w-3.5" /> {t('recordStockOut')}
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="glass rounded-xl p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            placeholder={lang === 'kh' ? 'ស្វែងរកឈ្មោះទំនិញ អ្នកទទួល ឬផ្នែក...' : 'Search item, recipient, department...'}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            leftIcon={<Search className="h-3.5 w-3.5" />}
          />
          <Input
            type="date"
            placeholder={lang === 'kh' ? 'ចាប់ពីថ្ងៃ' : 'From Date'}
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          />
          <Input
            type="date"
            placeholder={lang === 'kh' ? 'ដល់ថ្ងៃ' : 'To Date'}
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        {loading ? (
          <LoadingState message={t('loading')} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchRecords} />
        ) : records.length === 0 ? (
          <EmptyState
            icon={ArrowUpFromLine}
            title={lang === 'kh' ? 'មិនមានកំណត់ត្រាទំនិញចេញពីស្តុកទេ' : 'No stock out records'}
            message={lang === 'kh' ? 'កត់ត្រាទំនិញដែលបានដកជូនផ្នែកនានា ឬបុគ្គលិកដើម្បីតាមដានការថយចុះស្តុក' : 'Dispatch items to departments or staff to track stock reductions'}
            action={
              <Button size="sm" onClick={handleOpenAdd}>
                <Plus className="h-3.5 w-3.5" /> {t('recordStockOut')}
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
                    <th>{t('dispatchedDate')}</th>
                    <th>{t('itemName')}</th>
                    <th>{t('quantityDispatched')}</th>
                    <th>{t('reason')}</th>
                    <th>{t('department')}</th>
                    <th>{t('recipient')}</th>
                    <th>{t('recordedBy')}</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td className="text-xs text-text-secondary whitespace-nowrap">
                        {r.out_date ? r.out_date.split('T')[0] : '—'}
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-text-main text-xs">{r.item_name}</p>
                          <span className="font-mono text-[11px] text-primary">{r.item_code}</span>
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center px-2 py-0.5 rounded font-semibold text-xs bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                          -{r.quantity} {r.unit}
                        </span>
                      </td>
                      <td className="text-xs text-text-main font-medium">
                        {r.reason || (lang === 'kh' ? 'ចែកចាយទូទៅ' : 'General distribution')}
                      </td>
                      <td className="text-xs text-text-secondary">
                        {r.department || '—'}
                      </td>
                      <td className="text-xs text-text-secondary">
                        {r.recipient || '—'}
                      </td>
                      <td className="text-xs text-text-muted">
                        {r.recorder_name || 'System Admin'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Data Row Cards (No horizontal scroll on phones) */}
            <div className="md:hidden divide-y divide-border">
              {records.map((r) => (
                <div key={r.id} className="p-3.5 space-y-2 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-text-main">{r.item_name}</h4>
                      <span className="font-mono text-[11px] font-bold text-primary dark:text-cyan-400">{r.item_code}</span>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md font-bold text-xs bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                      -{r.quantity} {r.unit}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-border text-[11px]">
                    <div>
                      <span className="text-text-muted block">{t('dispatchedDate')}:</span>
                      <span className="font-medium text-text-main">{r.out_date ? r.out_date.split('T')[0] : '—'}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block">{t('recipient')}:</span>
                      <span className="font-medium text-text-secondary truncate block">{r.recipient || '—'}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block">{t('reason')}:</span>
                      <span className="text-text-main truncate block">{r.reason || (lang === 'kh' ? 'ចែកចាយទូទៅ' : 'General')}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block">{t('department')}:</span>
                      <span className="text-text-secondary truncate block">{r.department || '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
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

      {/* Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('recordStockOut')}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              {t('cancel')}
            </Button>
            <Button variant="danger" onClick={handleSubmit} loading={submitting}>
              {t('dispatchStock')}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <Select
              label={lang === 'kh' ? 'ជ្រើសរើសទំនិញត្រូវដកចេញ' : 'Select Item to Dispatch'}
              required
              value={formData.item_id}
              onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
              options={items.map(i => ({
                value: String(i.id),
                label: `${i.item_code} - ${i.name} (${lang === 'kh' ? 'ក្នុងស្តុក' : 'Available'}: ${i.quantity} ${i.unit})`,
              }))}
            />
            {selectedItemMeta && (
              <p className={`text-xs mt-1 font-medium ${selectedItemMeta.quantity === 0 ? 'text-danger' : 'text-text-secondary'}`}>
                {lang === 'kh' ? 'ចំនួនក្នុងស្តុកបច្ចុប្បន្ន' : 'Current in stock'}: {selectedItemMeta.quantity} {selectedItemMeta.unit}
                {selectedItemMeta.quantity === 0 && (lang === 'kh' ? ' (មិនអាចដកបានទេ — ទំនិញអស់ពីស្តុក!)' : ' (Cannot dispatch — out of stock!)')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <Input
              label={t('quantityDispatched')}
              type="number"
              min="1"
              max={selectedItemMeta?.quantity || 9999}
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
            />
            <Input
              label={t('dispatchedDate')}
              type="date"
              required
              value={formData.out_date}
              onChange={(e) => setFormData({ ...formData, out_date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <Input
              label={t('reason')}
              required
              placeholder={lang === 'kh' ? 'ឧ. វគ្គបណ្តុះបណ្តាល, សិក្ខាសាលា' : 'e.g. Training, Workshop, SME Demo'}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
            <Input
              label={t('department')}
              placeholder={lang === 'kh' ? 'ឧ. ប្រតិបត្តិការ, បច្ចេកវិទ្យា (IT)' : 'e.g. Operations, IT, SME Lab'}
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>

          <Input
            label={t('recipient')}
            required
            placeholder={lang === 'kh' ? 'ឈ្មោះបុគ្គលិកទទួលទំនិញ' : 'Name of person receiving the items'}
            value={formData.recipient}
            onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
          />

          <Textarea
            label={t('notes')}
            rows={2}
            placeholder={lang === 'kh' ? 'លេខគម្រោង ឬព័ត៌មានបន្ថែម...' : 'Project code, approved by, or additional context...'}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}
