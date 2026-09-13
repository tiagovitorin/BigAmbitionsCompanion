'use client';

import { House, Building, TriangleAlert, Tag, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type {
  LiveResidenceData,
  LiveOwnedRealEstateData,
  LiveEmptyLeasedSpaceData,
  LiveBuildingForSaleData
} from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import LiveSection from './LiveSection';
import StatCard from './StatCard';
import InsufficientData from './InsufficientData';
import PrivateResidencesPanel from './PrivateResidencesPanel';
import OwnedInvestmentsPanel from './OwnedInvestmentsPanel';
import RentLeaksPanel from './RentLeaksPanel';
import MarketWatchPanel from './MarketWatchPanel';

interface ResidencesViewProps {
  residences: LiveResidenceData[];
  ownedRealEstate: LiveOwnedRealEstateData[];
  emptyLeasedSpaces: LiveEmptyLeasedSpaceData[];
  buildingsForSale?: LiveBuildingForSaleData[];
  daysPerYear: number;
}

function EmptyNote({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-dashed border-[var(--border-base)] shadow-xs text-center">
      <Icon className="w-5 h-5 text-[var(--text-subtle)] mx-auto mb-2" />
      <p className="text-xs text-[var(--text-muted)]">{text}</p>
    </div>
  );
}

export default function ResidencesView({ residences, ownedRealEstate, emptyLeasedSpaces, buildingsForSale = [], daysPerYear }: ResidencesViewProps) {
  const { t } = useTranslation();

  const rentedResidences = residences.filter(r => !r.isOwned);
  const ownedResidences = residences.filter(r => r.isOwned);
  const weeklyHousing = rentedResidences.reduce((acc, r) => acc + (r.rentPerWeek ?? Math.round((r.rentPerDay || 0) * 7)), 0);

  const portfolioCost = ownedRealEstate.reduce((acc, re) => acc + (re.purchasePrice || 0), 0);
  const valued = ownedRealEstate.filter(re => (re.marketValue ?? 0) > 0);
  const marketValueSum = valued.reduce((acc, re) => acc + (re.marketValue || 0), 0);
  const valuedCost = valued.reduce((acc, re) => acc + (re.purchasePrice || 0), 0);
  const unrealizedGain = valued.length > 0 ? marketValueSum - valuedCost : null;
  const unrealizedPct = unrealizedGain != null && valuedCost > 0 ? (unrealizedGain / valuedCost) * 100 : null;
  const portfolioWeeklyNet = ownedRealEstate.reduce((acc, re) => acc + (re.weeklyNet || 0), 0);

  const leaks = emptyLeasedSpaces || [];
  const leaksWeekly = leaks.reduce((acc, l) => acc + (l.rentPerWeek ?? Math.round((l.rentPerDay || 0) * 7)), 0);

  return (
    <div className="space-y-10">
      {/* REAL ESTATE NET WORTH STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          label={t('liveHq.portfolioValue', 'Portfolio Value')}
          value={valued.length > 0 ? `$${marketValueSum.toLocaleString()}` : '-'}
          sub={valued.length > 0 ? t('liveHq.marketValueNote', 'Current market value') : <InsufficientData reason={t('liveHq.insufficientMarketValue', 'No property market value recorded yet - restart the game so the mod can stream it.')} />}
          icon={Building}
        />
        <StatCard
          label={t('liveHq.costBasis', 'Cost Basis')}
          value={`$${portfolioCost.toLocaleString()}`}
          sub={`${ownedRealEstate.length} ${t('liveHq.propertiesWord', 'properties')}`}
          icon={Wallet}
        />
        <StatCard
          label={t('liveHq.unrealizedGain', 'Unrealized Gain')}
          value={unrealizedGain != null ? `${unrealizedGain >= 0 ? '+' : '-'}$${Math.abs(unrealizedGain).toLocaleString()}` : '-'}
          sub={unrealizedPct != null ? `${unrealizedPct >= 0 ? '+' : ''}${unrealizedPct.toFixed(1)}%` : <InsufficientData reason={t('liveHq.insufficientMarketValue', 'No property market value recorded yet - restart the game so the mod can stream it.')} />}
          icon={unrealizedGain != null && unrealizedGain < 0 ? TrendingDown : TrendingUp}
          tone={unrealizedGain == null ? 'main' : unrealizedGain >= 0 ? 'up' : 'down'}
        />
        <StatCard
          label={t('liveHq.weeklyNetRent', 'Weekly Net Rent')}
          value={`${portfolioWeeklyNet >= 0 ? '+' : ''}$${portfolioWeeklyNet.toLocaleString()}`}
          sub={t('liveHq.perWeekShort', 'per week')}
          icon={TrendingUp}
          tone={portfolioWeeklyNet >= 0 ? 'up' : 'down'}
        />
        <StatCard
          label={t('liveHq.housingCost', 'Housing Cost')}
          value={weeklyHousing > 0 ? `-$${weeklyHousing.toLocaleString()}` : '$0'}
          sub={`${rentedResidences.length} ${t('liveHq.rentedChip', 'Rented')} / ${ownedResidences.length} ${t('liveHq.ownedChip', 'Owned')}`}
          icon={House}
          tone={weeklyHousing > 0 ? 'down' : 'main'}
        />
        <StatCard
          label={t('liveHq.rentLeaksShort', 'Rent Leaks')}
          value={leaksWeekly > 0 ? `-$${leaksWeekly.toLocaleString()}` : '$0'}
          sub={`${leaks.length} ${t('liveHq.emptySpacesWord', 'empty spaces')}`}
          icon={TriangleAlert}
          tone={leaksWeekly > 0 ? 'down' : 'main'}
        />
      </div>

      {/* PERSONAL HOME */}
      <LiveSection id="property-residences" title={t('liveHq.privateResidences', 'Private Residences')} icon={House}>
        {residences.length > 0
          ? <PrivateResidencesPanel residences={residences} />
          : <EmptyNote icon={House} text={t('liveHq.noResidences', 'No private residences detected yet. Rent an apartment or buy a home in-game and it will appear here.')} />}
      </LiveSection>

      {/* RENTAL PORTFOLIO */}
      <LiveSection id="property-investments" title={t('liveHq.ownedInvestments', 'Owned Investment Properties')} icon={Building}>
        {ownedRealEstate.length > 0
          ? <OwnedInvestmentsPanel ownedRealEstate={ownedRealEstate} daysPerYear={daysPerYear} />
          : <EmptyNote icon={Building} text={t('liveHq.noOwnedProperties', 'No investment properties owned yet. Buy a building in-game and it will appear here.')} />}
      </LiveSection>

      {/* VACANT LEASES */}
      <LiveSection id="property-leases" title={t('liveHq.rentLeaks', 'Unused Leased Spaces')} icon={TriangleAlert}>
        {leaks.length > 0
          ? <RentLeaksPanel leaks={leaks} />
          : <EmptyNote icon={TriangleAlert} text={t('liveHq.noRentLeaks', 'No unused leased spaces. Every space you rent is running a business, so no rent is going to waste.')} />}
      </LiveSection>

      {/* MARKET WATCH */}
      <LiveSection id="property-market" title={t('liveHq.marketWatch', 'Market Watch')} icon={Tag}>
        <MarketWatchPanel buildingsForSale={buildingsForSale} ownedRealEstate={ownedRealEstate} />
      </LiveSection>
    </div>
  );
}
