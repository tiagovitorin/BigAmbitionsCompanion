'use client';

import { Home, MapPin, Ruler, Calendar } from 'lucide-react';
import type { LiveResidenceData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';

interface PrivateResidencesPanelProps {
  residences: LiveResidenceData[];
}

export default function PrivateResidencesPanel({ residences }: PrivateResidencesPanelProps) {
  const { t } = useTranslation();

  if (residences.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-dashed border-[var(--border-base)] shadow-xs text-center">
        <Home className="w-5 h-5 text-[var(--text-subtle)] mx-auto mb-2" />
        <p className="text-xs text-[var(--text-muted)]">
          {t('liveHq.noResidences', 'No private residences detected yet. Rent an apartment or buy a home in-game and it will appear here.')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Home className="w-4 h-4 text-amber-500" />
        <h2 className="text-sm font-bold text-[var(--text-main)]">
          {t('liveHq.privateResidences', 'Private Residences')}
        </h2>
        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-subtle)]">
          {residences.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {residences.map(r => {
          const isOwned = !!r.isOwned;
          const weeklyRent = r.rentPerWeek ?? Math.round((r.rentPerDay || 0) * 7);
          return (
            <div key={r.id} className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-bold text-[var(--text-main)] truncate">{r.address}</div>
                  {r.district ? (
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[var(--text-subtle)] shrink-0" />
                      <span className="truncate">{r.district}</span>
                    </div>
                  ) : null}
                </div>
                <span className={`shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full border ${
                  isOwned
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                    : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
                }`}>
                  {isOwned ? t('liveHq.ownedChip', 'Owned') : t('liveHq.rentedChip', 'Rented')}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--text-muted)]">
                {r.type ? (
                  <span className="capitalize">{r.type}</span>
                ) : null}
                {r.sqm ? (
                  <span className="flex items-center gap-1">
                    <Ruler className="w-3 h-3 text-[var(--text-subtle)]" />
                    {r.sqm} m²
                  </span>
                ) : null}
                {r.sinceDay ? (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[var(--text-subtle)]" />
                    {t('liveHq.sinceDay', 'Since day {day}').replace('{day}', r.sinceDay.toString())}
                  </span>
                ) : null}
              </div>

              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                {isOwned ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                    {t('liveHq.ownedNoRent', 'Owned - no rent')}
                  </span>
                ) : (
                  <>
                    <span className="text-[var(--text-subtle)]">{t('liveHq.weeklyRentLabel', 'Weekly rent')}</span>
                    <strong className="font-mono text-rose-500">-${weeklyRent.toLocaleString()}/wk</strong>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
