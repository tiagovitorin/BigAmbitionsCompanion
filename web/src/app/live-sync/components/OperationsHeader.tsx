'use client';

import Link from 'next/link';
import { X, Clock, RotateCw, ChevronRight } from 'lucide-react';
import { LiveBusinessData, LiveEmployeeData, LiveOperationalAlert, LiveWarehouseData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import NotificationsDropdown from './NotificationsDropdown';

interface OperationsHeaderProps {
  isConnected: boolean;
  isDemoMode: boolean;
  currentView: string;
  activeStore: LiveBusinessData | null;
  smoothClock: { day: number; hour: number; minute: number };
  handshakeActive: boolean;
  onCheckConnection: () => void;
  onExitDemo: () => void;
  alerts: LiveOperationalAlert[];
  notificationSoundEnabled: boolean;
  bannerPopupsEnabled: boolean;
  onToggleSound: () => void;
  onToggleBanners: () => void;
  onDismissAlert: (alertKey: string) => void;
  onDismissAll: () => void;
  businesses: LiveBusinessData[];
  warehouses: LiveWarehouseData[];
  employees: LiveEmployeeData[];
}

export default function OperationsHeader({
  isConnected,
  isDemoMode,
  currentView,
  activeStore,
  smoothClock,
  handshakeActive,
  onCheckConnection,
  onExitDemo,
  alerts,
  notificationSoundEnabled,
  bannerPopupsEnabled,
  onToggleSound,
  onToggleBanners,
  onDismissAlert,
  onDismissAll,
  businesses,
  warehouses,
  employees
}: OperationsHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-base)]">
      <div>
        <div className="flex items-center gap-2.5">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
          <h1 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
            {activeStore ? (
              <div className="flex items-center gap-2">
                <Link href="/live-sync?view=stores" className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                  {t('liveHq.viewBusinesses', 'Businesses')}
                </Link>
                <ChevronRight className="w-4 h-4 text-[var(--text-subtle)]" />
                <span>{activeStore.name}</span>
              </div>
            ) : (
              <span>
                {currentView === 'overview' && t('liveHq.executiveOverview', 'Executive Overview')}
                {currentView === 'stores' && t('liveHq.viewBusinesses', 'Businesses')}
                {currentView === 'residences' && t('liveHq.viewProperties', 'Properties')}
                {currentView === 'staff' && t('liveHq.viewWorkforce', 'Workforce')}
                {currentView === 'logistics' && t('liveHq.viewWarehouses', 'Warehouses')}
                {currentView === 'finance' && t('liveHq.viewFinanceTreasury', 'Finance & Treasury')}
                {currentView === 'analyzer' && t('liveHq.viewDecisionAnalyzer', 'Decision Analyzer')}
                {currentView === 'mod' && t('liveHq.viewModTelemetry', 'Mod Telemetry')}
              </span>
            )}
          </h1>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            isDemoMode
              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 animate-pulse'
              : isConnected
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
          }`}>
            {isDemoMode ? `🎮 ${t('liveHq.demoPreview', 'DEMO PREVIEW')}` : isConnected ? t('liveHq.statusLive', 'LIVE') : t('liveHq.statusOffline', 'OFFLINE')}
          </span>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {isDemoMode
            ? t('liveHq.demoSubtitle', 'Viewing an interactive simulation of an active Day 42 empire. Reload or click Exit to return.')
            : t('liveHq.connectedSubtitle', 'Real-time business telemetry synchronized directly with your running Big Ambitions session.')}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {isDemoMode && (
          <button
            onClick={onExitDemo}
            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
          >
            <X className="w-3.5 h-3.5" />
            <span>{t('liveHq.exitDemoMode', 'Exit Demo Mode')}</span>
          </button>
        )}

        {(isConnected || isDemoMode) && (
          <>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-base)] text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[var(--text-muted)]">{t('liveHq.dayLabel', 'Day {day}').replace('{day}', smoothClock.day.toString())}</span>
              <span className="font-bold text-[var(--text-main)]">
                {String(smoothClock.hour).padStart(2, '0')}:{String(smoothClock.minute).padStart(2, '0')}
              </span>
            </div>

            <NotificationsDropdown
              alerts={alerts}
              notificationSoundEnabled={notificationSoundEnabled}
              bannerPopupsEnabled={bannerPopupsEnabled}
              onToggleSound={onToggleSound}
              onToggleBanners={onToggleBanners}
              onDismissAlert={onDismissAlert}
              onDismissAll={onDismissAll}
              businesses={businesses}
              warehouses={warehouses}
              employees={employees}
            />

            <button
              onClick={onCheckConnection}
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] text-xs font-semibold text-[var(--text-main)] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RotateCw className={`w-3 h-3 text-emerald-500 ${handshakeActive ? 'animate-spin' : ''}`} />
              <span>{t('liveHq.checkConnection', 'Check Connection')}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
