'use client';

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Map, Store, PackagePlus, Layers, ChartPie, Target, TrendingUp, Crown, Coins, Flame, Info } from 'lucide-react';
import { LiveBusinessData, LiveProductMarketData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import { buildDemandGrid, DemandCell, DemandGap } from '@/lib/demand';
import { SPARSE_RIVALS_LEVEL } from '@/lib/thresholds';
import StatCard from './StatCard';
import FloatingTooltip from './FloatingTooltip';

interface DemandGridPanelProps {
  businesses: LiveBusinessData[];
  productMarket?: LiveProductMarketData[];
  gameDay: number;
}

interface HoverState {
  x: number;
  y: number;
  rowRaw: string;
  hoodRaw: string;
  cell: DemandCell;
  typeName: string;
}

type Tab = 'type' | 'gaps' | 'hoods';

// Sequential scale: darker = a larger share of that type's range is in strong demand,
// so colour and the number in the cell always agree. The heat is drawn as an opaque
// base plus a coloured overlay, so an enlarged cell never looks see-through.
function cellStyle(cell: DemandCell): { opacity: number; text: string; border: string } {
  if (cell.strong === 0) return { opacity: 0, text: 'text-[var(--text-subtle)]', border: 'border-[var(--border-subtle)]' };
  const fraction = cell.total > 0 ? cell.strong / cell.total : 0;
  return {
    opacity: 0.2 + fraction * 0.7,
    text: fraction >= 0.6 ? 'text-white' : 'text-[var(--text-main)]',
    border: fraction >= 0.6 ? 'border-emerald-400/60' : 'border-emerald-500/40'
  };
}

const pctText = (value: number | null) => (value == null ? '-' : `${value.toFixed(0)}%`);

export default function DemandGridPanel({ businesses, productMarket, gameDay }: DemandGridPanelProps) {
  const { t, tGame } = useTranslation();
  const [tab, setTab] = useState<Tab>('type');
  const [hover, setHover] = useState<HoverState | null>(null);

  const grid = useMemo(() => buildDemandGrid(productMarket, businesses, gameDay), [productMarket, businesses, gameDay]);
  const { summary } = grid;
  const maxOpportunity = grid.gaps[0]?.opportunity ?? 1;

  if (grid.types.length === 0 && grid.gaps.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <Map className="w-4 h-4 text-emerald-500" />
          <span>{t('liveHq.demandTitle', 'Market Demand')}</span>
        </h3>
        <div className="py-4 text-center text-xs text-[var(--text-subtle)]">
          {t('liveHq.demandNoData', 'No market demand data available yet.')}
        </div>
      </div>
    );
  }

  // Rows ranked by their strongest neighbourhood, so the best opportunities sit on top.
  const typeRows = [...grid.types].sort((a, b) => b.peak - a.peak);

  const cellFor = (cells: DemandCell[], hoodRaw: string) => cells.find(c => c.hoodRaw === hoodRaw);
  const isCrossRow = (rowRaw: string) => hover?.rowRaw === rowRaw;
  const isCrossCol = (hoodRaw: string) => hover?.hoodRaw === hoodRaw;

  const signalBadges = (gap: DemandGap) => (
    <span className="inline-flex items-center gap-1 ml-1.5">
      {gap.monopoly && (
        <FloatingTooltip content={<div className="max-w-[220px] leading-relaxed">{t('liveHq.demandSignalMonopoly', 'You would be the only seller of this here.')}</div>}>
          <span className="inline-flex text-amber-500 cursor-help"><Crown className="w-3 h-3" /></span>
        </FloatingTooltip>
      )}
      {gap.cheapImport && (
        <FloatingTooltip content={<div className="max-w-[220px] leading-relaxed">{t('liveHq.demandSignalCheapImport', 'Cheap to import right now (a low import price index).')}</div>}>
          <span className="inline-flex text-emerald-500 cursor-help"><Coins className="w-3 h-3" /></span>
        </FloatingTooltip>
      )}
      {gap.hypePrimed && (
        <FloatingTooltip content={<div className="max-w-[220px] leading-relaxed">{t('liveHq.demandSignalHypePrimed', 'Not sold in this neighbourhood for a long time, so the game may start a hype wave here.')}</div>}>
          <span className="inline-flex text-rose-500 cursor-help"><Flame className="w-3 h-3" /></span>
        </FloatingTooltip>
      )}
    </span>
  );

  const renderTypeTab = () => (
    <>
      <p className="text-[11px] text-[var(--text-muted)]">
        {t('liveHq.demandGridHint', 'Each cell shows how many of that business type\'s products are in strong demand in that neighbourhood, as wanted/range. Hover a cell to light up its row and column for comparison.')}
      </p>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-[var(--text-subtle)]">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400 border border-white/70" />
          {t('liveHq.demandLegendSelling', 'You already run this type here')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white/70" />
          {t('liveHq.demandLegendWhitespace', 'Under-served demand you do not sell')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[3px] border-2 border-amber-400" />
          {t('liveHq.demandLegendBest', 'Best district for that type')}
        </span>
        <span className="flex items-center gap-2">
          {t('liveHq.demandLegendLow', 'none')}
          <span className="h-2.5 w-28 rounded-full border border-[var(--border-subtle)] bg-gradient-to-r from-[var(--bg-base)] via-emerald-500/60 to-emerald-600" />
          {t('liveHq.demandLegendHigh', 'all strong')}
        </span>
      </div>

      <div className="overflow-x-auto border border-[var(--border-base)] rounded-xl bg-[var(--bg-base)]">
        <table className="table-fixed w-full min-w-[820px] text-left border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 top-0 z-40 w-40 bg-[var(--bg-surface)] py-2 px-3 text-[10px] font-bold text-[var(--text-subtle)] uppercase border-b border-r border-[var(--border-base)]">
                {t('common.type', 'Type')}
              </th>
              {grid.hoods.map(hood => (
                <th
                  key={hood.raw}
                  className={`sticky top-0 z-30 py-2 px-1 text-[9px] font-bold uppercase text-center align-bottom bg-[var(--bg-surface)] border-b border-[var(--border-base)] transition-colors ${isCrossCol(hood.raw) ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-subtle)]'}`}
                >
                  {hood.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {typeRows.map(row => (
              <tr key={row.raw} className="border-b border-[var(--border-subtle)]/40 last:border-0">
                <td
                  className={`sticky left-0 z-10 bg-[var(--bg-surface)] py-1 px-3 font-semibold text-xs leading-tight break-words border-r border-[var(--border-subtle)] transition-colors ${isCrossRow(row.raw) ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text-main)]'}`}
                  title={row.name}
                >
                  {row.name}
                </td>
                {grid.hoods.map(hood => {
                  const cell = cellFor(row.cells, hood.raw);
                  if (!cell) {
                    return (
                      <td key={hood.raw} className={`p-0.5 transition-opacity ${hover && !isCrossRow(row.raw) && !isCrossCol(hood.raw) ? 'opacity-40' : ''}`}>
                        <div className="h-9 rounded-md border border-dashed border-[var(--border-subtle)] flex items-center justify-center text-[10px] text-[var(--text-subtle)]">
                          -
                        </div>
                      </td>
                    );
                  }
                  const style = cellStyle(cell);
                  const exact = hover?.rowRaw === row.raw && hover?.hoodRaw === hood.raw;
                  const dim = hover && !exact && !isCrossRow(row.raw) && !isCrossCol(hood.raw);
                  const isBest = hood.raw === row.bestHoodRaw;
                  return (
                    <td key={hood.raw} className={`p-0.5 transition-opacity ${dim ? 'opacity-40' : ''}`}>
                      <div
                        onMouseEnter={(e) => setHover({ x: e.clientX, y: e.clientY, rowRaw: row.raw, hoodRaw: hood.raw, cell, typeName: row.name })}
                        onMouseMove={(e) => setHover(prev => (prev ? { ...prev, x: e.clientX, y: e.clientY } : prev))}
                        onMouseLeave={() => setHover(null)}
                        className={`relative h-9 rounded-md overflow-hidden border flex items-center justify-center font-mono text-[11px] font-bold bg-[var(--bg-surface)] transition-transform ${style.border} ${isBest ? 'ring-1 ring-amber-400/70' : ''} ${exact ? 'z-20 ring-2 ring-emerald-300 scale-[1.08] shadow-lg' : ''}`}
                      >
                        {style.opacity > 0 && (
                          <span className="absolute inset-0 bg-emerald-600" style={{ opacity: style.opacity }} />
                        )}
                        {cell.whitespace > 0 && (
                          <span className="absolute top-[3px] left-[3px] w-2.5 h-2.5 rounded-full bg-amber-400 border border-white/80 shadow-sm" />
                        )}
                        {cell.sells && (
                          <span className="absolute top-[3px] right-[3px] w-2.5 h-2.5 rounded-full bg-sky-400 border border-white/80 shadow-sm" />
                        )}
                        <span className={`relative z-10 ${style.text}`}>{cell.strong}/{cell.total}</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderGapsTab = () => (
    <>
      <p className="text-[11px] text-[var(--text-muted)]">{t('liveHq.demandGapsHint', 'Products in strong demand in a neighbourhood where you do not sell them. Strongest demand with the fewest rivals first.')}</p>
      {grid.gaps.length === 0 ? (
        <div className="py-4 text-center text-xs text-[var(--text-subtle)]">
          {t('liveHq.demandNoGaps', 'Every strongly-demanded product is already sold somewhere you operate.')}
        </div>
      ) : (
        <div className="border border-[var(--border-base)] rounded-xl overflow-hidden">
          <div className="max-h-[380px] overflow-y-auto">
            <table className="table-fixed w-full text-xs text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-[var(--bg-surface)] text-[10px] font-bold text-[var(--text-subtle)] uppercase">
                <tr>
                  <th className="py-2 px-3">{t('liveHq.product', 'Product')}</th>
                  <th className="py-2 px-3 w-36">{t('common.district', 'District')}</th>
                  <th className="py-2 px-2 w-28">{t('liveHq.demandAvg', 'Demand')}</th>
                  <th className="py-2 px-2 w-16 text-center">{t('liveHq.demandRivals', 'Rivals')}</th>
                  <th className="py-2 px-2 w-32">
                    <FloatingTooltip content={<div className="max-w-[230px] leading-relaxed">{t('liveHq.demandOpportunityHint', 'Demand adjusted for how many rivals already sell it here. Higher means more wanted with less competition.')}</div>}>
                      <span className="cursor-help border-b border-dotted border-[var(--border-base)]">{t('liveHq.demandOpportunity', 'Opportunity')}</span>
                    </FloatingTooltip>
                  </th>
                  <th className="py-2 px-3 w-28 text-right">{t('liveHq.demandStatus', 'For you')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {grid.gaps.map(gap => (
                  <tr key={`${gap.rawItemName}-${gap.hoodRaw}`} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="py-2 px-3 font-semibold text-[var(--text-main)] truncate">
                      {tGame(gap.rawItemName)}
                      {signalBadges(gap)}
                    </td>
                    <td className="py-2 px-3 text-[var(--text-muted)] truncate">{gap.hoodName}</td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${gap.demand}%` }} />
                        </div>
                        <span className="font-mono text-[10px] text-[var(--text-main)] w-6 text-right">{gap.demand}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-[var(--text-muted)]">
                      {gap.providers <= SPARSE_RIVALS_LEVEL ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{gap.providers}</span>
                      ) : (
                        gap.providers
                      )}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden">
                          <div className="h-full rounded-full bg-amber-500" style={{ width: `${Math.round((gap.opportunity / maxOpportunity) * 100)}%` }} />
                        </div>
                        <span className="font-mono text-[10px] font-bold text-[var(--text-main)] w-8 text-right">{gap.opportunity}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right">
                      {gap.soldElsewhere ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25 whitespace-nowrap">
                          <Store className="w-3 h-3" />
                          {t('liveHq.demandExpand', 'Expand')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 whitespace-nowrap">
                          <PackagePlus className="w-3 h-3" />
                          {t('liveHq.demandNewProduct', 'New product')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );

  const renderHoodsTab = () => (
    <>
      <p className="text-[11px] text-[var(--text-muted)]">{t('liveHq.demandHoodsHint', 'Neighbourhoods ranked by unserved strong demand, so you can see where to expand next.')}</p>
      <div className="border border-[var(--border-base)] rounded-xl overflow-hidden">
        <div className="max-h-[420px] overflow-y-auto">
          <table className="table-fixed w-full text-xs text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-[var(--bg-surface)] text-[10px] font-bold text-[var(--text-subtle)] uppercase">
              <tr>
                <th className="py-2 px-3">{t('liveHq.demandHoodCol', 'Neighbourhood')}</th>
                <th className="py-2 px-2 w-16 text-center">{t('liveHq.demandHoodStrong', 'Strong')}</th>
                <th className="py-2 px-2 w-40">{t('liveHq.demandHoodCovered', 'Covered')}</th>
                <th className="py-2 px-2 w-24 text-center">{t('liveHq.demandHoodWhitespace', 'Whitespace')}</th>
                <th className="py-2 px-2 w-24 text-center">{t('liveHq.demandHoodAvg', 'Avg demand')}</th>
                <th className="py-2 px-3 w-40">{t('liveHq.demandHoodTopGap', 'Best untapped')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {grid.leaderboard.map(row => {
                const coverage = row.strongMarkets > 0 ? (row.covered / row.strongMarkets) * 100 : 0;
                return (
                  <tr key={row.hoodRaw} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="py-2 px-3 font-semibold text-[var(--text-main)] truncate">{row.hoodName}</td>
                    <td className="py-2 px-2 text-center font-mono text-[var(--text-main)]">{row.strongMarkets}</td>
                    <td className="py-2 px-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden">
                          <div className="h-full rounded-full bg-sky-500" style={{ width: `${coverage}%` }} />
                        </div>
                        <span className="font-mono text-[10px] text-[var(--text-muted)] w-8 text-right">{coverage.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center">
                      {row.whitespace > 0 ? (
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{row.whitespace}</span>
                      ) : (
                        <span className="font-mono text-[var(--text-subtle)]">0</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-[var(--text-muted)]">{row.avgDemand}</td>
                    <td className="py-2 px-3 text-[var(--text-muted)] truncate">{row.topGapItem ? tGame(row.topGapItem) : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label={t('liveHq.demandKpiStrong', 'Strong markets')}
          value={summary.strongMarkets.toString()}
          sub={t('liveHq.demandKpiStrongSub', '{count} neighbourhoods').replace('{count}', grid.leaderboard.length.toString())}
          icon={Layers}
        />
        <StatCard
          label={t('liveHq.demandKpiCoverage', 'Your coverage')}
          value={pctText(summary.coveragePct)}
          sub={t('liveHq.demandKpiCoverageSub', '{covered} of {strong} strong markets')
            .replace('{covered}', summary.coveredMarkets.toString())
            .replace('{strong}', summary.strongMarkets.toString())}
                    icon={ChartPie}
        />
        <StatCard
          label={t('liveHq.demandKpiWhitespace', 'Whitespace')}
          value={summary.whitespaceCount.toString()}
          sub={t('liveHq.demandKpiWhitespaceSub', 'strong markets you do not sell')}
          icon={Target}
        />
        <StatCard
          label={t('liveHq.demandKpiTop', 'Top opportunity')}
          value={summary.topOpportunity ? tGame(summary.topOpportunity.rawItemName) : '-'}
          sub={
            summary.topOpportunity
              ? t('liveHq.demandKpiTopSub', '{hood} · demand {demand} · {rivals} rivals')
                  .replace('{hood}', summary.topOpportunity.hoodName)
                  .replace('{demand}', summary.topOpportunity.demand.toString())
                  .replace('{rivals}', summary.topOpportunity.providers.toString())
              : t('liveHq.demandTopNone', 'None right now')
          }
          icon={TrendingUp}
          tone={summary.topOpportunity ? 'up' : 'main'}
        />
      </div>

      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center bg-[var(--bg-base)] border border-[var(--border-base)] rounded-lg p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setTab('type')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${tab === 'type' ? 'bg-emerald-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              {t('liveHq.demandByType', 'By business type')}
            </button>
            <button
              type="button"
              onClick={() => setTab('gaps')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${tab === 'gaps' ? 'bg-emerald-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              {t('liveHq.demandNotSelling', 'Not selling yet')}
              {grid.gaps.length > 0 && <span className="ml-1 text-[9px] opacity-80">{grid.gaps.length}</span>}
            </button>
            <button
              type="button"
              onClick={() => setTab('hoods')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer ${tab === 'hoods' ? 'bg-emerald-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              {t('liveHq.demandByHood', 'Neighbourhoods')}
            </button>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] text-[var(--text-subtle)]">
            <Info className="w-3 h-3" />
            {t('liveHq.demandKpiFooter', 'Opportunity = demand ÷ (1 + rivals), an app score, not a game figure.')}
          </span>
        </div>

        {tab === 'type' && renderTypeTab()}
        {tab === 'gaps' && renderGapsTab()}
        {tab === 'hoods' && renderHoodsTab()}
      </div>

      {hover && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed pointer-events-none z-[60] px-3.5 py-2.5 rounded-xl bg-slate-950 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs space-y-1 w-56"
          style={{
            left: hover.x + 260 > window.innerWidth ? Math.max(10, hover.x - 250) : hover.x + 14,
            top: hover.y + 170 > window.innerHeight ? Math.max(10, hover.y - 160) : hover.y + 14
          }}
        >
          <div className="font-bold text-[11px]">{hover.typeName}</div>
          <div className="text-slate-300 text-[10px]">{hover.cell.hoodName}</div>
          <div className="pt-1 border-t border-slate-800 space-y-0.5 text-[11px]">
            <div className="text-slate-200">
              {t('liveHq.demandTooltipProducts', '{strong} of {total} products in strong demand')
                .replace('{strong}', String(hover.cell.strong))
                .replace('{total}', String(hover.cell.total))}
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span>{t('liveHq.demandAvgDemand', 'Average demand')}</span>
              <span className="font-mono font-bold text-emerald-400">{hover.cell.avgDemand}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span>{t('liveHq.demandAvgRivals', 'Average rivals')}</span>
              <span className="font-mono font-bold text-white">{hover.cell.avgProviders}</span>
            </div>
            {hover.cell.whitespace > 0 && (
              <div className="text-amber-300 text-[10px] pt-0.5">
                {t('liveHq.demandTooltipWhitespace', '{count} under-served you do not sell').replace('{count}', String(hover.cell.whitespace))}
              </div>
            )}
            {hover.cell.sells && (
              <div className="text-sky-300 text-[10px] pt-0.5">{t('liveHq.demandYouSellHere', 'You already sell this type here')}</div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
