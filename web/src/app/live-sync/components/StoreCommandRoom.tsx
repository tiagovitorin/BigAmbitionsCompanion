'use client';

import Link from 'next/link';
import { Sparkles, Megaphone, ArrowUpRight } from 'lucide-react';
import { LiveBusinessData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import BusinessLogo from './BusinessLogo';

export default function StoreCommandRoom({ activeStore }: { activeStore: LiveBusinessData }) {
  const { t } = useTranslation();
  return (
    <>
      {/* Store Command Header & Compact Twin KPI Panes */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <BusinessLogo business={activeStore} sizeClass="w-14 h-14" />
            <div>
              <div className="flex items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full ${activeStore.isOpenNow ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                <h2 className="text-base font-bold text-[var(--text-main)]">{activeStore.name}</h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-base)] border border-[var(--border-base)] font-semibold text-[var(--text-subtle)]">
                  {activeStore.type}
                </span>
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-1 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[var(--text-main)]">{activeStore.address}</span>
                <span>•</span>
                <span>{activeStore.district}</span>
                <span>•</span>
                <span className="text-sky-600 dark:text-sky-400 font-semibold">{activeStore.staffOnDuty} {t('liveHq.staffScheduled', 'Staff Scheduled')}</span>
              </div>
            </div>
          </div>

          {/* Condensed Financial Metrics */}
          <div className="flex items-center gap-2">
            <div className="px-3.5 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-center min-w-24">
              <div className="text-[9px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.weeklySales', 'Weekly Sales')}</div>
              <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                ${(activeStore.weeklyRevenue || 0).toLocaleString()}
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-center min-w-24">
              <div className="text-[9px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.weeklyProfitColumn', 'Weekly Profit')}</div>
              <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                ${(activeStore.weeklyProfit || 0).toLocaleString()}
              </div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-center min-w-24">
              <div className="text-[9px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.overallScore', 'Overall Score')}</div>
              <div className={`text-sm font-bold font-mono mt-0.5 ${
                activeStore.customerSatisfaction >= 80 ? 'text-emerald-500' : activeStore.customerSatisfaction >= 60 ? 'text-amber-500' : 'text-rose-500'
              }`}>
                {activeStore.customerSatisfaction}%
              </div>
            </div>
            <Link
              href="/pricing"
              title={t('liveHq.wikiReference', 'Wiki Reference')}
              className="p-2 rounded-xl border border-[var(--border-base)] text-[var(--text-subtle)] hover:text-sky-500 hover:border-sky-500/40 transition-colors flex items-center gap-1 shrink-0"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Twin Compact Grids: Satisfaction Matrix (Left) + Marketing & Foot Traffic (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3 border-t border-[var(--border-subtle)]">
        {/* Pillar 1: In-Game Satisfaction Factors */}
        {activeStore.satisfactionBreakdown && (
          <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t('liveHq.satisfactionPillars', 'Satisfaction Pillars')}</span>
              </span>
              <span className="text-[10px] font-mono text-[var(--text-subtle)]">{t('liveHq.scoreLabel', 'Score:')} {activeStore.customerSatisfaction}%</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <div className="text-[10px] text-[var(--text-subtle)]">{t('liveHq.satService', 'Service')}</div>
                <div className="font-mono font-bold text-sky-500 text-xs mt-0.5">{activeStore.satisfactionBreakdown.customerService}%</div>
              </div>
              <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <div className="text-[10px] text-[var(--text-subtle)]">{t('liveHq.satClean', 'Clean')}</div>
                <div className="font-mono font-bold text-emerald-500 text-xs mt-0.5">{activeStore.satisfactionBreakdown.cleanliness}%</div>
              </div>
              <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <div className="text-[10px] text-[var(--text-subtle)]">{t('liveHq.satPricing', 'Pricing')}</div>
                <div className="font-mono font-bold text-amber-500 text-xs mt-0.5">{activeStore.satisfactionBreakdown.pricing}%</div>
              </div>
              <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <div className="text-[10px] text-[var(--text-subtle)]">{t('liveHq.satInterior', 'Interior')}</div>
                <div className="font-mono font-bold text-indigo-500 text-xs mt-0.5">{activeStore.satisfactionBreakdown.facility || 100}%</div>
              </div>
            </div>
          </div>
        )}

        {/* Pillar 2: Promotion & Foot Traffic Multipliers */}
        {activeStore.promotion && (
          <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5 text-sky-500" />
                <span>{t('liveHq.trafficMultipliers', 'Traffic Multipliers')}</span>
              </span>
              <span className="text-[10px] font-mono text-[var(--text-subtle)]">{t('liveHq.totalPromotion', 'Total Promotion:')} {activeStore.promotion.total}%</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <div className="text-[10px] text-[var(--text-subtle)]">{t('liveHq.naturalTraffic', 'Natural Traffic')}</div>
                <div className="font-mono font-bold text-[var(--text-main)] text-xs mt-0.5">{activeStore.promotion.trafficIndex}%</div>
              </div>
              <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <div className="text-[10px] text-[var(--text-subtle)]">{t('liveHq.marketingMultiplier', 'Marketing Multiplier')}</div>
                <div className="font-mono font-bold text-sky-600 dark:text-sky-400 text-xs mt-0.5">
                  +{activeStore.promotion.marketing}%
                </div>
              </div>
              <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <div className="text-[10px] text-[var(--text-subtle)]">{t('liveHq.expansionPotential', 'Expansion Potential')}</div>
                <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                  {activeStore.promotion.marketing === 0 ? t('common.none', 'None') : t('liveHq.active', 'Active')}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
