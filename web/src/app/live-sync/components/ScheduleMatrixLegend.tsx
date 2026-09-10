'use client';

import { useTranslation } from '@/context/LanguageContext';

interface ScheduleMatrixLegendProps {
  showLegend: boolean;
  onClose: () => void;
}

export default function ScheduleMatrixLegend({ showLegend, onClose }: ScheduleMatrixLegendProps) {
  const { t } = useTranslation();

  if (!showLegend) return null;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 p-4 rounded-xl bg-white dark:bg-[#1C1A17] border border-[var(--border-strong)] shadow-xl z-50 space-y-3 text-xs">
      <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border-subtle)]">
        <span className="font-bold text-[var(--text-main)]">{t('liveHq.scheduleLegend', 'Schedule Color Codes')}</span>
        <button
          onClick={onClose}
          className="text-[var(--text-subtle)] hover:text-[var(--text-main)] cursor-pointer"
        >
          &times;
        </button>
      </div>

      {/* Operating Category */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)]">{t('liveHq.legendOperatingHours', 'Operating Hours')}</span>
        <div className="grid grid-cols-1 gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-600 shrink-0"></span>
            <span className="text-[var(--text-main)]"><strong>{t('liveHq.rushHour', 'Rush Hour')}:</strong> {t('liveHq.rushHourDesc', 'High customer traffic window')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-emerald-500/70 shrink-0"></span>
            <span className="text-[var(--text-muted)]"><strong>{t('liveHq.normalTraffic', 'Normal Traffic')}:</strong> {t('liveHq.normalTrafficDesc', 'Standard operating hour')}</span>
          </div>
        </div>
      </div>

      {/* Alerts & Errors */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--border-subtle)]">
        <span className="text-[10px] font-mono uppercase tracking-wider text-rose-500">{t('liveHq.legendAlertsDrag', 'Alerts & Drag')}</span>
        <div className="grid grid-cols-1 gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/60 shrink-0"></span>
            <span className="text-rose-500 font-semibold"><strong>{t('liveHq.unstaffedOpen', 'Unstaffed Open')}:</strong> {t('liveHq.unstaffedOpenDesc', '0 cashiers on duty (walkouts)')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-purple-500/20 border border-purple-500/50 shrink-0"></span>
            <span className="text-purple-600 dark:text-purple-300"><strong>{t('liveHq.unprofitableHours', 'Unprofitable (<0.20x)')}:</strong> {t('liveHq.unprofitableHoursDesc', 'Open during dead hours')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-indigo-500/80 shrink-0"></span>
            <span className="text-indigo-600 dark:text-indigo-400"><strong>{t('liveHq.staffedClosed', 'Staffed Closed')}:</strong> {t('liveHq.staffedClosedDesc', 'Shifts scheduled while closed')}</span>
          </div>
        </div>
      </div>

      {/* Closed & Opportunity */}
      <div className="space-y-1.5 pt-1 border-t border-[var(--border-subtle)]">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)]">{t('liveHq.legendClosedHours', 'Closed Hours')}</span>
        <div className="grid grid-cols-1 gap-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-amber-500/15 border border-amber-500/40 shrink-0"></span>
            <span className="text-amber-600 dark:text-amber-400"><strong>{t('liveHq.rushOpportunity', 'Rush Opportunity')}:</strong> {t('liveHq.rushOpportunityDesc', 'Closed during peak rush')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-sky-500/20 border border-sky-500/50 shrink-0"></span>
            <span className="text-sky-600 dark:text-sky-400"><strong>{t('liveHq.benchmarkLabel', 'Benchmark')}:</strong> {t('liveHq.benchmarkDesc', 'Recommended compendium window')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-[var(--bg-surface)] border border-[var(--border-base)] shrink-0"></span>
            <span className="text-[var(--text-subtle)]"><strong>{t('liveHq.closedStore', 'Closed')}:</strong> {t('liveHq.closedStoreDesc', 'Store closed as normal')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
