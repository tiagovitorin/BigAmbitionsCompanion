'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  RotateCcw, 
  Check, 
  Radio,
  Globe,
  Bell,
  Sun,
  Moon,
  Monitor,
  Trash2,
  ShieldCheck
} from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { useTranslation } from '@/context/LanguageContext';
import { useTheme } from './ThemeProvider';
import { LanguageSelector } from './LanguageSelector';
import { SyncModeSelector } from './SyncModeSelector';
import { getSyncMode } from '@/lib/syncModes';
import { useEscapeToClose } from '@/lib/useEscapeToClose';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'general' | 'connection' | 'alerts';

const SETTINGS_TAB_DEFS: { id: SettingsTab; labelKey: string; fallback: string; icon: any }[] = [
  { id: 'general', labelKey: 'settings.tabGeneral', fallback: 'General', icon: Globe },
  { id: 'connection', labelKey: 'settings.tabConnection', fallback: 'Connection', icon: Radio },
  { id: 'alerts', labelKey: 'settings.tabAlerts', fallback: 'Alerts', icon: Bell }
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { liveHq, updateLiveHqSettings, resetSettings, clearLocalCache } = useSettings();
  const { t } = useTranslation();
  const { themePreference, setTheme } = useTheme();
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [clearingCache, setClearingCache] = useState(false);
  const contentInnerRef = useRef<HTMLDivElement | null>(null);
  const [tabContentHeight, setTabContentHeight] = useState<number | 'auto'>('auto');

  // Keep the tab panel container sized to its content and animate height changes
  // (tab switches, toggles revealing text, warning lines appearing, etc.).
  useEffect(() => {
    if (!isOpen) return;
    const el = contentInnerRef.current;
    if (!el) return;
    const measure = () => setTabContentHeight(el.scrollHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [isOpen, activeTab]);

  useEscapeToClose(isOpen, onClose);

  if (!isOpen) return null;

  const activeTabIndex = SETTINGS_TAB_DEFS.findIndex(tab => tab.id === activeTab);

  const handleSavedNotify = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
  };

  const handleClearCache = () => {
    setClearingCache(true);
    clearLocalCache();
    setTimeout(() => {
      window.location.reload();
    }, 600);
  };

  // Reusable custom switch component
  const CustomToggle = ({
    checked,
    onChange,
    ariaLabel,
  }: {
    checked: boolean;
    onChange: (next: boolean) => void;
    ariaLabel: string;
  }) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    );
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[var(--border-base)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm font-bold text-[var(--text-main)]">{t('settings.title', 'Companion Settings')}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-subtle)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="p-5 overflow-y-auto text-xs">
          {/* Tab Navigation */}
          <div className="relative flex p-1 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
            {/* Sliding active-tab indicator */}
            <div
              className="absolute top-1 bottom-1 left-1 rounded-lg bg-emerald-600 shadow-xs transition-transform duration-300 ease-out"
              style={{
                width: `calc((100% - 0.5rem) / ${SETTINGS_TAB_DEFS.length})`,
                transform: `translateX(${activeTabIndex * 100}%)`
              }}
            />
            {SETTINGS_TAB_DEFS.map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative z-10 flex-1 min-w-0 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    isActive ? 'text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate min-w-0">{t(tab.labelKey, tab.fallback)}</span>
                </button>
              );
            })}
          </div>

          {/* Animated content area */}
          <div className="mt-5 overflow-hidden transition-[height] duration-300 ease-in-out" style={{ height: tabContentHeight }}>
            <div ref={contentInnerRef} className="space-y-5">

          {activeTab === 'general' && (
            <>
              {/* Section: Language Selection */}
              <div className="space-y-2 p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-500" />
                <label className="font-bold text-[var(--text-main)]">{t('settings.language', 'Language')}</label>
              </div>
              <LanguageSelector variant="modal" />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              {t('settings.languageDesc', 'Select your preferred language. Official in-game names and descriptions are loaded directly from Big Ambitions.')}
            </p>
          </div>

              {/* Section: Appearance / Theme */}
              <div className="space-y-2 p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <label className="font-bold text-[var(--text-main)]">{t('settings.themeLabel', 'Theme')}</label>
                </div>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-base)]">
                  {([
                    { id: 'light' as const, label: t('settings.themeLight', 'Light'), icon: Sun },
                    { id: 'dark' as const, label: t('settings.themeDark', 'Dark'), icon: Moon },
                    { id: 'system' as const, label: t('settings.themeSystem', 'System'), icon: Monitor }
                  ]).map((opt) => {
                    const Icon = opt.icon;
                    const isActive = themePreference === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setTheme(opt.id);
                          handleSavedNotify();
                        }}
                        className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {t('settings.themeDesc', 'Choose Light, Dark, or follow your operating system setting.')}
                </p>
              </div>

              {/* Section: Data & Privacy */}
              <div className="space-y-2.5 p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <label className="font-bold text-[var(--text-main)]">{t('settings.dataPrivacyTitle', 'Data & Privacy')}</label>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {t('settings.privacyStatement', 'All game data stays on your machine. The mod serves telemetry only over localhost, and anything sent to us (bug or suggestion reports) leaves only when you press Send.')}
                </p>
                <div className="flex items-start justify-between gap-3 pt-1">
                  <p className="text-[11px] text-[var(--text-subtle)] leading-relaxed">
                    {t('settings.clearCacheDesc', 'Clears cached telemetry and session data - use this if the app shows stale info after an update. Your settings are kept.')}
                  </p>
                  <button
                    type="button"
                    onClick={handleClearCache}
                    disabled={clearingCache}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{clearingCache ? t('settings.clearing', 'Clearing...') : t('settings.clearCacheBtn', 'Clear local cache')}</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'connection' && (
            <>
          {/* Section: Connection & Performance */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider">
              {t('settings.connectionDisplay', 'Connection & Companion Display')}
            </div>

            {/* Locked Local Bridge Endpoint */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[var(--text-main)]">{t('settings.localEndpoint', 'Local Telemetry Endpoint')}</label>
                <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {t('settings.loopbackLocked', 'Loopback (Locked)')}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] font-mono text-xs text-[var(--text-muted)] flex items-center justify-between">
                <span className="text-[var(--text-main)] font-semibold">http://127.0.0.1:8765/</span>
                <span className="text-[10px] text-[var(--text-subtle)] font-sans">{t('settings.strictBinding', 'Strict 127.0.0.1 Binding')}</span>
              </div>
            </div>

            {/* Sync Frequency Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[var(--text-main)]">{t('settings.syncMode', 'Telemetry Sync Mode')}</label>
                <SyncModeSelector
                  value={liveHq.syncMode}
                  onChange={(mode) => {
                    updateLiveHqSettings({ syncMode: mode });
                    handleSavedNotify();
                  }}
                />
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                {t('settings.syncModeHint', 'Choose how often live telemetry updates. Faster sync feels more responsive but uses more resources.')}
              </p>
              {getSyncMode(liveHq.syncMode).warning && (
                <p className="text-[11px] text-rose-500 font-medium pt-0.5">
                  {t('settings.stutterWarning', 'May cause stutter, especially on large saves.')}
                </p>
              )}
              {getSyncMode(liveHq.syncMode).kind === 'hourly' && (
                <p className="text-[11px] text-indigo-500 font-medium pt-0.5">
                  {t('settings.hourlyModeNote', 'Syncs once per in-game hour. Data stays frozen between syncs.')}
                </p>
              )}
              {getSyncMode(liveHq.syncMode).kind === 'daily' && (
                <p className="text-[11px] text-indigo-500 font-medium pt-0.5">
                  {t('settings.dailyModeNote', 'Syncs once per in-game day at midnight. Data stays frozen between syncs.')}
                </p>
              )}
            </div>

            {/* Screen Keep Awake */}
            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5">
                <div className="font-semibold text-[var(--text-main)]">{t('settings.keepAwakeLabel', 'Keep Screen Awake')}</div>
                <p className="text-[11px] text-[var(--text-subtle)]">{t('settings.keepAwakeDesc2', 'Prevents monitor sleep when used on a second display.')}</p>
              </div>
              <CustomToggle
                checked={liveHq.keepScreenAwake}
                onChange={(val) => {
                  updateLiveHqSettings({ keepScreenAwake: val });
                  handleSavedNotify();
                }}
                ariaLabel={t('settings.keepAwakeLabel', 'Keep Screen Awake')}
              />
            </div>
          </div>
            </>
          )}

          {activeTab === 'alerts' && (
            <>
          {/* Section: Alert Delivery */}
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider">
              {t('settings.notificationDelivery', 'Notification Delivery')}
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5">
                <div className="font-semibold text-[var(--text-main)]">{t('settings.notifSound', 'Alert Sound Chime')}</div>
                <p className="text-[11px] text-[var(--text-subtle)]">{t('settings.notifSoundDesc', 'Play a short chime when a new alert appears.')}</p>
              </div>
              <CustomToggle
                checked={liveHq.notificationSoundEnabled}
                onChange={(val) => {
                  updateLiveHqSettings({ notificationSoundEnabled: val });
                  handleSavedNotify();
                }}
                ariaLabel={t('settings.notifSound', 'Alert Sound Chime')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-[var(--text-main)]">{t('settings.notifBanners', 'Pop-up Alert Banners')}</div>
                <p className="text-[11px] text-[var(--text-subtle)]">{t('settings.notifBannersDesc', 'Show the top-center toast when a new alert appears.')}</p>
              </div>
              <CustomToggle
                checked={liveHq.bannerPopupsEnabled}
                onChange={(val) => {
                  updateLiveHqSettings({ bannerPopupsEnabled: val });
                  handleSavedNotify();
                }}
                ariaLabel={t('settings.notifBanners', 'Pop-up Alert Banners')}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5">
                <div className="font-semibold text-[var(--text-main)]">{t('settings.doNotDisturb', 'Do Not Disturb')}</div>
                <p className="text-[11px] text-[var(--text-subtle)]">{t('settings.doNotDisturbDesc', 'Silence pop-ups and sound. Alerts still appear in the notification feed.')}</p>
              </div>
              <CustomToggle
                checked={liveHq.doNotDisturb}
                onChange={(val) => {
                  updateLiveHqSettings({ doNotDisturb: val });
                  handleSavedNotify();
                }}
                ariaLabel={t('settings.doNotDisturb', 'Do Not Disturb')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-[var(--text-main)]">{t('settings.criticalOnly', 'Only Interrupt for Critical Alerts')}</div>
                <p className="text-[11px] text-[var(--text-subtle)]">{t('settings.criticalOnlyDesc', 'Keep warnings (low stock, morale) in the feed; only stockouts and unstaffed stores pop up or chime.')}</p>
              </div>
              <CustomToggle
                checked={liveHq.criticalOnlyToasts}
                onChange={(val) => {
                  updateLiveHqSettings({ criticalOnlyToasts: val });
                  handleSavedNotify();
                }}
                ariaLabel={t('settings.criticalOnly', 'Only Interrupt for Critical Alerts')}
              />
            </div>

            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[var(--text-main)]">{t('settings.toastCooldown', 'Toast Cooldown')}</label>
                <span className="font-mono font-bold text-amber-500 dark:text-amber-400">
                  {liveHq.toastCooldownSeconds === 0 ? t('settings.cooldownOff', 'Off') : `${liveHq.toastCooldownSeconds}s`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="30"
                value={liveHq.toastCooldownSeconds}
                onChange={(e) => {
                  updateLiveHqSettings({ toastCooldownSeconds: Number(e.target.value) });
                  handleSavedNotify();
                }}
                className="w-full accent-indigo-600 h-1.5 bg-[var(--border-base)] rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-subtle)] font-mono">
                <span>0s</span>
                <span>60s</span>
                <span>180s</span>
                <span>300s</span>
              </div>
            </div>
          </div>

          {/* Section: Operational Radar & Store Alerts */}
          <div className="space-y-3 pt-3 border-t border-[var(--border-subtle)]">
            <div className="text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider">
              {t('settings.radarAlerts', 'Operational Radar & Alerts')}
            </div>

            {/* Store Shelf Low Stock Threshold */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[var(--text-main)]">{t('settings.storeLowStock', 'Store Shelf Low Stock')}</label>
                <span className="font-mono font-bold text-amber-500 dark:text-amber-400">
                  {(liveHq.storeLowStockThresholdHours ?? 24) === 0
                    ? t('settings.cooldownOff', 'Off')
                    : `< ${liveHq.storeLowStockThresholdHours ?? 24}h ${((liveHq.storeLowStockThresholdHours ?? 24) >= 24) ? `(${Math.round(((liveHq.storeLowStockThresholdHours ?? 24) / 24) * 10) / 10}d)` : ''}`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="72"
                step="6"
                value={liveHq.storeLowStockThresholdHours ?? 24}
                onChange={(e) => {
                  updateLiveHqSettings({ storeLowStockThresholdHours: Number(e.target.value) });
                  handleSavedNotify();
                }}
                className="w-full accent-indigo-600 h-1.5 bg-[var(--border-base)] rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-subtle)] font-mono">
                <span>{t('settings.offShort', 'Off')}</span>
                <span>24h (1d)</span>
                <span>48h (2d)</span>
                <span>72h (3d)</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pt-0.5">
                {t('settings.storeLowStockDesc', 'Warn when a store product is expected to run out within this many hours while the store is open.')}
              </p>
            </div>

            {/* Warehouse Reorder Runway Threshold */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-[var(--text-main)]">{t('settings.warehouseRunway', 'Warehouse Reorder Runway')}</label>
                <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                  {(liveHq.warehouseRunwayWarningDays ?? 5) === 0
                    ? t('settings.cooldownOff', 'Off')
                    : `< ${liveHq.warehouseRunwayWarningDays ?? 5}d`}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="14"
                step="1"
                value={liveHq.warehouseRunwayWarningDays ?? 5}
                onChange={(e) => {
                  updateLiveHqSettings({ warehouseRunwayWarningDays: Number(e.target.value) });
                  handleSavedNotify();
                }}
                className="w-full accent-sky-500 h-1.5 bg-[var(--border-base)] rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-subtle)] font-mono">
                <span>{t('settings.offShort', 'Off')}</span>
                <span>5d</span>
                <span>10d</span>
                <span>14d</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pt-0.5">
                {t('settings.warehouseRunwayDesc', 'Warn when a stocked warehouse product drops below this many days of runway. Critical alerts fire at 2 days or less. Off disables all warehouse runway alerts.')}
              </p>
            </div>

            {/* Empty Shelf Critical Alerts */}
            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5">
                <div className="font-semibold text-[var(--text-main)]">{t('settings.emptyShelf', 'Empty Shelf Critical Warnings')}</div>
                <p className="text-[11px] text-[var(--text-subtle)]">{t('settings.emptyShelfDesc', 'Show alerts for products that are completely out of stock while the store is open.')}</p>
              </div>
              <CustomToggle
                checked={liveHq.showZeroStockWarnings}
                onChange={(val) => {
                  updateLiveHqSettings({ showZeroStockWarnings: val });
                  handleSavedNotify();
                }}
                ariaLabel={t('settings.emptyShelf', 'Empty Shelf Critical Warnings')}
              />
            </div>

            {/* Unstaffed Shift Alerts */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-[var(--text-main)]">{t('settings.unattendedOpen', 'Unattended Open Store Alerts')}</div>
                <p className="text-[11px] text-[var(--text-subtle)]">{t('settings.unattendedOpenDesc', 'Warn if a store is open with no cashiers scheduled.')}</p>
              </div>
              <CustomToggle
                checked={liveHq.unstaffedShiftAlerts}
                onChange={(val) => {
                  updateLiveHqSettings({ unstaffedShiftAlerts: val });
                  handleSavedNotify();
                }}
                ariaLabel={t('settings.unattendedOpen', 'Unattended Open Store Alerts')}
              />
            </div>

            {/* Low Employee Happiness */}
            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5">
                <div className="font-semibold text-[var(--text-main)]">{t('settings.workerFatigue', 'Worker Fatigue / Morale Risk Alerts')}</div>
                <p className="text-[11px] text-[var(--text-subtle)]">{t('settings.workerFatigueDesc', 'Warn when employee happiness drops below 50%.')}</p>
              </div>
              <CustomToggle
                checked={liveHq.lowEmployeeHappinessAlerts}
                onChange={(val) => {
                  updateLiveHqSettings({ lowEmployeeHappinessAlerts: val });
                  handleSavedNotify();
                }}
                ariaLabel={t('settings.workerFatigue', 'Worker Fatigue / Morale Risk Alerts')}
              />
            </div>

            {/* Tax & Loan Risk Alerts */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="font-semibold text-[var(--text-main)]">{t('settings.overnightLiquidity', 'Overnight Liquidity & Tax Warnings')}</div>
                <p className="text-[11px] text-[var(--text-subtle)]">{t('settings.overnightLiquidityDesc', 'Alert if midnight taxes exceed 50% of available cash.')}</p>
              </div>
              <CustomToggle
                checked={liveHq.taxLoanPaymentRiskAlerts}
                onChange={(val) => {
                  updateLiveHqSettings({ taxLoanPaymentRiskAlerts: val });
                  handleSavedNotify();
                }}
                ariaLabel={t('settings.overnightLiquidity', 'Overnight Liquidity & Tax Warnings')}
              />
            </div>

            {/* Store Cleanliness Alerts */}
            <div className="flex items-center justify-between pt-1">
              <div className="space-y-0.5">
                <div className="font-semibold text-[var(--text-main)]">{t('settings.cleanliness', 'Store Cleanliness Alerts')}</div>
                <p className="text-[11px] text-[var(--text-subtle)]">{t('settings.cleanlinessDesc', 'Warn when a store drops below a healthy cleanliness level.')}</p>
              </div>
              <CustomToggle
                checked={liveHq.showCleanlinessAlerts}
                onChange={(val) => {
                  updateLiveHqSettings({ showCleanlinessAlerts: val });
                  handleSavedNotify();
                }}
                ariaLabel={t('settings.cleanliness', 'Store Cleanliness Alerts')}
              />
            </div>
          </div>
            </>
          )}
            </div>
            </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border-base)] bg-[var(--bg-base)] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              resetSettings();
              handleSavedNotify();
            }}
            className="flex items-center gap-1 text-[11px] text-[var(--text-subtle)] hover:text-rose-500 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t('settings.resetDefaults', 'Reset Defaults')}</span>
          </button>

          <div className="flex items-center gap-2.5">
            {savedFeedback && (
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                <Check className="w-3 h-3" />
                <span>{t('settings.saved', 'Saved')}</span>
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] text-[var(--text-main)] font-semibold transition-colors cursor-pointer"
            >
              {t('settings.done', 'Done')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
