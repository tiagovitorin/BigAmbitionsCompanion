'use client';

import Link from 'next/link';
import { ArrowRight, Boxes, PackageCheck, Ship, Truck } from 'lucide-react';
import type { LiveWarehouseData } from '@/context/LiveSyncContext';
import type { SupplyChainNode, SupplyChainEdge } from '@/lib/logistics';
import { resolveItemImage, getRunwayStatus } from '@/lib/logistics';
import {
  warehouseStockSummary,
  warehouseCriticalItems,
  warehouseOutbound,
  warehouseInbound,
  formatCount
} from '@/lib/supplyChainInsights';
import { useTranslation } from '@/context/LanguageContext';
import { SupplyStat, SupplySection, SupplyBadge, ItemIcon } from './SupplyChainDetailAtoms';

interface Props {
  node: SupplyChainNode;
  edges: SupplyChainEdge[];
  allNodes: SupplyChainNode[];
  warehouses: LiveWarehouseData[];
}

export default function SupplyChainWarehouseDetail({ node, edges, allNodes, warehouses }: Props) {
  const { t, tGame } = useTranslation();
  const warehouse = warehouses.find(w => w.address === node.id);
  const stock = warehouseStockSummary(warehouse);
  const criticalItems = warehouseCriticalItems(warehouse, 6);
  const outbound = warehouseOutbound(node.id, edges, allNodes);
  const inbound = warehouseInbound(node.id, edges, allNodes);
  const shippingStores = outbound.filter(d => d.status !== 'covered').length;

  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-2 gap-2">
        <SupplyStat label={t('liveHq.skusLabel', 'SKUs')} value={stock.skus.toLocaleString()} />
        <SupplyStat label={t('liveHq.unitsLabel', 'Units')} value={formatCount(stock.units)} />
        <SupplyStat
          label={t('liveHq.criticalLabel', 'Critical')}
          value={String(stock.critical)}
          tone={stock.critical > 0 ? 'bad' : 'good'}
        />
        <SupplyStat
          label={t('liveHq.storesServedLabel', 'Stores served')}
          value={String(outbound.length)}
          tone={shippingStores > 0 ? 'warn' : 'default'}
        />
      </div>

      {inbound.length > 0 && (
        <SupplySection title={t('liveHq.inboundImports', 'Inbound Imports')} icon={Ship}>
          <div className="rounded-lg border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
            {inbound.map(order => (
              <div key={order.importerId} className="px-2 py-1.5 flex items-center justify-between gap-2 text-[11px]">
                <span className="flex items-center gap-1.5 min-w-0 text-[var(--text-main)]">
                  <Ship className="w-3 h-3 text-sky-500 shrink-0" />
                  <span className="truncate">{order.importerName}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0 font-mono text-[10px] text-[var(--text-subtle)]">
                  <span>{formatCount(order.units)} u · {order.itemCount} {t('liveHq.itemsWord', 'items')}</span>
                  {order.nextDeliveryDay != null && (
                    <SupplyBadge tone="default">
                      {t('liveHq.scheduledDay', 'Day {n}').replace('{n}', String(order.nextDeliveryDay))}
                    </SupplyBadge>
                  )}
                </span>
              </div>
            ))}
          </div>
        </SupplySection>
      )}

      <SupplySection
        title={t('liveHq.stockHealth', 'Stock Health')}
        icon={PackageCheck}
        right={
          <div className="flex items-center gap-1.5">
            <SupplyBadge tone="bad">{stock.critical}</SupplyBadge>
            <SupplyBadge tone="warn">{stock.warning}</SupplyBadge>
            <SupplyBadge tone="good">{stock.healthy}</SupplyBadge>
          </div>
        }
      >
        {criticalItems.length > 0 ? (
          <div className="rounded-lg border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
            {criticalItems.map(item => {
              const status = getRunwayStatus(item.daysLeft);
              const tone = status === 'critical' ? 'bad' : status === 'warning' ? 'warn' : 'good';
              const barWidth = Math.max(0, Math.min(100, (item.daysLeft / 14) * 100));
              return (
                <div key={item.rawItemName} className="px-2 py-1.5">
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="flex items-center gap-1.5 min-w-0 text-[var(--text-main)]">
                      <ItemIcon src={resolveItemImage(item.rawItemName)} size={18} />
                      <span className="truncate">{tGame(item.rawItemName, item.itemName)}</span>
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0 font-mono text-[10px] text-[var(--text-subtle)]">
                      <span>{(item.quantity ?? item.units ?? 0).toLocaleString()} u</span>
                      <SupplyBadge tone={tone}>
                        {item.daysLeft < 0
                          ? '-'
                          : t('liveHq.daysLeft', '~{days} days').replace('{days}', item.daysLeft.toFixed(1))}
                      </SupplyBadge>
                    </span>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-[var(--bg-base)] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${status === 'critical' ? 'bg-rose-500' : status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-[11px] text-[var(--text-subtle)]">
            {t('liveHq.noWarehouseStock', 'No stocked items recorded for this warehouse.')}
          </div>
        )}
      </SupplySection>

      <SupplySection
        title={t('liveHq.outboundCoverage', 'Outbound Coverage')}
        icon={Truck}
        right={
          shippingStores > 0 ? (
            <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
              {t('liveHq.shortOfStores', 'shorting {n} of {total}')
                .replace('{n}', String(shippingStores))
                .replace('{total}', String(outbound.length))}
            </span>
          ) : undefined
        }
      >
        {outbound.length > 0 ? (
          <div className="rounded-lg border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
            {outbound.map(dest => (
              <div key={dest.storeId} className="px-2 py-1.5 flex items-center justify-between gap-2 text-[11px]">
                <span className="flex items-center gap-1.5 min-w-0 text-[var(--text-main)]">
                  <Boxes className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="truncate">{dest.storeName}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0 font-mono text-[10px] text-[var(--text-subtle)]">
                  {dest.shortfall > 0 && <span className="text-rose-500">-{formatCount(dest.shortfall)}</span>}
                  {dest.status === 'covered' ? (
                    <SupplyBadge tone="good">{t('liveHq.verdictCovered', 'covered')}</SupplyBadge>
                  ) : dest.status === 'tight' ? (
                    <SupplyBadge tone="warn">{t('liveHq.verdictTight', 'tight')}</SupplyBadge>
                  ) : (
                    <SupplyBadge tone="bad">
                      {dest.shortCount > 0
                        ? t('liveHq.shortCount', '{n} short').replace('{n}', String(dest.shortCount))
                        : t('liveHq.verdictShort', 'short')}
                    </SupplyBadge>
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-[var(--text-subtle)]">
            {t('liveHq.noOutboundRoutes', 'No warehouse to store routes from here.')}
          </div>
        )}
      </SupplySection>

      <Link
        href="/live-sync?view=supply"
        className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-bold hover:bg-amber-500/15 transition-colors"
      >
        <span>{t('liveHq.openSupplyChain', 'Open Supply Chain')}</span>
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
