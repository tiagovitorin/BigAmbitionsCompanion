'use client';

import Link from 'next/link';
import { Store, ChevronRight } from 'lucide-react';
import { LiveBusinessData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';

export default function FinanceUnitEconomics({ businesses }: { businesses: LiveBusinessData[] }) {
  const { t } = useTranslation();
  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-500" />
            <span>{t('liveHq.unitEconomicsTitle', 'Store-by-Store Unit Economics & Contribution Margin')}</span>
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {t('liveHq.unitEconomicsSubtitle', 'Breakdown of revenue, inventory wholesale cost, rent, and bottom-line margin for each storefront.')}
          </p>
        </div>
        <span className="text-[10px] font-mono text-[var(--text-subtle)]">
          {t('liveHq.commercialUnits', '{count} Commercial Units').replace('{count}', businesses.length.toString())}
        </span>
      </div>

      <div className="border border-[var(--border-base)] rounded-xl overflow-hidden bg-[var(--bg-base)]">
        <table className="w-full text-xs text-left">
          <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase">
            <tr>
              <th className="py-2.5 px-4">{t('liveHq.storefront', 'Storefront')}</th>
              <th className="py-2.5 px-4">{t('common.district')}</th>
              <th className="py-2.5 px-4 text-right">{t('liveHq.weeklyRevenueCol', 'Weekly Revenue')}</th>
              <th className="py-2.5 px-4 text-right">{t('liveHq.weeklyRentCol', 'Weekly Rent')}</th>
              <th className="py-2.5 px-4 text-right">{t('liveHq.weeklyProfitColumn', 'Weekly Profit')}</th>
              <th className="py-2.5 px-4 text-center">{t('liveHq.netMarginCol', 'Net Margin')}</th>
              <th className="py-2.5 px-4 text-center">{t('liveHq.action', 'Action')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
            {businesses.map(b => {
              const rev = b.weeklyRevenue ?? 0;
              const prof = b.weeklyProfit ?? 0;
              const margin = rev > 0 ? Math.round((prof / rev) * 100) : 0;

              return (
                <tr key={b.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                  <td className="py-2.5 px-4 font-sans font-semibold text-[var(--text-main)]">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{b.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-subtle)]">
                        {b.type}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-sans text-[var(--text-muted)]">
                    {b.district}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    +${(b.weeklyRevenue || 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right text-rose-500">
                    -${(b.weeklyRent || 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    +${(b.weeklyProfit || 0).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      margin >= 50
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : margin >= 30
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                        : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {margin}%
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-center font-sans">
                    <Link
                      href={`/live-sync?view=stores&store=${b.id}`}
                      className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1"
                    >
                      <span>{t('liveHq.commandRoom', 'Command Room')}</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
