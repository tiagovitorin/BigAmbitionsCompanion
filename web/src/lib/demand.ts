// Market demand grid.
//
// The save stores today's demand (0-100) for every product in every neighbourhood,
// along with how many rivals already sell it there, whether the player holds a
// monopoly, when it last sold, and a hidden import price index. A shop commits to a
// whole range, so the useful question is not "is this one product wanted" but "how
// much of this type's range is wanted here, am I already there, and is anyone else".
// The catalogue of what each type sells comes from the game data.

import rawBusinesses from '@/data/businesses.json';
import rawNeighbourhoods from '@/data/neighborhoods.json';
import { LiveProductMarketData, LiveBusinessData } from '@/context/LiveSyncContext';
import {
  STRONG_DEMAND_LEVEL,
  SPARSE_RIVALS_LEVEL,
  CHEAP_IMPORT_INDEX,
  HYPE_PRIMED_DAYS
} from './thresholds';

interface CatalogueEntry {
  raw: string;
  name: string;
  items: string[]; // raw item names (ba:itemname_...)
}

const CATALOGUE: CatalogueEntry[] = (rawBusinesses as any[])
  .filter(b => Array.isArray(b.products) && b.products.length > 0)
  .map(b => ({
    raw: b.raw_id || b.id,
    name: b.name,
    items: Array.from(new Set((b.products as any[]).map(p => `ba:itemname_${p.id}`)))
  }));

const HOOD_NAMES = new Map<string, string>(
  (rawNeighbourhoods as any[]).map(n => [n.raw_id, n.name])
);

interface MarketCell {
  demand: number;
  providers: number;
  lastDaySold: number;
  monopoly: boolean;
}

export interface DemandCell {
  hoodRaw: string;
  hoodName: string;
  strong: number; // products of this type in strong demand here
  total: number; // products of this type we have demand data for here
  whitespace: number; // strong products here you do not sell, with few rivals
  avgDemand: number;
  avgProviders: number;
  sells: boolean; // player already has this type in this neighbourhood
}

export interface DemandTypeRow {
  raw: string;
  name: string;
  cells: DemandCell[];
  peak: number;
  bestHoodRaw: string;
}

export interface DemandGap {
  rawItemName: string;
  hoodRaw: string;
  hoodName: string;
  demand: number;
  providers: number;
  monopoly: boolean;
  soldElsewhere: boolean;
  opportunity: number; // demand adjusted for competition (higher is better)
  importPriceIndex: number;
  cheapImport: boolean;
  hypePrimed: boolean;
  daysSinceSold: number | null;
}

export interface DemandHoodRow {
  hoodRaw: string;
  hoodName: string;
  strongMarkets: number;
  covered: number;
  whitespace: number;
  avgDemand: number;
  topGapItem: string | null;
}

export interface DemandSummary {
  strongMarkets: number;
  coveredMarkets: number;
  coveragePct: number | null;
  whitespaceCount: number;
  topOpportunity: DemandGap | null;
}

export interface DemandGrid {
  hoods: { raw: string; name: string }[];
  types: DemandTypeRow[];
  gaps: DemandGap[];
  leaderboard: DemandHoodRow[];
  summary: DemandSummary;
}

// Demand relative to the field of rivals. App-defined score, not a game figure: a
// product wanted by 90 with no rivals scores 90; the same product with 4 rivals scores 18.
function opportunityScore(demand: number, providers: number): number {
  return Math.round((demand / (1 + Math.max(0, providers))) * 10) / 10;
}

export function buildDemandGrid(
  productMarket: LiveProductMarketData[] | undefined,
  businesses: LiveBusinessData[],
  gameDay: number
): DemandGrid {
  const market = productMarket || [];

  // item -> hood -> market cell
  const itemHood = new Map<string, Map<string, MarketCell>>();
  const importIndex = new Map<string, number>();
  const hoodSet = new Map<string, string>();
  for (const entry of market) {
    importIndex.set(entry.itemName, entry.importPriceIndex ?? 1);
    const byHood = new Map<string, MarketCell>();
    for (const d of entry.demand || []) {
      if (!d.neighborhood || d.neighborhood.includes('global')) continue;
      byHood.set(d.neighborhood, {
        demand: d.demand,
        providers: d.providers,
        lastDaySold: d.lastDaySold,
        monopoly: d.hasPlayerMonopoly
      });
      hoodSet.set(d.neighborhood, HOOD_NAMES.get(d.neighborhood) || d.neighborhood);
    }
    itemHood.set(entry.itemName, byHood);
  }
  const hoods = [...hoodSet.entries()]
    .map(([raw, name]) => ({ raw, name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Player presence, from the storefronts the player actually runs.
  const sellsTypeHere = new Set<string>(); // `${typeRaw}|${hoodRaw}`
  const sellsItemHere = new Set<string>(); // `${itemRaw}|${hoodRaw}`
  const soldItemAnywhere = new Set<string>();
  for (const b of businesses) {
    const hoodRaw = b.rawDistrict || '';
    for (const rp of b.retailPrices || []) soldItemAnywhere.add(rp.rawItemName);
    if (!b.rawType || !hoodRaw) continue;
    sellsTypeHere.add(`${b.rawType}|${hoodRaw}`);
    for (const rp of b.retailPrices || []) sellsItemHere.add(`${rp.rawItemName}|${hoodRaw}`);
  }

  // Grid: a row per business type, a cell per neighbourhood.
  const types: DemandTypeRow[] = [];
  for (const entry of CATALOGUE) {
    const cells: DemandCell[] = [];
    for (const hood of hoods) {
      let strong = 0;
      let total = 0;
      let whitespace = 0;
      let demandSum = 0;
      let providersSum = 0;
      for (const item of entry.items) {
        const cell = itemHood.get(item)?.get(hood.raw);
        if (!cell) continue;
        total++;
        demandSum += cell.demand;
        providersSum += cell.providers;
        if (cell.demand >= STRONG_DEMAND_LEVEL) {
          strong++;
          if (cell.providers <= SPARSE_RIVALS_LEVEL && !sellsItemHere.has(`${item}|${hood.raw}`)) whitespace++;
        }
      }
      if (total === 0) continue;
      cells.push({
        hoodRaw: hood.raw,
        hoodName: hood.name,
        strong,
        total,
        whitespace,
        avgDemand: Math.round(demandSum / total),
        avgProviders: Math.round((providersSum / total) * 10) / 10,
        sells: sellsTypeHere.has(`${entry.raw}|${hood.raw}`)
      });
    }
    if (cells.length > 0) {
      const best = [...cells].sort((a, b) => b.avgDemand - a.avgDemand)[0];
      types.push({
        raw: entry.raw,
        name: entry.name,
        cells,
        peak: best.avgDemand,
        bestHoodRaw: best.hoodRaw
      });
    }
  }
  types.sort((a, b) => b.peak - a.peak);

  // Gaps: strong demand for a product this company does not sell in that neighbourhood.
  const gaps: DemandGap[] = [];
  let strongMarkets = 0;
  let coveredMarkets = 0;
  const perHood = new Map<string, { strong: number; covered: number; demandSum: number }>();
  for (const entry of market) {
    const idx = importIndex.get(entry.itemName) ?? 1;
    for (const d of entry.demand || []) {
      if (!d.neighborhood || d.neighborhood.includes('global')) continue;
      if (d.demand < STRONG_DEMAND_LEVEL) continue;
      strongMarkets++;
      const bucket = perHood.get(d.neighborhood) || { strong: 0, covered: 0, demandSum: 0 };
      bucket.strong++;
      bucket.demandSum += d.demand;
      if (sellsItemHere.has(`${entry.itemName}|${d.neighborhood}`)) {
        coveredMarkets++;
        bucket.covered++;
        perHood.set(d.neighborhood, bucket);
        continue;
      }
      perHood.set(d.neighborhood, bucket);
      const daysSinceSold = d.lastDaySold > 0 ? gameDay - d.lastDaySold : null;
      gaps.push({
        rawItemName: entry.itemName,
        hoodRaw: d.neighborhood,
        hoodName: HOOD_NAMES.get(d.neighborhood) || d.neighborhood,
        demand: d.demand,
        providers: d.providers,
        monopoly: d.hasPlayerMonopoly,
        soldElsewhere: soldItemAnywhere.has(entry.itemName),
        opportunity: opportunityScore(d.demand, d.providers),
        importPriceIndex: idx,
        cheapImport: idx <= CHEAP_IMPORT_INDEX,
        hypePrimed: d.providers > 0 && gameDay - d.lastDaySold >= HYPE_PRIMED_DAYS,
        daysSinceSold
      });
    }
  }
  gaps.sort((a, b) => b.opportunity - a.opportunity || b.demand - a.demand);

  // Neighbourhood leaderboard: where the unserved strong demand is concentrated.
  const topGapByHood = new Map<string, DemandGap>();
  for (const gap of gaps) {
    const current = topGapByHood.get(gap.hoodRaw);
    if (!current || gap.opportunity > current.opportunity) topGapByHood.set(gap.hoodRaw, gap);
  }
  const leaderboard: DemandHoodRow[] = [...perHood.entries()].map(([raw, b]) => ({
    hoodRaw: raw,
    hoodName: HOOD_NAMES.get(raw) || raw,
    strongMarkets: b.strong,
    covered: b.covered,
    whitespace: b.strong - b.covered,
    avgDemand: Math.round(b.demandSum / b.strong),
    topGapItem: topGapByHood.get(raw)?.rawItemName ?? null
  }));
  leaderboard.sort((a, b) => b.whitespace - a.whitespace || b.strongMarkets - a.strongMarkets);

  return {
    hoods,
    types,
    gaps,
    leaderboard,
    summary: {
      strongMarkets,
      coveredMarkets,
      coveragePct: strongMarkets > 0 ? (coveredMarkets / strongMarkets) * 100 : null,
      whitespaceCount: gaps.length,
      topOpportunity: gaps[0] ?? null
    }
  };
}
