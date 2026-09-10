'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { LiveBusinessData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import BusinessLogo from './BusinessLogo';

interface StoresGridProps {
  paginatedStores: LiveBusinessData[];
  totalStorePages: number;
  currentStorePage: number;
  onPageChange: (page: number) => void;
}

export default function StoresGrid({ paginatedStores, totalStorePages, currentStorePage, onPageChange }: StoresGridProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedStores.map(b => (
          <Link
            key={b.id}
            href={`/live-sync?view=stores&store=${b.id}`}
            className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] hover:border-emerald-500/40 transition-all space-y-3.5 shadow-xs block cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <BusinessLogo business={b} sizeClass="w-10 h-10" />
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-main)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{b.name}</h3>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">{b.address} • {b.district}</div>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                b.isOpenNow ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
              }`}>
                {b.isOpenNow ? t('liveHq.openNow') : t('liveHq.closed')}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-center text-xs">
              <div>
                <div className="text-[10px] text-[var(--text-subtle)]">{t('liveHq.weeklySales')}</div>
                <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ${(b.weeklyRevenue || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-subtle)]">{t('liveHq.weeklyProfitColumn')}</div>
                <div className="font-mono font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                  ${(b.weeklyProfit || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-subtle)]">{t('liveHq.rating')}</div>
                <div className="font-mono font-bold text-[var(--text-main)] mt-0.5">
                  {b.customerSatisfaction}%
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>{t('liveHq.openStoreCommandRoom')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        ))}
      </div>

      {totalStorePages > 1 && (
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] flex items-center justify-between text-xs">
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
