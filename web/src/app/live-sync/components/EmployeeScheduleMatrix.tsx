'use client';

import { Brush, Users, ShieldCheck, Truck, CalendarDays } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { DAYS_ORDER, isHourOpenForSchedule } from '@/lib/schedule';
import type { LiveEmployeeData, LiveScheduleDay, LiveWorkShift } from '@/context/LiveSyncContext';

type ShiftKind = 'cleaner' | 'security' | 'logistics' | 'counter';

function shiftKind(shift: LiveWorkShift): ShiftKind {
  if (shift.shiftType === 0) return 'cleaner';
  const role = `${shift.role || ''} ${shift.skillName || ''}`.toLowerCase();
  if (role.includes('clean')) return 'cleaner';
  if (role.includes('secur') || role.includes('guard')) return 'security';
  if (role.includes('logist') || role.includes('stock') || role.includes('driver') || role.includes('deliver')) return 'logistics';
  return 'counter';
}

function ShiftIcon({ kind, className }: { kind: ShiftKind; className?: string }) {
  if (kind === 'cleaner') return <Brush className={className} />;
  if (kind === 'security') return <ShieldCheck className={className} />;
  if (kind === 'logistics') return <Truck className={className} />;
  return <Users className={className} />;
}

interface EmployeeScheduleMatrixProps {
  employee: LiveEmployeeData;
  scheduleWeek?: LiveScheduleDay[];
}

// Same 7x24 grid used for the store schedule, scoped to one employee: a cell is lit
// for every hour the employee has a shift (amber for cleaning duty, emerald otherwise).
export default function EmployeeScheduleMatrix({ employee, scheduleWeek }: EmployeeScheduleMatrixProps) {
  const { t } = useTranslation();

  const shiftsByDay: Record<string, LiveWorkShift[]> = {};
  let weeklyHours = 0;
  for (const day of scheduleWeek || []) {
    const shifts = (day.shifts || []).filter(
      s => s.employeeId === employee.id || (!!s.employeeName && s.employeeName === employee.name)
    );
    shiftsByDay[day.day.toLowerCase()] = shifts;
    for (const s of shifts) weeklyHours += Math.max(0, s.endHour - s.startHour);
  }

  const isEmpty = !scheduleWeek || Object.values(shiftsByDay).every(list => list.length === 0);

  return (
    <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] p-4 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h4 className="text-xs font-bold text-[var(--text-main)] flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-emerald-500" />
          <span>{t('liveHq.empWeeklySchedule', 'Weekly Schedule Matrix')}</span>
        </h4>
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-[var(--text-subtle)]">
          <span>{t('liveHq.empScheduledHours', 'Scheduled')}: <strong className="text-[var(--text-main)]">{weeklyHours}h</strong></span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80" /> {t('liveHq.empWorking', 'Working')}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500/80" /> {t('liveHq.empCleaning', 'Cleaning')}</span>
        </div>
      </div>

      {isEmpty ? (
        <div className="py-6 text-center text-xs text-[var(--text-muted)]">{t('liveHq.empNoSchedule', 'No schedule data for this employee.')}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] table-fixed border-collapse">
            <thead>
              <tr className="text-[10px] font-mono text-[var(--text-subtle)]">
                <th className="w-24 text-left pb-1.5 font-bold">{t('liveHq.dayHourHeader', 'Day / Hour')}</th>
                {Array.from({ length: 24 }).map((_, h) => (
                  <th key={h} className="p-0.5 text-center font-bold">{String(h).padStart(2, '0')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS_ORDER.map(day => {
                const daySched = (scheduleWeek || []).find(d => d.day.toLowerCase() === day.toLowerCase());
                const shifts = shiftsByDay[day.toLowerCase()] || [];
                const isOpen = daySched?.isOpen ?? shifts.length > 0;
                const dayHours = shifts.reduce((sum, s) => sum + Math.max(0, s.endHour - s.startHour), 0);

                return (
                  <tr key={day} className="border-b border-[var(--border-subtle)]/40 last:border-0">
                    <td className="py-1 pr-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[var(--text-main)]">{day.slice(0, 3)}</span>
                        <span className={`text-[9px] font-mono font-bold px-1 py-0.5 rounded ${
                          shifts.length > 0
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : isOpen
                              ? 'bg-slate-500/10 text-[var(--text-subtle)]'
                              : 'bg-slate-500/5 text-[var(--text-subtle)] opacity-70'
                        }`}>
                          {shifts.length > 0 ? `${dayHours}h` : isOpen ? t('liveHq.empOff', 'Off') : t('liveHq.closedStore', 'Closed')}
                        </span>
                      </div>
                    </td>

                    {Array.from({ length: 24 }).map((_, hour) => {
                      const covering = shifts.filter(s => hour >= s.startHour && hour < s.endHour);
                      const working = covering.length > 0;
                      const kind = working ? shiftKind(covering[0]) : null;
                      const isHourOpen = isHourOpenForSchedule(daySched, hour);

                      const cellClass = working
                        ? (kind === 'cleaner' ? 'bg-amber-500/80 text-white' : 'bg-emerald-500/80 text-white')
                        : isHourOpen
                          ? 'bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-subtle)]'
                          : 'bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-subtle)] opacity-40';

                      return (
                        <td key={hour} className="p-0.5">
                          <div
                            className={`w-full h-7 rounded-md flex items-center justify-center ${cellClass}`}
                            title={working ? t('liveHq.empWorking', 'Working') : ''}
                          >
                            {working && kind && <ShiftIcon kind={kind} className="w-3 h-3" />}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
