'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Zap,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Clock,
  Store,
  Building,
  Users,
  Activity,
  ChevronRight
} from 'lucide-react';
import { LiveBusinessData, LiveWeeklyRevenueEntry } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import { ActionItem, OverviewDerivedData } from '@/lib/alerts';
import BusinessLogo from './BusinessLogo';
import EmpireProfitSparkline from './EmpireProfitSparkline';

interface OverviewViewProps {
  smoothClock: { day: number; hour: number; minute: number };
  dailyRevenueTotal: number;
  dailyExpensesTotal: number;
  weeklyRevenueTotal: number;
  weeklyExpensesTotal: number;
  weeklyRevenueHistory: LiveWeeklyRevenueEntry[];
  netWorth: number;
  playerCash: number;
  bankBalance: number;
  totalLoans: number;
  unpaidTaxes: number;
  weeklyBusinessRevenue: number;
  weeklyResidentialNet: number;
  weeklyPayrollTotal: number;
  totalEmployees: number;
  businesses: LiveBusinessData[];
  overviewDerivedData: OverviewDerivedData;
  activeAlertsCount: number;
  opportunitiesCount: number;
}

export default function OverviewView({
  smoothClock,
  dailyRevenueTotal,
  dailyExpensesTotal,
  weeklyRevenueTotal,
  weeklyExpensesTotal,
  weeklyRevenueHistory,
  netWorth,
  playerCash,
  bankBalance,
  totalLoans,
  unpaidTaxes,
  weeklyBusinessRevenue,
  weeklyResidentialNet,
  weeklyPayrollTotal,
  totalEmployees,
  businesses,
  overviewDerivedData,
  activeAlertsCount,
  opportunitiesCount
}: OverviewViewProps) {
  const { t } = useTranslation();
  const currentHour = smoothClock.hour;
  const currentMin = smoothClock.minute;
  const dayFraction = Math.max(0.01, Math.min(1, (currentHour * 60 + currentMin) / 1440));
  const todayProfitSoFar = dailyRevenueTotal - dailyExpensesTotal;

  const isEarlyDay = currentHour < 8 || dayFraction < 0.25;
  const runRateToday = !isEarlyDay ? Math.round(todayProfitSoFar / dayFraction) : null;

  const yesterdayRecord = weeklyRevenueHistory && weeklyRevenueHistory.length >= 2
    ? weeklyRevenueHistory[weeklyRevenueHistory.length - 2]
    : null;
  const yesterdayProfit = yesterdayRecord ? yesterdayRecord.profit : null;
  const profitVsYesterday = yesterdayProfit !== null ? todayProfitSoFar - yesterdayProfit : null;

  const {
    criticalStores,
    warningStores,
    healthyStores,
    topPerformer,
    lowestPerformer,
    unifiedActionFeed
  } = overviewDerivedData;

  const totalStoresCount = businesses.length || 1;
  const healthyPct = Math.round((healthyStores.length / totalStoresCount) * 100);
  const warningPct = Math.round((warningStores.length / totalStoresCount) * 100);
  const criticalPct = Math.max(0, 100 - healthyPct - warningPct);

  const weeklyNetProfit = weeklyRevenueTotal - weeklyExpensesTotal;
  const empireMargin = weeklyRevenueTotal > 0 ? Math.round((weeklyNetProfit / weeklyRevenueTotal) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* 1. COMPACT EXECUTIVE STATUS STRIP WITH 7D PROFIT SPARKLINE */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Financial Fundamentals & 7D Profit Sparkline */}
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/live-sync?view=finance" className="group cursor-pointer">
              <div className="text-[10px] uppercase font-bold text-[var(--text-subtle)] flex items-center gap-1 group-hover:text-emerald-500 transition-colors">
                <span>{t('liveHq.empireNetWorth')}</span>
                <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100" />
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-lg font-extrabold font-mono text-[var(--text-main)]">
                  ${netWorth.toLocaleString()}
                </span>
                {profitVsYesterday !== null && (
                  <span className={`text-[10px] font-mono font-bold ${profitVsYesterday >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {profitVsYesterday >= 0 ? `▲ +$${Math.abs(profitVsYesterday).toLocaleString()}` : `▼ -$${Math.abs(profitVsYesterday).toLocaleString()}`}
                  </span>
                )}
              </div>
            </Link>

            <div className="h-7 w-px bg-[var(--border-base)] hidden sm:block" />

            <Link href="/live-sync?view=finance" className="group cursor-pointer">
              <div className="text-[10px] uppercase font-bold text-[var(--text-subtle)] flex items-center gap-1 group-hover:text-emerald-500 transition-colors">
                <span>{t('liveHq.liquidCash')}</span>
                <ArrowUpRight className="w-3 h-3 opacity-60 group-hover:opacity-100" />
              </div>
              <div className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                ${playerCash.toLocaleString()}
                <span className="text-xs text-[var(--text-muted)] font-normal ml-1.5">({bankBalance.toLocaleString()} {t('liveHq.bankWord')})</span>
              </div>
            </Link>

            <div className="h-7 w-px bg-[var(--border-base)] hidden sm:block" />

            <div>
              <div className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">
                {t('liveHq.todaysProfitFlow')}
              </div>
              <div className="text-lg font-extrabold font-mono flex items-center gap-2 mt-0.5">
                <span className={todayProfitSoFar >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}>
                  {todayProfitSoFar >= 0 ? `+$${todayProfitSoFar.toLocaleString()}` : `-$${Math.abs(todayProfitSoFar).toLocaleString()}`}
                </span>
                <span className="text-xs font-mono font-medium text-[var(--text-subtle)] px-2 py-0.5 rounded-md bg-[var(--bg-base)] border border-[var(--border-subtle)]" title={isEarlyDay ? t('liveHq.calibratingMorning') : t('liveHq.projectedPace')}>
                  {t('liveHq.pace')} {runRateToday !== null ? (
                    <strong className={runRateToday >= 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
                      {runRateToday >= 0 ? `+$${runRateToday.toLocaleString()}` : `-$${Math.abs(runRateToday).toLocaleString()}`}
                    </strong>
                  ) : (
                    <span className="text-[var(--text-subtle)] italic">{t('liveHq.calibrating')}</span>
                  )}
                </span>
              </div>
            </div>

            {/* 7-Day Profit Sparkline Trajectory */}
            {weeklyRevenueHistory && weeklyRevenueHistory.length > 1 && (
              <>
                <div className="h-7 w-px bg-[var(--border-base)] hidden md:block" />
                <div className="hidden md:block">
                  <EmpireProfitSparkline history={weeklyRevenueHistory} />
                </div>
              </>
            )}
          </div>

          {/* Right: Taxes & Liabilities Horizon */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <Link
              href="/live-sync?view=finance"
              className="px-3 py-1.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] hover:border-amber-500/40 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-500" />
              <div>
                <div className="text-[9px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.unpaidTaxesLabel')}</div>
                <div className={`font-bold ${(unpaidTaxes || 0) > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  ${(unpaidTaxes || 0).toLocaleString()}
                </div>
              </div>
            </Link>

            <div className="px-3 py-1.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-sky-500" />
              <div>
                <div className="text-[9px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.bankLoans')}</div>
                <div className="font-bold text-sky-600 dark:text-sky-400">
                  ${(totalLoans || 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. HERO: ADAPTIVE COMMAND RADAR (Top 4 Unified Action Items) */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
              {t('liveHq.empireActionRadar')}
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">
              {activeAlertsCount} {t('liveHq.alertsWord')} • {opportunitiesCount} {t('liveHq.leversWord')}
            </span>
          </div>

          <Link
            href="/live-sync?view=analyzer"
            className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
          >
            <span>{t('liveHq.openFullAnalyzer')}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {unifiedActionFeed.length > 0 ? (
          <div className="space-y-1.5">
            {unifiedActionFeed.map((item) => {
              const isCrit = item.severity === 'critical';
              const isWarn = item.severity === 'warning';

              return (
                <div
                  key={item.id}
                  className={`py-2 px-3 rounded-xl border text-xs flex items-center justify-between gap-3 transition-colors ${
                    isCrit
                      ? 'bg-rose-500/10 border-rose-500/30'
                      : isWarn
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : 'bg-[var(--bg-base)] border-[var(--border-base)] hover:border-emerald-500/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.targetBiz ? (
                      <BusinessLogo business={item.targetBiz} sizeClass="w-6 h-6" />
                    ) : item.itemImg ? (
                      <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-700/60 p-0.5 flex items-center justify-center shrink-0">
                        <img src={item.itemImg} alt="" className="w-full h-full object-contain" />
                      </div>
                    ) : null}

                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.2 rounded uppercase shrink-0 ${
                      isCrit
                        ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40'
                        : isWarn
                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {item.category}
                    </span>
                    <span className="font-bold text-[var(--text-main)] shrink-0">
                      {item.location}:
                    </span>
                    <span className="text-[var(--text-muted)] truncate flex items-center gap-1.5">
                      {item.itemImg && !item.targetBiz && (
                        <img src={item.itemImg} alt="" className="w-4 h-4 object-contain inline-block" />
                      )}
                      <span>{item.message}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {!item.isAlert && item.impactScore != null && item.impactScore > 0 && (
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        +${item.impactScore.toLocaleString()}/wk
                      </span>
                    )}
                    <Link
                      href={item.linkUrl}
                      className={`text-[11px] font-bold hover:underline inline-flex items-center gap-0.5 ${
                        isCrit
                          ? 'text-rose-500'
                          : isWarn
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      <span>{item.btnLabel}</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-4 px-6 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center gap-4">
            <img
              src="/images/unclefred.png"
              alt="Uncle Fred"
              className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/50 shadow-md shrink-0"
            />
            <div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('liveHq.uncleFredSays')}</span>
              </div>
              <p className="text-xs text-[var(--text-main)] mt-0.5 font-medium">
                {t('liveHq.allClearFredMsg')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. PERFORMANCE & OPERATIONAL HEALTH DUAL-PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Financial Performance & Margin */}
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                {t('liveHq.financialFlowMargin')}
              </h3>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
              {t('liveHq.netMargin', '{margin}% Net Margin').replace('{margin}', empireMargin.toString())}
            </span>
          </div>

          {/* Intraday Simulation Progress Bar & Hourly Demand Window */}
          <div className="space-y-1.5 p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[var(--text-subtle)] flex items-center gap-1.5 font-semibold">
                <Clock className="w-3.5 h-3.5 text-sky-500" />
                <span>{t('liveHq.gameDayPacing')}</span>
                <span className="text-[var(--text-main)] font-bold">{String(currentHour).padStart(2, '0')}:{String(currentMin).padStart(2, '0')}</span>
              </span>
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                {Math.round(dayFraction * 100)}% {t('liveHq.elapsed')}
              </span>
            </div>

            <div className="relative w-full h-2 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden">
              <div className="absolute top-0 bottom-0 left-[45.8%] w-[12.5%] bg-amber-500/20" title={t('liveHq.lunchRush')} />
              <div className="absolute top-0 bottom-0 left-[70.8%] w-[12.5%] bg-amber-500/20" title={t('liveHq.dinnerRush')} />
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(2, dayFraction * 100))}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[9px] font-mono text-[var(--text-subtle)] pt-0.5">
              <span>00:00</span>
              <span className="text-amber-500/80 font-semibold">{t('liveHq.lunchLabel')}</span>
              <span className="text-amber-500/80 font-semibold">{t('liveHq.dinnerLabel')}</span>
              <span>24:00</span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="p-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--text-main)] font-medium">
                <Store className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t('liveHq.storefrontRevenue')}</span>
              </div>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                +${weeklyBusinessRevenue.toLocaleString()}/wk
              </span>
            </div>

            <div className="p-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--text-main)] font-medium">
                <Building className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('liveHq.residentialNetCashflow')}</span>
              </div>
              <span className={`font-mono font-bold ${weeklyResidentialNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                {weeklyResidentialNet >= 0 ? `+$${weeklyResidentialNet.toLocaleString()}` : `-$${Math.abs(weeklyResidentialNet).toLocaleString()}`}/wk
              </span>
            </div>

            <div className="p-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-between">
              <div className="flex items-center gap-2 text-[var(--text-main)] font-medium">
                <Users className="w-3.5 h-3.5 text-rose-500" />
                <span>{t('liveHq.payrollDrain', 'Payroll Drain ({count} Staff)').replace('{count}', totalEmployees.toString())}</span>
              </div>
              <span className="font-mono font-bold text-rose-500">
                -${weeklyPayrollTotal.toLocaleString()}/wk
              </span>
            </div>
          </div>
        </div>

        {/* Right: Empire Store Health & Outliers with Segmented Ratio Bar */}
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">
                {t('liveHq.fleetVitality', 'Fleet Vitality ({count} Stores)').replace('{count}', businesses.length.toString())}
              </h3>
            </div>
            <Link
              href="/live-sync?view=stores"
              className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {t('liveHq.allStores')}
            </Link>
          </div>

          {/* Segmented Horizontal Ratio Bar (Visual Distribution) */}
          <div className="space-y-2.5">
            <div className="w-full h-4 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)] overflow-hidden flex text-[9px] font-mono font-bold text-white shadow-inner">
              {healthyStores.length > 0 && (
                <Link
                  href="/live-sync?view=stores"
                  style={{ width: `${(healthyStores.length / totalStoresCount) * 100}%` }}
                  className="h-full bg-emerald-500 hover:bg-emerald-400 transition-all flex items-center justify-center overflow-hidden px-1 cursor-pointer"
                  title={t('liveHq.healthySegmentTitle', '{count} Healthy ({pct}%) - Click to view stores').replace('{count}', healthyStores.length.toString()).replace('{pct}', healthyPct.toString())}
                >
                  {healthyPct >= 18 && <span>{healthyPct}%</span>}
                </Link>
              )}
              {warningStores.length > 0 && (
                <Link
                  href="/live-sync?view=analyzer"
                  style={{ width: `${(warningStores.length / totalStoresCount) * 100}%` }}
                  className="h-full bg-amber-500 hover:bg-amber-400 transition-all flex items-center justify-center overflow-hidden px-1 cursor-pointer"
                  title={t('liveHq.attentionSegmentTitle', '{count} Attention ({pct}%) - Click to view in Decision Analyzer').replace('{count}', warningStores.length.toString()).replace('{pct}', warningPct.toString())}
                >
                  {warningPct >= 14 && <span>{warningPct}%</span>}
                </Link>
              )}
              {criticalStores.length > 0 && (
                <Link
                  href="/live-sync?view=analyzer"
                  style={{ width: `${(criticalStores.length / totalStoresCount) * 100}%` }}
                  className="h-full bg-rose-500 hover:bg-rose-400 transition-all flex items-center justify-center overflow-hidden px-1 cursor-pointer"
                  title={t('liveHq.criticalSegmentTitle', '{count} Critical ({pct}%) - Click to view critical alerts in Decision Analyzer').replace('{count}', criticalStores.length.toString()).replace('{pct}', criticalPct.toString())}
                >
                  {criticalPct >= 10 && <span>{criticalPct}%</span>}
                </Link>
              )}
            </div>

            {/* Interactive Segment Labels */}
            <div className="flex items-center justify-between text-[11px] font-mono">
              <Link
                href="/live-sync?view=stores"
                className="flex items-center gap-1.5 hover:text-emerald-500 transition-colors cursor-pointer group"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 group-hover:scale-125 transition-transform" />
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{healthyStores.length} {t('liveHq.healthyLabel')}</span>
                <span className="text-[10px] text-[var(--text-subtle)]">({healthyPct}%)</span>
              </Link>
              <Link
                href="/live-sync?view=analyzer"
                className="flex items-center gap-1.5 hover:text-amber-500 transition-colors cursor-pointer group"
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 group-hover:scale-125 transition-transform" />
                <span className="font-bold text-amber-600 dark:text-amber-400">{warningStores.length} {t('liveHq.attentionLabel')}</span>
                <span className="text-[10px] text-[var(--text-subtle)]">({warningPct}%)</span>
              </Link>
              <Link
                href="/live-sync?view=analyzer"
                className="flex items-center gap-1.5 hover:text-rose-500 transition-colors cursor-pointer group"
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 group-hover:scale-125 transition-transform" />
                <span className="font-bold text-rose-500">{criticalStores.length} {t('liveHq.criticalLabel')}</span>
                <span className="text-[10px] text-[var(--text-subtle)]">({criticalPct}%)</span>
              </Link>
            </div>
          </div>

          {/* Top & Lowest Performers */}
          <div className="space-y-1.5 text-xs pt-1 border-t border-[var(--border-subtle)]">
            {topPerformer && (
              <Link
                href={`/live-sync?view=stores&store=${topPerformer.id}`}
                className="p-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] hover:border-emerald-500/40 flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <BusinessLogo business={topPerformer} sizeClass="w-6 h-6" />
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                    {t('liveHq.topPerformer')}
                  </span>
                  <span className="font-bold text-[var(--text-main)] truncate group-hover:text-emerald-500 transition-colors">
                    {topPerformer.name}
                  </span>
                </div>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                  +${(topPerformer.dailyProfit !== undefined ? topPerformer.dailyProfit : Math.round((topPerformer.weeklyProfit || 0) / 7)).toLocaleString()}/d
                </span>
              </Link>
            )}

            {lowestPerformer && lowestPerformer.id !== topPerformer?.id && (
              <Link
                href={`/live-sync?view=stores&store=${lowestPerformer.id}`}
                className="p-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] hover:border-amber-500/40 flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <BusinessLogo business={lowestPerformer} sizeClass="w-6 h-6" />
                  <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded uppercase bg-slate-500/15 text-[var(--text-subtle)] border border-[var(--border-subtle)] shrink-0">
                    {t('liveHq.lowestPerformer')}
                  </span>
                  <span className="font-bold text-[var(--text-main)] truncate group-hover:text-amber-500 transition-colors">
                    {lowestPerformer.name}
                  </span>
                </div>
                <span className={`font-mono font-bold shrink-0 ${
                  (lowestPerformer.dailyProfit !== undefined ? lowestPerformer.dailyProfit : (lowestPerformer.weeklyProfit || 0)) < 0
                    ? 'text-rose-500'
                    : 'text-[var(--text-muted)]'
                }`}>
                  ${(lowestPerformer.dailyProfit !== undefined ? lowestPerformer.dailyProfit : Math.round((lowestPerformer.weeklyProfit || 0) / 7)).toLocaleString()}/d
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
