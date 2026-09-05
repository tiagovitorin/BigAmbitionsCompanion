export interface PriceOptimizationInput {
  item: any;
  neighborhood: any;
  hasMonopoly?: boolean;
  lowestRivalPrice?: number;
  customerSatisfaction?: number;
}

export interface PriceOptimizationResult {
  itemName: string;
  wholesalePrice: number;
  baseMarketPrice: number;
  optimalPrice: number;
  maxCeilingPrice: number;
  profitPerUnit: number;
  marginPct: number;
  monopolyApplied: boolean;
  notes: string[];
}

export function calculateOptimalPrice(input: PriceOptimizationInput): PriceOptimizationResult {
  const { item, neighborhood, hasMonopoly = false } = input;
  const basePrice = item.financials.default_market_price;
  const wholesale = item.financials.wholesale_price;

  const notes: string[] = [];

  const workingPct = neighborhood.demographics.working_class_pct / 100;
  const middlePct = neighborhood.demographics.middle_class_pct / 100;
  const upperPct = neighborhood.demographics.upper_class_pct / 100;

  const demoMultiplier = (workingPct * 0.9) + (middlePct * 1.1) + (upperPct * 1.4);
  const monopolyBonus = hasMonopoly ? 0.30 : 0.0;

  if (hasMonopoly) {
    notes.push('Active Monopoly bonus (+30% price tolerance applied)');
  }

  let optimalMultiplier = demoMultiplier + monopolyBonus;
  let optimalPrice = Math.round((basePrice * optimalMultiplier) * 100) / 100;

  let maxCeilingMultiplier = demoMultiplier * 1.25 + monopolyBonus;
  let maxCeilingPrice = Math.round((basePrice * maxCeilingMultiplier) * 100) / 100;

  if (optimalPrice < wholesale) {
    optimalPrice = Math.round((wholesale * 1.05) * 100) / 100;
    notes.push('Price floor applied to prevent selling below wholesale');
  }

  // Ensure price ceiling is always greater than or equal to optimal price
  if (maxCeilingPrice < optimalPrice) {
    maxCeilingPrice = optimalPrice;
  }

  const profitPerUnit = Math.round((optimalPrice - wholesale) * 100) / 100;
  const marginPct = wholesale > 0 ? Math.round(((profitPerUnit / optimalPrice) * 100) * 10) / 10 : 100;

  return {
    itemName: item.name,
    wholesalePrice: wholesale,
    baseMarketPrice: basePrice,
    optimalPrice,
    maxCeilingPrice,
    profitPerUnit,
    marginPct,
    monopolyApplied: hasMonopoly,
    notes,
  };
}

export function calculateWorkerSkillFactor(skillPct: number): number {
  const clampedSkill = Math.max(0, Math.min(100, skillPct));
  return 0.5 + (clampedSkill / 200); // 0% -> 0.5x yield, 100% -> 1.0x yield
}

export function calculateScaledBatchOutput(baseAmount: number, skillPct: number): number {
  const factor = calculateWorkerSkillFactor(skillPct);
  return Math.round(baseAmount * factor);
}

export interface FactoryProductionInput {
  recipe: any;
  workerSkillPct?: number;
  workerHourlyWage?: number;
  batchesPerHour?: number;
  workstationsCount?: number;
}

export function calculateFactoryProduction(input: FactoryProductionInput) {
  const {
    recipe,
    workerSkillPct = 100,
    workerHourlyWage = 25.0,
    batchesPerHour = 1.0,
    workstationsCount = 1,
  } = input;

  const clampedSkill = Math.max(0, Math.min(100, workerSkillPct));
  const skillFactor = calculateWorkerSkillFactor(clampedSkill);
  
  // Support both raw recipes.json (recipe.output) and normalized (recipe.outputs)
  const baseOutputAmount = (recipe as any).output?.base_amount ?? (recipe as any).outputs?.[0]?.amount ?? 1;
  const maxSkilledAmount = (recipe as any).output?.max_skilled_amount ?? (baseOutputAmount * 2);
  
  // Authoritative linear interpolation between base output (50% yield) and max skilled output (100% yield)
  const outputUnitsPerBatch = Math.round(baseOutputAmount + (maxSkilledAmount - baseOutputAmount) * (clampedSkill / 100));

  const batchIngredientCost = (recipe as any).economics?.ingredient_cost_per_batch ?? (recipe as any).total_ingredient_cost ?? 0;
  const unitCost = outputUnitsPerBatch > 0 ? Math.round((batchIngredientCost / outputUnitsPerBatch) * 100) / 100 : 0;
  const unitMarketPrice = (recipe as any).output?.unit_market_price ?? (recipe as any).output_market_price ?? 0;

  const batchGrossRevenue = Math.round(outputUnitsPerBatch * unitMarketPrice * 100) / 100;
  const batchGrossProfit = Math.round((batchGrossRevenue - batchIngredientCost) * 100) / 100;

  const batchesPerDay = batchesPerHour * 24 * workstationsCount;
  const unitsPerDay = outputUnitsPerBatch * batchesPerDay;
  const dailyIngredientCost = batchIngredientCost * batchesPerDay;
  const dailyWageCost = workerHourlyWage * 24 * workstationsCount;
  const dailyGrossRevenue = unitsPerDay * unitMarketPrice;
  const dailyNetProfit = dailyGrossRevenue - dailyIngredientCost - dailyWageCost;

  return {
    recipeName: recipe.name,
    outputItemName: recipe.output_item_name,
    outputPerBatch: outputUnitsPerBatch,
    workerSkillFactor: skillFactor,
    unitCost,
    unitMarketPrice,
    batchIngredientCost,
    batchGrossRevenue,
    batchGrossProfit,
    hourlyProduction: {
      unitsProduced: outputUnitsPerBatch * batchesPerHour * workstationsCount,
      totalIngredientCost: batchIngredientCost * batchesPerHour * workstationsCount,
      totalWageCost: workerHourlyWage * workstationsCount,
      grossRevenue: outputUnitsPerBatch * batchesPerHour * workstationsCount * unitMarketPrice,
      netProfit: (outputUnitsPerBatch * batchesPerHour * workstationsCount * unitMarketPrice) - (batchIngredientCost * batchesPerHour * workstationsCount) - (workerHourlyWage * workstationsCount),
    },
    dailyProduction: {
      unitsProduced: unitsPerDay,
      totalIngredientCost: dailyIngredientCost,
      totalWageCost: dailyWageCost,
      grossRevenue: dailyGrossRevenue,
      netProfit: dailyNetProfit,
    },
    requiredMachines: recipe.workstations || [],
  };
}
