'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { 
  BadgePercent, 
  Factory, 
  Store, 
  ArrowRight, 
  Building, 
  Package, 
  Activity, 
  Radio, 
  Boxes,
  Users,
  LayoutGrid,
  Truck,
  Megaphone
} from 'lucide-react';

import rawBusinesses from '@/data/businesses.json';
import rawItems from '@/data/items.json';
import rawRecipes from '@/data/recipes.json';
import rawBuildings from '@/data/buildings.json';
import rawNeighborhoods from '@/data/neighborhoods.json';

export default function LandingPage() {
  const playerBusinesses = useMemo(() => {
    return rawBusinesses.filter(b => b.spawn_customers && b.products.length > 0);
  }, []);

  const validNeighborhoods = useMemo(() => {
    return rawNeighborhoods.filter(n => n.id !== 'global');
  }, []);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10">
      {/* Hero Banner with Smooth Cohesive Dark Slate Styling */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white p-6 sm:p-9 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="max-w-xl space-y-3 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-indigo-300 border border-slate-700 text-xs font-semibold">
            <span>Big Ambitions Companion</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Planning &amp; Game Reference
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Store schedule planning, factory supply chains, selling price optimization, complete item databases, and live companion mod sync.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <Link
              href="/businesses"
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <span>Store Planner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/items"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 text-amber-400" />
              <span>Items Database</span>
            </Link>
          </div>
        </div>

        {/* Uncle Fred Character (Desktop & Tablet Hero) */}
        <div className="hidden md:flex shrink-0 items-end justify-end -mb-6 sm:-mb-9 -mr-6 sm:-mr-9 pointer-events-none z-10">
          <div className="w-64 lg:w-72 drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]">
            <img 
              src="/images/unclefred.png" 
              alt="Uncle Fred" 
              className="w-full h-auto object-contain pointer-events-none select-none"
            />
          </div>
        </div>
      </div>

      {/* Live Sync Spotlight Card */}
      <Link
        href="/live-sync"
        className="block p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-emerald-500/30 hover:border-emerald-500 transition-all shadow-xs group cursor-pointer"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-[var(--text-main)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                <span>Live Game HQ</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Companion Mod
                </span>
              </h2>
              <p className="text-xs text-[var(--text-muted)] max-w-2xl leading-relaxed">
                Connect directly to your active game session over local WebSocket to track bank balance, warehouse stock alerts, employee skill levels, and pricing recommendations.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 sm:self-center">
            <span>Open Live HQ</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>

      {/* Planning Tools Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[var(--text-main)]">Planning Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Businesses */}
          <Link
            href="/businesses"
            className="p-5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] hover:border-emerald-500/50 hover:shadow-md hover:shadow-emerald-500/5 transition-all flex flex-col justify-between group cursor-pointer"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-[var(--text-main)] group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Businesses
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
                  7-day schedule matrix, customer rush hours, and fixture shopping lists for all store types.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-between">
              <span>{playerBusinesses.length} Store Types</span>
              <span>Open Simulator →</span>
            </div>
          </Link>

          {/* Builder */}
          <Link
            href="/builder"
            className="p-5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] hover:border-sky-500/50 hover:shadow-md hover:shadow-sky-500/5 transition-all flex flex-col justify-between group cursor-pointer"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-[var(--text-main)] group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Store &amp; Office Builder
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
                  Calculate minimum square meters, display shelves, checkout counters, and setup equipment costs.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-[10px] text-sky-600 dark:text-sky-400 font-semibold flex items-center justify-between">
              <span>Fixture Calculator</span>
              <span>Open Builder →</span>
            </div>
          </Link>

          {/* Selling Prices */}
          <Link
            href="/pricing"
            className="p-5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] hover:border-amber-500/50 hover:shadow-md hover:shadow-amber-500/5 transition-all flex flex-col justify-between group cursor-pointer"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <BadgePercent className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-[var(--text-main)] group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Selling Prices
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
                  Find optimal retail prices per district, calculate profit ceilings, and check customer satisfaction.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center justify-between">
              <span>District Elasticity</span>
              <span>Open Pricing →</span>
            </div>
          </Link>

          {/* Factory Planner */}
          <Link
            href="/factories"
            className="p-5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] hover:border-indigo-500/50 hover:shadow-md hover:shadow-indigo-500/5 transition-all flex flex-col justify-between group cursor-pointer"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Factory className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-[var(--text-main)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Factory Planner
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
                  Manufacturing profits, make-vs-buy savings, required pallet shelves, and delivery logistics.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center justify-between">
              <span>{rawRecipes.length} Recipes</span>
              <span>Open Planner →</span>
            </div>
          </Link>

          {/* Marketing Planner */}
          <Link
            href="/marketing"
            className="p-5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] hover:border-indigo-500/50 hover:shadow-md hover:shadow-indigo-500/5 transition-all flex flex-col justify-between group cursor-pointer"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-[var(--text-main)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Marketing Planner
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
                  Optimize internet &amp; billboard campaigns for 100% store promotion with lowest daily costs.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold flex items-center justify-between">
              <span>Campaign Optimizer</span>
              <span>Open Planner →</span>
            </div>
          </Link>

          {/* Suppliers */}
          <Link
            href="/suppliers"
            className="p-5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] hover:border-teal-500/50 hover:shadow-md hover:shadow-teal-500/5 transition-all flex flex-col justify-between group cursor-pointer"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-[var(--text-main)] group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  Wholesale Suppliers
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-1 leading-relaxed">
                  District wholesalers, delivery contracts, purchasing agents, and ocean harbor import terminals.
                </p>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] text-[10px] text-teal-600 dark:text-teal-400 font-semibold flex items-center justify-between">
              <span>15 Wholesale Ports</span>
              <span>Browse Catalog →</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Database Archives */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-[var(--text-main)]">Databases</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/items"
            className="p-5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] hover:border-amber-500/50 transition-all flex items-start gap-4 group cursor-pointer shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-[var(--text-main)] group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Items &amp; Goods
                </h3>
                <span className="text-[10px] font-mono text-[var(--text-subtle)]">{rawItems.length} items</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Retail goods, wholesale prices, store furniture, and manufacturing ingredients.
              </p>
            </div>
          </Link>

          <Link
            href="/real-estate"
            className="p-5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] hover:border-violet-500/50 transition-all flex items-start gap-4 group cursor-pointer shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-[var(--text-main)] group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  Real Estate
                </h3>
                <span className="text-[10px] font-mono text-[var(--text-subtle)]">{rawBuildings.length} properties</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                All 885 properties in New York with square meters, customer capacity, and rent costs.
              </p>
            </div>
          </Link>

          <Link
            href="/vehicles"
            className="p-5 rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] hover:border-sky-500/50 transition-all flex items-start gap-4 group cursor-pointer shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-[var(--text-main)] group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Vehicles &amp; Fleet
                </h3>
                <span className="text-[10px] font-mono text-[var(--text-subtle)]">20 vehicles</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Commercial warehouse trucks, delivery vans, luxury supercars, and dealership specs.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}