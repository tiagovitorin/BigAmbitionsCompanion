'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface LiveHqSettings {
  // Connection & Performance
  serverHost: string; // default: 127.0.0.1
  serverPort: number; // default: 8765
  pollingRateMs: number; // default: 1500
  autoPauseOnTabInactive: boolean; // default: true
  keepScreenAwake: boolean; // default: true

  // Operational Radar & Alerts
  lowStockThresholdHours: number; // default: 24 (alert when runout <= X hours)
  lowStockThresholdPct?: number; // legacy backward-compatibility
  showZeroStockWarnings: boolean; // default: true
  unstaffedShiftAlerts: boolean; // default: true
  priceSatisfactionFloorPct: number; // default: 80
  lowEmployeeHappinessAlerts: boolean; // default: true
  taxLoanPaymentRiskAlerts: boolean; // default: true
}

export interface AppSettingsState {
  liveHq: LiveHqSettings;
  updateLiveHqSettings: (newSettings: Partial<LiveHqSettings>) => void;
  resetSettings: () => void;
}

const DEFAULT_LIVE_HQ_SETTINGS: LiveHqSettings = {
  serverHost: '127.0.0.1',
  serverPort: 8765,
  pollingRateMs: 2000,
  autoPauseOnTabInactive: true,
  keepScreenAwake: true,
  lowStockThresholdHours: 24,
  lowStockThresholdPct: 20,
  showZeroStockWarnings: true,
  unstaffedShiftAlerts: true,
  priceSatisfactionFloorPct: 80,
  lowEmployeeHappinessAlerts: true,
  taxLoanPaymentRiskAlerts: true,
};

const SettingsContext = createContext<AppSettingsState | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [liveHq, setLiveHq] = useState<LiveHqSettings>(DEFAULT_LIVE_HQ_SETTINGS);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedHq = localStorage.getItem('ba_settings_livehq');
      if (storedHq) {
        const parsed = JSON.parse(storedHq);
        setLiveHq(prev => ({
          ...prev,
          ...parsed,
          lowStockThresholdHours: parsed.lowStockThresholdHours ?? 24
        }));
      }
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

    return () => {
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
    } catch {}
  };

  return (
    <SettingsContext.Provider
      value={{
        liveHq,
        updateLiveHqSettings,
        resetSettings,
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
