'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Store, ChevronRight, ChevronUp, ChevronDown, ArrowUpDown, DollarSign, TrendingUp, TriangleAlert } from 'lucide-react';
import { LiveBusinessData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import { computeSiteTrends } from '@/lib/trends';
import { isStorefront } from '@/lib/alerts';
import { computeUnitEconomics, StoreUnitEconomics } from '@/lib/unitEconomics';
import InsufficientData from './InsufficientData';
import StatCard from './StatCard';
import Sparkline from './Sparkline';
import FloatingTooltip from './FloatingTooltip';

type SortKey =
  | 'name' | 'revenue' | 'cogsPct' | 'contributionPct' | 'rentPct'
  | 'laborPct' | 'otherPct' | 'profit' | 'marginPct' | 'avgBasket' | 'wow';

const ACCESSORS: Record<SortKey, (r: StoreUnitEconomics) => number | string> = {
  name: (r) => r.biz.name.toLowerCase(),
  revenue: (r) => r.revenue,
  cogsPct: (r) => r.cogsPct ?? -Infinity,
  contributionPct: (r) => r.contributionPct ?? -Infinity,
  rentPct: (r) => r.rentPct ?? -Infinity,
  laborPct: (r) => r.laborPct ?? -Infinity,
  otherPct: (r) => r.otherPct ?? -Infinity,
  profit: (r) => r.profit,
  marginPct: (r) => r.marginPct ?? -Infinity,
  avgBasket: (r) => r.avgBasket ?? -Infinity,
  wow: (r) => r.wow ?? -Infinity
};

const money = (v: number) => `$${Math.round(v).toLocaleString()}`;
const signedMoney = (v: number) => `${v < 0 ? '-' : '+'}$${Math.abs(Math.round(v)).toLocaleString()}`;
const pct = (v: number | null, digits = 1) => (v == null ? null : `${v.toFixed(digits)}%`);

function marginToneClass(margin: number | null): string {
  if (margin == null) return 'bg-[var(--bg-surface)] text-[var(--text-subtle)] border border-[var(--border-base)]';
  if (margin >= 50) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  if (margin >= 30) return 'bg-sky-500/10 text-sky-600 dark:text-sky-400';
  if (margin >= 0) return 'bg-amber-500/10 text-amber-600';
  return 'bg-rose-500/10 text-rose-500';
}

export default function FinanceUnitEconomics({ businesses, gameDay }: { businesses: LiveBusinessData[]; gameDay: number }) {
  const { t } = useTranslation();
  // Factories and warehouses are not storefronts, so they never appear here.
  const storefronts = useMemo(() => businesses.filter(isStorefront), [businesses]);
  const trends = useMemo(() => computeSiteTrends(storefronts, gameDay), [storefronts, gameDay]);
  const { rows, summary } = useMemo(() => computeUnitEconomics(storefronts, trends), [storefronts, trends]);

  const [sortKey, setSortKey] = useState<SortKey>('profit');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = useMemo(() => {
    const accessor = ACCESSORS[sortKey];
    return [...rows].sort((a, b) => {
      const va = accessor(a);
      const vb = accessor(b);
      const cmp = typeof va === 'string' && typeof vb === 'string' ? va.localeCompare(vb) : (va as number) - (vb as number);
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  const cogsUnavailable = t(
    'liveHq.unitEconomicsCogsUnavailable',
    "This save predates per-store cost recording, so cost of goods (and contribution margin) cannot be computed yet."
  );

  const blended = (value: number | null) =>
    value != null && summary.totalRevenue > 0 ? (value / summary.totalRevenue) * 100 : null;
  const totalRent = rows.some((r) => r.rent != null) ? rows.reduce((a, r) => a + (r.rent ?? 0), 0) : null;
  const totalSalaries = rows.some((r) => r.salaries != null) ? rows.reduce((a, r) => a + (r.salaries ?? 0), 0) : null;
  const totalOther = rows.some((r) => r.other != null) ? rows.reduce((a, r) => a + (r.other ?? 0), 0) : null;
  const netMarginPct = summary.totalRevenue > 0 ? (summary.totalProfit / summary.totalRevenue) * 100 : null;

  const header = (colKey: SortKey, label: string, align: 'left' | 'right' | 'center', tooltip?: string) => (
    <th className={`py-2.5 px-3 whitespace-nowrap ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}>
      <button
        type="button"
        onClick={() => toggleSort(colKey)}
        className={`inline-flex items-center gap-1 uppercase font-bold hover:text-[var(--text-main)] transition-colors ${
          align === 'right' ? 'flex-row-reverse' : ''
        }`}
      >
        {tooltip ? (
          <FloatingTooltip content={<div className="max-w-[240px] leading-relaxed">{tooltip}</div>}>
            <span className="cursor-help border-b border-dotted border-[var(--border-base)]">{label}</span>
          </FloatingTooltip>
        ) : (
          <span>{label}</span>
        )}
        {sortKey === colKey ? (
          sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-30" />
        )}
      </button>
    </th>
  );

  const pctCell = (value: number | null, abs: number | null, tone: 'cost' | 'gain') => {
    if (value == null) return <span className="text-[var(--text-subtle)]">-</span>;
    const color =
      tone === 'gain'
        ? value >= 0
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-rose-500'
        : 'text-[var(--text-main)]';
    return (
      <div className="flex flex-col items-end leading-tight">
        <span className={`font-bold ${color}`}>{pct(value)}</span>
        {abs != null ? <span className="text-[10px] text-[var(--text-subtle)] font-normal">{money(abs)}</span> : null}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="text-xs text-[var(--text-muted)]">
          {t('liveHq.unitEconomicsSubtitle', 'Revenue minus cost of goods gives contribution margin; rent, labour and other costs come out of it to reach profit.')}
        </p>
        <span className="text-[10px] font-mono text-[var(--text-subtle)]">
          {t('liveHq.commercialUnits', '{count} Commercial Units').replace('{count}', storefronts.length.toString())}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label={t('liveHq.unitEconomicsSummaryRevenue', 'Combined Weekly Revenue')}
          value={money(summary.totalRevenue)}
          sub={t('liveHq.unitEconomicsSummaryRevenueSub', '{count} storefronts').replace('{count}', summary.count.toString())}
          icon={Store}
        />
        <StatCard
          label={t('liveHq.unitEconomicsSummaryContribution', 'Contribution Margin')}
          value={summary.totalContribution != null ? money(summary.totalContribution) : '-'}
          sub={
            summary.totalContributionPct != null
              ? t('liveHq.unitEconomicsSummaryContributionSub', '{pct}% of revenue').replace('{pct}', summary.totalContributionPct.toFixed(1))
              : cogsUnavailable
          }
          icon={TrendingUp}
          tone={summary.totalContribution != null && summary.totalContribution >= 0 ? 'up' : 'main'}
        />
        <StatCard
          label={t('liveHq.unitEconomicsSummaryProfit', 'Weekly Profit')}
          value={signedMoney(summary.totalProfit)}
          sub={netMarginPct != null ? t('liveHq.unitEconomicsSummaryProfitSub', '{pct}% net margin').replace('{pct}', netMarginPct.toFixed(1)) : undefined}
          icon={DollarSign}
          tone={summary.totalProfit >= 0 ? 'up' : 'down'}
        />
        <StatCard
          label={t('liveHq.unitEconomicsSummaryLosers', 'Losing Stores')}
          value={summary.lossMakingCount.toString()}
          sub={
            summary.lossMakingCount === 0
              ? t('liveHq.unitEconomicsSummaryAllProfitable', 'All storefronts profitable')
              : t('liveHq.unitEconomicsSummaryLosersSub', '{count} of {total} · {loss}/wk')
                  .replace('{count}', summary.lossMakingCount.toString())
                  .replace('{total}', summary.count.toString())
                  .replace('{loss}', signedMoney(summary.combinedWeeklyLoss))
          }
          icon={TriangleAlert}
          tone={summary.lossMakingCount > 0 ? 'down' : 'up'}
        />
      </div>

      <div className="border border-[var(--border-base)] rounded-xl overflow-hidden bg-[var(--bg-base)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-xs text-left">
            <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase">
              <tr>
                {header('name', t('liveHq.storefront', 'Storefront'), 'left')}
                <th className="py-2.5 px-3 text-center whitespace-nowrap">{t('liveHq.unitEconomicsTrendCol', 'Trend')}</th>
                {header('revenue', t('liveHq.weeklyRevenueCol', 'Revenue'), 'right', t('liveHq.unitEconomicsRevenueTooltip', 'Last 7 in-game days of revenue, read from your save.'))}
                {header('cogsPct', t('liveHq.unitEconomicsCogsCol', 'COGS'), 'right', t('liveHq.unitEconomicsCogsTooltip', 'Cost of goods: the wholesale/resource cost of what was sold. Revenue minus COGS is contribution margin.'))}
                {header('contributionPct', t('liveHq.unitEconomicsContributionCol', 'Contribution'), 'right', t('liveHq.unitEconomicsContributionTooltip', 'Revenue minus cost of goods - the money left to cover rent, wages and everything else.'))}
                {header('rentPct', t('liveHq.unitEconomicsRentCol', 'Rent'), 'right', t('liveHq.unitEconomicsRentTooltip', 'Weekly rent as a share of revenue.'))}
                {header('laborPct', t('liveHq.unitEconomicsLaborCol', 'Labour'), 'right', t('liveHq.unitEconomicsLaborTooltip', 'Weekly salary expense as a share of revenue.'))}
                {header('otherPct', t('liveHq.unitEconomicsOtherCol', 'Other'), 'right', t('liveHq.unitEconomicsOtherTooltip', 'Marketing, licensing fees and theft/shrinkage as a share of revenue.'))}
                {header('profit', t('liveHq.weeklyProfitColumn', 'Profit'), 'right', t('liveHq.unitEconomicsProfitTooltip', 'Revenue minus every cost above, for the last 7 in-game days.'))}
                {header('marginPct', t('liveHq.netMarginCol', 'Margin'), 'center', t('liveHq.unitEconomicsMarginTooltip', 'Net margin: profit as a share of revenue. The badge compares this store with the median of its business type.'))}
                {header('avgBasket', t('liveHq.unitEconomicsBasketCol', 'Basket'), 'right', t('liveHq.unitEconomicsBasketTooltip', 'Average spend per customer, from recorded order history.'))}
                {header('wow', t('liveHq.wowCol', 'WoW'), 'center')}
                <th className="py-2.5 px-3 text-center whitespace-nowrap">{t('liveHq.action', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-[var(--text-subtle)] font-sans">
                    {t('liveHq.noCommercialUnits', 'No storefronts found.')}
                  </td>
                </tr>
              ) : (
                sorted.map((row) => {
                  const b = row.biz;
                  const wow = row.wow;
                  return (
                    <tr key={b.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors align-top">
                      <td className="py-2.5 px-3 font-sans font-semibold text-[var(--text-main)]">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span>{b.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-subtle)] font-normal">
                            {b.type}
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--text-subtle)] font-normal mt-0.5">{b.district}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex justify-center">
                          <Sparkline data={row.revenueSeries} />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex flex-col items-end leading-tight">
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{money(row.revenue)}</span>
                          {row.revPerHour != null ? (
                            <span className="text-[10px] text-[var(--text-subtle)] font-normal">
                              {t('liveHq.unitEconomicsPerHour', '{value}/open hr').replace('{value}', money(row.revPerHour))}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {row.cogs == null ? (
                          <InsufficientData reason={cogsUnavailable} className="text-[10px]" />
                        ) : (
                          pctCell(row.cogsPct, row.cogs, 'cost')
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">{pctCell(row.contributionPct, row.contribution, 'gain')}</td>
                      <td className="py-2.5 px-3 text-right">{pctCell(row.rentPct, row.rent, 'cost')}</td>
                      <td className="py-2.5 px-3 text-right">{pctCell(row.laborPct, row.salaries, 'cost')}</td>
                      <td className="py-2.5 px-3 text-right">{pctCell(row.otherPct, row.other, 'cost')}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${row.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                        {signedMoney(row.profit)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${marginToneClass(row.marginPct)}`}>
                            {row.marginPct != null ? `${row.marginPct.toFixed(0)}%` : '-'}
                          </span>
                          {row.peerCount >= 2 && row.peerMarginDelta != null ? (
                            <FloatingTooltip
                              content={
                                <div className="max-w-[240px] leading-relaxed">
                                  {t('liveHq.unitEconomicsPeerTooltip', 'Compared with the median {type} margin of {median}%.')
                                    .replace('{type}', b.type)
                                    .replace('{median}', (row.peerMarginMedian ?? 0).toFixed(0))}
                                </div>
                              }
                            >
                              <span className={`text-[9px] font-bold cursor-help ${row.peerMarginDelta >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {row.peerMarginDelta >= 0 ? '▲' : '▼'}
                                {Math.abs(row.peerMarginDelta).toFixed(0)}
                              </span>
                            </FloatingTooltip>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-[var(--text-muted)]">
                        {row.avgBasket != null ? money(row.avgBasket) : <span className="text-[var(--text-subtle)]">-</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {wow == null ? (
                          <InsufficientData
                            reason={t(
                              'liveHq.insufficientWow',
                              "Compares the last 7 in-game days with the 7 before, read straight from your save's records. This site does not have two full weeks of trading history yet."
                            )}
                            className="text-[10px]"
                          />
                        ) : (
                          <span className={`font-bold ${wow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                            {wow >= 0 ? '+' : ''}
                            {wow.toFixed(0)}%
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <Link
                          href={`/live-sync?view=stores&store=${b.id}`}
                          className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                        >
                          <span>{t('liveHq.commandRoom', 'Command Room')}</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {sorted.length > 0 ? (
              <tfoot className="border-t-2 border-[var(--border-base)] bg-[var(--bg-surface)] font-mono text-[11px]">
                <tr>
                  <td className="py-2.5 px-3 font-sans font-bold text-[var(--text-main)]" colSpan={2}>
                    {t('liveHq.unitEconomicsTotals', 'All storefronts')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{money(summary.totalRevenue)}</td>
                  <td className="py-2.5 px-3 text-right">{blended(summary.totalCogs) != null ? pct(blended(summary.totalCogs)) : '-'}</td>
                  <td className="py-2.5 px-3 text-right font-bold">{summary.totalContributionPct != null ? pct(summary.totalContributionPct) : '-'}</td>
                  <td className="py-2.5 px-3 text-right">{blended(totalRent) != null ? pct(blended(totalRent)) : '-'}</td>
                  <td className="py-2.5 px-3 text-right">{blended(totalSalaries) != null ? pct(blended(totalSalaries)) : '-'}</td>
                  <td className="py-2.5 px-3 text-right">{blended(totalOther) != null ? pct(blended(totalOther)) : '-'}</td>
                  <td className={`py-2.5 px-3 text-right font-bold ${summary.totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                    {signedMoney(summary.totalProfit)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${marginToneClass(netMarginPct)}`}>
                      {netMarginPct != null ? `${netMarginPct.toFixed(0)}%` : '-'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3" colSpan={3} />
                </tr>
              </tfoot>
            ) : null}
          </table>
        </div>
      </div>
    </div>
  );
}
