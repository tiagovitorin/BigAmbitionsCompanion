'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

// Smoothly eases a number toward `target`, remembering the last shown value so
// switching between records sweeps from the old value to the new one (gauges
// should travel, not jump). Falls back to an instant jump when the user prefers
// reduced motion or the target is unchanged.
export function useAnimatedNumber(target: number, durationMs = 700): number {
  const prefersReduced = usePrefersReducedMotion();
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (prefersReduced) {
      displayRef.current = target;
      setDisplay(target);
      return;
    }
    const from = displayRef.current;
    if (from === target) return;

    const start = performance.now();
    const delta = target - from;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      if (t < 1) {
        const value = from + delta * eased;
        displayRef.current = value;
        setDisplay(value);
        rafRef.current = requestAnimationFrame(tick);
      } else {
        displayRef.current = target;
        setDisplay(target);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, durationMs, prefersReduced]);

  return display;
}
