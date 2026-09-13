// Real-estate presentation helpers for the Properties page.
//
// Thresholds here are app-defined UI heuristics, not game formulas. The game's
// own occupancy rule lives in RealEstateHelper.UpdatePlayerRealEstate: tenants
// move in or out based on how the charged rent per sqm compares to the
// neighborhood market rent per sqm (Building.GetBuildingDailyMarketRentPerSqm).

export type MarketPosition = 'under' | 'at' | 'over';

// Within this percentage of the market rent, the charged rent counts as "at market".
export const AT_MARKET_BAND_PCT = 3;

// How far the charged rent per sqm sits from the market rent per sqm, as a percentage.
// Positive means you charge above market, negative below.
export function marketDeltaPct(pricePerSqm?: number, marketRentPerSqm?: number): number | null {
  if (!pricePerSqm || !marketRentPerSqm || marketRentPerSqm <= 0) return null;
  return ((pricePerSqm - marketRentPerSqm) / marketRentPerSqm) * 100;
}

export function marketPosition(pricePerSqm?: number, marketRentPerSqm?: number): MarketPosition | null {
  const delta = marketDeltaPct(pricePerSqm, marketRentPerSqm);
  if (delta == null) return null;
  if (Math.abs(delta) <= AT_MARKET_BAND_PCT) return 'at';
  return delta < 0 ? 'under' : 'over';
}

// Annualized return on the purchase price from the property's weekly net income.
export function annualRoi(weeklyNet: number, purchasePrice?: number, daysPerYear?: number): number | null {
  if (!purchasePrice || purchasePrice <= 0 || !daysPerYear) return null;
  return ((weeklyNet || 0) * (daysPerYear / 7)) / purchasePrice * 100;
}

// Unrealized gain over the purchase price, using the game's own market value.
export function appreciationPct(marketValue?: number, purchasePrice?: number): number | null {
  if (!marketValue || !purchasePrice || purchasePrice <= 0) return null;
  return ((marketValue - purchasePrice) / purchasePrice) * 100;
}
