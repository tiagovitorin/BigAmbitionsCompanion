'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  SUPPORTED_LANGUAGES, 
  DEFAULT_LANGUAGE, 
  getLanguageByCode, 
  LanguageOption 
} from '@/locales/languages';
import enDict from '@/locales/en.json';
import { UI_DICTIONARIES, UiDictionary } from '@/locales';

interface LanguageContextType {
  locale: string;
  currentLanguage: LanguageOption;
  setLocale: (code: string) => void;
  availableLanguages: LanguageOption[];
  t: (path: string, fallback?: string) => string;
  tGame: (keyOrRawId: string | null | undefined, fallback?: string) => string;
  isLoadingGameStrings: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

// In-memory cache for game string dictionaries
const gameStringCache: Record<string, Record<string, string>> = {};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<string>(DEFAULT_LANGUAGE);
  const [gameStrings, setGameStrings] = useState<Record<string, string>>({});
  const [isLoadingGameStrings, setIsLoadingGameStrings] = useState<boolean>(false);

  // Initialize from localStorage or navigator
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ba_locale');
      let activeCode = DEFAULT_LANGUAGE;
      if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
        activeCode = saved;
        setLocaleState(saved);
      } else {
        // Auto-detect browser language if supported
        const navLang = navigator.language?.toLowerCase() || '';
        const matched = SUPPORTED_LANGUAGES.find(l => 
          l.code === navLang || navLang.startsWith(l.code + '-')
        );
        if (matched) {
          activeCode = matched.code;
          setLocaleState(matched.code);
        }
      }
    } catch {
      // Ignore storage errors
    }

    // Clean up any remaining legacy googtrans cookies
    try {
      ['/', ''].forEach(p => {
        ['', window.location.hostname, `.${window.location.hostname}`].forEach(d => {
          const domainAttr = d ? `; domain=${d}` : '';
          const pathAttr = p ? `; path=${p}` : '';
          document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC${pathAttr}${domainAttr};`;
        });
      });
    } catch {
      // Ignore
    }
  }, []);

  // Fetch official game translation strings asynchronously whenever locale changes
  useEffect(() => {
    if (gameStringCache[locale]) {
      setGameStrings(gameStringCache[locale]);
      return;
    }

    let isMounted = true;
    setIsLoadingGameStrings(true);

    fetch(`/locales/game/${locale}.json`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (isMounted) {
          gameStringCache[locale] = data;
          setGameStrings(data);
          setIsLoadingGameStrings(false);
        }
      })
      .catch(err => {
        console.warn(`[i18n] Failed to load official game dictionary for ${locale}:`, err);
        // Fallback to English game strings if not already English
        if (locale !== 'en' && !gameStringCache['en']) {
          fetch('/locales/game/en.json')
            .then(res => res.json())
            .then(data => {
              if (isMounted) {
                gameStringCache['en'] = data;
                setGameStrings(data);
                setIsLoadingGameStrings(false);
              }
            })
            .catch(() => {
              if (isMounted) setIsLoadingGameStrings(false);
            });
        } else if (locale !== 'en' && gameStringCache['en']) {
          if (isMounted) {
            setGameStrings(gameStringCache['en']);
            setIsLoadingGameStrings(false);
          }
        } else {
          if (isMounted) setIsLoadingGameStrings(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [locale]);

  const setLocale = useCallback((newCode: string) => {
    const valid = getLanguageByCode(newCode);
    setLocaleState(valid.code);
    try {
      localStorage.setItem('ba_locale', valid.code);
      document.documentElement.lang = valid.code;
      document.documentElement.dir = valid.dir || 'ltr';
    } catch {
      // Storage unavailable
    }
  }, []);

  // Web UI string lookup (e.g. t('nav.overview'))
  const t = useCallback((path: string, fallback?: string): string => {
    const parts = path.split('.');
    const activeDict = UI_DICTIONARIES[locale] || enDict;

    let curr: any = activeDict;
    for (const p of parts) {
      if (curr && typeof curr === 'object' && p in curr) {
        curr = curr[p];
      } else {
        curr = undefined;
        break;
      }
    }

    if (typeof curr === 'string') return curr;

    // Fallback to English dictionary
    let enCurr: any = enDict;
    for (const p of parts) {
      if (enCurr && typeof enCurr === 'object' && p in enCurr) {
        enCurr = enCurr[p];
      } else {
        enCurr = undefined;
        break;
      }
    }

    if (typeof enCurr === 'string') return enCurr;
    return fallback ?? path;
  }, [locale]);

  // Official Game string lookup (e.g. tGame('ba:itemname_bed1') or tGame('common_subwaystation'))
  const tGame = useCallback((keyOrRawId: string | null | undefined, fallback?: string): string => {
    if (!keyOrRawId) return fallback ?? '';

    // Direct match in active game strings
    if (gameStrings[keyOrRawId]) {
      return gameStrings[keyOrRawId];
    }

    // Try stripping ba: prefix or trying ba: prefix
    if (keyOrRawId.startsWith('ba:')) {
      const bare = keyOrRawId.slice(3);
      if (gameStrings[bare]) return gameStrings[bare];
    } else {
      const withBa = `ba:${keyOrRawId}`;
      if (gameStrings[withBa]) return gameStrings[withBa];
    }

    // Check English game cache if active language is missing the key
    if (locale !== 'en' && gameStringCache['en'] && gameStringCache['en'][keyOrRawId]) {
      return gameStringCache['en'][keyOrRawId];
    }

    return fallback ?? keyOrRawId;
  }, [gameStrings, locale]);

  const currentLanguage = getLanguageByCode(locale);

  return (
    <LanguageContext.Provider
      value={{
        locale,
        currentLanguage,
        setLocale,
        availableLanguages: SUPPORTED_LANGUAGES,
        t,
        tGame,
        isLoadingGameStrings,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
