'use client';

import { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { PiggyBank, Repeat, CircleQuestionMark } from 'lucide-react';
import type { LiveInvestmentData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import { fundSeries, returnAmount, returnPct, totalContributions } from '@/lib/investments';
import FundRiskBadge from './FundRiskBadge';
import FloatingTooltip from './FloatingTooltip';

export default function InvestmentFundCard({ inv, gameDay, daysPerYear }: { inv: LiveInvestmentData; gameDay: number; daysPerYear: number }) {
  const { t } = useTranslation();
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const series = fundSeries(inv);
  const ret = returnAmount(inv);
  const pct = returnPct(inv);
  const contributions = totalContributions(inv);
  const positive = ret >= 0;
  const lineColor = positive ? '#10b981' : '#f43f5e';
  const yearly = inv.yearlyMarketChanges || [];
  const yearlyMax = yearly.length ? Math.max(...yearly.map(v => Math.abs(v)), 1) : 1;
  const currentValue = inv.currentValue || 0;
  // The game steps one bar per in-game year (GetYearsByDays = day / daysPerYear), wrapping.
  const activeIndex = yearly.length > 0 && daysPerYear > 0 ? Math.floor(gameDay / daysPerYear) % yearly.length : 0;

  return (
    <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2">
          <PiggyBank className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="font-bold text-[var(--text-main)] truncate">{inv.name}</span>
        </div>
        <FundRiskBadge risk={inv.risk} />
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <div className="text-lg font-bold font-mono text-[var(--text-main)]">${(inv.currentValue || 0).toLocaleString()}</div>
          <div className={`text-[11px] font-mono font-semibold ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
            {positive ? '+' : '-'}${Math.abs(ret).toLocaleString()}
            {pct != null ? <span className="text-[var(--text-subtle)] font-normal"> ({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)</span> : null}
          </div>
        </div>
        {series.length > 1 && (
          <div className="w-24 h-10 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series}>
                <YAxis hide domain={['dataMin', 'dataMax']} />
                <Line type="monotone" dataKey="value" stroke={lineColor} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-subtle)]">{t('liveHq.initialDeposit', 'Deposited')}</span>
          <strong className="font-mono text-[var(--text-main)]">${contributions.toLocaleString()}</strong>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-subtle)]">{t('liveHq.withdrawalsLabel', 'Withdrawn')}</span>
          <strong className="font-mono text-[var(--text-main)]">${(inv.withdrawal || 0).toLocaleString()}</strong>
        </div>
        <div className="flex items-center gap-2 col-span-2">
          <span className="text-[var(--text-subtle)] flex items-center gap-1"><Repeat className="w-3 h-3" />{t('liveHq.autoInvest', 'Auto-Invest')}</span>
          <strong className={`font-mono ${inv.isAutoInvesting ? 'text-sky-600 dark:text-sky-400' : 'text-[var(--text-subtle)]'}`}>
            {inv.isAutoInvesting ? `$${(inv.autoInvestment || 0).toLocaleString()}` : t('liveHq.offLabel', 'Off')}
          </strong>
        </div>
      </div>

      {yearly.length > 0 && (
        <div className="pt-2 border-t border-[var(--border-subtle)] space-y-1">
          <div className="flex items-center gap-1">
            <span className="text-[9px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.annualReturnCycle', 'Annual return cycle')}</span>
            <FloatingTooltip
              content={
                <div className="max-w-[250px] space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-white">
                    <CircleQuestionMark className="w-3.5 h-3.5 text-sky-400" />
                    <span>{t('liveHq.annualReturnCycle', 'Annual return cycle')}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {t('liveHq.annualReturnCycleTooltip', "Each in-game year, the game pays a daily slice of that year's rate on your balance. It moves to the next bar every in-game year and then repeats, so the rate you earn rotates through this list.")}
                  </p>
                  <div className="inline-flex items-center rounded-md bg-white/5 border border-white/10 px-2 py-1 font-mono text-[10px] text-slate-200">
                    {t('liveHq.returnFormula', 'balance × rate ÷ {days} days').replace('{days}', String(daysPerYear))}
                  </div>
                </div>
              }
            >
              <CircleQuestionMark className="w-3 h-3 text-[var(--text-subtle)] hover:text-[var(--text-main)] transition-colors" />
            </FloatingTooltip>
          </div>
          <div className="flex items-end gap-0.5 h-6">
            {yearly.map((rate, i) => {
              const isActive = i === activeIndex;
              const dimmed = hoveredBar != null && hoveredBar !== i;
              const yearsUntil = (i - activeIndex + yearly.length) % yearly.length;
              const worth = currentValue * (rate / 100);
              const worthLabel = `${worth >= 0 ? '+' : '-'}$${Math.abs(Math.round(worth)).toLocaleString()}`;
              const nextLabel = yearsUntil === 1
                ? t('liveHq.returnYearNextOne', 'Comes around next year')
                : t('liveHq.returnYearNextMany', 'Comes around in {years} years').replace('{years}', String(yearsUntil));
              return (
                <FloatingTooltip
                  key={i}
                  className="flex flex-1 items-end h-full cursor-default"
                  onEnter={() => setHoveredBar(i)}
                  onLeave={() => setHoveredBar(current => (current === i ? null : current))}
                  content={
                    <div className="space-y-1.5 min-w-[180px]">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-white">{t('liveHq.returnYearLabel', 'Year {year}').replace('{year}', String(i + 1))}</span>
                        <span className={`font-mono font-bold ${rate >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{rate >= 0 ? '+' : ''}{rate}%</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-300">
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        <span>{isActive ? t('liveHq.returnYearActive', 'The rate paying right now') : nextLabel}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-1.5 text-[10px]">
                        <span className="text-slate-400">{t('liveHq.returnYearWorthLabel', 'A year on this balance')}</span>
                        <span className={`font-mono font-semibold ${worth >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>~{worthLabel}</span>
                      </div>
                    </div>
                  }
                >
                  <div
                    className={`w-full rounded-sm transition-opacity duration-150 ${rate >= 0 ? 'bg-emerald-500/70' : 'bg-rose-500/70'} ${isActive ? 'ring-1 ring-slate-900/40 dark:ring-white/70' : ''} ${dimmed ? 'opacity-40' : ''}`}
                    style={{ height: `${Math.max(8, (Math.abs(rate) / yearlyMax) * 100)}%` }}
                  />
                </FloatingTooltip>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
