import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  calculateOptimalPrice,
  calculatePriceSatisfaction,
  simulateRetailStore,
  calculateFactoryProduction,
  calculateWorkerSkillFactor,
  calculateDeliveryRoute,
  planStoreEquipment
} from '../dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NORM_DIR = path.resolve(__dirname, '../../data/normalized');

// Load live normalized data for testing
const items = JSON.parse(fs.readFileSync(path.join(NORM_DIR, 'items.json'), 'utf8'));
const businesses = JSON.parse(fs.readFileSync(path.join(NORM_DIR, 'businesses.json'), 'utf8'));
const recipes = JSON.parse(fs.readFileSync(path.join(NORM_DIR, 'recipes.json'), 'utf8'));
const buildings = JSON.parse(fs.readFileSync(path.join(NORM_DIR, 'buildings.json'), 'utf8'));
const neighborhoods = JSON.parse(fs.readFileSync(path.join(NORM_DIR, 'neighborhoods.json'), 'utf8'));

test('Pricing Engine: calculates optimal price and ceiling with monopoly bonus', () => {
  const cigar = items.find(i => i.id === 'cigar');
  const midtown = neighborhoods.find(n => n.id === 'midtown');
  assert.ok(cigar, 'Cigar item should exist');
  assert.ok(midtown, 'Midtown neighborhood should exist');

  const baseResult = calculateOptimalPrice({
    item: cigar,
    neighborhood: midtown,
    hasMonopoly: false
  });

  assert.ok(baseResult.optimalPrice > cigar.financials.wholesale_price, 'Optimal price must exceed wholesale');
  assert.ok(baseResult.maxCeilingPrice > baseResult.optimalPrice, 'Ceiling must exceed optimal');

  // Test Monopoly bonus
  const monopolyResult = calculateOptimalPrice({
    item: cigar,
    neighborhood: midtown,
    hasMonopoly: true
  });

  assert.ok(monopolyResult.optimalPrice > baseResult.optimalPrice, 'Monopoly price must exceed non-monopoly price');
  assert.equal(monopolyResult.monopolyApplied, true);

  // Test price satisfaction drop
  const sat100 = calculatePriceSatisfaction(baseResult.optimalPrice, baseResult.optimalPrice, baseResult.maxCeilingPrice);
  assert.equal(sat100, 100);

  const satOver = calculatePriceSatisfaction(baseResult.maxCeilingPrice * 1.2, baseResult.optimalPrice, baseResult.maxCeilingPrice);
  assert.ok(satOver < 60, 'Satisfaction should drop sharply when pricing beyond ceiling');
});

test('Retail Simulator: simulates store traffic and solves optimal opening hours', () => {
  const coffeeShop = businesses.find(b => b.id === 'coffeeshop');
  const midtownBuilding = buildings.find(b => b.neighborhood_id === 'midtown' && b.building_type === 'retail');
  const midtown = neighborhoods.find(n => n.id === 'midtown');

  assert.ok(coffeeShop, 'Coffee Shop business should exist');
  assert.ok(midtownBuilding, 'Midtown retail building should exist');

  const simResult = simulateRetailStore({
    business: coffeeShop,
    building: midtownBuilding,
    neighborhood: midtown,
    marketingPct: 100,
    employeeHourlyWage: 18.0,
    averageBasketValue: 12.0
  });

  assert.equal(simResult.hourlyDetails.length, 24, 'Must simulate all 24 hours');
  assert.ok(simResult.totalDailyCustomers > 0, 'Must generate daily customers');
  assert.ok(simResult.optimalOpeningWindow.optimizedDailyProfit >= simResult.totalDailyNetProfit, 
    'Optimized opening window must yield equal or higher profit than 24/7 operations');
  
  console.log(`\n  [Sim Result] ${simResult.businessName} @ ${simResult.buildingAddress}`);
  console.log(`  24/7 Daily Net Profit: $${simResult.totalDailyNetProfit.toFixed(2)}`);
  console.log(`  Optimal Hours (${simResult.optimalOpeningWindow.windowFormatted}) Daily Net Profit: $${simResult.optimalOpeningWindow.optimizedDailyProfit.toFixed(2)} (+${simResult.optimalOpeningWindow.profitGainVs24_7.toFixed(2)})`);
});

test('Factory Optimizer: verifies worker skill scaling formula and recipe profits', () => {
  assert.equal(calculateWorkerSkillFactor(0), 0.50);
  assert.equal(calculateWorkerSkillFactor(50), 0.75);
  assert.equal(calculateWorkerSkillFactor(100), 1.00);

  const jewelryRecipe = recipes.find(r => r.name.includes('Jewelry (Expensive)'));
  assert.ok(jewelryRecipe, 'Expensive jewelry recipe should exist');

  const prodResult = calculateFactoryProduction({
    recipe: jewelryRecipe,
    workerSkillPct: 100,
    workerHourlyWage: 25.0,
    workstationsCount: 2
  });

  assert.ok(prodResult.batchGrossProfit > 0, 'Batch gross profit must be positive');
  assert.ok(prodResult.dailyProduction.netProfit > 0, 'Daily net profit must be positive');
  assert.ok(prodResult.requiredMachines.length > 0, 'Must require machines');

  console.log(`\n  [Factory Result] ${prodResult.recipeName}`);
  console.log(`  Batch Cost: $${prodResult.batchIngredientCost.toFixed(2)} -> Revenue: $${prodResult.batchGrossRevenue.toFixed(2)} (Gross Profit: $${prodResult.batchGrossProfit.toFixed(2)})`);
  console.log(`  24h Net Profit (2 workstations): $${prodResult.dailyProduction.netProfit.toFixed(2)}`);
});

test('Logistics & Fleet: calculates delivery trips and labor costs', () => {
  const vanDelivery = calculateDeliveryRoute({
    vehicleType: 'Van',
    boxesToDeliver: 48,
    tripDurationMinutes: 25,
    driverHourlyWage: 20.0
  });

  assert.equal(vanDelivery.tripsRequired, 3); // 48 / 16 = 3 trips
  assert.ok(vanDelivery.totalDriverLaborCost > 0);
  assert.ok(vanDelivery.costPerBoxDelivered > 0);
});

test('Store Equipment Planner: calculates registers and shopping baskets', () => {
  const supermarket = businesses.find(b => b.id === 'supermarket');
  assert.ok(supermarket);

  const equipPlan = planStoreEquipment({
    business: supermarket,
    targetDailyCustomers: 300,
    openHoursCount: 12
  });

  assert.ok(equipPlan.recommendedRegisters >= 1);
  assert.ok(equipPlan.recommendedShoppingBaskets >= 1);
  assert.ok(equipPlan.equipmentRecommendations.length >= 2);
});
