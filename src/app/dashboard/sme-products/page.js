'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  MapPin,
  Calendar,
  Building2,
  Edit2,
  Trash2,
  Eye,
  ImageIcon,
  Upload,
  X,
  Clock,
  AlertTriangle,
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

export default function SmeProductsPage() {
  const { t, lang } = useLanguage();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Gallery state for view modal
  const [galleryImages, setGalleryImages] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [uploadingGalleryImg, setUploadingGalleryImg] = useState(false);

  const [formData, setFormData] = useState({
    sme_name: '',
    product_name: '',
    category: 'Food & Agriculture',
    quantity: 10,
    unit: 'pcs',
    received_date: new Date().toISOString().split('T')[0],
    sample_location: 'Showcase Shelf 1',
    mfg_date: '',
    expiry_date: '',
    status: 'active',
    description: '',
    notes: '',
    image_url: '',
    image_public_id: '',
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status: statusFilter,
        expiryStatus: expiryFilter,
      });

      const res = await fetch(`/api/sme-products?${params}`);
      if (!res.ok) throw new Error('Failed to load SME products');
      const data = await res.json();
      setProducts(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, expiryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const fetchGallery = async (productId) => {
    try {
      setLoadingGallery(true);
      const res = await fetch(`/api/sme-products/${productId}/images`);
      if (res.ok) {
        const data = await res.json();
        setGalleryImages(data || []);
      }
    } catch (e) {
      console.error('Error fetching gallery:', e);
    } finally {
      setLoadingGallery(false);
    }
  };

  const handleOpenAdd = () => {
    setFormData({
      sme_name: '',
      product_name: '',
      category: 'Food & Agriculture',
      quantity: 12,
      unit: 'jars',
      received_date: new Date().toISOString().split('T')[0],
      sample_location: 'Showcase Shelf 1',
      mfg_date: '',
      expiry_date: '',
      status: 'active',
      description: '',
      notes: '',
      image_url: '',
      image_public_id: '',
    });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (p) => {
    setSelectedProduct(p);
    setFormData({
      sme_name: p.sme_name,
      product_name: p.product_name,
      category: p.category || 'Food & Agriculture',
      quantity: p.quantity,
      unit: p.unit || 'pcs',
      received_date: p.received_date ? p.received_date.split('T')[0] : '',
      sample_location: p.sample_location || '',
      mfg_date: p.mfg_date ? p.mfg_date.split('T')[0] : '',
      expiry_date: p.expiry_date ? p.expiry_date.split('T')[0] : '',
      status: p.status || 'active',
      description: p.description || '',
      notes: p.notes || '',
      image_url: p.image_url || '',
      image_public_id: p.image_public_id || '',
    });
    setIsEditOpen(true);
  };

  const handleOpenView = (p) => {
    setSelectedProduct(p);
    setIsViewOpen(true);
    fetchGallery(p.id);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/sme-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to register product');
      }
      setIsAddOpen(false);
      fetchProducts();
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
      const res = await fetch(`/api/sme-products/${selectedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update product');
      }
      setIsEditOpen(false);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sme-products/${selectedProduct.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete');
      }
      setIsDeleteOpen(false);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddGalleryImage = async (url, pid) => {
    if (!selectedProduct || !url) return;
    try {
      setUploadingGalleryImg(true);
      const res = await fetch(`/api/sme-products/${selectedProduct.id}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: url,
          image_public_id: pid,
          caption: `${selectedProduct.product_name} Sample`,
        }),
      });
      if (res.ok) {
        fetchGallery(selectedProduct.id);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setUploadingGalleryImg(false);
    }
  };

  const handleDeleteGalleryImage = async (imgId) => {
    if (!confirm(lang === 'kh' ? 'តើអ្នកប្រាកដជាចង់លុបរូបភាពនេះមែនទេ?' : 'Delete this gallery image?')) return;
    try {
      const res = await fetch(`/api/sme-products/${selectedProduct.id}/images?imageId=${imgId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchGallery(selectedProduct.id);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'active':
        return <Badge variant="success" dot size="sm">{lang === 'kh' ? 'គំរូសកម្ម' : 'Active Sample'}</Badge>;
      case 'archived':
        return <Badge variant="default" size="sm">{lang === 'kh' ? 'រក្សាទុក' : 'Archived'}</Badge>;
      case 'returned':
        return <Badge variant="info" size="sm">{lang === 'kh' ? 'សងទៅសហគ្រាស' : 'Returned to SME'}</Badge>;
      case 'disposed':
        return <Badge variant="warning" size="sm">{lang === 'kh' ? 'បានបោះបង់' : 'Disposed'}</Badge>;
      case 'expired':
        return <Badge variant="danger" size="sm">{lang === 'kh' ? 'ផុតកំណត់' : 'Expired'}</Badge>;
      default:
        return <Badge variant="default" size="sm">{st}</Badge>;
    }
  };

  const getExpiryInfo = (p) => {
    if (p.status === 'expired') {
      return {
        status: 'expired',
        label: lang === 'kh' ? 'ផុតកំណត់' : 'Expired',
        variant: 'danger',
      };
    }
    if (!p.expiry_date) {
      return {
        status: 'non_perishable',
        label: lang === 'kh' ? 'គ្មានកាលកំណត់' : 'Non-perishable',
        variant: 'default',
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expDate = new Date(p.expiry_date);
    expDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        status: 'expired',
        label: lang === 'kh' ? `ផុតកំណត់ (${Math.abs(diffDays)} ថ្ងៃមុន)` : `Expired (${Math.abs(diffDays)}d ago)`,
        variant: 'danger',
        days: diffDays,
        formattedDate: p.expiry_date.split('T')[0],
      };
    }
    if (diffDays <= 30) {
      return {
        status: 'expiring_soon',
        label: lang === 'kh' ? `ជិតផុត (${diffDays} ថ្ងៃទៀត)` : `Expiring (${diffDays}d left)`,
        variant: 'warning',
        days: diffDays,
        formattedDate: p.expiry_date.split('T')[0],
      };
    }
    return {
      status: 'good',
      label: lang === 'kh' ? `សុពលភាពល្អ (${diffDays} ថ្ងៃ)` : `Good (${diffDays}d left)`,
      variant: 'success',
      days: diffDays,
      formattedDate: p.expiry_date.split('T')[0],
    };
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-main tracking-tight">{t('smeTitle')}</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {t('smeSubtitle')}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAdd}>
          <Plus className="h-3.5 w-3.5" /> {t('registerSMEProduct')}
        </Button>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <Input
            placeholder={lang === 'kh' ? 'ស្វែងរកឈ្មោះសហគ្រាស ផលិតផល ទីតាំង...' : 'Search SME name, product, location...'}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            leftIcon={<Search className="h-3.5 w-3.5" />}
          />
          <Select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            options={[
              { value: '', label: t('allStatuses') },
              { value: 'active', label: lang === 'kh' ? 'គំរូសកម្ម' : 'Active Samples' },
              { value: 'expired', label: t('expired') },
              { value: 'archived', label: lang === 'kh' ? 'រក្សាទុក' : 'Archived' },
              { value: 'returned', label: lang === 'kh' ? 'សងទៅសហគ្រាស' : 'Returned to SME' },
              { value: 'disposed', label: lang === 'kh' ? 'បានបោះបង់' : 'Disposed' },
            ]}
          />
          <Select
            value={expiryFilter}
            onChange={(e) => { setExpiryFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            options={[
              { value: '', label: t('allExpiry') },
              { value: 'expiring_soon', label: lang === 'kh' ? 'ជិតផុតកំណត់ (≤ ៣០ ថ្ងៃ)' : 'Expiring Soon (≤ 30 Days)' },
              { value: 'expired', label: lang === 'kh' ? 'បានផុតកំណត់' : 'Expired Products' },
              { value: 'good', label: lang === 'kh' ? 'នៅមានសុពលភាពល្អ' : 'Fresh & Active' },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        {loading ? (
          <LoadingState message={t('loading')} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchProducts} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title={lang === 'kh' ? 'មិនទាន់មានផលិតផលសហគ្រាសនៅឡើយទេ' : 'No SME products registered'}
            message={lang === 'kh' ? 'ចុះឈ្មោះផលិតផល និងគំរូសហគ្រាសក្នុងស្រុកដែលបានយកមកពិសោធន៍ ឬតាំងពិព័រណ៍' : 'Register local enterprise products and samples brought in for testing or exhibition'}
            action={
              <Button size="sm" onClick={handleOpenAdd}>
                <Plus className="h-3.5 w-3.5" /> {t('registerSMEProduct')}
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
                    <th className="w-12">{t('photo')}</th>
                    <th>{t('smeName')}</th>
                    <th>{t('productName')}</th>
                    <th>{t('category')}</th>
                    <th>{t('quantity')}</th>
                    <th>{t('location')}</th>
                    <th>{t('expiryDate')}</th>
                    <th>{t('status')}</th>
                    <th className="text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const expInfo = getExpiryInfo(p);
                    return (
                      <tr key={p.id}>
                        <td className="w-14 text-center">
                          <div
                            onClick={() => handleOpenView(p)}
                            className="w-11 h-11 rounded-xl bg-black/[0.04] dark:bg-white/[0.05] border border-border flex items-center justify-center overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-200 shadow-xs mx-auto group/sme backdrop-blur-md"
                            title={p.product_name}
                          >
                            {p.image_url ? (
                              <img
                                src={p.image_url}
                                alt={p.product_name}
                                className="w-full h-full object-cover group-hover/sme:scale-110 transition-transform duration-300"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full bg-primary/10 text-primary dark:text-cyan-300 items-center justify-center font-bold text-xs ${p.image_url ? 'hidden' : 'flex'}`}>
                              {p.sme_name?.charAt(0) || 'S'}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="font-semibold text-text-main text-xs">{p.sme_name}</span>
                        </td>
                        <td>
                          <div>
                            <p className="font-medium text-text-main text-xs">{p.product_name}</p>
                            {p.description && (
                              <p className="text-[11px] text-text-muted truncate max-w-[200px]">{p.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="text-xs text-text-secondary">
                          {p.category || 'Agri-food'}
                        </td>
                        <td className="text-xs font-semibold text-text-main">
                          {p.quantity} {p.unit}
                        </td>
                        <td className="text-xs text-text-secondary">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-text-muted" />
                            {p.sample_location || 'Showcase'}
                          </span>
                        </td>
                        <td>
                          <div className="space-y-0.5">
                            <Badge variant={expInfo.variant} size="xs">
                              {expInfo.label}
                            </Badge>
                            {p.expiry_date && (
                              <p className="text-[10px] text-text-muted">
                                {p.expiry_date.split('T')[0]}
                              </p>
                            )}
                          </div>
                        </td>
                        <td>{getStatusBadge(p.status)}</td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleOpenView(p)}
                              className="p-1.5 text-text-muted hover:text-text-main rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                              title={t('view')}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 text-text-muted hover:text-primary rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
                              title={t('edit')}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => { setSelectedProduct(p); setIsDeleteOpen(true); }}
                              className="p-1.5 text-text-muted hover:text-danger rounded-md hover:bg-danger/10"
                              title={t('delete')}
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

            {/* Mobile Data Row Cards (No horizontal scroll on phones) */}
            <div className="md:hidden divide-y divide-border">
              {products.map((p) => {
                const expInfo = getExpiryInfo(p);
                return (
                  <div key={p.id} className="p-3.5 space-y-2.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-start gap-3">
                      <div
                        onClick={() => handleOpenView(p)}
                        className="w-12 h-12 rounded-xl bg-black/[0.04] dark:bg-white/10 border border-border flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer shadow-xs"
                      >
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.product_name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-full h-full bg-primary/10 text-primary dark:text-cyan-300 flex items-center justify-center font-bold text-xs">
                            {p.sme_name?.charAt(0) || 'S'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-primary dark:text-cyan-400 truncate">
                            {p.sme_name}
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {expInfo.status !== 'non_perishable' && (
                              <Badge variant={expInfo.variant} size="xs">{expInfo.label}</Badge>
                            )}
                            {getStatusBadge(p.status)}
                          </div>
                        </div>
                        <h4
                          onClick={() => handleOpenView(p)}
                          className="text-xs font-bold text-text-main truncate mt-0.5 cursor-pointer hover:text-primary transition-colors"
                        >
                          {p.product_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-text-muted flex-wrap">
                          <span className="truncate">{p.category || 'Agri-food'}</span>
                          <span>•</span>
                          <span className="font-semibold text-text-main">{p.quantity} {p.unit}</span>
                          {p.sample_location && (
                            <>
                              <span>•</span>
                              <span className="truncate">{p.sample_location}</span>
                            </>
                          )}
                          {p.expiry_date && (
                            <>
                              <span>•</span>
                              <span className="text-text-secondary flex items-center gap-1">
                                <Clock className="h-3 w-3 text-text-muted" />
                                {t('expiresOn')}: {p.expiry_date.split('T')[0]}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1.5 pt-0.5">
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => handleOpenView(p)}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" /> {t('view')}
                      </Button>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenEdit(p)}
                      >
                        <Edit2 className="h-3.5 w-3.5 mr-1 text-primary" /> {t('edit')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => { setSelectedProduct(p); setIsDeleteOpen(true); }}
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

      {/* Add / Edit Modal */}
      <Modal
        open={isAddOpen || isEditOpen}
        onClose={() => { setIsAddOpen(false); setIsEditOpen(false); }}
        title={isAddOpen ? t('registerSMEProduct') : (lang === 'kh' ? 'កែប្រែផលិតផលសហគ្រាស' : 'Edit SME Product')}
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
          {/* Photo Upload Section */}
          <div className="flex flex-col sm:flex-row gap-4 items-start pb-3 border-b border-border-light">
            <ImageUpload
              value={formData.image_url}
              onChange={(url, pid) => setFormData(prev => ({
                ...prev,
                image_url: url || '',
                image_public_id: pid !== undefined ? pid : prev.image_public_id || ''
              }))}
              label={t('photo')}
              folder="sme-products"
            />
            <div className="flex-1 space-y-3 w-full">
              <Input
                label={t('smeName')}
                required
                placeholder="e.g. Chey Cashew Enterprise, Prasat Honey"
                value={formData.sme_name}
                onChange={(e) => setFormData({ ...formData, sme_name: e.target.value })}
              />
              <Input
                label={t('productName')}
                required
                placeholder="e.g. Roasted Cashews 250g, Lotus Silk Scarf"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <Select
              label={t('category')}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: 'Food & Agriculture', label: lang === 'kh' ? 'ចំណីអាហារ & កសិកម្ម' : 'Food & Agriculture' },
                { value: 'Handicraft & Textiles', label: lang === 'kh' ? 'សិប្បកម្ម & វាយនភណ្ឌ' : 'Handicraft & Textiles' },
                { value: 'Packaging Prototype', label: lang === 'kh' ? 'គំរូសំបកវេចខ្ចប់' : 'Packaging Prototype' },
                { value: 'Cosmetics & Wellness', label: lang === 'kh' ? 'គ្រឿងសម្អាង & សុខុមាលភាព' : 'Cosmetics & Wellness' },
                { value: 'Eco Technology', label: lang === 'kh' ? 'បច្ចេកវិទ្យាបៃតង' : 'Eco Technology' },
              ]}
            />
            <Select
              label={t('status')}
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: 'active', label: lang === 'kh' ? 'គំរូសកម្ម' : 'Active Sample' },
                { value: 'expired', label: t('expired') },
                { value: 'archived', label: lang === 'kh' ? 'រក្សាទុក' : 'Archived' },
                { value: 'returned', label: lang === 'kh' ? 'សងទៅសហគ្រាស' : 'Returned to SME' },
                { value: 'disposed', label: lang === 'kh' ? 'បានបោះបង់' : 'Disposed' },
              ]}
            />
          </div>

          {/* Expiration & Shelf-Life Dates */}
          <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-border space-y-2">
            <span className="text-[11px] font-semibold text-text-main flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              {lang === 'kh' ? 'កាលបរិច្ឆេទផលិត & ផុតកំណត់ (សម្រាប់ផលិតផលកែច្នៃ)' : 'Manufacturing & Expiration Dates (Perishables)'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label={t('mfgDate')}
                type="date"
                value={formData.mfg_date}
                onChange={(e) => setFormData({ ...formData, mfg_date: e.target.value })}
              />
              <Input
                label={t('expiryDate')}
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3.5">
            <Input
              label={t('quantity')}
              type="number"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
            />
            <Input
              label={t('unit')}
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            />
            <Input
              label={lang === 'kh' ? 'កាលបរិច្ឆេទទទួល' : 'Date Received'}
              type="date"
              value={formData.received_date}
              onChange={(e) => setFormData({ ...formData, received_date: e.target.value })}
            />
          </div>

          <Input
            label={lang === 'kh' ? 'ទីតាំងតាំងបង្ហាញក្នុង InnoLab' : 'Sample Location in InnoLab'}
            placeholder="e.g. Showcase Shelf 2, Food Lab"
            value={formData.sample_location}
            onChange={(e) => setFormData({ ...formData, sample_location: e.target.value })}
          />

          <Textarea
            label={lang === 'kh' ? 'ការពិពណ៌នាផលិតផល & កំណត់សម្គាល់ពិសោធន៍' : 'Product Description & Trial Notes'}
            rows={2}
            placeholder="Packaging specifications, ingredients, quality test notes..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </form>
      </Modal>

      {/* View Modal with Multi-Image Gallery */}
      <Modal
        open={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title={lang === 'kh' ? 'ព័ត៌មានលម្អិតគំរូផលិតផលសហគ្រាស' : 'SME Product Sample Details'}
        size="md"
        footer={<Button variant="outline" onClick={() => setIsViewOpen(false)}>{t('close')}</Button>}
      >
        {selectedProduct && (
          <div className="space-y-4 text-xs">
            {/* Primary Image & Header Info */}
            <div className="flex flex-col sm:flex-row gap-4 items-start p-3 bg-white/[0.03] rounded-2xl border border-white/8">
              <div className="relative group/smeview w-24 h-24 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/15 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg backdrop-blur-xl">
                {selectedProduct.image_url ? (
                  <>
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.product_name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/smeview:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                      }}
                    />
                    {selectedProduct.image_url.includes('cloudinary') && (
                      <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-cyan-950/85 border border-cyan-400/40 text-cyan-300 backdrop-blur-md flex items-center gap-1 shadow-sm">
                        <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                        Cloud
                      </div>
                    )}
                  </>
                ) : null}
                <div className={`text-center p-2 text-text-muted ${selectedProduct.image_url ? 'hidden' : 'block'}`}>
                  <ImageIcon className="h-6 w-6 mx-auto mb-1 opacity-50 text-cyan-400" />
                  <span className="text-[10px]">{lang === 'kh' ? 'គ្មានរូប' : 'No photo'}</span>
                </div>
              </div>
              <div className="flex-1">
                <span className="text-text-muted uppercase text-[10px] tracking-wider">{lang === 'kh' ? 'សហគ្រាសដៃគូ' : 'Partner Enterprise'}</span>
                <h3 className="text-base font-bold text-white leading-snug">{selectedProduct.sme_name}</h3>
                <p className="text-sm font-semibold text-cyan-400 mt-0.5">{selectedProduct.product_name}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {getStatusBadge(selectedProduct.status)}
                  <span className="px-2.5 py-0.5 bg-white/[0.06] text-white/90 text-[11px] rounded-full border border-white/10 font-medium">
                    {selectedProduct.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="p-2.5 bg-bg-main rounded-lg">
                <span className="text-text-muted block text-[10px]">{t('quantity')}</span>
                <p className="font-bold text-text-main text-xs mt-0.5">{selectedProduct.quantity} {selectedProduct.unit}</p>
              </div>
              <div className="p-2.5 bg-bg-main rounded-lg">
                <span className="text-text-muted block text-[10px]">{lang === 'kh' ? 'កាលបរិច្ឆេទទទួល' : 'Received Date'}</span>
                <p className="font-medium text-text-main text-xs mt-0.5">{selectedProduct.received_date ? selectedProduct.received_date.split('T')[0] : 'N/A'}</p>
              </div>
              <div className="p-2.5 bg-bg-main rounded-lg col-span-2 sm:col-span-1">
                <span className="text-text-muted block text-[10px]">{t('location')}</span>
                <p className="font-medium text-text-main text-xs mt-0.5">{selectedProduct.sample_location || 'Showcase Shelf'}</p>
              </div>
            </div>

            {/* Shelf-Life & Expiration Info */}
            <div className="p-3 bg-black/[0.02] dark:bg-white/[0.03] rounded-xl border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-primary" />
                  {t('shelfLife')}
                </span>
                {(() => {
                  const expInfo = getExpiryInfo(selectedProduct);
                  return <Badge variant={expInfo.variant} size="xs">{expInfo.label}</Badge>;
                })()}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2 bg-bg-main rounded-lg">
                  <span className="text-text-muted block text-[10px]">{t('mfgDate')}</span>
                  <p className="font-semibold text-text-main text-xs mt-0.5">
                    {selectedProduct.mfg_date ? selectedProduct.mfg_date.split('T')[0] : 'N/A'}
                  </p>
                </div>
                <div className="p-2 bg-bg-main rounded-lg">
                  <span className="text-text-muted block text-[10px]">{t('expiryDate')}</span>
                  <p className="font-semibold text-text-main text-xs mt-0.5">
                    {selectedProduct.expiry_date ? selectedProduct.expiry_date.split('T')[0] : (lang === 'kh' ? 'គ្មានកាលកំណត់' : 'Non-perishable')}
                  </p>
                </div>
              </div>
            </div>

            {selectedProduct.description && (
              <div className="p-3 bg-bg-main/50 rounded-lg border border-border-light">
                <span className="text-text-muted font-medium text-[10px] uppercase block mb-1">{t('description')}</span>
                <p className="leading-relaxed text-text-main">{selectedProduct.description}</p>
              </div>
            )}

            {/* Additional Photos / Multi-Image Gallery */}
            <div className="border-t border-border-light pt-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-xs font-bold text-text-main">
                    {lang === 'kh' ? 'កម្រងរូបភាពគំរូ & ដំណើរការពិសោធន៍' : 'Sample Photos & Testing Gallery'}
                  </h4>
                  <p className="text-[10px] text-text-muted">
                    {lang === 'kh' ? 'រូបភាពគំរូដើម ការវេចខ្ចប់ និងការត្រួតពិនិត្យគុណភាព' : 'Prototypes, packaging labels, and quality verification photos'}
                  </p>
                </div>
              </div>

              {/* Gallery Image Upload */}
              <div className="mb-3">
                <ImageUpload
                  value=""
                  onChange={handleAddGalleryImage}
                  label={lang === 'kh' ? '+ បន្ថែមរូបភាពគំរូថ្មី' : '+ Add Additional Photo'}
                  folder="sme-gallery"
                />
              </div>

              {/* Photos List */}
              {loadingGallery ? (
                <p className="text-center text-text-muted py-2">{t('loading')}</p>
              ) : galleryImages.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {galleryImages.map((img) => (
                    <div key={img.id} className="relative group rounded-lg overflow-hidden border border-border bg-bg-main aspect-square">
                      <img
                        src={img.image_url}
                        alt={img.caption || 'Product Photo'}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleDeleteGalleryImage(img.id)}
                        className="absolute top-1 right-1 p-1 bg-danger text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                        title="Delete photo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {img.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] px-1.5 py-0.5 truncate">
                          {img.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-text-muted italic py-1">
                  {lang === 'kh' ? 'មិនទាន់មានរូបភាពគំរូបន្ថែមនៅឡើយទេ។ អ្នកអាចបង្ហោះខាងលើ។' : 'No additional gallery photos yet. Upload one above.'}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation */}
      <ConfirmModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={lang === 'kh' ? 'លុបគំរូផលិតផលសហគ្រាស' : 'Delete SME Product'}
        message={`${lang === 'kh' ? 'តើអ្នកប្រាកដជាចង់លុបគំរូ' : 'Remove sample'} "${selectedProduct?.product_name}" ${lang === 'kh' ? 'របស់' : 'from'} ${selectedProduct?.sme_name}?`}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        variant="danger"
        loading={submitting}
      />
    </div>
  );
}
