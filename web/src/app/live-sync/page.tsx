'use client';

import { useMemo, useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Radio } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useLiveSync, EXPECTED_MOD_VERSION } from '@/context/LiveSyncContext';
import { useSettings } from '@/context/SettingsContext';
import { useModal } from '@/context/ModalContext';
import rawBusinesses from '@/data/businesses.json';
import BusinessHistoryGraph from '@/components/BusinessHistoryGraph';
import ModVersionBanner from './components/ModVersionBanner';
import NotificationToast from './components/NotificationToast';
import OperationsHeader from './components/OperationsHeader';
import OfflineGateway from './components/OfflineGateway';
import StoreContextualAlerts from './components/StoreContextualAlerts';
import StoreCommandRoom from './components/StoreCommandRoom';
import StorePricingPanel from './components/StorePricingPanel';
import StoreExpansionPanel from './components/StoreExpansionPanel';
import StoreScheduleAdvisory from './components/StoreScheduleAdvisory';
import ScheduleMatrixTable from './components/ScheduleMatrixTable';
import OverviewView from './components/OverviewView';
import StoresView from './components/StoresView';
import ResidencesView from './components/ResidencesView';
import StaffView from './components/StaffView';
import FinanceView from './components/FinanceView';
import LogisticsView from './components/LogisticsView';
import AnalyzerView from './components/AnalyzerView';
import ModView from './components/ModView';
import { synthesizeOperationalAlerts, computeOpportunities, deriveOverviewData } from '@/lib/alerts';

function LiveSyncDashboardContent() {
  const {
    state,
    isLinkAllowed,
    permissionError,
    diagnosticLogs,
    lastLatencyMs,
    isCityLoaded,
    isDemoMode,
    isHydrated,
    isReconnecting,
    enableDemoMode,
    exitDemoMode,
    connect
  } = useLiveSync();
  const { liveHq, updateLiveHqSettings } = useSettings();
  const { openBugReport } = useModal();
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'overview';
  const selectedStoreId = searchParams.get('store');
  const highlightBizId = searchParams.get('highlight');
  const highlightStaff = searchParams.get('staff');
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // Real-time Phone-Style Toast Notification and Audio Chime
  const [activeToast, setActiveToast] = useState<{ id?: string; location: string; type: string; message: string; severity?: string } | null>(null);
  const notificationSoundEnabled = liveHq.notificationSoundEnabled;
  const bannerPopupsEnabled = liveHq.bannerPopupsEnabled;

  const prevAlertIdsRef = useRef<Set<string>>(new Set());
  const lastToastTimeRef = useRef<number>(0);
  const isInitialLoadRef = useRef(true);

  const toggleSound = () => updateLiveHqSettings({ notificationSoundEnabled: !liveHq.notificationSoundEnabled });
  const toggleBanners = () => updateLiveHqSettings({ bannerPopupsEnabled: !liveHq.bannerPopupsEnabled });

  // Synthesize clean audio notification chime via Web Audio API (no external file dependency)
  const playNotificationChime = () => {
    if (!notificationSoundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      // Tone 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.2, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Tone 2: 880.00 Hz (A5 - pleasant smartphone chime harmony)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.1);
      gain2.gain.setValueAtTime(0, now + 0.1);
      gain2.gain.linearRampToValueAtTime(0.25, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.6);
    } catch {
      // Audio context might be restricted before user interaction
    }
  };

  // Diagnostics Connection Screen (Real Live Console)
  const [handshakeActive, setHandshakeActive] = useState(false);
  const [hasCompletedHandshake, setHasCompletedHandshake] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    // If state is already active or we already verified this session in the current tab, bypass gateway
    const sessionActive = sessionStorage.getItem('ba_live_sync_session_verified');
    return sessionActive === 'true';
  });

  // Trigger real manual diagnostic probe
  const startDiagnosticHandshake = () => {
    setHandshakeActive(true);
    connect();
  };

  // When live save game city is detected, transition immediately into the dashboard
  useEffect(() => {
    let timer: any;
    if (state.isConnected && isCityLoaded) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('ba_live_sync_session_verified', 'true');
      }

      if (!hasCompletedHandshake) {
        if (handshakeActive) {
          // If user opened the manual diagnostic console, let them see the verification logs for ~500ms
          timer = setTimeout(() => {
            setHasCompletedHandshake(true);
            setHandshakeActive(false);
          }, 500);
        } else {
          // If arriving from another page or reload while game is broadcasting, jump straight to dashboard
          setHasCompletedHandshake(true);
        }
      }
    } else if (!state.isConnected && !isCityLoaded) {
      // If game has actually closed / disconnected, clear session verification
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('ba_live_sync_session_verified');
      }
      setHasCompletedHandshake(false);
    }
    return () => clearTimeout(timer);
  }, [state.isConnected, isCityLoaded, hasCompletedHandshake, handshakeActive]);

  const {
    isConnected,
    playerCash,
    bankBalance,
    totalLoans,
    netWorth,
    playerHappiness,
    playerEnergy,
    dailyRevenueTotal,
    dailyExpensesTotal,
    weeklyRevenueTotal,
    weeklyExpensesTotal,
    weeklyBusinessRevenue = 0,
    weeklyResidentialRevenue = 0,
    weeklyResidentialExpenses = 0,
    weeklyResidentialNet = 0,
    totalEmployees,
    weeklyPayrollTotal,
    taxDeductibleExpenses,
    unpaidTaxes,
    gameDay,
    gameHour,
    gameMinute,
    weeklyRevenueHistory = [],
    businesses: rawBusinessesList = [],
    residences = [],
    ownedRealEstate = [],
    emptyLeasedSpaces = [],
    warehouses = [],
    employees = [],
    loans = [],
    operationalAlerts = [],
    vehicles = [],
    boats = [],
    investments = [],
    logisticsPlans = [],
    deliveryContracts = [],
    importPartnerships = []
  } = state;

  // Real-time Smooth Clock Interpolator with Pause Detection
  // In Big Ambitions 1x speed: 1 game minute = 1 real second (1 game hour = 60s real).
  // This smoothly ticks the clock between sync intervals and halts if the game is paused.
  const [smoothClock, setSmoothClock] = useState<{ day: number; hour: number; minute: number }>({
    day: gameDay || 1,
    hour: gameHour || 0,
    minute: gameMinute || 0
  });

  const lastSyncTimeRef = useRef<{ day: number; hour: number; minute: number; realTime: number }>({
    day: gameDay || 1,
    hour: gameHour || 0,
    minute: gameMinute || 0,
    realTime: Date.now()
  });
  const isGamePausedRef = useRef<boolean>(false);

  // Sync state whenever new telemetry arrives from the game
  useEffect(() => {
    if (gameDay === undefined || gameHour === undefined || gameMinute === undefined) return;

    const now = Date.now();
    const prev = lastSyncTimeRef.current;
    const realElapsedSec = (now - prev.realTime) / 1000;

    // Detect if game was paused: if >= 1.5 real seconds passed and in-game minute did NOT change at all, the game is paused!
    if (realElapsedSec >= 1.5 && prev.day === gameDay && prev.hour === gameHour && prev.minute === gameMinute) {
      isGamePausedRef.current = true;
    } else if (prev.day !== gameDay || prev.hour !== gameHour || prev.minute !== gameMinute) {
      isGamePausedRef.current = false;
    }

    lastSyncTimeRef.current = {
      day: gameDay,
      hour: gameHour,
      minute: gameMinute,
      realTime: now
    };

    setSmoothClock({
      day: gameDay,
      hour: gameHour,
      minute: gameMinute
    });
  }, [gameDay, gameHour, gameMinute]);

  // Between telemetry updates, tick the minute forward every 1 real second (if not paused)
  useEffect(() => {
    if (!isConnected && !isDemoMode) return;

    const interval = setInterval(() => {
      // If the game was detected as paused, do not advance the clock
      if (isGamePausedRef.current) return;

      // Also don't advance further than 3 minutes beyond the last synced telemetry value to avoid drift
      const lastSynced = lastSyncTimeRef.current;
      setSmoothClock(curr => {
        const totalLastMins = lastSynced.hour * 60 + lastSynced.minute;
        const totalCurrMins = curr.hour * 60 + curr.minute;
        const diff = (curr.day > lastSynced.day ? 1440 : 0) + totalCurrMins - totalLastMins;
        if (diff >= 3) return curr; // Don't run ahead if game just got paused

        let nextMin = curr.minute + 1;
        let nextHour = curr.hour;
        let nextDay = curr.day;

        if (nextMin >= 60) {
          nextMin = 0;
          nextHour = (nextHour + 1) % 24;
          if (nextHour === 0) {
            nextDay += 1;
          }
        }

        return { day: nextDay, hour: nextHour, minute: nextMin };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected, isDemoMode]);

  // Headquarters are management facilities, not storefronts  -  filter out from businesses across the entire tool
  const businesses = useMemo(() => {
    return (rawBusinessesList || []).filter(b => 
      !b.isHeadquarters && 
      !(b.rawType || '').includes('headquarters') && 
      !(b.rawType || '').includes('hq') && 
      !(b.type || '').toLowerCase().includes('headquarter') &&
      !(b.type || '').toLowerCase().includes('hq')
    );
  }, [rawBusinessesList]);

  const weeklyNetProfit = weeklyRevenueTotal - weeklyExpensesTotal;

  // Real-time Active Alerts (synthesizes server alerts + live schedule matrix unstaffed open hours)
  const activeAlerts = useMemo(() =>
    synthesizeOperationalAlerts(
      operationalAlerts,
      businesses,
      employees,
      warehouses,
      dismissedAlerts,
      {
        storeLowStockThresholdHours: liveHq.storeLowStockThresholdHours ?? 24,
        warehouseRunwayWarningDays: liveHq.warehouseRunwayWarningDays ?? 5,
        showZeroStockWarnings: liveHq.showZeroStockWarnings,
        unstaffedShiftAlerts: liveHq.unstaffedShiftAlerts,
        lowEmployeeHappinessAlerts: liveHq.lowEmployeeHappinessAlerts,
        taxLoanPaymentRiskAlerts: liveHq.taxLoanPaymentRiskAlerts,
        showCleanlinessAlerts: liveHq.showCleanlinessAlerts
      }
    ),
    [operationalAlerts, businesses, employees, warehouses, dismissedAlerts, liveHq.storeLowStockThresholdHours, liveHq.warehouseRunwayWarningDays, liveHq.showZeroStockWarnings, liveHq.unstaffedShiftAlerts, liveHq.lowEmployeeHappinessAlerts, liveHq.taxLoanPaymentRiskAlerts, liveHq.showCleanlinessAlerts]
  );

  // Trigger Phone-Style Notification Pop-up and Audio Chime on New Alert
  useEffect(() => {
    // If active toast alert is no longer part of activeAlerts (e.g. user lowered threshold), dismiss toast immediately
    if (activeToast) {
      const toastKey = activeToast.id || `${activeToast.location}_${activeToast.type}_${activeToast.message}`;
      const isStillActive = activeAlerts.some(a => (a.id || `${a.location}_${a.type}_${a.message}`) === toastKey);
      if (!isStillActive) {
        setActiveToast(null);
      }
    }

    if (activeAlerts.length === 0) {
      prevAlertIdsRef.current = new Set();
      return;
    }

    const currentIds = new Set(activeAlerts.map(a => a.id || `${a.location}_${a.type}_${a.message}`));

    if (isInitialLoadRef.current) {
      // Don't blast sound on initial page load, but track existing alerts
      prevAlertIdsRef.current = currentIds;
      isInitialLoadRef.current = false;
      return;
    }

    // Find if there is any newly added alert
    const newAlert = activeAlerts.find(a => !prevAlertIdsRef.current.has(a.id || `${a.location}_${a.type}_${a.message}`));

    if (newAlert) {
      // Noise control: Do Not Disturb silences toasts + chime. Critical-only mode
      // limits interruption to fires (stockouts, unstaffed stores), everything else
      // stays in the feed. A cooldown prevents alert bursts from spamming toasts.
      const isFireAlert = newAlert.severity === 'critical' || newAlert.type === 'unstaffed';
      const shouldInterrupt = !liveHq.doNotDisturb && (isFireAlert || !liveHq.criticalOnlyToasts);
      if (shouldInterrupt) {
        const cooldownMs = (liveHq.toastCooldownSeconds || 0) * 1000;
        const now = Date.now();
        const cooldownOk = cooldownMs <= 0 || now - lastToastTimeRef.current >= cooldownMs;
        if (cooldownOk) {
          lastToastTimeRef.current = now;
          if (notificationSoundEnabled) {
            playNotificationChime();
          }
          if (bannerPopupsEnabled) {
            setActiveToast(newAlert);
          }
        }
      }

      prevAlertIdsRef.current = currentIds;
    } else {
      prevAlertIdsRef.current = currentIds;
    }
  }, [activeAlerts, notificationSoundEnabled, bannerPopupsEnabled, liveHq.doNotDisturb, liveHq.criticalOnlyToasts, liveHq.toastCooldownSeconds]);

  // Auto-dismiss active toast notification after 5.5 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 5500);
    return () => clearTimeout(timer);
  }, [activeToast]);

  // Selected store for dedicated command room
  const activeStore = useMemo(() => {
    if (!selectedStoreId) return null;
    return businesses.find(b => b.id === selectedStoreId) || null;
  }, [selectedStoreId, businesses]);

  // Find business static definition from compendium
  const activeStoreDef = useMemo(() => {
    if (!activeStore) return null;
    const cleanRaw = activeStore.rawType.replace('ba:businesstype_', '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return (rawBusinesses as any[]).find(b => {
      const bClean = (b.raw_id || b.id || '').replace('ba:businesstype_', '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return bClean === cleanRaw || b.name.toLowerCase() === activeStore.type.toLowerCase();
    }) || null;
  }, [activeStore]);

  // Unstocked catalog products for the active store. Revenue and profit are not
  // fabricated: without real per-product demand telemetry these are labeled Insufficient data.
  const unstockedProductOpportunities = useMemo(() => {
    if (!activeStore || !activeStoreDef || !activeStoreDef.products) return [];
    const currentSoldItems = new Set(
      (activeStore.retailPrices || []).map(rp => 
        rp.rawItemName.replace('ba:itemname_', '').replace('ba:item_', '').toLowerCase().replace(/[^a-z0-9]/g, '')
      )
    );

    return (activeStoreDef.products as any[])
      .filter(p => {
        const pIdClean = (p.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return !currentSoldItems.has(pIdClean) && !pIdClean.includes('paperbag') && !pIdClean.includes('plasticbag');
      })
      .map(p => {
        return {
          ...p,
          estDailyRevenue: null,
          estDailyProfit: null
        };
      });
  }, [activeStore, activeStoreDef]);

  // High-value detected opportunities across all actionable empire levers
  const opportunities = useMemo(() =>
    computeOpportunities(businesses, employees),
    [businesses, employees]
  );

  // Memoized Executive Overview Data Derivation (Robust normalized matching & performance optimization)
  const overviewDerivedData = useMemo(() =>
    deriveOverviewData(businesses, activeAlerts, opportunities),
    [businesses, activeAlerts, opportunities]
  );

  return (
    <div className="space-y-6 relative">
      {/* Top-Center Smartphone Style Notification Banner */}
      {activeToast && (
        <NotificationToast
          activeToast={activeToast}
          onDismiss={() => setActiveToast(null)}
          businesses={businesses}
          warehouses={warehouses}
          employees={employees}
        />
      )}

      {/* Operations Deck Header */}
      <OperationsHeader
        isConnected={isConnected}
        isDemoMode={isDemoMode}
        currentView={currentView}
        activeStore={activeStore}
        smoothClock={smoothClock}
        handshakeActive={handshakeActive}
        onCheckConnection={startDiagnosticHandshake}
        onExitDemo={exitDemoMode}
        alerts={activeAlerts}
        notificationSoundEnabled={notificationSoundEnabled}
        bannerPopupsEnabled={bannerPopupsEnabled}
        onToggleSound={toggleSound}
        onToggleBanners={toggleBanners}
        onDismissAlert={(alertKey) => setDismissedAlerts(prev => [...prev, alertKey])}
        onDismissAll={() => setDismissedAlerts(operationalAlerts.map(a => a.id || a.location + a.message))}
        businesses={businesses}
        warehouses={warehouses}
        employees={employees}
      />

      {/* MOD VERSION MISMATCH WARNING BANNER */}
      {isConnected && state.modVersion && state.modVersion !== EXPECTED_MOD_VERSION && (
        <ModVersionBanner modVersion={state.modVersion} />
      )}

      {/* ================= OFFLINE ONBOARDING / DIAGNOSTIC SYNC GATEWAY ================= */}
      {/* Only render once client has loaded session cache - prevents flash of gateway or empty cards.
          While revalidating a cached session, show a neutral reconnecting view instead of the stale dashboard. */}
      {!isHydrated ? null : isReconnecting && !isDemoMode && currentView !== 'mod' ? (
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs text-center max-w-sm w-full">
            <div className="w-10 h-10 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3">
              <Radio className="w-5 h-5 text-emerald-500 animate-pulse" />
            </div>
            <div className="text-sm font-bold text-[var(--text-main)]">
              {t('liveHq.connectingStatus', 'Connecting to Localhost...')}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              {t('liveHq.reconnectingHint', 'Verifying your Big Ambitions connection...')}
            </p>
          </div>
        </div>
      ) : !isConnected && currentView !== 'mod' && !isDemoMode ? (
        <OfflineGateway
          handshakeActive={handshakeActive}
          onCancelHandshake={() => setHandshakeActive(false)}
          diagnosticLogs={diagnosticLogs}
          isCityLoaded={isCityLoaded}
          lastLatencyMs={lastLatencyMs}
          isLinkAllowed={isLinkAllowed}
          permissionError={permissionError}
          onEnableDemo={enableDemoMode}
          onReportIssue={openBugReport}
          onCheckConnection={startDiagnosticHandshake}
        />
      ) : (
        <>
          {/* Store-Specific Contextual Alerts (Only shows alerts for the store/view you are currently looking at) */}
          <StoreContextualAlerts
            activeStore={activeStore}
            alerts={activeAlerts}
            onDismiss={(alertKey) => setDismissedAlerts(prev => [...prev, alertKey])}
          />

          {/* ================= DEDICATED STORE COMMAND ROOM & PRICE OPTIMIZER ================= */}
          {activeStore ? (
            <div className="space-y-6">
              <StoreCommandRoom activeStore={activeStore} />

          {/* ====== MULTI-METRIC PERFORMANCE GRAPH ====== */}
          <BusinessHistoryGraph business={activeStore} />

          {/* SIDE-BY-SIDE TWIN CARDS: ACTIVE PRODUCT PRICING & EXPANSION OPPORTUNITIES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <StorePricingPanel activeStore={activeStore} />

            <StoreExpansionPanel unstockedProductOpportunities={unstockedProductOpportunities} />
          </div>

          <StoreScheduleAdvisory activeStore={activeStore} activeStoreDef={activeStoreDef} employees={employees} />

          {/* 7-DAY 24-HOUR WEEKLY LIVE SCHEDULE & SHIFT MATRIX */}
          <ScheduleMatrixTable 
            activeStore={activeStore}
            activeStoreDef={activeStoreDef}
            employees={employees}
          />
        </div>
      ) : (
        <>
          {/* ================= VIEW 1: EXECUTIVE COMMAND OVERVIEW ================= */}
          {currentView === 'overview' && (
            <OverviewView
              smoothClock={smoothClock}
              dailyRevenueTotal={dailyRevenueTotal}
              dailyExpensesTotal={dailyExpensesTotal}
              weeklyRevenueTotal={weeklyRevenueTotal}
              weeklyExpensesTotal={weeklyExpensesTotal}
              weeklyRevenueHistory={weeklyRevenueHistory}
              netWorth={netWorth}
              playerCash={playerCash}
              bankBalance={bankBalance}
              totalLoans={totalLoans}
              unpaidTaxes={unpaidTaxes}
              weeklyBusinessRevenue={weeklyBusinessRevenue}
              weeklyResidentialNet={weeklyResidentialNet}
              weeklyPayrollTotal={weeklyPayrollTotal}
              totalEmployees={totalEmployees}
              businesses={businesses}
              overviewDerivedData={overviewDerivedData}
              activeAlertsCount={activeAlerts.length}
              opportunitiesCount={opportunities.length}
            />
          )}

          {/* ================= VIEW 2: COMMERCIAL STOREFRONTS DIRECTORY (100+ ENTERPRISE SCALABLE) ================= */}
          {currentView === 'stores' && (
            <StoresView businesses={businesses} />
          )}

          {/* ================= VIEW 3: PRIVATE RESIDENCES, INVESTMENTS & RENT LEAKS ================= */}
          {currentView === 'residences' && (
            <ResidencesView
              residences={residences}
              ownedRealEstate={ownedRealEstate}
              emptyLeasedSpaces={emptyLeasedSpaces}
              daysPerYear={state.gameVariables?.daysPerYear ?? 60}
            />
          )}

          {/* ================= VIEW 4: ENTERPRISE WORKFORCE & COMPLIANCE COMMAND ================= */}
          {currentView === 'staff' && (
            <StaffView
              employees={employees}
              weeklyPayrollTotal={weeklyPayrollTotal}
              businesses={businesses}
              highlightStaff={highlightStaff}
              highlightBizId={highlightBizId}
            />
          )}

          {/* ================= VIEW 5: COMPLETE LOGISTICS & SUPPLY CHAIN COMMAND CENTER ================= */}
          {currentView === 'logistics' && (
            <LogisticsView
              vehicles={vehicles}
              boats={boats}
              logisticsPlans={logisticsPlans}
              warehouses={warehouses}
              businesses={businesses}
              deliveryContracts={deliveryContracts}
              importPartnerships={importPartnerships}
              playerCash={playerCash}
              gameDay={gameDay}
            />
          )}

          {/* ================= VIEW 6: CFO PROFIT & LOSS AND TREASURY COMMAND CENTER ================= */}
          {currentView === 'finance' && (
            <FinanceView
              businesses={businesses}
              warehouses={warehouses}
              loans={loans}
              employees={employees}
              playerCash={playerCash}
              unpaidTaxes={unpaidTaxes}
              weeklyNetProfit={weeklyNetProfit}
              weeklyRevenueTotal={weeklyRevenueTotal}
              weeklyPayrollTotal={weeklyPayrollTotal}
              weeklyResidentialExpenses={weeklyResidentialExpenses}
              weeklyBusinessRevenue={weeklyBusinessRevenue}
              weeklyResidentialRevenue={weeklyResidentialRevenue}
              totalEmployees={totalEmployees}
              gameDay={gameDay}
              taxDeductibleExpenses={taxDeductibleExpenses}
              taxPercentage={state.gameVariables?.taxPercentage ?? 10}
              daysPerYear={state.gameVariables?.daysPerYear ?? 60}
              investments={investments}
            />
          )}

          {/* ================= VIEW 7: DETERMINISTIC DECISION ANALYZER ================= */}
          {currentView === 'analyzer' && (
            <AnalyzerView
              businesses={businesses}
              activeAlerts={activeAlerts}
              opportunities={opportunities}
            />
          )}

          {/* ================= VIEW 8: MOD TELEMETRY ================= */}
          {currentView === 'mod' && (
            <ModView onReportIssue={openBugReport} />
          )}
            </>
          )}
        </>
      )}

    </div>
  );
}

export default function LiveSyncDashboardPage() {
  return (
    <Suspense fallback={
      <div className="w-full space-y-8 p-6 sm:p-8 animate-pulse">
        <div className="flex items-center justify-between pb-6 border-b border-[var(--border-base)]">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-80 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-[var(--border-base)]" />
          <div className="h-28 bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-[var(--border-base)]" />
          <div className="h-28 bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-[var(--border-base)]" />
          <div className="h-28 bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-[var(--border-base)]" />
        </div>
      </div>
    }>
      <LiveSyncDashboardContent />
    </Suspense>
  );
}
