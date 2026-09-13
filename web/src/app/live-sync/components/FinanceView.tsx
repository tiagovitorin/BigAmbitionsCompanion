'use client';

import { DollarSign, TrendingDown, Percent, Landmark } from 'lucide-react';
import { LiveBusinessData, LiveEmployeeData, LiveLoanData, LiveWarehouseData, LiveLogisticsPlanData, LiveWeeklyRevenueEntry } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import { computeFinanceMetrics, computeCashFlow } from '@/lib/finance';
import FinanceIncomeStatement from './FinanceIncomeStatement';
import FinanceTaxPanel from './FinanceTaxPanel';
import CashFlowPanel from './CashFlowPanel';

interface FinanceViewProps {
  businesses: LiveBusinessData[];
  warehouses: LiveWarehouseData[];
  loans: LiveLoanData[];
  employees: LiveEmployeeData[];
  playerCash: number;
  unpaidTaxes: number;
  weeklyNetProfit: number;
  weeklyRevenueTotal: number;
  weeklyPayrollTotal: number;
  weeklyResidentialExpenses: number;
  weeklyBusinessRevenue: number;
  weeklyResidentialRevenue: number;
  totalEmployees: number;
  gameDay: number;
  taxDeductibleExpenses: number;
  taxPercentage: number;
  daysPerYear: number;
  logisticsPlans: LiveLogisticsPlanData[];
  midnightBankBalances?: number[];
  weeklyRevenueHistory?: LiveWeeklyRevenueEntry[];
}

export default function FinanceView({
  businesses,
  warehouses,
  loans,
  employees,
  playerCash,
  unpaidTaxes,
  weeklyNetProfit,
  weeklyRevenueTotal,
  weeklyPayrollTotal,
  weeklyResidentialExpenses,
  weeklyBusinessRevenue,
  weeklyResidentialRevenue,
  totalEmployees,
  gameDay,
  taxDeductibleExpenses,
  taxPercentage,
  daysPerYear,
  logisticsPlans,
  midnightBankBalances,
  weeklyRevenueHistory
}: FinanceViewProps) {
  const { t } = useTranslation();
  const metrics = computeFinanceMetrics({
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
  });

  // Reconciliation of booked profit against the treasury's actual movement, read
  // straight from the game's own midnight balances and daily profit record.
  const cashFlow = computeCashFlow(midnightBankBalances, weeklyRevenueHistory, gameDay);

  return (
    <div className="space-y-6">
      {/* EXECUTIVE TREASURY & RUNWAY KPI STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.treasuryBalance', 'Treasury Balance')}</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            ${playerCash.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>{t('liveHq.zeroRevenueRunway', 'Zero-Revenue Runway:')}</span>
            <strong className={`font-mono ${Number.isFinite(metrics.cashRunwayDays) && metrics.cashRunwayDays < 14 ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {Number.isFinite(metrics.cashRunwayDays) ? `~${metrics.cashRunwayDays} ${t('liveHq.daysWord', 'Days')}` : '∞'}
            </strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.dailyCashBurn', 'Daily Cash Burn')}</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-500">
            -${metrics.dailyBurnRate.toLocaleString()}<span className="text-xs font-normal text-[var(--text-subtle)]">/day</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>{t('liveHq.dailyNetVelocity', 'Daily Net Velocity:')}</span>
            <strong className={`font-mono ${metrics.dailyNetCashFlow >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
              {metrics.dailyNetCashFlow >= 0 ? `+$${metrics.dailyNetCashFlow.toLocaleString()}/d` : `-$${Math.abs(metrics.dailyNetCashFlow).toLocaleString()}/d`}
            </strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.netProfitMargin', 'Net Profit Margin')}</span>
            <Percent className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400">
            {metrics.netMarginPct}%
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>{t('liveHq.weeklyNetProfitLabel', 'Weekly Net Profit:')}</span>
            <strong className="font-mono text-emerald-600 dark:text-emerald-400">
              +${weeklyNetProfit.toLocaleString()}/wk
            </strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.irsTaxReserve', 'IRS Tax Reserve')}</span>
            <Landmark className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-500">
            ${(unpaidTaxes || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>{t('liveHq.nextFilingCycle', 'Next Filing Cycle:')}</span>
            <strong className="font-mono text-[var(--text-main)]">
              {t('liveHq.filingCycleInfo', 'Day {day} (in {days}d)').replace('{day}', metrics.taxDueDay.toString()).replace('{days}', metrics.daysRemainingToTax.toString())}
            </strong>
          </div>
        </div>
      </div>

      {/* INCOME STATEMENT */}
      <section id="finance-income" className="scroll-mt-20">
        <FinanceIncomeStatement
          businesses={businesses}
          weeklyBusinessRevenue={weeklyBusinessRevenue}
          weeklyResidentialRevenue={weeklyResidentialRevenue}
          weeklyRevenueTotal={weeklyRevenueTotal}
          totalEmployees={totalEmployees}
          employees={employees}
          weeklyPayrollTotal={weeklyPayrollTotal}
          estimatedWeeklyCOGS={metrics.estimatedWeeklyCOGS}
          totalWeeklyLeases={metrics.totalWeeklyLeases}
          totalWeeklyLoanPayments={metrics.totalWeeklyLoanPayments}
          weeklyNetProfit={weeklyNetProfit}
          netMarginPct={metrics.netMarginPct}
        />
      </section>

      {/* CASH FLOW RECONCILIATION: where the profit actually went */}
      <section id="finance-cashflow" className="scroll-mt-20">
        <CashFlowPanel cashFlow={cashFlow} />
      </section>

      {/* IRS TAX OPTIMIZER */}
      <section id="finance-tax" className="scroll-mt-20">
        <FinanceTaxPanel
          unpaidTaxes={unpaidTaxes}
          taxDeductibleExpenses={taxDeductibleExpenses}
          taxDeductionSavings={metrics.taxDeductionSavings}
          dailyNetCashFlow={metrics.dailyNetCashFlow}
          taxDueDay={metrics.taxDueDay}
          daysRemainingToTax={metrics.daysRemainingToTax}
          loans={loans}
          totalDailyLoanPayments={metrics.totalDailyLoanPayments}
        />
      </section>

    </div>
  );
}
