// Warehouse & supply chain helpers for the Live HQ Logistics view.
// Grounded strictly in live telemetry (warehouses[].stock[]) and the recorded
// weekly consumption / delivery figures emitted by the mod. No synthetic data.

import type {
  LiveWarehouseData,
  LiveBusinessData,
  LiveDeliveryContractData,
  LiveImportPartnershipData,
  LiveLogisticsPlanData
} from '@/context/LiveSyncContext';
import rawVehicles from '@/data/vehicles.json';
import rawItemIcons from '@/data/game_item_icons.json';
import rawBusinessIcons from '@/data/business_icons.json';
import { WAREHOUSE_RUNWAY_CRITICAL_DAYS, WAREHOUSE_RUNWAY_WARNING_DAYS } from './thresholds';

const businessIconByType = rawBusinessIcons as Record<string, string>;

const vehicleImageByRawId = new Map<string, string>();
(rawVehicles as Array<{ raw_id?: string; image?: string }>).forEach(v => {
  if (v.raw_id && v.image) vehicleImageByRawId.set(v.raw_id, v.image);
});

// Resolve a vehicle preview image from the compendium catalog using the raw
// vehicle type name emitted by the mod (e.g. "ba:vehicletype_umcdesert").
export function resolveVehicleImage(vehicleType: string): string | null {
  if (!vehicleType) return null;
  return vehicleImageByRawId.get(vehicleType) || null;
}

const itemIconByKey = rawItemIcons as Record<string, string>;

// Resolve an item thumbnail from the game icon catalog using the raw item name
// emitted by the mod (e.g. "ba:itemname_sodacan"). Returns null for items with
// no icon (utility/carry items such as hand trucks).
export function resolveItemImage(rawItemName: string): string | null {
  if (!rawItemName) return null;
  const clean = rawItemName.replace(/^ba:itemname_/i, '').replace(/^itemname_/i, '').toLowerCase();
  return itemIconByKey[clean] || null;
}

export type RunwayStatus = 'critical' | 'warning' | 'healthy' | 'none';

// Classify a warehouse stock item's depletion runway.
// daysLeft semantics (from TelemetryEngine.cs):
//   -1  -> no recorded weekly consumption (never depletes / no outbound data)
//    0  -> already out of stock (consumption active but zero units)
//   >0  -> number of days until the pallet inventory runs dry
export function getRunwayStatus(daysLeft: number): RunwayStatus {
  if (daysLeft < 0) return 'none';
  if (daysLeft <= WAREHOUSE_RUNWAY_CRITICAL_DAYS) return 'critical';
  if (daysLeft <= WAREHOUSE_RUNWAY_WARNING_DAYS) return 'warning';
  return 'healthy';
}

// Width (0-100) for the visual runway bar. Capped at RUNWAY_BAR_FULL_DAYS for display.
const RUNWAY_BAR_FULL_DAYS = 14;

export function getRunwayBarWidth(daysLeft: number): number {
  if (daysLeft < 0) return 100;
  return Math.max(0, Math.min(100, (daysLeft / RUNWAY_BAR_FULL_DAYS) * 100));
}

// --- Supply chain graph model ---

export type SupplyChainNodeKind = 'importer' | 'wholesaler' | 'warehouse' | 'store';

export interface SupplyChainNode {
  id: string; // address
  address: string;
  name: string;
  kind: SupplyChainNodeKind;
  icon?: string; // resolved business-type image for store nodes
}

export interface SupplyChainEdgeItem {
  rawItemName: string;
  itemName: string;
  amount?: number; // delivery/import: ordered quantity for the next delivery
  targetAmount?: number; // route: store target stock level
  storeStock?: number; // route: store's current on-hand stock (units)
  topUp?: number; // route: amount to deliver to reach target (target - storeStock, min 0)
  available?: number; // route: remaining warehouse stock at this point
  shortfall?: number; // route: how much of the predicted top-up the warehouse cannot cover
  predictedConsumption?: number; // route: expected store sales before the next delivery
  predictedTopUp?: number; // route: top-up needed at next delivery (target - max(0, storeStock - consumption))
  daysUntilDelivery?: number; // route: days until the next warehouse delivery
}

export interface SupplyChainEdge {
  id: string;
  from: string; // node address
  to: string; // node address
  kind: 'import' | 'route' | 'delivery';
  items: SupplyChainEdgeItem[];
  nextDeliveryDay?: number; // import/delivery: scheduled in-game day
  fulfillable?: boolean; // route only: warehouse covers all stock targets
  partial?: boolean; // route only: warehouse covers some (but not all) stock targets
}

export interface SupplyChainGraph {
  importers: SupplyChainNode[];
  wholesalers: SupplyChainNode[];
  warehouses: SupplyChainNode[];
  stores: SupplyChainNode[];
  edges: SupplyChainEdge[];
}

// --- Consumption prediction ---

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Big Ambitions starts on Day 1 = Monday, so (day - 1) % 7 maps an in-game day
// number to a 0-indexed day of week (0 = Monday .. 6 = Sunday).
function dayOfWeekIndex(dayNumber: number): number {
  return ((dayNumber - 1) % 7 + 7) % 7;
}

// Warehouse logistics routes are driven daily by the assigned driver, so the next
// warehouse -> store delivery is the following day. Delivery contracts and import
// partnerships carry an explicit nextDeliveryDay instead.
const ROUTE_DELIVERY_INTERVAL_DAYS = 1;

interface StoreSalesProfile {
  // rawItemName -> average units sold per day-of-week (7 entries); 0 when no data.
  byDow: Map<string, number[]>;
  // rawItemName -> average units sold per day over the full window (flat fallback).
  flat: Map<string, number>;
}

// Build a per-item consumption profile from the store's daily order history.
// Sales on the current day are excluded (the day is still in progress).
function buildStoreSalesProfile(business: LiveBusinessData | undefined, gameDay: number): StoreSalesProfile {
  const byDow = new Map<string, number[]>();
  const flat = new Map<string, number>();
  const totalSold = new Map<string, number>();
  const countsByDow = new Map<string, number[]>();

  const history = (business?.orderHistory || []).filter(h => h.dayNumber != null && h.dayNumber < gameDay);

  const ensureDow = (key: string) => {
    if (!byDow.has(key)) {
      byDow.set(key, new Array(7).fill(0));
      countsByDow.set(key, new Array(7).fill(0));
    }
  };

  const addSale = (key: string | undefined, altKey: string | undefined, amountSold: number, dow: number) => {
    const k = key || altKey;
    if (!k) return;
    ensureDow(k);
    byDow.get(k)![dow] += amountSold;
    countsByDow.get(k)![dow] += 1;
    totalSold.set(k, (totalSold.get(k) ?? 0) + amountSold);
  };

  for (const entry of history) {
    const dow = dayOfWeekIndex(entry.dayNumber);
    for (const sale of entry.itemSales || []) {
      addSale(sale.rawItemName, sale.itemName, sale.amountSold, dow);
    }
    // Paper/plastic bags are consumable supplies, not retail products, so the mod
    // emits them separately from itemSales; fold them into the same consumption model.
    for (const sale of entry.consumablesSales || []) {
      addSale(sale.rawItemName, sale.itemName, sale.amountSold, dow);
    }
  }

  for (const key of byDow.keys()) {
    const dowArr = byDow.get(key)!;
    const cntArr = countsByDow.get(key)!;
    const daysSeen = cntArr.reduce((a, b) => a + b, 0);
    flat.set(key, daysSeen > 0 ? (totalSold.get(key) ?? 0) / daysSeen : 0);
    for (let i = 0; i < 7; i++) {
      dowArr[i] = cntArr[i] > 0 ? dowArr[i] / cntArr[i] : 0;
    }
  }

  return { byDow, flat };
}

// Predict the store's expected sales (units) of each item across the given future
// days, weighted by day-of-week and zeroed on days the store is closed. Falls back
// to a flat per-day average when a day-of-week has no recorded sales.
function predictStoreSales(
  business: LiveBusinessData | undefined,
  profile: StoreSalesProfile | undefined,
  dayNumbers: number[]
): Map<string, number> {
  const result = new Map<string, number>();
  if (!profile || dayNumbers.length === 0) return result;

  const openByDow = new Array(7).fill(true);
  for (const sd of business?.scheduleWeek || []) {
    const idx = DAYS_OF_WEEK.findIndex(d => d.toLowerCase() === (sd.day || '').toLowerCase());
    if (idx >= 0) openByDow[idx] = !!sd.isOpen;
  }

  for (const d of dayNumbers) {
    const dow = dayOfWeekIndex(d);
    if (!openByDow[dow]) continue;
    for (const [key, dowArr] of profile.byDow) {
      const rate = dowArr[dow] > 0 ? dowArr[dow] : (profile.flat.get(key) ?? 0);
      if (rate > 0) result.set(key, (result.get(key) ?? 0) + rate);
    }
  }

  return result;
}

// Fold live telemetry into a two-sided supply chain graph:
// [Importers] -> [Warehouses] -> [Stores] <- [Wholesalers].
export function buildSupplyChainGraph(
  warehouses: LiveWarehouseData[],
  businesses: LiveBusinessData[],
  deliveryContracts: LiveDeliveryContractData[],
  importPartnerships: LiveImportPartnershipData[],
  logisticsPlans: LiveLogisticsPlanData[],
  gameDay: number
): SupplyChainGraph {
  const nodes = new Map<string, SupplyChainNode>();
  const edges: SupplyChainEdge[] = [];

  const ensureNode = (address: string, name: string, kind: SupplyChainNodeKind): SupplyChainNode | null => {
    if (!address) return null;
    let node = nodes.get(address);
    if (!node) {
      node = { id: address, address, name: name || address, kind };
      nodes.set(address, node);
    } else if (!node.name && name) {
      node.name = name;
    }
    return node;
  };

  const storeAddresses = new Set(businesses.map(b => b.address));

  // Store on-hand stock lookup: address -> (rawItemName -> units). Grounded in the
  // business "inventory" field (total stock per item incl. paper bags / non-retail).
  const stockByStore = new Map<string, Map<string, number>>();
  const businessByAddress = new Map<string, LiveBusinessData>();
  const profileByAddress = new Map<string, StoreSalesProfile>();
  businesses.forEach(b => {
    const m = new Map<string, number>();
    (b.inventory || []).forEach(entry => m.set(entry.rawItemName, entry.quantity));
    stockByStore.set(b.address, m);
    businessByAddress.set(b.address, b);
    profileByAddress.set(b.address, buildStoreSalesProfile(b, gameDay));
  });

  warehouses.forEach(w => ensureNode(w.address, w.address, 'warehouse'));
  businesses.forEach(b => {
    const node = ensureNode(b.address, b.name || b.address, 'store');
    if (node) node.icon = businessIconByType[b.type || ''] || undefined;
  });

  // Warehouse stock lookup: address -> (rawItemName -> units)
  const stockByWarehouse = new Map<string, Map<string, number>>();
  warehouses.forEach(w => {
    const m = new Map<string, number>();
    (w.stock || []).forEach(s => m.set(s.rawItemName, s.units ?? s.quantity ?? 0));
    stockByWarehouse.set(w.address, m);
  });

  // Incoming import deliveries (importer -> warehouse) that arrive before the next
  // warehouse -> store delivery. These are added to the warehouse's available stock so
  // the sequential allocation accounts for goods already en route to the warehouse.
  const incomingByWarehouse = new Map<string, Map<string, number>>();

  // 1. Import partnerships: importer -> warehouse
  importPartnerships.forEach(ip => {
    if (!ip.isActive) return;
    const importer = ensureNode(ip.importAddress, ip.supplierName || ip.importAddress, 'importer');
    if (!importer) return;
    const arrivesBeforeDelivery =
      (ip.nextDeliveryDay ?? 0) > gameDay && (ip.nextDeliveryDay ?? 0) <= gameDay + ROUTE_DELIVERY_INTERVAL_DAYS;
    const itemsByWarehouse = new Map<string, SupplyChainEdgeItem[]>();
    (ip.products || []).forEach(p => {
      if (!p.assignedWarehouse) return;
      const list = itemsByWarehouse.get(p.assignedWarehouse) || [];
      list.push({ rawItemName: p.rawItemName, itemName: p.itemName, amount: p.amount });
      itemsByWarehouse.set(p.assignedWarehouse, list);
      if (arrivesBeforeDelivery) {
        const m = incomingByWarehouse.get(p.assignedWarehouse) || new Map<string, number>();
        m.set(p.rawItemName, (m.get(p.rawItemName) ?? 0) + p.amount);
        incomingByWarehouse.set(p.assignedWarehouse, m);
      }
    });
    itemsByWarehouse.forEach((items, whAddr) => {
      const wh = ensureNode(whAddr, whAddr, 'warehouse');
      if (!wh) return;
      edges.push({ id: `import-${ip.importAddress}-${whAddr}`, from: ip.importAddress, to: whAddr, kind: 'import', items, nextDeliveryDay: ip.nextDeliveryDay });
    });
  });

  // 2. Delivery contracts: wholesaler -> store
  deliveryContracts.forEach(dc => {
    if (!dc.enabled) return;
    const wholesaler = ensureNode(dc.wholesaleAddress, dc.supplierName || dc.wholesaleAddress, 'wholesaler');
    if (!wholesaler) return;
    if (!storeAddresses.has(dc.businessAddress)) return;
    const store = ensureNode(dc.businessAddress, dc.businessAddress, 'store');
    if (!store) return;
    edges.push({
      id: `delivery-${dc.wholesaleAddress}-${dc.businessAddress}`,
      from: dc.wholesaleAddress,
      to: dc.businessAddress,
      kind: 'delivery',
      nextDeliveryDay: dc.nextDeliveryDay,
      items: (dc.items || []).map(i => ({ rawItemName: i.rawItemName, itemName: i.itemName, amount: i.amount }))
    });
  });

  // 3. Logistics plans: warehouse -> store (sequential predicted top-up + fulfillment).
  // Destinations deliver in plan order and consume warehouse stock sequentially, so a
  // later store can be shorted even when an earlier one is fully covered. The delivery
  // amount is the *predicted* top-up: target minus the store's projected on-hand stock
  // (current stock minus expected sales between now and the next daily delivery).
  logisticsPlans.forEach(p => {
    const wh = ensureNode(p.targetAddress, p.targetAddress, 'warehouse');
    if (!wh) return;
    const remaining = new Map<string, number>(stockByWarehouse.get(p.targetAddress) || new Map<string, number>());
    const incoming = incomingByWarehouse.get(p.targetAddress);
    if (incoming) {
      incoming.forEach((v, k) => remaining.set(k, (remaining.get(k) ?? 0) + v));
    }
    (p.destinations || []).forEach(d => {
      const store = ensureNode(d.deliveryTargetAddress, d.businessName || d.deliveryTargetAddress, 'store');
      if (!store) return;

      const business = businessByAddress.get(d.deliveryTargetAddress);
      const profile = profileByAddress.get(d.deliveryTargetAddress);
      const daysUntilDelivery = ROUTE_DELIVERY_INTERVAL_DAYS;
      const futureDays: number[] = [];
      for (let i = 1; i <= daysUntilDelivery; i++) futureDays.push(gameDay + i);
      const predictedSales = predictStoreSales(business, profile, futureDays);

      const items: SupplyChainEdgeItem[] = (d.stockTargets || []).map(st => {
        const storeStock = stockByStore.get(d.deliveryTargetAddress)?.get(st.rawItemName) ?? 0;
        const targetAmount = st.targetAmount ?? 0;
        const topUp = Math.max(0, targetAmount - storeStock);
        const predictedConsumption = Math.round(predictedSales.get(st.rawItemName) ?? 0);
        const predictedTopUp = Math.max(0, targetAmount - Math.max(0, storeStock - predictedConsumption));
        const need = predictedTopUp;
        const available = remaining.get(st.rawItemName) ?? 0;
        const shortfall = Math.max(0, need - available);
        remaining.set(st.rawItemName, Math.max(0, available - need));
        return {
          rawItemName: st.rawItemName,
          itemName: st.itemName,
          targetAmount,
          storeStock,
          topUp,
          available,
          shortfall,
          predictedConsumption,
          predictedTopUp,
          daysUntilDelivery
        };
      });
      const fulfillable = items.length > 0 && items.every(it => (it.shortfall ?? 0) === 0);
      const partial = !fulfillable && items.some(it => (it.available ?? 0) > 0);
      edges.push({
        id: `route-${p.targetAddress}-${d.deliveryTargetAddress}`,
        from: p.targetAddress,
        to: d.deliveryTargetAddress,
        kind: 'route',
        items,
        fulfillable,
        partial
      });
    });
  });

  return {
    importers: Array.from(nodes.values()).filter(n => n.kind === 'importer'),
    wholesalers: Array.from(nodes.values()).filter(n => n.kind === 'wholesaler'),
    warehouses: Array.from(nodes.values()).filter(n => n.kind === 'warehouse'),
    stores: Array.from(nodes.values()).filter(n => n.kind === 'store'),
    edges
  };
}
