'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Truck, 
  Search, 
  Boxes, 
  Fuel, 
  Gauge, 
  DollarSign, 
  MapPin, 
  ShieldCheck, 
  Crown, 
  Store,
  ArrowUpRight,
  ArrowRight,
  ChevronDown,
  ArrowUpDown,
  Filter
} from 'lucide-react';

import vehiclesDataRaw from '@/data/vehicles.json';
import { DEALERSHIPS_DB, Dealership } from '@/data/dealerships';

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
  dealership: string;
  dealershipAddress: string;
  image: string;
  description: string;
}

const vehiclesData: Vehicle[] = vehiclesDataRaw;

type MainViewTab = 'vehicles' | 'dealerships';
type CategoryFilter = 'all' | 'commercial' | 'luxury' | 'personal' | 'manual';
type VehicleSortOption = 'default' | 'price_asc' | 'price_desc' | 'cargo_desc' | 'speed_desc' | 'name_asc';

function VehiclesContent() {
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
    all: { label: 'All Vehicles', count: vehiclesData.length },
    commercial: { label: 'Commercial & Vans', count: vehiclesData.filter(v => v.category.includes('commercial') || v.category.includes('utility')).length },
    luxury: { label: 'Luxury & Sports', count: vehiclesData.filter(v => v.isLuxuryCar || v.price >= 95000).length },
    personal: { label: 'Personal & Sedans', count: vehiclesData.filter(v => ['sedan','sports','muscle','compact','suv_van'].includes(v.category)).length },
    manual: { label: 'Hand Carts & Mobility', count: vehiclesData.filter(v => v.category === 'manual_cargo' || v.category === 'micro_mobility').length }
  };

  const sortLabels: Record<VehicleSortOption, string> = {
    default: 'Default Order',
    price_asc: 'Lowest Price ($)',
    price_desc: 'Highest Price ($)',
    cargo_desc: 'Largest Cargo Capacity',
    speed_desc: 'Highest Top Speed',
    name_asc: 'Alphabetical (A-Z)'
  };

  // Filter & Sort logic for vehicles
  const filteredVehicles = useMemo(() => {
    let list = vehiclesData.filter(v => {
      const matchesSearch = v.name.toLowerCase().includes(search.toLowerCase()) ||
                            v.dealership.toLowerCase().includes(search.toLowerCase());

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
      if (category === 'manual') {
        return v.category === 'manual_cargo' || v.category === 'micro_mobility';
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
          <Truck className="w-5 h-5 text-indigo-500" />
          <span>{activeTab === 'dealerships' ? 'Car Dealerships' : 'Vehicles & Logistics Fleet'}</span>
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {activeTab === 'dealerships'
            ? 'Authorized NYC vehicle dealerships, showroom inventories, and district locations.'
            : 'Complete vehicle catalogue, commercial logistics specs, cargo capacities, and top speeds.'}
        </p>
      </div>

      {activeTab === 'vehicles' ? (
        /* ================= VEHICLES SPLIT LAYOUT ================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Filter & Vehicle List (4 Cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-[var(--text-subtle)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search vehicle or dealer..."
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl pl-9 pr-4 py-2 text-xs text-[var(--text-main)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Dual Filter & Sorting Dropdowns */}
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
                      <Filter className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{categoryLabels[category]?.label || 'Category'}</span>
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
                      <span className="truncate">{sortLabels[sortOption] || 'Sort'}</span>
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
                      <div className="w-12 h-10 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                        {v.image ? (
                          <img 
                            src={v.image} 
                            alt={v.name} 
                            className="w-full h-full object-contain filter drop-shadow-xs" 
                            loading="lazy"
                          />
                        ) : (
                          <Truck className="w-4 h-4 text-[var(--text-subtle)] opacity-40" />
                        )}
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-[var(--text-main)] truncate">{v.name}</span>
                          {v.taxDeductible && (
                            <span className="text-[8px] font-bold px-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              TAX
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[var(--text-subtle)] font-mono flex items-center gap-2">
                          <span>{v.maxCargoCapacity} boxes</span>
                          <span>•</span>
                          <span>{v.maxSpeed} mph</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-xs text-[var(--text-main)]">
                        {formatCurrency(v.price)}
                      </div>
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
                      {selected.isLuxuryCar && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                          Luxury
                        </span>
                      )}
                      {selected.taxDeductible && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                          Tax Deductible
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-subtle)] mt-1 uppercase font-mono tracking-wider">
                      {selected.category.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(selected.price)}
                    </div>
                  </div>
                </div>

                {/* Vehicle Profile: Compact Square Image + 2x2 Specs Grid */}
                <div className="flex flex-col md:flex-row items-center md:items-stretch gap-5">
                  {/* Compact Square Vehicle Image Box */}
                  <div className="w-48 h-48 shrink-0 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-base)] p-3 flex items-center justify-center relative overflow-hidden">
                    {selected.image ? (
                      <img
                        src={selected.image}
                        alt={selected.name}
                        className="w-full h-full object-contain filter drop-shadow-sm"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[var(--text-subtle)] opacity-40 space-y-1">
                        <Truck className="w-10 h-10" />
                        <span className="text-[10px] font-mono">Manual Equipment</span>
                      </div>
                    )}
                  </div>

                  {/* Technical Specifications 2x2 Grid */}
                  <div className="flex-1 grid grid-cols-2 gap-3 text-xs w-full">
                    <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex flex-col justify-center space-y-1">
                      <div className="text-[11px] text-[var(--text-subtle)] flex items-center gap-1.5">
                        <Boxes className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Cargo Capacity</span>
                      </div>
                      <div className="text-lg font-bold font-mono text-[var(--text-main)]">
                        {selected.maxCargoCapacity} <span className="text-xs font-normal text-[var(--text-subtle)]">boxes</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex flex-col justify-center space-y-1">
                      <div className="text-[11px] text-[var(--text-subtle)] flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-sky-500" />
                        <span>Top Speed</span>
                      </div>
                      <div className="text-lg font-bold font-mono text-[var(--text-main)]">
                        {selected.maxSpeed} <span className="text-xs font-normal text-[var(--text-subtle)]">mph</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex flex-col justify-center space-y-1">
                      <div className="text-[11px] text-[var(--text-subtle)] flex items-center gap-1.5">
                        <Fuel className="w-3.5 h-3.5 text-amber-500" />
                        <span>Fuel Tank</span>
                      </div>
                      <div className="text-lg font-bold font-mono text-[var(--text-main)]">
                        {selected.maxFuel > 0 ? `${selected.maxFuel} L` : 'None'}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex flex-col justify-center space-y-1">
                      <div className="text-[11px] text-[var(--text-subtle)] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Auto-Park</span>
                      </div>
                      <div className="text-lg font-bold font-mono text-[var(--text-main)]">
                        {selected.autoParkSupported ? 'Supported' : 'No'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Where to Buy */}
                <div 
                  onClick={() => {
                    const matchedDealer = DEALERSHIPS_DB.find(d => d.name.toLowerCase() === selected.dealership.toLowerCase() || selected.dealership.toLowerCase().includes(d.name.toLowerCase()));
                    if (matchedDealer) {
                      setSelectedDealerId(matchedDealer.id);
                      switchTab('dealerships');
                    }
                  }}
                  className="p-4 rounded-xl bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] hover:border-indigo-500/40 space-y-2 cursor-pointer transition-all group"
                  title="Click to view Dealership details"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-xs text-[var(--text-main)] flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      <span>Where to Buy</span>
                    </div>
                    <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>View Dealership</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-1">
                    <div>
                      <div className="font-bold text-[var(--text-main)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {selected.dealership}
                      </div>
                      <div className="text-[11px] text-[var(--text-subtle)] font-mono">{selected.dealershipAddress}</div>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-[11px] text-[var(--text-subtle)]">Delivery Fee: </span>
                      <span className="font-bold font-mono text-[var(--text-main)]">$5,000</span>
                    </div>
                  </div>
                </div>

                {/* Warehouse Fleet Logistics Specifications */}
                {(selected.destinationsThatCanDeliver > 0 || selected.requiredDeliveryDriverSkill > 0) && (
                  <div className="p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-3">
                    <div className="font-bold text-xs text-[var(--text-main)] flex items-center gap-2">
                      <Truck className="w-4 h-4 text-indigo-500" />
                      <span>Warehouse Driver Specifications</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-[11px] text-[var(--text-subtle)]">Max Store Delivery Routes:</div>
                        <div className="font-bold font-mono text-sm text-[var(--text-main)] mt-0.5">
                          {selected.destinationsThatCanDeliver} Stores
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[var(--text-subtle)]">Required Driver Skill:</div>
                        <div className="font-bold font-mono text-sm text-[var(--text-main)] mt-0.5">
                          {selected.requiredDeliveryDriverSkill}% Logistics
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
                  placeholder="Search dealership or district..."
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
                        {count} models
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
                      {selectedDealerInventory.length} Showroom Models
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
                    Available Showroom Inventory
                  </div>

                  <div className="rounded-xl border border-[var(--border-base)] overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-[var(--bg-base)] border-b border-[var(--border-base)] text-[11px] text-[var(--text-subtle)] uppercase">
                          <th className="py-2.5 px-3 font-semibold">Vehicle</th>
                          <th className="py-2.5 px-3 font-semibold">Class</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Cargo</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Top Speed</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Price</th>
                          <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-subtle)]">
                        {selectedDealerInventory.map(v => (
                          <tr key={v.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-8 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] p-0.5 flex items-center justify-center shrink-0">
                                  {v.image ? (
                                    <img src={v.image} alt={v.name} className="w-full h-full object-contain" />
                                  ) : (
                                    <Truck className="w-3.5 h-3.5 text-[var(--text-subtle)]" />
                                  )}
                                </div>
                                <div>
                                  <span className="font-bold text-[var(--text-main)] block">{v.name}</span>
                                  {v.taxDeductible && (
                                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                                      Tax Deductible
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[var(--text-subtle)] capitalize">
                              {v.category.replace('_', ' ')}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[var(--text-main)]">
                              {v.maxCargoCapacity} <span className="text-[10px] font-normal text-[var(--text-subtle)]">boxes</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-[var(--text-main)]">
                              {v.maxSpeed} <span className="text-[10px] font-normal text-[var(--text-subtle)]">mph</span>
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
                                View Specs →
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
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--text-muted)]">Loading vehicle catalog...</div>}>
      <VehiclesContent />
    </Suspense>
  );
}
