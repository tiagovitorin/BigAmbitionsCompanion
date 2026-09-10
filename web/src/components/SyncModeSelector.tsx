'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Clock } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { SYNC_MODES, getSyncMode, SyncModeId } from '@/lib/syncModes';

interface SyncModeSelectorProps {
  value: SyncModeId;
  onChange: (mode: SyncModeId) => void;
  className?: string;
}

const MENU_WIDTH = 256;
const MENU_MAX_HEIGHT = 320;

export function SyncModeSelector({ value, onChange, className = '' }: SyncModeSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; openUp: boolean } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Position the popover with fixed coordinates so it is never clipped by modal
  // scroll/overflow containers. Opens upward when there is not enough room below.
  const updatePosition = useCallback(() => {
    const trigger = containerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < MENU_MAX_HEIGHT + 16 && rect.top > spaceBelow;
    const left = Math.min(Math.max(8, rect.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - 8);
    const top = openUp ? Math.max(8, rect.top - 6) : rect.bottom + 6;
    setPos({ top, left, openUp });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [isOpen, updatePosition]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const current = getSyncMode(value);

  const menu = isOpen && pos && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={menuRef}
          role="listbox"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: MENU_WIDTH,
            transform: pos.openUp ? 'translateY(-100%)' : undefined,
            zIndex: 120,
          }}
          className="bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100"
        >
          <div className="overflow-y-auto p-1.5 space-y-1 custom-scrollbar">
            {SYNC_MODES.map((mode) => {
              const isSelected = mode.id === current.id;
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => {
                    onChange(mode.id);
                    setIsOpen(false);
                  }}
                  role="option"
                  aria-selected={isSelected}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className={`font-semibold ${isSelected ? 'font-bold' : ''}`}>
                      {t(mode.labelKey, mode.id)}
                    </span>
                    <span className="text-[10px] text-[var(--text-subtle)] font-normal">
                      {t(mode.descKey, '')}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />
                  )}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-[var(--border-base)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-strong)] transition-all cursor-pointer shadow-xs px-2.5 py-1.5"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Clock className="w-3.5 h-3.5 text-indigo-500" />
        <span>{t(current.labelKey, current.id)}</span>
        <span className="text-[10px] text-[var(--text-subtle)] font-normal">
          {t(current.descKey, '')}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {menu}
    </div>
  );
}
