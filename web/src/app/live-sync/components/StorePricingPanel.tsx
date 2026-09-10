'use client';

import { DollarSign, Package } from 'lucide-react';
import { LiveBusinessData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import { getCanonicalProductKey, getItemImageSrc } from '@/lib/products';

export default function StorePricingPanel({ activeStore }: { activeStore: LiveBusinessData }) {
  const { t } = useTranslation();

  return (
    <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-[var(--text-main)]">{t('liveHq.activePricesMargins', 'Active Prices & Margins')}</h3>
        </div>
        <span className="text-[10px] font-mono text-[var(--text-subtle)]">
          {t('liveHq.productsSold', '{count} Products Sold').replace('{count}', (activeStore.retailPrices?.length || 0).toString())}
        </span>
      </div>

      <div className="border border-[var(--border-base)] rounded-xl overflow-hidden bg-[var(--bg-base)]">
        <table className="w-full text-xs text-left">
          <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase">
            <tr>
              <th className="py-2 px-3">{t('liveHq.tableItem', 'Item')}</th>
              <th className="py-2 px-2 text-center">{t('liveHq.tableStock', 'Stock')}</th>
              <th className="py-2 px-2 text-center">{t('liveHq.tableDepletion', 'Depletion / Runout')}</th>
              <th className="py-2 px-2 text-right">{t('liveHq.tablePrice', 'Price')}</th>
              <th className="py-2 px-2 text-right">{t('liveHq.tableOptimal', 'Optimal')}</th>
              <th className="py-2 px-3 text-center">{t('liveHq.tableAction', 'Action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
            {activeStore.retailPrices && activeStore.retailPrices.length > 0 ? (
              activeStore.retailPrices.map(rp => {
                const cleanTitle = (rp.displayName || rp.rawItemName)
                  .replace('ba:itemname_', '')
                  .replace('ba:item_', '')
                  .replace('ba:item', '')
                  .replace(/_/g, ' ')
                  .trim();

                const iconSrc = getItemImageSrc(rp.rawItemName);
                const isKabob = cleanTitle.toLowerCase().includes('kabob');
                const currentP = rp.currentPrice;
                const optimalP = rp.optimalPrice;
                const maxCeil = rp.maxMarketCeiling;
                const stockUnits = (rp as any).inStoreStock ?? 0;
                const diff = optimalP - currentP;
                const isBag = cleanTitle.toLowerCase().includes('bag');
                // Bags are complimentary store supplies (price is 0, optimal is Free)
                const isUnderpriced = !isBag && diff >= 0.15 && (currentP > 0 ? (diff / currentP) >= 0.01 : true);
                const isOverpriced = !isBag && currentP > maxCeil;

                // Factual Daily Burn Rate: Calculate velocity from the previous 3 days of factual orderHistory
                const rawHistoryOrders = (activeStore.orderHistory || []);
                const historyOrders = rawHistoryOrders.length > 3 ? rawHistoryOrders.slice(-3) : rawHistoryOrders;
                const targetKey = getCanonicalProductKey(rp.rawItemName, cleanTitle);

                // Extract factual history sales for this specific item (prefer exact canonical key, fallback to exact clean title)
                const distinctHistoryDays = new Set<number>();
                let totalHistorySold = 0;

                historyOrders.forEach((dayEntry: any) => {
                  const items = dayEntry.itemSales || [];
                  items.forEach((item: any) => {
                    const itemKey = getCanonicalProductKey(item.rawItemName, item.itemName);
                    const itemClean = (item.itemName || '').trim().toLowerCase();
                    if (itemKey === targetKey || itemClean === cleanTitle.toLowerCase()) {
                      distinctHistoryDays.add(dayEntry.dayNumber ?? dayEntry.day ?? 0);
                      totalHistorySold += (item.amountSold || 0);
                    }
                  });
                });

                const activeHistoryDays = Math.max(1, distinctHistoryDays.size);
                // Calculate multi-day average sold per day if history exists; fallback to today's cumulative sales
                let dailySold = 0;
                if (distinctHistoryDays.size > 0) {
                  dailySold = totalHistorySold / activeHistoryDays;
                } else {
                  const todaySalesList = (activeStore.todayOrderSales || activeStore.todayItemSales || []);
                  const matchedToday = todaySalesList.find((s: any) => {
                    const sKey = getCanonicalProductKey(s.rawItemName, s.itemName);
                    return sKey === targetKey || s.itemName.toLowerCase() === cleanTitle.toLowerCase();
                  });
                  dailySold = matchedToday ? matchedToday.amountSold : 0;
                }

                // Service products (e.g. hourly lawyer fee, hair cut fee, tickets) have no shelf boxes
                const isService = rp.isServiceProduct ||
                  cleanTitle.toLowerCase().includes('fee') ||
                  cleanTitle.toLowerCase().includes('hourly') ||
                  cleanTitle.toLowerCase().includes('charge') ||
                  cleanTitle.toLowerCase().includes('ticket');

                // Estimated time out of stock calculation based on factual daily velocity
                let runoutText = '-';
                let runoutBadgeClass = 'text-[var(--text-subtle)]';

                if (isService) {
                  runoutText = t('liveHq.serviceProduct', 'Service');
                  runoutBadgeClass = 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-medium border border-sky-500/20';
                } else if (stockUnits === 0) {
                  runoutText = t('liveHq.outOfStock', 'OUT OF STOCK');
                  runoutBadgeClass = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/30';
                } else if (dailySold > 0) {
                  const daysLeft = stockUnits / dailySold;
                  if (daysLeft < 0.5) {
                    const hoursLeft = Math.max(1, Math.round(daysLeft * 24));
                    runoutText = t('liveHq.hoursLeft', '~{hours} hrs').replace('{hours}', hoursLeft.toString());
                    runoutBadgeClass = 'bg-rose-500/10 text-rose-500 font-bold border border-rose-500/20';
                  } else if (daysLeft < 1.0) {
                    runoutText = t('liveHq.lessThanOneDay', '< 1 day');
                    runoutBadgeClass = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30';
                  } else if (daysLeft <= 3.0) {
                    runoutText = t('liveHq.daysLeft', '~{days} days').replace('{days}', daysLeft.toFixed(1));
                    runoutBadgeClass = 'bg-amber-500/10 text-amber-500 font-semibold';
                  } else {
                    runoutText = t('liveHq.daysLeft', '~{days} days').replace('{days}', Math.round(daysLeft).toString());
                    runoutBadgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium';
                  }
                } else {
                  runoutText = t('liveHq.noSalesYet', 'No Sales Yet');
                  runoutBadgeClass = 'text-[var(--text-subtle)]';
                }

                return (
                  <tr key={rp.rawItemName} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="py-2 px-3 font-sans font-semibold text-[var(--text-main)]">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                          {iconSrc ? (
                            <img src={iconSrc} alt={cleanTitle} className={`w-full h-full object-contain ${isKabob ? 'scale-150 transform' : ''}`} />
                          ) : (
                            <Package className="w-3 h-3 text-emerald-500 opacity-70" />
                          )}
                        </div>
                        <span className="capitalize truncate max-w-28">{cleanTitle}</span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        isService
                          ? 'bg-[var(--bg-surface)] text-[var(--text-subtle)] border border-[var(--border-subtle)]'
                          : stockUnits === 0
                          ? 'bg-rose-500/10 text-rose-500'
                          : stockUnits < 10
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-emerald-500/10 text-emerald-600'
                      }`}>
                        {isService ? t('liveHq.labor', 'Labor') : stockUnits === 0 ? '0' : stockUnits}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap inline-block ${runoutBadgeClass}`}>
                        {runoutText}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-[var(--text-main)]">
                      {isBag ? t('liveHq.free', 'Free') : `$${currentP.toFixed(2)}`}
                    </td>
                    <td className="py-2 px-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {isBag ? t('liveHq.free', 'Free') : `$${optimalP.toFixed(2)}`}
                    </td>
                    <td className="py-2 px-3 text-center">
                      {isBag ? (
                        <span className="text-[9px] font-sans font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 whitespace-nowrap">
                          {t('liveHq.supply', 'Supply')}
                        </span>
                      ) : isUnderpriced ? (
                        <span className="text-[9px] font-sans font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 whitespace-nowrap">
                          +${diff.toFixed(2)}
                        </span>
                      ) : isOverpriced ? (
                        <span className="text-[9px] font-sans font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 whitespace-nowrap">
                          {t('liveHq.high', 'High')}
                        </span>
                      ) : (
                        <span className="text-[9px] font-sans font-bold text-emerald-600">
                          ✓
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-4 text-center text-xs text-[var(--text-muted)] font-sans">
                  {t('liveHq.noPricesConfigured', 'No product prices configured yet.')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
