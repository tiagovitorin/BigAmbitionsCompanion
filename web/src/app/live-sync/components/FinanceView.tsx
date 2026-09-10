'use client';

import Link from 'next/link';
import { DollarSign, TrendingDown, Percent, Shield, PiggyBank, ArrowUpRight } from 'lucide-react';
import { LiveBusinessData, LiveEmployeeData, LiveLoanData, LiveWarehouseData, LiveInvestmentData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import { computeFinanceMetrics } from '@/lib/finance';
import FinanceIncomeStatement from './FinanceIncomeStatement';
import FinanceTaxPanel from './FinanceTaxPanel';
import FinanceUnitEconomics from './FinanceUnitEconomics';

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
  investments: LiveInvestmentData[];
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
  investments
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
    daysPerYear
  });

  return (
    <div className="space-y-6">
      {/* 1. EXECUTIVE TREASURY & RUNWAY KPI STRIP */}
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
            <Shield className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-500">
            ${(unpaidTaxes || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>{t('liveHq.nextFilingCycle', 'Next Filing Cycle:')}</span>
            <strong className="font-mono text-[var(--text-main)]">
              {t('liveHq.filingCycleInfo', 'Day {day} (in {days}d)').replace('{day}', metrics.nextTaxFilingDay.toString()).replace('{days}', metrics.daysRemainingToTax.toString())}
            </strong>
          </div>
        </div>
      </div>

      {/* 2. LIVE INVESTMENT FUNDS */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-emerald-500" />
            <span>{t('liveHq.investments', 'Investment Funds')}</span>
          </h3>
          <Link href="/banking" className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1">
            <span>{t('liveHq.wikiReference', 'Wiki Reference')}</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
        {investments.length === 0 ? (
          <div className="py-6 text-center text-xs text-[var(--text-subtle)]">{t('liveHq.noInvestments', 'No active investment funds')}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {investments.map((inv, i) => (
              <div key={`${inv.name}-${i}`} className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--text-main)]">{inv.name}</span>
                  {inv.isAutoInvesting && <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-600">{t('liveHq.autoInvest', 'Auto-Invest')}</span>}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-subtle)]">{t('liveHq.currentValue', 'Current Value')}</span>
                  <strong className="font-mono text-emerald-600 dark:text-emerald-400">${(inv.currentValue || 0).toLocaleString()}</strong>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[var(--text-subtle)]">{t('liveHq.interestEarned', 'Interest Earned')}</span>
                  <strong className={`font-mono ${(inv.interestPayment || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {(inv.interestPayment || 0) >= 0 ? `+$${(inv.interestPayment || 0).toLocaleString()}` : `-$${Math.abs(inv.interestPayment || 0).toLocaleString()}`}
                  </strong>
                </div>
                {(inv.autoInvestment || 0) > 0 && (
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-subtle)]">{t('liveHq.autoInvestment', 'Auto Contribution')}</span>
                    <strong className="font-mono text-[var(--text-main)]">${(inv.autoInvestment || 0).toLocaleString()}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. SIDE-BY-SIDE: DETAILED INCOME STATEMENT & IRS TAX OPTIMIZER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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

        <FinanceTaxPanel
          unpaidTaxes={unpaidTaxes}
          taxDeductibleExpenses={taxDeductibleExpenses}
          taxDeductionSavings={metrics.taxDeductionSavings}
          dailyBurnRate={metrics.dailyBurnRate}
          nextTaxFilingDay={metrics.nextTaxFilingDay}
          daysRemainingToTax={metrics.daysRemainingToTax}
          loans={loans}
          totalDailyLoanPayments={metrics.totalDailyLoanPayments}
        />
      </div>

      {/* 3. STORE-BY-STORE UNIT ECONOMICS LEADERBOARD */}
      <FinanceUnitEconomics businesses={businesses} />
    </div>
  );
}
