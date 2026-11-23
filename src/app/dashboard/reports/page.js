'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  FileText,
  Filter,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { LoadingState, EmptyState, ErrorState } from '@/components/ui/States';
import { useLanguage } from '@/lib/LanguageContext';
import * as XLSX from 'xlsx';

export default function ReportsPage() {
  const { t, lang } = useLanguage();
  const [selectedType, setSelectedType] = useState('inventory');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [reportData, setReportData] = useState({ data: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reportTypes = [
    {
      id: 'inventory',
      label: t('currentInventoryReport'),
      icon: Package,
      desc: lang === 'kh' ? 'កម្រិតស្តុក និងតម្លៃសរុប' : 'Complete stock levels and valuation',
    },
    {
      id: 'stock-in',
      label: t('stockInReport'),
      icon: ArrowDownToLine,
      desc: lang === 'kh' ? 'ការទិញ និងទំនិញចូលស្តុក' : 'Purchases and incoming deliveries',
    },
    {
      id: 'stock-out',
      label: t('stockOutReport'),
      icon: ArrowUpFromLine,
      desc: lang === 'kh' ? 'ការដកទំនិញ និងការប្រើប្រាស់' : 'Dispatches and department usage',
    },
    {
      id: 'low-stock',
      label: t('lowStockReport'),
      icon: AlertTriangle,
      desc: lang === 'kh' ? 'ទំនិញដែលត្រូវទិញបំពេញបន្ថែម' : 'Items requiring replenishment',
    },
    {
      id: 'borrows',
      label: t('borrowsReport'),
      icon: RefreshCw,
      desc: lang === 'kh' ? 'ការខ្ចីឧបករណ៍ និងហួសកាលកំណត់' : 'Borrowed office gadgets & tracking',
    },
    {
      id: 'sme-products',
      label: t('smeReport'),
      icon: ShoppingBag,
      desc: lang === 'kh' ? 'បញ្ជីគំរូ និងផលិតផលសហគ្រាស' : 'SME prototypes and samples directory',
    },
  ];

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        type: selectedType,
        startDate,
        endDate,
      });

      const res = await fetch(`/api/reports?${params}`);
      if (!res.ok) throw new Error('Failed to generate report');
      const data = await res.json();
      setReportData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedType, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const exportExcel = () => {
    if (!reportData.data.length) return;
    const worksheet = XLSX.utils.json_to_sheet(reportData.data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
    XLSX.writeFile(workbook, `InnoLab_${selectedType}_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportCSV = () => {
    if (!reportData.data.length) return;
    const keys = Object.keys(reportData.data[0]);
    const headers = keys.join(',');
    const rows = reportData.data.map(row =>
      keys.map(k => `"${String(row[k] || '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `InnoLab_${selectedType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const { data = [], summary = {} } = reportData;
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text-main tracking-tight">{t('reportsTitle')}</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {t('reportsSubtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={!data.length}>
            <FileText className="h-3.5 w-3.5" /> {t('exportCSV')}
          </Button>
          <Button variant="primary" size="sm" onClick={exportExcel} disabled={!data.length}>
            <FileSpreadsheet className="h-3.5 w-3.5" /> {t('exportExcel')}
          </Button>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {reportTypes.map((tab) => {
          const Icon = tab.icon;
          const active = selectedType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`p-3 rounded-xl text-left transition-all duration-150 ${
                active
                  ? 'bg-primary-500/20 border border-primary-500/50 text-cyan-300 ring-1 ring-primary-400/50 shadow-lg shadow-cyan-950/40'
                  : 'glass hover:bg-white/10 text-text-secondary'
              }`}
            >
              <Icon className={`h-4 w-4 mb-2 ${active ? 'text-cyan-400' : 'text-text-muted'}`} />
              <p className="text-xs font-bold text-text-main leading-tight">{tab.label}</p>
              <p className="text-[10px] text-text-muted mt-0.5 line-clamp-1">{tab.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Date Filter Bar */}
      <div className="glass rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-text-muted" />
          <span className="text-xs font-semibold text-text-main">{t('filterByPeriod')}</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Input
            type="date"
            placeholder={t('from')}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-xs text-text-muted">{t('to')}</span>
          <Input
            type="date"
            placeholder={lang === 'kh' ? 'ដល់' : 'To'}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          {(startDate || endDate) && (
            <Button variant="ghost" size="xs" onClick={() => { setStartDate(''); setEndDate(''); }}>
              {t('clear')}
            </Button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      {Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(summary).map(([key, val]) => (
            <div key={key} className="glass rounded-xl p-3.5">
              <p className="text-[11px] text-text-muted capitalize">
                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </p>
              <p className="text-lg font-bold text-text-main mt-0.5">{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Report Table */}
      <div className="glass rounded-xl overflow-hidden">
        {loading ? (
          <LoadingState message={t('loading')} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchReport} />
        ) : data.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title={t('noData')}
            message={lang === 'kh' ? 'មិនមានទិន្នន័យស្របតាមលក្ខខណ្ឌដែលបានជ្រើសរើសទេ' : 'No data matches the selected report type and date period'}
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="table-container max-h-[500px] overflow-y-auto hidden md:block">
              <table>
                <thead className="sticky top-0 z-10">
                  <tr>
                    {columns.map((col) => (
                      <th key={col} className="capitalize">
                        {col.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, idx) => (
                    <tr key={idx}>
                      {columns.map((col) => (
                        <td key={col} className="text-xs">
                          {row[col] !== null && row[col] !== undefined
                            ? String(row[col])
                            : '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Data Row Cards (No horizontal scroll on phones) */}
            <div className="md:hidden divide-y divide-border">
              {data.map((row, idx) => (
                <div key={idx} className="p-3.5 space-y-1.5 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center justify-between pb-1 border-b border-border/50 text-[11px] font-mono text-text-muted">
                    <span>Record #{idx + 1}</span>
                    <span className="font-semibold text-primary dark:text-cyan-400">
                      {row.item_code || row.reference_no || ''}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    {columns.map((col) => (
                      <div key={col} className="space-y-0.5">
                        <span className="text-[10px] uppercase font-semibold text-text-muted tracking-wider block">
                          {col.replace(/_/g, ' ')}
                        </span>
                        <span className="font-medium text-text-main truncate block">
                          {row[col] !== null && row[col] !== undefined ? String(row[col]) : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
