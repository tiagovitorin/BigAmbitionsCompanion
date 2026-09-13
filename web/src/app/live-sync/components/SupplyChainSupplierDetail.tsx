'use client';

import { Package, Ship, Store, Truck } from 'lucide-react';
import type { LiveDeliveryContractData } from '@/context/LiveSyncContext';
import type { SupplyChainNode, SupplyChainEdge } from '@/lib/logistics';
import { resolveItemImage } from '@/lib/logistics';
import { importerSummary, wholesalerSummary, formatCount } from '@/lib/supplyChainInsights';
import { useTranslation } from '@/context/LanguageContext';
import { SupplyStat, SupplySection, SupplyBadge, ItemIcon } from './SupplyChainDetailAtoms';

interface Props {
  node: SupplyChainNode;
  edges: SupplyChainEdge[];
  allNodes: SupplyChainNode[];
  deliveryContracts: LiveDeliveryContractData[];
}

export default function SupplyChainSupplierDetail({ node, edges, allNodes, deliveryContracts }: Props) {
  const { t, tGame } = useTranslation();

  const isWholesaler = node.kind === 'wholesaler';
  const title = isWholesaler
    ? t('liveHq.deliveries', 'Deliveries')
    : t('liveHq.outboundOrders', 'Outbound Orders');

  const wholesale = isWholesaler ? wholesalerSummary(node.id, edges, allNodes, deliveryContracts) : null;
  const importer = isWholesaler ? null : importerSummary(node.id, edges, allNodes);

  const totalItems = wholesale?.totalItems ?? importer?.totalItems ?? 0;
  const totalUnits = wholesale?.totalUnits ?? importer?.totalUnits ?? 0;
  const nextDeliveryDay = wholesale?.nextDeliveryDay ?? importer?.nextDeliveryDay;

  const targetLabel = isWholesaler
    ? t('liveHq.storesServedLabel', 'Stores served')
    : t('liveHq.warehousesSupplied', 'Warehouses');

  const rows = wholesale
    ? wholesale.deliveries.map(d => ({
        id: d.storeId,
        name: d.storeName,
        day: d.nextDeliveryDay,
        items: d.items,
        units: d.units,
        extra: d.orderedThisWeek != null && d.orderedLastWeek != null
          ? { now: d.orderedThisWeek, prev: d.orderedLastWeek }
          : null as { now: number; prev: number } | null
      }))
    : (importer?.orders ?? []).map(o => ({
        id: o.warehouseId,
        name: o.warehouseName,
        day: o.nextDeliveryDay,
        items: o.items,
        units: o.units,
        extra: null as { now: number; prev: number } | null
      }));

  const targets = rows.length;

  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-2 gap-2">
        <SupplyStat label={t('liveHq.itemsLabel', 'Items')} value={totalItems.toLocaleString()} />
        <SupplyStat label={t('liveHq.unitsLabel', 'Units')} value={formatCount(totalUnits)} />
        <SupplyStat label={targetLabel} value={String(targets)} />
        <SupplyStat
          label={t('liveHq.nextDeliveryLabel', 'Next delivery')}
          value={nextDeliveryDay != null
            ? t('liveHq.scheduledDay', 'Day {n}').replace('{n}', String(nextDeliveryDay))
            : '-'}
        />
      </div>

      <SupplySection
        title={title}
        icon={node.kind === 'wholesaler' ? Truck : Ship}
      >
        {rows.length > 0 ? (
          <div className="space-y-1.5">
            {rows.map(row => (
              <div key={row.id} className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
                <div className="flex items-center justify-between gap-2 px-2 py-1.5 bg-[var(--bg-base)]">
                  <span className="flex items-center gap-1.5 min-w-0 text-[11px] text-[var(--text-main)]">
                    {node.kind === 'wholesaler' ? (
                      <Store className="w-3 h-3 text-emerald-500 shrink-0" />
                    ) : (
                      <Truck className="w-3 h-3 text-amber-500 shrink-0" />
                    )}
                    <span className="truncate">{row.name}</span>
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] text-[var(--text-subtle)]">
                    {row.extra && (
                      <span className={row.extra.now >= row.extra.prev ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                        {row.extra.now >= row.extra.prev ? '▲' : '▼'} {formatCount(row.extra.now)}
                      </span>
                    )}
                    <span>{formatCount(row.units)} u</span>
                    {row.day != null && (
                      <SupplyBadge tone="default">
                        {t('liveHq.scheduledDay', 'Day {n}').replace('{n}', String(row.day))}
                      </SupplyBadge>
                    )}
                  </span>
                </div>
                {row.items.length > 0 && (
                  <div className="divide-y divide-[var(--border-subtle)]/50">
                    {row.items.map((it, i) => (
                      <div key={`${it.rawItemName}-${i}`} className="px-2 py-1 flex items-center justify-between gap-2 text-[11px]">
                        <span className="flex items-center gap-1.5 min-w-0 text-[var(--text-muted)]">
                          <ItemIcon src={resolveItemImage(it.rawItemName)} size={16} />
                          <span className="truncate">{tGame(it.rawItemName, it.itemName)}</span>
                        </span>
                        <span className="shrink-0 font-mono text-[10px] text-[var(--text-main)]">
                          x{(it.amount ?? 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-[var(--text-subtle)]">
            {t('liveHq.noRoutes', 'No routes connected')}
          </div>
        )}
      </SupplySection>

      {node.kind === 'wholesaler' && totalUnits === 0 && rows.length === 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-subtle)]">
          <Package className="w-3 h-3" />
          {t('liveHq.noDeliveries', 'No active deliveries from this supplier.')}
        </div>
      )}
    </div>
  );
}
