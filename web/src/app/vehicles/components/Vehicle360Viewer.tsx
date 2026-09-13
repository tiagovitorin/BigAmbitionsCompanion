'use client';

import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import { RotateCw } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import type { VehicleSpin } from '@/lib/vehicleSpins';
import { getVehicleDefaultFrame } from '@/lib/vehicleSpins';

interface Vehicle360ViewerProps {
  spin: VehicleSpin;
  alt: string;
}

// Pixels of horizontal pointer travel that advance the spin by one frame.
const PX_PER_FRAME = 12;

// Drag (or use the arrow keys) to rotate a vehicle through its pre-rendered 360
// frames. The frames are preloaded on mount so dragging never flickers.
export default function Vehicle360Viewer({ spin, alt }: Vehicle360ViewerProps) {
  const { t } = useTranslation();
  const [frame, setFrame] = useState(() => getVehicleDefaultFrame(spin));
  const dragRef = useRef<{ startX: number; startFrame: number } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = spin.sheetUrl;
  }, [spin]);

  // Reset to the default frame when a different vehicle opens. Deliberately keyed
  // on the id (not the whole spin object) so switching paint colour keeps the
  // current angle.
  useEffect(() => {
    setFrame(getVehicleDefaultFrame(spin));
  }, [spin.id]);

  const nudge = (delta: number) =>
    setFrame(prev => (((prev + delta) % spin.frames) + spin.frames) % spin.frames);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = { startX: event.clientX, startFrame: frame };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const framesMoved = Math.round((event.clientX - drag.startX) / PX_PER_FRAME);
    setFrame((((drag.startFrame - framesMoved) % spin.frames) + spin.frames) % spin.frames);
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // pointer capture was already released
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      nudge(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      nudge(1);
    }
  };

  // Sprite-sheet crop: background-position selects the cell for the current frame.
  const sheetCol = spin.cols > 0 ? frame % spin.cols : 0;
  const sheetRow = spin.cols > 0 ? Math.floor(frame / spin.cols) : 0;
  const sheetStyle = {
    backgroundImage: `url(${spin.sheetUrl})`,
    backgroundSize: `${spin.cols * 100}% ${spin.rows * 100}%`,
    backgroundPosition: `${spin.cols > 1 ? (sheetCol / (spin.cols - 1)) * 100 : 0}% ${spin.rows > 1 ? (sheetRow / (spin.rows - 1)) * 100 : 0}%`,
    backgroundRepeat: 'no-repeat'
  };

  return (
    <div
      role="img"
      aria-label={alt}
      tabIndex={0}
      style={{ backgroundColor: spin.background }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={handleKeyDown}
      className="relative w-full h-full flex items-center justify-center select-none cursor-grab active:cursor-grabbing touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
    >
      <div aria-hidden className="w-full h-full filter drop-shadow-sm pointer-events-none" style={sheetStyle} />
      <span className="pointer-events-none absolute top-1.5 left-2 flex items-center gap-1 text-[10px] font-mono text-slate-500">
        <RotateCw className="w-3 h-3" />
        {t('vehicles.dragToRotate', 'Drag to rotate')}
      </span>
      <span className="pointer-events-none absolute bottom-1.5 right-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 px-1.5 py-0.5 text-[10px] font-mono font-bold text-[var(--text-subtle)]">
        360°
      </span>
    </div>
  );
}
