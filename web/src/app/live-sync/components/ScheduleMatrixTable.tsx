'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, HelpCircle, Sparkles, ShieldCheck, Users } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { DAYS_ORDER, getShiftRoleCategory, isHourOpenForSchedule, DEFAULT_DAY_MULTIPLIERS, DEFAULT_HOURLY_CURVE, DEFAULT_PEAK_HOURS } from '@/lib/schedule';
import {
  UNPROFITABLE_HOUR_MULTIPLIER,
  PROFITABLE_HOUR_MULTIPLIER,
  RECOMMENDED_WINDOW_MULTIPLIER,
  MARGINAL_HOURLY_WAGE_CUTOFF,
  CLOSED_PEAK_DAY_MULTIPLIER
} from '@/lib/thresholds';
import ScheduleMatrixLegend from './ScheduleMatrixLegend';
import ScheduleMatrixTooltip from './ScheduleMatrixTooltip';

export interface ScheduleCellData {
  staffCount: number;
  cashiersCount: number;
  cleanersCount: number;
  securityCount: number;
  activeStaffNames: string[];
  isHourOpen: boolean;
  isPeak: boolean;
  isUnstaffedOpen: boolean;
  isUnprofitableOpenHour: boolean;
  isWithinRecommendedWindow: boolean;
  isClosedPeakDay: boolean;
  expectedMultiplier: string;
  cellBg: string;
}

interface ScheduleMatrixTableProps {
  activeStore: any;
  activeStoreDef: any;
  employees: any[];
}

export default function ScheduleMatrixTable({ activeStore, activeStoreDef, employees }: ScheduleMatrixTableProps) {
  const { t } = useTranslation();

  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: number } | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const legendRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (legendRef.current && !legendRef.current.contains(event.target as Node)) {
        setShowLegend(false);
      }
    }
    if (showLegend) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLegend]);

  const dayMultipliers: Record<string, number> = activeStoreDef?.operating_schedule?.day_multipliers || DEFAULT_DAY_MULTIPLIERS;
  const hourlyCurve: number[] = activeStoreDef?.operating_schedule?.hourly_multipliers || DEFAULT_HOURLY_CURVE;
  const peakHours: number[] = activeStoreDef?.operating_schedule?.peak_hours || DEFAULT_PEAK_HOURS;
  const recommendedWindow = activeStoreDef?.operating_schedule?.recommended_opening_window;

  // Pre-process all 7x24 cells in constant time
  const cellMap = useMemo(() => {
    const map: Record<string, Record<number, ScheduleCellData>> = {};

    DAYS_ORDER.forEach(day => {
      map[day] = {};
      const daySched = (activeStore.scheduleWeek || []).find((s: any) => s.day.toLowerCase() === day.toLowerCase());
      const shifts = daySched?.shifts || [];
      const isOpen = daySched?.isOpen ?? false;
      const dayMult = dayMultipliers[day] || 0.85;
      const isClosedPeakDay = !isOpen && dayMult >= CLOSED_PEAK_DAY_MULTIPLIER;

      for (let hour = 0; hour < 24; hour++) {
        const activeShiftsForHour = shifts.filter((ws: any) => hour >= ws.startHour && hour < ws.endHour);
        const staffCount = activeShiftsForHour.length;
        const isPeak = peakHours.includes(hour);

        const cashiers = activeShiftsForHour.filter((s: any) => getShiftRoleCategory(s, employees) === 'cashier');
        const cleaners = activeShiftsForHour.filter((s: any) => getShiftRoleCategory(s, employees) === 'cleaner');
        const security = activeShiftsForHour.filter((s: any) => getShiftRoleCategory(s, employees) === 'security');

        const isHourOpen = isHourOpenForSchedule(daySched, hour);

        // Dynamic Break-Even Analysis:
        // Hourly fixed cost = (Daily Store Rent / 24) + Scheduled Staff Wages for this hour
        const dailyRent = activeStore.weeklyRent ? activeStore.weeklyRent / 7 : 0;
        const hourlyRent = dailyRent > 0 ? dailyRent / 24 : 0;
        const hourlyWages = activeShiftsForHour.reduce((sum: number, s: any) => {
          const empObj = employees.find(e => e.id === s.employeeId || e.name === s.employeeName);
          return sum + Number(empObj?.wage || 0);
        }, 0);
        const totalHourlyCost = hourlyRent + hourlyWages;

        // Factual profit margin per customer from today's / weekly telemetry data
        const storeRev = Number(activeStore.weeklyRevenue ? activeStore.weeklyRevenue / 7 : 0);
        const storeCust = Number(activeStore.todayCustomerCount || 0);
        const storeProfit = Number(activeStore.dailyProfit ?? (activeStore.weeklyProfit ? activeStore.weeklyProfit / 7 : 0));
        const factualMargin = (storeRev > 0 && storeProfit > 0) ? (storeProfit / storeRev) : 0;
        const profitPerCustomer = (storeCust > 0 && storeRev > 0 && factualMargin > 0)
          ? (storeRev * factualMargin) / storeCust
          : 0;
        const breakEvenCustomers = (totalHourlyCost > 0 && profitPerCustomer > 0)
          ? Math.ceil(totalHourlyCost / profitPerCustomer)
          : null;

        const effectiveMultiplierNum = (hourlyCurve[hour] || 0) * dayMult;
        const expectedMultiplier = effectiveMultiplierNum.toFixed(2);

        // Traffic index >= 0.20 remains the general compendium baseline benchmark
        const isRecommendedSimulationHour = !isHourOpen && (effectiveMultiplierNum >= RECOMMENDED_WINDOW_MULTIPLIER);

        // Store is OPEN and staffed, but forecasted traffic produces fewer customers than break-even
        const isUnprofitableOpenHour = isHourOpen && (effectiveMultiplierNum < UNPROFITABLE_HOUR_MULTIPLIER || (staffCount > 0 && effectiveMultiplierNum < PROFITABLE_HOUR_MULTIPLIER && hourlyWages > MARGINAL_HOURLY_WAGE_CUTOFF));
        const isUnstaffedOpen = isHourOpen && cashiers.length === 0;

        let cellBg = 'bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-subtle)] hover:border-slate-500/40';
        if (isHourOpen) {
          if (isUnstaffedOpen) {
            cellBg = 'bg-rose-500/25 border-2 border-rose-500 text-rose-600 dark:text-rose-400 font-extrabold';
          } else if (isUnprofitableOpenHour) {
            cellBg = 'bg-purple-500/20 border border-purple-500/50 text-purple-600 dark:text-purple-300 font-bold';
          } else if (isPeak) {
            cellBg = 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs';
          } else {
            cellBg = 'bg-emerald-500/80 hover:bg-emerald-500 text-white font-semibold';
          }
        } else if (staffCount > 0) {
          cellBg = 'bg-indigo-500/80 text-white font-semibold';
        } else if (isClosedPeakDay && isPeak) {
          cellBg = 'bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 font-medium';
        } else if (isRecommendedSimulationHour) {
          cellBg = 'bg-sky-500/15 border border-sky-500/40 text-sky-600 dark:text-sky-400 font-medium';
        }

        map[day][hour] = {
          staffCount,
          cashiersCount: cashiers.length,
          cleanersCount: cleaners.length,
          securityCount: security.length,
          activeStaffNames: activeShiftsForHour.map((s: any) => `${s.employeeName} (${s.role || 'cashier'})`),
          isHourOpen,
          isPeak,
          isUnstaffedOpen,
          isUnprofitableOpenHour,
          isWithinRecommendedWindow: isRecommendedSimulationHour,
          isClosedPeakDay,
          expectedMultiplier,
          cellBg
        };
      }
    });

    return map;
  }, [activeStore, activeStoreDef, employees, dayMultipliers, hourlyCurve, peakHours]);

  const activeCellData = hoveredCell ? cellMap[hoveredCell.day]?.[hoveredCell.hour] : null;

  return (
    <div
      className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-4 shadow-xs relative"
      onMouseMove={(e) => {
        if (tooltipRef.current) {
          const x = e.clientX + 260 > window.innerWidth ? Math.max(10, e.clientX - 250) : e.clientX + 14;
          const y = e.clientY + 190 > window.innerHeight ? Math.max(10, e.clientY - 170) : e.clientY + 14;
          tooltipRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border-subtle)]">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span>{t('liveHq.fullWeekMatrix', 'Full Week Operating Schedule & Live Shift Coverage Matrix')}</span>
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {t('liveHq.heatmapHint', 'Heatmap indicates customer traffic volume. Numbers indicate assigned staff on duty.')}
          </p>
        </div>

        <div className="relative" ref={legendRef}>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-base)] bg-[var(--bg-base)] hover:bg-[var(--bg-card)] text-[var(--text-main)] transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('liveHq.matrixGuide', 'Matrix Legend & Guide')}</span>
          </button>

          <ScheduleMatrixLegend showLegend={showLegend} onClose={() => setShowLegend(false)} />
        </div>
      </div>

      {/* 7x24 Rigid Interactive Timetable */}
      <div className="overflow-x-auto p-3 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] relative">
        <table
          className="w-full min-w-[800px] table-fixed border-collapse"
          onMouseLeave={() => setHoveredCell(null)}
        >
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-subtle)]">
              <th className="w-28 text-left pb-2 font-bold text-[var(--text-muted)]">{t('liveHq.dayHourHeader', 'Day / Hour')}</th>
              {Array.from({ length: 24 }).map((_, h) => (
                <th key={h} className="p-0.5 text-center font-bold">
                  {String(h).padStart(2, '0')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS_ORDER.map(day => {
              const daySchedule = (activeStore.scheduleWeek || []).find((s: any) => s.day.toLowerCase() === day.toLowerCase());
              const isOpen = daySchedule?.isOpen ?? false;
              const dayMult = dayMultipliers[day] || 0.85;
              const isClosedPeakDay = !isOpen && dayMult >= CLOSED_PEAK_DAY_MULTIPLIER;

              return (
                <tr key={day} className="border-b border-[var(--border-subtle)]/40 last:border-0">
                  <td className="w-24 py-1.5 pr-2">
                    <div className="w-full text-left text-xs font-bold text-[var(--text-main)] flex items-center justify-between">
                      <span>{day.slice(0, 3)}</span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isOpen
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : isClosedPeakDay
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                          : 'bg-slate-500/10 text-slate-500'
                      }`}>
                        {isOpen ? `${daySchedule?.openHours || 0}h` : t('liveHq.closedStore', 'Closed')}
                      </span>
                    </div>
                  </td>

                  {Array.from({ length: 24 }).map((_, hour) => {
                    const cellData = cellMap[day][hour];

                    return (
                      <td
                        key={hour}
                        className="p-0.5"
                        onMouseEnter={(e) => {
                          setHoveredCell({ day, hour });
                          const x = e.clientX + 260 > window.innerWidth ? Math.max(10, e.clientX - 250) : e.clientX + 14;
                          const y = e.clientY + 190 > window.innerHeight ? Math.max(10, e.clientY - 170) : e.clientY + 14;
                          if (tooltipRef.current) {
                            tooltipRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                          }
                        }}
                      >
                        <div
                          className={`w-full h-8 rounded-lg text-[10px] font-mono flex items-center justify-center cursor-pointer select-none relative ${cellData.cellBg}`}
                        >
                          {cellData.staffCount > 0 ? (
                            <span className="flex items-center gap-0.5 text-[10px]">
                              {cellData.cleanersCount > 0 && cellData.cashiersCount === 0 ? (
                                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                              ) : cellData.securityCount > 0 && cellData.cashiersCount === 0 ? (
                                <ShieldCheck className="w-2.5 h-2.5 text-sky-300" />
                              ) : (
                                <Users className="w-2.5 h-2.5" />
                              )}
                              <span>{cellData.staffCount}</span>
                            </span>
                          ) : cellData.isHourOpen ? (
                            <span className="text-[9px] text-rose-600 dark:text-rose-400 font-extrabold">0</span>
                          ) : (
                            <span className="text-[9px] text-[var(--text-subtle)] font-medium opacity-60">-</span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>

        {hoveredCell && activeCellData && (
          <ScheduleMatrixTooltip
            hoveredCell={hoveredCell}
            cellData={activeCellData}
            recommendedWindow={recommendedWindow}
            tooltipRef={tooltipRef}
          />
        )}
      </div>
    </div>
  );
}
