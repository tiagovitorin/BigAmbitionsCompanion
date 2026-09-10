'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, ArrowUpDown, ArrowRight, ChevronRight, Sparkles } from 'lucide-react';
import { LiveBusinessData, LiveOperationalAlert } from '@/context/LiveSyncContext';
import { Opportunity } from '@/lib/alerts';
import { useTranslation } from '@/context/LanguageContext';
import BusinessLogo from './BusinessLogo';

export type AnalyzerSortBy = 'priority' | 'name' | 'district' | 'category';

export interface SuboptimalStoreRow {
  business: LiveBusinessData;
  bizOpps: Opportunity[];
  bizAlerts: LiveOperationalAlert[];
  topPriorityIssue: any;
  priorityScore: number;
  hasCritical: boolean;
}

interface AnalyzerTableProps {
  suboptimalStores: SuboptimalStoreRow[];
  analyzerSortBy: AnalyzerSortBy;
  analyzerSortOrder: 'asc' | 'desc';
  onSort: (field: AnalyzerSortBy) => void;
  expandedAnalyzerRows: Record<string, boolean>;
  onToggleExpand: (id: string) => void;
  hasActiveFilter: boolean;
}

export default function AnalyzerTable({
  suboptimalStores,
  analyzerSortBy,
  analyzerSortOrder,
  onSort,
  expandedAnalyzerRows,
  onToggleExpand,
  hasActiveFilter
}: AnalyzerTableProps) {
  const { t } = useTranslation();

  if (suboptimalStores.length === 0) {
    return (
      <div className="p-8 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-center space-y-2">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <h4 className="text-xs font-bold text-[var(--text-main)]">
          {hasActiveFilter
            ? t('liveHq.analyzerNoSuboptimalFilterTitle', 'No Suboptimal Stores Found Matching Filter')
            : t('liveHq.analyzerAllEfficiencyTitle', 'All Locations Operating at Peak Efficiency!')}
        </h4>
        <p className="text-[11px] text-[var(--text-muted)] max-w-sm mx-auto">
          {hasActiveFilter
            ? t('liveHq.analyzerNoSuboptimalFilterDesc', 'Try resetting your search or lever filters to view other locations.')
            : t('liveHq.analyzerAllEfficiencyDesc', 'Zero unstaffed hours, dirty store complaints, or underpriced catalog items detected across your empire.')}
        </p>
      </div>
    );
  }

  return (
    <div className="border border-[var(--border-base)] rounded-xl overflow-hidden bg-[var(--bg-base)]">
      <table className="w-full text-xs text-left border-collapse">
        <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase select-none">
          <tr>
            <th
              onClick={() => onSort('name')}
              className="py-2.5 px-4 cursor-pointer hover:text-[var(--text-main)] transition-colors"
            >
              <div className="flex items-center gap-1">
                <span>{t('liveHq.businessColumn', 'Business')}</span>
                {analyzerSortBy === 'name' ? (
                  analyzerSortOrder === 'desc' ? <ChevronDown className="w-3 h-3 text-amber-500" /> : <ChevronUp className="w-3 h-3 text-amber-500" />
                ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
              </div>
            </th>
            <th
              onClick={() => onSort('district')}
              className="py-2.5 px-4 cursor-pointer hover:text-[var(--text-main)] transition-colors"
            >
              <div className="flex items-center gap-1">
                <span>{t('common.district')}</span>
                {analyzerSortBy === 'district' ? (
                  analyzerSortOrder === 'desc' ? <ChevronDown className="w-3 h-3 text-amber-500" /> : <ChevronUp className="w-3 h-3 text-amber-500" />
                ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
              </div>
            </th>
            <th
              onClick={() => onSort('priority')}
              className="py-2.5 px-4 text-center cursor-pointer hover:text-[var(--text-main)] transition-colors"
            >
              <div className="flex items-center justify-center gap-1">
                <span>{t('liveHq.urgencyColumn', 'Urgency')}</span>
                {analyzerSortBy === 'priority' ? (
                  analyzerSortOrder === 'desc' ? <ChevronDown className="w-3 h-3 text-amber-500" /> : <ChevronUp className="w-3 h-3 text-amber-500" />
                ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
              </div>
            </th>
            <th
              onClick={() => onSort('category')}
              className="py-2.5 px-4 cursor-pointer hover:text-[var(--text-main)] transition-colors"
            >
              <div className="flex items-center gap-1">
                <span>{t('liveHq.primaryProblemOpportunity', 'Primary Problem / Opportunity')}</span>
                {analyzerSortBy === 'category' ? (
                  analyzerSortOrder === 'desc' ? <ChevronDown className="w-3 h-3 text-amber-500" /> : <ChevronUp className="w-3 h-3 text-amber-500" />
                ) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
              </div>
            </th>
            <th className="py-2.5 px-4 text-center">{t('liveHq.action', 'Action')}</th>
          </tr>
        </thead>
        <tbody>
          {suboptimalStores.map(({ business: b, bizOpps, bizAlerts, topPriorityIssue, hasCritical }) => {
            const isExpanded = Boolean(expandedAnalyzerRows[b.id]);

            let statusBadge = (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 inline-flex items-center justify-center gap-1">
                {t('liveHq.issuesCount', '{count} Issues').replace('{count}', (bizOpps.length + bizAlerts.length).toString())}
              </span>
            );
            if (hasCritical) {
              statusBadge = (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/30 inline-flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  {t('liveHq.critical', 'Critical')}
                </span>
              );
            }

            return (
              <React.Fragment key={b.id}>
                <tr
                  onClick={() => onToggleExpand(b.id)}
                  className={`border-b border-[var(--border-subtle)] transition-colors cursor-pointer select-none group ${
                    isExpanded
                      ? 'bg-[var(--bg-surface-hover)]'
                      : 'hover:bg-[var(--bg-surface-hover)]/70'
                  }`}
                >
                  <td className="py-3 px-4 font-semibold text-[var(--text-main)]">
                    <div className="flex items-center gap-2.5">
                      <BusinessLogo business={b} sizeClass="w-6 h-6" />
                      <div>
                        <div className="group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors font-bold">
                          {b.name}
                        </div>
                        <div className="text-[10px] text-[var(--text-subtle)]">
                          {b.type}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[var(--text-muted)] font-medium">
                    {b.district}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {statusBadge}
                  </td>
                  <td className="py-3 px-4">
                    {topPriorityIssue ? (
                      topPriorityIssue.isAlert ? (
                        <div className="flex items-center gap-1.5 font-semibold text-[var(--text-main)]">
                          <span className={`text-[8px] font-mono px-1 rounded uppercase font-bold shrink-0 ${
                            topPriorityIssue.severity === 'critical'
                              ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          }`}>
                            {topPriorityIssue.category}
                          </span>
                          <span className="truncate max-w-[340px] text-xs">
                            {topPriorityIssue.message}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 font-semibold text-[var(--text-main)]">
                          <span className={`text-[8px] font-mono px-1 rounded uppercase font-bold shrink-0 ${
                            topPriorityIssue.category === 'Pricing' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' :
                            topPriorityIssue.category === 'Scheduling' ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30' :
                            'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                          }`}>
                            {topPriorityIssue.category}
                          </span>
                          <span className="truncate max-w-[280px]">
                            {topPriorityIssue.title}
                            {topPriorityIssue.current && topPriorityIssue.recommended && (
                              <span className="ml-1.5 font-normal text-[var(--text-subtle)] font-mono text-[11px]">
                                ({topPriorityIssue.current} &rarr; <strong className="text-emerald-500 font-semibold">{topPriorityIssue.recommended}</strong>)
                              </span>
                            )}
                          </span>
                        </div>
                      )
                    ) : (
                      <span className="text-[var(--text-subtle)] italic text-[11px]">{t('liveHq.optimal', 'Optimal')}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center font-sans">
                    <span className="inline-flex items-center gap-1.5 text-xs text-[var(--text-subtle)] group-hover:text-[var(--text-main)] font-semibold transition-colors">
                      <span>{isExpanded ? t('liveHq.hide', 'Hide') : t('liveHq.issuesCountLower', '{count} issues').replace('{count}', (bizOpps.length + bizAlerts.length).toString())}</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-amber-500' : ''}`} />
                    </span>
                  </td>
                </tr>

                {isExpanded && (
                  <tr className="bg-[var(--bg-base)]/80 border-b border-[var(--border-subtle)]">
                    <td colSpan={5} className="p-4 px-6 space-y-2.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)] pb-1.5 border-b border-[var(--border-subtle)] flex items-center justify-between">
                        <span>{t('liveHq.analyzerBreakdown', 'Actionable Breakdown for {name}').replace('{name}', b.name)}</span>
                        <Link
                          href={`/live-sync?view=stores&store=${b.id}`}
                          className="text-amber-500 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <span>{t('liveHq.analyzerOpenCommandRoom', 'Open Full Command Room')}</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>

                      <div className="space-y-1 pt-1">
                        {bizAlerts.map((a, aIdx) => {
                          const alertTab = a.type === 'unstaffed' ? 'schedule' : a.type === 'lowstock' ? 'pricing' : 'overview';
                          const alertBtnText = a.type === 'unstaffed' ? t('liveHq.resolveShift', 'Resolve Shift') : a.type === 'lowstock' ? t('liveHq.restockPrice', 'Restock / Price') : t('liveHq.inspect', 'Inspect');
                          const alertCategoryLabel = a.type === 'unstaffed' ? 'Scheduling' : a.type === 'lowstock' ? 'Stock' : 'Operations';
                          const isCritical = a.severity === 'critical' || a.type === 'unstaffed';

                          return (
                            <div
                              key={`alert-${aIdx}`}
                              className={`py-1.5 px-2.5 rounded-lg transition-colors flex items-center justify-between gap-3 text-xs ${
                                isCritical
                                  ? 'bg-rose-500/10 hover:bg-rose-500/15'
                                  : 'bg-amber-500/10 hover:bg-amber-500/15'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded uppercase shrink-0 ${
                                  isCritical
                                    ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                }`}>
                                  {alertCategoryLabel}
                                </span>
                                <span className="text-[var(--text-main)] truncate">{a.message}</span>
                              </div>
                              <Link
                                href={`/live-sync?view=stores&store=${b.id}&tab=${alertTab}`}
                                className={`text-[11px] font-semibold hover:underline shrink-0 flex items-center gap-1 ${
                                  isCritical ? 'text-rose-500' : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                <span>{alertBtnText}</span>
                                <ChevronRight className="w-3 h-3" />
                              </Link>
                            </div>
                          );
                        })}

                        {bizOpps.map((op, oIdx) => {
                          const fixTab = op.category === 'Pricing' ? 'pricing' :
                                         (op.category === 'Scheduling' || op.category === 'Operating Hours') ? 'schedule' : 'overview';

                          return (
                            <div key={`opp-${oIdx}`} className="py-1.5 px-2.5 rounded-lg hover:bg-[var(--bg-surface-hover)]/60 transition-colors flex items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded uppercase shrink-0 ${
                                  op.category === 'Pricing' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' :
                                  op.category === 'Scheduling' ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30' :
                                  'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                                }`}>
                                  {op.category}
                                </span>
                                <span className="font-semibold text-[var(--text-main)] truncate">
                                  {op.title}:
                                </span>
                                {op.current && op.recommended && (
                                  <span className="text-[11px] font-mono text-[var(--text-subtle)] shrink-0">
                                    {op.current} &rarr; <strong className="text-emerald-500 font-semibold">{op.recommended}</strong>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <Link
                                  href={`/live-sync?view=stores&store=${b.id}&tab=${fixTab}`}
                                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                                >
                                  <span>{t('liveHq.fix', 'Fix')}</span>
                                  <ChevronRight className="w-3 h-3" />
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
