'use client';

import { Landmark, Percent, PiggyBank, Scale, ArrowDownToLine } from 'lucide-react';

import { useTranslation } from '@/context/LanguageContext';

const BANKS = [
  { name: 'Vantander Bank', address: '6 Second Avenue', district: "Hell's Kitchen" },
  { name: 'Jensen Capital', address: '17 Fourth Avenue', district: 'Garment District' },
];

export default function BankingPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
          <Landmark className="w-5 h-5 text-emerald-500" />
          <span>{t('banking.title', 'Banking & Investment Guide')}</span>
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {t('banking.subtitle', 'How loans, daily interest, and investment funds work in Big Ambitions.')}
        </p>
      </div>

      {/* Banks */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <Landmark className="w-4 h-4 text-emerald-500" />
          <span>{t('banking.banks', 'Banks')}</span>
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          {t('banking.banksDesc', 'Two banks offer loans and investment funds. Visit in person or call them from your Contacts app.')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {BANKS.map((bank) => (
            <div key={bank.name} className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
              <div className="font-bold text-xs text-[var(--text-main)]">{bank.name}</div>
              <div className="text-[11px] text-[var(--text-subtle)] mt-0.5">
                {bank.address} - {bank.district}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Loans */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <Percent className="w-4 h-4 text-emerald-500" />
          <span>{t('banking.loans', 'Loans')}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
            <div className="text-[var(--text-subtle)]">{t('banking.dailyPayment', 'Daily Principal Payment')}</div>
            <div className="font-mono font-bold text-[var(--text-main)] mt-1">
              {t('banking.dailyPaymentFormula', 'amount / payback days')}
            </div>
            <div className="text-[10px] text-[var(--text-subtle)] mt-1">
              {t('banking.dailyPaymentNote', 'Minimum $5 per day, auto-deducted.')}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
            <div className="text-[var(--text-subtle)]">{t('banking.dailyInterest', 'Daily Interest')}</div>
            <div className="font-mono font-bold text-[var(--text-main)] mt-1">
              {t('banking.dailyInterestFormula', 'amount x rate / days per year')}
            </div>
            <div className="text-[10px] text-[var(--text-subtle)] mt-1">
              {t('banking.dailyInterestNote', 'Charged on top of the principal payment.')}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
            <div className="text-[var(--text-subtle)]">{t('banking.term', 'Repayment Term')}</div>
            <div className="font-mono font-bold text-[var(--text-main)] mt-1">
              {t('banking.termFormula', 'years to pay x days per year')}
            </div>
            <div className="text-[10px] text-[var(--text-subtle)] mt-1">
              {t('banking.termNote', 'A year is 60 in-game days by default.')}
            </div>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <ArrowDownToLine className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{t('banking.minPayment', 'You may lower the daily payment to a minimum of 50% of the standard amount (still at least $5).')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Scale className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>{t('banking.interestMultiplier', 'Bank interest scales with the difficulty setting via the Bank Interest Multiplier (default 1.0x).')}</span>
          </div>
        </div>
      </div>

      {/* Investments */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <PiggyBank className="w-4 h-4 text-emerald-500" />
          <span>{t('banking.investments', 'Investment Funds')}</span>
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          {t('banking.investmentsDesc', 'Each fund has a range of possible earnings that fluctuates daily. Your balance is the initial deposit plus any extra investment, minus withdrawals, plus accumulated interest.')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
            <div className="font-bold text-[var(--text-main)]">{t('banking.lowRisk', 'Low Risk')}</div>
            <div className="text-[var(--text-subtle)] mt-0.5">{t('banking.lowRiskDesc', 'Almost always earns money, but grows slowly.')}</div>
          </div>
          <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
            <div className="font-bold text-[var(--text-main)]">{t('banking.highRisk', 'High Risk')}</div>
            <div className="text-[var(--text-subtle)] mt-0.5">{t('banking.highRiskDesc', 'Can earn faster, but carries a real risk of losing money.')}</div>
          </div>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          {t('banking.autoInvest', 'Enable auto-invest to automatically contribute a set amount to a fund. Manage loans and investments from the EconoView app on your BizPhone.')}
        </p>
      </div>
    </div>
  );
}
