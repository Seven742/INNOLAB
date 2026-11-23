'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  History,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  Edit2,
  Trash2,
  User,
  Clock,
  Filter,
} from 'lucide-react';
import Select from '@/components/ui/Select';
import Pagination from '@/components/ui/Pagination';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/States';
import { useLanguage } from '@/lib/LanguageContext';

export default function ActivityPage() {
  const { t, lang } = useLanguage();
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [entityType, setEntityType] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        entityType,
        action: actionFilter,
      });

      const res = await fetch(`/api/activity?${params}`);
      if (!res.ok) throw new Error('Failed to load activity logs');
      const data = await res.json();
      setActivities(data.data || []);
      setPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, entityType, actionFilter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'created':
        return { bg: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30', icon: Plus, label: lang === 'kh' ? 'បានបង្កើត' : 'Created' };
      case 'stock_in':
        return { bg: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30', icon: ArrowDownToLine, label: lang === 'kh' ? 'ចូលស្តុក' : 'Stock In' };
      case 'stock_out':
        return { bg: 'bg-rose-500/15 text-rose-300 border border-rose-500/30', icon: ArrowUpFromLine, label: lang === 'kh' ? 'ចេញពីស្តុក' : 'Stock Out' };
      case 'borrowed':
        return { bg: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30', icon: RefreshCw, label: lang === 'kh' ? 'បានខ្ចី' : 'Borrowed' };
      case 'returned':
        return { bg: 'bg-blue-500/15 text-blue-300 border border-blue-500/30', icon: RefreshCw, label: lang === 'kh' ? 'បានសង' : 'Returned' };
      case 'updated':
        return { bg: 'bg-amber-500/15 text-amber-300 border border-amber-500/30', icon: Edit2, label: lang === 'kh' ? 'បានកែប្រែ' : 'Updated' };
      case 'deleted':
      case 'deactivated':
        return { bg: 'bg-red-500/15 text-red-300 border border-red-500/30', icon: Trash2, label: lang === 'kh' ? 'បានលុប' : 'Deleted' };
      default:
        return { bg: 'bg-white/10 text-white border border-white/10', icon: Clock, label: action };
    }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-text-main tracking-tight">{t('activityTitle')}</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          {t('activitySubtitle')}
        </p>
      </div>

      {/* Filter bar */}
      <div className="glass rounded-xl p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            value={entityType}
            onChange={(e) => { setEntityType(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            options={[
              { value: '', label: t('allModules') },
              { value: 'inventory', label: t('inventory') },
              { value: 'stock', label: t('stockManagement') },
              { value: 'equipment', label: t('borrowReturn') },
              { value: 'sme_product', label: t('smeProducts') },
              { value: 'category', label: t('categories') },
              { value: 'supplier', label: t('suppliers') },
              { value: 'user', label: t('userManagement') },
            ]}
          />

          <Select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            options={[
              { value: '', label: t('allActions') },
              { value: 'created', label: lang === 'kh' ? 'បានបង្កើត / បន្ថែម' : 'Created / Added' },
              { value: 'stock_in', label: t('stockIn') },
              { value: 'stock_out', label: t('stockOut') },
              { value: 'borrowed', label: lang === 'kh' ? 'បានខ្ចី' : 'Borrowed' },
              { value: 'returned', label: lang === 'kh' ? 'បានសង' : 'Returned' },
              { value: 'updated', label: lang === 'kh' ? 'បានកែប្រែ' : 'Updated / Modified' },
              { value: 'deleted', label: lang === 'kh' ? 'បានលុប' : 'Deleted' },
            ]}
          />
        </div>
      </div>

      {/* Timeline List */}
      <div className="glass rounded-xl p-5">
        {loading ? (
          <LoadingState message={t('loading')} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchActivities} />
        ) : activities.length === 0 ? (
          <EmptyState
            icon={History}
            title={lang === 'kh' ? 'មិនមានសកម្មភាពត្រូវបានកត់ត្រាទេ' : 'No activity recorded'}
            message={lang === 'kh' ? 'រាល់សកម្មភាពរបស់អ្នកប្រើប្រាស់ និងចលនាស្តុក នឹងបង្ហាញនៅទីនេះដោយស្វ័យប្រវត្តិ' : 'User actions and inventory movements will automatically appear in this timeline'}
          />
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
            {activities.map((act) => {
              const { bg, icon: ActionIcon, label } = getActionBadge(act.action);
              const date = new Date(act.created_at);
              const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

              return (
                <div key={act.id} className="relative flex items-start gap-3.5 group">
                  {/* Dot */}
                  <div className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-bg-main ${bg}`}>
                    <ActionIcon className="h-2.5 w-2.5" />
                  </div>

                  <div className="flex-1 bg-black/[0.02] dark:bg-white/[0.03] p-3.5 rounded-xl border border-border hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-text-main">
                        {act.user_name || 'System'}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {dateStr} at {timeStr}
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                      <span className="font-semibold text-primary dark:text-cyan-300">{label}</span>{' '}
                      <span className="text-text-muted text-[11px] uppercase tracking-wider">{act.entity_type}</span>{' '}
                      <span className="font-bold text-text-main">{act.entity_name}</span>
                    </p>

                    {act.details && (
                      <p className="text-[11px] text-text-muted mt-1.5 bg-black/[0.04] dark:bg-white/[0.04] border border-border px-2.5 py-1 rounded-md inline-block">
                        {act.details}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-5 mt-4 border-t border-border-light">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(page) => setPagination(p => ({ ...p, page }))}
          />
        </div>
      </div>
    </div>
  );
}
