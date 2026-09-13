// Weekly hourly capacity model for a single storefront.
//
// Three numbers meet in one grid: the customers the game actually recorded (each
// order-history day keeps 24 hourly readings, and the mod emits the last fortnight),
// the counter capacity that was actually staffed (each work shift names the exact
// counter it was posted to, and only customer-service counters count), and the
// building's own door cap. The smallest of them decides how many people were served,
// and the useful finding is which one binds.

import { LiveBusinessData } from '@/context/LiveSyncContext';
import {
  CAPACITY_AT_CEILING_SHARE,
  CAPACITY_IDLE_RATIO,
  CAPACITY_IDLE_RUN_HOURS,
  CAPACITY_IDLE_MIN_STAFF
} from './thresholds';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export type CapacityLimit = 'building' | 'staffing' | 'registers' | 'none';

export interface CapacityGrid {
  businessId: string;
  name: string;
  door: number; // the building's own per-hour customer cap
  counters: number; // total installed customer-service capacity
  stationCount: number;
  customers: (number | null)[][]; // [day 0=Mon..6=Sun][hour] measured average
  staffed: number[][]; // [day][hour] manned counter capacity
  effective: number[][]; // [day][hour] min(staffed, door)
  idleCell: boolean[][]; // [day][hour] more capacity on than the hour needed
  weeks: number[]; // observations backing each weekday
  peak: number;
  ceilingHours: number; // hours at or above the ceiling
  idleHours: number; // hours of idle capacity (in qualifying runs)
  bindingLimit: CapacityLimit; // what most often limits a full hour
}

// Big Ambitions starts on Day 1 = Monday, so (day - 1) % 7 maps to 0=Mon..6=Sun.
function dayOfWeekIndex(day: number): number {
  return (((day - 1) % 7) + 7) % 7;
}

export function buildCapacityGrid(business: LiveBusinessData, gameDay: number): CapacityGrid | null {
  const stations = business.serviceStations || [];
  const door = business.customerCapacity || 0;
  const counters = stations.reduce((sum, s) => sum + (s.capacityPerHour || 0), 0);
  if (counters === 0 && door === 0) return null;

  // Measured customers per weekday per hour, averaged over however many weeks exist.
  const seen: number[][][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => [] as number[])
  );
  const history = (business.orderHistory || []).filter(h => h.dayNumber != null && h.dayNumber < gameDay);
  for (const entry of history) {
    const wd = dayOfWeekIndex(entry.dayNumber);
    for (const report of entry.hourReports || []) {
      if (report.hour >= 0 && report.hour < 24) seen[wd][report.hour].push(report.customers || 0);
    }
  }
  const weeks = seen.map(row => row.reduce((max, hours) => Math.max(max, hours.length), 0));
  if (!weeks.some(w => w > 0)) return null;

  const customers: (number | null)[][] = seen.map(row =>
    row.map(hours => (hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : null))
  );

  // Staffed counter capacity per weekday/hour. Each shift names one counter, and a
  // counter manned by two people still counts once.
  const stationCapacity = new Map<string, number>();
  stations.forEach(s => stationCapacity.set(s.id, s.capacityPerHour || 0));

  const manned: Set<string>[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => new Set<string>())
  );
  const onShift: Set<string>[][] = Array.from({ length: 7 }, () =>
    Array.from({ length: 24 }, () => new Set<string>())
  );

  (business.scheduleWeek || []).forEach((sd, idx) => {
    const found = WEEKDAYS.findIndex(d => d.toLowerCase() === (sd.day || '').toLowerCase());
    const wd = found >= 0 ? found : idx;
    for (const shift of sd.shifts || []) {
      const start = Math.max(0, Math.floor(shift.startHour ?? 0));
      const end = Math.min(24, Math.floor(shift.endHour ?? 0));
      for (let h = start; h < end; h++) {
        if (shift.employeeId) onShift[wd][h].add(shift.employeeId);
        // Only a station post serves a queue; a cleaning duty (type 0) does not.
        if (shift.shiftType === 0) continue;
        const stationId = shift.itemInstanceId;
        if (stationId && stationCapacity.has(stationId)) manned[wd][h].add(stationId);
      }
    }
  });

  const staffed = manned.map(row =>
    row.map(set => Array.from(set).reduce((sum, id) => sum + (stationCapacity.get(id) || 0), 0))
  );
  const effective = staffed.map(row => row.map(v => (door > 0 ? Math.min(v, door) : v)));

  // Ceiling and binding-limit tally.
  let peak = 0;
  let ceilingHours = 0;
  let buildingBound = 0;
  let staffingBound = 0;
  let registerBound = 0;
  for (let wd = 0; wd < 7; wd++) {
    for (let h = 0; h < 24; h++) {
      const c = customers[wd][h];
      if (c != null) peak = Math.max(peak, c);
      const cap = effective[wd][h];
      if (c == null || cap <= 0) continue;
      if (c >= cap * CAPACITY_AT_CEILING_SHARE) {
        ceilingHours++;
        const mannedCap = staffed[wd][h];
        if (door > 0 && door <= mannedCap) buildingBound++;
        else if (mannedCap < counters) staffingBound++;
        else registerBound++;
      }
    }
  }

  // Idle capacity: qualifying runs of consecutive hours, so a single quiet hour does
  // not read as wasted staffing.
  const idleCell: boolean[][] = Array.from({ length: 7 }, () => new Array(24).fill(false));
  let idleHours = 0;
  for (let wd = 0; wd < 7; wd++) {
    let run = 0;
    for (let h = 0; h <= 24; h++) {
      const c = h < 24 ? customers[wd][h] : null;
      const cap = h < 24 ? staffed[wd][h] : 0;
      const staff = h < 24 ? onShift[wd][h].size : 0;
      const slack = c != null && staff >= CAPACITY_IDLE_MIN_STAFF && cap > Math.max(c, 0.5) * CAPACITY_IDLE_RATIO;
      if (slack) {
        idleCell[wd][h] = true;
        run++;
        continue;
      }
      if (run >= CAPACITY_IDLE_RUN_HOURS) idleHours += run;
      run = 0;
    }
  }

  const bindingLimit: CapacityLimit =
    buildingBound === 0 && staffingBound === 0 && registerBound === 0
      ? 'none'
      : buildingBound >= staffingBound && buildingBound >= registerBound
        ? 'building'
        : staffingBound >= registerBound
          ? 'staffing'
          : 'registers';

  return {
    businessId: business.id,
    name: business.name,
    door,
    counters,
    stationCount: stations.length,
    customers,
    staffed,
    effective,
    idleCell,
    weeks,
    peak,
    ceilingHours,
    idleHours,
    bindingLimit
  };
}

export interface CapacityCell {
  customers: number | null;
  staffed: number;
  effective: number;
  door: number;
  idle: boolean;
  weeks: number;
}

// One cell of the weekly grid, for a given weekday index (0 = Monday) and hour.
export function capacityCellAt(grid: CapacityGrid, dayIndex: number, hour: number): CapacityCell {
  return {
    customers: grid.customers[dayIndex][hour],
    staffed: grid.staffed[dayIndex][hour],
    effective: grid.effective[dayIndex][hour],
    door: grid.door,
    idle: grid.idleCell[dayIndex][hour],
    weeks: grid.weeks[dayIndex]
  };
}
