'use client';

import { useMemo } from 'react';
import { Check, X, Star } from 'lucide-react';
import { LiveBusinessData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import { buildAmenityReport } from '@/lib/amenities';

export default function StoreAmenitiesPanel({ business }: { business: LiveBusinessData }) {
  const { t } = useTranslation();
  const report = useMemo(() => buildAmenityReport(business), [business]);

  if (!report) return null;
  const allMet = report.missing.length === 0;

  return (
    <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-2.5 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('liveHq.amenitiesTitle', 'Customer Amenities')}</span>
        </span>
        <span className={`text-[10px] font-mono font-bold ${allMet ? 'text-emerald-500' : 'text-amber-600 dark:text-amber-400'}`}>
          {t('liveHq.amenitiesCount', '{met}/{total} met')
            .replace('{met}', String(report.fulfilledCount))
            .replace('{total}', String(report.requiredCount))}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {report.items.map(item => (
          <span
            key={item.raw}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold ${
              item.fulfilled
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
            }`}
          >
            {item.fulfilled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            {item.name}
          </span>
        ))}
      </div>

      <p className="text-[11px] text-[var(--text-muted)]">
        {allMet
          ? t('liveHq.amenitiesAllMet', 'Every customer demand for this business type is met.')
          : t('liveHq.amenitiesMissing', 'Customers want the highlighted items. Missing amenities lower satisfaction and cost sales.')}
      </p>
    </div>
  );
}
