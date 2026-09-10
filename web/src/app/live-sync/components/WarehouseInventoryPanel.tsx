'use client';

import { useState } from 'react';
import { Warehouse, AlertTriangle, ChevronDown } from 'lucide-react';
import { LiveWarehouseData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import { getRunwayStatus, getRunwayBarWidth } from '@/lib/logistics';

interface WarehouseInventoryPanelProps {
  warehouses: LiveWarehouseData[];
}

export default function WarehouseInventoryPanel({ warehouses }: WarehouseInventoryPanelProps) {
  const { t, tGame } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (warehouses.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-amber-500" />
          <span>{t('liveHq.warehouseInventory', 'Warehouse Inventory')}</span>
        </h3>
        <div className="py-6 text-center text-xs text-[var(--text-subtle)]">{t('liveHq.noWarehouses', 'No warehouses owned')}</div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-amber-500" />
          <span>{t('liveHq.warehouseInventory', 'Warehouse Inventory')}</span>
        </h3>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
          {warehouses.length}
        </span>
      </div>

      {warehouses.map(w => {
        const stock = w.stock || [];
        const criticalCount = stock.filter(s => getRunwayStatus(s.daysLeft) === 'critical').length;
        const warningCount = stock.filter(s => getRunwayStatus(s.daysLeft) === 'warning').length;
        const totalBoxes = stock.reduce((acc, s) => acc + (s.boxes ?? 0), 0);
        const finiteRunways = stock.map(s => s.daysLeft).filter(d => d >= 0);
        const worstRunway = finiteRunways.length > 0 ? Math.min(...finiteRunways) : null;
        const isExpanded = expandedId === w.id;

        return (
          <div key={w.id} className="rounded-xl border border-[var(--border-base)] overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : w.id)}
              className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Warehouse className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="font-semibold text-[var(--text-main)] text-xs truncate">{w.address}</span>
                {criticalCount > 0 && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 flex items-center gap-1 shrink-0">
                    <AlertTriangle className="w-3 h-3" />
                    {criticalCount}
                  </span>
                )}
                {warningCount > 0 && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                    {warningCount}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 shrink-0 text-[11px] text-[var(--text-muted)]">
                <span className="font-mono">{stock.length} {t('liveHq.productsWord', 'products')}</span>
                <span className="font-mono">{totalBoxes.toLocaleString()} {t('liveHq.boxes', 'Boxes')}</span>
                {worstRunway != null && (
                  <span className={`font-mono font-bold ${worstRunway <= 2 ? 'text-rose-500' : 'text-[var(--text-muted)]'}`}>
                    {worstRunway === 0
                      ? t('liveHq.outOfStock', 'Out of stock')
                      : t('liveHq.worstRunway', 'worst {d}d').replace('{d}', String(worstRunway))}
                  </span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {isExpanded && (
              <div className="p-3 border-t border-[var(--border-base)]">
                {stock.length === 0 ? (
                  <div className="py-4 text-center text-xs text-[var(--text-subtle)]">{t('liveHq.noInventory', 'No tracked inventory')}</div>
                ) : (
                  <div className="space-y-1">
                    <div className="grid grid-cols-12 gap-2 px-2 text-[10px] uppercase font-bold tracking-wider text-[var(--text-subtle)]">
                      <span className="col-span-4">{t('liveHq.product', 'Product')}</span>
                      <span className="col-span-2 text-right">{t('liveHq.units', 'Units')}</span>
                      <span className="col-span-2 text-right">{t('liveHq.boxes', 'Boxes')}</span>
                      <span className="col-span-4">{t('liveHq.runway', 'Runway')}</span>
                    </div>

                    {stock.map(item => {
                      const status = getRunwayStatus(item.daysLeft);
                      const barWidth = getRunwayBarWidth(item.daysLeft);
                      const barColor =
                        status === 'critical' ? 'bg-rose-500'
                        : status === 'warning' ? 'bg-amber-500'
                        : status === 'none' ? 'bg-slate-400'
                        : 'bg-emerald-500';
                      const labelColor =
                        status === 'critical' ? 'text-rose-500'
                        : status === 'warning' ? 'text-amber-500'
                        : status === 'none' ? 'text-[var(--text-subtle)]'
                        : 'text-emerald-600 dark:text-emerald-400';

                      return (
                        <div
                          key={item.rawItemName}
                          title={t('liveHq.weeklyConsumptionTooltip', '{n} units consumed/week').replace('{n}', (item.weeklyConsumption || 0).toLocaleString())}
                          className="grid grid-cols-12 gap-2 items-center px-2 py-1.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)]"
                        >
                          <span className="col-span-4 font-semibold text-[var(--text-main)] text-xs truncate">
                            {tGame(item.rawItemName, item.itemName)}
                          </span>
                          <span className="col-span-2 text-right font-mono text-xs text-[var(--text-main)]">
                            {(item.units ?? item.quantity ?? 0).toLocaleString()}
                          </span>
                          <span className="col-span-2 text-right font-mono text-xs text-[var(--text-muted)]">
                            {item.boxes != null ? item.boxes.toLocaleString() : '-'}
                          </span>
                          <div className="col-span-4 flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden">
                              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${barWidth}%` }} />
                            </div>
                            <span className={`text-[10px] font-mono font-bold shrink-0 ${labelColor}`}>
                              {item.daysLeft < 0
                                ? t('liveHq.noConsumption', 'No consumption')
                                : item.daysLeft === 0
                                ? t('liveHq.outOfStock', 'Out of stock')
                                : t('liveHq.daysRunway', '{days}d').replace('{days}', String(Math.round(item.daysLeft)))}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
