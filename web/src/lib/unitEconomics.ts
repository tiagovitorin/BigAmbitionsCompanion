import type { LiveBusinessData } from '@/context/LiveSyncContext';
import type { SiteTrend } from './trends';

const WEEK = 7;
const SPARK_DAYS = 14;

export interface StoreUnitEconomics {
  biz: LiveBusinessData;
  revenue: number;
  cogs: number | null;
  contribution: number | null;
  contributionPct: number | null;
  rent: number | null;
  salaries: number | null;
  other: number | null;
  profit: number;
  marginPct: number | null;
  cogsPct: number | null;
  rentPct: number | null;
  laborPct: number | null;
  otherPct: number | null;
  revPerHour: number | null;
  avgBasket: number | null;
  contributionPerStaffedHour: number | null;
  revenueSeries: number[];
  wow: number | null;
  peerMarginDelta: number | null;
  peerMarginMedian: number | null;
  peerCount: number;
}

export interface UnitEconomicsSummary {
  count: number;
  totalRevenue: number;
  totalCogs: number | null;
  totalContribution: number | null;
  totalContributionPct: number | null;
  totalProfit: number;
  lossMakingCount: number;
  combinedWeeklyLoss: number;
}

function sum(values: (number | undefined)[]): number {
  return values.reduce<number>((acc, v) => acc + (v ?? 0), 0);
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function computeUnitEconomics(
  stores: LiveBusinessData[],
  trends: Map<string, SiteTrend>
): { rows: StoreUnitEconomics[]; summary: UnitEconomicsSummary } {
  const rows: StoreUnitEconomics[] = stores.map((biz) => {
    const history = (biz.revenueHistory || []).slice(-WEEK);
    const hasHistory = history.length > 0;

    const revenue = hasHistory ? sum(history.map((h) => h.revenue)) : (biz.weeklyRevenue ?? 0);
    // Costs only when the mod actually streamed the income-statement line, so we never
    // invent a $0 COGS for saves that predate the field.
    const hasCogs = hasHistory && history.some((h) => h.resources != null);
    const cogs = hasCogs ? sum(history.map((h) => h.resources)) : null;
    const salaries = hasHistory && history.some((h) => h.salaries != null) ? sum(history.map((h) => h.salaries)) : null;
    const rent = hasHistory && history.some((h) => h.rent != null) ? sum(history.map((h) => h.rent)) : (biz.weeklyRent ?? null);
    const ongoing = hasHistory && history.some((h) => h.ongoing != null) ? sum(history.map((h) => h.ongoing)) : null;
    const profit = hasHistory ? sum(history.map((h) => h.profit)) : (biz.weeklyProfit ?? 0);

    const contribution = cogs != null ? revenue - cogs : null;
    // ongoing (game TotalOngoing) = salaries + rent + marketing + licensing + theft,
    // so "other" isolates marketing / licensing / shrinkage.
    const other = ongoing != null && salaries != null && rent != null ? ongoing - salaries - rent : null;

    const pct = (v: number | null) => (v != null && revenue > 0 ? (v / revenue) * 100 : null);

    const weeklyOrders = (biz.orderHistory || []).slice(-WEEK);
    const customers = sum(weeklyOrders.map((o) => o.totalCustomers));
    const orderRevenue = sum(weeklyOrders.map((o) => o.totalRevenue));
    const openHours = biz.openHoursPerWeek ?? 0;
    const staffedHours = biz.scheduledShiftHoursPerWeek ?? 0;

    return {
      biz,
      revenue,
      cogs,
      contribution,
      contributionPct: pct(contribution),
      rent,
      salaries,
      other,
      profit,
      marginPct: revenue > 0 ? (profit / revenue) * 100 : null,
      cogsPct: pct(cogs),
      rentPct: pct(rent),
      laborPct: pct(salaries),
      otherPct: pct(other),
      revPerHour: openHours > 0 ? revenue / openHours : null,
      avgBasket: customers > 0 ? orderRevenue / customers : null,
      contributionPerStaffedHour: contribution != null && staffedHours > 0 ? contribution / staffedHours : null,
      revenueSeries: (biz.revenueHistory || []).slice(-SPARK_DAYS).map((h) => h.revenue),
      wow: trends.get(biz.id)?.changePct ?? null,
      peerMarginDelta: null,
      peerMarginMedian: null,
      peerCount: 0
    };
  });

  // Peer comparison: median net margin within each business type.
  const byType = new Map<string, number[]>();
  for (const row of rows) {
    if (row.marginPct == null) continue;
    const key = row.biz.type || 'Other';
    const list = byType.get(key);
    if (list) list.push(row.marginPct);
    else byType.set(key, [row.marginPct]);
  }
  const medianByType = new Map<string, number | null>();
  byType.forEach((list, key) => medianByType.set(key, median(list)));
  for (const row of rows) {
    const key = row.biz.type || 'Other';
    const med = medianByType.get(key) ?? null;
    row.peerMarginMedian = med;
    row.peerMarginDelta = med != null && row.marginPct != null ? row.marginPct - med : null;
    row.peerCount = byType.get(key)?.length ?? 0;
  }

  const totalRevenue = rows.reduce((acc, r) => acc + r.revenue, 0);
  const totalCogs = rows.some((r) => r.cogs != null) ? rows.reduce((acc, r) => acc + (r.cogs ?? 0), 0) : null;
  const totalContribution = totalCogs != null ? totalRevenue - totalCogs : null;
  const totalProfit = rows.reduce((acc, r) => acc + r.profit, 0);
  const losers = rows.filter((r) => r.profit < 0);

  return {
    rows,
    summary: {
      count: rows.length,
      totalRevenue,
      totalCogs,
      totalContribution,
      totalContributionPct:
        totalContribution != null && totalRevenue > 0 ? (totalContribution / totalRevenue) * 100 : null,
      totalProfit,
      lossMakingCount: losers.length,
      combinedWeeklyLoss: losers.reduce((acc, r) => acc + r.profit, 0)
    }
  };
}
