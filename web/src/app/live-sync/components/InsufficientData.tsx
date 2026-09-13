'use client';

import { CircleQuestionMark } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import FloatingTooltip from './FloatingTooltip';

// Renders "Insufficient data" with a hover explanation of why the metric is missing.
// Every place that can show this label should pass a concrete reason.
export default function InsufficientData({ reason, className }: { reason: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <FloatingTooltip
      className={`inline-flex items-center gap-1 cursor-help ${className ?? ''}`}
      content={<div className="max-w-[250px] leading-relaxed">{reason}</div>}
    >
      <span className="italic font-normal text-[var(--text-subtle)]">{t('liveHq.insufficientData', 'Insufficient data')}</span>
      <CircleQuestionMark className="w-3 h-3 shrink-0 text-[var(--text-subtle)]" />
    </FloatingTooltip>
  );
}
