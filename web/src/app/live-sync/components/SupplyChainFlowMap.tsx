'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceX,
  forceY,
  forceCollide
} from 'd3-force';
import type { Simulation, SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';
import { zoom, zoomIdentity } from 'd3-zoom';
import type { ZoomBehavior, ZoomTransform } from 'd3-zoom';
import { drag } from 'd3-drag';
import { select } from 'd3-selection';
import { Warehouse, Ship, Truck, Store, X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type {
  LiveWarehouseData,
  LiveBusinessData,
  LiveDeliveryContractData,
  LiveImportPartnershipData,
  LiveLogisticsPlanData
} from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import { buildSupplyChainGraph, SupplyChainNode, SupplyChainEdgeItem, resolveItemImage } from '@/lib/logistics';
import FloatingTooltip from './FloatingTooltip';

interface SupplyChainFlowMapProps {
  warehouses: LiveWarehouseData[];
  businesses: LiveBusinessData[];
  deliveryContracts: LiveDeliveryContractData[];
  importPartnerships: LiveImportPartnershipData[];
  logisticsPlans: LiveLogisticsPlanData[];
  gameDay: number;
}

interface ForceNode extends SimulationNodeDatum {
  id: string;
  address: string;
  name: string;
  kind: SupplyChainNode['kind'];
  icon?: string;
}

interface ForceLink extends SimulationLinkDatum<ForceNode> {
  id: string;
  kind: 'import' | 'route' | 'delivery';
  items: SupplyChainEdgeItem[];
  nextDeliveryDay?: number;
  fulfillable?: boolean;
  partial?: boolean;
}

type Position = { x: number; y: number };

const NODE_BG: Record<SupplyChainNode['kind'], string> = {
  importer: '#0ea5e9',
  wholesaler: '#8b5cf6',
  warehouse: '#f59e0b',
  store: '#10b981'
};

const KIND_ICONS: Record<'importer' | 'wholesaler' | 'warehouse', typeof Ship> = {
  importer: Ship,
  wholesaler: Truck,
  warehouse: Warehouse
};

function zoneX(kind: SupplyChainNode['kind']): number {
  switch (kind) {
    case 'importer': return 160;
    case 'warehouse': return 420;
    case 'store': return 680;
    case 'wholesaler': return 940;
  }
}

function edgeColor(l: ForceLink): string {
  if (l.kind === 'route') {
    if (l.fulfillable) return '#10b981';
    if (l.partial) return '#f59e0b';
    return '#f43f5e';
  }
  if (l.kind === 'import') return '#0ea5e9';
  return '#8b5cf6';
}

function seedPosition(n: SupplyChainNode, i: number, cache: Map<string, Position>): Position {
  const cached = cache.get(n.id);
  if (cached) return cached;
  return { x: zoneX(n.kind) + ((i % 3) - 1) * 30, y: 180 + (i % 6) * 70 };
}

export default function SupplyChainFlowMap({
  warehouses,
  businesses,
  deliveryContracts,
  importPartnerships,
  logisticsPlans,
  gameDay
}: SupplyChainFlowMapProps) {
  const { t, tGame } = useTranslation();

  const graph = useMemo(
    () => buildSupplyChainGraph(warehouses, businesses, deliveryContracts, importPartnerships, logisticsPlans, gameDay),
    [warehouses, businesses, deliveryContracts, importPartnerships, logisticsPlans, gameDay]
  );
  const graphRef = useRef(graph);
  graphRef.current = graph;

  const allNodes = useMemo(
    () => [...graph.importers, ...graph.wholesalers, ...graph.warehouses, ...graph.stores],
    [graph]
  );

  const topologySignature = useMemo(() => {
    const n = allNodes.map(x => x.id).sort().join('|');
    const e = graph.edges.map(x => x.id).sort().join('|');
    return `${n}#${e}`;
  }, [allNodes, graph.edges]);

  const svgRef = useRef<SVGSVGElement>(null);
  const zoomLayerRef = useRef<SVGGElement>(null);
  const zoomBehaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const zoomTransformRef = useRef<ZoomTransform>(zoomIdentity);
  const simRef = useRef<Simulation<ForceNode, undefined> | null>(null);
  const simNodesRef = useRef<ForceNode[]>([]);
  const simLinksRef = useRef<ForceLink[]>([]);
  const positionCacheRef = useRef<Map<string, Position>>(new Map());
  const selectedIdRef = useRef<string | null>(null);
  const positionsRef = useRef<Record<string, Position>>({});

  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [selectedId, setSelectedIdState] = useState<string | null>(null);
  const [overlayPos, setOverlayPos] = useState<{ x: number; y: number } | null>(null);

  const computeOverlayPos = useCallback(() => {
    const id = selectedIdRef.current;
    if (!id) return;
    const pos = positionsRef.current[id];
    const svgEl = svgRef.current;
    if (!pos || !svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const tr = zoomTransformRef.current;
    setOverlayPos({ x: rect.left + tr.applyX(pos.x), y: rect.top + tr.applyY(pos.y) });
  }, []);

  // Force simulation + zoom + drag. Runs only when the topology (node/edge set) changes.
  useLayoutEffect(() => {
    const svgEl = svgRef.current;
    const zoomLayer = zoomLayerRef.current;
    if (!svgEl || !zoomLayer || allNodes.length === 0) return;

    const simNodes: ForceNode[] = allNodes.map((n, i) => {
      const p = seedPosition(n, i, positionCacheRef.current);
      return { id: n.id, address: n.address, name: n.name, kind: n.kind, icon: n.icon, x: p.x, y: p.y };
    });
    const simLinks: ForceLink[] = graph.edges.map(e => ({
      id: e.id,
      source: e.from,
      target: e.to,
      kind: e.kind,
      items: e.items,
      nextDeliveryDay: e.nextDeliveryDay,
      fulfillable: e.fulfillable,
      partial: e.partial
    }));

    simNodesRef.current = simNodes;
    simLinksRef.current = simLinks;

    const seed: Record<string, Position> = {};
    simNodes.forEach(n => {
      if (n.x != null && n.y != null) seed[n.id] = { x: n.x, y: n.y };
    });
    positionsRef.current = seed;
    setPositions(seed);

    const simulation = forceSimulation<ForceNode>(simNodes)
      .force(
        'link',
        forceLink<ForceNode, ForceLink>(simLinks)
          .id(d => d.id)
          .distance(100)
          .strength(0.4)
      )
      .force('charge', forceManyBody().strength(-280))
      .force('x', forceX<ForceNode>(d => zoneX(d.kind)).strength(0.05))
      .force('y', forceY<ForceNode>(280).strength(0.04))
      .force('collide', forceCollide<ForceNode>(48))
      .on('tick', () => {
        const next: Record<string, Position> = {};
        simNodes.forEach(n => {
          if (n.x != null && n.y != null) {
            next[n.id] = { x: n.x, y: n.y };
            positionCacheRef.current.set(n.id, { x: n.x, y: n.y });
          }
        });
        positionsRef.current = next;
        setPositions(next);
        if (selectedIdRef.current) computeOverlayPos();
      });

    simRef.current = simulation;

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event: { transform: ZoomTransform }) => {
        zoomTransformRef.current = event.transform;
        select(zoomLayer).attr('transform', event.transform.toString());
        if (selectedIdRef.current) computeOverlayPos();
      });
    zoomBehaviorRef.current = zoomBehavior;
    select(svgEl).call(zoomBehavior);

    const dragBehavior = drag<SVGGElement, ForceNode>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
    select(svgEl).selectAll<SVGGElement, ForceNode>('g.flow-node').call(dragBehavior as any);

    return () => {
      simulation.stop();
      simRef.current = null;
      zoomBehaviorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topologySignature]);

  // Refresh edge fulfillment colors on every telemetry poll.
  useEffect(() => {
    const fulfillableById = new Map(graph.edges.map(e => [e.id, e.fulfillable]));
    const partialById = new Map(graph.edges.map(e => [e.id, e.partial]));
    simLinksRef.current.forEach(l => {
      if (l.kind === 'route') {
        l.fulfillable = fulfillableById.get(l.id);
        l.partial = partialById.get(l.id);
      }
    });
    setPositions(prev => ({ ...prev }));
  }, [graph.edges]);

  // Keep the detail overlay pinned to its node on scroll/resize.
  useEffect(() => {
    const handler = () => {
      if (selectedIdRef.current) computeOverlayPos();
    };
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [computeOverlayPos]);

  const selectedNode = selectedId ? allNodes.find(n => n.id === selectedId) || null : null;
  const selectedEdges = selectedId ? graph.edges.filter(e => e.from === selectedId || e.to === selectedId) : [];

  const handleNodeClick = (id: string) => {
    if (selectedIdRef.current === id) {
      selectedIdRef.current = null;
      setSelectedIdState(null);
      setOverlayPos(null);
    } else {
      selectedIdRef.current = id;
      setSelectedIdState(id);
      computeOverlayPos();
    }
  };

  const handleBackgroundClick = () => {
    selectedIdRef.current = null;
    setSelectedIdState(null);
    setOverlayPos(null);
  };

  const zoomBy = (factor: number) => {
    const svgEl = svgRef.current;
    const zb = zoomBehaviorRef.current;
    if (!svgEl || !zb) return;
    zb.scaleBy(select(svgEl) as any, factor);
  };

  const resetZoom = () => {
    const svgEl = svgRef.current;
    const zb = zoomBehaviorRef.current;
    if (!svgEl || !zb) return;
    zb.transform(select(svgEl) as any, zoomIdentity);
  };

  if (allNodes.length === 0) {
    return (
      <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-amber-500" />
          <span>{t('liveHq.supplyChain', 'Supply Chain Flow')}</span>
        </h3>
        <div className="py-6 text-center text-xs text-[var(--text-subtle)]">{t('liveHq.noSupplyChain', 'No supply chain routes yet')}</div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
          <Warehouse className="w-4 h-4 text-amber-500" />
          <span>{t('liveHq.supplyChain', 'Supply Chain Flow')}</span>
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-[var(--text-subtle)] mr-1 hidden sm:inline">
            {t('liveHq.supplyChainHint', 'Drag to pan, scroll to zoom, click a node for details')}
          </span>
          <button type="button" onClick={() => zoomBy(1.3)} className="p-1.5 rounded-lg border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer" title={t('liveHq.zoomIn', 'Zoom in')}>
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => zoomBy(0.7)} className="p-1.5 rounded-lg border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer" title={t('liveHq.zoomOut', 'Zoom out')}>
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={resetZoom} className="p-1.5 rounded-lg border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer" title={t('liveHq.resetZoom', 'Reset zoom')}>
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="relative border border-[var(--border-base)] rounded-xl overflow-hidden bg-[var(--bg-base)]">
        <svg ref={svgRef} className="w-full h-[420px] block" onDoubleClick={handleBackgroundClick}>
          <g ref={zoomLayerRef}>
            <g>
              {graph.edges.map(edge => {
                const src = positions[edge.from];
                const dst = positions[edge.to];
                if (!src || !dst) return null;
                const l = simLinksRef.current.find(x => x.id === edge.id);
                const color = l ? edgeColor(l) : '#6366f1';
                return (
                  <line
                    key={edge.id}
                    x1={src.x}
                    y1={src.y}
                    x2={dst.x}
                    y2={dst.y}
                    stroke={color}
                    strokeWidth={1.5}
                    strokeDasharray={edge.kind === 'delivery' ? '4 4' : undefined}
                    opacity={0.55}
                  />
                );
              })}
            </g>
            <g>
              {allNodes.map(node => {
                const pos = positions[node.id];
                if (!pos) return null;
                const KindIcon = node.kind === 'store' ? null : KIND_ICONS[node.kind];
                const isSelected = node.id === selectedId;
                return (
                  <g
                    key={node.id}
                    className="flow-node cursor-pointer"
                    transform={`translate(${pos.x},${pos.y})`}
                    onClick={(e) => { e.stopPropagation(); handleNodeClick(node.id); }}
                  >
                    <rect
                      x={-22}
                      y={-22}
                      width={44}
                      height={44}
                      rx={12}
                      fill={NODE_BG[node.kind]}
                      stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.7)'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />
                    {node.icon ? (
                      <image href={node.icon} x={-16} y={-16} width={32} height={32} preserveAspectRatio="xMidYMid meet" />
                    ) : KindIcon ? (
                      <g transform="translate(-12,-12)" className="text-white">
                        <KindIcon width={24} height={24} />
                      </g>
                    ) : (
                      <text y={4} textAnchor="middle" style={{ fill: '#fff', fontSize: 12, fontWeight: 700 }}>{'?'}</text>
                    )}
                    <text y={34} textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: 11 }}>{node.name}</text>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>

        {selectedNode && overlayPos && (
          <div
            className="fixed z-50 w-[300px] max-w-[calc(100vw-24px)] p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-2xl text-xs"
            style={{ left: overlayPos.x, top: overlayPos.y + 48, transform: 'translateX(-50%)' }}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-[var(--text-main)] truncate pr-2">{selectedNode.name}</span>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-subtle)]">
                  {selectedNode.kind}
                </span>
                <button type="button" onClick={handleBackgroundClick} className="p-0.5 rounded text-[var(--text-subtle)] hover:text-[var(--text-main)] cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {selectedEdges.length === 0 ? (
              <div className="text-[11px] text-[var(--text-subtle)]">{t('liveHq.noRoutes', 'No routes connected')}</div>
            ) : (
              <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                {selectedEdges.map(edge => {
                  const isRoute = edge.kind === 'route';
                  const otherId = edge.from === selectedId ? edge.to : edge.from;
                  const otherName = allNodes.find(n => n.id === otherId)?.name || otherId;
                  const direction = edge.from === selectedId ? t('liveHq.to', 'to') : t('liveHq.from', 'from');
                  return (
                    <div key={edge.id} className="p-2 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)]">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-[var(--text-subtle)]">{direction}</span>
                        <span className="font-semibold text-[var(--text-main)] truncate">{otherName}</span>
                        {isRoute ? (
                          edge.fulfillable ? (
                            <span className="ml-auto shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              {t('liveHq.canFulfill', 'Can fulfill')}
                            </span>
                          ) : edge.partial ? (
                            <span className="ml-auto shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400">
                              {t('liveHq.partiallyStocked', 'Partially stocked')}
                            </span>
                          ) : (
                            <span className="ml-auto shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500">
                              {t('liveHq.outOfStock', 'Out of stock')}
                            </span>
                          )
                        ) : edge.nextDeliveryDay != null ? (
                          <span className="ml-auto shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400">
                            {t('liveHq.scheduledDay', 'Day {n}').replace('{n}', String(edge.nextDeliveryDay))}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 divide-y divide-[var(--border-subtle)]/40">
                        {edge.items.map((it, i) => {
                          const icon = resolveItemImage(it.rawItemName);
                          const isRouteItem = isRoute && it.targetAmount != null;
                          const need = isRouteItem ? (it.predictedTopUp ?? it.topUp ?? 0) : 0;
                          const consumption = isRouteItem ? (it.predictedConsumption ?? 0) : 0;
                          const available = isRouteItem ? (it.available ?? 0) : 0;
                          const storeStock = it.storeStock ?? 0;
                          const targetAmount = it.targetAmount ?? 0;
                          const after = Math.max(0, available - need);
                          const predictedStock = Math.max(0, storeStock - consumption);
                          const colorClass =
                            need === 0
                              ? 'text-[var(--text-subtle)]'
                              : (it.shortfall ?? 0) === 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : available > 0
                                  ? 'text-amber-500'
                                  : 'text-rose-500';
                          return (
                            <div key={i} className="py-1 first:pt-0 last:pb-0">
                              <div className="flex items-center justify-between text-[11px] gap-2">
                                <span className="flex items-center gap-1.5 text-[var(--text-muted)] truncate">
                                  {icon ? (
                                    <span className="w-4 h-4 shrink-0 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden flex items-center justify-center">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={icon} alt="" className="w-full h-full object-contain" />
                                    </span>
                                  ) : (
                                    <span className="w-4 h-4 shrink-0" />
                                  )}
                                  {tGame(it.rawItemName, it.itemName)}
                                </span>
                                {isRouteItem ? (
                                  consumption > 0 ? (
                                    <span className="font-mono text-[9px] shrink-0 text-[var(--text-subtle)]">
                                      {t('liveHq.predictedSalesLabel', '~{n} sold in {days}d')
                                        .replace('{n}', consumption.toLocaleString())
                                        .replace('{days}', (it.daysUntilDelivery ?? 1).toString())}
                                    </span>
                                  ) : null
                                ) : it.amount != null ? (
                                  <span className="font-mono shrink-0 text-[var(--text-main)]">x{it.amount.toLocaleString()}</span>
                                ) : null}
                              </div>
                              {isRouteItem ? (
                                <div className="mt-0.5 flex flex-col items-end space-y-0.5 font-mono text-[10px]">
                                  <div className="text-[var(--text-muted)]">
                                    <FloatingTooltip
                                      content={
                                        <div className="space-y-1">
                                          <div className="font-bold text-[11px]">{t('liveHq.storeStockTooltipTitle', 'Store Stock')}</div>
                                          <div className="flex items-center justify-between gap-4 text-slate-300 text-[11px]">
                                            <span>{t('liveHq.currentStockLabel', 'Current')}</span>
                                            <span className="font-mono font-bold text-white">{storeStock.toLocaleString()}</span>
                                          </div>
                                          {consumption > 0 ? (
                                            <div className="flex items-center justify-between gap-4 text-slate-300 text-[11px]">
                                              <span>{t('liveHq.predictedAtDeliveryLabel', 'Predicted at delivery')}</span>
                                              <span className="font-mono font-bold text-white">{predictedStock.toLocaleString()}</span>
                                            </div>
                                          ) : null}
                                          <div className="flex items-center justify-between gap-4 text-slate-300 text-[11px]">
                                            <span>{t('liveHq.goalStockLabel', 'Goal')}</span>
                                            <span className="font-mono font-bold text-white">{targetAmount.toLocaleString()}</span>
                                          </div>
                                        </div>
                                      }
                                    >
                                      <Store className="w-3 h-3 shrink-0 text-[var(--text-subtle)]" />
                                      <span>
                                        {storeStock.toLocaleString()}
                                        {consumption > 0 ? ` (${predictedStock.toLocaleString()})` : ''} / {targetAmount.toLocaleString()}
                                      </span>
                                    </FloatingTooltip>
                                  </div>
                                  <div className="text-[var(--text-muted)]">
                                    <FloatingTooltip
                                      content={
                                        <div className="space-y-1">
                                          <div className="font-bold text-[11px]">{t('liveHq.warehouseStockTooltipTitle', 'Warehouse Stock')}</div>
                                          <div className="flex items-center justify-between gap-4 text-slate-300 text-[11px]">
                                            <span>{t('liveHq.availableLabel', 'Available')}</span>
                                            <span className="font-mono font-bold text-white">{available.toLocaleString()}</span>
                                          </div>
                                          {need > 0 && available > 0 ? (
                                            <div className="flex items-center justify-between gap-4 text-slate-300 text-[11px]">
                                              <span>{t('liveHq.remainingAfterLabel', 'After this store')}</span>
                                              <span className="font-mono font-bold text-white">{after.toLocaleString()}</span>
                                            </div>
                                          ) : null}
                                        </div>
                                      }
                                    >
                                      <Warehouse className="w-3 h-3 shrink-0 text-[var(--text-subtle)]" />
                                      <span className={colorClass}>
                                        {available.toLocaleString()}
                                        {need > 0 && available > 0 ? ` → ${after.toLocaleString()}` : ''}
                                      </span>
                                    </FloatingTooltip>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
