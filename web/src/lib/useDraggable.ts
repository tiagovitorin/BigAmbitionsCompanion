'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

export interface DraggablePosition {
  right: number;
  bottom: number;
}

// In-memory only, on purpose: the position is remembered while the user navigates
// between pages inside the SPA, but a full page reload clears it and the widget
// returns to its default corner. Deliberately not localStorage/sessionStorage.
let savedPosition: DraggablePosition | null = null;

interface UseDraggableOptions {
  // Gap kept between the widget and the viewport edge.
  margin?: number;
  // Movement in pixels before a press counts as a drag rather than a click.
  threshold?: number;
  // On release, glide to the nearest left/right edge.
  snapToEdge?: boolean;
}

export function useDraggable({ margin = 12, threshold = 4, snapToEdge = true }: UseDraggableOptions = {}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<DraggablePosition | null>(savedPosition);
  // The canonical resting spot (the last dragged/snapped position). The displayed
  // position may be adjusted to fit while the chat is open, but this is never
  // overwritten by a size change, so closing the chat or resizing the window returns
  // the widget to where the user actually left it.
  const restingRef = useRef<DraggablePosition | null>(savedPosition);
  const [isDragging, setIsDragging] = useState(false);
  // Which border the widget hugs, so the caller can mirror its layout and the widget
  // grows away from the border instead of shifting across the screen.
  const sideRef = useRef<'left' | 'right' | null>(null);
  const [side, setSide] = useState<'left' | 'right'>('right');
  const dragRef = useRef<{ startX: number; startY: number; startLeft: number; startRight: number; startBottom: number; anchorLeft: boolean } | null>(null);
  const movedRef = useRef(false);

  // Distances are measured from the bottom-right corner, where the avatar sits.
  const clamp = useCallback((right: number, bottom: number): DraggablePosition => {
    const el = containerRef.current;
    const width = el?.offsetWidth ?? 0;
    const height = el?.offsetHeight ?? 0;
    const maxRight = Math.max(margin, window.innerWidth - width - margin);
    const maxBottom = Math.max(margin, window.innerHeight - height - margin);
    return {
      right: Math.min(Math.max(margin, right), maxRight),
      bottom: Math.min(Math.max(margin, bottom), maxBottom)
    };
  }, [margin]);

  // Which border the widget is closer to, based on where it currently sits.
  const sideFor = useCallback((pos: DraggablePosition, width: number): 'left' | 'right' => {
    const maxRight = Math.max(margin, window.innerWidth - width - margin);
    return maxRight - pos.right < pos.right - margin ? 'left' : 'right';
  }, [margin]);

  const setSideBoth = useCallback((next: 'left' | 'right') => {
    sideRef.current = next;
    setSide(next);
  }, []);

  // Move the widget and remember that as its resting spot.
  const applyResting = useCallback((next: DraggablePosition) => {
    restingRef.current = next;
    setSideBoth(sideFor(next, containerRef.current?.offsetWidth ?? 0));
    setPosition(next);
  }, [setSideBoth, sideFor]);

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    // Controls inside a drag handle (buttons, links, inputs) keep working normally,
    // but the drag handle itself may be a button (e.g. the avatar), so only bail when
    // the interactive element is a *descendant* rather than the handle itself.
    const interactive = target?.closest('button, a, input, textarea, select, [data-no-drag]');
    if (interactive && interactive !== event.currentTarget) return;
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Anchor to whichever border the widget hugs, so the size can change mid-drag
    // (the chat collapsing) without the widget jumping: a left-hugging widget tracks
    // its left edge, a right-hugging one tracks its right edge.
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startLeft: rect.left,
      startRight: window.innerWidth - rect.right,
      startBottom: window.innerHeight - rect.bottom,
      anchorLeft: sideRef.current === 'left'
    };
    movedRef.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!movedRef.current && Math.hypot(dx, dy) < threshold) return;
    movedRef.current = true;
    setIsDragging(true);
    const width = containerRef.current?.offsetWidth ?? 0;
    const right = drag.anchorLeft
      ? window.innerWidth - (drag.startLeft + dx) - width
      : drag.startRight - dx;
    applyResting(clamp(right, drag.startBottom - dy));
  }, [applyResting, clamp, threshold]);

  // Settle to whichever side border is closer, keeping the vertical position.
  const snap = useCallback((current: DraggablePosition): DraggablePosition => {
    const width = containerRef.current?.offsetWidth ?? 0;
    const maxRight = Math.max(margin, window.innerWidth - width - margin);
    const clamped = clamp(current.right, current.bottom);
    const huggingLeft = maxRight - clamped.right < clamped.right - margin;
    setSideBoth(huggingLeft ? 'left' : 'right');
    return { right: huggingLeft ? maxRight : margin, bottom: clamped.bottom };
  }, [clamp, margin, setSideBoth]);

  const endDrag = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setIsDragging(false);
    const current = restingRef.current;
    if (!current) return;
    const settled = snapToEdge ? snap(current) : current;
    savedPosition = settled;
    restingRef.current = settled;
    // Re-arm the CSS transition first, then move on the next frame so the glide to the
    // border actually animates instead of snapping in the same style recalculation.
    requestAnimationFrame(() => setPosition(settled));
  }, [snap, snapToEdge]);

  // Re-fit the displayed position for the current size without touching the resting
  // position, so any size change is reversible.
  const reflow = useCallback(() => {
    const resting = restingRef.current;
    const el = containerRef.current;
    if (!resting || !el) return;
    const width = el.offsetWidth;
    const maxRight = Math.max(margin, window.innerWidth - width - margin);
    const huggingLeft = sideRef.current ? sideRef.current === 'left' : sideFor(resting, width) === 'left';
    if (sideRef.current === null) setSideBoth(huggingLeft ? 'left' : 'right');
    const right = huggingLeft ? maxRight : resting.right;
    setPosition(clamp(right, resting.bottom));
  }, [clamp, margin, setSideBoth, sideFor]);

  useEffect(() => {
    reflow();
    window.addEventListener('resize', reflow);
    const el = containerRef.current;
    let observer: ResizeObserver | undefined;
    if (el && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(reflow);
      observer.observe(el);
    }
    return () => {
      window.removeEventListener('resize', reflow);
      observer?.disconnect();
    };
  }, [reflow]);

  return {
    containerRef,
    position,
    isDragging,
    side,
    // True when the last press turned into a drag, so the caller can ignore the click.
    wasDragged: () => movedRef.current,
    dragHandleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag
    }
  };
}
