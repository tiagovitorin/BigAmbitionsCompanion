'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Target, Store, Search, ChevronDown, ChevronRight, Swords } from 'lucide-react';
import { LiveBusinessData, LiveOperationalAlert } from '@/context/LiveSyncContext';
import { Opportunity } from '@/lib/alerts';
import { useTranslation } from '@/context/LanguageContext';
import AnalyzerTable, { AnalyzerSortBy, SuboptimalStoreRow } from './AnalyzerTable';

// Relative, non-monetary urgency ordering for decision levers. This is app-defined
// tuning (documented in thresholds philosophy), NOT a synthetic dollar figure.
function opportunityBaseWeight(category?: string): number {
  switch (category) {
    case 'Scheduling': return 90;
    case 'Operating Hours': return 80;
    case 'Pricing': return 70;
    case 'Stock': return 70;
    case 'Workforce': return 55;
    case 'Operations': return 45;
    case 'Marketing': return 20;
    default: return 30;
  }
}

interface AnalyzerViewProps {
  businesses: LiveBusinessData[];
  activeAlerts: LiveOperationalAlert[];
  opportunities: Opportunity[];
}

export default function AnalyzerView({ businesses, activeAlerts, opportunities }: AnalyzerViewProps) {
  const [analyzerSearch, setAnalyzerSearch] = useState<string>('');
  const [analyzerFilterCategory, setAnalyzerFilterCategory] = useState<string>('all');
  const [analyzerFilterSeverity, setAnalyzerFilterSeverity] = useState<'all' | 'critical' | 'opportunity'>('all');
  const [analyzerSortBy, setAnalyzerSortBy] = useState<AnalyzerSortBy>('priority');
  const [analyzerSortOrder, setAnalyzerSortOrder] = useState<'asc' | 'desc'>('desc');
  const [analyzerCatDropdownOpen, setAnalyzerCatDropdownOpen] = useState(false);
  const [analyzerSevDropdownOpen, setAnalyzerSevDropdownOpen] = useState(false);
  const [expandedAnalyzerRows, setExpandedAnalyzerRows] = useState<Record<string, boolean>>({});
  const { t } = useTranslation();

  const suboptimalStores: SuboptimalStoreRow[] = businesses
    .map(b => {
      const bizOpps = opportunities.filter(op => op.location === b.name);
      const bizAlerts = activeAlerts.filter(a => a.location === b.name);

      const sortedBizAlerts = [...bizAlerts].sort((a, b) => {
        const aCrit = a.severity === 'critical' || a.type === 'unstaffed';
        const bCrit = b.severity === 'critical' || b.type === 'unstaffed';
        if (aCrit && !bCrit) return -1;
        if (!aCrit && bCrit) return 1;
        return 0;
      });

      const topBizOp = [...bizOpps].sort((a, b) => (opportunityBaseWeight(b.category) - opportunityBaseWeight(a.category)) || a.title.localeCompare(b.title))[0];
      const hasCritical = bizAlerts.some(a => a.severity === 'critical' || a.type === 'unstaffed');

      const topAlert = sortedBizAlerts[0];
      const topPriorityIssue = topAlert
        ? {
            isAlert: true,
            type: topAlert.type,
            severity: topAlert.severity || (topAlert.type === 'unstaffed' ? 'critical' : 'warning'),
            message: topAlert.message,
            category: topAlert.type === 'unstaffed' ? 'Scheduling' : topAlert.type === 'lowstock' ? 'Stock' : 'Operations',
            fixTab: topAlert.type === 'unstaffed' ? 'schedule' : topAlert.type === 'lowstock' ? 'pricing' : 'overview'
          }
        : topBizOp
        ? {
            isAlert: false,
            category: topBizOp.category,
            title: topBizOp.title,
            current: topBizOp.current,
            recommended: topBizOp.recommended,
            fixTab: topBizOp.category === 'Pricing' ? 'pricing' : (topBizOp.category === 'Scheduling' || topBizOp.category === 'Operating Hours') ? 'schedule' : 'overview'
          }
        : null;

      // No fabricated dollar gains: urgency is ranked from the real lever type and issue volume.
      let priorityScore = topPriorityIssue ? opportunityBaseWeight(topPriorityIssue.category) : 20;
      priorityScore += Math.min(bizOpps.length + bizAlerts.length, 6) * 12;
      if (hasCritical) {
        priorityScore += 1000000;
      } else if (bizAlerts.length > 0) {
        priorityScore += 100000;
      }

      return {
        business: b,
        bizOpps,
        bizAlerts: sortedBizAlerts,
        topPriorityIssue,
        priorityScore,
        hasCritical
      };
    })
    .filter(item => {
      if (item.bizAlerts.length === 0 && item.bizOpps.length === 0) return false;

      if (analyzerSearch.trim()) {
        const q = analyzerSearch.toLowerCase();
        const matchName = item.business.name.toLowerCase().includes(q);
        const matchDist = (item.business.district || '').toLowerCase().includes(q);
        const matchType = (item.business.type || '').toLowerCase().includes(q);
        if (!matchName && !matchDist && !matchType) return false;
      }

      if (analyzerFilterSeverity === 'critical' && !item.hasCritical) return false;
      if (analyzerFilterSeverity === 'opportunity' && item.hasCritical) return false;

      if (analyzerFilterCategory !== 'all') {
        const hasCatOp = item.bizOpps.some(op => op.category === analyzerFilterCategory);
        const matchesAlertCat = item.topPriorityIssue?.category === analyzerFilterCategory;
        if (!hasCatOp && !matchesAlertCat) return false;
      }

      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (analyzerSortBy === 'priority') {
        cmp = a.priorityScore - b.priorityScore;
      } else if (analyzerSortBy === 'name') {
        cmp = a.business.name.localeCompare(b.business.name);
      } else if (analyzerSortBy === 'district') {
        cmp = (a.business.district || '').localeCompare(b.business.district || '');
      } else if (analyzerSortBy === 'category') {
        const catA = a.topPriorityIssue?.category || '';
        const catB = b.topPriorityIssue?.category || '';
        cmp = catA.localeCompare(catB);
      }
      return analyzerSortOrder === 'desc' ? -cmp : cmp;
    });

  const handleSort = (field: AnalyzerSortBy) => {
    if (analyzerSortBy === field) {
      setAnalyzerSortOrder(analyzerSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setAnalyzerSortBy(field);
      setAnalyzerSortOrder('desc');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedAnalyzerRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const hasActiveFilter = !!(analyzerSearch || analyzerFilterCategory !== 'all' || analyzerFilterSeverity !== 'all');

  // Top levers for the header strip: prioritize by real lever type, spread across stores.
  const topLevers = (() => {
    const seenStore = new Set<string>();
    return [...opportunities]
      .sort((a, b) => (opportunityBaseWeight(b.category) - opportunityBaseWeight(a.category)) || a.title.localeCompare(b.title))
      .filter(o => {
        const key = o.location;
        if (seenStore.has(key)) return false;
        seenStore.add(key);
        return true;
      })
      .slice(0, 3);
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-base font-bold text-[var(--text-main)]">{t('liveHq.analyzerTitle', 'Deterministic Decision Analyzer')}</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {t('liveHq.analyzerSubtitle', 'High-level synthesis of profit leaks across pricing, staffing skill, marketing, cleanliness, and store schedules.')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              {t('liveHq.analyzerTotalLevers', '{count} Total Levers').replace('{count}', opportunities.length.toString())}
            </span>
          </div>
        </div>

        {/* 1. TOP ACTIONABLE LEVERS STRIP */}
        {topLevers.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)] flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('liveHq.analyzerPriorityActions', 'Top Actionable Levers')}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {topLevers.map((topOp, idx) => {
                const targetBiz = businesses.find(b => b.name === topOp.location);
                const fixTab = (topOp.category === 'Pricing') ? 'pricing' : (topOp.category === 'Scheduling' || topOp.category === 'Operating Hours') ? 'schedule' : 'overview';

                return (
                  <div
                    key={`${topOp.id}-${idx}`}
                    className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-2 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold font-mono px-1.5 py-0.2 rounded uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          #{idx + 1} {t('liveHq.priorityWord', 'Priority')}
                        </span>
                        <span className="text-[10px] uppercase font-mono text-[var(--text-subtle)]">{topOp.category}</span>
                      </div>
                      <div className="font-bold text-xs text-[var(--text-main)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                        {topOp.title}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                        <span>{topOp.location}</span>
                      </div>
                      {topOp.current && topOp.recommended && (
                        <div className="text-[11px] font-mono text-[var(--text-subtle)]">
                          {topOp.current} &rarr; <strong className="text-emerald-500 font-semibold">{topOp.recommended}</strong>
                        </div>
                      )}
                    </div>

                    {targetBiz && (
                      <Link
                        href={`/live-sync?view=stores&store=${targetBiz.id}`}
                        className="w-full mt-2 py-1.5 px-2.5 rounded-lg bg-[var(--bg-surface)] hover:bg-emerald-600 hover:text-white border border-[var(--border-base)] text-[11px] font-semibold text-[var(--text-main)] transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span>{t('liveHq.analyzerFixInStore', 'Fix in Store')}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. EXECUTIVE BUSINESS SUMMARY TABLE */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              <Store className="w-4 h-4 text-amber-500" />
              <span>{t('liveHq.analyzerSuboptimalLocations', 'Suboptimal Locations Requiring Attention')}</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {t('liveHq.analyzerSuboptimalDesc', 'Only storefronts with active profit leaks or operational bottlenecks are listed below. Perfectly optimal stores are omitted.')}
            </p>
          </div>
        </div>

        {/* Filter, Search & Category Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-[var(--text-subtle)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={analyzerSearch}
              onChange={(e) => setAnalyzerSearch(e.target.value)}
              placeholder={t('liveHq.analyzerSearchPlaceholder', 'Search location or district...')}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-hidden focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setAnalyzerSevDropdownOpen(!analyzerSevDropdownOpen);
                  setAnalyzerCatDropdownOpen(false);
                }}
                className="bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-main)] font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <span className="capitalize">
                  {analyzerFilterSeverity === 'all' ? t('liveHq.analyzerAllSeverities', 'All Severities') : analyzerFilterSeverity === 'critical' ? t('liveHq.analyzerCriticalOnly', 'Critical Only') : t('liveHq.analyzerOpportunitiesOnly', 'Opportunities Only')}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] transition-transform ${analyzerSevDropdownOpen ? 'rotate-180 text-amber-500' : ''}`} />
              </button>

              {analyzerSevDropdownOpen && (
                <div className="absolute top-full right-0 mt-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-xl overflow-hidden min-w-36 animate-in fade-in zoom-in-95 duration-150 p-1 space-y-0.5">
                  {[
                    { val: 'all', label: t('liveHq.analyzerAllSeverities', 'All Severities') },
                    { val: 'critical', label: t('liveHq.analyzerCriticalOnly', 'Critical Only') },
                    { val: 'opportunity', label: t('liveHq.analyzerOpportunitiesOnly', 'Opportunities Only') }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => {
                        setAnalyzerFilterSeverity(opt.val as any);
                        setAnalyzerSevDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        analyzerFilterSeverity === opt.val
                          ? 'bg-amber-500 text-black font-bold'
                          : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                      }`}
                    >
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setAnalyzerCatDropdownOpen(!analyzerCatDropdownOpen);
                  setAnalyzerSevDropdownOpen(false);
                }}
                className="bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-main)] font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <span>{analyzerFilterCategory === 'all' ? t('liveHq.analyzerAllLevers', 'All Levers') : analyzerFilterCategory}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] transition-transform ${analyzerCatDropdownOpen ? 'rotate-180 text-amber-500' : ''}`} />
              </button>

              {analyzerCatDropdownOpen && (
                <div className="absolute top-full right-0 mt-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-xl overflow-hidden min-w-36 animate-in fade-in zoom-in-95 duration-150 p-1 space-y-0.5">
                  {['all', 'Pricing', 'Workforce', 'Operations', 'Marketing', 'Scheduling'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setAnalyzerFilterCategory(cat);
                        setAnalyzerCatDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        analyzerFilterCategory === cat
                          ? 'bg-amber-500 text-black font-bold'
                          : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                      }`}
                    >
                      <span>{cat === 'all' ? t('liveHq.analyzerAllLevers', 'All Levers') : cat}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Suboptimal Stores Data Table */}
        <AnalyzerTable
          suboptimalStores={suboptimalStores}
          analyzerSortBy={analyzerSortBy}
          analyzerSortOrder={analyzerSortOrder}
          onSort={handleSort}
          expandedAnalyzerRows={expandedAnalyzerRows}
          onToggleExpand={toggleExpand}
          hasActiveFilter={hasActiveFilter}
        />
      </div>

      {/* MARKET INTELLIGENCE & RIVALS (coming soon) */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-dashed border-[var(--border-base)] shadow-xs">
        <div className="flex items-center gap-2.5">
          <Swords className="w-4 h-4 text-[var(--text-subtle)]" />
          <h3 className="text-sm font-bold text-[var(--text-muted)]">
            {t('liveHq.marketIntel', 'Market Intelligence & Rivals')}
          </h3>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-[var(--bg-base)] text-[var(--text-subtle)] border border-[var(--border-base)] uppercase tracking-wider">
            {t('nav.soon', 'Soon')}
          </span>
        </div>
        <p className="text-xs text-[var(--text-subtle)] mt-1.5">
          {t('liveHq.marketIntelSoon', 'Deeper market events and competitor analysis are being rebuilt and will return here in a future update.')}
        </p>
      </div>
    </div>
  );
}
