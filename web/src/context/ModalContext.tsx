'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ModalReportMode = 'bug' | 'suggestion';

interface ModalContextType {
  isBugReportOpen: boolean;
  modalMode: ModalReportMode;
  openBugReport: (mode?: ModalReportMode | React.MouseEvent) => void;
  openSuggestion: () => void;
  closeBugReport: () => void;
  setModalMode: (mode: ModalReportMode) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isBugReportOpen, setIsBugReportOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalReportMode>('bug');

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{ mode?: ModalReportMode }>;
      if (customEvent.detail?.mode) {
        setModalMode(customEvent.detail.mode);
      }
      setIsBugReportOpen(true);
    };
    window.addEventListener('open-bug-report', handleOpen);
    return () => window.removeEventListener('open-bug-report', handleOpen);
  }, []);

  return (
    <ModalContext.Provider
      value={{
        isBugReportOpen,
        modalMode,
        openBugReport: (mode?: ModalReportMode | React.MouseEvent) => {
          if (typeof mode === 'string' && (mode === 'bug' || mode === 'suggestion')) {
            setModalMode(mode);
          } else {
            setModalMode('bug');
          }
          setIsBugReportOpen(true);
        },
        openSuggestion: () => {
          setModalMode('suggestion');
          setIsBugReportOpen(true);
        },
        closeBugReport: () => setIsBugReportOpen(false),
        setModalMode,
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
