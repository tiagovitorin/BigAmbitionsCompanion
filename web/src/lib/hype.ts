// Hype exposure.
//
// The game says a hype wave is running in a neighbourhood and when it ends, but never
// says what it is worth. The only honest answer is a real baseline: the same shop's own
// trading before the wave started, or failing that a shop of the same kind somewhere no
// wave is running. Where neither exists, the board says so rather than inventing one.

import rawNeighbourhoods from '@/data/neighborhoods.json';
import { LiveMarketEventData, LiveBusinessData } from '@/context/LiveSyncContext';
import { HYPE_BASELINE_DAYS } from './thresholds';

const HOOD_NAMES = new Map<string, string>(
  (rawNeighbourhoods as any[]).map(n => [n.raw_id, n.name])
);
const hoodName = (raw: string) => HOOD_NAMES.get(raw) || raw;

export interface HypeExposure {
  hoodRaw: string;
  hoodName: string;
  items: string[];
  startDay: number;
  daysLeft: number;
  demandImpact: number;
  topStore: { businessId: string; name: string; revenue: number } | null;
  baseline: { name: string; revenue: number; basis: string } | null;
  drop: number | null;
}

function isHype(event: LiveMarketEventData): boolean {
  return (event.type || '').toLowerCase() === 'hype';
}

// Average daily revenue from the given items over the days in [fromDay, toDay).
function hypedDailyRevenue(store: LiveBusinessData, items: Set<string>, fromDay: number, toDay: number): { avg: number; days: number } {
  const totals = new Map<number, number>();
  for (const entry of store.orderHistory || []) {
    if (entry.dayNumber == null || entry.dayNumber < fromDay || entry.dayNumber >= toDay) continue;
    let sum = 0;
    for (const sale of entry.itemSales || []) {
      if (sale.rawItemName && items.has(sale.rawItemName)) sum += sale.totalPrice || 0;
    }
    totals.set(entry.dayNumber, sum);
  }
  const days = totals.size;
  const total = [...totals.values()].reduce((a, b) => a + b, 0);
  return { avg: days > 0 ? total / days : 0, days };
}

function sellsItems(store: LiveBusinessData, items: Set<string>): boolean {
  return (store.retailPrices || []).some(rp => items.has(rp.rawItemName));
}

export function buildHypeExposure(
  marketEvents: LiveMarketEventData[] | undefined,
  businesses: LiveBusinessData[],
  gameDay: number
): HypeExposure[] {
  const active = (marketEvents || []).filter(event => {
    if (!isHype(event) || !event.isActive || event.stopped) return false;
    return event.startDay + (event.durationInDays || 0) > gameDay;
  });
  if (active.length === 0) return [];

  // One wave per neighbourhood.
  const byHood = new Map<string, { items: Set<string>; startDay: number; daysLeft: number; demandImpact: number }>();
  for (const event of active) {
    const hood = event.neighbourhood;
    if (!hood) continue;
    const daysLeft = Math.max(0, event.startDay + (event.durationInDays || 0) - gameDay);
    const entry = byHood.get(hood) || { items: new Set<string>(), startDay: event.startDay, daysLeft, demandImpact: 0 };
    if (event.itemName) entry.items.add(event.itemName);
    entry.startDay = Math.min(entry.startDay, event.startDay);
    entry.daysLeft = Math.min(entry.daysLeft, daysLeft);
    entry.demandImpact = Math.max(entry.demandImpact, event.demandImpact || 0);
    byHood.set(hood, entry);
  }

  const hypedHoods = new Set(byHood.keys());
  const retail = businesses.filter(b => !b.isHeadquarters && (b.retailPrices || []).length > 0);
  const out: HypeExposure[] = [];

  for (const [hood, wave] of byHood) {
    const items = wave.items;
    if (items.size === 0) continue;

    // Stores in the wave's neighbourhood that sell the hyped items.
    const exposed = retail
      .filter(b => b.rawDistrict === hood && sellsItems(b, items))
      .map(b => ({ business: b, revenue: hypedDailyRevenue(b, items, wave.startDay, gameDay).avg }))
      .sort((a, b) => b.revenue - a.revenue);

    if (exposed.length === 0) {
      out.push({
        hoodRaw: hood, hoodName: hoodName(hood), items: [...items], startDay: wave.startDay,
        daysLeft: wave.daysLeft, demandImpact: wave.demandImpact, topStore: null, baseline: null, drop: null
      });
      continue;
    }

    const top = exposed[0];
    // Baseline first choice: the same shop's own trading before the wave landed.
    const before = hypedDailyRevenue(top.business, items, wave.startDay - 7, wave.startDay);
    let baseline: HypeExposure['baseline'] = null;
    if (before.days >= HYPE_BASELINE_DAYS) {
      baseline = {
        name: top.business.name,
        revenue: before.avg,
        basis: `its own ${before.days} days before day ${wave.startDay}`
      };
    } else {
      // Otherwise the same kind of shop somewhere no wave is running.
      const other = retail
        .filter(b => b.rawType === top.business.rawType && !hypedHoods.has(b.rawDistrict || '') && sellsItems(b, items))
        .map(b => ({ business: b, revenue: hypedDailyRevenue(b, items, gameDay - 7, gameDay).avg }))
        .sort((a, b) => b.revenue - a.revenue)[0];
      if (other) {
        baseline = { name: other.business.name, revenue: other.revenue, basis: `the no-hype ${other.business.name}` };
      }
    }

    out.push({
      hoodRaw: hood,
      hoodName: hoodName(hood),
      items: [...items],
      startDay: wave.startDay,
      daysLeft: wave.daysLeft,
      demandImpact: wave.demandImpact,
      topStore: { businessId: top.business.id, name: top.business.name, revenue: top.revenue },
      baseline,
      drop: baseline ? Math.max(0, top.revenue - baseline.revenue) : null
    });
  }

  out.sort((a, b) => a.daysLeft - b.daysLeft);
  return out;
}
