'use client';

import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { LiveInvestmentData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import { buildPortfolioSeries, colorForKey } from '@/lib/investments';
import FilterDropdown from './FilterDropdown';

function compactCurrency(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}k`;
  return `${sign}$${Math.round(abs)}`;
}

export default function PortfolioPerformanceChart({ investments }: { investments: LiveInvestmentData[] }) {
  const { t } = useTranslation();
  const { data, funds } = useMemo(() => buildPortfolioSeries(investments), [investments]);
  const [selected, setSelected] = useState('all');

  // Fall back to "all" if the selected fund disappears between polls.
  const activeKey = selected === 'all' || funds.some(f => f.key === selected) ? selected : 'all';

  const options = useMemo(
    () => [{ value: 'all', label: t('liveHq.allFunds', 'All funds') }, ...funds.map(f => ({ value: f.key, label: f.name }))],
    [funds, t]
  );

  const series = useMemo(
    () => data.map(point => ({ day: point.day, value: activeKey === 'all' ? point.total : (point[activeKey] ?? 0) })),
    [data, activeKey]
  );

  const baseline = series.length > 0 ? series[0].value : 0;
  const lastValue = series.length > 0 ? series[series.length - 1].value : 0;
  const windowChange = series.length > 1 ? lastValue - baseline : null;
  const windowChangePct = windowChange != null && baseline > 0 ? (windowChange / baseline) * 100 : null;
  const positive = (windowChange ?? 0) >= 0;

  // Colour matches the fund in the allocation donut / tile; "All funds" is emerald.
  const lineColor = activeKey === 'all' ? '#10b981' : colorForKey(activeKey);

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs flex flex-col h-[340px] min-h-0">
      <div className="flex items-center justify-between gap-2 flex-wrap shrink-0">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>{t('liveHq.portfolioPerformance', 'Portfolio Performance')}</span>
        </h3>
        <div className="flex items-center gap-2">
          {windowChange != null && (
            <span className={`text-[11px] font-mono font-semibold shrink-0 ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
              {windowChange >= 0 ? '+' : '-'}${Math.abs(windowChange).toLocaleString()}
              {windowChangePct != null ? ` (${windowChangePct >= 0 ? '+' : ''}${windowChangePct.toFixed(1)}%)` : ''}
            </span>
          )}
          <FilterDropdown
            icon={TrendingUp}
            value={activeKey}
            options={options}
            onChange={setSelected}
          />
        </div>
      </div>

      {series.length > 1 ? (
        <div className="flex-1 min-h-0 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="perfFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={lineColor} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-subtle)' }} tickFormatter={(d: number) => `D${d}`} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-subtle)' }}
                tickFormatter={(v: number) => `${v - baseline >= 0 ? '+' : '-'}${compactCurrency(Math.abs(v - baseline))}`}
                axisLine={false}
                tickLine={false}
                width={64}
                domain={['dataMin', 'dataMax']}
              />
              <Tooltip content={<PerformanceTooltip baseline={baseline} />} />
              <Area type="monotone" dataKey="value" stroke={lineColor} strokeWidth={2.5} fill="url(#perfFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-[var(--text-subtle)]">{t('liveHq.notEnoughHistory', 'Not enough history yet')}</div>
      )}
    </div>
  );
}

function PerformanceTooltip({ active, payload, label, baseline = 0 }: any) {
  const { t } = useTranslation();
  if (!active || !payload || payload.length === 0) return null;
  const value = payload[0].value as number;
  const delta = value - baseline;
  return (
    <div className="rounded-lg border border-[var(--border-base)] bg-[var(--bg-surface)] px-3 py-2 text-[11px] shadow-lg">
      <div className="font-bold text-[var(--text-main)] mb-0.5">{t('liveHq.dayLabel', 'Day {n}').replace('{n}', String(label))}</div>
      <div className="text-[var(--text-muted)]">{t('liveHq.portfolioValue', 'Portfolio Value')}: <span className="font-mono text-[var(--text-main)]">${Math.round(value).toLocaleString()}</span></div>
      <div className={delta >= 0 ? 'text-emerald-500' : 'text-rose-500'}>
        {delta >= 0 ? '+' : '-'}${Math.abs(Math.round(delta)).toLocaleString()}
      </div>
    </div>
  );
}
