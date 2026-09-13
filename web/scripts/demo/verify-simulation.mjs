// Verification suite for the Big Ambitions demo/mock simulation engine.
//
// It asserts BOTH internal accounting identities AND schema parity with the fields the
// web app actually reads (LiveSyncContext.tsx). The schema checks are the important part:
// the app consumes runtime JSON, so a missing or misnamed field is invisible to tsc.

import assert from 'node:assert';
import {
  BigAmbitionsSimulation,
  currentClock,
  START_DAY,
  DEMO_DAYS,
  boxSizeFor
} from './simulationEngine.mjs';

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (error) {
    console.error(`  FAIL: ${name}\n        ${error && error.message}`);
    process.exitCode = 1;
  }
}

console.log('Running Big Ambitions demo simulation verification...');

const sim = new BigAmbitionsSimulation('test-verification-seed');

test('cash ledger reconciles for days 1..100', () => {
  for (let day = 1; day <= 100; day++) {
    const ledger = sim.getDailyLedger(day);
    assert.ok(ledger, `ledger for day ${day}`);
    const previous = sim.midnightBankBalances[day - 1];
    const expected = Math.round((previous + ledger.netCash) * 100) / 100;
    assert.ok(
      Math.abs(sim.midnightBankBalances[day] - expected) < 0.01,
      `day ${day}: midnight ${sim.midnightBankBalances[day]} !== ${previous} + ${ledger.netCash}`
    );
    assert.ok(Math.abs(ledger.netCash - (ledger.inflows - ledger.outflows)) < 0.01, `day ${day}: netCash identity`);
  }
});

test('per-business profit identity holds for every store-day', () => {
  for (const [storeId, history] of sim.businessDailyHistories.entries()) {
    for (const entry of history) {
      const ongoing = Math.round((entry.salaries + entry.rent + entry.marketing + entry.theft + entry.licensingFees) * 100) / 100;
      assert.strictEqual(entry.ongoing, ongoing, `${storeId} day ${entry.dayNumber}: ongoing`);
      assert.strictEqual(entry.expenses, Math.round((entry.resources + entry.ongoing) * 100) / 100, `${storeId} day ${entry.dayNumber}: expenses`);
      assert.strictEqual(entry.profit, Math.round((entry.revenue - entry.resources - entry.ongoing) * 100) / 100, `${storeId} day ${entry.dayNumber}: profit`);
    }
  }
});

test('empire income statement matches FinancialSummaryHelper.cs:112', () => {
  for (let day = 1; day <= 100; day++) {
    const financial = sim.getFinancialSummary(day);
    assert.ok(financial, `summary for day ${day}`);
    const expected = Math.round((
      financial.totalBusinessProfit +
      financial.totalRealEstate -
      financial.totalResidentialExpenses +
      financial.totalLoanExpenses +
      financial.parkingFees +
      financial.totalUnassignedStaffWages +
      financial.salaryIncome +
      financial.totalHealthInsuranceExpenses +
      financial.totalHeadhunterReplacementFees
    ) * 100) / 100;
    assert.ok(Math.abs(financial.totalProfit - expected) < 0.01, `day ${day}: totalProfit`);
  }
});

test('tax bill is assessed and paid in the game cycle', () => {
  sim.runTo(60);
  const assessed = sim.currentUnpaidTaxes;
  assert.ok(assessed > 0, 'day 60 should raise a tax bill when sales exceed the 150k threshold');
  sim.runTo(74);
  assert.strictEqual(sim.currentUnpaidTaxes, 0, 'day 74 should pay the bill');
});

test('warehouse pallet storage stays within capacity and matches box math', () => {
  const snapshot = sim.generateTelemetrySnapshot(START_DAY, 0, 0);
  assert.ok(snapshot.warehouses.length > 0, 'warehouse present by day 95');
  for (const warehouse of snapshot.warehouses) {
    assert.ok(warehouse.storageCapacityBoxes > 0, 'capacity > 0');
    assert.ok(warehouse.storageUsedBoxes <= warehouse.storageCapacityBoxes, 'used <= capacity');
    let boxes = 0;
    for (const item of warehouse.stock) boxes += Math.ceil(item.quantity / boxSizeFor(item.rawItemName));
    assert.strictEqual(warehouse.storageUsedBoxes, boxes, 'storageUsedBoxes matches ceil(units/boxSize)');
  }
});

test('schema leaks are absent (warehouses, businesses, headquarters)', () => {
  const snapshot = sim.generateTelemetrySnapshot(START_DAY, 0, 0);
  for (const warehouse of snapshot.warehouses) {
    for (const leaked of ['exportItem', 'streetName', 'streetNumber', 'district']) {
      assert.ok(!(leaked in warehouse), `warehouse must not leak ${leaked}`);
    }
  }
  for (const business of snapshot.businesses) {
    assert.ok(!('todayOrderSales' in business), 'business must not leak todayOrderSales');
    assert.ok('marketingCampaignsCount' in business, 'business keeps marketingCampaignsCount');
  }
  assert.ok(snapshot.businesses.every(business => !business.isHeadquarters), 'HQ must not be in businesses');
  assert.ok(snapshot.headquarters.length === 1, 'HQ is emitted in headquarters');
});

test('every business has a full orderHistory (14 days)', () => {
  const snapshot = sim.generateTelemetrySnapshot(START_DAY, 0, 0);
  for (const business of snapshot.businesses) {
    assert.ok(Array.isArray(business.orderHistory) && business.orderHistory.length > 0, `${business.name} orderHistory`);
    const entry = business.orderHistory[business.orderHistory.length - 1];
    assert.ok(typeof entry.dayNumber === 'number', 'orderHistory dayNumber');
    assert.ok(typeof entry.totalCustomers === 'number', 'orderHistory totalCustomers');
    assert.ok(typeof entry.totalRevenue === 'number', 'orderHistory totalRevenue');
    assert.ok(Array.isArray(entry.itemSales) && entry.itemSales.length > 0, 'orderHistory itemSales');
    for (const sale of entry.itemSales) {
      assert.ok(typeof sale.rawItemName === 'string' && typeof sale.itemName === 'string', 'sale names');
      assert.ok(typeof sale.amountSold === 'number', 'sale amountSold');
      assert.ok(typeof sale.totalPrice === 'number', 'sale totalPrice');
      assert.ok(typeof sale.totalWholesalePrice === 'number', 'sale totalWholesalePrice');
    }
    assert.ok(Array.isArray(entry.consumablesSales) && entry.consumablesSales.length > 0, 'orderHistory consumablesSales');
  }
});

test('every retailPrices entry matches LiveRetailPrice', () => {
  const snapshot = sim.generateTelemetrySnapshot(START_DAY, 0, 0);
  for (const business of snapshot.businesses) {
    assert.ok(Array.isArray(business.retailPrices) && business.retailPrices.length > 0, `${business.name} retailPrices`);
    for (const price of business.retailPrices) {
      for (const field of ['rawItemName', 'displayName']) {
        assert.strictEqual(typeof price[field], 'string', `${field} on ${business.name}`);
      }
      for (const field of ['currentPrice', 'wholesalePrice', 'marketReferencePrice', 'optimalPrice', 'maxMarketCeiling']) {
        assert.ok(Number.isFinite(price[field]), `${field} finite on ${business.name}`);
      }
      assert.strictEqual(typeof price.isServiceProduct, 'boolean', 'isServiceProduct');
    }
  }
});

test('customerDemands are populated per business type', () => {
  const snapshot = sim.generateTelemetrySnapshot(START_DAY, 0, 0);
  for (const business of snapshot.businesses) {
    assert.ok(Array.isArray(business.customerDemands), `${business.name} customerDemands array`);
    assert.ok(business.customerDemands.length > 0, `${business.name} customerDemands non-empty`);
  }
});

test('logisticsPlans match LiveLogisticsPlanData', () => {
  const snapshot = sim.generateTelemetrySnapshot(START_DAY, 0, 0);
  assert.ok(snapshot.logisticsPlans.length > 0, 'a logistics plan exists by day 95');
  for (const plan of snapshot.logisticsPlans) {
    assert.strictEqual(typeof plan.assignedEmployeeId, 'string', 'assignedEmployeeId');
    assert.strictEqual(typeof plan.isFactory, 'boolean', 'isFactory');
    assert.ok(typeof plan.targetAddress === 'string' && plan.targetAddress.length > 0, 'targetAddress');
    assert.ok(Array.isArray(plan.destinations) && plan.destinations.length > 0, 'destinations');
    assert.strictEqual(plan.destinationsCount, plan.destinations.length, 'destinationsCount');
    for (const destination of plan.destinations) {
      assert.ok(typeof destination.deliveryTargetAddress === 'string', 'deliveryTargetAddress');
      assert.ok(typeof destination.businessName === 'string', 'businessName');
      assert.ok(Array.isArray(destination.stockTargets), 'stockTargets');
    }
    assert.ok(plan.destinations.some(destination => destination.isExport), 'one export destination');
  }
});

test('warehouse export telemetry is present', () => {
  const snapshot = sim.generateTelemetrySnapshot(START_DAY, 0, 0);
  const warehouse = snapshot.warehouses[0];
  assert.ok(warehouse.machines.length > 0, 'factory machines');
  assert.ok(warehouse.orderHistory.length > 0, 'export order history');
  assert.ok(warehouse.factoryExports.length > 0, 'pending export ledger');
  for (const entry of warehouse.orderHistory) {
    assert.ok(Array.isArray(entry.itemSales) && entry.itemSales.length > 0, 'export itemSales');
  }
  const shift = warehouse.scheduleWeek[0]?.shifts[0];
  assert.ok(shift && snapshot.employees.some(employee => employee.id === shift.employeeId), 'factory shift references a real employee');
});

test('import order lines are unique per warehouse and item', () => {
  const snapshot = sim.generateTelemetrySnapshot(START_DAY, 0, 0);
  for (const partnership of snapshot.importPartnerships) {
    const seen = new Set();
    for (const product of partnership.products || []) {
      const key = `${product.assignedWarehouse}|${product.rawItemName}`;
      assert.ok(!seen.has(key), `duplicate import order line ${key}`);
      seen.add(key);
    }
  }
});

test('investments carry yearlyMarketChanges and developmentHistory', () => {
  const snapshot = sim.generateTelemetrySnapshot(START_DAY, 0, 0);
  assert.ok(snapshot.investments.length > 0, 'investment fund present');
  const fund = snapshot.investments[0];
  assert.ok(Array.isArray(fund.yearlyMarketChanges) && fund.yearlyMarketChanges.length > 0, 'yearlyMarketChanges');
  assert.ok(Array.isArray(fund.developmentHistory) && fund.developmentHistory.length > 1, 'developmentHistory');
  assert.ok(Number.isFinite(fund.currentValue), 'currentValue');
});

test('market trend systems are populated', () => {
  const snapshot = sim.generateTelemetrySnapshot(START_DAY, 0, 0);
  assert.ok(snapshot.marketEvents.length > 0, 'marketEvents');
  assert.ok(snapshot.productMarket.length > 0, 'productMarket');
  assert.ok(snapshot.rivals.length > 0 && snapshot.rivals[0].weeklyIncomeHistory.length > 0, 'rivals');
  assert.ok(snapshot.buildingsForSale.length > 0, 'buildingsForSale');
  assert.ok(snapshot.playerIncomeHistory.length > 1, 'playerIncomeHistory');
  assert.ok(snapshot.playerBusinessCountHistory.length > 1, 'playerBusinessCountHistory');
  assert.ok(snapshot.happinessModifiers.length > 0, 'happinessModifiers');
  assert.ok(snapshot.deliveryContracts.length > 0, 'deliveryContracts');
});

test('snapshots are day-accurate (state is not read from Day 100)', () => {
  const early = sim.generateTelemetrySnapshot(60, 0, 0);
  const late = sim.generateTelemetrySnapshot(95, 0, 0);
  assert.strictEqual(early.gameDay, 60);
  assert.ok(early.totalLoans > 0, 'a loan is still running on day 60');
  assert.ok(early.unpaidTaxes > 0, 'the tax bill is outstanding on day 60');
  assert.ok(late.totalLoans < early.totalLoans, 'the loan is reduced by day 95');
  const finalState = sim.generateTelemetrySnapshot(100, 0, 0);
  assert.strictEqual(finalState.gameDay, 100);
});

test('midnight balances cover every day and tie to cash', () => {
  for (const day of [95, 96, 97, 98, 99, 100]) {
    const snapshot = sim.generateTelemetrySnapshot(day, 0, 0);
    assert.strictEqual(snapshot.midnightBankBalances.length, day, `day ${day} midnight length`);
    const latest = snapshot.midnightBankBalances[snapshot.midnightBankBalances.length - 1];
    assert.strictEqual(snapshot.playerCash, latest, `day ${day} playerCash`);
    assert.strictEqual(snapshot.bankBalance, snapshot.playerCash, `day ${day} bankBalance`);
    assert.strictEqual(snapshot.netWorth, Math.round((snapshot.playerCash - snapshot.totalLoans) * 100) / 100, `day ${day} netWorth`);
  }
});

test('bounded clock cycles Day 95..100 without wall-clock drift', () => {
  const world = { offsetGameMinutes: 0 };
  const start = currentClock(world, 0);
  assert.deepStrictEqual(start, { gameDay: START_DAY, gameHour: 0, gameMinute: 0 });
  world.offsetGameMinutes = 5 * 1440;
  assert.strictEqual(currentClock(world, 0).gameDay, START_DAY + 5);
  world.offsetGameMinutes = DEMO_DAYS * 1440;
  assert.deepStrictEqual(currentClock(world, 0), { gameDay: START_DAY, gameHour: 0, gameMinute: 0 });
  world.offsetGameMinutes = 13 * 1440;
  assert.strictEqual(currentClock(world, 0).gameDay, START_DAY + 1);
  // A different wall-clock reading must not change the answer.
  assert.deepStrictEqual(currentClock(world, 999999), currentClock(world, 0));
});

console.log(process.exitCode ? `\n${passed} tests passed, some FAILED.` : `\nAll ${passed} verification tests passed.`);
