'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SyncModeId, resolveSyncModeFromPollingRate, isSyncModeId } from '@/lib/syncModes';

export interface LiveHqSettings {
  // Connection & Performance
  serverHost: string; // default: 127.0.0.1
  serverPort: number; // default: 8765
  syncMode: SyncModeId; // default: 'balanced'
  keepScreenAwake: boolean; // default: true

  // Notification Delivery
  notificationSoundEnabled: boolean; // default: true
  bannerPopupsEnabled: boolean; // default: true
  doNotDisturb: boolean; // default: false - silences toasts/sound, feed still updates
  criticalOnlyToasts: boolean; // default: true - only critical alerts trigger toasts/sound
  toastCooldownSeconds: number; // default: 60 - minimum gap between toasts

  // Operational Radar & Alerts
  storeLowStockThresholdHours: number; // default: 24 (store shelves, 0 = off)
  warehouseRunwayWarningDays: number; // default: 5 (warehouse reorder, 0 = warnings off; critical stays at <=2d)
  showZeroStockWarnings: boolean; // default: true
  unstaffedShiftAlerts: boolean; // default: true
  lowEmployeeHappinessAlerts: boolean; // default: true
  taxLoanPaymentRiskAlerts: boolean; // default: true
  showCleanlinessAlerts: boolean; // default: true
}

export interface AppSettingsState {
  liveHq: LiveHqSettings;
  updateLiveHqSettings: (newSettings: Partial<LiveHqSettings>) => void;
  resetSettings: () => void;
  clearLocalCache: () => void;
}

const LEGACY_SOUND_KEY = 'ba_sync_notif_sound';
const LEGACY_BANNER_KEY = 'ba_sync_notif_banner';

const DEFAULT_LIVE_HQ_SETTINGS: LiveHqSettings = {
  serverHost: '127.0.0.1',
  serverPort: 8765,
  syncMode: 'balanced',
  keepScreenAwake: true,
  notificationSoundEnabled: true,
  bannerPopupsEnabled: true,
  doNotDisturb: false,
  criticalOnlyToasts: true,
  toastCooldownSeconds: 60,
  storeLowStockThresholdHours: 24,
  warehouseRunwayWarningDays: 5,
  showZeroStockWarnings: true,
  unstaffedShiftAlerts: true,
  lowEmployeeHappinessAlerts: true,
  taxLoanPaymentRiskAlerts: true,
  showCleanlinessAlerts: true,
};

// Sound and banner toggles used to live in page-local state under their own
// localStorage keys. Read those legacy keys once so existing users keep their
// preferences when we migrated them into the unified settings store.
function readLegacyBoolean(key: string, fallback: boolean): boolean | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(key);
    return saved !== null ? saved === 'true' : null;
  } catch {
    return null;
  }
}

const SettingsContext = createContext<AppSettingsState | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [liveHq, setLiveHq] = useState<LiveHqSettings>(DEFAULT_LIVE_HQ_SETTINGS);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedHq = localStorage.getItem('ba_settings_livehq');
      const parsed = storedHq ? JSON.parse(storedHq) : {};
      setLiveHq(prev => ({
        ...prev,
        ...parsed,
        syncMode: isSyncModeId(parsed.syncMode)
          ? parsed.syncMode
          : resolveSyncModeFromPollingRate(parsed.pollingRateMs),
        storeLowStockThresholdHours: parsed.storeLowStockThresholdHours ?? parsed.lowStockThresholdHours ?? 24,
        warehouseRunwayWarningDays: parsed.warehouseRunwayWarningDays ?? 5,
        notificationSoundEnabled: parsed.notificationSoundEnabled ?? readLegacyBoolean(LEGACY_SOUND_KEY, true) ?? true,
        bannerPopupsEnabled: parsed.bannerPopupsEnabled ?? readLegacyBoolean(LEGACY_BANNER_KEY, true) ?? true
      }));
    } catch {
      // Ignore JSON parse errors
    }
  }, []);

  // Screen Wake Lock API handler for secondary monitor companion mode
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      if (liveHq.keepScreenAwake && 'wakeLock' in navigator) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        } catch {
          // Wake lock request failed or not supported in background
        }
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && liveHq.keepScreenAwake) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [liveHq.keepScreenAwake]);

  const updateLiveHqSettings = (newSettings: Partial<LiveHqSettings>) => {
    setLiveHq(prev => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem('ba_settings_livehq', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const resetSettings = () => {
    setLiveHq(DEFAULT_LIVE_HQ_SETTINGS);
    try {
      localStorage.removeItem('ba_settings_livehq');
      localStorage.removeItem(LEGACY_SOUND_KEY);
      localStorage.removeItem(LEGACY_BANNER_KEY);
    } catch {}
  };

  // Clears cached runtime data (not user preferences) so stale state from an older
  // app version cannot linger after an update. Settings are intentionally preserved.
  const clearLocalCache = () => {
    try {
      sessionStorage.removeItem('ba_live_telemetry_cache');
      sessionStorage.removeItem('ba_live_sync_session_verified');
      localStorage.removeItem('ba_settings_seen');
    } catch {}
  };

  return (
    <SettingsContext.Provider
      value={{
        liveHq,
        updateLiveHqSettings,
        resetSettings,
        clearLocalCache,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
