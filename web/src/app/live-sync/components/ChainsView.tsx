'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronDown, ArrowUpDown, DollarSign, TrendingUp, Percent, Trophy, Factory } from 'lucide-react';
import { LiveBusinessData, LiveLogisticsPlanData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import { buildChains, Chain } from '@/lib/chains';
import BusinessLogo from './BusinessLogo';
import InsufficientData from './InsufficientData';

interface ChainsViewProps {
  businesses: LiveBusinessData[];
  logisticsPlans: LiveLogisticsPlanData[];
  gameDay: number;
}

type SortKey = 'name' | 'revenue' | 'cost' | 'profit' | 'margin' | 'wow' | 'share';

function formatMoney(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.abs(Math.round(value)).toLocaleString()}`;
}

export default function ChainsView({ businesses, logisticsPlans, gameDay }: ChainsViewProps) {
  const { t } = useTranslation();
  const chains = useMemo(
    () => buildChains(businesses, logisticsPlans, gameDay),
    [businesses, logisticsPlans, gameDay]
  );
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('profit');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const totalRevenue = chains.reduce((sum, chain) => sum + chain.revenue, 0);
  const totalProfit = chains.reduce((sum, chain) => sum + chain.profit, 0);
  const overallMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : null;
  const positiveProfitTotal = chains.reduce((sum, chain) => sum + Math.max(0, chain.profit), 0);

  const shareOf = (chain: Chain): number | null =>
    positiveProfitTotal > 0 && chain.profit > 0 ? (chain.profit / positiveProfitTotal) * 100 : null;

  const revenueLast7 = chains.reduce((sum, chain) => sum + (chain.last7 ?? 0), 0);
  const revenuePrev7 = chains.reduce((sum, chain) => sum + (chain.prev7 ?? 0), 0);
  const hasTrend = chains.some(chain => chain.last7 != null && chain.prev7 != null);
  const revenueWow = hasTrend && revenuePrev7 > 0 ? ((revenueLast7 - revenuePrev7) / revenuePrev7) * 100 : null;
  const profitableCount = chains.filter(chain => chain.profit > 0).length;
  const marginGauge = overallMargin == null ? 0 : Math.max(0, Math.min(100, overallMargin));
  const bestMarginChain = [...chains]
    .filter(chain => chain.marginPct != null && chain.revenue > 0)
    .sort((a, b) => (b.marginPct ?? 0) - (a.marginPct ?? 0))[0] ?? null;
  const topChain = [...chains].sort((a, b) => b.profit - a.profit)[0] ?? null;

  const sortValue = (chain: Chain, key: SortKey): number | string => {
    switch (key) {
      case 'name': return chain.name.toLowerCase();
      case 'revenue': return chain.revenue;
      case 'cost': return chain.cost;
      case 'profit': return chain.profit;
      case 'margin': return chain.marginPct ?? Number.NEGATIVE_INFINITY;
      case 'wow': return chain.changePct ?? Number.NEGATIVE_INFINITY;
      case 'share': return shareOf(chain) ?? Number.NEGATIVE_INFINITY;
    }
  };

  const sorted = useMemo(() => {
    return [...chains].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      const cmp = typeof av === 'string' || typeof bv === 'string'
        ? String(av).localeCompare(String(bv))
        : (av as number) - (bv as number);
      return sortDir === 'desc' ? -cmp : cmp;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chains, sortKey, sortDir, positiveProfitTotal]);

  const maxAbsProfit = Math.max(1, ...chains.map(chain => Math.abs(chain.profit)));

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir(key === 'name' ? 'asc' : 'desc');
    }
  };

  const SortTh = ({ label, colKey, align = 'right' }: { label: string; colKey: SortKey; align?: 'left' | 'right' | 'center' }) => {
    const alignClass = align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
    return (
      <th
        onClick={() => handleSort(colKey)}
        className={`py-2.5 px-4 cursor-pointer select-none hover:text-[var(--text-main)] transition-colors ${alignClass}`}
      >
        <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : ''}`}>
          <span>{label}</span>
          {sortKey === colKey ? (
            sortDir === 'desc' ? <ChevronDown className="w-3 h-3 text-emerald-500" /> : <ChevronRight className="w-3 h-3 rotate-[-90deg] text-emerald-500" />
          ) : (
            <ArrowUpDown className="w-3 h-3 opacity-40" />
          )}
        </div>
      </th>
    );
  };

  return (
    <div className="space-y-6">
      {chains.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] text-center text-xs text-[var(--text-subtle)]">
          {t('liveHq.chainsEmpty', 'No chains yet - once you run shops, the depots and factories behind them appear here.')}
        </div>
      ) : (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Combined Revenue + week-on-week */}
            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.chainsKpiRevenue', 'Combined Revenue')}</span>
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-xl font-bold font-mono text-[var(--text-main)]">
                {formatMoney(totalRevenue)}<span className="text-xs font-normal text-[var(--text-subtle)]">/wk</span>
              </div>
              <div className="text-[11px] font-semibold">
                {revenueWow == null ? (
                  <InsufficientData reason={t('liveHq.insufficientWow', 'Compares the last 7 in-game days with the 7 before, read straight from your save\'s records. This site does not have two full weeks of trading history yet.')} />
                ) : (
                  <span className={revenueWow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                    {revenueWow >= 0 ? '+' : ''}{revenueWow.toFixed(0)}% {t('liveHq.chainsVsLastWeek', 'vs last week')}
                  </span>
                )}
              </div>
            </div>

            {/* Combined Profit + how many chains are in the black */}
            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.chainsKpiProfit', 'Combined Profit')}</span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className={`text-xl font-bold font-mono ${totalProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                {formatMoney(totalProfit)}<span className="text-xs font-normal text-[var(--text-subtle)]">/wk</span>
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                {t('liveHq.chainsProfitableOf', '{profitable} of {total} chains profitable')
                  .replace('{profitable}', String(profitableCount))
                  .replace('{total}', String(chains.length))}
              </div>
            </div>

            {/* Overall Margin + gauge and best chain */}
            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.chainsKpiMargin', 'Overall Margin')}</span>
                <Percent className="w-3.5 h-3.5 text-sky-500" />
              </div>
              <div className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400">
                {overallMargin == null ? <InsufficientData reason={t('liveHq.insufficientMargin', 'Needs recorded revenue and profit for the period; a chain or site with no sales yet has none.')} className="text-[11px]" /> : `${overallMargin.toFixed(0)}%`}
              </div>
              <div className="h-1.5 rounded-full bg-[var(--bg-base)] border border-[var(--border-subtle)] overflow-hidden">
                <div
                  className={`h-full rounded-full ${(overallMargin ?? 0) >= 0 ? 'bg-sky-500' : 'bg-rose-500'}`}
                  style={{ width: `${marginGauge}%` }}
                />
              </div>
              <div className="text-[11px] text-[var(--text-muted)] truncate">
                {bestMarginChain && bestMarginChain.marginPct != null
                  ? t('liveHq.chainsBestMargin', 'Best: {name} {pct}%').replace('{name}', bestMarginChain.name).replace('{pct}', bestMarginChain.marginPct.toFixed(0))
                  : <InsufficientData reason={t('liveHq.insufficientBestMargin', 'No chain has a recorded margin yet.')} />}
              </div>
            </div>

            {/* Top contributor by profit */}
            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.chainsTopContributor', 'Top Contributor')}</span>
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-base font-bold text-[var(--text-main)] truncate">
                {topChain ? topChain.name : '-'}
              </div>
              <div className="text-[11px] text-[var(--text-muted)]">
                {topChain ? (
                  <>
                    <span className={topChain.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-500 font-semibold'}>
                      {formatMoney(topChain.profit)}/wk
                    </span>
                    {(() => {
                      const share = shareOf(topChain);
                      return share != null ? (
                        <span> · {t('liveHq.chainsShareOfProfit', '{share}% of profit').replace('{share}', share.toFixed(0))}</span>
                      ) : null;
                    })()}
                  </>
                ) : (
                  <InsufficientData reason={t('liveHq.insufficientTopContributor', 'No chain has a recorded profit to rank yet.')} />
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-3">
            <div className="border border-[var(--border-base)] rounded-xl overflow-hidden bg-[var(--bg-base)]">
              <div className="max-h-[520px] overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 z-10 bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase select-none">
                    <tr>
                      <SortTh label={t('liveHq.chainCol', 'Chain')} colKey="name" align="left" />
                      <SortTh label={t('liveHq.chainRevenueCol', 'Revenue')} colKey="revenue" />
                      <SortTh label={t('liveHq.chainCostCol', 'Cost')} colKey="cost" />
                      <SortTh label={t('liveHq.chainProfitCol', 'Profit')} colKey="profit" />
                      <SortTh label={t('liveHq.netMarginCol', 'Net Margin')} colKey="margin" align="center" />
                      <SortTh label={t('liveHq.wowCol', 'WoW')} colKey="wow" align="center" />
                      <SortTh label={t('liveHq.chainsColShare', 'Share')} colKey="share" align="center" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {sorted.map(chain => {
                      const isOpen = openKey === chain.key;
                      const share = shareOf(chain);
                      return (
                        <FragmentRow
                          key={chain.key}
                          chain={chain}
                          isOpen={isOpen}
                          share={share}
                          maxAbsProfit={maxAbsProfit}
                          onToggle={() => setOpenKey(isOpen ? null : chain.key)}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FragmentRow({ chain, isOpen, share, maxAbsProfit, onToggle }: { chain: Chain; isOpen: boolean; share: number | null; maxAbsProfit: number; onToggle: () => void }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { composition } = chain;
  return (
    <>
      <tr onClick={onToggle} className="hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer">
        <td className="py-2.5 px-4">
          <div className="flex items-center gap-2.5">
            {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-[var(--text-subtle)] shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-[var(--text-subtle)] shrink-0" />}
            {chain.isSupport ? (
              <div className="w-6 h-6 rounded-xl bg-slate-900 border border-slate-700/60 flex items-center justify-center shrink-0 shadow-xs">
                <Factory className="w-3.5 h-3.5 text-slate-300" />
              </div>
            ) : (
              <BusinessLogo business={chain.representative} sizeClass="w-6 h-6" />
            )}
            <div className="min-w-0">
              <div className="font-semibold text-[var(--text-main)] truncate">{chain.name}</div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-[var(--text-subtle)]">
                <span>{t('liveHq.chainsShops', '{n} shops').replace('{n}', String(composition.shops))}</span>
                {composition.depots > 0 && <span>· {t('liveHq.chainsDepots', '{n} depots').replace('{n}', String(composition.depots))}</span>}
                {composition.factories > 0 && <span>· {t('liveHq.chainsFactories', '{n} factories').replace('{n}', String(composition.factories))}</span>}
                {composition.offices > 0 && <span>· {t('liveHq.chainsOffices', '{n} offices').replace('{n}', String(composition.offices))}</span>}
              </div>
            </div>
          </div>
        </td>
        <td className="py-2.5 px-4 text-right font-mono font-bold text-[var(--text-main)]">{formatMoney(chain.revenue)}</td>
        <td className="py-2.5 px-4 text-right font-mono text-rose-500">{formatMoney(-chain.cost)}</td>
        <td className="py-2.5 px-4">
          <div className="flex items-center justify-end gap-2">
            <div className="hidden sm:block relative w-24 h-1.5 rounded-full bg-[var(--bg-base)] border border-[var(--border-subtle)] overflow-hidden shrink-0">
              <div
                className={`absolute top-0 bottom-0 left-0 rounded-full ${chain.profit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.max(4, Math.round((Math.abs(chain.profit) / maxAbsProfit) * 100))}%` }}
              />
            </div>
            <span className={`font-mono font-bold text-right ${chain.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
              {formatMoney(chain.profit)}
            </span>
          </div>
        </td>
        <td className="py-2.5 px-4 text-center font-mono">
          {chain.marginPct == null ? (
            <InsufficientData reason={t('liveHq.insufficientMargin', 'Needs recorded revenue and profit for the period; a chain or site with no sales yet has none.')} className="text-[10px]" />
          ) : (
            <span className={chain.marginPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>{chain.marginPct.toFixed(0)}%</span>
          )}
        </td>
        <td className="py-2.5 px-4 text-center font-mono">
          {chain.changePct == null ? (
            <InsufficientData reason={t('liveHq.insufficientWow', 'Compares the last 7 in-game days with the 7 before, read straight from your save\'s records. This site does not have two full weeks of trading history yet.')} className="text-[10px]" />
          ) : (
            <span className={`font-bold ${chain.changePct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
              {chain.changePct >= 0 ? '+' : ''}{chain.changePct.toFixed(0)}%
            </span>
          )}
        </td>
        <td className="py-2.5 px-4 text-center font-mono">
          {share == null ? (
            <span className="text-[10px] text-[var(--text-subtle)] italic">-</span>
          ) : (
            <span className="text-[var(--text-main)] font-bold">{share.toFixed(0)}%</span>
          )}
        </td>
      </tr>
      {isOpen && chain.sites.map(site => (
        <tr
          key={`${chain.key}-${site.id}`}
          onClick={() => router.push(`/live-sync?view=stores&store=${site.id}`)}
          className="bg-[var(--bg-surface)]/40 hover:bg-[var(--bg-surface-hover)] cursor-pointer transition-colors group"
        >
          <td className="py-2 pl-12 pr-4">
            <Link
              href={`/live-sync?view=stores&store=${site.id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-[var(--text-muted)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors"
            >
              {site.name}
            </Link>
          </td>
          <td className="py-2 px-4 text-right font-mono text-[var(--text-muted)]">{formatMoney(site.weeklyRevenue ?? (site.dailyRevenue ?? 0) * 7)}</td>
          <td className="py-2 px-4" />
          <td className={`py-2 px-4 text-right font-mono ${(site.weeklyProfit ?? (site.dailyProfit ?? 0) * 7) >= 0 ? 'text-[var(--text-muted)]' : 'text-rose-500'}`}>
            {formatMoney(site.weeklyProfit ?? (site.dailyProfit ?? 0) * 7)}
          </td>
          <td className="py-2 px-4" />
          <td className="py-2 px-4" />
          <td className="py-2 px-4" />
        </tr>
      ))}
    </>
  );
}
