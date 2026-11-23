'use client';

import { useState, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  Search,
  Edit2,
  Trash2,
  Package,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal, { ConfirmModal } from '@/components/ui/Modal';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/States';
import { useLanguage } from '@/lib/LanguageContext';

const PRESET_COLORS = [
  '#008290', '#2B78C5', '#00E599', '#84E325',
  '#F59E0B', '#06B6D4', '#6366F1', '#EC4899',
  '#3B82F6', '#10B981', '#14B8A6', '#64748B'
];

export default function CategoriesPage() {
  const { t, lang } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#008290',
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/categories?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error('Failed to load categories');
      const data = await res.json();
      setCategories(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [search]);

  const handleOpenAdd = () => {
    setFormData({ name: '', description: '', color: '#008290' });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setSelectedCat(cat);
    setFormData({ name: cat.name, description: cat.description || '', color: cat.color || '#008290' });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (cat) => {
    setSelectedCat(cat);
    setIsDeleteOpen(true);
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create category');
      }
      setIsAddOpen(false);
      fetchCategories();
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
      const res = await fetch(`/api/categories/${selectedCat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update category');
      }
      setIsEditOpen(false);
      fetchCategories();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/categories/${selectedCat.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete category');
      }
      setIsDeleteOpen(false);
      fetchCategories();
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
          <h2 className="text-xl font-bold text-text-main tracking-tight">{t('categories')}</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {lang === 'kh' ? 'រៀបចំក្រុមសម្ភារៈការិយាល័យ ឧបករណ៍ និងផលិតផលសហគ្រាស' : 'Organize inventory supplies, equipment, and SME products'}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenAdd}>
          <Plus className="h-3.5 w-3.5" /> {lang === 'kh' ? 'បន្ថែមប្រភេទថ្មី' : 'Add Category'}
        </Button>
      </div>

      {/* Search */}
      <div className="glass rounded-xl p-3.5">
        <div className="max-w-md">
          <Input
            placeholder={lang === 'kh' ? 'ស្វែងរកប្រភេទក្រុមទំនិញ...' : 'Search categories...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-3.5 w-3.5" />}
          />
        </div>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <LoadingState message={t('loading')} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchCategories} />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={FolderTree}
          title={lang === 'kh' ? 'រកមិនឃើញប្រភេទក្រុមទំនិញទេ' : 'No categories found'}
          message={lang === 'kh' ? 'បង្កើតប្រភេទក្រុមទំនិញដើម្បីរៀបចំសម្ភារៈការិយាល័យ និងឧបករណ៍' : 'Create categories to organize your office supplies and equipment'}
          action={
            <Button size="sm" onClick={handleOpenAdd}>
              <Plus className="h-3.5 w-3.5" /> {lang === 'kh' ? 'បន្ថែមប្រភេទថ្មី' : 'Add Category'}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="glass rounded-xl p-4 relative overflow-hidden transition-all duration-200 hover:shadow-md"
              style={{ borderLeft: `4px solid ${cat.color || '#367A43'}` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${cat.color || '#367A43'}18` }}
                  >
                    <FolderTree className="h-4 w-4" style={{ color: cat.color || '#367A43' }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-main leading-tight">{cat.name}</h3>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      {cat.item_count || 0} {t('itemsCount')} · {cat.total_quantity || 0} {lang === 'kh' ? 'ក្នុងស្តុក' : 'in stock'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1 text-text-muted hover:text-primary rounded-md hover:bg-bg-main transition-colors"
                    title={t('edit')}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenDelete(cat)}
                    className="p-1 text-text-muted hover:text-danger rounded-md hover:bg-danger-light transition-colors"
                    title={t('delete')}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {cat.description && (
                <p className="text-xs text-text-secondary mt-3 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={isAddOpen || isEditOpen}
        onClose={() => { setIsAddOpen(false); setIsEditOpen(false); }}
        title={isAddOpen ? (lang === 'kh' ? 'បន្ថែមប្រភេទក្រុមទំនិញថ្មី' : 'Add Category') : (lang === 'kh' ? 'កែប្រែប្រភេទក្រុមទំនិញ' : 'Edit Category')}
        size="sm"
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
            label={lang === 'kh' ? 'ឈ្មោះប្រភេទ' : 'Category Name'}
            required
            placeholder="e.g. Office Supplies, Electronics"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Textarea
            label={t('description')}
            rows={2}
            placeholder={lang === 'kh' ? 'តើសម្ភារៈណាខ្លះស្ថិតក្នុងក្រុមនេះ?' : 'What items belong in this category?'}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div>
            <label className="block text-xs font-medium text-text-main mb-2">
              {lang === 'kh' ? 'ពណ៌សម្គាល់' : 'Category Color'}
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: c })}
                  className={`w-6 h-6 rounded-full transition-transform ${formData.color === c ? 'scale-125 ring-2 ring-offset-2 ring-primary' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title={lang === 'kh' ? 'លុបប្រភេទក្រុមទំនិញ' : 'Delete Category'}
        message={`${lang === 'kh' ? 'តើអ្នកប្រាកដជាចង់លុបប្រភេទ' : 'Are you sure you want to delete category'} "${selectedCat?.name}"?`}
        confirmText={t('delete')}
        cancelText={t('cancel')}
        variant="danger"
        loading={submitting}
      />
    </div>
  );
}
