'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ArrowDownToLine,
  Plus,
  Search,
  Calendar,
  Truck,
  User,
  Hash,
  Download,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/States';
import { useLanguage } from '@/lib/LanguageContext';

export default function StockInPage() {
  const { t, lang } = useLanguage();
  const [records, setRecords] = useState([]);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
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
    received_date: new Date().toISOString().split('T')[0],
    supplier_id: '',
    reference_no: '',
    notes: '',
  });

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

      const res = await fetch(`/api/stock-in?${params}`);
      if (!res.ok) throw new Error('Failed to load stock in records');
      const data = await res.json();
      setRecords(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, startDate, endDate]);

  const fetchDropdowns = async () => {
    try {
      const [itemsRes, supsRes] = await Promise.all([
        fetch('/api/inventory?all=true'),
        fetch('/api/suppliers?all=true'),
      ]);
      if (itemsRes.ok) setItems(await itemsRes.json());
      if (supsRes.ok) setSuppliers(await supsRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleOpenAdd = () => {
    setFormData({
      item_id: items[0]?.id || '',
      quantity: 10,
      received_date: new Date().toISOString().split('T')[0],
      supplier_id: suppliers[0]?.id || '',
      reference_no: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/stock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record stock in');
      }
      setIsModalOpen(false);
      fetchRecords();
      fetchDropdowns(); // Refresh quantities
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = () => {
    if (!records.length) return;
    const headers = ['Date', 'Item Code', 'Item Name', 'Quantity', 'Unit', 'Supplier', 'Reference No', 'Received By', 'Notes'];
    const rows = records.map(r => [
      `"${r.received_date ? r.received_date.split('T')[0] : ''}"`,
      `"${r.item_code}"`,
      `"${r.item_name}"`,
      r.quantity,
      `"${r.unit}"`,
      `"${r.supplier_name || ''}"`,
      `"${r.reference_no || ''}"`,
      `"${r.receiver_name || ''}"`,
      `"${r.notes || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `innolab-stock-in-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-main tracking-tight">{t('stockInTitle')}</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {t('stockInSubtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!records.length}>
            <Download className="h-3.5 w-3.5" /> {t('exportCSV')}
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenAdd}>
            <Plus className="h-3.5 w-3.5" /> {t('recordStockIn')}
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="glass rounded-xl p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <Input
              placeholder={lang === 'kh' ? 'ស្វែងរកឈ្មោះទំនិញ លេខកូដ ឬអ្នកផ្គត់ផ្គង់...' : 'Search item name, code, supplier, reference...'}
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
              leftIcon={<Search className="h-3.5 w-3.5" />}
            />
          </div>
          <Input
            type="date"
            placeholder={lang === 'kh' ? 'ចាប់ពីថ្ងៃ' : 'Start Date'}
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
          />
          <Input
            type="date"
            placeholder={lang === 'kh' ? 'ដល់ថ្ងៃ' : 'End Date'}
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
            icon={ArrowDownToLine}
            title={lang === 'kh' ? 'មិនមានកំណត់ត្រាទំនិញចូលស្តុកទេ' : 'No stock-in records found'}
            message={lang === 'kh' ? 'កត់ត្រាទំនិញចូលស្តុកដើម្បីបង្កើនចំនួនស្តុក' : 'Record new deliveries to increase inventory stock levels'}
            action={
              <Button size="sm" onClick={handleOpenAdd}>
                <Plus className="h-3.5 w-3.5" /> {t('recordStockIn')}
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
                    <th>{t('date')}</th>
                    <th>{t('itemName')}</th>
                    <th>{t('quantity')}</th>
                    <th>{t('supplier')}</th>
                    <th>{t('referenceNo')}</th>
                    <th>{t('receivedBy')}</th>
                    <th>{t('notes')}</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td className="text-xs text-text-secondary whitespace-nowrap">
                        {r.received_date ? r.received_date.split('T')[0] : 'N/A'}
                      </td>
                      <td>
                        <div>
                          <span className="font-semibold text-text-main text-xs">{r.item_name}</span>
                          <p className="text-[11px] font-mono text-text-muted">{r.item_code}</p>
                        </div>
                      </td>
                      <td>
                        <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                          +{r.quantity} {r.unit}
                        </span>
                      </td>
                      <td className="text-xs text-text-secondary">
                        {r.supplier_name || '—'}
                      </td>
                      <td className="text-xs font-mono text-text-secondary">
                        {r.reference_no || '—'}
                      </td>
                      <td className="text-xs text-text-main">
                        {r.receiver_name || 'Staff'}
                      </td>
                      <td className="text-xs text-text-muted max-w-xs truncate">
                        {r.notes || '—'}
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
                    <span className="inline-flex items-center gap-1 font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                      +{r.quantity} {r.unit}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-border text-[11px]">
                    <div>
                      <span className="text-text-muted block">{t('date')}:</span>
                      <span className="font-medium text-text-main">{r.received_date ? r.received_date.split('T')[0] : 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block">{t('supplier')}:</span>
                      <span className="font-medium text-text-secondary truncate block">{r.supplier_name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block">{t('referenceNo')}:</span>
                      <span className="font-mono text-text-secondary">{r.reference_no || '—'}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block">{t('receivedBy')}:</span>
                      <span className="text-text-main">{r.receiver_name || 'Staff'}</span>
                    </div>
                  </div>

                  {r.notes && (
                    <p className="text-[11px] text-text-muted italic truncate">
                      Notes: {r.notes}
                    </p>
                  )}
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

      {/* Record Stock In Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('recordStockIn')}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
              {t('cancel')}
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={submitting}>
              {t('save')}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Select
            label={t('itemName')}
            required
            value={formData.item_id}
            onChange={(e) => setFormData({ ...formData, item_id: e.target.value })}
            options={items.map(it => ({
              value: String(it.id),
              label: `${it.name} (${it.item_code}) — Current: ${it.quantity} ${it.unit}`,
            }))}
          />

          <div className="grid grid-cols-2 gap-3.5">
            <Input
              label={t('quantityReceived')}
              type="number"
              min="1"
              required
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
            />
            <Input
              label={t('receivedDate')}
              type="date"
              required
              value={formData.received_date}
              onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <Select
              label={t('supplier')}
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              options={[
                { value: '', label: lang === 'kh' ? 'គ្មាន / ផ្ទៃក្នុង' : 'None / Internal' },
                ...suppliers.map(s => ({ value: String(s.id), label: s.name })),
              ]}
            />
            <Input
              label={t('referenceNo')}
              placeholder="e.g. PO-2026-001, INV-9981"
              value={formData.reference_no}
              onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })}
            />
          </div>

          <Textarea
            label={t('notes')}
            rows={2}
            placeholder={lang === 'kh' ? 'កំណត់សម្គាល់បន្ថែម ឬលក្ខខណ្ឌពេលទទួល...' : 'Delivery conditions, batch number, or purchase notes...'}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
}
