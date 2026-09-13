'use client';

import React from 'react';
import { X, CircleCheck, RotateCcwClock, Radio, Cpu, Layers } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useEscapeToClose } from '@/lib/useEscapeToClose';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChangelogEntry {
  version: string;
  date: string;
  tag: string;
  tagColor: string;
  highlights: string[];
}

const CHANGELOG_DATA: ChangelogEntry[] = [
  {
    version: 'v2.5.0',
    date: 'September 13, 2026',
    tag: 'Latest Update',
    tagColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    highlights: [
      'Live HQ is reorganized into a grouped sidebar, one focused page per area (Stores, Supply Chain, Property, Money, Intelligence)',
      'Each business is a single scrollable page: Overview, Performance, Pricing, Schedule',
      'Chains & Brands is now a dashboard with KPI cards and a sortable, clickable table',
      'The Supply Chain page has an interactive flow map you can drag, trace and pin, with purchase orders, warehouses, production and fleet in one view, and click any node for a detailed, draggable panel you can pin open',
      'Properties and Money are rebuilt: a real estate portfolio (net worth, rentals against market rates, a market watch) and three focused Money pages (Finance & Treasury, Unit Economics, Investment Funds)',
      'Market Demand is a decision tool with coverage, whitespace, an opportunity score and a neighbourhood ranking',
      'Stores show an amenities checklist, a capacity heatmap and checkout bag-stock warnings, and every car, truck and boat has a real colour-tinted 3D render',
      'Uncle Fred is draggable and can be hidden, with Do Not Disturb and critical-only alerts',
      'Selectable sync speeds plus richer bug reports with auto-attached diagnostics',
      'An accuracy pass fixed business expense history, factory current-output timing, tax due dates (with the game\'s 20-day grace) and export-rate estimates'
    ]
  },
  {
    version: 'v2.4.0',
    date: 'September 9, 2026',
    tag: 'Previous Release',
    tagColor: 'bg-[var(--bg-base)] text-[var(--text-subtle)] border-[var(--border-base)]',
    highlights: [
      'Expanded live telemetry: vehicles, boats, investments, rivals, market events, manager plans and delivery contracts',
      'Fixed mod lag on large saves with day-scoped caching',
      'Selectable sync speeds, from real-time down to once per game day at midnight',
      'Addresses now match in-game street names across the app',
      'Residences now separate your real homes from investments and flag empty leased spaces',
      'Reworked settings with tabs, and much less noisy, grouped alerts',
      'Bug reports now attach a privacy-safe snapshot and auto-build diagnostics for lag and crash issues',
      'The Analyzer now shows real, factual fixes instead of made-up numbers'
    ]
  },
  {
    version: 'v2.3.2',
    date: 'September 5, 2026',
    tag: 'Previous Release',
    tagColor: 'bg-[var(--bg-base)] text-[var(--text-subtle)] border-[var(--border-base)]',
    highlights: [
      'Added Suggestions & Feature Requests, routed to Discord with a clean form',
      'Added direct Suggestions buttons in the navbar and sidebar',
      'Fixed a shift tooltip overflow on large offices and restored dynamic chart scales'
    ]
  },
  {
    version: 'v2.3.1',
    date: 'September 5, 2026',
    tag: 'Hotfix',
    tagColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    highlights: [
      'Fixed the mod version check warning',
      'Added the city skyline hero banner',
      'Updated the brand logo and favicons'
    ]
  },
  {
    version: 'v2.3.0',
    date: 'September 5, 2026',
    tag: 'Major Update',
    tagColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    highlights: [
      'Added the in-app Bug Report tool',
      'Added business financial history and performance graphs',
      'Added custom player business logos',
      'Alerts for staff issues now link straight to the employee',
      'Improved price ceiling calculations and stockout tracking',
      'Fixed several small bugs around net worth, staff alerts and the report window'
    ]
  },
  {
    version: 'v2.2.1',
    date: 'September 2, 2026',
    tag: 'Update',
    tagColor: 'bg-[var(--bg-base)] text-[var(--text-subtle)] border-[var(--border-base)]',
    highlights: [
      'Added Unstaffed Open Hours and Suboptimal Schedule alerts',
      'Added toast notifications with sound, mute and sensitivity controls',
      'Dashboard reconnects automatically on refresh',
      'Simplified refresh options and hardened the local connection'
    ]
  },
  {
    version: 'v2.2.0',
    date: 'August 31, 2026',
    tag: 'Previous Release',
    tagColor: 'bg-[var(--bg-base)] text-[var(--text-subtle)] border-[var(--border-base)]',
    highlights: [
      'Steam Workshop and MelonLoader versions of the mod',
      'A local, read-only bridge with no external network access',
      'Live HQ with staff scheduling, rush-hour radar and walkout warnings',
      'Supply chain warehouse tracking with delivery routing',
      'The game compendium, store builder, factory optimizer and pricing advisor'
    ]
  },
  {
    version: 'v1.0.0',
    date: 'August 30, 2026',
    tag: 'Initial Release',
    tagColor: 'bg-[var(--bg-base)] text-[var(--text-subtle)] border-[var(--border-base)]',
    highlights: [
      'Initial game compendium and pricing/factory calculators'
    ]
  }
];

export function ChangelogModal({ isOpen, onClose }: ChangelogModalProps) {
  const { t } = useTranslation();
  useEscapeToClose(isOpen, onClose);
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 px-6 border-b border-[var(--border-base)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500 flex items-center justify-center">
              <RotateCcwClock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-main)]">{t('common.changelogTitle', 'Application Changelog')}</h2>
              <p className="text-[11px] text-[var(--text-subtle)]">{t('common.changelogSubtitle', 'Updates, features, and release notes')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-subtle)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
            aria-label={t('common.close', 'Close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {CHANGELOG_DATA.map((entry) => (
            <div key={entry.version} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-[var(--text-main)]">{entry.version}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${entry.tagColor}`}>
                    {entry.tag}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[var(--text-subtle)]">{entry.date}</span>
              </div>

              <ul className="space-y-2 text-xs text-[var(--text-muted)]">
                {entry.highlights.map((h, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed">
                    <CircleCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[var(--border-base)] bg-[var(--bg-base)] flex items-center justify-between text-xs">
          <span className="text-[11px] text-[var(--text-subtle)] font-mono">{t('common.companionSuite', 'Big Ambitions Companion Suite')}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] text-[var(--text-main)] font-semibold transition-colors cursor-pointer text-xs"
          >
            {t('common.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
}
