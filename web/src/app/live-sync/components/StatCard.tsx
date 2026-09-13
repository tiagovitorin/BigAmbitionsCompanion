'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  sub?: ReactNode;
  icon: LucideIcon;
  tone?: 'main' | 'up' | 'down';
  // Optional small visual (sparkline, bar) rendered under the sub-line.
  spark?: ReactNode;
}

// Shared KPI card used by the consolidated Live HQ pages (Properties, Investments).
export default function StatCard({ label, value, sub, icon: Icon, tone = 'main', spark }: StatCardProps) {
  const valueColor = tone === 'up' ? 'text-emerald-600 dark:text-emerald-400' : tone === 'down' ? 'text-rose-500' : 'text-[var(--text-main)]';
  const iconColor = tone === 'up' ? 'text-emerald-500' : tone === 'down' ? 'text-rose-500' : 'text-[var(--text-subtle)]';
  return (
    <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{label}</span>
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
      </div>
      <div className={`text-xl font-bold font-mono ${valueColor}`}>{value}</div>
      {sub ? <div className="text-[11px] text-[var(--text-muted)]">{sub}</div> : null}
      {spark ? <div className="pt-1.5">{spark}</div> : null}
    </div>
  );
}
