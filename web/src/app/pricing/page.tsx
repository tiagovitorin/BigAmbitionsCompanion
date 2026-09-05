'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  BadgePercent, 
  Search, 
  Store, 
  ChevronDown, 
  ArrowUpDown, 
  Info,
  ExternalLink
} from 'lucide-react';

import rawItems from '@/data/items.json';
import rawNeighborhoods from '@/data/neighborhoods.json';
import rawBusinesses from '@/data/businesses.json';
import { calculateOptimalPrice } from '@/lib/engine';
import { useSettings } from '@/context/SettingsContext';

// Strict filter for actual merchandise and goods that players stock and sell to retail customers
const playableBusinesses = rawBusinesses.filter(b => b.spawn_customers && b.products && b.products.length > 0);

const retailProducts = rawItems.filter(i => {
  if (i.furniture_properties.is_furniture) return false;
  return i.cross_references.sold_in_businesses.length > 0 && i.financials.wholesale_price > 0;
}).sort((a, b) => a.name.localeCompare(b.name));

// The 7 playable NYC Districts
const playableDistricts = rawNeighborhoods.filter(n => n.id !== 'global');

type SortField = 'name' | 'cargo' | 'wholesale' | 'retail' | 'profit' | 'margin' | string;

export default function PricingPage() {
  const [search, setSearch] = useState('');
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('all');
  const [hasMonopoly, setHasMonopoly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortAsc, setSortAsc] = useState(true);

  const [businessDropdownOpen, setBusinessDropdownOpen] = useState(false);

  // Filter products by business type & search
  const filteredProducts = useMemo(() => {
    return retailProducts.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || item.id.toLowerCase().includes(search.toLowerCase());
      if (!matchesSearch) return false;

      if (selectedBusinessId !== 'all') {
        const isSoldInBiz = item.cross_references.sold_in_businesses.some(
          (b: any) => (b.business_id === selectedBusinessId || b.id === selectedBusinessId)
        );
        if (!isSoldInBiz) return false;
      }

      return true;
    });
  }, [search, selectedBusinessId]);

  // Handle column sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // 1. Calculate prices for filtered products (only recomputes when filter or monopoly changes)
  const pricedTableData = useMemo(() => {
    return filteredProducts.map(item => {
      const districtPrices: Record<string, { price: number; profit: number; margin: number }> = {};

      playableDistricts.forEach(district => {
        const res = calculateOptimalPrice({
          item: item as any,
          neighborhood: district as any,
          hasMonopoly
        });
        districtPrices[district.id] = {
          price: res.optimalPrice,
          profit: res.profitPerUnit,
          margin: res.marginPct
        };
      });

      const avgProfit = Object.values(districtPrices).reduce((acc, v) => acc + v.profit, 0) / playableDistricts.length;
      const avgMargin = Object.values(districtPrices).reduce((acc, v) => acc + v.margin, 0) / playableDistricts.length;

      return {
        item,
        districtPrices,
        avgProfit,
        avgMargin
      };
    });
  }, [filteredProducts, hasMonopoly]);

  // 2. Pure sort over already priced items (instantaneous, zero price recalculation)
  const sortedTableData = useMemo(() => {
    return [...pricedTableData].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        comparison = a.item.name.localeCompare(b.item.name);
      } else if (sortField === 'cargo') {
        comparison = (a.item.retail_properties.box_size || 1) - (b.item.retail_properties.box_size || 1);
      } else if (sortField === 'wholesale') {
        comparison = a.item.financials.wholesale_price - b.item.financials.wholesale_price;
      } else if (sortField === 'retail') {
        comparison = a.item.financials.default_market_price - b.item.financials.default_market_price;
      } else if (sortField === 'profit') {
        comparison = a.avgProfit - b.avgProfit;
      } else if (sortField === 'margin') {
        comparison = a.avgMargin - b.avgMargin;
      } else if (sortField in a.districtPrices) {
        comparison = a.districtPrices[sortField].price - b.districtPrices[sortField].price;
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [pricedTableData, sortField, sortAsc]);

  const selectedBusinessName = useMemo(() => {
    if (selectedBusinessId === 'all') return 'All Stores & Merchandise';
    const biz = playableBusinesses.find(b => b.id === selectedBusinessId);
    return biz ? biz.name : 'Select Store';
  }, [selectedBusinessId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
          <BadgePercent className="w-5 h-5 text-violet-500" />
          <span>Pricing &amp; Margins</span>
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Optimal selling prices and margins across all 7 NYC districts.
        </p>
      </div>

      {/* Filter and Business Selection Bar */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-[var(--text-subtle)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search merchandise (e.g. Phone, Coffee, Jewelry, Wine)..."
              className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[var(--text-main)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Business Type Custom Dropdown */}
          <div className="sm:col-span-4 relative">
            <button
              type="button"
              onClick={() => setBusinessDropdownOpen(!businessDropdownOpen)}
              className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] hover:border-violet-500 rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] font-semibold flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate">
                <Store className="w-4 h-4 text-violet-500 shrink-0" />
                <span className="truncate">{selectedBusinessName}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-[var(--text-subtle)] shrink-0 transition-transform ${businessDropdownOpen ? 'rotate-180 text-violet-500' : ''}`} />
            </button>

            {businessDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 p-1 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBusinessId('all');
                    setBusinessDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    selectedBusinessId === 'all'
                      ? 'bg-violet-500 text-white font-bold'
                      : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                  }`}
                >
                  <span>All Stores &amp; Merchandise</span>
                  <span className="text-[10px] opacity-80">{retailProducts.length} Products</span>
                </button>

                {playableBusinesses.map(biz => (
                  <button
                    key={biz.id}
                    type="button"
                    onClick={() => {
                      setSelectedBusinessId(biz.id);
                      setBusinessDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      biz.id === selectedBusinessId
                        ? 'bg-violet-500 text-white font-bold'
                        : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                    }`}
                  >
                    <span>{biz.name}</span>
                    <span className={`text-[10px] ${biz.id === selectedBusinessId ? 'text-white/80' : 'text-[var(--text-subtle)]'}`}>
                      {biz.products.length} items
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Monopoly Advantage Toggle (Directly with Filters) */}
          <div className="sm:col-span-3">
            <button
              type="button"
              onClick={() => setHasMonopoly(!hasMonopoly)}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                hasMonopoly
                  ? 'bg-violet-500/10 border-violet-500 text-violet-700 dark:bg-[var(--primary-bg)] dark:border-[var(--primary)] dark:text-[var(--primary)] shadow-xs'
                  : 'bg-[var(--bg-base)] border-[var(--border-base)] text-[var(--text-muted)] hover:border-[var(--border-strong)] hover:text-[var(--text-main)]'
              }`}
            >
              <span>Monopoly (+30%)</span>
              <span className={`w-2 h-2 rounded-full ${hasMonopoly ? 'bg-violet-500 dark:bg-[var(--primary)] animate-pulse' : 'bg-slate-400'}`} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[var(--text-subtle)] pt-2 border-t border-[var(--border-subtle)]">
          <span className="font-medium text-[var(--text-muted)]">Selling prices shown ensure 100% price satisfaction</span>
          <span className="font-mono font-semibold text-[var(--text-muted)]">
            Showing {sortedTableData.length} of {retailProducts.length} items
          </span>
        </div>
      </div>

      {/* Main Pricing Matrix Table */}
      <div id="pricing-table-pane" className="overflow-x-auto rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            {/* Group Header Row */}
            <tr className="border-b border-[var(--border-base)] bg-[var(--bg-base)] text-[10px] uppercase font-bold tracking-wider text-[var(--text-subtle)]">
              <th colSpan={4} className="py-2.5 px-4 border-r border-[var(--border-base)]">
                General Product Financials
              </th>
              <th colSpan={playableDistricts.length} className="py-2.5 px-4 text-center">
                Optimal Shelf Selling Prices by District
              </th>
            </tr>

            {/* Column Headers */}
            <tr className="border-b border-[var(--border-base)] bg-[var(--bg-surface)] font-semibold text-[var(--text-muted)]">
              {/* Name */}
              <th 
                onClick={() => handleSort('name')}
                className="py-3 px-4 cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <span>Product Name</span>
                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)]" />
                </div>
              </th>

              {/* Cargo Pack */}
              <th 
                onClick={() => handleSort('cargo')}
                className="py-3 px-3 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Pack Size</span>
                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)]" />
                </div>
              </th>

              {/* Wholesale Cost */}
              <th 
                onClick={() => handleSort('wholesale')}
                className="py-3 px-3 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Wholesale</span>
                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)]" />
                </div>
              </th>

              {/* Base Market Price */}
              <th 
                onClick={() => handleSort('retail')}
                className="py-3 px-4 text-right border-r border-[var(--border-base)] cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Base Market</span>
                  <ArrowUpDown className="w-3 h-3 text-[var(--text-subtle)]" />
                </div>
              </th>

              {/* 7 Playable Districts */}
              {playableDistricts.map(district => (
                <th
                  key={district.id}
                  onClick={() => handleSort(district.id)}
                  className="py-3 px-3 text-right cursor-pointer hover:text-[var(--text-main)] transition-colors whitespace-nowrap"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>{district.name}</span>
                    <ArrowUpDown className="w-2.5 h-2.5 text-[var(--text-subtle)]" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-[var(--border-subtle)]">
            {sortedTableData.length > 0 ? (
              sortedTableData.map(({ item, districtPrices }) => {
                const boxUnits = item.retail_properties.box_size || 1;
                return (
                  <tr 
                    key={item.id}
                    className="hover:bg-[var(--bg-surface-hover)] transition-colors"
                  >
                    {/* Item Name with Cross-Link to /items */}
                    <td className="py-3 px-4 font-bold text-[var(--text-main)] whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/items?search=${encodeURIComponent(item.name)}`}
                          className="hover:text-violet-500 hover:underline transition-colors flex items-center gap-1 group"
                          title={`Inspect ${item.name} specifications, wholesale suppliers, and recipes`}
                        >
                          <span>{item.name}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-violet-500" />
                        </Link>
                        {item.cross_references.sold_in_businesses.length > 3 ? (
                          <span 
                            title={item.cross_references.sold_in_businesses.map((b: any) => b.business_name || b.name).join(', ')}
                            className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-subtle)]"
                          >
                            {item.cross_references.sold_in_businesses.length} Stores
                          </span>
                        ) : item.cross_references.sold_in_businesses.length > 0 ? (
                          <span className="text-[10px] font-normal text-[var(--text-subtle)]">
                            ({item.cross_references.sold_in_businesses.map((b: any) => b.business_name || b.name).join(', ')})
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Pack Box Size */}
                    <td className="py-3 px-3 text-right font-mono text-[var(--text-muted)] whitespace-nowrap">
                      {boxUnits.toLocaleString()} units
                    </td>

                    {/* Wholesale */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-rose-500 whitespace-nowrap">
                      ${item.financials.wholesale_price.toFixed(2)}
                    </td>

                    {/* Base Market Price */}
                    <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--text-muted)] border-r border-[var(--border-base)] whitespace-nowrap">
                      ${item.financials.default_market_price.toFixed(2)}
                    </td>

                    {/* District Optimal Prices */}
                    {playableDistricts.map(district => {
                      const opt = districtPrices[district.id];
                      return (
                        <td
                          key={district.id}
                          className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap"
                        >
                          <div>${opt.price.toFixed(2)}</div>
                          <div className="text-[9px] text-[var(--text-subtle)] font-normal">
                            +${opt.profit.toFixed(2)} ({opt.margin.toFixed(0)}%)
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={11} className="py-12 text-center text-[var(--text-subtle)]">
                  No sellable merchandise matches your query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}