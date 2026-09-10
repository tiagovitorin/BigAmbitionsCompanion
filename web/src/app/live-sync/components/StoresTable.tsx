'use client';

import Link from 'next/link';
import { ArrowUp, ArrowDown, ArrowUpDown, ChevronRight } from 'lucide-react';
import { LiveBusinessData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import BusinessLogo from './BusinessLogo';

export type StoreSortBy = 'name' | 'sales' | 'profit' | 'satisfaction' | 'staff' | 'health';

interface StoresTableProps {
  paginatedStores: LiveBusinessData[];
  totalStorePages: number;
  currentStorePage: number;
  onPageChange: (page: number) => void;
  storeSortBy: StoreSortBy;
  storeSortOrder: 'asc' | 'desc';
  onSort: (field: StoreSortBy) => void;
}

export default function StoresTable({
  paginatedStores,
  totalStorePages,
  currentStorePage,
  onPageChange,
  storeSortBy,
  storeSortOrder,
  onSort
}: StoresTableProps) {
  const { t } = useTranslation();
  return (
    <div className="overflow-x-auto rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm">
      <table className="w-full text-xs text-left border-collapse">
        <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase select-none">
          <tr>
            <th
              onClick={() => onSort('name')}
              className="py-3 px-4 cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
            >
              <div className="flex items-center gap-1.5">
                <span>{t('liveHq.storefront')}</span>
                {storeSortBy === 'name' ? (
                  storeSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                ) : (
                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                )}
              </div>
            </th>

            <th className="py-3 px-4">
              <span>{t('liveHq.districtAddress')}</span>
            </th>

            <th className="py-3 px-4">
              <span>{t('common.type')}</span>
            </th>

            <th
              onClick={() => onSort('sales')}
              className="py-3 px-4 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>{t('liveHq.weeklySales')}</span>
                {storeSortBy === 'sales' ? (
                  storeSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                ) : (
                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                )}
              </div>
            </th>

            <th
              onClick={() => onSort('profit')}
              className="py-3 px-4 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>{t('liveHq.weeklyProfitColumn')}</span>
                {storeSortBy === 'profit' ? (
                  storeSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                ) : (
                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                )}
              </div>
            </th>

            <th
              onClick={() => onSort('satisfaction')}
              className="py-3 px-4 text-center cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
            >
              <div className="flex items-center justify-center gap-1.5">
                <span>{t('liveHq.satisfaction')}</span>
                {storeSortBy === 'satisfaction' ? (
                  storeSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                ) : (
                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                )}
              </div>
            </th>

            <th
              onClick={() => onSort('staff')}
              className="py-3 px-4 text-center cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
            >
              <div className="flex items-center justify-center gap-1.5">
                <span>{t('liveHq.staffWord')}</span>
                {storeSortBy === 'staff' ? (
                  storeSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                ) : (
                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                )}
              </div>
            </th>

            <th
              onClick={() => onSort('health')}
              className="py-3 px-4 text-center cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
            >
              <div className="flex items-center justify-center gap-1.5">
                <span>{t('liveHq.inventoryStatus')}</span>
                {storeSortBy === 'health' ? (
                  storeSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                ) : (
                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                )}
              </div>
            </th>

            <th className="py-3 px-4 text-right">{t('liveHq.command')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
          {paginatedStores.length > 0 ? (
            paginatedStores.map((b) => {
              let lowestRunout = t('liveHq.stocked');
              let lowestRunoutClass = 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
              let hasZeroStock = false;
              let hasLowStock = false;

              if (b.retailPrices && b.retailPrices.length > 0) {
                const physicalProducts = b.retailPrices.filter(rp => !(
                  rp.isServiceProduct ||
                  (rp.rawItemName || '').includes('fee') ||
                  (rp.rawItemName || '').includes('hourly') ||
                  (rp.rawItemName || '').includes('charge') ||
                  (rp.rawItemName || '').includes('ticket')
                ));

                if (physicalProducts.length === 0) {
                  lowestRunout = t('liveHq.services');
                  lowestRunoutClass = 'text-sky-600 dark:text-sky-400 bg-sky-500/10 border-sky-500/20';
                } else {
                  for (const rp of physicalProducts) {
                    const stockUnits = (rp as any).inStoreStock ?? 0;
                    if (stockUnits === 0) {
                      hasZeroStock = true;
                      break;
                    }
                    const cleanTitle = (rp.displayName || rp.rawItemName)
                      .replace('ba:itemname_', '')
                      .replace('ba:item_', '')
                      .replace('ba:item', '')
                      .replace(/_/g, ' ')
                      .trim();
                    const bSalesList = (b.todayOrderSales || b.todayItemSales || []);
                    const matchedSale = bSalesList.find(
                      (s: any) => s.itemName.toLowerCase() === cleanTitle.toLowerCase() ||
                                  s.itemName.toLowerCase().includes(cleanTitle.toLowerCase()) ||
                                  cleanTitle.toLowerCase().includes(s.itemName.toLowerCase())
                    );
                    const dailySold = matchedSale ? matchedSale.amountSold : 0;
                    if (dailySold > 0) {
                      const daysLeft = stockUnits / dailySold;
                      if (daysLeft < 1.0) hasLowStock = true;
                    } else if (stockUnits < 10) {
                      hasLowStock = true;
                    }
                  }

                  if (hasZeroStock) {
                    lowestRunout = t('liveHq.stockout');
                    lowestRunoutClass = 'text-rose-500 font-bold bg-rose-500/10 border-rose-500/20';
                  } else if (hasLowStock) {
                    lowestRunout = t('liveHq.lowBuffer');
                    lowestRunoutClass = 'text-amber-500 font-bold bg-amber-500/10 border-amber-500/20';
                  }
                }
              }

              return (
                <tr key={b.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                  <td className="py-2.5 px-4 font-sans font-semibold text-[var(--text-main)]">
                    <Link
                      href={`/live-sync?view=stores&store=${b.id}`}
                      className="flex items-center gap-3 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <BusinessLogo business={b} sizeClass="w-8 h-8" />
                      <div className="truncate">
                        <div className="font-bold truncate max-w-48">{b.name}</div>
                        <div className="text-[10px] text-[var(--text-subtle)] flex items-center gap-1.5 font-mono font-normal">
                          <span className={`w-1.5 h-1.5 rounded-full ${b.isOpenNow ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <span>{b.isOpenNow ? t('liveHq.openNow') : t('liveHq.closed')}</span>
                        </div>
                      </div>
                    </Link>
                  </td>

                  <td className="py-2.5 px-4 font-sans text-[var(--text-muted)]">
                    <div className="truncate max-w-44 text-xs">{b.address}</div>
                    <div className="text-[10px] text-[var(--text-subtle)]">{b.district}</div>
                  </td>

                  <td className="py-2.5 px-4 font-sans">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-muted)] font-medium truncate max-w-36 inline-block">
                      {b.type}
                    </span>
                  </td>

                  <td className="py-2.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    ${(b.weeklyRevenue || 0).toLocaleString()}
                  </td>

                  <td className="py-2.5 px-4 text-right font-bold text-sky-600 dark:text-sky-400">
                    ${(b.weeklyProfit || 0).toLocaleString()}
                  </td>

                  <td className="py-2.5 px-4 text-center font-bold">
                    <span className={b.customerSatisfaction >= 80 ? 'text-emerald-500' : b.customerSatisfaction >= 60 ? 'text-amber-500' : 'text-rose-500'}>
                      {b.customerSatisfaction}%
                    </span>
                  </td>

                  <td className="py-2.5 px-4 text-center font-bold text-[var(--text-main)]">
                    {b.staffOnDuty}
                  </td>

                  <td className="py-2.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] border font-sans ${lowestRunoutClass}`}>
                      {lowestRunout}
                    </span>
                  </td>

                  <td className="py-2.5 px-4 text-right">
                    <Link
                      href={`/live-sync?view=stores&store=${b.id}`}
                      className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] hover:bg-emerald-600 hover:text-white border border-[var(--border-base)] text-[11px] font-sans font-semibold text-[var(--text-main)] transition-colors inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>{t('liveHq.command')}</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={9} className="py-8 text-center text-xs text-[var(--text-muted)] font-sans">
                {t('liveHq.noStoresMatch')}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {totalStorePages > 1 && (
        <div className="p-3 border-t border-[var(--border-base)] flex items-center justify-between text-xs bg-[var(--bg-surface)]">
          <span className="text-[var(--text-subtle)]">
            {t('liveHq.page')} <strong className="text-[var(--text-main)] font-mono">{currentStorePage}</strong> {t('liveHq.of')} <strong className="text-[var(--text-main)] font-mono">{totalStorePages}</strong>
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange(Math.max(1, currentStorePage - 1))}
              disabled={currentStorePage === 1}
              className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-xs font-semibold disabled:opacity-40 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
            >
              {t('liveHq.previous')}
            </button>
            <button
              onClick={() => onPageChange(Math.min(totalStorePages, currentStorePage + 1))}
              disabled={currentStorePage === totalStorePages}
              className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-xs font-semibold disabled:opacity-40 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
            >
              {t('liveHq.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
