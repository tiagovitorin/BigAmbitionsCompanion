'use client';

import { MapPin } from 'lucide-react';
import type { LiveResidenceData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import PropertyTable, { PropertyTableColumn } from './PropertyTable';

interface PrivateResidencesPanelProps {
  residences: LiveResidenceData[];
}

export default function PrivateResidencesPanel({ residences }: PrivateResidencesPanelProps) {
  const { t } = useTranslation();

  const columns: PropertyTableColumn[] = [
    { key: 'address', label: t('liveHq.propertyAddress', 'Property Address') },
    { key: 'type', label: t('liveHq.typeClassification', 'Type') },
    { key: 'size', label: t('liveHq.dimensions', 'Size'), align: 'center' },
    { key: 'status', label: t('liveHq.statusLabel', 'Status'), align: 'center' },
    { key: 'since', label: t('liveHq.sinceLabel', 'Since'), align: 'center' },
    { key: 'cost', label: t('liveHq.weeklyRentLabel', 'Weekly rent'), align: 'right' }
  ];

  const rows = residences.map(r => {
    const isOwned = !!r.isOwned;
    const weeklyRent = r.rentPerWeek ?? Math.round((r.rentPerDay || 0) * 7);
    return [
      <div key="addr" className="min-w-0">
        <div className="font-semibold text-[var(--text-main)] truncate">{r.address}</div>
        {r.district ? (
          <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
            <MapPin className="w-2.5 h-2.5 text-[var(--text-subtle)] shrink-0" />
            <span className="truncate">{r.district}</span>
          </div>
        ) : null}
      </div>,
      <span key="type" className="capitalize">{r.type || '-'}</span>,
      <span key="size" className="font-mono">{r.sqm ? `${r.sqm} m²` : '-'}</span>,
      <span
        key="status"
        className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full border ${
          isOwned
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
            : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
        }`}
      >
        {isOwned ? t('liveHq.ownedChip', 'Owned') : t('liveHq.rentedChip', 'Rented')}
      </span>,
      <span key="since" className="font-mono">{r.sinceDay ?? '-'}</span>,
      isOwned ? (
        <span key="cost" className="text-emerald-600 dark:text-emerald-400 font-semibold">
          {t('liveHq.ownedNoRent', 'Owned - no rent')}
        </span>
      ) : (
        <span key="cost" className="font-mono text-rose-500 font-bold">-${weeklyRent.toLocaleString()}/wk</span>
      )
    ];
  });

  return <PropertyTable columns={columns} rows={rows} rowKey={i => residences[i].id} />;
}
