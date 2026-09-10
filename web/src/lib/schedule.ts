import { LiveEmployeeData, LiveScheduleDay, LiveWorkShift } from '@/context/LiveSyncContext';

export const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

// Approximate placeholder traffic defaults used ONLY when a business definition omits its own
// operating_schedule curve. These are NOT authoritative game data; the compendium's per-business
// day_multipliers / hourly_multipliers take precedence wherever available.
export const DEFAULT_DAY_MULTIPLIERS: Record<string, number> = {
  Monday: 0.85,
  Tuesday: 0.75,
  Wednesday: 0.75,
  Thursday: 0.75,
  Friday: 0.85,
  Saturday: 1.0,
  Sunday: 0.95
};

// Hourly customer-traffic curve used when a business definition omits its own curve.
export const DEFAULT_HOURLY_CURVE: number[] = Array(24).fill(0.5);

// Rush-hour windows used by the 7x24 schedule matrix.
export const DEFAULT_PEAK_HOURS: number[] = [11, 12, 13, 17, 18, 19];

export interface RecommendedWindow {
  startHour: number;
  endHour: number;
}

export function parseRecommendedWindow(window: string | undefined): RecommendedWindow | null {
  if (!window) return null;
  const match = window.match(/(\d{1,2}):00\s*-\s*(\d{1,2}):00/);
  if (!match) return null;
  return {
    startHour: parseInt(match[1], 10),
    endHour: parseInt(match[2], 10)
  };
}

export function isHourOpenForSchedule(sd: LiveScheduleDay | undefined, hour: number): boolean {
  if (!sd || !sd.isOpen) return false;

  if (Array.isArray(sd.hoursOpen) && sd.hoursOpen.length === 24) {
    return !!sd.hoursOpen[hour];
  }

  if (sd.startHour !== undefined && sd.endHour !== undefined && sd.startHour !== -1 && (sd.endHour - sd.startHour > 0)) {
    return hour >= sd.startHour && hour < sd.endHour;
  }

  const shifts = sd.shifts || [];
  if (shifts.length > 0) {
    const minShiftHour = Math.min(...shifts.map(s => s.startHour));
    const maxShiftHour = Math.max(...shifts.map(s => s.endHour));
    return hour >= minShiftHour && hour < maxShiftHour;
  }

  return false;
}

export type ShiftRoleCategory = 'cleaner' | 'security' | 'logistics' | 'cashier';

export function getShiftRoleCategory(shift: LiveWorkShift, employees: LiveEmployeeData[]): ShiftRoleCategory {
  const emp = employees.find(e => e.id === shift.employeeId || e.name === shift.employeeName);
  const skill = (shift.skillName || emp?.primarySkillName || '').toLowerCase();
  const role = (shift.role || '').toLowerCase();
  const station = ((shift as any).stationName || '').toLowerCase();

  if (role === 'cleaner' || skill.includes('clean') || station.includes('clean')) return 'cleaner';
  if (role === 'security' || skill.includes('security') || skill.includes('guard') || station.includes('security')) return 'security';
  if (role === 'logistics' || skill.includes('logistic') || skill.includes('driver') || station.includes('logistic')) return 'logistics';
  return 'cashier';
}

export function computeBreakEvenCustomers(hourlyCost: number, profitPerCustomer: number): number | null {
  if (hourlyCost <= 0 || profitPerCustomer <= 0) return null;
  return Math.ceil(hourlyCost / profitPerCustomer);
}
