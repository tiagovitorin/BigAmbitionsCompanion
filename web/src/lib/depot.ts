// Depot draw and ordering.
//
// The warehouse's own round is measured from the game's delivery log: the mod already
// sums what shipped out (consumption) and what arrived (deliveries) over the last seven
// days. This turns that into the two questions a depot raises - is anything sitting far
// beyond what flows through it, and is the weekly import order big enough to cover the
// week it has to feed.

import { LiveWarehouseData, LiveImportPartnershipData } from '@/context/LiveSyncContext';
import { supplyVerdict, SupplyVerdict } from './logistics';
import { DEPOT_IDLE_DAYS, DEPOT_IDLE_UNITS } from './thresholds';

export interface DepotIdleItem {
  warehouseAddress: string;
  rawItemName: string;
  itemName: string;
  units: number;
  weeklyConsumption: number;
  daysCover: number | null; // null when nothing flows through the item at all
}

export interface DepotOrderRow {
  warehouseAddress: string;
  rawItemName: string;
  itemName: string;
  weeklyOrder: number;
  weeklyConsumption: number;
  verdict: SupplyVerdict;
  daysToDelivery: number | null;
  daysCover: number | null;
  reachesImport: boolean | null; // whether the holding covers the days to the next import
}

export interface DepotDraw {
  idle: DepotIdleItem[];
  orders: DepotOrderRow[];
}

export function buildDepotDraw(
  warehouses: LiveWarehouseData[],
  importPartnerships: LiveImportPartnershipData[],
  gameDay: number
): DepotDraw {
  const stockByWarehouse = new Map<string, Map<string, { units: number; weeklyConsumption: number; itemName: string }>>();
  for (const warehouse of warehouses) {
    const byItem = new Map<string, { units: number; weeklyConsumption: number; itemName: string }>();
    for (const item of warehouse.stock || []) {
      byItem.set(item.rawItemName, {
        units: item.units ?? item.quantity ?? 0,
        weeklyConsumption: item.weeklyConsumption || 0,
        itemName: item.itemName
      });
    }
    stockByWarehouse.set(warehouse.address, byItem);
  }

  // Idle stock: held far beyond what flows through it, or held with nothing flowing.
  const idle: DepotIdleItem[] = [];
  for (const warehouse of warehouses) {
    for (const item of warehouse.stock || []) {
      const units = item.units ?? item.quantity ?? 0;
      if (units <= 0) continue;
      const consumption = item.weeklyConsumption || 0;
      const daysCover = consumption > 0 ? units / (consumption / 7) : null;
      const isIdle = units >= DEPOT_IDLE_UNITS && (daysCover == null || daysCover >= DEPOT_IDLE_DAYS);
      if (isIdle) {
        idle.push({
          warehouseAddress: warehouse.address,
          rawItemName: item.rawItemName,
          itemName: item.itemName,
          units,
          weeklyConsumption: consumption,
          daysCover
        });
      }
    }
  }
  idle.sort((a, b) => (b.daysCover ?? Infinity) - (a.daysCover ?? Infinity));

  // Import orders against the measured draw of the warehouse they feed.
  const orders: DepotOrderRow[] = [];
  for (const partnership of importPartnerships) {
    if (!partnership.isActive) continue;
    for (const product of partnership.products || []) {
      const stock = stockByWarehouse.get(product.assignedWarehouse)?.get(product.rawItemName);
      const weeklyConsumption = stock?.weeklyConsumption ?? 0;
      const weeklyOrder = product.amount || 0;
      const daysToDelivery = partnership.nextDeliveryDay != null ? Math.max(0, partnership.nextDeliveryDay - gameDay) : null;
      const daysCover = stock && weeklyConsumption > 0 ? stock.units / (weeklyConsumption / 7) : null;
      const reachesImport = daysCover == null || daysToDelivery == null ? null : daysCover >= daysToDelivery;
      orders.push({
        warehouseAddress: product.assignedWarehouse,
        rawItemName: product.rawItemName,
        itemName: product.itemName,
        weeklyOrder,
        weeklyConsumption,
        verdict: supplyVerdict(weeklyConsumption, weeklyOrder),
        daysToDelivery,
        daysCover,
        reachesImport
      });
    }
  }
  // Anything short first, then tight, then largest draw.
  const orderRank: Record<SupplyVerdict, number> = { short: 0, tight: 1, covered: 2 };
  orders.sort((a, b) => orderRank[a.verdict] - orderRank[b.verdict] || b.weeklyConsumption - a.weeklyConsumption);

  return { idle, orders };
}
