'use client';

import { useState } from 'react';
import {
  Store,
  DollarSign,
  TrendingUp,
  Sparkles,
  MapPin,
  Building,
  ChevronDown,
  Layers,
  Boxes
} from 'lucide-react';
import { LiveBusinessData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import StoresTable, { StoreSortBy } from './StoresTable';
import StoresGrid from './StoresGrid';

const STORE_PAGE_SIZE = 25;

export default function StoresView({ businesses }: { businesses: LiveBusinessData[] }) {
  const { t } = useTranslation();
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [storeDistrictFilter, setStoreDistrictFilter] = useState('all');
  const [storeTypeFilter, setStoreTypeFilter] = useState('all');
  const [storeStatusFilter, setStoreStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  const [storeViewMode, setStoreViewMode] = useState<'table' | 'grid'>('table');
  const [storeSortBy, setStoreSortBy] = useState<StoreSortBy>('sales');
  const [storeSortOrder, setStoreSortOrder] = useState<'asc' | 'desc'>('desc');
  const [storePage, setStorePage] = useState(1);
  const [storeDistrictDropdownOpen, setStoreDistrictDropdownOpen] = useState(false);
  const [storeTypeDropdownOpen, setStoreTypeDropdownOpen] = useState(false);
  const [storeStatusDropdownOpen, setStoreStatusDropdownOpen] = useState(false);

  const districts = Array.from(new Set(businesses.map(b => b.district).filter(Boolean))).sort();
  const storeTypes = Array.from(new Set(businesses.map(b => b.type).filter(Boolean))).sort();

  const filteredStores = businesses.filter(b => {
    const matchesSearch = !storeSearchQuery ||
      b.name.toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
      (b.address || '').toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
      (b.district || '').toLowerCase().includes(storeSearchQuery.toLowerCase()) ||
      (b.type || '').toLowerCase().includes(storeSearchQuery.toLowerCase());

    const matchesDistrict = storeDistrictFilter === 'all' || b.district === storeDistrictFilter;
    const matchesType = storeTypeFilter === 'all' || b.type === storeTypeFilter;
    const matchesStatus = storeStatusFilter === 'all' ||
      (storeStatusFilter === 'open' && b.isOpenNow) ||
      (storeStatusFilter === 'closed' && !b.isOpenNow);

    return matchesSearch && matchesDistrict && matchesType && matchesStatus;
  });

  const sortedStores = [...filteredStores].sort((a, b) => {
    let comp = 0;
    if (storeSortBy === 'name') comp = a.name.localeCompare(b.name);
    else if (storeSortBy === 'sales') comp = (a.weeklyRevenue || 0) - (b.weeklyRevenue || 0);
    else if (storeSortBy === 'profit') comp = (a.weeklyProfit || 0) - (b.weeklyProfit || 0);
    else if (storeSortBy === 'satisfaction') comp = (a.customerSatisfaction || 0) - (b.customerSatisfaction || 0);
    else if (storeSortBy === 'staff') comp = (a.staffOnDuty || 0) - (b.staffOnDuty || 0);
    else if (storeSortBy === 'health') {
      const aStockouts = (a.retailPrices || []).filter(p => !p.isServiceProduct && !(p.rawItemName || '').includes('fee') && !(p.rawItemName || '').includes('hourly') && !(p.rawItemName || '').includes('charge') && !(p.rawItemName || '').includes('ticket') && (p as any).inStoreStock === 0).length;
      const bStockouts = (b.retailPrices || []).filter(p => !p.isServiceProduct && !(p.rawItemName || '').includes('fee') && !(p.rawItemName || '').includes('hourly') && !(p.rawItemName || '').includes('charge') && !(p.rawItemName || '').includes('ticket') && (p as any).inStoreStock === 0).length;
      comp = aStockouts - bStockouts;
    }
    return storeSortOrder === 'desc' ? -comp : comp;
  });

  const totalStorePages = Math.ceil(sortedStores.length / STORE_PAGE_SIZE) || 1;
  const currentStorePage = Math.min(storePage, totalStorePages);
  const paginatedStores = sortedStores.slice((currentStorePage - 1) * STORE_PAGE_SIZE, currentStorePage * STORE_PAGE_SIZE);

  const totalWeeklySales = businesses.reduce((acc, b) => acc + (b.weeklyRevenue || 0), 0);
  const totalWeeklyProfits = businesses.reduce((acc, b) => acc + (b.weeklyProfit || 0), 0);
  const openStoresCount = businesses.filter(b => b.isOpenNow).length;
  const averageSatisfaction = Math.round(businesses.reduce((acc, b) => acc + (b.customerSatisfaction || 0), 0) / (businesses.length || 1));

  const handleSort = (field: StoreSortBy) => {
    if (storeSortBy === field) {
      setStoreSortOrder(storeSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setStoreSortBy(field);
      setStoreSortOrder(field === 'name' ? 'asc' : 'desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. EXECUTIVE STOREFRONTS KPI RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.activeCommercialPortfolio')}</span>
            <Store className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-[var(--text-main)]">
            {businesses.length} <span className="text-xs font-normal text-[var(--text-subtle)]">{t('liveHq.storefronts')}</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>{t('liveHq.currentlyTrading')}</span>
            <strong className="font-mono text-emerald-600 dark:text-emerald-400">{openStoresCount} {t('liveHq.openNow')}</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.totalWeeklyRevenue')}</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            ${totalWeeklySales.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>{t('liveHq.averagePerStore')}</span>
            <strong className="font-mono text-[var(--text-main)]">${Math.round(totalWeeklySales / (businesses.length || 1)).toLocaleString()}/wk</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.weeklyOperatingProfit')}</span>
            <TrendingUp className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400">
            ${totalWeeklyProfits.toLocaleString()}
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>{t('liveHq.netCommercialMargin')}</span>
            <strong className="font-mono text-sky-500">{totalWeeklySales > 0 ? Math.round((totalWeeklyProfits / totalWeeklySales) * 100) : 0}%</strong>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.customerSatisfaction')}</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-500">
            {averageSatisfaction}% <span className="text-xs font-normal text-[var(--text-subtle)]">{t('liveHq.avgScore')}</span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
            <span>{t('liveHq.activeStaffOnDuty')}</span>
            <strong className="font-mono text-[var(--text-main)]">{businesses.reduce((sum, b) => sum + (b.staffOnDuty || 0), 0)} {t('liveHq.cashiersStaff')}</strong>
          </div>
        </div>
      </div>

      {/* 2. FILTER & CONTROLS TOOLBAR */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder={t('liveHq.storeSearchPlaceholder')}
              value={storeSearchQuery}
              onChange={(e) => {
                setStoreSearchQuery(e.target.value);
                setStorePage(1);
              }}
              className="w-full px-3.5 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* District Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setStoreDistrictDropdownOpen(!storeDistrictDropdownOpen);
                  setStoreTypeDropdownOpen(false);
                  setStoreStatusDropdownOpen(false);
                }}
                className="bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] hover:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-[var(--text-main)] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="truncate max-w-28">{storeDistrictFilter === 'all' ? t('liveHq.allDistricts') : storeDistrictFilter}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] transition-transform ${storeDistrictDropdownOpen ? 'rotate-180 text-emerald-500' : ''}`} />
              </button>

              {storeDistrictDropdownOpen && (
                <div className="absolute top-full right-0 mt-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl overflow-hidden min-w-48 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 p-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => { setStoreDistrictFilter('all'); setStoreDistrictDropdownOpen(false); setStorePage(1); }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      storeDistrictFilter === 'all' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                    }`}
                  >
                    <span>{t('liveHq.allDistricts')}</span>
                    <span className="text-[10px] opacity-80">{businesses.length}</span>
                  </button>
                  {districts.map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => { setStoreDistrictFilter(d); setStoreDistrictDropdownOpen(false); setStorePage(1); }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        storeDistrictFilter === d ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                      }`}
                    >
                      <span className="truncate">{d}</span>
                      <span className="text-[10px] opacity-80">{businesses.filter(b => b.district === d).length}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Type Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setStoreTypeDropdownOpen(!storeTypeDropdownOpen);
                  setStoreDistrictDropdownOpen(false);
                  setStoreStatusDropdownOpen(false);
                }}
                className="bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] hover:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-[var(--text-main)] font-semibold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Building className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate max-w-28">{storeTypeFilter === 'all' ? t('liveHq.allTypes') : storeTypeFilter}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] transition-transform ${storeTypeDropdownOpen ? 'rotate-180 text-emerald-500' : ''}`} />
              </button>

              {storeTypeDropdownOpen && (
                <div className="absolute top-full right-0 mt-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl overflow-hidden min-w-56 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 p-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => { setStoreTypeFilter('all'); setStoreTypeDropdownOpen(false); setStorePage(1); }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      storeTypeFilter === 'all' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                    }`}
                  >
                    <span>{t('liveHq.allBusinessTypes')}</span>
                    <span className="text-[10px] opacity-80">{businesses.length}</span>
                  </button>
                  {storeTypes.map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => { setStoreTypeFilter(t); setStoreTypeDropdownOpen(false); setStorePage(1); }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        storeTypeFilter === t ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                      }`}
                    >
                      <span className="truncate">{t}</span>
                      <span className="text-[10px] opacity-80">{businesses.filter(b => b.type === t).length}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Status Filter */}
            <div className="flex items-center bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl p-0.5 text-xs">
              <button
                onClick={() => { setStoreStatusFilter('all'); setStorePage(1); }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  storeStatusFilter === 'all' ? 'bg-emerald-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {t('liveHq.allCount', 'All ({count})').replace('{count}', businesses.length.toString())}
              </button>
              <button
                onClick={() => { setStoreStatusFilter('open'); setStorePage(1); }}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                  storeStatusFilter === 'open' ? 'bg-emerald-600 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                {t('liveHq.openCount', 'Open ({count})').replace('{count}', openStoresCount.toString())}
              </button>
            </div>

            {/* View Mode Toggle (Table vs Grid) */}
            <div className="flex items-center bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl p-0.5 text-xs ml-auto">
              <button
                onClick={() => setStoreViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  storeViewMode === 'table' ? 'bg-emerald-600 text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
                title={t('liveHq.denseTableView')}
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setStoreViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  storeViewMode === 'grid' ? 'bg-emerald-600 text-white shadow-xs' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
                title={t('liveHq.cardGridView')}
              >
                <Boxes className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Counter */}
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-subtle)]">
          <span>
            {t('liveHq.showingPrefix')} <strong className="text-[var(--text-main)] font-mono">{paginatedStores.length}</strong> {t('liveHq.showingStoresSuffix', 'of {total} stores').replace('{total}', filteredStores.length.toString())} {filteredStores.length !== businesses.length && t('liveHq.filteredFromTotal', '(filtered from {total} total)').replace('{total}', businesses.length.toString())}
          </span>
          {(storeSearchQuery || storeDistrictFilter !== 'all' || storeTypeFilter !== 'all' || storeStatusFilter !== 'all') && (
            <button
              onClick={() => {
                setStoreSearchQuery('');
                setStoreDistrictFilter('all');
                setStoreTypeFilter('all');
                setStoreStatusFilter('all');
                setStorePage(1);
              }}
              className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
            >
              {t('liveHq.resetAllFilters')}
            </button>
          )}
        </div>
      </div>

      {/* 3. DENSE HIGH-CAPACITY TABLE VIEW (DEFAULT FOR 100+ STORES) */}
      {storeViewMode === 'table' ? (
        <StoresTable
          paginatedStores={paginatedStores}
          totalStorePages={totalStorePages}
          currentStorePage={currentStorePage}
          onPageChange={setStorePage}
          storeSortBy={storeSortBy}
          storeSortOrder={storeSortOrder}
          onSort={handleSort}
        />
      ) : (
        <StoresGrid
          paginatedStores={paginatedStores}
          totalStorePages={totalStorePages}
          currentStorePage={currentStorePage}
          onPageChange={setStorePage}
        />
      )}
    </div>
  );
}
