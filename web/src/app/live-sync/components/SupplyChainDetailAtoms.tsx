'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Package } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';

type Tone = 'default' | 'good' | 'warn' | 'bad';

const TONE_TEXT: Record<Tone, string> = {
  default: 'text-[var(--text-main)]',
  good: 'text-emerald-600 dark:text-emerald-400',
  warn: 'text-amber-600 dark:text-amber-400',
  bad: 'text-rose-600 dark:text-rose-400'
};

const TONE_BADGE: Record<Tone, string> = {
  default: 'bg-[var(--bg-base)] text-[var(--text-subtle)] border-[var(--border-subtle)]',
  good: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  warn: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20',
  bad: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20'
};

export function SupplyStat({ label, value, tone = 'default' }: { label: string; value: string; tone?: Tone }) {
  return (
    <div className="rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] px-2.5 py-1.5 min-w-0">
      <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--text-subtle)] truncate">{label}</div>
      <div className={`text-sm font-bold font-mono truncate ${TONE_TEXT[tone]}`}>{value}</div>
    </div>
  );
}

export function SupplySection({
  title,
  icon: Icon,
  right,
  children
}: {
  title: string;
  icon?: LucideIcon;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--text-subtle)]">
          {Icon && <Icon className="w-3 h-3" />}
          <span>{title}</span>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export function SupplyBadge({ children, tone = 'default' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-block font-mono text-[9px] px-1.5 py-0.5 rounded border whitespace-nowrap ${TONE_BADGE[tone]}`}>
      {children}
    </span>
  );
}

export function ItemIcon({ src, size = 24 }: { src: string | null; size?: number }) {
  return (
    <span
      className="shrink-0 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-contain" />
      ) : (
        <Package className="w-3 h-3 text-[var(--text-subtle)]" />
      )}
    </span>
  );
}

export function VerdictBadge({ verdict }: { verdict: 'covered' | 'tight' | 'short' }) {
  const { t } = useTranslation();
  if (verdict === 'short') return <SupplyBadge tone="bad">{t('liveHq.verdictShort', 'short')}</SupplyBadge>;
  if (verdict === 'tight') return <SupplyBadge tone="warn">{t('liveHq.verdictTight', 'tight')}</SupplyBadge>;
  return <SupplyBadge tone="good">{t('liveHq.verdictCovered', 'covered')}</SupplyBadge>;
}
