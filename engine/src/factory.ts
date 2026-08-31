/**
 * Big Ambitions Factory & Manufacturing Calculation Engine
 * Implements exact formulas from Recipe.cs and FactoryWorkstation.cs
 */

import { NormalizedRecipe } from './types.js';

export interface FactoryProductionInput {
  recipe: NormalizedRecipe;
  workerSkillPct?: number; // 0 - 100% (default 100%)
  workerHourlyWage?: number; // default $25.00/hr
  batchesPerHour?: number; // default 1.0 batch/hr per workstation
  workstationsCount?: number; // default 1
}

export interface FactoryProductionResult {
  recipeName: string;
  outputItemName: string;
  outputPerBatch: number;
  workerSkillFactor: number;
  unitCost: number;
  unitMarketPrice: number;
  batchIngredientCost: number;
  batchGrossRevenue: number;
  batchGrossProfit: number;
  hourlyProduction: {
    unitsProduced: number;
    totalIngredientCost: number;
    totalWageCost: number;
    grossRevenue: number;
    netProfit: number;
  };
  dailyProduction: {
    unitsProduced: number;
    totalIngredientCost: number;
    totalWageCost: number;
    grossRevenue: number;
    netProfit: number;
  };
  requiredMachines: string[];
}

/**
 * Calculates worker skill output scaling factor.
 * Formula from Recipe.cs: (skill / 2 + 50) / 100
 * Examples:
 *   Skill   0% -> 0.50 (50% output)
 *   Skill  50% -> 0.75 (75% output)
 *   Skill 100% -> 1.00 (100% output)
 */
export function calculateWorkerSkillFactor(skillPct: number): number {
  const clampedSkill = Math.max(0, Math.min(100, skillPct));
  return (clampedSkill / 2 + 50) / 100;
}

/**
 * Calculates scaled output amount for a single batch.
 */
export function calculateScaledBatchOutput(baseAmount: number, skillPct: number): number {
  const factor = calculateWorkerSkillFactor(skillPct);
  return Math.round(baseAmount * factor);
}

/**
 * Calculates complete production economics and throughput for a factory recipe.
 */
export function calculateFactoryProduction(input: FactoryProductionInput): FactoryProductionResult {
  const {
    recipe,
    workerSkillPct = 100,
    workerHourlyWage = 25.0,
    batchesPerHour = 1.0,
    workstationsCount = 1
  } = input;

  const baseAmount = recipe.output.base_amount;
  const skillFactor = calculateWorkerSkillFactor(workerSkillPct);
  const outputPerBatch = calculateScaledBatchOutput(baseAmount, workerSkillPct);

  const unitMarketPrice = recipe.output.unit_market_price;
  const batchIngredientCost = recipe.economics.total_ingredient_cost;
  const batchGrossRevenue = outputPerBatch * unitMarketPrice;
  const batchGrossProfit = batchGrossRevenue - batchIngredientCost;
  const unitCost = outputPerBatch > 0 ? Math.round((batchIngredientCost / outputPerBatch) * 100) / 100 : 0;

  // Hourly metrics (per total workstations operating)
  const hourlyBatches = batchesPerHour * workstationsCount;
  const hourlyUnits = Math.round(hourlyBatches * outputPerBatch);
  const hourlyIngredientCost = Math.round(hourlyBatches * batchIngredientCost * 100) / 100;
  const hourlyWageCost = Math.round(workstationsCount * workerHourlyWage * 100) / 100;
  const hourlyGrossRevenue = Math.round(hourlyUnits * unitMarketPrice * 100) / 100;
  const hourlyNetProfit = Math.round((hourlyGrossRevenue - hourlyIngredientCost - hourlyWageCost) * 100) / 100;

  // Daily 24h metrics (3 shifts of 8 hours)
  const dailyHours = 24;
  const dailyUnits = hourlyUnits * dailyHours;
  const dailyIngredientCost = Math.round(hourlyIngredientCost * dailyHours * 100) / 100;
  const dailyWageCost = Math.round(hourlyWageCost * dailyHours * 100) / 100;
  const dailyGrossRevenue = Math.round(hourlyGrossRevenue * dailyHours * 100) / 100;
  const dailyNetProfit = Math.round(hourlyNetProfit * dailyHours * 100) / 100;

  return {
    recipeName: recipe.name,
    outputItemName: recipe.output.name,
    outputPerBatch,
    workerSkillFactor: skillFactor,
    unitCost,
    unitMarketPrice,
    batchIngredientCost: Math.round(batchIngredientCost * 100) / 100,
    batchGrossRevenue: Math.round(batchGrossRevenue * 100) / 100,
    batchGrossProfit: Math.round(batchGrossProfit * 100) / 100,
    hourlyProduction: {
      unitsProduced: hourlyUnits,
      totalIngredientCost: hourlyIngredientCost,
      totalWageCost: hourlyWageCost,
      grossRevenue: hourlyGrossRevenue,
      netProfit: hourlyNetProfit
    },
    dailyProduction: {
      unitsProduced: dailyUnits,
      totalIngredientCost: dailyIngredientCost,
      totalWageCost: dailyWageCost,
      grossRevenue: dailyGrossRevenue,
      netProfit: dailyNetProfit
    },
    requiredMachines: recipe.production_machines
  };
}
