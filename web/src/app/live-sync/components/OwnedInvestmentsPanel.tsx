'use client';

import { useState } from 'react';
import { Building, TrendingUp, MapPin } from 'lucide-react';
import type { LiveOwnedRealEstateData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';

const PAGE_SIZE = 25;

interface OwnedInvestmentsPanelProps {
  ownedRealEstate: LiveOwnedRealEstateData[];
  daysPerYear: number;
}

export default function OwnedInvestmentsPanel({ ownedRealEstate, daysPerYear }: OwnedInvestmentsPanelProps) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);

  const totalValue = ownedRealEstate.reduce((acc, re) => acc + (re.purchasePrice || 0), 0);
  const totalWeeklyNet = ownedRealEstate.reduce((acc, re) => acc + (re.weeklyNet || 0), 0);

  const totalPages = Math.ceil(ownedRealEstate.length / PAGE_SIZE) || 1;
  const safePage = Math.min(page, totalPages);
  const rows = ownedRealEstate.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const annualRoi = (re: LiveOwnedRealEstateData): number | null => {
    if (!re.purchasePrice || re.purchasePrice <= 0) return null;
    return ((re.weeklyNet || 0) * (daysPerYear / 7)) / re.purchasePrice * 100;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Building className="w-4 h-4 text-emerald-500" />
        <h2 className="text-sm font-bold text-[var(--text-main)]">
          {t('liveHq.ownedInvestments', 'Owned Investment Properties')}
        </h2>
        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-subtle)]">
          {ownedRealEstate.length}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-muted)]">{t('liveHq.investedCapital', 'Invested capital')}</span>
          <strong className="font-mono text-[var(--text-main)]">${totalValue.toLocaleString()}</strong>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-muted)]">{t('liveHq.weeklyNetIncome', 'Weekly net income')}</span>
          <strong className={`font-mono ${totalWeeklyNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
            {totalWeeklyNet >= 0 ? '+' : ''}${totalWeeklyNet.toLocaleString()}/wk
          </strong>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase select-none">
              <tr>
                <th className="py-2.5 px-4 whitespace-nowrap">{t('liveHq.propertyAddress', 'Property Address')}</th>
                <th className="py-2.5 px-4">{t('liveHq.typeClassification', 'Type')}</th>
                <th className="py-2.5 px-4 text-center">{t('liveHq.dimensions', 'Size')}</th>
                <th className="py-2.5 px-4 text-center">{t('liveHq.occupancyLabel', 'Occupancy')}</th>
                <th className="py-2.5 px-4 text-right">{t('liveHq.weeklyNetIncome', 'Weekly net')}</th>
                <th className="py-2.5 px-4 text-right">{t('liveHq.annualRoiShort', 'Annual ROI')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {rows.map(re => {
                const roi = annualRoi(re);
                return (
                  <tr key={re.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                    <td className="py-2.5 px-4 font-sans font-semibold text-[var(--text-main)]">
                      {re.address}
                      {re.district ? (
                        <span className="block text-[10px] font-normal text-[var(--text-muted)] flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 shrink-0" />
                          {re.district}
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-[var(--text-muted)]">
                      {re.buildingTypeName || t('liveHq.propertyGeneric', 'Property')}
                    </td>
                    <td className="py-2.5 px-4 font-sans text-[var(--text-muted)]">{re.totalSqm} m²</td>
                    <td className="py-2.5 px-4 text-center font-mono">
                      {re.occupancyPct != null ? `${re.occupancyPct}%` : '-'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      <span className={re.weeklyNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                        {re.weeklyNet >= 0 ? '+' : ''}${re.weeklyNet.toLocaleString()}/wk
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {roi != null ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {roi.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-[var(--text-subtle)]">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-3 border-t border-[var(--border-base)] flex items-center justify-between text-xs bg-[var(--bg-surface)]">
            <span className="text-[var(--text-subtle)]">
              {t('liveHq.page', 'Page')} <strong className="text-[var(--text-main)] font-mono">{safePage}</strong> {t('liveHq.of', 'of')} <strong className="text-[var(--text-main)] font-mono">{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, safePage - 1))}
                disabled={safePage === 1}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-xs font-semibold disabled:opacity-40 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
              >
                {t('liveHq.previous', 'Previous')}
              </button>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage === totalPages}
                className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-xs font-semibold disabled:opacity-40 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
              >
                {t('liveHq.next', 'Next')}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
        <TrendingUp className="w-3 h-3 text-[var(--text-subtle)]" />
        <span>{t('liveHq.roiAnnualizedNote', 'ROI annualized from weekly net income after taxes.')}</span>
      </div>
    </div>
  );
}
