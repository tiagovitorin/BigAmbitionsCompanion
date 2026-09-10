'use client';

import { PlusCircle, Package } from 'lucide-react';
import { getItemImageSrc } from '@/lib/products';
import { useTranslation } from '@/context/LanguageContext';

interface UnstockedOpportunity {
  id: string;
  name: string;
  wholesale_price: number;
  default_market_price: number;
  estDailyRevenue: number | null;
  estDailyProfit: number | null;
}

export default function StoreExpansionPanel({ unstockedProductOpportunities }: { unstockedProductOpportunities: UnstockedOpportunity[] }) {
  const { t } = useTranslation();

  return (
    <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3 shadow-xs">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <PlusCircle className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold text-[var(--text-main)]">{t('liveHq.expansionOpportunities', 'Expansion Opportunities')}</h3>
        </div>
        <span className="text-[10px] font-mono text-[var(--text-subtle)]">
          {t('liveHq.unstockedItems', '{count} Unstocked Items').replace('{count}', unstockedProductOpportunities.length.toString())}
        </span>
      </div>

      {unstockedProductOpportunities.length > 0 ? (
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {unstockedProductOpportunities.map((up) => {
            const iconSrc = getItemImageSrc(up.id || up.name);
            const isKabob = (up.id || up.name || '').toLowerCase().includes('kabob');
            return (
              <div key={up.id} className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                    {iconSrc ? (
                      <img
                        src={iconSrc}
                        alt={up.name}
                        className={`w-full h-full object-contain ${isKabob ? 'scale-150 transform' : ''}`}
                      />
                    ) : (
                      <Package className="w-3 h-3 text-emerald-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-[var(--text-main)]">{up.name}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      {t('liveHq.wholesaleToMarket', 'Wholesale: {wholesale} → Market: {market}').replace('{wholesale}', `$${up.wholesale_price.toFixed(2)}`).replace('{market}', `$${up.default_market_price.toFixed(2)}`)}
                    </div>
                  </div>
                </div>
                <div className="text-right font-mono">
                  {up.estDailyRevenue !== null && up.estDailyProfit !== null ? (
                    <>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold block text-xs">
                        +${up.estDailyRevenue}/d
                      </span>
                      <span className="text-[9px] text-[var(--text-subtle)]">
                        +${up.estDailyProfit}/d {t('liveHq.profitSuffix', 'profit')}
                      </span>
                    </>
                  ) : (
                    <span className="text-[10px] text-[var(--text-subtle)] italic">
                      {t('liveHq.insufficientData', 'Insufficient data')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-base)] rounded-xl border border-[var(--border-base)]">
          {t('liveHq.allStocked', 'All category products are currently stocked in this store.')}
        </div>
      )}
    </div>
  );
}
