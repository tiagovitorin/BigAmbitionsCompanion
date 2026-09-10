'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { BugReportModal } from './BugReportModal';
import { GlobalUncleFredAdvisor } from './GlobalUncleFredAdvisor';
import { useModal } from '@/context/ModalContext';

type ThemePreference = 'light' | 'dark' | 'system';
type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme; // resolved theme currently applied
  themePreference: ThemePreference; // user choice (may be 'system')
  toggleTheme: () => void;
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [theme, setResolvedTheme] = useState<Theme>('light');

  // Read the saved preference once on mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ba_theme');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setThemePreference(stored);
      }
    } catch {
      // ignore storage failures
    }
  }, []);

  // Apply the resolved theme whenever the preference changes (and follow the OS
  // when the preference is "system").
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const resolved: Theme = themePreference === 'system' ? (media.matches ? 'dark' : 'light') : themePreference;
      setResolvedTheme(resolved);
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    };
    apply();

    if (themePreference === 'system') {
      media.addEventListener('change', apply);
      return () => media.removeEventListener('change', apply);
    }
    return;
  }, [themePreference]);

  const setTheme = (preference: ThemePreference) => {
    setThemePreference(preference);
    try {
      localStorage.setItem('ba_theme', preference);
    } catch {
      // ignore storage failures
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, themePreference, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isBugReportOpen, closeBugReport } = useModal();

  return (
    <div className="flex w-full min-h-screen">
      <React.Suspense fallback={<aside className="w-64 bg-[var(--bg-surface)] border-r border-[var(--border-base)] shrink-0 h-screen" />}>
        <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      </React.Suspense>
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)} />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 overflow-y-auto max-w-[1700px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Floating Bug Report Modal */}
      <BugReportModal isOpen={isBugReportOpen} onClose={closeBugReport} />

      {/* Global Floating Uncle Fred Tycoon Advisor */}
      <GlobalUncleFredAdvisor />
    </div>
  );
}
