'use client';

import { useMemo, useState } from 'react';
import { ArrowUpDown, Truck } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { boxSizeFor, outboundRoutes } from '@/lib/productionModel';
import { getRunwayStatus, resolveItemImage } from '@/lib/logistics';
import { ProductionSectionProps, pct } from '@/lib/productionUi';
import { ItemIcon } from './SupplyChainDetailAtoms';
import OutboundRouteTree from './OutboundRouteTree';

type StockSortKey = 'name' | 'pack' | 'units' | 'boxes' | 'weekly' | 'daysLeft';

const RUNWAY_TONE: Record<ReturnType<typeof getRunwayStatus>, string> = {
  none: 'text-[var(--text-subtle)]',
  healthy: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  critical: 'text-rose-600 dark:text-rose-400 font-bold'
};

export default function FactoryStorageSection({ model, ctx }: ProductionSectionProps) {
  const { t } = useTranslation();
  const [stockSort, setStockSort] = useState<{ key: StockSortKey; asc: boolean }>({ key: 'daysLeft', asc: true });

  const warehouse = model.site.kind === 'warehouse' ? ctx.warehouses.find(w => w.id === model.site.id) : undefined;
  const stock = warehouse?.stock || [];
  const totalBoxes = stock.reduce((sum, item) => sum + (item.boxes || 0), 0);
  const totalUnits = stock.reduce((sum, item) => sum + (item.units ?? item.quantity ?? 0), 0);
  const routes = outboundRoutes(model.site, ctx);

  const sortedStock = useMemo(() => {
    const rank = (value: number) => (value < 0 ? Number.POSITIVE_INFINITY : value);
    return [...stock].sort((a, b) => {
      let cmp = 0;
      if (stockSort.key === 'name') cmp = (a.itemName || a.rawItemName).localeCompare(b.itemName || b.rawItemName);
      else if (stockSort.key === 'pack') cmp = boxSizeFor(a.rawItemName) - boxSizeFor(b.rawItemName);
      else if (stockSort.key === 'units') cmp = (a.units ?? a.quantity ?? 0) - (b.units ?? b.quantity ?? 0);
      else if (stockSort.key === 'boxes') cmp = (a.boxes || 0) - (b.boxes || 0);
      else if (stockSort.key === 'weekly') cmp = a.weeklyConsumption - b.weeklyConsumption;
      else cmp = rank(a.daysLeft ?? -1) - rank(b.daysLeft ?? -1);
      return stockSort.asc ? cmp : -cmp;
    });
  }, [stock, stockSort]);

  const handleStockSort = (key: StockSortKey) => setStockSort(prev => (prev.key === key ? { key, asc: !prev.asc } : { key, asc: true }));

  return (
    <div className="space-y-4">
      {model.storage && (
        <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--bg-surface)] p-4 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold uppercase tracking-wider text-[var(--text-main)]">{t('liveHq.factoryCapacity', 'Pallet capacity')}</span>
            <span className="font-mono text-[var(--text-muted)]">
              {model.storage.usedBoxes.toLocaleString()} / {model.storage.capacityBoxes.toLocaleString()} {t('liveHq.factoryBoxes', 'boxes')} ({pct(model.storage.occupancy)})
            </span>
          </div>
          <div className="h-2 rounded-full bg-[var(--bg-base)] overflow-hidden">
            <div
              className={`h-full ${model.storage.occupancy >= 0.9 ? 'bg-rose-500' : model.storage.occupancy >= 0.7 ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${Math.min(100, Math.round(model.storage.occupancy * 100))}%` }}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[10px] font-mono">
            <span className="text-[var(--text-muted)]">{t('liveHq.factoryFreeBoxes', 'Free: {n} boxes').replace('{n}', model.storage.freeBoxes.toLocaleString())}</span>
            <span className={model.storage.netBoxesPerHour > 0.01 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--text-muted)]'}>
              {t('liveHq.factoryNetBoxes', 'Net: {n} boxes/hr').replace('{n}', `${model.storage.netBoxesPerHour > 0 ? '+' : ''}${model.storage.netBoxesPerHour.toFixed(1)}`)}
            </span>
            <span className={model.storage.gridlockHours != null && model.storage.gridlockHours < 12 ? 'text-rose-500 font-bold' : 'text-[var(--text-muted)]'}>
              {model.storage.gridlockHours != null
                ? t('liveHq.factoryGridlock', 'Full in ~{h}h').replace('{h}', model.storage.gridlockHours.toFixed(1))
                : t('liveHq.factoryStorageStable', 'Not filling up')}
            </span>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--bg-surface)] overflow-hidden shadow-xs">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border-base)]">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">{t('liveHq.factoryStockOnHand', 'Stock on hand')}</span>
          <span className="text-[10px] font-mono text-[var(--text-muted)]">
            {totalUnits.toLocaleString()} {t('liveHq.factoryUnits', 'units')} · {totalBoxes.toLocaleString()} {t('liveHq.factoryBoxes', 'boxes')}
          </span>
        </div>
        {stock.length === 0 ? (
          <p className="px-4 py-3 text-xs text-[var(--text-subtle)]">{t('liveHq.factoryNoStock', 'No pallet stock detected at this site.')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-base)] bg-[var(--bg-base)] text-[10px] uppercase font-bold tracking-wider text-[var(--text-subtle)]">
                  <th colSpan={4} className="py-2 px-4 border-r border-[var(--border-base)]">{t('liveHq.factoryStockInventory', 'Pallet inventory')}</th>
                  <th colSpan={2} className="py-2 px-4 text-center">{t('liveHq.factoryStockFlow', 'Throughput')}</th>
                </tr>
                <tr className="border-b border-[var(--border-base)] bg-[var(--bg-surface)] font-semibold text-[var(--text-muted)]">
                  <th onClick={() => handleStockSort('name')} className="py-2.5 px-4 cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap">
                    <div className="flex items-center gap-1.5"><span>{t('liveHq.product', 'Product')}</span><ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)]" /></div>
                  </th>
                  <th onClick={() => handleStockSort('pack')} className="py-2.5 px-3 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5"><span>{t('liveHq.factoryPackSize', 'Pack size')}</span><ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)]" /></div>
                  </th>
                  <th onClick={() => handleStockSort('units')} className="py-2.5 px-3 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5"><span>{t('liveHq.factoryUnits', 'Units')}</span><ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)]" /></div>
                  </th>
                  <th onClick={() => handleStockSort('boxes')} className="py-2.5 px-4 text-right border-r border-[var(--border-base)] cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5"><span>{t('liveHq.factoryBoxesCol', 'Boxes')}</span><ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)]" /></div>
                  </th>
                  <th onClick={() => handleStockSort('weekly')} className="py-2.5 px-3 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5"><span>{t('liveHq.factoryWeeklyDraw', 'Weekly draw')}</span><ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)]" /></div>
                  </th>
                  <th onClick={() => handleStockSort('daysLeft')} className="py-2.5 px-3 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5"><span>{t('liveHq.factoryDaysLeft', 'Days left')}</span><ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)]" /></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {sortedStock.map(item => {
                  const units = item.units ?? item.quantity ?? 0;
                  const daysLeft = item.daysLeft ?? -1;
                  const status = daysLeft >= 0 ? getRunwayStatus(daysLeft) : 'none';
                  return (
                    <tr key={item.rawItemName} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="py-2 px-4">
                        <div className="flex items-center gap-2 min-w-0">
                          <ItemIcon src={resolveItemImage(item.rawItemName)} size={22} />
                          <span className="truncate font-semibold text-[var(--text-main)]">{item.itemName || item.rawItemName}</span>
                        </div>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-[var(--text-muted)] whitespace-nowrap">{boxSizeFor(item.rawItemName).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono text-[var(--text-main)] whitespace-nowrap">{units.toLocaleString()}</td>
                      <td className="py-2 px-4 text-right font-mono text-[var(--text-muted)] border-r border-[var(--border-base)] whitespace-nowrap">{(item.boxes || 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono text-[var(--text-muted)] whitespace-nowrap">{item.weeklyConsumption.toLocaleString()}</td>
                      <td className={`py-2 px-3 text-right font-mono whitespace-nowrap ${RUNWAY_TONE[status]}`}>{daysLeft >= 0 ? `${daysLeft}d` : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--border-base)] bg-[var(--bg-base)] font-mono font-bold text-[var(--text-main)]">
                  <td className="py-2 px-4 text-[10px] uppercase tracking-wider text-[var(--text-subtle)]">{t('liveHq.factoryTotal', 'Total')}</td>
                  <td className="py-2 px-3" />
                  <td className="py-2 px-3 text-right whitespace-nowrap">{totalUnits.toLocaleString()}</td>
                  <td className="py-2 px-4 text-right border-r border-[var(--border-base)] whitespace-nowrap">{totalBoxes.toLocaleString()}</td>
                  <td className="py-2 px-3" />
                  <td className="py-2 px-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {!model.storage && (
          <div className="px-4 py-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-subtle)]">
            {t('liveHq.factoryStoragePhaseNote', 'Rack capacity and a storage gridlock countdown arrive with the next mod update.')}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--bg-surface)] overflow-hidden shadow-xs">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border-base)]">
          <Truck className="w-3.5 h-3.5 text-sky-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">{t('liveHq.factoryOutboundRoutes', 'Outbound routes')}</span>
        </div>
        {routes.length === 0 ? (
          <p className="px-4 py-3 text-xs text-[var(--text-subtle)]">{t('liveHq.factoryNoRoutes', 'No delivery routes originate from this site.')}</p>
        ) : (
          <OutboundRouteTree siteName={model.site.name} siteAddress={model.site.address} routes={routes} />
        )}
      </div>
    </div>
  );
}
