'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, Search, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { getTwemojiFlagUrl } from '@/locales/languages';

interface LanguageSelectorProps {
  variant?: 'navbar' | 'modal' | 'compact';
  className?: string;
}

function EmojiFlag({ countryCode, emoji, className = 'w-5 h-5' }: { countryCode: string; emoji: string; className?: string }) {
  const [error, setError] = useState(false);
  const twemojiUrl = getTwemojiFlagUrl(countryCode);

  if (error) {
    return (
      <span className="text-base leading-none select-none flex items-center justify-center shrink-0" role="img" aria-label={countryCode}>
        {emoji}
      </span>
    );
  }

  return (
    <img
      src={twemojiUrl}
      alt={countryCode}
      onError={() => setError(true)}
      className={`${className} inline-block shrink-0 object-contain drop-shadow-xs select-none`}
      loading="lazy"
    />
  );
}

export function LanguageSelector({ variant = 'navbar', className = '' }: LanguageSelectorProps) {
  const { t, locale, setLocale, availableLanguages, currentLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const filteredLanguages = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return availableLanguages;
    return availableLanguages.filter(
      l => l.name.toLowerCase().includes(q) || 
           l.nativeName.toLowerCase().includes(q) || 
           l.code.toLowerCase().includes(q)
    );
  }, [availableLanguages, search]);

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl border border-[var(--border-base)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] hover:border-[var(--border-strong)] transition-all cursor-pointer shadow-xs ${
          variant === 'compact' 
            ? 'px-2 py-1' 
            : 'px-2.5 py-1.5'
        }`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title={`${t('common.languageWord', 'Language')}: ${currentLanguage.name}`}
      >
        <EmojiFlag countryCode={currentLanguage.countryCode} emoji={currentLanguage.flagEmoji} className="w-4 h-4" />
        <span className="font-mono tracking-wider font-bold text-[11px]">{currentLanguage.code.toUpperCase()}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div 
          className="absolute right-0 mt-1.5 w-72 max-h-[400px] bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100"
          role="listbox"
        >
          {/* Header & Search */}
          <div className="p-2.5 border-b border-[var(--border-base)] bg-[var(--bg-base)]">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[var(--text-subtle)] absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('common.searchLanguage', 'Search language...')}
                className="w-full pl-9 pr-3 py-1.5 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Languages List */}
          <div className="overflow-y-auto max-h-72 p-1.5 space-y-1 custom-scrollbar">
            {filteredLanguages.length === 0 ? (
              <div className="p-4 text-center text-xs text-[var(--text-subtle)]">
                {t('common.noLanguagesFound', 'No languages found')}
              </div>
            ) : (
              filteredLanguages.map((lang) => {
                const isSelected = lang.code === locale;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      setLocale(lang.code);
                      setIsOpen(false);
                    }}
                    role="option"
                    aria-selected={isSelected}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <EmojiFlag countryCode={lang.countryCode} emoji={lang.flagEmoji} className="w-5 h-5" />
                      <div className="truncate">
                        <div className="truncate font-semibold">{lang.nativeName}</div>
                        <div className="text-[10px] text-[var(--text-subtle)] truncate font-normal">{lang.name} ({lang.code.toUpperCase()})</div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
