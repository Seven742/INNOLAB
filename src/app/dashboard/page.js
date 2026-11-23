'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  FolderTree,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Plus,
  ArrowRight,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  MoreVertical,
  Activity,
  CheckCircle2,
  Boxes,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import Badge from '@/components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';
import { useLanguage } from '@/lib/LanguageContext';
import { useTheme } from '@/lib/ThemeContext';

export default function DashboardPage() {
  const { t, lang } = useLanguage();
  const { isWhite } = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingState message={t('loading')} />;
  if (error) return <ErrorState message={error} onRetry={fetchDashboard} />;
  if (!data) return null;

  const { stats, categoryBreakdown, stockMovement, recentActivities, lowStockItems, recentItems } = data;

  // InnoLab Official Colors (Teal, Azure Blue, Neon Mint, Lime, Amber Gold)
  const BRAND_COLORS = ['#008290', '#2B78C5', '#00E599', '#84E325', '#F59E0B', '#38BDF8', '#818CF8', '#EC4899'];

  const statCards = [
    {
      label: t('totalItems'),
      value: stats.totalItems,
      icon: Package,
      color: 'text-primary dark:text-cyan-400',
      bg: 'bg-primary/10 border-primary/20',
      glow: 'shadow-[0_0_20px_rgba(0,130,144,0.12)]',
    },
    {
      label: t('totalCategories'),
      value: stats.totalCategories,
      icon: FolderTree,
      color: 'text-secondary dark:text-blue-400',
      bg: 'bg-secondary/10 border-secondary/20',
      glow: 'shadow-[0_0_20px_rgba(43,120,197,0.12)]',
    },
    {
      label: t('lowStockItems'),
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'text-amber-500 dark:text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      alert: stats.lowStockItems > 0,
      glow: stats.lowStockItems > 0 ? 'shadow-[0_0_20px_rgba(245,158,11,0.2)]' : '',
    },
    {
      label: t('borrowedEquipment'),
      value: stats.borrowedEquipment,
      icon: RefreshCw,
      color: 'text-indigo-500 dark:text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      sublabel: stats.overdueEquipment > 0 ? `${stats.overdueEquipment} ${t('overdue')}` : null,
      glow: 'shadow-[0_0_20px_rgba(99,102,241,0.12)]',
    },
    {
      label: t('stockInMonth'),
      value: stats.stockInMonth,
      icon: ArrowDownToLine,
      color: 'text-emerald-500 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      trend: 'up',
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.12)]',
    },
    {
      label: t('stockOutMonth'),
      value: stats.stockOutMonth,
      icon: ArrowUpFromLine,
      color: 'text-rose-500 dark:text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      trend: 'down',
      glow: 'shadow-[0_0_20px_rgba(244,63,94,0.12)]',
    },
  ];

  const formatNumber = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num || 0;
  };

  const totalQuantitySum = categoryBreakdown.reduce((acc, c) => acc + (parseInt(c.total_quantity) || 0), 0);

  const getActivityIcon = (action) => {
    switch (action) {
      case 'created': return <Plus className="h-3 w-3 text-primary dark:text-cyan-400" />;
      case 'stock_in': return <ArrowDownToLine className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />;
      case 'stock_out': return <ArrowUpFromLine className="h-3 w-3 text-rose-500 dark:text-rose-400" />;
      case 'borrowed': return <RefreshCw className="h-3 w-3 text-indigo-500 dark:text-indigo-400" />;
      default: return <Clock className="h-3 w-3 text-text-muted" />;
    }
  };

  const getActivityBg = (action) => {
    switch (action) {
      case 'created': return 'bg-primary/10 border-primary/25';
      case 'stock_in': return 'bg-emerald-500/10 border-emerald-500/25';
      case 'stock_out': return 'bg-rose-500/10 border-rose-500/25';
      case 'borrowed': return 'bg-indigo-500/10 border-indigo-500/25';
      default: return 'bg-black/[0.04] dark:bg-white/10 border-border';
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="text-xs font-bold text-text-main mb-1">{label}</p>
          {payload.map((entry, i) => (
            <p key={i} className="text-xs font-medium" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold text-text-main">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const sparklineData = [35, 42, 38, 55, 62, 85];

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* 1. "OWN THE OUTCOME" Executive Hero Banner (Responsive Dual-Theme) */}
      <div className="relative rounded-2xl overflow-hidden glass border border-border p-5 sm:p-7 shadow-xl">
        {/* Ambient Subtle Gradients */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-primary/15 dark:bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-secondary/10 dark:bg-secondary/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            {/* Top Status Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-black/[0.04] dark:bg-white/10 border border-border text-primary dark:text-cyan-300 backdrop-blur-md">
                <Sparkles className="h-3 w-3 text-gold" />
                InnoLab IMS · Incubation Hub
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-emerald-600 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 pulse-dot" />
                Live Database Active
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-main tracking-tight leading-tight">
              OWN THE OUTCOME
            </h1>

            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              {lang === 'kh'
                ? 'ប្រព័ន្ធគ្រប់គ្រងសារពើភ័ណ្ឌ ឧបករណ៍បច្ចេកវិទ្យា និងគំរូសហគ្រាសក្នុងស្រុក InnoLab កំពង់ធំ'
                : 'Advanced inventory management, incubation lab resources, IT equipment, and local SME product testing'}
            </p>

            {/* Micro Metric & Mini Sparkline from Mockup */}
            <div className="pt-2 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted font-medium">Inventory Velocity</span>
                <span className="inline-flex items-center text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-md">
                  +25.4%
                </span>
              </div>
              <div className="flex items-end gap-1 h-5">
                {sparklineData.map((val, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all ${
                      i === sparklineData.length - 1
                        ? 'bg-gradient-to-t from-emerald-500 to-[#84E325] shadow-xs'
                        : 'bg-black/15 dark:bg-white/20'
                    }`}
                    style={{ height: `${(val / 85) * 100}%` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <Link
              href="/dashboard/stock-in"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-primary to-secondary text-white hover:brightness-110 shadow-md border border-primary-light/30 transition-all"
            >
              <ArrowDownToLine className="h-4 w-4" />
              {t('stockIn')}
            </Link>
            <Link
              href="/dashboard/stock-out"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-black/[0.04] dark:bg-white/10 text-text-main hover:bg-black/[0.08] dark:hover:bg-white/15 border border-border transition-all backdrop-blur-md"
            >
              <ArrowUpFromLine className="h-4 w-4 text-rose-500 dark:text-rose-400" />
              {t('stockOut')}
            </Link>
            <Link
              href="/dashboard/borrow"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-black/[0.04] dark:bg-white/10 text-text-main hover:bg-black/[0.08] dark:hover:bg-white/15 border border-border transition-all backdrop-blur-md"
            >
              <RefreshCw className="h-4 w-4 text-indigo-500 dark:text-indigo-400" />
              {t('borrowReturn')}
            </Link>
          </div>
        </div>
      </div>

      {/* SME Expiration Alert Banner */}
      {(stats.expiredSme > 0 || stats.expiringSoonSme > 0) && (
        <div className="glass rounded-2xl p-4 border border-amber-500/30 bg-amber-500/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-amber-500">
              <AlertTriangle className="h-4.5 w-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-text-main flex items-center gap-2 flex-wrap">
                <span>{lang === 'kh' ? 'ការជូនដំណឹងអំពីសុពលភាពផលិតផល SME' : 'SME Product Expiration Notice'}</span>
                {stats.expiredSme > 0 && (
                  <Badge variant="danger" size="xs">
                    {stats.expiredSme} {t('expired')}
                  </Badge>
                )}
                {stats.expiringSoonSme > 0 && (
                  <Badge variant="warning" size="xs">
                    {stats.expiringSoonSme} {t('expiringSoon')}
                  </Badge>
                )}
              </h4>
              <p className="text-[11px] text-text-muted mt-0.5">
                {t('expiryAlertBanner')}
              </p>
            </div>
          </div>
          <Link
            href="/dashboard/sme-products"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-colors self-start sm:self-auto flex-shrink-0"
          >
            {t('viewExpiringProducts')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* 2. Top Metric KPI Cards (Responsive 2 / 3 / 6 Columns) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`glass rounded-2xl p-3.5 sm:p-4 hover:border-border-hover transition-all duration-200 ${card.glow}`}
            >
              <div className="flex items-center justify-between mb-2.5">
                <div className={`w-8.5 h-8.5 rounded-xl ${card.bg} border flex items-center justify-center`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
                {card.alert && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 pulse-dot shadow-xs" />
                )}
                {card.trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />}
                {card.trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />}
              </div>
              <p className="text-xl sm:text-2xl font-black text-text-main tracking-tight leading-none">
                {formatNumber(card.value)}
              </p>
              <p className="text-xs text-text-secondary mt-1.5 truncate font-medium" title={card.label}>
                {card.label}
              </p>
              {card.sublabel && (
                <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-1 font-bold">{card.sublabel}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Featured Visual Intelligence Grid (Responsive 1 / 2 / 3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Card A: Stock Distribution Semicircular Arc Gauge (Mockup phone #2) */}
        <div className="glass rounded-2xl p-4 sm:p-5 border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-text-main">
                  {lang === 'kh' ? 'ការបែងចែកស្តុកទំនិញ' : 'Distribution of stocks'}
                </h3>
              </div>
              <p className="text-[11px] text-text-muted">
                {lang === 'kh' ? 'បរិមាណស្តុកសរុប និងសមត្ថភាពផ្ទុក' : 'Distribution of active inventory & capacity'}
              </p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-black/[0.04] dark:bg-white/5 border border-border flex items-center justify-center">
              <ArrowUpRight className="h-3.5 w-3.5 text-primary dark:text-cyan-400" />
            </div>
          </div>

          {/* Semicircular Curved Arc Progress */}
          <div className="relative py-2 flex flex-col items-center justify-center">
            <div className="h-[170px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown.length > 0 ? categoryBreakdown : [{ name: 'Default', total_quantity: stats.totalItems || 1 }]}
                    dataKey="total_quantity"
                    nameKey="name"
                    cx="50%"
                    cy="80%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={68}
                    outerRadius={96}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {categoryBreakdown.map((entry, i) => (
                      <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Central Metric in Arc */}
            <div className="text-center -mt-7">
              <p className="text-2xl sm:text-3xl font-black text-text-main tracking-tight leading-tight">
                {totalQuantitySum ? totalQuantitySum.toLocaleString() : (stats.totalItems || 0)}
              </p>
              <p className="text-xs text-text-secondary font-medium">
                {lang === 'kh' ? 'ឯកតាសរុប (Units total)' : 'Units total'}
              </p>
            </div>
          </div>

          {/* Legend Chips */}
          <div className="pt-3 border-t border-border space-y-1.5">
            {categoryBreakdown.slice(0, 3).map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full shadow-xs"
                    style={{ backgroundColor: BRAND_COLORS[i % BRAND_COLORS.length] }}
                  />
                  <span className="text-text-secondary truncate max-w-[130px] font-medium">{cat.name}</span>
                </span>
                <span className="font-bold text-text-main">{cat.total_quantity || 0} {cat.unit || 'pcs'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card B: Monthly Stock Flow (Bar Chart from Mockup) */}
        <div className="glass rounded-2xl p-4 sm:p-5 border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-text-main">
                {lang === 'kh' ? 'គោលដៅចរន្តស្តុកប្រចាំខែ' : 'Monthly stock activity'}
              </h3>
              <p className="text-[11px] text-text-muted">
                Target: 5,000 Units
              </p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-black/[0.04] dark:bg-white/5 border border-border flex items-center justify-center">
              <MoreVertical className="h-3.5 w-3.5 text-text-muted" />
            </div>
          </div>

          {/* Bar Chart with Glowing Active Month */}
          <div className="h-[170px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockMovement} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isWhite ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)'} vertical={false} />
                <XAxis dataKey="month_name" tick={{ fontSize: 10, fill: '#8EA0A2' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#8EA0A2' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="stock_in"
                  name={t('stockIn')}
                  radius={[4, 4, 0, 0]}
                >
                  {stockMovement.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index === stockMovement.length - 1
                          ? '#84E325'
                          : isWhite
                          ? 'rgba(0, 0, 0, 0.08)'
                          : 'rgba(255, 255, 255, 0.12)'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Slogan Callout Box */}
          <div className="mt-3 p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-border text-xs text-text-secondary leading-relaxed flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <span>
              {lang === 'kh'
                ? 'ចរន្តស្តុកមានតុល្យភាពល្អ។ ឧបករណ៍និងគំរូទំនិញត្រូវបានត្រួតពិនិត្យទៀងទាត់។'
                : 'Inventory velocity is optimal. Lab incubation supplies are within healthy target thresholds.'}
            </span>
          </div>
        </div>

        {/* Card C: Incoming Stock & Logistics (Mockup phone #1) */}
        <div className="glass rounded-2xl p-4 sm:p-5 border border-border flex flex-col justify-between md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-text-main">
                {lang === 'kh' ? 'ការនាំចូលស្តុក & ភស្តុភារ' : 'Incoming stock & logistics'}
              </h3>
              <p className="text-[11px] text-text-muted">
                {lang === 'kh' ? 'ទិន្នន័យដឹកជញ្ជូន និងផ្គត់ផ្គង់' : 'Active shipments and supplier status'}
              </p>
            </div>
            <div className="w-7 h-7 rounded-lg bg-black/[0.04] dark:bg-white/5 border border-border flex items-center justify-center">
              <Boxes className="h-3.5 w-3.5 text-primary dark:text-cyan-400" />
            </div>
          </div>

          <div className="space-y-2.5 my-auto py-2">
            {/* Metric 1: Incoming Units */}
            <div className="p-2.5 sm:p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-border flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-[11px] text-text-muted uppercase tracking-wider font-semibold">Incoming Stock</p>
                <p className="text-base sm:text-lg font-black text-text-main mt-0.5">
                  {stats.stockInMonth} <span className="text-xs font-normal text-text-muted">Units</span>
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-md">
                +6.2%
              </span>
            </div>

            {/* Metric 2: Estimated Valuation */}
            <div className="p-2.5 sm:p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-border flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-[11px] text-text-muted uppercase tracking-wider font-semibold">Est. Asset Value</p>
                <p className="text-base sm:text-lg font-black text-text-main mt-0.5">
                  ${(stats.totalItems * 85).toLocaleString()} <span className="text-xs font-normal text-text-muted">USD</span>
                </p>
              </div>
              <span className="text-xs font-bold text-primary dark:text-cyan-400 bg-primary/10 dark:bg-cyan-500/15 border border-primary/25 px-2 py-0.5 rounded-md">
                +7.4%
              </span>
            </div>

            {/* Metric 3: Active Suppliers */}
            <div className="p-2.5 sm:p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-border flex items-center justify-between">
              <div>
                <p className="text-[10px] sm:text-[11px] text-text-muted uppercase tracking-wider font-semibold">Suppliers & Shipments</p>
                <p className="text-xs sm:text-sm font-bold text-text-main mt-0.5">
                  InnoLab Partners · Verified
                </p>
              </div>
              <span className="text-xs font-bold text-secondary dark:text-indigo-400 bg-secondary/10 dark:bg-indigo-500/15 border border-secondary/25 px-2 py-0.5 rounded-md">
                Active
              </span>
            </div>
          </div>

          {/* Micro Status Footnote */}
          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
            <span className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
              Automated Inventory Sync
            </span>
            <span className="text-text-muted">Updated just now</span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: Recent Activities, Low Stock Alerts, Recently Added Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Activities */}
        <div className="glass rounded-2xl p-4 sm:p-5 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-text-main">{t('recentActivity')}</h3>
            <Link href="/dashboard/activity" className="text-xs text-primary dark:text-cyan-400 font-semibold hover:underline flex items-center gap-1 transition-colors">
              {t('viewAll')} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentActivities.length > 0 ? (
            <div className="space-y-2.5">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-border hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors">
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 ${getActivityBg(activity.action)}`}>
                    {getActivityIcon(activity.action)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-main leading-relaxed">
                      <span className="font-semibold text-primary dark:text-cyan-300">{activity.user_name || 'System'}</span>{' '}
                      <span className="text-text-muted">{activity.action}</span>{' '}
                      <span className="font-bold text-text-main">{activity.entity_name}</span>
                    </p>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {new Date(activity.created_at).toLocaleDateString(lang === 'kh' ? 'km-KH' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t('noData')} message={t('addItemsToSee')} />
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="glass rounded-2xl p-4 sm:p-5 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-text-main">{t('lowStockAlerts')}</h3>
              {lowStockItems.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/25">
                  {lowStockItems.length}
                </span>
              )}
            </div>
          </div>
          {lowStockItems.length > 0 ? (
            <div className="space-y-2.5">
              {lowStockItems.map((item) => {
                const pct = Math.round((item.quantity / Math.max(item.min_stock_level, 1)) * 100);
                return (
                  <div key={item.id} className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-border flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-xs text-text-main font-bold truncate">{item.name}</p>
                      <p className="text-[10px] text-text-muted">{item.category_name}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-black ${item.quantity === 0 ? 'text-rose-500' : 'text-amber-500 dark:text-amber-400'}`}>
                        {item.quantity} <span className="text-[10px] font-normal text-text-muted">/ {item.min_stock_level} {item.unit}</span>
                      </p>
                      <div className="w-16 h-1.5 bg-black/[0.08] dark:bg-white/10 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.quantity === 0 ? 'bg-rose-500' : pct <= 50 ? 'bg-amber-500 dark:bg-amber-400 shadow-xs' : 'bg-emerald-500 dark:bg-emerald-400'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={AlertCircle}
              title={t('allStockedUp')}
              message={t('noLowStock')}
            />
          )}
        </div>

        {/* Recently Added Items with Cloudinary Images */}
        <div className="glass rounded-2xl p-4 sm:p-5 border border-border md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-text-main">{t('recentlyAdded')}</h3>
            <Link href="/dashboard/inventory" className="text-xs text-primary dark:text-cyan-400 font-semibold hover:underline flex items-center gap-1 transition-colors">
              {t('viewAll')} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentItems.length > 0 ? (
            <div className="space-y-2.5">
              {recentItems.map((item) => (
                <div key={item.id} className="p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-border flex items-center justify-between gap-3 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-black/[0.05] dark:bg-white/10 border border-border flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xs backdrop-blur-md">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <Package className="h-4 w-4 text-primary dark:text-cyan-400/80" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-text-main font-bold truncate">{item.name}</p>
                    <p className="text-[10px] text-text-muted">
                      {item.item_code} · {item.category_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-black text-text-main">
                      {item.quantity} {item.unit}
                    </span>
                    <Badge
                      variant={
                        item.status === 'in_stock' ? 'success' :
                        item.status === 'low_stock' ? 'warning' :
                        item.status === 'out_of_stock' ? 'danger' : 'default'
                      }
                      size="sm"
                      dot
                    >
                      {t(item.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title={t('noItemsYet')} message={t('addItemsToSee')} />
          )}
        </div>
      </div>
    </div>
  );
}
