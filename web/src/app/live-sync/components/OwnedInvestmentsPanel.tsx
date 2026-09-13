'use client';

import { MapPin, TrendingUp } from 'lucide-react';
import type { LiveOwnedRealEstateData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import { annualRoi, appreciationPct, marketDeltaPct, marketPosition } from '@/lib/realEstate';
import PropertyTable, { PropertyTableColumn } from './PropertyTable';

interface OwnedInvestmentsPanelProps {
  ownedRealEstate: LiveOwnedRealEstateData[];
  daysPerYear: number;
}

const MARKET_BADGE: Record<'under' | 'at' | 'over', string> = {
  under: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30',
  at: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  over: 'bg-rose-500/10 text-rose-500 border-rose-500/30'
};

// Presentational occupancy coloring: full is healthy, half is watch, low is bad.
function occupancyColor(pct: number): string {
  if (pct >= 85) return '#10b981';
  if (pct >= 50) return '#f59e0b';
  return '#f43f5e';
}

export default function OwnedInvestmentsPanel({ ownedRealEstate, daysPerYear }: OwnedInvestmentsPanelProps) {
  const { t } = useTranslation();

  const columns: PropertyTableColumn[] = [
    { key: 'address', label: t('liveHq.propertyAddress', 'Property Address') },
    { key: 'type', label: t('liveHq.typeClassification', 'Type') },
    { key: 'size', label: t('liveHq.dimensions', 'Size'), align: 'center' },
    { key: 'occupancy', label: t('liveHq.occupancyLabel', 'Occupancy'), align: 'center' },
    { key: 'rent', label: t('liveHq.rentPerSqmLabel', 'Rent / m²/day'), align: 'center' },
    { key: 'net', label: t('liveHq.weeklyNetIncome', 'Weekly net'), align: 'right' },
    { key: 'roi', label: t('liveHq.annualRoiShort', 'Annual ROI'), align: 'right' },
    { key: 'value', label: t('liveHq.valueVsCost', 'Value vs Cost'), align: 'right' }
  ];

  const rows = ownedRealEstate.map(re => {
    const roi = annualRoi(re.weeklyNet, re.purchasePrice, daysPerYear);
    const occ = re.occupancyPct ?? null;
    const pos = marketPosition(re.pricePerSqm, re.marketRentPerSqm);
    const delta = marketDeltaPct(re.pricePerSqm, re.marketRentPerSqm);
    const gain = re.marketValue != null && re.marketValue > 0 && re.purchasePrice > 0 ? re.marketValue - re.purchasePrice : null;
    const gainPct = appreciationPct(re.marketValue, re.purchasePrice);
    const pendingDays = re.daysUntilUpdatingPricePerSqm ?? 0;
    const hasPending = pendingDays > 0 && re.pendingPricePerSqm != null;

    return [
      <div key="addr" className="min-w-0">
        <div className="font-semibold text-[var(--text-main)] truncate">{re.address}</div>
        {re.district ? (
          <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
            <MapPin className="w-2.5 h-2.5 text-[var(--text-subtle)] shrink-0" />
            <span className="truncate">{re.district}</span>
          </div>
        ) : null}
      </div>,
      <span key="type">{re.buildingTypeName || t('liveHq.propertyGeneric', 'Property')}</span>,
      <span key="size" className="font-mono">{re.totalSqm} m²</span>,
      occ != null ? (
        <div key="occ" className="flex flex-col items-center gap-1">
          <div className="w-16 h-1.5 rounded-full bg-[var(--bg-base)] overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, occ))}%`, background: occupancyColor(occ) }} />
          </div>
          <span className="font-mono text-[11px] text-[var(--text-main)]">{occ}%</span>
        </div>
      ) : (
        <span key="occ" className="text-[var(--text-subtle)]">-</span>
      ),
      <div key="rent" className="flex flex-col items-center gap-0.5">
        {re.pricePerSqm != null ? (
          <span className="font-mono text-[var(--text-main)]">${re.pricePerSqm.toLocaleString()}/m²</span>
        ) : (
          <span className="text-[var(--text-subtle)]">-</span>
        )}
        {pos && delta != null ? (
          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${MARKET_BADGE[pos]}`}>
            {pos === 'under' ? t('liveHq.rentUnderMarket', 'Below market') : pos === 'over' ? t('liveHq.rentOverMarket', 'Above market') : t('liveHq.rentAtMarket', 'At market')}
            {' '}{delta > 0 ? '+' : ''}{delta.toFixed(0)}%
          </span>
        ) : null}
        {hasPending ? (
          <span className="text-[9px] text-amber-600 dark:text-amber-400 whitespace-nowrap">
            {t('liveHq.rentChangePending', 'Rent to ${price}/m² in {days}d')
              .replace('{price}', re.pendingPricePerSqm!.toLocaleString())
              .replace('{days}', pendingDays.toString())}
          </span>
        ) : null}
      </div>,
      <span key="net" className={`font-mono font-semibold ${re.weeklyNet >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
        {re.weeklyNet >= 0 ? '+' : ''}${re.weeklyNet.toLocaleString()}/wk
      </span>,
      roi != null ? (
        <span key="roi" className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
          {roi.toFixed(1)}%
        </span>
      ) : (
        <span key="roi" className="text-[var(--text-subtle)]">-</span>
      ),
      gain != null ? (
        <div key="value" className="flex flex-col items-end gap-0.5">
          <span className={`font-mono font-semibold ${gain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
            {gain >= 0 ? '+' : '-'}${Math.abs(gain).toLocaleString()}
          </span>
          {gainPct != null ? (
            <span className="text-[10px] text-[var(--text-subtle)] font-mono">{gainPct >= 0 ? '+' : ''}{gainPct.toFixed(1)}%</span>
          ) : null}
        </div>
      ) : (
        <span key="value" className="text-[var(--text-subtle)]">-</span>
      )
    ];
  });

  return (
    <div className="space-y-2">
      <PropertyTable columns={columns} rows={rows} rowKey={i => ownedRealEstate[i].id} />
      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
        <TrendingUp className="w-3 h-3 text-[var(--text-subtle)]" />
        <span>{t('liveHq.roiAnnualizedNote', 'ROI annualized from weekly net income after taxes.')}</span>
      </div>
    </div>
  );
}
