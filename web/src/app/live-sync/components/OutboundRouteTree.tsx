'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Factory, Ship, Store, Warehouse } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { OutboundRoute } from '@/lib/productionModel';
import { money } from '@/lib/productionUi';
import { resolveItemImage } from '@/lib/logistics';
import { ItemIcon } from './SupplyChainDetailAtoms';

interface OutboundRouteTreeProps {
  siteName: string;
  siteAddress: string;
  routes: OutboundRoute[];
}

interface VanSegment {
  elbowY: number;
  endX: number;
}

const TRUNK_X = 28; // px, aligns with the factory icon centre (left-7)
const VAN_END_GAP = 8; // stop the van just short of the destination card
const VAN_SPEED = 65; // px per second
const VAN_PAUSE = 1.0; // seconds a destination waits after a van arrives before the next departs
const VAN_STAGGER = 0.6; // initial departure offset per route so they don't all leave together

function DestinationIcon({ route }: { route: OutboundRoute }) {
  const className = 'w-3.5 h-3.5';
  if (route.isExport) return <Ship className={`${className} text-violet-500`} />;
  const haystack = `${route.businessName} ${route.destination}`.toLowerCase();
  if (/warehouse|depot|storage/.test(haystack)) return <Warehouse className={`${className} text-sky-500`} />;
  return <Store className={`${className} text-emerald-500`} />;
}

// Top-down van facing right; the driver rotates it to point down while on the trunk.
function TopDownVan({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} fill="none" aria-hidden>
      <rect x="1" y="2.5" width="22" height="11" rx="3" fill="currentColor" />
      <rect x="14.5" y="4.5" width="5.5" height="7" rx="1.5" fill="#fff" fillOpacity="0.82" />
      <rect x="3" y="4.5" width="9" height="7" rx="1" fill="#fff" fillOpacity="0.18" />
    </svg>
  );
}

export default function OutboundRouteTree({ siteName, siteAddress, routes }: OutboundRouteTreeProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const vanRefs = useRef<(HTMLDivElement | null)[]>([]);
  const routesRef = useRef(routes);
  routesRef.current = routes;
  const [segments, setSegments] = useState<VanSegment[]>([]);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerTop = container.getBoundingClientRect().top;
    const next = routesRef.current.map((_, index) => {
      const row = rowRefs.current[index];
      if (!row) return { elbowY: 0, endX: TRUNK_X };
      const rect = row.getBoundingClientRect();
      const card = row.children[1] as HTMLElement | undefined;
      return {
        elbowY: Math.round(rect.top - containerTop + rect.height / 2),
        endX: Math.round((card?.offsetLeft ?? 80) - VAN_END_GAP)
      };
    });
    setSegments(prev => {
      const same = prev.length === next.length && prev.every((seg, i) => seg.elbowY === next[i].elbowY && seg.endX === next[i].endX);
      return same ? prev : next;
    });
  }, []);

  useEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    rowRefs.current.forEach(row => row && observer.observe(row));
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  useEffect(() => {
    measure();
  }, [routes.length, measure]);

  // Every destination runs its own loop: a van arrives, waits VAN_PAUSE, then the next one sets
  // off for that destination. Because each route has a different length the cadence differs per
  // route, so the scene never falls into a lock-step, repetitive pattern.
  useEffect(() => {
    if (segments.length === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const count = segments.length;
    const legs = segments.map(seg => (seg.elbowY + (seg.endX - TRUNK_X)) / VAN_SPEED);
    const periods = legs.map(total => total + VAN_PAUSE);
    const offsets = legs.map((_, i) => i * VAN_STAGGER);
    const start = performance.now();
    let raf = 0;

    const step = (now: number) => {
      const time = (now - start) / 1000;
      for (let i = 0; i < count; i++) {
        const el = vanRefs.current[i];
        if (!el) continue;
        const seg = segments[i];
        const local = time - offsets[i];
        const phase = local >= 0 ? local % periods[i] : -1;
        if (phase >= 0 && phase <= legs[i]) {
          const distance = phase * VAN_SPEED;
          const onTrunk = distance <= seg.elbowY;
          const x = onTrunk ? TRUNK_X : TRUNK_X + (distance - seg.elbowY);
          const y = onTrunk ? distance : seg.elbowY;
          const angle = onTrunk ? 90 : 0;
          el.style.opacity = '1';
          el.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg) translate(-50%, -50%)`;
        } else {
          el.style.opacity = '0';
        }
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [segments]);

  return (
    <div className="px-4 py-4">
      {/* Factory root */}
      <div className="relative z-10 inline-flex max-w-full items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/12 to-transparent px-3 py-2 shadow-xs">
        <span className="arch-flow-node flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/15">
          <Factory className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-xs font-bold text-[var(--text-main)]">{siteName}</div>
          <div className="truncate font-mono text-[10px] text-[var(--text-subtle)]">{siteAddress}</div>
        </div>
        <span className="ml-1 shrink-0 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
          {routes.length}
        </span>
      </div>

      {/* Vertical branch tree */}
      <div ref={containerRef} className="relative pt-3">
        <span aria-hidden className="tree-road-y absolute left-7 top-0 h-3 w-px" />

        {routes.map((route, index) => {
          const isLast = index === routes.length - 1;
          return (
            <div
              key={`${route.routeId}-${index}`}
              ref={el => { rowRefs.current[index] = el; }}
              className="tree-node-in group grid grid-cols-[5rem_minmax(0,1fr)] items-stretch"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              {/* Connectors */}
              <div className="relative" aria-hidden>
                <span className={`tree-road-y absolute left-7 top-0 w-px ${isLast ? 'h-1/2' : 'h-full'}`} />
                <span className="tree-road-x absolute left-7 right-0 top-1/2 h-px -translate-y-1/2" />
              </div>

              {/* Route card */}
              <div className="min-w-0 pb-3">
                <div className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-base)] px-3 py-2.5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-emerald-500/50 group-hover:shadow-md">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
                      <DestinationIcon route={route} />
                    </span>
                    <span className="truncate text-xs font-semibold text-[var(--text-main)]">{route.businessName}</span>
                    {route.isExport && (
                      <span className="shrink-0 rounded border border-violet-500/20 bg-violet-500/10 px-1 text-[9px] font-bold text-violet-500">
                        {t('liveHq.factoryExportRoute', 'Export')}
                      </span>
                    )}
                    <span className="ml-auto shrink-0 font-mono text-[9px] text-[var(--text-subtle)]">
                      {route.items.length} {t('liveHq.factoryRouteTargets', 'items')}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate font-mono text-[10px] text-[var(--text-subtle)]">{route.destination}</div>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {route.items.length > 0 ? (
                      route.items.map(item => (
                        <span
                          key={item.rawId}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-0.5 pl-1 pr-1.5"
                        >
                          <ItemIcon src={resolveItemImage(item.rawId)} size={16} />
                          <span className="text-[10px] text-[var(--text-muted)]">{item.name}</span>
                          <span className="font-mono text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">{money(item.target)}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-[var(--text-subtle)]">{t('liveHq.factoryRouteNoTargets', 'No item targets configured.')}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Delivery vans (positions driven by the animation effect above) */}
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {routes.map((route, index) => (
            <div
              key={`van-${route.routeId}-${index}`}
              ref={el => { vanRefs.current[index] = el; }}
              className="tree-van absolute left-0 top-0 flex origin-top-left opacity-0 transition-opacity duration-150"
            >
              <TopDownVan className="block h-4 w-4 text-amber-500 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
