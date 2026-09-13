// Deterministic day-by-day simulation for the Big Ambitions Companion demo and mock.
//
// This is the single source of demo telemetry: Demo Mode snapshots are generated from it
// by build-demo.mjs, and the local mock server serves the same world on a bounded
// Day 95..Day 100 cycle. Nothing here touches the game, a save file, or the network.
//
// The world evolves one in-game day at a time from a Normal-difficulty Day 1 baseline
// ($4,200 cash, unhoused, no businesses) to a mature Day 95 empire. Every monetary figure
// is derived from the simulated day and the cash ledger reconciles exactly. All item
// prices, box sizes and recipes come from the real compendium in web/src/data, and the
// output mirrors the schema in web/src/context/LiveSyncContext.tsx.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(HERE, '..', '..', 'src', 'data');

function readJson(name) {
  const raw = fs.readFileSync(path.join(DATA_DIR, name), 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

const BUSINESSES_DATA = readJson('businesses.json');
const NEIGHBORHOODS_DATA = readJson('neighborhoods.json');
const RECIPES_DATA = readJson('recipes.json');
const ITEMS_DATA = readJson('items.json');

function readExpectedModVersion() {
  try {
    const source = fs.readFileSync(path.join(HERE, '..', '..', 'src', 'context', 'LiveSyncContext.tsx'), 'utf8');
    const match = source.match(/EXPECTED_MOD_VERSION\s*=\s*['"]([^'"]+)['"]/);
    return match ? match[1] : '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export const MOD_VERSION = readExpectedModVersion();
export const START_DAY = 95;
export const DEMO_DAYS = 6; // The bounded cycle covers Day 95 through Day 100.
export const DAYS_PER_YEAR = 60;
export const TAX_RATE = 0.10;
export const TAX_GRACE_DAYS = 20;
export const MINIMUM_INCOME_FOR_TAXES = 150000;

// ---------------------------------------------------------------- item catalogue

const ITEM_BY_ID = new Map(ITEMS_DATA.map(item => [item.raw_id, item]));

const BOX_SIZES = new Map();
ITEMS_DATA.forEach(item => {
  const boxSize = item.retail_properties?.box_size;
  if (item.raw_id && typeof boxSize === 'number' && boxSize > 0) BOX_SIZES.set(item.raw_id, boxSize);
});

export function boxSizeFor(rawId) {
  return BOX_SIZES.get(rawId) || 1;
}

export function itemDisplayName(rawId) {
  const item = ITEM_BY_ID.get(rawId);
  if (item?.name) return item.name;
  return String(rawId || '').replace('ba:itemname_', '').split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function itemTypeFlags(rawId) {
  const type = ITEM_BY_ID.get(rawId)?.type;
  if (Array.isArray(type)) return type.join('|');
  return String(type || '');
}

function isServiceItem(rawId) {
  return /service/i.test(itemTypeFlags(rawId));
}

function wholesaleUnitPrice(rawId) {
  const price = ITEM_BY_ID.get(rawId)?.financials?.wholesale_price;
  return typeof price === 'number' && price > 0 ? price : 0;
}

function marketUnitPrice(rawId) {
  const price = ITEM_BY_ID.get(rawId)?.financials?.default_market_price;
  return typeof price === 'number' && price > 0 ? price : 0;
}

// ---------------------------------------------------------------- deterministic rng

export function hashString(text) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rngFor(seed) {
  let a = hashString(seed);
  return function next() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const money = (n) => Math.round(n * 100) / 100;
export const round = (n) => Math.round(n);

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
// Customer traffic by day of week (Monday first). Weekends are the busiest days.
export const DOW_FACTORS = [0.88, 0.90, 0.94, 0.98, 1.08, 1.25, 1.15];

export function formatStreetAddress(street, number) {
  return `${number} ${street}`;
}

// Fulfilled customer demands per business type, from the game's customer_demand_sets.
const DEMAND_SETS = new Map();
BUSINESSES_DATA.forEach(business => {
  const sets = business.customer_demand_sets;
  if (Array.isArray(sets) && sets.length > 0) {
    DEMAND_SETS.set(business.raw_id, sets.map(set => set.type));
  }
});

// ---------------------------------------------------------------- site catalogue

// Each product's wholesale and market price is read from items.json at runtime; the
// per-product baseDailyUnits is the simulation's demand weight for a fully ramped store.
const STORE_DEFINITIONS = [
  {
    id: 'biz_gift',
    seq: 0,
    openDay: 10,
    setupCost: 9500,
    name: 'Curio Gifts',
    type: 'Gift Shop',
    rawType: 'ba:businesstype_giftshop',
    address: '10 2nd Avenue',
    streetName: '2nd Avenue',
    streetNumber: 10,
    district: 'Midtown',
    rawDistrict: 'ba:neighborhood_midtown',
    customerCapacity: 30,
    openStartHour: 8,
    openEndHour: 22,
    baseRentPerDay: 220,
    dailyMarketing: 50,
    products: [
      { rawId: 'ba:itemname_cheapgift', baseDailyUnits: 42 },
      { rawId: 'ba:itemname_expensivegift', baseDailyUnits: 18 },
      { rawId: 'ba:itemname_cheapflower', baseDailyUnits: 26 },
      { rawId: 'ba:itemname_sodacan', baseDailyUnits: 65 }
    ],
    staffDef: [
      { name: 'Alex Vance', role: 'cashier', skill: 'Customer Service', skillLevel: 75, wage: 15, weeklyHours: 35, startHour: 8, endHour: 15 },
      { name: 'Jordan Brooks', role: 'cleaner', skill: 'Cleaning', skillLevel: 68, wage: 14, weeklyHours: 28, startHour: 15, endHour: 22 }
    ]
  },
  {
    id: 'biz_coffee',
    seq: 1,
    openDay: 22,
    setupCost: 6500,
    name: 'Daily Grind',
    type: 'Coffee Shop',
    rawType: 'ba:businesstype_coffeeshop',
    address: '15 5th Avenue',
    streetName: '5th Avenue',
    streetNumber: 15,
    district: 'Midtown',
    rawDistrict: 'ba:neighborhood_midtown',
    customerCapacity: 30,
    openStartHour: 7,
    openEndHour: 21,
    baseRentPerDay: 280,
    dailyMarketing: 60,
    products: [
      { rawId: 'ba:itemname_cupofcoffee', baseDailyUnits: 180 },
      { rawId: 'ba:itemname_croissant', baseDailyUnits: 75 },
      { rawId: 'ba:itemname_donut', baseDailyUnits: 90 },
      { rawId: 'ba:itemname_sodacan', baseDailyUnits: 50 }
    ],
    staffDef: [
      { name: 'Casey Nolan', role: 'cashier', skill: 'Customer Service', skillLevel: 72, wage: 16, weeklyHours: 35, startHour: 7, endHour: 14 },
      { name: 'Morgan Frost', role: 'cashier', skill: 'Customer Service', skillLevel: 65, wage: 15, weeklyHours: 35, startHour: 14, endHour: 21 },
      { name: 'Riley Sato', role: 'cleaner', skill: 'Cleaning', skillLevel: 60, wage: 14, weeklyHours: 21, startHour: 18, endHour: 21 }
    ]
  },
  {
    id: 'biz_fastfood',
    seq: 2,
    openDay: 35,
    setupCost: 8000,
    name: 'Quick Bite',
    type: 'Fast Food Restaurant',
    rawType: 'ba:businesstype_fastfoodrestaurant',
    address: '24 Broadway',
    streetName: 'Broadway',
    streetNumber: 24,
    district: 'Lower Manhattan',
    rawDistrict: 'ba:neighborhood_lowermanhattan',
    customerCapacity: 50,
    openStartHour: 8,
    openEndHour: 23,
    baseRentPerDay: 350,
    dailyMarketing: 80,
    products: [
      { rawId: 'ba:itemname_burger', baseDailyUnits: 110 },
      { rawId: 'ba:itemname_frenchfries', baseDailyUnits: 130 },
      { rawId: 'ba:itemname_hotdog', baseDailyUnits: 65 },
      { rawId: 'ba:itemname_sodacan', baseDailyUnits: 140 }
    ],
    staffDef: [
      { name: 'Taylor Khan', role: 'cashier', skill: 'Customer Service', skillLevel: 70, wage: 16, weeklyHours: 35, startHour: 8, endHour: 15 },
      { name: 'Jamie Rios', role: 'cashier', skill: 'Customer Service', skillLevel: 68, wage: 15, weeklyHours: 40, startHour: 15, endHour: 23 },
      { name: 'Avery Dunn', role: 'cleaner', skill: 'Cleaning', skillLevel: 64, wage: 14, weeklyHours: 28, startHour: 16, endHour: 23 }
    ]
  },
  {
    id: 'biz_clothing',
    seq: 3,
    openDay: 52,
    setupCost: 22000,
    name: 'Thread & Co',
    type: 'Clothing Store',
    rawType: 'ba:businesstype_clothingstore',
    address: '32 34th Street',
    streetName: '34th Street',
    streetNumber: 32,
    district: 'Midtown',
    rawDistrict: 'ba:neighborhood_midtown',
    customerCapacity: 50,
    openStartHour: 9,
    openEndHour: 21,
    baseRentPerDay: 480,
    dailyMarketing: 120,
    products: [
      { rawId: 'ba:itemname_moderncheapmaleclothing', baseDailyUnits: 34 },
      { rawId: 'ba:itemname_moderncheapfemaleclothing', baseDailyUnits: 38 },
      { rawId: 'ba:itemname_modernexpensivemaleclothing', baseDailyUnits: 14 },
      { rawId: 'ba:itemname_modernexpensivefemaleclothing', baseDailyUnits: 16 }
    ],
    staffDef: [
      { name: 'Quinn Pace', role: 'cashier', skill: 'Customer Service', skillLevel: 80, wage: 17, weeklyHours: 35, startHour: 9, endHour: 16 },
      { name: 'Rowan Kerr', role: 'cashier', skill: 'Customer Service', skillLevel: 74, wage: 16, weeklyHours: 35, startHour: 14, endHour: 21 },
      { name: 'Sasha Lund', role: 'security', skill: 'Security', skillLevel: 75, wage: 18, weeklyHours: 35, startHour: 12, endHour: 19 }
    ]
  },
  {
    id: 'biz_electronics',
    seq: 4,
    openDay: 70,
    setupCost: 30000,
    name: 'Volt Electronics',
    type: 'Electronics Store',
    rawType: 'ba:businesstype_electronicsstore',
    address: '18 Lexington Avenue',
    streetName: 'Lexington Avenue',
    streetNumber: 18,
    district: 'Midtown',
    rawDistrict: 'ba:neighborhood_midtown',
    customerCapacity: 75,
    openStartHour: 9,
    openEndHour: 21,
    baseRentPerDay: 600,
    dailyMarketing: 150,
    products: [
      { rawId: 'ba:itemname_smartphone1', baseDailyUnits: 5 },
      { rawId: 'ba:itemname_smartphone2', baseDailyUnits: 3 },
      { rawId: 'ba:itemname_smartwatch1', baseDailyUnits: 6 },
      { rawId: 'ba:itemname_earbuds01', baseDailyUnits: 16 }
    ],
    staffDef: [
      { name: 'Devin Bailey', role: 'cashier', skill: 'Customer Service', skillLevel: 82, wage: 18, weeklyHours: 35, startHour: 9, endHour: 16 },
      { name: 'Nadia Moreau', role: 'cashier', skill: 'Customer Service', skillLevel: 78, wage: 17, weeklyHours: 35, startHour: 14, endHour: 21 },
      { name: 'Omar Rios', role: 'security', skill: 'Security', skillLevel: 80, wage: 19, weeklyHours: 35, startHour: 12, endHour: 19 }
    ]
  },
  {
    id: 'biz_supermarket',
    seq: 5,
    openDay: 85,
    setupCost: 35000,
    name: 'Green Basket',
    type: 'Supermarket',
    rawType: 'ba:businesstype_supermarket',
    address: '50 Broadway',
    streetName: 'Broadway',
    streetNumber: 50,
    district: 'Lower Manhattan',
    rawDistrict: 'ba:neighborhood_lowermanhattan',
    customerCapacity: 75,
    openStartHour: 7,
    openEndHour: 23,
    baseRentPerDay: 750,
    dailyMarketing: 200,
    products: [
      { rawId: 'ba:itemname_freshfood', baseDailyUnits: 190 },
      { rawId: 'ba:itemname_frozenfood', baseDailyUnits: 220 },
      { rawId: 'ba:itemname_apple', baseDailyUnits: 140 },
      { rawId: 'ba:itemname_croissant', baseDailyUnits: 80 },
      { rawId: 'ba:itemname_sodacan', baseDailyUnits: 240 }
    ],
    staffDef: [
      { name: 'Priya Hale', role: 'cashier', skill: 'Customer Service', skillLevel: 76, wage: 16, weeklyHours: 40, startHour: 7, endHour: 15 },
      { name: 'Lena Sato', role: 'cashier', skill: 'Customer Service', skillLevel: 75, wage: 16, weeklyHours: 40, startHour: 15, endHour: 23 },
      { name: 'Marco Vance', role: 'cashier', skill: 'Customer Service', skillLevel: 70, wage: 15, weeklyHours: 35, startHour: 10, endHour: 17 },
      { name: 'Nina Brooks', role: 'cleaner', skill: 'Cleaning', skillLevel: 68, wage: 14, weeklyHours: 35, startHour: 16, endHour: 23 }
    ]
  }
];

const HQ_DEFINITION = {
  id: 'biz_hq',
  openDay: 50,
  setupCost: 6000,
  name: 'Vance Holdings HQ',
  type: 'Headquarters',
  rawType: 'ba:businesstype_headquarters',
  address: '1 Park Avenue',
  streetName: 'Park Avenue',
  streetNumber: 1,
  district: 'Midtown',
  rawDistrict: 'ba:neighborhood_midtown',
  isHeadquarters: true,
  rentPerDay: 400,
  staffDef: [
    { name: 'Theo Pace', role: 'office', skill: 'Human Resources', skillLevel: 85, wage: 32, weeklyHours: 35, startHour: 9, endHour: 17 }
  ]
};

const WAREHOUSE_DEFINITION = {
  id: 'wh_1',
  openDay: 45,
  setupCost: 33000, // warehouse setup plus the delivery van
  name: 'Garment Logistics Hub',
  address: '8 Canal Street',
  streetName: 'Canal Street',
  streetNumber: 8,
  district: 'Garment District',
  type: 'Logistics Warehouse',
  sqm: 500,
  storageCapacityBoxes: 900,
  rentPerDay: 450,
  staffDef: [
    { name: 'Vera Kerr', role: 'logistics', skill: 'Delivery Driver', skillLevel: 80, wage: 20, weeklyHours: 40, startHour: 8, endHour: 16 },
    { name: 'Omar Frost', role: 'logistics', skill: 'Purchasing Agent', skillLevel: 78, wage: 19, weeklyHours: 35, startHour: 9, endHour: 17 }
  ],
  factoryMachineDay: 65,
  factoryStaffDef: [
    { name: 'Devin Moreau', role: 'factory', skill: 'Product Manufacturing', skillLevel: 82, wage: 19, weeklyHours: 40, startHour: 8, endHour: 16 },
    { name: 'Sasha Rios', role: 'factory', skill: 'Product Manufacturing', skillLevel: 76, wage: 18, weeklyHours: 40, startHour: 8, endHour: 16 }
  ],
  machine: {
    id: 'wh_1_machine_0',
    workstationType: 'foodworkstation',
    selectedRecipeId: 'sicETTel+UWhOqmjeOsvg==', // Burger Recipe
    priority: 0,
    produceUpTo: false,
    produceUpToValue: 0,
    isValid: true,
    stackedMachines: []
  }
};

const EXPORT_PARTNER = { address: '4 Pier Street', name: 'BlueStone Imports' };

// Scripted market events. Each window lifts one product in one neighbourhood, and the
// simulated sales respond to it, so the Hype and Demand views have real history.
const HYPE_WINDOWS = [
  { id: 'hype_gift', startDay: 24, durationInDays: 14, rawItem: 'ba:itemname_cheapgift', neighbourhood: 'ba:neighborhood_midtown', demandImpact: 55 },
  { id: 'hype_coffee', startDay: 52, durationInDays: 12, rawItem: 'ba:itemname_cupofcoffee', neighbourhood: 'ba:neighborhood_midtown', demandImpact: 45 },
  { id: 'hype_earbuds', startDay: 80, durationInDays: 16, rawItem: 'ba:itemname_earbuds01', neighbourhood: 'ba:neighborhood_garmentdistrict', demandImpact: 60 }
];

function hypeBoostFor(rawItem, neighbourhood, day) {
  let boost = 1;
  for (const wave of HYPE_WINDOWS) {
    if (wave.rawItem !== rawItem) continue;
    if (wave.neighbourhood !== neighbourhood) continue;
    if (day >= wave.startDay && day < wave.startDay + wave.durationInDays) boost = Math.max(boost, 1.06 + wave.demandImpact / 40);
  }
  return boost;
}

// ---------------------------------------------------------------- simulation engine

export class BigAmbitionsSimulation {
  constructor(seed = 'big-ambitions-demo') {
    this.seed = seed;
    this._reset();
  }

  // Snapshots are day-accurate: the state is advanced only as far as the requested day,
  // so a Day 95 snapshot shows the loans, taxes and investments as they were on Day 95.
  _reset() {
    this.currentDay = 0;
    // Normal difficulty baseline (DifficultySetting.cs: 4200 cash, 10% tax, 60-day year).
    this.playerCash = 4200;
    this.midnightBankBalances = [4200]; // index 0 is the Day 0 baseline
    this.dailyLedgers = new Map();
    this.financialSummaries = new Map();
    this.businessDailyHistories = new Map();
    this.businessOrderHistory = new Map();
    this.taxPeriodDeductibles = 0;

    this.loans = [];
    this.taxesPaid = 0;
    this.currentUnpaidTaxes = 0;
    this.investmentFund = null;
    this.currentResidence = null;
    this.goodsProduced = 0;
    this.parkingTickets = 0;
  }

  runTo(day) {
    if (day < this.currentDay) this._reset();
    while (this.currentDay < day) {
      this.currentDay++;
      this._simulateDay(this.currentDay);
    }
  }

  _residenceRent() {
    return this.currentResidence ? this.currentResidence.rentPerDay : 0;
  }

  _storeHistory(storeId) {
    let history = this.businessDailyHistories.get(storeId);
    if (!history) { history = []; this.businessDailyHistories.set(storeId, history); }
    return history;
  }

  _orderHistory(storeId) {
    let history = this.businessOrderHistory.get(storeId);
    if (!history) { history = []; this.businessOrderHistory.set(storeId, history); }
    return history;
  }

  _simulateDay(day) {
    const cashStart = this.playerCash;
    let inflows = 0;
    let outflows = 0;
    let periodOperatingExpenses = 0; // tax-deductible: rents, wages and marketing, no COGS
    let totalDayExpenses = 0;

    // ---- scripted capital events -------------------------------------------------
    if (day === 3) {
      this.currentResidence = {
        id: 'res_1', address: '4 5th Avenue', streetName: '5th Avenue', streetNumber: 4,
        type: 'Studio Apartment', district: 'Midtown', rawDistrict: 'ba:neighborhood_midtown',
        sqm: 45, isOwned: false, rentPerDay: 120, rentPerWeek: 840, status: 'rented', sinceDay: 3
      };
    }
    if (day === 8) {
      this.loans.push({
        id: 'loan_starter', totalAmount: 20000, remainingAmount: 20000, dailyPayment: 700,
        weeklyPayment: 4900, dailyInterest: 15, bankAddress: '2 Wall Street', paidAmount: 0, active: true
      });
      inflows += 20000;
    }
    if (day === 10) outflows += STORE_DEFINITIONS[0].setupCost;
    if (day === 22) outflows += STORE_DEFINITIONS[1].setupCost;
    if (day === 35) outflows += STORE_DEFINITIONS[2].setupCost;
    if (day === 42) {
      this.loans.push({
        id: 'loan_expansion', totalAmount: 100000, remainingAmount: 100000, dailyPayment: 1800,
        weeklyPayment: 12600, dailyInterest: 45, bankAddress: '40 Broadway', paidAmount: 0, active: true
      });
      inflows += 100000;
    }
    if (day === 45) outflows += WAREHOUSE_DEFINITION.setupCost;
    if (day === 50) outflows += HQ_DEFINITION.setupCost;
    if (day === 52) outflows += STORE_DEFINITIONS[3].setupCost;
    if (day === 58) {
      this.currentResidence = {
        id: 'res_2', address: '9 Park Avenue', streetName: 'Park Avenue', streetNumber: 9,
        type: 'Midtown Apartment', district: 'Midtown', rawDistrict: 'ba:neighborhood_midtown',
        sqm: 110, isOwned: false, rentPerDay: 320, rentPerWeek: 2240, status: 'rented', sinceDay: 58
      };
    }
    if (day === 65) outflows += 14000; // factory workstation and installation
    if (day === 70) outflows += STORE_DEFINITIONS[4].setupCost;
    if (day === 74 && this.currentUnpaidTaxes > 0) {
      outflows += this.currentUnpaidTaxes;
      this.taxesPaid = money(this.taxesPaid + this.currentUnpaidTaxes);
      this.currentUnpaidTaxes = 0;
      this.taxPeriodDeductibles = 0;
    }
    if (day === 80) {
      outflows += 30000;
      this.investmentFund = {
        name: 'Index Fund', initialDeposit: 30000, additionalInvestment: 0, withdrawal: 0,
        interestPayment: 0, isAutoInvesting: false, autoInvestment: 0, currentValue: 30000,
        yearlyMarketChanges: [4, 6, 5, 7, 3, 5, 6, 4], history: []
      };
    }
    if (day === 85) outflows += STORE_DEFINITIONS[5].setupCost;

    // ---- retail trading ----------------------------------------------------------
    const activeStores = STORE_DEFINITIONS.filter(store => day >= store.openDay);
    const dowIndex = (day - 1) % 7;
    const dowMult = DOW_FACTORS[dowIndex];
    let totalStoreSales = 0;
    let totalStoreProfit = 0;

    for (const store of activeStores) {
      const storeRng = rngFor(`store:${store.id}:${day}`);
      const variance = 0.94 + storeRng() * 0.12;
      const daysOpen = day - store.openDay;
      const ramp = 0.6 + 0.4 * Math.min(1, daysOpen / 30);

      const itemSales = [];
      let sales = 0;
      let wholesale = 0;
      let unitsSold = 0;
      for (const product of store.products) {
        const market = marketUnitPrice(product.rawId) || 1;
        const unitWholesale = wholesaleUnitPrice(product.rawId);
        const hype = hypeBoostFor(product.rawId, store.rawDistrict, day);
        const units = Math.max(1, Math.round(product.baseDailyUnits * dowMult * variance * ramp * hype));
        const totalPrice = money(units * market);
        sales += totalPrice;
        wholesale += units * unitWholesale;
        unitsSold += units;
        itemSales.push({
          itemName: itemDisplayName(product.rawId),
          rawItemName: product.rawId,
          amountSold: units,
          totalPrice,
          totalWholesalePrice: money(units * unitWholesale)
        });
      }
      sales = money(sales);
      wholesale = money(wholesale);
      const customers = Math.max(0, Math.round(unitsSold * 0.55));
      const bagUnits = Math.round(customers * 1.2);

      let salaries = 0;
      for (const staff of store.staffDef) salaries += staff.wage * (staff.endHour - staff.startHour);
      salaries = money(salaries);
      const rent = store.baseRentPerDay;
      const marketing = store.dailyMarketing;
      const ongoing = money(salaries + rent + marketing);
      const expenses = money(wholesale + ongoing);
      const profit = money(sales - expenses);

      inflows += sales;
      outflows += expenses;
      totalDayExpenses += expenses;
      periodOperatingExpenses += ongoing;
      totalStoreSales += sales;
      totalStoreProfit += profit;

      this._storeHistory(store.id).push({
        dayNumber: day, revenue: sales, profit, salaries, rent, ongoing,
        marketing, theft: 0, licensingFees: 0, resources: wholesale, expenses
      });
      const orderHistory = this._orderHistory(store.id);
      orderHistory.push({
        dayNumber: day,
        totalCustomers: customers,
        totalRevenue: sales,
        itemSales,
        consumablesSales: [{ itemName: 'Paper Bag', rawItemName: 'ba:itemname_paperbag', amountSold: bagUnits }],
        hourReports: buildHourReports(store, customers)
      });
      if (orderHistory.length > 14) orderHistory.shift();
    }

    // ---- headquarters and warehouse operating costs ------------------------------
    let siteOpex = 0;
    if (day >= HQ_DEFINITION.openDay) {
      const salary = HQ_DEFINITION.staffDef[0].wage * (HQ_DEFINITION.staffDef[0].endHour - HQ_DEFINITION.staffDef[0].startHour);
      siteOpex += HQ_DEFINITION.rentPerDay + salary;
    }
    if (day >= WAREHOUSE_DEFINITION.openDay) {
      let salaries = 0;
      for (const staff of WAREHOUSE_DEFINITION.staffDef) salaries += staff.wage * (staff.endHour - staff.startHour);
      if (day >= WAREHOUSE_DEFINITION.factoryMachineDay) {
        for (const staff of WAREHOUSE_DEFINITION.factoryStaffDef) salaries += staff.wage * (staff.endHour - staff.startHour);
        this.goodsProduced += 200 * WAREHOUSE_DEFINITION.factoryStaffDef.length;
      }
      siteOpex += WAREHOUSE_DEFINITION.rentPerDay + salaries;
    }
    siteOpex = money(siteOpex);
    outflows += siteOpex;
    totalDayExpenses += siteOpex;
    periodOperatingExpenses += siteOpex;

    // ---- residence and loans -----------------------------------------------------
    const residentialRent = this._residenceRent();
    outflows += residentialRent;
    totalDayExpenses += residentialRent;
    periodOperatingExpenses += residentialRent;

    let loanPayments = 0;
    for (const loan of this.loans) {
      if (!loan.active || loan.remainingAmount <= 0) continue;
      const principal = Math.min(loan.remainingAmount, loan.dailyPayment - loan.dailyInterest);
      loan.remainingAmount = money(Math.max(0, loan.remainingAmount - principal));
      loan.paidAmount = money(loan.paidAmount + loan.dailyPayment);
      outflows += loan.dailyPayment;
      loanPayments += loan.dailyPayment;
      if (loan.remainingAmount <= 0) loan.active = false;
    }
    loanPayments = money(loanPayments);

    // ---- investment return (InvestmentFundHelper: yearlyChange / daysPerYear) ----
    if (this.investmentFund) {
      const fund = this.investmentFund;
      const cycleIndex = Math.floor((day - 1) / DAYS_PER_YEAR) % fund.yearlyMarketChanges.length;
      const yearlyChange = fund.yearlyMarketChanges[cycleIndex];
      const fundRng = rngFor(`fund:${this.seed}:${day}`);
      const dailyChange = money(fund.currentValue * (yearlyChange / 100) / DAYS_PER_YEAR * (0.9 + fundRng() * 0.2));
      fund.interestPayment = money(fund.interestPayment + dailyChange);
      fund.currentValue = money(fund.currentValue + dailyChange);
      fund.history.push({ day, change: dailyChange, newBalance: fund.currentValue });
      if (fund.history.length > 14) fund.history.shift();
    }

    // ---- tax assessment ----------------------------------------------------------
    if (day === DAYS_PER_YEAR) {
      let periodSales = 0;
      let periodDeductibles = 0;
      for (let d = 1; d <= DAYS_PER_YEAR; d++) {
        const ledger = this.dailyLedgers.get(d);
        if (!ledger) continue;
        periodSales += ledger.totalStoreSales;
        periodDeductibles += ledger.periodDeductibles;
      }
      if (periodSales >= MINIMUM_INCOME_FOR_TAXES) {
        const taxableBase = Math.max(0, periodSales - periodDeductibles);
        this.currentUnpaidTaxes = money(taxableBase * TAX_RATE);
      }
    }

    // ---- cash ledger -------------------------------------------------------------
    inflows = money(inflows);
    outflows = money(outflows);
    const netCash = money(inflows - outflows);
    this.playerCash = money(cashStart + netCash);
    this.midnightBankBalances.push(this.playerCash);
    this.dailyLedgers.set(day, {
      dayNumber: day, cashStart, inflows, outflows, netCash, cashEnd: this.playerCash,
      totalStoreSales: money(totalStoreSales), periodDeductibles: money(periodOperatingExpenses),
      totalExpenses: money(totalDayExpenses)
    });

    // ---- empire income statement -------------------------------------------------
    // FinancialSummaryHelper.cs:112 signs: business profit + real estate income minus
    // residential rent, plus the (negative-valued) loan expense transaction category.
    const totalBusinessProfit = money(totalStoreProfit - siteOpex);
    const totalProfit = money(totalBusinessProfit - residentialRent - loanPayments);
    this.financialSummaries.set(day, {
      dayNumber: day,
      totalBusinessProfit,
      totalRealEstate: 0,
      totalResidentialExpenses: money(residentialRent),
      totalLoanExpenses: money(-loanPayments),
      parkingFees: 0,
      totalUnassignedStaffWages: 0,
      salaryIncome: 0,
      totalHealthInsuranceExpenses: 0,
      totalHeadhunterReplacementFees: 0,
      negativeInterestRates: 0,
      totalProfit
    });
    this.taxPeriodDeductibles = money(this.taxPeriodDeductibles + periodOperatingExpenses);
  }

  getDailyLedger(day) {
    this.runTo(day);
    return this.dailyLedgers.get(day);
  }

  getFinancialSummary(day) {
    this.runTo(day);
    return this.financialSummaries.get(day);
  }

  // -------------------------------------------------------------- snapshot helpers

  _isOpenAt(store, hour) {
    return hour >= store.openStartHour && hour < store.openEndHour;
  }

  _employees(day, hour) {
    const employees = [];
    let seq = 0;
    const push = (site, staff, role) => {
      seq++;
      const rng = rngFor(`emp:${site.id}:${staff.name}`);
      employees.push({
        id: `emp_${site.id}_${seq}`,
        name: staff.name,
        wage: staff.wage,
        weeklyWages: money(staff.wage * staff.weeklyHours),
        satisfaction: 70 + Math.floor(rng() * 25),
        primarySkillName: staff.skill,
        skillLevel: staff.skillLevel,
        workingLocation: site.address,
        role,
        weeklyHours: staff.weeklyHours,
        workedHoursToday: hour >= staff.startHour && hour < staff.endHour ? hour - staff.startHour : 0,
        workedHoursThisWeek: staff.weeklyHours,
        workedDays: 1 + Math.floor(rng() * 5),
        ageYears: 21 + Math.floor(rng() * 30),
        gender: rng() > 0.5 ? 'Male' : 'Female',
        isAbsent: rng() > 0.94,
        isComplaining: rng() > 0.88,
        isTraining: false,
        isBeingReplaced: false,
        poached: rng() > 0.97,
        poachedByRivalId: '',
        nextSickDay: 0,
        bonusAmount: 0,
        daysHired: Math.max(1, day - site.openDay),
        demands: [],
        hrManager: day >= HQ_DEFINITION.openDay ? HQ_DEFINITION.staffDef[0].name : '',
        healthInsurance: day >= HQ_DEFINITION.openDay ? 'Bronze Health Insurance' : 'None'
      });
    };
    for (const store of STORE_DEFINITIONS.filter(s => day >= s.openDay)) {
      for (const staff of store.staffDef) push(store, staff, staff.role);
    }
    if (day >= HQ_DEFINITION.openDay) {
      for (const staff of HQ_DEFINITION.staffDef) push(HQ_DEFINITION, staff, staff.role);
    }
    if (day >= WAREHOUSE_DEFINITION.openDay) {
      for (const staff of WAREHOUSE_DEFINITION.staffDef) push(WAREHOUSE_DEFINITION, staff, staff.role);
      if (day >= WAREHOUSE_DEFINITION.factoryMachineDay) {
        for (const staff of WAREHOUSE_DEFINITION.factoryStaffDef) push(WAREHOUSE_DEFINITION, staff, 'factory');
      }
    }
    return employees;
  }

  _fulfilledDemands(store) {
    const required = DEMAND_SETS.get(store.rawType) || [];
    if (store.id === 'biz_clothing') {
      // One store is behind on its amenities so the checklist has something to show.
      return required.filter(raw => raw !== 'ba:customerdemand_toilet' && raw !== 'ba:customerdemand_sink');
    }
    return required.slice();
  }

  _retailPrices(store, inventory) {
    return store.products.map(product => {
      const market = marketUnitPrice(product.rawId);
      const unitWholesale = wholesaleUnitPrice(product.rawId);
      const rng = rngFor(`price:${store.id}:${product.rawId}`);
      const optimal = money(market * (0.95 + rng() * 0.05));
      const roll = rng();
      const currentPrice = roll < 0.75
        ? optimal
        : roll < 0.875
          ? money(optimal * (0.84 + rng() * 0.08))
          : money(optimal * (1.08 + rng() * 0.08));
      const stock = inventory.get(product.rawId)?.quantity ?? 0;
      return {
        rawItemName: product.rawId,
        displayName: itemDisplayName(product.rawId),
        currentPrice,
        wholesalePrice: unitWholesale,
        marketReferencePrice: market,
        optimalPrice: optimal,
        maxMarketCeiling: money(market * 1.18),
        inStoreStock: stock,
        isServiceProduct: isServiceItem(product.rawId)
      };
    });
  }

  _inventory(store, day) {
    const inventory = new Map();
    for (const product of store.products) {
      const rng = rngFor(`inv:${store.id}:${product.rawId}`);
      inventory.set(product.rawId, { quantity: Math.round(product.baseDailyUnits * (2.5 + rng() * 3)) });
    }
    // Checkout paper bags: usage comes from the simulated customer count. One store is
    // deliberately out and two are low so the bag alerts have examples.
    const slot = store.seq % 32;
    const days = slot === 1 ? 0 : slot === 3 ? 0.5 : 5 + (hashString(`bags:${store.id}`) % 9);
    const customers = this._orderHistory(store.id).slice(-1)[0]?.totalCustomers || 0;
    inventory.set('ba:itemname_paperbag', { quantity: Math.max(0, Math.round(customers * 1.2 * days)) });
    return inventory;
  }

  _scheduleWeek(store, employees) {
    const siteEmployees = employees.filter(employee => employee.workingLocation === store.address);
    return WEEKDAYS.map(dayName => {
      const open = true;
      const shifts = [];
      let hour = store.openStartHour;
      let index = 0;
      while (hour < store.openEndHour) {
        const end = Math.min(store.openEndHour, hour + 8);
        const employee = siteEmployees[index % Math.max(1, siteEmployees.length)];
        shifts.push({
          startHour: hour, endHour: end, employeeId: employee?.id || '', employeeName: employee?.name || 'Staff',
          role: employee?.role || 'cashier', skillName: employee?.primarySkillName || 'Customer Service',
          duration: end - hour, itemInstanceId: `${store.id}_station_${index % Math.max(1, Math.ceil(store.customerCapacity / 40))}`, shiftType: 1
        });
        hour = end;
        index++;
      }
      return {
        day: dayName, isOpen: open, openHours: store.openEndHour - store.openStartHour,
        startHour: store.openStartHour, endHour: store.openEndHour,
        shiftHours: shifts.reduce((sum, shift) => sum + shift.duration, 0), shifts
      };
    });
  }

  _businesses(day, hour, employees) {
    const businesses = [];
    for (const store of STORE_DEFINITIONS.filter(s => day >= s.openDay)) {
      const history = this._storeHistory(store.id);
      const latest = history[history.length - 1] || { revenue: 0, profit: 0 };
      const inventory = this._inventory(store, day);
      let weeklyRevenue = 0;
      let weeklyProfit = 0;
      for (const entry of history.slice(-7)) { weeklyRevenue += entry.revenue; weeklyProfit += entry.profit; }
      const satisfactionRng = rngFor(`sat:${store.id}`);
      const satisfaction = 80 + Math.floor(satisfactionRng() * 16);
      const customers = this._orderHistory(store.id).slice(-1)[0]?.totalCustomers || 0;
      businesses.push({
        id: `${store.streetName}_${store.streetNumber}`,
        name: store.name,
        type: store.type,
        rawType: store.rawType,
        isHeadquarters: false,
        address: store.address,
        streetName: store.streetName,
        streetNumber: store.streetNumber,
        district: store.district,
        rawDistrict: store.rawDistrict,
        dailyRevenue: latest.revenue,
        dailyProfit: latest.profit,
        weeklyRevenue: money(weeklyRevenue),
        weeklyProfit: money(weeklyProfit),
        weeklyRent: money(store.baseRentPerDay * 7),
        logo: { shape: 'store', base64: '', bgHex: '#059669', iconHex: '#FFFFFF' },
        customerSatisfaction: satisfaction,
        satisfactionBreakdown: {
          overall: satisfaction, customerService: satisfaction + 2, cleanliness: satisfaction - 3,
          pricing: satisfaction, facility: satisfaction - 1
        },
        promotion: {
          trafficIndex: 45 + Math.floor(satisfactionRng() * 45),
          marketing: Math.min(100, 40 + Math.floor(satisfactionRng() * 60)),
          total: 60 + Math.floor(satisfactionRng() * 35),
          activeCampaigns: 1
        },
        customerCapacity: store.customerCapacity,
        customerDemands: this._fulfilledDemands(store),
        isOpenNow: this._isOpenAt(store, hour),
        staffOnDuty: this._isOpenAt(store, hour)
          ? employees.filter(employee => employee.workingLocation === store.address && employee.workedHoursToday > 0).length || 1
          : 0,
        openHoursPerWeek: (store.openEndHour - store.openStartHour) * 7,
        scheduledShiftHoursPerWeek: store.staffDef.reduce((sum, staff) => sum + (staff.endHour - staff.startHour), 0),
        cleanliness: 84 + Math.floor(satisfactionRng() * 12),
        securityPct: 65 + Math.floor(satisfactionRng() * 30),
        marketingCampaignsCount: 1,
        retailPrices: this._retailPrices(store, inventory),
        inventory: [...inventory.entries()].map(([rawItemName, entry]) => ({ rawItemName, quantity: entry.quantity })),
        serviceStations: Array.from({ length: Math.max(1, Math.ceil(store.customerCapacity / 40)) }, (_, i) => ({
          id: `${store.id}_station_${i}`, itemName: 'ba:itemname_checkoutcounter', capacityPerHour: 30
        })),
        machines: [],
        todayCustomerCount: customers,
        todayItemSales: (this._orderHistory(store.id).slice(-1)[0]?.itemSales || []),
        hourReports: buildHourReports(store, customers).filter(report => report.hour <= hour),
        scheduleWeek: this._scheduleWeek(store, employees),
        revenueHistory: history.slice(-14),
        orderHistory: this._orderHistory(store.id).slice(),
        marketingCampaigns: [{ type: 'Billboard', enabled: true, agencyAddress: '15 Broadway' }],
        marketingExpensesPerDay: store.dailyMarketing,
        marketingEfficiency: 1,
        stolenItemsCost: 0,
        lastDeposit: 0,
        takenOver: false,
        creationDay: store.openDay,
        businessDescription: `${store.type} in ${store.district}.`,
        lastDayOnSale: 0
      });
    }
    return businesses;
  }

  _headquarters(day, hour, employees) {
    if (day < HQ_DEFINITION.openDay) return [];
    const manager = employees.find(employee => employee.workingLocation === HQ_DEFINITION.address);
    return [{
      id: `${HQ_DEFINITION.streetName}_${HQ_DEFINITION.streetNumber}`,
      name: HQ_DEFINITION.name,
      type: HQ_DEFINITION.type,
      rawType: HQ_DEFINITION.rawType,
      isHeadquarters: true,
      address: HQ_DEFINITION.address,
      streetName: HQ_DEFINITION.streetName,
      streetNumber: HQ_DEFINITION.streetNumber,
      district: HQ_DEFINITION.district,
      rawDistrict: HQ_DEFINITION.rawDistrict,
      dailyRevenue: 0,
      dailyProfit: -money(HQ_DEFINITION.rentPerDay + (manager?.wage || 0) * 8),
      weeklyRevenue: 0,
      weeklyProfit: -money((HQ_DEFINITION.rentPerDay + (manager?.wage || 0) * 8) * 7),
      weeklyRent: money(HQ_DEFINITION.rentPerDay * 7),
      customerSatisfaction: 92,
      isOpenNow: hour >= 9 && hour < 17,
      staffOnDuty: hour >= 9 && hour < 17 ? 1 : 0,
      openHoursPerWeek: 40,
      scheduledShiftHoursPerWeek: 35,
      cleanliness: 95,
      securityPct: 90,
      marketingCampaignsCount: 0,
      customerDemands: [],
      retailPrices: [],
      inventory: [],
      serviceStations: [],
      machines: [],
      scheduleWeek: WEEKDAYS.map(dayName => ({
        day: dayName, isOpen: true, openHours: 8, startHour: 9, endHour: 17, shiftHours: 8,
        shifts: [{ startHour: 9, endHour: 17, employeeId: manager?.id || '', employeeName: manager?.name || 'Manager', role: 'office', skillName: 'Human Resources', duration: 8, shiftType: 1 }]
      })),
      revenueHistory: [],
      orderHistory: [],
      creationDay: HQ_DEFINITION.openDay
    }];
  }

  _warehouseStock(day) {
    const draw = new Map();
    for (const store of STORE_DEFINITIONS.filter(s => day >= s.openDay)) {
      for (const product of store.products) {
        const previous = draw.get(product.rawId) || { name: itemDisplayName(product.rawId), daily: 0 };
        previous.daily += product.baseDailyUnits;
        draw.set(product.rawId, previous);
      }
    }
    // Factory inputs (Burger recipe) so the feed gauges have real on-hand stock.
    if (day >= WAREHOUSE_DEFINITION.factoryMachineDay) {
      const recipe = RECIPES_DATA.find(entry => entry.id === WAREHOUSE_DEFINITION.machine.selectedRecipeId);
      const machineHoursPerDay = 8;
      for (const ingredient of recipe?.ingredients || []) {
        const previous = draw.get(ingredient.raw_id) || { name: ingredient.name, daily: 0 };
        previous.daily += (ingredient.amount || 0) * machineHoursPerDay;
        draw.set(ingredient.raw_id, previous);
      }
    }
    const stock = [];
    let usedBoxes = 0;
    for (const [rawId, entry] of draw.entries()) {
      const rng = rngFor(`whstock:${WAREHOUSE_DEFINITION.id}:${rawId}:${day}`);
      const daysOfCover = rng() < 0.18 ? 0.4 + rng() * 1.4 : 3 + rng() * 6;
      const units = Math.max(1, Math.round(entry.daily * daysOfCover));
      const boxes = Math.max(1, Math.ceil(units / boxSizeFor(rawId)));
      usedBoxes += boxes;
      stock.push({
        itemName: entry.name, rawItemName: rawId, quantity: units, units, boxes,
        weeklyConsumption: money(entry.daily * 7), weeklyDeliveries: money(entry.daily * 7),
        daysLeft: money(entry.daily > 0 ? units / entry.daily : 0)
      });
    }
    // The warehouse produces Burger and exports a share of it to the harbor.
    if (day >= WAREHOUSE_DEFINITION.factoryMachineDay) {
      const outputRaw = 'ba:itemname_burger';
      const produced = 200 * 8; // one batch per production hour, eight staffed hours
      const previous = stock.find(item => item.rawItemName === outputRaw);
      const existing = previous ? previous.units : 0;
      const units = existing + produced;
      const boxes = Math.max(1, Math.ceil(units / boxSizeFor(outputRaw)));
      if (previous) {
        usedBoxes += boxes - previous.boxes;
        previous.quantity = units; previous.units = units; previous.boxes = boxes;
        previous.weeklyConsumption = money(units * 3); previous.daysLeft = 3;
      } else {
        usedBoxes += boxes;
        stock.push({
          itemName: itemDisplayName(outputRaw), rawItemName: outputRaw, quantity: units, units, boxes,
          weeklyConsumption: money(units * 3), weeklyDeliveries: money(units * 3), daysLeft: 3
        });
      }
    }
    // Size the rack capacity just above current holdings (10-45% headroom) so the pallet
    // gauges read like a real, well-used depot instead of a nearly empty one.
    const capacityRng = rngFor(`whcap:${day}`)();
    const capacityBoxes = Math.max(
      usedBoxes + 20,
      Math.round(usedBoxes * (1.1 + capacityRng * 0.35))
    );
    return { stock, usedBoxes, capacityBoxes };
  }

  _warehouseExports(day) {
    if (day < WAREHOUSE_DEFINITION.factoryMachineDay) return { orderHistory: [], factoryExports: [] };
    const rng = rngFor(`export:${day}`);
    const orderHistory = [];
    for (let d = Math.max(1, day - 14); d < day; d++) {
      const amount = 60 + Math.floor(rngFor(`exp:${d}`)() * 90);
      const unitPrice = marketUnitPrice('ba:itemname_burger');
      orderHistory.push({
        dayNumber: d,
        itemSales: [{
          itemName: itemDisplayName('ba:itemname_burger'), rawItemName: 'ba:itemname_burger',
          amountSold: amount, totalPrice: money(amount * unitPrice), totalWholesalePrice: money(amount * wholesaleUnitPrice('ba:itemname_burger'))
        }]
      });
    }
    const pendingAmount = 40 + Math.floor(rng() * 80);
    return {
      orderHistory,
      factoryExports: [{
        rawItemName: 'ba:itemname_burger', itemName: itemDisplayName('ba:itemname_burger'),
        amount: pendingAmount, totalPrice: money(pendingAmount * marketUnitPrice('ba:itemname_burger'))
      }]
    };
  }

  _marketEvents(day) {
    const events = HYPE_WINDOWS.map(wave => {
      const active = day >= wave.startDay && day < wave.startDay + wave.durationInDays;
      return {
        type: 'Hype', itemName: wave.rawItem, neighbourhood: wave.neighbourhood,
        startDay: wave.startDay, durationInDays: wave.durationInDays, demandImpact: wave.demandImpact,
        stopped: day >= wave.startDay + wave.durationInDays, isActive: active,
        businessTypeName: '', rivalName: ''
      };
    });
    events.push({
      type: 'ProductShortage', itemName: 'ba:itemname_sodacan', neighbourhood: 'ba:neighborhood_midtown',
      startDay: Math.max(1, day - 1), durationInDays: 4, demandImpact: 30, stopped: false, isActive: true,
      businessTypeName: '', rivalName: 'Rival Corp'
    });
    return events;
  }

  _productMarket(day) {
    const seen = new Set();
    for (const store of STORE_DEFINITIONS) {
      for (const product of store.products) seen.add(product.rawId);
    }
    const neighbourhoods = NEIGHBORHOODS_DATA.filter(h => !String(h.raw_id).includes('global'));
    return [...seen].map(rawId => {
      const rng = rngFor(`market:${rawId}`);
      return {
        itemName: rawId,
        importPriceIndex: money(0.6 + rng() * 0.7),
        demand: neighbourhoods.map(hood => {
          const hoodRng = rngFor(`demand:${rawId}:${hood.raw_id}`);
          return {
            neighborhood: hood.raw_id,
            demand: 25 + Math.floor(hoodRng() * 75),
            providers: Math.floor(hoodRng() * 5),
            lastDaySold: Math.max(1, day - Math.floor(hoodRng() * 40)),
            hasPlayerMonopoly: hoodRng() > 0.86
          };
        })
      };
    });
  }

  _rivals(day) {
    return ['rival_a', 'rival_b'].map(rivalId => {
      const rng = rngFor(`rival:${rivalId}`);
      const income = [];
      const businesses = [];
      let count = 4 + Math.floor(rng() * 4);
      for (let d = 1; d < day; d++) {
        if (d % 9 === 0) count = Math.max(1, count + (rng() < 0.55 ? 1 : -1));
        income.push({ day: d, income: money(30000 + Math.sin(d / 11) * 6000 + rng() * 5000) });
        businesses.push({ day: d, count });
      }
      return { rivalId, weeklyIncomeHistory: income, numberOfBusinessesHistory: businesses };
    });
  }

  _buildingsForSale(day) {
    const neighbourhoods = NEIGHBORHOODS_DATA.filter(h => !String(h.raw_id).includes('global'));
    return neighbourhoods.slice(0, 4).map((hood, index) => {
      const rng = rngFor(`sale:${hood.raw_id}:${day}`);
      const squareMeters = 180 + Math.floor(rng() * 520);
      const basePrice = hood.economic_factors?.base_building_price_sqm || 12000;
      const pricePerSqm = Math.round(basePrice * (0.9 + rng() * 0.25));
      return {
        address: `${8 + index * 7} ${hood.name} Way`,
        streetName: `${hood.name} Way`,
        streetNumber: 8 + index * 7,
        buildingPrice: money(squareMeters * pricePerSqm),
        squareMeters,
        acceptOfferRate: money(0.68 + rng() * 0.3),
        pricePerSqm,
        neighbourhood: hood.name,
        buildingType: index % 2 === 0 ? 'Retail Building' : 'Office Building'
      };
    });
  }

  _playerHistory(day) {
    const income = [];
    const businesses = [];
    for (let d = 1; d < day; d++) {
      const summary = this.financialSummaries.get(d);
      income.push({ day: d, income: summary ? summary.totalProfit : 0 });
      businesses.push({ day: d, count: STORE_DEFINITIONS.filter(store => d >= store.openDay).length });
    }
    return { income, businesses };
  }

  _deliveryContracts(day) {
    return STORE_DEFINITIONS.slice(0, 4).map((store, index) => ({
      enabled: true,
      isUrgentOrder: false,
      nextDeliveryDay: day + 1 + (index % 3),
      repeatingOrder: true,
      wholesaleAddress: `${30 + index} Broadway`,
      supplierName: ['City Wholesale', 'Metro Supply', 'Direct Goods', 'Harbor Traders'][index % 4],
      businessAddress: store.address,
      deliveryFee: 50 + index * 5,
      totalPricePerDelivery: money(store.products.reduce((sum, product) => sum + product.baseDailyUnits * wholesaleUnitPrice(product.rawId) * 7, 0)),
      items: store.products.map(product => ({
        itemName: itemDisplayName(product.rawId), rawItemName: product.rawId,
        amount: Math.round(product.baseDailyUnits * 7),
        amountOrderedThisWeek: Math.round(product.baseDailyUnits * 7),
        amountOrderedLastWeek: Math.round(product.baseDailyUnits * 6.6)
      }))
    }));
  }

  _logisticsPlans(day) {
    if (day < WAREHOUSE_DEFINITION.openDay) return [];
    const destinations = STORE_DEFINITIONS.filter(store => day >= store.openDay).map(store => ({
      deliveryTargetAddress: store.address,
      businessName: store.name,
      isExport: false,
      stockTargets: store.products.map(product => ({
        itemName: itemDisplayName(product.rawId),
        rawItemName: product.rawId,
        targetAmount: Math.max(20, Math.round(product.baseDailyUnits * 5))
      }))
    }));
    destinations.push({ deliveryTargetAddress: EXPORT_PARTNER.address, businessName: EXPORT_PARTNER.name, isExport: true, stockTargets: [] });
    return [{
      id: 'logistics_1',
      assignedEmployeeId: this._employees(day, 9).find(employee => employee.role === 'logistics')?.id || '',
      driverAssigned: true,
      isFactory: day >= WAREHOUSE_DEFINITION.factoryMachineDay,
      targetAddress: WAREHOUSE_DEFINITION.address,
      destinationsCount: destinations.length,
      maxDestinations: 12,
      destinations
    }];
  }

  _importPartnerships(day) {
    if (day < WAREHOUSE_DEFINITION.openDay) return [];
    // One order line per item, summed across every store the depot serves. Without this
    // the same item would appear once per store and duplicate the depot's order rows.
    const byItem = new Map();
    for (const store of STORE_DEFINITIONS.filter(s => day >= s.openDay)) {
      for (const product of store.products) {
        const existing = byItem.get(product.rawId) || {
          itemName: itemDisplayName(product.rawId), rawItemName: product.rawId, amount: 0,
          price: wholesaleUnitPrice(product.rawId)
        };
        existing.amount += Math.round(product.baseDailyUnits * 7);
        byItem.set(product.rawId, existing);
      }
    }
    const products = [...byItem.values()].map(entry => ({
      itemName: entry.itemName, rawItemName: entry.rawItemName,
      amount: entry.amount, amountOrderedThisWeek: entry.amount,
      assignedWarehouse: WAREHOUSE_DEFINITION.address, price: entry.price
    }));
    return [{
      id: 'import_1',
      headquartersAddress: HQ_DEFINITION.address,
      importAddress: '20 Maritime Way',
      supplierName: 'Hovgaard Imports',
      employeeInstanceId: this._employees(day, 9).find(employee => employee.role === 'logistics')?.id || '',
      nextDeliveryDay: day + 2,
      isRepeatingOrder: true,
      isActive: true,
      isUrgentOrder: false,
      nextDeliveryTotal: money(products.reduce((sum, product) => sum + product.amount * product.price, 0)),
      productsCount: products.length,
      products
    }];
  }

  _investments() {
    if (!this.investmentFund) return [];
    const fund = this.investmentFund;
    const low = Math.min(...fund.yearlyMarketChanges);
    const high = Math.max(...fund.yearlyMarketChanges);
    const average = fund.yearlyMarketChanges.reduce((sum, value) => sum + value, 0) / fund.yearlyMarketChanges.length;
    const risk = average < 4 ? 'low' : average < 7 ? 'medium' : 'high';
    return [{
      name: fund.name,
      initialDeposit: fund.initialDeposit,
      additionalInvestment: fund.additionalInvestment,
      withdrawal: fund.withdrawal,
      interestPayment: fund.interestPayment,
      isAutoInvesting: fund.isAutoInvesting,
      autoInvestment: fund.autoInvestment,
      currentValue: fund.currentValue,
      risk, low, high,
      yearlyMarketChanges: fund.yearlyMarketChanges,
      developmentHistory: fund.history.slice(-14)
    }];
  }

  _operationalAlerts(day, hour) {
    const alerts = [];
    const shirtStore = STORE_DEFINITIONS.find(store => store.id === 'biz_clothing');
    if (shirtStore && day >= shirtStore.openDay) {
      alerts.push({
        id: 'alert_amenities', type: 'satisfaction', severity: 'warning', location: shirtStore.name,
        message: 'Customers are missing a toilet and a sink. Add them to protect satisfaction.'
      });
    }
    const openStore = STORE_DEFINITIONS.find(store => this._isOpenAt(store, hour));
    if (openStore) {
      alerts.push({
        id: 'alert_staffing', type: 'unstaffed', severity: 'info', location: openStore.name,
        message: 'Check the schedule matrix to make sure every open hour is covered.'
      });
    }
    return alerts;
  }

  // -------------------------------------------------------------- telemetry snapshot

  generateTelemetrySnapshot(day = START_DAY, hour = 0, minute = 0) {
    this.runTo(day);
    const financial = this.financialSummaries.get(day) || {
      dayNumber: day, totalBusinessProfit: 0, totalRealEstate: 0, totalResidentialExpenses: 0,
      totalLoanExpenses: 0, parkingFees: 0, totalUnassignedStaffWages: 0, salaryIncome: 0,
      totalHealthInsuranceExpenses: 0, totalHeadhunterReplacementFees: 0, negativeInterestRates: 0, totalProfit: 0
    };
    const ledger = this.dailyLedgers.get(day) || { totalStoreSales: 0, periodDeductibles: 0 };
    const employees = this._employees(day, hour);
    const businesses = this._businesses(day, hour, employees);
    const headquarters = this._headquarters(day, hour, employees);
    const { stock, usedBoxes, capacityBoxes } = this._warehouseStock(day);
    const exports = this._warehouseExports(day);
    const activeLoans = this.loans.filter(loan => loan.active || loan.remainingAmount > 0);
    const totalLoanBalance = money(activeLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0));
    const playerHistory = this._playerHistory(day);

    const weeklyRevenueHistory = [];
    for (let d = Math.max(1, day - 7); d < day; d++) {
      const summary = this.financialSummaries.get(d);
      const dayLedger = this.dailyLedgers.get(d);
      weeklyRevenueHistory.push({
        dayNumber: d,
        revenue: dayLedger ? dayLedger.totalStoreSales : 0,
        profit: summary ? summary.totalBusinessProfit : 0
      });
    }
    const weeklyBusinessRevenue = money(weeklyRevenueHistory.reduce((sum, entry) => sum + entry.revenue, 0));
    const weeklyBusinessProfit = money(weeklyRevenueHistory.reduce((sum, entry) => sum + entry.profit, 0));
    const weeklyResidentialExpenses = money(this._residenceRent() * 7);

    return {
      isConnected: true,
      modVersion: MOD_VERSION,
      lastHeartbeat: new Date().toISOString(),
      gameDay: day,
      gameHour: hour,
      gameMinute: minute,
      playerCash: this.midnightBankBalances[day] ?? this.playerCash,
      bankBalance: this.midnightBankBalances[day] ?? this.playerCash,
      totalLoans: totalLoanBalance,
      netWorth: money((this.midnightBankBalances[day] ?? this.playerCash) - totalLoanBalance),
      playerHappiness: 84,
      playerEnergy: 95,
      playerHunger: 85,
      playerStreetName: this.currentResidence ? this.currentResidence.streetName : '5th Avenue',
      playerStreetNumber: this.currentResidence ? this.currentResidence.streetNumber : 4,
      activeVehicleId: 'veh_0',
      numberOfDoctorOperations: 0,
      currentBackTaxes: 0,
      gamblingWinnings: 0,
      gamblingLosses: 0,
      hasCinemaTheaterTicket: false,
      energyGeneratedFromConsumables: 0,
      currentActivityHappinessPerHour: 0,
      midnightBankBalances: this.midnightBankBalances.slice(1, day + 1),

      dailyRevenueTotal: money(ledger.totalStoreSales),
      dailyExpensesTotal: money(ledger.totalExpenses),
      dailyBusinessRevenue: money(ledger.totalStoreSales),
      dailyResidentialRevenue: 0,

      weeklyRevenueTotal: weeklyBusinessRevenue,
      weeklyExpensesTotal: money(weeklyBusinessRevenue - weeklyBusinessProfit + weeklyResidentialExpenses),
      weeklyBusinessRevenue,
      weeklyBusinessProfit,
      weeklyResidentialRevenue: 0,
      weeklyResidentialExpenses,
      weeklyResidentialNet: money(-weeklyResidentialExpenses),

      totalEmployees: employees.length,
      totalHourlyPayroll: money(employees.reduce((sum, employee) => sum + employee.wage, 0)),
      weeklyPayrollTotal: money(employees.reduce((sum, employee) => sum + (employee.weeklyWages || 0), 0)),
      taxDeductibleExpenses: this.taxPeriodDeductibles,
      unpaidTaxes: this.currentUnpaidTaxes,

      weeklyRevenueHistory,
      businesses,
      headquarters,
      residences: this.currentResidence ? [this.currentResidence] : [],
      ownedRealEstate: [],
      emptyLeasedSpaces: [],
      warehouses: day >= WAREHOUSE_DEFINITION.openDay ? [{
        id: `${WAREHOUSE_DEFINITION.streetName}_${WAREHOUSE_DEFINITION.streetNumber}`,
        name: WAREHOUSE_DEFINITION.name,
        address: WAREHOUSE_DEFINITION.address,
        type: WAREHOUSE_DEFINITION.type,
        sqm: WAREHOUSE_DEFINITION.sqm,
        storageCapacityBoxes: capacityBoxes,
        storageUsedBoxes: usedBoxes,
        rentPerDay: WAREHOUSE_DEFINITION.rentPerDay,
        rentPerWeek: money(WAREHOUSE_DEFINITION.rentPerDay * 7),
        assignedVehicles: 1,
        stock,
        machines: day >= WAREHOUSE_DEFINITION.factoryMachineDay ? [WAREHOUSE_DEFINITION.machine] : [],
        scheduleWeek: day >= WAREHOUSE_DEFINITION.factoryMachineDay
          ? WEEKDAYS.map(dayName => ({
              day: dayName, isOpen: true, openHours: 24, startHour: 0, endHour: 24, shiftHours: 8,
              shifts: [{
                startHour: 8, endHour: 16,
                employeeId: employees.find(employee => employee.role === 'factory')?.id || '',
                employeeName: employees.find(employee => employee.role === 'factory')?.name || 'Factory Staff',
                role: 'factory', skillName: 'Product Manufacturing', duration: 8,
                itemInstanceId: WAREHOUSE_DEFINITION.machine.id, shiftType: 1
              }]
            }))
          : [],
        orderHistory: exports.orderHistory,
        factoryExports: exports.factoryExports
      }] : [],
      employees,
      loans: activeLoans.map(loan => ({
        totalAmount: loan.totalAmount, remainingAmount: loan.remainingAmount,
        dailyPayment: loan.dailyPayment, weeklyPayment: loan.weeklyPayment,
        dailyInterest: loan.dailyInterest, bankAddress: loan.bankAddress, paidAmount: loan.paidAmount
      })),
      operationalAlerts: this._operationalAlerts(day, hour),

      gameVariables: {
        difficulty: 'Normal', taxPercentage: 10, daysPerYear: DAYS_PER_YEAR,
        marketPriceMultiplier: 1.0, employeeHourlySalaryMultiplier: 1.0, bankInterestMultiplier: 1.0,
        rivalsDifficultyMultiplier: 1.0, disableVehicleDamage: false, disableVehicleFuel: false, startingMoney: 4200
      },
      achievements: {
        totalGasCost: 420, totalRepairCost: 0, taxesPaid: this.taxesPaid, totalInteriorDesignerCost: 0,
        totalCasinoWin: 0, taxiRides: 3, hospitalization: 0, parkingTickets: this.parkingTickets,
        casinoBoatVisits: 0, doctorsAppointments: 0, goodsProducedInFactories: this.goodsProduced,
        privateDriverRides: 0, golfHighScore: 0, tennisMatchesWon: 0, golfCartHit: false, destroyedSandCastle: false
      },
      financialTotals: {
        dayNumber: financial.dayNumber,
        totalBusinessProfit: financial.totalBusinessProfit,
        totalLoanExpenses: financial.totalLoanExpenses,
        totalHealthInsuranceExpenses: financial.totalHealthInsuranceExpenses,
        totalHeadhunterReplacementFees: financial.totalHeadhunterReplacementFees,
        totalRealEstate: financial.totalRealEstate,
        negativeInterestRates: financial.negativeInterestRates,
        parkingFees: financial.parkingFees,
        salaryIncome: financial.salaryIncome,
        totalResidentialExpenses: financial.totalResidentialExpenses,
        totalUnassignedStaffWages: financial.totalUnassignedStaffWages,
        totalProfit: financial.totalProfit
      },
      vehicles: this._vehicles(day),
      boats: [],
      investments: this._investments(),
      rivals: this._rivals(day),
      specialRivals: [{ rivalId: 'rival_special', isActive: true, isDefeated: false, completedTimelineEntries: 2 }],
      marketEvents: this._marketEvents(day),
      productMarket: this._productMarket(day),
      buildingsForSale: this._buildingsForSale(day),
      candidateEmployees: [],
      recruitmentCampaigns: [],
      deliveryContracts: this._deliveryContracts(day),
      furnitureDeliveryContracts: [],
      foodDeliveryContracts: [],
      vehicleDeliveryContracts: [],
      movingServiceContracts: [],
      interiorInstallationContracts: [],
      importPartnerships: this._importPartnerships(day),
      diplomas: [
        { name: 'Basic Management', minutesStudied: 1200, completed: day >= 32 },
        { name: 'Product Manufacturing', minutesStudied: 900, completed: day >= 58 },
        { name: 'Fundamentals of Business Administration', minutesStudied: day >= 58 ? 400 : 0, completed: false }
      ],
      todoTasks: [],
      jobInstances: [],
      logisticsPlans: this._logisticsPlans(day),
      headhunterPlans: [],
      hrPlans: day >= HQ_DEFINITION.openDay ? [{
        id: 'hr_1',
        assignedEmployeeId: employees.find(employee => employee.primarySkillName === 'Human Resources')?.id || '',
        assignedEmployeesCount: employees.length,
        replaceAbsentEmployees: true,
        trainingTarget: 80,
        hasHealthInsurance: true
      }] : [],
      pricingPlans: day >= HQ_DEFINITION.openDay ? [{
        id: 'pp_1',
        assignedEmployeeId: employees.find(employee => employee.role === 'office')?.id || '',
        supervisedNeighborhood: 'ba:neighborhood_midtown',
        manuallyPricedItemsCount: 4,
        nextUpdateDay: day + 2,
        nextUpdateHour: 9
      }] : [],
      contacts: [
        { category: 'Finance', unreadMessages: this.currentUnpaidTaxes > 0 ? 1 : 0 },
        { category: 'Suppliers', unreadMessages: 2 },
        { category: 'Staff', unreadMessages: 0 },
        { category: 'Uncle Fred', unreadMessages: 1 }
      ],
      healthInsuranceOffers: [],
      salaryNegotiations: [],
      happinessModifiers: [
        { type: 'ba:happinessmodifier_restaurant', hoursLeft: 6, hideDuration: false },
        { type: 'ba:happinessmodifier_gym', hoursLeft: 3, hideDuration: false }
      ],
      neighbourhoodStats: NEIGHBORHOODS_DATA.filter(h => !String(h.raw_id).includes('global')).map(hood => ({
        name: hood.name,
        nextNewBusinessDay: day + 6,
        nextResidentialSwapDay: day + 12,
        nextWarehouseSwapDay: day + 18,
        nextForceShutdownDay: day + 24
      })),
      playerIncomeHistory: playerHistory.income,
      playerBusinessCountHistory: playerHistory.businesses,
      foodDeliveryOffers: []
    };
  }

  _vehicles(day) {
    const home = this.currentResidence;
    const vehicles = [{
      id: 'veh_0',
      vehicleType: 'ba:vehicletype_honzamimic',
      fuel: 78, maxFuel: 100, damage: 0, dirtiness: 12,
      isWarehouseAssigned: false, parkingState: 'Parked',
      parkingNeighbourhood: home ? home.district : 'Midtown',
      unpaidParkingAmount: 0, parkingTickets: this.parkingTickets,
      streetName: home ? home.streetName : '5th Avenue',
      streetNumber: home ? home.streetNumber : 4,
      cargo: [], repairCost: 0, sellingPrice: 6200
    }];
    if (day >= WAREHOUSE_DEFINITION.openDay) {
      vehicles.push({
        id: 'veh_1', vehicleType: 'ba:vehicletype_deliverytruck',
        fuel: 72, maxFuel: 100, damage: 2, dirtiness: 18,
        isWarehouseAssigned: true, parkingState: 'Parked',
        parkingNeighbourhood: WAREHOUSE_DEFINITION.district,
        unpaidParkingAmount: 0, parkingTickets: 0,
        streetName: WAREHOUSE_DEFINITION.streetName, streetNumber: WAREHOUSE_DEFINITION.streetNumber,
        cargo: [{ itemName: itemDisplayName('ba:itemname_burger'), rawItemName: 'ba:itemname_burger', amount: 80 }],
        repairCost: 0, sellingPrice: 13500
      });
    }
    return vehicles;
  }
}

function buildHourReports(store, customers) {
  const open = [];
  for (let hour = 0; hour < 24; hour++) open.push(hour >= store.openStartHour && hour < store.openEndHour ? 1 : 0);
  const weightSum = open.reduce((sum, value) => sum + value, 0) || 1;
  const reports = [];
  for (let hour = 0; hour < 24; hour++) {
    const shape = open[hour] * (hour >= 12 && hour <= 14 ? 1.5 : hour >= 17 && hour <= 19 ? 1.4 : 1);
    const noise = 0.75 + 0.5 * rngFor(`${store.id}:h${hour}`)();
    reports.push({ hour, customers: Math.max(0, Math.round((customers * shape * noise) / weightSum)) });
  }
  return reports;
}

// ---------------------------------------------------------------- bounded demo clock

// The clock is fully deterministic: it advances only from world.offsetGameMinutes, which
// the mock server moves in fixed steps. It cycles Day 95..Day 100 and never reads wall
// time, so the demo cannot drift or jump.
export function currentClock(worldOrSim = {}, _nowMs) {
  const offset = Number(worldOrSim.offsetGameMinutes || 0);
  const cycleMinutes = DEMO_DAYS * 1440;
  const cycled = ((offset % cycleMinutes) + cycleMinutes) % cycleMinutes;
  const dayOffset = Math.floor(cycled / 1440);
  const dayMinutes = cycled % 1440;
  return {
    gameDay: START_DAY + dayOffset,
    gameHour: Math.floor(dayMinutes / 60),
    gameMinute: Math.floor(dayMinutes % 60)
  };
}

// ---------------------------------------------------------------- facade

let sharedSimulation = null;

export function getSharedSimulation() {
  if (!sharedSimulation) sharedSimulation = new BigAmbitionsSimulation();
  return sharedSimulation;
}

export function buildWorld() {
  const sim = getSharedSimulation();
  const snapshot = sim.generateTelemetrySnapshot(START_DAY, 0, 0);
  return {
    sim,
    startReal: Date.now(),
    offsetGameMinutes: 0,
    stores: STORE_DEFINITIONS,
    support: [],
    warehouses: [WAREHOUSE_DEFINITION],
    hq: HQ_DEFINITION,
    employees: snapshot.employees
  };
}

export function snapshot(worldOrSim, nowMs) {
  const sim = worldOrSim?.sim || (worldOrSim instanceof BigAmbitionsSimulation ? worldOrSim : getSharedSimulation());
  const clock = currentClock(worldOrSim || {}, nowMs);
  return sim.generateTelemetrySnapshot(clock.gameDay, clock.gameHour, clock.gameMinute);
}
