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
    version: 'v2.2.1',
    date: 'September 2, 2026',
    tag: 'Latest Release',
    tagColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    highlights: [
      'Fix: Auto-reconnect on page refresh — no more manual "Check Connection" required.',
      'Fix: Eliminated hydration flash of the initial Live Sync connection page on reload.',
      'Fix: isLiveWorkspace initialization order error in Sidebar causing runtime crash.',
      'Fix: Suboptimal Opening Window and Unstaffed Open Hours alerts now appear in Decision Analyzer.',
      'Fix: Alert notifications now auto-dismiss and link directly to the affected business.',
      'Improvement: Bell notification system with mute toggle and toast-style popups with sound.',
      'Improvement: CORS-compliant origin validation tightened in C# mod endpoint.',
      'Improvement: Telemetry sync mode now defaults to Normal (1.5s) explicitly.'
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
