// Store supply items that are consumed but never sold.
//
// Paper bags (and, on some saves, plastic bags) are complimentary checkout
// supplies: customers are not charged for them and the game does not list them
// as retail products, so they never appear in `retailPrices`. Running out of
// them stops bagging at the register, which is far more damaging than running
// out of a single product. The mod emits their on-hand stock in
// `business.inventory` and their daily usage in `orderHistory[].consumablesSales`.
// Nothing here is invented: a bag only appears when the game actually reports
// stock or usage for it.

import { LiveBusinessData } from '@/context/LiveSyncContext';
import { getCanonicalProductKey, getWholesaleUnitPrice } from './products';

export interface StoreSupplyEntry {
  // Canonical game item id, e.g. "ba:itemname_paperbag".
  rawItemName: string;
  displayName: string;
  // Current on-hand units across the store.
  quantity: number;
  // Units consumed per open day, measured from recorded consumables sales.
  dailyConsumed: number;
  // The game's own wholesale cost per unit, or null when it prices none.
  unitCost: number | null;
  // Days of stock left at the measured burn rate, or null when there is no usage.
  runoutDays: number | null;
}

interface SupplyDefinition {
  rawId: string;
  name: string;
}

// The two bag types the game consumes at checkout.
const SUPPLY_DEFS: SupplyDefinition[] = [
  { rawId: 'ba:itemname_paperbag', name: 'Paper Bag' },
  { rawId: 'ba:itemname_plasticbag', name: 'Plastic Bag' }
];

export function isBagItem(rawName?: string, name?: string): boolean {
  const key = getCanonicalProductKey(rawName, name);
  return key.includes('paperbag') || key.includes('plasticbag');
}

// How many recorded days back to average the consumables burn rate over.
const CONSUMPTION_WINDOW_DAYS = 3;

export function getStoreSupplies(business: LiveBusinessData): StoreSupplyEntry[] {
  const stockByKey = new Map<string, number>();
  const presentKeys = new Set<string>();
  (business.inventory || []).forEach(entry => {
    if (!entry) return;
    const key = getCanonicalProductKey(entry.rawItemName);
    stockByKey.set(key, entry.quantity ?? 0);
    presentKeys.add(key);
  });
  // Bags can also carry stock on the retail price row when the game records them there.
  (business.retailPrices || []).forEach(rp => {
    if (!isBagItem(rp.rawItemName, rp.displayName)) return;
    const key = getCanonicalProductKey(rp.rawItemName, rp.displayName);
    presentKeys.add(key);
    if (!stockByKey.has(key) && typeof rp.inStoreStock === 'number') {
      stockByKey.set(key, rp.inStoreStock);
    }
  });

  const history = business.orderHistory || [];
  const window = history.length > CONSUMPTION_WINDOW_DAYS ? history.slice(-CONSUMPTION_WINDOW_DAYS) : history;
  const daysSeen = new Set<number>();
  const consumedByKey = new Map<string, number>();
  window.forEach(dayEntry => {
    daysSeen.add(dayEntry.dayNumber ?? 0);
    (dayEntry.consumablesSales || []).forEach(sale => {
      const key = getCanonicalProductKey(sale.rawItemName, sale.itemName);
      presentKeys.add(key);
      consumedByKey.set(key, (consumedByKey.get(key) ?? 0) + (sale.amountSold || 0));
    });
  });
  const activeDays = Math.max(1, daysSeen.size);

  const entries: StoreSupplyEntry[] = [];
  SUPPLY_DEFS.forEach(def => {
    const key = getCanonicalProductKey(def.rawId);
    if (!presentKeys.has(key)) return;

    const quantity = stockByKey.get(key) ?? 0;
    const consumedRaw = consumedByKey.get(key);
    const dailyConsumed = consumedRaw !== undefined ? consumedRaw / activeDays : 0;
    const runoutDays = dailyConsumed > 0 ? quantity / dailyConsumed : null;
    entries.push({
      rawItemName: def.rawId,
      displayName: def.name,
      quantity,
      dailyConsumed,
      unitCost: getWholesaleUnitPrice(def.rawId),
      runoutDays
    });
  });

  return entries;
}

// A bag at or under this many days of runway is treated as critical: it can stop
// checkout entirely, so it is held to a tighter bar than shelf stock.
export const BAG_CRITICAL_RUNOUT_DAYS = 1;
