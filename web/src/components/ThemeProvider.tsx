'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    // On mount, read the resolved theme from the HTML element
    // (already applied by the inline script in layout.tsx)
    const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setThemeState(current);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('ba_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
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
    </div>
  );
}

