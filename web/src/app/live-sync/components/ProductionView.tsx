'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Factory, Warehouse, ChevronRight, Search, TriangleAlert, Cpu, Workflow, ArrowUpDown } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { ProductionContext, buildProduction, SiteModel, DemandRow } from '@/lib/productionModel';
import { money } from '@/lib/productionUi';
import { resolveItemImage } from '@/lib/logistics';
import ProductionKpiRibbon from './ProductionKpiRibbon';
import RingGauge from './RingGauge';
import { ItemIcon } from './SupplyChainDetailAtoms';
import FloatingTooltip from './FloatingTooltip';
import FilterDropdown from './FilterDropdown';

type TypeFilter = 'all' | 'factory' | 'warehouse' | 'starving' | 'overproducing';
type SortBy = 'gross' | 'machines' | 'starvation' | 'name';

const ROW_GRID = 'minmax(180px,2.1fr) minmax(150px,2fr) 1fr 0.9fr 0.9fr 1.1fr 1.7fr';

const staffTone = (value: number) => (value >= 0.999 ? '#10b981' : value >= 0.5 ? '#f59e0b' : '#f43f5e');
const storageTone = (value: number) => (value >= 0.9 ? '#f43f5e' : value >= 0.7 ? '#f59e0b' : '#10b981');

function TipContent({ title, rows }: { title: string; rows?: { label: string; value?: string }[] }) {
  return (
    <div className="space-y-1">
      <div className="font-semibold">{title}</div>
      {rows && rows.length > 0 && (
        <div className="space-y-0.5">
          {rows.map((row, index) => (
            <div key={`${row.label}-${index}`} className="flex items-center justify-between gap-4">
              <span className="text-slate-300">{row.label}</span>
              {row.value !== undefined && <span className="font-mono text-white">{row.value}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function siteFlags(model: SiteModel, demand: Record<string, DemandRow>) {
  const starving = model.ingredients.some(ing => ing.starvationHours != null && ing.starvationHours < 24);
  const overproducing = Object.keys(model.dailyOutputByProduct).some(rawId => {
    const row = demand[rawId];
    return row != null && (row.unrouted || (row.demandRatio != null && row.demandRatio > 30));
  });
  return { starving, overproducing };
}

export default function ProductionView({ ctx }: { ctx: ProductionContext }) {
  const { t } = useTranslation();
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('gross');
  const [query, setQuery] = useState('');

  const { models, demand } = useMemo(() => buildProduction(ctx), [ctx]);

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();
    const filtered = models.filter(model => {
      const flags = siteFlags(model, demand);
      if (typeFilter === 'factory' && model.site.kind !== 'factory') return false;
      if (typeFilter === 'warehouse' && model.site.kind !== 'warehouse') return false;
      if (typeFilter === 'starving' && !flags.starving) return false;
      if (typeFilter === 'overproducing' && !flags.overproducing) return false;
      if (search) {
        const haystack = `${model.site.name} ${model.site.address} ${model.lines.map(l => l.outputName || '').join(' ')}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });

    const shortestStarve = (model: SiteModel) => {
      const values = model.ingredients.map(ing => ing.starvationHours).filter((v): v is number => v != null);
      return values.length ? Math.min(...values) : Infinity;
    };

    return [...filtered].sort((a, b) => {
      if (sortBy === 'machines') return b.machineCount - a.machineCount;
      if (sortBy === 'starvation') return shortestStarve(a) - shortestStarve(b);
      if (sortBy === 'name') return a.site.name.localeCompare(b.site.name);
      return b.grossValuePerDay - a.grossValuePerDay;
    });
  }, [models, demand, typeFilter, sortBy, query]);

  if (models.length === 0) {
    return (
      <div className="p-10 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] text-center space-y-2">
        <Factory className="w-8 h-8 mx-auto text-[var(--text-subtle)]" />
        <p className="text-sm font-semibold text-[var(--text-main)]">
          {t('liveHq.productionEmptyTitle', 'No production lines yet')}
        </p>
        <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
          {t('liveHq.productionEmptyBody', 'Set up workstations in a factory or warehouse and this page will show what each line makes and what it costs to feed.')}
        </p>
      </div>
    );
  }

  const filters: { key: TypeFilter; label: string }[] = [
    { key: 'all', label: t('liveHq.filterAll', 'All') },
    { key: 'factory', label: t('liveHq.factoryListTypeFactory', 'Factory') },
    { key: 'warehouse', label: t('liveHq.factoryListTypeWarehouse', 'Warehouse') },
    { key: 'starving', label: t('liveHq.filterStarving', 'Starvation risk') },
    { key: 'overproducing', label: t('liveHq.filterOverproducing', 'Overproducing') }
  ];

  return (
    <div className="space-y-6">
      <ProductionKpiRibbon models={models} demand={demand} />

      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[var(--text-subtle)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={t('liveHq.factorySearchPlaceholder', 'Search site, address or product')}
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl p-0.5 text-xs">
            {filters.map(filter => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setTypeFilter(filter.key)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${typeFilter === filter.key ? 'bg-emerald-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <FilterDropdown
            icon={ArrowUpDown}
            value={sortBy}
            onChange={value => setSortBy(value as SortBy)}
            options={[
              { value: 'gross', label: t('liveHq.sortGross', 'Sort: Gross value') },
              { value: 'machines', label: t('liveHq.sortMachines', 'Sort: Machines') },
              { value: 'starvation', label: t('liveHq.sortStarvation', 'Sort: Starvation risk') },
              { value: 'name', label: t('liveHq.sortName', 'Sort: Name') }
            ]}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--bg-surface)] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <div className="min-w-[1120px]">
            <div className="grid gap-3 pl-4 pr-9 py-2.5 border-b border-[var(--border-base)] text-[10px] uppercase font-bold tracking-wider text-[var(--text-subtle)]" style={{ gridTemplateColumns: ROW_GRID }}>
              <span>{t('liveHq.factoryListSite', 'Site')}</span>
              <span>{t('liveHq.factoryListOutputs', 'Outputs')}</span>
              <span className="text-center">{t('liveHq.factoryListFleet', 'Fleet')}</span>
              <span className="text-center">{t('liveHq.factoryLineStaffed', 'Staffed')}</span>
              <span className="text-center">{t('liveHq.factoryKpiStorage', 'Storage')}</span>
              <span className="text-right">{t('liveHq.factoryListFootprint', 'Footprint')}</span>
              <span className="text-right">{t('liveHq.factoryKpiEconomics', 'Daily economics')}</span>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {rows.map(model => {
                const flags = siteFlags(model, demand);
                const SiteIcon = model.site.kind === 'warehouse' ? Warehouse : Factory;
                const outputMap = new Map<string, { raw: string; name: string; perDay: number }>();
                for (const line of model.lines) {
                  if (!line.outputRawId || !line.outputName) continue;
                  const existing = outputMap.get(line.outputRawId);
                  if (existing) existing.perDay += line.dailyOutput;
                  else outputMap.set(line.outputRawId, { raw: line.outputRawId, name: line.outputName, perDay: line.dailyOutput });
                }
                const outputs = Array.from(outputMap.values());
                const storage = model.storage;
                const understaffedLines = model.lines.filter(line => line.staffedShare < 0.999).length;
                const worstStarvation = model.ingredients
                  .filter(ing => ing.starvationHours != null)
                  .sort((a, b) => (a.starvationHours ?? Infinity) - (b.starvationHours ?? Infinity))[0];
                return (
                  <Link
                    key={model.site.id}
                    href={`/live-sync?view=production&factory=${encodeURIComponent(model.site.id)}`}
                    className="relative grid gap-3 pl-4 pr-9 py-3 items-center hover:bg-[var(--bg-surface-hover)] transition-colors group"
                    style={{ gridTemplateColumns: ROW_GRID }}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <FloatingTooltip
                        className="inline-flex"
                        content={<TipContent title={model.site.name} rows={[
                          { label: t('liveHq.factoryListType', 'Type'), value: model.site.kind === 'warehouse' ? t('liveHq.factoryListTypeWarehouse', 'Warehouse') : t('liveHq.factoryListTypeFactory', 'Factory') },
                          { label: t('liveHq.factoryListLines', 'Lines'), value: String(model.lineCount) },
                          { label: t('liveHq.factoryLineMachines', 'Machines'), value: String(model.machineCount) },
                          { label: t('liveHq.factoryListFootprint', 'Footprint'), value: model.sqm ? `${model.sqm.toLocaleString()} m²` : '-' }
                        ]} />}
                      >
                        <SiteIcon className={`w-4 h-4 shrink-0 ${model.site.kind === 'warehouse' ? 'text-sky-500' : 'text-amber-500'}`} />
                      </FloatingTooltip>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="block truncate text-xs font-semibold text-[var(--text-main)]">{model.site.name}</span>
                          {flags.starving && (
                            <FloatingTooltip className="inline-flex" content={<TipContent title={t('liveHq.badgeStarvation', 'Starvation < 24h')} rows={worstStarvation ? [{ label: worstStarvation.name, value: `${Math.round(worstStarvation.starvationHours ?? 0)}h` }] : undefined} />}>
                              <TriangleAlert className="w-3 h-3 text-rose-500 shrink-0" />
                            </FloatingTooltip>
                          )}
                          {flags.overproducing && (
                            <FloatingTooltip className="inline-flex" content={<TipContent title={t('liveHq.badgeOverproducing', 'Overproducing')} />}>
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            </FloatingTooltip>
                          )}
                        </span>
                        <span className="block truncate text-[10px] text-[var(--text-subtle)]">{model.site.address}</span>
                      </span>
                    </span>

                    <span className="flex items-center gap-1 min-w-0">
                      {outputs.length === 0 ? (
                        <span className="text-[10px] text-[var(--text-subtle)]">{t('liveHq.factoryListNoOutput', 'No output')}</span>
                      ) : (
                        <>
                          {outputs.slice(0, 4).map(output => (
                            <FloatingTooltip
                              key={output.raw}
                              className="inline-flex"
                              content={<TipContent title={output.name} rows={[{ label: t('liveHq.factoryMakesPerDay', 'Makes / day'), value: Math.round(output.perDay).toLocaleString() }]} />}
                            >
                              <ItemIcon src={resolveItemImage(output.raw)} size={28} />
                            </FloatingTooltip>
                          ))}
                          {outputs.length > 4 && <span className="ml-0.5 font-mono text-[10px] text-[var(--text-subtle)]">+{outputs.length - 4}</span>}
                        </>
                      )}
                    </span>

                    <span className="flex items-center justify-center gap-3 font-mono text-[11px] text-[var(--text-main)]">
                      <FloatingTooltip className="inline-flex items-center gap-1" content={<TipContent title={t('liveHq.factoryListLines', 'Lines')} rows={[{ label: t('liveHq.factoryLineMachines', 'Machines'), value: String(model.machineCount) }]} />}>
                        <Workflow className="w-3 h-3 text-[var(--text-subtle)]" />{model.lineCount}
                      </FloatingTooltip>
                      <FloatingTooltip className="inline-flex items-center gap-1" content={<TipContent title={t('liveHq.factoryLineMachines', 'Machines')} rows={[{ label: t('liveHq.factoryListLines', 'Lines'), value: String(model.lineCount) }]} />}>
                        <Cpu className="w-3 h-3 text-[var(--text-subtle)]" />{model.machineCount}
                      </FloatingTooltip>
                    </span>

                    <span className="flex justify-center">
                      <FloatingTooltip className="inline-flex" content={<TipContent title={t('liveHq.factoryStaffing', 'Staffing')} rows={[
                        { label: t('liveHq.factoryLineStaffed', 'Staffed'), value: `${Math.round(model.staffedShare * 100)}%` },
                        { label: t('liveHq.factoryListUnderstaffed', 'Understaffed lines'), value: String(understaffedLines) }
                      ]} />}>
                        <RingGauge value={model.staffedShare} color={staffTone(model.staffedShare)} />
                      </FloatingTooltip>
                    </span>

                    <span className="flex justify-center">
                      {storage
                        ? (
                          <FloatingTooltip className="inline-flex" content={<TipContent title={t('liveHq.factoryKpiStorage', 'Pallet storage')} rows={[
                            { label: t('liveHq.factoryKpiUsed', 'Used'), value: `${storage.usedBoxes.toLocaleString()} / ${storage.capacityBoxes.toLocaleString()}` },
                            { label: t('liveHq.factoryKpiFree', 'Free'), value: `${storage.freeBoxes.toLocaleString()} boxes` },
                            { label: t('liveHq.factoryKpiGridlockLabel', 'Gridlock'), value: storage.gridlockHours != null ? `${storage.gridlockHours.toFixed(1)}h` : t('liveHq.factoryStorageStable', 'Not filling up') }
                          ]} />}>
                            <RingGauge value={storage.occupancy} color={storageTone(storage.occupancy)} />
                          </FloatingTooltip>
                        )
                        : <span className="text-[10px] text-[var(--text-subtle)]">{t('liveHq.factoryListNoStorage', 'No racks')}</span>}
                    </span>

                    <span className="text-right leading-tight">
                      <span className="block font-mono text-xs text-[var(--text-main)]">{model.sqm ? `${model.sqm.toLocaleString()} m²` : '-'}</span>
                      <span className="block font-mono text-[10px] text-[var(--text-muted)]">{model.grossPerSqm != null ? `${money(model.grossPerSqm)}/m²` : ''}</span>
                    </span>

                    <span className="text-right leading-tight">
                      <span className="block font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">{money(model.grossValuePerDay)}</span>
                      <span className="block font-mono text-[10px] text-[var(--text-muted)]">{t('liveHq.factoryKpiNet', 'net')} {money(model.contributionPerDay)}</span>
                      <span className="block font-mono text-[10px] text-rose-500">{money(model.feedCostPerDay)}</span>
                    </span>

                    <ChevronRight className="absolute right-3 w-3.5 h-3.5 text-[var(--text-subtle)] group-hover:text-emerald-500 transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
