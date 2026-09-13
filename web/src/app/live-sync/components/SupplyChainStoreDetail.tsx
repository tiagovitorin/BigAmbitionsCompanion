'use client';

import Link from 'next/link';
import { ArrowRight, PackageCheck, ShoppingBag, TrendingUp, Truck, Warehouse } from 'lucide-react';
import type { LiveBusinessData } from '@/context/LiveSyncContext';
import type { SupplyChainNode, SupplyChainEdge } from '@/lib/logistics';
import { resolveItemImage } from '@/lib/logistics';
import { getStoreSupplies, BAG_CRITICAL_RUNOUT_DAYS } from '@/lib/storeSupplies';
import { storeSupplySummary, storeSalesMix, formatCount } from '@/lib/supplyChainInsights';
import { useTranslation } from '@/context/LanguageContext';
import { SupplyStat, SupplySection, SupplyBadge, ItemIcon, VerdictBadge } from './SupplyChainDetailAtoms';

interface Props {
  node: SupplyChainNode;
  edges: SupplyChainEdge[];
  allNodes: SupplyChainNode[];
  businesses: LiveBusinessData[];
}

const money = (value: number) => `$${Math.round(value).toLocaleString()}`;

export default function SupplyChainStoreDetail({ node, edges, allNodes, businesses }: Props) {
  const { t, tGame } = useTranslation();
  const business = businesses.find(b => b.address === node.id);
  const summary = storeSupplySummary(node.id, edges);
  const sales = storeSalesMix(business);
  const supplies = business ? getStoreSupplies(business) : [];

  const routes = edges.filter(e => e.kind === 'route' && e.to === node.id);
  const deliveries = edges.filter(e => e.kind === 'delivery' && e.to === node.id);
  const otherName = (id: string) => allNodes.find(n => n.id === id)?.name || id;

  const supplyTone = summary.short > 0 ? 'bad' : summary.tight > 0 ? 'warn' : 'good';
  const supplyValue = summary.short > 0
    ? t('liveHq.supplyShortCount', '{n} short').replace('{n}', String(summary.short))
    : summary.tight > 0
      ? t('liveHq.supplyTightCount', '{n} tight').replace('{n}', String(summary.tight))
      : t('liveHq.supplyCovered', 'Covered');

  return (
    <div className="space-y-3.5">
      <div className="grid grid-cols-2 gap-2">
        <SupplyStat
          label={t('liveHq.dailyRevenueLabel', 'Daily revenue')}
          value={business ? money(business.dailyRevenue) : '-'}
        />
        <SupplyStat
          label={t('liveHq.dailyProfitLabel', 'Daily profit')}
          value={business ? money(business.dailyProfit) : '-'}
          tone={business && business.dailyProfit < 0 ? 'bad' : 'good'}
        />
        <SupplyStat
          label={t('liveHq.satisfactionLabel', 'Satisfaction')}
          value={business ? `${Math.round(business.customerSatisfaction)}%` : '-'}
          tone={business && business.customerSatisfaction < 60 ? 'warn' : 'default'}
        />
        <SupplyStat label={t('liveHq.supplyHealthLabel', 'Supply')} value={supplyValue} tone={supplyTone} />
      </div>

      <SupplySection title={t('liveHq.supplyHealth', 'Supply Health')} icon={PackageCheck}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <SupplyBadge tone="good">{t('liveHq.verdictCovered', 'covered')} {summary.covered}</SupplyBadge>
          <SupplyBadge tone="warn">{t('liveHq.verdictTight', 'tight')} {summary.tight}</SupplyBadge>
          <SupplyBadge tone="bad">{t('liveHq.verdictShort', 'short')} {summary.short}</SupplyBadge>
        </div>
        {summary.totalShortfall > 0 && (
          <div className="text-[11px] text-amber-600 dark:text-amber-400">
            {t('liveHq.shortByUnits', 'Short {n} units before the next delivery')
              .replace('{n}', formatCount(summary.totalShortfall))}
          </div>
        )}
        {summary.watch.length > 0 ? (
          <div className="rounded-lg border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
            {summary.watch.slice(0, 6).map((item, i) => (
              <div key={`${item.rawItemName}-${i}`} className="px-2 py-1.5">
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="flex items-center gap-1.5 min-w-0 text-[var(--text-main)]">
                    <ItemIcon src={resolveItemImage(item.rawItemName)} size={18} />
                    <span className="truncate">{tGame(item.rawItemName, item.itemName)}</span>
                  </span>
                  <VerdictBadge verdict={item.verdict} />
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] font-mono text-[var(--text-subtle)]">
                  <span>
                    {item.onHand.toLocaleString()} ({item.predictedAtDelivery.toLocaleString()}) / {item.target.toLocaleString()}
                  </span>
                  <span>
                    {t('liveHq.soldPerDay', '~{n}/day').replace('{n}', item.predictedSold.toLocaleString())}
                    {item.shortfall > 0 ? ` · -${item.shortfall.toLocaleString()}` : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[11px] text-[var(--text-subtle)]">
            {t('liveHq.noRouteDemand', 'No warehouse route demand recorded yet.')}
          </div>
        )}
      </SupplySection>

      {supplies.length > 0 && (
        <SupplySection title={t('liveHq.checkoutSupplies', 'Checkout Supplies')} icon={ShoppingBag}>
          <div className="rounded-lg border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
            {supplies.map(supply => {
              const out = supply.quantity <= 0;
              const critical = out || (supply.runoutDays != null && supply.runoutDays <= BAG_CRITICAL_RUNOUT_DAYS);
              return (
                <div key={supply.rawItemName} className="px-2 py-1.5 flex items-center justify-between gap-2 text-[11px]">
                  <span className="flex items-center gap-1.5 min-w-0 text-[var(--text-main)]">
                    <ItemIcon src={resolveItemImage(supply.rawItemName)} size={18} />
                    <span className="truncate">{supply.displayName}</span>
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                    <span className="text-[var(--text-subtle)]">{supply.quantity.toLocaleString()}</span>
                    {out ? (
                      <SupplyBadge tone="bad">{t('liveHq.outOfStock', 'Out of stock')}</SupplyBadge>
                    ) : critical ? (
                      <SupplyBadge tone="warn">
                        {supply.runoutDays != null ? `~${supply.runoutDays.toFixed(1)}d` : t('liveHq.supplyRunningLow', 'Low')}
                      </SupplyBadge>
                    ) : (
                      <SupplyBadge tone="good">
                        {supply.runoutDays != null ? `~${Math.round(supply.runoutDays)}d` : '-'}
                      </SupplyBadge>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </SupplySection>
      )}

      {(routes.length > 0 || deliveries.length > 0) && (
        <SupplySection title={t('liveHq.inboundSupplies', 'Inbound')} icon={Truck}>
          <div className="space-y-1">
            {routes.map(route => (
              <div key={route.id} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] px-2 py-1.5 text-[11px]">
                <span className="flex items-center gap-1.5 min-w-0">
                  <Warehouse className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="truncate text-[var(--text-main)]">{otherName(route.from)}</span>
                  <span className="text-[var(--text-subtle)]">· {route.items.length} {t('liveHq.itemsWord', 'items')}</span>
                </span>
                {route.fulfillable ? (
                  <SupplyBadge tone="good">{t('liveHq.verdictCovered', 'covered')}</SupplyBadge>
                ) : route.partial ? (
                  <SupplyBadge tone="warn">{t('liveHq.verdictTight', 'tight')}</SupplyBadge>
                ) : (
                  <SupplyBadge tone="bad">{t('liveHq.verdictShort', 'short')}</SupplyBadge>
                )}
              </div>
            ))}
            {deliveries.map(delivery => (
              <div key={delivery.id} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border-subtle)] px-2 py-1.5 text-[11px]">
                <span className="flex items-center gap-1.5 min-w-0">
                  <Truck className="w-3 h-3 text-violet-500 shrink-0" />
                  <span className="truncate text-[var(--text-main)]">{otherName(delivery.from)}</span>
                  <span className="text-[var(--text-subtle)]">· {delivery.items.length} {t('liveHq.itemsWord', 'items')}</span>
                </span>
                {delivery.nextDeliveryDay != null && (
                  <SupplyBadge tone="default">
                    {t('liveHq.scheduledDay', 'Day {n}').replace('{n}', String(delivery.nextDeliveryDay))}
                  </SupplyBadge>
                )}
              </div>
            ))}
          </div>
        </SupplySection>
      )}

      {sales.length > 0 && (
        <SupplySection title={t('liveHq.salesMix', 'Top Sellers (7d)')} icon={TrendingUp}>
          <div className="rounded-lg border border-[var(--border-subtle)] divide-y divide-[var(--border-subtle)]">
            {sales.map(item => (
              <div key={item.rawItemName} className="px-2 py-1.5 flex items-center justify-between gap-2 text-[11px]">
                <span className="flex items-center gap-1.5 min-w-0 text-[var(--text-main)]">
                  <ItemIcon src={resolveItemImage(item.rawItemName)} size={18} />
                  <span className="truncate">{tGame(item.rawItemName, item.itemName)}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0 font-mono text-[10px] text-[var(--text-subtle)]">
                  <span>{item.units.toLocaleString()} u</span>
                  <span className="text-[var(--text-main)]">{money(item.revenue)}</span>
                </span>
              </div>
            ))}
          </div>
        </SupplySection>
      )}

      {business && (
        <Link
          href={`/live-sync?view=stores&store=${business.id}`}
          className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold hover:bg-emerald-500/15 transition-colors"
        >
          <span>{t('liveHq.openCommandRoom', 'Open Store Command Room')}</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}
