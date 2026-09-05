'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Radio, 
  Store, 
  Package, 
  Building2, 
  Factory, 
  Truck, 
  X, 
  ArrowRight,
  Sparkles,
  Menu,
  Bug
} from 'lucide-react';

import rawItems from '@/data/items.json';
import rawBusinesses from '@/data/businesses.json';
import rawBuildings from '@/data/buildings.json';
import businessIconsRaw from '@/data/business_icons.json';
import gameIconsRaw from '@/data/game_item_icons.json';
import { useModal } from '@/context/ModalContext';

const businessIcons: Record<string, string> = businessIconsRaw;
const gameIcons: Record<string, string> = gameIconsRaw;

function getItemImageUrl(item: any): string | null {
  if (!item) return null;
  const name = typeof item === 'string' ? item : item.name || '';
  const cleanId = (typeof item === 'object' && item.id ? item.id : name.toLowerCase().replace(/[^a-z0-9]/g, ''));
  
  if (gameIcons[cleanId]) return gameIcons[cleanId];
  if (gameIcons[name.toLowerCase().replace(/[^a-z0-9]/g, '')]) return gameIcons[name.toLowerCase().replace(/[^a-z0-9]/g, '')];

  return null;
}

import { SUPPLIERS_DB } from '@/data/suppliers';
import { useLiveSync, EXPECTED_MOD_VERSION } from '@/context/LiveSyncContext';

const EXCLUDED_BUSINESS_IDS = new Set([
  'bank',
  'clinic',
  'hospital',
  'irs',
  'school',
  'truckgarage',
  'cardealership',
  'movingservice',
  'privatedriverservice',
  'wholesalestore',
  'furniturestore',
  'appliancestore',
  'empty',
  'headquarters',
  'factory',
  'casino',
  'gasstation',
  'importexport',
  'interiorinstallationfirm',
  'marketingagency',
  'officesupplystore',
  'recruitmentagency',
  'warehouse'
]);

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: 'item' | 'business' | 'property' | 'supplier' | 'recipe';
  url: string;
  icon?: string;
  score: number;
}

export function Navbar({ onToggleMobileMenu }: { onToggleMobileMenu?: () => void }) {
  const router = useRouter();
  const { state } = useLiveSync();
  const { openBugReport } = useModal();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Keyboard Shortcut: Cmd+K / Ctrl+K & Esc
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute live multi-category search results with smart relevance ranking & relational matching
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const scoredResults: SearchResult[] = [];
    const seenIds = new Set<string>();

    // 1. BUSINESSES (Playable business types)
    (rawBusinesses as any[]).forEach((b: any) => {
      if (!b || !b.id || EXCLUDED_BUSINESS_IDS.has(b.id)) return;
      let score = 0;
      const name = (b.name || '').toLowerCase();
      const desc = (b.description || '').toLowerCase();

      if (name.startsWith(q)) {
        score = 500;
      } else if (name.includes(q)) {
        score = 300;
      } else if (desc.includes(q)) {
        score = 100;
      }

      if (score > 0) {
        seenIds.add(`biz-${b.id}`);
        scoredResults.push({
          id: `biz-${b.id}`,
          title: b.name,
          subtitle: `${b.operating_schedule?.recommended_opening_window || b.recommended_opening_hours || 'Flexible hours'} • ${b.products?.length || 0} products`,
          category: 'business',
          url: `/businesses?id=${b.id}`,
          icon: businessIcons[b.id],
          score
        });
      }
    });

    // 2. ITEMS & PRODUCTS (Items catalog & dynamic retail items)
    rawItems.forEach((item: any) => {
      let score = 0;
      const name = item.name.toLowerCase();
      const cat = (item.category || item.type || '').toLowerCase();
      const wholesale = item.wholesale_price ?? item.financials?.wholesale_price ?? 0;

      if (name.startsWith(q)) {
        score = 450;
      } else if (name.includes(q)) {
        score = 250;
      } else if (cat.includes(q)) {
        score = 120;
      }

      if (score > 0) {
        seenIds.add(`item-${item.id}`);
        scoredResults.push({
          id: `item-${item.id}`,
          title: item.name,
          subtitle: `${item.category || item.type || 'Product'} • Wholesale $${Number(wholesale).toFixed(2)}`,
          category: 'item',
          url: `/items?type=${encodeURIComponent((item.category || item.type || '').toLowerCase())}&q=${encodeURIComponent(item.name)}`,
          icon: getItemImageUrl(item) || undefined,
          score
        });
      }
    });

    // 3. WHOLESALE SUPPLIERS
    SUPPLIERS_DB.forEach(s => {
      let score = 0;
      const name = s.name.toLowerCase();
      const district = s.district.toLowerCase();
      let matchReason = '';

      if (name.startsWith(q)) {
        score = 400;
      } else if (name.includes(q)) {
        score = 220;
      } else if (district.includes(q)) {
        score = 150;
      }

      if (s.categories && s.categories.some(cat => cat.toLowerCase().includes(q))) {
        score = Math.max(score, 300);
        matchReason = `Supplies ${s.categories.find(cat => cat.toLowerCase().includes(q))}`;
      }

      if (score > 0) {
        seenIds.add(`sup-${s.id}`);
        scoredResults.push({
          id: `sup-${s.id}`,
          title: s.name,
          subtitle: matchReason ? `${matchReason} • ${s.district}` : `${s.type} • ${s.district}`,
          category: 'supplier',
          url: `/suppliers?id=${s.id}`,
          score
        });
      }
    });

    // 4. REAL ESTATE PROPERTIES (Addresses, Districts, Building Codes)
    rawBuildings.forEach(b => {
      const addr = b.address.toLowerCase();
      const neigh = b.neighborhood_name.toLowerCase();
      const code = ((b as any).building_code || '').toLowerCase();
      let score = 0;

      if (addr.startsWith(q)) {
        score = 600;
      } else if (addr.includes(q)) {
        score = 400;
      } else if (code === q) {
        score = 550;
      } else if (neigh.includes(q)) {
        score = 250;
      }

      if (score > 0) {
        seenIds.add(`bld-${b.id}`);
        scoredResults.push({
          id: `bld-${b.id}`,
          title: b.address,
          subtitle: `${b.neighborhood_name} • ${b.square_meters}m² • ${(b as any).building_code || ''} ${b.building_type}`,
          category: 'property',
          url: `/real-estate?type=${b.building_type}&q=${encodeURIComponent(b.address)}`,
          score
        });
      }
    });

    // Sort descending by relevance score
    scoredResults.sort((a, b) => b.score - a.score);

    return scoredResults.slice(0, 16);
  }, [query]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Navigate on Enter or Arrow keys
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[selectedIndex];
      if (target) {
        setIsOpen(false);
        router.push(target.url);
      }
    }
  };

  return (
    <header className="h-16 px-4 sm:px-6 lg:px-8 border-b border-[var(--border-base)] bg-[var(--bg-surface)]/80 backdrop-blur-md flex items-center justify-between sticky top-0 z-40 gap-3 sm:gap-4">
      {/* Mobile Menu Hamburger Toggle */}
      <button
        onClick={onToggleMobileMenu}
        aria-label="Open Navigation Menu"
        className="p-2 -ml-1 rounded-xl border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] lg:hidden transition-colors cursor-pointer shrink-0"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* Interactive Global Search Bar */}
      <div ref={containerRef} className="relative flex-1 max-w-lg">
        <Search className="w-4 h-4 text-[var(--text-subtle)] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search products, stores, addresses, supplies..."
          className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl pl-10 pr-16 py-2.5 text-xs text-[var(--text-main)] placeholder:text-[var(--text-subtle)] focus:outline-none focus:border-emerald-500 transition-colors"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-md text-[var(--text-subtle)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="text-[10px] font-mono font-medium text-[var(--text-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded border border-[var(--border-base)]">
              ⌘K
            </kbd>
          )}
        </div>

        {/* Global Search Results Dropdown */}
        {isOpen && query.trim().length > 0 && (
          <div className="absolute top-full -left-12 -right-4 sm:left-0 sm:right-0 mt-2 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl overflow-hidden max-h-[75vh] sm:max-h-96 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 z-50 p-2 space-y-1">
            {results.length > 0 ? (
              results.map((res, index) => {
                const isSelected = index === selectedIndex;

                return (
                  <Link
                    key={res.id}
                    href={res.url}
                    onClick={() => setIsOpen(false)}
                    className={`p-2.5 rounded-xl text-xs transition-colors flex items-center justify-between group cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--emerald-bg)] text-[var(--emerald-accent)] font-semibold'
                        : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      {res.icon ? (
                        <div className="w-7 h-7 rounded-lg bg-slate-900 p-1 shrink-0 flex items-center justify-center overflow-hidden border border-slate-700/60 shadow-xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={res.icon} alt={res.title} className="w-full h-full object-contain filter drop-shadow-xs" />
                        </div>
                      ) : (
                        <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center ${
                          res.category === 'business'
                            ? 'bg-[var(--amber-bg)] text-[var(--amber-accent)] border border-[var(--amber-border)]'
                            : res.category === 'property'
                            ? 'bg-[var(--sky-bg)] text-[var(--sky-accent)] border border-[var(--sky-border)]'
                            : res.category === 'supplier'
                            ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                            : 'bg-[var(--emerald-bg)] text-[var(--emerald-accent)] border border-[var(--emerald-border)]'
                        }`}>
                          {res.category === 'business' && <Store className="w-3.5 h-3.5" />}
                          {res.category === 'property' && <Building2 className="w-3.5 h-3.5" />}
                          {res.category === 'supplier' && <Truck className="w-3.5 h-3.5" />}
                          {res.category === 'item' && <Package className="w-3.5 h-3.5" />}
                        </div>
                      )}

                      <div className="truncate">
                        <div className="font-bold text-xs truncate flex items-center gap-1.5">
                          <span>{res.title}</span>
                          <span className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded ${
                            res.category === 'business'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : res.category === 'property'
                              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {res.category}
                          </span>
                        </div>
                        <div className="text-[10px] text-[var(--text-subtle)] truncate mt-0.5">
                          {res.subtitle}
                        </div>
                      </div>
                    </div>

                    <ArrowRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${isSelected ? 'translate-x-0.5 text-emerald-500' : 'text-[var(--text-subtle)] opacity-0 group-hover:opacity-100'}`} />
                  </Link>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                No matching products, businesses, or addresses found for &quot;<strong className="text-[var(--text-main)]">{query}</strong>&quot;
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Telemetry Badge & Quick Action */}
      <div className="flex items-center gap-2.5">
        {/* Prominent Bug Report Button for Testing Stage */}
        <button
          onClick={openBugReport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-bold text-rose-600 dark:text-rose-400 transition-all shadow-xs cursor-pointer"
          title="Report an issue, crash, or suggestion"
        >
          <Bug className="w-3.5 h-3.5 text-rose-500" />
          <span className="hidden sm:inline">Report a Bug</span>
          <span className="sm:hidden">Report</span>
        </button>

        {state.isConnected && state.modVersion && state.modVersion !== EXPECTED_MOD_VERSION && (
          <Link
            href="/live-sync"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
            title={`Mod version mismatch: Running v${state.modVersion}, Expected v${EXPECTED_MOD_VERSION}`}
          >
            <span>⚠️ Mod v{state.modVersion} (Update to v{EXPECTED_MOD_VERSION})</span>
          </Link>
        )}
        <Link
          href="/live-sync"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-base)] text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors"
        >
          <Radio className={`w-3.5 h-3.5 ${state.isConnected ? 'text-emerald-500 animate-pulse' : 'text-[var(--text-subtle)]'}`} />
          <span>{state.isConnected ? 'Game Connected' : 'Sync Standby'}</span>
        </Link>
      </div>
    </header>
  );
}
