'use client';

import { useMemo, useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Activity, 
  Wifi, 
  DollarSign, 
  TrendingUp, 
  Store, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  RotateCw, 
  Info, 
  Users, 
  Building, 
  CreditCard, 
  Heart, 
  BatteryCharging, 
  Sparkles, 
  Shield, 
  ShieldCheck,
  Megaphone, 
  ArrowRight, 
  ArrowUpRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  TrendingDown,
  ChevronRight,
  ChevronDown,
  Boxes,
  Percent,
  Check,
  AlertCircle,
  Calendar,
  Award,
  Zap,
  Flame,
  Truck,
  Bell,
  HelpCircle,
  X,
  Target,
  BarChart3,
  Download,
  Copy,
  Anchor,
  Navigation,
  Layers,
  CheckCheck,
  Compass,
  MapPin,
  PlusCircle,
  Home,
  Utensils,
  FolderArchive,
  Radio,
  Cpu,
  Lock,
  ExternalLink,
  Volume2,
  VolumeX,
  BellOff
} from 'lucide-react';
import { useLiveSync, LiveBusinessData, LiveScheduleDay, EXPECTED_MOD_VERSION } from '@/context/LiveSyncContext';
import { SUPPLIERS_DB } from '@/data/suppliers';
import rawItems from '@/data/items.json';
import rawBusinesses from '@/data/businesses.json';

// Helper to resolve business store icons with strong contrast on both light and dark modes
function renderBusinessLogo(business: LiveBusinessData, sizeClass = 'w-10 h-10') {
  const clean = (business.rawType || business.type || '')
    .replace('ba:businesstype_', '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  let iconSrc = '/images/storeicons/businesstype_fastfoodrestaurant.png';
  if (clean.includes('fastfood')) iconSrc = '/images/storeicons/businesstype_fastfoodrestaurant.png';
  else if (clean.includes('coffee')) iconSrc = '/images/storeicons/businesstype_coffeeshop.png';
  else if (clean.includes('supermarket')) iconSrc = '/images/storeicons/businesstype_supermarket.png';
  else if (clean.includes('electronics')) iconSrc = '/images/storeicons/businesstype_electronicsstore.png';
  else if (clean.includes('clothing')) iconSrc = '/images/storeicons/businesstype_clothingstore.png';
  else if (clean.includes('jewelry')) iconSrc = '/images/storeicons/businesstype_jewelrystore.png';
  else if (clean.includes('liquor')) iconSrc = '/images/storeicons/businesstype_liquorstore.png';
  else if (clean.includes('florist')) iconSrc = '/images/storeicons/businesstype_florist.png';
  else if (clean.includes('bookstore')) iconSrc = '/images/storeicons/businesstype_bookstore.png';
  else if (clean.includes('giftshop')) iconSrc = '/images/storeicons/businesstype_giftshop.png';
  else if (clean.includes('lawfirm')) iconSrc = '/images/storeicons/businesstype_lawfirm.png';
  else if (clean.includes('webdevelopment')) iconSrc = '/images/storeicons/businesstype_webdevelopmentagency.png';
  else if (clean.includes('graphicdesign')) iconSrc = '/images/storeicons/businesstype_graphicdesigner.png';
  else if (clean.includes('cinema')) iconSrc = '/images/storeicons/businesstype_cinema.png';
  else if (clean.includes('gym')) iconSrc = '/images/storeicons/businesstype_gym.png';
  else if (clean.includes('hairdresser')) iconSrc = '/images/storeicons/businesstype_hairdresser.png';
  else if (clean.includes('nightclub')) iconSrc = '/images/storeicons/businesstype_nightclub.png';
  else if (clean.includes('theater')) iconSrc = '/images/storeicons/businesstype_theater.png';
  else if (clean.includes('fruit') || clean.includes('vegetable')) iconSrc = '/images/storeicons/businesstype_fruitandvegetablestore.png';
  else if (clean.includes('eventplanning')) iconSrc = '/images/storeicons/businesstype_eventplanningagency.png';
  else if (clean.includes('travel')) iconSrc = '/images/storeicons/businesstype_travelagency.png';

  return (
    <div className={`${sizeClass} rounded-xl bg-slate-900 border border-slate-700/60 p-1.5 flex items-center justify-center shrink-0 shadow-xs overflow-hidden`}>
      <img
        src={iconSrc}
        alt={business.type}
        className="w-full h-full object-contain filter drop-shadow-xs"
      />
    </div>
  );
}

function getItemImageSrc(rawItemName: string) {
  const clean = (rawItemName || '')
    .replace('ba:itemname_', '')
    .replace('ba:item_', '')
    .replace('ba:item', '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  if (clean.includes('burger')) return '/images/items/burger.png';
  if (clean.includes('soda') || clean.includes('can')) return '/images/items/sodacan.png';
  if (clean.includes('fries') || clean.includes('french')) return '/images/items/frenchfries.png';
  if (clean.includes('coffee') || clean.includes('cup')) return '/images/items/cupofcoffee.png';
  if (clean.includes('salad')) return '/images/items/salad.png';
  if (clean.includes('pizza')) return '/images/items/pizza.png';
  if (clean.includes('donut')) return '/images/items/donut.png';
  if (clean.includes('croissant')) return '/images/items/croissant.png';
  if (clean.includes('hotdog')) return '/images/items/hotdog.png';
  if (clean.includes('paperbag') || clean.includes('bag')) return '/images/items/paperbag.png';
  if (clean.includes('icecream') || clean.includes('ice')) return '/images/items/icecream.png';
  if (clean.includes('kabob') || clean.includes('skewer')) return '/images/items/kabob.png';
  if (clean.includes('apple')) return '/images/items/apple.png';
  if (clean.includes('banana')) return '/images/items/banana.png';
  if (clean.includes('carrot')) return '/images/items/carrot.png';
  if (clean.includes('lettuce')) return '/images/items/lettuce.png';
  if (clean.includes('pear')) return '/images/items/pear.png';
  if (clean.includes('tomato')) return '/images/items/tomato.png';
  if (clean.includes('flower') || clean.includes('cheapflower')) return '/images/items/cheapflower.png';
  if (clean.includes('expensiveflower')) return '/images/items/expensiveflower.png';
  if (clean.includes('gift') || clean.includes('box')) return '/images/items/cheapgift.png';
  if (clean.includes('jewelry') || clean.includes('necklace')) return '/images/items/expensivejewelry.png';
  if (clean.includes('beer')) return '/images/items/beer.png';
  if (clean.includes('wine')) return '/images/items/bottleofwine.png';
  if (clean.includes('cigar')) return '/images/items/cigar.png';

  const found = (rawItems as any[]).find(i => {
    const rawIdClean = (i.id || '').replace('ba:item_', '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const nameClean = (i.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return rawIdClean === clean || nameClean === clean;
  });

  if (found && found.image) {
    return `/images/items/${found.image}`;
  }

  return '';
}

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface ScheduleMatrixTableProps {
  activeStore: any;
  activeStoreDef: any;
  employees: any[];
}

function ScheduleMatrixTable({ activeStore, activeStoreDef, employees }: ScheduleMatrixTableProps) {
  const [hoveredCell, setHoveredCell] = useState<{ day: string; hour: number } | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const legendRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (legendRef.current && !legendRef.current.contains(event.target as Node)) {
        setShowLegend(false);
      }
    }
    if (showLegend) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLegend]);

  const dayMultipliers: Record<string, number> = activeStoreDef?.operating_schedule?.day_multipliers || {
    Monday: 0.85,
    Tuesday: 0.75,
    Wednesday: 0.75,
    Thursday: 0.75,
    Friday: 0.85,
    Saturday: 1.0,
    Sunday: 0.95
  };
  const hourlyCurve: number[] = activeStoreDef?.operating_schedule?.hourly_multipliers || Array(24).fill(0.5);
  const peakHours: number[] = activeStoreDef?.operating_schedule?.peak_hours || [11, 12, 13, 17, 18, 19];
  const recommendedWindow = activeStoreDef?.operating_schedule?.recommended_opening_window;
  let recStartHour = -1;
  let recEndHour = -1;
  if (recommendedWindow) {
    const match = recommendedWindow.match(/(\d{1,2}):00\s*-\s*(\d{1,2}):00/);
    if (match) {
      recStartHour = parseInt(match[1], 10);
      recEndHour = parseInt(match[2], 10);
    }
  }

  // Pre-process all 7x24 cells in constant time
  const cellMap = useMemo(() => {
    const map: Record<string, Record<number, {
      staffCount: number;
      cashiersCount: number;
      cleanersCount: number;
      securityCount: number;
      activeStaffNames: string[];
      isHourOpen: boolean;
      isPeak: boolean;
      isUnstaffedOpen: boolean;
      isUnprofitableOpenHour: boolean;
      isWithinRecommendedWindow: boolean;
      isClosedPeakDay: boolean;
      expectedMultiplier: string;
      cellBg: string;
    }>> = {};

    DAYS_ORDER.forEach(day => {
      map[day] = {};
      const daySched = (activeStore.scheduleWeek || []).find((s: any) => s.day.toLowerCase() === day.toLowerCase());
      const shifts = daySched?.shifts || [];
      const isOpen = daySched?.isOpen ?? false;
      const dayMult = dayMultipliers[day] || 0.85;
      const isClosedPeakDay = !isOpen && dayMult >= 0.85;

      for (let hour = 0; hour < 24; hour++) {
        const activeShiftsForHour = shifts.filter((ws: any) => hour >= ws.startHour && hour < ws.endHour);
        const staffCount = activeShiftsForHour.length;
        const isPeak = peakHours.includes(hour);

        const cashiers = activeShiftsForHour.filter((s: any) => {
          const empObj = employees.find(e => e.id === s.employeeId || e.name === s.employeeName);
          const skill = (s.skillName || empObj?.primarySkillName || '').toLowerCase();
          const role = (s.role || '').toLowerCase();
          const station = ((s as any).stationName || '').toLowerCase();
          if (role === 'cleaner' || skill.includes('clean') || station.includes('clean')) return false;
          if (role === 'security' || skill.includes('security') || skill.includes('guard') || station.includes('security')) return false;
          if (role === 'logistics' || skill.includes('logistic') || skill.includes('driver') || station.includes('logistic')) return false;
          return true;
        });
        const cleaners = activeShiftsForHour.filter((s: any) => {
          const empObj = employees.find(e => e.id === s.employeeId || e.name === s.employeeName);
          const skill = (s.skillName || empObj?.primarySkillName || '').toLowerCase();
          const role = (s.role || '').toLowerCase();
          const station = ((s as any).stationName || '').toLowerCase();
          return role === 'cleaner' || skill.includes('clean') || station.includes('clean');
        });
        const security = activeShiftsForHour.filter((s: any) => {
          const empObj = employees.find(e => e.id === s.employeeId || e.name === s.employeeName);
          const skill = (s.skillName || empObj?.primarySkillName || '').toLowerCase();
          const role = (s.role || '').toLowerCase();
          const station = ((s as any).stationName || '').toLowerCase();
          return role === 'security' || skill.includes('security') || skill.includes('guard') || station.includes('security');
        });

        let isHourOpen = false;
        if (isOpen) {
          if (Array.isArray(daySched?.hoursOpen) && daySched.hoursOpen.length === 24) {
            isHourOpen = !!daySched.hoursOpen[hour];
          } else if (daySched?.startHour !== undefined && daySched?.endHour !== undefined && daySched.startHour !== -1 && (daySched.endHour - daySched.startHour > 0)) {
            isHourOpen = hour >= daySched.startHour && hour < daySched.endHour;
          } else if (shifts.length > 0) {
            const minShiftHour = Math.min(...shifts.map((s: any) => s.startHour));
            const maxShiftHour = Math.max(...shifts.map((s: any) => s.endHour));
            isHourOpen = hour >= minShiftHour && hour < maxShiftHour;
          } else {
            isHourOpen = false;
          }
        }

        // In Big Ambitions simulation engine (same as /businesses page):
        // Total traffic multiplier = dayFactor * hourlyFactor
        // An hour is recommended/profitable to operate if effective traffic multiplier >= 0.20
        const effectiveMultiplierNum = (hourlyCurve[hour] || 0) * dayMult;
        const expectedMultiplier = effectiveMultiplierNum.toFixed(2);
        const isRecommendedSimulationHour = !isHourOpen && (effectiveMultiplierNum >= 0.20);

        // Store is OPEN and staffed, but traffic is too low (< 0.20x) -> High likelihood of negative net operating profit (paying wages with no sales)
        const isUnprofitableOpenHour = isHourOpen && (effectiveMultiplierNum < 0.20);
        const isUnstaffedOpen = isHourOpen && cashiers.length === 0;

        // Clear Color Hierarchy for Matrix Cells:
        // 1. Critical Operational Error: Unstaffed Open (Zero cashiers while store is open) -> High-contrast Red/Rose
        // 2. Financial Waste: Unprofitable Open (< 0.20x demand while open) -> Distinct Violet / Purple (Wage Loss)
        // 3. Normal Active Operation (Staffed + Rush hour) -> Emerald 600
        // 4. Normal Active Operation (Staffed + Normal traffic) -> Emerald 500
        // 5. Preparation/Nightshift (Staff working while closed) -> Indigo
        // 6. High-Value Lost Opportunity (Store closed during a Peak Rush hour on a Peak Day) -> Golden Amber Outline
        // 7. General Benchmark Opportunity (Store closed during profitable compendium hours) -> Sky Blue
        // 8. Normal Closed -> Default surface
        let cellBg = 'bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-subtle)] hover:border-slate-500/40';
        if (isHourOpen) {
          if (isUnstaffedOpen) {
            cellBg = 'bg-rose-500/25 border-2 border-rose-500 text-rose-600 dark:text-rose-400 font-extrabold';
          } else if (isUnprofitableOpenHour) {
            // Distinct violet styling for wage loss: clearly separates financial drag from critical zero-staff walkout alarms
            cellBg = 'bg-purple-500/20 border border-purple-500/50 text-purple-600 dark:text-purple-300 font-bold';
          } else if (isPeak) {
            cellBg = 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs';
          } else {
            cellBg = 'bg-emerald-500/80 hover:bg-emerald-500 text-white font-semibold';
          }
        } else if (staffCount > 0) {
          cellBg = 'bg-indigo-500/80 text-white font-semibold';
        } else if (isClosedPeakDay && isPeak) {
          // Priority 6: Peak Day & Peak Rush Hour that is currently closed -> Golden Amber outline (high demand outside)
          cellBg = 'bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400 font-medium';
        } else if (isRecommendedSimulationHour) {
          // Priority 7: Profitable benchmark hours (>= 0.20x) that are closed -> Sky blue benchmark
          cellBg = 'bg-sky-500/15 border border-sky-500/40 text-sky-600 dark:text-sky-400 font-medium';
        }

        map[day][hour] = {
          staffCount,
          cashiersCount: cashiers.length,
          cleanersCount: cleaners.length,
          securityCount: security.length,
          activeStaffNames: activeShiftsForHour.map((s: any) => `${s.employeeName} (${s.role || 'cashier'})`),
          isHourOpen,
          isPeak,
          isUnstaffedOpen,
          isUnprofitableOpenHour,
          isWithinRecommendedWindow: isRecommendedSimulationHour,
          isClosedPeakDay,
          expectedMultiplier,
          cellBg
        };
      }
    });

    return map;
  }, [activeStore, activeStoreDef, employees, dayMultipliers, hourlyCurve, peakHours, recStartHour, recEndHour]);

  const activeCellData = hoveredCell ? cellMap[hoveredCell.day]?.[hoveredCell.hour] : null;

  return (
    <div 
      className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-4 shadow-xs relative"
      onMouseMove={(e) => {
        if (tooltipRef.current) {
          const x = e.clientX + 260 > window.innerWidth ? Math.max(10, e.clientX - 250) : e.clientX + 14;
          const y = e.clientY + 190 > window.innerHeight ? Math.max(10, e.clientY - 170) : e.clientY + 14;
          tooltipRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        }
      }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border-subtle)]">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span>Full Week Operating Schedule &amp; Live Shift Coverage Matrix</span>
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Heatmap indicates customer traffic volume. Numbers indicate assigned staff on duty.
          </p>
        </div>

        <div className="relative" ref={legendRef}>
          <button
            onClick={() => setShowLegend(!showLegend)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-base)] bg-[var(--bg-base)] hover:bg-[var(--bg-card)] text-[var(--text-main)] transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>Matrix Legend &amp; Guide</span>
          </button>

          {/* Clean Dropdown / Popover Flyout */}
          {showLegend && (
            <div className="absolute right-0 top-full mt-2 w-80 p-4 rounded-xl bg-white dark:bg-[#1C1A17] border border-[var(--border-strong)] shadow-xl z-50 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border-subtle)]">
                <span className="font-bold text-[var(--text-main)]">Schedule Color Codes</span>
                <button
                  onClick={() => setShowLegend(false)}
                  className="text-[var(--text-subtle)] hover:text-[var(--text-main)] cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Operating Category */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)]">Operating Hours</span>
                <div className="grid grid-cols-1 gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-emerald-600 shrink-0"></span>
                    <span className="text-[var(--text-main)]"><strong>Rush Hour:</strong> High customer traffic window</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-emerald-500/70 shrink-0"></span>
                    <span className="text-[var(--text-muted)]"><strong>Normal Traffic:</strong> Standard operating hour</span>
                  </div>
                </div>
              </div>

              {/* Alerts & Errors */}
              <div className="space-y-1.5 pt-1 border-t border-[var(--border-subtle)]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-500">Alerts &amp; Drag</span>
                <div className="grid grid-cols-1 gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-rose-500/20 border border-rose-500/60 shrink-0"></span>
                    <span className="text-rose-500 font-semibold"><strong>Unstaffed Open:</strong> 0 cashiers on duty (walkouts)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-purple-500/20 border border-purple-500/50 shrink-0"></span>
                    <span className="text-purple-600 dark:text-purple-300"><strong>Unprofitable (&lt;0.20x):</strong> Open during dead hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-indigo-500/80 shrink-0"></span>
                    <span className="text-indigo-600 dark:text-indigo-400"><strong>Staffed Closed:</strong> Shifts scheduled while closed</span>
                  </div>
                </div>
              </div>

              {/* Closed & Opportunity */}
              <div className="space-y-1.5 pt-1 border-t border-[var(--border-subtle)]">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-subtle)]">Closed Hours</span>
                <div className="grid grid-cols-1 gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-amber-500/15 border border-amber-500/40 shrink-0"></span>
                    <span className="text-amber-600 dark:text-amber-400"><strong>Rush Opportunity:</strong> Closed during peak rush</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-sky-500/20 border border-sky-500/50 shrink-0"></span>
                    <span className="text-sky-600 dark:text-sky-400"><strong>Benchmark:</strong> Recommended compendium window</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-[var(--bg-surface)] border border-[var(--border-base)] shrink-0"></span>
                    <span className="text-[var(--text-subtle)]"><strong>Closed:</strong> Store closed as normal</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 7x24 Rigid Interactive Timetable */}
      <div className="overflow-x-auto p-3 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] relative">
        <table 
          className="w-full min-w-[800px] table-fixed border-collapse"
          onMouseLeave={() => setHoveredCell(null)}
        >
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-subtle)]">
              <th className="w-28 text-left pb-2 font-bold text-[var(--text-muted)]">Day / Hour</th>
              {Array.from({ length: 24 }).map((_, h) => (
                <th key={h} className="p-0.5 text-center font-bold">
                  {String(h).padStart(2, '0')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS_ORDER.map(day => {
              const daySchedule = (activeStore.scheduleWeek || []).find((s: any) => s.day.toLowerCase() === day.toLowerCase());
              const isOpen = daySchedule?.isOpen ?? false;
              const dayMult = dayMultipliers[day] || 0.85;
              const isClosedPeakDay = !isOpen && dayMult >= 0.85;

              return (
                <tr key={day} className="border-b border-[var(--border-subtle)]/40 last:border-0">
                  {/* Day Row Header - Clean & Non-Crammed */}
                  <td className="w-24 py-1.5 pr-2">
                    <div className="w-full text-left text-xs font-bold text-[var(--text-main)] flex items-center justify-between">
                      <span>{day.slice(0, 3)}</span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isOpen 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                          : isClosedPeakDay
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                          : 'bg-slate-500/10 text-slate-500'
                      }`}>
                        {isOpen ? `${daySchedule?.openHours || 0}h` : 'Closed'}
                      </span>
                    </div>
                  </td>

                  {/* 24 Fixed Column Cells */}
                  {Array.from({ length: 24 }).map((_, hour) => {
                    const cellData = cellMap[day][hour];

                    return (
                      <td 
                        key={hour} 
                        className="p-0.5"
                        onMouseEnter={(e) => {
                          setHoveredCell({ day, hour });
                          const x = e.clientX + 260 > window.innerWidth ? Math.max(10, e.clientX - 250) : e.clientX + 14;
                          const y = e.clientY + 190 > window.innerHeight ? Math.max(10, e.clientY - 170) : e.clientY + 14;
                          if (tooltipRef.current) {
                            tooltipRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                          }
                        }}
                      >
                        <div
                          className={`w-full h-8 rounded-lg text-[10px] font-mono flex items-center justify-center cursor-pointer select-none relative ${cellData.cellBg}`}
                        >
                          {cellData.staffCount > 0 ? (
                            <span className="flex items-center gap-0.5 text-[10px]">
                              {cellData.cleanersCount > 0 && cellData.cashiersCount === 0 ? (
                                <Sparkles className="w-2.5 h-2.5 text-amber-300" />
                              ) : cellData.securityCount > 0 && cellData.cashiersCount === 0 ? (
                                <ShieldCheck className="w-2.5 h-2.5 text-sky-300" />
                              ) : (
                                <Users className="w-2.5 h-2.5" />
                              )}
                              <span>{cellData.staffCount}</span>
                            </span>
                          ) : cellData.isHourOpen ? (
                            <span className="text-[9px] text-rose-600 dark:text-rose-400 font-extrabold">0</span>
                          ) : (
                            <span className="text-[9px] text-[var(--text-subtle)] font-medium opacity-60">-</span>
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

        {/* FLOATING VIEWPORT-FIXED TOOLTIP - INSTANT O(1) LOOKUP */}
        {hoveredCell && activeCellData && (
          <div
            ref={tooltipRef}
            className="fixed pointer-events-none z-50 px-3.5 py-2.5 rounded-xl bg-slate-950 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs space-y-1.5 top-0 left-0 will-change-transform"
          >
            <div className="font-bold flex items-center gap-2 text-white">
              <span>{hoveredCell.day}</span>
              <span className="font-mono text-emerald-400">{hoveredCell.hour}:00 - {hoveredCell.hour + 1}:00</span>
              {activeCellData.isPeak && (
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500 text-black">
                  PEAK RUSH
                </span>
              )}
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="text-slate-300 flex items-center justify-between gap-4">
                <span>Traffic Multiplier:</span>
                <span className="font-mono font-bold text-emerald-400">{activeCellData.expectedMultiplier}x</span>
              </div>

              <div className="text-slate-300 border-t border-slate-800/80 pt-1 space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <span>Cashier Coverage:</span>
                  <span className={`font-mono font-bold ${activeCellData.cashiersCount > 0 ? 'text-emerald-400' : activeCellData.isHourOpen ? 'text-rose-400' : 'text-slate-500'}`}>
                    {activeCellData.cashiersCount > 0 
                      ? `${activeCellData.cashiersCount} Cashier(s)` 
                      : activeCellData.isHourOpen 
                      ? '🚨 0 Cashiers (100% Walkouts)' 
                      : 'Store Closed'}
                  </span>
                </div>

                {activeCellData.cleanersCount > 0 && (
                  <div className="flex items-center justify-between gap-4 text-[10px] text-amber-300">
                    <span>Cleaning Staff:</span>
                    <span className="font-mono font-bold">{activeCellData.cleanersCount} Cleaner(s)</span>
                  </div>
                )}

                {activeCellData.securityCount > 0 && (
                  <div className="flex items-center justify-between gap-4 text-[10px] text-sky-300">
                    <span>Security Guard:</span>
                    <span className="font-mono font-bold">{activeCellData.securityCount} Guard(s)</span>
                  </div>
                )}

                {activeCellData.isUnstaffedOpen && (
                  <div className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/50 text-rose-300 text-[10px] font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>⚠️ UNSTAFFED OPEN: 100% customer walkouts!</span>
                  </div>
                )}

                {activeCellData.isUnprofitableOpenHour && !activeCellData.isUnstaffedOpen && (
                  <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-semibold flex items-center gap-1.5">
                    <TrendingDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>⚠️ UNPROFITABLE SCHEDULE: Demand &lt; 0.20x (Wages likely exceed revenue)</span>
                  </div>
                )}

                {!activeCellData.isHourOpen && activeCellData.isClosedPeakDay && activeCellData.isPeak && (
                  <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-semibold flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Closed Peak Hour ({hoveredCell.day}): High revenue potential</span>
                  </div>
                )}

                {!activeCellData.isHourOpen && activeCellData.isWithinRecommendedWindow && !(activeCellData.isClosedPeakDay && activeCellData.isPeak) && (
                  <div className="p-1.5 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[10px] font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span>Suboptimal Window ({recommendedWindow}): Recommended benchmark</span>
                  </div>
                )}

                {activeCellData.activeStaffNames.length > 0 && (
                  <div className="text-[10px] text-slate-400 truncate pt-0.5">
                    Staff: {activeCellData.activeStaffNames.join(', ')}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LiveSyncDashboardContent() {
  const { 
    state, 
    isLinkAllowed, 
    permissionError, 
    diagnosticLogs, 
    lastLatencyMs, 
    isCityLoaded,
    isDemoMode, 
    isHydrated,
    enableDemoMode, 
    exitDemoMode, 
    connect,
    clearDiagnosticLogs 
  } = useLiveSync();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'overview';
  const selectedStoreId = searchParams.get('store');
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [businessSortBy, setBusinessSortBy] = useState<'profit' | 'revenue' | 'satisfaction'>('profit');
  const [fleetViewMode, setFleetViewMode] = useState<'grid' | 'table'>('grid');
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<string>('Monday');

  // Real-time Phone-Style Toast Notification and Audio Chime
  const [activeToast, setActiveToast] = useState<{ id?: string; location: string; type: string; message: string; severity?: string } | null>(null);
  const [notificationSoundEnabled, setNotificationSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('ba_sync_notif_sound');
    return saved !== null ? saved === 'true' : true;
  });
  const [bannerPopupsEnabled, setBannerPopupsEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('ba_sync_notif_banner');
    return saved !== null ? saved === 'true' : true;
  });

  const prevAlertIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Toggle helpers that persist to localStorage
  const toggleSound = () => {
    setNotificationSoundEnabled(prev => {
      const next = !prev;
      localStorage.setItem('ba_sync_notif_sound', String(next));
      return next;
    });
  };

  const toggleBanners = () => {
    setBannerPopupsEnabled(prev => {
      const next = !prev;
      localStorage.setItem('ba_sync_notif_banner', String(next));
      return next;
    });
  };

  // Synthesize clean audio notification chime via Web Audio API (no external file dependency)
  const playNotificationChime = () => {
    if (!notificationSoundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      // Tone 1: 587.33 Hz (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.2, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Tone 2: 880.00 Hz (A5 - pleasant smartphone chime harmony)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.1);
      gain2.gain.setValueAtTime(0, now + 0.1);
      gain2.gain.linearRampToValueAtTime(0.25, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.6);
    } catch {
      // Audio context might be restricted before user interaction
    }
  };

  // Diagnostics Connection Screen (Real Live Console)
  const [handshakeActive, setHandshakeActive] = useState(false);
  const [hasCompletedHandshake, setHasCompletedHandshake] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    // If state is already active or we already verified this session in the current tab, bypass gateway
    const sessionActive = sessionStorage.getItem('ba_live_sync_session_verified');
    return sessionActive === 'true';
  });

  // Trigger real manual diagnostic probe
  const startDiagnosticHandshake = () => {
    setHandshakeActive(true);
    connect();
  };

  // When live save game city is detected, transition immediately into the dashboard
  useEffect(() => {
    let timer: any;
    if (state.isConnected && isCityLoaded) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('ba_live_sync_session_verified', 'true');
      }

      if (!hasCompletedHandshake) {
        if (handshakeActive) {
          // If user opened the manual diagnostic console, let them see the verification logs for ~500ms
          timer = setTimeout(() => {
            setHasCompletedHandshake(true);
            setHandshakeActive(false);
          }, 500);
        } else {
          // If arriving from another page or reload while game is broadcasting, jump straight to dashboard
          setHasCompletedHandshake(true);
        }
      }
    } else if (!state.isConnected && !isCityLoaded) {
      // If game has actually closed / disconnected, clear session verification
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('ba_live_sync_session_verified');
      }
      setHasCompletedHandshake(false);
    }
    return () => clearTimeout(timer);
  }, [state.isConnected, isCityLoaded, hasCompletedHandshake, handshakeActive]);

  // Decision Analyzer Filter state
  const [analyzerFilterBusiness, setAnalyzerFilterBusiness] = useState<string>('all');
  const [analyzerFilterCategory, setAnalyzerFilterCategory] = useState<string>('all');
  const [analyzerBizDropdownOpen, setAnalyzerBizDropdownOpen] = useState(false);
  const [analyzerCatDropdownOpen, setAnalyzerCatDropdownOpen] = useState(false);

  // Workforce Command Room Filter, Search & Pagination state
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffLocationFilter, setStaffLocationFilter] = useState('all');
  const [staffRoleFilter, setStaffRoleFilter] = useState('all');
  const [staffContractFilter, setStaffContractFilter] = useState<'all' | 'ft' | 'pt'>('all');
  const [staffLocationDropdownOpen, setStaffLocationDropdownOpen] = useState(false);
  const [staffRoleDropdownOpen, setStaffRoleDropdownOpen] = useState(false);
  const [staffContractDropdownOpen, setStaffContractDropdownOpen] = useState(false);
  const [staffSortBy, setStaffSortBy] = useState<'name' | 'wage' | 'satisfaction' | 'hours' | 'skill'>('satisfaction');
  const [staffSortOrder, setStaffSortOrder] = useState<'asc' | 'desc'>('asc');
  const [staffPage, setStaffPage] = useState(1);
  const STAFF_PAGE_SIZE = 25;

  // Storefronts (View 2) Filter, Sort & View Mode state
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [storeDistrictFilter, setStoreDistrictFilter] = useState('all');
  const [storeTypeFilter, setStoreTypeFilter] = useState('all');
  const [storeStatusFilter, setStoreStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [storeViewMode, setStoreViewMode] = useState<'table' | 'grid'>('table');
  const [storeSortBy, setStoreSortBy] = useState<'name' | 'sales' | 'profit' | 'satisfaction' | 'staff' | 'health'>('sales');
  const [storeSortOrder, setStoreSortOrder] = useState<'asc' | 'desc'>('desc');
  const [storePage, setStorePage] = useState(1);
  const STORE_PAGE_SIZE = 25;
  const [storeDistrictDropdownOpen, setStoreDistrictDropdownOpen] = useState(false);
  const [storeTypeDropdownOpen, setStoreTypeDropdownOpen] = useState(false);
  const [storeStatusDropdownOpen, setStoreStatusDropdownOpen] = useState(false);

  // Logistics & Supply Chain Filter & Sort state
  const [logisticsSubTab, setLogisticsSubTab] = useState<'inventory' | 'routes' | 'fleet'>('inventory');
  const [logisticsSearchQuery, setLogisticsSearchQuery] = useState('');
  const [logisticsWarehouseFilter, setLogisticsWarehouseFilter] = useState('all');
  const [logisticsWarehouseDropdownOpen, setLogisticsWarehouseDropdownOpen] = useState(false);
  const [logisticsSortBy, setLogisticsSortBy] = useState<'name' | 'quantity' | 'drain' | 'deliveries' | 'daysLeft'>('daysLeft');
  const [logisticsSortOrder, setLogisticsSortOrder] = useState<'asc' | 'desc'>('asc');

  // Real Estate & Residences (View 3) Filter, Sort & Pagination state
  const [realEstateSubTab, setRealEstateSubTab] = useState<'all' | 'residences' | 'commercial'>('all');
  const [realEstateSearchQuery, setRealEstateSearchQuery] = useState('');
  const [realEstateDistrictFilter, setRealEstateDistrictFilter] = useState('all');
  const [realEstateDistrictDropdownOpen, setRealEstateDistrictDropdownOpen] = useState(false);
  const [realEstateViewMode, setRealEstateViewMode] = useState<'table' | 'grid'>('table');
  const [realEstateSortBy, setRealEstateSortBy] = useState<'address' | 'type' | 'financial' | 'roi'>('financial');
  const [realEstateSortOrder, setRealEstateSortOrder] = useState<'asc' | 'desc'>('desc');
  const [realEstatePage, setRealEstatePage] = useState(1);
  const REAL_ESTATE_PAGE_SIZE = 25;

  const {
    isConnected,
    playerCash,
    bankBalance,
    totalLoans,
    netWorth,
    playerHappiness,
    playerEnergy,
    playerHunger,
    dailyRevenueTotal,
    dailyExpensesTotal,
    weeklyRevenueTotal,
    weeklyExpensesTotal,
    weeklyBusinessRevenue = 0,
    weeklyBusinessProfit = 0,
    weeklyResidentialRevenue = 0,
    weeklyResidentialExpenses = 0,
    weeklyResidentialNet = 0,
    totalEmployees,
    totalHourlyPayroll,
    weeklyPayrollTotal,
    taxDeductibleExpenses,
    unpaidTaxes,
    gameDay,
    gameHour,
    gameMinute,
    weeklyRevenueHistory = [],
    businesses = [],
    residences = [],
    ownedRealEstate = [],
    warehouses = [],
    employees = [],
    loans = [],
    operationalAlerts = []
  } = state;

  const weeklyNetProfit = weeklyRevenueTotal - weeklyExpensesTotal;

  // Real-time Active Alerts (synthesizes server alerts + live schedule matrix unstaffed open hours)
  const activeAlerts = useMemo(() => {
    const list = [...(operationalAlerts || [])];

    // Inspect all businesses for open hours with 0 cashiers assigned
    businesses.forEach(b => {
      if (!b.scheduleWeek) return;
      const unstaffedDaysList: { day: string; hours: number[] }[] = [];

      b.scheduleWeek.forEach((sd: any) => {
        if (!sd.isOpen) return;
        const missingHours: number[] = [];

        for (let h = 0; h < 24; h++) {
          const isHourActuallyOpen = Array.isArray(sd.hoursOpen) && sd.hoursOpen.length === 24
            ? !!sd.hoursOpen[h]
            : (sd.startHour !== undefined && sd.endHour !== undefined && sd.startHour !== -1 && h >= sd.startHour && h < sd.endHour);

          if (!isHourActuallyOpen) continue;

          const activeCashiers = (sd.shifts || []).filter((s: any) => {
            if (h < s.startHour || h >= s.endHour) return false;
            const empObj = employees.find(e => e.id === s.employeeId || e.name === s.employeeName);
            const skill = (s.skillName || empObj?.primarySkillName || '').toLowerCase();
            const role = (s.role || '').toLowerCase();
            const station = ((s as any).stationName || '').toLowerCase();
            if (role === 'cleaner' || skill.includes('clean') || station.includes('clean')) return false;
            if (role === 'security' || skill.includes('security') || skill.includes('guard') || station.includes('security')) return false;
            if (role === 'logistics' || skill.includes('logistic') || skill.includes('driver') || station.includes('logistic')) return false;
            return true;
          });

          if (activeCashiers.length === 0) {
            missingHours.push(h);
          }
        }

        if (missingHours.length > 0) {
          unstaffedDaysList.push({ day: sd.day.slice(0, 3), hours: missingHours });
        }
      });

      if (unstaffedDaysList.length > 0) {
        const totalMissingCount = unstaffedDaysList.reduce((acc, d) => acc + d.hours.length, 0);
        list.unshift({
          id: `unstaffed_open_${b.id}`,
          location: b.name,
          type: 'unstaffed',
          severity: 'critical',
          message: `Store is open with 0 cashiers assigned across ${totalMissingCount} hours on ${unstaffedDaysList.map(d => `${d.day} (${d.hours.map(h => `${h}h`).join(', ')})`).join(', ')}. Customers walk out with zero sales.`
        });
      }
    });

    return list.filter(a => !dismissedAlerts.includes(a.id || a.location + a.message));
  }, [operationalAlerts, businesses, employees, dismissedAlerts]);

  // Trigger Phone-Style Notification Pop-up and Audio Chime on New Alert
  useEffect(() => {
    if (activeAlerts.length === 0) return;

    const currentIds = new Set(activeAlerts.map(a => a.id || `${a.location}_${a.type}_${a.message}`));

    if (isInitialLoadRef.current) {
      // Don't blast sound on initial page load, but track existing alerts
      prevAlertIdsRef.current = currentIds;
      isInitialLoadRef.current = false;
      return;
    }

    // Find if there is any newly added alert
    const newAlert = activeAlerts.find(a => !prevAlertIdsRef.current.has(a.id || `${a.location}_${a.type}_${a.message}`));

    if (newAlert) {
      if (notificationSoundEnabled) {
        playNotificationChime();
      }

      if (bannerPopupsEnabled) {
        setActiveToast(newAlert);
      }

      prevAlertIdsRef.current = currentIds;
    } else {
      prevAlertIdsRef.current = currentIds;
    }
  }, [activeAlerts, notificationSoundEnabled, bannerPopupsEnabled]);

  // Auto-dismiss active toast notification after 5.5 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 5500);
    return () => clearTimeout(timer);
  }, [activeToast]);

  // Selected store for dedicated command room
  const activeStore = useMemo(() => {
    if (!selectedStoreId) return null;
    return businesses.find(b => b.id === selectedStoreId) || null;
  }, [selectedStoreId, businesses]);

  // Find business static definition from compendium
  const activeStoreDef = useMemo(() => {
    if (!activeStore) return null;
    const cleanRaw = activeStore.rawType.replace('ba:businesstype_', '').toLowerCase().replace(/[^a-z0-9]/g, '');
    return (rawBusinesses as any[]).find(b => {
      const bClean = (b.raw_id || b.id || '').replace('ba:businesstype_', '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return bClean === cleanRaw || b.name.toLowerCase() === activeStore.type.toLowerCase();
    }) || null;
  }, [activeStore]);

  // Precise deterministic calculation of extra revenue & profit for unstocked products
  const unstockedProductOpportunities = useMemo(() => {
    if (!activeStore || !activeStoreDef || !activeStoreDef.products) return [];
    const currentSoldItems = new Set(
      (activeStore.retailPrices || []).map(rp => 
        rp.rawItemName.replace('ba:itemname_', '').replace('ba:item_', '').toLowerCase().replace(/[^a-z0-9]/g, '')
      )
    );

    const storeCapacity = activeStore.customerCapacity || 30;
    const dailyCust = activeStore.todayCustomerCount && activeStore.todayCustomerCount > 0 
      ? activeStore.todayCustomerCount 
      : Math.round(storeCapacity * 0.8 * 12); // fallback realistic daily foot traffic

    return (activeStoreDef.products as any[])
      .filter(p => {
        const pIdClean = (p.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return !currentSoldItems.has(pIdClean) && !pIdClean.includes('paperbag') && !pIdClean.includes('plasticbag');
      })
      .map(p => {
        const salesRatio = p.impact || 1.0;
        // Estimated daily sales units = daily foot traffic * conversion ratio * product demand weight
        const estDailyUnits = Math.max(8, Math.round(dailyCust * 0.28 * salesRatio));
        const estDailyRevenue = Math.round(estDailyUnits * p.default_market_price);
        const estDailyProfit = Math.round(estDailyUnits * (p.default_market_price - p.wholesale_price));

        return {
          ...p,
          estDailyUnits,
          estDailyRevenue,
          estDailyProfit
        };
      });
  }, [activeStore, activeStoreDef]);

  // Sorted commercial businesses
  const sortedBusinesses = useMemo(() => {
    return [...businesses].sort((a, b) => {
      if (businessSortBy === 'profit') return (b.weeklyProfit || b.dailyProfit) - (a.weeklyProfit || a.dailyProfit);
      if (businessSortBy === 'revenue') return (b.weeklyRevenue || b.dailyRevenue) - (a.weeklyRevenue || a.dailyRevenue);
      return b.customerSatisfaction - a.customerSatisfaction;
    });
  }, [businesses, businessSortBy]);

  // High-value detected opportunities across all actionable empire levers
  const opportunities = useMemo(() => {
    const opps: { id: string; title: string; location: string; current: string; recommended: string; weeklyImpact: number; category: string; description: string }[] = [];

    businesses.forEach(b => {
      // 1. Pricing Optimization Levers
      if (b.retailPrices) {
        b.retailPrices.forEach(rp => {
          const diff = rp.optimalPrice - rp.currentPrice;
          if (diff > 0.15) {
            const cleanTitle = (rp.displayName || rp.rawItemName)
              .replace('ba:itemname_', '')
              .replace('ba:item_', '')
              .replace(/_/g, ' ')
              .trim();
            const estWeeklySalesUnits = 240;
            const estImpact = Math.round(diff * estWeeklySalesUnits);
            opps.push({
              id: `pricing_${b.id}_${rp.rawItemName}`,
              title: `Optimize ${cleanTitle} Price`,
              location: b.name,
              current: `$${rp.currentPrice.toFixed(2)}`,
              recommended: `$${rp.optimalPrice.toFixed(2)}`,
              weeklyImpact: estImpact,
              category: 'Pricing',
              description: `Raise price to match market willingness to pay without losing demand.`
            });
          } else if (rp.currentPrice > rp.maxMarketCeiling + 0.10) {
            const cleanTitle = (rp.displayName || rp.rawItemName).replace(/_/g, ' ');
            opps.push({
              id: `overpriced_${b.id}_${rp.rawItemName}`,
              title: `Lower Overpriced ${cleanTitle}`,
              location: b.name,
              current: `$${rp.currentPrice.toFixed(2)}`,
              recommended: `$${rp.optimalPrice.toFixed(2)}`,
              weeklyImpact: 150,
              category: 'Pricing',
              description: `Price exceeds district ceiling, damaging price satisfaction rating.`
            });
          }
        });
      }

      // 2. Customer Service & Cashier Skill Lever
      if (b.satisfactionBreakdown && b.satisfactionBreakdown.customerService < 80) {
        const potentialRevenueGain = Math.round((b.weeklyRevenue || 3000) * 0.12);
        opps.push({
          id: `service_${b.id}`,
          title: `Train Cashiers to 100% Skill`,
          location: b.name,
          current: `${b.satisfactionBreakdown.customerService}% CS`,
          recommended: `100% Vocational Skill`,
          weeklyImpact: potentialRevenueGain,
          category: 'Workforce',
          description: `Customer service score is pulling down overall store satisfaction.`
        });
      }

      // 3. Cleanliness & Dirty Store Alert Lever
      if (b.satisfactionBreakdown && b.satisfactionBreakdown.cleanliness < 75) {
        const potentialRevenueGain = Math.round((b.weeklyRevenue || 3000) * 0.15);
        opps.push({
          id: `clean_${b.id}`,
          title: `Schedule Dedicated Cleaning Shift`,
          location: b.name,
          current: `${b.satisfactionBreakdown.cleanliness}% Cleanliness`,
          recommended: `100% Cleanliness`,
          weeklyImpact: potentialRevenueGain,
          category: 'Operations',
          description: `Dirty store reduces customer retention and satisfaction rating.`
        });
      }

      // 4. Marketing & Traffic Expansion Lever
      if (b.promotion && b.promotion.marketing === 0) {
        const potentialGrowth = Math.round((b.weeklyRevenue || 3000) * 0.20);
        opps.push({
          id: `marketing_${b.id}`,
          title: `Launch District Marketing Campaign`,
          location: b.name,
          current: `0% Marketing`,
          recommended: `+20% Traffic Multiplier`,
          weeklyImpact: potentialGrowth,
          category: 'Marketing',
          description: `Store relies solely on natural foot traffic; marketing can unlock +20% foot traffic.`
        });
      }

        // 5. Consolidated Unstaffed Open Hours Gaps & Unopened Windows per Store (Accurate Hourly Sum)
        if (b.scheduleWeek) {
          const cleanRawType = (b.rawType || b.type || '').replace('ba:businesstype_', '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const staticDef = (rawBusinesses as any[]).find(sbd => {
            const sbdClean = (sbd.raw_id || sbd.id || '').replace('ba:businesstype_', '').toLowerCase().replace(/[^a-z0-9]/g, '');
            return sbdClean === cleanRawType || sbd.name.toLowerCase() === b.type.toLowerCase();
          });

          const peakHours: number[] = staticDef?.operating_schedule?.peak_hours || [12, 13, 18, 19];
          const hourlyCurve: number[] = staticDef?.operating_schedule?.hourly_multipliers || Array(24).fill(0.5);
          const dayMultipliers: Record<string, number> = staticDef?.operating_schedule?.day_multipliers || {};
          
          // Calculate average revenue per customer from active products or category defaults
          let avgBasketSpend = 15;
          if (b.retailPrices && b.retailPrices.length > 0) {
            const validPrices = b.retailPrices.filter(rp => rp.currentPrice > 0);
            if (validPrices.length > 0) {
              const sumP = validPrices.reduce((acc, rp) => acc + rp.currentPrice, 0);
              avgBasketSpend = Math.max(8, (sumP / validPrices.length) * 1.8);
            }
          }

          const storeCapacity = b.customerCapacity || 30;
          const unstaffedDaysMap: { day: string; hours: number[] }[] = [];
          let totalUnstaffedHoursCount = 0;
          let totalLostSalesSum = 0;

          const closedPeakDaysList: string[] = [];
          let totalClosedPeakGainSum = 0;

          b.scheduleWeek.forEach((sd: any) => {
            const dayFactor = dayMultipliers[sd.day] || 1.0;

            if (sd.isOpen) {
              const missingHours: number[] = [];

              for (let h = 0; h < 24; h++) {
                const isHourActuallyOpen = Array.isArray(sd.hoursOpen) && sd.hoursOpen.length === 24
                  ? !!sd.hoursOpen[h]
                  : (sd.startHour !== undefined && sd.endHour !== undefined && sd.startHour !== -1 && h >= sd.startHour && h < sd.endHour);

                if (!isHourActuallyOpen) continue;

                const activeCashiers = (sd.shifts || []).filter((s: any) => {
                  if (h < s.startHour || h >= s.endHour) return false;
                  const empObj = employees.find(e => e.id === s.employeeId || e.name === s.employeeName);
                  const skill = (s.skillName || empObj?.primarySkillName || '').toLowerCase();
                  const role = (s.role || '').toLowerCase();
                  const station = ((s as any).stationName || '').toLowerCase();
                  if (role === 'cleaner' || skill.includes('clean') || station.includes('clean')) return false;
                  if (role === 'security' || skill.includes('security') || skill.includes('guard') || station.includes('security')) return false;
                  if (role === 'logistics' || skill.includes('logistic') || skill.includes('driver') || station.includes('logistic')) return false;
                  return true;
                });

                if (activeCashiers.length === 0) {
                  missingHours.push(h);
                  totalUnstaffedHoursCount++;
                  const hourMultiplier = hourlyCurve[h] || 0.6;
                  const expectedCustomersInHour = Math.round(storeCapacity * hourMultiplier * dayFactor);
                  const lostRevInHour = expectedCustomersInHour * avgBasketSpend;
                  totalLostSalesSum += lostRevInHour;
                }
              }

              if (missingHours.length > 0) {
                unstaffedDaysMap.push({ day: sd.day.slice(0, 3), hours: missingHours });
              }
            } else {
              if (dayFactor >= 0.85) {
                closedPeakDaysList.push(sd.day.slice(0, 3));
                peakHours.forEach(ph => {
                  const hourMultiplier = hourlyCurve[ph] || 0.8;
                  const expectedCust = Math.round(storeCapacity * hourMultiplier * dayFactor);
                  totalClosedPeakGainSum += expectedCust * avgBasketSpend;
                });
              }
            }
          });

          // 1 consolidated opportunity for all unstaffed open days with accurate hourly summation
          if (unstaffedDaysMap.length > 0 && totalLostSalesSum > 0) {
            opps.push({
              id: `unstaffed_open_${b.id}`,
              title: `Staff Open Shifts on ${unstaffedDaysMap.map(d => d.day).join(', ')}`,
              location: b.name,
              current: `0 cashiers across ${totalUnstaffedHoursCount} open hrs`,
              recommended: `Assign cashiers`,
              weeklyImpact: Math.max(1200, Math.round(totalLostSalesSum)),
              category: 'Scheduling',
              description: `Store is open with 0 cashiers across ${totalUnstaffedHoursCount} open hours on ${unstaffedDaysMap.map(d => `${d.day} (${d.hours.map(h => `${h}h`).join(', ')})`).join(', ')}. Customers walk out with zero sales.`
            });
          }

        // 1 consolidated alert for closed high-traffic days with accurate summation
        if (closedPeakDaysList.length > 0 && totalClosedPeakGainSum > 0) {
          opps.push({
            id: `peak_closed_${b.id}`,
            title: `Open on High-Traffic Days (${closedPeakDaysList.join(', ')})`,
            location: b.name,
            current: `Closed all day`,
            recommended: `Open rush window (${peakHours[0]}:00-${peakHours[peakHours.length - 1] + 1}:00)`,
            weeklyImpact: Math.round(totalClosedPeakGainSum),
            category: 'Operating Hours',
            description: `${closedPeakDaysList.join(', ')} have strong customer traffic in ${b.district}. Opening during peak hours unlocks extra market sales.`
          });
        }

        // 6. Optimal Compendium Operating Window Mismatch Opportunity (Shows on Decision Analyzer as a growth lever)
        const recommendedWindow = staticDef?.operating_schedule?.recommended_opening_window;
        if (recommendedWindow) {
          const nonOptimalDays: { day: string; missingHours: number[] }[] = [];
          b.scheduleWeek.forEach(sd => {
            if (sd.isOpen) {
              const dayFactor = dayMultipliers[sd.day] ?? 0.85;
              const profitableHours: number[] = [];
              for (let h = 0; h < 24; h++) {
                if ((hourlyCurve[h] || 0) * dayFactor >= 0.20) {
                  profitableHours.push(h);
                }
              }

              const missing = profitableHours.filter(h => {
                const isOpen = Array.isArray(sd.hoursOpen) && sd.hoursOpen.length === 24
                  ? !!sd.hoursOpen[h]
                  : (sd.startHour !== undefined && sd.endHour !== undefined && sd.startHour !== -1 && h >= sd.startHour && h < sd.endHour);
                return !isOpen;
              });

              if (missing.length > 0) {
                nonOptimalDays.push({ day: sd.day.slice(0, 3), missingHours: missing });
              }
            }
          });

          if (nonOptimalDays.length > 0) {
            const totalMissingHoursCount = nonOptimalDays.reduce((acc, d) => acc + d.missingHours.length, 0);
            const estWeeklyGain = Math.round(totalMissingHoursCount * (storeCapacity * 0.7 * avgBasketSpend));
            opps.push({
              id: `suboptimal_window_${b.id}`,
              title: `Expand Operating Hours on ${nonOptimalDays.map(d => d.day).join(', ')}`,
              location: b.name,
              current: `${totalMissingHoursCount} profitable rush hrs closed`,
              recommended: `${recommendedWindow} (Compendium Benchmark)`,
              weeklyImpact: Math.max(800, estWeeklyGain),
              category: 'Operating Hours',
              description: `Store is closed during profitable rush hours on ${nonOptimalDays.map(d => `${d.day} (${d.missingHours.map(h => `${h}h`).join(', ')})`).join(', ')}. Opening during these hours captures significant demand.`
            });
          }
        }
      }
    });

    return opps.sort((a, b) => b.weeklyImpact - a.weeklyImpact);
  }, [businesses]);

  return (
    <div className="space-y-6 relative">
      {/* Top-Center Smartphone Style Notification Banner */}
      {activeToast && (() => {
        const targetBiz = businesses.find(b => b.name.toLowerCase() === activeToast.location.toLowerCase() || activeToast.location.toLowerCase().includes(b.name.toLowerCase()));
        const targetWarehouse = warehouses.find(w => w.address.toLowerCase() === activeToast.location.toLowerCase() || activeToast.location.toLowerCase().includes(w.address.toLowerCase()));
        const destinationUrl = targetBiz 
          ? `/live-sync?view=stores&store=${targetBiz.id}` 
          : targetWarehouse 
          ? `/live-sync?view=logistics` 
          : null;

        return (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 animate-in slide-in-from-top-6 fade-in duration-300 pointer-events-auto">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1B18] border border-[var(--border-strong)] shadow-2xl flex items-start gap-3.5 backdrop-blur-md">
              <div className={`p-2 rounded-xl shrink-0 ${activeToast.severity === 'critical' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
                <Bell className="w-5 h-5 animate-bounce" />
              </div>
              
              {destinationUrl ? (
                <Link
                  href={destinationUrl}
                  onClick={() => setActiveToast(null)}
                  className="flex-1 space-y-0.5 text-xs text-left group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--text-main)] text-sm group-hover:text-emerald-500 transition-colors flex items-center gap-1">
                        <span>{activeToast.location}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </span>
                      <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-subtle)]">
                        {activeToast.type}
                      </span>
                    </div>
                  </div>
                  <p className="text-[var(--text-muted)] text-xs leading-relaxed line-clamp-2 group-hover:text-[var(--text-main)] transition-colors">
                    {activeToast.message}
                  </p>
                </Link>
              ) : (
                <div className="flex-1 space-y-0.5 text-xs text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--text-main)] text-sm">{activeToast.location}</span>
                      <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-subtle)]">
                        {activeToast.type}
                      </span>
                    </div>
                  </div>
                  <p className="text-[var(--text-muted)] text-xs leading-relaxed line-clamp-2">
                    {activeToast.message}
                  </p>
                </div>
              )}

              <button
                onClick={() => setActiveToast(null)}
                className="text-[var(--text-subtle)] hover:text-[var(--text-main)] text-base leading-none p-1 cursor-pointer shrink-0"
                title="Dismiss"
              >
                &times;
              </button>
            </div>
          </div>
        );
      })()}

      {/* Operations Deck Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-base)]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <h1 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
              {activeStore ? (
                <div className="flex items-center gap-2">
                  <Link href="/live-sync?view=stores" className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                    Businesses
                  </Link>
                  <ChevronRight className="w-4 h-4 text-[var(--text-subtle)]" />
                  <span>{activeStore.name}</span>
                </div>
              ) : (
                <span>
                  {currentView === 'overview' && 'Executive Overview'}
                  {currentView === 'stores' && 'Businesses'}
                  {currentView === 'residences' && 'Properties'}
                  {currentView === 'staff' && 'Workforce'}
                  {currentView === 'logistics' && 'Warehouses'}
                  {currentView === 'finance' && 'Finance & Treasury'}
                  {currentView === 'analyzer' && 'Decision Analyzer'}
                  {currentView === 'mod' && 'Mod Telemetry'}
                </span>
              )}
            </h1>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              isDemoMode
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40 animate-pulse'
                : isConnected 
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
            }`}>
              {isDemoMode ? '🎮 DEMO PREVIEW' : isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            {isDemoMode 
              ? 'Viewing an interactive simulation of an active Day 42 empire. Reload or click Exit to return.' 
              : 'Real-time business telemetry synchronized directly with your running Big Ambitions session.'}
          </p>
        </div>

        {/* Live Game Clock, Notification Bell, Exit Demo & Resync */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Exit Demo Mode Pill Button */}
          {isDemoMode && (
            <button
              onClick={() => exitDemoMode()}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Exit Demo Mode</span>
            </button>
          )}

          {(isConnected || isDemoMode) && (
            <>
              {/* Game In-Game Clock Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-base)] text-xs font-mono">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[var(--text-muted)]">Day {gameDay}</span>
                <span className="font-bold text-[var(--text-main)]">
                  {String(gameHour).padStart(2, '0')}:{String(gameMinute).padStart(2, '0')}
                </span>
              </div>

              {/* Notification Bell Dropdown Button */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer relative flex items-center justify-center ${
                    showNotifications || activeAlerts.length > 0
                      ? 'bg-[var(--bg-surface)] border-[var(--border-strong)] text-[var(--text-main)] shadow-xs'
                      : 'bg-[var(--bg-surface)] border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                  title="Recent Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {activeAlerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center animate-pulse">
                      {activeAlerts.length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown Panel */}
                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-2xl p-4 space-y-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-emerald-500" />
                        <span className="font-bold text-xs text-[var(--text-main)]">Recent Live Notifications</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[var(--bg-base)] text-[var(--text-subtle)]">
                        {activeAlerts.length} active
                      </span>
                    </div>

                    {/* Notification Settings Bar (Mute & Disable Popups) */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[11px]">
                      <span className="font-semibold text-[var(--text-subtle)] text-[10px] uppercase tracking-wider">Alert Controls:</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleSound()}
                          className={`px-2 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
                            notificationSoundEnabled
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-[var(--bg-surface)] text-[var(--text-subtle)] border-[var(--border-base)] opacity-70'
                          }`}
                          title={notificationSoundEnabled ? 'Audio Chime is Enabled (Click to Mute)' : 'Audio Chime is Muted (Click to Unmute)'}
                        >
                          {notificationSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-500" />}
                          <span>{notificationSoundEnabled ? 'Sound ON' : 'Muted'}</span>
                        </button>

                        <button
                          onClick={() => toggleBanners()}
                          className={`px-2 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
                            bannerPopupsEnabled
                              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
                              : 'bg-[var(--bg-surface)] text-[var(--text-subtle)] border-[var(--border-base)] opacity-70'
                          }`}
                          title={bannerPopupsEnabled ? 'Pop-up Banners are Enabled (Click to Disable)' : 'Pop-up Banners are Disabled (Click to Enable)'}
                        >
                          {bannerPopupsEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5 text-rose-500" />}
                          <span>{bannerPopupsEnabled ? 'Banners ON' : 'No Popups'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                      {activeAlerts.length > 0 ? (
                        activeAlerts.map((alert) => {
                          const alertKey = alert.id || alert.location + alert.message;
                          const targetBiz = businesses.find(b => b.name.toLowerCase() === alert.location.toLowerCase() || alert.location.toLowerCase().includes(b.name.toLowerCase()));
                          const targetWarehouse = warehouses.find(w => w.address.toLowerCase() === alert.location.toLowerCase() || alert.location.toLowerCase().includes(w.address.toLowerCase()));

                          const destinationUrl = targetBiz 
                            ? `/live-sync?view=stores&store=${targetBiz.id}` 
                            : targetWarehouse 
                            ? `/live-sync?view=logistics` 
                            : null;

                          return (
                            <div
                              key={alertKey}
                              className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-2 transition-all ${
                                alert.severity === 'critical'
                                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                                  : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {destinationUrl ? (
                                <Link 
                                  href={destinationUrl}
                                  onClick={() => setShowNotifications(false)}
                                  className="space-y-0.5 flex-1 hover:opacity-80 transition-opacity cursor-pointer text-left block"
                                >
                                  <div className="font-bold flex items-center gap-1.5">
                                    <span>{alert.location}</span>
                                    <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-[var(--bg-base)] border border-[var(--border-base)]">
                                      {alert.type}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[var(--text-muted)]">{alert.message}</div>
                                </Link>
                              ) : (
                                <div className="space-y-0.5 flex-1 text-left">
                                  <div className="font-bold flex items-center gap-1.5">
                                    <span>{alert.location}</span>
                                    <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-[var(--bg-base)] border border-[var(--border-base)]">
                                      {alert.type}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-[var(--text-muted)]">{alert.message}</div>
                                </div>
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDismissedAlerts(prev => [...prev, alertKey]);
                                }}
                                className="text-[var(--text-subtle)] hover:text-[var(--text-main)] p-0.5 rounded transition-colors cursor-pointer shrink-0"
                                title="Dismiss"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-6 text-center text-xs text-[var(--text-muted)]">
                          No active operational alerts. Everything is running smoothly.
                        </div>
                      )}
                    </div>

                    {activeAlerts.length > 0 && (
                      <div className="pt-2 border-t border-[var(--border-subtle)] flex justify-end">
                        <button
                          onClick={() => setDismissedAlerts(operationalAlerts.map(a => a.id || a.location + a.message))}
                          className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                        >
                          Dismiss All
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => startDiagnosticHandshake()}
                className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] text-xs font-semibold text-[var(--text-main)] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <RotateCw className={`w-3 h-3 text-emerald-500 ${handshakeActive ? 'animate-spin' : ''}`} />
                <span>Check Connection</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* MOD VERSION MISMATCH WARNING BANNER */}
      {isConnected && state.modVersion && state.modVersion !== EXPECTED_MOD_VERSION && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 font-bold text-sm">
              ⚠️
            </div>
            <div>
              <div className="font-bold text-amber-600 dark:text-amber-400">
                Mod Version Mismatch Detected (Running v{state.modVersion} → Web expects v{EXPECTED_MOD_VERSION})
              </div>
              <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Some features (like cleaning station detection, precise shift roles, or accurate schedules) may not sync properly until you update <code className="font-mono text-amber-600 dark:text-amber-400 font-semibold">AmbitionProSync.dll</code> in your game Mods directory.
              </div>
            </div>
          </div>
          <Link
            href="/live-sync?view=mod"
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold shrink-0 transition-colors"
          >
            Download v{EXPECTED_MOD_VERSION} DLL
          </Link>
        </div>
      )}

      {/* ================= OFFLINE ONBOARDING / DIAGNOSTIC SYNC GATEWAY ================= */}
      {/* Only render once client has loaded session cache — prevents flash of gateway or empty cards */}
      {!isHydrated ? null : !isConnected && currentView !== 'mod' && !isDemoMode ? (
        <div className="max-w-2xl mx-auto py-8 space-y-6">
          {handshakeActive ? (
            /* Real Live HQ Diagnostics & Bridge Terminal */
            <div className="p-6 sm:p-7 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-[var(--border-base)] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <Wifi className={`w-4 h-4 ${!isCityLoaded ? 'animate-pulse' : ''}`} />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider font-mono">
                      Live HQ Bridge Diagnostics
                    </h2>
                    <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      Target: <code className="font-mono text-[var(--text-main)]">http://127.0.0.1:8765/</code>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {lastLatencyMs !== null && (
                    <span className="font-mono text-[10px] text-[var(--text-muted)] bg-[var(--bg-base)] px-2 py-0.5 rounded-md border border-[var(--border-base)]">
                      {lastLatencyMs}ms
                    </span>
                  )}
                  <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    isCityLoaded 
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse'
                  }`}>
                    {isCityLoaded ? 'ONLINE' : 'PROBING'}
                  </span>
                </div>
              </div>

              {/* Real Live Terminal Log Stream */}
              <div className="font-mono text-xs bg-[var(--bg-base)] p-3.5 rounded-2xl border border-[var(--border-base)] max-h-60 overflow-y-auto space-y-1.5 scrollbar-thin">
                {diagnosticLogs.map((log) => {
                  const tagColor = 
                    log.tag === 'HTTP' ? 'text-sky-500' :
                    log.tag === 'MOD' ? 'text-purple-500' :
                    log.tag === 'SAVE' ? 'text-emerald-500' :
                    log.tag === 'DATA' ? 'text-indigo-500' :
                    log.tag === 'NET' ? 'text-rose-500' : 'text-slate-400';

                  const levelColor = 
                    log.level === 'error' ? 'text-rose-500 font-bold' :
                    log.level === 'warn' ? 'text-amber-500' :
                    log.level === 'success' ? 'text-emerald-500 font-medium' : 'text-[var(--text-muted)]';

                  return (
                    <div key={log.id} className="flex items-start gap-2 text-[11px] leading-tight">
                      <span className="text-[var(--text-subtle)] shrink-0 select-none">[{log.timestamp}]</span>
                      <span className={`font-bold shrink-0 ${tagColor}`}>[{log.tag}]</span>
                      <span className={`${levelColor} break-all flex-1`}>{log.message}</span>
                    </div>
                  );
                })}

                {!isCityLoaded && (
                  <div className="text-[11px] text-emerald-500/80 animate-pulse pt-1 flex items-center gap-2">
                    <RotateCw className="w-3 h-3 animate-spin text-emerald-500" />
                    <span>Listening on 127.0.0.1:8765 for game state...</span>
                  </div>
                )}
              </div>

              {/* Status Footer with manual fallback / abort */}
              <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1">
                <span className="truncate">
                  {isCityLoaded ? '✓ All systems operational. Opening command deck...' : 'Waiting for game session...'}
                </span>
                <button
                  onClick={() => setHandshakeActive(false)}
                  className="text-[10px] text-[var(--text-subtle)] hover:text-[var(--text-main)] underline shrink-0 cursor-pointer ml-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Interactive Demo Mode Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[var(--bg-surface)] to-amber-500/5 border border-amber-500/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[var(--text-main)]">Want to test Live HQ first?</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Explore an active Day 42 empire with live schedules, analytics, and radar alerts.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => enableDemoMode()}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preview Demo</span>
                </button>
              </div>

              {/* Private Network Access (PNA) permission banner — shows when Chrome blocks the local request */}
              {!isLinkAllowed && permissionError && (
                <div className="p-4 rounded-2xl bg-rose-500/8 border border-rose-500/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Browser Permission Required</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Chrome blocked the connection to <code className="font-mono text-rose-500 text-[10px]">http://127.0.0.1:8765</code>.
                    This is a one-time security permission — you just need to allow it once.
                  </p>
                  <div className="text-[11px] font-semibold text-[var(--text-main)]">Allow in Chrome:</div>
                  <ol className="text-[11px] text-[var(--text-muted)] space-y-1 leading-relaxed">
                    <li className="flex items-start gap-1.5">
                      <span className="font-bold text-rose-500 shrink-0">1.</span>
                      <span>Click the <strong>tune / sliders icon</strong> to the left of the address bar.</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="font-bold text-rose-500 shrink-0">2.</span>
                      <span>Toggle <strong>"Apps on device"</strong> to <strong>On</strong>, then click <strong>Check Connection</strong> again.</span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Mod Connected / Load Save Tip (mod is running but no save loaded) */}
              {!permissionError && diagnosticLogs.some(l => l.tag === 'SAVE' && l.message.includes('No active save')) && (
                <div className="p-4 rounded-2xl bg-sky-500/8 border border-sky-500/30 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-500 flex items-center justify-center shrink-0 mt-0.5">
                    <Wifi className="w-3.5 h-3.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-sky-600 dark:text-sky-400">Mod connected — now load a save</div>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      The mod server is running and reachable on port 8765. Go back to Big Ambitions, load or start a city save, and this dashboard will connect automatically.
                    </p>
                  </div>
                </div>
              )}

              {/* Clean Main Connection Gateway Card */}
              <div className="p-6 sm:p-7 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-6">
                <div className="flex items-center gap-4 pb-5 border-b border-[var(--border-base)]">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <Wifi className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[var(--text-main)]">Connect Your Big Ambitions Game</h2>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Stream your empire's financials, 24h employee schedules, logistics, and real estate in real time.
                    </p>
                  </div>
                </div>

                {/* Step 1: Install Mod Options (Steam vs GitHub) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-mono font-bold text-[10px] flex items-center justify-center">1</span>
                      <span className="text-xs font-bold text-[var(--text-main)]">Choose Mod Installation</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option A: Steam Workshop (Recommended) */}
                    <div className="p-4 rounded-2xl bg-[var(--bg-base)] border-2 border-emerald-500/40 hover:border-emerald-500 transition-colors flex flex-col justify-between space-y-3 relative group">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[var(--text-main)]">Steam Workshop</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] font-bold uppercase tracking-wider">
                          Recommended
                        </span>
                      </div>

                      <a
                        href="https://steamcommunity.com/sharedfiles/filedetails/?id=3793615072"
                        target="_blank"
                        rel="noreferrer"
                        className="relative overflow-hidden w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-xs shadow-xs group/btn"
                      >
                        {/* Steam Watermark SVG Background inside button */}
                        <div className="absolute -right-3 -bottom-5 w-24 h-24 opacity-[0.16] group-hover/btn:opacity-[0.26] group-hover/btn:scale-110 transition-all pointer-events-none text-white">
                          <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                            <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.029 4.524 4.524s-2.03 4.524-4.524 4.524h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 14.819C1.94 20.06 6.728 24 12.427 24 19.07 24 24 18.627 24 11.979 24 5.331 18.622 0 11.979 0zM7.54 18.216c-.767-.317-1.132-1.2-.815-1.967.317-.768 1.202-1.133 1.968-.816.767.317 1.133 1.2.816 1.968-.318.767-1.202 1.132-1.969.815zm8.4-9.306c0-1.674 1.362-3.036 3.036-3.036 1.674 0 3.036 1.362 3.036 3.036 0 1.675-1.362 3.037-3.036 3.037-1.674 0-3.036-1.362-3.036-3.037z"/>
                          </svg>
                        </div>

                        <Download className="w-3.5 h-3.5 relative z-10" />
                        <span className="relative z-10 font-bold tracking-wide">Subscribe on Steam</span>
                        <ExternalLink className="w-3 h-3 opacity-70 ml-0.5 relative z-10" />
                      </a>
                    </div>

                    {/* Option B: GitHub Release (MelonLoader / Manual) */}
                    <div className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] hover:border-[var(--border-strong)] transition-colors flex flex-col justify-between space-y-3 group">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[var(--text-main)]">Standalone (MelonLoader)</span>
                      </div>

                      <a
                        href="/downloads/AmbitionProSync-Mod.zip"
                        download="AmbitionProSync-Mod.zip"
                        className="relative overflow-hidden w-full py-3 px-4 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] text-[var(--text-main)] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-xs group/btn"
                      >
                        {/* GitHub Watermark SVG Background inside button */}
                        <div className="absolute -right-3 -bottom-5 w-24 h-24 opacity-[0.09] dark:opacity-[0.14] group-hover/btn:opacity-[0.20] group-hover/btn:scale-110 transition-all pointer-events-none text-current">
                          <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                          </svg>
                        </div>

                        <Download className="w-3.5 h-3.5 text-[var(--text-muted)] relative z-10" />
                        <span className="relative z-10 font-bold tracking-wide">Download MelonLoader Zip</span>
                        <ExternalLink className="w-3 h-3 opacity-60 ml-0.5 relative z-10" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Step 2: Launch & Connect */}
                <div className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-mono font-bold text-[10px] flex items-center justify-center">2</span>
                    <span className="text-xs font-bold text-[var(--text-main)]">Launch Game &amp; Connect</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-[var(--text-muted)] text-[11px]">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                      <span>Broadcast endpoint: <code className="font-mono text-[var(--text-main)]">http://127.0.0.1:8765/</code></span>
                    </div>
                    <button
                      onClick={() => startDiagnosticHandshake()}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs shrink-0"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${handshakeActive ? 'animate-spin' : ''}`} />
                      <span>Check Connection</span>
                    </button>
                  </div>
                </div>

                {/* Browser 1-Time Local Network Permission Instructions */}
                <div className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] text-xs space-y-3">
                  <div className="font-bold flex items-center justify-between text-[var(--text-main)] text-xs">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>1-Time Browser Security Permission</span>
                    </div>
                    <span className="text-[10px] text-[var(--text-subtle)] font-normal">Chrome, Brave, Edge &amp; Firefox</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    {/* Chrome / Chromium */}
                    <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
                      <div className="font-bold text-[var(--text-main)] flex items-center gap-1">
                        <span>Google Chrome / Brave / Edge</span>
                      </div>
                      <ol className="text-[11px] text-[var(--text-muted)] leading-relaxed space-y-1 pl-0.5">
                        <li className="flex items-start gap-1.5">
                          <span className="font-bold text-[var(--text-main)] shrink-0">1.</span>
                          <span>Click the <strong>tune / sliders icon</strong> on the left side of the address bar.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="font-bold text-[var(--text-main)] shrink-0">2.</span>
                          <span>Toggle <strong>&ldquo;Apps on device&rdquo;</strong> to <strong>On</strong>.</span>
                        </li>
                      </ol>
                    </div>

                    {/* Mozilla Firefox */}
                    <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
                      <div className="font-bold text-[var(--text-main)] flex items-center gap-1">
                        <span>Mozilla Firefox</span>
                      </div>
                      <ol className="text-[11px] text-[var(--text-muted)] leading-relaxed space-y-1 pl-0.5">
                        <li className="flex items-start gap-1.5">
                          <span className="font-bold text-[var(--text-main)] shrink-0">1.</span>
                          <span>Click the <strong>shield / padlock icon</strong> on the left of the address bar.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="font-bold text-[var(--text-main)] shrink-0">2.</span>
                          <span>Turn <strong>&ldquo;Enhanced Tracking Protection&rdquo;</strong> <strong>OFF</strong> for this site to allow local loopback.</span>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>

              {/* Link to Dedicated Security & Architecture Breakdown */}
              <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] flex items-center justify-between gap-4 text-xs shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[var(--text-main)]">How does Live Sync work safely?</h4>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      100% offline loopback, read-only memory sampling, and zero save file modifications.
                    </p>
                  </div>
                </div>

                <Link
                  href="/live-architecture"
                  className="px-3 py-1.5 rounded-xl bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] text-[var(--text-main)] font-semibold text-xs transition-colors shrink-0 flex items-center gap-1"
                >
                  <span>Read Safety Specs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          {/* Store-Specific Contextual Alerts (Only shows alerts for the store/view you are currently looking at) */}
          {(() => {
            const relevantAlerts = activeAlerts.filter(alert => {
              if (activeStore) {
                return alert.location.toLowerCase() === activeStore.name.toLowerCase() || 
                       alert.location.toLowerCase().includes(activeStore.name.toLowerCase());
              }
              // If not in a specific store view, don't spam global alerts across the top of every tab
              return false;
            });

            if (relevantAlerts.length === 0) return null;

            return (
              <div className="space-y-2">
                {relevantAlerts.map((alert) => {
                  const alertKey = alert.id || alert.location + alert.message;

                  return (
                    <div 
                      key={alertKey} 
                      className={`p-3.5 rounded-2xl flex items-start justify-between gap-3 text-xs border transition-all ${
                        alert.severity === 'critical' 
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400' 
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 flex-1 text-left">
                        <Bell className="w-4 h-4 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <div className="font-bold flex items-center gap-2">
                            <span>{alert.location}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[var(--bg-base)] border border-[var(--border-base)]">
                              {alert.type}
                            </span>
                          </div>
                          <div className="text-[var(--text-muted)] font-normal">{alert.message}</div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDismissedAlerts(prev => [...prev, alertKey]);
                        }}
                        className="text-[var(--text-subtle)] hover:text-[var(--text-main)] p-1 rounded transition-colors cursor-pointer shrink-0"
                        title="Dismiss notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* ================= DEDICATED STORE COMMAND ROOM & PRICE OPTIMIZER ================= */}
          {activeStore ? (
            <div className="space-y-6">
              {/* Store Command Header & Compact Twin KPI Panes */}
              <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-4 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                {renderBusinessLogo(activeStore, 'w-14 h-14')}
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${activeStore.isOpenNow ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <h2 className="text-base font-bold text-[var(--text-main)]">{activeStore.name}</h2>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-base)] border border-[var(--border-base)] font-semibold text-[var(--text-subtle)]">
                      {activeStore.type}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)] mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[var(--text-main)]">{activeStore.address}</span>
                    <span>•</span>
                    <span>{activeStore.district}</span>
                    <span>•</span>
                    <span className="text-sky-600 dark:text-sky-400 font-semibold">{activeStore.staffOnDuty} Staff Scheduled</span>
                  </div>
                </div>
              </div>

              {/* Condensed Financial Metrics */}
              <div className="flex items-center gap-2">
                <div className="px-3.5 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-center min-w-24">
                  <div className="text-[9px] uppercase font-bold text-[var(--text-subtle)]">Weekly Sales</div>
                  <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ${(activeStore.weeklyRevenue || 0).toLocaleString()}
                  </div>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-center min-w-24">
                  <div className="text-[9px] uppercase font-bold text-[var(--text-subtle)]">Weekly Profit</div>
                  <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ${(activeStore.weeklyProfit || 0).toLocaleString()}
                  </div>
                </div>
                <div className="px-3.5 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-center min-w-24">
                  <div className="text-[9px] uppercase font-bold text-[var(--text-subtle)]">Overall Score</div>
                  <div className={`text-sm font-bold font-mono mt-0.5 ${
                    activeStore.customerSatisfaction >= 80 ? 'text-emerald-500' : activeStore.customerSatisfaction >= 60 ? 'text-amber-500' : 'text-rose-500'
                  }`}>
                    {activeStore.customerSatisfaction}%
                  </div>
                </div>
              </div>
            </div>

            {/* Twin Compact Grids: Satisfaction Matrix (Left) + Marketing & Foot Traffic (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3 border-t border-[var(--border-subtle)]">
              {/* Pillar 1: In-Game Satisfaction Factors */}
              {activeStore.satisfactionBreakdown && (
                <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Satisfaction Pillars</span>
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-subtle)]">Score: {activeStore.customerSatisfaction}%</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                      <div className="text-[10px] text-[var(--text-subtle)]">Service</div>
                      <div className="font-mono font-bold text-sky-500 text-xs mt-0.5">{activeStore.satisfactionBreakdown.customerService}%</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                      <div className="text-[10px] text-[var(--text-subtle)]">Clean</div>
                      <div className="font-mono font-bold text-emerald-500 text-xs mt-0.5">{activeStore.satisfactionBreakdown.cleanliness}%</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                      <div className="text-[10px] text-[var(--text-subtle)]">Pricing</div>
                      <div className="font-mono font-bold text-amber-500 text-xs mt-0.5">{activeStore.satisfactionBreakdown.pricing}%</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                      <div className="text-[10px] text-[var(--text-subtle)]">Interior</div>
                      <div className="font-mono font-bold text-indigo-500 text-xs mt-0.5">{activeStore.satisfactionBreakdown.facility || 100}%</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pillar 2: Promotion & Foot Traffic Multipliers */}
              {activeStore.promotion && (
                <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
                      <Megaphone className="w-3.5 h-3.5 text-sky-500" />
                      <span>Traffic Multipliers</span>
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-subtle)]">Total Promotion: {activeStore.promotion.total}%</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                      <div className="text-[10px] text-[var(--text-subtle)]">Natural Traffic</div>
                      <div className="font-mono font-bold text-[var(--text-main)] text-xs mt-0.5">{activeStore.promotion.trafficIndex}%</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                      <div className="text-[10px] text-[var(--text-subtle)]">Marketing Multiplier</div>
                      <div className="font-mono font-bold text-sky-600 dark:text-sky-400 text-xs mt-0.5">
                        +{activeStore.promotion.marketing}%
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                      <div className="text-[10px] text-[var(--text-subtle)]">Expansion Potential</div>
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                        {activeStore.promotion.marketing === 0 ? '+20%' : 'Active'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SIDE-BY-SIDE TWIN CARDS: ACTIVE PRODUCT PRICING & EXPANSION OPPORTUNITIES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Card 1: Active Product Pricing & Margins */}
            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-bold text-[var(--text-main)]">Active Prices &amp; Margins</h3>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-subtle)]">
                  {activeStore.retailPrices?.length || 0} Products Sold
                </span>
              </div>

              <div className="border border-[var(--border-base)] rounded-xl overflow-hidden bg-[var(--bg-base)]">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase">
                    <tr>
                      <th className="py-2 px-3">Item</th>
                      <th className="py-2 px-2 text-center">Stock</th>
                      <th className="py-2 px-2 text-center">Depletion / Runout</th>
                      <th className="py-2 px-2 text-right">Price</th>
                      <th className="py-2 px-2 text-right">Optimal</th>
                      <th className="py-2 px-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                    {activeStore.retailPrices && activeStore.retailPrices.length > 0 ? (
                      activeStore.retailPrices.map(rp => {
                        const cleanTitle = (rp.displayName || rp.rawItemName)
                          .replace('ba:itemname_', '')
                          .replace('ba:item_', '')
                          .replace('ba:item', '')
                          .replace(/_/g, ' ')
                          .trim();

                        const iconSrc = getItemImageSrc(rp.rawItemName);
                        const isKabob = cleanTitle.toLowerCase().includes('kabob');
                        const currentP = rp.currentPrice;
                        const optimalP = rp.optimalPrice;
                        const maxCeil = rp.maxMarketCeiling;
                        const stockUnits = (rp as any).inStoreStock ?? 0;
                        const diff = optimalP - currentP;
                        const isUnderpriced = diff > 0.15;
                        const isOverpriced = currentP > maxCeil;

                        // Calculate Daily Burn Rate from todayOrderSales or estimation
                        const salesList = (activeStore.todayOrderSales || activeStore.todayItemSales || []);
                        const matchedSale = salesList.find(
                          (s: any) => s.itemName.toLowerCase() === cleanTitle.toLowerCase() ||
                                      s.itemName.toLowerCase().includes(cleanTitle.toLowerCase()) ||
                                      cleanTitle.toLowerCase().includes(s.itemName.toLowerCase())
                        );
                        const dailySold = matchedSale ? matchedSale.amountSold : 0;
                        
                        // Estimated time out of stock calculation
                        let runoutText = '-';
                        let runoutBadgeClass = 'text-[var(--text-subtle)]';

                        if (stockUnits === 0) {
                          runoutText = 'OUT OF STOCK';
                          runoutBadgeClass = 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/30';
                        } else if (dailySold > 0) {
                          const daysLeft = stockUnits / dailySold;
                          if (daysLeft < 0.5) {
                            const hoursLeft = Math.max(1, Math.round(daysLeft * 24));
                            runoutText = `~${hoursLeft} hrs`;
                            runoutBadgeClass = 'bg-rose-500/10 text-rose-500 font-bold border border-rose-500/20';
                          } else if (daysLeft < 1.0) {
                            runoutText = `< 1 day`;
                            runoutBadgeClass = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30';
                          } else if (daysLeft <= 3.0) {
                            runoutText = `~${daysLeft.toFixed(1)} days`;
                            runoutBadgeClass = 'bg-amber-500/10 text-amber-500 font-semibold';
                          } else {
                            runoutText = `~${Math.round(daysLeft)} days`;
                            runoutBadgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium';
                          }
                        } else {
                          // No sales recorded today yet (e.g. morning or new store), estimate based on shelf stock
                          if (stockUnits < 15) {
                            runoutText = 'Low Stock';
                            runoutBadgeClass = 'bg-amber-500/10 text-amber-500';
                          } else {
                            runoutText = '> 5 days';
                            runoutBadgeClass = 'text-[var(--text-muted)]';
                          }
                        }

                        return (
                          <tr key={rp.rawItemName} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                            <td className="py-2 px-3 font-sans font-semibold text-[var(--text-main)]">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                                  {iconSrc ? (
                                    <img src={iconSrc} alt={cleanTitle} className={`w-full h-full object-contain ${isKabob ? 'scale-150 transform' : ''}`} />
                                  ) : (
                                    <Package className="w-3 h-3 text-emerald-500 opacity-70" />
                                  )}
                                </div>
                                <span className="capitalize truncate max-w-28">{cleanTitle}</span>
                              </div>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                stockUnits === 0 
                                  ? 'bg-rose-500/10 text-rose-500' 
                                  : stockUnits < 10 
                                  ? 'bg-amber-500/10 text-amber-500' 
                                  : 'bg-emerald-500/10 text-emerald-600'
                              }`}>
                                {stockUnits === 0 ? '0' : stockUnits}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap inline-block ${runoutBadgeClass}`}>
                                {runoutText}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-right font-bold text-[var(--text-main)]">
                              ${currentP.toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-right font-bold text-emerald-600 dark:text-emerald-400">
                              ${optimalP.toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {isUnderpriced && (
                                <span className="text-[9px] font-sans font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 whitespace-nowrap">
                                  +${diff.toFixed(2)}
                                </span>
                              )}
                              {isOverpriced && (
                                <span className="text-[9px] font-sans font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 whitespace-nowrap">
                                  High
                                </span>
                              )}
                              {!isUnderpriced && !isOverpriced && (
                                <span className="text-[9px] font-sans font-bold text-emerald-600">
                                  ✓
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-xs text-[var(--text-muted)] font-sans">
                          No product prices configured yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Card 2: Catalog Expansion Opportunities */}
            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-bold text-[var(--text-main)]">Expansion Opportunities</h3>
                </div>
                <span className="text-[10px] font-mono text-[var(--text-subtle)]">
                  {unstockedProductOpportunities.length} Unstocked Items
                </span>
              </div>

              {unstockedProductOpportunities.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {unstockedProductOpportunities.map((up) => {
                    const iconSrc = getItemImageSrc(up.id || up.name);
                    const isKabob = (up.id || up.name || '').toLowerCase().includes('kabob');
                    return (
                      <div key={up.id} className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                            {iconSrc ? (
                              <img 
                                src={iconSrc} 
                                alt={up.name} 
                                className={`w-full h-full object-contain ${isKabob ? 'scale-150 transform' : ''}`} 
                              />
                            ) : (
                              <Package className="w-3 h-3 text-emerald-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-[var(--text-main)]">{up.name}</div>
                            <div className="text-[10px] text-[var(--text-muted)]">
                              Wholesale: ${up.wholesale_price.toFixed(2)} &rarr; Market: ${up.default_market_price.toFixed(2)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold block text-xs">
                            +${up.estDailyRevenue}/d
                          </span>
                          <span className="text-[9px] text-[var(--text-subtle)]">
                            +${up.estDailyProfit}/d profit
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-base)] rounded-xl border border-[var(--border-base)]">
                  All category products are currently stocked in this store.
                </div>
              )}
            </div>
          </div>

          {/* PEAK HOURS OPERATING & STAFFING ADVISORY */}
          {(() => {
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
                closedPeakDays.push(sd.day);
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
                  if ((hourlyCurve[h] || 0) * dayMult >= 0.20) {
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
                    <h3 className="font-bold text-[var(--text-main)]">Operating Schedule &amp; Staffing Advisory</h3>
                  </div>
                  {recommendedWindow && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                      Compendium Benchmark: {recommendedWindow}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {unstaffedOpenList.length > 0 && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-1 text-left">
                      <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Unstaffed Open Hours ({unstaffedOpenList.length} {unstaffedOpenList.length === 1 ? 'Day' : 'Days'})</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                        Store is open with <strong>0 cashiers assigned</strong> on {unstaffedOpenList.map(u => `${u.day.slice(0,3)} (${u.hours.map(h => `${h}h`).join(', ')})`).join(', ')}. Customers walk out with zero sales.
                      </p>
                    </div>
                  )}

                  {staffedClosedList.length > 0 && (
                    <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 space-y-1 text-left">
                      <div className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Staff Scheduled While Closed ({staffedClosedList.length} {staffedClosedList.length === 1 ? 'Day' : 'Days'})</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                        Cashiers assigned while store is closed on {staffedClosedList.map(s => `${s.day.slice(0,3)} (${s.hours.map(h => `${h}h`).join(', ')})`).join(', ')}. Paying wages with zero customer foot traffic.
                      </p>
                    </div>
                  )}

                  {closedPeakDays.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1 text-left">
                      <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                        <span>Closed During Peak Days ({closedPeakDays.length} Days)</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                        Store is closed on {closedPeakDays.map(d => d.slice(0,3)).join(', ')}. Opening during rush windows ({peakHours[0]}:00 - {peakHours[peakHours.length-1]+1}:00) unlocks significant revenue.
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
                          <span>Suboptimal Opening Window</span>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </div>
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                        Store is closed during profitable rush hours on {suboptimalDays.map(d => `${d.day.slice(0,3)} (${d.missingProfitableHours.map(h => `${h}h`).join(', ')})`).join(', ')}. Click to view business blueprint &rarr;
                      </p>
                    </Link>
                  )}
                </div>
              </div>
            );
          })()}

          {/* 7-DAY 24-HOUR WEEKLY LIVE SCHEDULE & SHIFT MATRIX */}
          <ScheduleMatrixTable 
            activeStore={activeStore}
            activeStoreDef={activeStoreDef}
            employees={employees}
          />
        </div>
      ) : (
        <>
          {/* ================= VIEW 1: EXECUTIVE COMMAND OVERVIEW ================= */}
          {currentView === 'overview' && (
            <div className="space-y-6">
              {/* 1. TOP EXECUTIVE KPI RIBBON - ALL CLICKABLE TO JUMP TO TABS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Link
                  href="/live-sync?view=finance"
                  className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] hover:border-emerald-500/40 transition-all shadow-xs block group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Liquid Treasury</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-subtle)] group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <div className="text-xl font-extrabold font-mono text-[var(--text-main)] mt-1">
                    ${playerCash.toLocaleString()}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] mt-1 pt-1 border-t border-[var(--border-subtle)]">
                    <span>Bank: ${bankBalance.toLocaleString()}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
                      <span>Treasury</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>

                <Link
                  href="/live-sync?view=stores"
                  className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] hover:border-emerald-500/40 transition-all shadow-xs block group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Weekly Sales</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-subtle)] group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                    ${weeklyRevenueTotal.toLocaleString()}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] mt-1 pt-1 border-t border-[var(--border-subtle)]">
                    <span>Today: ${dailyRevenueTotal.toLocaleString()}/d</span>
                    <span className="text-sky-600 dark:text-sky-400 font-semibold flex items-center gap-0.5">
                      <span>{businesses.length} Stores</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>

                <Link
                  href="/live-sync?view=finance"
                  className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] hover:border-emerald-500/40 transition-all shadow-xs block group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Weekly Net Profit</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[var(--text-subtle)] group-hover:text-emerald-500 transition-colors" />
                  </div>
                  <div className={`text-xl font-extrabold font-mono mt-1 ${weeklyNetProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                    ${weeklyNetProfit.toLocaleString()}
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] mt-1 pt-1 border-t border-[var(--border-subtle)]">
                    <span>Drain: -${weeklyExpensesTotal.toLocaleString()}</span>
                    <span className="text-amber-500 font-semibold flex items-center gap-0.5">
                      <span>Breakdown</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>

                {/* Empire Net Worth with Mini Vitals Bars */}
                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Empire Net Worth</span>
                    <span className="text-[10px] font-mono text-[var(--text-subtle)]">Executive Vitals</span>
                  </div>
                  <div className="text-xl font-extrabold font-mono text-sky-600 dark:text-sky-400">
                    ${netWorth.toLocaleString()}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-[var(--border-subtle)]">
                    {/* Happy Bar */}
                    <div className="space-y-1" title={`Happiness: ${playerHappiness}%`}>
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <span className="text-[var(--text-subtle)]">Happy</span>
                        <span className="font-bold text-emerald-500">{playerHappiness}%</span>
                      </div>
                      <div className="w-full h-1 rounded-full bg-[var(--bg-base)] overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${playerHappiness}%` }} />
                      </div>
                    </div>
                    {/* Energy Bar */}
                    <div className="space-y-1" title={`Energy: ${playerEnergy}%`}>
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <span className="text-[var(--text-subtle)]">Energy</span>
                        <span className="font-bold text-sky-500">{playerEnergy}%</span>
                      </div>
                      <div className="w-full h-1 rounded-full bg-[var(--bg-base)] overflow-hidden">
                        <div className="h-full bg-sky-500 rounded-full" style={{ width: `${playerEnergy}%` }} />
                      </div>
                    </div>
                    {/* Food Bar */}
                    <div className="space-y-1" title={`Food / Hunger: ${playerHunger ?? 100}%`}>
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <span className="text-[var(--text-subtle)]">Food</span>
                        <span className="font-bold text-amber-500">{playerHunger ?? 100}%</span>
                      </div>
                      <div className="w-full h-1 rounded-full bg-[var(--bg-base)] overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${playerHunger ?? 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. DYNAMIC LIVE PULSE & OPERATIONS HEALTH CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Module A: Operations Health Summary */}
                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-xs font-bold text-[var(--text-main)]">Operations Pulse</h3>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-subtle)]">
                      {businesses.filter(b => b.isOpenNow).length} of {businesses.length} Stores Open
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <Link
                      href="/live-sync?view=stores"
                      className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] hover:border-emerald-500/30 flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Store className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-medium text-[var(--text-main)]">Active Stores</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {businesses.length}
                      </span>
                    </Link>

                    <Link
                      href="/live-sync?view=staff"
                      className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] hover:border-sky-500/30 flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-sky-500" />
                        <span className="font-medium text-[var(--text-main)]">Active Shift Staff</span>
                      </div>
                      <span className="font-mono font-bold text-sky-500">
                        {businesses.reduce((sum, b) => sum + (b.staffOnDuty || 0), 0)} on duty
                      </span>
                    </Link>

                    <Link
                      href="/live-sync?view=residences"
                      className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] hover:border-amber-500/30 flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-medium text-[var(--text-main)]">Real Estate Portfolio</span>
                      </div>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {residences.length + (ownedRealEstate?.length || 0)} Properties
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Module B: Real-Time Critical Alerts or All-Clear Monitor */}
                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                      <Bell className={`w-4 h-4 ${activeAlerts.length > 0 ? 'text-rose-500 animate-pulse' : 'text-emerald-500'}`} />
                      <h3 className="text-xs font-bold text-[var(--text-main)]">Live Radar &amp; Alerts</h3>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded-full ${
                      activeAlerts.length > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-600'
                    }`}>
                      {activeAlerts.length > 0 ? `${activeAlerts.length} Action Needed` : 'Clear'}
                    </span>
                  </div>

                  {activeAlerts.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {activeAlerts.slice(0, 3).map((alert, idx) => {
                        const targetBiz = businesses.find(b => b.name.toLowerCase() === alert.location.toLowerCase() || alert.location.toLowerCase().includes(b.name.toLowerCase()));
                        const targetWarehouse = warehouses.find(w => w.address.toLowerCase() === alert.location.toLowerCase() || alert.location.toLowerCase().includes(w.address.toLowerCase()));
                        const destinationUrl = targetBiz 
                          ? `/live-sync?view=stores&store=${targetBiz.id}` 
                          : targetWarehouse 
                          ? `/live-sync?view=logistics` 
                          : '/live-sync?view=stores';

                        const isCritical = alert.severity === 'critical' || alert.type === 'unstaffed' || alert.type === 'complaint';

                        return (
                          <Link
                            key={alert.id || idx}
                            href={destinationUrl}
                            className={`p-2.5 rounded-xl border text-xs space-y-0.5 text-left block transition-all hover:opacity-85 cursor-pointer ${
                              isCritical
                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                                : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            <div className="font-bold flex items-center justify-between">
                              <span className="truncate">{alert.location}</span>
                              <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-[var(--bg-base)] border border-[var(--border-base)]">
                                {alert.type}
                              </span>
                            </div>
                            <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">{alert.message}</p>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center text-center p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-1">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      <div className="text-xs font-bold text-[var(--text-main)]">100% Operational Health</div>
                      <div className="text-[10px] text-[var(--text-muted)]">No inventory stockouts, dirty stores, or shift gaps detected.</div>
                    </div>
                  )}
                </div>

                {/* Module C: Treasury & Tax Reserve Radar */}
                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-sky-500" />
                      <h3 className="text-xs font-bold text-[var(--text-main)]">Treasury &amp; Liabilities</h3>
                    </div>
                    <Link href="/live-sync?view=finance" className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 hover:underline">
                      Finance &rarr;
                    </Link>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between">
                      <span className="text-[var(--text-muted)]">Unpaid Taxes</span>
                      <span className={`font-mono font-bold ${(unpaidTaxes || 0) > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        ${(unpaidTaxes || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between">
                      <span className="text-[var(--text-muted)]">Active Bank Loans</span>
                      <span className="font-mono font-bold text-sky-500">
                        ${(totalLoans || 0).toLocaleString()}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between">
                      <span className="text-[var(--text-muted)]">Tax Deductible Drain</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ${(taxDeductibleExpenses || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. DYNAMIC OPPORTUNITY MATRIX & EMPIRE ECONOMIC BALANCE */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-500" />
                      <span>Priority Revenue Opportunities</span>
                    </h3>
                    <Link 
                      href="/live-sync?view=analyzer" 
                      className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full hover:bg-emerald-500/20 transition-colors"
                    >
                      OPEN ANALYZER &rarr;
                    </Link>
                  </div>

                  {opportunities.length > 0 ? (
                    <div className="space-y-2.5">
                      {opportunities.slice(0, 4).map(op => {
                        const targetBiz = businesses.find(b => b.name.toLowerCase() === op.location.toLowerCase());
                        const linkUrl = targetBiz ? `/live-sync?view=stores&store=${targetBiz.id}` : '/live-sync?view=stores';
                        const isWarningCategory = op.category === 'Scheduling' || op.category === 'Operating Hours';

                        return (
                          <Link 
                            key={op.id} 
                            href={linkUrl}
                            className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors group cursor-pointer block ${
                              isWarningCategory 
                                ? 'bg-amber-500/10 border-amber-500/40 hover:border-amber-500/60 text-amber-900 dark:text-amber-100' 
                                : 'bg-[var(--bg-base)] border-[var(--border-base)] hover:border-emerald-500/40'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-[var(--text-main)] flex items-center gap-2">
                                <span className={isWarningCategory ? 'text-amber-600 dark:text-amber-400 font-bold' : 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400'}>
                                  {op.title}
                                </span>
                                <span className="text-[10px] text-[var(--text-subtle)] font-normal">({op.location})</span>
                                {isWarningCategory && (
                                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30">
                                    {op.category}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[var(--text-muted)]">
                                Current: <span className={isWarningCategory ? 'text-amber-600 dark:text-amber-400 font-medium' : ''}>{op.current}</span> &rarr; Target: <strong className={isWarningCategory ? 'text-amber-600 dark:text-amber-400 font-mono font-bold' : 'text-emerald-600 dark:text-emerald-400 font-mono'}>{op.recommended}</strong>
                              </div>
                            </div>
                            <div className="text-right shrink-0 pl-3">
                              <span className={`font-mono font-bold block ${isWarningCategory ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                +${op.weeklyImpact}/wk
                              </span>
                              <span className="text-[9px] text-[var(--text-subtle)]">Estimated Gain</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-base)] rounded-xl border border-[var(--border-base)]">
                      All storefront pricing, marketing, and staffing are currently at maximum efficiency.
                    </div>
                  )}
                </div>

                {/* Empire Economic Breakdown Panel */}
                <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-sky-500" />
                      <span>Empire Weekly Flow Breakdown</span>
                    </h3>
                    <span className="text-[10px] font-mono text-[var(--text-subtle)]">
                      Margin: {weeklyRevenueTotal > 0 ? Math.round((weeklyNetProfit / weeklyRevenueTotal) * 100) : 0}%
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <Link
                      href="/live-sync?view=stores"
                      className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] hover:border-emerald-500/30 flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Store className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="font-medium">Storefront Gross Revenue</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +${weeklyBusinessRevenue.toLocaleString()}/wk
                      </span>
                    </Link>

                    <Link
                      href="/live-sync?view=residences"
                      className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] hover:border-amber-500/30 flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-amber-500" />
                        <span className="font-medium">Property Rental Net</span>
                      </div>
                      <span className={`font-mono font-bold ${weeklyResidentialNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                        {weeklyResidentialNet >= 0 ? `+$${weeklyResidentialNet.toLocaleString()}` : `-$${Math.abs(weeklyResidentialNet).toLocaleString()}`}/wk
                      </span>
                    </Link>

                    <Link
                      href="/live-sync?view=staff"
                      className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] hover:border-rose-500/30 flex items-center justify-between transition-colors group cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-rose-500" />
                        <span className="font-medium">Payroll Labor ({totalEmployees} Employees)</span>
                      </div>
                      <span className="font-mono font-bold text-rose-500">
                        -${weeklyPayrollTotal.toLocaleString()}/wk
                      </span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* 4. ACTIVE FLEET COMMAND TILES WITH INLINE STOCK HEALTH */}
              {/* 4. ACTIVE FLEET COMMAND TILES / DENSE TABLE (SCALABLE FOR HUNDREDS OF STORES) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-500" />
                    <span>Fleet Command ({businesses.length} Storefronts)</span>
                  </h3>

                  <div className="flex items-center gap-2">
                    {/* Sort Selector */}
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-base)] text-xs">
                      <button
                        onClick={() => setBusinessSortBy('profit')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                          businessSortBy === 'profit' ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        Profit
                      </button>
                      <button
                        onClick={() => setBusinessSortBy('revenue')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                          businessSortBy === 'revenue' ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        Revenue
                      </button>
                      <button
                        onClick={() => setBusinessSortBy('satisfaction')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                          businessSortBy === 'satisfaction' ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                      >
                        Rating
                      </button>
                    </div>

                    {/* View Mode Toggle: Grid vs Compact Table */}
                    <div className="flex items-center bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl p-0.5 text-xs">
                      <button
                        onClick={() => setFleetViewMode('grid')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          fleetViewMode === 'grid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                        title="Card Grid View"
                      >
                        <Boxes className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setFleetViewMode('table')}
                        className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                          fleetViewMode === 'table' ? 'bg-emerald-600 text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                        }`}
                        title="Dense Table View (Scalable for 50+ stores)"
                      >
                        <Layers className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {fleetViewMode === 'table' ? (
                  /* Compact High-Density Table for Large Empires */
                  <div className="overflow-x-auto rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-[var(--bg-base)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase select-none">
                        <tr>
                          <th className="py-2.5 px-4">Storefront</th>
                          <th className="py-2.5 px-4">District</th>
                          <th className="py-2.5 px-4 text-center">Status</th>
                          <th className="py-2.5 px-4 text-right">Weekly Revenue</th>
                          <th className="py-2.5 px-4 text-right">Weekly Profit</th>
                          <th className="py-2.5 px-4 text-center">Stock Health</th>
                          <th className="py-2.5 px-4 text-center">Rating</th>
                          <th className="py-2.5 px-4 text-right">Command</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                        {sortedBusinesses.map(b => {
                          let stockStatus = 'Well Stocked';
                          let stockBadge = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                          if (b.retailPrices && b.retailPrices.length > 0) {
                            const hasZero = b.retailPrices.some(rp => ((rp as any).inStoreStock ?? 0) === 0);
                            const hasLow = b.retailPrices.some(rp => ((rp as any).inStoreStock ?? 0) > 0 && ((rp as any).inStoreStock ?? 0) < 10);
                            if (hasZero) {
                              stockStatus = 'Stockout';
                              stockBadge = 'bg-rose-500/10 text-rose-500 border-rose-500/20';
                            } else if (hasLow) {
                              stockStatus = 'Low Stock';
                              stockBadge = 'bg-amber-500/10 text-amber-500 border-amber-500/20';
                            }
                          }

                          return (
                            <tr key={b.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                              <td className="py-2.5 px-4 font-sans font-semibold text-[var(--text-main)] flex items-center gap-2.5">
                                {renderBusinessLogo(b, 'w-6 h-6 shrink-0')}
                                <div>
                                  <div className="font-bold text-[var(--text-main)] truncate max-w-44">{b.name}</div>
                                  <div className="text-[10px] text-[var(--text-subtle)] font-normal">{b.address}</div>
                                </div>
                              </td>
                              <td className="py-2.5 px-4 font-sans text-[var(--text-muted)]">{b.district}</td>
                              <td className="py-2.5 px-4 text-center font-sans">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  b.isOpenNow ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-500/10 text-slate-500'
                                }`}>
                                  {b.isOpenNow ? 'Open' : 'Closed'}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                ${(b.weeklyRevenue || 0).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-4 text-right font-bold text-sky-600 dark:text-sky-400">
                                ${(b.weeklyProfit || 0).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-4 text-center font-sans">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stockBadge}`}>
                                  {stockStatus}
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-center font-bold text-[var(--text-main)]">
                                {b.customerSatisfaction}%
                              </td>
                              <td className="py-2.5 px-4 text-right font-sans">
                                <Link
                                  href={`/live-sync?view=stores&store=${b.id}`}
                                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] text-[var(--text-main)] font-semibold text-[11px] transition-colors inline-flex items-center gap-1"
                                >
                                  <span>Manage</span>
                                  <ChevronRight className="w-3 h-3 text-emerald-500" />
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* Grid View */
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {sortedBusinesses.map(b => {
                      let stockStatus = 'Well Stocked';
                      let stockStatusClass = 'text-emerald-600 dark:text-emerald-400';
                      if (b.retailPrices && b.retailPrices.length > 0) {
                        const hasZero = b.retailPrices.some(rp => ((rp as any).inStoreStock ?? 0) === 0);
                        const hasLow = b.retailPrices.some(rp => ((rp as any).inStoreStock ?? 0) > 0 && ((rp as any).inStoreStock ?? 0) < 10);
                        if (hasZero) {
                          stockStatus = 'Stockout Warning';
                          stockStatusClass = 'text-rose-500 font-bold';
                        } else if (hasLow) {
                          stockStatus = 'Low Stock (< 24h)';
                          stockStatusClass = 'text-amber-500 font-bold';
                        }
                      }

                      return (
                        <Link 
                          key={b.id}
                          href={`/live-sync?view=stores&store=${b.id}`}
                          className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] hover:border-emerald-500/40 transition-all space-y-3.5 shadow-xs block cursor-pointer group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {renderBusinessLogo(b, 'w-10 h-10')}
                              <div>
                                <h4 className="text-sm font-bold text-[var(--text-main)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{b.name}</h4>
                                <div className="text-xs text-[var(--text-muted)] mt-0.5">{b.address} • {b.district}</div>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              b.isOpenNow ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                            }`}>
                              {b.isOpenNow ? 'Open Now' : 'Closed'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-center text-xs">
                            <div>
                              <div className="text-[10px] text-[var(--text-subtle)]">Weekly Sales</div>
                              <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                ${(b.weeklyRevenue || 0).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-[var(--text-subtle)]">Stock Health</div>
                              <div className={`font-mono text-[11px] mt-0.5 truncate ${stockStatusClass}`}>
                                {stockStatus}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-[var(--text-subtle)]">Rating</div>
                              <div className="font-mono font-bold text-[var(--text-main)] mt-0.5">
                                {b.customerSatisfaction}%
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= VIEW 2: COMMERCIAL STOREFRONTS DIRECTORY (100+ ENTERPRISE SCALABLE) ================= */}
          {currentView === 'stores' && (() => {
            // Distinct Districts and Store Types
            const districts = Array.from(new Set(businesses.map(b => b.district).filter(Boolean))).sort();
            const storeTypes = Array.from(new Set(businesses.map(b => b.type).filter(Boolean))).sort();

            // Filter
            const filteredStores = businesses.filter(b => {
              const matchesSearch = !storeSearchQuery || 
                b.name.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
                (b.address || '').toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
                (b.district || '').toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
                (b.type || '').toLowerCase().includes(storeSearchQuery.toLowerCase());
              
              const matchesDistrict = storeDistrictFilter === 'all' || b.district === storeDistrictFilter;
              const matchesType = storeTypeFilter === 'all' || b.type === storeTypeFilter;
              const matchesStatus = storeStatusFilter === 'all' || 
                (storeStatusFilter === 'open' && b.isOpenNow) || 
                (storeStatusFilter === 'closed' && !b.isOpenNow);

              return matchesSearch && matchesDistrict && matchesType && matchesStatus;
            });

            // Sort
            const sortedStores = [...filteredStores].sort((a, b) => {
              let comp = 0;
              if (storeSortBy === 'name') comp = a.name.localeCompare(b.name);
              else if (storeSortBy === 'sales') comp = (a.weeklyRevenue || 0) - (b.weeklyRevenue || 0);
              else if (storeSortBy === 'profit') comp = (a.weeklyProfit || 0) - (b.weeklyProfit || 0);
              else if (storeSortBy === 'satisfaction') comp = (a.customerSatisfaction || 0) - (b.customerSatisfaction || 0);
              else if (storeSortBy === 'staff') comp = (a.staffOnDuty || 0) - (b.staffOnDuty || 0);
              else if (storeSortBy === 'health') {
                const aStockouts = (a.retailPrices || []).filter(p => (p as any).inStoreStock === 0).length;
                const bStockouts = (b.retailPrices || []).filter(p => (p as any).inStoreStock === 0).length;
                comp = aStockouts - bStockouts;
              }
              return storeSortOrder === 'desc' ? -comp : comp;
            });

            // Pagination
            const totalStorePages = Math.ceil(sortedStores.length / STORE_PAGE_SIZE) || 1;
            const currentStorePage = Math.min(storePage, totalStorePages);
            const paginatedStores = sortedStores.slice((currentStorePage - 1) * STORE_PAGE_SIZE, currentStorePage * STORE_PAGE_SIZE);

            // High Level Aggregates
            const totalWeeklySales = businesses.reduce((acc, b) => acc + (b.weeklyRevenue || 0), 0);
            const totalWeeklyProfits = businesses.reduce((acc, b) => acc + (b.weeklyProfit || 0), 0);
            const openStoresCount = businesses.filter(b => b.isOpenNow).length;
            const averageSatisfaction = Math.round(businesses.reduce((acc, b) => acc + (b.customerSatisfaction || 0), 0) / (businesses.length || 1));

            return (
              <div className="space-y-6">
                {/* 1. EXECUTIVE STOREFRONTS KPI RIBBON */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Active Commercial Portfolio</span>
                      <Store className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="text-xl font-bold font-mono text-[var(--text-main)]">
                      {businesses.length} <span className="text-xs font-normal text-[var(--text-subtle)]">Storefronts</span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Currently Trading:</span>
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400">{openStoresCount} Open Now</strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Total Weekly Revenue</span>
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      ${totalWeeklySales.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Average per Store:</span>
                      <strong className="font-mono text-[var(--text-main)]">${Math.round(totalWeeklySales / (businesses.length || 1)).toLocaleString()}/wk</strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Weekly Operating Profit</span>
                      <TrendingUp className="w-3.5 h-3.5 text-sky-500" />
                    </div>
                    <div className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400">
                      ${totalWeeklyProfits.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Net Commercial Margin:</span>
                      <strong className="font-mono text-sky-500">{totalWeeklySales > 0 ? Math.round((totalWeeklyProfits / totalWeeklySales) * 100) : 0}%</strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Customer Satisfaction</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="text-xl font-bold font-mono text-amber-500">
                      {averageSatisfaction}% <span className="text-xs font-normal text-[var(--text-subtle)]">Avg Score</span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Active Staff on Duty:</span>
                      <strong className="font-mono text-[var(--text-main)]">{businesses.reduce((sum, b) => sum + (b.staffOnDuty || 0), 0)} Cashiers &amp; Staff</strong>
                    </div>
                  </div>
                </div>

                {/* 2. FILTER & CONTROLS TOOLBAR */}
                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3 shadow-xs">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                      <input
                        type="text"
                        placeholder="Search store name, address, business type, or district..."
                        value={storeSearchQuery}
                        onChange={(e) => {
                          setStoreSearchQuery(e.target.value);
                          setStorePage(1);
                        }}
                        className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    {/* Filters & View Toggle */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* District Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setStoreDistrictDropdownOpen(!storeDistrictDropdownOpen);
                            setStoreTypeDropdownOpen(false);
                            setStoreStatusDropdownOpen(false);
                          }}
                          className="bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] hover:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-[var(--text-main)] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span className="truncate max-w-28">{storeDistrictFilter === 'all' ? 'All Districts' : storeDistrictFilter}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] transition-transform ${storeDistrictDropdownOpen ? 'rotate-180 text-emerald-500' : ''}`} />
                        </button>

                        {storeDistrictDropdownOpen && (
                          <div className="absolute top-full right-0 mt-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl overflow-hidden min-w-48 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 p-1 space-y-0.5">
                            <button
                              type="button"
                              onClick={() => { setStoreDistrictFilter('all'); setStoreDistrictDropdownOpen(false); setStorePage(1); }}
                              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                storeDistrictFilter === 'all' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                              }`}
                            >
                              <span>All Districts</span>
                              <span className="text-[10px] opacity-80">{businesses.length}</span>
                            </button>
                            {districts.map(d => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => { setStoreDistrictFilter(d); setStoreDistrictDropdownOpen(false); setStorePage(1); }}
                                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                  storeDistrictFilter === d ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                                }`}
                              >
                                <span className="truncate">{d}</span>
                                <span className="text-[10px] opacity-80">{businesses.filter(b => b.district === d).length}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Type Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setStoreTypeDropdownOpen(!storeTypeDropdownOpen);
                            setStoreDistrictDropdownOpen(false);
                            setStoreStatusDropdownOpen(false);
                          }}
                          className="bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] hover:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-[var(--text-main)] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Building className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span className="truncate max-w-28">{storeTypeFilter === 'all' ? 'All Types' : storeTypeFilter}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] transition-transform ${storeTypeDropdownOpen ? 'rotate-180 text-emerald-500' : ''}`} />
                        </button>

                        {storeTypeDropdownOpen && (
                          <div className="absolute top-full right-0 mt-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl overflow-hidden min-w-56 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 p-1 space-y-0.5">
                            <button
                              type="button"
                              onClick={() => { setStoreTypeFilter('all'); setStoreTypeDropdownOpen(false); setStorePage(1); }}
                              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                storeTypeFilter === 'all' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                              }`}
                            >
                              <span>All Business Types</span>
                              <span className="text-[10px] opacity-80">{businesses.length}</span>
                            </button>
                            {storeTypes.map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => { setStoreTypeFilter(t); setStoreTypeDropdownOpen(false); setStorePage(1); }}
                                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                  storeTypeFilter === t ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                                }`}
                              >
                                <span className="truncate">{t}</span>
                                <span className="text-[10px] opacity-80">{businesses.filter(b => b.type === t).length}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Status Filter */}
                      <div className="flex items-center bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl p-0.5 text-xs">
                        <button
                          onClick={() => { setStoreStatusFilter('all'); setStorePage(1); }}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                            storeStatusFilter === 'all' ? 'bg-emerald-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                          }`}
                        >
                          All ({businesses.length})
                        </button>
                        <button
                          onClick={() => { setStoreStatusFilter('open'); setStorePage(1); }}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                            storeStatusFilter === 'open' ? 'bg-emerald-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                          }`}
                        >
                          Open ({openStoresCount})
                        </button>
                      </div>

                      {/* View Mode Toggle (Table vs Grid) */}
                      <div className="flex items-center bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl p-0.5 text-xs ml-auto">
                        <button
                          onClick={() => setStoreViewMode('table')}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            storeViewMode === 'table' ? 'bg-emerald-600 text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                          }`}
                          title="Dense Table View (High-Capacity)"
                        >
                          <Layers className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setStoreViewMode('grid')}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            storeViewMode === 'grid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                          }`}
                          title="Card Grid View"
                        >
                          <Boxes className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Active Filter Counter */}
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
                    <span>
                      Showing <strong className="text-[var(--text-main)] font-mono">{paginatedStores.length}</strong> of {filteredStores.length} stores {filteredStores.length !== businesses.length && `(filtered from ${businesses.length} total)`}
                    </span>
                    {(storeSearchQuery || storeDistrictFilter !== 'all' || storeTypeFilter !== 'all' || storeStatusFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setStoreSearchQuery('');
                          setStoreDistrictFilter('all');
                          setStoreTypeFilter('all');
                          setStoreStatusFilter('all');
                          setStorePage(1);
                        }}
                        className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. DENSE HIGH-CAPACITY TABLE VIEW (DEFAULT FOR 100+ STORES) */}
                {storeViewMode === 'table' ? (
                  <div className="overflow-x-auto rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase select-none">
                        <tr>
                          {/* Store Name */}
                          <th 
                            onClick={() => {
                              if (storeSortBy === 'name') setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
                              else { setStoreSortBy('name'); setStoreSortOrder('asc'); }
                            }}
                            className="py-3 px-4 cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>Storefront</span>
                              {storeSortBy === 'name' ? (
                                storeSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                              )}
                            </div>
                          </th>

                          {/* District & Location */}
                          <th className="py-3 px-4">
                            <span>District &amp; Address</span>
                          </th>

                          {/* Business Type */}
                          <th className="py-3 px-4">
                            <span>Type</span>
                          </th>

                          {/* Weekly Sales */}
                          <th 
                            onClick={() => {
                              if (storeSortBy === 'sales') setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
                              else { setStoreSortBy('sales'); setStoreSortOrder('desc'); }
                            }}
                            className="py-3 px-4 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                          >
                            <div className="flex items-center justify-end gap-1.5">
                              <span>Weekly Sales</span>
                              {storeSortBy === 'sales' ? (
                                storeSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                              )}
                            </div>
                          </th>

                          {/* Weekly Profit */}
                          <th 
                            onClick={() => {
                              if (storeSortBy === 'profit') setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
                              else { setStoreSortBy('profit'); setStoreSortOrder('desc'); }
                            }}
                            className="py-3 px-4 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                          >
                            <div className="flex items-center justify-end gap-1.5">
                              <span>Weekly Profit</span>
                              {storeSortBy === 'profit' ? (
                                storeSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                              )}
                            </div>
                          </th>

                          {/* Satisfaction */}
                          <th 
                            onClick={() => {
                              if (storeSortBy === 'satisfaction') setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
                              else { setStoreSortBy('satisfaction'); setStoreSortOrder('desc'); }
                            }}
                            className="py-3 px-4 text-center cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <span>Satisfaction</span>
                              {storeSortBy === 'satisfaction' ? (
                                storeSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                              )}
                            </div>
                          </th>

                          {/* Staff On Duty */}
                          <th 
                            onClick={() => {
                              if (storeSortBy === 'staff') setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
                              else { setStoreSortBy('staff'); setStoreSortOrder('desc'); }
                            }}
                            className="py-3 px-4 text-center cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <span>Staff</span>
                              {storeSortBy === 'staff' ? (
                                storeSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                              )}
                            </div>
                          </th>

                          {/* Stock Health */}
                          <th 
                            onClick={() => {
                              if (storeSortBy === 'health') setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
                              else { setStoreSortBy('health'); setStoreSortOrder('desc'); }
                            }}
                            className="py-3 px-4 text-center cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <span>Inventory Status</span>
                              {storeSortBy === 'health' ? (
                                storeSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                              )}
                            </div>
                          </th>

                          {/* Action */}
                          <th className="py-3 px-4 text-right">Command</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                        {paginatedStores.length > 0 ? (
                          paginatedStores.map((b) => {
                            // Compute earliest out-of-stock alert for this storefront
                            let lowestRunout = 'Stocked';
                            let lowestRunoutClass = 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                            let hasZeroStock = false;
                            let hasLowStock = false;

                            if (b.retailPrices && b.retailPrices.length > 0) {
                              for (const rp of b.retailPrices) {
                                const stockUnits = (rp as any).inStoreStock ?? 0;
                                if (stockUnits === 0) {
                                  hasZeroStock = true;
                                  break;
                                }
                                const cleanTitle = (rp.displayName || rp.rawItemName)
                                  .replace('ba:itemname_', '')
                                  .replace('ba:item_', '')
                                  .replace('ba:item', '')
                                  .replace(/_/g, ' ')
                                  .trim();
                                const bSalesList = (b.todayOrderSales || b.todayItemSales || []);
                                const matchedSale = bSalesList.find(
                                  (s: any) => s.itemName.toLowerCase() === cleanTitle.toLowerCase() ||
                                              s.itemName.toLowerCase().includes(cleanTitle.toLowerCase()) ||
                                              cleanTitle.toLowerCase().includes(s.itemName.toLowerCase())
                                );
                                const dailySold = matchedSale ? matchedSale.amountSold : 0;
                                if (dailySold > 0) {
                                  const daysLeft = stockUnits / dailySold;
                                  if (daysLeft < 1.0) hasLowStock = true;
                                } else if (stockUnits < 10) {
                                  hasLowStock = true;
                                }
                              }

                              if (hasZeroStock) {
                                lowestRunout = 'Stockout';
                                lowestRunoutClass = 'text-rose-500 font-bold bg-rose-500/10 border-rose-500/20';
                              } else if (hasLowStock) {
                                lowestRunout = '< 24h Buffer';
                                lowestRunoutClass = 'text-amber-500 font-bold bg-amber-500/10 border-amber-500/20';
                              }
                            }

                            return (
                              <tr key={b.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                                <td className="py-2.5 px-4 font-sans font-semibold text-[var(--text-main)]">
                                  <Link 
                                    href={`/live-sync?view=stores&store=${b.id}`}
                                    className="flex items-center gap-3 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                  >
                                    {renderBusinessLogo(b, 'w-8 h-8')}
                                    <div className="truncate">
                                      <div className="font-bold truncate max-w-48">{b.name}</div>
                                      <div className="text-[10px] text-[var(--text-subtle)] flex items-center gap-1.5 font-mono font-normal">
                                        <span className={`w-1.5 h-1.5 rounded-full ${b.isOpenNow ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                        <span>{b.isOpenNow ? 'Open Now' : 'Closed'}</span>
                                      </div>
                                    </div>
                                  </Link>
                                </td>

                                <td className="py-2.5 px-4 font-sans text-[var(--text-muted)]">
                                  <div className="truncate max-w-44 text-xs">{b.address}</div>
                                  <div className="text-[10px] text-[var(--text-subtle)]">{b.district}</div>
                                </td>

                                <td className="py-2.5 px-4 font-sans">
                                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-muted)] font-medium truncate max-w-36 inline-block">
                                    {b.type}
                                  </span>
                                </td>

                                <td className="py-2.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                  ${(b.weeklyRevenue || 0).toLocaleString()}
                                </td>

                                <td className="py-2.5 px-4 text-right font-bold text-sky-600 dark:text-sky-400">
                                  ${(b.weeklyProfit || 0).toLocaleString()}
                                </td>

                                <td className="py-2.5 px-4 text-center font-bold">
                                  <span className={b.customerSatisfaction >= 80 ? 'text-emerald-500' : b.customerSatisfaction >= 60 ? 'text-amber-500' : 'text-rose-500'}>
                                    {b.customerSatisfaction}%
                                  </span>
                                </td>

                                <td className="py-2.5 px-4 text-center font-bold text-[var(--text-main)]">
                                  {b.staffOnDuty}
                                </td>

                                <td className="py-2.5 px-4 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] border font-sans ${lowestRunoutClass}`}>
                                    {lowestRunout}
                                  </span>
                                </td>

                                <td className="py-2.5 px-4 text-right">
                                  <Link
                                    href={`/live-sync?view=stores&store=${b.id}`}
                                    className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] hover:bg-emerald-600 hover:text-white border border-[var(--border-base)] text-[11px] font-sans font-semibold text-[var(--text-main)] transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>Command</span>
                                    <ChevronRight className="w-3 h-3" />
                                  </Link>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={9} className="py-8 text-center text-xs text-[var(--text-muted)] font-sans">
                              No stores match your search or filter criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {/* Pagination Footer */}
                    {totalStorePages > 1 && (
                      <div className="p-3 border-t border-[var(--border-base)] flex items-center justify-between text-xs bg-[var(--bg-surface)]">
                        <span className="text-[var(--text-subtle)]">
                          Page <strong className="text-[var(--text-main)] font-mono">{currentStorePage}</strong> of <strong className="text-[var(--text-main)] font-mono">{totalStorePages}</strong>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setStorePage(Math.max(1, currentStorePage - 1))}
                            disabled={currentStorePage === 1}
                            className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-xs font-semibold disabled:opacity-40 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setStorePage(Math.min(totalStorePages, currentStorePage + 1))}
                            disabled={currentStorePage === totalStorePages}
                            className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-xs font-semibold disabled:opacity-40 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 4. CARD GRID VIEW (ALTERNATIVE VIEW) */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paginatedStores.map(b => (
                        <Link 
                          key={b.id}
                          href={`/live-sync?view=stores&store=${b.id}`}
                          className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] hover:border-emerald-500/40 transition-all space-y-3.5 shadow-xs block cursor-pointer group"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {renderBusinessLogo(b, 'w-10 h-10')}
                              <div>
                                <h3 className="text-sm font-bold text-[var(--text-main)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{b.name}</h3>
                                <div className="text-xs text-[var(--text-muted)] mt-0.5">{b.address} • {b.district}</div>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              b.isOpenNow ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                            }`}>
                              {b.isOpenNow ? 'Open Now' : 'Closed'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-center text-xs">
                            <div>
                              <div className="text-[10px] text-[var(--text-subtle)]">Weekly Sales</div>
                              <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                ${(b.weeklyRevenue || 0).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-[var(--text-subtle)]">Weekly Profit</div>
                              <div className="font-mono font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                                ${(b.weeklyProfit || 0).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-[10px] text-[var(--text-subtle)]">Rating</div>
                              <div className="font-mono font-bold text-[var(--text-main)] mt-0.5">
                                {b.customerSatisfaction}%
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                            <span>Open Store Command Room</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Pagination for Grid */}
                    {totalStorePages > 1 && (
                      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] flex items-center justify-between text-xs">
                        <span className="text-[var(--text-subtle)]">
                          Page <strong className="text-[var(--text-main)] font-mono">{currentStorePage}</strong> of <strong className="text-[var(--text-main)] font-mono">{totalStorePages}</strong>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setStorePage(Math.max(1, currentStorePage - 1))}
                            disabled={currentStorePage === 1}
                            className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-xs font-semibold disabled:opacity-40 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setStorePage(Math.min(totalStorePages, currentStorePage + 1))}
                            disabled={currentStorePage === totalStorePages}
                            className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-xs font-semibold disabled:opacity-40 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ================= VIEW 3: EXECUTIVE LIVING & REAL ESTATE WEALTH SUITE (100+ SCALABLE) ================= */}
          {currentView === 'residences' && (() => {
            const totalOwnedValue = (ownedRealEstate || []).reduce((acc, re) => acc + (re.purchasePrice || 0), 0);
            const totalOwnedWeeklyNet = (ownedRealEstate || []).reduce((acc, re) => acc + (re.weeklyNet || 0), 0);
            const totalResidentialWeeklyRent = (residences || []).reduce((acc, r) => acc + (r.rentPerWeek || r.rentPerDay * 7), 0);
            const totalOwnedCount = ownedRealEstate?.length || 0;
            const totalResidencesCount = residences.length;
            const totalPropertiesCount = totalOwnedCount + totalResidencesCount;
            const ownershipRatio = totalPropertiesCount > 0 ? Math.round((totalOwnedCount / totalPropertiesCount) * 100) : 0;

            // Unified Property Items
            interface UnifiedProperty {
              id: string;
              address: string;
              district: string;
              category: 'residence' | 'commercial';
              type: string;
              sqm?: number;
              weeklyFlow: number; // Positive for income, negative for rent
              weeklyTaxes?: number;
              purchasePrice?: number;
              roi?: number;
              occupancy?: number;
              paybackDays?: number;
            }

            const allProperties: UnifiedProperty[] = [
              ...residences.map(r => ({
                id: r.id,
                address: r.address,
                district: r.streetName || 'Midtown',
                category: 'residence' as const,
                type: r.type || 'Personal Residence',
                weeklyFlow: -(r.rentPerWeek || r.rentPerDay * 7)
              })),
              ...(ownedRealEstate || []).map(re => ({
                id: re.id,
                address: re.address,
                district: re.district || 'Hell\'s Kitchen',
                category: 'commercial' as const,
                type: 'Owned Commercial Asset',
                sqm: re.totalSqm,
                weeklyFlow: re.weeklyNet,
                weeklyTaxes: re.weeklyTaxes,
                purchasePrice: re.purchasePrice,
                roi: re.purchasePrice > 0 ? ((re.weeklyNet * 52) / re.purchasePrice) * 100 : 0,
                occupancy: re.occupancyPct,
                paybackDays: re.dailyRevenue > 0 ? Math.round(re.purchasePrice / (re.dailyRevenue - re.dailyTaxes)) : 0
              }))
            ];

            // Distinct Districts
            const propertyDistricts = Array.from(new Set(allProperties.map(p => p.district).filter(Boolean))).sort();

            // Filter
            const filteredProperties = allProperties.filter(p => {
              const matchesTab = realEstateSubTab === 'all' || 
                (realEstateSubTab === 'residences' && p.category === 'residence') ||
                (realEstateSubTab === 'commercial' && p.category === 'commercial');

              const matchesSearch = !realEstateSearchQuery || 
                p.address.toLowerCase().includes(realEstateSearchQuery.toLowerCase()) ||
                p.district.toLowerCase().includes(realEstateSearchQuery.toLowerCase()) ||
                p.type.toLowerCase().includes(realEstateSearchQuery.toLowerCase());

              const matchesDistrict = realEstateDistrictFilter === 'all' || p.district === realEstateDistrictFilter;

              return matchesTab && matchesSearch && matchesDistrict;
            });

            // Sort
            const sortedProperties = [...filteredProperties].sort((a, b) => {
              let comp = 0;
              if (realEstateSortBy === 'address') comp = a.address.localeCompare(b.address);
              else if (realEstateSortBy === 'type') comp = a.type.localeCompare(b.type);
              else if (realEstateSortBy === 'financial') comp = a.weeklyFlow - b.weeklyFlow;
              else if (realEstateSortBy === 'roi') comp = (a.roi || 0) - (b.roi || 0);
              return realEstateSortOrder === 'desc' ? -comp : comp;
            });

            // Pagination
            const totalRealEstatePages = Math.ceil(sortedProperties.length / REAL_ESTATE_PAGE_SIZE) || 1;
            const currentRealEstatePage = Math.min(realEstatePage, totalRealEstatePages);
            const paginatedProperties = sortedProperties.slice((currentRealEstatePage - 1) * REAL_ESTATE_PAGE_SIZE, currentRealEstatePage * REAL_ESTATE_PAGE_SIZE);

            return (
              <div className="space-y-6">
                {/* 1. TOP EXECUTIVE WEALTH & LIFESTYLE RIBBON */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Player Energy & Lifestyle */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Executive Energy &amp; Vitals</span>
                      <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 flex items-baseline gap-1.5">
                      <span>{playerEnergy ?? 100}%</span>
                      <span className="text-xs font-sans font-normal text-[var(--text-subtle)]">Energy</span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Sleep Recovery Quality:</span>
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                        {residences.length > 0 && residences[0].type.toLowerCase().includes('luxury') ? '100% (Optimal)' : '75% (Standard)'}
                      </strong>
                    </div>
                  </div>

                  {/* Player Happiness / Morale */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Lifestyle Happiness</span>
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <div className="text-xl font-bold font-mono text-[var(--text-main)] flex items-baseline gap-1.5">
                      <span className={playerHappiness && playerHappiness >= 80 ? 'text-emerald-500' : 'text-amber-500'}>
                        {playerHappiness ?? 95}%
                      </span>
                      <span className="text-xs font-sans font-normal text-[var(--text-subtle)]">Morale</span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Active Residences:</span>
                      <strong className="font-mono text-sky-500">{residences.length} Quarters</strong>
                    </div>
                  </div>

                  {/* Owned Real Estate Asset Equity */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Owned Portfolio Value</span>
                      <Building className="w-3.5 h-3.5 text-sky-500" />
                    </div>
                    <div className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400">
                      ${totalOwnedValue.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Equity Ratio:</span>
                      <strong className="font-mono text-sky-500">{ownershipRatio}% Owned</strong>
                    </div>
                  </div>

                  {/* Weekly Residential Rent Drain */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Housing Lease Cost</span>
                      <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="text-xl font-bold font-mono text-rose-500">
                      -${totalResidentialWeeklyRent.toLocaleString()}<span className="text-xs font-normal text-[var(--text-subtle)]">/wk</span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Tenant Inflow (Owned):</span>
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400">+${totalOwnedWeeklyNet.toLocaleString()}/wk</strong>
                    </div>
                  </div>
                </div>

                {/* 2. SUBTAB NAVIGATION PILLS */}
                <div className="flex items-center gap-2 border-b border-[var(--border-base)] pb-3">
                  <button
                    onClick={() => { setRealEstateSubTab('all'); setRealEstatePage(1); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      realEstateSubTab === 'all'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>All Property Assets</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${realEstateSubTab === 'all' ? 'bg-white/20 text-white' : 'bg-[var(--bg-base)] text-[var(--text-subtle)]'}`}>
                      {totalPropertiesCount}
                    </span>
                  </button>

                  <button
                    onClick={() => { setRealEstateSubTab('residences'); setRealEstatePage(1); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      realEstateSubTab === 'residences'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>Personal Living Quarters</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${realEstateSubTab === 'residences' ? 'bg-white/20 text-white' : 'bg-[var(--bg-base)] text-[var(--text-subtle)]'}`}>
                      {totalResidencesCount}
                    </span>
                  </button>

                  <button
                    onClick={() => { setRealEstateSubTab('commercial'); setRealEstatePage(1); }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      realEstateSubTab === 'commercial'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Owned Investment Buildings</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${realEstateSubTab === 'commercial' ? 'bg-white/20 text-white' : 'bg-[var(--bg-base)] text-[var(--text-subtle)]'}`}>
                      {totalOwnedCount}
                    </span>
                  </button>
                </div>

                {/* 3. FILTER, SEARCH & VIEW CONTROLS */}
                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3 shadow-xs">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                      <input
                        type="text"
                        placeholder="Search address, district, or property type..."
                        value={realEstateSearchQuery}
                        onChange={(e) => {
                          setRealEstateSearchQuery(e.target.value);
                          setRealEstatePage(1);
                        }}
                        className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>

                    {/* Filters & View Toggle */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* District Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setRealEstateDistrictDropdownOpen(!realEstateDistrictDropdownOpen)}
                          className="bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] hover:border-amber-500 rounded-xl px-3 py-1.5 text-xs text-[var(--text-main)] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span className="truncate max-w-28">{realEstateDistrictFilter === 'all' ? 'All Districts' : realEstateDistrictFilter}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] transition-transform ${realEstateDistrictDropdownOpen ? 'rotate-180 text-amber-500' : ''}`} />
                        </button>

                        {realEstateDistrictDropdownOpen && (
                          <div className="absolute top-full right-0 mt-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl overflow-hidden min-w-48 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 p-1 space-y-0.5">
                            <button
                              type="button"
                              onClick={() => { setRealEstateDistrictFilter('all'); setRealEstateDistrictDropdownOpen(false); setRealEstatePage(1); }}
                              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                realEstateDistrictFilter === 'all' ? 'bg-amber-600 text-white font-bold' : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                              }`}
                            >
                              <span>All Districts</span>
                              <span className="text-[10px] opacity-80">{allProperties.length}</span>
                            </button>
                            {propertyDistricts.map(d => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => { setRealEstateDistrictFilter(d); setRealEstateDistrictDropdownOpen(false); setRealEstatePage(1); }}
                                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                  realEstateDistrictFilter === d ? 'bg-amber-600 text-white font-bold' : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                                }`}
                              >
                                <span className="truncate">{d}</span>
                                <span className="text-[10px] opacity-80">{allProperties.filter(p => p.district === d).length}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* View Mode Switcher */}
                      <div className="flex items-center bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl p-0.5 text-xs ml-auto">
                        <button
                          onClick={() => setRealEstateViewMode('table')}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            realEstateViewMode === 'table' ? 'bg-amber-600 text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                          }`}
                          title="Dense Table View (High-Capacity)"
                        >
                          <Layers className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setRealEstateViewMode('grid')}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            realEstateViewMode === 'grid' ? 'bg-amber-600 text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                          }`}
                          title="Card Grid View"
                        >
                          <Boxes className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Active Filter Counter */}
                  <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
                    <span>
                      Showing <strong className="text-[var(--text-main)] font-mono">{paginatedProperties.length}</strong> of {filteredProperties.length} properties {filteredProperties.length !== allProperties.length && `(filtered from ${allProperties.length} total)`}
                    </span>
                    {(realEstateSearchQuery || realEstateDistrictFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setRealEstateSearchQuery('');
                          setRealEstateDistrictFilter('all');
                          setRealEstatePage(1);
                        }}
                        className="text-amber-600 dark:text-amber-400 font-semibold hover:underline cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* 4. DENSE TABLE VIEW (DEFAULT FOR 100+ PROPERTIES) */}
                {realEstateViewMode === 'table' ? (
                  <div className="overflow-x-auto rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase select-none">
                        <tr>
                          {/* Property Address */}
                          <th 
                            onClick={() => {
                              if (realEstateSortBy === 'address') setRealEstateSortOrder(realEstateSortOrder === 'asc' ? 'desc' : 'asc');
                              else { setRealEstateSortBy('address'); setRealEstateSortOrder('asc'); }
                            }}
                            className="py-3 px-4 cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>Property Address</span>
                              {realEstateSortBy === 'address' ? (
                                realEstateSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-500" /> : <ArrowDown className="w-3 h-3 text-amber-500" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                              )}
                            </div>
                          </th>

                          {/* District */}
                          <th className="py-3 px-4">
                            <span>District</span>
                          </th>

                          {/* Category & Type */}
                          <th 
                            onClick={() => {
                              if (realEstateSortBy === 'type') setRealEstateSortOrder(realEstateSortOrder === 'asc' ? 'desc' : 'asc');
                              else { setRealEstateSortBy('type'); setRealEstateSortOrder('asc'); }
                            }}
                            className="py-3 px-4 cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>Type / Classification</span>
                              {realEstateSortBy === 'type' ? (
                                realEstateSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-500" /> : <ArrowDown className="w-3 h-3 text-amber-500" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                              )}
                            </div>
                          </th>

                          {/* Size / Specs */}
                          <th className="py-3 px-4 text-center">
                            <span>Dimensions</span>
                          </th>

                          {/* Weekly Cashflow / Rent */}
                          <th 
                            onClick={() => {
                              if (realEstateSortBy === 'financial') setRealEstateSortOrder(realEstateSortOrder === 'asc' ? 'desc' : 'asc');
                              else { setRealEstateSortBy('financial'); setRealEstateSortOrder('desc'); }
                            }}
                            className="py-3 px-4 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                          >
                            <div className="flex items-center justify-end gap-1.5">
                              <span>Weekly Cashflow</span>
                              {realEstateSortBy === 'financial' ? (
                                realEstateSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-500" /> : <ArrowDown className="w-3 h-3 text-amber-500" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                              )}
                            </div>
                          </th>

                          {/* Investment ROI / Perks */}
                          <th 
                            onClick={() => {
                              if (realEstateSortBy === 'roi') setRealEstateSortOrder(realEstateSortOrder === 'asc' ? 'desc' : 'asc');
                              else { setRealEstateSortBy('roi'); setRealEstateSortOrder('desc'); }
                            }}
                            className="py-3 px-4 text-center cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                          >
                            <div className="flex items-center justify-center gap-1.5">
                              <span>ROI / Lifestyle Impact</span>
                              {realEstateSortBy === 'roi' ? (
                                realEstateSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-amber-500" /> : <ArrowDown className="w-3 h-3 text-amber-500" />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                              )}
                            </div>
                          </th>

                          {/* Asset Status */}
                          <th className="py-3 px-4 text-right">Portfolio Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                        {paginatedProperties.length > 0 ? (
                          paginatedProperties.map((p) => {
                            const isOwned = p.category === 'commercial';
                            return (
                              <tr key={p.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                                <td className="py-2.5 px-4 font-sans font-semibold text-[var(--text-main)] flex items-center gap-2.5">
                                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
                                    isOwned ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                                  }`}>
                                    {isOwned ? <Building className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
                                  </div>
                                  <div className="truncate">
                                    <div className="font-bold truncate max-w-56">{p.address}</div>
                                  </div>
                                </td>

                                <td className="py-2.5 px-4 font-sans text-[var(--text-muted)]">
                                  {p.district}
                                </td>

                                <td className="py-2.5 px-4 font-sans">
                                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${
                                    isOwned ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                                  }`}>
                                    {p.type}
                                  </span>
                                </td>

                                <td className="py-2.5 px-4 text-center">
                                  {p.sqm ? `${p.sqm} m²` : '-'}
                                </td>

                                <td className="py-2.5 px-4 text-right font-bold">
                                  <span className={p.weeklyFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                                    {p.weeklyFlow >= 0 ? `+$${p.weeklyFlow.toLocaleString()}` : `-$${Math.abs(p.weeklyFlow).toLocaleString()}`}/wk
                                  </span>
                                </td>

                                <td className="py-2.5 px-4 text-center font-sans">
                                  {isOwned ? (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                      {(p.roi || 0).toFixed(1)}% Annual ROI
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                                      +100% Sleep Energy
                                    </span>
                                  )}
                                </td>

                                <td className="py-2.5 px-4 text-right font-sans">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    isOwned ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                                  }`}>
                                    {isOwned ? 'Owned Equity Asset' : 'Leased OPEX'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-xs text-[var(--text-muted)] font-sans">
                              No property assets match your search or filter criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {/* Pagination Footer */}
                    {totalRealEstatePages > 1 && (
                      <div className="p-3 border-t border-[var(--border-base)] flex items-center justify-between text-xs bg-[var(--bg-surface)]">
                        <span className="text-[var(--text-subtle)]">
                          Page <strong className="text-[var(--text-main)] font-mono">{currentRealEstatePage}</strong> of <strong className="text-[var(--text-main)] font-mono">{totalRealEstatePages}</strong>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setRealEstatePage(Math.max(1, currentRealEstatePage - 1))}
                            disabled={currentRealEstatePage === 1}
                            className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-xs font-semibold disabled:opacity-40 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setRealEstatePage(Math.min(totalRealEstatePages, currentRealEstatePage + 1))}
                            disabled={currentRealEstatePage === totalRealEstatePages}
                            className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-xs font-semibold disabled:opacity-40 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 5. CARD GRID VIEW */
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {paginatedProperties.map(p => {
                        const isOwned = p.category === 'commercial';
                        return (
                          <div key={p.id} className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3.5 text-xs shadow-xs">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
                                  isOwned ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                                }`}>
                                  {isOwned ? <Building className="w-4 h-4" /> : <Home className="w-4 h-4" />}
                                </div>
                                <div>
                                  <div className="font-bold text-sm text-[var(--text-main)] truncate max-w-44">{p.address}</div>
                                  <div className="text-xs text-[var(--text-muted)] mt-0.5">{p.district} • {p.type}</div>
                                </div>
                              </div>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isOwned ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                              }`}>
                                {isOwned ? 'REVENUE ASSET' : 'LEASE OPEX'}
                              </span>
                            </div>

                            <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between text-[11px] font-mono">
                              <span className="text-[var(--text-subtle)] font-sans">{isOwned ? 'Weekly Net Income' : 'Weekly Lease Drain'}</span>
                              <span className={`font-bold ${p.weeklyFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                                {p.weeklyFlow >= 0 ? `+$${p.weeklyFlow.toLocaleString()}` : `-$${Math.abs(p.weeklyFlow).toLocaleString()}`}/wk
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination for Grid */}
                    {totalRealEstatePages > 1 && (
                      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] flex items-center justify-between text-xs">
                        <span className="text-[var(--text-subtle)]">
                          Page <strong className="text-[var(--text-main)] font-mono">{currentRealEstatePage}</strong> of <strong className="text-[var(--text-main)] font-mono">{totalRealEstatePages}</strong>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setRealEstatePage(Math.max(1, currentRealEstatePage - 1))}
                            disabled={currentRealEstatePage === 1}
                            className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-xs font-semibold disabled:opacity-40 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setRealEstatePage(Math.min(totalRealEstatePages, currentRealEstatePage + 1))}
                            disabled={currentRealEstatePage === totalRealEstatePages}
                            className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-xs font-semibold disabled:opacity-40 hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ================= VIEW 4: ENTERPRISE WORKFORCE & COMPLIANCE COMMAND ================= */}
          {currentView === 'staff' && (() => {
            // Aggregate Workforce Metrics
            const totalStaffCount = employees.length;
            const complainingCount = employees.filter(e => e.isComplaining).length;
            const lowMoraleCount = employees.filter(e => e.satisfaction < 70).length;
            const burnoutCount = employees.filter(e => e.weeklyHours > 50).length;
            const avgMorale = totalStaffCount > 0 ? Math.round(employees.reduce((acc, e) => acc + (e.satisfaction || 0), 0) / totalStaffCount) : 100;
            const avgHourlyWage = totalStaffCount > 0 ? (employees.reduce((acc, e) => acc + (e.wage || 0), 0) / totalStaffCount).toFixed(2) : '0.00';

            // Distinct Locations and Roles for filtering
            const distinctLocations = Array.from(new Set(employees.map(e => e.workingLocation).filter(Boolean))).sort();
            const distinctRoles = Array.from(new Set(employees.map(e => e.primarySkillName || 'General').filter(Boolean))).sort();

            // Filter & Search
            const filteredStaff = employees.filter(emp => {
              const matchesSearch = !staffSearchQuery || 
                emp.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                (emp.workingLocation || '').toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
                (emp.primarySkillName || '').toLowerCase().includes(staffSearchQuery.toLowerCase());

              const matchesLoc = staffLocationFilter === 'all' || emp.workingLocation === staffLocationFilter;
              const matchesRole = staffRoleFilter === 'all' || (emp.primarySkillName || 'General').toLowerCase() === staffRoleFilter.toLowerCase();
              const matchesContract = staffContractFilter === 'all' || 
                (staffContractFilter === 'ft' && (emp.weeklyHours || 0) >= 40) ||
                (staffContractFilter === 'pt' && (emp.weeklyHours || 0) < 40);

              return matchesSearch && matchesLoc && matchesRole && matchesContract;
            });

            // Sorting
            const sortedStaff = [...filteredStaff].sort((a, b) => {
              let comp = 0;
              if (staffSortBy === 'name') comp = a.name.localeCompare(b.name);
              else if (staffSortBy === 'wage') comp = a.wage - b.wage;
              else if (staffSortBy === 'satisfaction') comp = a.satisfaction - b.satisfaction;
              else if (staffSortBy === 'hours') comp = a.weeklyHours - b.weeklyHours;
              else if (staffSortBy === 'skill') comp = (a.skillLevel || 0) - (b.skillLevel || 0);
              return staffSortOrder === 'desc' ? -comp : comp;
            });

            // Pagination for large employee counts (100+)
            const totalPages = Math.ceil(sortedStaff.length / STAFF_PAGE_SIZE) || 1;
            const paginatedStaff = sortedStaff.slice((staffPage - 1) * STAFF_PAGE_SIZE, staffPage * STAFF_PAGE_SIZE);

            return (
              <div className="space-y-6">
                {/* 1. EXECUTIVE WORKFORCE METRICS RIBBON */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Active Workforce</span>
                      <Users className="w-3.5 h-3.5 text-sky-500" />
                    </div>
                    <div className="text-xl font-bold font-mono text-[var(--text-main)]">
                      {totalStaffCount} <span className="text-xs font-normal text-[var(--text-subtle)]">Staff</span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Avg Wage:</span>
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400">${avgHourlyWage}/hr</strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Weekly Payroll</span>
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      ${weeklyPayrollTotal.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Total Workload:</span>
                      <strong className="font-mono text-[var(--text-main)]">{employees.reduce((acc, e) => acc + (e.weeklyHours || 0), 0)} hrs/wk</strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Average Morale</span>
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <div className={`text-xl font-bold font-mono ${avgMorale >= 80 ? 'text-emerald-500' : avgMorale >= 65 ? 'text-amber-500' : 'text-rose-500'}`}>
                      {avgMorale}%
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Low Morale (&lt;70%):</span>
                      <strong className={`font-mono ${lowMoraleCount > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {lowMoraleCount} Workers
                      </strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Compliance &amp; Overtime</span>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className={`text-xl font-bold font-mono ${complainingCount > 0 || burnoutCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {complainingCount + burnoutCount} <span className="text-xs font-normal text-[var(--text-subtle)]">Flags</span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Overworked (&gt;50h):</span>
                      <strong className={`font-mono ${burnoutCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {burnoutCount} Staff
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 2. ENTERPRISE FILTER, SEARCH & BULK CONTROLS BAR */}
                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3 shadow-xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1 max-w-md">
                      <input
                        type="text"
                        placeholder="Search by worker name, location, or skill..."
                        value={staffSearchQuery}
                        onChange={(e) => {
                          setStaffSearchQuery(e.target.value);
                          setStaffPage(1);
                        }}
                        className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    {/* Filter Dropdowns */}
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
                            {staffLocationFilter === 'all' ? `All Locations (${distinctLocations.length})` : staffLocationFilter}
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
                                setStaffPage(1);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                staffLocationFilter === 'all'
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                              }`}
                            >
                              <span>All Locations</span>
                              <span className="text-[10px] opacity-80">{totalStaffCount} Staff</span>
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
                                    setStaffPage(1);
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
                            {staffRoleFilter === 'all' ? `All Roles (${distinctRoles.length})` : staffRoleFilter}
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
                                setStaffPage(1);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                staffRoleFilter === 'all'
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                              }`}
                            >
                              <span>All Roles</span>
                              <span className="text-[10px] opacity-80">{distinctRoles.length}</span>
                            </button>
                            {distinctRoles.map(role => (
                              <button
                                key={role}
                                type="button"
                                onClick={() => {
                                  setStaffRoleFilter(role);
                                  setStaffRoleDropdownOpen(false);
                                  setStaffPage(1);
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
                            {staffContractFilter === 'all' ? 'All Contracts' : staffContractFilter === 'ft' ? 'Full-Time (40-50h)' : 'Part-Time (<40h)'}
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
                                setStaffPage(1);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                staffContractFilter === 'all'
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                              }`}
                            >
                              <span>All Contracts</span>
                              <span className="text-[10px] opacity-80">{totalStaffCount}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setStaffContractFilter('ft');
                                setStaffContractDropdownOpen(false);
                                setStaffPage(1);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                staffContractFilter === 'ft'
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                              }`}
                            >
                              <span>Full-Time (40h - 50h)</span>
                              <span className={`text-[10px] ${staffContractFilter === 'ft' ? 'text-white/80' : 'text-[var(--text-subtle)]'}`}>
                                {employees.filter(e => (e.weeklyHours || 0) >= 40).length}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setStaffContractFilter('pt');
                                setStaffContractDropdownOpen(false);
                                setStaffPage(1);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                staffContractFilter === 'pt'
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                              }`}
                            >
                              <span>Part-Time (&lt;40h)</span>
                              <span className={`text-[10px] ${staffContractFilter === 'pt' ? 'text-white/80' : 'text-[var(--text-subtle)]'}`}>
                                {employees.filter(e => (e.weeklyHours || 0) < 40).length}
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
                      Showing <strong className="text-[var(--text-main)] font-mono">{filteredStaff.length}</strong> of {totalStaffCount} total employees
                    </span>
                    {(staffSearchQuery || staffLocationFilter !== 'all' || staffRoleFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setStaffSearchQuery('');
                          setStaffLocationFilter('all');
                          setStaffRoleFilter('all');
                          setStaffPage(1);
                        }}
                        className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. HIGH-DENSITY ENTERPRISE WORKFORCE TABLE (Sortable like /pricing) */}
                <div className="overflow-x-auto rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase select-none">
                      <tr>
                        {/* Employee Name */}
                        <th 
                          onClick={() => {
                            if (staffSortBy === 'name') setStaffSortOrder(staffSortOrder === 'asc' ? 'desc' : 'asc');
                            else { setStaffSortBy('name'); setStaffSortOrder('asc'); }
                          }}
                          className="py-3 px-4 cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Employee</span>
                            {staffSortBy === 'name' ? (
                              staffSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                            )}
                          </div>
                        </th>

                        {/* Assigned Location */}
                        <th 
                          onClick={() => {
                            if (staffSortBy === 'name') setStaffSortOrder(staffSortOrder === 'asc' ? 'desc' : 'asc');
                            else { setStaffSortBy('name'); setStaffSortOrder('asc'); }
                          }}
                          className="py-3 px-4 cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Assigned Location</span>
                            <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                          </div>
                        </th>

                        {/* Skill & Role */}
                        <th 
                          onClick={() => {
                            if (staffSortBy === 'skill') setStaffSortOrder(staffSortOrder === 'asc' ? 'desc' : 'asc');
                            else { setStaffSortBy('skill'); setStaffSortOrder('desc'); }
                          }}
                          className="py-3 px-4 cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>Skill &amp; Role</span>
                            {staffSortBy === 'skill' ? (
                              staffSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                            )}
                          </div>
                        </th>

                        {/* Contract Type */}
                        <th className="py-3 px-4 text-center">
                          <span>Contract</span>
                        </th>

                        {/* Workload Hours */}
                        <th 
                          onClick={() => {
                            if (staffSortBy === 'hours') setStaffSortOrder(staffSortOrder === 'asc' ? 'desc' : 'asc');
                            else { setStaffSortBy('hours'); setStaffSortOrder('desc'); }
                          }}
                          className="py-3 px-4 text-center cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span>Workload</span>
                            {staffSortBy === 'hours' ? (
                              staffSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                            )}
                          </div>
                        </th>

                        {/* Wage */}
                        <th 
                          onClick={() => {
                            if (staffSortBy === 'wage') setStaffSortOrder(staffSortOrder === 'asc' ? 'desc' : 'asc');
                            else { setStaffSortBy('wage'); setStaffSortOrder('desc'); }
                          }}
                          className="py-3 px-4 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <span>Wage ($/hr)</span>
                            {staffSortBy === 'wage' ? (
                              staffSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                            )}
                          </div>
                        </th>

                        {/* Weekly Cost */}
                        <th 
                          onClick={() => {
                            if (staffSortBy === 'wage') setStaffSortOrder(staffSortOrder === 'asc' ? 'desc' : 'asc');
                            else { setStaffSortBy('wage'); setStaffSortOrder('desc'); }
                          }}
                          className="py-3 px-4 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            <span>Weekly Cost</span>
                            <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                          </div>
                        </th>

                        {/* Morale Satisfaction */}
                        <th 
                          onClick={() => {
                            if (staffSortBy === 'satisfaction') setStaffSortOrder(staffSortOrder === 'asc' ? 'desc' : 'asc');
                            else { setStaffSortBy('satisfaction'); setStaffSortOrder('asc'); }
                          }}
                          className="py-3 px-4 text-center cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <span>Morale</span>
                            {staffSortBy === 'satisfaction' ? (
                              staffSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                            )}
                          </div>
                        </th>

                        {/* Health Insurance & HR Manager */}
                        <th className="py-3 px-4">HR &amp; Benefits</th>

                        {/* Demands */}
                        <th className="py-3 px-4">Contract Demands</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                      {paginatedStaff.length > 0 ? (
                        paginatedStaff.map(emp => {
                          const isBurnout = emp.weeklyHours > 50;
                          const isComplaining = emp.isComplaining || false;
                          const isLowMorale = emp.satisfaction < 70;
                          const isFullTime = (emp.weeklyHours || 0) >= 40;

                          return (
                            <tr key={emp.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                              {/* Employee Name & Status */}
                              <td className="py-2.5 px-4 font-sans font-semibold text-[var(--text-main)]">
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                                    emp.satisfaction >= 80 ? 'bg-emerald-500' : emp.satisfaction >= 65 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`} />
                                  <span className="truncate max-w-36">{emp.name}</span>
                                  {isComplaining && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-500/10 text-rose-500 font-bold border border-rose-500/20">
                                      Complaint
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Working Location */}
                              <td className="py-2.5 px-4 font-sans text-[var(--text-muted)]">
                                <span className="truncate block max-w-44 font-medium">{emp.workingLocation || 'Unassigned'}</span>
                              </td>

                              {/* Skill & Role */}
                              <td className="py-2.5 px-4 font-sans">
                                <div className="flex items-center gap-1.5">
                                  <span className="capitalize font-semibold text-[var(--text-main)]">{emp.primarySkillName || 'General'}</span>
                                  <span className="text-[10px] font-mono text-[var(--text-subtle)] font-bold px-1.5 py-0.2 rounded bg-[var(--bg-surface)] border border-[var(--border-base)]">
                                    {emp.skillLevel || 50}%
                                  </span>
                                </div>
                              </td>

                              {/* Contract Type (Full-Time vs Part-Time) */}
                              <td className="py-2.5 px-4 text-center font-sans">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isFullTime 
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                }`}>
                                  {isFullTime ? 'Full-Time' : 'Part-Time'}
                                </span>
                              </td>

                              {/* Workload Hours */}
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

                              {/* Hourly Wage */}
                              <td className="py-2.5 px-4 text-right font-bold text-[var(--text-main)]">
                                ${emp.wage.toFixed(2)}
                              </td>

                              {/* Weekly Wage Total */}
                              <td className="py-2.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                ${(emp.weeklyWages || emp.wage * emp.weeklyHours).toLocaleString()}
                              </td>

                              {/* Morale Satisfaction */}
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

                              {/* Health Insurance & HR Manager Assignment */}
                              <td className="py-2.5 px-4 font-sans text-xs">
                                <div className="space-y-0.5">
                                  {emp.healthInsurance && emp.healthInsurance !== 'None' ? (
                                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-main)] font-medium">
                                      <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
                                      <span>{emp.healthInsurance}</span>
                                    </div>
                                  ) : (
                                    <div className="text-[11px] text-[var(--text-subtle)]">
                                      No Insurance
                                    </div>
                                  )}
                                  <div className="text-[10px] text-[var(--text-subtle)]">
                                    HR: {emp.hrManager || 'Unassigned'}
                                  </div>
                                </div>
                              </td>

                              {/* Demands */}
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
                                  <span className="text-[10px] text-[var(--text-subtle)]">None (Satisfied)</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={10} className="py-8 text-center text-xs text-[var(--text-muted)] font-sans">
                            No employees match your search or filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Pagination Controls for Large Rosters */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between p-3.5 border-t border-[var(--border-subtle)] text-xs bg-[var(--bg-surface)]">
                      <span className="text-[var(--text-muted)] text-[11px]">
                        Page <strong className="text-[var(--text-main)] font-mono">{staffPage}</strong> of <strong className="text-[var(--text-main)] font-mono">{totalPages}</strong>
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          disabled={staffPage === 1}
                          onClick={() => setStaffPage(prev => Math.max(1, prev - 1))}
                          className="px-3 py-1.5 rounded-xl border border-[var(--border-base)] text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
                        >
                          &larr; Previous
                        </button>
                        <button
                          disabled={staffPage === totalPages}
                          onClick={() => setStaffPage(prev => Math.min(totalPages, prev + 1))}
                          className="px-3 py-1.5 rounded-xl border border-[var(--border-base)] text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
                        >
                          Next &rarr;
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ================= VIEW 5: COMPLETE LOGISTICS & SUPPLY CHAIN COMMAND CENTER ================= */}
          {currentView === 'logistics' && (() => {
            // Aggregate Pallet Metrics
            let totalPalletUnits = 0;
            let totalWeeklyDrain = 0;
            let totalWeeklyDeliveries = 0;
            let criticalStockoutsCount = 0;
            const allPalletItems: { warehouseId: string; warehouseAddress: string; itemName: string; rawItemName: string; quantity: number; weeklyConsumption: number; weeklyDeliveries: number; daysLeft: number }[] = [];

            warehouses.forEach(w => {
              (w.stock || []).forEach(st => {
                totalPalletUnits += st.quantity || 0;
                totalWeeklyDrain += st.weeklyConsumption || 0;
                totalWeeklyDeliveries += st.weeklyDeliveries || 0;
                if (st.daysLeft >= 0 && st.daysLeft <= 2) criticalStockoutsCount++;

                allPalletItems.push({
                  warehouseId: w.id,
                  warehouseAddress: w.address,
                  itemName: st.itemName,
                  rawItemName: st.rawItemName,
                  quantity: st.quantity || 0,
                  weeklyConsumption: st.weeklyConsumption || 0,
                  weeklyDeliveries: st.weeklyDeliveries || 0,
                  daysLeft: st.daysLeft ?? -1
                });
              });
            });

            // Filter for Pallet Stock
            const filteredItems = allPalletItems.filter(item => {
              const matchesSearch = !logisticsSearchQuery || 
                item.itemName.toLowerCase().includes(logisticsSearchQuery.toLowerCase()) ||
                item.warehouseAddress.toLowerCase().includes(logisticsSearchQuery.toLowerCase());
              const matchesWh = logisticsWarehouseFilter === 'all' || item.warehouseId === logisticsWarehouseFilter;
              return matchesSearch && matchesWh;
            });

            // Sort for Pallet Stock
            const sortedItems = [...filteredItems].sort((a, b) => {
              let comp = 0;
              if (logisticsSortBy === 'name') comp = a.itemName.localeCompare(b.itemName);
              else if (logisticsSortBy === 'quantity') comp = a.quantity - b.quantity;
              else if (logisticsSortBy === 'drain') comp = a.weeklyConsumption - b.weeklyConsumption;
              else if (logisticsSortBy === 'deliveries') comp = a.weeklyDeliveries - b.weeklyDeliveries;
              else if (logisticsSortBy === 'daysLeft') comp = a.daysLeft - b.daysLeft;
              return logisticsSortOrder === 'desc' ? -comp : comp;
            });

            // Wholesale & Importer Reorder Sheet (7-Day & 14-Day Buffer)
            const reorderItems: { itemName: string; rawItemName: string; currentPallet: number; weeklyDrain: number; suggestedOrder: number; urgent: boolean; matchedSupplier?: any }[] = [];
            warehouses.forEach(w => {
              (w.stock || []).forEach(st => {
                if (st.weeklyConsumption > 0 || st.quantity < 100) {
                  const existing = reorderItems.find(r => r.rawItemName === st.rawItemName);
                  const suggested = Math.max(0, (st.weeklyConsumption * 1.5) - st.quantity);
                  const matchedSupplier = SUPPLIERS_DB.find(s => s.type === 'Importer' && s.categories.some(cat => st.itemName.toLowerCase().includes(cat.toLowerCase()) || cat.toLowerCase().includes(st.itemName.toLowerCase()))) || SUPPLIERS_DB[7];
                  
                  if (existing) {
                    existing.currentPallet += st.quantity;
                    existing.weeklyDrain += st.weeklyConsumption;
                    existing.suggestedOrder += suggested;
                    if (st.daysLeft >= 0 && st.daysLeft <= 2) existing.urgent = true;
                  } else {
                    reorderItems.push({
                      itemName: st.itemName,
                      rawItemName: st.rawItemName,
                      currentPallet: st.quantity,
                      weeklyDrain: st.weeklyConsumption,
                      suggestedOrder: Math.round(suggested),
                      urgent: st.daysLeft >= 0 && st.daysLeft <= 2,
                      matchedSupplier
                    });
                  }
                }
              });
            });

            // Total Fleet Count & Logistics Payroll
            const totalVehicles = warehouses.reduce((acc, w) => acc + (w.assignedVehicles || 0), 0);
            const totalDrivers = employees.filter(e => (e.primarySkillName || '').toLowerCase().includes('driver') || (e.primarySkillName || '').toLowerCase().includes('logistics')).length;
            const totalWarehouseRents = warehouses.reduce((acc, w) => acc + (w.rentPerWeek || w.rentPerDay * 7), 0);

            return (
              <div className="space-y-6">
                {/* 1. EXECUTIVE LOGISTICS METRICS RIBBON */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Central Pallet Stock</span>
                      <Boxes className="w-3.5 h-3.5 text-sky-500" />
                    </div>
                    <div className="text-xl font-bold font-mono text-[var(--text-main)]">
                      {totalPalletUnits.toLocaleString()} <span className="text-xs font-normal text-[var(--text-subtle)]">Units</span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Total Facilities:</span>
                      <strong className="font-mono text-sky-500">{warehouses.length} Warehouses</strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Network Inventory Flow</span>
                      <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <div className="text-xl font-bold font-mono text-rose-500">
                      -{totalWeeklyDrain.toLocaleString()} <span className="text-xs font-normal text-[var(--text-subtle)]">units/wk sold</span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Restock Inflow:</span>
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400">+{totalWeeklyDeliveries.toLocaleString()} units/wk</strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Delivery Fleet</span>
                      <Truck className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {totalVehicles} <span className="text-xs font-normal text-[var(--text-subtle)]">Trucks &amp; Vans</span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Drivers Stationed:</span>
                      <strong className="font-mono text-[var(--text-main)]">{totalDrivers} Drivers</strong>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Stockout Alert</span>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className={`text-xl font-bold font-mono ${criticalStockoutsCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {criticalStockoutsCount} <span className="text-xs font-normal text-[var(--text-subtle)]">Critical</span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Buffer Status:</span>
                      <strong className={`font-mono ${criticalStockoutsCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {criticalStockoutsCount > 0 ? '< 48h Runout' : 'Stable Buffer'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 2. NAVIGATION SUBTABS BAR */}
                <div className="flex items-center gap-2 border-b border-[var(--border-base)] pb-3">
                  <button
                    onClick={() => setLogisticsSubTab('inventory')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      logisticsSubTab === 'inventory'
                        ? 'bg-sky-500 text-white shadow-xs'
                        : 'bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Central Pallet Stock</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${logisticsSubTab === 'inventory' ? 'bg-white/20 text-white' : 'bg-[var(--bg-base)] text-[var(--text-subtle)]'}`}>
                      {allPalletItems.length}
                    </span>
                  </button>

                  <button
                    onClick={() => setLogisticsSubTab('routes')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      logisticsSubTab === 'routes'
                        ? 'bg-sky-500 text-white shadow-xs'
                        : 'bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Store Delivery Matrix</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${logisticsSubTab === 'routes' ? 'bg-white/20 text-white' : 'bg-[var(--bg-base)] text-[var(--text-subtle)]'}`}>
                      {businesses.length} Stores
                    </span>
                  </button>

                  <button
                    onClick={() => setLogisticsSubTab('fleet')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                      logisticsSubTab === 'fleet'
                        ? 'bg-sky-500 text-white shadow-xs'
                        : 'bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Fleet &amp; Warehouses</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${logisticsSubTab === 'fleet' ? 'bg-white/20 text-white' : 'bg-[var(--bg-base)] text-[var(--text-subtle)]'}`}>
                      {warehouses.length}
                    </span>
                  </button>
                </div>

                {/* ================= SUBTAB 1: CENTRAL PALLET INVENTORY & REORDERS ================= */}
                {logisticsSubTab === 'inventory' && (
                  <div className="space-y-6">
                    {/* WHOLESALE REORDER SHEET WITH 1-CLICK PO GENERATOR */}
                    {reorderItems.length > 0 && (
                      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3.5 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border-subtle)]">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-emerald-500" />
                            <div>
                              <h3 className="text-xs font-bold text-[var(--text-main)]">7-Day Wholesale Reorder Advisory</h3>
                              <p className="text-[11px] text-[var(--text-subtle)]">Calculated batch replenishment to maintain full 100% shelf availability without overstocking pallets.</p>
                            </div>
                          </div>
                          
                          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                            {reorderItems.filter(r => r.urgent).length} Critical Reorders
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {reorderItems.map(item => {
                            const icon = getItemImageSrc(item.rawItemName);
                            return (
                              <div 
                                key={item.rawItemName} 
                                className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition-colors ${
                                  item.urgent 
                                    ? 'bg-rose-500/10 border-rose-500/30' 
                                    : 'bg-[var(--bg-base)] border-[var(--border-base)]'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-0.5 flex items-center justify-center shrink-0">
                                    {icon ? (
                                      <img src={icon} alt={item.itemName} className="w-full h-full object-contain" />
                                    ) : (
                                      <Package className="w-4 h-4 text-emerald-500 opacity-70" />
                                    )}
                                  </div>
                                  <div className="truncate flex-1">
                                    <div className="font-bold text-[var(--text-main)] truncate capitalize">{item.itemName}</div>
                                    <div className="text-[10px] text-[var(--text-subtle)] truncate">
                                      Supplier: <strong className="text-sky-500 font-sans">{item.matchedSupplier?.name || 'Harbor Port'}</strong>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-1 pt-1 border-t border-[var(--border-subtle)] text-[11px] font-mono">
                                  <div className="flex items-center justify-between text-[var(--text-muted)]">
                                    <span>Current Stock:</span>
                                    <strong className="text-[var(--text-main)]">{item.currentPallet.toLocaleString()}</strong>
                                  </div>
                                  <div className="flex items-center justify-between text-[var(--text-muted)]">
                                    <span>Weekly Drain:</span>
                                    <strong className="text-rose-500">-{item.weeklyDrain.toLocaleString()}/wk</strong>
                                  </div>
                                  <div className="flex items-center justify-between pt-1 border-t border-[var(--border-subtle)] font-bold">
                                    <span className="font-sans text-[10px] uppercase text-[var(--text-subtle)]">PO Recommendation:</span>
                                    <span className={item.urgent ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}>
                                      +{item.suggestedOrder.toLocaleString()} units
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* FILTER, SEARCH & FACILITY SELECTOR BAR */}
                    <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3 shadow-xs">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1 max-w-md">
                          <input
                            type="text"
                            placeholder="Search pallet merchandise or warehouse address..."
                            value={logisticsSearchQuery}
                            onChange={(e) => setLogisticsSearchQuery(e.target.value)}
                            className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>

                        {/* Warehouse Custom Dropdown */}
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setLogisticsWarehouseDropdownOpen(!logisticsWarehouseDropdownOpen)}
                              className="bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] hover:border-emerald-500 rounded-xl px-3.5 py-2 text-xs text-[var(--text-main)] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <Boxes className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                              <span className="truncate max-w-56">
                                {logisticsWarehouseFilter === 'all' 
                                  ? `All Warehouses (${warehouses.length})` 
                                  : warehouses.find(w => w.id === logisticsWarehouseFilter)?.address || logisticsWarehouseFilter}
                              </span>
                              <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] shrink-0 transition-transform ${logisticsWarehouseDropdownOpen ? 'rotate-180 text-emerald-500' : ''}`} />
                            </button>

                            {logisticsWarehouseDropdownOpen && (
                              <div className="absolute top-full right-0 mt-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl overflow-hidden min-w-64 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 p-1 space-y-0.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLogisticsWarehouseFilter('all');
                                    setLogisticsWarehouseDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                    logisticsWarehouseFilter === 'all'
                                      ? 'bg-emerald-600 text-white font-bold'
                                      : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                                  }`}
                                >
                                  <span>All Warehouses</span>
                                  <span className="text-[10px] opacity-80">{allPalletItems.length} Pallet SKUs</span>
                                </button>
                                {warehouses.map(w => (
                                  <button
                                    key={w.id}
                                    type="button"
                                    onClick={() => {
                                      setLogisticsWarehouseFilter(w.id);
                                      setLogisticsWarehouseDropdownOpen(false);
                                    }}
                                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                      logisticsWarehouseFilter === w.id
                                        ? 'bg-emerald-600 text-white font-bold'
                                        : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                                    }`}
                                  >
                                    <span className="truncate">{w.address}</span>
                                    <span className={`text-[10px] ${logisticsWarehouseFilter === w.id ? 'text-white/80' : 'text-[var(--text-subtle)]'}`}>
                                      {(w.stock || []).length} SKUs
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Active Filter Counter */}
                      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
                        <span>
                          Showing <strong className="text-[var(--text-main)] font-mono">{sortedItems.length}</strong> of {allPalletItems.length} total pallet stocks
                        </span>
                        {(logisticsSearchQuery || logisticsWarehouseFilter !== 'all') && (
                          <button
                            onClick={() => {
                              setLogisticsSearchQuery('');
                              setLogisticsWarehouseFilter('all');
                            }}
                            className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                          >
                            Reset All Filters
                          </button>
                        )}
                      </div>
                    </div>

                    {/* SORTABLE HIGH-DENSITY PALLET STOCK TABLE */}
                    <div className="overflow-x-auto rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase select-none">
                          <tr>
                            {/* Item Name */}
                            <th 
                              onClick={() => {
                                if (logisticsSortBy === 'name') setLogisticsSortOrder(logisticsSortOrder === 'asc' ? 'desc' : 'asc');
                                else { setLogisticsSortBy('name'); setLogisticsSortOrder('asc'); }
                              }}
                              className="py-3 px-4 cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                            >
                              <div className="flex items-center gap-1.5">
                                <span>Item Name</span>
                                {logisticsSortBy === 'name' ? (
                                  logisticsSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                                )}
                              </div>
                            </th>

                            {/* Warehouse Facility */}
                            <th className="py-3 px-4">
                              <span>Warehouse Facility</span>
                            </th>

                            {/* Pallet Quantity */}
                            <th 
                              onClick={() => {
                                if (logisticsSortBy === 'quantity') setLogisticsSortOrder(logisticsSortOrder === 'asc' ? 'desc' : 'asc');
                                else { setLogisticsSortBy('quantity'); setLogisticsSortOrder('desc'); }
                              }}
                              className="py-3 px-4 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                            >
                              <div className="flex items-center justify-end gap-1.5">
                                <span>Pallet Units</span>
                                {logisticsSortBy === 'quantity' ? (
                                  logisticsSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                                )}
                              </div>
                            </th>

                            {/* Weekly Consumption */}
                            <th 
                              onClick={() => {
                                if (logisticsSortBy === 'drain') setLogisticsSortOrder(logisticsSortOrder === 'asc' ? 'desc' : 'asc');
                                else { setLogisticsSortBy('drain'); setLogisticsSortOrder('desc'); }
                              }}
                              className="py-3 px-4 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                            >
                              <div className="flex items-center justify-end gap-1.5">
                                <span>Weekly Drain</span>
                                {logisticsSortBy === 'drain' ? (
                                  logisticsSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                                )}
                              </div>
                            </th>

                            {/* Weekly Deliveries */}
                            <th 
                              onClick={() => {
                                if (logisticsSortBy === 'deliveries') setLogisticsSortOrder(logisticsSortOrder === 'asc' ? 'desc' : 'asc');
                                else { setLogisticsSortBy('deliveries'); setLogisticsSortOrder('desc'); }
                              }}
                              className="py-3 px-4 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                            >
                              <div className="flex items-center justify-end gap-1.5">
                                <span>Weekly Deliveries</span>
                                {logisticsSortBy === 'deliveries' ? (
                                  logisticsSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                                )}
                              </div>
                            </th>

                            {/* Buffer Days */}
                            <th 
                              onClick={() => {
                                if (logisticsSortBy === 'daysLeft') setLogisticsSortOrder(logisticsSortOrder === 'asc' ? 'desc' : 'asc');
                                else { setLogisticsSortBy('daysLeft'); setLogisticsSortOrder('asc'); }
                              }}
                              className="py-3 px-4 text-center cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                <span>Depletion Buffer Health</span>
                                {logisticsSortBy === 'daysLeft' ? (
                                  logisticsSortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-500" /> : <ArrowDown className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)] opacity-60" />
                                )}
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                          {sortedItems.length > 0 ? (
                            sortedItems.map((st, sIdx) => {
                              const icon = getItemImageSrc(st.rawItemName);
                              return (
                                <tr key={`${st.warehouseId}-${st.rawItemName}-${sIdx}`} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                                  <td className="py-2.5 px-4 font-sans font-semibold text-[var(--text-main)] flex items-center gap-2">
                                    <div className="w-6 h-6 rounded bg-[var(--bg-surface)] border border-[var(--border-base)] p-0.5 flex items-center justify-center shrink-0">
                                      {icon ? (
                                        <img src={icon} alt={st.itemName} className="w-full h-full object-contain" />
                                      ) : (
                                        <Package className="w-3 h-3 text-emerald-500 opacity-70" />
                                      )}
                                    </div>
                                    <span className="capitalize">{st.itemName}</span>
                                  </td>
                                  <td className="py-2.5 px-4 font-sans text-[var(--text-muted)]">
                                    {st.warehouseAddress}
                                  </td>
                                  <td className="py-2.5 px-4 text-right font-bold text-[var(--text-main)]">
                                    {st.quantity.toLocaleString()}
                                  </td>
                                  <td className="py-2.5 px-4 text-right text-rose-500">
                                    -{st.weeklyConsumption.toLocaleString()}
                                  </td>
                                  <td className="py-2.5 px-4 text-right text-emerald-600 dark:text-emerald-400">
                                    +{st.weeklyDeliveries.toLocaleString()}
                                  </td>
                                  <td className="py-2.5 px-4 text-center">
                                    {st.daysLeft >= 0 ? (
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        st.daysLeft <= 2 
                                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                                          : st.daysLeft <= 5 
                                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                                          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                      }`}>
                                        {st.daysLeft} days buffer
                                      </span>
                                    ) : (
                                      <span className="text-[var(--text-subtle)] font-sans">Stable</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-8 text-center text-xs text-[var(--text-muted)] font-sans">
                                No warehouse pallet stocks match your search or filter criteria.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ================= SUBTAB 2: STORE DELIVERY ROUTE MATRIX ================= */}
                {logisticsSubTab === 'routes' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)]">
                      <h3 className="text-xs font-bold text-[var(--text-main)] flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-sky-500" />
                        <span>Storefront Logistics Routing &amp; Daily Replenishment Matrix</span>
                      </h3>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                        Overview of all operating retail stores and their active delivery links from central warehouse facilities.
                      </p>
                    </div>

                    <div className="overflow-x-auto rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase">
                          <tr>
                            <th className="py-3 px-4">Storefront</th>
                            <th className="py-3 px-4">District</th>
                            <th className="py-3 px-4 text-center">Active Products</th>
                            <th className="py-3 px-4">Primary Supply Warehouse</th>
                            <th className="py-3 px-4 text-center">Daily Customer Velocity</th>
                            <th className="py-3 px-4 text-center">Route Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                          {businesses.map(biz => {
                            const assignedWh = warehouses[0]?.address || 'Direct Wholesaler Contract';
                            const productCount = (biz.todayItemSales || []).length || (biz.retailPrices || []).length || 6;
                            const isSupplied = warehouses.length > 0;

                            return (
                              <tr key={biz.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                                <td className="py-2.5 px-4 font-sans font-semibold text-[var(--text-main)] flex items-center gap-2">
                                  <Store className="w-3.5 h-3.5 text-sky-500" />
                                  <span>{biz.name}</span>
                                </td>
                                <td className="py-2.5 px-4 font-sans text-[var(--text-muted)]">
                                  {biz.district || 'Midtown'}
                                </td>
                                <td className="py-2.5 px-4 text-center font-bold">
                                  {productCount} SKUs
                                </td>
                                <td className="py-2.5 px-4 font-sans text-[var(--text-main)] font-medium">
                                  <div className="flex items-center gap-1.5">
                                    <Truck className="w-3 h-3 text-emerald-500" />
                                    <span>{assignedWh}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-4 text-center font-mono">
                                  {biz.todayCustomerCount ? (
                                    <div className="flex items-center justify-center gap-1">
                                      <Users className="w-3 h-3 text-sky-500 shrink-0" />
                                      <span className="font-bold text-[var(--text-main)]">{biz.todayCustomerCount}</span>
                                      <span className="text-[10px] text-[var(--text-subtle)] font-sans">/day</span>
                                    </div>
                                  ) : (
                                    <span className="text-[var(--text-subtle)] font-sans">Active</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-4 text-center font-sans">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isSupplied 
                                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {isSupplied ? 'Automated Delivery Active' : 'Manual / Direct Wholesaler'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* ================= SUBTAB 3: FLEET & WAREHOUSE ASSET MANAGER ================= */}
                {logisticsSubTab === 'fleet' && (
                  <div className="space-y-6">
                    {/* TOP LEVEL FLEET STATS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1 shadow-xs">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Active Logistics Warehouses</span>
                        <div className="text-xl font-bold font-mono text-[var(--text-main)]">{warehouses.length} Facilities</div>
                        <div className="text-[11px] text-[var(--text-muted)]">Facility Rent: <strong className="text-rose-500 font-mono">${totalWarehouseRents.toLocaleString()}/wk</strong></div>
                      </div>

                      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1 shadow-xs">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Delivery Fleet Capacity</span>
                        <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{totalVehicles} Vehicles</div>
                        <div className="text-[11px] text-[var(--text-muted)]">Freightliners &amp; Delivery Vans</div>
                      </div>

                      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1 shadow-xs">
                        <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Delivery Drivers on Payroll</span>
                        <div className="text-xl font-bold font-mono text-sky-500">{totalDrivers} Drivers</div>
                        <div className="text-[11px] text-[var(--text-muted)]">Active route fulfillment</div>
                      </div>
                    </div>

                    {/* WAREHOUSE FACILITIES DETAILED BREAKDOWN */}
                    <div className="space-y-4">
                      {warehouses.map(w => {
                        const facilityDrivers = employees.filter(e => e.workingLocation === w.address || e.workingLocation.toLowerCase().includes(w.address.toLowerCase()));
                        const facilityUnits = (w.stock || []).reduce((sum, s) => sum + (s.quantity || 0), 0);
                        const facilityDrain = (w.stock || []).reduce((sum, s) => sum + (s.weeklyConsumption || 0), 0);
                        const facilityDeliveries = (w.stock || []).reduce((sum, s) => sum + (s.weeklyDeliveries || 0), 0);

                        return (
                          <div key={w.id} className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] overflow-hidden shadow-xs">
                            {/* Facility Header */}
                            <div className="p-5 border-b border-[var(--border-base)] flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[var(--bg-base)]">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-500 shrink-0">
                                  <Boxes className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                                    <span>{w.address}</span>
                                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                                      {w.type || 'Logistics Hub'}
                                    </span>
                                  </h4>
                                  <span className="text-xs text-[var(--text-muted)]">
                                    Rent: <strong className="text-[var(--text-main)] font-mono">${(w.rentPerWeek || w.rentPerDay * 7).toLocaleString()}/wk</strong> • Fleet: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{w.assignedVehicles || 0} Vehicles</strong>
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 text-xs font-mono">
                                <div className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-base)] flex items-center gap-2">
                                  <span className="text-[var(--text-subtle)] font-sans">Pallet SKUs:</span>
                                  <strong className="text-[var(--text-main)]">{(w.stock || []).length} items</strong>
                                </div>
                                <div className="px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-base)] flex items-center gap-2">
                                  <span className="text-[var(--text-subtle)] font-sans">Stored Units:</span>
                                  <strong className="text-sky-500">{facilityUnits.toLocaleString()}</strong>
                                </div>
                              </div>
                            </div>

                            {/* Facility Body: 2-Column Split (Assigned Drivers & Pallet Inventory Snapshot) */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border-base)]">
                              {/* Stationed Drivers & Vehicles */}
                              <div className="p-5 space-y-3">
                                <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
                                  <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                                    <Truck className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Stationed Drivers ({facilityDrivers.length})</span>
                                  </span>
                                  <span className="text-[10px] text-[var(--text-subtle)] font-mono">{w.assignedVehicles || 0} Vehicles</span>
                                </div>

                                {facilityDrivers.length > 0 ? (
                                  <div className="space-y-2">
                                    {facilityDrivers.map(drv => (
                                      <div key={drv.id} className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2">
                                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                          <div>
                                            <div className="font-semibold text-[var(--text-main)]">{drv.name}</div>
                                            <div className="text-[10px] text-[var(--text-subtle)] capitalize">{drv.primarySkillName} • {drv.skillLevel || 100}% skill</div>
                                          </div>
                                        </div>
                                        <div className="text-right font-mono">
                                          <div className="text-emerald-600 dark:text-emerald-400 font-bold">${drv.wage}/hr</div>
                                          <div className="text-[10px] text-[var(--text-subtle)]">{drv.weeklyHours}h/wk</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
                                    No drivers currently stationed at this warehouse facility.
                                  </div>
                                )}
                              </div>

                              {/* Pallet Inventory Snapshot Table */}
                              <div className="p-5 lg:col-span-2 space-y-3">
                                <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
                                  <span className="text-xs font-bold text-[var(--text-main)] flex items-center gap-1.5">
                                    <Boxes className="w-3.5 h-3.5 text-sky-500" />
                                    <span>Pallet Stock &amp; Throughput</span>
                                  </span>
                                  <span className="text-[10px] font-mono text-[var(--text-muted)]">
                                    Drain: <strong className="text-rose-500">-{facilityDrain.toLocaleString()}/wk</strong> • Deliveries: <strong className="text-emerald-600">+{facilityDeliveries.toLocaleString()}/wk</strong>
                                  </span>
                                </div>

                                {w.stock && w.stock.length > 0 ? (
                                  <div className="border border-[var(--border-base)] rounded-xl overflow-hidden bg-[var(--bg-base)]">
                                    <table className="w-full text-xs text-left">
                                      <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase font-mono">
                                        <tr>
                                          <th className="py-2 px-3">Pallet Item</th>
                                          <th className="py-2 px-3 text-right">Quantity</th>
                                          <th className="py-2 px-3 text-right">Weekly Drain</th>
                                          <th className="py-2 px-3 text-right">Deliveries</th>
                                          <th className="py-2 px-3 text-center">Buffer</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                                        {w.stock.map(st => {
                                          const icon = getItemImageSrc(st.rawItemName);
                                          return (
                                            <tr key={st.rawItemName} className="hover:bg-[var(--bg-surface-hover)]">
                                              <td className="py-2 px-3 font-sans font-semibold text-[var(--text-main)] flex items-center gap-2">
                                                <div className="w-5 h-5 rounded bg-[var(--bg-surface)] border border-[var(--border-base)] p-0.5 flex items-center justify-center shrink-0">
                                                  {icon ? (
                                                    <img src={icon} alt={st.itemName} className="w-full h-full object-contain" />
                                                  ) : (
                                                    <Package className="w-3 h-3 text-emerald-500" />
                                                  )}
                                                </div>
                                                <span className="capitalize truncate">{st.itemName}</span>
                                              </td>
                                              <td className="py-2 px-3 text-right font-bold text-[var(--text-main)]">
                                                {st.quantity.toLocaleString()}
                                              </td>
                                              <td className="py-2 px-3 text-right text-rose-500">
                                                -{st.weeklyConsumption.toLocaleString()}
                                              </td>
                                              <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400">
                                                +{st.weeklyDeliveries.toLocaleString()}
                                              </td>
                                              <td className="py-2 px-3 text-center">
                                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                                  st.daysLeft <= 2 ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600'
                                                }`}>
                                                  {st.daysLeft}d
                                                </span>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)]">
                                    No active pallet merchandise stored in this facility.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ================= VIEW 6: CFO PROFIT & LOSS AND TREASURY COMMAND CENTER ================= */}
          {currentView === 'finance' && (() => {
            const totalWeeklyLoanPayments = loans.reduce((acc, l) => acc + (l.weeklyPayment || (l.dailyPayment ? l.dailyPayment * 7 : 0)), 0);
            const totalDailyLoanPayments = loans.reduce((acc, l) => acc + (l.dailyPayment || (l.weeklyPayment ? Math.round(l.weeklyPayment / 7) : 0)), 0);
            const totalWeeklyRentCommercial = businesses.reduce((acc, b) => acc + (b.weeklyRent || 0), 0);
            const totalWeeklyRentWarehouses = warehouses.reduce((acc, w) => acc + (w.rentPerWeek || w.rentPerDay * 7), 0);
            const totalWeeklyLeases = totalWeeklyRentCommercial + totalWeeklyRentWarehouses + (weeklyResidentialExpenses || 0);
            
            // Total weekly cost of goods sold (COGS) estimated from sales
            const estimatedWeeklyCOGS = businesses.reduce((acc, b) => {
              const dailyWholesale = (b.todayItemSales || []).reduce((sum: number, s: any) => sum + (s.totalWholesalePrice || 0), 0);
              return acc + (dailyWholesale > 0 ? dailyWholesale * 7 : Math.round((b.weeklyRevenue || 0) * 0.35));
            }, 0);

            // Daily and weekly burn rates
            const totalWeeklyOPEX = weeklyPayrollTotal + totalWeeklyLeases + estimatedWeeklyCOGS + totalWeeklyLoanPayments;
            const dailyBurnRate = Math.round(totalWeeklyOPEX / 7);
            const dailyGrossRevenue = Math.round(weeklyRevenueTotal / 7);
            const dailyNetCashFlow = dailyGrossRevenue - dailyBurnRate;
            const netMarginPct = weeklyRevenueTotal > 0 ? Math.round((weeklyNetProfit / weeklyRevenueTotal) * 100) : 0;
            const cashRunwayDays = dailyBurnRate > 0 ? Math.round(playerCash / dailyBurnRate) : 999;

            // Big Ambitions tax cycle: 60-day accounting cycle
            const currentDay = gameDay || 1;
            const nextTaxFilingDay = Math.ceil(currentDay / 60) * 60 || 60;
            const daysRemainingToTax = Math.max(0, nextTaxFilingDay - currentDay);
            const taxDeductionSavings = Math.round((taxDeductibleExpenses || 0) * 0.20);

            return (
              <div className="space-y-6">
                {/* 1. EXECUTIVE TREASURY & RUNWAY KPI STRIP */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* KPI 1: Cash Treasury & Runway */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Treasury Balance</span>
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      ${playerCash.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Zero-Revenue Runway:</span>
                      <strong className={`font-mono ${cashRunwayDays < 14 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        ~{cashRunwayDays} Days
                      </strong>
                    </div>
                  </div>

                  {/* KPI 2: Daily Burn Rate */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Daily Cash Burn</span>
                      <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <div className="text-xl font-bold font-mono text-rose-500">
                      -${dailyBurnRate.toLocaleString()}<span className="text-xs font-normal text-[var(--text-subtle)]">/day</span>
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Daily Net Velocity:</span>
                      <strong className={`font-mono ${dailyNetCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                        {dailyNetCashFlow >= 0 ? `+$${dailyNetCashFlow.toLocaleString()}/d` : `-$${Math.abs(dailyNetCashFlow).toLocaleString()}/d`}
                      </strong>
                    </div>
                  </div>

                  {/* KPI 3: Weekly Net Margin Efficiency */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Net Profit Margin</span>
                      <Percent className="w-3.5 h-3.5 text-sky-500" />
                    </div>
                    <div className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400">
                      {netMarginPct}%
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Weekly Net Profit:</span>
                      <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                        +${weeklyNetProfit.toLocaleString()}/wk
                      </strong>
                    </div>
                  </div>

                  {/* KPI 4: IRS Tax Reserve Status */}
                  <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">IRS Tax Reserve</span>
                      <Shield className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div className="text-xl font-bold font-mono text-amber-500">
                      ${(unpaidTaxes || 0).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                      <span>Next Filing Cycle:</span>
                      <strong className="font-mono text-[var(--text-main)]">
                        Day {nextTaxFilingDay} (in {daysRemainingToTax}d)
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 2. SIDE-BY-SIDE: DETAILED INCOME STATEMENT & IRS TAX OPTIMIZER */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left (7 Cols): GAAP / Full P&L Statement */}
                  <div className="lg:col-span-7 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-4 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                      <div>
                        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-emerald-500" />
                          <span>Itemized Empire Income Statement (7-Day Rolling)</span>
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          Consolidated cash flow across all storefronts, real estate, logistics, and debt servicing.
                        </p>
                      </div>
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Net Margin: {netMarginPct}%
                      </span>
                    </div>

                    <div className="space-y-3 text-xs">
                      {/* Section A: Gross Revenues */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-subtle)] px-2">
                          A. Gross Revenue Streams
                        </div>
                        <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between">
                          <span className="font-medium flex items-center gap-2">
                            <Store className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Commercial Storefront Sales ({businesses.length} Locations)</span>
                          </span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            +${weeklyBusinessRevenue.toLocaleString()}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between">
                          <span className="font-medium flex items-center gap-2">
                            <Building className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Owned Real Estate &amp; Tenant Net Rent</span>
                          </span>
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            +${weeklyResidentialRevenue.toLocaleString()}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between font-bold">
                          <span className="text-emerald-700 dark:text-emerald-300">Total Consolidated Gross Revenue</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
                            +${weeklyRevenueTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Section B: Operating Expenses (OPEX) */}
                      <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
                        <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-subtle)] px-2">
                          B. Operating Expenses &amp; Direct Costs (OPEX)
                        </div>
                        <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between">
                          <span className="font-medium flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-rose-500" />
                            <span>Staff Payroll &amp; Hourly Wages ({totalEmployees || employees.length} Workers)</span>
                          </span>
                          <span className="font-mono font-bold text-rose-500">
                            -${weeklyPayrollTotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between">
                          <span className="font-medium flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-rose-500" />
                            <span>Estimated Wholesale Inventory Replenishment (COGS)</span>
                          </span>
                          <span className="font-mono font-bold text-rose-500">
                            -${estimatedWeeklyCOGS.toLocaleString()}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between">
                          <span className="font-medium flex items-center gap-2">
                            <Building className="w-3.5 h-3.5 text-rose-500" />
                            <span>Storefront, Warehouse &amp; Apartment Leases</span>
                          </span>
                          <span className="font-mono font-bold text-rose-500">
                            -${totalWeeklyLeases.toLocaleString()}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between">
                          <span className="font-medium flex items-center gap-2">
                            <CreditCard className="w-3.5 h-3.5 text-rose-500" />
                            <span>Commercial Bank Loan Repayments &amp; Interest</span>
                          </span>
                          <span className="font-mono font-bold text-rose-500">
                            -${totalWeeklyLoanPayments.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Section C: Net Retained Operating Profit */}
                      <div className="p-3.5 rounded-xl bg-[var(--bg-surface-elevated)] border-2 border-emerald-500/40 flex items-center justify-between shadow-xs">
                        <div>
                          <div className="font-extrabold text-sm text-[var(--text-main)]">Consolidated Net Weekly Cash Flow</div>
                          <div className="text-[10px] text-[var(--text-muted)] mt-0.5">True bottom-line profit deposited to bank weekly</div>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 block">
                            +${weeklyNetProfit.toLocaleString()}/wk
                          </span>
                          <span className="text-[10px] text-[var(--text-subtle)]">
                            ~${Math.round(weeklyNetProfit / 7).toLocaleString()}/day
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right (5 Cols): IRS Tax Strategy & Loan Amortization */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Module 1: IRS Tax Liability & Deductions */}
                    <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3.5 shadow-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-amber-500" />
                          <h3 className="text-sm font-bold text-[var(--text-main)]">IRS Tax Liability Radar</h3>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
                          Day {nextTaxFilingDay} Cycle ({daysRemainingToTax}d left)
                        </span>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-1">
                          <div className="flex items-center justify-between text-[var(--text-muted)]">
                            <span>Outstanding Unpaid Tax Bill:</span>
                            <span className="font-mono font-bold text-rose-500 text-sm">
                              ${(unpaidTaxes || 0).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-[10px] text-[var(--text-subtle)]">
                            Pay on time via Uncle Fred or IRS office to avoid business account lockouts.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-1">
                          <div className="flex items-center justify-between text-[var(--text-muted)]">
                            <span>Tax Deductible Expenses Logged:</span>
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                              ${(taxDeductibleExpenses || 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-[var(--text-subtle)] pt-1 border-t border-[var(--border-subtle)]">
                            <span>Direct IRS Tax Saved:</span>
                            <strong className="text-emerald-600 dark:text-emerald-400 font-mono">+${taxDeductionSavings.toLocaleString()}</strong>
                          </div>
                        </div>

                        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] space-y-1">
                          <div className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Recommended Minimum Cash Reserve:</span>
                          </div>
                          <div className="font-mono font-bold text-sm text-[var(--text-main)]">
                            ${Math.max(unpaidTaxes || 0, dailyBurnRate * 7 + (unpaidTaxes || 0)).toLocaleString()}
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)]">
                            Covers 7 days of payroll &amp; rents + full current IRS obligations.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Module 2: Commercial Bank Debt & Amortization */}
                    <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3.5 shadow-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-sky-500" />
                          <h3 className="text-sm font-bold text-[var(--text-main)]">Commercial Loan Portfolio ({loans.length})</h3>
                        </div>
                        <span className="text-[10px] font-mono text-sky-500 font-bold">
                          -${totalDailyLoanPayments.toLocaleString()}/day
                        </span>
                      </div>

                      {loans.length > 0 ? (
                        <div className="space-y-2.5 text-xs">
                          {loans.map((loan, idx) => {
                            const remaining = loan.remainingAmount || loan.totalAmount;
                            const progress = Math.round(((loan.totalAmount - remaining) / loan.totalAmount) * 100);
                            const daysToPayoff = loan.dailyPayment > 0 ? Math.ceil(remaining / loan.dailyPayment) : 0;

                            return (
                              <div key={idx} className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-bold text-[var(--text-main)]">City Commercial Bank Loan #{idx + 1}</div>
                                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                                      Daily Payment: <strong className="font-mono text-rose-500">-${loan.dailyPayment}/d</strong> (${loan.weeklyPayment || loan.dailyPayment * 7}/wk)
                                    </div>
                                  </div>
                                  <span className="font-mono font-bold text-xs text-[var(--text-main)]">
                                    ${remaining.toLocaleString()} <span className="text-[10px] text-[var(--text-subtle)] font-normal">/ ${loan.totalAmount.toLocaleString()}</span>
                                  </span>
                                </div>

                                {/* Repayment Progress Bar */}
                                <div className="space-y-1">
                                  <div className="w-full h-1.5 rounded-full bg-[var(--bg-surface)] overflow-hidden">
                                    <div 
                                      className="h-full rounded-full bg-sky-500 transition-all duration-300"
                                      style={{ width: `${Math.max(5, progress)}%` }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-subtle)]">
                                    <span>{progress}% Principal Repaid</span>
                                    <span>Payoff in ~{daysToPayoff} Days</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-base)] rounded-xl border border-[var(--border-base)]">
                          Zero active bank loans. 100% equity owned empire.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. STORE-BY-STORE UNIT ECONOMICS LEADERBOARD */}
                <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                        <Store className="w-4 h-4 text-emerald-500" />
                        <span>Store-by-Store Unit Economics &amp; Contribution Margin</span>
                      </h3>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Breakdown of revenue, inventory wholesale cost, rent, and bottom-line margin for each storefront.
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-[var(--text-subtle)]">
                      {businesses.length} Commercial Units
                    </span>
                  </div>

                  <div className="border border-[var(--border-base)] rounded-xl overflow-hidden bg-[var(--bg-base)]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase">
                        <tr>
                          <th className="py-2.5 px-4">Storefront</th>
                          <th className="py-2.5 px-4">District</th>
                          <th className="py-2.5 px-4 text-right">Weekly Revenue</th>
                          <th className="py-2.5 px-4 text-right">Weekly Rent</th>
                          <th className="py-2.5 px-4 text-right">Weekly Profit</th>
                          <th className="py-2.5 px-4 text-center">Net Margin</th>
                          <th className="py-2.5 px-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                        {businesses.map(b => {
                          const rev = b.weeklyRevenue ?? 0;
                          const prof = b.weeklyProfit ?? 0;
                          const margin = rev > 0 ? Math.round((prof / rev) * 100) : 0;

                          return (
                            <tr key={b.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                              <td className="py-2.5 px-4 font-sans font-semibold text-[var(--text-main)]">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                  <span>{b.name}</span>
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-subtle)]">
                                    {b.type}
                                  </span>
                                </div>
                              </td>
                              <td className="py-2.5 px-4 font-sans text-[var(--text-muted)]">
                                {b.district}
                              </td>
                              <td className="py-2.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                +${(b.weeklyRevenue || 0).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-4 text-right text-rose-500">
                                -${(b.weeklyRent || 0).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                +${(b.weeklyProfit || 0).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  margin >= 50 
                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                    : margin >= 30 
                                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400' 
                                    : 'bg-amber-500/10 text-amber-600'
                                }`}>
                                  {margin}%
                                </span>
                              </td>
                              <td className="py-2.5 px-4 text-center font-sans">
                                <Link 
                                  href={`/live-sync?view=stores&store=${b.id}`}
                                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1"
                                >
                                  <span>Command Room</span>
                                  <ChevronRight className="w-3 h-3" />
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ================= VIEW 7: DETERMINISTIC DECISION ANALYZER ================= */}
          {currentView === 'analyzer' && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    <div>
                      <h2 className="text-base font-bold text-[var(--text-main)]">Deterministic Decision Analyzer</h2>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5">
                        Mathematical synthesis of live telemetry across pricing, staffing skill, marketing, cleanliness, and catalog gaps.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 self-start sm:self-auto">
                    {opportunities.length} Total Levers
                  </span>
                </div>

                <div className="space-y-6">
                  {/* Section 1: Active Operational Bottlenecks & Alerts */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-[var(--text-subtle)] uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        <span>1. Active Operational Bottlenecks &amp; Urgent Alerts ({activeAlerts.length})</span>
                      </h3>
                      <span className="text-[10px] text-[var(--text-subtle)]">Triggered by stockouts, unstaffed hours, and dirty stores</span>
                    </div>

                    {activeAlerts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeAlerts.map((a, i) => (
                          <div key={i} className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-start gap-3 text-xs">
                            <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${a.severity === 'critical' ? 'text-rose-500' : 'text-amber-500'}`} />
                            <div className="space-y-1">
                              <div className="font-bold text-[var(--text-main)] flex items-center gap-2">
                                <span>{a.location}</span>
                                <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-bold">
                                  {a.type}
                                </span>
                              </div>
                              <div className="text-[var(--text-muted)] text-[11px]">{a.message}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-xs text-[var(--text-muted)]">
                        No critical operational bottlenecks detected across your active operations.
                      </div>
                    )}
                  </div>

                  {/* Section 2: Calculated Growth & Profit Levers Categorized by Business */}
                  <div className="space-y-4 pt-2 border-t border-[var(--border-subtle)]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <h3 className="text-xs font-bold text-[var(--text-subtle)] uppercase tracking-wider flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-emerald-500" />
                        <span>2. Growth &amp; Profit Levers Categorized by Business</span>
                      </h3>

                    {/* Business & Category Filter Controls */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {/* Business Custom Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setAnalyzerBizDropdownOpen(!analyzerBizDropdownOpen);
                            setAnalyzerCatDropdownOpen(false);
                          }}
                          className="bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-main)] font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                        >
                          <span>{analyzerFilterBusiness === 'all' ? `All Businesses (${businesses.length})` : analyzerFilterBusiness}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] transition-transform ${analyzerBizDropdownOpen ? 'rotate-180 text-emerald-500' : ''}`} />
                        </button>

                        {analyzerBizDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-xl overflow-hidden min-w-48 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 p-1 space-y-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                setAnalyzerFilterBusiness('all');
                                setAnalyzerBizDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                analyzerFilterBusiness === 'all'
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                              }`}
                            >
                              <span>All Businesses</span>
                              <span className="text-[10px] opacity-75 font-mono">{businesses.length}</span>
                            </button>

                            {businesses.map(b => (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => {
                                  setAnalyzerFilterBusiness(b.name);
                                  setAnalyzerBizDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                  analyzerFilterBusiness === b.name
                                    ? 'bg-emerald-600 text-white font-bold'
                                    : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                                }`}
                              >
                                <span>{b.name}</span>
                                <span className={`text-[10px] font-mono ${analyzerFilterBusiness === b.name ? 'text-white/80' : 'text-[var(--text-subtle)]'}`}>
                                  {b.type}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Category Custom Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => {
                            setAnalyzerCatDropdownOpen(!analyzerCatDropdownOpen);
                            setAnalyzerBizDropdownOpen(false);
                          }}
                          className="bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-main)] font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                        >
                          <span>{analyzerFilterCategory === 'all' ? 'All Levers' : analyzerFilterCategory}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] transition-transform ${analyzerCatDropdownOpen ? 'rotate-180 text-emerald-500' : ''}`} />
                        </button>

                        {analyzerCatDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-xl overflow-hidden min-w-36 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 p-1 space-y-0.5">
                            {['all', 'Pricing', 'Workforce', 'Operations', 'Marketing', 'Scheduling'].map(cat => (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                  setAnalyzerFilterCategory(cat);
                                  setAnalyzerCatDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                                  analyzerFilterCategory === cat
                                    ? 'bg-emerald-600 text-white font-bold'
                                    : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                                }`}
                              >
                                <span>{cat === 'all' ? 'All Levers' : cat}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    </div>

                    {/* Grouped Opportunities by Business */}
                    {(() => {
                      const filteredOpps = opportunities.filter(op => {
                        const matchBiz = analyzerFilterBusiness === 'all' || op.location === analyzerFilterBusiness;
                        const matchCat = analyzerFilterCategory === 'all' || op.category === analyzerFilterCategory;
                        return matchBiz && matchCat;
                      });

                      if (filteredOpps.length === 0) {
                        return (
                          <div className="p-6 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-xs text-center text-[var(--text-muted)]">
                            No active growth levers found matching the selected filter criteria.
                          </div>
                        );
                      }

                      // Group filtered opportunities by store location
                      const groupedByBiz: Record<string, typeof opportunities> = {};
                      filteredOpps.forEach(op => {
                        if (!groupedByBiz[op.location]) groupedByBiz[op.location] = [];
                        groupedByBiz[op.location].push(op);
                      });

                      return (
                        <div className="space-y-5">
                          {Object.entries(groupedByBiz).map(([bizName, bizOpps]) => {
                            const bizObj = businesses.find(b => b.name === bizName);
                            const totalBizGain = bizOpps.reduce((acc, o) => acc + o.weeklyImpact, 0);

                            return (
                              <div key={bizName} className="p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                                  <div className="flex items-center gap-2.5">
                                    {bizObj && renderBusinessLogo(bizObj, 'w-7 h-7')}
                                    <div>
                                      <span className="font-bold text-sm text-[var(--text-main)]">{bizName}</span>
                                      <span className="text-[11px] text-[var(--text-subtle)] ml-2">({bizOpps.length} actionable improvements)</span>
                                    </div>
                                  </div>
                                  <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                    +${totalBizGain.toLocaleString()}/wk total potential
                                  </span>
                                </div>

                                <div className="space-y-2">
                                  {bizOpps.map((op) => (
                                    <div key={op.id} className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                                      <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                          <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded uppercase ${
                                            op.category === 'Pricing' || op.category === 'Scheduling' || op.category === 'Operating Hours'
                                              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                              : op.category === 'Workforce'
                                              ? 'bg-sky-500/10 text-sky-600 border border-sky-500/20'
                                              : op.category === 'Marketing'
                                              ? 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                                              : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                          }`}>
                                            {op.category}
                                          </span>
                                          <span className="font-bold text-[var(--text-main)]">{op.title}</span>
                                        </div>
                                        <p className="text-[11px] text-[var(--text-muted)]">{op.description}</p>
                                        <div className="text-[10px] text-[var(--text-subtle)]">
                                          Current: <span className="font-mono text-[var(--text-main)] font-semibold">{op.current}</span> &rarr; Target: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{op.recommended}</strong>
                                        </div>
                                      </div>

                                      <div className="sm:text-right shrink-0">
                                        <span className="text-sm font-mono font-extrabold text-emerald-600 dark:text-emerald-400 block">
                                          +${op.weeklyImpact.toLocaleString()}/wk
                                        </span>
                                        <span className="text-[9px] text-[var(--text-subtle)]">Est. Gain</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 8: MOD TELEMETRY ================= */}
          {currentView === 'mod' && (
            <div className="max-w-2xl space-y-5 p-6 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs">
              <div>
                <h2 className="text-base font-bold text-[var(--text-main)] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  <span>Big Ambitions Companion (Live HQ Mod)</span>
                </h2>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
                  Streams your in-game empire telemetry (live cash, business revenue, 7-day employee schedules, price margins, and real estate) to this dashboard via a lightweight local JSON server (<code className="font-mono bg-[var(--bg-base)] px-1 py-0.5 rounded">http://127.0.0.1:8765/</code>).
                </p>
              </div>

              {/* Dual Download Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Steam Workshop */}
                <div className="p-4 rounded-2xl bg-[var(--bg-base)] border-2 border-emerald-500/40 flex flex-col justify-between space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--text-main)]">Steam Workshop</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[9px] font-bold">
                      RECOMMENDED
                    </span>
                  </div>

                  <a
                    href="https://steamcommunity.com/sharedfiles/filedetails/?id=3793615072"
                    target="_blank"
                    rel="noreferrer"
                    className="relative overflow-hidden w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-xs shadow-xs group/btn"
                  >
                    {/* Steam Watermark SVG Background inside button */}
                    <div className="absolute -right-3 -bottom-5 w-24 h-24 opacity-[0.16] group-hover/btn:opacity-[0.26] group-hover/btn:scale-110 transition-all pointer-events-none text-white">
                      <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                        <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.029 4.524 4.524s-2.03 4.524-4.524 4.524h-.105l-4.076 2.911c0 .052.005.105.005.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 14.819C1.94 20.06 6.728 24 12.427 24 19.07 24 24 18.627 24 11.979 24 5.331 18.622 0 11.979 0zM7.54 18.216c-.767-.317-1.132-1.2-.815-1.967.317-.768 1.202-1.133 1.968-.816.767.317 1.133 1.2.816 1.968-.318.767-1.202 1.132-1.969.815zm8.4-9.306c0-1.674 1.362-3.036 3.036-3.036 1.674 0 3.036 1.362 3.036 3.036 0 1.675-1.362 3.037-3.036 3.037-1.674 0-3.036-1.362-3.036-3.037z"/>
                      </svg>
                    </div>

                    <Download className="w-3.5 h-3.5 relative z-10" />
                    <span className="relative z-10 font-bold tracking-wide">Subscribe on Steam</span>
                    <ExternalLink className="w-3 h-3 opacity-70 ml-0.5 relative z-10" />
                  </a>
                </div>

                {/* GitHub */}
                <div className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] flex flex-col justify-between space-y-3 group">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[var(--text-main)]">Standalone (MelonLoader)</span>
                  </div>

                  <a
                    href="https://github.com/tiagovitorin/BigAmbitionsCompanion/releases/tag/v2.2.1"
                    target="_blank"
                    rel="noreferrer"
                    className="relative overflow-hidden w-full py-3 px-4 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] text-[var(--text-main)] font-bold flex items-center justify-center gap-2 transition-all cursor-pointer text-xs group/btn"
                  >
                    {/* GitHub Watermark SVG Background inside button */}
                    <div className="absolute -right-3 -bottom-5 w-24 h-24 opacity-[0.09] dark:opacity-[0.14] group-hover/btn:opacity-[0.20] group-hover/btn:scale-110 transition-all pointer-events-none text-current">
                      <svg className="w-full h-full fill-current" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                      </svg>
                    </div>

                    <Download className="w-3.5 h-3.5 text-[var(--text-muted)] relative z-10" />
                    <span className="relative z-10 font-bold tracking-wide">Download on GitHub</span>
                    <ExternalLink className="w-3 h-3 opacity-60 ml-0.5 relative z-10" />
                  </a>
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default function LiveSyncDashboardPage() {
  return (
    <Suspense fallback={
      <div className="w-full space-y-8 p-6 sm:p-8 animate-pulse">
        <div className="flex items-center justify-between pb-6 border-b border-[var(--border-base)]">
          <div className="space-y-2">
            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            <div className="h-4 w-80 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
          <div className="h-10 w-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-[var(--border-base)]" />
          <div className="h-28 bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-[var(--border-base)]" />
          <div className="h-28 bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-[var(--border-base)]" />
          <div className="h-28 bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-[var(--border-base)]" />
        </div>
      </div>
    }>
      <LiveSyncDashboardContent />
    </Suspense>
  );
}