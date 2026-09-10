'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { 
  Megaphone, 
  MapPin, 
  ChevronDown, 
  AlertCircle, 
  Building, 
  Check,
  Zap,
  RotateCcw,
  Store,
  Briefcase,
  Film,
  Users
} from 'lucide-react';

import { 
  MARKETING_CAMPAIGNS, 
  MARKETING_AGENCIES
} from '@/data/marketing';
import { 
  calculateCampaignReachPct,
  calculateMarketingEfficiency, 
  calculateTotalDailyCost, 
  findCheapest100PercentMix 
} from '@/lib/engine';
import { useTranslation } from '@/context/LanguageContext';

const BUSINESS_CATEGORIES: { id: 'retail' | 'office' | 'entertainment'; label: string; icon: any; marketingReachMultiplier: number }[] = [
  { id: 'retail', label: 'Retail Stores', icon: Store, marketingReachMultiplier: 1.0 },
  { id: 'office', label: 'Offices & Agencies', icon: Briefcase, marketingReachMultiplier: 1.0 },
  { id: 'entertainment', label: 'Cinemas & Theaters', icon: Film, marketingReachMultiplier: 2.0 },
];

// Real building sizes per category, sourced from the game's BuildingSizeData registry.
const SIZE_PRESETS: Record<'retail' | 'office' | 'entertainment', { sqm: number }[]> = {
  retail: [
    { sqm: 75 },
    { sqm: 225 },
    { sqm: 285 },
    { sqm: 1000 },
  ],
  office: [
    { sqm: 75 },
    { sqm: 225 },
    { sqm: 285 },
    { sqm: 660 },
  ],
  entertainment: [
    { sqm: 2000 },
  ],
};

function MarketingContent() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<'retail' | 'office' | 'entertainment'>('retail');
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number>(0);

  const currentMultiplier = BUSINESS_CATEGORIES.find(c => c.id === selectedCategory)?.marketingReachMultiplier ?? 1.0;

  // When switching category, ensure valid size & re-run auto-solver
  const handleCategoryChange = (cat: 'retail' | 'office' | 'entertainment') => {
    setSelectedCategory(cat);
    setSelectedSizeIndex(0);
    const targetSqm = SIZE_PRESETS[cat][0].sqm;
    const best = findCheapest100PercentMix(targetSqm, BUSINESS_CATEGORIES.find(c => c.id === cat)?.marketingReachMultiplier ?? 1.0);
    setSelectedCampaigns(best);
  };

  const currentSizeOption = SIZE_PRESETS[selectedCategory][selectedSizeIndex] || SIZE_PRESETS[selectedCategory][0];
  const activeSqm = currentSizeOption.sqm;

  // Active campaign IDs
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>(() => {
    return findCheapest100PercentMix(75);
  });

  // Re-calculate optimal whenever store size changes
  const applyOptimal = () => {
    const best = findCheapest100PercentMix(activeSqm, currentMultiplier);
    setSelectedCampaigns(best);
  };

  const toggleCampaign = (id: string) => {
    if (selectedCampaigns.includes(id)) {
      setSelectedCampaigns(selectedCampaigns.filter(c => c !== id));
    } else {
      setSelectedCampaigns([...selectedCampaigns, id]);
    }
  };

  // Real-time metrics
  const totalDailyCost = useMemo(() => {
    return calculateTotalDailyCost(selectedCampaigns);
  }, [selectedCampaigns]);

  const totalSqmReach = useMemo(() => {
    return selectedCampaigns.reduce((sum, id) => {
      const c = MARKETING_CAMPAIGNS.find(item => item.id === id);
      return sum + (c ? c.sqmReach : 0);
    }, 0);
  }, [selectedCampaigns]);

  const marketingEfficiencyPct = useMemo(() => {
    return calculateMarketingEfficiency(selectedCampaigns, activeSqm, currentMultiplier);
  }, [selectedCampaigns, activeSqm, currentMultiplier]);

  const rawEfficiencyPct = useMemo(() => {
    return calculateCampaignReachPct(totalSqmReach, activeSqm, currentMultiplier);
  }, [totalSqmReach, activeSqm, currentMultiplier]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const categoryLabels: Record<string, string> = {
    retail: t('marketing.retailStores', 'Retail Stores'),
    office: t('marketing.officesAgencies', 'Offices & Agencies'),
    entertainment: t('marketing.cinemasTheaters', 'Cinemas & Theaters')
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-indigo-500" />
          <span>{t('marketing.title', 'Marketing Calculator')}</span>
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {t('marketing.subtitle', 'Select your business type and building size to calculate the exact daily campaign mix for 100% marketing efficiency.')}
        </p>
      </div>

      {/* STEP 1: Business Category & Size Setup */}
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl self-start">
          {BUSINESS_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{categoryLabels[cat.id] || cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Store Size / Customer Capacity Selector Chips */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-[var(--text-subtle)] uppercase tracking-wider block">
            {t('marketing.selectSize', 'Select Building Size (Area):')}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {SIZE_PRESETS[selectedCategory].map((opt, idx) => {
              const isSelected = selectedSizeIndex === idx;

              return (
                <button
                  key={opt.sqm}
                  type="button"
                  onClick={() => {
                    setSelectedSizeIndex(idx);
                    const best = findCheapest100PercentMix(opt.sqm, currentMultiplier);
                    setSelectedCampaigns(best);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-bold'
                      : 'bg-[var(--bg-base)] border border-[var(--border-base)] hover:border-indigo-500 text-[var(--text-main)]'
                  }`}
                >
                  <div className="text-sm font-bold font-mono">
                    {opt.sqm.toLocaleString()} {t('common.sqm', 'm²')}
                  </div>
                  <div className={`text-[11px] font-mono mt-0.5 ${isSelected ? 'text-white/80' : 'text-[var(--text-subtle)]'}`}>
                    {t('marketing.buildingArea', 'Building Area')}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* STEP 2: Real-Time Results & Campaign Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recommended Checklist & Toggles (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border-base)] pb-3">
              <div>
                <h3 className="font-bold text-xs text-[var(--text-main)]">{t('marketing.campaigns', 'Marketing Campaigns')}</h3>
                <p className="text-[11px] text-[var(--text-subtle)]">
                  {t('marketing.campaignsDesc', 'Toggle campaigns to customize or click auto-solve to reach 100% with the lowest daily cost.')}
                </p>
              </div>
              <button
                type="button"
                onClick={applyOptimal}
                className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{t('marketing.autoFill', 'Auto-Fill 100%')}</span>
              </button>
            </div>

            {/* Campaign Checklist */}
            <div className="space-y-2">
              {MARKETING_CAMPAIGNS.map((camp) => {
                const isSelected = selectedCampaigns.includes(camp.id);
                const reachForStore = calculateCampaignReachPct(camp.sqmReach, activeSqm, currentMultiplier);

                return (
                  <div
                    key={camp.id}
                    onClick={() => toggleCampaign(camp.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-indigo-500/10 border-indigo-500/40'
                        : 'bg-[var(--bg-base)] border-[var(--border-base)] hover:border-indigo-500/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected 
                          ? 'bg-indigo-600 border-indigo-600 text-white' 
                          : 'border-[var(--border-base)] bg-[var(--bg-surface)]'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-[var(--text-main)]">{camp.name}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                            camp.category === 'Internet'
                              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                              : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                          }`}>
                            {camp.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--text-subtle)] font-mono">
                          {camp.availableAt.join(' & ')} • Reach: {camp.sqmReach} m²
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(camp.pricePerDay)} <span className="text-[10px] text-[var(--text-subtle)] font-normal">/day</span>
                      </div>
                      <div className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                        +{reachForStore}% Reach
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Score Summary & Agency Info (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Summary Card */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-4">
            <div className="font-bold text-xs text-[var(--text-main)] border-b border-[var(--border-base)] pb-3">
              {t('marketing.expenseBreakdown', 'Daily Expense & Efficiency Breakdown')}
            </div>

            {/* Metrics List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-subtle)]">{t('marketing.dailyCost', 'Daily Marketing Cost:')}</span>
                <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalDailyCost)} <span className="text-[10px] text-[var(--text-subtle)] font-normal">{t('marketing.perDay', '/day')}</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-subtle)]">{t('marketing.storeAreaNeeded', 'Store Area Needed:')}</span>
                <span className="text-xs font-bold font-mono text-[var(--text-main)]">
                  {totalSqmReach * currentMultiplier} {t('common.sqm', 'm²')} / {activeSqm} {t('common.sqm', 'm²')}
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-subtle)]">{t('marketing.marketingEfficiency', 'Marketing Efficiency:')}</span>
                  <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400">{marketingEfficiencyPct}%</span>
                </div>
                <div className="h-2.5 w-full bg-[var(--bg-base)] rounded-full overflow-hidden border border-[var(--border-base)]">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      marketingEfficiencyPct >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(100, marketingEfficiencyPct)}%` }}
                  />
                </div>
                {rawEfficiencyPct > 100 && (
                  <div className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-mono pt-0.5">
                    <AlertCircle className="w-3 h-3" />
                    <span>{rawEfficiencyPct - 100}% {t('marketing.capped100', 'wasted overflow (capped at 100%)')}</span>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-subtle)]">{t('marketing.campaignStrategy', 'Campaign Strategy:')}</span>
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {marketingEfficiencyPct >= 100 ? 'Optimal (100% Saturation)' : 'Partial Coverage'}
                  </span>
                </div>
                <div className="text-[10px] text-[var(--text-subtle)]">
                  All campaign expenses are 100% tax deductible.
                </div>
              </div>
            </div>
          </div>

          {/* Marketing Agencies Directory */}
          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-2">
            <div className="font-bold text-xs text-[var(--text-main)] flex items-center gap-1.5 border-b border-[var(--border-base)] pb-2">
              <Building className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t('marketing.agencyLocations', 'Agency Locations')}</span>
            </div>
            <div className="space-y-2 text-xs">
              {MARKETING_AGENCIES.map(agency => (
                <div key={agency.name} className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
                  <div className="font-bold text-[var(--text-main)] flex items-center justify-between">
                    <span>{agency.name}</span>
                    <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      Tax Deductible
                    </span>
                  </div>
                  <div className="text-[10px] text-[var(--text-subtle)] font-mono mt-0.5">
                    {agency.district} • {agency.address}
                  </div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-1">
                    {agency.offerings}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MarketingPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--text-muted)]">{t('marketing.loading', 'Loading marketing calculator...')}</div>}>
      <MarketingContent />
    </Suspense>
  );
}
