'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { 
  Compass, 
  Package, 
  Store, 
  Factory, 
  Building, 
  BadgePercent, 
  Activity, 
  Sun, 
  Moon, 
  LayoutGrid, 
  Briefcase,
  ChevronDown,
  Boxes,
  Truck,
  Radar,
  Target,
  Users,
  CreditCard,
  Radio,
  Wifi,
  ArrowLeft,
  Settings as SettingsIcon,
  Megaphone,
  Download,
  Info,
  Bug,
  Lightbulb,
  MapPin,
  Landmark,
  GraduationCap,
  Network,
  Warehouse,
  FileText,
  ArrowLeftRight,
  Receipt,
  ChartColumn,
  Armchair,
  House,
  Car,
  PiggyBank,
  Flame,
  LayoutDashboard,
  ChartLine,
  CalendarClock,
  Workflow,
  DollarSign,
  type LucideIcon
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useLiveSync, EXPECTED_MOD_VERSION, LiveBusinessData } from '@/context/LiveSyncContext';
import { useModal } from '@/context/ModalContext';
import { useTranslation } from '@/context/LanguageContext';
import { useEscapeToClose } from '@/lib/useEscapeToClose';
import { collectFactorySites } from '@/lib/production';
import { isStorefront } from '@/lib/alerts';
import FactorySwitcher from './FactorySwitcher';
import StoreSwitcher from './StoreSwitcher';
import { SettingsModal } from './SettingsModal';
import { ChangelogModal } from './ChangelogModal';

const PRIMARY_TOOLS = [
  { href: '/businesses', label: 'Businesses', icon: Store },
  { href: '/builder', label: 'Store & Office Builder', icon: LayoutGrid },
  { href: '/marketing', label: 'Marketing Planner', icon: Megaphone },
  { href: '/pricing', label: 'Selling Prices', icon: BadgePercent },
  { href: '/factories', label: 'Factory Planner', icon: Factory },
  { href: '/suppliers', label: 'Wholesale Suppliers', icon: Truck },
];

// A child either navigates to a `view` or scrolls to a page `section`.
type LiveMenuChild = {
  key: string;
  label: string;
  icon: LucideIcon;
  view?: string;
  section?: string;
  badge: number;
};

type LiveMenu = { key: string; label: string; icon: LucideIcon; children: LiveMenuChild[] };

export function Sidebar({ 
  mobileOpen = false, 
  onClose 
}: { 
  mobileOpen?: boolean; 
  onClose?: () => void; 
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentTab = searchParams.get('tab') || 'retail';
  const currentType = searchParams.get('type') || 'all';
  const { theme, toggleTheme } = useTheme();
  const { state, isHydrated, isDemoMode } = useLiveSync();
  const { openBugReport, openSuggestion } = useModal();
  const { t } = useTranslation();
  useEscapeToClose(mobileOpen, onClose ?? (() => {}));

  const primaryTools = [
    { href: '/businesses', label: t('nav.businesses', 'Businesses'), icon: Store },
    { href: '/builder', label: t('nav.storeBuilder', 'Store & Office Builder'), icon: LayoutGrid },
    { href: '/marketing', label: t('nav.marketing', 'Marketing Planner'), icon: Megaphone },
    { href: '/pricing', label: t('nav.pricing', 'Selling Prices'), icon: BadgePercent },
    { href: '/factories', label: t('nav.factories', 'Factory Planner'), icon: Factory },
    { href: '/suppliers', label: t('nav.suppliers', 'Wholesale Suppliers'), icon: Truck },
  ];

  const isLiveWorkspace = pathname.startsWith('/live') || pathname === '/live-sync';
  // Never show the "connected" empire menus before a real connection is confirmed:
  // until the provider hydrates and revalidates, treat the workspace as offline.
  const showLiveNav = isHydrated ? (state.isConnected || isDemoMode) : false;
  const isProductsActive = pathname === '/items';
  const isPropertiesActive = pathname === '/real-estate';
  const [productsAccordionOpen, setProductsAccordionOpen] = useState(false);
  const [propertiesAccordionOpen, setPropertiesAccordionOpen] = useState(false);
  const [vehiclesAccordionOpen, setVehiclesAccordionOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const rawLiveView = searchParams.get('view') || 'overview';
  // Legacy leaf keys land on the consolidated pages (Properties, Finance & Treasury).
  const activeLiveView =
    rawLiveView === 'residences' || rawLiveView === 'property-investments' || rawLiveView === 'leases'
      ? 'property'
      : rawLiveView === 'income' || rawLiveView === 'cashflow' || rawLiveView === 'tax'
        ? 'finance'
        : rawLiveView === 'funds'
          ? 'investments'
          : rawLiveView;
  const selectedStoreId = searchParams.get('store');
  const activeStore = selectedStoreId ? (state.businesses || []).find(b => b.id === selectedStoreId) || null : null;
  const storefronts = (state.businesses || []).filter(isStorefront);
  const selectedFactoryId = searchParams.get('factory');
  const factorySites = collectFactorySites(state.businesses || [], state.warehouses || []);
  const activeFactory = selectedFactoryId ? factorySites.find(site => site.id === selectedFactoryId) || null : null;

  // Some views (a single business, the supply chain) are one long page of sections,
  // so their sidebar items scroll to them and a scroll-spy highlights the section in view.
  const [activeSectionId, setActiveSectionId] = useState('');
  const activeSectionIdRef = useRef('');
  // While a sidebar section click is smooth-scrolling, the scroll-spy is paused so the
  // highlight does not flicker through every section the page passes on the way. It
  // resumes once the scroll settles.
  const scrollLockRef = useRef<string | null>(null);
  const activeStoreId = activeStore?.id;
  const activeFactoryId = activeFactory?.id;
  // Keep the latest section available to the spy effect without re-subscribing it.
  useEffect(() => {
    activeSectionIdRef.current = activeSectionId;
  }, [activeSectionId]);
  useEffect(() => {
    scrollLockRef.current = null;
    const ids = activeStoreId
      ? ['store-overview', 'store-performance', 'store-pricing', 'store-schedule']
        : activeFactoryId
          ? ['factory-overview', 'factory-flow', 'factory-lines', 'factory-feed', 'factory-output', 'factory-storage', 'factory-workforce', 'factory-economics', 'factory-roster']
          : activeLiveView === 'supply'
            ? ['supply-network', 'supply-warehouses', 'supply-fleet']
            : activeLiveView === 'finance'
              ? ['finance-income', 'finance-cashflow', 'finance-tax']
              : [];
    if (ids.length === 0) {
      // No sectioned page is active, so clear the stale section highlight.
      setActiveSectionId('');
      return;
    }
    // Switching between stores/factories keeps the current section (the switcher carries
    // it in the URL) and holds the highlight there while the deep-link scroll runs, so
    // the tabs do not flicker through every section in between.
    const preserved = activeSectionIdRef.current;
    if (ids.includes(preserved)) {
      scrollLockRef.current = preserved;
    } else {
      setActiveSectionId(ids[0]);
    }
    const elements = ids
      .map(id => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (elements.length === 0) return;

    const scroller = getScrollContainer(elements[0]);
    const isWindow = scroller === window;

    // The active section is the last one whose top has crossed the reading band, so
    // the highlight follows the page continuously instead of only on intersection.
    let frame = 0;
    const compute = () => {
      frame = 0;
      const viewportTop = isWindow ? 0 : (scroller as HTMLElement).getBoundingClientRect().top;
      const viewportHeight = isWindow ? window.innerHeight : (scroller as HTMLElement).clientHeight;
      const band = viewportHeight * 0.28;

      let current = elements[0].id;
      for (const element of elements) {
        if (element.getBoundingClientRect().top - viewportTop <= band) current = element.id;
      }

      // The last section can never reach the band when the page simply ends, so
      // select it explicitly once the content is scrolled all the way to the bottom.
      const totalHeight = isWindow ? document.documentElement.scrollHeight : (scroller as HTMLElement).scrollHeight;
      const scrollable = totalHeight > viewportHeight + 4;
      const atBottom = isWindow
        ? window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4
        : (scroller as HTMLElement).scrollTop + (scroller as HTMLElement).clientHeight >= (scroller as HTMLElement).scrollHeight - 4;
      if (atBottom && scrollable) current = elements[elements.length - 1].id;

      setActiveSectionId(previous => (previous === current ? previous : current));
    };

    let settleTimer = 0;
    const onScroll = () => {
      // A programmatic smooth scroll is running: hold the clicked section highlighted
      // and recompute only after the page has been still for a moment.
      if (scrollLockRef.current) {
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(() => {
          scrollLockRef.current = null;
          compute();
        }, 140);
        return;
      }
      if (!frame) frame = requestAnimationFrame(compute);
    };
    const scrollTarget: EventTarget = isWindow ? window : scroller;
    scrollTarget.addEventListener('scroll', onScroll, { passive: true });
    compute();
    return () => {
      scrollTarget.removeEventListener('scroll', onScroll);
      window.clearTimeout(settleTimer);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [activeStoreId, activeFactoryId, activeLiveView]);

  // The element that actually scrolls the main content (a <main> overflow box in
  // some layouts, the window in others).
  const getScrollContainer = (el: HTMLElement | null): HTMLElement | Window => {
    let node = el?.parentElement ?? null;
    while (node) {
      if (node.scrollHeight > node.clientHeight + 1 && /(auto|scroll)/.test(getComputedStyle(node).overflowY)) return node;
      node = node.parentElement;
    }
    return window;
  };

  const scrollToTop = (id: string) => {
    getScrollContainer(document.getElementById(id)).scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToId = (id: string) => {
    // Lock the highlight to the clicked section for the duration of the smooth scroll.
    scrollLockRef.current = id;
    // The first section of a page scrolls all the way up so the content above it
    // (page intro banners, alerts) is not left scrolled out of view.
    if (id === 'store-overview' || id === 'supply-network' || id === 'finance-income' || id === 'factory-overview') {
      scrollToTop(id);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActiveSectionId(id);
  };

  // Section items live on another view (Supply Chain, Finance & Treasury), so a click
  // from elsewhere must navigate there first, then scroll once the sections have mounted.
  // The section can take a moment to appear (charts, tables), so retry until it exists.
  const pendingSectionRef = useRef<{ view: string; section: string } | null>(null);
  useEffect(() => {
    const pending = pendingSectionRef.current;
    if (pending && activeLiveView === pending.view) {
      pendingSectionRef.current = null;
      let tries = 0;
      const timer = setInterval(() => {
        tries += 1;
        if (document.getElementById(pending.section) || tries > 40) {
          clearInterval(timer);
          scrollToId(pending.section);
        }
      }, 50);
      return () => clearInterval(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLiveView]);

  const handleSectionClick = (view: string, section: string) => {
    if (activeLiveView === view) {
      scrollToId(section);
    } else {
      pendingSectionRef.current = { view, section };
      router.push(`/live-sync?view=${view}`);
    }
  };

  // Keep the active-business card mounted until its close animation ends so it can
  // slide shut instead of vanishing. This is derived during render (not in an effect)
  // so there is never a paint where the store is gone but the close state is not set.
  const [displayStore, setDisplayStore] = useState<LiveBusinessData | null>(activeStore);
  const [storeClosing, setStoreClosing] = useState(false);
  const [prevActiveStore, setPrevActiveStore] = useState<LiveBusinessData | null>(activeStore);

  if (activeStore !== prevActiveStore) {
    setPrevActiveStore(activeStore);
    if (activeStore) {
      setDisplayStore(activeStore);
      setStoreClosing(false);
    } else if (displayStore) {
      setStoreClosing(true);
    }
  }

  const liveLeafClass = (active: boolean) => `flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${active ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 font-semibold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'}`;
  const liveBadgeClass = (active: boolean) => `text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${active ? 'bg-emerald-700/80 text-white border border-emerald-500/40' : 'bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-main)]'}`;

  const storeCount = (state.businesses || []).filter(b =>
    !b.isHeadquarters &&
    !(b.rawType || '').includes('headquarters') &&
    !(b.rawType || '').includes('hq') &&
    !(b.type || '').toLowerCase().includes('headquarter') &&
    !(b.type || '').toLowerCase().includes('hq')
  ).length;

  // Total properties the player holds (homes + investment buildings + unused leases).
  const propertyCount = (state.residences || []).length + (state.ownedRealEstate || []).length + (state.emptyLeasedSpaces || []).length;

  const liveMenus: LiveMenu[] = showLiveNav ? [
    {
      key: 'stores', label: t('nav.storesMenu', 'Stores'), icon: Store,
      children: [
        { key: 'all-stores', label: t('nav.allStores', 'All Stores'), icon: Store, view: 'stores', badge: storeCount },
        { key: 'chains', label: t('nav.chains', 'Chains & Brands'), icon: Network, view: 'chains', badge: 0 }
      ]
    },
    {
      key: 'supply', label: t('nav.supplyMenu', 'Supply Chain'), icon: Boxes,
      children: [
        { key: 'production', label: t('nav.supplyProduction', 'Production'), icon: Factory, view: 'production', badge: 0 },
        { key: 'network', label: t('nav.supplyNetwork', 'Network'), icon: Network, view: 'supply', section: 'supply-network', badge: 0 },
        { key: 'warehouses', label: t('nav.supplyWarehouses', 'Warehouses'), icon: Warehouse, view: 'supply', section: 'supply-warehouses', badge: (state.warehouses || []).length },
        { key: 'fleet', label: t('nav.supplyFleet', 'Fleet'), icon: Truck, view: 'supply', section: 'supply-fleet', badge: (state.vehicles?.length || 0) + (state.boats?.length || 0) }
      ]
    },
    {
      key: 'money', label: t('nav.moneyMenu', 'Money'), icon: CreditCard,
      children: [
        { key: 'income', label: t('nav.incomeStatement', 'Income Statement'), icon: FileText, view: 'finance', section: 'finance-income', badge: 0 },
        { key: 'cashflow', label: t('nav.cashFlow', 'Cash Flow Reconciliation'), icon: ArrowLeftRight, view: 'finance', section: 'finance-cashflow', badge: 0 },
          { key: 'tax', label: t('nav.taxPosition', 'Tax Position'), icon: Receipt, view: 'finance', section: 'finance-tax', badge: 0 },
        { key: 'funds', label: t('nav.investmentFunds', 'Investment Funds'), icon: PiggyBank, view: 'investments', badge: 0 },
        { key: 'unit-economics', label: t('nav.unitEconomics', 'Store Unit Economics'), icon: ChartColumn, view: 'unit-economics', badge: 0 }
      ]
    },
    {
      key: 'intelligence', label: t('nav.intelligenceMenu', 'Intelligence'), icon: Radar,
      children: [
        { key: 'analyzer', label: t('nav.decisionAnalyzer', 'Decision Analyzer'), icon: Target, view: 'analyzer', badge: 0 },
        { key: 'hype', label: t('nav.hypeExposure', 'Hype Exposure'), icon: Flame, view: 'hype', badge: 0 },
        { key: 'demand', label: t('nav.marketDemand', 'Market Demand'), icon: LayoutGrid, view: 'demand', badge: 0 }
      ]
    }
  ] : [];

  const storeSubTabs = [
    { key: 'overview', label: t('liveHq.storeTabOverview', 'Overview'), icon: LayoutDashboard },
    { key: 'performance', label: t('liveHq.storeTabPerformance', 'Performance'), icon: ChartLine },
    { key: 'pricing', label: t('liveHq.storeTabPricing', 'Pricing'), icon: BadgePercent },
    { key: 'schedule', label: t('liveHq.storeTabSchedule', 'Schedule'), icon: CalendarClock }
  ];

  const factorySubTabs = [
    { key: 'overview', label: t('liveHq.factoryOverview', 'Overview'), icon: LayoutDashboard },
    { key: 'flow', label: t('liveHq.factoryFlow', 'Assembly Flow'), icon: Network },
    { key: 'lines', label: t('liveHq.factoryLines', 'Production Lines'), icon: Workflow },
    { key: 'feed', label: t('liveHq.factoryFeed', 'Feed & Ingredients'), icon: Package },
    { key: 'output', label: t('liveHq.factoryOutput', 'Output & Demand'), icon: Store },
    { key: 'storage', label: t('liveHq.factoryStorage', 'Storage & Logistics'), icon: Warehouse },
    { key: 'workforce', label: t('liveHq.factoryWorkforce', 'Workforce'), icon: Users },
    { key: 'economics', label: t('liveHq.factoryEconomics', 'Economics & Yield'), icon: DollarSign },
    { key: 'roster', label: t('liveHq.factoryRoster', 'Assigned workers'), icon: Users }
  ];

  // Automatically close mobile menu when navigating to any page or link
  useEffect(() => {
    if (onClose) {
      onClose();
    }
  }, [pathname, searchParams]);

  return (
    <>
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      <aside className={`
        ba-sidebar
        w-[82vw] max-w-[320px] lg:w-64 bg-[var(--bg-surface)] border-r border-[var(--border-base)] flex flex-col shrink-0 h-screen select-none z-50
        fixed top-0 bottom-0 left-0 transition-transform duration-200 ease-in-out shadow-2xl lg:shadow-none
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:sticky lg:top-0
      `}>
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-[var(--border-base)]">
        <Link href={isLiveWorkspace ? '/live-sync' : '/'} className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 shadow-xs group-hover:scale-105 transition-transform bg-slate-900 border border-[var(--border-base)] flex items-center justify-center p-0.5">
            <img 
              src="/images/logo.png" 
              alt={t('nav.logoAlt', 'Big Ambitions Companion Logo')} 
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-[var(--text-main)] flex items-center gap-1.5" translate="no">
              <span className="notranslate">Big Ambitions</span>
              <span className={`notranslate ${isLiveWorkspace ? 'text-emerald-500 font-bold' : 'text-sky-500 font-bold'}`}>
                {isLiveWorkspace ? 'Live HQ' : 'Companion'}
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-subtle)] font-medium">
              {isLiveWorkspace ? (showLiveNav ? `🟢 ${t('nav.connectedDay', 'Connected (Day {day})').replace('{day}', state.gameDay.toString())}` : <span translate="no" className="notranslate">Standby / Offline</span>) : <span translate="no" className="notranslate">Compendium Suite</span>}
            </div>
          </div>
        </Link>
      </div>

      {/* Executive Segmented Workspace Switcher with Smooth Slide */}
      <div className="p-3 border-b border-[var(--border-base)]">
        <div className="relative p-1 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-xs font-semibold flex items-center">
          {/* Animated Sliding Background Indicator */}
          <div
            className={`absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-out shadow-xs ${
              isLiveWorkspace
                ? 'left-[calc(50%+2px)] right-1 bg-emerald-600'
                : 'left-1 right-[calc(50%+2px)] bg-[var(--bg-surface)] border border-[var(--border-base)]'
            }`}
          />

          {/* Database Suite Tab */}
          <Link
            href="/"
            translate="no"
            className={`notranslate relative z-10 w-1/2 py-1.5 px-2 text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              !isLiveWorkspace
                ? 'text-sky-600 dark:text-sky-400 font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="notranslate">Compendium</span>
          </Link>

          {/* Live Empire HQ Tab */}
          <Link
            href="/live-sync"
            translate="no"
            className={`notranslate relative z-10 w-1/2 py-1.5 px-2 text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              isLiveWorkspace
                ? 'text-white font-bold'
                : 'text-[var(--text-muted)] hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${state.isConnected ? 'animate-pulse text-emerald-300' : ''}`} />
            <span className="notranslate">Live HQ</span>
          </Link>
        </div>
      </div>

      {/* Navigation Groups: DYNAMIC PER WORKSPACE */}
      <div className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {isLiveWorkspace ? (
          /* ================= LIVE EMPIRE HQ NAVIGATION ================= */
          <div className="space-y-2">
            {/* Dashboard */}
            <div className="space-y-1">
              <Link
                href="/live-sync"
                className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  pathname === '/live-sync' && (!searchParams.get('view') || searchParams.get('view') === 'overview')
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Activity className="w-3.5 h-3.5 opacity-80 shrink-0" />
                  <span className="truncate">{showLiveNav ? t('nav.dashboard', 'Dashboard') : t('nav.connectGame', 'Connect Game')}</span>
                </div>
                {!showLiveNav && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
                    {t('nav.offline', 'OFFLINE')}
                  </span>
                )}
              </Link>
            </div>

            {showLiveNav && (
              <>
                {/* Workforce */}
                <Link href="/live-sync?view=people" className={liveLeafClass(activeLiveView === 'people')}>
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className="w-3.5 h-3.5 opacity-80 shrink-0" />
                    <span className="truncate">{t('nav.workforceShort', 'Workforce')}</span>
                  </div>
                  <span className={`${liveBadgeClass(activeLiveView === 'people')} shrink-0`}>{state.totalEmployees}</span>
                </Link>

                {/* Property (single page, no section sub-items) */}
                <Link href="/live-sync?view=property" className={liveLeafClass(activeLiveView === 'property')}>
                  <div className="flex items-center gap-2 min-w-0">
                    <Building className="w-3.5 h-3.5 opacity-80 shrink-0" />
                    <span className="truncate">{t('nav.propertyMenu', 'Property')}</span>
                  </div>
                  <span className={`${liveBadgeClass(activeLiveView === 'property')} shrink-0`}>{propertyCount}</span>
                </Link>

                {/* Grouped, always-visible tree */}
                {liveMenus.map(menu => (
                  <div key={menu.key} className="space-y-0.5">
                    <div className="px-3 pt-3 pb-0.5 text-[10px] font-bold tracking-wider uppercase text-[var(--text-subtle)]">
                      {menu.label}
                    </div>

                    {menu.children.map(child => {
                      const Icon = child.icon;
                      const active = child.section ? (child.view === activeLiveView && activeSectionId === child.section) : child.view === activeLiveView;
                      const badge = child.badge > 0 ? (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${active ? 'bg-emerald-700/80 text-white' : 'bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-main)]'}`}>
                          {child.badge}
                        </span>
                      ) : null;

                      if (child.section) {
                        return (
                          <button
                            key={child.key}
                            type="button"
                            onClick={() => handleSectionClick(child.view as string, child.section as string)}
                            className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                              active
                                ? 'bg-emerald-600 text-white font-semibold'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon className="w-3.5 h-3.5 opacity-80 shrink-0" />
                              <span className="truncate">{child.label}</span>
                            </div>
                            {badge}
                          </button>
                        );
                      }

                      return (
                        <Fragment key={child.key}>
                          <Link
                            href={`/live-sync?view=${child.view}`}
                            className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                              active
                                ? 'bg-emerald-600 text-white font-semibold'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Icon className="w-3.5 h-3.5 opacity-80 shrink-0" />
                              <span className="truncate">{child.label}</span>
                            </div>
                            {badge}
                          </Link>

                          {/* Active business card, directly under All Stores */}
                          {menu.key === 'stores' && child.key === 'all-stores' && displayStore && (
                            <div
                              key={displayStore.id}
                              className={storeClosing ? 'sidebar-reveal-out' : 'sidebar-reveal'}
                              onAnimationEnd={() => { if (storeClosing) setDisplayStore(null); }}
                            >
                            <div className="pt-2">
                              <div className="px-3 pb-1 text-[9px] font-bold tracking-wider uppercase text-[var(--text-subtle)]">
                                {t('nav.activeBusiness', 'Active Business')}
                              </div>
                              <div className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-base)] p-2 space-y-1.5">
                                <StoreSwitcher stores={storefronts} activeId={displayStore.id} section={activeSectionId} />
                                <div className="space-y-0.5">
                                  {storeSubTabs.map(tab => {
                                    const TabIcon = tab.icon;
                                    const tabActive = activeSectionId === `store-${tab.key}`;
                                    return (
                                      <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => scrollToId(`store-${tab.key}`)}
                                        className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-[11px] transition-colors cursor-pointer text-left ${
                                          tabActive
                                            ? 'bg-emerald-600 text-white font-semibold'
                                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                                        }`}
                                      >
                                        <TabIcon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                                        <span className="truncate">{tab.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                            </div>
                          )}

                          {/* Active factory card, directly under Production */}
                          {menu.key === 'supply' && child.key === 'production' && activeFactory && (
                            <div className="pt-2">
                              <div className="px-3 pb-1 text-[9px] font-bold tracking-wider uppercase text-[var(--text-subtle)]">
                                {t('nav.activeFactory', 'Active Factory')}
                              </div>
                              <div className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-base)] p-2 space-y-1.5">
                                <FactorySwitcher factories={factorySites} activeId={activeFactory.id} section={activeSectionId} />
                                <div className="space-y-0.5">
                                  {factorySubTabs.map(tab => {
                                    const TabIcon = tab.icon;
                                    const tabActive = activeSectionId === `factory-${tab.key}`;
                                    return (
                                      <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => scrollToId(`factory-${tab.key}`)}
                                        className={`w-full flex items-center gap-2 px-2 py-1 rounded-lg text-[11px] transition-colors cursor-pointer text-left ${
                                          tabActive
                                            ? 'bg-emerald-600 text-white font-semibold'
                                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                                        }`}
                                      >
                                        <TabIcon className="w-3.5 h-3.5 shrink-0 opacity-80" />
                                        <span className="truncate">{tab.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </Fragment>
                      );
                    })}
                  </div>
                ))}
              </>
            )}

            {/* System Diagnostics / Setup (Only when Offline or Version Mismatch) */}
            <div className="space-y-0.5">
              <div className="px-3 pt-3 pb-0.5 text-[10px] font-bold tracking-wider text-[var(--text-subtle)] uppercase">
                {t('nav.setupSupport', 'Setup & Support')}
              </div>
              {(!state.isConnected || (state.modVersion && state.modVersion !== EXPECTED_MOD_VERSION)) && (
                <Link
                  href="/live-sync?view=mod"
                  className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    pathname === '/live-sync' && searchParams.get('view') === 'mod'
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Download className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">{t('nav.downloadSetup', 'Download & Setup')}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full shrink-0 ${state.isConnected ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {state.isConnected ? 'UPDATE' : 'SETUP'}
                  </span>
                </Link>
              )}

              <Link
                href="/live-architecture"
                className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  pathname === '/live-architecture'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Info className={`w-3.5 h-3.5 shrink-0 ${pathname === '/live-architecture' ? 'text-white' : 'text-emerald-500'}`} />
                  <span className="truncate">{t('nav.about', 'About')}</span>
                </div>
              </Link>

              <button
                onClick={() => {
                  openSuggestion();
                  if (onClose) onClose();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-[var(--text-muted)] hover:text-purple-500 hover:bg-[var(--bg-surface-hover)] cursor-pointer text-left"
              >
                <Lightbulb className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <span className="truncate">{t('nav.sendSuggestion', 'Send Suggestion')}</span>
              </button>

              <button
                onClick={() => {
                  openBugReport('bug');
                  if (onClose) onClose();
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-[var(--text-muted)] hover:text-rose-500 hover:bg-[var(--bg-surface-hover)] cursor-pointer text-left"
              >
                <Bug className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate">{t('nav.reportBug', 'Report a Bug')}</span>
              </button>
            </div>
          </div>
        ) : (
          /* ================= STATIC REFERENCE & PLANNING SUITE NAVIGATION ================= */
          <>
            {/* Planning & Calculators */}
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[11px] font-bold tracking-wider text-[var(--text-subtle)] uppercase">
                {t('nav.interactiveTools', 'Interactive Tools')}
              </div>
              {primaryTools.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20 font-semibold'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[var(--text-subtle)]'}`} />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Reference Databases */}
            <div className="space-y-3">
              <div className="px-3 pb-1 text-[11px] font-bold tracking-wider text-[var(--text-subtle)] uppercase">
                {t('nav.referenceCompendium', 'Reference Compendium')}
              </div>

              {/* Accordion 1: Items Database */}
              <div className="space-y-1">
                <div className={`w-full flex items-center justify-between px-3 rounded-lg text-xs font-medium transition-colors ${
                  isProductsActive
                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                }`}>
                  <Link
                    href="/items"
                    className="flex items-center gap-2.5 flex-1"
                  >
                    <Package className="w-4 h-4 text-sky-500" />
                    <span>{t('nav.items', 'Items Database')}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setProductsAccordionOpen(!productsAccordionOpen);
                    }}
                    className="p-0.5 hover:text-[var(--text-main)] cursor-pointer"
                    title={t('nav.toggleItemCategories', 'Toggle item categories')}
                  >
                    <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] transition-transform duration-200 ${productsAccordionOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {productsAccordionOpen && (
                  <div className="pl-6 pr-1 py-1 space-y-0.5 border-l-2 border-[var(--border-subtle)] ml-4 animate-in fade-in slide-in-from-top-1 duration-150">
                    <Link
                      href="/items?tab=retail"
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        isProductsActive && currentTab === 'retail'
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold border border-sky-500/30'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 opacity-70" />
                        <span>{t('items.tabs.retail', 'Retail Merchandise')}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-subtle)]">59</span>
                    </Link>

                    <Link
                      href="/items?tab=furniture"
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        isProductsActive && currentTab === 'furniture'
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold border border-sky-500/30'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Armchair className="w-3.5 h-3.5 opacity-70" />
                        <span>{t('items.tabs.furniture', 'Furniture & Equipment')}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-subtle)]">656</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Accordion 2: Real Estate Database */}
              <div className="space-y-1">
                <div className={`w-full flex items-center justify-between px-3 rounded-lg text-xs font-medium transition-colors ${
                  isPropertiesActive
                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                }`}>
                  <Link
                    href="/real-estate"
                    className="flex items-center gap-2.5 flex-1"
                  >
                    <Building className="w-4 h-4 text-sky-500" />
                    <span>{t('nav.properties', 'Real Estate Portfolio')}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPropertiesAccordionOpen(!propertiesAccordionOpen);
                    }}
                    className="p-0.5 hover:text-[var(--text-main)] cursor-pointer"
                    title={t('nav.togglePropertyCategories', 'Toggle property categories')}
                  >
                    <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] transition-transform duration-200 ${propertiesAccordionOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {propertiesAccordionOpen && (
                  <div className="pl-6 pr-1 py-1 space-y-0.5 border-l-2 border-[var(--border-subtle)] ml-4 animate-in fade-in slide-in-from-top-1 duration-150">
                    <Link
                      href="/real-estate?type=retail"
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        isPropertiesActive && currentType === 'retail'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Store className="w-3.5 h-3.5 opacity-70" />
                        <span>{t('nav.retailStores', 'Retail Stores')}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-subtle)]">262</span>
                    </Link>

                    <Link
                      href="/real-estate?type=office"
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        isPropertiesActive && currentType === 'office'
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/30'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-3.5 h-3.5 opacity-70" />
                        <span>{t('nav.officeBuildings', 'Office Buildings')}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-subtle)]">130</span>
                    </Link>

                    <Link
                      href="/real-estate?type=warehouse"
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        isPropertiesActive && currentType === 'warehouse'
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold border border-sky-500/30'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Warehouse className="w-3.5 h-3.5 opacity-70" />
                        <span>{t('nav.warehouses', 'Warehouses')}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-subtle)]">69</span>
                    </Link>

                    <Link
                      href="/real-estate?type=residential"
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        isPropertiesActive && currentType === 'residential'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <House className="w-3.5 h-3.5 opacity-70" />
                        <span>{t('nav.residential', 'Residential')}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-subtle)]">363</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Database 3: Vehicles & Dealerships */}
              <div className="space-y-1">
                <div className={`w-full flex items-center justify-between px-3 rounded-lg text-xs font-medium transition-colors ${
                  pathname === '/vehicles'
                    ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                }`}>
                  <Link
                    href="/vehicles"
                    className="flex items-center gap-2.5 flex-1"
                  >
                    <Truck className="w-4 h-4 text-sky-500" />
                    <span>{t('nav.vehicles', 'Vehicles & Fleet')}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setVehiclesAccordionOpen(!vehiclesAccordionOpen);
                    }}
                    className="p-0.5 hover:text-[var(--text-main)] cursor-pointer"
                    title={t('nav.toggleVehicleCategories', 'Toggle vehicle categories')}
                  >
                    <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] transition-transform duration-200 ${vehiclesAccordionOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {vehiclesAccordionOpen && (
                  <div className="pl-6 pr-1 py-1 space-y-0.5 border-l-2 border-[var(--border-subtle)] ml-4 animate-in fade-in slide-in-from-top-1 duration-150">
                    <Link
                      href="/vehicles?tab=vehicles"
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        pathname === '/vehicles' && searchParams.get('tab') !== 'dealerships'
                          ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold border border-sky-500/30'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 opacity-70" />
                        <span>{t('nav.vehicleFleet', 'Vehicle Fleet')}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-subtle)]">20</span>
                    </Link>

                    <Link
                      href="/vehicles?tab=dealerships"
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        pathname === '/vehicles' && searchParams.get('tab') === 'dealerships'
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/30'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Car className="w-3.5 h-3.5 opacity-70" />
                        <span>{t('nav.dealerships', 'Dealerships')}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-subtle)]">5</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* City & Operations Guide */}
              <div className="space-y-1">
                <div className="px-3 pb-1 text-[11px] font-bold tracking-wider text-[var(--text-subtle)] uppercase">
                  {t('nav.cityGuide', 'City & Operations Guide')}
                </div>
                <Link
                  href="/districts"
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    pathname === '/districts'
                      ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20 font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className={`w-4 h-4 ${pathname === '/districts' ? 'text-white' : 'text-sky-500'}`} />
                    <span>{t('nav.districts', 'District Atlas')}</span>
                  </div>
                </Link>
                <Link
                  href="/banking"
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    pathname === '/banking'
                      ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20 font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Landmark className={`w-4 h-4 ${pathname === '/banking' ? 'text-white' : 'text-sky-500'}`} />
                    <span>{t('nav.banking', 'Banking & Investments')}</span>
                  </div>
                </Link>
                <Link
                  href="/workforce"
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    pathname === '/workforce'
                      ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20 font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <GraduationCap className={`w-4 h-4 ${pathname === '/workforce' ? 'text-white' : 'text-sky-500'}`} />
                    <span>{t('nav.workforceGuide', 'Workforce & Education')}</span>
                  </div>
                </Link>
              </div>

              {/* Documentation & Methodology */}
              <div className="pt-2 border-t border-[var(--border-subtle)] space-y-0.5">
                <Link
                  href="/about"
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    pathname === '/about'
                      ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20 font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Info className={`w-4 h-4 ${pathname === '/about' ? 'text-white' : 'text-sky-500'}`} />
                    <span>{t('nav.about', 'About')}</span>
                  </div>
                </Link>

                <button
                  onClick={() => {
                    openSuggestion();
                    if (onClose) onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-[var(--text-muted)] hover:text-purple-500 hover:bg-[var(--bg-surface-hover)] cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Lightbulb className="w-4 h-4 text-purple-500" />
                    <span>{t('nav.sendSuggestion', 'Send Suggestion')}</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    openBugReport('bug');
                    if (onClose) onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-[var(--text-muted)] hover:text-rose-500 hover:bg-[var(--bg-surface-hover)] cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Bug className="w-4 h-4 text-rose-500" />
                    <span>{t('nav.reportBug', 'Report a Bug')}</span>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Status Bar, Settings Gear & Theme Switch */}
      <div className="p-3.5 border-t border-[var(--border-base)] flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => setIsChangelogOpen(true)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer group text-left"
          title={t('nav.gameVersionFooterTitle', 'Big Ambitions game version - click for the Companion changelog')}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span className="text-[11px] font-medium text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors underline-offset-2 hover:underline">
            {t('nav.gameVersionFooter', 'Game v1.0')}
          </span>
        </button>

        <div className="flex items-center gap-1.5">
          {isLiveWorkspace && (
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              aria-label={t('settings.liveHq', 'Live HQ Settings')}
              title={t('settings.liveHq', 'Live HQ Settings')}
              className="p-1.5 rounded-lg border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
            >
              <SettingsIcon className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={t('nav.toggleTheme', 'Toggle Theme')}
            title={t('nav.toggleThemeTitle', 'Toggle Light/Dark Theme')}
            className="p-1.5 rounded-lg border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </aside>

    <SettingsModal 
      isOpen={isSettingsOpen} 
      onClose={() => setIsSettingsOpen(false)} 
    />

    <ChangelogModal
      isOpen={isChangelogOpen}
      onClose={() => setIsChangelogOpen(false)}
    />
    </>
  );
}
