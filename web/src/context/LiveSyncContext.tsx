'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useSettings } from './SettingsContext';
import { DEMO_TELEMETRY_STATE } from '@/data/suppliers';

export interface LiveRetailPrice {
  rawItemName: string;
  displayName: string;
  currentPrice: number;
  wholesalePrice: number;
  marketReferencePrice: number;
  optimalPrice: number;
  maxMarketCeiling: number;
  inStoreStock?: number;
  isServiceProduct?: boolean;
}

export interface LiveTodayItemSale {
  itemName: string;
  rawItemName?: string;
  amountSold: number;
  totalPrice: number;
  totalWholesalePrice: number;
}

export interface LiveBusinessOrderHistoryEntry {
  dayNumber: number;
  totalCustomers: number;
  totalRevenue: number;
  itemSales: {
    itemName: string;
    rawItemName?: string;
    amountSold: number;
    totalPrice: number;
    totalWholesalePrice: number;
  }[];
}

export interface LiveHourReport {
  hour: number;
  customers: number;
}

export interface LiveWorkShift {
  startHour: number;
  endHour: number;
  employeeId: string;
  employeeName: string;
  role?: string;
  skillName?: string;
  duration: number;
}

export interface LiveScheduleDay {
  day: string;
  isOpen: boolean;
  openHours: number;
  startHour?: number;
  endHour?: number;
  hoursOpen?: boolean[];
  shiftHours: number;
  shifts: LiveWorkShift[];
}

export interface LiveBusinessData {
  id: string;
  name: string;
  type: string;
  rawType: string;
  isHeadquarters?: boolean;
  address: string;
  streetName: string;
  streetNumber: number;
  district: string;
  rawDistrict?: string;
  dailyRevenue: number;
  dailyProfit: number;
  weeklyRevenue?: number;
  weeklyProfit?: number;
  weeklyRent?: number;
  logo?: {
    shape: string;
    base64: string;
    bgHex: string;
    iconHex: string;
  };
  customerSatisfaction: number; // 0-100%
  satisfactionBreakdown?: {
    overall: number;
    customerService: number;
    cleanliness: number;
    pricing: number;
    facility: number;
  };
  promotion?: {
    trafficIndex: number;
    marketing: number;
    total: number;
    activeCampaigns: number;
  };
  customerCapacity?: number;
  isOpenNow: boolean;
  staffOnDuty: number;
  openHoursPerWeek?: number;
  scheduledShiftHoursPerWeek?: number;
  cleanliness: number;
  securityPct: number;
  marketingCampaignsCount: number;
  retailPrices?: LiveRetailPrice[];
  todayCustomerCount?: number;
  todayItemSales?: LiveTodayItemSale[];
  todayOrderSales?: LiveTodayItemSale[];
  hourReports?: LiveHourReport[];
  scheduleWeek?: LiveScheduleDay[];
  revenueHistory?: {
    dayNumber: number;
    revenue: number;
    profit: number;
    salaries: number;
    rent: number;
    ongoing: number;
    expenses: number;
  }[];
  orderHistory?: LiveBusinessOrderHistoryEntry[];
}

export interface LiveResidenceData {
  id: string;
  address: string;
  streetName: string;
  streetNumber: number;
  type: string;
  rentPerDay: number;
  rentPerWeek: number;
  status: string;
}

export interface LiveOwnedRealEstateData {
  id: string;
  address: string;
  streetName: string;
  streetNumber: number;
  district?: string;
  totalSqm: number;
  occupancyPct: number;
  pricePerSqm?: number;
  dailyRevenue: number;
  weeklyRevenue: number;
  dailyTaxes: number;
  weeklyTaxes: number;
  weeklyNet: number;
  purchasePrice: number;
  purchaseDay?: number;
}

export interface LiveWarehouseStockItem {
  itemName: string;
  rawItemName: string;
  quantity: number;
  weeklyConsumption: number;
  weeklyDeliveries: number;
  daysLeft: number;
}

export interface LiveWarehouseData {
  id: string;
  address: string;
  type: string;
  rentPerDay: number;
  rentPerWeek?: number;
  assignedVehicles?: number;
  stock?: LiveWarehouseStockItem[];
}

export interface LiveEmployeeDemand {
  name: string;
  rawName: string;
}

export interface LiveEmployeeData {
  id: string;
  name: string;
  wage: number;
  weeklyWages?: number;
  satisfaction: number;
  primarySkillName?: string;
  skillLevel?: number;
  workingLocation: string;
  weeklyHours: number;
  isAbsent?: boolean;
  isComplaining?: boolean;
  daysHired?: number;
  demands?: LiveEmployeeDemand[];
  hrManager?: string;
  healthInsurance?: string;
}

export interface LiveLoanData {
  totalAmount: number;
  remainingAmount: number;
  dailyPayment: number;
  weeklyPayment?: number;
  dailyInterest: number;
}

export interface LiveOperationalAlert {
  id?: string;
  type: 'unstaffed' | 'complaint' | 'lowstock' | 'maintenance' | 'satisfaction' | 'tax';
  severity: 'critical' | 'warning' | 'info';
  location: string;
  message: string;
}

export interface LiveWeeklyRevenueEntry {
  dayNumber: number;
  revenue: number;
  profit: number;
}

export const EXPECTED_MOD_VERSION = '2.3.0';

export interface LiveTelemetryState {
  isConnected: boolean;
  modVersion?: string;
  lastHeartbeat: string | null;
  gameDay: number;
  gameHour: number;
  gameMinute: number;
  playerCash: number;
  bankBalance: number;
  totalLoans: number;
  netWorth: number;
  playerHappiness: number;
  playerEnergy: number;
  playerHunger: number;
  
  // Daily Economics
  dailyRevenueTotal: number;
  dailyExpensesTotal: number;
  dailyBusinessRevenue?: number;
  dailyResidentialRevenue?: number;

  // Unified Weekly Economics
  weeklyRevenueTotal: number;
  weeklyExpensesTotal: number;
  weeklyBusinessRevenue?: number;
  weeklyBusinessProfit?: number;
  weeklyResidentialRevenue?: number;
  weeklyResidentialExpenses?: number;
  weeklyResidentialNet?: number;

  // Workforce & Treasury
  totalEmployees: number;
  totalHourlyPayroll: number;
  weeklyPayrollTotal: number;
  taxDeductibleExpenses: number;
  unpaidTaxes: number;
  weeklyRevenueHistory?: LiveWeeklyRevenueEntry[];

  // Portfolios
  businesses: LiveBusinessData[];
  residences: LiveResidenceData[];
  ownedRealEstate?: LiveOwnedRealEstateData[];
  warehouses: LiveWarehouseData[];
  employees: LiveEmployeeData[];
  loans: LiveLoanData[];
  operationalAlerts: LiveOperationalAlert[];
}

const INITIAL_OFFLINE_STATE: LiveTelemetryState = {
  isConnected: false,
  lastHeartbeat: null,
  gameDay: 1,
  gameHour: 8,
  gameMinute: 0,
  playerCash: 0,
  bankBalance: 0,
  totalLoans: 0,
  netWorth: 0,
  playerHappiness: 100,
  playerEnergy: 100,
  playerHunger: 0,
  dailyRevenueTotal: 0,
  dailyExpensesTotal: 0,
  dailyBusinessRevenue: 0,
  dailyResidentialRevenue: 0,
  weeklyRevenueTotal: 0,
  weeklyExpensesTotal: 0,
  weeklyBusinessRevenue: 0,
  weeklyBusinessProfit: 0,
  weeklyResidentialRevenue: 0,
  weeklyResidentialExpenses: 0,
  weeklyResidentialNet: 0,
  totalEmployees: 0,
  totalHourlyPayroll: 0,
  weeklyPayrollTotal: 0,
  taxDeductibleExpenses: 0,
  unpaidTaxes: 0,
  weeklyRevenueHistory: [],
  businesses: [],
  residences: [],
  ownedRealEstate: [],
  warehouses: [],
  employees: [],
  loans: [],
  operationalAlerts: []
};

export interface LiveDiagnosticLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  tag: 'HTTP' | 'MOD' | 'SAVE' | 'DATA' | 'NET' | 'SYNC';
  message: string;
}

interface LiveSyncContextValue {
  state: LiveTelemetryState;
  isLinkAllowed: boolean;
  permissionError: string | null;
  diagnosticLogs: LiveDiagnosticLog[];
  lastLatencyMs: number | null;
  isCityLoaded: boolean;
  isDemoMode: boolean;
  isHydrated: boolean;
  enableDemoMode: () => void;
  exitDemoMode: () => void;
  connect: (url?: string) => Promise<boolean>;
  disconnect: () => void;
  clearDiagnosticLogs: () => void;
}

const LiveSyncContext = createContext<LiveSyncContextValue | null>(null);

export function LiveSyncProvider({ children }: { children: ReactNode }) {
  const { liveHq } = useSettings();
  const [state, setState] = useState<LiveTelemetryState>(INITIAL_OFFLINE_STATE);
  const [isSyncActive, setIsSyncActive] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [diagnosticLogs, setDiagnosticLogs] = useState<LiveDiagnosticLog[]>([]);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
  const [isCityLoadedState, setIsCityLoadedState] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const isPollingRef = useRef<boolean>(false);
  const isConnectedRef = useRef<boolean>(false);
  const lastLoggedStateRef = useRef<'offline' | 'mod_hooked' | 'city_loaded'>('offline');
  const lastStorageSaveTimeRef = useRef<number>(0);

  // Hydrate from cached session immediately on client mount (SSR hydration safe)
  useEffect(() => {
    try {
      const everConnected = localStorage.getItem('ba_live_sync_enabled') === 'true';
      const explicitDis = localStorage.getItem('ba_live_sync_explicit_disconnect') === 'true';
      if (everConnected && !explicitDis) {
        setIsSyncActive(true);
      }
      const cached = sessionStorage.getItem('ba_live_telemetry_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.isConnected) {
          setState(parsed);
          setIsCityLoadedState(Boolean(parsed.gameDay !== undefined || parsed.playerCash !== undefined));
        }
      }
    } catch {
      // ignore
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const addLog = (tag: LiveDiagnosticLog['tag'], level: LiveDiagnosticLog['level'], message: string) => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    setDiagnosticLogs(prev => [
      ...prev.slice(-30),
      {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: timeStr,
        level,
        tag,
        message
      }
    ]);
  };

  const endpointUrl = `http://${liveHq.serverHost || '127.0.0.1'}:${liveHq.serverPort || 8765}/`;

  const isHttpsOrigin = typeof window !== 'undefined' && window.location.protocol === 'https:';

  const fetchTelemetry = async (endpoint = endpointUrl) => {
    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(endpoint, {
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);

      const elapsed = Math.round(performance.now() - startTime);
      setLastLatencyMs(elapsed);

      setPermissionGranted(true);
      setPermissionError(null);

      if (res.ok) {
        const data = await res.json();

        // Guard against race condition: if user disconnected while fetch was in flight, do not apply
        if (!isPollingRef.current) {
          return false;
        }

        const cityLoaded = Boolean(
          data && data.isConnected && (
            data.gameDay !== undefined || 
            data.playerCash !== undefined || 
            (Array.isArray(data.businesses) && data.businesses.length >= 0)
          )
        );

        setIsCityLoadedState(cityLoaded);

        if (cityLoaded) {
          if (lastLoggedStateRef.current !== 'city_loaded') {
            lastLoggedStateRef.current = 'city_loaded';
            addLog('HTTP', 'success', `Connected to mod runtime (200 OK, ${elapsed}ms)`);
            addLog('MOD', 'success', `Live HQ bridge verified v${data.modVersion || EXPECTED_MOD_VERSION}`);
            addLog('SAVE', 'success', `Active session: Day ${data.gameDay || 1} | Cash $${(data.playerCash || 0).toLocaleString()} | Net Worth $${(data.netWorth || 0).toLocaleString()}`);
            addLog('DATA', 'success', `Synced ${data.businesses?.length || 0} stores, ${data.employees?.length || 0} staff, ${data.warehouses?.length || 0} warehouses`);
            addLog('SYNC', 'success', 'All telemetry streams verified. Launching Live HQ...');
          }

          isConnectedRef.current = true;
          const rawBizList = Array.isArray(data.businesses) ? data.businesses : [];
          const filteredBizList = rawBizList.filter((b: any) => 
            !b.isHeadquarters && 
            !(b.rawType || '').includes('headquarters') && 
            !(b.rawType || '').includes('hq') && 
            !(b.type || '').toLowerCase().includes('headquarter') &&
            !(b.type || '').toLowerCase().includes('hq')
          );

          const updatedState = {
            ...data,
            businesses: filteredBizList,
            isConnected: true,
            lastHeartbeat: new Date().toISOString()
          };

          // Throttle expensive JSON.stringify serialization into sessionStorage (save at most once every 20s)
          const nowMs = Date.now();
          if (nowMs - lastStorageSaveTimeRef.current > 20000) {
            lastStorageSaveTimeRef.current = nowMs;
            try {
              sessionStorage.setItem('ba_live_telemetry_cache', JSON.stringify(updatedState));
            } catch {
              // ignore
            }
          }
          setState(updatedState);
          return true;
        } else {
          // Mod HTTP server is running, but no save game is loaded yet (player is in main menu)
          if (lastLoggedStateRef.current !== 'mod_hooked') {
            lastLoggedStateRef.current = 'mod_hooked';
            addLog('HTTP', 'info', `Mod HTTP server online on 127.0.0.1:8765 (${elapsed}ms)`);
            addLog('MOD', 'info', 'Hooked into Big Ambitions process  -  mod is active!');
            addLog('SAVE', 'warn', 'No active save detected. Load a city save in-game to begin streaming.');
          }
          isConnectedRef.current = false;
          try {
            sessionStorage.removeItem('ba_live_telemetry_cache');
          } catch {
            // ignore
          }
          setState(prev => prev.isConnected ? { ...prev, isConnected: false } : prev);
          return false;
        }
      } else {
        addLog('HTTP', 'error', `HTTP status ${res.status}: ${res.statusText}`);
      }

      isConnectedRef.current = false;
      setState(prev => prev.isConnected ? { ...prev, isConnected: false } : prev);
      return false;
    } catch (err: any) {
      const errMsg = err?.message || '';
      if (errMsg.toLowerCase().includes('permission') || errMsg.toLowerCase().includes('private network') || errMsg.toLowerCase().includes('loopback')) {
        setPermissionGranted(false);
        setPermissionError('Permission denied in browser. Please allow local network access.');
        addLog('NET', 'error', 'Private Network access blocked. Enable "Apps on device" in Chrome site settings.');
      } else if (errMsg.toLowerCase().includes('mixed') || errMsg.toLowerCase().includes('insecure')) {
        setPermissionGranted(false);
        setPermissionError('HTTPS Mixed Content: Your browser blocks http://127.0.0.1:8765 from an https:// page.');
        addLog('NET', 'error', 'Mixed Content blocked  -  open the app via http:// to use Live Sync.');
      } else {
        setPermissionGranted(true);
        setPermissionError(null);
      }
      
      // If offline, don't spam repeated timeouts. Only log once on initial state.
      if (lastLoggedStateRef.current !== 'offline') {
        lastLoggedStateRef.current = 'offline';
        addLog('HTTP', 'info', 'Waiting for Big Ambitions to launch on port 8765...');
      }

      isConnectedRef.current = false;
      setIsCityLoadedState(false);
      setState(prev => prev.isConnected ? { ...prev, isConnected: false } : prev);
      return false;
    }
  };


  const connect = async () => {
    setIsSyncActive(true);
    isPollingRef.current = true;
    lastLoggedStateRef.current = 'offline';
    try {
      localStorage.setItem('ba_live_sync_enabled', 'true');
      localStorage.removeItem('ba_live_sync_explicit_disconnect');
    } catch {
      // ignore
    }
    setDiagnosticLogs([
      {
        id: `${Date.now()}-init`,
        timestamp: new Date().toTimeString().split(' ')[0],
        level: 'info',
        tag: 'HTTP',
        message: 'Probing local loopback http://127.0.0.1:8765/...'
      }
    ]);
    return await fetchTelemetry();
  };

  const disconnect = () => {
    setIsSyncActive(false);
    isPollingRef.current = false;
    isConnectedRef.current = false;
    setIsCityLoadedState(false);
    addLog('SYNC', 'warn', 'Telemetry bridge disconnected.');
    try {
      localStorage.setItem('ba_live_sync_enabled', 'false');
      localStorage.setItem('ba_live_sync_explicit_disconnect', 'true');
      sessionStorage.removeItem('ba_live_telemetry_cache');
    } catch {
      // ignore
    }
    setState(INITIAL_OFFLINE_STATE);
  };

  const clearDiagnosticLogs = () => {
    setDiagnosticLogs([]);
  };

  useEffect(() => {
    if (!isSyncActive) {
      isPollingRef.current = false;
      return;
    }

    isPollingRef.current = true;
    let timerId: NodeJS.Timeout;

    const pollLoop = async () => {
      if (!isPollingRef.current) return;
      const connected = await fetchTelemetry();
      // If connected: poll at user setting rate. If offline: poll gently (5s) to free up CPU.
      const nextDelay = connected ? (liveHq.pollingRateMs || 1500) : 5000;
      if (isPollingRef.current) {
        timerId = setTimeout(pollLoop, nextDelay);
      }
    };

    pollLoop();

    return () => {
      clearTimeout(timerId);
      isPollingRef.current = false;
    };
  }, [isSyncActive, endpointUrl, liveHq.pollingRateMs]);

  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  const enableDemoMode = () => {
    setIsDemoMode(true);
    setIsSyncActive(false);
    isPollingRef.current = false;
    setState(DEMO_TELEMETRY_STATE);
  };

  const exitDemoMode = () => {
    setIsDemoMode(false);
    setState(INITIAL_OFFLINE_STATE);
  };

  const contextValue = React.useMemo(() => ({
    state, 
    isLinkAllowed: permissionGranted, 
    permissionError, 
    diagnosticLogs,
    lastLatencyMs,
    isCityLoaded: isCityLoadedState,
    isDemoMode,
    isHydrated,
    enableDemoMode,
    exitDemoMode,
    connect, 
    disconnect,
    clearDiagnosticLogs
  }), [
    state,
    permissionGranted,
    permissionError,
    diagnosticLogs,
    lastLatencyMs,
    isCityLoadedState,
    isDemoMode,
    isHydrated,
    liveHq
  ]);

  return (
    <LiveSyncContext.Provider value={contextValue}>
      {children}
    </LiveSyncContext.Provider>
  );
}

export function useLiveSync() {
  const context = useContext(LiveSyncContext);
  if (!context) {
    throw new Error('useLiveSync must be used within a LiveSyncProvider');
  }
  return context;
}
