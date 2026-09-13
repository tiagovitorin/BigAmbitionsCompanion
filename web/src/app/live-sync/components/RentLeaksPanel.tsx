'use client';

import { TriangleAlert, MapPin } from 'lucide-react';
import type { LiveEmptyLeasedSpaceData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import PropertyTable, { PropertyTableColumn } from './PropertyTable';

interface RentLeaksPanelProps {
  leaks: LiveEmptyLeasedSpaceData[];
}

export default function RentLeaksPanel({ leaks }: RentLeaksPanelProps) {
  const { t } = useTranslation();

  const totalWeekly = leaks.reduce((acc, l) => acc + (l.rentPerWeek ?? Math.round((l.rentPerDay || 0) * 7)), 0);
  const totalDaily = leaks.reduce((acc, l) => acc + (l.rentPerDay || 0), 0);

  const columns: PropertyTableColumn[] = [
    { key: 'address', label: t('liveHq.propertyAddress', 'Property Address') },
    { key: 'type', label: t('liveHq.typeClassification', 'Type') },
    { key: 'size', label: t('liveHq.dimensions', 'Size'), align: 'center' },
    { key: 'since', label: t('liveHq.sinceLabel', 'Since'), align: 'center' },
    { key: 'rent', label: t('liveHq.weeklyRentLabel', 'Weekly rent'), align: 'right' }
  ];

  const rows = leaks.map(l => {
    const weekly = l.rentPerWeek ?? Math.round((l.rentPerDay || 0) * 7);
    return [
      <div key="addr" className="min-w-0">
        <div className="font-semibold text-[var(--text-main)] truncate">{l.address}</div>
        {l.district ? (
          <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
            <MapPin className="w-2.5 h-2.5 text-[var(--text-subtle)] shrink-0" />
            <span className="truncate">{l.district}</span>
          </div>
        ) : null}
      </div>,
      <span key="type" className="capitalize">{l.type || '-'}</span>,
      <span key="size" className="font-mono">{l.sqm ? `${l.sqm} m²` : '-'}</span>,
      <span key="since" className="font-mono">{l.sinceDay ?? '-'}</span>,
      <span key="rent" className="font-mono text-rose-500 font-bold">-${weekly.toLocaleString()}/wk</span>
    ];
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/25">
        <div className="flex items-start gap-3 min-w-0">
          <TriangleAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            {t('liveHq.rentLeaksDesc', 'You are leasing these commercial spaces but no business runs in them. The game still charges rent every day, so they drain cash you may not notice elsewhere.')}
          </p>
        </div>
        <div className="flex items-center gap-4 shrink-0 text-[11px]">
          <div className="text-right">
            <div className="text-[var(--text-subtle)]">{t('liveHq.wastedRentPerDay', 'Wasted rent')}</div>
            <strong className="font-mono text-rose-500 text-sm">${totalDaily.toLocaleString()}/day</strong>
          </div>
          <div className="text-right">
            <div className="text-[var(--text-subtle)]">{t('liveHq.wastedRentPerWeek', 'per week')}</div>
            <strong className="font-mono text-rose-500 text-sm">${totalWeekly.toLocaleString()}/wk</strong>
          </div>
        </div>
      </div>

      <PropertyTable columns={columns} rows={rows} rowKey={i => leaks[i].id} accent="rose" />

      <div className="text-[11px] text-[var(--text-muted)]">
        {t('liveHq.rentLeaksHint', 'Locate each address on the city map and break the lease in-game to stop the drain.')}
      </div>
    </div>
  );
}
