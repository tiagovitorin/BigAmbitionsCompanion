'use client';

import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { ChartPie } from 'lucide-react';
import type { LiveInvestmentData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import { allocation, colorForKey } from '@/lib/investments';
import InsufficientData from './InsufficientData';

// Keep the pie readable with many funds: show the largest slices and fold the
// rest into a single "Other" slice. The legend scrolls, so the card height is fixed.
const MAX_SLICES = 8;

function compactCurrency(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}k`;
  return `${sign}$${Math.round(abs)}`;
}

export default function PortfolioAllocationPanel({ investments }: { investments: LiveInvestmentData[] }) {
  const { t } = useTranslation();
  const allSlices = useMemo(() => allocation(investments), [investments]);

  const slices = useMemo(() => {
    if (allSlices.length <= MAX_SLICES) return allSlices;
    const top = allSlices.slice(0, MAX_SLICES - 1);
    const rest = allSlices.slice(MAX_SLICES - 1);
    const total = allSlices.reduce((a, s) => a + s.value, 0);
    const otherValue = rest.reduce((a, s) => a + s.value, 0);
    return [
      ...top,
      { key: 'other', name: t('liveHq.otherFunds', 'Other'), value: otherValue, pct: total > 0 ? (otherValue / total) * 100 : 0 }
    ];
  }, [allSlices, t]);

  const totalValue = slices.reduce((a, s) => a + s.value, 0);

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs flex flex-col h-[340px] min-h-0">
      <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2 shrink-0">
        <ChartPie className="w-4 h-4 text-sky-500" />
        <span>{t('liveHq.allocation', 'Allocation')}</span>
      </h3>

      {slices.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-xs text-[var(--text-subtle)]">
          <InsufficientData reason={t('liveHq.insufficientAllocation', 'No fund values to break down yet.')} />
        </div>
      ) : (
        <div className="flex-1 min-h-0 mt-3 flex flex-row gap-3 select-none">
          <div className="relative flex-[3] min-w-0 [&_svg]:outline-none [&_svg]:select-none">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="58%"
                  outerRadius="88%"
                  paddingAngle={2}
                  cornerRadius={5}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {slices.map(s => <Cell key={s.key} fill={colorForKey(s.key)} />)}
                </Pie>
                <Tooltip content={<AllocationTooltip />} wrapperStyle={{ zIndex: 20, outline: 'none' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[9px] uppercase font-bold tracking-wider text-[var(--text-subtle)]">{t('liveHq.total', 'Total')}</span>
              <span className="text-sm font-bold font-mono text-[var(--text-main)]">{compactCurrency(totalValue)}</span>
            </div>
          </div>
          <div className="flex-[2] min-w-0 flex items-center">
            <div className="w-full max-h-full overflow-y-auto space-y-1.5 pr-1">
              {slices.map(s => (
                <div key={s.key} className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colorForKey(s.key) }} />
                    <span className="text-[var(--text-main)] truncate">{s.name}</span>
                  </span>
                  <span className="font-mono text-[var(--text-muted)] shrink-0">{s.pct.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AllocationTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const slice = payload[0].payload;
  return (
    <div className="rounded-lg border border-[var(--border-base)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-[11px] shadow-lg flex items-center gap-2">
      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colorForKey(slice.key) }} />
      <span className="text-[var(--text-muted)]">{slice.name}</span>
      <span className="font-mono font-semibold text-[var(--text-main)]">${slice.value.toLocaleString()}</span>
    </div>
  );
}
