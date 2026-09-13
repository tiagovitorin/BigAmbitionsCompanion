import { LiveBusinessData, LiveLoanData, LiveWarehouseData, LiveWeeklyRevenueEntry } from '@/context/LiveSyncContext';
import { TAX_GRACE_DAYS } from './thresholds';

export interface FinanceMetrics {
  totalWeeklyLoanPayments: number;
  totalDailyLoanPayments: number;
  totalWeeklyRentCommercial: number;
  totalWeeklyRentWarehouses: number;
  totalWeeklyLeases: number;
  estimatedWeeklyCOGS: number;
  totalWeeklyOPEX: number;
  dailyBurnRate: number;
  dailyGrossRevenue: number;
  dailyNetCashFlow: number;
  netMarginPct: number;
  cashRunwayDays: number;
  taxDueDay: number;
  daysRemainingToTax: number;
  taxDeductionSavings: number;
}

interface FinanceMetricsParams {
  loans: LiveLoanData[];
  businesses: LiveBusinessData[];
  warehouses: LiveWarehouseData[];
  weeklyResidentialExpenses: number;
  weeklyPayrollTotal: number;
  weeklyRevenueTotal: number;
  weeklyNetProfit: number;
  playerCash: number;
  gameDay: number;
  taxDeductibleExpenses: number;
  taxPercentage: number;
  daysPerYear: number;
  unpaidTaxes: number;
}

export function computeFinanceMetrics({
  loans,
  businesses,
  warehouses,
  weeklyResidentialExpenses,
  weeklyPayrollTotal,
  weeklyRevenueTotal,
  weeklyNetProfit,
  playerCash,
  gameDay,
  taxDeductibleExpenses,
  taxPercentage,
  daysPerYear,
  unpaidTaxes
}: FinanceMetricsParams): FinanceMetrics {
  const totalWeeklyLoanPayments = loans.reduce((acc, l) => acc + (l.weeklyPayment ?? l.dailyPayment * 7), 0);
  const totalDailyLoanPayments = loans.reduce((acc, l) => acc + l.dailyPayment, 0);
  const totalWeeklyRentCommercial = businesses.reduce((acc, b) => acc + (b.weeklyRent ?? 0), 0);
  const totalWeeklyRentWarehouses = warehouses.reduce((acc, w) => acc + (w.rentPerWeek ?? w.rentPerDay * 7), 0);
  const totalWeeklyLeases = totalWeeklyRentCommercial + totalWeeklyRentWarehouses + (weeklyResidentialExpenses || 0);

  // Factual weekly COGS: sum recorded wholesale cost across each storefront's last 7 days of order history.
  // No synthetic multipliers or revenue-based guesses are applied.
  const estimatedWeeklyCOGS = businesses.reduce((acc, b) => {
    const historyWholesale = (b.orderHistory || []).slice(-7).reduce(
      (sum, day) => sum + (day.itemSales || []).reduce((s, it) => s + (it.totalWholesalePrice || 0), 0),
      0
    );
    if (historyWholesale > 0) return acc + historyWholesale;

    const todayWholesale = (b.todayItemSales || b.todayOrderSales || []).reduce(
      (s, it) => s + (it.totalWholesalePrice || 0),
      0
    );
    return acc + todayWholesale;
  }, 0);

  // Daily and weekly burn rates
  const totalWeeklyOPEX = weeklyPayrollTotal + totalWeeklyLeases + estimatedWeeklyCOGS + totalWeeklyLoanPayments;
  const dailyBurnRate = Math.round(totalWeeklyOPEX / 7);
  const dailyGrossRevenue = Math.round(weeklyRevenueTotal / 7);
  const dailyNetCashFlow = dailyGrossRevenue - dailyBurnRate;
  const netMarginPct = weeklyRevenueTotal > 0 ? Math.round((weeklyNetProfit / weeklyRevenueTotal) * 100) : 0;
  const cashRunwayDays = dailyBurnRate > 0 ? Math.round(playerCash / dailyBurnRate) : Infinity;

  // Big Ambitions tax cycle: the IRS issues the bill on days where Day % daysPerYear == 0
  // and gives TAX_GRACE_DAYS (20, TaxHelper.DaysToPayOnFirstWarning) to pay before the
  // first late-payment warning. Use the live game variables so non-default difficulties
  // are reflected correctly.
  const safeTaxRate = taxPercentage > 0 ? taxPercentage : 10; // game default tax rate is 10%
  const safeDaysPerYear = daysPerYear > 0 ? daysPerYear : 60; // game default year is 60 days
  const currentDay = gameDay || 1;
  const atYearEnd = currentDay % safeDaysPerYear === 0;
  const lastYearEnd = atYearEnd ? currentDay : Math.floor(currentDay / safeDaysPerYear) * safeDaysPerYear;
  const nextYearEnd = atYearEnd ? currentDay + safeDaysPerYear : Math.ceil(currentDay / safeDaysPerYear) * safeDaysPerYear;
  // If a bill is already outstanding, it is due 20 days after the year-end that issued
  // it; otherwise plan for the next year-end plus the grace window.
  const taxNoticeDay = unpaidTaxes > 0 && lastYearEnd > 0 ? lastYearEnd : nextYearEnd;
  const taxDueDay = taxNoticeDay + TAX_GRACE_DAYS;
  const daysRemainingToTax = Math.max(0, taxDueDay - currentDay);
  const taxDeductionSavings = Math.round((taxDeductibleExpenses || 0) * (safeTaxRate / 100));

  return {
    totalWeeklyLoanPayments,
    totalDailyLoanPayments,
    totalWeeklyRentCommercial,
    totalWeeklyRentWarehouses,
    totalWeeklyLeases,
    estimatedWeeklyCOGS,
    totalWeeklyOPEX,
    dailyBurnRate,
    dailyGrossRevenue,
    dailyNetCashFlow,
    netMarginPct,
    cashRunwayDays,
    taxDueDay,
    daysRemainingToTax,
    taxDeductionSavings
  };
}

// Where the profit actually went. Profit is a claim about trading; cash is what is
// left after paying for the next shop and next week's stock. The gap between them is
// the number worth seeing: the cash that was put back into stock and setup.
//
// Grounded in the game's own record, not a browser-side guess: the mod streams up to
// seven cash-at-midnight readings (`midnightBankBalances`) and seven days of booked
// profit (`weeklyRevenueHistory`), so this is available on the first telemetry poll.
export interface CashFlowDay {
  day: number;
  cashDelta: number; // cash at this midnight, relative to the window start
  cumulativeProfit: number; // booked profit from the window start up to this midnight
}

export interface CashFlowReconciliation {
  days: number;
  fromDay: number;
  toDay: number;
  cashFrom: number;
  cashTo: number;
  cashChange: number;
  profit: number;
  reinvested: number;
  series: CashFlowDay[];
}

export function computeCashFlow(
  midnightBankBalances: number[] | undefined,
  weeklyRevenueHistory: LiveWeeklyRevenueEntry[] | undefined,
  gameDay: number
): CashFlowReconciliation | null {
  const balances = (midnightBankBalances || []).filter(v => Number.isFinite(v));
  if (balances.length < 2) return null;

  const windowDays = balances.length - 1;
  // Completed days only: the current day's profit is still in progress.
  const profits = (weeklyRevenueHistory || [])
    .filter(entry => Number.isFinite(entry.profit) && entry.dayNumber != null && entry.dayNumber < gameDay)
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .slice(-windowDays);

  const cashFrom = balances[0];
  const cashTo = balances[balances.length - 1];
  const cashChange = cashTo - cashFrom;

  // The first midnight is the window start and carries no profit yet; each following
  // one adds a completed day. Both series start at zero so the gap between them is
  // exactly the money that did not stay as cash.
  const series: CashFlowDay[] = balances.map((cash, i) => ({
    day: gameDay - (balances.length - 1) + i,
    cashDelta: cash - cashFrom,
    cumulativeProfit: profits.slice(0, i).reduce((sum, entry) => sum + entry.profit, 0)
  }));

  const profit = series[series.length - 1].cumulativeProfit;

  return {
    days: windowDays,
    fromDay: series[0].day,
    toDay: gameDay,
    cashFrom,
    cashTo,
    cashChange,
    profit,
    reinvested: profit - cashChange,
    series
  };
}
