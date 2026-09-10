'use client';

import { Home, TrendingDown, Building, AlertTriangle } from 'lucide-react';
import type { LiveResidenceData, LiveOwnedRealEstateData, LiveEmptyLeasedSpaceData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import PrivateResidencesPanel from './PrivateResidencesPanel';
import OwnedInvestmentsPanel from './OwnedInvestmentsPanel';
import RentLeaksPanel from './RentLeaksPanel';

interface ResidencesViewProps {
  residences: LiveResidenceData[];
  ownedRealEstate: LiveOwnedRealEstateData[];
  emptyLeasedSpaces: LiveEmptyLeasedSpaceData[];
  daysPerYear: number;
}

export default function ResidencesView({ residences, ownedRealEstate, emptyLeasedSpaces, daysPerYear }: ResidencesViewProps) {
  const { t } = useTranslation();

  const weeklyRent = residences
    .filter(r => !r.isOwned)
    .reduce((acc, r) => acc + (r.rentPerWeek ?? Math.round((r.rentPerDay || 0) * 7)), 0);
  const rentedCount = residences.filter(r => !r.isOwned).length;
  const ownedCount = residences.filter(r => r.isOwned).length;

  const investedValue = (ownedRealEstate || []).reduce((acc, re) => acc + (re.purchasePrice || 0), 0);
  const ownedNetWeekly = (ownedRealEstate || []).reduce((acc, re) => acc + (re.weeklyNet || 0), 0);

  const leaks = emptyLeasedSpaces || [];
  const leaksWeekly = leaks.reduce((acc, l) => acc + (l.rentPerWeek ?? Math.round((l.rentPerDay || 0) * 7)), 0);

  return (
    <div className="space-y-6">
      {/* 1. PROPERTY OVERVIEW RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.privateResidences', 'Private Residences')}</span>
            <Home className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-[var(--text-main)]">{residences.length}</div>
          <div className="text-[11px] text-[var(--text-muted)]">
            {rentedCount > 0 && `${rentedCount} ${t('liveHq.rentedChip', 'Rented')}`}
            {rentedCount > 0 && ownedCount > 0 && ' / '}
            {ownedCount > 0 && `${ownedCount} ${t('liveHq.ownedChip', 'Owned')}`}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.housingLeaseCost', 'Housing Lease Cost')}</span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-500">
            -${weeklyRent.toLocaleString()}<span className="text-xs font-normal text-[var(--text-subtle)]">/wk</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">{t('liveHq.leasedResidencesOnly', 'Leased residences only')}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.ownedPortfolioValue', 'Owned Portfolio')}</span>
            <Building className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-[var(--text-main)]">
            ${investedValue.toLocaleString()}
          </div>
          <div className={`text-[11px] flex items-center justify-between ${ownedNetWeekly >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
            <span>{t('liveHq.weeklyNetIncome', 'Weekly net')}</span>
            <strong className="font-mono">{ownedNetWeekly >= 0 ? '+' : ''}${ownedNetWeekly.toLocaleString()}/wk</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.rentLeaks', 'Unused Leases')}</span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className={`text-xl font-bold font-mono ${leaksWeekly > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            {leaksWeekly > 0 ? `-$${leaksWeekly.toLocaleString()}` : '$0'}
            <span className="text-xs font-normal text-[var(--text-subtle)]">/wk</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)]">
            {leaks.length} {t('liveHq.emptySpacesWord', 'empty spaces')}
          </div>
        </div>
      </div>

      {/* 2. PRIVATE RESIDENCES */}
      <PrivateResidencesPanel residences={residences} />

      {/* 3. OWNED INVESTMENT PORTFOLIO */}
      {(ownedRealEstate || []).length > 0 && (
        <OwnedInvestmentsPanel ownedRealEstate={ownedRealEstate || []} daysPerYear={daysPerYear} />
      )}

      {/* 4. UNUSED LEASED SPACES (RENT LEAKS) */}
      <RentLeaksPanel leaks={leaks} />
    </div>
  );
}
