'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Truck, 
  Search, 
  Boxes, 
  MapPin, 
  Store,
  Ship,
  ArrowRight,
  ChevronDown,
  ArrowUpDown,
  Funnel
} from 'lucide-react';

import vehiclesDataRaw from '@/data/vehicles.json';
import { BOATS } from '@/data/boats';
import { DEALERSHIPS_DB, Dealership } from '@/data/dealerships';
import jobLocations from '@/data/vehicle_job_locations.json';
import { useTranslation } from '@/context/LanguageContext';
import Vehicle360Viewer from './components/Vehicle360Viewer';
import VehicleDashboard from './components/VehicleDashboard';
import { getVehicleSpin, getVehicleThumbnail, getVehicleBackground, vehicleImageUrl, getVehicleColors, getVehicleDefaultColor } from '@/lib/vehicleSpins';

interface Vehicle {
  id: string;
  raw_id: string;
  name: string;
  category: string;
  price: number;
  maxCargoCapacity: number;
  maxFuel: number;
  maxSpeed: number;
  autoParkSupported: boolean;
  taxDeductible: boolean;
  isLuxuryCar: boolean;
  fitsHandTruck: boolean;
  fitsFlatbed: boolean;
  requiredDeliveryDriverSkill: number;
  destinationsThatCanDeliver: number;
  dealershipIds?: string[];
  image: string;
  description: string;
  rentOnly?: boolean;
  jobOnly?: boolean;
  jobVehicleType?: string;
  isBoat?: boolean;
  isLuxuryYacht?: boolean;
}

// Boats share the same list and dropdown as cars, but carry no cargo/speed/fuel data.
const boatVehicles: Vehicle[] = BOATS.map(b => ({
  id: b.id,
  raw_id: `ba:boattype_${b.id}`,
  name: b.name,
  category: 'boat',
  price: b.price,
  maxCargoCapacity: 0,
  maxFuel: 0,
  maxSpeed: 0,
  autoParkSupported: false,
  taxDeductible: b.taxDeductible,
  isLuxuryCar: b.isLuxuryYacht,
  fitsHandTruck: false,
  fitsFlatbed: false,
  requiredDeliveryDriverSkill: 0,
  destinationsThatCanDeliver: 0,
  image: `/images/vehicles/${b.id}.png`,
  description: '',
  isBoat: true,
  isLuxuryYacht: b.isLuxuryYacht
}));

const vehiclesData: Vehicle[] = [...(vehiclesDataRaw as Vehicle[]), ...boatVehicles];

type MainViewTab = 'vehicles' | 'dealerships';
type CategoryFilter = 'all' | 'commercial' | 'luxury' | 'personal' | 'rentOnly' | 'boats';
type VehicleSortOption = 'default' | 'price_asc' | 'price_desc' | 'cargo_desc' | 'speed_desc' | 'name_asc';

function VehiclesContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialView = (searchParams.get('tab') as MainViewTab) || 'vehicles';
  const initialCategory = (searchParams.get('category') as CategoryFilter) || 'all';

  const [activeTab, setActiveTab] = useState<MainViewTab>(initialView);
  const [category, setCategory] = useState<CategoryFilter>(initialCategory);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [sortOption, setSortOption] = useState<VehicleSortOption>('default');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(vehiclesData[0]?.id || 'freighttruckt1');

  // Keep state synchronized with URL search params
  useEffect(() => {
    const tabParam = searchParams.get('tab') as MainViewTab;
    if (tabParam === 'vehicles' || tabParam === 'dealerships') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const switchTab = (tab: MainViewTab) => {
    setActiveTab(tab);
    setSearch('');
    router.replace(`${pathname}?tab=${tab}`, { scroll: false });
  };

  const categoryLabels: Record<CategoryFilter, { label: string; count: number }> = {
    all: { label: t('vehicles.categories.all', 'All Vehicles'), count: vehiclesData.length },
    commercial: { label: t('vehicles.categories.commercial', 'Commercial & Vans'), count: vehiclesData.filter(v => v.category.includes('commercial') || v.category.includes('utility')).length },
    luxury: { label: t('vehicles.categories.luxury', 'Luxury & Sports'), count: vehiclesData.filter(v => v.isLuxuryCar || v.price >= 95000).length },
    personal: { label: t('vehicles.categories.personal', 'Personal & Sedans'), count: vehiclesData.filter(v => ['sedan','sports','muscle','compact','suv_van'].includes(v.category)).length },
    rentOnly: { label: t('vehicles.categories.rentOnly', 'Rent-only'), count: vehiclesData.filter(v => v.rentOnly).length },
    boats: { label: t('vehicles.categories.boats', 'Boats'), count: vehiclesData.filter(v => v.isBoat).length }
  };

  const sortLabels: Record<VehicleSortOption, string> = {
    default: t('vehicles.sort.default', 'Default Order'),
    price_asc: t('vehicles.sort.price_asc', 'Lowest Price ($)'),
    price_desc: t('vehicles.sort.price_desc', 'Highest Price ($)'),
    cargo_desc: t('vehicles.sort.cargo_desc', 'Largest Cargo Capacity'),
    speed_desc: t('vehicles.sort.speed_desc', 'Highest Top Speed'),
    name_asc: t('vehicles.sort.name_asc', 'Alphabetical (A-Z)')
  };

  // Funnel & Sort logic for vehicles
  const filteredVehicles = useMemo(() => {
    let list = vehiclesData.filter(v => {
      const dealerNames = (v.dealershipIds ?? [])
        .map(id => DEALERSHIPS_DB.find(d => d.id === id)?.name ?? '')
        .join(' ')
        .toLowerCase();
      const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
                            dealerNames.includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (category === 'commercial') {
        return v.category === 'commercial_truck' || v.category === 'commercial_van' || v.category === 'utility_pickup';
      }
      if (category === 'luxury') {
        return v.isLuxuryCar || v.category.includes('luxury') || v.price >= 95000;
      }
      if (category === 'personal') {
        return v.category === 'sedan' || v.category === 'sports' || v.category === 'muscle' || v.category === 'compact' || v.category === 'suv_van';
      }
      if (category === 'rentOnly') {
        return Boolean(v.rentOnly);
      }
      if (category === 'boats') {
        return Boolean(v.isBoat);
      }

      return true;
    });

    return [...list].sort((a, b) => {
      if (sortOption === 'price_asc') return a.price - b.price;
      if (sortOption === 'price_desc') return b.price - a.price;
      if (sortOption === 'cargo_desc') return b.maxCargoCapacity - a.maxCargoCapacity;
      if (sortOption === 'speed_desc') return b.maxSpeed - a.maxSpeed;
      if (sortOption === 'name_asc') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [category, search, sortOption]);

  const selected = useMemo(() => {
    return vehiclesData.find(v => v.id === selectedVehicleId) || filteredVehicles[0] || vehiclesData[0];
  }, [selectedVehicleId, filteredVehicles]);

  // A vehicle can be sold at more than one dealership; resolve every linked one.
  const selectedDealers = useMemo(() => {
    const ids = selected?.dealershipIds ?? [];
    return ids
      .map(id => DEALERSHIPS_DB.find(d => d.id === id))
      .filter((d): d is Dealership => Boolean(d));
  }, [selected]);

  // Delivery-driver job vehicles are not sold; list where the job can be started.
  const selectedJobLocations = useMemo(() => {
    if (!selected?.jobVehicleType) return [];
    const map = jobLocations as Record<string, Array<{ name: string; address: string; district: string }>>;
    return map[selected.jobVehicleType] ?? [];
  }, [selected]);

  // Dashboard gauge scales: the fastest vehicle fills the speedometer and the
  // largest tank fills the fuel gauge (so slower/smaller ones read lower).
  const maxSpeedAll = useMemo(() => Math.max(1, ...vehiclesData.map(v => v.maxSpeed)), []);
  const maxFuelAll = useMemo(() => Math.max(1, ...vehiclesData.map(v => v.maxFuel)), []);

  // Colour swatches for the selected vehicle; changing the swatch swaps the 360
  // frames. Resets to the baked-in default whenever a different vehicle is chosen.
  const [selectedColorKey, setSelectedColorKey] = useState<string | null>(null);
  useEffect(() => {
    setSelectedColorKey(null);
  }, [selectedVehicleId]);
  const vehicleColorOptions = useMemo(() => getVehicleColors(selected?.id), [selected]);
  const effectiveColor = selectedColorKey ?? getVehicleDefaultColor(selected?.id);

  // Vehicles with a pre-rendered 360 spin set get the draggable viewer instead of
  // a static image. Only vehicles registered in lib/vehicleSpins.ts qualify.
  const selectedSpin = useMemo(() => (selected ? getVehicleSpin(selected.id, effectiveColor) : null), [selected, effectiveColor]);

  const [selectedDealerId, setSelectedDealerId] = useState<string>(DEALERSHIPS_DB[0].id);

  // Dealerships filtered list
  const filteredDealerships = useMemo(() => {
    if (!search.trim()) return DEALERSHIPS_DB;
    const q = search.toLowerCase();
    return DEALERSHIPS_DB.filter(d => 
      d.name.toLowerCase().includes(q) ||
      d.district.toLowerCase().includes(q) ||
      d.address.toLowerCase().includes(q) ||
      d.specialty.toLowerCase().includes(q)
    );
  }, [search]);

  const selectedDealer = useMemo(() => {
    return DEALERSHIPS_DB.find(d => d.id === selectedDealerId) || filteredDealerships[0] || DEALERSHIPS_DB[0];
  }, [selectedDealerId, filteredDealerships]);

  const selectedDealerInventory = useMemo(() => {
    if (!selectedDealer) return [];
    return vehiclesData.filter(v => selectedDealer.inventoryVehicleIds.includes(v.id));
  }, [selectedDealer]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
          {activeTab === 'dealerships' ? <Store className="w-5 h-5 text-indigo-500" /> : <Truck className="w-5 h-5 text-indigo-500" />}
          <span>
            {activeTab === 'dealerships'
              ? t('vehicles.dealershipsTab', 'Car Dealerships')
              : t('vehicles.fleetTab', 'Vehicles, Boats & Logistics Fleet')}
          </span>
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {activeTab === 'dealerships'
            ? t('vehicles.dealershipsSub', 'Authorized NYC vehicle dealerships, showroom inventories, and district locations.')
            : t('vehicles.fleetSub', 'Cars, boats and logistics vehicles with their real in-game specs and prices.')}
        </p>

        <div className="inline-flex items-center bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl p-0.5 text-xs mt-3">
          {(['vehicles', 'dealerships'] as MainViewTab[]).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => switchTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
            >
              {tab === 'vehicles' ? t('vehicles.tabVehiclesBoats', 'Vehicles & Boats') : t('vehicles.tabDealerships', 'Dealerships')}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'vehicles' ? (
        /* ================= VEHICLES SPLIT LAYOUT ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Funnel & Vehicle List (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-[var(--text-subtle)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('vehicles.searchPlaceholder', 'Search vehicle models or specs...')}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--text-main)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Dual Funnel & Sorting Dropdowns */}
              <div className="grid grid-cols-2 gap-2">
                {/* Category Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryDropdownOpen(!categoryDropdownOpen);
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full bg-[var(--bg-base)] border rounded-xl px-2.5 py-1.5 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      category !== 'all'
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5'
                        : 'border-[var(--border-base)] hover:border-indigo-500 text-[var(--text-main)]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <Funnel className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{categoryLabels[category]?.label || t('common.category', 'Category')}</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] shrink-0 transition-transform ${categoryDropdownOpen ? 'rotate-180 text-indigo-500' : ''}`} />
                  </button>

                  {categoryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-1.5 space-y-1">
                      {(Object.keys(categoryLabels) as CategoryFilter[]).map((catKey) => {
                        const isCatActive = category === catKey;
                        return (
                          <button
                            key={catKey}
                            type="button"
                            onClick={() => {
                              setCategory(catKey);
                              setCategoryDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                              isCatActive
                                ? 'bg-indigo-600 text-white font-bold'
                                : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                            }`}
                          >
                            <span>{categoryLabels[catKey].label}</span>
                            <span className={`text-[10px] font-mono ${isCatActive ? 'text-white/80' : 'text-[var(--text-subtle)]'}`}>
                              {categoryLabels[catKey].count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setSortDropdownOpen(!sortDropdownOpen);
                      setCategoryDropdownOpen(false);
                    }}
                    className={`w-full bg-[var(--bg-base)] border rounded-xl px-2.5 py-1.5 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      sortOption !== 'default'
                        ? 'border-sky-500 text-sky-600 dark:text-sky-400 bg-sky-500/5'
                        : 'border-[var(--border-base)] hover:border-sky-500 text-[var(--text-main)]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <ArrowUpDown className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                      <span className="truncate">{sortLabels[sortOption] || t('common.sort', 'Sort')}</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] shrink-0 transition-transform ${sortDropdownOpen ? 'rotate-180 text-sky-500' : ''}`} />
                  </button>

                  {sortDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-1.5 space-y-1">
                      {(Object.keys(sortLabels) as VehicleSortOption[]).map((sortKey) => {
                        const isSortActive = sortOption === sortKey;
                        return (
                          <button
                            key={sortKey}
                            type="button"
                            onClick={() => {
                              setSortOption(sortKey);
                              setSortDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                              isSortActive
                                ? 'bg-sky-600 text-white font-bold'
                                : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                            }`}
                          >
                            <span>{sortLabels[sortKey]}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Vehicle Cards List */}
            <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {filteredVehicles.map(v => {
                const isSelected = selected?.id === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVehicleId(v.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[var(--bg-surface-hover)] border-indigo-500 shadow-sm ring-1 ring-indigo-500/20'
                        : 'bg-[var(--bg-surface)] border-[var(--border-base)] hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-12 h-10 rounded-lg border border-[var(--border-base)] p-1 flex items-center justify-center shrink-0 overflow-hidden"
                        style={{ backgroundColor: getVehicleBackground(v.id) }}
                      >
                        {v.image ? (
                          <img 
                            src={getVehicleThumbnail(v.id, v.image)} 
                            alt={v.name} 
                            className="w-full h-full object-contain scale-125 filter drop-shadow-xs" 
                            loading="lazy"
                          />
                        ) : v.isBoat ? (
                          <Ship className="w-4 h-4 text-sky-500" />
                        ) : (
                          <Truck className="w-4 h-4 text-[var(--text-subtle)] opacity-40" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-[var(--text-main)] truncate">{v.name}</span>
                          {v.taxDeductible && (
                            <span className="text-[8px] font-bold px-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              {t('vehicles.tax', 'TAX')}
                            </span>
                          )}
                          {v.rentOnly && (
                            <span className="text-[8px] font-bold px-1 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400">
                              {t('vehicles.rentTag', 'RENT')}
                            </span>
                          )}
                          {v.jobOnly && (
                            <span className="text-[8px] font-bold px-1 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400">
                              {t('vehicles.jobTag', 'JOB')}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--text-subtle)] font-mono flex items-center gap-2">
                          {v.isBoat ? (
                            <span>{v.isLuxuryYacht ? t('vehicles.luxuryYacht', 'Luxury Yacht') : t('vehicles.boatType', 'Boat')}</span>
                          ) : (
                            <>
                              <span>{v.maxCargoCapacity} {t('vehicles.boxes', 'boxes')}</span>
                              <span>•</span>
                              <span>{v.maxSpeed} {t('vehicles.mph', 'mph')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {!v.jobOnly && (
                        <div className="font-mono font-bold text-xs text-[var(--text-main)]">
                          {formatCurrency(v.price)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Vehicle Detail View (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {selected && (
              <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-6">
                {/* Header: Title, Category, Dealership Price */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-base)] pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-xl font-bold text-[var(--text-main)]">{selected.name}</h2>
                      {selected.jobOnly ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-violet-500/10 border border-violet-500/30 text-violet-600 dark:text-violet-400">
                          {t('vehicles.jobOnly', 'Job only')}
                        </span>
                      ) : selected.rentOnly && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400">
                          {t('vehicles.rentOnly', 'Rent only')}
                        </span>
                      )}
                      {selected.isLuxuryCar && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                          {t('vehicles.luxury', 'Luxury')}
                        </span>
                      )}
                      {selected.taxDeductible && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                          {t('vehicles.taxDeductible', 'Tax Deductible')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-subtle)] mt-1 uppercase font-mono tracking-wider">
                      {selected.category.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="sm:text-right">
                    {selected.jobOnly ? (
                      <div className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1 sm:justify-end">
                        <Truck className="w-3.5 h-3.5" />
                        <span>{t('vehicles.jobVehicle', 'Job vehicle')}</span>
                      </div>
                    ) : (
                      <>
                        <div className="text-[10px] uppercase font-mono text-[var(--text-subtle)]">{selected.rentOnly ? t('vehicles.rental', 'Rental') : t('vehicles.tablePrice', 'Price')}</div>
                        <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(selected.price)}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Vehicle Profile: Large Image / 360 Viewer + 2x2 Specs Grid */}
                <div className="flex flex-col md:flex-row items-center md:items-start gap-5">
                  {/* Vehicle Image / 360 Viewer Box */}
                  <div
                    className="w-56 h-56 md:w-64 md:h-64 shrink-0 rounded-2xl border border-[var(--border-base)] p-3 flex items-center justify-center relative overflow-hidden"
                    style={{ backgroundColor: getVehicleBackground(selected.id) }}
                  >
                    {selectedSpin ? (
                      <Vehicle360Viewer spin={selectedSpin} alt={selected.name} />
                    ) : selected.image ? (
                      <img
                        src={vehicleImageUrl(selected.image)}
                        alt={selected.name}
                        className="w-full h-full object-contain filter drop-shadow-sm"
                      />
                    ) : selected.isBoat ? (
                      <div className="flex flex-col items-center justify-center text-sky-500 opacity-80 space-y-1">
                        <Ship className="w-10 h-10" />
                        <span className="text-[10px] font-mono text-[var(--text-subtle)]">{t('vehicles.boatType', 'Boat')}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[var(--text-subtle)] opacity-40 space-y-1">
                        <Truck className="w-10 h-10" />
                        <span className="text-[10px] font-mono">{t('vehicles.noImage', 'No image')}</span>
                      </div>
                    )}
                  </div>

                  {/* Dashboard + colour switcher */}
                  <div className="flex-1 w-full flex flex-col items-start gap-3">
                    {!selected.isBoat && (
                      <VehicleDashboard
                        cargo={selected.maxCargoCapacity}
                        speed={selected.maxSpeed}
                        fuel={selected.maxFuel}
                        autoPark={selected.autoParkSupported}
                        maxSpeed={maxSpeedAll}
                        maxFuel={maxFuelAll}
                      />
                    )}

                    {vehicleColorOptions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {vehicleColorOptions.map(option => {
                          const active = option.key === effectiveColor;
                          return (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => setSelectedColorKey(option.key)}
                              title={option.name}
                              aria-label={option.name}
                              aria-pressed={active}
                              className={`w-5 h-5 rounded-full border transition-transform ${
                                active
                                  ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-[var(--bg-surface)] border-white scale-110'
                                  : 'border-[var(--border-base)] hover:scale-110'
                              }`}
                              style={{ backgroundColor: option.hex }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {!selected.isBoat && !selected.rentOnly && (
                <div className="p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-bold text-xs text-[var(--text-main)] flex items-center gap-1.5">
                      {selected.jobOnly ? <Truck className="w-4 h-4 text-violet-500" /> : <MapPin className="w-4 h-4 text-rose-500" />}
                      <span>{selected.jobOnly ? t('vehicles.jobLocations', 'Delivery Driver Job Locations') : t('vehicles.whereToBuy', 'Where to Buy')}</span>
                    </div>
                    {!selected.jobOnly && selectedDealers.length > 0 && (
                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-[var(--text-subtle)]">{t('vehicles.deliveryFee', 'Delivery Fee:')} </span>
                        <span className="font-bold font-mono text-[var(--text-main)]">$5,000</span>
                      </div>
                    )}
                  </div>

                  {selected.jobOnly ? (
                    <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                      {selectedJobLocations.map(loc => (
                        <div
                          key={`${loc.address}-${loc.name}`}
                          className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-base)]"
                        >
                          <span className="text-[12px] font-semibold text-[var(--text-main)] truncate">{loc.name || t('vehicles.deliveryJobStop', 'Delivery stop')}</span>
                          <span className="text-[11px] font-mono text-[var(--text-subtle)] shrink-0">{loc.address}</span>
                        </div>
                      ))}
                    </div>
                  ) : selectedDealers.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDealers.map(dealer => (
                        <div
                          key={dealer.id}
                          onClick={() => {
                            setSelectedDealerId(dealer.id);
                            switchTab('dealerships');
                          }}
                          className="p-3 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] hover:border-indigo-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer transition-all group"
                          title={t('vehicles.viewDealership', 'View Dealership')}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-[var(--text-main)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{dealer.name}</span>
                              {selectedDealers.length > 1 && (
                                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-subtle)]">{dealer.district}</span>
                              )}
                            </div>
                            <div className="text-[11px] text-[var(--text-subtle)] font-mono mt-0.5">{dealer.address}</div>
                          </div>
                          <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform shrink-0">
                            <span>{t('vehicles.viewDealership', 'View Dealership')}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-[var(--text-subtle)]">
                      {t('vehicles.notSoldAtDealership', 'Not sold at a dealership.')}
                    </div>
                  )}
                </div>
                )}

                {/* Warehouse Fleet Logistics Specifications (only for vehicles you
                    can own and assign to a warehouse slot) */}
                {!selected.jobOnly && !selected.rentOnly && (selected.destinationsThatCanDeliver > 0 || selected.requiredDeliveryDriverSkill > 0) && (
                  <div className="p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-3">
                    <div className="font-bold text-xs text-[var(--text-main)] flex items-center gap-2">
                      <Truck className="w-4 h-4 text-indigo-500" />
                      <span>{t('vehicles.warehouseSpecs', 'Warehouse Driver Specifications')}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-[11px] text-[var(--text-subtle)]">{t('vehicles.maxRoutes', 'Max Store Delivery Routes:')}</div>
                        <div className="font-bold font-mono text-sm text-[var(--text-main)] mt-0.5">
                          {selected.destinationsThatCanDeliver} {t('vehicles.storesUnit', 'Stores')}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[var(--text-subtle)]">{t('vehicles.driverSkill', 'Required Driver Skill')}:</div>
                        <div className="font-bold font-mono text-sm text-[var(--text-main)] mt-0.5">
                          {t('vehicles.requiredLogistics', '{skill}% Logistics').replace('{skill}', selected.requiredDeliveryDriverSkill.toString())}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= DEALERSHIPS SPLIT LAYOUT ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Dealership List (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[var(--text-subtle)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('vehicles.searchDealersPlaceholder', 'Search dealership or district...')}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--text-main)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Dealerships List */}
              <div className="space-y-2">
                {filteredDealerships.map(dealer => {
                  const isSelected = selectedDealer.id === dealer.id;
                  const count = dealer.inventoryVehicleIds.length;

                  return (
                    <div
                      key={dealer.id}
                      onClick={() => setSelectedDealerId(dealer.id)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[var(--bg-surface-hover)] border-indigo-500 shadow-sm ring-1 ring-indigo-500/20'
                          : 'bg-[var(--bg-surface)] border-[var(--border-base)] hover:border-slate-400'
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-bold text-xs text-[var(--text-main)] truncate flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{dealer.name}</span>
                        </div>
                        <div className="text-[11px] text-[var(--text-subtle)] truncate">
                          {dealer.district} • {dealer.address}
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-subtle)] shrink-0">
                        {count} {t('vehicles.modelsUnit', 'models')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Selected Dealership Showroom & Inventory Table (8 Cols) */}
          <div className="lg:col-span-8 space-y-4">
            {selectedDealer && (
              <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-6">
                {/* Dealership Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-base)] pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
                      <Store className="w-5 h-5 text-indigo-500" />
                      <span>{selectedDealer.name}</span>
                    </h2>
                    <div className="text-xs text-[var(--text-subtle)] mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{selectedDealer.district} • <span className="font-mono text-[var(--text-main)]">{selectedDealer.address}</span></span>
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-xs font-mono px-3 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-subtle)]">
                      {selectedDealerInventory.length} {t('vehicles.showroomModels', 'Showroom Models')}
                    </span>
                  </div>
                </div>

                {/* Specialty Description */}
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {selectedDealer.specialty}
                </p>

                {/* Showroom Vehicle Inventory Table */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[var(--text-main)]">
                    {t('vehicles.availableInventory', 'Available Showroom Inventory')}
                  </div>

                  <div className="rounded-xl border border-[var(--border-base)] overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[var(--bg-base)] border-b border-[var(--border-base)] text-[11px] text-[var(--text-subtle)] uppercase">
                          <th className="py-2.5 px-3 font-semibold">{t('vehicles.tableVehicle', 'Vehicle')}</th>
                          <th className="py-2.5 px-3 font-semibold">{t('vehicles.tableClass', 'Class')}</th>
                          <th className="py-2.5 px-3 font-semibold text-right">{t('vehicles.tableCargo', 'Cargo')}</th>
                          <th className="py-2.5 px-3 font-semibold text-right">{t('vehicles.tableTopSpeed', 'Top Speed')}</th>
                          <th className="py-2.5 px-3 font-semibold text-right">{t('vehicles.tablePrice', 'Price')}</th>
                          <th className="py-2.5 px-3 font-semibold text-right">{t('vehicles.tableAction', 'Action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {selectedDealerInventory.map(v => (
                          <tr key={v.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-10 h-8 rounded-lg border border-[var(--border-base)] p-0.5 flex items-center justify-center shrink-0 overflow-hidden"
                                  style={{ backgroundColor: getVehicleBackground(v.id) }}
                                >
                                  {v.image ? (
                                    <img src={getVehicleThumbnail(v.id, v.image)} alt={v.name} className="w-full h-full object-contain scale-125" />
                                  ) : (
                                    <Truck className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
                                  )}
                                </div>
                                <div>
                                  <span className="font-bold text-[var(--text-main)] block">{v.name}</span>
                                  {v.taxDeductible && (
                                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                      {t('vehicles.taxDeductible', 'Tax Deductible')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[var(--text-subtle)] capitalize">
                              {v.category.replace('_', ' ')}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[var(--text-main)]">
                              {v.maxCargoCapacity} <span className="text-[10px] font-normal text-[var(--text-subtle)]">{t('vehicles.boxes', 'boxes')}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[var(--text-main)]">
                              {v.maxSpeed} <span className="text-[10px] font-normal text-[var(--text-subtle)]">{t('vehicles.mph', 'mph')}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(v.price)}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => {
                                  setSelectedVehicleId(v.id);
                                  switchTab('vehicles');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-600 hover:text-white dark:text-indigo-400 dark:hover:text-white font-semibold text-[11px] transition-colors cursor-pointer"
                              >
                                {t('vehicles.viewSpecsBtn', 'View Specs →')}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VehiclesPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--text-muted)]">{t('vehicles.loading', 'Loading vehicle catalog...')}</div>}>
      <VehiclesContent />
    </Suspense>
  );
}
