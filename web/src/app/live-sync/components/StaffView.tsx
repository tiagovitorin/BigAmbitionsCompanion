'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Users,
  DollarSign,
  Heart,
  TriangleAlert,
  Building,
  ChevronDown,
  Clock
} from 'lucide-react';
import { LiveBusinessData, LiveEmployeeData, LiveWarehouseData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import { FULL_TIME_WEEKLY_HOURS, BURNOUT_WEEKLY_HOURS } from '@/lib/thresholds';
import { weeklyCost } from '@/lib/workforce';
import StaffTable, { StaffSortBy } from './StaffTable';

interface StaffViewProps {
  employees: LiveEmployeeData[];
  weeklyPayrollTotal: number;
  businesses: LiveBusinessData[];
  warehouses?: LiveWarehouseData[];
  headquarters?: LiveBusinessData[];
  highlightStaff: string | null;
  highlightBizId: string | null;
}

export default function StaffView({ employees, weeklyPayrollTotal, businesses, warehouses, headquarters, highlightStaff, highlightBizId }: StaffViewProps) {
  const { t } = useTranslation();
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffLocationFilter, setStaffLocationFilter] = useState('all');
  const [staffRoleFilter, setStaffRoleFilter] = useState('all');
  const [staffContractFilter, setStaffContractFilter] = useState<'all' | 'ft' | 'pt'>('all');
  const [staffLocationDropdownOpen, setStaffLocationDropdownOpen] = useState(false);
  const [staffRoleDropdownOpen, setStaffRoleDropdownOpen] = useState(false);
  const [staffContractDropdownOpen, setStaffContractDropdownOpen] = useState(false);
  const [staffSortBy, setStaffSortBy] = useState<StaffSortBy>('satisfaction');
  const [staffSortOrder, setStaffSortOrder] = useState<'asc' | 'desc'>('asc');
  const [staffPerPage, setStaffPerPage] = useState(25);
  const [staffPerPageDropdownOpen, setStaffPerPageDropdownOpen] = useState(false);
  const [staffPage, setStaffPage] = useState(1);

  // Scroll to and glow highlighted business/employee rows when navigated from an alert
  useEffect(() => {
    if (!highlightBizId && !highlightStaff) return;

    if (highlightStaff) {
      setStaffSearchQuery(highlightStaff);
    }

    const glowTimeout = setTimeout(() => {
      let rows: NodeListOf<Element> | Element[] = [];
      if (highlightStaff) {
        const staffTarget = highlightStaff.toLowerCase();
        rows = Array.from(document.querySelectorAll('[data-emp-name]')).filter(el => {
          const name = (el.getAttribute('data-emp-name') || '').toLowerCase();
          const id = (el.getAttribute('data-emp-id') || '').toLowerCase();
          return name.includes(staffTarget) || id === staffTarget;
        });
      } else if (highlightBizId) {
        rows = Array.from(document.querySelectorAll(`[data-biz-id="${highlightBizId}"]`));
      }

      if (rows.length > 0) {
        rows[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        rows.forEach(row => {
          row.classList.add('staff-glow-highlight');
          setTimeout(() => row.classList.remove('staff-glow-highlight'), 2400);
        });
      }
    }, 400);
    return () => clearTimeout(glowTimeout);
  }, [highlightBizId, highlightStaff]);

  // Glow the given rows (first one scrolled into view).
  const glowRows = (rows: Element[]) => {
    if (rows.length === 0) return;
    rows[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    rows.forEach(row => {
      row.classList.add('staff-glow-highlight');
      window.setTimeout(() => row.classList.remove('staff-glow-highlight'), 2400);
    });
  };

  // Clicking an employee's HR manager link clears the filters (so the target row
  // is guaranteed to be rendered), then scrolls to and glows that employee.
  const locateTimerRef = useRef<number | null>(null);
  useEffect(() => () => {
    if (locateTimerRef.current) window.clearTimeout(locateTimerRef.current);
  }, []);

  const handleLocateStaff = (name: string) => {
    setStaffSearchQuery('');
    setStaffLocationFilter('all');
    setStaffRoleFilter('all');
    setStaffContractFilter('all');
    if (locateTimerRef.current) window.clearTimeout(locateTimerRef.current);
    locateTimerRef.current = window.setTimeout(() => {
      const target = name.trim().toLowerCase();
      const rows = Array.from(document.querySelectorAll('[data-emp-name]')).filter(el => {
        const rowName = (el.getAttribute('data-emp-name') || '').toLowerCase();
        return rowName === target || rowName.includes(target);
      });
      glowRows(rows);
    }, 250);
  };

  // Single-pass metrics + distinct lists (834 employees; avoids many Array.filter passes).
  const {
    totalStaffCount,
    complainingCount,
    lowMoraleCount,
    burnoutCount,
    avgMorale,
    avgHourlyWage,
    distinctLocations,
    distinctRoles
  } = useMemo(() => {
    let complaining = 0;
    let lowMorale = 0;
    let burnout = 0;
    let moraleSum = 0;
    let wageSum = 0;
    const locations = new Set<string>();
    const roles = new Set<string>();
    for (const e of employees) {
      if (e.isComplaining) complaining++;
      if (e.satisfaction < 70) lowMorale++;
      if (e.weeklyHours > BURNOUT_WEEKLY_HOURS) burnout++;
      moraleSum += e.satisfaction || 0;
      wageSum += e.wage || 0;
      if (e.workingLocation) locations.add(e.workingLocation);
      roles.add(e.primarySkillName || 'General');
    }
    const total = employees.length;
    return {
      totalStaffCount: total,
      complainingCount: complaining,
      lowMoraleCount: lowMorale,
      burnoutCount: burnout,
      avgMorale: total > 0 ? Math.round(moraleSum / total) : null,
      avgHourlyWage: total > 0 ? (wageSum / total).toFixed(2) : '0.00',
      distinctLocations: Array.from(locations).sort(),
      distinctRoles: Array.from(roles).sort()
    };
  }, [employees]);

  const filteredStaff = useMemo(() => {
    const query = staffSearchQuery.toLowerCase();
    return employees.filter(emp => {
      const matchesSearch = !query ||
        emp.name.toLowerCase().includes(query) ||
        (emp.workingLocation || '').toLowerCase().includes(query) ||
        (emp.primarySkillName || '').toLowerCase().includes(query);

      const matchesLoc = staffLocationFilter === 'all' || emp.workingLocation === staffLocationFilter;
      const matchesRole = staffRoleFilter === 'all' || (emp.primarySkillName || 'General').toLowerCase() === staffRoleFilter.toLowerCase();
      const matchesContract = staffContractFilter === 'all' ||
        (staffContractFilter === 'ft' && (emp.weeklyHours || 0) >= FULL_TIME_WEEKLY_HOURS) ||
        (staffContractFilter === 'pt' && (emp.weeklyHours || 0) < FULL_TIME_WEEKLY_HOURS);

      return matchesSearch && matchesLoc && matchesRole && matchesContract;
    });
  }, [employees, staffSearchQuery, staffLocationFilter, staffRoleFilter, staffContractFilter]);

  // Resolve each employee's workplace name once, for the "Business" sort.
  const siteNameById = useMemo(() => {
    const resolve = (emp: LiveEmployeeData) => {
      const key = (emp.workingLocation || '').trim().toLowerCase();
      if (!key) return '';
      const biz = businesses.find(b => (b.address && b.address.trim().toLowerCase() === key) || b.name.toLowerCase() === key);
      if (biz) return biz.name;
      const wh = (warehouses || []).find(w => (w.address && w.address.trim().toLowerCase() === key) || (w.name && w.name.toLowerCase() === key));
      if (wh) return wh.name || wh.address || '';
      const hq = (headquarters || []).find(h => (h.address && h.address.trim().toLowerCase() === key) || h.name.toLowerCase() === key);
      if (hq) return hq.name || hq.address || '';
      return emp.workingLocation || '';
    };
    const map = new Map<string, string>();
    for (const emp of employees) map.set(emp.id, resolve(emp));
    return map;
  }, [employees, businesses, warehouses, headquarters]);

  const sortedStaff = useMemo(() => {
    return [...filteredStaff].sort((a, b) => {
      let comp = 0;
      if (staffSortBy === 'name') comp = a.name.localeCompare(b.name);
      else if (staffSortBy === 'business') comp = (siteNameById.get(a.id) || '').localeCompare(siteNameById.get(b.id) || '');
      else if (staffSortBy === 'wage') comp = a.wage - b.wage;
      else if (staffSortBy === 'weeklyCost') comp = weeklyCost(a) - weeklyCost(b);
      else if (staffSortBy === 'satisfaction') comp = a.satisfaction - b.satisfaction;
      else if (staffSortBy === 'hours') comp = a.weeklyHours - b.weeklyHours;
      else if (staffSortBy === 'skill') comp = (a.skillLevel || 0) - (b.skillLevel || 0);
      return staffSortOrder === 'desc' ? -comp : comp;
    });
  }, [filteredStaff, staffSortBy, staffSortOrder, siteNameById]);

  const totalPages = Math.max(1, Math.ceil(sortedStaff.length / staffPerPage));
  const currentPage = Math.min(staffPage, totalPages);
  const paginatedStaff = useMemo(
    () => sortedStaff.slice((currentPage - 1) * staffPerPage, currentPage * staffPerPage),
    [sortedStaff, currentPage, staffPerPage]
  );

  // Jump back to the first page whenever the result set or page size changes.
  useEffect(() => {
    setStaffPage(1);
  }, [staffSearchQuery, staffLocationFilter, staffRoleFilter, staffContractFilter, staffSortBy, staffSortOrder, staffPerPage]);

  const handleSort = (field: StaffSortBy) => {
    if (staffSortBy === field) {
      setStaffSortOrder(staffSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setStaffSortBy(field);
      setStaffSortOrder((field === 'name' || field === 'business' || field === 'satisfaction') ? 'asc' : 'desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. EXECUTIVE WORKFORCE METRICS RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.activeWorkforce')}</span>
            <Users className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-xl font-bold font-mono text-[var(--text-main)]">
            {totalStaffCount} <span className="text-xs font-normal text-[var(--text-subtle)]">{t('liveHq.staffWord')}</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>{t('liveHq.avgWage')}</span>
            <strong className="font-mono text-emerald-600 dark:text-emerald-400">${avgHourlyWage}/hr</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.weeklyPayroll')}</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            ${weeklyPayrollTotal.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>{t('liveHq.totalWorkload')}</span>
            <strong className="font-mono text-[var(--text-main)]">{employees.reduce((acc, e) => acc + (e.weeklyHours || 0), 0)} hrs/wk</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.averageMorale')}</span>
            <Heart className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className={`text-xl font-bold font-mono ${avgMorale == null ? 'text-[var(--text-subtle)]' : avgMorale >= 80 ? 'text-emerald-500' : avgMorale >= 65 ? 'text-amber-500' : 'text-rose-500'}`}>
            {avgMorale == null ? '-' : `${avgMorale}%`}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>{t('liveHq.lowMorale')}</span>
            <strong className={`font-mono ${lowMoraleCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
              {lowMoraleCount} {t('liveHq.workersWord')}
            </strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.complianceOvertime')}</span>
            <TriangleAlert className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className={`text-xl font-bold font-mono ${complainingCount > 0 || burnoutCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {complainingCount + burnoutCount} <span className="text-xs font-normal text-[var(--text-subtle)]">{t('liveHq.flagsWord')}</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>{t('liveHq.overworked')}</span>
            <strong className={`font-mono ${burnoutCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
              {burnoutCount} {t('liveHq.staffWord')}
            </strong>
          </div>
        </div>
      </div>

      {/* 2. ENTERPRISE FILTER, SEARCH & BULK CONTROLS BAR */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder={t('liveHq.staffSearchPlaceholder')}
              value={staffSearchQuery}
              onChange={(e) => {
                setStaffSearchQuery(e.target.value);
              }}
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Location Custom Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setStaffLocationDropdownOpen(!staffLocationDropdownOpen);
                  setStaffRoleDropdownOpen(false);
                  setStaffContractDropdownOpen(false);
                }}
                className="bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] hover:border-emerald-500 rounded-xl px-3 py-2 text-xs text-[var(--text-main)] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Building className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate max-w-40">
                  {staffLocationFilter === 'all' ? t('liveHq.allLocationsCount', 'All Locations ({count})').replace('{count}', distinctLocations.length.toString()) : staffLocationFilter}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] shrink-0 transition-transform ${staffLocationDropdownOpen ? 'rotate-180 text-emerald-500' : ''}`} />
              </button>

              {staffLocationDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl overflow-hidden min-w-52 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 p-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setStaffLocationFilter('all');
                      setStaffLocationDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      staffLocationFilter === 'all'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                    }`}
                  >
                    <span>{t('liveHq.allLocations')}</span>
                    <span className="text-[10px] opacity-80">{totalStaffCount} {t('liveHq.staffWord')}</span>
                  </button>
                  {distinctLocations.map(loc => {
                    const count = employees.filter(e => e.workingLocation === loc).length;
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => {
                          setStaffLocationFilter(loc);
                          setStaffLocationDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                          staffLocationFilter === loc
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                        }`}
                      >
                        <span className="truncate">{loc}</span>
                        <span className={`text-[10px] ${staffLocationFilter === loc ? 'text-white/80' : 'text-[var(--text-subtle)]'}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Role Custom Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setStaffRoleDropdownOpen(!staffRoleDropdownOpen);
                  setStaffLocationDropdownOpen(false);
                  setStaffContractDropdownOpen(false);
                }}
                className="bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] hover:border-emerald-500 rounded-xl px-3 py-2 text-xs text-[var(--text-main)] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="truncate max-w-32 capitalize">
                  {staffRoleFilter === 'all' ? t('liveHq.allRolesCount', 'All Roles ({count})').replace('{count}', distinctRoles.length.toString()) : staffRoleFilter}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] shrink-0 transition-transform ${staffRoleDropdownOpen ? 'rotate-180 text-emerald-500' : ''}`} />
              </button>

              {staffRoleDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl overflow-hidden min-w-44 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 p-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setStaffRoleFilter('all');
                      setStaffRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      staffRoleFilter === 'all'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                    }`}
                  >
                    <span>{t('liveHq.allRoles')}</span>
                    <span className="text-[10px] opacity-80">{distinctRoles.length}</span>
                  </button>
                  {distinctRoles.map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setStaffRoleFilter(role);
                        setStaffRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer capitalize ${
                        staffRoleFilter.toLowerCase() === role.toLowerCase()
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                      }`}
                    >
                      <span>{role}</span>
                      <span className={`text-[10px] ${staffRoleFilter.toLowerCase() === role.toLowerCase() ? 'text-white/80' : 'text-[var(--text-subtle)]'}`}>
                        {employees.filter(e => (e.primarySkillName || 'General').toLowerCase() === role.toLowerCase()).length}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Contract Type Custom Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setStaffContractDropdownOpen(!staffContractDropdownOpen);
                  setStaffLocationDropdownOpen(false);
                  setStaffRoleDropdownOpen(false);
                }}
                className="bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] hover:border-emerald-500 rounded-xl px-3 py-2 text-xs text-[var(--text-main)] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>
                  {staffContractFilter === 'all' ? t('liveHq.allContracts') : staffContractFilter === 'ft' ? t('liveHq.fullTimeShort') : t('liveHq.partTimeUnder40')}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] shrink-0 transition-transform ${staffContractDropdownOpen ? 'rotate-180 text-emerald-500' : ''}`} />
              </button>

              {staffContractDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl overflow-hidden min-w-48 animate-in fade-in zoom-in-95 duration-150 p-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setStaffContractFilter('all');
                      setStaffContractDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      staffContractFilter === 'all'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                    }`}
                  >
                    <span>{t('liveHq.allContracts')}</span>
                    <span className="text-[10px] opacity-80">{totalStaffCount}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStaffContractFilter('ft');
                      setStaffContractDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      staffContractFilter === 'ft'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                    }`}
                  >
                    <span>{t('liveHq.fullTimeRange')}</span>
                    <span className={`text-[10px] ${staffContractFilter === 'ft' ? 'text-white/80' : 'text-[var(--text-subtle)]'}`}>
                      {employees.filter(e => (e.weeklyHours || 0) >= FULL_TIME_WEEKLY_HOURS).length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStaffContractFilter('pt');
                      setStaffContractDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      staffContractFilter === 'pt'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                    }`}
                  >
                    <span>{t('liveHq.partTimeUnder40')}</span>
                    <span className={`text-[10px] ${staffContractFilter === 'pt' ? 'text-white/80' : 'text-[var(--text-subtle)]'}`}>
                      {employees.filter(e => (e.weeklyHours || 0) < FULL_TIME_WEEKLY_HOURS).length}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Active Count & Clear Filter Indicator */}
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
          <span>
            {t('liveHq.showingPrefix')} <strong className="text-[var(--text-main)] font-mono">{paginatedStaff.length}</strong> {t('liveHq.showingStaffSuffix', 'of {total} employees').replace('{total}', filteredStaff.length.toString())}
          </span>
          {(staffSearchQuery || staffLocationFilter !== 'all' || staffRoleFilter !== 'all' || staffContractFilter !== 'all') && (
            <button
              onClick={() => {
                setStaffSearchQuery('');
                setStaffLocationFilter('all');
                setStaffRoleFilter('all');
                setStaffContractFilter('all');
              }}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
            >
              {t('liveHq.resetAllFilters')}
            </button>
          )}
        </div>
      </div>

      {/* 3. HIGH-DENSITY ENTERPRISE WORKFORCE TABLE (paginated) */}
      <StaffTable
        staff={paginatedStaff}
        staffSortBy={staffSortBy}
        staffSortOrder={staffSortOrder}
        onSort={handleSort}
        businesses={businesses}
        warehouses={warehouses}
        headquarters={headquarters}
        highlightStaff={highlightStaff}
        highlightBizId={highlightBizId}
        onLocateStaff={handleLocateStaff}
      />

      {/* 4. PAGINATION */}
      {sortedStaff.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
          <div className="text-[11px] text-[var(--text-muted)] font-mono">
            {t('liveHq.showingPrefix')}{' '}
            <strong className="text-[var(--text-main)]">
              {sortedStaff.length === 0 ? 0 : (currentPage - 1) * staffPerPage + 1}-{Math.min(currentPage * staffPerPage, sortedStaff.length)}
            </strong>{' '}
            {t('liveHq.of')} <strong className="text-[var(--text-main)]">{sortedStaff.length}</strong>
          </div>

          <div className="flex items-center gap-2">
            {/* Rows per page */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setStaffPerPageDropdownOpen(!staffPerPageDropdownOpen)}
                className="bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] hover:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-[var(--text-main)] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span>{staffPerPage} {t('liveHq.perPage', 'per page')}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] transition-transform ${staffPerPageDropdownOpen ? 'rotate-180 text-emerald-500' : ''}`} />
              </button>
              {staffPerPageDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl overflow-hidden min-w-32 p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-150">
                  {[25, 50, 100, 250].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setStaffPerPage(n);
                        setStaffPerPageDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                        staffPerPage === n
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                      }`}
                    >
                      {n} {t('liveHq.perPage', 'per page')}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Page navigation */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setStaffPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--border-base)] bg-[var(--bg-base)] text-[var(--text-main)] hover:border-emerald-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default disabled:hover:border-[var(--border-base)]"
              >
                {t('liveHq.previous', 'Previous')}
              </button>
              <span className="font-mono text-xs text-[var(--text-muted)] px-2 min-w-16 text-center">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setStaffPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-[var(--border-base)] bg-[var(--bg-base)] text-[var(--text-main)] hover:border-emerald-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-default disabled:hover:border-[var(--border-base)]"
              >
                {t('liveHq.next', 'Next')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
