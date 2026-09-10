'use client';

import { BarChart3, Store, Building, Users, Package, CreditCard } from 'lucide-react';
import { LiveBusinessData, LiveEmployeeData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';

interface FinanceIncomeStatementProps {
  businesses: LiveBusinessData[];
  weeklyBusinessRevenue: number;
  weeklyResidentialRevenue: number;
  weeklyRevenueTotal: number;
  totalEmployees: number;
  employees: LiveEmployeeData[];
  weeklyPayrollTotal: number;
  estimatedWeeklyCOGS: number;
  totalWeeklyLeases: number;
  totalWeeklyLoanPayments: number;
  weeklyNetProfit: number;
  netMarginPct: number;
}

export default function FinanceIncomeStatement({
  businesses,
  weeklyBusinessRevenue,
  weeklyResidentialRevenue,
  weeklyRevenueTotal,
  totalEmployees,
  employees,
  weeklyPayrollTotal,
  estimatedWeeklyCOGS,
  totalWeeklyLeases,
  totalWeeklyLoanPayments,
  weeklyNetProfit,
  netMarginPct
}: FinanceIncomeStatementProps) {
  const { t } = useTranslation();
  return (
    <div className="lg:col-span-7 p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <span>{t('liveHq.incomeStatementTitle', 'Itemized Empire Income Statement (7-Day Rolling)')}</span>
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {t('liveHq.incomeStatementSubtitle', 'Consolidated cash flow across all storefronts, real estate, logistics, and debt servicing.')}
          </p>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          {t('liveHq.netMarginLabel', 'Net Margin: {pct}%').replace('{pct}', netMarginPct.toString())}
        </span>
      </div>

      <div className="space-y-3 text-xs">
        {/* Section A: Gross Revenues */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-subtle)] px-2">
            {t('liveHq.grossRevenueStreams', 'A. Gross Revenue Streams')}
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between">
            <span className="font-medium flex items-center gap-2">
              <Store className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('liveHq.commercialSales', 'Commercial Storefront Sales ({count} Locations)').replace('{count}', businesses.length.toString())}</span>
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              +${weeklyBusinessRevenue.toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between">
            <span className="font-medium flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('liveHq.ownedRealEstateNetRent', 'Owned Real Estate & Tenant Net Rent')}</span>
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
              +${weeklyResidentialRevenue.toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between font-bold">
            <span className="text-emerald-700 dark:text-emerald-300">{t('liveHq.totalGrossRevenue', 'Total Consolidated Gross Revenue')}</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">
              +${weeklyRevenueTotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Section B: Operating Expenses (OPEX) */}
        <div className="space-y-1.5 pt-2 border-t border-[var(--border-subtle)]">
          <div className="text-[10px] font-mono font-bold uppercase text-[var(--text-subtle)] px-2">
            {t('liveHq.opexSection', 'B. Operating Expenses & Direct Costs (OPEX)')}
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between">
            <span className="font-medium flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-rose-500" />
              <span>{t('liveHq.staffPayrollWages', 'Staff Payroll & Hourly Wages ({count} Workers)').replace('{count}', (totalEmployees || employees.length).toString())}</span>
            </span>
            <span className="font-mono font-bold text-rose-500">
              -${weeklyPayrollTotal.toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between">
            <span className="font-medium flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-rose-500" />
              <span>{t('liveHq.wholesaleCOGS', 'Estimated Wholesale Inventory Replenishment (COGS)')}</span>
            </span>
            <span className="font-mono font-bold text-rose-500">
              -${estimatedWeeklyCOGS.toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between">
            <span className="font-medium flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-rose-500" />
              <span>{t('liveHq.leasesLabel', 'Storefront, Warehouse & Apartment Leases')}</span>
            </span>
            <span className="font-mono font-bold text-rose-500">
              -${totalWeeklyLeases.toLocaleString()}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between">
            <span className="font-medium flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-rose-500" />
              <span>{t('liveHq.loanRepayments', 'Commercial Bank Loan Repayments & Interest')}</span>
            </span>
            <span className="font-mono font-bold text-rose-500">
              -${totalWeeklyLoanPayments.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Section C: Net Retained Operating Profit */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-surface-elevated)] border-2 border-emerald-500/40 flex items-center justify-between shadow-xs">
          <div>
            <div className="font-extrabold text-sm text-[var(--text-main)]">{t('liveHq.consolidatedNetCashflow', 'Consolidated Net Weekly Cash Flow')}</div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{t('liveHq.bottomLineDesc', 'True bottom-line profit deposited to bank weekly')}</div>
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
  );
}
