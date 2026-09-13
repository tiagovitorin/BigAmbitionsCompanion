'use client';

import { useState } from 'react';
import { useTranslation } from '@/context/LanguageContext';
import { ProductionSectionProps, money2, pct, workstationLabel } from '@/lib/productionUi';
import { resolveItemImage } from '@/lib/logistics';
import { ItemIcon } from './SupplyChainDetailAtoms';
import FloatingTooltip from './FloatingTooltip';

const EMERALD = '#10b981';
const AMBER = '#f59e0b';
const ROSE = '#f43f5e';

function TipRows({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="space-y-0.5">
      {rows.map((row, index) => (
        <div key={`${row.label}-${index}`} className="flex items-center justify-between gap-4">
          <span className="text-slate-300">{row.label}</span>
          <span className="font-mono text-white">{row.value}</span>
        </div>
      ))}
    </div>
  );
}

type Hover = { key: string; part: 'capacity' | 'hour'; hour?: number } | null;

export default function FactoryLinesSection({ model }: ProductionSectionProps) {
  const { t } = useTranslation();
  const [hover, setHover] = useState<Hover>(null);
  const days = Math.max(1, (model.site.scheduleWeek || []).length);

  const lines = [...model.lines].sort((a, b) => b.dailyOutput - a.dailyOutput);

  return (
    <div className="space-y-2" onMouseLeave={() => setHover(null)}>
      {lines.map(line => {
        const color = line.warnings.includes('incomplete-station') || line.warnings.includes('unknown-recipe')
          ? ROSE
          : line.staffedShare < 0.999 ? AMBER : EMERALD;
        const capacityPerDay = line.outputPerMachineHour * line.machineCount * 24;
        const utilization = capacityPerDay > 0 ? Math.max(0, Math.min(1, line.dailyOutput / capacityPerDay)) : 0;

        const priorities = (model.site.machines || [])
          .filter(machine => machine.selectedRecipeId === line.recipeId && machine.workstationType === line.workstationType)
          .map(machine => machine.priority);
        const priorityRange = priorities.length
          ? (Math.min(...priorities) === Math.max(...priorities) ? String(priorities[0]) : `${Math.min(...priorities)}-${Math.max(...priorities)}`)
          : '-';

        const coverage = new Array<number>(24).fill(0);
        const machineSet = new Set(line.machines);
        (model.site.scheduleWeek || []).forEach(day => {
          const hourHas = new Array<boolean>(24).fill(false);
          (day.shifts || []).forEach(shift => {
            if (shift.shiftType === 0 || !shift.itemInstanceId || !machineSet.has(shift.itemInstanceId)) return;
            const start = Math.max(0, shift.startHour ?? 0);
            const end = Math.min(24, shift.endHour ?? 0);
            for (let hour = start; hour < end; hour++) hourHas[hour] = true;
          });
          hourHas.forEach((present, hour) => { if (present) coverage[hour] += 1; });
        });

        const name = line.outputName || t('liveHq.factoryUnknownRecipe', 'Unrecognised recipe');
        // Dimming is scoped to the hovered line only: hovering an hour dims the other
        // hours and the capacity bar; hovering the capacity bar dims all the hours.
        const capacityDim = hover?.key === line.key && hover.part === 'hour';
        const cellDim = (hour: number) =>
          hover?.key === line.key && (hover.part === 'capacity' || (hover.part === 'hour' && hover.hour !== hour));

        return (
          <div
            key={line.key}
            className="flex items-center gap-3 rounded-2xl border border-[var(--border-base)] bg-[var(--bg-surface)] px-3.5 py-2.5 shadow-xs"
          >
            <span className="w-1 self-stretch rounded-full" style={{ backgroundColor: color }} />

            <FloatingTooltip
              className="inline-flex"
              content={
                <div className="max-w-[210px] space-y-0.5">
                  <div className="font-semibold">{name}</div>
                  <div className="text-[11px] text-slate-300">{workstationLabel(line.workstationType)} · {'x'}{line.machineCount} {t('liveHq.factoryLineMachines', 'Machines')}</div>
                  <div className="text-[11px] text-slate-300">{t('liveHq.factoryUnitCost', 'Unit cost')}: {line.fullyBurdenedUnitCost != null ? money2(line.fullyBurdenedUnitCost) : '-'}</div>
                  <div className="text-[11px] text-slate-300">{t('liveHq.factoryPriority', 'Priority')}: {priorityRange}</div>
                </div>
              }
            >
              <ItemIcon src={line.outputRawId ? resolveItemImage(line.outputRawId) : null} size={30} />
            </FloatingTooltip>

            <div className="w-40 min-w-0 shrink-0">
              <div className="truncate text-xs font-semibold text-[var(--text-main)]">{name}</div>
              <div className="truncate text-[10px] text-[var(--text-subtle)]">{workstationLabel(line.workstationType)} · {'x'}{line.machineCount}</div>
            </div>

            <div className="flex-1 min-w-0">
              <FloatingTooltip
                className="block w-full cursor-pointer"
                onEnter={() => setHover({ key: line.key, part: 'capacity' })}
                onLeave={() => setHover(null)}
                content={
                  <TipRows rows={[
                    { label: t('liveHq.factoryMakesPerDay', 'Makes / day'), value: Math.round(line.dailyOutput).toLocaleString() },
                    { label: t('liveHq.factoryLineCapacity', 'Capacity / day'), value: Math.round(capacityPerDay).toLocaleString() },
                    { label: t('liveHq.factoryLineUtilization', 'Utilization'), value: pct(utilization) }
                  ]} />
                }
              >
                <span className="relative block h-2.5 w-full rounded-full bg-[var(--bg-base)] overflow-hidden transition-opacity duration-150" style={{ opacity: capacityDim ? 0.25 : 1 }}>
                  <span className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500" style={{ width: `${Math.round(utilization * 100)}%`, backgroundColor: color }} />
                </span>
              </FloatingTooltip>

              <div className="mt-1.5 flex gap-[2px]">
                {coverage.map((count, hour) => {
                  const ratio = count / days;
                  return (
                    <FloatingTooltip
                      key={hour}
                      className="flex-1 cursor-pointer"
                      onEnter={() => setHover({ key: line.key, part: 'hour', hour })}
                      onLeave={() => setHover(null)}
                      content={
                        <div className="space-y-0.5">
                          <div className="font-semibold">{String(hour).padStart(2, '0')}:00 - {String(hour + 1).padStart(2, '0')}:00</div>
                          <div className="text-[11px] text-slate-300">
                            {count === 0
                              ? t('liveHq.factoryHourUnstaffed', 'Not staffed')
                              : t('liveHq.factoryHourStaffed', 'Staffed {n} of {days} days').replace('{n}', String(count)).replace('{days}', String(days))}
                          </div>
                        </div>
                      }
                    >
                      <span
                        className="block h-3 w-full rounded-[2px] transition-opacity duration-150"
                        style={{ backgroundColor: ratio === 0 ? 'var(--bg-base)' : `rgba(16,185,129,${0.2 + 0.8 * ratio})`, opacity: cellDim(hour) ? 0.2 : 1 }}
                      />
                    </FloatingTooltip>
                  );
                })}
              </div>
            </div>

            <div className="w-24 shrink-0 text-right leading-tight space-y-0.5">
              <div className="text-[9px] uppercase font-bold tracking-wide text-[var(--text-subtle)]">{t('liveHq.factoryCapacityWord', 'Capacity')}</div>
              <div className="text-[9px] uppercase font-bold tracking-wide text-[var(--text-subtle)]">{t('liveHq.factoryLineUtilization', 'Utilization')}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
