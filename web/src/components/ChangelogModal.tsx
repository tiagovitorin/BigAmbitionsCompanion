'use client';

import React from 'react';
import { X, Sparkles, CheckCircle2, History, Radio, Cpu, Layers } from 'lucide-react';

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
    version: 'v2.3.2',
    date: 'September 5, 2026',
    tag: 'Latest Update',
    tagColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    highlights: [
      'Added dedicated Suggestions & Feature Requests submission system routed to Discord',
      'Added direct Suggestions buttons in top navbar and sidebar',
      'Optimized suggestion workflow with clean forms without technical diagnostics',
      'Fixed business calendar shift hover tooltip overflow on large offices (30+ staff)',
      'Restored dynamic Y-axis scales across store traffic and hourly customer graphs'
    ]
  },
  {
    version: 'v2.3.1',
    date: 'September 5, 2026',
    tag: 'Hotfix',
    tagColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    highlights: [
      'Fixed mod version check mismatch warning',
      'Added official city skyline hero banner to home page',
      'Updated brand logo and app favicons across navigation'
    ]
  },
  {
    version: 'v2.3.0',
    date: 'September 5, 2026',
    tag: 'Major Update',
    tagColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    highlights: [
      'Added in-app Bug Report tool',
      'Added business financial history and performance graphs',
      'Added custom player business logos',
      'Alerts for staff issues now link directly to the employee',
      'Only products with physical shelves are tracked for stockouts',
      'Improved neighborhood price ceiling calculations',
      'Staff alerts now highlight matching employees in the staff table',
      'Fixed Headquarters showing up in store counts and retail prices',
      'Fixed false unstaffed store alerts when staff work outside open hours',
      'Fixed negative net worth numbers displaying incorrectly',
      'Fixed bug report window closing when clicking outside the box',
      'Fixed copy button not working on HTTP connections',
      'Removed service fees from store stockout alerts'
    ]
  },
  {
    version: 'v2.2.1',
    date: 'September 2, 2026',
    tag: 'Update',
    tagColor: 'bg-[var(--bg-base)] text-[var(--text-subtle)] border-[var(--border-base)]',
    highlights: [
      'Added Unstaffed Open Hours alerts',
      'Added Suboptimal Schedule suggestions',
      'Added toast notifications with audio alerts',
      'Added mute and sound controls',
      'Dashboard now reconnects automatically on page refresh',
      'Simplified refresh rate options with 1.5s as default',
      'Added sliders to adjust alert sensitivity',
      'Hardened local mod connection security',
      'Optimized game telemetry data transfer',
      'Fixed page flickering when reloading the connection page',
      'Fixed navigation bar crash',
      'Removed manual Check Connection requirement'
    ]
  },
  {
    version: 'v2.2.0',
    date: 'August 31, 2026',
    tag: 'Previous Release',
    tagColor: 'bg-[var(--bg-base)] text-[var(--text-subtle)] border-[var(--border-base)]',
    highlights: [
      'Dual-Target Modding Architecture: Native Steam Workshop mod and standalone MelonLoader assembly.',
      'GET-Only HTTP micro-server on 127.0.0.1:8765 with zero external network access and strict origin validation.',
      'Live HQ Command Deck with 7x24 staff scheduling, hourly rush radar, and automatic walkout warnings.',
      'Supply chain warehouse tracking with daily consumption burn rates and delivery fleet routing.',
      'Comprehensive Compendium database of 791 items, 44 businesses, 885 properties, and verified game formulas.',
      'Interactive Store Builder, Factory Production Optimizer, and Dynamic Pricing Advisor.'
    ]
  },
  {
    version: 'v1.0.0',
    date: 'August 30, 2026',
    tag: 'Initial Release',
    tagColor: 'bg-[var(--bg-base)] text-[var(--text-subtle)] border-[var(--border-base)]',
    highlights: [
      'Initial game compendium extraction and database tables.',
      'Static calculation engines for pricing satisfaction and factory throughput.'
    ]
  }
];

export function ChangelogModal({ isOpen, onClose }: ChangelogModalProps) {
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
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-main)]">Application Changelog</h2>
              <p className="text-[11px] text-[var(--text-subtle)]">Updates, features, and release notes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-subtle)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
            aria-label="Close"
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
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t border-[var(--border-base)] bg-[var(--bg-base)] flex items-center justify-between text-xs">
          <span className="text-[11px] text-[var(--text-subtle)] font-mono">Big Ambitions Companion Suite</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] text-[var(--text-main)] font-semibold transition-colors cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
