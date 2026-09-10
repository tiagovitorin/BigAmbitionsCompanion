'use client';

import { Bell, X } from 'lucide-react';
import { LiveBusinessData, LiveOperationalAlert } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';

interface StoreContextualAlertsProps {
  activeStore: LiveBusinessData | null;
  alerts: LiveOperationalAlert[];
  onDismiss: (alertKey: string) => void;
}

export default function StoreContextualAlerts({ activeStore, alerts, onDismiss }: StoreContextualAlertsProps) {
  const { t } = useTranslation();

  const relevantAlerts = alerts.filter(alert => {
    if (activeStore) {
      return alert.location.toLowerCase() === activeStore.name.toLowerCase() ||
             alert.location.toLowerCase().includes(activeStore.name.toLowerCase());
    }
    return false;
  });

  if (relevantAlerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {relevantAlerts.map((alert) => {
        const alertKey = alert.id || alert.location + alert.message;

        return (
          <div
            key={alertKey}
            className={`p-3.5 rounded-2xl flex items-start justify-between gap-3 text-xs border transition-all ${
              alert.severity === 'critical'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
            }`}
          >
            <div className="flex items-start gap-2.5 flex-1 text-left">
              <Bell className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold flex items-center gap-2">
                  <span>{alert.location}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[var(--bg-base)] border border-[var(--border-base)]">
                    {alert.type}
                  </span>
                </div>
                <div className="text-[var(--text-muted)] font-normal">{alert.message}</div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(alertKey);
              }}
              className="text-[var(--text-subtle)] hover:text-[var(--text-main)] p-1 rounded transition-colors cursor-pointer shrink-0"
              title={t('liveHq.dismissNotification', 'Dismiss notification')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
