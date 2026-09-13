'use client';

import { useMemo } from 'react';
import { Flame, TrendingUp } from 'lucide-react';
import { LiveBusinessData, LiveMarketEventData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import { buildHypeExposure } from '@/lib/hype';

interface HypeExposurePanelProps {
  businesses: LiveBusinessData[];
  marketEvents?: LiveMarketEventData[];
  gameDay: number;
}

const money = (value: number) => `$${Math.round(value).toLocaleString()}`;

export default function HypeExposurePanel({ businesses, marketEvents, gameDay }: HypeExposurePanelProps) {
  const { t, tGame } = useTranslation();
  const waves = useMemo(
    () => buildHypeExposure(marketEvents, businesses, gameDay),
    [marketEvents, businesses, gameDay]
  );

  if (waves.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-dashed border-[var(--border-base)] shadow-xs space-y-2">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-500" />
          <span>{t('liveHq.hypeTitle', 'Hype Exposure')}</span>
        </h3>
        <p className="text-[11px] text-[var(--text-subtle)] leading-relaxed">
          {t(
            'liveHq.hypeEmpty',
            'No hype wave is running in any neighbourhood right now. When one starts, this page will show the extra revenue it is bringing your shops and what disappears when it ends.'
          )}
        </p>
      </div>
    );
  }

  const endsIn = (daysLeft: number) =>
    daysLeft <= 0
      ? t('liveHq.hypeEndsToday', 'ends today')
      : daysLeft === 1
      ? t('liveHq.hypeEndsTomorrow', 'ends tomorrow')
      : t('liveHq.hypeEndsInDays', 'ends in {n} days').replace('{n}', String(daysLeft));

  const badge = (daysLeft: number) =>
    daysLeft <= 0
      ? t('liveHq.hypeEndsTodayBadge', 'ends today')
      : daysLeft === 1
      ? t('liveHq.hypeEndsTomorrow', 'ends tomorrow')
      : t('liveHq.hypeDaysLeftBadge', '{n}d left').replace('{n}', String(daysLeft));

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-3">
      <div>
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-500" />
          <span>{t('liveHq.hypeTitle', 'Hype Exposure')}</span>
        </h3>
        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
          {t('liveHq.hypeSubtitle', 'The extra revenue a running hype wave is bringing one of your shops, and what goes away when it ends.')}
        </p>
      </div>

      <div className="space-y-3">
        {waves.map(wave => {
          const itemsLabel = wave.items.map(item => tGame(item)).join(', ');
          const store = wave.topStore;
          const baseline = wave.baseline;
          const maxValue = baseline && store ? Math.max(baseline.revenue, store.revenue, 1) : 1;

          return (
            <div key={wave.hoodRaw} className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-xs font-bold text-[var(--text-main)]">{itemsLabel}</span>
                <span className="text-[11px] text-[var(--text-muted)]">
                  {t('liveHq.hypeInHood', 'hype in {hood}').replace('{hood}', wave.hoodName)}
                </span>
                <span className={`ml-auto text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${wave.daysLeft <= 1 ? 'bg-rose-500/10 text-rose-500 border-rose-500/30' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'}`}>
                  {badge(wave.daysLeft)}
                </span>
              </div>

              {store && baseline ? (
                <>
                  <div className="text-[11px] text-[var(--text-muted)]">{store.name}</div>

                  {/* Before vs while, side by side in one scale */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="w-24 shrink-0 text-[var(--text-subtle)]">{t('liveHq.hypeBeforeWave', 'Before the wave')}</span>
                      <div className="flex-1 h-3.5 rounded-md bg-[var(--bg-base)] border border-[var(--border-subtle)] overflow-hidden">
                        <div className="h-full rounded-r-sm bg-slate-400/70" style={{ width: `${Math.round((baseline.revenue / maxValue) * 100)}%` }} />
                      </div>
                      <span className="w-20 shrink-0 text-right font-mono text-[var(--text-muted)]">{money(baseline.revenue)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="w-24 shrink-0 font-semibold text-amber-600 dark:text-amber-400">{t('liveHq.hypeWhileRuns', 'While it runs')}</span>
                      <div className="flex-1 h-3.5 rounded-md bg-[var(--bg-base)] border border-amber-500/30 overflow-hidden">
                        <div className="h-full rounded-r-sm bg-amber-500" style={{ width: `${Math.round((store.revenue / maxValue) * 100)}%` }} />
                      </div>
                      <span className="w-20 shrink-0 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{money(store.revenue)}</span>
                    </div>
                    <div className="text-[10px] text-[var(--text-subtle)] text-right">{t('liveHq.hypePerDayLabel', 'revenue per day from {items}').replace('{items}', itemsLabel)}</div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {t('liveHq.hypeExtraPerDay', '+{amount}/day extra while it lasts').replace('{amount}', money(wave.drop ?? 0))}
                  </div>

                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    {t('liveHq.hypePlainSentence', '{store} usually makes about {before}/day from {items}. While the hype runs it is about {now}/day. That extra disappears when the wave {when}.')
                      .replace('{store}', store.name)
                      .replace('{before}', money(baseline.revenue))
                      .replace('{items}', itemsLabel)
                      .replace('{now}', money(store.revenue))
                      .replace('{when}', endsIn(wave.daysLeft))}
                  </p>
                </>
              ) : store ? (
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  {t('liveHq.hypeNoBaseline', '{store} does {revenue}/day under it, but no shop of the same kind is trading without a wave and there are no pre-wave trading days, so there is no baseline to say what the drop will be.')
                    .replace('{store}', store.name)
                    .replace('{revenue}', money(store.revenue))}
                </p>
              ) : (
                <p className="text-[11px] text-[var(--text-subtle)]">
                  {t('liveHq.hypeNoExposure', 'You sell none of these products in this neighbourhood, so this wave is not riding on any of your shops.')}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
