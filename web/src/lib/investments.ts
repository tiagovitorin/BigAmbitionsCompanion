import type { LiveInvestmentData } from '@/context/LiveSyncContext';

// Presentation helpers for the Investment Funds dashboard. Everything here is
// derived from recorded game state (deposits, withdrawals, interest, development
// history) or the fund catalog (yearly return cycle, risk tier). No projections.

// Shared fund palette so a fund has the same colour in the performance chart and
// the allocation donut.
export const FUND_COLORS = ['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#f43f5e', '#14b8a6', '#eab308', '#ec4899'];

export function colorForKey(key: string): string {
  if (key === 'other') return '#94a3b8';
  const index = Number(String(key).replace(/^f/, '')) || 0;
  return FUND_COLORS[index % FUND_COLORS.length];
}

export interface FundPoint {
  day: number;
  value: number;
}

export function totalContributions(inv: LiveInvestmentData): number {
  return (inv.initialDeposit || 0) + (inv.additionalInvestment || 0);
}

export function netInvested(inv: LiveInvestmentData): number {
  return totalContributions(inv) - (inv.withdrawal || 0);
}

// The fund's earned interest (the game rounds interestPayment into CurrentValue).
export function returnAmount(inv: LiveInvestmentData): number {
  return inv.interestPayment || 0;
}

export function returnPct(inv: LiveInvestmentData): number | null {
  const basis = netInvested(inv);
  if (basis <= 0) return null;
  return (returnAmount(inv) / basis) * 100;
}

export function todayChange(inv: LiveInvestmentData): number | null {
  const history = inv.developmentHistory;
  if (!history || history.length === 0) return null;
  return history[history.length - 1].change;
}

// Total interest earned each recorded day (sum of every fund's daily change).
export function dailyInterestSeries(investments: LiveInvestmentData[]): FundPoint[] {
  const byDay = new Map<number, number>();
  investments.forEach(inv => (inv.developmentHistory || []).forEach(e => {
    byDay.set(e.day, (byDay.get(e.day) || 0) + (e.change || 0));
  }));
  return [...byDay.entries()].sort((a, b) => a[0] - b[0]).map(([day, value]) => ({ day, value }));
}

export function averageDailyInterest(investments: LiveInvestmentData[]): number | null {
  const series = dailyInterestSeries(investments);
  if (series.length === 0) return null;
  return series.reduce((a, s) => a + s.value, 0) / series.length;
}

export function fundSeries(inv: LiveInvestmentData): FundPoint[] {
  return [...(inv.developmentHistory || [])]
    .sort((a, b) => a.day - b.day)
    .map(e => ({ day: e.day, value: e.newBalance }));
}

export interface PortfolioSeriesFund {
  key: string;
  name: string;
}

export interface PortfolioSeriesPoint {
  day: number;
  total: number;
  [fundKey: string]: number;
}

export interface PortfolioSeries {
  data: PortfolioSeriesPoint[];
  funds: PortfolioSeriesFund[];
}

// Align every fund's recorded balance by day (carrying each fund's last balance
// forward) so the chart can plot each fund individually plus the combined total.
export function buildPortfolioSeries(investments: LiveInvestmentData[]): PortfolioSeries {
  const funds = investments.map((inv, i) => ({ key: `f${i}`, name: inv.name || `Fund ${i + 1}` }));
  const days = new Set<number>();
  investments.forEach(inv => (inv.developmentHistory || []).forEach(e => days.add(e.day)));
  const sortedDays = [...days].sort((a, b) => a - b);
  const perFund = investments.map(inv =>
    [...(inv.developmentHistory || [])].sort((a, b) => a.day - b.day)
  );

  const data = sortedDays.map(day => {
    const point: PortfolioSeriesPoint = { day, total: 0 };
    perFund.forEach((history, i) => {
      let balance = 0;
      for (const entry of history) {
        if (entry.day <= day) balance = entry.newBalance;
        else break;
      }
      point[funds[i].key] = balance;
      point.total += balance;
    });
    return point;
  });

  return { data, funds };
}

export interface PortfolioTotals {
  value: number;
  contributions: number;
  withdrawals: number;
  net: number;
  todayInterest: number | null;
  autoInvesting: number;
}

export function portfolioTotals(investments: LiveInvestmentData[]): PortfolioTotals {
  const value = investments.reduce((a, i) => a + (i.currentValue || 0), 0);
  const contributions = investments.reduce((a, i) => a + totalContributions(i), 0);
  const withdrawals = investments.reduce((a, i) => a + (i.withdrawal || 0), 0);
  const net = contributions - withdrawals;

  const changes = investments.map(todayChange).filter((c): c is number => c != null);
  const todayInterest = changes.length > 0 ? changes.reduce((a, c) => a + c, 0) : null;

  return {
    value,
    contributions,
    withdrawals,
    net,
    todayInterest,
    autoInvesting: investments.filter(i => i.isAutoInvesting).length
  };
}

export interface AllocationSlice {
  key: string;
  name: string;
  value: number;
  pct: number;
}

export function allocation(investments: LiveInvestmentData[]): AllocationSlice[] {
  const value = investments.reduce((a, i) => a + (i.currentValue || 0), 0);
  if (value <= 0) return [];
  return investments
    .map((inv, i) => ({ key: `f${i}`, name: inv.name || `Fund ${i + 1}`, value: inv.currentValue || 0, pct: ((inv.currentValue || 0) / value) * 100 }))
    .sort((a, b) => b.value - a.value);
}
