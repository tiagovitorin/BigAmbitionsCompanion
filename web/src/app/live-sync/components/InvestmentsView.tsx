'use client';

import { useState } from 'react';
import { PiggyBank, LayoutGrid, List } from 'lucide-react';
import type { LiveInvestmentData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import InvestmentFundCard from './InvestmentFundCard';
import PortfolioPerformanceChart from './PortfolioPerformanceChart';
import PortfolioAllocationPanel from './PortfolioAllocationPanel';
import InvestmentKpiStrip from './InvestmentKpiStrip';
import PropertyTable, { PropertyTableColumn } from './PropertyTable';
import FundRiskBadge from './FundRiskBadge';
import { returnAmount, returnPct, todayChange, totalContributions } from '@/lib/investments';

export default function InvestmentsView({ investments, gameDay, daysPerYear }: { investments: LiveInvestmentData[]; gameDay: number; daysPerYear: number }) {
  const { t } = useTranslation();
  const [view, setView] = useState<'cards' | 'list'>('cards');

  const listColumns: PropertyTableColumn[] = [
    { key: 'fund', label: t('liveHq.fundLabel', 'Fund') },
    { key: 'risk', label: t('liveHq.riskLabel', 'Risk'), align: 'center' },
    { key: 'deposited', label: t('liveHq.initialDeposit', 'Deposited'), align: 'right' },
    { key: 'withdrawn', label: t('liveHq.withdrawalsLabel', 'Withdrawn'), align: 'right' },
    { key: 'today', label: t('liveHq.todayLabel', 'Today'), align: 'right' },
    { key: 'value', label: t('liveHq.currentValue', 'Current Value'), align: 'right' },
    { key: 'return', label: t('liveHq.returnLabel', 'Return'), align: 'right' },
    { key: 'auto', label: t('liveHq.autoInvest', 'Auto-Invest'), align: 'right' }
  ];

  const listRows = investments.map(inv => {
    const ret = returnAmount(inv);
    const pct = returnPct(inv);
    const positive = ret >= 0;
    const today = todayChange(inv);
    return [
      <span key="fund" className="font-semibold text-[var(--text-main)]">{inv.name}</span>,
      <FundRiskBadge key="risk" risk={inv.risk} />,
      <span key="deposited" className="font-mono text-[var(--text-muted)]">${totalContributions(inv).toLocaleString()}</span>,
      <span key="withdrawn" className="font-mono text-[var(--text-muted)]">${(inv.withdrawal || 0).toLocaleString()}</span>,
      today != null ? (
        <span key="today" className={`font-mono ${today >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
          {today >= 0 ? '+' : '-'}${Math.abs(today).toLocaleString()}
        </span>
      ) : (
        <span key="today" className="text-[var(--text-subtle)]">-</span>
      ),
      <span key="value" className="font-mono text-[var(--text-main)]">${(inv.currentValue || 0).toLocaleString()}</span>,
      <span key="return" className={`font-mono font-semibold ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
        {positive ? '+' : '-'}${Math.abs(ret).toLocaleString()}
        {pct != null ? <span className="text-[var(--text-subtle)] font-normal"> ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)</span> : null}
      </span>,
      <span key="auto" className={`font-mono ${inv.isAutoInvesting ? 'text-sky-600 dark:text-sky-400' : 'text-[var(--text-subtle)]'}`}>
        {inv.isAutoInvesting ? `$${(inv.autoInvestment || 0).toLocaleString()}` : t('liveHq.offLabel', 'Off')}
      </span>
    ];
  });

  if (investments.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-dashed border-[var(--border-base)] shadow-xs text-center">
        <PiggyBank className="w-5 h-5 text-[var(--text-subtle)] mx-auto mb-2" />
        <p className="text-xs text-[var(--text-muted)]">{t('liveHq.noInvestments', 'No active investment funds')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* PORTFOLIO SUMMARY */}
      <InvestmentKpiStrip investments={investments} />

      {/* PERFORMANCE + ALLOCATION, SIDE BY SIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <PortfolioPerformanceChart investments={investments} />
        </div>
        <div className="lg:col-span-2">
          <PortfolioAllocationPanel investments={investments} />
        </div>
      </div>

      {/* FUNDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-[var(--text-main)]">{t('liveHq.investments', 'Investment Funds')}</h3>
          <div className="flex items-center bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setView('cards')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${view === 'cards' ? 'bg-emerald-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{t('liveHq.viewCards', 'Cards')}</span>
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`px-2.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${view === 'list' ? 'bg-emerald-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              <List className="w-3.5 h-3.5" />
              <span>{t('liveHq.viewList', 'List')}</span>
            </button>
          </div>
        </div>

        {view === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {investments.map((inv, i) => <InvestmentFundCard key={`${inv.name}-${i}`} inv={inv} gameDay={gameDay} daysPerYear={daysPerYear} />)}
          </div>
        ) : (
          <PropertyTable
            columns={listColumns}
            rows={listRows}
            rowKey={i => `${investments[i].name}-${i}`}
            maxHeightClass="max-h-[420px]"
          />
        )}
      </div>
    </div>
  );
}

