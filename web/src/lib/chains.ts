// Chain-level consolidation.
//
// A shop, the depot that fills it and the factory behind that depot are one trading
// operation. Read apart they are nonsense: a shop can book a large margin because its
// goods arrive at no cost to it, while the factory that made them runs a loss by
// design. So each chain leads with one line, being its combined revenue, cost and
// margin, and its sites fold underneath it.
//
// Membership comes out of the player's logistics plans, not a hand-written table: a
// factory or depot joins the kind of shop its goods mostly end up in.

import { LiveBusinessData, LiveLogisticsPlanData } from '@/context/LiveSyncContext';
import { computeSiteTrends, SiteTrend } from './trends';

const SUPPORT_TYPE_MARKERS = ['factory', 'warehouse', 'headquarter', 'office', 'storage', 'depot'];
const SUPPORT_KEY = '__support';

function isSupportSite(business: LiveBusinessData): boolean {
  const raw = (business.rawType || '').toLowerCase();
  return SUPPORT_TYPE_MARKERS.some(marker => raw.includes(marker));
}

function isFactorySite(business: LiveBusinessData): boolean {
  return (business.rawType || '').toLowerCase().includes('factory');
}

function isDepotSite(business: LiveBusinessData): boolean {
  const raw = (business.rawType || '').toLowerCase();
  return raw.includes('warehouse') || raw.includes('depot') || raw.includes('storage');
}

function isOfficeSite(business: LiveBusinessData): boolean {
  const raw = (business.rawType || '').toLowerCase();
  return raw.includes('headquarter') || raw.includes('office');
}

function typeKey(business: LiveBusinessData): string {
  return business.rawType || business.type || 'other';
}

function pluralize(label: string): string {
  return label.endsWith('s') ? label : `${label}s`;
}

export interface Chain {
  key: string;
  name: string;
  sites: LiveBusinessData[];
  count: number;
  isSupport: boolean;
  representative: LiveBusinessData;
  composition: { shops: number; depots: number; factories: number; offices: number };
  revenue: number;
  cost: number;
  profit: number;
  marginPct: number | null;
  last7: number | null;
  prev7: number | null;
  changePct: number | null;
}

export function buildChains(
  businesses: LiveBusinessData[],
  logisticsPlans: LiveLogisticsPlanData[],
  gameDay: number
): Chain[] {
  // The distribution graph, weighted by how many product lines each edge carries.
  const edges = new Map<string, { target: string; weight: number }[]>();
  for (const plan of logisticsPlans) {
    if (!plan.targetAddress) continue;
    const list = edges.get(plan.targetAddress) ?? [];
    for (const dest of plan.destinations ?? []) {
      list.push({
        target: dest.deliveryTargetAddress,
        weight: Math.max(1, (dest.stockTargets ?? []).length)
      });
    }
    edges.set(plan.targetAddress, list);
  }

  const byAddress = new Map<string, LiveBusinessData>();
  businesses.forEach(b => byAddress.set(b.address, b));

  const reachCache = new Map<string, Map<string, number>>();
  const downstream = (address: string, seen: Set<string>): Map<string, number> => {
    const cached = reachCache.get(address);
    if (cached) return cached;
    const counts = new Map<string, number>();
    for (const edge of edges.get(address) ?? []) {
      if (seen.has(edge.target)) continue;
      const target = byAddress.get(edge.target);
      if (!target) continue;
      if (!isSupportSite(target)) {
        const key = typeKey(target);
        counts.set(key, (counts.get(key) ?? 0) + edge.weight);
      } else {
        downstream(edge.target, new Set(seen).add(address)).forEach((value, key) => {
          counts.set(key, (counts.get(key) ?? 0) + value);
        });
      }
    }
    reachCache.set(address, counts);
    return counts;
  };

  const trends = computeSiteTrends(businesses, gameDay);

  const groups = new Map<string, LiveBusinessData[]>();
  for (const business of businesses) {
    let key: string;
    if (!isSupportSite(business)) {
      key = typeKey(business);
    } else {
      const reach = downstream(business.address, new Set());
      let bestKey = SUPPORT_KEY;
      let bestWeight = 0;
      reach.forEach((weight, candidate) => {
        if (weight > bestWeight) {
          bestWeight = weight;
          bestKey = candidate;
        }
      });
      key = bestKey;
    }
    const list = groups.get(key) ?? [];
    list.push(business);
    groups.set(key, list);
  }

  const chains: Chain[] = [];
  groups.forEach((members, key) => {
    const revenue = members.reduce((sum, b) => sum + (b.weeklyRevenue ?? (b.dailyRevenue ?? 0) * 7), 0);
    const profit = members.reduce((sum, b) => sum + (b.weeklyProfit ?? (b.dailyProfit ?? 0) * 7), 0);
    const cost = revenue - profit;

    // Name a chain by a shopfront, never by whichever support site happened to be
    // added to the group first.
    const namer = members.find(member => !isSupportSite(member)) ?? members[0];

    const earners = members.filter(b => (b.weeklyRevenue ?? b.dailyRevenue ?? 0) > 0);
    const rows = earners
      .map(b => trends.get(b.id))
      .filter((trend): trend is SiteTrend => Boolean(trend));
    // A movement is only reported for a chain that actually trades: a support-only
    // group (factories, depots, head office) has no shops to compare week over week.
    const hasShops = members.some(member => !isSupportSite(member));
    const ready = hasShops && rows.length > 0 && rows.length === earners.length && rows.every(row => row.ready);
    const last7 = ready ? rows.reduce((sum, row) => sum + row.last7, 0) : null;
    const prev7 = ready ? rows.reduce((sum, row) => sum + row.prev7, 0) : null;

    chains.push({
      key,
      name: key === SUPPORT_KEY ? 'Support & production' : pluralize(namer.type),
      sites: members,
      count: members.length,
      isSupport: key === SUPPORT_KEY,
      representative: namer,
      composition: {
        shops: members.filter(m => !isSupportSite(m)).length,
        depots: members.filter(isDepotSite).length,
        factories: members.filter(isFactorySite).length,
        offices: members.filter(isOfficeSite).length
      },
      revenue,
      cost,
      profit,
      marginPct: revenue > 0 ? (profit / revenue) * 100 : null,
      last7,
      prev7,
      changePct: ready && prev7 ? ((last7 as number) - prev7) / prev7 * 100 : null
    });
  });

  chains.sort((a, b) => b.profit - a.profit);
  return chains;
}
