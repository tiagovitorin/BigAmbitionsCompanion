'use client';

import { AlertTriangle, MapPin, Ruler, Calendar } from 'lucide-react';
import type { LiveEmptyLeasedSpaceData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';

interface RentLeaksPanelProps {
  leaks: LiveEmptyLeasedSpaceData[];
}

export default function RentLeaksPanel({ leaks }: RentLeaksPanelProps) {
  const { t } = useTranslation();

  const totalWeekly = leaks.reduce((acc, l) => acc + (l.rentPerWeek ?? Math.round((l.rentPerDay || 0) * 7)), 0);
  const totalDaily = leaks.reduce((acc, l) => acc + (l.rentPerDay || 0), 0);

  if (leaks.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl bg-rose-500/5 border border-rose-500/30 shadow-xs">
      {/* Panel header with the alert summary */}
      <div className="p-4 border-b border-rose-500/15 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 flex-wrap">
              <span>{t('liveHq.rentLeaks', 'Unused Leased Spaces')}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 border border-rose-500/30">
                {leaks.length}
              </span>
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
              {t('liveHq.rentLeaksDesc', 'You are leasing these commercial spaces but no business runs in them. The game still charges rent every day, so they drain cash you may not notice elsewhere.')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0 text-[11px]">
          <div className="text-right">
            <div className="text-[var(--text-subtle)]">{t('liveHq.wastedRentPerDay', 'Wasted rent')}</div>
            <strong className="font-mono text-rose-500 text-sm">${totalDaily.toLocaleString()}/day</strong>
          </div>
          <div className="text-right">
            <div className="text-[var(--text-subtle)]">{t('liveHq.wastedRentPerWeek', 'per week')}</div>
            <strong className="font-mono text-rose-500 text-sm">${totalWeekly.toLocaleString()}/wk</strong>
          </div>
        </div>
      </div>

      {/* Leased spaces list */}
      <div className="overflow-x-auto bg-[var(--bg-surface)]">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase select-none">
            <tr>
              <th className="py-2.5 px-4 whitespace-nowrap">{t('liveHq.propertyAddress', 'Property Address')}</th>
              <th className="py-2.5 px-4">{t('liveHq.typeClassification', 'Type')}</th>
              <th className="py-2.5 px-4 text-center">{t('liveHq.dimensions', 'Size')}</th>
              <th className="py-2.5 px-4 text-right">{t('liveHq.weeklyRentLabel', 'Weekly rent')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {leaks.map(l => (
              <tr key={l.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                <td className="py-2.5 px-4 font-sans font-semibold text-[var(--text-main)]">
                  {l.address}
                  {l.district ? (
                    <span className="block text-[10px] font-normal text-[var(--text-muted)] flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 shrink-0" />
                      {l.district}
                    </span>
                  ) : null}
                </td>
                <td className="py-2.5 px-4 font-sans text-[var(--text-muted)] capitalize">{l.type}</td>
                <td className="py-2.5 px-4 text-center font-sans text-[var(--text-muted)]">
                  {l.sqm ? (
                    <span className="flex items-center justify-center gap-1">
                      <Ruler className="w-3 h-3 text-[var(--text-subtle)]" />
                      {l.sqm} m²
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="py-2.5 px-4 text-right font-mono">
                  <span className="flex items-center justify-end gap-1 text-rose-500 font-bold">
                    <Calendar className="w-3 h-3 text-[var(--text-subtle)]" />
                    ${(l.rentPerWeek ?? Math.round((l.rentPerDay || 0) * 7)).toLocaleString()}/wk
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2.5 border-t border-rose-500/15 bg-[var(--bg-surface)] text-[11px] text-[var(--text-muted)]">
        {t('liveHq.rentLeaksHint', 'Locate each address on the city map and break the lease in-game to stop the drain.')}
      </div>
    </div>
  );
}
