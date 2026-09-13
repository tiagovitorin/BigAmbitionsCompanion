'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowDown, ArrowUpDown, Building, Warehouse, ShieldCheck, UserCog, ChevronDown } from 'lucide-react';
import { LiveBusinessData, LiveEmployeeData, LiveWarehouseData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import { weeklyCost } from '@/lib/workforce';
import EmployeeDetail from './EmployeeDetail';
import DemandIcons from './DemandIcons';

export type StaffSortBy = 'name' | 'business' | 'wage' | 'weeklyCost' | 'satisfaction' | 'hours' | 'skill';

interface StaffTableProps {
  staff: LiveEmployeeData[];
  staffSortBy: StaffSortBy;
  staffSortOrder: 'asc' | 'desc';
  onSort: (field: StaffSortBy) => void;
  businesses: LiveBusinessData[];
  warehouses?: LiveWarehouseData[];
  headquarters?: LiveBusinessData[];
  highlightStaff: string | null;
  highlightBizId: string | null;
  // Scroll to and glow the row of the named employee (used by the HR manager link).
  onLocateStaff?: (name: string) => void;
}

export default function StaffTable({
  staff,
  staffSortBy,
  staffSortOrder,
  onSort,
  businesses,
  warehouses,
  headquarters,
  highlightStaff,
  highlightBizId,
  onLocateStaff
}: StaffTableProps) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  return (
    <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse table-fixed">
        <colgroup>
          <col style={{ width: '14%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '10%' }} />
          <col style={{ width: '6%' }} />
          <col style={{ width: '6%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '6%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '8%' }} />
          <col style={{ width: '12%' }} />
        </colgroup>
        <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase select-none">
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
              onClick={() => onSort('business')}
              className="py-3 px-4 cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
            >
              <div className="flex items-center gap-1.5">
                <span>{t('liveHq.businessColumn', 'Business')}</span>
                {staffSortBy === 'business' ? (
                  staffSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                ) : (
                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                )}
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
              onClick={() => onSort('weeklyCost')}
              className="py-3 px-4 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
            >
              <div className="flex items-center justify-end gap-1.5">
                <span>{t('liveHq.weeklyCost')}</span>
                {staffSortBy === 'weeklyCost' ? (
                  staffSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                ) : (
                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                )}
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

            <th className="py-3 px-4">{t('liveHq.hrManagerColumn', 'HR Manager')}</th>

            <th className="py-3 px-4">{t('liveHq.benefitsColumn', 'Benefits')}</th>

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

              // The mod reports the employee's assigned address; the demo mock reports the
              // business name. Match either so the row links to the real business.
              const locationKey = (emp.workingLocation || '').trim().toLowerCase();
              const matchedBiz = businesses.find(b =>
                (b.address && b.address.trim().toLowerCase() === locationKey) ||
                b.name.toLowerCase() === locationKey
              );
              const empBizId = matchedBiz?.id || '';
              // Warehouses and headquarters are not storefront businesses, so they are
              // matched separately and shown as plain text with no link.
              const matchedWarehouse = !matchedBiz ? (warehouses || []).find(w =>
                (w.address && w.address.trim().toLowerCase() === locationKey) ||
                (w.name && w.name.toLowerCase() === locationKey)
              ) : undefined;
              const matchedHq = !matchedBiz && !matchedWarehouse ? (headquarters || []).find(h =>
                (h.address && h.address.trim().toLowerCase() === locationKey) ||
                h.name.toLowerCase() === locationKey
              ) : undefined;
              // The mod falls back to the street address when a building has no name,
              // so only use the name when it is a real name.
              const siteName = (name?: string, address?: string, fallback?: string) =>
                name && name.trim().toLowerCase() !== (address || '').trim().toLowerCase() ? name : (fallback || '');
              const warehouseLabel = matchedWarehouse
                ? siteName(matchedWarehouse.name, matchedWarehouse.address, t('liveHq.warehouseWord', 'Warehouse'))
                : '';
              const hqLabel = matchedHq
                ? siteName(matchedHq.name, matchedHq.address, t('liveHq.headquartersWord', 'Headquarters'))
                : '';
              const isStaffHighlighted = highlightStaff && (
                emp.name.toLowerCase().includes(highlightStaff.toLowerCase()) ||
                emp.id.toLowerCase() === highlightStaff.toLowerCase()
              );
              const isHighlighted = (highlightBizId && empBizId === highlightBizId) || isStaffHighlighted;

              const isExpanded = expandedId === emp.id;
              return (
                <Fragment key={emp.id}>
                <tr
                  data-biz-id={empBizId}
                  data-emp-id={emp.id}
                  data-emp-name={emp.name}
                  onClick={() => setExpandedId(prev => prev === emp.id ? null : emp.id)}
                  className={`hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer ${isHighlighted ? 'staff-glow-highlight' : ''}`}
                >
                  <td className="py-2.5 px-4 font-sans font-semibold text-[var(--text-main)]">
                    <div className="flex items-center gap-2">
                      <ChevronDown className={`w-3 h-3 shrink-0 text-[var(--text-subtle)] transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
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
                    {matchedBiz ? (
                      <Link
                        href={`/live-sync?view=stores&store=${matchedBiz.id}`}
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 max-w-44 font-medium text-[var(--text-main)] hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        title={matchedBiz.name}
                      >
                        <Building className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span className="truncate">{matchedBiz.name}</span>
                      </Link>
                    ) : matchedWarehouse ? (
                      <span
                        className="inline-flex items-center gap-1.5 max-w-44 font-medium text-[var(--text-main)]"
                        title={warehouseLabel}
                      >
                        <Warehouse className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="truncate">{warehouseLabel}</span>
                      </span>
                    ) : matchedHq ? (
                      <span
                        className="inline-flex items-center gap-1.5 max-w-44 font-medium text-[var(--text-main)]"
                        title={hqLabel}
                      >
                        <Building className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{hqLabel}</span>
                      </span>
                    ) : (
                      <span className="truncate block max-w-44 font-medium">{emp.workingLocation || t('liveHq.unassigned')}</span>
                    )}
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
                    ${weeklyCost(emp).toLocaleString()}
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
                    {emp.hrManager ? (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onLocateStaff?.(emp.hrManager as string); }}
                        disabled={!onLocateStaff}
                        title={t('liveHq.locateHrManager', 'Show in list')}
                        className="inline-flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer disabled:no-underline disabled:cursor-default"
                      >
                        <UserCog className="w-3 h-3 shrink-0" />
                        <span className="truncate max-w-32">{emp.hrManager}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-[var(--text-subtle)]">{t('liveHq.unassigned')}</span>
                    )}
                  </td>

                  <td className="py-2.5 px-4 font-sans text-xs">
                    {emp.healthInsurance && emp.healthInsurance !== 'None' ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-main)] font-medium">
                        <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                        <span>{emp.healthInsurance}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-[var(--text-subtle)]">{t('liveHq.noInsurance')}</span>
                    )}
                  </td>

                  <td className="py-2.5 px-4 font-sans">
                    <DemandIcons demands={emp.demands} />
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={11} className="p-0">
                      <EmployeeDetail
                        employee={emp}
                        businesses={businesses}
                        warehouses={warehouses}
                        headquarters={headquarters}
                      />
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })
          ) : (
            <tr>
              <td colSpan={11} className="py-8 text-center text-xs text-[var(--text-muted)] font-sans">
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
