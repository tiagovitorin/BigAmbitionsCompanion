'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Volume2, VolumeX, BellOff, X } from 'lucide-react';
import { LiveBusinessData, LiveEmployeeData, LiveOperationalAlert, LiveWarehouseData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';

interface NotificationsDropdownProps {
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

export default function NotificationsDropdown({
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
}: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Close the popover when clicking anywhere outside it
  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className={`p-2 rounded-xl border transition-all cursor-pointer relative flex items-center justify-center ${
          open || alerts.length > 0
            ? 'bg-[var(--bg-surface)] border-[var(--border-strong)] text-[var(--text-main)] shadow-xs'
            : 'bg-[var(--bg-surface)] border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
        }`}
        title={t('liveHq.recentNotifications', 'Recent Notifications')}
      >
        <Bell className="w-4 h-4" />
        {alerts.length > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center animate-pulse">
            {alerts.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-2xl p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-xs text-[var(--text-main)]">{t('liveHq.recentLiveNotifications', 'Recent Live Notifications')}</span>
            </div>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--bg-base)] text-[var(--text-subtle)]">
              {t('liveHq.activeCount', '{count} active').replace('{count}', alerts.length.toString())}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[11px]">
            <span className="font-semibold text-[var(--text-subtle)] text-[10px] uppercase tracking-wider">{t('liveHq.alertControls', 'Alert Controls:')}</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onToggleSound}
                className={`px-2 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
                  notificationSoundEnabled
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-[var(--bg-surface)] text-[var(--text-subtle)] border-[var(--border-base)] opacity-70'
                }`}
                title={notificationSoundEnabled ? t('liveHq.soundEnabledTitle', 'Audio Chime is Enabled (Click to Mute)') : t('liveHq.soundMutedTitle', 'Audio Chime is Muted (Click to Unmute)')}
              >
                {notificationSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-500" />}
                <span>{notificationSoundEnabled ? t('liveHq.soundOn', 'Sound ON') : t('liveHq.muted', 'Muted')}</span>
              </button>

              <button
                onClick={onToggleBanners}
                className={`px-2 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
                  bannerPopupsEnabled
                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
                    : 'bg-[var(--bg-surface)] text-[var(--text-subtle)] border-[var(--border-base)] opacity-70'
                }`}
                title={bannerPopupsEnabled ? t('liveHq.bannersEnabledTitle', 'Pop-up Banners are Enabled (Click to Disable)') : t('liveHq.bannersDisabledTitle', 'Pop-up Banners are Disabled (Click to Enable)')}
              >
                {bannerPopupsEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5 text-rose-500" />}
                <span>{bannerPopupsEnabled ? t('liveHq.bannersOn', 'Banners ON') : t('liveHq.noPopups', 'No Popups')}</span>
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {alerts.length > 0 ? (
              alerts.map((alert) => {
                const alertKey = alert.id || alert.location + alert.message;
                const targetBiz = businesses.find(b => b.name.toLowerCase() === alert.location.toLowerCase() || alert.location.toLowerCase().includes(b.name.toLowerCase()));
                const targetWarehouse = warehouses.find(w => w.address.toLowerCase() === alert.location.toLowerCase() || alert.location.toLowerCase().includes(w.address.toLowerCase()));

                const isStaffAlert = alert.type === 'satisfaction' || alert.type === 'complaint';
                const targetEmployee = isStaffAlert || !targetBiz
                  ? employees.find(e => e.name.toLowerCase() === alert.location.toLowerCase() || alert.location.toLowerCase().includes(e.name.toLowerCase()))
                  : null;

                const destinationUrl = targetBiz
                  ? `/live-sync?view=stores&store=${targetBiz.id}`
                  : (isStaffAlert || targetEmployee)
                  ? `/live-sync?view=staff&staff=${encodeURIComponent(targetEmployee ? targetEmployee.name : alert.location)}`
                  : targetWarehouse
                  ? `/live-sync?view=logistics`
                  : null;

                return (
                  <div
                    key={alertKey}
                    className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-2 transition-all ${
                      alert.severity === 'critical'
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {destinationUrl ? (
                      <Link
                        href={destinationUrl}
                        onClick={() => setOpen(false)}
                        className="space-y-0.5 flex-1 hover:opacity-80 transition-opacity cursor-pointer text-left block"
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{alert.location}</span>
                          <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-[var(--bg-base)] border border-[var(--border-base)]">
                            {alert.type}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">{alert.message}</div>
                      </Link>
                    ) : (
                      <div className="space-y-0.5 flex-1 text-left">
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{alert.location}</span>
                          <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-[var(--bg-base)] border border-[var(--border-base)]">
                            {alert.type}
                          </span>
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">{alert.message}</div>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismissAlert(alertKey);
                      }}
                      className="text-[var(--text-subtle)] hover:text-[var(--text-main)] p-0.5 rounded transition-colors cursor-pointer shrink-0"
                      title={t('liveHq.dismiss', 'Dismiss')}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                {t('liveHq.noActiveAlerts', 'No active operational alerts. Everything is running smoothly.')}
              </div>
            )}
          </div>

          {alerts.length > 0 && (
            <div className="pt-2 border-t border-[var(--border-subtle)] flex justify-end">
              <button
                onClick={onDismissAll}
                className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
              >
                {t('liveHq.dismissAll', 'Dismiss All')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
