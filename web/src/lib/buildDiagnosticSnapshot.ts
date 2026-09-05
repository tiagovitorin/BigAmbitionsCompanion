import { LiveTelemetryState, EXPECTED_MOD_VERSION } from '@/context/LiveSyncContext';
import { LiveHqSettings } from '@/context/SettingsContext';

export interface DiagnosticCategoryToggles {
  connectionStatus: boolean; // isConnected, permission state, latency, mod version
  appSettings: boolean;      // serverHost/port, polling rate, etc.
  recentLogs: boolean;       // last 20 diagnosticLogs entries
  gameSnapshot: boolean;     // day/cash/net worth/counts, only relevant if available
}

export const DEFAULT_DIAGNOSTIC_TOGGLES: DiagnosticCategoryToggles = {
  connectionStatus: true,
  appSettings: true,
  recentLogs: true,
  gameSnapshot: true,
};

export interface DiagnosticSnapshot {
  appInfo: {
    timestamp: string;
    timezoneOffsetMinutes: number;
    page: string;
    userAgent: string;
    browser: string;
    os: string;
    theme: string;
    isOnline: boolean;
    deviceMemoryGb?: number;
    cpuCores?: number;
    gpuRenderer?: string;
    language: string;
    viewport: { width: number; height: number };
  };
  connectionStatus?: {
    isConnected: boolean;
    isCityLoaded: boolean;
    permissionGranted: boolean;
    permissionError: string | null;
    lastLatencyMs: number | null;
    modVersion?: string;
    expectedModVersion: string;
  };
  appSettings?: Pick<LiveHqSettings, 'serverHost' | 'serverPort' | 'pollingRateMs' | 'autoPauseOnTabInactive'>;
  recentLogs?: { timestamp: string; level: string; tag: string; message: string }[];
  gameSnapshot?: {
    source: 'live' | 'cached';
    gameDay: number;
    playerCash: number;
    netWorth: number;
    businessCount: number;
    employeeCount: number;
  };
}

function parseBrowserName(ua: string): string {
  if (!ua) return 'Unknown';
  if (/Edg\//i.test(ua)) return 'Microsoft Edge';
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return 'Opera';
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return 'Google Chrome';
  if (/Firefox\//i.test(ua)) return 'Mozilla Firefox';
  if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return 'Apple Safari';
  return 'Chromium / Other';
}

function parseOperatingSystem(ua: string): string {
  if (!ua) return 'Unknown';
  if (/Windows NT 10.0/i.test(ua)) return 'Windows 10/11';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  return 'Unknown OS';
}

function getGpuRenderer(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return undefined;
    const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      if (renderer && typeof renderer === 'string') {
        // Clean up common ANGLE / Direct3D wrapper prefixes if desired
        return renderer
          .replace(/^ANGLE \(([^,]+), ([^,]+), .*\)$/, '$2 ($1)')
          .replace(/^ANGLE \((.*)\)$/, '$1')
          .trim();
      }
    }
    const defaultRenderer = (gl as any).getParameter((gl as any).RENDERER);
    return defaultRenderer || undefined;
  } catch {
    return undefined;
  }
}

export function buildDiagnosticSnapshot(params: {
  state: LiveTelemetryState;
  isConnected: boolean;
  isCityLoaded: boolean;
  permissionGranted: boolean;
  permissionError: string | null;
  lastLatencyMs: number | null;
  diagnosticLogs: { timestamp: string; level: string; tag: string; message: string }[];
  settings: LiveHqSettings;
  toggles: DiagnosticCategoryToggles;
}): DiagnosticSnapshot {
  const {
    state,
    isConnected,
    isCityLoaded,
    permissionGranted,
    permissionError,
    lastLatencyMs,
    diagnosticLogs,
    settings,
    toggles,
  } = params;

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const currentTheme = typeof document !== 'undefined' && document.documentElement.classList.contains('dark') 
    ? 'Dark' 
    : 'Light';

  const snapshot: DiagnosticSnapshot = {
    appInfo: {
      timestamp: new Date().toISOString(),
      timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      page: typeof window !== 'undefined' ? window.location.pathname : '',
      userAgent: ua,
      browser: parseBrowserName(ua),
      os: parseOperatingSystem(ua),
      theme: currentTheme,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      deviceMemoryGb: typeof navigator !== 'undefined' && (navigator as any).deviceMemory ? (navigator as any).deviceMemory : undefined,
      cpuCores: typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : undefined,
      gpuRenderer: getGpuRenderer(),
      language: typeof navigator !== 'undefined' ? navigator.language : '',
      viewport: {
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0,
      },
    },
  };

  if (toggles.connectionStatus) {
    snapshot.connectionStatus = {
      isConnected,
      isCityLoaded,
      permissionGranted,
      permissionError,
      lastLatencyMs,
      modVersion: state.modVersion,
      expectedModVersion: EXPECTED_MOD_VERSION,
    };
  }

  if (toggles.appSettings) {
    snapshot.appSettings = {
      serverHost: settings.serverHost,
      serverPort: settings.serverPort,
      pollingRateMs: settings.pollingRateMs,
      autoPauseOnTabInactive: settings.autoPauseOnTabInactive,
    };
  }

  if (toggles.recentLogs) {
    snapshot.recentLogs = diagnosticLogs.slice(-20);
  }

  if (toggles.gameSnapshot) {
    if (isConnected && state.isConnected) {
      snapshot.gameSnapshot = {
        source: 'live',
        gameDay: state.gameDay,
        playerCash: state.playerCash,
        netWorth: state.netWorth,
        businessCount: state.businesses?.length || 0,
        employeeCount: state.employees?.length || 0,
      };
    } else {
      try {
        const cached = sessionStorage.getItem('ba_live_telemetry_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          snapshot.gameSnapshot = {
            source: 'cached',
            gameDay: parsed.gameDay,
            playerCash: parsed.playerCash,
            netWorth: parsed.netWorth,
            businessCount: parsed.businesses?.length || 0,
            employeeCount: parsed.employees?.length || 0,
          };
        }
      } catch {
        // ignore
      }
    }
  }

  return snapshot;
}

export function hasAvailableGameSnapshot(isConnected: boolean, state: { isConnected: boolean }): boolean {
  if (isConnected && state.isConnected) return true;
  try {
    return Boolean(sessionStorage.getItem('ba_live_telemetry_cache'));
  } catch {
    return false;
  }
}

export async function stripExifFromImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0);

    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b as Blob), file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.92)
    );

    return new File([blob], file.name, { type: blob.type });
  } catch {
    // If canvas re-encoding fails, return original file safely
    return file;
  }
}
