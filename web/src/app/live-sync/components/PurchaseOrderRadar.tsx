'use client';

import { useMemo, useState } from 'react';
import { TriangleAlert, CircleCheck, Clock, Receipt, MapPin, ArrowRight, ChevronDown, ChevronsDownUp, ChevronsUpDown, ArrowUpDown } from 'lucide-react';
import { LiveDeliveryContractData, LiveImportPartnershipData, LiveWarehouseData, LiveBusinessData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import FilterDropdown, { DropdownOption } from './FilterDropdown';

interface PurchaseOrderRadarProps {
  deliveryContracts: LiveDeliveryContractData[];
  importPartnerships: LiveImportPartnershipData[];
  warehouses: LiveWarehouseData[];
  businesses: LiveBusinessData[];
  playerCash: number;
  gameDay: number;
}

type OrderSource = 'import' | 'delivery';
type PorSort = 'amount' | 'supplier';

interface OrderRow {
  key: string;
  source: OrderSource;
  supplierName: string;
  nextDeliveryDay: number;
  total: number;
  destinations: string[];
  items: { rawItemName: string; itemName: string; amount: number }[];
}

export default function PurchaseOrderRadar({ deliveryContracts, importPartnerships, warehouses, businesses, playerCash, gameDay }: PurchaseOrderRadarProps) {
  const { t, tGame } = useTranslation();
  const [sourceFilter, setSourceFilter] = useState<'all' | OrderSource>('all');
  const [sortBy, setSortBy] = useState<PorSort>('amount');
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());

  // Destination addresses resolved to a friendly name where we have one (the warehouse
  // name, or the storefront's business name), else the address.
  const nameByAddress = new Map<string, string>();
  warehouses.forEach(w => nameByAddress.set(w.address, w.name || w.address));
  businesses.forEach(b => nameByAddress.set(b.address, b.name || b.address));
  const destLabel = (address: string) => nameByAddress.get(address) || address;

  const orders: OrderRow[] = useMemo(() => [
    ...importPartnerships
      .filter(ip => ip.isActive)
      .map(ip => {
        const destinations = Array.from(new Set((ip.products || []).map(p => p.assignedWarehouse).filter(Boolean)));
        return {
          key: `ip-${ip.id}`,
          source: 'import' as const,
          supplierName: ip.supplierName || ip.importAddress,
          nextDeliveryDay: ip.nextDeliveryDay,
          total: ip.nextDeliveryTotal || 0,
          destinations: destinations.length ? destinations : (ip.headquartersAddress ? [ip.headquartersAddress] : []),
          items: (ip.products || []).map(p => ({ rawItemName: p.rawItemName, itemName: p.itemName, amount: p.amount }))
        };
      }),
    ...deliveryContracts
      .filter(dc => dc.enabled)
      .map(dc => ({
        key: `dc-${dc.wholesaleAddress}-${dc.businessAddress}`,
        source: 'delivery' as const,
        supplierName: dc.supplierName || dc.wholesaleAddress,
        nextDeliveryDay: dc.nextDeliveryDay,
        total: dc.totalPricePerDelivery || 0,
        destinations: dc.businessAddress ? [dc.businessAddress] : [],
        items: (dc.items || []).map(i => ({ rawItemName: i.rawItemName, itemName: i.itemName, amount: i.amount }))
      }))
  ], [importPartnerships, deliveryContracts]);

  const upcomingTotal = orders.reduce((acc, o) => acc + o.total, 0);
  const risk: 'safe' | 'tight' | 'shortfall' = upcomingTotal === 0 ? 'safe' : playerCash >= upcomingTotal * 1.5 ? 'safe' : playerCash >= upcomingTotal ? 'tight' : 'shortfall';

  if (orders.length === 0) {
    return null;
  }

  const daysUntil = (nextDay: number) => {
    const diff = nextDay - gameDay;
    if (diff <= 0) return t('liveHq.dueToday', 'Today');
    return t('liveHq.inDays', 'in {n}d').replace('{n}', String(diff));
  };

  const sourceOptions: DropdownOption[] = [
    { value: 'all', label: t('liveHq.porAllSources', 'All orders') },
    { value: 'import', label: t('liveHq.porImports', 'Imports') },
    { value: 'delivery', label: t('liveHq.porDeliveries', 'Store deliveries') }
  ];
  const sortOptions: DropdownOption[] = [
    { value: 'amount', label: t('liveHq.porSortAmount', 'Biggest first') },
    { value: 'supplier', label: t('liveHq.porSortSupplier', 'Supplier') }
  ];

  const filtered = orders.filter(o => sourceFilter === 'all' || o.source === sourceFilter);
  const sorted = [...filtered].sort((a, b) =>
    sortBy === 'supplier' ? a.supplierName.localeCompare(b.supplierName) : b.total - a.total
  );

  // Grouped by delivery day so the radar reads as a schedule.
  const groups: { day: number; rows: OrderRow[]; total: number }[] = [];
  const dayIndex = new Map<number, number>();
  for (const order of sorted) {
    let index = dayIndex.get(order.nextDeliveryDay);
    if (index === undefined) {
      index = groups.length;
      dayIndex.set(order.nextDeliveryDay, index);
      groups.push({ day: order.nextDeliveryDay, rows: [], total: 0 });
    }
    groups[index].rows.push(order);
    groups[index].total += order.total;
  }
  groups.sort((a, b) => a.day - b.day);

  const allCollapsed = groups.length > 0 && groups.every(group => collapsed.has(group.day));
  const toggleDay = (day: number) => setCollapsed(prev => {
    const next = new Set(prev);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    return next;
  });
  const toggleAll = () => setCollapsed(allCollapsed ? new Set() : new Set(groups.map(group => group.day)));

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
        <Receipt className="w-4 h-4 text-emerald-500" />
        <span>{t('liveHq.purchaseOrderRadar', 'Purchase Order Radar')}</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
          <div className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.upcomingOrders', 'Upcoming Orders')}</div>
          <div className="font-mono font-bold text-[var(--text-main)] text-lg mt-1">${upcomingTotal.toLocaleString()}</div>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
          <div className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.cashOnHand', 'Cash On Hand')}</div>
          <div className="font-mono font-bold text-[var(--text-main)] text-lg mt-1">${playerCash.toLocaleString()}</div>
        </div>
        <div className={`p-3 rounded-xl border ${risk === 'safe' ? 'bg-emerald-500/10 border-emerald-500/30' : risk === 'tight' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
          <div className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.riskLevel', 'Risk Level')}</div>
          <div className={`font-bold flex items-center gap-1.5 mt-1 ${risk === 'safe' ? 'text-emerald-600 dark:text-emerald-400' : risk === 'tight' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500'}`}>
            {risk === 'safe' ? <CircleCheck className="w-4 h-4" /> : <TriangleAlert className="w-4 h-4" />}
            <span>
              {risk === 'safe' ? t('liveHq.riskSafe', 'Safe') : risk === 'tight' ? t('liveHq.riskTight', 'Tight') : t('liveHq.riskShortfall', 'Shortfall')}
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar: source filter, sort, collapse */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
        <FilterDropdown icon={Receipt} value={sourceFilter} options={sourceOptions} onChange={(value) => setSourceFilter(value as 'all' | OrderSource)} />
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
          <FilterDropdown icon={ArrowUpDown} value={sortBy} options={sortOptions} onChange={(value) => setSortBy(value as PorSort)} />
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-[11px] text-[var(--text-muted)]">{t('liveHq.depotNoMatch', 'No items match these filters.')}</p>
      ) : (
        <div className="max-h-[420px] overflow-y-auto pr-1 space-y-2.5">
          {groups.map(group => {
            const isCollapsed = collapsed.has(group.day);
            return (
              <div key={group.day} className="rounded-xl border border-[var(--border-base)] overflow-hidden bg-[var(--bg-base)]">
                <button
                  type="button"
                  onClick={() => toggleDay(group.day)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer text-left"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-[var(--text-main)]">{daysUntil(group.day)}</span>
                    <span className="text-[10px] font-mono text-[var(--text-subtle)]">
                      {t('liveHq.depotItemsWord', '{n} items').replace('{n}', String(group.rows.length))}
                    </span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-[11px] font-bold text-[var(--text-main)]">${group.total.toLocaleString()}</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
                  </span>
                </button>
                {!isCollapsed && (
                  <div className="divide-y divide-[var(--border-subtle)]">
                    {group.rows.map(o => (
                      <div key={o.key} className="p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${o.source === 'import' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30' : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'}`}>
                              {o.source === 'import' ? t('liveHq.porImportChip', 'Import') : t('liveHq.porDeliveryChip', 'Delivery')}
                            </span>
                            <span className="font-semibold text-[var(--text-main)] truncate">{o.supplierName}</span>
                            {o.destinations.length > 0 && (
                              <>
                                <ArrowRight className="w-3 h-3 text-[var(--text-subtle)] shrink-0" />
                                <span
                                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/25 text-sky-600 dark:text-sky-400 text-[10px] font-semibold shrink-0 max-w-44"
                                  title={o.destinations.map(destLabel).join(', ')}
                                >
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{o.destinations.map(destLabel).join(', ')}</span>
                                </span>
                              </>
                            )}
                          </div>
                          <span className="font-mono font-bold text-[var(--text-main)] shrink-0">${o.total.toLocaleString()}</span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[var(--text-muted)] pl-1">
                          {o.items.slice(0, 6).map((it, i) => (
                            <span key={i} className="truncate">
                              {tGame(it.rawItemName, it.itemName)} x{it.amount.toLocaleString()}
                              {i < Math.min(o.items.length, 6) - 1 ? ',' : ''}
                            </span>
                          ))}
                          {o.items.length > 6 && <span className="text-[var(--text-subtle)]">+{o.items.length - 6}</span>}
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
