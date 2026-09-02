'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Truck, 
  Search, 
  MapPin, 
  Package, 
  Ship, 
  Store, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle, 
  Building2,
  ExternalLink,
  Layers,
  ChevronRight
} from 'lucide-react';

import { SUPPLIERS_DB, SupplierDefinition } from '@/data/suppliers';

function SuppliersContent() {
  const searchParams = useSearchParams();
  const selectedSupplierId = searchParams.get('id') || '';
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  const filteredSuppliers = useMemo(() => {
    return SUPPLIERS_DB.filter(s => {
      if (filterType !== 'all' && s.type !== filterType) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          s.name.toLowerCase().includes(q) ||
          s.district.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.categories.some(c => c.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [filterType, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
          <Truck className="w-5 h-5 text-indigo-500" />
          <span>Suppliers &amp; Importers</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-subtle)] font-normal ml-1">
            {SUPPLIERS_DB.length} Vendors
          </span>
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Vendor directories, delivery contracts, and ocean harbor import ports.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-4">
        {/* Type Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All Suppliers & Ports' },
            { id: 'Wholesaler', label: 'District Wholesalers (Contracts)' },
            { id: 'Importer', label: 'Ocean Port Importers (Warehouse)' },
            { id: 'Retail Equipment Vendor', label: 'Equipment & Fixture Stores' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                filterType === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-[var(--bg-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-subtle)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by supplier name, district, address, or item category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl pl-10 pr-4 py-2 text-xs text-[var(--text-main)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Supplier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        {filteredSuppliers.map((supplier, idx) => {
          const isHighlighted = selectedSupplierId === supplier.id;
          const isBelowFold = idx >= 6;

          return (
            <div
              key={supplier.id}
              style={isBelowFold ? { contentVisibility: 'auto', containIntrinsicSize: 'auto none auto 260px' } : undefined}
              className={`p-5 rounded-2xl bg-[var(--bg-surface)] border shadow-sm space-y-4 transition-all flex flex-col justify-between ${
                isHighlighted
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-500/5'
                  : 'border-[var(--border-base)] hover:border-indigo-500/40'
              }`}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-1.5">
                      {supplier.type === 'Importer' ? (
                        <Ship className="w-4 h-4 text-[var(--sky-accent)] shrink-0" />
                      ) : supplier.type === 'Wholesaler' ? (
                        <Truck className="w-4 h-4 text-[var(--indigo-accent)] shrink-0" />
                      ) : (
                        <Store className="w-4 h-4 text-[var(--amber-accent)] shrink-0" />
                      )}
                      <span>{supplier.name}</span>
                    </h3>
                    <div className="text-[11px] text-[var(--text-subtle)] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-[var(--rose-accent)] shrink-0" />
                      <span>{supplier.address}, {supplier.district}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tight ${
                    supplier.type === 'Importer'
                      ? 'bg-[var(--sky-bg)] text-[var(--sky-accent)] border border-[var(--sky-border)]'
                      : supplier.type === 'Wholesaler'
                      ? 'bg-[var(--indigo-bg)] text-[var(--indigo-accent)] border border-[var(--indigo-border)]'
                      : 'bg-[var(--amber-bg)] text-[var(--amber-accent)] border border-[var(--amber-border)]'
                  }`}>
                    {supplier.type}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  {supplier.description}
                </p>

                {/* Logistics Specs Grid */}
                <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-subtle)]">Delivery Protocol:</span>
                    <span className="font-semibold text-[var(--text-main)]">{supplier.deliveryMethod}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[var(--text-subtle)]">Purchasing Agent:</span>
                    <span className={`font-semibold ${supplier.requiresPurchasingAgent ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {supplier.requiresPurchasingAgent ? 'Required at HQ' : 'Not Required (Direct Contract)'}
                    </span>
                  </div>

                  {supplier.minOrderRequirement && (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-subtle)]">Capacity Limit:</span>
                      <span className="font-mono font-semibold text-[var(--text-main)]">{supplier.minOrderRequirement}</span>
                    </div>
                  )}
                </div>

                {/* Offerings & Categories */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-[var(--text-subtle)] uppercase font-bold tracking-wider">Catalog &amp; Offerings:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {supplier.categories.map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-[11px] text-[var(--text-muted)] font-medium"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Links */}
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <Link
                  href={`/items?tab=${supplier.type === 'Retail Equipment Vendor' ? 'furniture' : 'wholesale'}&supplier=${encodeURIComponent(supplier.id)}`}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>Browse Catalog Goods</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>

                {supplier.type === 'Retail Equipment Vendor' && (
                  <Link
                    href="/builder"
                    className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <span>Store Builder</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SuppliersLoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-6 w-56 bg-[var(--bg-surface)] rounded-lg" />
        <div className="h-4 w-80 bg-[var(--bg-surface)] rounded-lg mt-2" />
      </div>
      <div className="h-28 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)]" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)]" />
        ))}
      </div>
    </div>
  );
}

export default function SuppliersPage() {
  return (
    <Suspense fallback={<SuppliersLoadingSkeleton />}>
      <SuppliersContent />
    </Suspense>
  );
}
