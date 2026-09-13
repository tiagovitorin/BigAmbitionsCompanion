'use client';

import { useTranslation } from '@/context/LanguageContext';
import type { LiveEmployeeDemand } from '@/context/LiveSyncContext';
import { getJobDemandMeta } from '@/lib/jobDemands';
import FloatingTooltip from './FloatingTooltip';

interface DemandIconsProps {
  demands?: LiveEmployeeDemand[];
  size?: 'sm' | 'md';
  className?: string;
}

// Compact icon-per-demand display. The full demand name is shown on hover so the
// table cell stays one line tall no matter how many demands an employee has.
export default function DemandIcons({ demands, size = 'sm', className }: DemandIconsProps) {
  const { t } = useTranslation();

  if (!demands || demands.length === 0) {
    return <span className="text-[10px] text-[var(--text-subtle)]">{t('liveHq.noneSatisfied', 'None (Satisfied)')}</span>;
  }

  const iconClass = size === 'md' ? 'w-3.5 h-3.5' : 'w-3 h-3';
  const box = size === 'md' ? 'w-7 h-7' : 'w-6 h-6';

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className || ''}`}>
      {demands.map((d, i) => {
        const demandMeta = getJobDemandMeta(d.rawName, d.name);
        const Icon = demandMeta.icon;
        const label = demandMeta.labelKey ? t(demandMeta.labelKey, demandMeta.label) : demandMeta.label;
        return (
          <FloatingTooltip
            key={`${d.rawName || d.name}-${i}`}
            className={`${box} shrink-0 rounded-lg border flex items-center justify-center cursor-default ${demandMeta.tone}`}
            content={<span className="font-semibold whitespace-nowrap">{label}</span>}
          >
            <Icon className={iconClass} />
          </FloatingTooltip>
        );
      })}
    </div>
  );
}
