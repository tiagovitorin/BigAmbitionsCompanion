'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ModalContextType {
  isBugReportOpen: boolean;
  openBugReport: () => void;
  closeBugReport: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsBugReportOpen(true);
    window.addEventListener('open-bug-report', handleOpen);
    return () => window.removeEventListener('open-bug-report', handleOpen);
  }, []);

  return (
    <ModalContext.Provider
      value={{
        isBugReportOpen,
        openBugReport: () => setIsBugReportOpen(true),
        closeBugReport: () => setIsBugReportOpen(false),
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
