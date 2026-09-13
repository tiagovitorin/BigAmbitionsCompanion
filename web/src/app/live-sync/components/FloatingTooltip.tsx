'use client';

import { ReactNode, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface FloatingTooltipProps {
  content: ReactNode;
  children: ReactNode;
  // Optional wrapper classes. Defaults to an inline chip; pass e.g. a flex item
  // class to use the tooltip on a layout element (like a bar in a bar chart).
  className?: string;
  onEnter?: () => void;
  onLeave?: () => void;
}

const CURSOR_GAP = 14;
const VIEWPORT_PAD = 8;

export default function FloatingTooltip({ content, children, className, onEnter, onLeave }: FloatingTooltipProps) {
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);

  const handleMove = useCallback((e: React.MouseEvent) => {
    setAnchor({ x: e.clientX, y: e.clientY });
    setPos({ x: e.clientX + CURSOR_GAP, y: e.clientY + CURSOR_GAP });
  }, []);

  // Once the tooltip is mounted we know its real size, so nudge it fully inside the
  // viewport (flip left/up when it would overflow). The previous version assumed a
  // ~250px width, which pushed narrow tooltips far to the left of the cursor.
  useLayoutEffect(() => {
    if (!pos || !anchor) return;
    const el = tipRef.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    let x = anchor.x + CURSOR_GAP;
    let y = anchor.y + CURSOR_GAP;
    if (x + w > window.innerWidth - VIEWPORT_PAD) x = anchor.x - w - CURSOR_GAP;
    if (y + h > window.innerHeight - VIEWPORT_PAD) y = anchor.y - h - CURSOR_GAP;
    x = Math.max(VIEWPORT_PAD, Math.min(x, window.innerWidth - w - VIEWPORT_PAD));
    y = Math.max(VIEWPORT_PAD, Math.min(y, window.innerHeight - h - VIEWPORT_PAD));
    if (x !== pos.x || y !== pos.y) setPos({ x, y });
  }, [pos, anchor]);

  return (
    <>
      <span
        className={className ?? 'inline-flex items-center gap-1.5 cursor-default'}
        onMouseEnter={(e) => { handleMove(e); onEnter?.(); }}
        onMouseMove={handleMove}
        onMouseLeave={() => { setPos(null); setAnchor(null); onLeave?.(); }}
      >
        {children}
      </span>
      {pos &&
        createPortal(
          <div
            ref={tipRef}
            className="fixed pointer-events-none z-[60] px-3.5 py-2.5 rounded-xl bg-slate-950 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md text-xs space-y-1 top-0 left-0"
            style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)` }}
          >
            {content}
          </div>,
          document.body
        )}
    </>
  );
}
