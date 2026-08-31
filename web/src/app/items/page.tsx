'use client';

import { useState, useMemo, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Package, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Store, 
  Factory, 
  Boxes, 
  Layers, 
  ArrowUpRight, 
  Filter, 
  BadgePercent, 
  ArrowUpDown, 
  Truck, 
  Refrigerator,
  LayoutGrid,
  X
} from 'lucide-react';

import rawItems from '@/data/items.json';
import purchaseMatrixRaw from '@/data/purchase_matrix.json';
import { SUPPLIERS_DB } from '@/data/suppliers';
import gameIconsRaw from '@/data/game_item_icons.json';

const gameIcons: Record<string, string> = gameIconsRaw;
const purchaseMatrix: Record<string, { boxSize: number; suppliers: { supplier: string; pricePerBox: number }[] }> = purchaseMatrixRaw;

function getItemImageUrl(item: any): string | null {
  if (!item) return null;
  const name = typeof item === 'string' ? item : item.name || '';
  const cleanId = (typeof item === 'object' && item.id ? item.id : name.toLowerCase().replace(/[^a-z0-9]/g, ''));
  
  // Direct match from official extracted high-res game icons with transparent alpha
  if (gameIcons[cleanId]) return gameIcons[cleanId];
  if (gameIcons[name.toLowerCase().replace(/[^a-z0-9]/g, '')]) return gameIcons[name.toLowerCase().replace(/[^a-z0-9]/g, '')];

  return null;
}

type CategoryTab = 'retail' | 'wholesale' | 'crafting' | 'furniture' | 'all';
type SortOption = 'default' | 'margin_desc' | 'wholesale_asc' | 'retail_desc' | 'name_asc';

// Helper mapping for display shelves based on product category / characteristics
function getProductFixtureInfo(item: any): string {
  const name = item.name.toLowerCase();
  if (name.includes('wine') || name.includes('whisky') || name.includes('beer')) return 'Wooden Wine Shelf Display';
  if (name.includes('cigar') || name.includes('cigarette')) return 'Secured Tobacco Shelf';
  if (name.includes('clothing') || name.includes('female') || name.includes('male')) return 'Clothing Garment Rack';
  if (name.includes('book') || name.includes('novel') || name.includes('manual')) return 'Wooden Bookshelf Stand';
  if (name.includes('jewelry')) return 'Illuminated Jewelry Floor Showcase';
  if (name.includes('flower')) return 'Tiered Fresh Flower Stand';
  if (name.includes('fresh food') || name.includes('frozen food') || name.includes('ice cream') || name.includes('energy drink') || name.includes('soda')) return 'Cold Storage Display Cooler';
  if (name.includes('phone') || name.includes('smartwatch') || name.includes('earbuds') || name.includes('headphones')) return 'Product Display Table';
  if (name.includes('croissant') || name.includes('cupcake') || name.includes('donut') || name.includes('cotton candy') || name.includes('popcorn')) return 'Glass Bakery Showcase Display';
  if (name.includes('coffee') || name.includes('tea')) return 'Industrial Espresso Machine';
  if (name.includes('apple') || name.includes('banana') || name.includes('carrot') || name.includes('tomato') || name.includes('lettuce') || name.includes('pear')) return 'Display Stand (Wooden) / Product Crate';
  if (name.includes('hair care')) return 'Hair Stylist Product Wall Shelf';
  if (name.includes('gift') || name.includes('umbrella')) return 'Rounded Deluxe Gift Shelf';
  if (item.type === 'ServiceProduct') return 'Counter / Reception Station';
  return 'Standard Storage Shelf';
}

interface SupplierMatch {
  name: string;
  id: string;
  pricePerBox?: number;
  isImporter: boolean;
}

// Supplier ID lookup from in-game supplier names
const SUPPLIER_ID_MAP: Record<string, string> = {
  'Metro Wholesale': 'metro-wholesale',
  'NY Distro inc': 'ny-distro-inc',
  'Total Produce Trading': 'total-produce-trading',
  'Hudson Wholesale': 'hudson-wholesale',
  'Stockco': 'stockco',
  'Titans Of Industry Supply': 'titans-of-industry-supply',
  'JetCargo Imports': 'jetcargo-imports',
  'SeaSide Internationals': 'seaside-internationals',
  'United Ocean Import': 'united-ocean-import',
  'BlueStone Imports': 'bluestone-imports',
  'Maritime Freight Line': 'maritime-freight-line',
  'Aquatic Bay Cargo': 'aquatic-bay-cargo',
  'Lunar Tide Shipments': 'lunar-tide-shipments',
  'Global Harvest Traders': 'global-harvest-traders',
  'Square Appliances & Displays': 'square-appliances',
  'AJ Pederson & Sons': 'aj-pederson-sons',
  'IKEA / City Furniture': 'ikea-city-furniture',
  'City Office Supplies': 'city-office-supplies'
};

function getFurnitureVendorInfo(item: any): { name: string; id: string; district: string } {
  const name = item.name.toLowerCase();
  
  // Electronics, Registers, Counters, POS, Lockers, Uniform stations, Security Cameras
  if (
    name.includes('locker') ||
    name.includes('uniform') ||
    name.includes('register') || 
    name.includes('counter') || 
    name.includes('checkout') || 
    name.includes('computer') || 
    name.includes('camera') || 
    name.includes('security') ||
    name.includes('card reader') ||
    name.includes('pos')
  ) {
    return {
      name: 'AJ Pederson & Sons',
      id: 'aj-pederson-sons',
      district: 'Garment District'
    };
  }

  // Kitchen appliances, Grills, Fryers, Display Coolers, Bakery cases, Coffee machines
  if (
    name.includes('appliance') ||
    name.includes('grill') ||
    name.includes('oven') ||
    name.includes('fryer') ||
    name.includes('fridge') ||
    name.includes('cooler') ||
    name.includes('showcase') ||
    name.includes('coffee machine') ||
    name.includes('espresso') ||
    name.includes('wine rack') ||
    name.includes('ice cream') ||
    name.includes('beverage cooler')
  ) {
    return {
      name: 'Square Appliances & Displays',
      id: 'square-appliances',
      district: "Hell's Kitchen"
    };
  }

  // Factory Machines & Industrial Assembly Lines
  if (
    item.type === 'FactoryMachine' ||
    name.includes('machine') ||
    name.includes('planter') ||
    name.includes('kiln') ||
    name.includes('assembly') ||
    name.includes('sewing') ||
    name.includes('blending') ||
    name.includes('polishing')
  ) {
    if (name.includes('baking') || name.includes('blending') || name.includes('bottling') || name.includes('food') || name.includes('planter')) {
      return {
        name: 'Square Appliances & Displays',
        id: 'square-appliances',
        district: "Hell's Kitchen"
      };
    }
    return {
      name: 'AJ Pederson & Sons',
      id: 'aj-pederson-sons',
      district: 'Garment District'
    };
  }

  // Office specific supplies: Tablets, Projectors, Loudspeakers, Graphic Tablets, Trash Bins
  if (
    name.includes('tablet') ||
    name.includes('speaker') ||
    name.includes('projector') ||
    name.includes('trash') ||
    name.includes('whiteboard') ||
    name.includes('office phone')
  ) {
    return {
      name: 'City Office Supplies',
      id: 'city-office-supplies',
      district: 'Midtown'
    };
  }

  // Default furniture: Tables, Desks, Chairs, Restroom stalls, Shelves, Sofas, Beds
  return {
    name: 'IKEA / City Furniture',
    id: 'ikea-city-furniture',
    district: "Hell's Kitchen"
  };
}

function getItemSuppliersList(item: any): SupplierMatch[] {
  // Check exact match in purchase matrix
  const matrixEntry = purchaseMatrix[item.name] || Object.entries(purchaseMatrix).find(([k]) => k.toLowerCase() === item.name.toLowerCase())?.[1];
  
  if (matrixEntry && matrixEntry.suppliers && matrixEntry.suppliers.length > 0) {
    return matrixEntry.suppliers.map(s => ({
      name: s.supplier,
      id: SUPPLIER_ID_MAP[s.supplier] || s.supplier.toLowerCase().replace(/\s+/g, '-'),
      pricePerBox: s.pricePerBox,
      isImporter: s.supplier.includes('Import') || s.supplier.includes('Cargo') || s.supplier.includes('Line') || s.supplier.includes('Internationals') || s.supplier.includes('Shipments') || s.supplier.includes('Traders')
    }));
  }

  // Services and direct labor (Lawyer, Graphic Designer, Web Dev, etc.) have no wholesale suppliers
  if (item.type === 'ServiceProduct' || item.type?.toLowerCase().includes('service')) {
    return [];
  }
  if (item.financials?.wholesale_price <= 0) {
    return [];
  }

  return [{ name: 'Metro Wholesale', id: 'metro-wholesale', isImporter: false }];
}

function ItemsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || searchParams.get('search') || '';
  const initialSupplier = searchParams.get('supplier') || 'all';
  const initialTab = (searchParams.get('tab') as CategoryTab) || (initialQuery ? 'all' : 'retail');

  const [activeTabState, setActiveTabState] = useState<CategoryTab>(initialTab);
  const [search, setSearch] = useState(initialQuery);
  const [selectedSupplier, setSelectedSupplier] = useState<string>(initialSupplier);
  const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZE = 36;
  const observerTarget = useRef<HTMLDivElement>(null);

  // Sync state when URL parameters change (e.g. from global search)
  useEffect(() => {
    const qParam = searchParams.get('q') || searchParams.get('search') || '';
    const tabParam = (searchParams.get('tab') as CategoryTab) || (qParam ? 'all' : 'retail');
    const suppParam = searchParams.get('supplier') || 'all';
    
    setSearch(qParam);
    setActiveTabState(tabParam);
    setSelectedSupplier(suppParam);
  }, [searchParams]);

  // Sync URL parameters when user changes filters/search
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (activeTabState !== 'retail') params.set('tab', activeTabState);
    if (selectedSupplier !== 'all') params.set('supplier', selectedSupplier);

    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [search, activeTabState, selectedSupplier]);

  const activeTab = activeTabState;

  // Reset pagination and auto-collapse expanded card when switching category submenus or searching
  useEffect(() => {
    setExpandedId(null);
    setPage(1);
  }, [activeTab, search, selectedSupplier, sortOption]);

  // Category title and subtitle mapping
  const categoryHeaderInfo: Record<CategoryTab, { title: string; subtitle: string; icon: any; color: string }> = {
    retail: {
      title: 'Retail Goods',
      subtitle: 'Products sold to customers across retail stores.',
      icon: Store,
      color: 'text-amber-500'
    },
    wholesale: {
      title: 'Wholesale Imports',
      subtitle: 'Commercial inventory from harbor and suppliers.',
      icon: Truck,
      color: 'text-indigo-500'
    },
    furniture: {
      title: 'Furniture & Fixtures',
      subtitle: 'Display shelves, registers, desks, and appliances.',
      icon: Boxes,
      color: 'text-sky-500'
    },
    crafting: {
      title: 'Crafting & Recipes',
      subtitle: 'Manufacturing ingredients and factory outputs.',
      icon: Factory,
      color: 'text-emerald-500'
    },
    all: {
      title: 'Items Database',
      subtitle: 'Master catalog of all 791 items in Big Ambitions.',
      icon: Layers,
      color: 'text-emerald-500'
    }
  };

  const currentCategory = categoryHeaderInfo[activeTab] || categoryHeaderInfo.retail;
  const CategoryIcon = currentCategory.icon;

  // Filter items based on selected category tab and optional supplier
  const categorizedItems = useMemo(() => {
    let list = rawItems;
    if (activeTab === 'retail') {
      list = list.filter(i => i.cross_references.sold_in_businesses.length > 0 && !i.furniture_properties.is_furniture);
    } else if (activeTab === 'wholesale') {
      list = list.filter(i => i.financials.wholesale_price > 0);
    } else if (activeTab === 'crafting') {
      list = list.filter(i => 
        i.type === 'FactoryMachine' || 
        i.type === 'Workstation' ||
        i.cross_references.produced_by_recipes.length > 0 || 
        i.cross_references.used_as_ingredient_in.length > 0
      );
    } else if (activeTab === 'furniture') {
      list = list.filter(i => i.furniture_properties.is_furniture || i.type === 'FactoryMachine' || i.type === 'Workstation');
    }

    // Apply Supplier Filter if specified
    if (selectedSupplier !== 'all') {
      list = list.filter(i => {
        const suppliers = getItemSuppliersList(i);
        return suppliers.some(s => s.id === selectedSupplier);
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(i => i.name.toLowerCase().includes(q) || i.id.toLowerCase().includes(q));
    }

    // Apply sorting
    const sorted = [...list];
    if (sortOption === 'margin_desc') {
      sorted.sort((a, b) => {
        const profitA = (a.financials.default_market_price || 0) - (a.financials.wholesale_price || 0);
        const marginA = a.financials.default_market_price > 0 ? profitA / a.financials.default_market_price : 0;
        const profitB = (b.financials.default_market_price || 0) - (b.financials.wholesale_price || 0);
        const marginB = b.financials.default_market_price > 0 ? profitB / b.financials.default_market_price : 0;
        return marginB - marginA;
      });
    } else if (sortOption === 'wholesale_asc') {
      sorted.sort((a, b) => (a.financials.wholesale_price || 0) - (b.financials.wholesale_price || 0));
    } else if (sortOption === 'retail_desc') {
      sorted.sort((a, b) => (b.financials.default_market_price || 0) - (a.financials.default_market_price || 0));
    } else if (sortOption === 'name_asc') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    }

    return sorted;
  }, [activeTab, search, sortOption, selectedSupplier]);

  const displayedItems = useMemo(() => {
    return categorizedItems.slice(0, page * PAGE_SIZE);
  }, [categorizedItems, page]);

  const hasMore = displayedItems.length < categorizedItems.length;

  // Auto lazy-loading via IntersectionObserver
  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries && entries[0]?.isIntersecting) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore]);

  const sortLabelMap: Record<SortOption, string> = {
    default: 'Default Sorting',
    margin_desc: 'Highest Margin %',
    wholesale_asc: 'Lowest Wholesale Price',
    retail_desc: 'Highest Retail Price',
    name_asc: 'Alphabetical (A-Z)'
  };

  const selectedSupplierDef = SUPPLIERS_DB.find(s => s.id === selectedSupplier);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
          <CategoryIcon className={`w-5 h-5 ${currentCategory.color}`} />
          <span>{currentCategory.title}</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-subtle)] font-normal ml-1">
            {categorizedItems.length} items
          </span>
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          {currentCategory.subtitle}
        </p>
      </div>

      {/* Main Filter & Sort Toolbar */}
      <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-3">
        {/* Active Supplier Filter Banner (If filtered) */}
        {selectedSupplier !== 'all' && (
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="text-[var(--text-main)]">
                Filtering catalog for: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{selectedSupplierDef?.name || selectedSupplier.replace(/-/g, ' ')}</strong>
                {selectedSupplierDef && <span className="text-[11px] text-[var(--text-subtle)] ml-1.5">({selectedSupplierDef.district} • {selectedSupplierDef.type})</span>}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSelectedSupplier('all')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Clear Filter (Show All)
            </button>
          </div>
        )}

        {/* Search Bar, Manual Supplier Selector & Sort Dropdown */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-[var(--text-subtle)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by product or item name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl pl-10 pr-9 py-2 text-xs text-[var(--text-main)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-amber-500"
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

          {/* Manual Supplier & Port Filter Dropdown */}
          <div className="sm:col-span-4 relative">
            <button
              type="button"
              onClick={() => {
                setSupplierDropdownOpen(!supplierDropdownOpen);
                setSortDropdownOpen(false);
              }}
              className={`w-full bg-[var(--bg-base)] border rounded-xl px-3.5 py-2 text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                selectedSupplier !== 'all'
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5'
                  : 'border-[var(--border-base)] hover:border-indigo-500 text-[var(--text-main)]'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Truck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">
                  {selectedSupplier === 'all' ? 'All Suppliers & Ports' : selectedSupplierDef?.name || selectedSupplier}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] shrink-0 transition-transform ${supplierDropdownOpen ? 'rotate-180 text-indigo-500' : ''}`} />
            </button>

            {supplierDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-1.5 space-y-1 max-h-80 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSupplier('all');
                    setSupplierDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    selectedSupplier === 'all'
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                  }`}
                >
                  <span>All Suppliers &amp; Ports</span>
                </button>

                <div className="px-2 pt-2 pb-1 text-[10px] uppercase font-bold tracking-wider text-[var(--text-subtle)]">
                  District Wholesalers
                </div>
                {SUPPLIERS_DB.filter(s => s.type === 'Wholesaler').map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedSupplier(s.id);
                      setSupplierDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      selectedSupplier === s.id
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] opacity-70 font-normal">{s.district}</span>
                  </button>
                ))}

                <div className="px-2 pt-2 pb-1 text-[10px] uppercase font-bold tracking-wider text-[var(--text-subtle)] border-t border-[var(--border-subtle)] mt-1">
                  Ocean Port Importers
                </div>
                {SUPPLIERS_DB.filter(s => s.type === 'Importer').map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedSupplier(s.id);
                      setSupplierDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      selectedSupplier === s.id
                        ? 'bg-sky-600 text-white font-bold'
                        : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] opacity-70 font-normal">{s.district}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="sm:col-span-3 relative">
            <button
              type="button"
              onClick={() => {
                setSortDropdownOpen(!sortDropdownOpen);
                setSupplierDropdownOpen(false);
              }}
              className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] hover:border-amber-500 rounded-xl px-3.5 py-2 text-xs text-[var(--text-main)] font-semibold flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 truncate">
                <ArrowUpDown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{sortLabelMap[sortOption]}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] shrink-0 transition-transform ${sortDropdownOpen ? 'rotate-180 text-amber-500' : ''}`} />
            </button>

            {sortDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-1 space-y-1">
                {(['default', 'margin_desc', 'wholesale_asc', 'retail_desc', 'name_asc'] as SortOption[]).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setSortOption(opt);
                      setSortDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      sortOption === opt
                        ? 'bg-amber-500 text-white font-bold'
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
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-start">
        {displayedItems.map((item) => {
          const isExpanded = expandedId === item.id;
          const isRetail = item.cross_references.sold_in_businesses.length > 0 && !item.furniture_properties.is_furniture;
          const isFurniture = item.furniture_properties.is_furniture;
          const isCraftable = item.cross_references.produced_by_recipes.length > 0;
          const wholesale = item.financials.wholesale_price || 0;
          const retail = item.financials.default_market_price || 0;
          const profit = retail > wholesale ? retail - wholesale : 0;
          const margin = retail > 0 && profit > 0 ? Math.round((profit / retail) * 100) : 0;
          const suppliersList = getItemSuppliersList(item);
          const imageUrl = getItemImageUrl(item);

          return (
            <div
              key={`${activeTab}-${item.id}`}
              className={`p-5 rounded-2xl bg-[var(--bg-surface)] border shadow-sm space-y-4 transition-all flex flex-col justify-between ${
                isExpanded ? 'border-violet-500 ring-1 ring-violet-500/20' : 'border-[var(--border-base)] hover:border-violet-500/50'
              }`}
            >
              {/* Clickable Card Body Area for Full Hitbox */}
              <div 
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className="space-y-3 cursor-pointer select-none group/card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {imageUrl ? (
                      <div className="w-12 h-12 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] p-1 shrink-0 flex items-center justify-center overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={imageUrl}
                          alt={item.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex items-center justify-center text-[var(--text-subtle)] shrink-0">
                        {isFurniture ? <Boxes className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-main)] group-hover/card:text-violet-500 transition-colors leading-snug">{item.name}</h3>
                      <span className="text-[10px] font-mono text-[var(--text-subtle)] uppercase tracking-wider">{item.type}</span>
                    </div>
                  </div>
                  <span className="p-1 rounded-lg text-[var(--text-subtle)] group-hover/card:text-violet-500 group-hover/card:bg-[var(--bg-base)] transition-colors shrink-0">
                    <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90 text-violet-500' : ''}`} />
                  </span>
                </div>

                {/* TAILORED STATS: Furniture & Store Equipment */}
                {isFurniture ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--text-subtle)] uppercase">Store Price</span>
                      <div className="font-mono font-bold text-[var(--text-main)] mt-0.5">
                        ${retail.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-subtle)] uppercase">Floor Grid</span>
                      <div className="font-mono font-bold text-sky-500 mt-0.5">
                        {item.furniture_properties.grid_size || 0.5}m²
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-subtle)] uppercase">Added Cust/h</span>
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {item.furniture_properties.added_customers_per_hour > 0 ? `+${item.furniture_properties.added_customers_per_hour}` : '0'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-subtle)] uppercase">Box Storage</span>
                      <div className="font-mono font-semibold text-[var(--text-muted)] mt-0.5">
                        {item.furniture_properties.cargo_capacity_boxes > 0 ? `${item.furniture_properties.cargo_capacity_boxes} boxes` : '0'}
                      </div>
                    </div>
                  </div>
                ) : activeTab === 'wholesale' ? (
                  /* TAILORED STATS: Wholesale Supply & Importer Port */
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--text-subtle)] uppercase">Wholesale/u</span>
                      <div className="font-mono font-bold text-[var(--text-main)] mt-0.5">
                        ${wholesale.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-subtle)] uppercase">Pack Size</span>
                      <div className="font-mono font-bold text-indigo-500 mt-0.5">
                        {item.retail_properties.box_size || 1} u / box
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-subtle)] uppercase">Delivery Max</span>
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {(item.financials.max_wholesale_order_amount || 5000).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-subtle)] uppercase">Importer Cap</span>
                      <div className="font-mono font-semibold text-[var(--text-muted)] mt-0.5">
                        {(item.financials.max_order_amount_per_importer || 5000).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* TAILORED STATS: Retail Products & Merchandise */
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--text-subtle)] uppercase">Wholesale</span>
                      <div className="font-mono font-bold text-[var(--text-main)] mt-0.5">
                        {wholesale > 0 
                          ? `$${wholesale.toFixed(2)}` 
                          : item.type === 'ServiceProduct' 
                          ? 'Service / Labor' 
                          : isCraftable 
                          ? 'Craft Recipe' 
                          : '—'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-subtle)] uppercase">Base Retail</span>
                      <div className="font-mono font-bold text-[var(--text-main)] mt-0.5">
                        {retail > 0 ? `$${retail.toFixed(2)}` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-subtle)] uppercase">Base Margin</span>
                      <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {item.type === 'ServiceProduct' ? '100%' : margin > 0 ? `+${margin}%` : '—'}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-subtle)] uppercase">Pack Size</span>
                      <div className="font-mono font-semibold text-[var(--text-muted)] mt-0.5">
                        {item.type === 'ServiceProduct' ? 'Per Client' : `${item.retail_properties.box_size || 1} u / box`}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons & Cross References */}
              <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  {/* Quick Action Cross-Links: Pricing, Factory Optimizer, Store Builder */}
                  {isRetail && wholesale > 0 ? (
                    <Link
                      href={`/pricing?search=${encodeURIComponent(item.name)}`}
                      className="text-xs font-semibold text-violet-600 dark:text-[var(--primary)] hover:underline flex items-center gap-1.5"
                    >
                      <BadgePercent className="w-3.5 h-3.5" />
                      <span>Pricing</span>
                    </Link>
                  ) : isCraftable ? (
                    <Link
                      href={`/factories?recipe=${encodeURIComponent(item.cross_references.produced_by_recipes[0]?.recipe_id || '')}&item=${encodeURIComponent(item.name)}`}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
                    >
                      <Factory className="w-3.5 h-3.5" />
                      <span>Factory Recipe</span>
                    </Link>
                  ) : item.cross_references.used_as_ingredient_in && item.cross_references.used_as_ingredient_in.length > 0 ? (
                    <Link
                      href={`/factories?recipe=${encodeURIComponent(item.cross_references.used_as_ingredient_in[0]?.recipe_id || '')}`}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1.5"
                    >
                      <Factory className="w-3.5 h-3.5" />
                      <span>Factory Usage</span>
                    </Link>
                  ) : <div />}

                  {/* Expand Details Trigger */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="text-xs font-semibold text-[var(--text-muted)] hover:text-violet-500 flex items-center gap-1.5 ml-auto cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Expanded Cross-Reference Details */}
                {isExpanded && (
                  <div className="p-3.5 rounded-xl bg-[var(--bg-base)] space-y-3 text-xs border border-[var(--border-base)] animate-in fade-in zoom-in-95 duration-100">
                    {/* Display Fixture & Shelf Requirement */}
                    {isRetail && (
                      <div className="space-y-1.5">
                        <div className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
                          <Refrigerator className="w-3.5 h-3.5 text-amber-500" />
                          <span>Store Fixture &amp; Display Shelf:</span>
                        </div>
                        <Link
                          href={`/items?tab=furniture&search=${encodeURIComponent(getProductFixtureInfo(item).replace(' Display', '').replace(' Stand', ''))}`}
                          className="p-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] text-[11px] text-[var(--text-main)] font-semibold flex items-center justify-between transition-colors group cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Boxes className="w-3 h-3 text-amber-500 opacity-80" />
                            <span>{getProductFixtureInfo(item)}</span>
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-normal text-[var(--text-subtle)] font-mono">
                              {item.retail_properties.box_size} u / box
                            </span>
                            <ArrowUpRight className="w-3 h-3 text-[var(--text-subtle)] group-hover:text-[var(--text-main)] transition-colors" />
                          </div>
                        </Link>
                      </div>
                    )}

                    {/* Wholesale Suppliers & Ocean Port Importers Grid */}
                    {(isRetail || activeTab === 'wholesale') && suppliersList.length > 0 && (
                      <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                        <div className="font-bold text-[var(--text-main)] flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Truck className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Available Suppliers &amp; Importers ({suppliersList.length}):</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {suppliersList.map((supp, idx) => (
                            <Link
                              key={`${supp.id}-${idx}`}
                              href={supp.id ? `/suppliers?id=${encodeURIComponent(supp.id)}` : '#'}
                              className={`p-2 rounded-lg border text-[11px] transition-all flex items-center justify-between gap-2.5 ${
                                supp.isImporter
                                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300 hover:bg-sky-500/20'
                                  : 'bg-[var(--bg-surface)] border-[var(--border-base)] text-[var(--text-main)] hover:border-indigo-500'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold">{supp.name}</span>
                                {supp.isImporter && (
                                  <span className="text-[9px] px-1 py-0.2 rounded font-bold uppercase bg-sky-500/20 text-sky-600 dark:text-sky-300">
                                    Ocean Port
                                  </span>
                                )}
                              </div>
                              {supp.pricePerBox && (
                                <span className="font-mono text-[10px] text-[var(--text-muted)] font-semibold">
                                  ${supp.pricePerBox.toFixed(2)}/box
                                </span>
                              )}
                              {supp.id && <ArrowUpRight className="w-3 h-3 opacity-60 shrink-0" />}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Furniture Store Source & Placement Specs */}
                    {isFurniture && (() => {
                      const vendor = getFurnitureVendorInfo(item);
                      return (
                        <div className="space-y-2">
                          <div className="font-bold text-[var(--text-main)]">Vendor &amp; Placement Specs:</div>
                          <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-base)] space-y-2 text-[11px]">
                            <div className="flex items-center justify-between">
                              <span className="text-[var(--text-subtle)]">Vendor Store:</span>
                              <Link
                                href={`/suppliers?id=${encodeURIComponent(vendor.id)}`}
                                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 group"
                              >
                                <span>{vendor.name} ({vendor.district})</span>
                                <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              </Link>
                            </div>
                            <div className="flex justify-between border-t border-[var(--border-subtle)] pt-1.5">
                              <span className="text-[var(--text-subtle)]">Placement:</span>
                              <span className="font-mono text-[var(--text-muted)]">
                                {item.furniture_properties.wall_mounted ? 'Wall Mounted' : item.furniture_properties.snap_to_ceiling ? 'Ceiling Mounted' : 'Floor Standing'} • {item.furniture_properties.degrees_per_rotation || 45}° Rotations
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Stores Section */}
                    {item.cross_references.sold_in_businesses.length > 0 && (
                      <div className="pt-2 border-t border-[var(--border-subtle)]">
                        <div className="font-bold text-[var(--text-main)] mb-1.5 flex items-center justify-between">
                          <span>Compatible Store Types:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {item.cross_references.sold_in_businesses.map((b: any) => (
                            <Link
                              key={b.business_id}
                              href={`/businesses?id=${encodeURIComponent(b.business_id)}`}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                b.is_primary
                                  ? 'bg-emerald-500/10 border border-emerald-500/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                                  : 'bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)]'
                              }`}
                            >
                              <span>{b.business_name}</span>
                              {b.is_primary && (
                                <span className="text-[9px] px-1 py-0.2 rounded font-bold uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                                  Primary
                                </span>
                              )}
                              <ArrowUpRight className="w-3 h-3 opacity-60" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Crafting / Factory Recipes Section: Produced By */}
                    {isCraftable && (
                      <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                        <div className="font-bold text-[var(--text-main)]">Produced In Factory Line:</div>
                        {item.cross_references.produced_by_recipes.map((r: any) => (
                          <Link
                            key={r.recipe_id}
                            href={`/factories?recipe=${encodeURIComponent(r.recipe_id)}&item=${encodeURIComponent(item.name)}`}
                            className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-base)] hover:border-violet-500 transition-all flex items-center justify-between group cursor-pointer"
                          >
                            <div>
                              <div className="font-bold text-[var(--text-main)] group-hover:text-violet-500 transition-colors">
                                Factory Batch: {r.max_skilled_amount} units
                              </div>
                              <div className="text-[10px] text-[var(--text-subtle)] mt-0.5">
                                Machine: {r.machines.join(', ') || 'Assembly Line / Planter'}
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-violet-600 dark:text-[var(--primary)] flex items-center gap-1">
                              <span>Optimize</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Manufacturing Ingredients Section: Used As Ingredient In */}
                    {item.cross_references.used_as_ingredient_in && item.cross_references.used_as_ingredient_in.length > 0 && (
                      <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                        <div className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
                          <Factory className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Used as Raw Ingredient in Recipes ({item.cross_references.used_as_ingredient_in.length}):</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {item.cross_references.used_as_ingredient_in.map((r: any, idx: number) => (
                            <Link
                              key={`${r.recipe_id}-${idx}`}
                              href={`/factories?recipe=${encodeURIComponent(r.recipe_id)}`}
                              className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-base)] hover:border-indigo-500 transition-all flex items-center justify-between text-xs group cursor-pointer"
                            >
                              <div>
                                <span className="font-bold text-[var(--text-main)] group-hover:text-indigo-500 capitalize block">
                                  {r.for_product.replace(/\d+$/, '').replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span className="text-[10px] font-mono text-[var(--text-subtle)]">
                                  Requires {r.amount_required}x per batch
                                </span>
                              </div>
                              <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:text-indigo-500" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* General Specs Fallback for Ingredients / Hardware */}
                    {!isRetail && !isFurniture && !isCraftable && (!item.cross_references.used_as_ingredient_in || item.cross_references.used_as_ingredient_in.length === 0) && (
                      <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-base)] text-[11px] text-[var(--text-muted)]">
                        <div>Wholesale Import / Inventory Item: <strong className="text-[var(--text-main)]">{item.name}</strong></div>
                        <div className="text-[10px] text-[var(--text-subtle)] mt-1">Pack Size: {item.retail_properties.box_size || 500} units per cargo box.</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Infinite Scroll Sentinel */}
      {hasMore && (
        <div ref={observerTarget} className="py-6 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

export default function ItemsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--text-muted)]">Loading products...</div>}>
      <ItemsContent />
    </Suspense>
  );
}
