'use client';

import { useTranslation } from '@/context/LanguageContext';
import { NODE_BG } from '@/lib/supplyChainFlow';
import type { SupplyChainNode } from '@/lib/logistics';

const STATUS_COLOR: Record<'covered' | 'tight' | 'short', string> = {
  covered: '#10b981',
  tight: '#f59e0b',
  short: '#f43f5e'
};

const KINDS: SupplyChainNode['kind'][] = ['importer', 'warehouse', 'store', 'wholesaler'];

export default function SupplyChainFlowLegend() {
  const { t } = useTranslation();
  const kindLabel = (kind: SupplyChainNode['kind']) =>
    kind === 'importer' ? t('liveHq.zoneImporters', 'Importers')
      : kind === 'warehouse' ? t('liveHq.zoneWarehouses', 'Warehouses')
        : kind === 'store' ? t('liveHq.zoneStores', 'Stores')
          : t('liveHq.zoneWholesalers', 'Wholesalers');

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-[var(--text-subtle)]">
      {KINDS.map(kind => (
        <span key={kind} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ background: NODE_BG[kind] }} />
          {kindLabel(kind)}
        </span>
      ))}
      <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded" style={{ background: STATUS_COLOR.covered }} />{t('liveHq.filterCovered', 'Covered')}</span>
      <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded" style={{ background: STATUS_COLOR.tight }} />{t('liveHq.filterTight', 'Tight')}</span>
      <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded" style={{ background: STATUS_COLOR.short }} />{t('liveHq.filterShort', 'Short')}</span>
    </div>
  );
}
