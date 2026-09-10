'use client';

import { useMemo } from 'react';
import { MapPin, Users, Building, TrendingUp, Car, Percent } from 'lucide-react';

import rawNeighborhoods from '@/data/neighborhoods.json';
import { useTranslation } from '@/context/LanguageContext';

// Social-class price indices mirror the game formula (CitizenHelper.Init)
const PRICE_INDICES = { working: 1.2, middle: 1.4, upper: 1.7 };

interface DistrictCard {
  id: string;
  name: string;
  workingPct: number;
  middlePct: number;
  upperPct: number;
  realEstateMultiplier: number;
  parkingPrice: number;
  trafficDensityPct: number;
  baseBuildingPriceSqm: number;
  marketingStrength: number;
  averagePriceIndex: number;
}

export default function DistrictsPage() {
  const { t } = useTranslation();

  const districts = useMemo<DistrictCard[]>(() => {
    return (rawNeighborhoods as any[])
      .filter((n) => n.id !== 'global')
      .map((n) => {
        const workingPct = n.demographics.working_class_pct;
        const middlePct = n.demographics.middle_class_pct;
        const upperPct = n.demographics.upper_class_pct;
        const total = workingPct + middlePct + upperPct;
        const averagePriceIndex = total > 0
          ? (PRICE_INDICES.working * workingPct + PRICE_INDICES.middle * middlePct + PRICE_INDICES.upper * upperPct) / total
          : 1.0;
        return {
          id: n.id,
          name: n.name,
          workingPct,
          middlePct,
          upperPct,
          realEstateMultiplier: n.economic_factors.real_estate_multiplier,
          parkingPrice: n.economic_factors.parking_price,
          trafficDensityPct: n.economic_factors.vehicle_traffic_density_pct,
          baseBuildingPriceSqm: n.economic_factors.base_building_price_sqm,
          marketingStrength: n.economic_factors.marketing_strength,
          averagePriceIndex,
        };
      })
      .sort((a, b) => b.averagePriceIndex - a.averagePriceIndex);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
          <MapPin className="w-5 h-5 text-sky-500" />
          <span>{t('districts.title', 'District Atlas')}</span>
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {t('districts.subtitle', 'Social-class demographics, real estate multipliers, and price-index baselines for every NYC district.')}
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm text-xs text-[var(--text-muted)] space-y-1">
        <div className="flex items-center gap-2 font-semibold text-[var(--text-main)]">
          <Percent className="w-4 h-4 text-sky-500" />
          <span>{t('districts.priceIndexHeader', 'Price Index Baselines')}</span>
        </div>
        <p>
          {t('districts.priceIndexBody', 'Each social class tolerates a different price ceiling: Working 1.20x, Middle 1.40x, Upper 1.70x the base market price. A district average price index is the share-weighted mean of these.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {districts.map((d) => (
          <div key={d.id} className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[var(--text-main)]">{d.name}</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400">
                {t('districts.priceIndex', '{value}x Index').replace('{value}', d.averagePriceIndex.toFixed(2))}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <div className="flex items-center gap-1.5 text-[var(--text-subtle)]">
                  <Users className="w-3.5 h-3.5" />
                  <span>{t('districts.demographics', 'Social Classes')}</span>
                </div>
                <div className="flex gap-2 mt-1.5">
                  <span className="flex-1 p-1.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-center">
                    <span className="block text-[10px] text-[var(--text-subtle)]">{t('districts.workingClass', 'Working')}</span>
                    <span className="font-mono font-bold text-[var(--text-main)]">{d.workingPct}%</span>
                  </span>
                  <span className="flex-1 p-1.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-center">
                    <span className="block text-[10px] text-[var(--text-subtle)]">{t('districts.middleClass', 'Middle')}</span>
                    <span className="font-mono font-bold text-[var(--text-main)]">{d.middlePct}%</span>
                  </span>
                  <span className="flex-1 p-1.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-center">
                    <span className="block text-[10px] text-[var(--text-subtle)]">{t('districts.upperClass', 'Upper')}</span>
                    <span className="font-mono font-bold text-[var(--text-main)]">{d.upperPct}%</span>
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-1.5 border-t border-[var(--border-subtle)]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[var(--text-subtle)]">
                    <Building className="w-3.5 h-3.5" />
                    {t('districts.realEstateMultiplier', 'Real Estate Multiplier')}
                  </span>
                  <span className="font-mono font-bold text-[var(--text-main)]">{d.realEstateMultiplier.toFixed(2)}x</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[var(--text-subtle)]">
                    <TrendingUp className="w-3.5 h-3.5" />
                    {t('districts.basePriceSqm', 'Base Price / m²')}
                  </span>
                  <span className="font-mono font-semibold text-[var(--text-main)]">${d.baseBuildingPriceSqm.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[var(--text-subtle)]">
                    <Car className="w-3.5 h-3.5" />
                    {t('districts.trafficDensity', 'Vehicle Traffic')}
                  </span>
                  <span className="font-mono font-semibold text-[var(--text-main)]">{d.trafficDensityPct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-subtle)]">{t('districts.parkingPrice', 'Parking / hr')}</span>
                  <span className="font-mono font-semibold text-[var(--text-main)]">
                    {d.parkingPrice > 0 ? `$${d.parkingPrice.toFixed(2)}` : t('districts.free', 'Free')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
