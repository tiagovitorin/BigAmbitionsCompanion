'use client';

import { useTranslation } from '@/context/LanguageContext';

const RISK_STYLE: Record<string, string> = {
  low: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
  high: 'bg-rose-500/10 text-rose-500 border-rose-500/30',
  unknown: 'bg-[var(--bg-base)] text-[var(--text-subtle)] border-[var(--border-base)]'
};

const RISK_KEY: Record<string, [string, string]> = {
  low: ['liveHq.riskLow', 'Low risk'],
  medium: ['liveHq.riskMedium', 'Medium risk'],
  high: ['liveHq.riskHigh', 'High risk'],
  unknown: ['liveHq.riskUnknown', 'Risk n/a']
};

// Shared risk pill so the fund card and the compact list render it identically.
export default function FundRiskBadge({ risk }: { risk?: string }) {
  const { t } = useTranslation();
  const key = (risk || 'unknown').toLowerCase();
  const [labelKey, fallback] = RISK_KEY[key] || RISK_KEY.unknown;
  return (
    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${RISK_STYLE[key] || RISK_STYLE.unknown}`}>
      {t(labelKey, fallback)}
    </span>
  );
}
