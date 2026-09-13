'use client';

import { useMemo, useRef, useState, RefObject } from 'react';
import { CalendarDays, Brush, Cog, TriangleAlert } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { DAYS_ORDER } from '@/lib/schedule';
import { ProductionSectionProps, money, workstationLabel } from '@/lib/productionUi';
import { recipeById, LineModel } from '@/lib/productionModel';

interface StaffEntry {
  employeeId: string;
  employeeName: string;
  machineId: string | null;
  wage: number;
  skill: number;
  line: LineModel | null;
  outputPerHour: number;
  valuePerHour: number;
}

interface CellData {
  staff: StaffEntry[];
  cleaners: string[];
  idleMachines: number;
  inSpan: boolean;
  output: number;
  value: number;
  labor: number;
}

// Same 7x24 grid used across Live HQ, scoped to a factory: a cell is lit for every
// hour a station is staffed, and each day/hour carries its own hover breakdown.
export default function FactoryStaffingMatrix({ model, ctx }: Pick<ProductionSectionProps, 'model' | 'ctx'>) {
  const { t } = useTranslation();
  const [hoveredCell, setHoveredCell] = useState<{ dayIndex: number; hour: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const machineToLine = useMemo(() => {
    const map = new Map<string, LineModel>();
    model.lines.forEach(line => line.machines.forEach(id => map.set(id, line)));
    return map;
  }, [model]);

  const employeesById = useMemo(() => new Map(ctx.employees.map(employee => [employee.id, employee])), [ctx.employees]);

  const { grid, maxStaff } = useMemo(() => {
    const cells: CellData[][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => ({
        staff: [],
        cleaners: [],
        idleMachines: 0,
        inSpan: false,
        output: 0,
        value: 0,
        labor: 0
      }))
    );
    let max = 0;

    (model.site.scheduleWeek || []).forEach((day, dayIndex) => {
      if (dayIndex > 6) return;
      const shifts = day.shifts || [];
      if (shifts.length === 0) return;

      const spanStart = Math.min(...shifts.map(shift => Math.max(0, shift.startHour ?? 0)));
      const spanEnd = Math.max(...shifts.map(shift => Math.min(24, shift.endHour ?? 0)));
      for (let hour = spanStart; hour < spanEnd; hour++) cells[dayIndex][hour].inSpan = true;

      shifts.forEach(shift => {
        const start = Math.max(0, shift.startHour ?? 0);
        const end = Math.min(24, shift.endHour ?? 0);
        if (end <= start) return;

        if (shift.shiftType === 0) {
          for (let hour = start; hour < end; hour++) cells[dayIndex][hour].cleaners.push(shift.employeeName);
          return;
        }

        const line = shift.itemInstanceId ? machineToLine.get(shift.itemInstanceId) || null : null;
        const recipe = line ? recipeById(line.recipeId) : undefined;
        const employee = employeesById.get(shift.employeeId);
        const skill = employee?.skillLevel ?? 100;
        const factor = (Math.max(0, Math.min(100, skill)) / 2 + 50) / 100;
        const outputPerHour = recipe ? recipe.amount * factor : 0;
        const entry: StaffEntry = {
          employeeId: shift.employeeId,
          employeeName: shift.employeeName || employee?.name || shift.employeeId,
          machineId: shift.itemInstanceId || null,
          wage: employee?.wage ?? 0,
          skill,
          line,
          outputPerHour,
          valuePerHour: recipe ? outputPerHour * recipe.marketPrice : 0
        };

        for (let hour = start; hour < end; hour++) {
          const cell = cells[dayIndex][hour];
          cell.staff.push(entry);
          cell.output += entry.outputPerHour;
          cell.value += entry.valuePerHour;
          cell.labor += entry.wage;
        }
      });
    });

    // Idle machines are only meaningful inside the day's scheduled span.
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const cell = cells[day][hour];
        if (!cell.inSpan) continue;
        const staffed = new Set(cell.staff.filter(entry => entry.machineId).map(entry => entry.machineId as string));
        cell.idleMachines = Math.max(0, model.machineCount - staffed.size);
        max = Math.max(max, cell.staff.length);
      }
    }

    return { grid: cells, maxStaff: Math.max(1, max) };
  }, [model, machineToLine, employeesById]);

  const activeCell = hoveredCell ? grid[hoveredCell.dayIndex]?.[hoveredCell.hour] : null;
  const isHovered = (dayIndex: number, hour: number) => hoveredCell?.dayIndex === dayIndex && hoveredCell?.hour === hour;
  const isDimmed = (dayIndex: number, hour: number) => hoveredCell != null && !isHovered(dayIndex, hour);

  if (model.machineCount === 0 || (model.site.scheduleWeek || []).every(day => (day.shifts || []).length === 0)) {
    return (
      <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--bg-surface)] p-4 text-xs text-[var(--text-subtle)]">
        {t('liveHq.factoryMatrixEmpty', 'No shifts are scheduled to these machines.')}
      </div>
    );
  }

  const cellTheme = (cell: CellData) => {
    if (cell.staff.length > 0) {
      const intensity = 0.35 + 0.55 * (cell.staff.length / maxStaff);
      return { className: 'text-white', style: { backgroundColor: `rgba(16,185,129,${intensity})` } };
    }
    if (cell.cleaners.length > 0) {
      return { className: 'bg-amber-500/70 text-white', style: undefined };
    }
    if (cell.inSpan) {
      return { className: 'bg-rose-500/10 border border-rose-500/40 text-rose-500', style: undefined };
    }
    return { className: 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-subtle)] opacity-60', style: undefined };
  };

  return (
    <div
      className="rounded-2xl border border-[var(--border-base)] bg-[var(--bg-surface)] p-3.5 space-y-2.5 shadow-xs relative"
      onMouseMove={(event) => {
        if (tooltipRef.current) {
          const x = event.clientX + 300 > window.innerWidth ? Math.max(10, event.clientX - 290) : event.clientX + 14;
          const y = event.clientY + 210 > window.innerHeight ? Math.max(10, event.clientY - 190) : event.clientY + 14;
          tooltipRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-emerald-500" />
            <span>{t('liveHq.factoryShiftMatrixTitle', 'Shift Coverage Matrix')}</span>
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {t('liveHq.factoryShiftMatrixHint', 'Each cell shows staffed production for that day and hour. Hover any hour for the full breakdown.')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-[var(--text-subtle)]">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/80" /> {t('liveHq.factoryMatrixWorking', 'Producing')}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500/80" /> {t('liveHq.factoryMatrixCleaning', 'Cleaning')}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500/30 border border-rose-500/40" /> {t('liveHq.factoryMatrixIdle', 'Machines idle')}</span>
        </div>
      </div>

      <div className="overflow-x-auto p-2.5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] relative">
        <table
          className="w-full min-w-[720px] table-fixed border-collapse"
          onMouseLeave={() => setHoveredCell(null)}
        >
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[9px] font-mono text-[var(--text-subtle)]">
              <th className={`w-20 text-left pb-1.5 font-bold text-[var(--text-muted)] transition-opacity ${hoveredCell ? 'opacity-40' : ''}`}>{t('liveHq.dayHourHeader', 'Day / Hour')}</th>
              {Array.from({ length: 24 }).map((_, hour) => (
                <th key={hour} className={`p-px text-center font-bold transition-opacity ${isDimmed(hoveredCell?.dayIndex ?? -1, hour) ? 'opacity-30' : ''}`}>{String(hour).padStart(2, '0')}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS_ORDER.map((day, dayIndex) => {
              const dayHours = (model.site.scheduleWeek?.[dayIndex]?.shifts || []).reduce(
                (sum, shift) => sum + Math.max(0, (shift.endHour ?? 0) - (shift.startHour ?? 0)),
                0
              );
              const dayDim = hoveredCell != null && hoveredCell.dayIndex !== dayIndex;

              return (
                <tr key={day} className="border-b border-[var(--border-subtle)]/40 last:border-0">
                  <td className={`w-20 py-1 pr-1.5 transition-opacity ${dayDim ? 'opacity-40' : ''}`}>
                    <div className="w-full text-left text-[11px] font-bold text-[var(--text-main)] flex items-center justify-between gap-1">
                      <span>{day.slice(0, 3)}</span>
                      <span className={`text-[9px] font-mono font-bold px-1 py-px rounded ${
                        dayHours > 0 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-500/10 text-slate-500'
                      }`}>
                        {dayHours > 0 ? `${dayHours}h` : t('liveHq.closedStore', 'Closed')}
                      </span>
                    </div>
                  </td>

                  {Array.from({ length: 24 }).map((_, hour) => {
                    const cell = grid[dayIndex][hour];
                    const theme = cellTheme(cell);
                    const hasStaff = cell.staff.length > 0;
                    const cleaningOnly = !hasStaff && cell.cleaners.length > 0;
                    const hovered = isHovered(dayIndex, hour);

                    return (
                      <td
                        key={hour}
                        className="p-px"
                        onMouseEnter={(event) => {
                          setHoveredCell({ dayIndex, hour });
                          const x = event.clientX + 300 > window.innerWidth ? Math.max(10, event.clientX - 290) : event.clientX + 14;
                          const y = event.clientY + 210 > window.innerHeight ? Math.max(10, event.clientY - 190) : event.clientY + 14;
                          if (tooltipRef.current) {
                            tooltipRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                          }
                        }}
                      >
                        <div
                          className={`relative z-0 w-full h-7 rounded-md text-[9px] font-mono flex items-center justify-center cursor-pointer select-none transition-opacity duration-150 ${theme.className} ${hovered ? 'z-10 ring-2 ring-slate-400/70' : ''}`}
                          style={{ ...theme.style, opacity: isDimmed(dayIndex, hour) ? 0.25 : 1 }}
                        >
                          {hasStaff ? (
                            <span className="flex items-center gap-0.5">
                              <Cog className="w-2.5 h-2.5" />
                              <span>{cell.staff.length}</span>
                            </span>
                          ) : cleaningOnly ? (
                            <Brush className="w-2.5 h-2.5" />
                          ) : cell.inSpan ? (
                            <span className="font-extrabold">0</span>
                          ) : (
                            <span className="opacity-60">-</span>
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

        {hoveredCell && activeCell && (
          <StaffingTooltip
            day={DAYS_ORDER[hoveredCell.dayIndex]}
            hour={hoveredCell.hour}
            cell={activeCell}
            totalMachines={model.machineCount}
            tooltipRef={tooltipRef}
          />
        )}
      </div>
    </div>
  );
}

function StaffingTooltip({
  day,
  hour,
  cell,
  totalMachines,
  tooltipRef
}: {
  day: string;
  hour: number;
  cell: CellData;
  totalMachines: number;
  tooltipRef: RefObject<HTMLDivElement | null>;
}) {
  const { t } = useTranslation();
  const hasStaff = cell.staff.length > 0;

  return (
    <div
      ref={tooltipRef}
      className="fixed pointer-events-none z-50 px-3.5 py-2.5 rounded-xl bg-slate-950 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs space-y-1.5 top-0 left-0 will-change-transform"
    >
      <div className="font-bold flex items-center gap-2 text-white">
        <span>{day}</span>
        <span className="font-mono text-emerald-400">{String(hour).padStart(2, '0')}:00 - {String(hour + 1).padStart(2, '0')}:00</span>
      </div>

      <div className="space-y-1 text-[11px]">
        {hasStaff && (
          <>
            <div className="flex items-center justify-between gap-4 text-slate-300">
              <span>{t('liveHq.factoryMatrixStaffOnDuty', 'Staff on duty')}</span>
              <span className="font-mono font-bold text-white">{cell.staff.length}</span>
            </div>
            <div className="space-y-0.5 border-t border-slate-800/80 pt-1">
              {cell.staff.slice(0, 5).map((entry, index) => (
                <div key={`${entry.employeeId}-${index}`} className="flex items-center justify-between gap-3">
                  <span className="truncate text-slate-300 max-w-[170px]">
                    {entry.line?.outputName ? `${entry.employeeName} · ${entry.line.outputName}` : entry.employeeName}
                    {entry.line && (
                      <span className="text-slate-500"> ({workstationLabel(entry.line.workstationType)})</span>
                    )}
                  </span>
                  <span className="shrink-0 font-mono text-slate-400">{Math.round(entry.skill)}% · {Math.round(entry.outputPerHour).toLocaleString()}/h</span>
                </div>
              ))}
              {cell.staff.length > 5 && (
                <div className="text-[10px] text-amber-400 font-semibold">
                  {t('liveHq.moreStaff', '+{count} more').replace('{count}', String(cell.staff.length - 5))}
                </div>
              )}
            </div>

            <div className="border-t border-slate-800/80 pt-1 space-y-1">
              <div className="flex items-center justify-between gap-4 text-slate-300">
                <span>{t('liveHq.factoryMatrixMachinesRunning', 'Machines running')}</span>
                <span className="font-mono font-bold text-white">{new Set(cell.staff.map(entry => entry.machineId).filter(Boolean)).size}/{totalMachines}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-slate-300">
                <span>{t('liveHq.factoryMatrixOutputHour', 'Output this hour')}</span>
                <span className="font-mono font-bold text-emerald-400">{Math.round(cell.output).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-slate-300">
                <span>{t('liveHq.factoryMatrixValueHour', 'Value this hour')}</span>
                <span className="font-mono font-bold text-emerald-400">{money(cell.value)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 text-slate-300">
                <span>{t('liveHq.factoryMatrixLaborHour', 'Labour this hour')}</span>
                <span className="font-mono font-bold text-rose-400">{money(cell.labor)}</span>
              </div>
            </div>

            {cell.idleMachines > 0 && (
              <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-semibold flex items-center gap-1.5">
                <TriangleAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{t('liveHq.factoryMatrixIdleWarn', '{n} of {total} machines idle this hour')
                  .replace('{n}', String(cell.idleMachines))
                  .replace('{total}', String(totalMachines))}</span>
              </div>
            )}
          </>
        )}

        {!hasStaff && cell.cleaners.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4 text-amber-300">
              <span className="flex items-center gap-1.5"><Brush className="w-3.5 h-3.5" /> {t('liveHq.factoryMatrixCleaning', 'Cleaning')}</span>
              <span className="font-mono font-bold">{cell.cleaners.length}</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate max-w-[220px]">{cell.cleaners.slice(0, 3).join(', ')}</div>
            {cell.inSpan && (
              <div className="text-[10px] text-slate-400">{t('liveHq.factoryMatrixCleaningOnly', 'Cleaning shift only - no production staff.')}</div>
            )}
          </div>
        )}

        {!hasStaff && cell.cleaners.length === 0 && cell.inSpan && (
          <div className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 text-[10px] font-bold flex items-center gap-1.5">
            <TriangleAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{t('liveHq.factoryMatrixAllIdle', 'No one scheduled - all {total} machines idle').replace('{total}', String(totalMachines))}</span>
          </div>
        )}

        {!cell.inSpan && (
          <div className="flex items-center gap-1.5 text-slate-400">
            <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
            <span>{t('liveHq.factoryMatrixNoShift', 'No shift scheduled for this hour.')}</span>
          </div>
        )}
      </div>
    </div>
  );
}
