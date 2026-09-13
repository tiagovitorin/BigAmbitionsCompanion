// Authoritative production model for Live HQ.
//
// Every production number shown in the UI must come from these functions. The formulas
// are verified against the game's decompiled simulation (see the Phase 0 report and the
// Phase 1 spec). Do not recompute output/cost/demand in components.
//
// Key rules:
// - Production ticks once per in-game hour. output.amount is the per-hour batch at 100% skill.
// - Skill scales output only: skillFactor = (skill/2 + 50)/100 (0.5 at 0%, 1.0 at 100%).
// - Ingredients do NOT scale with skill; a 0% worker consumes a full batch for half the goods.
// - recipes.json base_amount == max_skilled_amount == output.amount. Never use base_amount as 0%.
// - recipes.json economics.* is derived from the flawed base_amount; never use it here.

import rawRecipes from '@/data/recipes.json';
import rawWorkstations from '@/data/workstations.json';
import rawItems from '@/data/items.json';
import {
  LiveBusinessData,
  LiveWarehouseData,
  LiveEmployeeData,
  LiveScheduleDay,
  LiveBusinessOrderHistoryEntry,
  LiveImportPartnershipData,
  LiveDeliveryContractData,
  LiveLogisticsPlanData
} from '@/context/LiveSyncContext';
import { FactorySite, collectFactorySites } from './production';
import { getWholesaleUnitPrice } from './products';
import { DAYS_ORDER } from './schedule';

const HOURS_PER_WEEK = 168;

export interface RecipeIngredientDef {
  rawId: string;
  name: string;
  amount: number;
  unitWholesale: number;
}

export interface RecipeDef {
  id: string;
  name: string;
  outputRawId: string;
  outputName: string;
  amount: number;
  marketPrice: number;
  ingredients: RecipeIngredientDef[];
}

const RECIPES: RecipeDef[] = (rawRecipes as unknown as any[]).map(recipe => ({
  id: recipe.id,
  name: recipe.name,
  outputRawId: recipe.output?.raw_id ?? '',
  outputName: recipe.output?.name || recipe.name,
  amount: recipe.output?.max_skilled_amount ?? recipe.output?.base_amount ?? 0,
  marketPrice: recipe.output?.unit_market_price ?? 0,
  ingredients: (recipe.ingredients || []).map((ing: any) => ({
    rawId: ing.raw_id,
    name: ing.name,
    amount: ing.amount || 0,
    unitWholesale: ing.unit_wholesale_price || 0
  }))
}));

const RECIPE_BY_ID = new Map<string, RecipeDef>(RECIPES.map(recipe => [recipe.id, recipe]));

const SUPPORTED_OUTPUTS = new Map<string, string[]>();
(rawWorkstations as unknown as any[]).forEach(workstation => {
  SUPPORTED_OUTPUTS.set(workstation.workstationType, workstation.supportedOutputItems || []);
});

// Box size per product, used for pallet storage math (from the game's retail properties).
const BOX_SIZE = new Map<string, number>();
(rawItems as unknown as any[]).forEach(item => {
  const boxSize = item.retail_properties?.box_size;
  if (item.raw_id && typeof boxSize === 'number' && boxSize > 0) BOX_SIZE.set(item.raw_id, boxSize);
});

export function boxSizeFor(rawId: string): number {
  return BOX_SIZE.get(rawId) || 1;
}

// Recipes a given workstation class can run, from the workstation's supported output items.
export function candidateRecipesFor(workstationType: string): RecipeDef[] {
  const allowed = new Set(SUPPORTED_OUTPUTS.get(workstationType) || []);
  return RECIPES.filter(recipe => allowed.has(recipe.outputRawId));
}

export function recipeById(id: string): RecipeDef | undefined {
  return RECIPE_BY_ID.get(id);
}

function clampSkill(skill: number): number {
  return Math.max(0, Math.min(100, skill));
}

function skillFactor(skill: number): number {
  return (clampSkill(skill) / 2 + 50) / 100;
}

function wholesaleFor(ingredient: RecipeIngredientDef): number {
  return ingredient.unitWholesale || getWholesaleUnitPrice(ingredient.rawId) || 0;
}

export interface ProductionContext {
  businesses: LiveBusinessData[];
  warehouses: LiveWarehouseData[];
  employees: LiveEmployeeData[];
  gameDay: number;
  gameHour: number;
  importPartnerships?: LiveImportPartnershipData[];
  deliveryContracts?: LiveDeliveryContractData[];
  logisticsPlans?: LiveLogisticsPlanData[];
}

export interface LineIngredient {
  rawId: string;
  name: string;
  perHour: number;
  perDay: number;
  perWeek: number;
  unitWholesale: number;
  costPerDay: number;
}

export interface LineModel {
  key: string;
  workstationType: string;
  recipeId: string;
  recipeName: string | null;
  outputRawId: string | null;
  outputName: string | null;
  machines: string[];
  machineCount: number;
  outputPerMachineHour: number;
  outputPerHourNow: number;
  dailyOutput: number;
  weeklyOutput: number;
  staffedHoursPerWeek: number;
  fullHoursPerWeek: number;
  staffedShare: number;
  cappedMachines: number;
  produceUpToValue: number | null;
  incompleteMachines: number;
  laborCostPerDay: number;
  ingredients: LineIngredient[];
  fullyBurdenedUnitCost: number | null;
  warnings: string[];
}

export interface SiteIngredientRow {
  rawId: string;
  name: string;
  perDay: number;
  hourlyBurn: number;
  onHand: number;
  unitWholesale: number;
  costPerDay: number;
  starvationHours: number | null;
  // Ordering guidance (Phase 3).
  nextInboundDay: number | null;
  nextInboundAmount: number | null;
  nextInboundSource: string | null;
  suggestedOrderUnits: number;
  logisticsGapHours: number | null;
}

export interface SiteModel {
  site: FactorySite;
  lines: LineModel[];
  machineCount: number;
  lineCount: number;
  staffedShare: number;
  dailyOutputByProduct: Record<string, number>;
  ingredients: SiteIngredientRow[];
  feedCostPerDay: number;
  grossValuePerDay: number;
  laborCostPerDay: number;
  rentPerDay: number;
  contributionPerDay: number;
  // Exact pallet storage when the mod provides rack capacity; null otherwise.
  storage: SiteStorage | null;
  sqm: number | null;
  grossPerSqm: number | null;
  warnings: string[];
}

export interface SiteStorage {
  capacityBoxes: number;
  usedBoxes: number;
  freeBoxes: number;
  occupancy: number;
  netBoxesPerHour: number;
  gridlockHours: number | null;
}

function employeeSkill(employeesById: Map<string, LiveEmployeeData>, employeeId: string | undefined): number {
  if (!employeeId) return 100;
  const employee = employeesById.get(employeeId);
  return employee?.skillLevel ?? 100;
}

function siteOnHand(site: FactorySite, ctx: ProductionContext): Map<string, number> {
  const onHand = new Map<string, number>();
  if (site.kind === 'warehouse') {
    const warehouse = ctx.warehouses.find(w => w.id === site.id);
    (warehouse?.stock || []).forEach(item => {
      onHand.set(item.rawItemName, (onHand.get(item.rawItemName) || 0) + (item.units ?? item.quantity));
    });
  } else {
    const business = ctx.businesses.find(b => b.id === site.id);
    (business?.inventory || []).forEach(item => {
      onHand.set(item.rawItemName, (onHand.get(item.rawItemName) || 0) + item.quantity);
    });
  }
  return onHand;
}

function siteRentPerDay(site: FactorySite, ctx: ProductionContext): number {
  if (site.kind === 'warehouse') {
    return ctx.warehouses.find(w => w.id === site.id)?.rentPerDay ?? 0;
  }
  const business = ctx.businesses.find(b => b.id === site.id);
  return business?.weeklyRent != null ? business.weeklyRent / 7 : 0;
}

interface LineAccumulator {
  workstationType: string;
  recipeId: string;
  machineIds: string[];
  staffedHours: number;
  weightedHours: number;
  nowWeighted: number;
  laborCostWeek: number;
  ingredientWeeklyDraw: Map<string, number>;
}

export function buildSiteModel(site: FactorySite, ctx: ProductionContext): SiteModel {
  const employeesById = new Map(ctx.employees.map(e => [e.id, e]));
  const accumulators = new Map<string, LineAccumulator>();
  const machineToLine = new Map<string, string>();
  const machineById = new Map((site.machines || []).map(machine => [machine.id, machine]));

  for (const machine of site.machines || []) {
    if (!machine.workstationType || !machine.selectedRecipeId) continue;
    const key = `${machine.workstationType}|${machine.selectedRecipeId}`;
    const accumulator = accumulators.get(key) || {
      workstationType: machine.workstationType,
      recipeId: machine.selectedRecipeId,
      machineIds: [],
      staffedHours: 0,
      weightedHours: 0,
      nowWeighted: 0,
      laborCostWeek: 0,
      ingredientWeeklyDraw: new Map<string, number>()
    };
    accumulator.machineIds.push(machine.id);
    accumulators.set(key, accumulator);
    machineToLine.set(machine.id, key);
  }

  const schedule: LiveScheduleDay[] = site.scheduleWeek || [];
  const currentDow = (((ctx.gameDay - 1) % 7) + 7) % 7;
  const currentDayName = DAYS_ORDER[currentDow]?.toLowerCase();
  for (let dayIndex = 0; dayIndex < schedule.length; dayIndex++) {
    const day = schedule[dayIndex];
    const scheduleDayName = (day.day || '').toLowerCase();
    // "Now" only counts the current game day of the week; weekly totals still sum every day.
    const isCurrentDay = scheduleDayName ? scheduleDayName === currentDayName : dayIndex === currentDow;
    for (const shift of day.shifts || []) {
      if (shift.shiftType === 0) continue;
      const key = shift.itemInstanceId ? machineToLine.get(shift.itemInstanceId) : undefined;
      if (!key) continue;
      const hours = Math.max(0, (shift.endHour ?? 0) - (shift.startHour ?? 0));
      if (hours === 0) continue;

      const accumulator = accumulators.get(key)!;
      const skill = employeeSkill(employeesById, shift.employeeId);
      const factor = skillFactor(skill);

      accumulator.staffedHours += hours;
      accumulator.weightedHours += hours * factor;
      accumulator.laborCostWeek += hours * (employeesById.get(shift.employeeId)?.wage ?? 0);

      if (isCurrentDay && ctx.gameHour >= (shift.startHour ?? 0) && ctx.gameHour < (shift.endHour ?? 0)) {
        accumulator.nowWeighted += factor;
      }

      const recipe = RECIPE_BY_ID.get(accumulator.recipeId);
      recipe?.ingredients.forEach(ingredient => {
        accumulator.ingredientWeeklyDraw.set(
          ingredient.rawId,
          (accumulator.ingredientWeeklyDraw.get(ingredient.rawId) || 0) + hours * ingredient.amount
        );
      });
    }
  }

  const rentPerDay = siteRentPerDay(site, ctx);
  const machineCount = [...accumulators.values()].reduce((sum, a) => sum + a.machineIds.length, 0);
  const lines: LineModel[] = [];
  const ingredientAgg = new Map<string, { name: string; perDay: number; unitWholesale: number }>();
  let feedCostPerDay = 0;
  let grossValuePerDay = 0;
  let laborCostPerDay = 0;

  for (const [key, accumulator] of accumulators) {
    const recipe = RECIPE_BY_ID.get(accumulator.recipeId);
    const weeklyOutput = recipe ? recipe.amount * accumulator.weightedHours : 0;
    const dailyOutput = weeklyOutput / 7;
    const outputPerMachineHour = recipe?.amount ?? 0;
    const nowOutput = recipe ? recipe.amount * accumulator.nowWeighted : 0;
    const fullHoursWeek = accumulator.machineIds.length * HOURS_PER_WEEK;
    const laborCostDay = accumulator.laborCostWeek / 7;

    const ingredients: LineIngredient[] = [];
    for (const [rawId, weeklyDraw] of accumulator.ingredientWeeklyDraw) {
      const def = recipe?.ingredients.find(i => i.rawId === rawId);
      const unitWholesale = def ? wholesaleFor(def) : (getWholesaleUnitPrice(rawId) || 0);
      const perDay = weeklyDraw / 7;
      ingredients.push({
        rawId,
        name: def?.name || rawId,
        perHour: perDay / 24,
        perDay,
        perWeek: weeklyDraw,
        unitWholesale,
        costPerDay: perDay * unitWholesale
      });

      const agg = ingredientAgg.get(rawId) || { name: def?.name || rawId, perDay: 0, unitWholesale };
      agg.perDay += perDay;
      ingredientAgg.set(rawId, agg);
    }
    ingredients.sort((a, b) => b.costPerDay - a.costPerDay);

    const lineFeed = ingredients.reduce((sum, ing) => sum + ing.costPerDay, 0);
    feedCostPerDay += lineFeed;
    laborCostPerDay += laborCostDay;
    if (recipe) grossValuePerDay += dailyOutput * recipe.marketPrice;

    const lineRent = machineCount > 0 ? rentPerDay * (accumulator.machineIds.length / machineCount) : 0;
    const fullyBurdenedUnitCost = dailyOutput > 0
      ? (lineFeed + laborCostDay + lineRent) / dailyOutput
      : null;

    const cappedMachines = accumulator.machineIds.filter(id => machineById.get(id)?.produceUpTo).length;
    const incompleteMachines = accumulator.machineIds.filter(id => machineById.get(id)?.isValid === false).length;
    const produceUpToValue = accumulator.machineIds
      .map(id => machineById.get(id))
      .find(machine => machine?.produceUpTo && machine.produceUpToValue)
      ?.produceUpToValue ?? null;

    const warnings: string[] = [];
    if (accumulator.staffedHours < fullHoursWeek) warnings.push('understaffed');
    if (!recipe) warnings.push('unknown-recipe');
    if (incompleteMachines > 0) warnings.push('incomplete-station');

    lines.push({
      key,
      workstationType: accumulator.workstationType,
      recipeId: accumulator.recipeId,
      recipeName: recipe?.name ?? null,
      outputRawId: recipe?.outputRawId ?? null,
      outputName: recipe?.outputName ?? null,
      machines: accumulator.machineIds,
      machineCount: accumulator.machineIds.length,
      outputPerMachineHour,
      outputPerHourNow: nowOutput,
      dailyOutput,
      weeklyOutput,
      staffedHoursPerWeek: accumulator.staffedHours,
      fullHoursPerWeek: fullHoursWeek,
      staffedShare: fullHoursWeek > 0 ? accumulator.staffedHours / fullHoursWeek : 0,
      cappedMachines,
      produceUpToValue,
      incompleteMachines,
      laborCostPerDay: laborCostDay,
      ingredients,
      fullyBurdenedUnitCost,
      warnings
    });
  }

  lines.sort((a, b) => b.machineCount - a.machineCount || (a.outputName || '').localeCompare(b.outputName || ''));

  const onHand = siteOnHand(site, ctx);
  const inbound = nextInboundByIngredient(site, ctx);
  const ingredients: SiteIngredientRow[] = [...ingredientAgg.entries()].map(([rawId, agg]) => {
    const perDay = agg.perDay;
    const hourlyBurn = perDay / 24;
    const stock = onHand.get(rawId) || 0;
    const starvationHours = hourlyBurn > 0 ? stock / hourlyBurn : null;

    const shipment = inbound.get(rawId);
    const leadDays = shipment ? Math.max(0, shipment.nextDay - ctx.gameDay) : null;
    // Order enough to cover the lead time plus a small safety buffer.
    const coverDays = (leadDays ?? 7) + 3;
    const suggestedOrderUnits = perDay > 0 ? Math.max(0, Math.round(perDay * coverDays - stock)) : 0;
    const logisticsGapHours = shipment && starvationHours != null && leadDays != null
      ? leadDays * 24 - starvationHours
      : null;

    return {
      rawId,
      name: agg.name,
      perDay,
      hourlyBurn,
      onHand: stock,
      unitWholesale: agg.unitWholesale,
      costPerDay: perDay * agg.unitWholesale,
      starvationHours,
      nextInboundDay: shipment ? shipment.nextDay : null,
      nextInboundAmount: shipment ? shipment.amount : null,
      nextInboundSource: shipment ? shipment.source : null,
      suggestedOrderUnits,
      logisticsGapHours
    };
  }).sort((a, b) => (a.starvationHours ?? Infinity) - (b.starvationHours ?? Infinity));

  const dailyOutputByProduct: Record<string, number> = {};
  for (const line of lines) {
    if (!line.outputRawId) continue;
    dailyOutputByProduct[line.outputRawId] = (dailyOutputByProduct[line.outputRawId] || 0) + line.dailyOutput;
  }

  const staffedHours = lines.reduce((sum, line) => sum + line.staffedHoursPerWeek, 0);
  const fullHours = lines.reduce((sum, line) => sum + line.fullHoursPerWeek, 0);

  const warehouseData = site.kind === 'warehouse' ? ctx.warehouses.find(w => w.id === site.id) : undefined;
  const capacityBoxes = warehouseData?.storageCapacityBoxes ?? 0;
  const stockBoxes = (warehouseData?.stock || []).reduce((sum, item) => sum + (item.boxes || 0), 0);
  const usedBoxes = warehouseData?.storageUsedBoxes ?? stockBoxes;
  let storage: SiteStorage | null = null;
  if (capacityBoxes > 0) {
    const producedBoxesPerHour = lines.reduce((sum, line) => (
      line.outputRawId && line.dailyOutput > 0 ? sum + line.dailyOutput / boxSizeFor(line.outputRawId) / 24 : sum
    ), 0);
    const outboundBoxesPerHour = (warehouseData?.stock || []).reduce(
      (sum, item) => sum + item.weeklyConsumption / 7 / 24 / boxSizeFor(item.rawItemName),
      0
    );
    const netBoxesPerHour = producedBoxesPerHour - outboundBoxesPerHour;
    const freeBoxes = Math.max(0, capacityBoxes - usedBoxes);
    storage = {
      capacityBoxes,
      usedBoxes,
      freeBoxes,
      occupancy: capacityBoxes > 0 ? usedBoxes / capacityBoxes : 0,
      netBoxesPerHour,
      gridlockHours: netBoxesPerHour > 0.01 ? freeBoxes / netBoxesPerHour : null
    };
  }
  const sqm = warehouseData?.sqm ?? null;
  const grossPerSqm = sqm && sqm > 0 ? grossValuePerDay / sqm : null;

  const warnings: string[] = [];
  if (ingredients.some(ing => ing.starvationHours != null && ing.starvationHours < 24)) warnings.push('feed-starvation');
  if (lines.some(line => line.warnings.includes('unknown-recipe'))) warnings.push('unknown-recipe');
  if (lines.some(line => line.warnings.includes('incomplete-station'))) warnings.push('incomplete-station');
  if (storage && storage.gridlockHours != null && storage.gridlockHours < 12) warnings.push('storage-gridlock');

  return {
    site,
    lines,
    machineCount,
    lineCount: lines.length,
    staffedShare: fullHours > 0 ? staffedHours / fullHours : 0,
    dailyOutputByProduct,
    ingredients,
    feedCostPerDay,
    grossValuePerDay,
    laborCostPerDay,
    rentPerDay,
    contributionPerDay: grossValuePerDay - feedCostPerDay - laborCostPerDay - rentPerDay,
    storage,
    sqm,
    grossPerSqm,
    warnings
  };
}

export interface OpportunityCost {
  recipeId: string;
  recipeName: string;
  dailyDelta: number;
}

// Best alternative recipe for this line's workstation, at 100% skill. Gross retail value
// minus wholesale inputs, not net profit (excludes labor, rent, demand caps).
export function opportunityCost(line: LineModel): OpportunityCost | null {
  const current = recipeById(line.recipeId);
  if (!current) return null;
  const grossPerHour = (recipe: RecipeDef) =>
    recipe.amount * recipe.marketPrice - recipe.ingredients.reduce((sum, ing) => sum + ing.amount * wholesaleFor(ing), 0);
  const currentGross = grossPerHour(current);
  // staffedHoursPerWeek is already the line's total machine-hours across all machines,
  // so per-day machine-hours is simply weekly/7 (do not multiply by machine count again).
  const machineHoursPerDay = line.staffedHoursPerWeek / 7;

  let best: OpportunityCost | null = null;
  for (const candidate of candidateRecipesFor(line.workstationType)) {
    if (candidate.id === current.id) continue;
    const delta = grossPerHour(candidate) - currentGross;
    if (delta <= 0) continue;
    const dailyDelta = delta * machineHoursPerDay;
    if (!best || dailyDelta > best.dailyDelta) {
      best = { recipeId: candidate.id, recipeName: candidate.name, dailyDelta };
    }
  }
  return best;
}

export interface DemandRow {
  rawId: string;
  name: string;
  dailyProduction: number;
  internalDraw: number;
  netProduction: number;
  retailDrain: number;
  exportDrain: number;
  // True when one day of exports in the window dominated the rest (a bulk
  // shipment); the reported exportDrain has that day removed.
  exportBulk: boolean;
  // True when the site makes this product but nothing sells or exports it (no channel).
  unrouted: boolean;
  disposition: number;
  demandRatio: number | null;
  finishedStock: number;
  runwayDays: number | null;
  // Suggested warehouse cap (produce-up-to) to hold this many days of retail sales.
  suggestedProduceCap: number | null;
}

// Average daily units per product over the last 7 completed days (current day excluded),
// across retail store order histories. Retail is a steady daily channel, so a fixed
// window mean is appropriate here (exports use exportDrainByProduct instead).
function drainByProduct(histories: (LiveBusinessOrderHistoryEntry[] | undefined)[], gameDay: number): Map<string, number> {
  const totals = new Map<string, number>();
  const windowStart = gameDay - 7;
  const windowEnd = gameDay - 1;
  for (const history of histories) {
    for (const entry of history || []) {
      if (entry.dayNumber < windowStart || entry.dayNumber > windowEnd) continue;
      for (const sale of entry.itemSales || []) {
        const rawId = sale.rawItemName || sale.itemName;
        if (!rawId) continue;
        totals.set(rawId, (totals.get(rawId) || 0) + sale.amountSold);
      }
    }
  }

  const drains = new Map<string, number>();
  for (const [rawId, total] of totals) drains.set(rawId, total / 7);
  return drains;
}

export interface ExportDrain {
  perDay: number;
  bulk: boolean;
}

// Warehouses export in irregular batches: goods pile up and then ship in one large
// movement. A plain window mean lets a single liquidation day dominate the "ongoing"
// export rate (e.g. 900k one day, 341k the next, then nothing), which collapses the
// runway and flags healthy factories as below demand. So we average over the full
// retained history and drop the single largest day, and flag the product when one day
// clearly outweighs the rest.
function exportDrainByProduct(histories: (LiveBusinessOrderHistoryEntry[] | undefined)[], gameDay: number): Map<string, ExportDrain> {
  const perDayUnits = new Map<string, Map<number, number>>();
  let minDay = Infinity;
  let maxDay = -Infinity;
  for (const history of histories) {
    for (const entry of history || []) {
      if (entry.dayNumber == null || entry.dayNumber >= gameDay) continue;
      if (entry.dayNumber < minDay) minDay = entry.dayNumber;
      if (entry.dayNumber > maxDay) maxDay = entry.dayNumber;
      for (const sale of entry.itemSales || []) {
        const rawId = sale.rawItemName || sale.itemName;
        if (!rawId) continue;
        let days = perDayUnits.get(rawId);
        if (!days) { days = new Map(); perDayUnits.set(rawId, days); }
        days.set(entry.dayNumber, (days.get(entry.dayNumber) || 0) + sale.amountSold);
      }
    }
  }

  const drains = new Map<string, ExportDrain>();
  const span = maxDay >= minDay ? maxDay - minDay + 1 : 0;
  if (span <= 0) return drains;
  for (const [rawId, days] of perDayUnits) {
    const values = [...days.values()];
    const total = values.reduce((sum, value) => sum + value, 0);
    const top = Math.max(...values);
    // Drop the single largest day and average over the remaining window days (span - 1),
    // so the bulk day is excluded from both the numerator and the day count.
    const perDay = (total - top) / Math.max(1, span - 1);
    drains.set(rawId, { perDay, bulk: top > 0 && top >= 3 * Math.max(1, perDay) });
  }
  return drains;
}

export function buildDemandModel(ctx: ProductionContext, siteModels: SiteModel[]): Record<string, DemandRow> {
  const production = new Map<string, number>();
  const internal = new Map<string, number>();
  const names = new Map<string, string>();

  for (const model of siteModels) {
    for (const [rawId, units] of Object.entries(model.dailyOutputByProduct)) {
      production.set(rawId, (production.get(rawId) || 0) + units);
    }
    for (const ingredient of model.ingredients) {
      internal.set(ingredient.rawId, (internal.get(ingredient.rawId) || 0) + ingredient.perDay);
      names.set(ingredient.rawId, ingredient.name);
    }
    for (const line of model.lines) {
      if (line.outputRawId && line.outputName) names.set(line.outputRawId, line.outputName);
    }
  }

  const retailDrain = drainByProduct(ctx.businesses.map(business => business.orderHistory), ctx.gameDay);
  const exportDrains = exportDrainByProduct(ctx.warehouses.map(warehouse => warehouse.orderHistory), ctx.gameDay);
  const stock = new Map<string, number>();
  for (const warehouse of ctx.warehouses) {
    for (const item of warehouse.stock || []) {
      stock.set(item.rawItemName, (stock.get(item.rawItemName) || 0) + (item.units ?? item.quantity));
    }
  }

  const keys = new Set<string>([...production.keys(), ...internal.keys(), ...retailDrain.keys(), ...exportDrains.keys(), ...stock.keys()]);
  const rows: Record<string, DemandRow> = {};
  for (const rawId of keys) {
    const dailyProduction = production.get(rawId) || 0;
    const internalDraw = internal.get(rawId) || 0;
    const netProduction = dailyProduction - internalDraw;
    const retail = retailDrain.get(rawId) || 0;
    const exportInfo = exportDrains.get(rawId);
    const exported = exportInfo?.perDay || 0;
    const disposition = retail + exported;
    // A product nothing sells or exports has no meaningful demand ratio; flag it as
    // unrouted instead of dividing by a fake 1 (which produced absurd multipliers).
    const unrouted = netProduction > 0 && disposition <= 0;
    const finishedStock = stock.get(rawId) || 0;
    rows[rawId] = {
      rawId,
      name: names.get(rawId) || rawId,
      dailyProduction,
      internalDraw,
      netProduction,
      retailDrain: retail,
      exportDrain: exported,
      exportBulk: Boolean(exportInfo?.bulk),
      unrouted,
      disposition,
      demandRatio: netProduction > 0 && disposition > 0 ? netProduction / disposition : null,
      finishedStock,
      runwayDays: disposition > 0 ? finishedStock / disposition : null,
      suggestedProduceCap: disposition > 0 ? Math.round(disposition * 7) : null
    };
  }
  return rows;
}

export interface ChainProducer {
  siteId: string;
  siteName: string;
  perDay: number;
}

export interface ChainConsumer {
  siteId: string;
  siteName: string;
  lineName: string;
  perDay: number;
}

export interface ChainLink {
  rawId: string;
  name: string;
  producers: ChainProducer[];
  consumers: ChainConsumer[];
  totalProduced: number;
  totalConsumed: number;
  netRetailBound: number;
  crossSite: boolean;
}

// Intermediate products: an item that is both produced by one line and consumed by
// another (same site or across sites). This is the multi-tier production chain.
export function buildChainModel(siteModels: SiteModel[]): ChainLink[] {
  const producers = new Map<string, ChainProducer[]>();
  const consumers = new Map<string, ChainConsumer[]>();
  const names = new Map<string, string>();

  for (const model of siteModels) {
    for (const line of model.lines) {
      if (!line.outputRawId) continue;
      names.set(line.outputRawId, line.outputName || line.outputRawId);
      const list = producers.get(line.outputRawId) || [];
      list.push({ siteId: model.site.id, siteName: model.site.name, perDay: line.dailyOutput });
      producers.set(line.outputRawId, list);
    }
    for (const line of model.lines) {
      for (const ingredient of line.ingredients) {
        names.set(ingredient.rawId, ingredient.name);
        const list = consumers.get(ingredient.rawId) || [];
        list.push({
          siteId: model.site.id,
          siteName: model.site.name,
          lineName: line.outputName || line.recipeName || '',
          perDay: ingredient.perDay
        });
        consumers.set(ingredient.rawId, list);
      }
    }
  }

  const links: ChainLink[] = [];
  for (const [rawId, producerList] of producers) {
    const consumerList = consumers.get(rawId);
    if (!consumerList || consumerList.length === 0) continue;

    const totalProduced = producerList.reduce((sum, entry) => sum + entry.perDay, 0);
    const totalConsumed = consumerList.reduce((sum, entry) => sum + entry.perDay, 0);
    const producerSites = new Set(producerList.map(entry => entry.siteId));

    links.push({
      rawId,
      name: names.get(rawId) || rawId,
      producers: producerList,
      consumers: consumerList,
      totalProduced,
      totalConsumed,
      netRetailBound: Math.max(0, totalProduced - totalConsumed),
      crossSite: consumerList.some(entry => !producerSites.has(entry.siteId))
    });
  }

  return links.sort((a, b) => b.totalConsumed - a.totalConsumed);
}

export interface ProductionBundle {
  sites: FactorySite[];
  models: SiteModel[];
  demand: Record<string, DemandRow>;
}

// Build every production site model plus the empire-wide demand model in one shot.
export function buildProduction(ctx: ProductionContext): ProductionBundle {
  const sites = collectFactorySites(ctx.businesses, ctx.warehouses);
  const models = sites.map(site => buildSiteModel(site, ctx));
  return { sites, models, demand: buildDemandModel(ctx, models) };
}

export interface InboundShipment {
  nextDay: number;
  amount: number;
  source: string;
}

// Next scheduled inbound shipment per ingredient (import partnerships and wholesale
// delivery contracts addressed to this site).
export function nextInboundByIngredient(site: FactorySite, ctx: ProductionContext): Map<string, InboundShipment> {
  const result = new Map<string, InboundShipment>();
  const consider = (rawId: string, amount: number, nextDay: number, source: string) => {
    const existing = result.get(rawId);
    if (!existing || nextDay < existing.nextDay) result.set(rawId, { nextDay, amount, source });
  };

  for (const partnership of ctx.importPartnerships || []) {
    if (!partnership.isActive) continue;
    for (const product of partnership.products || []) {
      if (product.assignedWarehouse !== site.address) continue;
      consider(product.rawItemName, product.amount, partnership.nextDeliveryDay, partnership.supplierName || partnership.importAddress);
    }
  }
  for (const contract of ctx.deliveryContracts || []) {
    if (!contract.enabled || contract.businessAddress !== site.address) continue;
    for (const item of contract.items || []) {
      consider(item.rawItemName, item.amount, contract.nextDeliveryDay, contract.supplierName || contract.wholesaleAddress);
    }
  }
  return result;
}

export interface OutboundRoute {
  routeId: string;
  destination: string;
  businessName: string;
  isExport: boolean;
  items: { rawId: string; name: string; target: number }[];
}

export function outboundRoutes(site: FactorySite, ctx: ProductionContext): OutboundRoute[] {
  const routes: OutboundRoute[] = [];
  for (const plan of ctx.logisticsPlans || []) {
    if (plan.targetAddress !== site.address) continue;
    for (const destination of plan.destinations || []) {
      routes.push({
        routeId: plan.id,
        destination: destination.deliveryTargetAddress,
        businessName: destination.businessName || destination.deliveryTargetAddress,
        isExport: Boolean(destination.isExport),
        items: (destination.stockTargets || []).map(target => ({
          rawId: target.rawItemName,
          name: target.itemName,
          target: target.targetAmount
        }))
      });
    }
  }
  return routes;
}

// Compact, token-efficient production briefing for Uncle Fred.
export function buildProductionBriefing(ctx: ProductionContext): string {
  const { models, demand } = buildProduction(ctx);
  if (models.length === 0) return 'No production sites or workstations detected.';

  const totalMachines = models.reduce((sum, model) => sum + model.machineCount, 0);
  const totalLines = models.reduce((sum, model) => sum + model.lineCount, 0);
  const avgStaffed = models.reduce((sum, model) => sum + model.staffedShare, 0) / models.length;
  const out: string[] = [`${models.length} site(s), ${totalLines} line(s), ${totalMachines} machine(s), average ${Math.round(avgStaffed * 100)}% staffed.`];

  const starvation: string[] = [];
  for (const model of models) {
    const worst = model.ingredients
      .filter(ing => ing.starvationHours != null && ing.starvationHours < 48)
      .slice(0, 3)
      .map(ing => `${ing.name} ~${Math.round(ing.starvationHours!)}h`);
    if (worst.length) starvation.push(`${model.site.name}: ${worst.join(', ')}`);
  }
  out.push(starvation.length ? `STARVATION (<48h): ${starvation.join(' | ')}` : 'STARVATION: none under 48h.');

  const incomplete = models.flatMap(model => model.lines
    .filter(line => line.incompleteMachines > 0)
    .map(line => `${model.site.name} ${line.outputName || 'line'} x${line.incompleteMachines}`));
  out.push(incomplete.length ? `INCOMPLETE STATIONS: ${incomplete.join(', ')}` : 'INCOMPLETE STATIONS: none.');

  const storage = models
    .filter(model => model.storage && model.storage.gridlockHours != null && model.storage.gridlockHours < 72)
    .map(model => `${model.site.name} ${Math.round(model.storage!.occupancy * 100)}% full, ~${Math.round(model.storage!.gridlockHours!)}h to full`);
  out.push(storage.length ? `STORAGE PRESSURE: ${storage.join(' | ')}` : 'STORAGE: no site filling within 72h.');

  const over = Object.values(demand)
    .filter(row => row.dailyProduction > 0 && (row.unrouted || (row.demandRatio != null && row.demandRatio > 10)))
    .sort((a, b) => (Number(b.unrouted) - Number(a.unrouted)) || ((b.demandRatio ?? 0) - (a.demandRatio ?? 0)))
    .slice(0, 5)
    .map(row => row.unrouted
      ? `${row.name} NO DEMAND (${Math.round(row.netProduction)}/day made, nothing sold or exported; stop it or route an export)`
      : `${row.name} ${row.demandRatio!.toFixed(1)}x (${Math.round(row.netProduction)}/day made vs ${Math.round(row.disposition)}/day sold+exported; suggested cap ~${row.suggestedProduceCap ?? 0})`);
  out.push(over.length ? `OVERPRODUCING (exports already counted): ${over.join(' | ')}` : 'OVERPRODUCING: none.');

  const opportunities: string[] = [];
  for (const model of models) {
    let best: { line: LineModel; opp: OpportunityCost } | null = null;
    for (const line of model.lines) {
      const opp = opportunityCost(line);
      if (opp && (!best || opp.dailyDelta > best.opp.dailyDelta)) best = { line, opp };
    }
    if (best) opportunities.push(`${model.site.name} ${best.line.outputName} -> ${best.opp.recipeName} +$${Math.round(best.opp.dailyDelta / 1000)}k/day gross`);
  }
  out.push(opportunities.length ? `RECIPE OPPORTUNITIES: ${opportunities.join(' | ')}` : 'RECIPE OPPORTUNITIES: none.');

  const exportRoutes = models.flatMap(model => outboundRoutes(model.site, ctx).filter(route => route.isExport).map(() => model.site.name));
  out.push(exportRoutes.length ? `EXPORT ROUTES: ${exportRoutes.length} active to the Import/Export harbor.` : 'EXPORT ROUTES: none.');

  return out.join('\n');
}
