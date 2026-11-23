'use client';

import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Check,
  Building,
  Sliders,
  ShieldCheck,
  Database,
  MapPin,
  Calendar,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { LoadingState } from '@/components/ui/States';
import { useLanguage } from '@/lib/LanguageContext';

export default function SettingsPage() {
  const { t, lang } = useLanguage();
  const [settings, setSettings] = useState({
    company_name: 'InnoLab Kampong Thom',
    company_location: 'Kampong Thom, Cambodia',
    company_phone: '+855 62 988 888',
    low_stock_threshold: '10',
    currency: 'USD',
    date_format: 'YYYY-MM-DD',
    items_per_page: '20',
    db_status: 'Connected (MySQL)',
    app_version: '1.0.0',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setSettings(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingState message={t('loading')} />;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-main tracking-tight">{t('settingsTitle')}</h2>
          <p className="text-xs text-text-secondary mt-0.5">
            {t('settingsSubtitle')}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
          {savedSuccess ? <Check className="h-3.5 w-3.5 text-white" /> : <Save className="h-3.5 w-3.5" />}
          {savedSuccess ? (lang === 'kh' ? 'រក្សាទុកជោគជ័យ' : 'Saved Successfully') : t('saveChanges')}
        </Button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-medium flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-400" />
          {t('settingsSaved')}
        </div>
      )}

      {/* Organization Information */}
      <div className="glass rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border-light">
          <div className="w-8 h-8 rounded-lg bg-primary-500/15 border border-primary-500/25 text-cyan-300 flex items-center justify-center">
            <Building className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-main">{t('orgDetails')}</h3>
            <p className="text-[11px] text-text-secondary">
              {lang === 'kh' ? 'ព័ត៌មានសម្គាល់ស្ថាប័ន និងទំនាក់ទំនង' : 'Office identification and contact information'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('orgName')}
            value={settings.company_name}
            onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
          />
          <Input
            label={t('branchLocation')}
            value={settings.company_location}
            onChange={(e) => setSettings({ ...settings, company_location: e.target.value })}
          />
          <Input
            label={t('phone')}
            value={settings.company_phone}
            onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
          />
          <Select
            label={t('currency')}
            value={settings.currency}
            onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
            options={[
              { value: 'USD', label: 'USD ($) - US Dollar' },
              { value: 'KHR', label: 'KHR (៛) - Khmer Riel' },
            ]}
          />
        </div>
      </div>

      {/* Inventory & Threshold Rules */}
      <div className="glass rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border-light">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-300 flex items-center justify-center">
            <Sliders className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-main">
              {lang === 'kh' ? 'កម្រិតស្តុក & ច្បាប់ព្រមាន' : 'Inventory & Alert Rules'}
            </h3>
            <p className="text-[11px] text-text-secondary">
              {lang === 'kh' ? 'កំណត់កម្រិតស្តុកអប្បបរមា និងចំនួនទំព័រ' : 'Stock levels and pagination preferences'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label={t('lowStockThreshold')}
            type="number"
            min="1"
            hint={lang === 'kh' ? 'ផ្តល់ដំណឹងនៅពេលចំនួនស្តុកស្មើ ឬទាបជាងតម្លៃនេះ' : 'Trigger alert when quantity is at or below this value'}
            value={settings.low_stock_threshold}
            onChange={(e) => setSettings({ ...settings, low_stock_threshold: e.target.value })}
          />

          <Select
            label={t('itemsPerPage')}
            value={settings.items_per_page}
            onChange={(e) => setSettings({ ...settings, items_per_page: e.target.value })}
            options={[
              { value: '10', label: '10' },
              { value: '20', label: '20' },
              { value: '50', label: '50' },
              { value: '100', label: '100' },
            ]}
          />

          <Select
            label={t('dateFormat')}
            value={settings.date_format}
            onChange={(e) => setSettings({ ...settings, date_format: e.target.value })}
            options={[
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2026-11-20)' },
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (20/11/2026)' },
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (11/20/2026)' },
            ]}
          />
        </div>
      </div>

      {/* System Status (Read Only) */}
      <div className="glass rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2.5 pb-3 border-b border-border-light">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 text-blue-300 flex items-center justify-center">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-text-main">{t('systemHealth')}</h3>
            <p className="text-[11px] text-text-secondary">
              {lang === 'kh' ? 'ស្ថានភាពម៉ាស៊ីនមូលដ្ឋានទិន្នន័យ និងប្រព័ន្ធ' : 'Database and server runtime status'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-bg-main/60 rounded-lg">
            <span className="text-text-muted">{t('databaseEngine')}:</span>
            <p className="font-semibold text-text-main mt-0.5">{settings.db_status || 'MySQL 8.0'}</p>
          </div>
          <div className="p-3 bg-bg-main/60 rounded-lg">
            <span className="text-text-muted">{lang === 'kh' ? 'កន្លែងផ្ទុករូបភាព' : 'Image Storage'}:</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${settings.cloudinary_active ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <p className="font-semibold text-text-main truncate">{settings.storage_provider || 'Local Storage'}</p>
            </div>
          </div>
          <div className="p-3 bg-bg-main/60 rounded-lg">
            <span className="text-text-muted">{t('appVersion')}:</span>
            <p className="font-semibold text-text-main mt-0.5">{settings.app_version || '1.0.0'}</p>
          </div>
          <div className="p-3 bg-bg-main/60 rounded-lg">
            <span className="text-text-muted">{t('targetFacility')}:</span>
            <p className="font-semibold text-text-main mt-0.5">InnoLab Kampong Thom, KH</p>
          </div>
        </div>
      </div>
    </div>
  );
}
