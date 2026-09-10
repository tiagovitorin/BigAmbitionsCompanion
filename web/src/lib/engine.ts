import { MARKETING_CAMPAIGNS } from '@/data/marketing';

export interface PriceOptimizationInput {
  item: any;
  neighborhood: any;
  hasMonopoly?: boolean;
  hasNeighborhoodDemand?: boolean;
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
  const { item, neighborhood, hasMonopoly = false, hasNeighborhoodDemand = false, lowestRivalPrice } = input;
  const basePrice = item.financials.default_market_price;
  const wholesale = item.financials.wholesale_price;

  const notes: string[] = [];

  const workingPct = neighborhood.demographics.working_class_pct;
  const middlePct = neighborhood.demographics.middle_class_pct;
  const upperPct = neighborhood.demographics.upper_class_pct;
  const totalPct = workingPct + middlePct + upperPct;

  // Big Ambitions price index formula (CitizenHelper.Init):
  // social class price indices are Working 1.20 / Middle 1.40 / Upper 1.70,
  // and the neighborhood average index is their share-weighted mean.
  const averagePriceIndex = totalPct > 0
    ? (1.2 * workingPct + 1.4 * middlePct + 1.7 * upperPct) / totalPct
    : 1.0;

  const monopolyBonus = hasMonopoly ? 0.30 : 0.0;

  if (hasMonopoly) {
    notes.push('Active Monopoly bonus (+30% price tolerance applied)');
  }

  let optimalPrice = Math.round((basePrice * (averagePriceIndex + monopolyBonus)) * 100) / 100;

  // Market reference price for the price ceiling is the lower of the default market price and the
  // lowest rival market price in the neighborhood (ItemHelper.GetMarketReferencePrice).
  const marketReferencePrice = Math.min(basePrice, lowestRivalPrice ?? basePrice);

  // Max acceptable price (ItemHelper.CalculateMaxAcceptablePriceByNeighborhood): the lowest class
  // ceiling equals the neighborhood average price index, and the monopoly bonus is only applied
  // when the neighborhood has demand for the item (CanNeighborhoodHaveItemDemand && HasPlayerMonopoly).
  const ceilingMonopolyBonus = hasMonopoly && hasNeighborhoodDemand ? 0.30 : 0.0;
  let maxCeilingPrice = Math.round((marketReferencePrice * (averagePriceIndex + ceilingMonopolyBonus)) * 100) / 100;

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
  
  // Big Ambitions factory skill formula (Recipe.GetScaledOutputAmount):
  // output = amount * (skill / 2 + 50) / 100  =>  0.5x at 0 skill, 1.0x at 100 skill.
  const outputUnitsPerBatch = Math.round(baseOutputAmount * skillFactor);

  const batchIngredientCost = (recipe as any).economics?.total_ingredient_cost ?? (recipe as any).total_ingredient_cost ?? 0;
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
    outputItemName: recipe.output?.name,
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

// Big Ambitions marketing reach formula (BuildingRegistration): min(sum(sqmReach) * marketingReachMultiplier / squareMeters, 1) * 100.
export function calculateCampaignReachPct(sqmReach: number, squareMeters: number, marketingReachMultiplier = 1.0): number {
  if (!squareMeters || squareMeters <= 0) return 0;
  return Math.min(100, Math.round((sqmReach * marketingReachMultiplier / squareMeters) * 100));
}

export function calculateMarketingEfficiency(selectedCampaignIds: string[], squareMeters: number, marketingReachMultiplier = 1.0): number {
  if (!squareMeters || squareMeters <= 0) return 0;
  const totalSqmReach = selectedCampaignIds.reduce((sum, id) => {
    const campaign = MARKETING_CAMPAIGNS.find(c => c.id === id);
    return sum + (campaign ? campaign.sqmReach : 0);
  }, 0);

  const rawPct = (totalSqmReach * marketingReachMultiplier / squareMeters) * 100;
  return Math.min(100, Math.round(rawPct));
}

export function calculateTotalDailyCost(selectedCampaignIds: string[]): number {
  return selectedCampaignIds.reduce((sum, id) => {
    const campaign = MARKETING_CAMPAIGNS.find(c => c.id === id);
    return sum + (campaign ? campaign.pricePerDay : 0);
  }, 0);
}

export function calculateTotalPromotion(trafficIndex: number, marketingEfficiencyPct: number, marketingStrength: number): number {
  const boost = marketingEfficiencyPct * marketingStrength;
  return Math.min(100, Math.round(trafficIndex + boost));
}

// Find optimal lowest-cost combination of campaigns that achieves 100% efficiency (or maximum reach if building exceeds campaign total)
export function findCheapest100PercentMix(squareMeters: number, marketingReachMultiplier = 1.0): string[] {
  let bestMix: string[] = [];
  let minCost = Infinity;
  let maxReach = 0;
  let minCostForMaxReach = Infinity;

  // Generate all 2^6 = 64 combinations
  const totalCombos = 1 << MARKETING_CAMPAIGNS.length;
  for (let i = 1; i < totalCombos; i++) {
    const currentMix: string[] = [];
    let currentCost = 0;
    let currentReach = 0;

    for (let bit = 0; bit < MARKETING_CAMPAIGNS.length; bit++) {
      if ((i & (1 << bit)) !== 0) {
        const camp = MARKETING_CAMPAIGNS[bit];
        currentMix.push(camp.id);
        currentCost += camp.pricePerDay;
        currentReach += camp.sqmReach;
      }
    }

    // Exact 100% or above threshold
    if (currentReach * marketingReachMultiplier >= squareMeters) {
      if (currentCost < minCost) {
        minCost = currentCost;
        bestMix = currentMix;
      } else if (currentCost === minCost && currentMix.length < bestMix.length) {
        bestMix = currentMix;
      }
    }

    // Track best possible reach in case squareMeters > total possible reach
    if (currentReach > maxReach) {
      maxReach = currentReach;
      minCostForMaxReach = currentCost;
    }
  }

  // If squareMeters is greater than the sum of all campaigns, return all campaigns for max coverage
  if (bestMix.length === 0) {
    return MARKETING_CAMPAIGNS.map(c => c.id);
  }

  return bestMix;
}
