'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Store, 
  Briefcase,
  Clock, 
  Users, 
  ShoppingBag, 
  ArrowRight, 
  CheckCircle2, 
  Calendar, 
  ChevronRight,
  Sparkles,
  LayoutGrid,
  TrendingUp,
  Search,
  Check,
  Package
} from 'lucide-react';

import rawBusinesses from '@/data/businesses.json';
import rawItems from '@/data/items.json';
import businessIconsRaw from '@/data/business_icons.json';
import businessSchedulesRaw from '@/data/business_schedules.json';
import gameIconsRaw from '@/data/game_item_icons.json';

const businessIcons: Record<string, string> = businessIconsRaw;
const businessSchedules: Record<string, Record<string, boolean[]>> = businessSchedulesRaw;
const gameIcons: Record<string, string> = gameIconsRaw;

function getItemImageUrl(item: any): string | null {
  if (!item) return null;
  const name = typeof item === 'string' ? item : item.name || '';
  const cleanId = typeof item === 'object' && item.id ? item.id : name.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (gameIcons[cleanId]) return gameIcons[cleanId];
  if (gameIcons[name.toLowerCase().replace(/[^a-z0-9]/g, '')]) return gameIcons[name.toLowerCase().replace(/[^a-z0-9]/g, '')];

  return null;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Calculates the optimal operating schedule directly from true game multipliers (DayFactor * HourlyFactor >= 0.20)
function getDefaultBusinessSchedule(business: any): Record<string, boolean[]> {
  const hourly = (business.operating_schedule?.hourly_multipliers as number[]) || [];
  const dayMults = (business.operating_schedule?.day_multipliers as Record<string, number>) || {};
  const matrix: Record<string, boolean[]> = {};

  DAYS.forEach(day => {
    const dMult = dayMults[day] ?? 1.0;

    // In Big Ambitions simulation engine (CustomerEntriesCalculator.cs):
    // Total traffic = DayFactorMultiplier * HourlyFactorMultiplier
    // An hour is profitable to staff and operate if effectiveMultiplier >= 0.20
    if (dMult < 0.2 || hourly.length !== 24) {
      matrix[day] = Array(24).fill(false);
    } else {
      matrix[day] = hourly.map((hMult: number) => {
        const effectiveMultiplier = dMult * hMult;
        return effectiveMultiplier >= 0.20;
      });
    }
  });

  return matrix;
}
const HOURS = Array.from({ length: 24 }, (_, i) => i);

type BusinessCategory = 'all' | 'retail' | 'office';

// Blacklist of non-player-owned businesses
const EXCLUDED_BUSINESS_IDS = new Set([
  'bank',
  'clinic',
  'hospital',
  'irs',
  'school',
  'truckgarage',
  'cardealership',
  'movingservice',
  'privatedriverservice',
  'wholesalestore',
  'furniturestore',
  'appliancestore',
  'empty',
  'headquarters',
  'factory',
  'casino',
  'gasstation',
  'importexport',
  'interiorinstallationfirm',
  'marketingagency',
  'officesupplystore',
  'recruitmentagency',
  'warehouse'
]);

function BusinessesContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id') || searchParams.get('type') || '';

  const playableBusinesses = useMemo(() => {
    return rawBusinesses.filter(b => !EXCLUDED_BUSINESS_IDS.has(b.id));
  }, []);

  const [category, setCategory] = useState<BusinessCategory>('all');
  const [selectedId, setSelectedId] = useState(
    playableBusinesses.find(b => b.id === initialId || b.id.includes(initialId))?.id || playableBusinesses[0]?.id || 'bookstore'
  );
  const [search, setSearch] = useState('');

  // Mouse cursor tracking for floating tooltip
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: number } | null>(null);

  const selected = useMemo(() => {
    return playableBusinesses.find(b => b.id === selectedId) || playableBusinesses[0];
  }, [playableBusinesses, selectedId]);

  const filteredBusinesses = useMemo(() => {
    return playableBusinesses.filter(b => {
      const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
                            b.customer_type.toLowerCase().includes(search.toLowerCase());
      
      const isOffice = b.suitable_building_type === 'office';

      if (category === 'retail') return matchesSearch && !isOffice;
      if (category === 'office') return matchesSearch && isOffice;
      return matchesSearch;
    });
  }, [playableBusinesses, category, search]);

  const hourlyMults = (selected.operating_schedule.hourly_multipliers as number[]) || [];
  const peakHours = (selected.operating_schedule.peak_hours as number[]) || [];
  const dayMults = (selected.operating_schedule.day_multipliers as Record<string, number>) || {};

  // Interactive 7x24 schedule matrix state: true = open, false = closed
  const [scheduleMatrix, setScheduleMatrix] = useState<Record<string, boolean[]>>(() => {
    return getDefaultBusinessSchedule(selected);
  });

  // Automatically reset schedule to exact game recommended hours when switching businesses
  useEffect(() => {
    setScheduleMatrix(getDefaultBusinessSchedule(selected));
  }, [selectedId, selected]);

  // Toggle single cell
  const toggleHour = (day: string, hour: number) => {
    setScheduleMatrix(prev => ({
      ...prev,
      [day]: prev[day].map((open, h) => (h === hour ? !open : open))
    }));
  };

  // Toggle entire day
  const toggleFullDay = (day: string) => {
    setScheduleMatrix(prev => {
      const allOpen = prev[day].every(v => v);
      return {
        ...prev,
        [day]: Array(24).fill(!allOpen)
      };
    });
  };

  // Set preset recommended hours
  const setRecommendedHours = () => {
    setScheduleMatrix(getDefaultBusinessSchedule(selected));
  };

  // Set 24/7
  const set247 = () => {
    const matrix: Record<string, boolean[]> = {};
    DAYS.forEach(day => {
      matrix[day] = Array(24).fill(true);
    });
    setScheduleMatrix(matrix);
  };

  // Clear all
  const clearSchedule = () => {
    const matrix: Record<string, boolean[]> = {};
    DAYS.forEach(day => {
      matrix[day] = Array(24).fill(false);
    });
    setScheduleMatrix(matrix);
  };

  // Calculate 7-day total stats
  const weeklyStats = useMemo(() => {
    let totalOpenHours = 0;
    let coveredTrafficScore = 0;
    let totalPossibleTrafficScore = 0;

    DAYS.forEach(day => {
      const dayFactor = dayMults[day] || 1.0;
      for (let h = 0; h < 24; h++) {
        const mult = (hourlyMults[h] || 0) * dayFactor;
        totalPossibleTrafficScore += mult;
        if (scheduleMatrix[day] && scheduleMatrix[day][h]) {
          totalOpenHours++;
          coveredTrafficScore += mult;
        }
      }
    });

    const trafficCoveragePct = totalPossibleTrafficScore > 0 
      ? Math.round((coveredTrafficScore / totalPossibleTrafficScore) * 100) 
      : 0;

    // Average customer multiplier per active open hour
    const avgDemandMultiplier = totalOpenHours > 0 
      ? (coveredTrafficScore / totalOpenHours).toFixed(2)
      : '0.00';

    return {
      totalOpenHours,
      trafficCoveragePct,
      avgDemandMultiplier
    };
  }, [scheduleMatrix, hourlyMults, dayMults]);

  const isOffice = selected.suitable_building_type === 'office';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
          <Store className="w-5 h-5 text-emerald-500" />
          <span>Businesses &amp; Schedules</span>
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Store profiles, operating windows, and customer foot traffic schedules.
        </p>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Playable Store Selector */}
        <div className="lg:col-span-4 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-3">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            <button
              onClick={() => setCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                category === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              All ({playableBusinesses.length})
            </button>
            <button
              onClick={() => setCategory('retail')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                category === 'retail'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Retail Stores
            </button>
            <button
              onClick={() => setCategory('office')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                category === 'office'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Offices &amp; Agencies
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-subtle)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search businesses (e.g. Bookstore, Law Firm)..."
              className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredBusinesses.map((b) => {
              const isSelected = b.id === selected.id;
              const bIsOffice = b.suitable_building_type === 'office';
              const iconUrl = businessIcons[b.name];

              return (
                <button
                  key={b.id}
                  onClick={() => {
                    setSelectedId(b.id);
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      setTimeout(() => {
                        document.getElementById('business-details-pane')?.scrollIntoView({ behavior: 'smooth' });
                      }, 50);
                    }
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? bIsOffice 
                        ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20'
                        : 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                      : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    {iconUrl ? (
                      <div className={`w-8 h-8 rounded-lg p-1 shrink-0 flex items-center justify-center overflow-hidden ${isSelected ? 'bg-black/30 ring-1 ring-white/30' : 'bg-slate-900 border border-slate-700/60 shadow-xs'}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={iconUrl} alt={b.name} className="w-full h-full object-contain filter drop-shadow-xs" />
                      </div>
                    ) : (
                      <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${isSelected ? 'bg-white/20 text-white' : 'bg-[var(--bg-surface-elevated)] border border-[var(--border-base)] text-[var(--text-muted)]'}`}>
                        {bIsOffice ? <Briefcase className="w-4 h-4 text-[var(--indigo-accent)]" /> : <Store className="w-4 h-4 text-[var(--emerald-accent)]" />}
                      </div>
                    )}

                    <div className="truncate">
                      <div className="truncate text-xs font-bold flex items-center gap-1.5">
                        <span>{b.name}</span>
                        {bIsOffice && (
                          <span className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase ${isSelected ? 'bg-white/20 text-white' : 'bg-[var(--indigo-bg)] text-[var(--indigo-accent)] border border-[var(--indigo-border)]'}`}>
                            Office
                          </span>
                        )}
                      </div>
                      <div className={`text-[10px] capitalize mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-[var(--text-subtle)]'}`}>
                        {b.suitable_building_type} • {b.customer_type}
                      </div>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium shrink-0 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[var(--bg-base)] text-[var(--text-subtle)]'
                  }`}>
                    {b.products.length > 0 ? `${b.products.length} items` : 'Services'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Business Overview, Full-Week 7x24 Matrix, and Builder Link */}
        <div id="business-details-pane" className="lg:col-span-8 space-y-6">
          {/* Header Card */}
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3.5">
                {businessIcons[selected.name] ? (
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700/60 p-2 shrink-0 flex items-center justify-center overflow-hidden shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={businessIcons[selected.name]} alt={selected.name} className="w-full h-full object-contain filter drop-shadow-xs" />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-base)] shrink-0 flex items-center justify-center text-[var(--text-main)] shadow-sm">
                    {isOffice ? <Briefcase className="w-6 h-6 text-[var(--indigo-accent)]" /> : <Store className="w-6 h-6 text-[var(--emerald-accent)]" />}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-[var(--text-main)] leading-tight">{selected.name}</h2>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                      isOffice 
                        ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                        : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    }`}>
                      {isOffice ? 'Office Service' : 'Retail Store'}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Building: <strong className="text-[var(--text-main)] capitalize">{selected.suitable_building_type}</strong></span>
                    <span className="hidden sm:inline">•</span>
                    <span>Customer: <strong className="text-[var(--text-main)]">{selected.customer_type}</strong></span>
                    <span className="hidden sm:inline">•</span>
                    <span>Degree: <strong className="text-[var(--text-main)]">{selected.course_required || 'None'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Store / Office Builder Link */}
              <Link
                href={`/builder?type=${selected.id}`}
                className="p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/30 hover:border-violet-500 transition-all text-right shrink-0 group flex items-center gap-3"
              >
                <div>
                  <div className="text-[10px] text-violet-600 dark:text-violet-400 font-bold uppercase tracking-wider">
                    {isOffice ? 'Office Setup Builder' : 'Store Setup Builder'}
                  </div>
                  <div className="text-xs font-extrabold text-[var(--text-main)] group-hover:text-violet-600 dark:group-hover:text-violet-400 mt-0.5 flex items-center gap-1">
                    <span>Plan Equipment &amp; List</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            </div>

            {/* 7-DAY 24-HOUR WEEKLY INTERACTIVE MATRIX */}
            <div className="space-y-4 relative">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <span>Weekly Operating Schedule</span>
                  </h3>
                </div>

                {/* Quick Preset Actions */}
                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <button
                    onClick={setRecommendedHours}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
                  >
                    Recommended Hours
                  </button>
                  <button
                    onClick={set247}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
                  >
                    24/7 Open
                  </button>
                  <button
                    onClick={clearSchedule}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-muted)] hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Weekly Operating KPI Bar */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3.5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-subtle)] uppercase font-semibold">
                    <Clock className="w-3 h-3 text-indigo-500" />
                    <span>Operating Time</span>
                  </div>
                  <div className="text-base font-extrabold font-mono text-[var(--text-main)] mt-0.5">
                    {weeklyStats.totalOpenHours} <span className="text-xs font-normal text-[var(--text-subtle)]">/ 168h</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-subtle)] uppercase font-semibold">
                    <Users className="w-3 h-3 text-emerald-500" />
                    <span>Demand Captured</span>
                  </div>
                  <div className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {weeklyStats.trafficCoveragePct}%
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-subtle)] uppercase font-semibold">
                    <TrendingUp className="w-3 h-3 text-sky-500" />
                    <span>Rush Intensity</span>
                  </div>
                  <div className="text-base font-extrabold font-mono text-sky-500 mt-0.5">
                    {weeklyStats.avgDemandMultiplier}x
                  </div>
                </div>
              </div>

              {/* THE 7x24 INTERACTIVE TIMETABLE (Rigid Table Grid) */}
              <div 
                className="overflow-x-auto p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] relative"
                onMouseMove={(e) => {
                  setCursorPos({ x: e.clientX, y: e.clientY });
                }}
              >
                <table className="w-full min-w-[780px] table-fixed border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-subtle)]">
                      <th className="w-28 text-left pb-2 font-bold text-[var(--text-muted)]">Day / Hour</th>
                      {HOURS.map(h => (
                        <th key={h} className="p-0.5 text-center font-bold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map(day => {
                      const dayFactor = dayMults[day] || 1.0;
                      const dayOpenCount = scheduleMatrix[day]?.filter(Boolean).length || 0;

                      return (
                        <tr key={day} className="border-b border-[var(--border-subtle)]/40 last:border-0">
                          {/* Day Row Header */}
                          <td className="w-28 py-1.5 pr-2">
                            <button
                              type="button"
                              onClick={() => toggleFullDay(day)}
                              className="w-full text-left text-xs font-bold text-[var(--text-main)] hover:text-emerald-500 transition-colors flex items-center justify-between cursor-pointer"
                            >
                              <span>{day.slice(0, 3)} ({dayFactor.toFixed(1)}x)</span>
                              <span className="text-[10px] font-mono font-normal text-[var(--text-subtle)]">{dayOpenCount}h</span>
                            </button>
                          </td>

                          {/* 24 Static Fixed Columns */}
                          {HOURS.map(hour => {
                            const isOpen = scheduleMatrix[day]?.[hour];
                            const isPeak = peakHours.includes(hour);

                            return (
                              <td key={hour} className="p-0.5">
                                <button
                                  type="button"
                                  onClick={() => toggleHour(day, hour)}
                                  onMouseEnter={() => setHoveredCell({ day, hour })}
                                  onMouseLeave={() => setHoveredCell(null)}
                                  className={`w-full h-8 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center justify-center cursor-pointer select-none ${
                                    isOpen
                                      ? isPeak
                                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                                        : 'bg-emerald-500/80 hover:bg-emerald-500 text-white'
                                      : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] text-[var(--text-subtle)] opacity-40'
                                  }`}
                                >
                                  {isOpen ? '✓' : ''}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* FLOATING VIEWPORT-FIXED TOOLTIP */}
                {hoveredCell && (
                  <div
                    className="fixed pointer-events-none z-50 px-3.5 py-2.5 rounded-xl bg-slate-950/95 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs space-y-1.5 animate-in fade-in zoom-in-95 duration-100"
                    style={{ 
                      left: `${typeof window !== 'undefined' && cursorPos.x + 220 > window.innerWidth ? cursorPos.x - 210 : cursorPos.x + 14}px`, 
                      top: `${cursorPos.y + 14}px` 
                    }}
                  >
                    <div className="font-bold flex items-center gap-2 text-white">
                      <span>{hoveredCell.day}</span>
                      <span className="font-mono text-emerald-400">{hoveredCell.hour}:00 - {hoveredCell.hour + 1}:00</span>
                      {peakHours.includes(hoveredCell.hour) && (
                        <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500 text-black">
                          RUSH
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-300 flex items-center justify-between gap-4">
                      <span>Traffic Multiplier:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {((hourlyMults[hoveredCell.hour] || 0) * (dayMults[hoveredCell.day] || 1)).toFixed(2)}x
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1 flex items-center justify-between gap-3">
                      <span>Schedule:</span>
                      <span className="font-semibold">{scheduleMatrix[hoveredCell.day]?.[hoveredCell.hour] ? '🟢 Currently OPEN' : '⚪ Currently CLOSED'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Compatible Store Stock Inventory / Service Details */}
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-emerald-500" />
                <span>{isOffice ? 'Service Offerings & Client Deliverables' : `Compatible Store Inventory (${selected.products.length} Products)`}</span>
              </h3>
            </div>

            {selected.products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selected.products.map((p: any) => {
                  const fullItem = rawItems.find(i => i.id === p.id);
                  const isPrimary = p.impact >= 1.0;
                  const itemImg = getItemImageUrl(fullItem || p);

                  return (
                    <Link
                      key={p.id}
                      href={`/items?search=${encodeURIComponent(p.name)}`}
                      className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] hover:border-emerald-500 hover:bg-[var(--bg-surface-hover)] transition-all flex items-center justify-between group gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Item Icon Thumbnail */}
                        <div className="w-10 h-10 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-base)] flex items-center justify-center shrink-0 overflow-hidden p-1">
                          {itemImg ? (
                            <img
                              src={itemImg}
                              alt={p.name}
                              className="w-full h-full object-contain filter drop-shadow-xs"
                              loading="lazy"
                            />
                          ) : (
                            <Package className="w-4 h-4 text-[var(--text-subtle)]" />
                          )}
                        </div>

                        <div className="space-y-0.5 min-w-0">
                          <div className="font-bold text-xs text-[var(--text-main)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-2 truncate">
                            <span className="truncate">{p.name}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase font-bold shrink-0 ${
                              isPrimary
                                ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                                : 'bg-[var(--border-base)] text-[var(--text-subtle)]'
                            }`}>
                              {isPrimary ? 'Primary Demand' : 'Secondary'}
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--text-subtle)] font-mono truncate">
                            Package: {fullItem?.retail_properties.box_size || 1} units/box • {fullItem?.retail_properties.can_put_in_shopping_basket ? 'Basket Friendly' : 'Counter / Hand Carry'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <ChevronRight className="w-4 h-4 text-[var(--text-subtle)] group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[var(--bg-base)] text-xs text-[var(--text-muted)] border border-[var(--border-base)]">
                This office operates by selling professional client services (B2B contracts &amp; client consultations). Assign educated staff with computers and desks to fulfill client demand.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BusinessesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--text-muted)]">Loading business...</div>}>
      <BusinessesContent />
    </Suspense>
  );
}