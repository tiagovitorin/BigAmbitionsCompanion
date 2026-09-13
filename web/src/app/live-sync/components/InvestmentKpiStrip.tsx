'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { PiggyBank, Wallet, TrendingUp, Coins } from 'lucide-react';
import type { LiveInvestmentData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import StatCard from './StatCard';
import InsufficientData from './InsufficientData';
import { averageDailyInterest, buildPortfolioSeries, dailyInterestSeries, portfolioTotals } from '@/lib/investments';

function signed(value: number): string {
  return `${value >= 0 ? '+' : '-'}$${Math.abs(Math.round(value)).toLocaleString()}`;
}

// A tiny filled area for a value series, no axes.
function Sparkline({ data, color }: { data: { value: number }[]; color: string }) {
  if (data.length < 2) return <div className="h-8" />;
  return (
    <div className="h-8 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={color} fillOpacity={0.15} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Deposits vs withdrawals as a proportion bar.
function InOutBar({ inValue, outValue }: { inValue: number; outValue: number }) {
  const total = inValue + outValue;
  const inPct = total > 0 ? (inValue / total) * 100 : 0;
  const outPct = total > 0 ? (outValue / total) * 100 : 100;
  return (
    <div className="h-8 flex items-center">
      <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-[var(--bg-base)]">
        <div className="bg-emerald-500/70" style={{ width: `${inPct}%` }} />
        <div className="bg-rose-500/70" style={{ width: `${outPct}%` }} />
      </div>
    </div>
  );
}

// Gain relative to net invested, as a single filled bar.
function GainBar({ fraction, color }: { fraction: number; color: string }) {
  const pct = Math.min(100, Math.max(0, fraction * 100));
  return (
    <div className="h-8 flex items-center">
      <div className="h-1.5 w-full rounded-full bg-[var(--bg-base)] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// The last two weeks of daily interest as small bars.
function DailyBars({ data }: { data: { value: number }[] }) {
  const recent = data.slice(-14);
  const max = Math.max(...recent.map(d => Math.abs(d.value)), 1);
  return (
    <div className="h-8 flex items-end gap-0.5">
      {recent.map((d, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm ${d.value >= 0 ? 'bg-emerald-500/70' : 'bg-rose-500/70'}`}
          style={{ height: `${Math.max(8, (Math.abs(d.value) / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export default function InvestmentKpiStrip({ investments }: { investments: LiveInvestmentData[] }) {
  const { t } = useTranslation();
  const totals = useMemo(() => portfolioTotals(investments), [investments]);
  const combined = useMemo(() => buildPortfolioSeries(investments).data.map(p => ({ value: p.total })), [investments]);
  const daily = useMemo(() => dailyInterestSeries(investments), [investments]);
  const avgDaily = useMemo(() => averageDailyInterest(investments), [investments]);

  const netReturn = totals.value - totals.net;
  const netReturnPct = totals.net > 0 ? (netReturn / totals.net) * 100 : null;
  const nowPositive = (totals.todayInterest ?? 0) >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label={t('liveHq.portfolioValue', 'Portfolio Value')}
        value={`$${totals.value.toLocaleString()}`}
        sub={`${investments.length} ${t('liveHq.fundsWord', 'funds')} · ${totals.autoInvesting} ${t('liveHq.autoInvestingWord', 'auto-investing')}`}
        icon={PiggyBank}
        spark={<Sparkline data={combined} color="#10b981" />}
      />

      <StatCard
        label={t('liveHq.netInvested', 'Net Invested')}
        value={`$${totals.net.toLocaleString()}`}
        sub={t('liveHq.netInOut', '{in} in / {out} out')
          .replace('{in}', `$${totals.contributions.toLocaleString()}`)
          .replace('{out}', `$${totals.withdrawals.toLocaleString()}`)}
        icon={Wallet}
        spark={<InOutBar inValue={totals.contributions} outValue={totals.withdrawals} />}
      />

      <StatCard
        label={t('liveHq.unrealizedGain', 'Unrealized Gain')}
        value={signed(netReturn)}
        sub={netReturnPct != null
          ? `${netReturnPct >= 0 ? '+' : ''}${netReturnPct.toFixed(1)}% ${t('liveHq.onNetInvested', 'on net invested')}`
          : <InsufficientData reason={t('liveHq.insufficientGainPct', 'Net invested is zero, so a return percentage cannot be calculated.')} />}
        icon={TrendingUp}
        tone={netReturn >= 0 ? 'up' : 'down'}
        spark={<GainBar fraction={Math.abs(netReturn) / Math.max(1, Math.abs(totals.net))} color={netReturn >= 0 ? '#10b981' : '#f43f5e'} />}
      />

      <StatCard
        label={t('liveHq.investmentsToday', 'Interest Today')}
        value={totals.todayInterest != null ? signed(totals.todayInterest) : '-'}
        sub={avgDaily != null
          ? t('liveHq.avgPerDay', 'avg {amount}/day').replace('{amount}', signed(avgDaily))
          : `${totals.autoInvesting} ${t('liveHq.autoInvestingWord', 'auto-investing')}`}
        icon={Coins}
        tone={totals.todayInterest != null ? (nowPositive ? 'up' : 'down') : 'main'}
        spark={<DailyBars data={daily} />}
      />
    </div>
  );
}
