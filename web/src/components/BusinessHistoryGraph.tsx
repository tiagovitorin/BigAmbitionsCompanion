'use client';

import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  DollarSign,
  Package,
  TrendingUp,
} from 'lucide-react';
import { LiveBusinessData } from '@/context/LiveSyncContext';

type ViewMode = 'finances' | 'products' | 'traffic';
type TimeframeMode = '1' | '7' | '60' | 'all';

interface BusinessHistoryGraphProps {
  business: LiveBusinessData;
}

const PRODUCT_PALETTE = [
  '#38bdf8', // sky
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
  '#14b8a6', // teal
];

const fmtMoney = (val: number) => `$${Math.round(val).toLocaleString()}`;
const fmtCompact = (val: number) => {
  if (Math.abs(val) >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (Math.abs(val) >= 1_000) return `$${(val / 1_000).toFixed(1)}k`;
  return `$${Math.round(val)}`;
};

/**
 * Normalizes item names to ensure consistent keying across orderHistory and live/today sales.
 * Removes prefixes like "ba:itemname_" and strips non-alphanumeric chars.
 */
export const getCanonicalProductKey = (rawName?: string, name?: string): string => {
  const candidate = (rawName || name || '').trim();
  const cleaned = candidate
    .toLowerCase()
    .replace(/^ba:itemname_/, '')
    .replace(/^itemname_/, '')
    .replace(/[^a-z0-9]/g, '');
  return cleaned || 'unknown';
};

export default function BusinessHistoryGraph({ business }: BusinessHistoryGraphProps) {
  const [view, setView] = useState<ViewMode>('finances');
  const [timeframe, setTimeframe] = useState<TimeframeMode>('7');

  // View 1 (Finances) Toggles
  const [finToggles, setFinToggles] = useState({
    revenue: true,
    profit: true,
    expenses: true,
  });

  // View 2 (Products) Toggles: product key -> boolean, plus metric mode
  const [productMetricMode, setProductMetricMode] = useState<'revenue' | 'volume' | 'both'>('revenue');
  const [activeProductKeys, setActiveProductKeys] = useState<Record<string, boolean>>({});

  // View 3 (Traffic) Toggles
  const [trafficToggles, setTrafficToggles] = useState({
    traffic: true,
  });

  // 1. Gather all product names and determine Top 5 by all-time revenue
  const topProductsInfo = useMemo(() => {
    const revenueByProduct: Record<string, { totalRevenue: number; totalAmount: number; displayName: string }> = {};

    const processItem = (rawName: string | undefined, name: string | undefined, rev: number, amt: number) => {
      if (!name || name.toLowerCase().includes('bag')) return;
      const key = getCanonicalProductKey(rawName, name);
      if (!revenueByProduct[key]) {
        revenueByProduct[key] = {
          totalRevenue: 0,
          totalAmount: 0,
          displayName: name,
        };
      } else if (name.length > revenueByProduct[key].displayName.length) {
        // Keep the most descriptive display name (e.g. "Fresh Soda Can" over "Sodacan")
        revenueByProduct[key].displayName = name;
      }
      revenueByProduct[key].totalRevenue += rev;
      revenueByProduct[key].totalAmount += amt;
    };

    if (business.orderHistory && business.orderHistory.length > 0) {
      business.orderHistory.forEach((oh) => {
        oh.itemSales?.forEach((s) => {
          processItem(s.rawItemName, s.itemName, s.totalPrice, s.amountSold);
        });
      });
    }

    // Also include today's items
    const todayItems = business.todayItemSales || business.todayOrderSales || [];
    todayItems.forEach((s) => {
      processItem((s as any).rawItemName, s.itemName, s.totalPrice, s.amountSold);
    });

    const sorted = Object.entries(revenueByProduct)
      .sort((a, b) => b[1].totalRevenue - a[1].totalRevenue)
      .map(([key, info], idx) => ({
        key,
        name: info.displayName,
        totalRevenue: info.totalRevenue,
        totalAmount: info.totalAmount,
        color: PRODUCT_PALETTE[idx % PRODUCT_PALETTE.length],
      }));

    return sorted;
  }, [business]);

  // Set default active products (Top 5) when topProductsInfo is computed
  const visibleProductKeys = useMemo(() => {
    const keys: Record<string, boolean> = {};
    topProductsInfo.forEach((p, idx) => {
      if (activeProductKeys[p.key] !== undefined) {
        keys[p.key] = activeProductKeys[p.key];
      } else {
        keys[p.key] = idx < 5; // Default Top 5 ON
      }
    });
    return keys;
  }, [topProductsInfo, activeProductKeys]);

  // Current day in save (if available, deduce from revenueHistory or orderHistory)
  const maxDay = useMemo(() => {
    let max = 0;
    business.revenueHistory?.forEach((r) => {
      if (r.dayNumber > max) max = r.dayNumber;
    });
    business.orderHistory?.forEach((o) => {
      if (o.dayNumber > max) max = o.dayNumber;
    });
    return Math.max(max, 1);
  }, [business]);

  // Merge full financial, order, and traffic records day-by-day
  const allDailyData = useMemo(() => {
    const map = new Map<number, {
      dayNumber: number;
      revenue: number;
      profit: number;
      expenses: number;
      salaries: number;
      rent: number;
      ongoing: number;
      traffic: number;
      productRev: Record<string, number>;
      productAmt: Record<string, number>;
      isPrediction?: boolean;
    }>();

    // Fill from revenueHistory
    business.revenueHistory?.forEach((r) => {
      map.set(r.dayNumber, {
        dayNumber: r.dayNumber,
        revenue: r.revenue,
        profit: r.profit,
        expenses: r.expenses,
        salaries: r.salaries,
        rent: r.rent,
        ongoing: r.ongoing,
        traffic: 0,
        productRev: {},
        productAmt: {},
      });
    });

    // Fill from orderHistory
    business.orderHistory?.forEach((o) => {
      let entry = map.get(o.dayNumber);
      if (!entry) {
        entry = {
          dayNumber: o.dayNumber,
          revenue: o.totalRevenue,
          profit: 0,
          expenses: 0,
          salaries: 0,
          rent: 0,
          ongoing: 0,
          traffic: o.totalCustomers,
          productRev: {},
          productAmt: {},
        };
        map.set(o.dayNumber, entry);
      } else {
        entry.traffic = o.totalCustomers;
      }

      o.itemSales?.forEach((it) => {
        const key = getCanonicalProductKey(it.rawItemName, it.itemName);
        entry!.productRev[key] = (entry!.productRev[key] || 0) + it.totalPrice;
        entry!.productAmt[key] = (entry!.productAmt[key] || 0) + it.amountSold;
      });
    });

    // Today / Live Day entry
    const todayDay = maxDay + 1;
    const todayOrders = business.todayItemSales || business.todayOrderSales || [];
    let todayRev = business.dailyRevenue || 0;
    let todayProf = business.dailyProfit || 0;
    if (todayRev === 0 && todayOrders.length > 0) {
      todayRev = todayOrders.reduce((sum, it) => sum + it.totalPrice, 0);
      todayProf = todayRev - todayOrders.reduce((sum, it) => sum + it.totalWholesalePrice, 0);
    }
    const todayExp = (business.weeklyRent ? business.weeklyRent / 7 : 0);
    const todayProdRev: Record<string, number> = {};
    const todayProdAmt: Record<string, number> = {};
    todayOrders.forEach((it) => {
      const key = getCanonicalProductKey((it as any).rawItemName, it.itemName);
      todayProdRev[key] = (todayProdRev[key] || 0) + it.totalPrice;
      todayProdAmt[key] = (todayProdAmt[key] || 0) + it.amountSold;
    });

    map.set(todayDay, {
      dayNumber: todayDay,
      revenue: Math.round(todayRev),
      profit: Math.round(todayProf),
      expenses: Math.round(todayExp),
      salaries: 0,
      rent: Math.round(todayExp),
      ongoing: 0,
      traffic: business.todayCustomerCount || 0,
      productRev: todayProdRev,
      productAmt: todayProdAmt,
      isPrediction: true,
    });

    const list = Array.from(map.values()).sort((a, b) => a.dayNumber - b.dayNumber);
    return list;
  }, [business, maxDay]);

  // Filter according to timeframe
  const filteredData = useMemo(() => {
    if (allDailyData.length === 0) return [];

    if (timeframe === '1') {
      const latest = allDailyData[allDailyData.length - 1];
      return [latest];
    }

    if (timeframe === '7') {
      return allDailyData.slice(-7);
    }

    if (timeframe === '60') {
      return allDailyData.slice(-60);
    }

    // 'all' -> group by 7-day weeks
    const groups: any[] = [];
    const chunkSize = 7;
    for (let i = 0; i < allDailyData.length; i += chunkSize) {
      const chunk = allDailyData.slice(i, i + chunkSize);
      const startDay = chunk[0].dayNumber;
      const endDay = chunk[chunk.length - 1].dayNumber;
      const avgRev = Math.round(chunk.reduce((s, c) => s + c.revenue, 0) / chunk.length);
      const avgProf = Math.round(chunk.reduce((s, c) => s + c.profit, 0) / chunk.length);
      const avgExp = Math.round(chunk.reduce((s, c) => s + c.expenses, 0) / chunk.length);
      const avgTraffic = Math.round(chunk.reduce((s, c) => s + c.traffic, 0) / chunk.length);

      const prodRevAvg: Record<string, number> = {};
      const prodAmtAvg: Record<string, number> = {};
      topProductsInfo.forEach((p) => {
        prodRevAvg[p.key] = Math.round(chunk.reduce((s, c) => s + (c.productRev[p.key] || 0), 0) / chunk.length);
        prodAmtAvg[p.key] = Math.round(chunk.reduce((s, c) => s + (c.productAmt[p.key] || 0), 0) / chunk.length);
      });

      groups.push({
        dayNumber: endDay,
        label: `W${Math.floor(i / chunkSize) + 1} (D${startDay}-${endDay})`,
        revenue: avgRev,
        profit: avgProf,
        expenses: avgExp,
        traffic: avgTraffic,
        productRev: prodRevAvg,
        productAmt: prodAmtAvg,
        isPrediction: chunk.some((c) => c.isPrediction),
      });
    }
    return groups;
  }, [allDailyData, timeframe, topProductsInfo]);

  // Chart ready series data
  const chartPoints = useMemo(() => {
    return filteredData.map((d, idx) => {
      const point: any = {
        name: d.label || `Day ${d.dayNumber}`,
        dayNumber: d.dayNumber,
        revenue: d.revenue,
        profit: d.profit,
        expenses: d.expenses,
        traffic: d.traffic,
        isPrediction: d.isPrediction,
      };

      const isPenultimate = idx === filteredData.length - 2;

      // Confirmed vs Predicted lines for dashed last segment
      if (!d.isPrediction) {
        point.revenueConfirmed = d.revenue;
        point.profitConfirmed = d.profit;
        point.expensesConfirmed = d.expenses;
        point.trafficConfirmed = d.traffic;
      }
      if (d.isPrediction || isPenultimate) {
        point.revenuePredicted = d.revenue;
        point.profitPredicted = d.profit;
        point.expensesPredicted = d.expenses;
        point.trafficPredicted = d.traffic;
      }

      topProductsInfo.forEach((p) => {
        const rev = d.productRev?.[p.key] || 0;
        const amt = d.productAmt?.[p.key] || 0;
        point[`prod_rev_${p.key}`] = rev;
        point[`prod_amt_${p.key}`] = amt;

        if (!d.isPrediction) {
          point[`prod_rev_conf_${p.key}`] = rev;
          point[`prod_amt_conf_${p.key}`] = amt;
        }
        if (d.isPrediction || isPenultimate) {
          point[`prod_rev_pred_${p.key}`] = rev;
          point[`prod_amt_pred_${p.key}`] = amt;
        }
      });

      return point;
    });
  }, [filteredData, topProductsInfo]);

  // Single Day Bar Data (Timeframe '1')
  const singleDayFinData = useMemo(() => {
    if (chartPoints.length === 0) return [];
    const latest = chartPoints[chartPoints.length - 1];
    return [
      { metric: 'Revenue', value: latest.revenue, fill: '#10b981' },
      { metric: 'Profit', value: latest.profit, fill: '#38bdf8' },
      { metric: 'Expenses', value: latest.expenses, fill: '#f43f5e' },
    ];
  }, [chartPoints]);

  const singleDayProductData = useMemo(() => {
    if (chartPoints.length === 0) return [];
    const latest = chartPoints[chartPoints.length - 1];
    return topProductsInfo
      .filter((p) => visibleProductKeys[p.key])
      .map((p) => ({
        name: p.name,
        revenue: latest[`prod_rev_${p.key}`] || 0,
        volume: latest[`prod_amt_${p.key}`] || 0,
        fill: p.color,
      }))
      .sort((a, b) => (productMetricMode === 'volume' ? b.volume - a.volume : b.revenue - a.revenue));
  }, [chartPoints, topProductsInfo, visibleProductKeys, productMetricMode]);

  const singleDayTrafficData = useMemo(() => {
    if (chartPoints.length === 0) return [];
    const latest = chartPoints[chartPoints.length - 1];
    return [
      { metric: 'Customers', value: latest.traffic, fill: '#38bdf8' },
    ];
  }, [chartPoints]);

  // Custom Hover Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) return null;
    const pointData = payload[0]?.payload;
    const isPrediction = pointData?.isPrediction;

    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl p-3 shadow-xl text-xs space-y-2 min-w-44 backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1.5 gap-2">
          <span className="font-bold text-[var(--text-main)]">{label}</span>
          {isPrediction && (
            <span className="text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
              Live / Est.
            </span>
          )}
        </div>

        {view === 'finances' && (
          <div className="space-y-1">
            {finToggles.revenue && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Revenue:
                </span>
                <span className="font-mono font-bold text-emerald-500">{fmtMoney(pointData.revenue)}</span>
              </div>
            )}
            {finToggles.profit && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  Profit:
                </span>
                <span className="font-mono font-bold text-sky-400">{fmtMoney(pointData.profit)}</span>
              </div>
            )}
            {finToggles.expenses && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Expenses:
                </span>
                <span className="font-mono font-bold text-rose-500">{fmtMoney(pointData.expenses)}</span>
              </div>
            )}
          </div>
        )}

        {view === 'products' && (
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {topProductsInfo
              .filter((p) => visibleProductKeys[p.key])
              .map((p) => {
                const rev = pointData[`prod_rev_${p.key}`] || 0;
                const amt = pointData[`prod_amt_${p.key}`] || 0;
                return (
                  <div key={p.key} className="flex items-center justify-between gap-3 text-[11px]">
                    <span className="flex items-center gap-1.5 truncate max-w-32 text-[var(--text-main)]" title={p.name}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="truncate">{p.name}</span>
                    </span>
                    <span className="font-mono font-semibold shrink-0 text-[var(--text-muted)]">
                      {(productMetricMode === 'revenue' || productMetricMode === 'both') && (
                        <span className="text-emerald-500 mr-1.5">{fmtMoney(rev)}</span>
                      )}
                      {(productMetricMode === 'volume' || productMetricMode === 'both') && (
                        <span className="text-sky-400">{amt} pcs</span>
                      )}
                    </span>
                  </div>
                );
              })}
          </div>
        )}

        {view === 'traffic' && (
          <div className="space-y-1">
            {trafficToggles.traffic && (
              <div className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  Customers:
                </span>
                <span className="font-mono font-bold text-sky-400">{pointData.traffic?.toLocaleString() || 0}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const isBarView = timeframe === '1';

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-4 shadow-xs transition-all">
      {/* Top Header: View Selectors (Tabs) + Timeframe Pills */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
        {/* 3 View Tabs */}
        <div className="flex items-center gap-1 bg-[var(--bg-base)] p-1 rounded-xl border border-[var(--border-base)]">
          <button
            type="button"
            onClick={() => setView('finances')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              view === 'finances'
                ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-xs font-bold'
                : 'text-[var(--text-subtle)] hover:text-[var(--text-main)]'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
            <span>Expenses / Profit / Revenue</span>
          </button>

          <button
            type="button"
            onClick={() => setView('products')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              view === 'products'
                ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-xs font-bold'
                : 'text-[var(--text-subtle)] hover:text-[var(--text-main)]'
            }`}
          >
            <Package className="w-3.5 h-3.5 text-sky-500" />
            <span>Individual Products</span>
          </button>

          <button
            type="button"
            onClick={() => setView('traffic')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              view === 'traffic'
                ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-xs font-bold'
                : 'text-[var(--text-subtle)] hover:text-[var(--text-main)]'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
            <span>Customer Traffic</span>
          </button>
        </div>

        {/* 4 Timeframe Buttons */}
        <div className="flex items-center gap-1 bg-[var(--bg-base)] p-1 rounded-xl border border-[var(--border-base)] self-start md:self-auto">
          {[
            { id: '1', label: 'Last Day (1)' },
            { id: '7', label: 'Last 7 Days (7)' },
            { id: '60', label: 'Last 60 Days' },
            { id: 'all', label: 'All Time' },
          ].map((tf) => (
            <button
              key={tf.id}
              type="button"
              onClick={() => setTimeframe(tf.id as TimeframeMode)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                timeframe === tf.id
                  ? 'bg-[var(--bg-surface)] text-[var(--text-main)] shadow-xs font-bold'
                  : 'text-[var(--text-subtle)] hover:text-[var(--text-main)]'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Legend Toggles Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-0.5 text-xs">
        {/* VIEW 1 TOGGLES */}
        {view === 'finances' && (
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-semibold text-[var(--text-subtle)]">Legend:</span>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={finToggles.expenses}
                onChange={(e) => setFinToggles((prev) => ({ ...prev, expenses: e.target.checked }))}
                className="rounded accent-rose-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span className="font-semibold text-rose-500">Expenses</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={finToggles.profit}
                onChange={(e) => setFinToggles((prev) => ({ ...prev, profit: e.target.checked }))}
                className="rounded accent-sky-400 w-3.5 h-3.5 cursor-pointer"
              />
              <span className="font-semibold text-sky-400">Profit</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={finToggles.revenue}
                onChange={(e) => setFinToggles((prev) => ({ ...prev, revenue: e.target.checked }))}
                className="rounded accent-emerald-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Revenue</span>
            </label>
          </div>
        )}

        {/* VIEW 2 TOGGLES */}
        {view === 'products' && (
          <div className="flex flex-wrap items-center gap-3 w-full justify-between">
            {/* Metric Mode Toggle */}
            <div className="flex items-center gap-1 bg-[var(--bg-base)] p-0.5 rounded-lg border border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setProductMetricMode('revenue')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  productMetricMode === 'revenue' ? 'bg-[var(--bg-surface)] text-emerald-500 font-bold shadow-xs' : 'text-[var(--text-subtle)]'
                }`}
              >
                $ Revenue
              </button>
              <button
                type="button"
                onClick={() => setProductMetricMode('volume')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  productMetricMode === 'volume' ? 'bg-[var(--bg-surface)] text-sky-500 font-bold shadow-xs' : 'text-[var(--text-subtle)]'
                }`}
              >
                Volume (Sales Amount)
              </button>
              <button
                type="button"
                onClick={() => setProductMetricMode('both')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  productMetricMode === 'both' ? 'bg-[var(--bg-surface)] text-indigo-500 font-bold shadow-xs' : 'text-[var(--text-subtle)]'
                }`}
              >
                Both
              </button>
            </div>

            {/* Top Products Quick Toggles */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-[var(--text-subtle)]">Products (Top 5 Default):</span>
              {topProductsInfo.slice(0, 8).map((p) => {
                const active = visibleProductKeys[p.key];
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      setActiveProductKeys((prev) => ({
                        ...prev,
                        [p.key]: !active,
                      }));
                    }}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-medium transition-all cursor-pointer ${
                      active
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-[var(--text-main)] font-semibold'
                        : 'border-[var(--border-base)] text-[var(--text-subtle)] opacity-50 hover:opacity-100'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="truncate max-w-24">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 3 TOGGLES */}
        {view === 'traffic' && (
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-semibold text-[var(--text-subtle)]">Legend:</span>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={trafficToggles.traffic}
                onChange={(e) => setTrafficToggles((prev) => ({ ...prev, traffic: e.target.checked }))}
                className="rounded accent-sky-400 w-3.5 h-3.5 cursor-pointer"
              />
              <span className="font-semibold text-sky-400">Customer Count (Foot Traffic)</span>
            </label>
          </div>
        )}

        {/* Line style legend indicator for products in "both" mode */}
        {view === 'products' && productMetricMode === 'both' && !isBarView && (
          <div className="flex items-center gap-3 text-[10px] text-[var(--text-subtle)] font-mono ml-auto">
            <span className="flex items-center gap-1">
              <span className="w-3.5 border-t-2 border-solid border-emerald-400 inline-block" />
              <span>Left Axis: Revenue ($)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3.5 border-t-2 border-dotted border-sky-400 inline-block" />
              <span>Right Axis: Volume (Qty)</span>
            </span>
          </div>
        )}

        {/* Indicator for dashed current day */}
        {!isBarView && (
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-subtle)] font-mono ml-auto">
            <span className="w-4 border-t-2 border-dashed border-[var(--text-subtle)] inline-block" />
            <span>Dashed = Current Day Prediction</span>
          </div>
        )}
      </div>

      {/* Main Chart Canvas */}
      <div className="h-64 w-full pt-1">
        {/* ========================================================================= */}
        {/* CASE A: LAST DAY (1) -> BAR CHARTS                                        */}
        {/* ========================================================================= */}
        {isBarView ? (
          <>
            {view === 'finances' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={singleDayFinData} margin={{ top: 15, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis
                    dataKey="metric"
                    tick={{ fontSize: 11, fill: 'var(--text-main)', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--text-subtle)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={fmtCompact}
                    width={55}
                  />
                  <Tooltip
                    formatter={(value: any) => [fmtMoney(Number(value)), 'Total']}
                    contentStyle={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-base)',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ fontWeight: 'bold', color: 'var(--text-main)' }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[6, 6, 0, 0]}
                    barSize={44}
                    label={{
                      position: 'top',
                      fontSize: 11,
                      fontWeight: 600,
                      fill: 'var(--text-main)',
                      formatter: (v: any) => fmtMoney(Number(v)),
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}

            {view === 'products' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={singleDayProductData} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 10, fill: 'var(--text-subtle)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => (productMetricMode === 'volume' ? `${v}` : fmtCompact(v))}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 10, fill: 'var(--text-main)', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    width={120}
                  />
                  <Tooltip
                    formatter={((val: any, name: any) => [
                      name === 'revenue' ? fmtMoney(Number(val)) : `${val} pcs`,
                      name === 'revenue' ? 'Revenue' : 'Units Sold',
                    ]) as any}
                    contentStyle={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-base)',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ fontWeight: 'bold', color: 'var(--text-main)' }}
                  />
                  {(productMetricMode === 'revenue' || productMetricMode === 'both') && (
                    <Bar
                      dataKey="revenue"
                      name="Revenue"
                      fill="#10b981"
                      radius={[0, 4, 4, 0]}
                      barSize={14}
                      label={{
                        position: 'right',
                        fontSize: 10,
                        fill: 'var(--text-subtle)',
                        formatter: ((v: any) => fmtMoney(Number(v))) as any,
                      } as any}
                    />
                  )}
                  {(productMetricMode === 'volume' || productMetricMode === 'both') && (
                    <Bar
                      dataKey="volume"
                      name="Volume"
                      fill="#38bdf8"
                      radius={[0, 4, 4, 0]}
                      barSize={14}
                      label={{
                        position: 'right',
                        fontSize: 10,
                        fill: 'var(--text-subtle)',
                        formatter: ((v: any) => `${v} pcs`) as any,
                      } as any}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            )}

            {view === 'traffic' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={singleDayTrafficData} margin={{ top: 15, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis
                    dataKey="metric"
                    tick={{ fontSize: 11, fill: 'var(--text-main)', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--text-subtle)' }}
                    axisLine={false}
                    tickLine={false}
                    width={45}
                  />
                  <Tooltip
                    formatter={((val: any, name: any, item: any) => [
                      item?.payload?.metric?.includes('%') ? `${val}%` : Number(val).toLocaleString(),
                      item?.payload?.metric,
                    ]) as any}
                    contentStyle={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-base)',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                    labelStyle={{ fontWeight: 'bold', color: 'var(--text-main)' }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[6, 6, 0, 0]}
                    barSize={44}
                    label={{
                      position: 'top',
                      fontSize: 11,
                      fontWeight: 600,
                      fill: 'var(--text-main)',
                      formatter: ((v: any) => String(v)) as any,
                    } as any}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </>
        ) : (
          /* ========================================================================= */
          /* CASE B: MULTI-DAY TIME-SERIES LINE CHARTS                                 */
          /* ========================================================================= */
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartPoints}
              margin={{
                top: 10,
                right: view === 'products' && productMetricMode === 'both' ? 25 : 15,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'var(--text-subtle)' }}
                axisLine={false}
                tickLine={false}
              />

              {/* Y Axis Left (Revenue / Volume / Traffic) */}
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10, fill: 'var(--text-subtle)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={view === 'products' && productMetricMode === 'volume' ? ((v) => `${v}`) : fmtCompact}
                width={view === 'products' && productMetricMode === 'volume' ? 45 : 55}
              />

              {/* Y Axis Right (Volume Qty when viewing 'both' metrics) */}
              {view === 'products' && productMetricMode === 'both' && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10, fill: 'var(--text-subtle)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}`}
                  width={40}
                />
              )}

              <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-base)', strokeWidth: 1 }} />

              {/* -------------------- VIEW 1: FINANCES -------------------- */}
              {view === 'finances' && (
                <>
                  {finToggles.revenue && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="revenueConfirmed"
                        name="Revenue"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenuePredicted"
                        name="Revenue (Live/Est)"
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />
                    </>
                  )}

                  {finToggles.profit && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="profitConfirmed"
                        name="Profit"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="profitPredicted"
                        name="Profit (Live/Est)"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />
                    </>
                  )}

                  {finToggles.expenses && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="expensesConfirmed"
                        name="Expenses"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="expensesPredicted"
                        name="Expenses (Live/Est)"
                        stroke="#f43f5e"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />
                    </>
                  )}
                </>
              )}

              {/* -------------------- VIEW 2: PRODUCTS -------------------- */}
              {view === 'products' && (
                <>
                  {topProductsInfo
                    .filter((p) => visibleProductKeys[p.key])
                    .map((p) => (
                      <React.Fragment key={p.key}>
                        {(productMetricMode === 'revenue' || productMetricMode === 'both') && (
                          <>
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey={`prod_rev_conf_${p.key}`}
                              name={`${p.name} ($)`}
                              stroke={p.color}
                              strokeWidth={2}
                              dot={false}
                              activeDot={{ r: 4 }}
                              isAnimationActive={false}
                            />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey={`prod_rev_pred_${p.key}`}
                              name={`${p.name} ($ Est)`}
                              stroke={p.color}
                              strokeWidth={2}
                              strokeDasharray="4 4"
                              dot={false}
                              activeDot={{ r: 4 }}
                              isAnimationActive={false}
                            />
                          </>
                        )}
                        {(productMetricMode === 'volume' || productMetricMode === 'both') && (
                          <>
                            <Line
                              yAxisId={productMetricMode === 'both' ? 'right' : 'left'}
                              type="monotone"
                              dataKey={`prod_amt_conf_${p.key}`}
                              name={`${p.name} (Qty)`}
                              stroke={p.color}
                              strokeWidth={2}
                              strokeDasharray="2 2"
                              dot={false}
                              activeDot={{ r: 4 }}
                              isAnimationActive={false}
                            />
                            <Line
                              yAxisId={productMetricMode === 'both' ? 'right' : 'left'}
                              type="monotone"
                              dataKey={`prod_amt_pred_${p.key}`}
                              name={`${p.name} (Qty Est)`}
                              stroke={p.color}
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              dot={false}
                              activeDot={{ r: 4 }}
                              isAnimationActive={false}
                            />
                          </>
                        )}
                      </React.Fragment>
                    ))}
                </>
              )}

              {/* -------------------- VIEW 3: CUSTOMER TRAFFIC -------------------- */}
              {view === 'traffic' && (
                <>
                  {trafficToggles.traffic && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="trafficConfirmed"
                        name="Customers"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="trafficPredicted"
                        name="Customers (Live)"
                        stroke="#38bdf8"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />
                    </>
                  )}
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
