'use client';

import { ReactNode, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

interface FloatingTooltipProps {
  content: ReactNode;
  children: ReactNode;
}

export default function FloatingTooltip({ content, children }: FloatingTooltipProps) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const handleMove = useCallback((e: React.MouseEvent) => {
    const x = e.clientX + 260 > window.innerWidth ? Math.max(10, e.clientX - 250) : e.clientX + 14;
    const y = e.clientY + 190 > window.innerHeight ? Math.max(10, e.clientY - 170) : e.clientY + 14;
    setPos({ x, y });
  }, []);

  return (
    <>
      <span
        className="inline-flex items-center gap-1.5 cursor-default"
        onMouseEnter={handleMove}
        onMouseMove={handleMove}
        onMouseLeave={() => setPos(null)}
      >
        {children}
      </span>
      {pos &&
        createPortal(
          <div
            className="fixed pointer-events-none z-[60] px-3.5 py-2.5 rounded-xl bg-slate-950 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs space-y-1 top-0 left-0 will-change-transform"
            style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
