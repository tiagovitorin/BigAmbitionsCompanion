'use client';

import { useMemo } from 'react';
import { Factory, Cpu, TrendingUp, Warehouse, TriangleAlert, Share2 } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { SiteModel, DemandRow } from '@/lib/productionModel';
import { money, pct } from '@/lib/productionUi';

interface ProductionKpiRibbonProps {
  models: SiteModel[];
  demand: Record<string, DemandRow>;
}

// One cohesive palette: emerald = primary/positive, slate = neutral, amber = warning,
// rose = critical. No other hues, so the ribbon reads as a single set.
const TILE = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
const ACCENT = 'bg-emerald-500';

export default function ProductionKpiRibbon({ models, demand }: ProductionKpiRibbonProps) {
  const { t } = useTranslation();

  const stats = useMemo(() => {
    const factoryCount = models.filter(model => model.site.kind === 'factory').length;
    const warehouseCount = models.length - factoryCount;
    const sqm = models.reduce((sum, model) => sum + (model.sqm || 0), 0);
    const machines = models.reduce((sum, model) => sum + model.machineCount, 0);
    const lines = models.reduce((sum, model) => sum + model.lineCount, 0);
    const staffed = models.length ? models.reduce((sum, model) => sum + model.staffedShare, 0) / models.length : 0;
    const understaffedLines = models.reduce((sum, model) => sum + model.lines.filter(line => line.staffedShare < 0.999).length, 0);
    const feed = models.reduce((sum, model) => sum + model.feedCostPerDay, 0);
    const gross = models.reduce((sum, model) => sum + model.grossValuePerDay, 0);
    const contribution = models.reduce((sum, model) => sum + model.contributionPerDay, 0);
    const margin = gross > 0 ? (gross - feed) / gross : 0;

    const storageSites = models.filter(model => model.storage);
    const totalCapacity = storageSites.reduce((sum, model) => sum + (model.storage?.capacityBoxes || 0), 0);
    const totalUsed = storageSites.reduce((sum, model) => sum + (model.storage?.usedBoxes || 0), 0);
    const occupancy = totalCapacity > 0 ? totalUsed / totalCapacity : 0;
    const freeBoxes = Math.max(0, totalCapacity - totalUsed);
    const sitesFilling = storageSites.filter(model => model.storage?.gridlockHours != null && model.storage.gridlockHours < 72).length;

    const starvingSites = models.filter(model => model.ingredients.some(ing => ing.starvationHours != null && ing.starvationHours < 24)).length;
    const storagePressure = models.filter(model => model.storage && model.storage.gridlockHours != null && model.storage.gridlockHours < 72).length;
    const overproducing = Object.values(demand).filter(row => row.dailyProduction > 0 && (row.unrouted || (row.demandRatio != null && row.demandRatio > 30))).length;
    const exportDrain = Object.values(demand).reduce((sum, row) => sum + row.exportDrain, 0);

    return {
      factoryCount, warehouseCount, sqm, machines, lines, staffed, understaffedLines,
      feed, gross, contribution, margin,
      totalCapacity, totalUsed, occupancy, freeBoxes, sitesFilling,
      starvingSites, storagePressure, overproducing, exportDrain
    };
  }, [models, demand]);

  const siteSplitFactory = models.length ? (stats.factoryCount / models.length) * 100 : 0;
  const feedShare = stats.gross > 0 ? Math.min(100, (stats.feed / stats.gross) * 100) : 0;

  const cards = [
    {
      key: 'sites',
      label: t('liveHq.factoryKpiScale', 'Industrial sites'),
      icon: Factory,
      valueClass: 'text-[var(--text-main)]',
      value: String(models.length),
      sub: `${stats.sqm.toLocaleString()} m² ${t('liveHq.factoryKpiFloor', 'floor space')}`,
      visual: (
        <div className="space-y-1.5">
          <div className="flex h-1.5 rounded-full overflow-hidden bg-[var(--bg-base)]">
            <div className="bg-emerald-500" style={{ width: `${siteSplitFactory}%` }} />
            <div className="flex-1 bg-slate-400/60" />
          </div>
          <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{stats.factoryCount} {t('liveHq.factoryListTypeFactory', 'Factory')}</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" />{stats.warehouseCount} {t('liveHq.factoryListTypeWarehouse', 'Warehouse')}</span>
          </div>
        </div>
      )
    },
    {
      key: 'fleet',
      label: t('liveHq.factoryKpiFleet', 'Workstation fleet'),
      icon: Cpu,
      valueClass: 'text-[var(--text-main)]',
      value: String(stats.machines),
      sub: `${stats.lines} ${t('liveHq.factoryListLines', 'Lines')} · ${pct(stats.staffed)} ${t('liveHq.factoryKpiStaffed', 'staffed')}`,
      visual: (
        <div className="space-y-1.5">
          <div className="h-1.5 rounded-full overflow-hidden bg-[var(--bg-base)]">
            <div className={`h-full ${stats.staffed >= 0.999 ? 'bg-emerald-500' : stats.staffed >= 0.5 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${Math.round(stats.staffed * 100)}%` }} />
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">
            {stats.understaffedLines > 0
              ? t('liveHq.factoryKpiUnderstaffed', '{n} line(s) understaffed').replace('{n}', String(stats.understaffedLines))
              : t('liveHq.factoryKpiAllStaffed', 'Every line fully staffed')}
          </div>
        </div>
      )
    },
    {
      key: 'economics',
      label: t('liveHq.factoryKpiEconomics', 'Daily economics'),
      icon: TrendingUp,
      valueClass: 'text-emerald-600 dark:text-emerald-400',
      value: money(stats.gross),
      sub: `${pct(stats.margin)} ${t('liveHq.factoryKpiMargin', 'margin')} · ${money(stats.contribution)} ${t('liveHq.factoryKpiNet', 'net')}`,
      visual: (
        <div className="space-y-1.5">
          <div className="flex h-1.5 rounded-full overflow-hidden bg-[var(--bg-base)]">
            <div className="bg-slate-400/60" style={{ width: `${feedShare}%` }} />
            <div className="flex-1 bg-emerald-500" />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
            <span>{t('liveHq.factoryKpiFeed', 'Feed')} {money(stats.feed)}</span>
            <span className="text-emerald-600 dark:text-emerald-400">{t('liveHq.factoryKpiGross', 'Gross / day')}</span>
          </div>
        </div>
      )
    },
    {
      key: 'storage',
      label: t('liveHq.factoryKpiStorage', 'Pallet storage'),
      icon: Warehouse,
      valueClass: stats.occupancy >= 0.9 ? 'text-rose-500' : stats.occupancy >= 0.7 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--text-main)]',
      value: pct(stats.occupancy),
      sub: t('liveHq.factoryKpiStorageSub', '{used} / {capacity} boxes')
        .replace('{used}', stats.totalUsed.toLocaleString())
        .replace('{capacity}', stats.totalCapacity.toLocaleString()),
      visual: (
        <div className="space-y-1.5">
          <div className="h-1.5 rounded-full overflow-hidden bg-[var(--bg-base)]">
            <div className={`h-full ${stats.occupancy >= 0.9 ? 'bg-rose-500' : stats.occupancy >= 0.7 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(100, Math.round(stats.occupancy * 100))}%` }} />
          </div>
          <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
            <span>{t('liveHq.factoryKpiFreeBoxes', 'Free {n} boxes').replace('{n}', stats.freeBoxes.toLocaleString())}</span>
            <span className={stats.sitesFilling > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
              {stats.sitesFilling > 0
                ? t('liveHq.factoryKpiSitesFilling', '{n} filling within 72h').replace('{n}', String(stats.sitesFilling))
                : t('liveHq.factoryKpiStorageStable', 'All depots have headroom')}
            </span>
          </div>
        </div>
      )
    }
  ];

  const insights: { key: string; tone: string; icon: typeof TriangleAlert; text: string }[] = [];
  if (stats.starvingSites > 0) insights.push({ key: 'starve', tone: 'text-rose-500 bg-rose-500/10 border-rose-500/30', icon: TriangleAlert, text: t('liveHq.factoryInsightStarving', '{n} site(s) could starve within 24h').replace('{n}', String(stats.starvingSites)) });
  if (stats.storagePressure > 0) insights.push({ key: 'storage', tone: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30', icon: TriangleAlert, text: t('liveHq.factoryInsightStorage', '{n} site(s) filling up').replace('{n}', String(stats.storagePressure)) });
  if (stats.overproducing > 0) insights.push({ key: 'over', tone: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30', icon: TriangleAlert, text: t('liveHq.factoryInsightOverproducing', '{n} product(s) overproducing').replace('{n}', String(stats.overproducing)) });
  if (stats.exportDrain > 0) insights.push({ key: 'export', tone: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30', icon: Share2, text: t('liveHq.factoryInsightExport', 'Exporting {n}/day').replace('{n}', Math.round(stats.exportDrain).toLocaleString()) });

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="relative overflow-hidden p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs">
              <div className={`absolute inset-x-0 top-0 h-0.5 ${ACCENT}`} />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] uppercase font-bold tracking-wide text-[var(--text-subtle)]">{card.label}</div>
                  <div className={`text-2xl font-bold font-mono mt-0.5 truncate ${card.valueClass}`}>{card.value}</div>
                </div>
                <div className={`w-9 h-9 rounded-xl border grid place-items-center shrink-0 ${TILE}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-1.5 text-[11px] text-[var(--text-muted)] truncate">{card.sub}</div>
              <div className="mt-2.5">{card.visual}</div>
            </div>
          );
        })}
      </div>

      {insights.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {insights.map(insight => {
            const Icon = insight.icon;
            return (
              <span key={insight.key} className={`flex items-center gap-1.5 text-[11px] font-semibold border rounded-full px-2.5 py-1 ${insight.tone}`}>
                <Icon className="w-3 h-3" />
                {insight.text}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
