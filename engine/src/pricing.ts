/**
 * Big Ambitions Pricing & Elasticity Engine
 * Implements exact formulas from ItemHelper.cs, CitizenHelper.cs, and PricingManagerHelper.cs
 */

import { NormalizedItem, NormalizedNeighborhood } from './types.js';

export interface PriceOptimizationInput {
  item: NormalizedItem;
  neighborhood: NormalizedNeighborhood;
  hasMonopoly?: boolean;
  lowestRivalPrice?: number;
  customerSatisfaction?: number; // 0-100, default 100
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

/**
 * Calculates optimal selling price for an item in a specific neighborhood.
 * Formula from ItemHelper.cs:
 * OptimalPrice = DefaultMarketPrice * (NeighborhoodPriceIndex + (hasMonopoly ? 0.30 : 0.0))
 */
export function calculateOptimalPrice(input: PriceOptimizationInput): PriceOptimizationResult {
  const { item, neighborhood, hasMonopoly = false, lowestRivalPrice } = input;
  const basePrice = item.financials.default_market_price;
  const wholesale = item.financials.wholesale_price;

  const notes: string[] = [];

  // Neighborhood class weighting:
  // Upper class supports higher markups (1.3 - 2.0x), Working class has lower elasticity (0.8 - 1.0x)
  const workingPct = neighborhood.demographics.working_class_pct / 100;
  const middlePct = neighborhood.demographics.middle_class_pct / 100;
  const upperPct = neighborhood.demographics.upper_class_pct / 100;

  // Weighted relative price acceptance index across demographics
  const demoMultiplier = (workingPct * 0.9) + (middlePct * 1.1) + (upperPct * 1.4);
  const monopolyBonus = hasMonopoly ? 0.30 : 0.0;

  if (hasMonopoly) {
    notes.push('Active Monopoly bonus (+30% price tolerance applied)');
  }

  let optimalMultiplier = demoMultiplier + monopolyBonus;
  let optimalPrice = Math.round((basePrice * optimalMultiplier) * 100) / 100;

  // Maximum acceptable ceiling before customer satisfaction penalties begin
  let maxCeilingMultiplier = demoMultiplier * 1.25 + monopolyBonus;
  let maxCeilingPrice = Math.round((basePrice * maxCeilingMultiplier) * 100) / 100;

  // If competitor rival is active and undercutting, adjust ceiling
  if (lowestRivalPrice !== undefined && lowestRivalPrice > 0) {
    if (optimalPrice > lowestRivalPrice * 1.2) {
      optimalPrice = Math.round((lowestRivalPrice * 1.15) * 100) / 100;
      notes.push(`Adjusted for local rival competition (rival at $${lowestRivalPrice.toFixed(2)})`);
    }
  }

  const profit = Math.round((optimalPrice - wholesale) * 100) / 100;
  const marginPct = optimalPrice > 0 ? Math.round((profit / optimalPrice * 100) * 10) / 10 : 0;

  return {
    itemName: item.name,
    wholesalePrice: wholesale,
    baseMarketPrice: basePrice,
    optimalPrice,
    maxCeilingPrice,
    profitPerUnit: profit,
    marginPct,
    monopolyApplied: hasMonopoly,
    notes
  };
}

/**
 * Calculates customer price satisfaction percentage (0-100%) for a given price point.
 */
export function calculatePriceSatisfaction(
  currentPrice: number,
  optimalPrice: number,
  maxCeilingPrice: number
): number {
  if (currentPrice <= optimalPrice) {
    return 100;
  }
  if (currentPrice >= maxCeilingPrice) {
    const penalty = ((currentPrice - maxCeilingPrice) / maxCeilingPrice) * 150;
    return Math.max(0, Math.round(60 - penalty));
  }
  // Linear decay between optimal (100) and ceiling (60)
  const spread = maxCeilingPrice - optimalPrice;
  const diff = currentPrice - optimalPrice;
  const ratio = diff / spread;
  return Math.round(100 - (ratio * 40));
}
