// Deterministic, large, live Big Ambitions telemetry generator for local UI testing.
//
// It reads the real compendium data in web/src/data so names, business types and
// products are authentic, then produces exactly the JSON shape the companion mod
// serves on http://127.0.0.1:8765/. Nothing here touches the game or a save file.
//
// The world is fixed once (stores, staff, supply chain, market) and only the in-game
// clock advances. Everything that depends on the day is derived from a deterministic
// per-store sales model, so two runs with the same start look identical, and the
// history and today's trading build up live as the clock moves.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(HERE, '..', '..', 'src', 'data');

function readJson(name) {
  const raw = fs.readFileSync(path.join(DATA_DIR, name), 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw);
}

const BUSINESSES = readJson('businesses.json');
const NEIGHBORHOODS = readJson('neighborhoods.json');
const bizByRaw = new Map(BUSINESSES.map(b => [b.raw_id, b]));

// ---------------------------------------------------------------- randomness

function hashString(text) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rngFor(seed) {
  let a = hashString(seed);
  return function next() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = (rng, list) => list[Math.floor(rng() * list.length) % list.length];
const round = (n) => Math.round(n);
const money = (n) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------- world shape

export const START_DAY = 96;
// A game year is 60 days by default. The IRS bills at each year end and the bill is
// paid a few days later, inside the game's 20-day grace window (TaxHelper).
const DAYS_PER_YEAR = 60;
const TAX_RATE = 0.1;
const TAX_PAYMENT_DELAY = 14;
const DOW = [0.86, 0.86, 0.9, 0.96, 1.06, 1.26, 1.14]; // Mon..Sun
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
// Share of revenue that goes to wages and to the other overhead the game bundles into
// TotalOngoing (marketing, licensing, theft). Kept in one place so every figure agrees.
const SALARY_SHARE = 0.12;
const OTHER_OVERHEAD_SHARE = 0.05;
const OVERHEAD_SHARE = SALARY_SHARE + OTHER_OVERHEAD_SHARE;

const HOODS = NEIGHBORHOODS
  .filter(n => !String(n.raw_id).includes('global'))
  .map(n => ({
    raw: n.raw_id,
    name: n.name,
    mult: 0.7 + (n.economic_factors?.real_estate_multiplier ?? 0.6) * 0.6,
    demand: n.demographics || {}
  }));

const STREETS = [
  '5th Avenue', 'Madison Avenue', 'Lexington Avenue', 'Park Avenue', 'Broadway',
  'Wall Street', '34th Street', '42nd Street', '11th Avenue', 'Ocean Drive',
  'Maritime Way', 'Harbor Boulevard', 'Canal Street', 'Bleecker Street', '1st Street'
];

// Business types that have a real product range, with a plausible trading scale.
const STORE_TYPES = [
  { raw: 'ba:businesstype_supermarket', name: 'Supermarket', brand: ['Ambition Mart', 'Green Basket', 'Corner Fresh'], base: 16500, margin: 0.24, capacity: 75, staff: 9 },
  { raw: 'ba:businesstype_electronicsstore', name: 'Electronics Store', brand: ['Volt', 'Circuit City', 'Plugged'], base: 12000, margin: 0.21, capacity: 75, staff: 6 },
  { raw: 'ba:businesstype_jewelrystore', name: 'Jewelry Store', brand: ['Crown & Carat', 'Aurum', 'Precious'], base: 9500, margin: 0.42, capacity: 30, staff: 4 },
  { raw: 'ba:businesstype_clothingstore', name: 'Clothing Store', brand: ['Thread', 'Urban Fit', 'Wardrobe'], base: 7200, margin: 0.38, capacity: 50, staff: 5 },
  { raw: 'ba:businesstype_nightclub', name: 'Nightclub', brand: ['Neon', 'Pulse', 'After Dark'], base: 8200, margin: 0.34, capacity: 100, staff: 7 },
  { raw: 'ba:businesstype_liquorstore', name: 'Liquor Store', brand: ['Barrel', 'Spirits', 'Reserve'], base: 6200, margin: 0.30, capacity: 50, staff: 4 },
  { raw: 'ba:businesstype_fastfoodrestaurant', name: 'Fast Food Restaurant', brand: ['Burger Haven', 'Quick Bite', 'Grill Stop'], base: 5400, margin: 0.28, capacity: 50, staff: 6 },
  { raw: 'ba:businesstype_bookstore', name: 'Bookstore', brand: ['Chapter', 'Inkwell', 'Paperbound'], base: 3600, margin: 0.33, capacity: 30, staff: 3 },
  { raw: 'ba:businesstype_coffeeshop', name: 'Coffee Shop', brand: ['Daily Grind', 'Bean', 'Roast'], base: 3100, margin: 0.35, capacity: 30, staff: 4 },
  { raw: 'ba:businesstype_fruitandvegetablestore', name: 'Fruit And Vegetable Store', brand: ['Orchard', 'Fresh Picks', 'Harvest'], base: 2800, margin: 0.27, capacity: 30, staff: 3 },
  { raw: 'ba:businesstype_giftshop', name: 'Gift Shop', brand: ['Curio', 'Wrap', 'Trinket'], base: 2400, margin: 0.40, capacity: 30, staff: 3 },
  { raw: 'ba:businesstype_florist', name: 'Florist', brand: ['Petal', 'Bloom', 'Stem'], base: 2100, margin: 0.37, capacity: 30, staff: 3 },
  { raw: 'ba:businesstype_cinema', name: 'Cinema', brand: ['Grand Screen', 'Starlight'], base: 7400, margin: 0.31, capacity: 100, staff: 8 },
  { raw: 'ba:businesstype_gym', name: 'Gym', brand: ['Iron', 'Rep', 'Lift'], base: 2600, margin: 0.30, capacity: 50, staff: 3 },
];

const FIRST_NAMES = ['Alex', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Taylor', 'Jamie', 'Avery', 'Quinn', 'Rowan', 'Sasha', 'Devin', 'Nadia', 'Omar', 'Priya', 'Lena', 'Marco', 'Nina', 'Theo', 'Vera'];
const LAST_NAMES = ['Vance', 'Reyes', 'Brooks', 'Nolan', 'Hale', 'Frost', 'Sato', 'Khan', 'Moreau', 'Rios', 'Bailey', 'Dunn', 'Kerr', 'Lund', 'Pace', 'Quinn'];
const SKILLS = ['Customer Service', 'Cleaning', 'Security', 'Delivery Driver', 'Purchasing Agent', 'Cashier', 'Marketing', 'Accounting'];

function personName(rng) {
  return `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
}

function storeProducts(typeRaw, limit = 8) {
  const def = bizByRaw.get(typeRaw);
  const primary = (def?.products || []).filter(p => p.is_primary !== false && p.default_market_price > 0);
  return primary.slice(0, limit).map(p => ({
    id: p.id,
    rawItemName: `ba:itemname_${p.id}`,
    itemName: p.name,
    wholesale: p.wholesale_price || Math.max(0.5, p.default_market_price * 0.55),
    market: p.default_market_price,
    weight: Math.max(0.25, p.impact ?? 1)
  }));
}

// Which customer demands a site currently fulfils. Most sites meet every demanded
// amenity; roughly a third are missing one, so the checklist has something to show.
function fulfilledDemands(site) {
  const required = (bizByRaw.get(site.rawType)?.customer_demand_sets || []).map(d => d.type);
  if (required.length === 0) return [];
  if (hashString(`demands:${site.id}`) % 3 !== 0) return required.slice();
  const missIndex = hashString(`demandsmiss:${site.id}`) % required.length;
  return required.filter((_, i) => i !== missIndex);
}

// ---------------------------------------------------------------- investments
//
// A spread of funds so the Investment Funds dashboard has something to show:
// low/medium/high risk, winners and losers, auto-invest on and off, and a 14-day
// balance history with real day-to-day noise (not a straight line). Everything is
// deterministic so two runs of the same day look identical.

const FUND_PROFILES = [
  { name: 'Index Fund', initial: 200000, additional: 0, withdrawal: 0, interest: 46000, auto: true, autoAmount: 5000, yearly: [8, 6, 0, 9, 7, 5, 1, 6] },
  { name: 'Government Bonds', initial: 100000, additional: 25000, withdrawal: 10000, interest: 7000, auto: false, autoAmount: 0, yearly: [3, 4, 2, 3, 4, 3, 2, 3] },
  { name: 'Tech Growth Fund', initial: 150000, additional: 60000, withdrawal: 0, interest: 84000, auto: true, autoAmount: 9000, yearly: [28, -22, 35, 18, -14, 40, 12, -9] },
  { name: 'Energy & Resources', initial: 130000, additional: 0, withdrawal: 40000, interest: -21000, auto: false, autoAmount: 0, yearly: [16, -20, 9, -12, 22, -18, 7, -6] },
  { name: 'Real Estate Trust', initial: 180000, additional: 0, withdrawal: 0, interest: 23000, auto: true, autoAmount: 3000, yearly: [7, 5, -2, 8, 6, 4, 0, 5] },
  { name: 'Emerging Markets', initial: 80000, additional: 20000, withdrawal: 0, interest: -7000, auto: false, autoAmount: 0, yearly: [15, -11, 6, -8, 13, -5, 4, -3] }
];

// Risk tier mirrors InvestmentFundHelper.DetermineRisk: the spread of the yearly
// cycle (>10 high, >6 medium, else low).
function fundRisk(yearly) {
  const spread = Math.max(...yearly) - Math.min(...yearly);
  return spread > 10 ? 'high' : spread > 6 ? 'medium' : 'low';
}

// Build 14 days of balance ending exactly on CurrentValue, with a daily drift that
// follows the fund's lifetime interest plus deterministic noise.
function buildFundHistory(name, currentValue, interest, gameDay) {
  const rng = rngFor(`fund:${name}`);
  const days = 14;
  const drift = interest / 130;
  const vol = Math.max(Math.abs(currentValue) * 0.006, Math.abs(drift) * 1.4);
  const changes = Array.from({ length: days }, () => money(drift + (rng() - 0.5) * 2 * vol));
  const start = currentValue - changes.reduce((a, c) => a + c, 0);
  let balance = start;
  return changes.map((change, i) => {
    balance += change;
    return { day: gameDay - (days - 1 - i), change, newBalance: money(balance) };
  });
}

function buildInvestmentFunds(gameDay) {
  return FUND_PROFILES.map(p => {
    const net = p.initial + p.additional - p.withdrawal;
    const currentValue = money(net + Math.round(p.interest));
    return {
      name: p.name,
      initialDeposit: p.initial,
      additionalInvestment: p.additional,
      withdrawal: p.withdrawal,
      interestPayment: Math.round(p.interest),
      isAutoInvesting: p.auto,
      autoInvestment: p.autoAmount,
      currentValue,
      risk: fundRisk(p.yearly),
      low: Math.min(...p.yearly),
      high: Math.max(...p.yearly),
      yearlyMarketChanges: p.yearly,
      developmentHistory: buildFundHistory(p.name, currentValue, p.interest, gameDay)
    };
  });
}


// ---------------------------------------------------------------- world build

export function buildWorld() {
  const stores = [];
  const usedAddresses = new Set();
  let streetIdx = 0;
  let numCounter = 3;

  function nextAddress(rng) {
    for (let attempt = 0; attempt < 50; attempt++) {
      const street = STREETS[streetIdx++ % STREETS.length];
      const number = (numCounter += 1 + Math.floor(rng() * 9));
      const address = `${number} ${street}`;
      if (!usedAddresses.has(address)) {
        usedAddresses.add(address);
        return { address, streetName: street, streetNumber: number };
      }
    }
    const address = `${numCounter += 1} Unnamed Way`;
    usedAddresses.add(address);
    return { address, streetName: 'Unnamed Way', streetNumber: numCounter };
  }

  let storeSeq = 0;
  STORE_TYPES.forEach((type, typeIdx) => {
    const count = typeIdx < 4 ? 3 : 2; // the big types get a third site
    for (let i = 0; i < count; i++) {
      const rng = rngFor(`store:${type.raw}:${i}`);
      const hood = HOODS[(typeIdx + i) % HOODS.length];
      const products = storeProducts(type.raw);
      if (products.length === 0) continue;
      const { address, streetName, streetNumber } = nextAddress(rng);
      const brand = pick(rng, type.brand);
      const scale = 0.7 + rng() * 0.7;
      const openedDay = 1 + Math.floor(rng() * (START_DAY - 12));
      const dow = DOW.map(v => money(v * (0.92 + rng() * 0.16)));
      const openStart = 8 + Math.floor(rng() * 2);
      const openEnd = 20 + Math.floor(rng() * 4);
      stores.push({
        id: `biz_${type.raw.replace('ba:businesstype_', '')}_${hood.raw.replace('ba:neighborhood_', '')}_${i}`,
        seq: storeSeq++,
        name: `${brand} ${hood.name}`,
        type: type.name,
        rawType: type.raw,
        ...{ address, streetName, streetNumber },
        district: hood.name,
        rawDistrict: hood.raw,
        hoodMult: hood.mult,
        baseRevenue: type.base * scale,
        margin: type.margin,
        capacity: type.capacity,
        staffCount: type.staff,
        products,
        dow,
        openStart,
        openEnd,
        openedDay,
        rentPerDay: money(type.base * scale * 0.035),
        createdDay: openedDay
      });
    }
  });

  // Support sites: two factories, one headquarters, three warehouses.
  const support = [];
  const factoryDefs = [
    { name: 'Factory - Food', raw: 'ba:businesstype_factory', district: 'Industry City' },
    { name: 'Factory - Electronics', raw: 'ba:businesstype_factory', district: 'Industry City' }
  ];
  // [workstationType, recipeId, machineCount] against the real compendium recipes.
  const factoryRecipes = [
    [
      ['foodworkstation', 'sicETTel+UWhOqmjeOsvg==', 3], // Burger
      ['foodworkstation', 'Rvh1C8xMXESQqWKUQSCWOQ==', 2], // Cupcake
      ['foodworkstation', 'vgwf6RZdUkW9MLRrCJ2hkA==', 2] // Donut
    ],
    [
      ['consumergoodsworkstation', 'IQ4tC7CP9k+Wopyn0nbSA==', 3], // Noize Boss Earbuds
      ['consumergoodsworkstation', 'spcAv9c2SU2D88vyBHT0iA==', 2] // Cigar
    ]
  ];
  factoryDefs.forEach((f, i) => {
    const rng = rngFor(`factory:${i}`);
    const { address, streetName, streetNumber } = nextAddress(rng);
    const machines = [];
    (factoryRecipes[i] || []).forEach(([workstationType, selectedRecipeId, count]) => {
      for (let m = 0; m < count; m++) {
        machines.push({
          id: `biz_factory_${i}_machine_${machines.length}`,
          workstationType,
          selectedRecipeId,
          priority: machines.length,
          produceUpTo: false,
          produceUpToValue: 0,
          isValid: true,
          stackedMachines: []
        });
      }
    });
    support.push({
      id: `biz_factory_${i}`,
      name: f.name,
      type: 'Factory',
      rawType: f.raw,
      address, streetName, streetNumber,
      district: f.district,
      rawDistrict: HOODS.find(h => h.name === f.district)?.raw || 'ba:neighborhood_industrycity',
      hoodMult: 1,
      baseRevenue: 4000 + i * 1500,
      margin: -0.35,
      capacity: 0,
      staffCount: 10,
      products: [],
      machines,
      dow: DOW.slice(),
      openStart: 0,
      openEnd: 24,
      openedDay: 8,
      rentPerDay: 1200,
      createdDay: 8,
      isSupport: true
    });
  });

  const hq = {
    id: 'biz_hq', name: 'Headquarters', type: 'Headquarters', rawType: 'ba:businesstype_headquarters',
    address: '1 Madison Avenue', streetName: 'Madison Avenue', streetNumber: 1, district: 'Midtown',
    rawDistrict: 'ba:neighborhood_midtown', isHeadquarters: true, baseRevenue: 0, margin: 0, capacity: 0,
    hoodMult: 1,
    staffCount: 6, products: [], dow: DOW.slice(), openStart: 9, openEnd: 18, openedDay: 3, rentPerDay: 900,
    createdDay: 3, isSupport: true
  };

  const warehouses = [];
  for (let i = 0; i < 3; i++) {
    const rng = rngFor(`wh:${i}`);
    const { address, streetName, streetNumber } = nextAddress(rng);
    // The first warehouse hosts player-set factory lines, mirroring real saves where
    // production lives inside a warehouse rather than a standalone factory business.
    const machines = i === 0
      ? [
          { id: 'wh_0_machine_0', workstationType: 'foodworkstation', selectedRecipeId: 'sicETTel+UWhOqmjeOsvg==', priority: 0, produceUpTo: false, produceUpToValue: 0, isValid: true, stackedMachines: [] },
          { id: 'wh_0_machine_1', workstationType: 'foodworkstation', selectedRecipeId: 'sicETTel+UWhOqmjeOsvg==', priority: 1, produceUpTo: false, produceUpToValue: 0, isValid: true, stackedMachines: [] },
          { id: 'wh_0_machine_2', workstationType: 'foodworkstation', selectedRecipeId: 'vgwf6RZdUkW9MLRrCJ2hkA==', priority: 2, produceUpTo: false, produceUpToValue: 0, isValid: true, stackedMachines: [] }
        ]
      : [];
    const scheduleWeek = i === 0
      ? WEEKDAYS.map(day => ({
          day,
          shifts: machines.map(m => ({
            startHour: 8, endHour: 20,
            employeeId: 'wh_0_worker', itemInstanceId: m.id, shiftType: 1
          }))
        }))
      : [];
    warehouses.push({
      id: `wh_${i}`,
      name: ['Central Factory', 'Harbor Warehouse', 'Midtown Storage'][i % 3],
      address, streetName, streetNumber,
      district: HOODS[(i + 2) % HOODS.length].name,
      type: 'Warehouse',
      rentPerDay: 650 + i * 120,
      rentPerWeek: (650 + i * 120) * 7,
      assignedVehicles: 2 + i,
      sqm: 600 + i * 200,
      storageCapacityBoxes: 800 + i * 250,
      machines,
      scheduleWeek
    });
  }

  // Staff: several per store plus warehouse drivers and head-office roles.
  const employees = [];
  let empSeq = 0;
  const allSites = [...stores, ...support, hq];
  allSites.forEach(site => {
    for (let i = 0; i < site.staffCount; i++) {
      const rng = rngFor(`emp:${site.id}:${i}`);
      const skill = site.rawType === 'ba:businesstype_factory'
        ? pick(rng, ['Manufacturing', 'Logistics', 'Cleaning'])
        : pick(rng, SKILLS);
      const hours = pick(rng, [20, 30, 40, 40, 40, 50]);
      const wage = 14 + Math.floor(rng() * 20);
      employees.push({
        id: `emp_${empSeq++}`,
        name: personName(rng),
        wage,
        weeklyWages: wage * hours,
        satisfaction: 60 + Math.floor(rng() * 40),
        primarySkillName: skill,
        skillLevel: 40 + Math.floor(rng() * 60),
        workingLocation: site.name,
        weeklyHours: hours,
        workedHoursToday: Math.min(hours / 5, 8),
        workedHoursThisWeek: hours,
        workedDays: 1 + Math.floor(rng() * 5),
        ageYears: 21 + Math.floor(rng() * 30),
        gender: rng() > 0.5 ? 'Male' : 'Female',
        isAbsent: rng() > 0.92,
        isComplaining: rng() > 0.85,
        isTraining: false,
        isBeingReplaced: false,
        poached: false,
        nextSickDay: 0,
        bonusAmount: 0,
        daysHired: 5 + Math.floor(rng() * 40),
        demands: [],
        hrManager: 'Head Office',
        healthInsurance: pick(rng, ['None', 'Bronze Health Insurance', 'Silver Health Insurance', 'Gold Health Insurance'])
      });
    }
  });

  // Supply chain: each store is fed by one warehouse; each warehouse imports.
  // Per-warehouse weekly draw per item, measured the way the game measures it (the
  // stores it feeds). Used for both the import order sizes and the stock levels, so
  // orders and holdings are consistent.
  const servedByWarehouse = warehouses.map((_wh, i) => stores.filter((_s, idx) => idx % warehouses.length === i));
  const consumptionByWarehouse = servedByWarehouse.map(served => {
    const byItem = new Map();
    served.forEach(store => {
      const totalWeight = store.products.reduce((a, q) => a + q.weight, 0) || 1;
      store.products.forEach(p => {
        const daily = (p.weight / totalWeight) * (store.baseRevenue / p.market);
        const prev = byItem.get(p.rawItemName) || { itemName: p.itemName, rawItemName: p.rawItemName, daily: 0 };
        prev.daily += daily;
        byItem.set(p.rawItemName, prev);
      });
    });
    return byItem;
  });

  const logisticsPlans = warehouses.map((wh, i) => {
    const served = stores.filter((_s, idx) => idx % warehouses.length === i);
    return {
      id: `plan_${i}`,
      assignedEmployeeId: employees.find(e => e.workingLocation === wh.address)?.id || `emp_${i}`,
      driverAssigned: true,
      isFactory: false,
      targetAddress: wh.address,
      destinationsCount: served.length,
      maxDestinations: 12,
      destinations: served.map(store => ({
        deliveryTargetAddress: store.address,
        businessName: store.name,
        stockTargets: store.products.map(p => ({
          itemName: p.itemName,
          rawItemName: p.rawItemName,
          targetAmount: Math.max(20, Math.round(p.market > 0 ? 300 + (p.weight * 200) : 200))
        }))
      }))
    };
  });

  const importPartnerships = warehouses.map((wh, i) => ({
    id: `import_${i}`,
    headquartersAddress: hq.address,
    importAddress: `${20 + i} Maritime Way`,
    supplierName: pick(rngFor(`sup:${i}`), ['Hovgaard Imports', 'Atlantic Supply', 'Pier 12 Trading']),
    employeeInstanceId: `emp_${i}`,
    nextDeliveryDay: (START_DAY + ((i % 3) + 1)),
    isRepeatingOrder: true,
    isActive: true,
    isUrgentOrder: false,
    nextDeliveryTotal: 42000 + i * 9000,
    productsCount: 12,
    products: [...consumptionByWarehouse[i].values()].map(item => {
      const weekly = item.daily * 7;
      // Most orders cover the week; a deliberate minority is short so the panel has
      // something to flag.
      const short = rngFor(`ord:${wh.id}:${item.rawItemName}`)() < 0.15;
      const factor = short ? 0.7 : 0.97 + rngFor(`ord2:${wh.id}:${item.rawItemName}`)() * 0.12;
      const amount = Math.max(1, Math.round(weekly * factor));
      const product = stores.flatMap(s => s.products).find(p => p.rawItemName === item.rawItemName);
      return {
        itemName: item.itemName,
        rawItemName: item.rawItemName,
        amount,
        amountOrderedThisWeek: amount,
        assignedWarehouse: wh.address,
        price: money(product?.wholesale ?? 1)
      };
    })
  }));

  const deliveryContracts = stores.slice(0, 6).map((store, i) => ({
    enabled: true,
    isUrgentOrder: false,
    nextDeliveryDay: START_DAY + (i % 5) + 1,
    repeatingOrder: true,
    wholesaleAddress: `${30 + i} Broadway`,
    supplierName: pick(rngFor(`dc:${i}`), ['City Wholesale', 'Metro Supply', 'Direct Goods']),
    businessAddress: store.address,
    deliveryFee: 50 + i * 5,
    totalPricePerDelivery: 3000 + i * 400,
    items: store.products.slice(0, 3).map(p => ({
      itemName: p.itemName,
      rawItemName: p.rawItemName,
      amount: 100 + Math.round(p.weight * 80),
      amountOrderedThisWeek: 100 + Math.round(p.weight * 80),
      amountOrderedLastWeek: 90 + Math.round(p.weight * 70)
    }))
  }));

  // Warehouse stock: mostly one to three and a half weeks of measured draw, with a
  // small share deliberately over-held so the idle-stock flag has examples.
  warehouses.forEach((wh, i) => {
    wh.stock = [...consumptionByWarehouse[i].values()].map(item => {
      const weekly = item.daily * 7;
      const roll = rngFor(`stk:${wh.id}:${item.rawItemName}`)();
      const weeks = roll < 0.08 ? 6 + rngFor(`stk2:${wh.id}:${item.rawItemName}`)() * 4 : 1.5 + roll * 2;
      const units = Math.round(weekly * weeks);
      return {
        itemName: item.itemName,
        rawItemName: item.rawItemName,
        quantity: units,
        units,
        boxes: Math.max(1, Math.round(units / 12)),
        weeklyConsumption: money(weekly),
        weeklyDeliveries: money(weekly),
        daysLeft: money(units / Math.max(1, item.daily))
      };
    });
    wh.storageUsedBoxes = wh.stock.reduce((sum, item) => sum + item.boxes, 0);
  });

  // Fixed hype windows, never re-anchored, so historical revenue and cash stay stable
  // across snapshots. The last window is long enough that the showcase is still live at
  // the start day with real pre-wave baseline behind it. Hyped stores are chosen among
  // the earliest-opened sites so each wave has a genuine baseline to measure against.
  const HYPE_WINDOWS = [
    { startDay: 22, durationInDays: 14 },
    { startDay: 54, durationInDays: 14 },
    { startDay: 84, durationInDays: 40 }
  ];
  const hypeStores = [...stores].sort((a, b) => a.openedDay - b.openedDay).slice(0, HYPE_WINDOWS.length);
  const hypeWaves = HYPE_WINDOWS.map((window, i) => {
    const store = hypeStores[i % hypeStores.length];
    const product = store.products[i % store.products.length];
    return {
      hoodRaw: store.rawDistrict,
      itemRaw: product.rawItemName,
      itemName: product.itemName,
      startDay: window.startDay,
      durationInDays: window.durationInDays,
      boost: 2.2
    };
  });
  HYPE_WAVES = hypeWaves;

  return {
    stores,
    support,
    hq,
    warehouses,
    employees,
    logisticsPlans,
    importPartnerships,
    deliveryContracts,
    hypeWaves,
    startReal: Date.now(),
    startDay: START_DAY,
    startHour: 8,
    startMinute: 0,
    startCash: 1200000
  };
}

// ---------------------------------------------------------------- daily model

function dayOfWeek(day) {
  return ((day - 1) % 7 + 7) % 7;
}

// Deterministic hype waves, set by buildWorld. A running wave lifts the sales of its
// product in its neighbourhood, so the hype-exposure panel has a real uplift to show.
let HYPE_WAVES = [];
function hypeBoostFor(hoodRaw, itemRaw, day) {
  let boost = 1;
  for (const wave of HYPE_WAVES) {
    if (wave.hoodRaw === hoodRaw && wave.itemRaw === itemRaw && day >= wave.startDay && day < wave.startDay + wave.durationInDays) {
      boost = Math.max(boost, wave.boost);
    }
  }
  return boost;
}

function storeRevenue(store, day) {
  if (day < store.openedDay) return 0;
  const hoodMult = store.hoodMult ?? 1;
  const growth = 1 + 0.004 * (day - store.openedDay);
  // A slow ~30-day trading season plus two scripted downturns, so a long save has real
  // peaks and troughs instead of a straight climb.
  const season = 1 + 0.1 * Math.sin((day / 30) * Math.PI * 2 + (hashString(store.id) % 100) / 20);
  const downturn = (day >= 44 && day <= 51) || (day >= 78 && day <= 82) ? 0.78 : 1;
  const noise = 0.9 + 0.2 * rngFor(`${store.id}:${day}`)();
  const base = store.baseRevenue * hoodMult * store.dow[dayOfWeek(day)] * growth * season * downturn * noise;
  // A wave lifts the store's trading in proportion to the hyped product's share.
  const totalWeight = store.products.reduce((a, p) => a + p.weight, 0) || 1;
  let hypeFactor = 1;
  for (const p of store.products) {
    const boost = hypeBoostFor(store.rawDistrict, p.rawItemName, day);
    if (boost > 1) hypeFactor += (p.weight / totalWeight) * (boost - 1);
  }
  return Math.max(0, base * hypeFactor);
}

// The store's profit for a day, matching the game's TotalProfit = sales - resources -
// TotalOngoing. Unopened days contribute nothing (no rent before the site is acquired).
function storeProfit(store, day) {
  if (day < store.openedDay) return 0;
  const rev = storeRevenue(store, day);
  return rev * store.margin - rev * OVERHEAD_SHARE - store.rentPerDay;
}

// One day's income statement, shared by the per-store history and the today figures.
function storeIncomeStatement(store, day) {
  const rev = day < store.openedDay ? 0 : storeRevenue(store, day);
  const rent = day < store.openedDay ? 0 : store.rentPerDay;
  const salaries = rev * SALARY_SHARE;
  const ongoing = salaries + rent + rev * OTHER_OVERHEAD_SHARE;
  const resources = rev * (1 - store.margin);
  return {
    dayNumber: day,
    revenue: money(rev),
    profit: money(rev - resources - ongoing),
    salaries: money(salaries),
    rent: money(rent),
    ongoing: money(ongoing),
    expenses: money(resources + ongoing),
    resources: money(resources)
  };
}

// Checkout paper-bag stock, scaled to the store's own measured usage. Most sites hold a
// healthy 4-14 days; a deliberate minority is flagged (one store out of stock and two
// low) so the bag alerts and runout UI have real examples without every store breaking.
function paperBagQuantity(store, gameDay) {
  // Use the store's sequence so the flagged cases are a fixed, small few rather than
  // whatever the hash happens to land on.
  const slot = (store.seq ?? 0) % 32;
  const days = slot === 0 ? 0 : slot === 8 || slot === 24 ? 0.5 : 4 + (hashString(`bags:${store.id}`) % 11);
  const usage = [gameDay - 3, gameDay - 2, gameDay - 1].map(day => {
    const rev = storeRevenue(store, day);
    const customers = store.capacity > 0 ? Math.round(rev / Math.max(1, store.baseRevenue) * store.capacity * 2) : 0;
    return Math.round(customers * 1.2);
  });
  const avgDaily = usage.reduce((a, b) => a + b, 0) / usage.length;
  return Math.max(0, Math.round(avgDaily * days));
}

function buildDayItemSales(store, day, revenue) {
  if (revenue <= 0) return [];
  const weighted = store.products.map(p => ({ p, weight: p.weight * hypeBoostFor(store.rawDistrict, p.rawItemName, day) }));
  const totalWeight = weighted.reduce((a, w) => a + w.weight, 0) || 1;
  return weighted.map(({ p, weight }) => {
    const rng = rngFor(`${store.id}:${day}:${p.id}`);
    const share = (weight / totalWeight) * (0.8 + 0.4 * rng());
    const amount = Math.max(0, Math.round((revenue * share) / p.market));
    if (amount === 0) return null;
    return {
      itemName: p.itemName,
      rawItemName: p.rawItemName,
      amountSold: amount,
      totalPrice: money(amount * p.market),
      totalWholesalePrice: money(amount * p.wholesale)
    };
  }).filter(Boolean);
}

function dayHourReports(store, day, customers) {
  const open = [];
  for (let h = 0; h < 24; h++) open.push(h >= store.openStart && h < store.openEnd ? 1 : 0);
  const weightSum = open.reduce((a, b) => a + b, 0) || 1;
  const reports = [];
  for (let h = 0; h < 24; h++) {
    const shape = open[h] * (h >= 12 && h <= 14 ? 1.5 : h >= 17 && h <= 19 ? 1.4 : 1);
    const base = (customers * shape) / weightSum;
    const noise = 0.75 + 0.5 * rngFor(`${store.id}:${day}:h${h}`)();
    reports.push({ hour: h, customers: Math.max(0, Math.round(base * noise)) });
  }
  return reports;
}

function storeSchedule(store, employeesAtStore, postIds) {
  const fallback = [{ id: `emp_${store.seq}`, name: 'Staff', primarySkillName: 'Customer Service' }];
  const pool = employeesAtStore.length ? employeesAtStore : fallback;
  const ids = (postIds && postIds.length ? postIds : [`${store.id}_station_0`]);
  return WEEKDAYS.map((dayName, idx) => {
    const open = store.isSupport === true || store.type === 'Nightclub' || idx < 6;
    const hoursOpen = new Array(24).fill(false);
    if (open) {
      for (let h = store.openStart; h < store.openEnd; h++) hoursOpen[h] = true;
    }
    const shifts = [];
    if (open) {
      // Cover every open hour with a cashier post, tiled in shifts of at most eight
      // hours, each posted to a real counter so the grid can measure staffed capacity.
      let h = store.openStart;
      let i = 0;
      while (h < store.openEnd) {
        const end = Math.min(store.openEnd, h + 8);
        const emp = pool[i % pool.length];
        shifts.push({
          startHour: h,
          endHour: end,
          employeeId: emp.id,
          employeeName: emp.name,
          role: 'cashier',
          skillName: 'Customer Service',
          stationName: '',
          itemInstanceId: ids[i % ids.length],
          shiftType: 1,
          duration: end - h
        });
        h = end;
        i++;
      }
      // A second cashier on another counter during the lunch and evening peaks, so
      // some hours run two registers and others one.
      if (ids.length > 1) {
        const peakEmp = pool[(i + 1) % pool.length];
        [[12, 14], [17, 19]].forEach(([start, end]) => {
          if (start >= store.openStart && end <= store.openEnd) {
            shifts.push({
              startHour: start,
              endHour: end,
              employeeId: peakEmp.id,
              employeeName: peakEmp.name,
              role: 'cashier',
              skillName: 'Customer Service',
              stationName: '',
              itemInstanceId: ids[1 % ids.length],
              shiftType: 1,
              duration: end - start
            });
          }
        });
      }
      // A cleaner and a guard on the larger sites, for the schedule matrix to show.
      // They do not affect cashier coverage because the tiled posts already cover it.
      if (store.staffCount >= 5) {
        const cleaner = pool.find(e => /clean/i.test(e.primarySkillName || '')) || pool[0];
        const guard = pool.find(e => /security/i.test(e.primarySkillName || '')) || pool[pool.length - 1];
        shifts.push({ startHour: store.openStart, endHour: Math.min(store.openEnd, store.openStart + 6), employeeId: cleaner.id, employeeName: cleaner.name, role: 'cleaner', skillName: 'Cleaning', stationName: '', shiftType: 0, duration: 6 });
        shifts.push({ startHour: Math.max(store.openStart, store.openEnd - 8), endHour: store.openEnd, employeeId: guard.id, employeeName: guard.name, role: 'security', skillName: 'Security', stationName: '', shiftType: 0, duration: 8 });
      }
    }
    return {
      day: dayName,
      isOpen: open,
      openHours: open ? store.openEnd - store.openStart : 0,
      startHour: open ? store.openStart : -1,
      endHour: open ? store.openEnd : -1,
      hoursOpen,
      shiftHours: shifts.reduce((a, s) => a + s.duration, 0),
      shifts
    };
  });
}

function retailPricesFor(store) {
  return store.products.map(p => {
    const rng = rngFor(`${store.id}:price:${p.id}`);
    // Most shelves sit at the sweet spot (within a few cents of the optimal price) so the
    // Analyzer shows a realistic handful of pricing levers, not a row for every product.
    // A deliberate minority is left clearly over- or under-priced for those levers.
    const optimal = money(p.market * (0.95 + rng() * 0.05));
    const roll = rng();
    const current = roll < 0.75
      ? optimal
      : roll < 0.875
        ? money(optimal * (0.84 + rng() * 0.08))
        : money(optimal * (1.08 + rng() * 0.08));
    return {
      rawItemName: p.rawItemName,
      displayName: p.itemName,
      currentPrice: current,
      wholesalePrice: money(p.wholesale),
      marketReferencePrice: money(p.market),
      optimalPrice: optimal,
      maxMarketCeiling: money(p.market * 1.18),
      inStoreStock: Math.round(rng() * 400),
      isServiceProduct: false
    };
  });
}

// ---------------------------------------------------------------- snapshot

function computeClock(world, now) {
  const speed = Number(process.env.MOCK_SPEED || 6); // game minutes per real second
  const elapsedGameMinutes = Math.floor(((now - world.startReal) / 1000) * speed);
  const offset = world.offsetGameMinutes || 0; // set by the control panel to jump time
  const total = world.startDay * 1440 + world.startHour * 60 + world.startMinute + elapsedGameMinutes + offset;
  return {
    gameDay: Math.floor(total / 1440),
    gameHour: Math.floor((total % 1440) / 60),
    gameMinute: total % 60
  };
}

// A lightweight clock read for the control panel, without building a full snapshot.
export function currentClock(world, now = Date.now()) {
  return computeClock(world, now);
}

function buildBusiness(world, site, clock, employeesAt) {
  const { gameDay, gameHour, gameMinute } = clock;
  const revenueHistory = [];
  // The site's whole story, from the day it was acquired to yesterday.
  for (let d = Math.max(1, site.createdDay || 1); d < gameDay; d++) {
    revenueHistory.push(storeIncomeStatement(site, d));
  }

  const orderHistory = [];
  for (let d = Math.max(1, gameDay - 16); d < gameDay; d++) {
    const rev = storeRevenue(site, d);
    const customers = site.capacity > 0 ? Math.round(rev / Math.max(1, site.baseRevenue) * site.capacity * 2) : 0;
    orderHistory.push({
      dayNumber: d,
      totalCustomers: customers,
      totalRevenue: money(rev),
      itemSales: buildDayItemSales(site, d, rev),
      consumablesSales: site.products.length ? [
        { itemName: 'Paper Bag', rawItemName: 'ba:itemname_paperbag', amountSold: Math.round(customers * 1.2) }
      ] : [],
      hourReports: dayHourReports(site, d, customers)
    });
  }

  const todayStatement = storeIncomeStatement(site, gameDay);
  const dayFraction = Math.min(1, (gameHour * 60 + gameMinute) / 1440);
  const todayRevenue = storeRevenue(site, gameDay) * dayFraction;
  const todayCustomers = site.capacity > 0 ? Math.round(todayRevenue / Math.max(1, site.baseRevenue) * site.capacity * 2) : 0;
  const todaySales = buildDayItemSales(site, gameDay, todayRevenue);
  const todayHourReports = dayHourReports(site, gameDay, todayCustomers);
  const todays = todayHourReports.filter(h => h.hour <= gameHour);

  const weeklyRevenue = revenueHistory.slice(-7).reduce((a, d) => a + d.revenue, 0);
  const weeklyProfit = revenueHistory.slice(-7).reduce((a, d) => a + d.profit, 0);

  const rng = rngFor(`meta:${site.id}`);
  // Customer-service counters and their per-hour capacity, so the weekly grid can
  // compare measured customers against the capacity that was actually staffed.
  const serviceStations = site.capacity > 0
    ? Array.from({ length: Math.max(1, Math.ceil(site.capacity / 40)) }, (_, i) => ({
        id: `${site.id}_station_${i}`,
        itemName: 'ba:itemname_checkoutcounter',
        capacityPerHour: 30
      }))
    : [];
  // Factory assembly machines (empty for non-factories).
  const machines = site.machines || [];
  // Shifts post to service counters where there are customers, otherwise to machines.
  const postIds = serviceStations.length ? serviceStations.map(s => s.id) : machines.map(m => m.id);
  return {
    id: site.id,
    name: site.name,
    type: site.type,
    rawType: site.rawType,
    isHeadquarters: Boolean(site.isHeadquarters),
    address: site.address,
    streetName: site.streetName,
    streetNumber: site.streetNumber,
    district: site.district,
    rawDistrict: site.rawDistrict,
    dailyRevenue: todayStatement.revenue, // full-day pace
    dailyProfit: todayStatement.profit,
    weeklyRevenue: money(weeklyRevenue),
    weeklyProfit: money(weeklyProfit),
    weeklyRent: money(site.rentPerDay * 7),
    logo: { shape: 'store', base64: '', bgHex: '#059669', iconHex: '#FFFFFF' },
    customerSatisfaction: 70 + Math.floor(rng() * 30),
    satisfactionBreakdown: {
      overall: 70 + Math.floor(rng() * 30),
      customerService: 60 + Math.floor(rng() * 40),
      cleanliness: 60 + Math.floor(rng() * 40),
      pricing: 60 + Math.floor(rng() * 40),
      facility: 60 + Math.floor(rng() * 40)
    },
    promotion: {
      trafficIndex: 40 + Math.floor(rng() * 50),
      marketing: Math.floor(rng() * 60),
      total: 60 + Math.floor(rng() * 40),
      activeCampaigns: Math.floor(rng() * 3)
    },
    customerCapacity: site.capacity,
    customerDemands: fulfilledDemands(site),
    isOpenNow: site.capacity > 0 && gameHour >= site.openStart && gameHour < site.openEnd,
    staffOnDuty: Math.min(site.staffCount, 2 + (gameHour % 4)),
    openHoursPerWeek: (site.openEnd - site.openStart) * 6,
    scheduledShiftHoursPerWeek: site.staffCount * 40,
    cleanliness: 60 + Math.floor(rng() * 40),
    securityPct: 50 + Math.floor(rng() * 50),
    marketingCampaignsCount: Math.floor(rng() * 3),
    retailPrices: site.products.length ? retailPricesFor(site) : [],
    inventory: [
      ...site.products.map(p => ({ rawItemName: p.rawItemName, quantity: Math.round(rng() * 500) })),
      ...(site.products.length ? [{
        rawItemName: 'ba:itemname_paperbag',
        quantity: paperBagQuantity(site, gameDay)
      }] : [])
    ],
    serviceStations,
    machines,
    todayCustomerCount: todayCustomers,
    todayItemSales: todaySales,
    todayOrderSales: todaySales,
    hourReports: todays,
    scheduleWeek: storeSchedule(site, employeesAt, postIds),
    revenueHistory,
    orderHistory,
    marketingCampaigns: [],
    marketingExpensesPerDay: money(120 + rng() * 400),
    marketingEfficiency: money(0.5 + rng() * 0.5),
    stolenItemsCost: money(rng() * 200),
    lastDeposit: money(rng() * 5000),
    takenOver: false,
    creationDay: site.createdDay,
    businessDescription: `${site.type} in ${site.district}`,
    lastDayOnSale: 0
  };
}

export function snapshot(world, now = Date.now()) {
  const clock = computeClock(world, now);
  const { gameDay } = clock;

  // Hype windows are fixed in buildWorld so historical revenue stays stable across
  // snapshots; just make sure the module-scoped lookup matches this world.
  HYPE_WAVES = world.hypeWaves;

  if (!world._cache || world._cache.day !== gameDay) {
    world._cache = { day: gameDay };
  }

  const employeesAt = new Map();
  world.employees.forEach(e => {
    const list = employeesAt.get(e.workingLocation) || [];
    list.push(e);
    employeesAt.set(e.workingLocation, list);
  });

  const allSites = [...world.stores, ...world.support, world.hq];
  const businesses = allSites.map(site => buildBusiness(world, site, clock, employeesAt.get(site.name) || []));

  // Empire rollups from the retail stores only.
  const retail = businesses.filter(b => !b.isHeadquarters && b.rawType !== 'ba:businesstype_factory');
  const weeklyRevenue = retail.reduce((a, b) => a + (b.weeklyRevenue || 0), 0);
  const weeklyProfit = retail.reduce((a, b) => a + (b.weeklyProfit || 0), 0);
  const weeklyPayroll = world.employees.reduce((a, e) => a + (e.weeklyWages || 0), 0);
  const weeklyRent = retail.reduce((a, b) => a + (b.weeklyRent || 0), 0);
  const dailyRevenue = retail.reduce((a, b) => a + (b.dailyRevenue || 0), 0);
  // Expenses are the residual of revenue minus booked profit, so every summary reconciles.
  const weeklyExpenses = weeklyRevenue - weeklyProfit;
  const dailyExpenses = weeklyExpenses / 7;

  // A day's empire profit, used for both the booked-profit history and the cash the
  // company actually kept, so the reconciliation shows a real gap.
  function empireProfitForDay(day) {
    return world.stores.reduce((sum, s) => sum + storeProfit(s, day), 0);
  }

  // IRS tax: billed at each year end for that period's profit and paid a few days later
  // inside the grace window, so the cash trail shows the real tax outflow.
  function taxBillForPeriod(periodEnd) {
    let periodProfit = 0;
    for (let d = periodEnd - DAYS_PER_YEAR + 1; d <= periodEnd; d++) periodProfit += empireProfitForDay(d);
    return Math.max(0, Math.round(periodProfit * TAX_RATE));
  }
  const taxPayments = new Map();
  let unpaidTaxes = 0;
  for (let periodEnd = DAYS_PER_YEAR; periodEnd <= gameDay; periodEnd += DAYS_PER_YEAR) {
    const bill = taxBillForPeriod(periodEnd);
    const payDay = periodEnd + TAX_PAYMENT_DELAY;
    if (payDay <= gameDay) taxPayments.set(payDay, (taxPayments.get(payDay) || 0) + bill);
    else unpaidTaxes += bill;
  }

  // Cash at each midnight from the company's first day forward. Half of each day's
  // profit is kept as cash and half goes back into stock and setup, so the booked
  // profit line and the cash line diverge by exactly the reinvested amount.
  const cashByDay = new Map();
  let runningCash = world.startCash - 180000;
  for (let d = 1; d <= gameDay; d++) {
    runningCash += empireProfitForDay(d) * 0.5 - (taxPayments.get(d) || 0);
    cashByDay.set(d, runningCash);
  }
  const playerCash = money(cashByDay.get(gameDay) ?? runningCash);
  const midnightBankBalances = [];
  for (let d = Math.max(1, gameDay - 6); d <= gameDay; d++) {
    midnightBankBalances.push(money(cashByDay.get(d) ?? runningCash));
  }

  const weeklyHistory = [];
  for (let d = Math.max(1, gameDay - 7); d < gameDay; d++) {
    const rev = world.stores.reduce((a, s) => a + storeRevenue(s, d), 0);
    weeklyHistory.push({ dayNumber: d, revenue: money(rev), profit: money(empireProfitForDay(d)) });
  }

  // Full-life histories so the long-trend charts have data instead of two points.
  const playerIncomeHistory = [];
  const playerBusinessCountHistory = [];
  for (let d = 1; d < gameDay; d++) {
    playerIncomeHistory.push({ day: d, income: money(empireProfitForDay(d)) });
    playerBusinessCountHistory.push({ day: d, count: world.stores.filter(s => s.openedDay <= d).length });
  }
  const rivalIncomeHistory = [];
  const rivalBusinessCountHistory = [];
  {
    const rng = rngFor('rival_a');
    let count = 5;
    for (let d = 1; d < gameDay; d++) {
      if (d % 9 === 0) count += rng() < 0.55 ? 1 : -1;
      rivalIncomeHistory.push({ day: d, income: money(38000 + Math.sin(d / 11) * 6000 + rng() * 4000) });
      rivalBusinessCountHistory.push({ day: d, count: Math.max(1, count) });
    }
  }

  // Market events: the running hype waves and a supplier shortage.
  const marketEvents = [];
  world.hypeWaves.forEach((wave, i) => {
    const activeNow = gameDay >= wave.startDay && gameDay < wave.startDay + wave.durationInDays;
    marketEvents.push({
      type: 'Hype',
      itemName: wave.itemRaw,
      neighbourhood: wave.hoodRaw,
      startDay: wave.startDay,
      durationInDays: wave.durationInDays,
      demandImpact: 40 + i * 10,
      stopped: !activeNow && gameDay >= wave.startDay + wave.durationInDays,
      isActive: activeNow,
      businessTypeName: '',
      rivalName: ''
    });
  });
  marketEvents.push({
    type: 'ProductShortage', itemName: 'ba:itemname_sodacan', neighbourhood: 'ba:neighborhood_midtown',
    startDay: gameDay - 1, durationInDays: 4, demandImpact: 30, stopped: false, isActive: true,
    businessTypeName: '', rivalName: 'Rival Corp'
  });

  // Demand grid: every store product across every neighbourhood.
  const productMarket = [];
  const seenProducts = new Map();
  world.stores.forEach(store => store.products.forEach(p => seenProducts.set(p.rawItemName, p)));
  seenProducts.forEach((p, raw) => {
    productMarket.push({
      itemName: raw,
      importPriceIndex: money(0.6 + rngFor(`ipi:${raw}`)() * 0.7),
      demand: HOODS.map(hood => {
        const rng = rngFor(`demand:${raw}:${hood.raw}`);
        const daysSinceSold = Math.floor(rng() * 60);
        return {
          neighborhood: hood.raw,
          demand: 30 + Math.floor(rng() * 70),
          providers: Math.floor(rng() * 5),
          lastDaySold: Math.max(0, gameDay - daysSinceSold),
          hasPlayerMonopoly: rng() > 0.85
        };
      })
    });
  });

  return {
    isConnected: true,
    modVersion: '2.4.0',
    lastHeartbeat: new Date(now).toISOString(),
    ...clock,
    playerCash,
    // Schema parity with the mod: bankBalance mirrors cash, netWorth is cash minus loans.
    bankBalance: money(playerCash),
    totalLoans: 450000,
    netWorth: money(playerCash - 450000),
    midnightBankBalances,
    playerHappiness: 84,
    playerEnergy: 72,
    playerHunger: 15,
    playerStreetName: 'Park Avenue',
    playerStreetNumber: 9,
    activeVehicleId: 'veh_0',
    numberOfDoctorOperations: 1,
    currentBackTaxes: 0,
    gamblingWinnings: 2500,
    gamblingLosses: 800,
    hasCinemaTheaterTicket: true,
    energyGeneratedFromConsumables: 0,
    currentActivityHappinessPerHour: 2,

    dailyRevenueTotal: money(dailyRevenue),
    dailyExpensesTotal: money(dailyExpenses),
    dailyBusinessRevenue: money(dailyRevenue * 0.92),
    dailyResidentialRevenue: money(dailyRevenue * 0.08),

    weeklyRevenueTotal: money(weeklyRevenue),
    weeklyExpensesTotal: money(weeklyExpenses),
    weeklyBusinessRevenue: money(weeklyRevenue * 0.94),
    weeklyBusinessProfit: money(weeklyProfit),
    weeklyResidentialRevenue: money(weeklyRevenue * 0.06),
    weeklyResidentialExpenses: 4200,
    weeklyResidentialNet: money(weeklyRevenue * 0.06 - 4200),

    totalEmployees: world.employees.length,
    totalHourlyPayroll: money(world.employees.reduce((a, e) => a + e.wage, 0)),
    weeklyPayrollTotal: money(weeklyPayroll),
    taxDeductibleExpenses: money(weeklyPayroll * 0.6),
    unpaidTaxes: money(unpaidTaxes),

    weeklyRevenueHistory: weeklyHistory,

    businesses,
    headquarters: [world.hq],
    residences: [
      { id: 'res_1', address: '9 Park Avenue', streetName: 'Park Avenue', streetNumber: 9, type: 'Apartment', district: 'Midtown', rawDistrict: 'ba:neighborhood_midtown', sqm: 90, isOwned: true, rentPerDay: 0, rentPerWeek: 0, status: 'owned', sinceDay: 5 },
      { id: 'res_2', address: '22 Ocean Drive', streetName: 'Ocean Drive', streetNumber: 22, type: 'House', district: 'The Hamptons', rawDistrict: 'ba:neighborhood_thehamptons', sqm: 220, isOwned: false, rentPerDay: 420, rentPerWeek: 2940, status: 'rented', sinceDay: 12 }
    ],
    ownedRealEstate: [
      { id: 'ore_1', address: '50 Broadway', streetName: 'Broadway', streetNumber: 50, district: 'Lower Manhattan', rawDistrict: 'ba:neighborhood_lowermanhattan', buildingTypeName: 'Office Building', totalSqm: 1200, occupancyPct: 82, pricePerSqm: 4.2, marketRentPerSqm: 3.6, dailyRevenue: 4133, weeklyRevenue: 28931, dailyTaxes: 190, weeklyTaxes: 1330, weeklyNet: 27601, purchasePrice: 25000000, purchaseDay: 10, marketValue: 26500000, occupancy: 82, maxOccupancy: 100, pendingPricePerSqm: 3.4, daysUntilUpdatingPricePerSqm: 4 },
      { id: 'ore_2', address: '18 Lexington Avenue', streetName: 'Lexington Avenue', streetNumber: 18, district: 'Midtown', rawDistrict: 'ba:neighborhood_midtown', buildingTypeName: 'Retail Building', totalSqm: 220, occupancyPct: 55, pricePerSqm: 2.9, marketRentPerSqm: 3.4, dailyRevenue: 351, weeklyRevenue: 2457, dailyTaxes: 20, weeklyTaxes: 140, weeklyNet: 2317, purchasePrice: 1400000, purchaseDay: 24, marketValue: 1310000, occupancy: 55, maxOccupancy: 100 }
    ],
    emptyLeasedSpaces: [
      { id: 'els_1', address: '77 34th Street', streetName: '34th Street', streetNumber: 77, type: 'Retail Unit', district: 'Midtown', rawDistrict: 'ba:neighborhood_midtown', sqm: 140, rentPerDay: 540, rentPerWeek: 3780, sinceDay: 20 },
      { id: 'els_2', address: '13 Canal Street', streetName: 'Canal Street', streetNumber: 13, type: 'Retail Unit', district: 'Garment District', rawDistrict: 'ba:neighborhood_garmentdistrict', sqm: 95, rentPerDay: 310, rentPerWeek: 2170, sinceDay: 24 }
    ],
    warehouses: world.warehouses,
    employees: world.employees,
    loans: [
      { totalAmount: 600000, remainingAmount: 450000, dailyPayment: 2200, weeklyPayment: 15400, dailyInterest: 140, bankAddress: '2 Wall Street', paidAmount: 150000 }
    ],
    operationalAlerts: [
      { id: 'alert_mock_unstaffed', type: 'unstaffed', severity: 'critical', location: businesses[0]?.name || 'Store', message: 'Store is open with 0 cashiers across 6 open hours on Wed (12h, 13h, 14h).' },
      { id: 'alert_mock_satisfaction', type: 'satisfaction', severity: 'warning', location: businesses[1]?.name || 'Store', message: 'Customer satisfaction at 74%.' }
    ],

    gameVariables: {
      difficulty: 'Normal',
      taxPercentage: 10,
      daysPerYear: 60,
      marketPriceMultiplier: 1,
      employeeHourlySalaryMultiplier: 1,
      bankInterestMultiplier: 1,
      rivalsDifficultyMultiplier: 1,
      disableVehicleDamage: false,
      disableVehicleFuel: false,
      startingMoney: 100000
    },
    achievements: {
      totalGasCost: 1200, totalRepairCost: 800, taxesPaid: 240000, totalInteriorDesignerCost: 50000,
      totalCasinoWin: 0, taxiRides: 3, hospitalization: 0, parkingTickets: 2, casinoBoatVisits: 0,
      doctorsAppointments: 1, goodsProducedInFactories: 420000, privateDriverRides: 12, golfHighScore: 3,
      tennisMatchesWon: 1, golfCartHit: false, destroyedSandCastle: false
    },
    financialTotals: {
      dayNumber: gameDay,
      totalBusinessProfit: money(weeklyProfit / 7),
      totalLoanExpenses: 2200,
      totalHealthInsuranceExpenses: 600,
      totalHeadhunterReplacementFees: 0,
      totalRealEstate: 26400000,
      negativeInterestRates: 0,
      parkingFees: 40,
      salaryIncome: 0,
      totalResidentialExpenses: 600,
      totalUnassignedStaffWages: 0,
      // Net of the loan/insurance/residential expense lines above, so the totals reconcile.
      totalProfit: money(weeklyProfit / 7 - 2200 - 600 - 600)
    },
    vehicles: world.warehouses.map((wh, i) => ({
      id: `veh_${i}`, vehicleType: 'ba:vehicletype_van', fuel: 60 + i * 10, maxFuel: 100, damage: i * 4,
      dirtiness: 20, isWarehouseAssigned: true, parkingState: 'Parked', parkingNeighbourhood: wh.district,
      unpaidParkingAmount: 0, parkingTickets: 0, streetName: wh.streetName, streetNumber: wh.streetNumber,
      cargo: [{ itemName: 'Soda Can', rawItemName: 'ba:itemname_sodacan', amount: 120 }], repairCost: 0, sellingPrice: 18000
    })),
    boats: [{ id: 'boat_1', type: 'Speedboat', color: 'White', nextMaintenanceDay: gameDay + 12 }],
    investments: buildInvestmentFunds(gameDay),
    rivals: [
      { rivalId: 'rival_a', weeklyIncomeHistory: rivalIncomeHistory, numberOfBusinessesHistory: rivalBusinessCountHistory }
    ],
    specialRivals: [{ rivalId: 'rival_special', isActive: true, isDefeated: false, completedTimelineEntries: 2 }],
    marketEvents,
    productMarket,
    buildingsForSale: [
      { address: '60 Broadway', streetName: 'Broadway', streetNumber: 60, buildingPrice: 4200000, squareMeters: 380, acceptOfferRate: 0.9, pricePerSqm: 11053, neighbourhood: 'Lower Manhattan', buildingType: 'Retail Building' },
      { address: '7 Wall Street', streetName: 'Wall Street', streetNumber: 7, buildingPrice: 15120000, squareMeters: 720, acceptOfferRate: 0.72, pricePerSqm: 21000, neighbourhood: 'Lower Manhattan', buildingType: 'Office Building' }
    ],
    candidateEmployees: world.employees.slice(0, 6).map((e, i) => ({
      id: `cand_${i}`, name: e.name, primarySkill: e.primarySkillName, skillLevel: e.skillLevel,
      hourlyWage: e.wage + 2, satisfaction: 80, hoursUntilExpiring: 48, fromJobBoard: true, sourceAddress: '1 Madison Avenue'
    })),
    recruitmentCampaigns: [
      { agencyAddress: '5 Broadway', businessAddress: world.hq.address, skillName: 'Customer Service', skillPercentage: 80, amountOfCandidates: 5, candidatesFound: 3, price: 12000, fullTime: true, partTime: false, finished: false }
    ],
    deliveryContracts: world.deliveryContracts,
    furnitureDeliveryContracts: [
      { fromAddress: '12 Canal Street', toAddress: world.hq.address, itemCount: 8, dayOfDelivery: gameDay + 3, hourOfDelivery: 10, deliveryFee: 250 }
    ],
    foodDeliveryContracts: [
      { toAddress: world.stores[0]?.address || '1st Street', itemCount: 14, dayOfDelivery: gameDay + 1, hourOfDelivery: 11, deliveryFee: 90 }
    ],
    vehicleDeliveryContracts: [
      { vehicleTypeName: 'Delivery Van', vehicleColor: 'White', deliveryDay: gameDay + 2, deliveryHour: 13, deliveryAddress: world.stores[1]?.address || '2nd Street', deliveryPrice: 3200 }
    ],
    movingServiceContracts: [
      { originAddress: '11th Avenue', destinationAddress: world.stores[2]?.address || '3rd Street', movingDay: gameDay + 4, movingHour: 9, transferBizManSettings: true }
    ],
    interiorInstallationContracts: [
      { installationAddress: world.stores[3]?.address || '4th Street', designName: 'Boutique', isBlueprint: false, dayOfInstallation: gameDay + 5, businessTypeName: 'Clothing Store' }
    ],
    importPartnerships: world.importPartnerships,
    logisticsPlans: world.logisticsPlans,
    diplomas: [
      { name: 'Basic Management', minutesStudied: 1200, completed: true },
      { name: 'Product Manufacturing', minutesStudied: 900, completed: true },
      { name: 'Fundamentals of Business Administration', minutesStudied: 400, completed: false }
    ],
    todoTasks: [
      { id: 'todo_1', type: 'Restock', address: world.stores[0]?.address || '', itemName: 'Soda Can', priority: 'High', remainingDays: 1 }
    ],
    jobInstances: [],
    headhunterPlans: [],
    hrPlans: [{ id: 'hr_1', assignedEmployeeId: world.employees[0]?.id || 'emp_0', assignedEmployeesCount: 1, replaceAbsentEmployees: true, trainingTarget: 80, hasHealthInsurance: true }],
    pricingPlans: [{ id: 'pp_1', assignedEmployeeId: world.employees[1]?.id || 'emp_1', supervisedNeighborhood: 'ba:neighborhood_midtown', manuallyPricedItemsCount: 4, nextUpdateDay: gameDay + 2, nextUpdateHour: 9 }],
    contacts: [{ category: 'Suppliers', unreadMessages: 2 }, { category: 'Staff', unreadMessages: 0 }],
    healthInsuranceOffers: [],
    salaryNegotiations: [],
    happinessModifiers: [{ type: 'ba:happinessmodifier_restaurant', hoursLeft: 6, hideDuration: false }],
    neighbourhoodStats: HOODS.map(h => ({
      name: h.name, nextNewBusinessDay: gameDay + 5, nextResidentialSwapDay: gameDay + 9,
      nextWarehouseSwapDay: gameDay + 14, nextForceShutdownDay: gameDay + 20
    })),
    playerIncomeHistory,
    playerBusinessCountHistory,
    foodDeliveryOffers: [
      { pickupAddress: '14 Canal Street', destinationAddress: world.stores[0]?.address || '1st Street', itemsCount: 6, deliveryReward: 180, timeLimitMinutes: 12, isExpired: false }
    ]
  };
}
