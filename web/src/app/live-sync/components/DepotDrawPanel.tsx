'use client';

import { useMemo, useState } from 'react';
import { Warehouse, ChevronDown, ChevronsDownUp, ChevronsUpDown, ArrowUpDown } from 'lucide-react';
import { LiveWarehouseData, LiveImportPartnershipData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import { buildDepotDraw } from '@/lib/depot';
import FilterDropdown, { DropdownOption } from './FilterDropdown';

interface DepotDrawPanelProps {
  warehouses: LiveWarehouseData[];
  importPartnerships: LiveImportPartnershipData[];
  gameDay: number;
}

type AttentionKind = 'short' | 'tight' | 'idle';
type SortKey = 'severity' | 'magnitude' | 'name' | 'warehouse';

interface AttentionRow {
  key: string;
  kind: AttentionKind;
  rawItemName: string;
  itemName: string;
  warehouseAddress: string;
  detail: string;
  magnitude: number; // units short for orders, days of cover for idle
}

const KIND_BADGE: Record<AttentionKind, string> = {
  short: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
  tight: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  idle: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
};

const KIND_RANK: Record<AttentionKind, number> = { short: 0, tight: 1, idle: 2 };

export default function DepotDrawPanel({ warehouses, importPartnerships, gameDay }: DepotDrawPanelProps) {
  const { t, tGame } = useTranslation();
  const draw = useMemo(
    () => buildDepotDraw(warehouses, importPartnerships, gameDay),
    [warehouses, importPartnerships, gameDay]
  );
  const warehouseName = useMemo(() => {
    const map = new Map<string, string>();
    warehouses.forEach(w => map.set(w.address, w.name || w.address));
    return map;
  }, [warehouses]);
  const nameOf = (address: string) => warehouseName.get(address) || address;

  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [kindFilter, setKindFilter] = useState<'all' | AttentionKind>('all');
  const [sortBy, setSortBy] = useState<SortKey>('severity');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const attention: AttentionRow[] = useMemo(() => {
    const rows: AttentionRow[] = [];
    for (const row of draw.orders) {
      if (row.verdict === 'covered') continue;
      rows.push({
        key: `order-${row.warehouseAddress}-${row.rawItemName}`,
        kind: row.verdict === 'short' ? 'short' : 'tight',
        rawItemName: row.rawItemName,
        itemName: row.itemName,
        warehouseAddress: row.warehouseAddress,
        detail: `${row.weeklyOrder.toLocaleString()} / ${row.weeklyConsumption.toLocaleString()}/wk`,
        magnitude: Math.max(0, row.weeklyConsumption - row.weeklyOrder)
      });
    }
    for (const item of draw.idle) {
      rows.push({
        key: `idle-${item.warehouseAddress}-${item.rawItemName}`,
        kind: 'idle',
        rawItemName: item.rawItemName,
        itemName: item.itemName,
        warehouseAddress: item.warehouseAddress,
        detail: item.daysCover != null
          ? t('liveHq.depotDaysCover', '{d}d cover').replace('{d}', String(Math.round(item.daysCover)))
          : t('liveHq.depotNoFlow', 'no flow'),
        magnitude: item.daysCover ?? Number.MAX_SAFE_INTEGER
      });
    }
    return rows;
  }, [draw, t]);

  if (draw.idle.length === 0 && draw.orders.length === 0) return null;

  const kindLabel = (kind: AttentionKind) =>
    kind === 'short'
      ? t('liveHq.verdictShort', 'short')
      : kind === 'tight'
      ? t('liveHq.verdictTight', 'tight')
      : t('liveHq.depotIdleChip', 'idle');

  const shortCount = draw.orders.filter(o => o.verdict === 'short').length;
  const tightCount = draw.orders.filter(o => o.verdict === 'tight').length;
  const idleCount = draw.idle.length;

  const warehouseOptions: DropdownOption[] = [
    { value: 'all', label: t('liveHq.depotAllWarehouses', 'All warehouses') },
    ...warehouses.map(w => ({ value: w.address, label: w.name || w.address }))
  ];
  const sortOptions: DropdownOption[] = [
    { value: 'severity', label: t('liveHq.depotSortSeverity', 'Severity') },
    { value: 'magnitude', label: t('liveHq.depotSortMagnitude', 'Biggest first') },
    { value: 'name', label: t('liveHq.depotSortName', 'Item name') },
    { value: 'warehouse', label: t('liveHq.depotSortWarehouse', 'Warehouse') }
  ];

  const filtered = attention.filter(row =>
    (kindFilter === 'all' || row.kind === kindFilter) &&
    (warehouseFilter === 'all' || row.warehouseAddress === warehouseFilter)
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.itemName.localeCompare(b.itemName);
    if (sortBy === 'warehouse') return a.warehouseAddress.localeCompare(b.warehouseAddress) || KIND_RANK[a.kind] - KIND_RANK[b.kind];
    if (sortBy === 'magnitude') return b.magnitude - a.magnitude;
    return KIND_RANK[a.kind] - KIND_RANK[b.kind] || b.magnitude - a.magnitude;
  });

  // Card per warehouse for clear separation.
  const groups: { address: string; rows: AttentionRow[]; worst: number }[] = [];
  const groupIndex = new Map<string, number>();
  for (const row of sorted) {
    let index = groupIndex.get(row.warehouseAddress);
    if (index === undefined) {
      index = groups.length;
      groupIndex.set(row.warehouseAddress, index);
      groups.push({ address: row.warehouseAddress, rows: [], worst: KIND_RANK[row.kind] });
    }
    groups[index].rows.push(row);
    groups[index].worst = Math.min(groups[index].worst, KIND_RANK[row.kind]);
  }
  if (sortBy !== 'warehouse') {
    groups.sort((a, b) => a.worst - b.worst || b.rows.length - a.rows.length);
  }

  const toggleGroup = (address: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(address)) next.delete(address);
      else next.add(address);
      return next;
    });
  };

  const allCollapsed = groups.length > 0 && groups.every(group => collapsed.has(group.address));
  const toggleAll = () => setCollapsed(allCollapsed ? new Set() : new Set(groups.map(group => group.address)));

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-amber-500" />
          <span>{t('liveHq.depotDrawTitle', 'Depot Draw & Ordering')}</span>
        </h3>
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          {shortCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full border bg-rose-500/10 text-rose-500 border-rose-500/30">
              {t('liveHq.depotShortCount', '{n} short').replace('{n}', String(shortCount))}
            </span>
          )}
          {tightCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full border bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
              {t('liveHq.depotTightCount', '{n} tight').replace('{n}', String(tightCount))}
            </span>
          )}
          {idleCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full border bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30">
              {t('liveHq.depotIdleCount', '{n} idle').replace('{n}', String(idleCount))}
            </span>
          )}
          {attention.length === 0 && (
            <span className="px-1.5 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
              {t('liveHq.depotAllCovered', 'All covered')}
            </span>
          )}
        </div>
      </div>

      {/* Toolbar: warehouse filter, priority filter, sort */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
        <FilterDropdown
          icon={Warehouse}
          value={warehouseFilter}
          options={warehouseOptions}
          onChange={setWarehouseFilter}
        />

        <div className="flex items-center bg-[var(--bg-base)] border border-[var(--border-base)] rounded-lg p-0.5 text-xs">
          {(['all', 'short', 'tight', 'idle'] as const).map(kind => (
            <button
              key={kind}
              type="button"
              onClick={() => setKindFilter(kind)}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                kindFilter === kind ? 'bg-emerald-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {kind === 'all' ? t('liveHq.depotAllPriorities', 'All') : kindLabel(kind)}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {groups.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-base)] bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] text-xs font-semibold text-[var(--text-main)] transition-colors cursor-pointer"
            >
              {allCollapsed ? <ChevronsUpDown className="w-3.5 h-3.5 text-[var(--text-subtle)]" /> : <ChevronsDownUp className="w-3.5 h-3.5 text-[var(--text-subtle)]" />}
              <span>{allCollapsed ? t('liveHq.depotExpandAll', 'Expand all') : t('liveHq.depotCollapseAll', 'Collapse all')}</span>
            </button>
          )}
          <FilterDropdown
            icon={ArrowUpDown}
            value={sortBy}
            options={sortOptions}
            onChange={(value) => setSortBy(value as SortKey)}
          />
        </div>
      </div>

      {attention.length === 0 ? (
        <p className="text-[11px] text-[var(--text-muted)]">
          {t('liveHq.depotAllClear', 'Every weekly order covers its draw and nothing is sitting idle.')}
        </p>
      ) : sorted.length === 0 ? (
        <p className="text-[11px] text-[var(--text-muted)]">
          {t('liveHq.depotNoMatch', 'No items match these filters.')}
        </p>
      ) : (
        <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2.5">
          {groups.map(group => {
            const isCollapsed = collapsed.has(group.address);
            return (
              <div key={group.address} className="rounded-xl border border-[var(--border-base)] overflow-hidden bg-[var(--bg-base)]">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.address)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Warehouse className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="text-xs font-bold text-[var(--text-main)] truncate">{nameOf(group.address)}</span>
                    <span className="text-[10px] font-mono text-[var(--text-subtle)] shrink-0">
                      {t('liveHq.depotItemsWord', '{n} items').replace('{n}', String(group.rows.length))}
                    </span>
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] shrink-0 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
                </button>
                {!isCollapsed && (
                  <div className="divide-y divide-[var(--border-subtle)]">
                    {group.rows.map(row => (
                      <div
                        key={row.key}
                        className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs"
                      >
                        <span className="font-semibold text-[var(--text-main)] truncate">{tGame(row.rawItemName, row.itemName)}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono text-[10px] text-[var(--text-muted)]">{row.detail}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${KIND_BADGE[row.kind]}`}>
                            {kindLabel(row.kind)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
