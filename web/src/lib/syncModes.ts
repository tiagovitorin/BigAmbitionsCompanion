export type SyncModeId = 'turbo' | 'fast' | 'balanced' | 'eco' | 'hourly' | 'daily';

export interface SyncMode {
  id: SyncModeId;
  labelKey: string;
  descKey: string;
  // Frontend poll interval in milliseconds while connected.
  pollingRateMs: number;
  // Value sent to the mod via the `?sync=` query parameter.
  modSyncValue: string;
  // How the mod schedules rebuilds for this mode.
  kind: 'interval' | 'hourly' | 'daily';
  // True when this mode should surface a stutter warning.
  warning: boolean;
}

export const SYNC_MODES: SyncMode[] = [
  {
    id: 'turbo',
    labelKey: 'syncModes.turboLabel',
    descKey: 'syncModes.turboDesc',
    pollingRateMs: 1000,
    modSyncValue: '1000',
    kind: 'interval',
    warning: true,
  },
  {
    id: 'fast',
    labelKey: 'syncModes.fastLabel',
    descKey: 'syncModes.fastDesc',
    pollingRateMs: 3000,
    modSyncValue: '3000',
    kind: 'interval',
    warning: false,
  },
  {
    id: 'balanced',
    labelKey: 'syncModes.balancedLabel',
    descKey: 'syncModes.balancedDesc',
    pollingRateMs: 5000,
    modSyncValue: '5000',
    kind: 'interval',
    warning: false,
  },
  {
    id: 'eco',
    labelKey: 'syncModes.ecoLabel',
    descKey: 'syncModes.ecoDesc',
    pollingRateMs: 15000,
    modSyncValue: '15000',
    kind: 'interval',
    warning: false,
  },
  {
    id: 'hourly',
    labelKey: 'syncModes.hourlyLabel',
    descKey: 'syncModes.hourlyDesc',
    pollingRateMs: 30000,
    modSyncValue: 'hourly',
    kind: 'hourly',
    warning: false,
  },
  {
    id: 'daily',
    labelKey: 'syncModes.dailyLabel',
    descKey: 'syncModes.dailyDesc',
    pollingRateMs: 60000,
    modSyncValue: 'daily',
    kind: 'daily',
    warning: false,
  },
];

const DEFAULT_SYNC_MODE = SYNC_MODES[2];

export function getSyncMode(id: SyncModeId | undefined | null): SyncMode {
  return SYNC_MODES.find((m) => m.id === id) ?? DEFAULT_SYNC_MODE;
}

export function isSyncModeId(value: unknown): value is SyncModeId {
  return typeof value === 'string' && SYNC_MODES.some((m) => m.id === value);
}

// Migrate a legacy pollingRateMs value into a sync mode id.
export function resolveSyncModeFromPollingRate(ms?: number | null): SyncModeId {
  if (ms == null || !Number.isFinite(ms)) return DEFAULT_SYNC_MODE.id;
  if (ms <= 1200) return 'turbo';
  if (ms <= 3500) return 'fast';
  if (ms <= 10000) return 'balanced';
  if (ms <= 60000) return 'eco';
  return 'daily';
}
