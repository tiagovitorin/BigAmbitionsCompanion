'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useSettings } from './SettingsContext';
import { DEMO_TELEMETRY_STATE } from '@/data/suppliers';
import { getSyncMode } from '@/lib/syncModes';

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

export interface LiveStoreInventoryEntry {
  rawItemName: string;
  quantity: number;
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
  consumablesSales?: {
    itemName: string;
    rawItemName?: string;
    amountSold: number;
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

export interface LiveMarketingCampaign {
  type: string;
  enabled: boolean;
  agencyAddress: string;
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
  inventory?: LiveStoreInventoryEntry[];
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
    marketing?: number;
    theft?: number;
    licensingFees?: number;
    resources?: number;
    expenses: number;
  }[];
  orderHistory?: LiveBusinessOrderHistoryEntry[];
  marketingCampaigns?: LiveMarketingCampaign[];
  marketingExpensesPerDay?: number;
  marketingEfficiency?: number;
  stolenItemsCost?: number;
  lastDeposit?: number;
  takenOver?: boolean;
  creationDay?: number;
  businessDescription?: string;
  lastDayOnSale?: number;
}

export interface LiveResidenceData {
  id: string;
  address: string;
  streetName: string;
  streetNumber: number;
  type: string;
  district?: string;
  rawDistrict?: string;
  sqm?: number;
  isOwned?: boolean;
  rentPerDay: number;
  rentPerWeek: number;
  status: string;
  sinceDay?: number;
}

export interface LiveOwnedRealEstateData {
  id: string;
  address: string;
  streetName: string;
  streetNumber: number;
  district?: string;
  rawDistrict?: string;
  buildingTypeName?: string;
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
  occupancy?: number;
  maxOccupancy?: number;
  pendingPricePerSqm?: number;
  daysUntilUpdatingPricePerSqm?: number;
}

export interface LiveEmptyLeasedSpaceData {
  id: string;
  address: string;
  streetName: string;
  streetNumber: number;
  type: string;
  district?: string;
  rawDistrict?: string;
  sqm?: number;
  rentPerDay: number;
  rentPerWeek: number;
  sinceDay?: number;
}

export interface LiveWarehouseStockItem {
  itemName: string;
  rawItemName: string;
  quantity: number;
  units?: number;
  boxes?: number;
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
  workedHoursToday?: number;
  workedHoursThisWeek?: number;
  workedDays?: number;
  ageYears?: number;
  gender?: string;
  isAbsent?: boolean;
  isComplaining?: boolean;
  isTraining?: boolean;
  isBeingReplaced?: boolean;
  poached?: boolean;
  poachedByRivalId?: string;
  nextSickDay?: number;
  bonusAmount?: number;
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
  bankAddress?: string;
  paidAmount?: number;
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

export interface LiveGameVariables {
  difficulty: string;
  taxPercentage: number;
  daysPerYear: number;
  marketPriceMultiplier: number;
  employeeHourlySalaryMultiplier: number;
  bankInterestMultiplier: number;
  rivalsDifficultyMultiplier: number;
  disableVehicleDamage: boolean;
  disableVehicleFuel: boolean;
  startingMoney: number;
}

export interface LiveAchievementsData {
  totalGasCost: number;
  totalRepairCost: number;
  taxesPaid: number;
  totalInteriorDesignerCost: number;
  totalCasinoWin: number;
  taxiRides: number;
  hospitalization: number;
  parkingTickets: number;
  casinoBoatVisits: number;
  doctorsAppointments: number;
  goodsProducedInFactories: number;
  privateDriverRides: number;
  golfHighScore: number;
  tennisMatchesWon: number;
  golfCartHit: boolean;
  destroyedSandCastle: boolean;
}

export interface LiveFinancialTotals {
  dayNumber: number;
  totalBusinessProfit: number;
  totalLoanExpenses: number;
  totalHealthInsuranceExpenses: number;
  totalHeadhunterReplacementFees: number;
  totalRealEstate: number;
  negativeInterestRates: number;
  parkingFees: number;
  salaryIncome: number;
  totalResidentialExpenses: number;
  totalUnassignedStaffWages: number;
  totalProfit: number;
}

export interface LiveVehicleData {
  id: string;
  vehicleType: string;
  fuel: number; // percentage 0-100 (clamped against maxFuel)
  maxFuel?: number; // absolute tank capacity
  damage: number; // percentage 0-100
  dirtiness: number; // percentage 0-100
  isWarehouseAssigned?: boolean; // true when slotted into a warehouse logistics fleet
  parkingState: string;
  parkingNeighbourhood: string;
  unpaidParkingAmount: number;
  parkingTickets: number;
  streetName: string;
  streetNumber: number;
  cargo: { itemName: string; rawItemName: string; amount: number }[];
  repairCost: number;
  sellingPrice: number;
}

export interface LiveBoatData {
  id: string;
  type: string;
  color: string;
  nextMaintenanceDay: number;
}

export interface LiveInvestmentData {
  name: string;
  initialDeposit: number;
  additionalInvestment: number;
  withdrawal: number;
  interestPayment: number;
  isAutoInvesting: boolean;
  autoInvestment: number;
  currentValue: number;
}

export interface LiveRivalData {
  rivalId: string;
  weeklyIncomeHistory: { day: number; income: number }[];
  numberOfBusinessesHistory: { day: number; count: number }[];
}

export interface LiveSpecialRivalData {
  rivalId: string;
  isActive: boolean;
  isDefeated: boolean;
  completedTimelineEntries: number;
}

export interface LiveMarketEventData {
  type: string;
  itemName: string;
  neighbourhood: string;
  startDay: number;
  durationInDays: number;
  demandImpact: number;
  stopped: boolean;
  isActive: boolean;
  businessTypeName: string;
  rivalName: string;
}

export interface LiveProductMarketData {
  itemName: string;
  importPriceIndex: number;
  demand: {
    neighborhood: string;
    demand: number;
    providers: number;
    lastDaySold: number;
    hasPlayerMonopoly: boolean;
  }[];
}

export interface LiveBuildingForSaleData {
  address: string;
  streetName: string;
  streetNumber: number;
  buildingPrice: number;
  squareMeters: number;
  acceptOfferRate: number;
  pricePerSqm: number;
}

export interface LiveCandidateEmployeeData {
  id: string;
  name: string;
  primarySkill: string;
  skillLevel: number;
  hourlyWage: number;
  satisfaction: number;
  hoursUntilExpiring: number;
  fromJobBoard: boolean;
  sourceAddress: string;
}

export interface LiveRecruitmentCampaignData {
  agencyAddress: string;
  businessAddress: string;
  skillName: string;
  skillPercentage: number;
  amountOfCandidates: number;
  candidatesFound: number;
  price: number;
  fullTime: boolean;
  partTime: boolean;
  finished: boolean;
}

export interface LiveDeliveryContractData {
  enabled: boolean;
  isUrgentOrder: boolean;
  nextDeliveryDay: number;
  repeatingOrder: boolean;
  wholesaleAddress: string;
  supplierName?: string;
  businessAddress: string;
  deliveryFee: number;
  totalPricePerDelivery: number;
  items: {
    itemName: string;
    rawItemName: string;
    amount: number;
    amountOrderedThisWeek: number;
    amountOrderedLastWeek: number;
  }[];
}

export interface LiveFurnitureDeliveryContractData {
  fromAddress: string;
  toAddress: string;
  itemCount: number;
  dayOfDelivery: number;
  hourOfDelivery: number;
  deliveryFee: number;
}

export interface LiveFoodDeliveryContractData {
  toAddress: string;
  itemCount: number;
  dayOfDelivery: number;
  hourOfDelivery: number;
  deliveryFee: number;
}

export interface LiveVehicleDeliveryContractData {
  vehicleTypeName: string;
  vehicleColor: string;
  deliveryDay: number;
  deliveryHour: number;
  deliveryAddress: string;
  deliveryPrice: number;
}

export interface LiveMovingServiceContractData {
  originAddress: string;
  destinationAddress: string;
  movingDay: number;
  movingHour: number;
  transferBizManSettings: boolean;
}

export interface LiveInteriorInstallationContractData {
  installationAddress: string;
  designName: string;
  isBlueprint: boolean;
  dayOfInstallation: number;
  businessTypeName: string;
}

export interface LiveImportPartnershipData {
  id: string;
  headquartersAddress: string;
  importAddress: string;
  supplierName?: string;
  employeeInstanceId: string;
  nextDeliveryDay: number;
  isRepeatingOrder: boolean;
  isActive: boolean;
  isUrgentOrder: boolean;
  nextDeliveryTotal?: number;
  productsCount: number;
  products?: {
    itemName: string;
    rawItemName: string;
    amount: number;
    amountOrderedThisWeek: number;
    assignedWarehouse: string;
    price: number;
  }[];
}

export interface LiveDiplomaData {
  name: string;
  minutesStudied: number;
  completed: boolean;
}

export interface LiveTodoTaskData {
  id: string;
  type: string;
  address: string;
  itemName: string;
  priority: string;
  remainingDays: number;
}

export interface LiveJobInstanceData {
  address: string;
  hired: boolean;
  fired: boolean;
  warnings: number;
  lastWarningDay: number;
  hiringDay: number;
  firedDay: number;
}

export interface LiveLogisticsPlanData {
  id: string;
  assignedEmployeeId: string;
  driverAssigned?: boolean;
  isFactory: boolean;
  targetAddress: string;
  destinationsCount: number;
  maxDestinations?: number;
  destinations?: {
    deliveryTargetAddress: string;
    businessName: string;
    stockTargets: {
      itemName: string;
      rawItemName: string;
      targetAmount: number;
    }[];
  }[];
}

export interface LiveHeadhunterPlanData {
  id: string;
  assignedEmployeeId: string;
  isRecruiting: boolean;
  skillRecruiting: string;
  skillValueTarget: number;
  automaticallyReplaceOnRetire: boolean;
  automaticallyReplaceOnResign: boolean;
}

export interface LiveHrPlanData {
  id: string;
  assignedEmployeeId: string;
  assignedEmployeesCount: number;
  replaceAbsentEmployees: boolean;
  trainingTarget: number;
  hasHealthInsurance: boolean;
}

export interface LivePricingPlanData {
  id: string;
  assignedEmployeeId: string;
  supervisedNeighborhood: string;
  manuallyPricedItemsCount: number;
  nextUpdateDay: number;
  nextUpdateHour: number;
}

export interface LiveContactData {
  category: string;
  unreadMessages: number;
}

export interface LiveHealthInsuranceOfferData {
  hrManagerPlanId: string;
  planType: string;
  dayToSendOffer: number;
  negotiationFinished: boolean;
  accepted: boolean;
  initialOfferPrice: number;
}

export interface LiveSalaryNegotiationData {
  id: string;
  isRival: boolean;
  isPoached: boolean;
  hourlyWage: number;
  signingBonus: number;
  completed: boolean;
  accepted: boolean;
  mood: number;
}

export interface LiveHappinessModifierData {
  type: string;
  hoursLeft: number;
  hideDuration: boolean;
}

export interface LiveNeighbourhoodStatsData {
  name: string;
  nextNewBusinessDay: number;
  nextResidentialSwapDay: number;
  nextWarehouseSwapDay: number;
  nextForceShutdownDay: number;
}

export interface LiveFoodDeliveryOfferData {
  pickupAddress: string;
  destinationAddress: string;
  itemsCount: number;
  deliveryReward: number;
  timeLimitMinutes: number;
  isExpired: boolean;
}

export const EXPECTED_MOD_VERSION = '2.4.0';

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
  emptyLeasedSpaces?: LiveEmptyLeasedSpaceData[];
  warehouses: LiveWarehouseData[];
  employees: LiveEmployeeData[];
  loans: LiveLoanData[];
  operationalAlerts: LiveOperationalAlert[];

  // Extended Player State
  playerStreetName?: string;
  playerStreetNumber?: number;
  activeVehicleId?: string;
  numberOfDoctorOperations?: number;
  currentBackTaxes?: number;
  gamblingWinnings?: number;
  gamblingLosses?: number;
  hasCinemaTheaterTicket?: boolean;
  energyGeneratedFromConsumables?: number;
  currentActivityHappinessPerHour?: number;
  midnightBankBalances?: number[];

  // Extended Portfolio & Operations
  gameVariables?: LiveGameVariables;
  achievements?: LiveAchievementsData;
  financialTotals?: LiveFinancialTotals;
  vehicles?: LiveVehicleData[];
  boats?: LiveBoatData[];
  investments?: LiveInvestmentData[];
  rivals?: LiveRivalData[];
  specialRivals?: LiveSpecialRivalData[];
  marketEvents?: LiveMarketEventData[];
  productMarket?: LiveProductMarketData[];
  buildingsForSale?: LiveBuildingForSaleData[];
  candidateEmployees?: LiveCandidateEmployeeData[];
  recruitmentCampaigns?: LiveRecruitmentCampaignData[];
  deliveryContracts?: LiveDeliveryContractData[];
  furnitureDeliveryContracts?: LiveFurnitureDeliveryContractData[];
  foodDeliveryContracts?: LiveFoodDeliveryContractData[];
  vehicleDeliveryContracts?: LiveVehicleDeliveryContractData[];
  movingServiceContracts?: LiveMovingServiceContractData[];
  interiorInstallationContracts?: LiveInteriorInstallationContractData[];
  importPartnerships?: LiveImportPartnershipData[];
  diplomas?: LiveDiplomaData[];
  todoTasks?: LiveTodoTaskData[];
  jobInstances?: LiveJobInstanceData[];
  logisticsPlans?: LiveLogisticsPlanData[];
  headhunterPlans?: LiveHeadhunterPlanData[];
  hrPlans?: LiveHrPlanData[];
  pricingPlans?: LivePricingPlanData[];
  contacts?: LiveContactData[];
  healthInsuranceOffers?: LiveHealthInsuranceOfferData[];
  salaryNegotiations?: LiveSalaryNegotiationData[];
  happinessModifiers?: LiveHappinessModifierData[];
  neighbourhoodStats?: LiveNeighbourhoodStatsData[];
  playerIncomeHistory?: { day: number; income: number }[];
  playerBusinessCountHistory?: { day: number; count: number }[];
  foodDeliveryOffers?: LiveFoodDeliveryOfferData[];
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
  isReconnecting: boolean;
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
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
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
          // Never trust cached "connected" state without revalidating: the cached frame
          // may be stale (e.g. the game was closed since the last visit). Restore the
          // data for instant charts but force isConnected false until the first live
          // probe succeeds, and show a neutral "reconnecting" state meanwhile so the
          // stale dashboard does not flash.
          setState({ ...parsed, isConnected: false });
          setIsCityLoadedState(Boolean(parsed.gameDay !== undefined || parsed.playerCash !== undefined));
          if (everConnected && !explicitDis) {
            setIsReconnecting(true);
          }
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

  const syncMode = getSyncMode(liveHq.syncMode);
  const endpointUrl = `http://${liveHq.serverHost || '127.0.0.1'}:${liveHq.serverPort || 8765}/?sync=${syncMode.modSyncValue}`;

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
    let isFirstPoll = true;

    const pollLoop = async () => {
      if (!isPollingRef.current) return;
      const connected = await fetchTelemetry();
      // First probe has resolved (success or failure): leave the neutral reconnecting
      // state and render the real connected dashboard or offline gateway.
      if (isFirstPoll) {
        isFirstPoll = false;
        setIsReconnecting(false);
      }
      // If connected: poll at the selected sync mode rate. If offline: poll gently (5s) to free up CPU.
      const nextDelay = connected ? syncMode.pollingRateMs : 5000;
      if (isPollingRef.current) {
        timerId = setTimeout(pollLoop, nextDelay);
      }
    };

    pollLoop();

    return () => {
      clearTimeout(timerId);
      isPollingRef.current = false;
    };
  }, [isSyncActive, endpointUrl, syncMode.pollingRateMs]);

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
    isReconnecting,
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
    isReconnecting,
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
