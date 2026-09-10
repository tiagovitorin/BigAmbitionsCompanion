'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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
  Sparkles,
  Users,
  CreditCard,
  Radio,
  Wifi,
  ArrowLeft,
  Settings as SettingsIcon,
  Megaphone,
  Download,
  Database,
  ShieldCheck,
  Bug,
  Lightbulb,
  MapPin,
  Landmark,
  GraduationCap
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useLiveSync, EXPECTED_MOD_VERSION } from '@/context/LiveSyncContext';
import { useModal } from '@/context/ModalContext';
import { useTranslation } from '@/context/LanguageContext';
import { useEscapeToClose } from '@/lib/useEscapeToClose';
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

export function Sidebar({ 
  mobileOpen = false, 
  onClose 
}: { 
  mobileOpen?: boolean; 
  onClose?: () => void; 
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'retail';
  const currentType = searchParams.get('type') || 'all';
  const { theme, toggleTheme } = useTheme();
  const { state, isHydrated } = useLiveSync();
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
  const showLiveNav = isHydrated ? state.isConnected : false;
  const isProductsActive = pathname === '/items';
  const isPropertiesActive = pathname === '/real-estate';
  const [productsAccordionOpen, setProductsAccordionOpen] = useState(false);
  const [propertiesAccordionOpen, setPropertiesAccordionOpen] = useState(false);
  const [vehiclesAccordionOpen, setVehiclesAccordionOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);

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
          <div className="space-y-5">
            {/* Overview */}
            <div className="space-y-1">
              <Link
                href="/live-sync"
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  pathname === '/live-sync' && (!searchParams.get('view') || searchParams.get('view') === 'overview')
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4" />
                  <span>{showLiveNav ? t('nav.overview', 'Executive Overview') : t('nav.connectGame', 'Connect Game')}</span>
                </div>
                {!showLiveNav && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                    {t('nav.offline', 'OFFLINE')}
                  </span>
                )}
              </Link>
            </div>

            {/* Empire Assets (Only active when connected) */}
            {showLiveNav && (
              <div className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-[var(--text-subtle)] uppercase">
                  <span>{t('nav.empire', 'Empire')}</span>
                </div>
                <Link
                  href="/live-sync?view=stores"
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    pathname === '/live-sync' && searchParams.get('view') === 'stores'
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Store className="w-4 h-4" />
                    <span>{t('nav.businesses', 'Businesses')}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    pathname === '/live-sync' && searchParams.get('view') === 'stores'
                      ? 'bg-emerald-700/80 text-white border border-emerald-500/40'
                      : 'bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-main)]'
                  }`}>
                    {(state.businesses || []).filter(b => 
                      !b.isHeadquarters && 
                      !(b.rawType || '').includes('headquarters') && 
                      !(b.rawType || '').includes('hq') && 
                      !(b.type || '').toLowerCase().includes('headquarter') &&
                      !(b.type || '').toLowerCase().includes('hq')
                    ).length}
                  </span>
                </Link>
                <Link
                  href="/live-sync?view=residences"
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    pathname === '/live-sync' && searchParams.get('view') === 'residences'
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Building className="w-4 h-4" />
                    <span>{t('nav.residencesProperties', 'Residences & Properties')}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    pathname === '/live-sync' && searchParams.get('view') === 'residences'
                      ? 'bg-emerald-700/80 text-white border border-emerald-500/40'
                      : 'bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-main)]'
                  }`}>
                    {(state.residences?.length || 0) + (state.ownedRealEstate?.length || 0)}
                  </span>
                </Link>
              </div>
            )}

            {/* Operations (Only active when connected) */}
            {showLiveNav && (
              <div className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-[var(--text-subtle)] uppercase">
                  {t('nav.operations', 'Operations')}
                </div>
                <Link
                  href="/live-sync?view=staff"
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    pathname === '/live-sync' && searchParams.get('view') === 'staff'
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4" />
                    <span>{t('nav.workforce', 'Workforce & Shifts')}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    pathname === '/live-sync' && searchParams.get('view') === 'staff'
                      ? 'bg-emerald-700/80 text-white border border-emerald-500/40'
                      : 'bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-main)]'
                  }`}>
                    {state.totalEmployees}
                  </span>
                </Link>
                <Link
                  href="/live-sync?view=logistics"
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    pathname === '/live-sync' && searchParams.get('view') === 'logistics'
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Boxes className="w-4 h-4" />
                    <span>{t('nav.logistics', 'Logistics & Inventory')}</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    pathname === '/live-sync' && searchParams.get('view') === 'logistics'
                      ? 'bg-emerald-700/80 text-white border border-emerald-500/40'
                      : 'bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-main)]'
                  }`}>
                    {(state.vehicles?.length || 0) + (state.boats?.length || 0)}
                  </span>
                </Link>
              </div>
            )}

            {/* Finance & Intelligence (Only active when connected) */}
            {showLiveNav && (
              <div className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-[var(--text-subtle)] uppercase">
                  {t('nav.finance', 'Finance & Intelligence')}
                </div>
                <Link
                  href="/live-sync?view=finance"
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    pathname === '/live-sync' && searchParams.get('view') === 'finance'
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4" />
                    <span>{t('nav.profitLoss', 'Profit & Loss / Treasury')}</span>
                  </div>
                </Link>
                <Link
                  href="/live-sync?view=analyzer"
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    pathname === '/live-sync' && searchParams.get('view') === 'analyzer'
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>{t('nav.decisionAnalyzer', 'Decision Analyzer')}</span>
                  </div>
                </Link>
              </div>
            )}

            {/* System Diagnostics / Setup (Only when Offline or Version Mismatch) */}
            <div className="space-y-1">
              <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-[var(--text-subtle)] uppercase">
                {t('nav.setupMod', 'Setup & Mod')}
              </div>
              {(!state.isConnected || (state.modVersion && state.modVersion !== EXPECTED_MOD_VERSION)) && (
                <Link
                  href="/live-sync?view=mod"
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    pathname === '/live-sync' && searchParams.get('view') === 'mod'
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 font-semibold'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-emerald-500" />
                    <span>{t('nav.downloadSetup', 'Download & Setup')}</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${state.isConnected ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {state.isConnected ? 'UPDATE' : 'SETUP'}
                  </span>
                </Link>
              )}

              <Link
                href="/live-architecture"
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  pathname === '/live-architecture'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 font-semibold'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className={`w-4 h-4 ${pathname === '/live-architecture' ? 'text-white' : 'text-emerald-500'}`} />
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
                <div className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
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
                        <LayoutGrid className="w-3.5 h-3.5 opacity-70" />
                        <span>{t('items.tabs.furniture', 'Furniture & Equipment')}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-subtle)]">656</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Accordion 2: Real Estate Database */}
              <div className="space-y-1">
                <div className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
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
                        <Boxes className="w-3.5 h-3.5 opacity-70" />
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
                        <Building className="w-3.5 h-3.5 opacity-70" />
                        <span>{t('nav.residential', 'Residential')}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-subtle)]">363</span>
                    </Link>
                  </div>
                )}
              </div>

              {/* Database 3: Vehicles & Dealerships */}
              <div className="space-y-1">
                <div className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
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
                        <Store className="w-3.5 h-3.5 opacity-70" />
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
                    <Database className={`w-4 h-4 ${pathname === '/about' ? 'text-white' : 'text-sky-500'}`} />
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
