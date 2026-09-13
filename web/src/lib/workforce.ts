import type { LiveEmployeeData } from '@/context/LiveSyncContext';

// The true weekly cost of an employee: their hourly wage times the hours they are
// actually contracted for. A cheap hourly worker with many hours can cost more
// than an expensive one with few, so this must be its own figure rather than the
// hourly wage. Uses the mod's weeklyWages when present, otherwise the product.
export function weeklyCost(employee: LiveEmployeeData): number {
  if (typeof employee.weeklyWages === 'number') return employee.weeklyWages;
  return (employee.wage || 0) * (employee.weeklyHours || 0);
}
