'use client';

import { useMemo } from 'react';
import { useTranslation } from '@/context/LanguageContext';
import { recipeById } from '@/lib/productionModel';
import { ProductionSectionProps, money } from '@/lib/productionUi';

interface RosterRow {
  id: string;
  name: string;
  wage: number;
  skill: number;
  hours: number;
  weeklyCost: number;
  stations: string[];
  lostUnitsPerDay: number;
  lostValuePerDay: number;
}

// Compact roster of the workers scheduled to this site's stations. Lost output is what
// 100% skill would add on the same schedule (ingredients are consumed in full regardless).
export default function FactoryRosterSection({ model, ctx }: Pick<ProductionSectionProps, 'model' | 'ctx'>) {
  const { t } = useTranslation();

  const machineToRecipe = useMemo(() => {
    const map = new Map<string, string>();
    model.lines.forEach(line => line.machines.forEach(id => map.set(id, line.recipeId)));
    return map;
  }, [model]);

  const machineToStation = useMemo(() => {
    const map = new Map<string, string>();
    model.lines.forEach(line => {
      const label = line.outputName || line.recipeName || line.workstationType;
      line.machines.forEach(id => map.set(id, label));
    });
    return map;
  }, [model]);

  const roster = useMemo<RosterRow[]>(() => {
    const employeesById = new Map(ctx.employees.map(employee => [employee.id, employee]));
    const byEmployee = new Map<string, { hours: number; lostUnits: number; lostValue: number; stations: Set<string> }>();

    (model.site.scheduleWeek || []).forEach(day => {
      (day.shifts || []).forEach(shift => {
        if (shift.shiftType === 0 || !shift.employeeId) return;
        const recipe = shift.itemInstanceId ? recipeById(machineToRecipe.get(shift.itemInstanceId) || '') : undefined;
        const hours = Math.max(0, (shift.endHour ?? 0) - (shift.startHour ?? 0));
        const entry = byEmployee.get(shift.employeeId) || { hours: 0, lostUnits: 0, lostValue: 0, stations: new Set<string>() };
        entry.hours += hours;
        const station = shift.itemInstanceId ? machineToStation.get(shift.itemInstanceId) : undefined;
        if (station) entry.stations.add(station);
        if (recipe) {
          const skill = employeesById.get(shift.employeeId)?.skillLevel ?? 100;
          const factor = (Math.max(0, Math.min(100, skill)) / 2 + 50) / 100;
          const lostUnits = hours * recipe.amount * (1 - factor);
          entry.lostUnits += lostUnits;
          entry.lostValue += lostUnits * recipe.marketPrice;
        }
        byEmployee.set(shift.employeeId, entry);
      });
    });

    return [...byEmployee.entries()]
      .map(([id, stats]) => {
        const employee = employeesById.get(id);
        const wage = employee?.wage ?? 0;
        return {
          id,
          name: employee?.name || id,
          wage,
          skill: employee?.skillLevel ?? 100,
          hours: stats.hours,
          weeklyCost: wage * stats.hours,
          stations: [...stats.stations],
          lostUnitsPerDay: stats.lostUnits / 7,
          lostValuePerDay: stats.lostValue / 7
        };
      })
      .sort((a, b) => b.hours - a.hours);
  }, [model, machineToRecipe, machineToStation, ctx.employees]);

  const totals = useMemo(() => roster.reduce(
    (sum, worker) => ({
      hours: sum.hours + worker.hours,
      weeklyCost: sum.weeklyCost + worker.weeklyCost,
      lostUnitsPerDay: sum.lostUnitsPerDay + worker.lostUnitsPerDay,
      lostValuePerDay: sum.lostValuePerDay + worker.lostValuePerDay
    }),
    { hours: 0, weeklyCost: 0, lostUnitsPerDay: 0, lostValuePerDay: 0 }
  ), [roster]);

  if (roster.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--bg-surface)] p-4 text-xs text-[var(--text-subtle)]">
        {t('liveHq.factoryNoRoster', 'No workers are scheduled to these machines.')}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--bg-surface)] overflow-hidden shadow-xs">
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-[var(--border-base)] text-[10px] font-mono text-[var(--text-subtle)]">
        <span>{t('liveHq.factoryRosterCount', '{n} workers').replace('{n}', String(roster.length))} · {Math.round(totals.hours)}h/wk · {money(totals.weeklyCost)}/wk</span>
        <span>{t('liveHq.factoryLostValue', 'Lost value / day')}: <span className="font-bold text-amber-600 dark:text-amber-400">{money(totals.lostValuePerDay)}</span></span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] table-fixed border-collapse text-[11px]">
          <colgroup>
            <col className="w-[20%]" />
            <col className="w-[26%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
            <col className="w-[12%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[9px] uppercase font-bold tracking-wider text-[var(--text-subtle)]">
              <th className="px-3 py-1 text-left">{t('liveHq.factoryWorker', 'Worker')}</th>
              <th className="px-2 py-1 text-left">{t('liveHq.factoryRosterStation', 'Assigned to')}</th>
              <th className="px-2 py-1 text-right">{t('liveHq.factoryWeeklyHours', 'Hours / wk')}</th>
              <th className="px-2 py-1 text-right">{t('liveHq.factorySkill', 'Skill')}</th>
              <th className="px-2 py-1 text-right">{t('liveHq.factoryWeeklyCost', 'Cost / wk')}</th>
              <th className="px-2 py-1 text-right">{t('liveHq.factoryLostUnitsShort', 'Lost u/day')}</th>
              <th className="px-3 py-1 text-right">{t('liveHq.factoryLostValue', 'Lost value / day')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {roster.map(worker => (
              <tr key={worker.id} className="hover:bg-[var(--bg-surface-hover)]">
                <td className="px-3 py-1 min-w-0">
                  <span className="flex items-baseline gap-1.5">
                    <span className="truncate font-semibold text-[var(--text-main)]">{worker.name}</span>
                    <span className="shrink-0 text-[9px] font-mono text-[var(--text-subtle)]">{money(worker.wage)}/h</span>
                  </span>
                </td>
                <td className="px-2 py-1 min-w-0">
                  {worker.stations.length === 0 ? (
                    <span className="text-[var(--text-subtle)]">-</span>
                  ) : (
                    <span className="block truncate text-[var(--text-muted)]">
                      {worker.stations.slice(0, 2).join(', ')}
                      {worker.stations.length > 2 && <span className="text-[var(--text-subtle)]"> +{worker.stations.length - 2}</span>}
                    </span>
                  )}
                </td>
                <td className="px-2 py-1 text-right font-mono text-[var(--text-muted)]">{Math.round(worker.hours)}</td>
                <td className={`px-2 py-1 text-right font-mono font-bold ${worker.skill >= 100 ? 'text-emerald-500' : 'text-amber-500'}`}>{Math.round(worker.skill)}%</td>
                <td className="px-2 py-1 text-right font-mono text-[var(--text-muted)]">{money(worker.weeklyCost)}</td>
                <td className="px-2 py-1 text-right font-mono text-[var(--text-muted)]">{Math.round(worker.lostUnitsPerDay).toLocaleString()}</td>
                <td className="px-3 py-1 text-right font-mono text-amber-600 dark:text-amber-400">{money(worker.lostValuePerDay)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[var(--border-base)] font-semibold text-[var(--text-main)]">
              <td className="px-3 py-1" colSpan={2}>{t('liveHq.factoryTotal', 'Total')}</td>
              <td className="px-2 py-1 text-right font-mono">{Math.round(totals.hours)}</td>
              <td className="px-2 py-1" />
              <td className="px-2 py-1 text-right font-mono">{money(totals.weeklyCost)}</td>
              <td className="px-2 py-1 text-right font-mono">{Math.round(totals.lostUnitsPerDay).toLocaleString()}</td>
              <td className="px-3 py-1 text-right font-mono text-amber-600 dark:text-amber-400">{money(totals.lostValuePerDay)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="px-3 py-1.5 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-subtle)]">
        {t('liveHq.factoryTrainingNote', 'Lost units and value are what 100% skill would add on the same schedule; ingredients are consumed in full regardless of skill.')}
      </div>
    </div>
  );
}
