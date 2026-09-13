'use client';

import { useTranslation } from '@/context/LanguageContext';
import { ProductionSectionProps, money } from '@/lib/productionUi';

export default function FactoryOutputSection({ model, demand, chains }: ProductionSectionProps) {
  const { t } = useTranslation();

  const rows = Object.keys(model.dailyOutputByProduct)
    .map(rawId => ({ rawId, siteDaily: model.dailyOutputByProduct[rawId], row: demand[rawId] }))
    .filter(entry => entry.row != null);

  const siteChains = chains.filter(link => (
    link.producers.some(entry => entry.siteId === model.site.id) ||
    link.consumers.some(entry => entry.siteId === model.site.id)
  ));

  if (rows.length === 0) {
    return <p className="text-xs text-[var(--text-subtle)]">{t('liveHq.factoryNoOutput', 'No output products detected.')}</p>;
  }

  return (
    <div className="space-y-3">
    <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--bg-surface)] overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-[var(--border-base)] text-[10px] uppercase font-bold tracking-wider text-[var(--text-subtle)]">
            <span className="col-span-3">{t('liveHq.product', 'Product')}</span>
            <span className="col-span-2 text-right">{t('liveHq.factorySitePerDay', 'This site / day')}</span>
            <span className="col-span-2 text-right">{t('liveHq.factoryRetailExportDrain', 'Retail + export / day')}</span>
            <span className="col-span-1 text-right">{t('liveHq.factoryDemandRatio', 'Ratio')}</span>
            <span className="col-span-2 text-right">{t('liveHq.factoryFinishedStock', 'Finished stock')}</span>
            <span className="col-span-2 text-right">{t('liveHq.factoryRunway', 'Runway')}</span>
          </div>
          <div className="divide-y divide-[var(--border-subtle)]">
            {rows.map(({ rawId, siteDaily, row }) => {
              const ratio = row.demandRatio;
              const recommendation = row.unrouted
                ? { text: t('liveHq.factoryRecNoDemand', 'No demand'), tone: 'text-rose-500' }
                : ratio != null && ratio > 30
                  ? { text: t('liveHq.factoryRecOverproducing', 'Overproducing'), tone: 'text-amber-600 dark:text-amber-400' }
                  : ratio != null && ratio < 0.9
                    ? { text: t('liveHq.factoryRecUnderproducing', 'Below demand'), tone: 'text-sky-500' }
                    : { text: t('liveHq.factoryRecBalanced', 'Balanced'), tone: 'text-emerald-500' };
              return (
                <div key={rawId} className="grid grid-cols-12 gap-3 px-4 py-2.5 items-center text-xs">
                  <span className="col-span-3 min-w-0">
                    <span className="block truncate font-semibold text-[var(--text-main)]">{row.name}</span>
                    <span className={`text-[9px] font-bold ${recommendation.tone}`}>{recommendation.text}</span>
                    {row.unrouted && (
                      <span className="block text-[9px] text-rose-500">
                        {t('liveHq.factoryNoRoute', 'Nothing sells or exports this - route it or stop producing')}
                      </span>
                    )}
                    {ratio != null && ratio > 30 && row.suggestedProduceCap != null && (
                      <span className="block text-[9px] text-sky-500">
                        {t('liveHq.factorySuggestCap', 'Suggested cap ~{n} (7 days of sales)').replace('{n}', row.suggestedProduceCap.toLocaleString())}
                      </span>
                    )}
                  </span>
                  <span className="col-span-2 text-right font-mono text-[var(--text-main)]">{Math.round(siteDaily).toLocaleString()}</span>
                  <span className="col-span-2 text-right font-mono text-[var(--text-muted)]">
                    {Math.round(row.retailDrain).toLocaleString()}
                    {(row.exportDrain > 0 || row.exportBulk) && (
                      <span className="block text-[9px] text-violet-500">
                        {row.exportDrain > 0 ? `+${Math.round(row.exportDrain).toLocaleString()} ${t('liveHq.factoryExportWord', 'export')}` : ''}
                        {row.exportBulk && (
                          <span className="ml-1 text-amber-500" title={t('liveHq.factoryExportBulkTip', 'A one-off bulk export was excluded from the ongoing rate.')}>
                            {t('liveHq.factoryExportBulk', 'bulk excluded')}
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                  <span className={`col-span-1 text-right font-mono font-bold ${ratio != null && ratio > 30 ? 'text-amber-600 dark:text-amber-400' : 'text-[var(--text-main)]'}`}>
                    {ratio != null ? `${ratio.toFixed(1)}x` : '-'}
                  </span>
                  <span className="col-span-2 text-right font-mono text-[var(--text-muted)]">{Math.round(row.finishedStock).toLocaleString()}</span>
                  <span className="col-span-2 text-right font-mono text-[var(--text-muted)]">
                    {row.runwayDays != null ? `${Math.round(row.runwayDays)}d` : '-'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="px-4 py-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-subtle)]">
        {t('liveHq.factoryOutputNote', 'Retail sales, exports and finished stock are empire-wide. Gross value of this site: {amount}/day.')
          .replace('{amount}', money(model.grossValuePerDay))}
      </div>
    </div>

    <div className="rounded-2xl border border-[var(--border-base)] bg-[var(--bg-surface)] p-4 space-y-3 shadow-xs">
      <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-main)]">{t('liveHq.factoryChainsTitle', 'Internal production chains')}</div>
      {siteChains.length === 0 ? (
        <p className="text-[11px] text-[var(--text-subtle)]">{t('liveHq.factoryChainsNone', 'No intermediate products are produced and consumed internally.')}</p>
      ) : siteChains.map(link => (
        <div key={link.rawId} className="text-[11px] space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[var(--text-main)]">{link.name}</span>
            {link.crossSite && (
              <span className="text-[9px] font-bold text-violet-500 bg-violet-500/10 border border-violet-500/20 rounded px-1">{t('liveHq.factoryChainCrossSite', 'Cross-site')}</span>
            )}
          </div>
          <div className="text-[var(--text-muted)]">
            {t('liveHq.factoryChainProduced', 'Produced {p}/day by {sites}')
              .replace('{p}', Math.round(link.totalProduced).toLocaleString())
              .replace('{sites}', link.producers.map(entry => entry.siteName).join(', '))}
          </div>
          <div className="text-[var(--text-muted)]">
            {t('liveHq.factoryChainConsumed', 'Consumed {c}/day by {lines}')
              .replace('{c}', Math.round(link.totalConsumed).toLocaleString())
              .replace('{lines}', link.consumers.map(entry => `${entry.lineName} @ ${entry.siteName}`).join(', '))}
          </div>
          <div className="text-emerald-600 dark:text-emerald-400 font-mono">
            {t('liveHq.factoryChainNet', 'Net retail-bound: {n}/day').replace('{n}', Math.round(link.netRetailBound).toLocaleString())}
          </div>
        </div>
      ))}
    </div>
    </div>
  );
}
