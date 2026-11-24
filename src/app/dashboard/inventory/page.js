'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  Download,
  Edit2,
  Trash2,
  Eye,
  MapPin,
  ImageIcon,
  FolderTree,
  DollarSign,
  Calendar,
  Truck,
  FileText,
  AlertTriangle,
  Layers,
  Tag,
  Barcode,
  CheckCircle2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import Badge from '@/components/ui/Badge';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import ImageUpload from '@/components/ui/ImageUpload';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/States';
import { useLanguage } from '@/lib/LanguageContext';

export default function InventoryPage() {
  const { t, lang } = useLanguage();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Filters & search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    item_code: '',
    name: '',
    category_id: '',
    description: '',
    quantity: 10,
    unit: 'pcs',
    min_stock_level: 5,
    location: '',
    purchase_price: '',
    supplier_id: '',
    purchase_date: new Date().toISOString().split('T')[0],
    image_url: '',
    image_public_id: '',
  });

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search,
        categoryId: categoryFilter,
        status: statusFilter,
        sortBy,
        sortOrder,
      });

      const res = await fetch(`/api/inventory?${params}`);
      if (!res.ok) throw new Error('Failed to load inventory items');
      const data = await res.json();
      setItems(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, categoryFilter, statusFilter, sortBy, sortOrder]);

  const fetchMeta = async () => {
    try {
      const [catsRes, supsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/suppliers?all=true'),
      ]);
      if (catsRes.ok) {
        const cats = await catsRes.json();
        setCategories(cats || []);
      }
      if (supsRes.ok) {
        const sups = await supsRes.json();
        setSuppliers(sups || []);
      }
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleOpenAdd = () => {
    setFormData({
      item_code: '',
      name: '',
      category_id: categories[0]?.id || '',
      description: '',
      quantity: 10,
      unit: 'pcs',
      min_stock_level: 5,
      location: '',
      purchase_price: '',
      supplier_id: suppliers[0]?.id || '',
      purchase_date: new Date().toISOString().split('T')[0],
      image_url: '',
      image_public_id: '',
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      item_code: item.item_code,
      name: item.name,
      category_id: item.category_id || '',
      description: item.description || '',
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      min_stock_level: item.min_stock_level,
      location: item.location || '',
      purchase_price: item.purchase_price || '',
      supplier_id: item.supplier_id || '',
      purchase_date: item.purchase_date ? item.purchase_date.split('T')[0] : '',
      status: item.status,
      image_url: item.image_url || '',
      image_public_id: item.image_public_id || '',
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (item) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const handleOpenView = (item) => {
    setSelectedItem(item);
    setIsViewOpen(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create item');
      }
      setIsAddOpen(false);
      fetchItems();
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
      const res = await fetch(`/api/inventory/${selectedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update item');
      }
      setIsEditOpen(false);
      fetchItems();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/inventory/${selectedItem.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete item');
      }
      setIsDeleteOpen(false);
      fetchItems();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = () => {
    if (!items.length) return;
    const headers = ['Item Code', 'Item Name', 'Category', 'Quantity', 'Unit', 'Min Stock', 'Status', 'Location', 'Purchase Price'];
    const rows = items.map(i => [
      `"${i.item_code}"`,
      `"${i.name}"`,
      `"${i.category_name || ''}"`,
      i.quantity,
      `"${i.unit}"`,
      i.min_stock_level,
      `"${i.status}"`,
      `"${i.location || ''}"`,
      i.purchase_price || '0.00',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `innolab-inventory-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'in_stock':
        return <Badge variant="success" dot size="sm">{t('in_stock')}</Badge>;
      case 'low_stock':
        return <Badge variant="warning" dot size="sm">{t('low_stock')}</Badge>;
      case 'out_of_stock':
        return <Badge variant="danger" dot size="sm">{t('out_of_stock')}</Badge>;
      case 'discontinued':
        return <Badge variant="default" size="sm">{t('discontinued')}</Badge>;
      default:
        return <Badge variant="default" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-main tracking-tight">{t('inventoryTitle')}</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {t('inventorySubtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!items.length}>
            <Download className="h-3.5 w-3.5" /> {t('exportCSV')}
          </Button>
          <Button variant="primary" size="sm" onClick={handleOpenAdd}>
            <Plus className="h-3.5 w-3.5" /> {t('addNewItem')}
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass rounded-xl p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <Input
            placeholder={t('search') + '...'}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            leftIcon={<Search className="h-3.5 w-3.5" />}
          />

          <Select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            options={[
              { value: '', label: `${t('all')} ${t('categories')}` },
              ...categories.map(c => ({ value: String(c.id), label: c.name })),
            ]}
          />

          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            options={[
              { value: '', label: `${t('all')} ${t('status')}` },
              { value: 'in_stock', label: t('in_stock') },
              { value: 'low_stock', label: t('low_stock') },
              { value: 'out_of_stock', label: t('out_of_stock') },
              { value: 'discontinued', label: t('discontinued') },
            ]}
          />

          <Select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split('-');
              setSortBy(sb);
              setSortOrder(so);
            }}
            options={[
              { value: 'created_at-DESC', label: 'Newest First' },
              { value: 'name-ASC', label: 'Name (A to Z)' },
              { value: 'quantity-DESC', label: 'Quantity (High to Low)' },
              { value: 'quantity-ASC', label: 'Quantity (Low to High)' },
              { value: 'item_code-ASC', label: 'Code (A to Z)' },
            ]}
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="glass rounded-xl overflow-hidden">
        {loading ? (
          <LoadingState message={t('loading')} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchItems} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={Package}
            title={t('noData')}
            message={search || categoryFilter || statusFilter ? 'Try clearing your filters' : 'Add your first inventory item to get started'}
            action={
              <Button size="sm" onClick={handleOpenAdd}>
                <Plus className="h-3.5 w-3.5" /> {t('addNewItem')}
              </Button>
            }
          />
        ) : (
          <>
            {/* Desktop Table View (Hidden on mobile) */}
            <div className="table-container hidden md:block">
              <table>
                <thead>
                  <tr>
                    <th className="w-12 text-center">Photo</th>
                    <th>{t('itemCode')}</th>
                    <th>{t('itemName')}</th>
                    <th>{t('category')}</th>
                    <th>{t('stockLevel')}</th>
                    <th>{t('location')}</th>
                    <th>{t('status')}</th>
                    <th className="text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const pct = Math.min(100, Math.round((item.quantity / Math.max(item.min_stock_level * 2, 1)) * 100));
                    return (
                      <tr key={item.id}>
                        {/* Image Thumbnail */}
                        <td className="w-14 text-center">
                          <div
                            onClick={() => handleOpenView(item)}
                            className="w-11 h-11 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] border border-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-200 shadow-xs mx-auto group/thumb backdrop-blur-md"
                            title={item.name}
                          >
                            {item.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center ${item.image_url ? 'hidden' : 'flex'}`}>
                              <Package className="h-4 w-4 text-text-muted group-hover/thumb:text-primary transition-colors" />
                            </div>
                          </div>
                        </td>

                        <td className="font-mono text-xs font-bold text-primary dark:text-cyan-400 whitespace-nowrap">
                          {item.item_code}
                        </td>

                        <td>
                          <div className="max-w-[220px]">
                            <p className="font-semibold text-text-main text-xs truncate">{item.name}</p>
                            {item.description && (
                              <p className="text-[11px] text-text-muted truncate mt-0.5">{item.description}</p>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: item.category_color || '#367A43' }}
                            />
                            <span className="text-xs text-text-secondary">{item.category_name || 'Unassigned'}</span>
                          </div>
                        </td>

                        <td>
                          <div className="min-w-[110px]">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="font-bold text-text-main">
                                {item.quantity} <span className="text-[11px] font-normal text-text-muted">{item.unit}</span>
                              </span>
                              <span className="text-[10px] text-text-muted">Min: {item.min_stock_level}</span>
                            </div>
                            <div className="w-full h-1.5 bg-black/[0.08] dark:bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${item.quantity === 0
                                  ? 'bg-danger'
                                  : item.quantity <= item.min_stock_level
                                    ? 'bg-warning'
                                    : 'bg-primary-light'
                                  }`}
                                style={{ width: `${item.quantity === 0 ? 100 : Math.max(pct, 5)}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="text-xs text-text-secondary whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-text-muted" />
                            {item.location || '—'}
                          </span>
                        </td>

                        <td>{getStatusBadge(item.status)}</td>

                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenView(item)}
                              title={t('view')}
                              className="p-1.5 text-text-muted hover:text-text-main rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              title={t('edit')}
                              className="p-1.5 text-text-muted hover:text-primary rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenDelete(item)}
                              title={t('delete')}
                              className="p-1.5 text-text-muted hover:text-danger rounded-md hover:bg-danger/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Data Row Cards (Zero horizontal scroll on phones) */}
            <div className="md:hidden divide-y divide-border">
              {items.map((item) => {
                const pct = Math.min(100, Math.round((item.quantity / Math.max(item.min_stock_level * 2, 1)) * 100));
                return (
                  <div key={item.id} className="p-3.5 space-y-2.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    {/* Header: Photo + Name + Code + Status */}
                    <div className="flex items-start gap-3">
                      <div
                        onClick={() => handleOpenView(item)}
                        className="w-12 h-12 rounded-xl bg-black/[0.04] dark:bg-white/10 border border-border flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer shadow-xs"
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <Package className="h-5 w-5 text-primary dark:text-cyan-400" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] font-bold text-primary dark:text-cyan-400">
                            {item.item_code}
                          </span>
                          {getStatusBadge(item.status)}
                        </div>
                        <h4
                          onClick={() => handleOpenView(item)}
                          className="text-xs font-bold text-text-main truncate mt-0.5 cursor-pointer hover:text-primary transition-colors"
                        >
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-text-muted">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.category_color || '#367A43' }}
                          />
                          <span className="truncate">{item.category_name || 'Unassigned'}</span>
                          {item.location && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-0.5 truncate">
                                <MapPin className="h-3 w-3" />
                                {item.location}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Stock Level Bar */}
                    <div className="p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-border">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[11px] text-text-muted font-medium">{t('stockLevel')}</span>
                        <span className="font-bold text-text-main">
                          {item.quantity} {item.unit}{' '}
                          <span className="text-[10px] font-normal text-text-muted">(Min: {item.min_stock_level})</span>
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-black/[0.08] dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${item.quantity === 0
                            ? 'bg-danger'
                            : item.quantity <= item.min_stock_level
                              ? 'bg-warning'
                              : 'bg-primary-light'
                            }`}
                          style={{ width: `${item.quantity === 0 ? 100 : Math.max(pct, 5)}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions Row */}
                    <div className="flex items-center justify-end gap-1.5 pt-0.5">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleOpenView(item)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> {t('view')}
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenEdit(item)}
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1 text-primary" /> {t('edit')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleOpenDelete(item)}
                        className="text-danger hover:bg-danger/10"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> {t('delete')}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
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

      {/* Add Item Modal */}
      <Modal
        open={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title={t('addNewItem')}
        description={lang === 'kh' ? 'បំពេញព័ត៌មានតាមជួរខាងក្រោមដើម្បីចុះបញ្ជីទំនិញថ្មី' : 'Fill in the specifications below to register a new inventory item'}
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={submitting}>
              {t('cancel')}
            </Button>
            <Button variant="primary" onClick={handleSubmitAdd} loading={submitting}>
              {t('save')}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitAdd} className="space-y-2.5">
          {/* Row 1: Photo & Core Identifiers & Categorization */}
          <div className="bg-white rounded-xl border border-border p-3 flex flex-col sm:flex-row gap-3 items-stretch shadow-2xs">
            {/* Compact Photo Upload Box */}
            <div className="w-full sm:w-28 shrink-0 flex flex-col justify-center">
              <ImageUpload
                value={formData.image_url}
                onChange={(url, pid) => setFormData(prev => ({
                  ...prev,
                  image_url: url || '',
                  image_public_id: pid !== undefined ? pid : prev.image_public_id || ''
                }))}
                label=""
                folder="inventory"
                compact={true}
                className="w-full h-full min-h-[102px]"
              />
            </div>

            {/* Core Identification and Location Fields */}
            <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
              {/* Row 1a: Name and Item Code */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-8">
                  <Input
                    label={t('itemName')}
                    required
                    placeholder="e.g. Double A A4 Paper 80gsm, Dell Latitude Laptop..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-4">
                  <Input
                    label={t('itemCode')}
                    placeholder="INV-XXXX (Auto)"
                    value={formData.item_code}
                    onChange={(e) => setFormData({ ...formData, item_code: e.target.value })}
                  />
                </div>
              </div>

              {/* Row 1b: Category, Supplier, Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Select
                  label={t('category')}
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  options={categories.map(c => ({ value: String(c.id), label: c.name }))}
                />
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
                  label={t('location')}
                  placeholder="e.g. Shelf B-2, Room 102"
                  leftIcon={<MapPin className="h-3.5 w-3.5" />}
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Stock Levels & Financials (4 items horizontal row) */}
          <div className="bg-white rounded-xl border border-border p-3 shadow-2xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Input
                label={t('quantity')}
                type="number"
                min="0"
                required
                placeholder="0"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              />
              <Input
                label={t('unit')}
                placeholder="pcs, reams, boxes..."
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
              <Input
                label={t('minStockAlert')}
                type="number"
                min="0"
                placeholder="5"
                value={formData.min_stock_level}
                onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })}
              />
              <Input
                label={t('purchasePrice')}
                type="number"
                step="0.01"
                placeholder="0.00"
                leftIcon={<DollarSign className="h-3.5 w-3.5" />}
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
              />
            </div>
          </div>

          {/* Row 3: Purchase Date & Description (compact single horizontal row) */}
          <div className="bg-white rounded-xl border border-border p-3 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-4">
                <Input
                  label={t('purchaseDate')}
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                />
              </div>
              <div className="sm:col-span-8">
                <Input
                  label={t('description')}
                  placeholder={lang === 'kh' ? 'បញ្ចូលលក្ខណៈបច្ចេកទេស ឬកំណត់សម្គាល់...' : 'Enter specifications or notes...'}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`${t('editItem')}: ${selectedItem?.item_code || ''}`}
        description={lang === 'kh' ? 'កែប្រែទិន្នន័យ និងព័ត៌មានលម្អិតរបស់ទំនិញ' : 'Update item specifications and stock parameters'}
        size="xl"
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
        <form onSubmit={handleSubmitEdit} className="space-y-2.5">
          {/* Row 1: Photo & Core Identifiers & Categorization */}
          <div className="bg-white rounded-xl border border-border p-3 flex flex-col sm:flex-row gap-3 items-stretch shadow-2xs">
            {/* Compact Photo Upload Box */}
            <div className="w-full sm:w-28 shrink-0 flex flex-col justify-center">
              <ImageUpload
                value={formData.image_url}
                onChange={(url, pid) => setFormData(prev => ({
                  ...prev,
                  image_url: url || '',
                  image_public_id: pid !== undefined ? pid : prev.image_public_id || ''
                }))}
                label=""
                folder="inventory"
                compact={true}
                className="w-full h-full min-h-[102px]"
              />
            </div>

            {/* Core Identification and Location Fields */}
            <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
              {/* Row 1a: Name, Code (disabled), and Status */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-6">
                  <Input
                    label={t('itemName')}
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-3">
                  <Input
                    label={t('itemCode')}
                    disabled
                    value={formData.item_code}
                  />
                </div>
                <div className="sm:col-span-3">
                  <Select
                    label={t('status')}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    options={[
                      { value: 'in_stock', label: t('in_stock') },
                      { value: 'low_stock', label: t('low_stock') },
                      { value: 'out_of_stock', label: t('out_of_stock') },
                      { value: 'discontinued', label: t('discontinued') },
                    ]}
                  />
                </div>
              </div>

              {/* Row 1b: Category, Supplier, Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Select
                  label={t('category')}
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  options={categories.map(c => ({ value: String(c.id), label: c.name }))}
                />
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
                  label={t('location')}
                  placeholder="e.g. Shelf B-2, Room 102"
                  leftIcon={<MapPin className="h-3.5 w-3.5" />}
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Row 2: Stock Levels & Financials (4 items horizontal row) */}
          <div className="bg-white rounded-xl border border-border p-3 shadow-2xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Input
                label={t('quantity')}
                type="number"
                min="0"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
              />
              <Input
                label={t('unit')}
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              />
              <Input
                label={t('minStockAlert')}
                type="number"
                min="0"
                value={formData.min_stock_level}
                onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 0 })}
              />
              <Input
                label={t('purchasePrice')}
                type="number"
                step="0.01"
                leftIcon={<DollarSign className="h-3.5 w-3.5" />}
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
              />
            </div>
          </div>

          {/* Row 3: Purchase Date & Description (compact single horizontal row) */}
          <div className="bg-white rounded-xl border border-border p-3 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
              <div className="sm:col-span-4">
                <Input
                  label={t('purchaseDate')}
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                />
              </div>
              <div className="sm:col-span-8">
                <Input
                  label={t('description')}
                  placeholder={lang === 'kh' ? 'បញ្ចូលលក្ខណៈបច្ចេកទេស ឬកំណត់សម្គាល់...' : 'Enter specifications or notes...'}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* View Item Details Modal */}
      <Modal
        open={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={t('itemDetails')}
        size="xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsViewOpen(false);
                handleOpenEdit(selectedItem);
              }}
              className="gap-1.5"
            >
              <Edit2 className="h-3.5 w-3.5" />
              {t('editItem')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsViewOpen(false)}>
              {t('close')}
            </Button>
          </div>
        }
      >
        {selectedItem && (
          <div className="space-y-3">
            {/* Main Row: Left Media Card + Right Executive Info Card */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              {/* Left Column: Image & Status & Mini Gauge */}
              <div className="w-full sm:w-56 shrink-0 bg-white rounded-xl border border-border p-3 flex flex-col items-center justify-between gap-2.5 shadow-2xs">
                {/* Photo Preview */}
                <div className="relative group/viewimg w-full h-32 rounded-lg bg-neutral-50 border border-border flex items-center justify-center overflow-hidden">
                  {selectedItem.image_url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedItem.image_url}
                        alt={selectedItem.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/viewimg:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                        }}
                      />
                      {selectedItem.image_url.includes('cloudinary') && (
                        <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-cyan-950/85 border border-cyan-400/40 text-cyan-300 backdrop-blur-md flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                          Cloud
                        </div>
                      )}
                    </>
                  ) : null}
                  <div className={`w-full h-full flex flex-col items-center justify-center text-text-muted ${selectedItem.image_url ? 'hidden' : 'flex'}`}>
                    <Package className="h-7 w-7 text-text-muted/60 mb-0.5" />
                    <span className="text-[10px] text-text-muted">{lang === 'kh' ? 'គ្មានរូបថត' : 'No Photo'}</span>
                  </div>
                </div>

                {/* Badges Row */}
                <div className="w-full flex items-center justify-between gap-1.5">
                  <span className="font-mono text-[11px] font-bold text-primary px-2 py-0.5 rounded bg-primary/10 border border-primary/20">
                    {selectedItem.item_code}
                  </span>
                  {getStatusBadge(selectedItem.status)}
                </div>

                {/* Mini Stock Gauge */}
                <div className="w-full bg-neutral-50 rounded-lg p-2 border border-border/80">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-text-muted font-medium">{t('stockLevel')}</span>
                    <span className="font-bold text-text-main">{selectedItem.quantity} {selectedItem.unit}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                    {(() => {
                      const qty = Number(selectedItem.quantity) || 0;
                      const min = Number(selectedItem.min_stock_level) || 0;
                      let pct = min > 0 ? Math.min(Math.round((qty / (min * 2)) * 100), 100) : (qty > 0 ? 100 : 0);
                      let colorClass = 'bg-emerald-500';
                      if (qty === 0) {
                        pct = 0;
                        colorClass = 'bg-rose-500';
                      } else if (qty <= min) {
                        colorClass = 'bg-amber-500';
                      }
                      return (
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                          style={{ width: `${Math.max(pct, qty > 0 ? 8 : 0)}%` }}
                        />
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Right Column: Title + 6 Specifications + Description */}
              <div className="flex-1 min-w-0 bg-white rounded-xl border border-border p-3.5 flex flex-col justify-between gap-2.5 shadow-2xs">
                {/* Header Title + Category Pill */}
                <div className="flex items-start justify-between gap-2 border-b border-border/60 pb-2">
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
                      {lang === 'kh' ? 'ព័ត៌មានលម្អិតនៃទំនិញ' : 'Item Specifications'}
                    </span>
                    <h3 className="text-base font-bold text-text-main leading-snug truncate">
                      {selectedItem.name}
                    </h3>
                  </div>
                  {selectedItem.category_name && (
                    <span className="text-xs font-medium text-primary px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                      {selectedItem.category_name}
                    </span>
                  )}
                </div>

                {/* 6 Key Specifications in a 3-column x 2-row clean grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {/* Spec 1: Quantity */}
                  <div className="p-2 rounded-lg bg-neutral-50/80 border border-border/70 flex items-center gap-2">
                    <div className="w-6.5 h-6.5 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      <Package className="h-3 w-3" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-text-muted truncate">{t('quantity')}</p>
                      <p className="text-xs font-bold text-text-main truncate">{selectedItem.quantity} {selectedItem.unit}</p>
                    </div>
                  </div>

                  {/* Spec 2: Min Stock Alert */}
                  <div className="p-2 rounded-lg bg-neutral-50/80 border border-border/70 flex items-center gap-2">
                    <div className="w-6.5 h-6.5 rounded bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                      <AlertTriangle className="h-3 w-3" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-text-muted truncate">{t('minStockAlert')}</p>
                      <p className="text-xs font-semibold text-text-main truncate">{selectedItem.min_stock_level} {selectedItem.unit}</p>
                    </div>
                  </div>

                  {/* Spec 3: Location */}
                  <div className="p-2 rounded-lg bg-neutral-50/80 border border-border/70 flex items-center gap-2">
                    <div className="w-6.5 h-6.5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <MapPin className="h-3 w-3" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-text-muted truncate">{t('location')}</p>
                      <p className="text-xs font-semibold text-text-main truncate">{selectedItem.location || '—'}</p>
                    </div>
                  </div>

                  {/* Spec 4: Purchase Price */}
                  <div className="p-2 rounded-lg bg-neutral-50/80 border border-border/70 flex items-center gap-2">
                    <div className="w-6.5 h-6.5 rounded bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
                      <DollarSign className="h-3 w-3" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-text-muted truncate">{t('purchasePrice')}</p>
                      <p className="text-xs font-bold text-text-main truncate">
                        {selectedItem.purchase_price ? `$${parseFloat(selectedItem.purchase_price).toFixed(2)}` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Spec 5: Purchase Date */}
                  <div className="p-2 rounded-lg bg-neutral-50/80 border border-border/70 flex items-center gap-2">
                    <div className="w-6.5 h-6.5 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                      <Calendar className="h-3 w-3" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-text-muted truncate">{t('purchaseDate')}</p>
                      <p className="text-xs font-semibold text-text-main truncate">
                        {selectedItem.purchase_date ? selectedItem.purchase_date.split('T')[0] : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Spec 6: Supplier */}
                  <div className="p-2 rounded-lg bg-neutral-50/80 border border-border/70 flex items-center gap-2">
                    <div className="w-6.5 h-6.5 rounded bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                      <Truck className="h-3 w-3" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-text-muted truncate">{t('supplier')}</p>
                      <p className="text-xs font-semibold text-text-main truncate">
                        {selectedItem.supplier_name || (lang === 'kh' ? 'ផ្ទៃក្នុង / គ្មាន' : 'Internal / None')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Description Row */}
                {selectedItem.description && (
                  <div className="rounded-lg bg-neutral-50/80 border border-border/70 px-3 py-2 flex items-start gap-2">
                    <FileText className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{t('description')}</p>
                      <p className="text-xs text-text-main leading-snug line-clamp-2">
                        {selectedItem.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={t('delete')}
        message={t('confirmDeleteItem')}
        confirmText={t('delete')}
        variant="danger"
        loading={submitting}
      />
    </div>
  );
}
