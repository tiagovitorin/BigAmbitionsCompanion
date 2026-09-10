'use client';

import { ShieldCheck, CreditCard, Sparkles } from 'lucide-react';
import { LiveLoanData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';

interface FinanceTaxPanelProps {
  unpaidTaxes: number;
  taxDeductibleExpenses: number;
  taxDeductionSavings: number;
  dailyBurnRate: number;
  nextTaxFilingDay: number;
  daysRemainingToTax: number;
  loans: LiveLoanData[];
  totalDailyLoanPayments: number;
}

export default function FinanceTaxPanel({
  unpaidTaxes,
  taxDeductibleExpenses,
  taxDeductionSavings,
  dailyBurnRate,
  nextTaxFilingDay,
  daysRemainingToTax,
  loans,
  totalDailyLoanPayments
}: FinanceTaxPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="lg:col-span-5 space-y-6">
      {/* Module 1: IRS Tax Liability & Deductions */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-[var(--text-main)]">{t('liveHq.irsTaxRadar', 'IRS Tax Liability Radar')}</h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
            {t('liveHq.taxCycleLabel', 'Day {day} Cycle ({days}d left)').replace('{day}', nextTaxFilingDay.toString()).replace('{days}', daysRemainingToTax.toString())}
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-1">
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span>{t('liveHq.outstandingTaxBill', 'Outstanding Unpaid Tax Bill:')}</span>
              <span className="font-mono font-bold text-rose-500 text-sm">
                ${(unpaidTaxes || 0).toLocaleString()}
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-subtle)]">
              {t('liveHq.taxPayOnTime', 'Pay on time via Uncle Fred or IRS office to avoid business account lockouts.')}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-1">
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span>{t('liveHq.taxDeductibleLogged', 'Tax Deductible Expenses Logged:')}</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                ${(taxDeductibleExpenses || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-[var(--text-subtle)] pt-1 border-t border-[var(--border-subtle)]">
              <span>{t('liveHq.directTaxSaved', 'Direct IRS Tax Saved:')}</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono">+${taxDeductionSavings.toLocaleString()}</strong>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] space-y-1">
            <div className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('liveHq.recommendedReserve', 'Recommended Minimum Cash Reserve:')}</span>
            </div>
            <div className="font-mono font-bold text-sm text-[var(--text-main)]">
              ${Math.max(unpaidTaxes || 0, dailyBurnRate * 7 + (unpaidTaxes || 0)).toLocaleString()}
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              {t('liveHq.reserveDesc', 'Covers 7 days of payroll & rents + full current IRS obligations.')}
            </p>
          </div>
        </div>
      </div>

      {/* Module 2: Commercial Bank Debt & Amortization */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-sky-500" />
            <h3 className="text-sm font-bold text-[var(--text-main)]">{t('liveHq.commercialLoanPortfolio', 'Commercial Loan Portfolio ({count})').replace('{count}', loans.length.toString())}</h3>
          </div>
          <span className="text-[10px] font-mono text-sky-500 font-bold">
            -${totalDailyLoanPayments.toLocaleString()}/day
          </span>
        </div>

        {loans.length > 0 ? (
          <div className="space-y-2.5 text-xs">
            {loans.map((loan, idx) => {
              const remaining = loan.remainingAmount ?? loan.totalAmount;
              const progress = loan.totalAmount > 0 ? Math.round(((loan.totalAmount - remaining) / loan.totalAmount) * 100) : 0;
              const daysToPayoff = loan.dailyPayment > 0 ? Math.ceil(remaining / loan.dailyPayment) : 0;

              return (
                <div key={idx} className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-[var(--text-main)]">{t('liveHq.cityCommercialLoan', 'City Commercial Bank Loan #{n}').replace('{n}', (idx + 1).toString())}</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        {t('liveHq.dailyPaymentLabel', 'Daily Payment:')} <strong className="font-mono text-rose-500">-${loan.dailyPayment}/d</strong> (${loan.weeklyPayment ?? loan.dailyPayment * 7}/wk)
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs text-[var(--text-main)]">
                      ${remaining.toLocaleString()} <span className="text-[10px] text-[var(--text-subtle)] font-normal">/ ${loan.totalAmount.toLocaleString()}</span>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="w-full h-1.5 rounded-full bg-[var(--bg-surface)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-500 transition-all duration-300"
                        style={{ width: `${Math.max(5, progress)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--text-subtle)]">
                      <span>{t('liveHq.principalRepaid', '{pct}% Principal Repaid').replace('{pct}', progress.toString())}</span>
                      <span>{t('liveHq.payoffInDays', 'Payoff in ~{days} Days').replace('{days}', daysToPayoff.toString())}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 text-center text-xs text-[var(--text-muted)] bg-[var(--bg-base)] rounded-xl border border-[var(--border-base)]">
            {t('liveHq.zeroLoans', 'Zero active bank loans. 100% equity owned empire.')}
          </div>
        )}
      </div>
    </div>
  );
}
