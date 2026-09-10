'use client';

import { RefObject } from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, Calendar } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { ScheduleCellData } from './ScheduleMatrixTable';

interface ScheduleMatrixTooltipProps {
  hoveredCell: { day: string; hour: number };
  cellData: ScheduleCellData;
  recommendedWindow?: string;
  tooltipRef: RefObject<HTMLDivElement | null>;
}

export default function ScheduleMatrixTooltip({ hoveredCell, cellData, recommendedWindow, tooltipRef }: ScheduleMatrixTooltipProps) {
  const { t } = useTranslation();

  return (
    <div
      ref={tooltipRef}
      className="fixed pointer-events-none z-50 px-3.5 py-2.5 rounded-xl bg-slate-950 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs space-y-1.5 top-0 left-0 will-change-transform"
    >
      <div className="font-bold flex items-center gap-2 text-white">
        <span>{hoveredCell.day}</span>
        <span className="font-mono text-emerald-400">{hoveredCell.hour}:00 - {hoveredCell.hour + 1}:00</span>
        {cellData.isPeak && (
          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500 text-black">
              {t('liveHq.peakRush', 'PEAK RUSH')}
          </span>
        )}
      </div>

      <div className="space-y-1 text-[11px]">
        <div className="text-slate-300 flex items-center justify-between gap-4">
          <span>{t('liveHq.trafficMultiplierLabel', 'Traffic Multiplier:')}</span>
          <span className="font-mono font-bold text-emerald-400">{cellData.expectedMultiplier}x</span>
        </div>

        <div className="text-slate-300 border-t border-slate-800/80 pt-1 space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span>{t('liveHq.cashierCoverage', 'Cashier Coverage:')}</span>
            <span className={`font-mono font-bold ${cellData.cashiersCount > 0 ? 'text-emerald-400' : cellData.isHourOpen ? 'text-rose-400' : 'text-slate-500'}`}>
              {cellData.cashiersCount > 0
                ? t('liveHq.cashiersUnit', '{count} Cashier(s)').replace('{count}', cellData.cashiersCount.toString())
                : cellData.isHourOpen
                ? `🚨 ${t('liveHq.zeroCashiers', '0 Cashiers (100% Walkouts)')}`
                : t('liveHq.storeClosed', 'Store Closed')}
            </span>
          </div>

          {cellData.cleanersCount > 0 && (
            <div className="flex items-center justify-between gap-4 text-[10px] text-amber-300">
              <span>{t('liveHq.cleaningStaff', 'Cleaning Staff:')}</span>
              <span className="font-mono font-bold">{t('liveHq.cleanersUnit', '{count} Cleaner(s)').replace('{count}', cellData.cleanersCount.toString())}</span>
            </div>
          )}

          {cellData.securityCount > 0 && (
            <div className="flex items-center justify-between gap-4 text-[10px] text-sky-300">
              <span>{t('liveHq.securityGuard', 'Security Guard:')}</span>
              <span className="font-mono font-bold">{t('liveHq.guardsUnit', '{count} Guard(s)').replace('{count}', cellData.securityCount.toString())}</span>
            </div>
          )}

          {cellData.isUnstaffedOpen && (
            <div className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 text-[10px] font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>⚠️ {t('liveHq.unstaffedOpenAlert', 'UNSTAFFED OPEN: 100% customer walkouts!')}</span>
            </div>
          )}

          {cellData.isUnprofitableOpenHour && !cellData.isUnstaffedOpen && (
            <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-semibold flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>⚠️ {t('liveHq.unprofitableSchedule', 'UNPROFITABLE SCHEDULE: Demand < 0.20x (Wages likely exceed revenue)')}</span>
            </div>
          )}

          {!cellData.isHourOpen && cellData.isClosedPeakDay && cellData.isPeak && (
            <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{t('liveHq.closedPeakHour', 'Closed Peak Hour ({day}): High revenue potential').replace('{day}', hoveredCell.day)}</span>
            </div>
          )}

          {!cellData.isHourOpen && cellData.isWithinRecommendedWindow && !(cellData.isClosedPeakDay && cellData.isPeak) && (
            <div className="p-1.5 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[10px] font-semibold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{t('liveHq.suboptimalWindow', 'Suboptimal Window ({window}): Recommended benchmark').replace('{window}', recommendedWindow || '')}</span>
            </div>
          )}

          {cellData.activeStaffNames.length > 0 && (
            <div className="text-[10px] text-slate-400 pt-0.5">
              <span className="font-semibold text-slate-300">{t('liveHq.staffLabel', 'Staff ({count}):').replace('{count}', cellData.activeStaffNames.length.toString())}</span>{' '}
              <span>
                {cellData.activeStaffNames.slice(0, 3).join(', ')}
                {cellData.activeStaffNames.length > 3 && (
                  <span className="font-semibold text-amber-400 ml-1">
                    {t('liveHq.moreStaff', '+{count} more').replace('{count}', (cellData.activeStaffNames.length - 3).toString())}
                  </span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
