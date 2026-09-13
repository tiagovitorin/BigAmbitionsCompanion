'use client';

import { MapPin } from 'lucide-react';
import type { LiveBuildingForSaleData, LiveOwnedRealEstateData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import PropertyTable, { PropertyTableColumn } from './PropertyTable';

interface MarketWatchPanelProps {
  buildingsForSale: LiveBuildingForSaleData[];
  ownedRealEstate: LiveOwnedRealEstateData[];
}

export default function MarketWatchPanel({ buildingsForSale, ownedRealEstate }: MarketWatchPanelProps) {
  const { t } = useTranslation();

  // Your portfolio's average purchase cost per square meter, used as a factual
  // yardstick for what a listing's asking price per sqm means to you.
  const ownedSqm = ownedRealEstate.reduce((acc, re) => acc + (re.totalSqm || 0), 0);
  const ownedCost = ownedRealEstate.reduce((acc, re) => acc + (re.purchasePrice || 0), 0);
  const avgCostPerSqm = ownedSqm > 0 ? ownedCost / ownedSqm : null;

  const columns: PropertyTableColumn[] = [
    { key: 'address', label: t('liveHq.propertyAddress', 'Property Address') },
    { key: 'type', label: t('liveHq.typeClassification', 'Type') },
    { key: 'size', label: t('liveHq.dimensions', 'Size'), align: 'center' },
    { key: 'price', label: t('liveHq.askingPrice', 'Asking price'), align: 'right' },
    { key: 'persqm', label: t('liveHq.pricePerSqmLabel', 'Price / m²'), align: 'right' }
  ];
  if (avgCostPerSqm != null) {
    columns.push({ key: 'vsavg', label: t('liveHq.vsYourAvg', 'vs your avg'), align: 'right' });
  }

  const sorted = [...buildingsForSale].sort((a, b) => (a.pricePerSqm || 0) - (b.pricePerSqm || 0));

  const rows = sorted.map(b => {
    const delta = avgCostPerSqm && b.pricePerSqm ? ((b.pricePerSqm - avgCostPerSqm) / avgCostPerSqm) * 100 : null;
    const cells = [
      <div key="addr" className="min-w-0">
        <div className="font-semibold text-[var(--text-main)] truncate">{b.address}</div>
        {b.neighbourhood ? (
          <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
            <MapPin className="w-2.5 h-2.5 text-[var(--text-subtle)] shrink-0" />
            <span className="truncate">{b.neighbourhood}</span>
          </div>
        ) : null}
      </div>,
      <span key="type">{b.buildingType || '-'}</span>,
      <span key="size" className="font-mono">{b.squareMeters} m²</span>,
      <span key="price" className="font-mono text-[var(--text-main)] font-semibold">${b.buildingPrice.toLocaleString()}</span>,
      <span key="persqm" className="font-mono">${b.pricePerSqm.toLocaleString()}/m²</span>
    ];
    if (avgCostPerSqm != null) {
      cells.push(
        delta != null ? (
          <span
            key="vs"
            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${
              delta <= 0
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
            }`}
          >
            {delta >= 0 ? '+' : ''}{delta.toFixed(0)}%
          </span>
        ) : (
          <span key="vs" className="text-[var(--text-subtle)]">-</span>
        )
      );
    }
    return cells;
  });

  const empty = (
    <div className="p-6 text-center">
      <p className="text-xs text-[var(--text-muted)]">{t('liveHq.noListingsForSale', 'No buildings are currently for sale in the city.')}</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--text-muted)] leading-relaxed">
        {t('liveHq.marketWatchDesc', 'Buildings currently for sale. The percentage compares each asking price per square meter with your own portfolio average, so you can spot a deal at a glance.')}
      </p>
      <PropertyTable
        columns={columns}
        rows={rows}
        rowKey={i => `${sorted[i].streetName}_${sorted[i].streetNumber}`}
        empty={empty}
      />
    </div>
  );
}
