'use client';

import Link from 'next/link';
import { Clock, AlertTriangle, TrendingUp, Calendar, ArrowUpRight } from 'lucide-react';
import { LiveBusinessData, LiveEmployeeData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import { PROFITABLE_HOUR_MULTIPLIER } from '@/lib/thresholds';

interface StoreScheduleAdvisoryProps {
  activeStore: LiveBusinessData;
  activeStoreDef: any;
  employees: LiveEmployeeData[];
}

export default function StoreScheduleAdvisory({ activeStore, activeStoreDef, employees }: StoreScheduleAdvisoryProps) {
  const { t } = useTranslation();

  const peakHours: number[] = activeStoreDef?.operating_schedule?.peak_hours || [12, 13, 18, 19];
  const scheduleDays = activeStore.scheduleWeek || [];

  // Check for unstaffed open hours & staff scheduled while store is closed
  const unstaffedOpenList: { day: string; hours: number[] }[] = [];
  const staffedClosedList: { day: string; hours: number[]; staffNames: string[] }[] = [];
  const unstaffedPeakList: { day: string; hours: number[] }[] = [];
  const closedPeakDays: string[] = [];

  scheduleDays.forEach(sd => {
    const missingHours: number[] = [];
    const closedWithStaffHours: number[] = [];
    const closedStaffNames: string[] = [];

    for (let h = 0; h < 24; h++) {
      const isHourActuallyOpen = sd.isOpen && (Array.isArray(sd.hoursOpen) && sd.hoursOpen.length === 24
        ? !!sd.hoursOpen[h]
        : (sd.startHour !== undefined && sd.endHour !== undefined && sd.startHour !== -1 && h >= sd.startHour && h < sd.endHour));

      const activeShifts = (sd.shifts || []).filter((s: any) => h >= s.startHour && h < s.endHour);
      const activeCashiers = activeShifts.filter((s: any) => {
        const empObj = employees.find(e => e.id === s.employeeId || e.name === s.employeeName);
        const skill = (s.skillName || empObj?.primarySkillName || '').toLowerCase();
        const role = (s.role || '').toLowerCase();
        const station = ((s as any).stationName || '').toLowerCase();
        if (role === 'cleaner' || skill.includes('clean') || station.includes('clean')) return false;
        if (role === 'security' || skill.includes('security') || skill.includes('guard') || station.includes('security')) return false;
        if (role === 'logistics' || skill.includes('logistic') || skill.includes('driver') || station.includes('logistic')) return false;
        return true;
      });

      if (isHourActuallyOpen) {
        if (activeCashiers.length === 0) {
          missingHours.push(h);
        }
      } else {
        // Store is CLOSED during this hour
        if (activeCashiers.length > 0) {
          closedWithStaffHours.push(h);
          activeCashiers.forEach((c: any) => {
            if (!closedStaffNames.includes(c.employeeName)) closedStaffNames.push(c.employeeName);
          });
        }
      }
    }

    if (missingHours.length > 0) {
      unstaffedOpenList.push({ day: sd.day, hours: missingHours });
    }

    if (closedWithStaffHours.length > 0) {
      staffedClosedList.push({ day: sd.day, hours: closedWithStaffHours, staffNames: closedStaffNames });
    }

    if (sd.isOpen) {
      const missingPeak = missingHours.filter(h => peakHours.includes(h));
      if (missingPeak.length > 0) {
        unstaffedPeakList.push({ day: sd.day, hours: missingPeak });
      }
    } else {
      // Only consider it a missed peak day if that day actually has profitable traffic (day multiplier >= 0.40)
      const dayMultipliersMap: Record<string, number> = activeStoreDef?.operating_schedule?.day_multipliers || {};
      const dayMult = dayMultipliersMap[sd.day] ?? 0.85;
      if (dayMult >= 0.40) {
        closedPeakDays.push(sd.day);
      }
    }
  });

  const recommendedWindow = activeStoreDef?.operating_schedule?.recommended_opening_window;
  let suboptimalDays: { day: string; missingProfitableHours: number[] }[] = [];
  const hourlyCurve: number[] = activeStoreDef?.operating_schedule?.hourly_multipliers || Array(24).fill(0.5);
  const dayMultipliersMap: Record<string, number> = activeStoreDef?.operating_schedule?.day_multipliers || {};

  scheduleDays.forEach(sd => {
    if (sd.isOpen) {
      const dayMult = dayMultipliersMap[sd.day] ?? 0.85;
      // Find all hours that are profitable/worth operating (effectiveMultiplier >= 0.20)
      const profitableHours: number[] = [];
      for (let h = 0; h < 24; h++) {
        if ((hourlyCurve[h] || 0) * dayMult >= PROFITABLE_HOUR_MULTIPLIER) {
          profitableHours.push(h);
        }
      }

      // Check if any profitable hour is currently closed
      const missingProfitable = profitableHours.filter(h => {
        const isOpen = Array.isArray(sd.hoursOpen) && sd.hoursOpen.length === 24
          ? !!sd.hoursOpen[h]
          : (sd.startHour !== undefined && sd.endHour !== undefined && sd.startHour !== -1 && h >= sd.startHour && h < sd.endHour);
        return !isOpen;
      });

      if (missingProfitable.length > 0) {
        suboptimalDays.push({ day: sd.day, missingProfitableHours: missingProfitable });
      }
    }
  });

  const isNotOptimalSchedule = suboptimalDays.length > 0;

  if (unstaffedOpenList.length === 0 && staffedClosedList.length === 0 && closedPeakDays.length === 0 && !isNotOptimalSchedule) return null;

  return (
    <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3 text-xs shadow-xs">
      <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <h3 className="font-bold text-[var(--text-main)]">{t('liveHq.scheduleStaffingAdvisory', 'Operating Schedule & Staffing Advisory')}</h3>
        </div>
        {recommendedWindow && (
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            {t('liveHq.compendiumBenchmark', 'Compendium Benchmark: {window}').replace('{window}', recommendedWindow)}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        {unstaffedOpenList.length > 0 && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1 text-left">
            <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{t('liveHq.unstaffedOpenHours', 'Unstaffed Open Hours ({count} {days})').replace('{count}', unstaffedOpenList.length.toString()).replace('{days}', unstaffedOpenList.length === 1 ? t('liveHq.dayWord', 'Day') : t('liveHq.dayWord', 'Day') + 's')}</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              {t('liveHq.unstaffedOpenDescPrefix', 'Store is open with')} <strong>{t('liveHq.unstaffedOpenDescStrong', '0 cashiers assigned')}</strong> {t('liveHq.unstaffedOpenDescSuffix', 'on {list}. Customers walk out with zero sales.').replace('{list}', unstaffedOpenList.map(u => `${u.day.slice(0,3)} (${u.hours.map(h => `${h}h`).join(', ')})`).join(', '))}
            </p>
          </div>
        )}

        {staffedClosedList.length > 0 && (
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-1 text-left">
            <div className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{t('liveHq.staffScheduledClosed', 'Staff Scheduled While Closed ({count} {days})').replace('{count}', staffedClosedList.length.toString()).replace('{days}', staffedClosedList.length === 1 ? t('liveHq.dayWord', 'Day') : t('liveHq.dayWord', 'Day') + 's')}</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              {t('liveHq.staffClosedDesc', 'Cashiers assigned while store is closed on {list}. Paying wages with zero customer foot traffic.').replace('{list}', staffedClosedList.map(s => `${s.day.slice(0,3)} (${s.hours.map(h => `${h}h`).join(', ')})`).join(', '))}
            </p>
          </div>
        )}

        {closedPeakDays.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1 text-left">
            <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>{t('liveHq.closedPeakDays', 'Closed During Peak Days ({count} Days)').replace('{count}', closedPeakDays.length.toString())}</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              {t('liveHq.closedPeakDesc', 'Store is closed on {list}. Opening during rush windows ({start}:00 - {end}:00) unlocks significant revenue.').replace('{list}', closedPeakDays.map(d => d.slice(0,3)).join(', ')).replace('{start}', peakHours[0].toString()).replace('{end}', (peakHours[peakHours.length-1]+1).toString())}
            </p>
          </div>
        )}

        {isNotOptimalSchedule && recommendedWindow && (
          <Link
            href={activeStoreDef?.id ? `/businesses?business=${activeStoreDef.id}` : '/businesses'}
            className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/20 hover:border-sky-500/40 space-y-1 text-left block group transition-all cursor-pointer"
          >
            <div className="font-bold text-sky-600 dark:text-sky-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>{t('liveHq.suboptimalOpeningWindow', 'Suboptimal Opening Window')}</span>
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              {t('liveHq.suboptimalWindowDesc', 'Store is closed during profitable rush hours on {list}. Click to view business blueprint →').replace('{list}', suboptimalDays.map(d => `${d.day.slice(0,3)} (${d.missingProfitableHours.map(h => `${h}h`).join(', ')})`).join(', '))}
            </p>
          </Link>
        )}
      </div>
    </div>
  );
}
