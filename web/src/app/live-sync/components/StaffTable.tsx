'use client';

import { ArrowUp, ArrowDown, ArrowUpDown, ShieldCheck } from 'lucide-react';
import { LiveBusinessData, LiveEmployeeData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';

export type StaffSortBy = 'name' | 'wage' | 'satisfaction' | 'hours' | 'skill';

interface StaffTableProps {
  staff: LiveEmployeeData[];
  staffSortBy: StaffSortBy;
  staffSortOrder: 'asc' | 'desc';
  onSort: (field: StaffSortBy) => void;
  businesses: LiveBusinessData[];
  highlightStaff: string | null;
  highlightBizId: string | null;
}

export default function StaffTable({
  staff,
  staffSortBy,
  staffSortOrder,
  onSort,
  businesses,
  highlightStaff,
  highlightBizId
}: StaffTableProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm overflow-hidden">
      <div className="max-h-[60vh] overflow-auto">
        <table className="w-full text-xs text-left border-collapse">
        <thead className="sticky top-0 z-10 bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase select-none">
          <tr>
            <th
              onClick={() => onSort('name')}
              className="py-3 px-4 cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
            >
              <div className="flex items-center gap-1.5">
                <span>{t('liveHq.employee')}</span>
                {staffSortBy === 'name' ? (
                  staffSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                ) : (
                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                )}
              </div>
            </th>

            <th
              onClick={() => onSort('name')}
              className="py-3 px-4 cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
            >
              <div className="flex items-center gap-1.5">
                <span>{t('liveHq.assignedLocation')}</span>
                <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
              </div>
            </th>

            <th
              onClick={() => onSort('skill')}
              className="py-3 px-4 cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
            >
              <div className="flex items-center gap-1.5">
                <span>{t('liveHq.skillRole')}</span>
                {staffSortBy === 'skill' ? (
                  staffSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                ) : (
                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                )}
              </div>
            </th>

            <th className="py-3 px-4 text-center">
              <span>{t('liveHq.contract')}</span>
            </th>

            <th
              onClick={() => onSort('hours')}
              className="py-3 px-4 text-center cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
            >
              <div className="flex items-center justify-center gap-1.5">
                <span>{t('liveHq.workload')}</span>
                {staffSortBy === 'hours' ? (
                  staffSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                ) : (
                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                )}
              </div>
            </th>

            <th
              onClick={() => onSort('wage')}
              className="py-3 px-4 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>{t('liveHq.wagePerHour')}</span>
                {staffSortBy === 'wage' ? (
                  staffSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                ) : (
                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                )}
              </div>
            </th>

            <th
              onClick={() => onSort('wage')}
              className="py-3 px-4 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>{t('liveHq.weeklyCost')}</span>
                <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
              </div>
            </th>

            <th
              onClick={() => onSort('satisfaction')}
              className="py-3 px-4 text-center cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
            >
              <div className="flex items-center justify-center gap-1.5">
                <span>{t('liveHq.morale')}</span>
                {staffSortBy === 'satisfaction' ? (
                  staffSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                ) : (
                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                )}
              </div>
            </th>

            <th className="py-3 px-4">{t('liveHq.hrBenefits')}</th>

            <th className="py-3 px-4">{t('liveHq.contractDemands')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
          {staff.length > 0 ? (
            staff.map(emp => {
              const isBurnout = emp.weeklyHours > 50;
              const isComplaining = emp.isComplaining || false;
              const isLowMorale = emp.satisfaction < 70;
              const isFullTime = (emp.weeklyHours || 0) >= 40;

              const matchedBiz = businesses.find(b =>
                b.name.toLowerCase() === (emp.workingLocation || '').toLowerCase()
              );
              const empBizId = matchedBiz?.id || '';
              const isStaffHighlighted = highlightStaff && (
                emp.name.toLowerCase().includes(highlightStaff.toLowerCase()) ||
                emp.id.toLowerCase() === highlightStaff.toLowerCase()
              );
              const isHighlighted = (highlightBizId && empBizId === highlightBizId) || isStaffHighlighted;

              return (
                <tr
                  key={emp.id}
                  data-biz-id={empBizId}
                  data-emp-id={emp.id}
                  data-emp-name={emp.name}
                  className={`hover:bg-[var(--bg-surface-hover)] transition-colors ${isHighlighted ? 'staff-glow-highlight' : ''}`}
                >
                  <td className="py-2.5 px-4 font-sans font-semibold text-[var(--text-main)]">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        emp.satisfaction >= 80 ? 'bg-emerald-500' : emp.satisfaction >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      <span className="truncate max-w-36">{emp.name}</span>
                      {isComplaining && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-500/10 text-rose-500 font-bold border border-rose-500/20">
                          {t('liveHq.complaint')}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-2.5 px-4 font-sans text-[var(--text-muted)]">
                    <span className="truncate block max-w-44 font-medium">{emp.workingLocation || t('liveHq.unassigned')}</span>
                  </td>

                  <td className="py-2.5 px-4 font-sans">
                    <div className="flex items-center gap-1.5">
                      <span className="capitalize font-semibold text-[var(--text-main)]">{emp.primarySkillName || 'General'}</span>
                      <span className="text-[10px] font-mono text-[var(--text-subtle)] font-bold px-1.5 py-0.2 rounded bg-[var(--bg-surface)] border border-[var(--border-base)]">
                        {emp.skillLevel || 50}%
                      </span>
                    </div>
                  </td>

                  <td className="py-2.5 px-4 text-center font-sans">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isFullTime
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}>
                      {isFullTime ? t('liveHq.fullTime') : t('liveHq.partTime')}
                    </span>
                  </td>

                  <td className="py-2.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isBurnout
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                        : emp.weeklyHours === 50
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                        : emp.weeklyHours >= 40
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-500/10 text-[var(--text-subtle)]'
                    }`}>
                      {emp.weeklyHours}h/wk
                    </span>
                  </td>

                  <td className="py-2.5 px-4 text-right font-bold text-[var(--text-main)]">
                    ${emp.wage.toFixed(2)}
                  </td>

                  <td className="py-2.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    ${(emp.weeklyWages || emp.wage * emp.weeklyHours).toLocaleString()}
                  </td>

                  <td className="py-2.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      emp.satisfaction >= 80
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : emp.satisfaction >= 65
                        ? 'bg-amber-500/10 text-amber-600'
                        : 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                    }`}>
                      {emp.satisfaction}%
                    </span>
                  </td>

                  <td className="py-2.5 px-4 font-sans text-xs">
                    <div className="space-y-0.5">
                      {emp.healthInsurance && emp.healthInsurance !== 'None' ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-main)] font-medium">
                          <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span>{emp.healthInsurance}</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-[var(--text-subtle)]">
                          {t('liveHq.noInsurance')}
                        </div>
                      )}
                      <div className="text-[10px] text-[var(--text-subtle)]">
                        {t('liveHq.hrLabel')} {emp.hrManager || t('liveHq.unassigned')}
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-4 font-sans">
                    {emp.demands && emp.demands.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {emp.demands.map((d, dIdx) => (
                          <span key={dIdx} className="px-1.5 py-0.2 rounded bg-[var(--bg-surface)] border border-[var(--border-base)] text-[9px] text-[var(--text-muted)] capitalize">
                            {d.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-[var(--text-subtle)]">{t('liveHq.noneSatisfied')}</span>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={10} className="py-8 text-center text-xs text-[var(--text-muted)] font-sans">
                {t('liveHq.noEmployeesMatch')}
              </td>
            </tr>
          )}
        </tbody>
        </table>
      </div>
    </div>
  );
}
