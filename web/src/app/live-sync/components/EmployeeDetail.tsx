'use client';

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  Building,
  Warehouse,
  ShieldCheck,
  UserCog,
  Cake,
  VenusAndMars,
  CalendarClock,
  Clock,
  DollarSign,
  Heart,
  GraduationCap,
  Briefcase,
  TriangleAlert,
  ClipboardList
} from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import type { LiveBusinessData, LiveEmployeeData, LiveWarehouseData } from '@/context/LiveSyncContext';
import { weeklyCost } from '@/lib/workforce';
import EmployeeScheduleMatrix from './EmployeeScheduleMatrix';
import DemandIcons from './DemandIcons';

interface EmployeeDetailProps {
  employee: LiveEmployeeData;
  businesses: LiveBusinessData[];
  warehouses?: LiveWarehouseData[];
  headquarters?: LiveBusinessData[];
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <span className="mt-0.5 shrink-0 text-[var(--text-subtle)]">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{label}</div>
        <div className="text-xs font-semibold text-[var(--text-main)] truncate">{value}</div>
      </div>
    </div>
  );
}

// Full employee dossier shown when a People-table row is expanded: identity + facts on
// the left, and the 7x24 weekly working-hours matrix (the same grid the store schedule
// uses) on the right.
export default function EmployeeDetail({ employee, businesses, warehouses, headquarters }: EmployeeDetailProps) {
  const { t } = useTranslation();

  const locationKey = (employee.workingLocation || '').trim().toLowerCase();
  const matchedBiz = businesses.find(b =>
    (b.address && b.address.trim().toLowerCase() === locationKey) || b.name.toLowerCase() === locationKey
  );
  const matchedWarehouse = !matchedBiz ? (warehouses || []).find(w =>
    (w.address && w.address.trim().toLowerCase() === locationKey) || (w.name && w.name.toLowerCase() === locationKey)
  ) : undefined;
  const matchedHq = !matchedBiz && !matchedWarehouse ? (headquarters || []).find(h =>
    (h.address && h.address.trim().toLowerCase() === locationKey) || h.name.toLowerCase() === locationKey
  ) : undefined;

  // The employee's shifts live on whichever site's scheduleWeek references them.
  const scheduleWeek = useMemo(() => {
    const sources = [...businesses, ...(headquarters || [])];
    for (const site of sources) {
      if (!site.scheduleWeek) continue;
      const has = site.scheduleWeek.some(day =>
        (day.shifts || []).some(s => s.employeeId === employee.id || s.employeeName === employee.name)
      );
      if (has) return site.scheduleWeek;
    }
    return matchedBiz?.scheduleWeek;
  }, [businesses, headquarters, employee, matchedBiz]);

  const initials = employee.name.split(' ').map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const isFullTime = (employee.weeklyHours || 0) >= 40;
  const satisfaction = employee.satisfaction ?? 0;
  const satisfactionClass = satisfaction >= 80 ? 'text-emerald-500' : satisfaction >= 65 ? 'text-amber-500' : 'text-rose-500';
  const skillLevel = employee.skillLevel || 50;

  const flags: { label: string; className: string }[] = [];
  if (employee.isComplaining) flags.push({ label: t('liveHq.complaint', 'Complaint'), className: 'bg-rose-500/10 text-rose-500 border-rose-500/20' });
  if (employee.isAbsent) flags.push({ label: t('liveHq.empAbsent', 'Absent'), className: 'bg-slate-500/10 text-[var(--text-subtle)] border-[var(--border-base)]' });
  if (employee.isTraining) flags.push({ label: t('liveHq.empTraining', 'Training'), className: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' });
  if (employee.isBeingReplaced) flags.push({ label: t('liveHq.empReplacing', 'Being Replaced'), className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' });
  if (employee.poached) flags.push({ label: t('liveHq.empPoached', 'Poached'), className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' });

  const siteNode = matchedBiz ? (
    <Link
      href={`/live-sync?view=stores&store=${matchedBiz.id}`}
      onClick={e => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 font-medium text-[var(--text-main)] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
    >
      <Building className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
      <span className="truncate">{matchedBiz.name}</span>
    </Link>
  ) : matchedWarehouse ? (
    <span className="inline-flex items-center gap-1.5 font-medium text-[var(--text-main)]">
      <Warehouse className="w-3.5 h-3.5 text-amber-500 shrink-0" />
      <span className="truncate">{matchedWarehouse.name || t('liveHq.warehouseWord', 'Warehouse')}</span>
    </span>
  ) : matchedHq ? (
    <span className="inline-flex items-center gap-1.5 font-medium text-[var(--text-main)]">
      <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span className="truncate">{matchedHq.name || t('liveHq.headquartersWord', 'Headquarters')}</span>
    </span>
  ) : (
    <span className="font-medium text-[var(--text-subtle)]">{employee.workingLocation || t('liveHq.unassigned', 'Unassigned')}</span>
  );

  return (
    <div onClick={e => e.stopPropagation()} className="bg-[var(--bg-base)] border-t border-[var(--border-base)] p-4 space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left: identity + facts */}
        <div className="space-y-3">
          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] p-4 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm shrink-0">
              {initials || <UserCog className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-[var(--text-main)] truncate">{employee.name}</div>
              <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                <GraduationCap className="w-3 h-3 text-[var(--text-subtle)] shrink-0" />
                <span className="capitalize truncate">{employee.primarySkillName || 'General'} · {skillLevel}%</span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{siteNode}</div>
            </div>
          </div>

          {flags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {flags.map((f, i) => (
                <span key={i} className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${f.className}`}>{f.label}</span>
              ))}
            </div>
          )}

          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] p-4 grid grid-cols-2 gap-x-3 gap-y-3.5">
            <Fact icon={<Cake className="w-3.5 h-3.5" />} label={t('liveHq.empAge', 'Age')} value={employee.ageYears ? `${employee.ageYears}` : '—'} />
            <Fact icon={<VenusAndMars className="w-3.5 h-3.5" />} label={t('liveHq.empGender', 'Gender')} value={employee.gender || '—'} />
            <Fact icon={<CalendarClock className="w-3.5 h-3.5" />} label={t('liveHq.empDaysHired', 'Days Hired')} value={employee.daysHired != null ? `${employee.daysHired}` : '—'} />
            <Fact
              icon={<Briefcase className="w-3.5 h-3.5" />}
              label={t('liveHq.contract', 'Contract')}
              value={
                <span className={isFullTime ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                  {isFullTime ? t('liveHq.fullTime', 'Full-Time') : t('liveHq.partTime', 'Part-Time')} · {employee.weeklyHours}h
                </span>
              }
            />
            <Fact icon={<Clock className="w-3.5 h-3.5" />} label={t('liveHq.empHoursToday', 'Hours Today')} value={employee.workedHoursToday != null ? `${employee.workedHoursToday}h` : '—'} />
            <Fact icon={<Clock className="w-3.5 h-3.5" />} label={t('liveHq.empHoursThisWeek', 'Hours This Week')} value={employee.workedHoursThisWeek != null ? `${employee.workedHoursThisWeek}h` : '—'} />
            <Fact icon={<DollarSign className="w-3.5 h-3.5" />} label={t('liveHq.wagePerHour', 'Wage ($/hr)')} value={`$${employee.wage.toFixed(2)}`} />
            <Fact icon={<DollarSign className="w-3.5 h-3.5" />} label={t('liveHq.weeklyCost', 'Weekly Cost')} value={<span className="text-emerald-600 dark:text-emerald-400">${weeklyCost(employee).toLocaleString()}</span>} />
            <Fact
              icon={<Heart className="w-3.5 h-3.5" />}
              label={t('liveHq.morale', 'Morale')}
              value={<span className={satisfactionClass}>{satisfaction}%</span>}
            />
            <Fact icon={<CalendarClock className="w-3.5 h-3.5" />} label={t('liveHq.empWorkedDays', 'Days Worked')} value={employee.workedDays != null ? `${employee.workedDays}` : '—'} />
            {employee.bonusAmount ? (
              <Fact icon={<DollarSign className="w-3.5 h-3.5" />} label={t('liveHq.empBonus', 'Bonus')} value={`$${employee.bonusAmount.toLocaleString()}`} />
            ) : null}
            {employee.nextSickDay != null && employee.nextSickDay >= 0 ? (
              <Fact icon={<TriangleAlert className="w-3.5 h-3.5" />} label={t('liveHq.empNextSickDay', 'Next Sick Day')} value={`Day ${employee.nextSickDay}`} />
            ) : null}
          </div>

          {/* Primary skill bar */}
          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] p-4 space-y-2">
            <div className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.empPrimarySkill', 'Primary Skill')}</div>
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text-main)] capitalize">{employee.primarySkillName || 'General'}</span>
              <span className="font-mono text-[var(--text-subtle)]">{skillLevel}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[var(--bg-base)] overflow-hidden">
              <div className="h-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, skillLevel))}%` }} />
            </div>
          </div>

          {/* Wants & demands */}
          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] p-4 space-y-2">
            <div className="text-[10px] uppercase font-bold text-[var(--text-subtle)] flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" />
              <span>{t('liveHq.empWantsDemands', 'Wants & Demands')}</span>
            </div>
            <DemandIcons demands={employee.demands} size="md" />
          </div>

          {/* HR & benefits */}
          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] p-4 grid grid-cols-2 gap-3">
            <Fact
              icon={<UserCog className="w-3.5 h-3.5" />}
              label={t('liveHq.hrManagerColumn', 'HR Manager')}
              value={employee.hrManager || t('liveHq.unassigned', 'Unassigned')}
            />
            <Fact
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
              label={t('liveHq.benefitsColumn', 'Benefits')}
              value={employee.healthInsurance && employee.healthInsurance !== 'None' ? employee.healthInsurance : t('liveHq.noInsurance', 'No Insurance')}
            />
          </div>
        </div>

        {/* Right: the weekly schedule matrix */}
        <div className="xl:col-span-2">
          <EmployeeScheduleMatrix employee={employee} scheduleWeek={scheduleWeek} />
        </div>
      </div>
    </div>
  );
}
