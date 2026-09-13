// Derived, display-ready summaries for the Supply Chain Flow map's node detail
// card. Every figure comes from the graph (buildSupplyChainGraph) or the raw
// telemetry passed in; nothing is estimated here.

import type {
  LiveBusinessData,
  LiveWarehouseData,
  LiveDeliveryContractData
} from '@/context/LiveSyncContext';
import type { SupplyChainNode, SupplyChainEdge, SupplyChainEdgeItem, SupplyVerdict } from './logistics';
import { getCanonicalProductKey } from './products';
import { WAREHOUSE_RUNWAY_CRITICAL_DAYS, WAREHOUSE_RUNWAY_WARNING_DAYS } from './thresholds';

export function formatCount(value: number): string {
  const n = Math.round(value);
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}k`;
  return n.toLocaleString();
}

const nodeName = (allNodes: SupplyChainNode[], id: string): string =>
  allNodes.find(n => n.id === id)?.name || id;

const verdictRank: Record<SupplyVerdict, number> = { short: 0, tight: 1, covered: 2 };

// --- Store ---

export interface StoreWatchItem {
  rawItemName: string;
  itemName: string;
  predictedSold: number;
  onHand: number;
  predictedAtDelivery: number;
  target: number;
  shortfall: number;
  verdict: SupplyVerdict;
}

export interface StoreSupplySummary {
  covered: number;
  tight: number;
  short: number;
  totalShortfall: number;
  watch: StoreWatchItem[];
}

// Aggregate every warehouse -> store route feeding this store. Need is the
// predicted top-up (what has to arrive to hit target after expected sales).
export function storeSupplySummary(storeId: string, edges: SupplyChainEdge[]): StoreSupplySummary {
  let covered = 0;
  let tight = 0;
  let short = 0;
  let totalShortfall = 0;
  const watch: StoreWatchItem[] = [];

  edges
    .filter(e => e.kind === 'route' && e.to === storeId)
    .forEach(route => {
      (route.items || []).forEach((it: SupplyChainEdgeItem) => {
        const need = it.predictedTopUp ?? it.topUp ?? 0;
        if (need <= 0) return;
        const verdict: SupplyVerdict = it.verdict || 'covered';
        if (verdict === 'short') short++;
        else if (verdict === 'tight') tight++;
        else covered++;
        const shortfall = it.shortfall ?? Math.max(0, need - (it.available ?? 0));
        totalShortfall += shortfall;
        const onHand = it.storeStock ?? 0;
        const predictedSold = it.predictedConsumption ?? 0;
        watch.push({
          rawItemName: it.rawItemName,
          itemName: it.itemName,
          predictedSold,
          onHand,
          predictedAtDelivery: Math.max(0, onHand - predictedSold),
          target: it.targetAmount ?? 0,
          shortfall,
          verdict
        });
      });
    });

  watch.sort((a, b) => verdictRank[a.verdict] - verdictRank[b.verdict] || b.shortfall - a.shortfall);
  return { covered, tight, short, totalShortfall, watch };
}

export interface StoreSalesItem {
  rawItemName: string;
  itemName: string;
  units: number;
  revenue: number;
}

// Top sellers over the last `days` recorded order-history days, by revenue.
export function storeSalesMix(business: LiveBusinessData | undefined, days = 7, limit = 5): StoreSalesItem[] {
  const history = (business?.orderHistory || []).filter(h => h.dayNumber != null);
  const window = history.slice(-days);
  const byItem = new Map<string, StoreSalesItem>();
  window.forEach(day => {
    (day.itemSales || []).forEach(sale => {
      const key = getCanonicalProductKey(sale.rawItemName, sale.itemName);
      const row = byItem.get(key) || {
        rawItemName: sale.rawItemName || key,
        itemName: sale.itemName,
        units: 0,
        revenue: 0
      };
      row.units += sale.amountSold || 0;
      row.revenue += sale.totalPrice || 0;
      byItem.set(key, row);
    });
  });
  return [...byItem.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

// --- Warehouse ---

export interface WarehouseStockSummary {
  skus: number;
  units: number;
  critical: number;
  warning: number;
  healthy: number;
  noData: number;
}

export function warehouseStockSummary(warehouse: LiveWarehouseData | undefined): WarehouseStockSummary {
  const stock = warehouse?.stock || [];
  let units = 0;
  let critical = 0;
  let warning = 0;
  let healthy = 0;
  let noData = 0;
  stock.forEach(item => {
    units += item.quantity ?? item.units ?? 0;
    if (item.daysLeft == null || item.daysLeft < 0) noData++;
    else if (item.daysLeft <= WAREHOUSE_RUNWAY_CRITICAL_DAYS) critical++;
    else if (item.daysLeft <= WAREHOUSE_RUNWAY_WARNING_DAYS) warning++;
    else healthy++;
  });
  return { skus: stock.length, units, critical, warning, healthy, noData };
}

// Lowest-runway stocked items first, for a compact watch list.
export function warehouseCriticalItems(warehouse: LiveWarehouseData | undefined, limit = 6) {
  return (warehouse?.stock || [])
    .filter(item => item.daysLeft != null && item.daysLeft >= 0)
    .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))
    .slice(0, limit);
}

export interface OutboundDestination {
  storeId: string;
  storeName: string;
  status: 'covered' | 'tight' | 'short';
  shortCount: number;
  tightCount: number;
  itemCount: number;
  shortfall: number;
}

export function warehouseOutbound(
  warehouseId: string,
  edges: SupplyChainEdge[],
  allNodes: SupplyChainNode[]
): OutboundDestination[] {
  return edges
    .filter(e => e.kind === 'route' && e.from === warehouseId)
    .map(route => {
      const shortfall = (route.items || []).reduce((sum, it) => sum + (it.shortfall ?? 0), 0);
      const status: OutboundDestination['status'] = route.fulfillable
        ? 'covered'
        : route.partial
          ? 'tight'
          : 'short';
      return {
        storeId: route.to,
        storeName: nodeName(allNodes, route.to),
        status,
        shortCount: route.shortCount ?? 0,
        tightCount: route.tightCount ?? 0,
        itemCount: (route.items || []).length,
        shortfall
      };
    })
    .sort((a, b) => b.shortfall - a.shortfall);
}

export interface InboundImport {
  importerId: string;
  importerName: string;
  nextDeliveryDay?: number;
  itemCount: number;
  units: number;
}

export function warehouseInbound(
  warehouseId: string,
  edges: SupplyChainEdge[],
  allNodes: SupplyChainNode[]
): InboundImport[] {
  return edges
    .filter(e => e.kind === 'import' && e.to === warehouseId)
    .map(edge => ({
      importerId: edge.from,
      importerName: nodeName(allNodes, edge.from),
      nextDeliveryDay: edge.nextDeliveryDay,
      itemCount: (edge.items || []).length,
      units: (edge.items || []).reduce((sum, it) => sum + (it.amount ?? 0), 0)
    }));
}

// --- Importer ---

export interface ImporterOrder {
  warehouseId: string;
  warehouseName: string;
  nextDeliveryDay?: number;
  items: SupplyChainEdgeItem[];
  units: number;
}

export interface ImporterSummary {
  orders: ImporterOrder[];
  totalUnits: number;
  totalItems: number;
  nextDeliveryDay?: number;
}

export function importerSummary(
  importerId: string,
  edges: SupplyChainEdge[],
  allNodes: SupplyChainNode[]
): ImporterSummary {
  const orders = edges
    .filter(e => e.kind === 'import' && e.from === importerId)
    .map(edge => ({
      warehouseId: edge.to,
      warehouseName: nodeName(allNodes, edge.to),
      nextDeliveryDay: edge.nextDeliveryDay,
      items: edge.items || [],
      units: (edge.items || []).reduce((sum, it) => sum + (it.amount ?? 0), 0)
    }));
  const totalUnits = orders.reduce((sum, o) => sum + o.units, 0);
  const totalItems = orders.reduce((sum, o) => sum + o.items.length, 0);
  const days = orders.map(o => o.nextDeliveryDay).filter((d): d is number => d != null);
  return {
    orders,
    totalUnits,
    totalItems,
    nextDeliveryDay: days.length ? Math.min(...days) : undefined
  };
}

// --- Wholesaler ---

export interface WholesaleDelivery {
  storeId: string;
  storeName: string;
  nextDeliveryDay?: number;
  items: SupplyChainEdgeItem[];
  units: number;
  deliveryFee?: number;
  totalPricePerDelivery?: number;
  orderedThisWeek?: number;
  orderedLastWeek?: number;
}

export interface WholesalerSummary {
  deliveries: WholesaleDelivery[];
  totalUnits: number;
  totalItems: number;
  nextDeliveryDay?: number;
}

export function wholesalerSummary(
  wholesalerId: string,
  edges: SupplyChainEdge[],
  allNodes: SupplyChainNode[],
  contracts: LiveDeliveryContractData[]
): WholesalerSummary {
  const deliveries = edges
    .filter(e => e.kind === 'delivery' && e.from === wholesalerId)
    .map(edge => {
      const contract = contracts.find(
        c => c.wholesaleAddress === wholesalerId && c.businessAddress === edge.to
      );
      return {
        storeId: edge.to,
        storeName: nodeName(allNodes, edge.to),
        nextDeliveryDay: contract?.nextDeliveryDay ?? edge.nextDeliveryDay,
        items: edge.items || [],
        units: (edge.items || []).reduce((sum, it) => sum + (it.amount ?? 0), 0),
        deliveryFee: contract?.deliveryFee,
        totalPricePerDelivery: contract?.totalPricePerDelivery,
        orderedThisWeek: contract?.items?.reduce((sum, it) => sum + (it.amountOrderedThisWeek ?? 0), 0),
        orderedLastWeek: contract?.items?.reduce((sum, it) => sum + (it.amountOrderedLastWeek ?? 0), 0)
      };
    });
  const days = deliveries.map(d => d.nextDeliveryDay).filter((d): d is number => d != null);
  return {
    deliveries,
    totalUnits: deliveries.reduce((sum, d) => sum + d.units, 0),
    totalItems: deliveries.reduce((sum, d) => sum + d.items.length, 0),
    nextDeliveryDay: days.length ? Math.min(...days) : undefined
  };
}
