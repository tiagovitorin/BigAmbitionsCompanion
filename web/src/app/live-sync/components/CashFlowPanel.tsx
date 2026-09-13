'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { ArrowRightLeft, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { CashFlowReconciliation, CashFlowDay } from '@/lib/finance';

function fmtSigned(value: number): string {
  const sign = value < 0 ? '-' : '+';
  return `${sign}$${Math.abs(Math.round(value)).toLocaleString()}`;
}

function fmtCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${value < 0 ? '-' : ''}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${value < 0 ? '-' : ''}$${Math.round(abs / 1_000)}k`;
  return `${value < 0 ? '-' : ''}$${Math.round(abs)}`;
}

export default function CashFlowPanel({ cashFlow }: { cashFlow: CashFlowReconciliation | null }) {
  const { t } = useTranslation();

  if (!cashFlow) {
    return (
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs">
        <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
          <ArrowRightLeft className="w-4 h-4 text-sky-500" />
          <h3 className="text-sm font-bold text-[var(--text-main)]">{t('liveHq.cashFlowTitle', 'Cash Flow Reconciliation')}</h3>
        </div>
        <div className="py-4 text-center text-xs text-[var(--text-subtle)]">
          {t('liveHq.cashFlowInsufficient', 'Insufficient data - the game has not recorded enough midnights yet')}
        </div>
      </div>
    );
  }

  const { days, profit, cashChange, reinvested, series } = cashFlow;
  const reinvestedPositive = reinvested >= 0;

  const sentence = reinvestedPositive
    ? t('liveHq.cashFlowSentenceInvested', 'Over the last {days} days you booked {profit} of profit, but cash moved {cash}. The missing {reinvested} went back into stock and setup.')
        .replace('{days}', String(days))
        .replace('{profit}', fmtSigned(profit))
        .replace('{cash}', fmtSigned(cashChange))
        .replace('{reinvested}', `$${Math.abs(Math.round(reinvested)).toLocaleString()}`)
    : t('liveHq.cashFlowSentenceGained', 'Over the last {days} days you booked {profit} of profit, and cash rose {cash} - more than trading alone, so {extra} came from outside operations.')
        .replace('{days}', String(days))
        .replace('{profit}', fmtSigned(profit))
        .replace('{cash}', fmtSigned(cashChange))
        .replace('{extra}', `$${Math.abs(Math.round(reinvested)).toLocaleString()}`);

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-sky-500" />
          <span>{t('liveHq.cashFlowTitle', 'Cash Flow Reconciliation')}</span>
        </h3>
        <span className="text-[10px] font-mono text-[var(--text-subtle)]">
          {t('liveHq.cashFlowWindow', 'Last {days} days (from day {day})')
            .replace('{days}', String(days))
            .replace('{day}', String(cashFlow.fromDay))}
        </span>
      </div>

      <p className="text-xs text-[var(--text-muted)] leading-relaxed">{sentence}</p>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
          <div className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.profitBooked', 'Profit Booked')}</div>
          <div className={`text-base font-bold font-mono ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
            {fmtSigned(profit)}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
          <div className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.cashMoved', 'Cash Moved')}</div>
          <div className={`text-base font-bold font-mono ${cashChange >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-rose-500'}`}>
            {fmtSigned(cashChange)}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
          <div className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.reinvested', 'Reinvested')}</div>
          <div className="text-base font-bold font-mono text-amber-600 dark:text-amber-400">
            {fmtSigned(reinvested)}
          </div>
        </div>
      </div>

      <div className="h-[190px] w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: 'var(--text-subtle)' }}
              tickFormatter={(d: number) => `D${d}`}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--text-subtle)' }}
              tickFormatter={fmtCompact}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<CashFlowTooltip />} />
            <Line
              type="monotone"
              dataKey="cumulativeProfit"
              name={t('liveHq.profitBooked', 'Profit Booked')}
              stroke="#10b981"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#10b981' }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="cashDelta"
              name={t('liveHq.cashMoved', 'Cash Moved')}
              stroke="#0ea5e9"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#0ea5e9' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-center gap-5 text-[10px] font-semibold text-[var(--text-subtle)]">
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded-full bg-emerald-500" />{t('liveHq.profitBooked', 'Profit Booked')}</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded-full bg-sky-500" />{t('liveHq.cashMoved', 'Cash Moved')}</span>
        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400"><RefreshCw className="w-3 h-3" />{t('liveHq.cashFlowGap', 'Gap = reinvested')}</span>
      </div>
    </div>
  );
}

function CashFlowTooltip({ active, payload, label }: any) {
  const { t } = useTranslation();
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload as CashFlowDay;
  const gap = point.cumulativeProfit - point.cashDelta;
  return (
    <div className="rounded-lg border border-[var(--border-base)] bg-[var(--bg-surface)] px-3 py-2 text-[11px] shadow-lg">
      <div className="font-bold text-[var(--text-main)] mb-1">
        {t('liveHq.dayLabel', 'Day {n}').replace('{n}', String(label))}
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-emerald-500">{t('liveHq.profitBooked', 'Profit Booked')}</span>
        <span className="font-mono text-[var(--text-main)]">{fmtSigned(point.cumulativeProfit)}</span>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sky-500">{t('liveHq.cashMoved', 'Cash Moved')}</span>
        <span className="font-mono text-[var(--text-main)]">{fmtSigned(point.cashDelta)}</span>
      </div>
      <div className="flex items-center justify-between gap-4 text-[var(--text-subtle)]">
        <span>{t('liveHq.reinvested', 'Reinvested')}</span>
        <span className="font-mono">{fmtSigned(gap)}</span>
      </div>
    </div>
  );
}
