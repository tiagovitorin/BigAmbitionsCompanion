'use client';

import React from 'react';
import { useTranslation } from '@/context/LanguageContext';

interface ProfitSparklineProps {
  history: Array<{ dayNumber: number; dayName?: string; revenue?: number; profit: number }>;
}

const EmpireProfitSparkline = React.memo(function EmpireProfitSparkline({ history }: ProfitSparklineProps) {
  const { t } = useTranslation();

  if (!history || history.length < 2) {
    return (
      <div className="text-[10px] text-[var(--text-subtle)] font-mono italic">
        {t('liveHq.building7dTrend', 'Building 7D trend...')}
      </div>
    );
  }

  const recent = history.slice(-7);
  const profits = recent.map(h => h.profit);
  const minP = Math.min(...profits);
  const maxP = Math.max(...profits);
  const range = maxP - minP || 1;

  const width = 150;
  const height = 30;
  const paddingY = 4;
  const availableHeight = height - paddingY * 2;

  const points = profits.map((val, idx) => {
    const x = (idx / (profits.length - 1)) * width;
    const y = height - paddingY - ((val - minP) / range) * availableHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const firstP = profits[0];
  const lastP = profits[profits.length - 1];
  const dollarDelta = lastP - firstP;
  const isUp = dollarDelta >= 0;

  return (
    <div className="flex items-center gap-2.5">
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={pathD}
          fill="none"
          stroke={isUp ? '#10b981' : '#f43f5e'}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((pt, i) => {
          const [cx, cy] = pt.split(',');
          const isLast = i === points.length - 1;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={isLast ? 3.5 : 1.5}
              fill={isLast ? (isUp ? '#10b981' : '#f43f5e') : 'var(--text-subtle)'}
            />
          );
        })}
      </svg>
      <div className="text-right">
        <div className={`text-[11px] font-mono font-extrabold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isUp ? `+$${Math.abs(dollarDelta).toLocaleString()}` : `-$${Math.abs(dollarDelta).toLocaleString()}`}
        </div>
        <div className="text-[8px] uppercase tracking-wider text-[var(--text-subtle)] font-semibold">
          {t('liveHq.vs7dAgo', 'vs 7D Ago')}
        </div>
      </div>
    </div>
  );
});

export default EmpireProfitSparkline;
