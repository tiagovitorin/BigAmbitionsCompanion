import { LiveBusinessData, LiveLoanData, LiveWarehouseData } from '@/context/LiveSyncContext';

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
  nextTaxFilingDay: number;
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
  daysPerYear
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

  // Big Ambitions tax cycle: taxes are due on days where Day % daysPerYear == 0.
  // Use the live game variables so non-default difficulties are reflected correctly.
  const safeTaxRate = taxPercentage > 0 ? taxPercentage : 10; // game default tax rate is 10%
  const safeDaysPerYear = daysPerYear > 0 ? daysPerYear : 60; // game default year is 60 days
  const currentDay = gameDay || 1;
  const nextTaxFilingDay = Math.ceil(currentDay / safeDaysPerYear) * safeDaysPerYear;
  const daysRemainingToTax = Math.max(0, nextTaxFilingDay - currentDay);
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
    nextTaxFilingDay,
    daysRemainingToTax,
    taxDeductionSavings
  };
}
