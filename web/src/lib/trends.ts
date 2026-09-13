// Week-on-week site trends from the recorded per-day revenue series.
//
// A site's last seven days are compared with the seven before them, but only when
// both weeks are fully behind it and the site is old enough that its opening ramp
// is not the thing being measured. Otherwise the comparison is left blank rather
// than reported as a movement.

import { LiveBusinessData } from '@/context/LiveSyncContext';

export interface SiteTrend {
  last7: number;
  prev7: number;
  changePct: number | null;
  ready: boolean;
}

const TREND_WINDOW_DAYS = 7;
const TREND_MIN_DAYS = 14;

export function computeSiteTrends(
  businesses: LiveBusinessData[],
  gameDay: number
): Map<string, SiteTrend> {
  const out = new Map<string, SiteTrend>();
  for (const business of businesses) {
    const series = new Map<number, number>();
    for (const entry of business.revenueHistory || []) {
      if (entry.dayNumber != null) series.set(entry.dayNumber, entry.revenue ?? 0);
    }

    const last: number[] = [];
    for (let d = gameDay - TREND_WINDOW_DAYS; d < gameDay; d++) {
      const v = series.get(d);
      if (v !== undefined) last.push(v);
    }
    const prev: number[] = [];
    for (let d = gameDay - TREND_WINDOW_DAYS * 2; d < gameDay - TREND_WINDOW_DAYS; d++) {
      const v = series.get(d);
      if (v !== undefined) prev.push(v);
    }

    const opened = business.creationDay ?? 0;
    const ready =
      gameDay - opened >= TREND_MIN_DAYS &&
      last.length === TREND_WINDOW_DAYS &&
      prev.length === TREND_WINDOW_DAYS;

    const last7 = last.reduce((sum, v) => sum + v, 0);
    const prev7 = prev.reduce((sum, v) => sum + v, 0);

    out.set(business.id, {
      last7,
      prev7,
      changePct: ready && prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : null,
      ready
    });
  }
  return out;
}
