'use client';

import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Building, 
  Search, 
  MapPin, 
  Footprints, 
  ArrowUpDown, 
  X, 
  ChevronDown, 
  ArrowRight, 
  Car, 
  Users, 
  Maximize2, 
  DollarSign, 
  SlidersHorizontal,
  LayoutGrid,
  Briefcase,
  Boxes,
  Home,
  Sparkles,
  Store,
  Compass,
  Loader2
} from 'lucide-react';

import rawBuildings from '@/data/buildings.json';
import rawNeighborhoods from '@/data/neighborhoods.json';

type PropertyTypeTab = 'all' | 'retail' | 'office' | 'warehouse' | 'residential' | 'special';
type SortField = 'rent_asc' | 'rent_desc' | 'price_asc' | 'price_desc' | 'size_desc' | 'size_asc' | 'traffic_desc';
type SizeBracket = 'all' | 'small' | 'medium' | 'large' | 'massive';
type ParkingFilter = 'all' | 'parking_only' | 'no_parking';

function fmtMoney(n: number) {
  if (n >= 1_000_000_000) return '$' + (n / 1_000_000_000).toFixed(2) + 'B';
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K';
  return '$' + Math.round(n).toLocaleString();
}

function getBuildingMetadata(b: any) {
  return {
    code: b.building_code || b.building_size?.replace('ba:buildingsize_', '').toUpperCase() || 'A1',
    hasParking: !!b.has_parking
  };
}

// Calculate exact in-game customer capacity / office workstation capacity:
// Theaters: 150, 175, 200
// Cinemas: 100, 125, 150
// Retail Storefronts: 15 (≤75m²), 30 (150m²), 40 (285m²), 75 (750m²+)
// Offices: 4 (75m²), 8 (225m²), 10 (285m²), 50 (660m²+)
function getCustomerCapacity(b: any): number {
  if (b.building_type === 'theater') {
    if (b.building_code === 'R1') return 200;
    if (b.building_code === 'R2') return 175;
    return 150;
  }
  if (b.building_type === 'cinema') {
    if (b.building_code === 'S1') return 150;
    if (b.building_code === 'S2') return 125;
    return 100;
  }
  if (b.building_type === 'office') {
    if (b.square_meters >= 660) return 50;
    if (b.square_meters >= 285) return 10;
    if (b.square_meters >= 225) return 8;
    return 4;
  }
  if (b.square_meters >= 750) return 75;
  if (b.square_meters >= 285) return 40;
  if (b.square_meters >= 150) return 30;
  return 15;
}

function RealEstateContent() {
  const searchParams = useSearchParams();
  const urlType = (searchParams.get('type') as PropertyTypeTab) || 'all';

  const [activeType, setActiveType] = useState<PropertyTypeTab>(urlType);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All');
  const [sizeBracket, setSizeBracket] = useState<SizeBracket>('all');
  const [parkingFilter, setParkingFilter] = useState<ParkingFilter>('all');
  const [search, setSearch] = useState<string>('');
  const [sortOption, setSortOption] = useState<SortField>('rent_asc');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZE = 36;

  // Infinite scroll observer target
  const observerTarget = useRef<HTMLDivElement>(null);

  // Sync URL type change
  useEffect(() => {
    const t = (searchParams.get('type') as PropertyTypeTab) || 'all';
    setActiveType(t);
    setPage(1);
  }, [searchParams]);

  // Reset pagination on filter changes
  useEffect(() => {
    setPage(1);
  }, [activeType, selectedDistrict, sizeBracket, parkingFilter, search, sortOption]);

  const typeHeaderConfig: Record<PropertyTypeTab, { title: string; subtitle: string; icon: any; color: string }> = {
    all: {
      title: 'Real Estate & Properties',
      subtitle: 'Complete registry of all 885 properties across NYC districts.',
      icon: Building,
      color: 'text-sky-500'
    },
    retail: {
      title: 'Retail Storefronts',
      subtitle: 'High foot-traffic retail locations for stores and restaurants.',
      icon: Store,
      color: 'text-amber-500'
    },
    office: {
      title: 'Commercial Offices',
      subtitle: 'Professional spaces for law firms, marketing, agencies, and HQ.',
      icon: Briefcase,
      color: 'text-indigo-500'
    },
    warehouse: {
      title: 'Warehouses & Logistics',
      subtitle: 'Storage facilities for distribution trucks and inventory supply.',
      icon: Boxes,
      color: 'text-sky-500'
    },
    residential: {
      title: 'Residential Properties',
      subtitle: 'Apartments and residences across New York City.',
      icon: Home,
      color: 'text-emerald-500'
    },
    special: {
      title: 'Specialty Venues',
      subtitle: 'Cinemas, theaters, and unique city attractions.',
      icon: Sparkles,
      color: 'text-purple-500'
    }
  };

  const currentHeader = typeHeaderConfig[activeType] || typeHeaderConfig.all;
  const HeaderIcon = currentHeader.icon;

  // Filtered properties
  const filtered = useMemo(() => {
    let list = [...rawBuildings];

    // Filter by active property type category
    if (activeType !== 'all') {
      if (activeType === 'special') {
        list = list.filter(b => b.building_type === 'special' || b.building_type === 'theater' || b.building_type === 'cinema');
      } else {
        list = list.filter(b => b.building_type === activeType);
      }
    }

    // Filter by district
    if (selectedDistrict !== 'All') {
      list = list.filter(b => b.neighborhood_name === selectedDistrict);
    }

    // Filter by size bracket
    if (sizeBracket === 'small') {
      list = list.filter(b => b.square_meters <= 75);
    } else if (sizeBracket === 'medium') {
      list = list.filter(b => b.square_meters > 75 && b.square_meters <= 200);
    } else if (sizeBracket === 'large') {
      list = list.filter(b => b.square_meters > 200 && b.square_meters <= 750);
    } else if (sizeBracket === 'massive') {
      list = list.filter(b => b.square_meters > 750);
    }

    // Filter by Parking
    if (parkingFilter === 'parking_only') {
      list = list.filter(b => getBuildingMetadata(b).hasParking);
    } else if (parkingFilter === 'no_parking') {
      list = list.filter(b => !getBuildingMetadata(b).hasParking);
    }

    // Filter by search text
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(b => {
        const meta = getBuildingMetadata(b);
        return (
          b.address.toLowerCase().includes(q) || 
          b.neighborhood_name.toLowerCase().includes(q) ||
          b.building_type.toLowerCase().includes(q) ||
          meta.code.toLowerCase().includes(q)
        );
      });
    }

    // Sort
    const sorted = [...list];
    if (sortOption === 'rent_asc') {
      sorted.sort((a, b) => (a.estimated_daily_rent || 0) - (b.estimated_daily_rent || 0));
    } else if (sortOption === 'rent_desc') {
      sorted.sort((a, b) => (b.estimated_daily_rent || 0) - (a.estimated_daily_rent || 0));
    } else if (sortOption === 'price_asc') {
      sorted.sort((a, b) => (a.estimated_purchase_price || 0) - (b.estimated_purchase_price || 0));
    } else if (sortOption === 'price_desc') {
      sorted.sort((a, b) => (b.estimated_purchase_price || 0) - (a.estimated_purchase_price || 0));
    } else if (sortOption === 'size_desc') {
      sorted.sort((a, b) => (b.square_meters || 0) - (a.square_meters || 0));
    } else if (sortOption === 'size_asc') {
      sorted.sort((a, b) => (a.square_meters || 0) - (b.square_meters || 0));
    } else if (sortOption === 'traffic_desc') {
      sorted.sort((a, b) => (b.traffic_index || 0) - (a.traffic_index || 0));
    }

    return sorted;
  }, [activeType, selectedDistrict, sizeBracket, parkingFilter, search, sortOption]);

  const displayedProperties = useMemo(() => {
    return filtered.slice(0, page * PAGE_SIZE);
  }, [filtered, page]);

  const hasMore = displayedProperties.length < filtered.length;

  // Auto Lazy Loading IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries && entries[0]?.isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasMore]);

  const sortLabelMap: Record<SortField, string> = {
    rent_asc: 'Daily Rent (Lowest)',
    rent_desc: 'Daily Rent (Highest)',
    price_asc: 'Purchase Price (Lowest)',
    price_desc: 'Purchase Price (Highest)',
    size_desc: 'Floor Area (Largest)',
    size_asc: 'Floor Area (Smallest)',
    traffic_desc: 'Foot Traffic (Highest)'
  };

  const activeDistrictData = useMemo(() => {
    if (selectedDistrict === 'All') return null;
    return rawNeighborhoods.find(n => n.name === selectedDistrict || n.id === selectedDistrict.toLowerCase().replace(/[^a-z0-9]/g, ''));
  }, [selectedDistrict]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
          <HeaderIcon className={`w-5 h-5 ${currentHeader.color}`} />
          <span>{currentHeader.title}</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-subtle)] font-normal ml-1">
            {filtered.length} Properties
          </span>
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {currentHeader.subtitle}
        </p>
      </div>

      {/* Clean Unified Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-3">
        {/* Row 1: Search, Size Range & Sort Controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
          {/* Address Search with Quick Clear */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-[var(--text-subtle)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search address (e.g. 5th Ave, Broadway, Wall Street)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl pl-10 pr-9 py-2 text-xs text-[var(--text-main)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-sky-500 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[var(--text-subtle)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Size Bracket Filter */}
          <div className="md:col-span-4 flex items-center p-1 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] gap-1">
            {[
              { id: 'all', label: 'All Sizes' },
              { id: 'small', label: '≤75 m²' },
              { id: 'medium', label: '75-200 m²' },
              { id: 'large', label: '200-750 m²' },
              { id: 'massive', label: '750+ m²' }
            ].map(b => (
              <button
                key={b.id}
                onClick={() => setSizeBracket(b.id as SizeBracket)}
                className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex-1 text-center ${
                  sizeBracket === b.id
                    ? 'bg-sky-600 text-white font-bold shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Sort Selection Dropdown */}
          <div className="md:col-span-3 relative">
            <button
              type="button"
              onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
              className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] hover:border-sky-500 rounded-xl px-3 py-2 text-xs text-[var(--text-main)] font-semibold flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 truncate">
                <ArrowUpDown className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="truncate">{sortLabelMap[sortOption]}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] shrink-0 transition-transform ${sortDropdownOpen ? 'rotate-180 text-sky-500' : ''}`} />
            </button>

            {sortDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-1 space-y-0.5">
                {(['rent_asc', 'rent_desc', 'price_asc', 'price_desc', 'size_desc', 'size_asc', 'traffic_desc'] as SortField[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setSortOption(opt);
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      sortOption === opt
                        ? 'bg-sky-600 text-white font-bold'
                        : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                    }`}
                  >
                    <span>{sortLabelMap[opt]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: NYC Districts & Parking Quick Filter */}
        <div className="pt-2.5 border-t border-[var(--border-subtle)] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* District Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)] shrink-0 mr-1">District:</span>
            <button
              onClick={() => setSelectedDistrict('All')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedDistrict === 'All'
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
              }`}
            >
              All Districts
            </button>
            {rawNeighborhoods.filter(n => n.id !== 'global').map((n) => (
              <button
                key={n.id}
                onClick={() => setSelectedDistrict(n.name)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedDistrict === n.name
                    ? 'bg-sky-600 text-white shadow-xs font-bold'
                    : 'bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                {n.name}
              </button>
            ))}
          </div>

          {/* Dedicated Parking Zone Filter */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)] mr-1">Parking:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'parking_only', label: 'Parking (P)', icon: Car },
              { id: 'no_parking', label: 'No Parking' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setParkingFilter(p.id as ParkingFilter)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  parkingFilter === p.id
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                {p.icon && <Car className="w-3 h-3" />}
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* District Macro Intelligence Bar (Rendered BELOW the filter toolbar so controls stay stationary) */}
      {activeDistrictData && (
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between flex-wrap gap-2 border-b border-[var(--border-subtle)] pb-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-500" />
              <span className="text-sm font-bold text-[var(--text-main)]">{activeDistrictData.name} District Macro Profile</span>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-subtle)]">
              RE Multiplier: <strong className="text-[var(--text-main)]">{activeDistrictData.economic_factors.real_estate_multiplier}x</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Wealth Distribution Breakdown */}
            <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Demographics</span>
              <div className="space-y-1 text-[11px] font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-amber-500 font-medium">Upper Class</span>
                  <span className="font-bold">{activeDistrictData.demographics.upper_class_pct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sky-500 font-medium">Middle Class</span>
                  <span className="font-bold">{activeDistrictData.demographics.middle_class_pct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Working Class</span>
                  <span className="font-bold">{activeDistrictData.demographics.working_class_pct}%</span>
                </div>
              </div>
            </div>

            {/* Target Retail Fit */}
            <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">High-ROI Sectors</span>
              <div className="font-bold text-xs text-[var(--text-main)] mt-1">
                {activeDistrictData.demographics.upper_class_pct >= 50
                  ? 'Jewelry, Luxury Watch, Nightclub, Law Firm'
                  : activeDistrictData.demographics.middle_class_pct >= 50
                  ? 'Electronics, Apparel, Coffee, Graphic Design'
                  : 'Fast Food, Supermarket, Bakery, Liquor'}
              </div>
              <span className="text-[10px] text-[var(--text-subtle)] mt-1">Best demographic alignment</span>
            </div>

            {/* Marketing Efficiency */}
            <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Campaign Potency</span>
              <div className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {(activeDistrictData.economic_factors.marketing_strength * 100).toFixed(0)}% <span className="text-xs font-normal text-[var(--text-subtle)]">Strength</span>
              </div>
              <span className="text-[10px] text-[var(--text-subtle)]">Billboard &amp; Web ad reach</span>
            </div>

            {/* Vehicle & Parking Density */}
            <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">Street Traffic</span>
              <div className="text-base font-extrabold font-mono text-sky-600 dark:text-sky-400 mt-1">
                {activeDistrictData.economic_factors.vehicle_traffic_density_pct}% <span className="text-xs font-normal text-[var(--text-subtle)]">Density</span>
              </div>
              <span className="text-[10px] text-[var(--text-subtle)]">
                {activeDistrictData.economic_factors.parking_price > 0 
                  ? `Meter: $${activeDistrictData.economic_factors.parking_price.toFixed(2)}/h` 
                  : 'Free street parking'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Property Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
        {displayedProperties.map((b) => {
          const cap = getCustomerCapacity(b);
          const meta = getBuildingMetadata(b);
          const isRetailOrSpecial = b.building_type === 'retail' || b.building_type === 'theater' || b.building_type === 'cinema';
          
          // Authentic Break-Even Days Calculation (Purchase Price / Daily Rent)
          const breakEvenDays = (b.estimated_daily_rent && b.estimated_daily_rent > 0)
            ? Math.round(b.estimated_purchase_price / b.estimated_daily_rent)
            : 0;

          return (
            <div
              key={b.id}
              className={`p-4 rounded-2xl bg-[var(--bg-surface)] border shadow-xs space-y-3.5 transition-all flex flex-col justify-between ${
                meta.hasParking 
                  ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' 
                  : 'border-[var(--border-base)] hover:border-sky-500/50'
              }`}
            >
              <div className="space-y-3">
                {/* Header: Address, Parking Badge & Type Code */}
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate">
                    <div className="flex items-center gap-1.5 truncate">
                      <h3 className="text-xs font-bold text-[var(--text-main)] truncate">{b.address}</h3>
                      {meta.hasParking && (
                        <span className="p-0.5 px-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-extrabold text-[9px] flex items-center gap-0.5 shrink-0" title="Dedicated Parking Zone Available">
                          <Car className="w-2.5 h-2.5" />
                          <span>P</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--text-subtle)] mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                      <span className="truncate">{b.neighborhood_name}</span>
                    </div>
                  </div>

                  {/* Building Type Subtype Badge */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-main)]">
                      {meta.code}
                    </span>
                    <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      b.building_type === 'retail'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        : b.building_type === 'office'
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
                        : b.building_type === 'warehouse'
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                        : b.building_type === 'residential'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                    }`}>
                      {b.building_type}
                    </span>
                  </div>
                </div>

                {/* Minimalist Specs Box with Icon Metrics */}
                <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-xs text-center">
                  {/* Floor Area */}
                  <div className="flex flex-col items-center justify-center p-1">
                    <div className="flex items-center gap-1 text-[10px] text-[var(--text-subtle)]">
                      <Maximize2 className="w-2.5 h-2.5" />
                      <span>Area</span>
                    </div>
                    <div className="font-mono font-bold text-[var(--text-main)] mt-0.5">
                      {b.square_meters} m²
                    </div>
                  </div>

                  {/* Foot Traffic */}
                  <div className="flex flex-col items-center justify-center p-1">
                    <div className="flex items-center gap-1 text-[10px] text-[var(--text-subtle)]">
                      <Footprints className="w-2.5 h-2.5 text-sky-500" />
                      <span>Traffic</span>
                    </div>
                    <div className="font-mono font-bold text-sky-600 dark:text-sky-400 mt-0.5">
                      {b.traffic_index}/100
                    </div>
                  </div>

                  {/* Customer Capacity or Subtype Variant */}
                  <div className="flex flex-col items-center justify-center p-1">
                    <div className="flex items-center gap-1 text-[10px] text-[var(--text-subtle)]">
                      <Users className="w-2.5 h-2.5 text-emerald-500" />
                      <span>{isRetailOrSpecial ? 'Capacity' : 'Variant'}</span>
                    </div>
                    <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {isRetailOrSpecial ? `${cap} max` : meta.code}
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown & Contextual Builder Link */}
              <div className="pt-2.5 border-t border-[var(--border-subtle)] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-muted)]">Daily Rent</span>
                  <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                    {fmtMoney(b.estimated_daily_rent)}<span className="text-[10px] font-normal text-[var(--text-subtle)]">/d</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-[var(--text-subtle)]">
                    <span>Purchase</span>
                    <span className="text-[10px] text-[var(--text-subtle)]">({breakEvenDays}d)</span>
                  </div>
                  <span className="font-mono text-[var(--text-muted)] font-medium">
                    {fmtMoney(b.estimated_purchase_price)}
                  </span>
                </div>

                {/* Streamlined Action Links */}
                {b.building_type === 'retail' && (
                  <Link
                    href={`/builder?sqm=${b.square_meters}&capacity=${cap}`}
                    className="mt-1 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold text-[11px] flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5" />
                      <span>Open in Store Builder</span>
                    </div>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}

                {b.building_type === 'office' && (
                  <Link
                    href={`/builder?sqm=${b.square_meters}&type=lawfirm&capacity=${cap}`}
                    className="mt-1 px-3 py-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px] flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Open in Office Builder</span>
                    </div>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}

                {b.building_type === 'warehouse' && (
                  <Link
                    href="/factories"
                    className="mt-1 px-3 py-1.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 font-semibold text-[11px] flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-1.5">
                      <Boxes className="w-3.5 h-3.5" />
                      <span>Open in Factory Planner</span>
                    </div>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Infinite Scroll Auto-Loader Trigger Sentinel */}
      {hasMore && (
        <div ref={observerTarget} className="py-6 flex items-center justify-center gap-2 text-xs text-[var(--text-subtle)]">
          <Loader2 className="w-4 h-4 animate-spin text-sky-500" />
          <span>Loading more properties ({displayedProperties.length} of {filtered.length})...</span>
        </div>
      )}
    </div>
  );
}

export default function RealEstatePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--text-muted)]">Loading properties...</div>}>
      <RealEstateContent />
    </Suspense>
  );
}