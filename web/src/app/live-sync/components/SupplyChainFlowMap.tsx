'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useLayoutEffect } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCollide
} from 'd3-force';
import type { Simulation, SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';
import { zoom, zoomIdentity } from 'd3-zoom';
import type { ZoomBehavior, ZoomTransform } from 'd3-zoom';
import { select } from 'd3-selection';
import { Warehouse, Ship, Truck, Store, Factory, ZoomIn, ZoomOut, Maximize2, Search } from 'lucide-react';
import type {
  LiveWarehouseData,
  LiveBusinessData,
  LiveDeliveryContractData,
  LiveImportPartnershipData,
  LiveLogisticsPlanData
} from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';
import { buildSupplyChainGraph, SupplyChainNode, SupplyChainEdgeItem } from '@/lib/logistics';
import { NODE_BG, edgeColor, curvePath, seedScatter, layoutStretch } from '@/lib/supplyChainFlow';
import type { Position } from '@/lib/supplyChainFlow';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import SupplyChainDetailCard, { SUPPLY_PANEL_WIDTH } from './SupplyChainDetailCard';
import SupplyChainFlowLegend from './SupplyChainFlowLegend';
import BusinessLogo from './BusinessLogo';

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
  componentKey: string;
}

interface ForceLink extends SimulationLinkDatum<ForceNode> {
  id: string;
  kind: 'import' | 'route' | 'delivery';
  items: SupplyChainEdgeItem[];
  nextDeliveryDay?: number;
  fulfillable?: boolean;
  partial?: boolean;
}

// An open node detail window. `pinned` windows stay open when the user clicks
// elsewhere or presses Escape; unpinned ones close. `pos` is the window's top-left
// screen coordinate and is free to be dragged anywhere.
interface DetailPanel {
  id: string;
  pinned: boolean;
  pos: { x: number; y: number };
  z: number;
}

const KIND_ICONS: Record<'importer' | 'wholesaler' | 'warehouse', typeof Ship> = {
  importer: Ship,
  wholesaler: Truck,
  warehouse: Warehouse
};

type RouteStatus = 'covered' | 'tight' | 'short';

const STATUS_COLOR: Record<RouteStatus, string> = {
  covered: '#10b981',
  tight: '#f59e0b',
  short: '#f43f5e'
};

function routeStatus(edge: { kind: string; fulfillable?: boolean; partial?: boolean }): RouteStatus | null {
  if (edge.kind !== 'route') return null;
  if (edge.fulfillable) return 'covered';
  if (edge.partial) return 'tight';
  return 'short';
}

const LAYOUT_STORAGE_KEY = 'ba_supply_chain_layout_v5';
type LayoutFilter = 'all' | RouteStatus;

// Pull of every node toward its cluster anchor. Weak on purpose so the link
// force (how strongly neighbours chase each other) dominates while dragging.
const ANCHOR_FORCE_STRENGTH = 0.06;
// Layout tuning: the resting distance between connected nodes, how eagerly a
// neighbour follows the one ahead, how hard nodes repel each other, and the
// minimum gap the collision force enforces.
const LINK_DISTANCE = 82;
const LINK_STRENGTH = 0.55;
const CHARGE_STRENGTH = -190;
// How far a node's repulsion reaches. Widened to 500 so clusters begin to
// push each other away before they visually overlap rather than only once
// they are already on top of each other.
const CHARGE_RADIUS = 500;
const COLLIDE_RADIUS = 48;
// Minimum pointer travel (px in screen space) before a pointerdown+up is
// treated as a drag instead of a click. Prevents micro-jitter from suppressing
// the selection click immediately after grabbing a node.
const MIN_DRAG_PX = 4;

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
  const businessByAddress = useMemo(() => {
    const map = new Map<string, LiveBusinessData>();
    businesses.forEach(b => map.set(b.address, b));
    return map;
  }, [businesses]);
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
  const selectedIdRef = useRef<string | null>(null);
  const positionsRef = useRef<Record<string, Position>>({});

  // Restore a saved layout (node positions, pinned nodes, cluster anchors) once,
  // before the simulation runs.
  const positionCacheRef = useRef<Map<string, Position> | null>(null);
  const pinnedIdsRef = useRef<Set<string> | null>(null);
  const anchorsRef = useRef<Map<string, Position> | null>(null);
  if (!positionCacheRef.current || !pinnedIdsRef.current || !anchorsRef.current) {
    let saved: { positions: Record<string, Position>; pinned: string[]; anchors: Record<string, Position> } = { positions: {}, pinned: [], anchors: {} };
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { positions?: Record<string, Position>; pinned?: string[]; anchors?: Record<string, Position> };
          saved = { positions: parsed.positions ?? {}, pinned: parsed.pinned ?? [], anchors: parsed.anchors ?? {} };
        }
      } catch {
        // ignore a corrupt layout
      }
    }
    positionCacheRef.current = new Map(Object.entries(saved.positions));
    pinnedIdsRef.current = new Set(saved.pinned);
    anchorsRef.current = new Map(Object.entries(saved.anchors));
  }

  // Tracks a cluster being dragged. Only the grabbed node is pinned to the
  // pointer; its neighbours chase it through the link force like a string of
  // balloons, each hop lagging the one before it.
  const dragStateRef = useRef<{ key: string; id: string; moved: boolean; startAnchor: Position; startRoot: Position; startClient: Position } | null>(null);
  // While a component is being dragged its anchor force is neutralised (its
  // target becomes the node's own position) so the chain trails the cursor
  // instead of snapping rigidly back to a fixed point.
  const dragComponentRef = useRef<string | null>(null);
  const stretchRef = useRef<{ kx: number; ky: number }>({ kx: 1, ky: 1 });
  // Pointer capture (set on the SVG in handleNodePointerDown) retargets the
  // browser's click to the SVG element, so the node's React onClick never fires.
  // The latest handleNodeClick is kept here so the native pointerup handler can
  // still select a node on a click that did not move.
  const nodeClickHandlerRef = useRef<(id: string) => void>(() => {});

  const [positions, setPositions] = useState<Record<string, Position>>({});
  const [selectedId, setSelectedIdState] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [panels, setPanels] = useState<DetailPanel[]>([]);
  const panelsRef = useRef<DetailPanel[]>([]);
  panelsRef.current = panels;
  const panelZRef = useRef(0);
  const closeUnpinnedRef = useRef<() => void>(() => {});
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(() => new Set(pinnedIdsRef.current ?? []));
  const [filter, setFilter] = useState<LayoutFilter>('all');
  const [search, setSearch] = useState('');
  const [tipPos, setTipPos] = useState<{ x: number; y: number } | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [wide, setWide] = useState(true);

  // Persist the layout periodically and on unmount.
  useEffect(() => {
    const save = () => {
      try {
        window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify({
          positions: Object.fromEntries(positionCacheRef.current ?? []),
          pinned: [...(pinnedIdsRef.current ?? [])],
          anchors: Object.fromEntries(anchorsRef.current ?? [])
        }));
      } catch {
        // storage may be blocked or full
      }
    };
    const timer = setInterval(save, 2500);
    return () => { clearInterval(timer); save(); };
  }, []);

  // The worst route status touching each node, used for the alert rings.
  const nodeStatus = useMemo(() => {
    const map = new Map<string, RouteStatus>();
    const rank: Record<RouteStatus, number> = { covered: 0, tight: 1, short: 2 };
    graph.edges.forEach(e => {
      const status = routeStatus(e);
      if (!status) return;
      [e.from, e.to].forEach(id => {
        const prev = map.get(id);
        if (!prev || rank[status] > rank[prev]) map.set(id, status);
      });
    });
    return map;
  }, [graph.edges]);

  // The status filter greys out non-matching routes rather than hiding them.
  const matchingEdgeIds = useMemo(() => {
    if (filter === 'all') return null;
    return new Set(graph.edges.filter(e => routeStatus(e) === filter).map(e => e.id));
  }, [graph.edges, filter]);
  const matchingNodeIds = useMemo(() => {
    if (!matchingEdgeIds) return null;
    const set = new Set<string>();
    graph.edges.forEach(e => {
      if (matchingEdgeIds.has(e.id)) {
        set.add(e.from);
        set.add(e.to);
      }
    });
    return set;
  }, [graph.edges, matchingEdgeIds]);

  // Hover traces direct routes; a selection traces the whole reachable chain.
  const anchorId = hoveredId || selectedId;
  const deepTrace = !hoveredId && Boolean(selectedId);
  const trace = useMemo(() => {
    if (!anchorId) {
      if (selectedEdgeId) {
        const edge = graph.edges.find(e => e.id === selectedEdgeId);
        if (edge) return { nodes: new Set([edge.from, edge.to]), edges: new Set([edge.id]) };
      }
      return { nodes: null as Set<string> | null, edges: null as Set<string> | null };
    }
    const nodes = new Set<string>([anchorId]);
    const edges = new Set<string>();
    if (!deepTrace) {
      graph.edges.forEach(e => {
        if (e.from === anchorId || e.to === anchorId) {
          edges.add(e.id);
          nodes.add(e.from);
          nodes.add(e.to);
        }
      });
      return { nodes, edges };
    }
    const queue = [anchorId];
    while (queue.length) {
      const current = queue.shift() as string;
      graph.edges.forEach(e => {
        if (e.from !== current && e.to !== current) return;
        if (edges.has(e.id)) return;
        edges.add(e.id);
        const next = e.from === current ? e.to : e.from;
        if (!nodes.has(next)) {
          nodes.add(next);
          queue.push(next);
        }
      });
    }
    return { nodes, edges };
  }, [anchorId, deepTrace, selectedEdgeId, graph.edges]);

  const worldToScreen = useCallback((wx: number, wy: number) => {
    const svgEl = svgRef.current;
    if (!svgEl) return null;
    const rect = svgEl.getBoundingClientRect();
    const tr = zoomTransformRef.current;
    return { x: rect.left + tr.applyX(wx), y: rect.top + tr.applyY(wy) };
  }, []);

  // Screen-space position of a node at the current zoom/pan, used to anchor a
  // freshly opened detail window near its node.
  const nodeScreenPos = useCallback((id: string): { x: number; y: number } | null => {
    const pos = positionsRef.current[id];
    const svgEl = svgRef.current;
    if (!pos || !svgEl) return null;
    const rect = svgEl.getBoundingClientRect();
    const tr = zoomTransformRef.current;
    return { x: rect.left + tr.applyX(pos.x), y: rect.top + tr.applyY(pos.y) };
  }, []);

  // Zoom so the whole graph fits the frame (used on load and by the fit button).
  const fitToContent = useCallback(() => {
    const svgEl = svgRef.current;
    const zb = zoomBehaviorRef.current;
    if (!svgEl || !zb) return;
    const pts = Object.values(positionsRef.current);
    if (pts.length === 0) return;
    const minX = Math.min(...pts.map(p => p.x)) - 90;
    const maxX = Math.max(...pts.map(p => p.x)) + 90;
    const minY = Math.min(...pts.map(p => p.y), 0) - 70;
    const maxY = Math.max(...pts.map(p => p.y)) + 90;
    const w = svgEl.clientWidth || 1;
    const h = svgEl.clientHeight || 1;
    const scale = Math.max(0.2, Math.min(w / (maxX - minX), h / (maxY - minY), 1.5));
    const tx = (w - scale * (minX + maxX)) / 2;
    const ty = (h - scale * (minY + maxY)) / 2;
    zb.transform(select(svgEl) as any, zoomIdentity.translate(tx, ty).scale(scale));
  }, []);

  // Force simulation + zoom. Runs only when the topology (node/edge set) changes.
  useLayoutEffect(() => {
    const svgEl = svgRef.current;
    const zoomLayer = zoomLayerRef.current;
    if (!svgEl || !zoomLayer || allNodes.length === 0) return;

    const isWide = svgEl.clientWidth >= svgEl.clientHeight;
    const { kx, ky } = layoutStretch(isWide);
    const cache = positionCacheRef.current as Map<string, Position>;
    const pinned = pinnedIdsRef.current as Set<string>;

    // Label connected supply clusters by their smallest node id (stable across
    // re-runs) so separate clusters cannot pile up on top of each other.
    const adjacency = new Map<string, string[]>();
    graph.edges.forEach(e => {
      if (!adjacency.has(e.from)) adjacency.set(e.from, []);
      if (!adjacency.has(e.to)) adjacency.set(e.to, []);
      adjacency.get(e.from)?.push(e.to);
      adjacency.get(e.to)?.push(e.from);
    });
    const componentKeyOf = new Map<string, string>();
    const componentMembers = new Map<string, string[]>();
    allNodes.forEach(start => {
      if (componentKeyOf.has(start.id)) return;
      const members: string[] = [];
      const queue = [start.id];
      while (queue.length) {
        const current = queue.shift() as string;
        members.push(current);
        (adjacency.get(current) ?? []).forEach(next => {
          if (!componentKeyOf.has(next)) {
            componentKeyOf.set(next, start.id);
            queue.push(next);
          }
        });
      }
      const key = members.slice().sort()[0];
      members.forEach(id => componentKeyOf.set(id, key));
      componentMembers.set(key, members);
    });

    const anchors = anchorsRef.current as Map<string, Position>;

    // Build a fast id-to-kind lookup from allNodes so we can classify each cluster.
    const kindById = new Map<string, SupplyChainNode['kind']>();
    allNodes.forEach(n => kindById.set(n.id, n.kind));

    // Kind priority for ring/row ordering: sources (importers/wholesalers) go first
    // (left), warehouses go in the middle, stores go last (right). This gives the
    // natural supply-chain reading order left-to-right on a wide canvas.
    const clusterKindPriority = (key: string): number => {
      const members = componentMembers.get(key) ?? [];
      let best = 3;
      for (const id of members) {
        const k = kindById.get(id);
        const p = (k === 'importer' || k === 'wholesaler') ? 0
                : k === 'warehouse' ? 1
                : 2; // store
        if (p < best) best = p;
      }
      return best;
    };

    // Sort clusters: largest first (the hub cluster is most important visually),
    // then by supply-chain-kind priority, then by key as a stable tiebreaker.
    const sortedClusterKeys = [...componentMembers.keys()].sort((a, b) => {
      const sizeB = componentMembers.get(b)?.length ?? 0;
      const sizeA = componentMembers.get(a)?.length ?? 0;
      if (sizeB !== sizeA) return sizeB - sizeA;
      const pa = clusterKindPriority(a);
      const pb = clusterKindPriority(b);
      if (pa !== pb) return pa - pb;
      return a.localeCompare(b);
    });

    const defaultAnchor = (index: number, total: number): Position => {
      if (total <= 1) return { x: 0, y: 0 };
      // For 2-3 clusters use a horizontal row so no cluster is stranded at an
      // extreme edge. The spacing is intentionally generous so the link force has
      // room to spread each cluster's members without overlap.
      if (total <= 3) {
        const spacing = 240;
        return { x: (index - (total - 1) / 2) * spacing, y: 0 };
      }
      // Four or more clusters: ring arrangement.
      const radius = Math.max(180, (total * 260) / (2 * Math.PI));
      const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
      return { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    };

    sortedClusterKeys.forEach((key, index) => {
      if (!anchors.has(key)) anchors.set(key, defaultAnchor(index, componentMembers.size));
    });

    // The simulation runs in a free, unstretched space; only the rendered positions
    // are stretched to fill a wide or tall container.
    const simNodes: ForceNode[] = allNodes.map(n => {
      const componentKey = componentKeyOf.get(n.id) as string;
      const anchor = anchors.get(componentKey) ?? { x: 0, y: 0 };
      const cached = cache.get(n.id);
      const jitter = seedScatter(n.id);
      const seed = cached ?? { x: anchor.x + jitter.x * 0.3, y: anchor.y + jitter.y * 0.3 };
      const isPinned = pinned.has(n.id);
      return {
        id: n.id,
        address: n.address,
        name: n.name,
        kind: n.kind,
        icon: n.icon,
        componentKey,
        x: seed.x,
        y: seed.y,
        fx: isPinned ? seed.x : undefined,
        fy: isPinned ? seed.y : undefined
      };
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
      if (n.x != null && n.y != null) seed[n.id] = { x: n.x * kx, y: n.y * ky };
    });
    positionsRef.current = seed;
    setPositions(seed);

    // Anchor force: a weak spring pulling every node toward its cluster's ring
    // centre. Implemented as a custom force so the target is re-read every tick.
    // d3's forceX/forceY cache their target at initialisation, which would pin
    // the anchor forever and snap a dragged cluster back to its old spot. The
    // component being dragged is skipped so it can trail the cursor.
    const anchorForce = (alpha: number) => {
      const anchorMap = anchorsRef.current as Map<string, Position>;
      const draggedKey = dragComponentRef.current;
      simNodes.forEach(n => {
        if (n.componentKey === draggedKey || n.x == null || n.y == null) return;
        const a = anchorMap.get(n.componentKey);
        if (!a) return;
        n.vx = (n.vx ?? 0) + (a.x - n.x) * ANCHOR_FORCE_STRENGTH * alpha;
        n.vy = (n.vy ?? 0) + (a.y - n.y) * ANCHOR_FORCE_STRENGTH * alpha;
      });
    };

    const simulation = forceSimulation<ForceNode>(simNodes)
      .force(
        'link',
        forceLink<ForceNode, ForceLink>(simLinks)
          .id(d => d.id)
          .distance(LINK_DISTANCE)
          .strength(LINK_STRENGTH)
      )
      .force('charge', forceManyBody().strength(CHARGE_STRENGTH).distanceMax(CHARGE_RADIUS))
      .force('anchor', anchorForce)
      .force('collide', forceCollide<ForceNode>(COLLIDE_RADIUS))
      .on('tick', () => {
        const next: Record<string, Position> = {};
        simNodes.forEach(n => {
          if (n.x != null && n.y != null) {
            cache.set(n.id, { x: n.x, y: n.y });
            next[n.id] = { x: n.x * kx, y: n.y * ky };
          }
        });
        positionsRef.current = next;
        setPositions(next);
      });

    simRef.current = simulation;
    const fitTimer = setTimeout(fitToContent, 650);

    // Re-run the layout when the container flips between landscape and portrait.
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => {
          if (resizeTimer) clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            const nextWide = svgEl.clientWidth >= svgEl.clientHeight;
            setWide(prev => (prev === nextWide ? prev : nextWide));
          }, 250);
        })
      : null;
    resizeObserver?.observe(svgEl);

    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .filter((event: any) => {
        // Never start a pan when the gesture begins on a node; the node handles it.
        const target = event.target as Element | null;
        if (target && typeof target.closest === 'function' && target.closest('.flow-node')) return false;
        return (!event.ctrlKey || event.type === 'wheel') && !event.button;
      })
      .on('zoom', (event: { transform: ZoomTransform }) => {
        zoomTransformRef.current = event.transform;
        select(zoomLayer).attr('transform', event.transform.toString());
      });
    zoomBehaviorRef.current = zoomBehavior;
    // Disable dblclick-to-zoom on the selection (the behavior's own dispatcher
    // only knows start/zoom/end, so `dblclick.zoom` must be bound here).
    select(svgEl).call(zoomBehavior).on('dblclick.zoom', null);

    stretchRef.current = { kx, ky };

    // --- Native drag listeners ---
    // Pointer-capture re-routes native events to the SVG element even when the
    // cursor leaves it. React's synthetic event batching can miss captured
    // pointermove/pointerup events during fast movements, so we attach native
    // DOM listeners here instead of relying on React handlers on the SVG.

    const onNativePointerMove = (event: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state) return;
      // Only count as a drag once the cursor has actually moved a meaningful
      // distance - prevents micro-jitter from suppressing the selection click.
      if (!state.moved) {
        const dx = event.clientX - state.startClient.x;
        const dy = event.clientY - state.startClient.y;
        if (Math.hypot(dx, dy) < MIN_DRAG_PX) return;
        state.moved = true;
        // Heat the simulation exactly once, when actual movement is first
        // detected. Doing it here (not on every move) means the sim stays
        // cold when the user holds a node still - no more "swimming" effect.
        simRef.current?.alphaTarget(0.3).restart();
      }
      const simPos = toSim(event.clientX, event.clientY);
      if (simPos) applyClusterDrag(simPos.x, simPos.y);
    };

    const finishDrag = (event?: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state) return;
      // If the event has a pointer id, release the capture so the SVG no longer
      // receives rerouted events (avoids spurious moves after drop).
      if (event) {
        try { svgEl.releasePointerCapture(event.pointerId); } catch { /* already released */ }
      }
      const pinnedSet = pinnedIdsRef.current as Set<string>;
      const members = simNodesRef.current.filter(n => n.componentKey === state.key);
      // Translate the cluster anchor by the same amount the grabbed node moved
      // so the cluster settles where it was dropped instead of springing back
      // to its original ring position.
      const root = simNodesRef.current.find(n => n.id === state.id);
      const dx = (root?.x ?? state.startRoot.x) - state.startRoot.x;
      const dy = (root?.y ?? state.startRoot.y) - state.startRoot.y;
      (anchorsRef.current as Map<string, Position>).set(state.key, {
        x: state.startAnchor.x + dx,
        y: state.startAnchor.y + dy
      });
      members.forEach(n => {
        if (pinnedSet.has(n.id)) {
          if (n.fx == null) n.fx = n.x;
          if (n.fy == null) n.fy = n.y;
        } else {
          n.fx = null;
          n.fy = null;
        }
      });
      // Release the temporary freeze on every node that was frozen when this
      // drag started. User-pinned nodes keep their fx/fy; everything else is freed
      // so forces can settle the graph back to a stable layout.
      simNodesRef.current.forEach(n => {
        if (n.componentKey !== state.key && !pinnedSet.has(n.id)) {
          n.fx = null;
          n.fy = null;
        }
      });
      if (!state.moved) {
        // A press that did not move is a click. Pointer capture swallowed the
        // browser's click event, so select (or toggle) the node here instead.
        nodeClickHandlerRef.current(state.id);
      }
      dragStateRef.current = null;
      dragComponentRef.current = null;
      // Cool down: if the user actually dragged, give a gentle settle kick so
      // freed nodes can find their equilibrium. If they just clicked without
      // moving, there is nothing to settle - leave the sim cold.
      simRef.current?.alphaTarget(0);
      if (state.moved) simRef.current?.alpha(0.2).restart();
    };

    const onNativePointerUp = (event: PointerEvent) => finishDrag(event);
    // Safety net: if the user releases the mouse outside the browser window the
    // SVG never sees the pointerup. Listening on window ensures the drag always
    // ends cleanly so the simulation doesn't stay perpetually hot.
    const onWindowPointerUp = (event: PointerEvent) => {
      if (dragStateRef.current) finishDrag(event);
    };

    svgEl.addEventListener('pointermove', onNativePointerMove);
    svgEl.addEventListener('pointerup', onNativePointerUp);
    window.addEventListener('pointerup', onWindowPointerUp);

    return () => {
      clearTimeout(fitTimer);
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeObserver?.disconnect();
      simulation.stop();
      simRef.current = null;
      zoomBehaviorRef.current = null;
      svgEl.removeEventListener('pointermove', onNativePointerMove);
      svgEl.removeEventListener('pointerup', onNativePointerUp);
      window.removeEventListener('pointerup', onWindowPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topologySignature, wide]);

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

  const hoveredEdge = hoveredEdgeId ? graph.edges.find(e => e.id === hoveredEdgeId) || null : null;
  const nodeById = useMemo(() => new Map(allNodes.map(n => [n.id, n])), [allNodes]);

  const statusCounts = useMemo(() => {
    const counts: Record<RouteStatus, number> = { covered: 0, tight: 0, short: 0 };
    graph.edges.forEach(e => {
      const status = routeStatus(e);
      if (status) counts[status] += 1;
    });
    return counts;
  }, [graph.edges]);

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return allNodes.filter(n => n.name.toLowerCase().includes(q)).slice(0, 8);
  }, [search, allNodes]);

  const togglePin = (id: string) => {
    // Layout pin (double-click): fixes the node's position in the force layout.
    const next = new Set(pinnedIdsRef.current as Set<string>);
    if (next.has(id)) next.delete(id); else next.add(id);
    pinnedIdsRef.current = next;
    setPinnedIds(next);
    const node = simNodesRef.current.find(n => n.id === id);
    if (node) {
      if (next.has(id)) { node.fx = node.x; node.fy = node.y; }
      else { node.fx = null; node.fy = null; }
    }
    simRef.current?.alpha(0.3).restart();
  };

  // --- Detail windows ---

  // Raise a window to the top of the panel stack. Kept in a bounded 10..39 band so
  // windows never cover the hover tooltip (z-60) or app modals (z-50).
  const nextPanelZ = () => 10 + (panelZRef.current++ % 30);

  const bringToFront = (id: string) => {
    const z = nextPanelZ();
    setPanels(prev => prev.map(p => (p.id === id ? { ...p, z } : p)));
  };

  const openPanel = (id: string) => {
    const screen = nodeScreenPos(id);
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const width = Math.min(SUPPLY_PANEL_WIDTH, vw - 24);
    const anchorX = Math.min(Math.max((screen?.x ?? vw / 2) - width / 2, 8), Math.max(8, vw - width - 8));
    const anchorY = Math.min(Math.max((screen?.y ?? 80) + 40, 8), Math.max(8, vh - 140));
    const z = nextPanelZ();
    setPanels(prev => {
      // Opening a node closes every other unpinned window (the click was outside
      // them) but keeps pinned ones. The clicked window is raised or created.
      const kept = prev.filter(p => p.pinned || p.id === id);
      const existing = kept.some(p => p.id === id);
      if (existing) return kept.map(p => (p.id === id ? { ...p, z } : p));
      return [...kept, { id, pinned: false, pos: { x: anchorX, y: anchorY }, z }];
    });
  };

  const closePanel = (id: string) => {
    const next = panelsRef.current.filter(p => p.id !== id);
    setPanels(next);
    if (selectedIdRef.current === id) {
      const top = next.length ? next.reduce((a, b) => (a.z > b.z ? a : b)) : null;
      selectedIdRef.current = top ? top.id : null;
      setSelectedIdState(top ? top.id : null);
    }
  };

  // Escape and background clicks close every unpinned window but leave pinned ones.
  const closeUnpinnedPanels = () => {
    const current = panelsRef.current;
    if (!current.some(p => !p.pinned)) return;
    const kept = current.filter(p => p.pinned);
    setPanels(kept);
    if (!kept.some(p => p.id === selectedIdRef.current)) {
      const top = kept.length ? kept.reduce((a, b) => (a.z > b.z ? a : b)) : null;
      selectedIdRef.current = top ? top.id : null;
      setSelectedIdState(top ? top.id : null);
    }
  };
  closeUnpinnedRef.current = closeUnpinnedPanels;

  const togglePanelPin = (id: string) => {
    setPanels(prev => prev.map(p => (p.id === id ? { ...p, pinned: !p.pinned } : p)));
  };

  const movePanel = (id: string, pos: { x: number; y: number }) => {
    setPanels(prev => prev.map(p => (p.id === id ? { ...p, pos } : p)));
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeUnpinnedRef.current();
    };
    // Any pointer press that is not inside a detail window counts as "outside":
    // unpinned windows close, pinned ones stay. Capture phase so it runs before
    // the pressed control's own handlers.
    const onPointerDownOutside = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target && typeof target.closest === 'function' && (target.closest('[data-supply-panel]') || target.closest('.flow-node'))) return;
      closeUnpinnedRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDownOutside, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDownOutside, true);
    };
  }, []);

  // Detect a double tap ourselves so a double-click pins a node in the layout.
  const lastClickRef = useRef<{ id: string; time: number } | null>(null);
  const handleNodeClick = (id: string) => {
    const now = Date.now();
    const last = lastClickRef.current;
    if (last && last.id === id && now - last.time < 320) {
      lastClickRef.current = null;
      togglePin(id);
      return;
    }
    lastClickRef.current = { id, time: now };
    selectedIdRef.current = id;
    setSelectedIdState(id);
    setSelectedEdgeId(null);
    openPanel(id);
  };

  // Keep the native pointerup handler pointed at the latest click logic.
  nodeClickHandlerRef.current = handleNodeClick;

  const handleBackgroundClick = () => {
    lastClickRef.current = null;
    setSelectedEdgeId(null);
    closeUnpinnedPanels();
  };

  const handleEdgeClick = (id: string) => {
    setSelectedEdgeId(id);
    closeUnpinnedPanels();
  };

  const focusNode = (id: string) => {
    const pos = positionsRef.current[id];
    const svgEl = svgRef.current;
    const zb = zoomBehaviorRef.current;
    if (pos && svgEl && zb) {
      const w = svgEl.clientWidth || 1;
      const h = svgEl.clientHeight || 1;
      const scale = 1.1;
      zb.transform(select(svgEl) as any, zoomIdentity.translate(w / 2 - scale * pos.x, h / 2 - scale * pos.y).scale(scale));
    }
    selectedIdRef.current = id;
    setSelectedIdState(id);
    setSelectedEdgeId(null);
    setSearch('');
    setTimeout(() => openPanel(id), 0);
  };

  const statusLabel = (status: RouteStatus | null | undefined): string =>
    !status ? '' : status === 'covered' ? t('liveHq.filterCovered', 'Covered') : status === 'tight' ? t('liveHq.filterTight', 'Tight') : t('liveHq.filterShort', 'Short');

  const toSim = (clientX: number, clientY: number): Position | null => {
    const svgEl = svgRef.current;
    if (!svgEl) return null;
    const rect = svgEl.getBoundingClientRect();
    const tr = zoomTransformRef.current;
    const { kx, ky } = stretchRef.current;
    return { x: tr.invertX(clientX - rect.left) / kx, y: tr.invertY(clientY - rect.top) / ky };
  };

  const applyClusterDrag = (simX: number, simY: number) => {
    const state = dragStateRef.current;
    if (!state) return;
    const root = simNodesRef.current.find(n => n.id === state.id);
    if (root) {
      root.fx = simX;
      root.fy = simY;
    }
    // Sim reheating is handled in onNativePointerMove on first detected movement.
  };

  const handleNodePointerDown = (event: ReactPointerEvent<SVGGElement>, id: string) => {
    event.stopPropagation();
    const node = simNodesRef.current.find(n => n.id === id);
    if (!node) return;
    dragComponentRef.current = node.componentKey;
    const anchorMap = anchorsRef.current as Map<string, Position>;
    dragStateRef.current = {
      key: node.componentKey,
      id,
      moved: false,
      startAnchor: { ...(anchorMap.get(node.componentKey) ?? { x: node.x ?? 0, y: node.y ?? 0 }) },
      startRoot: { x: node.x ?? 0, y: node.y ?? 0 },
      startClient: { x: event.clientX, y: event.clientY }
    };
    // Freeze every node that is NOT part of the grabbed cluster so that forces
    // (charge, collide, anchor) cannot make unrelated clusters drift or swim
    // while this drag is active. Nodes that are already user-pinned already
    // have fx/fy set, so they are left unchanged.
    simNodesRef.current.forEach(n => {
      if (n.componentKey !== node.componentKey && n.fx == null) {
        n.fx = n.x;
        n.fy = n.y;
      }
    });
    // Capture so pointermove/pointerup keep arriving on the SVG even when the
    // cursor leaves it. Native capture is more reliable than React's synthetic
    // events for fast mouse movements.
    svgRef.current?.setPointerCapture(event.pointerId);
  };

  const zoomBy = (factor: number) => {
    const svgEl = svgRef.current;
    const zb = zoomBehaviorRef.current;
    if (!svgEl || !zb) return;
    zb.scaleBy(select(svgEl) as any, factor);
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
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
            <Warehouse className="w-4 h-4 text-amber-500" />
            <span>{t('liveHq.supplyChain', 'Supply Chain Flow')}</span>
          </h3>
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-subtle)] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('liveHq.supplySearchPlaceholder', 'Find a store or depot')}
                className="w-44 pl-8 pr-2 py-1.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-hidden focus:border-amber-500"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full right-0 mt-1.5 z-40 w-56 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl shadow-xl overflow-hidden py-1">
                  {searchResults.map(n => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => focusNode(n.id)}
                      className="w-full text-left px-3 py-1.5 text-xs text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] cursor-pointer flex items-center gap-2"
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: NODE_BG[n.kind] }} />
                      <span className="truncate">{n.name}</span>
                      <span className="ml-auto text-[9px] font-mono uppercase text-[var(--text-subtle)]">{n.kind}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={() => zoomBy(1.3)} className="p-1.5 rounded-lg border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer" title={t('liveHq.zoomIn', 'Zoom in')}>
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => zoomBy(0.7)} className="p-1.5 rounded-lg border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer" title={t('liveHq.zoomOut', 'Zoom out')}>
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={fitToContent} className="p-1.5 rounded-lg border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer" title={t('liveHq.fitToView', 'Fit to view')}>
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Route filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'short', 'tight', 'covered'] as LayoutFilter[]).map(key => {
            const active = filter === key;
            const count = key === 'all' ? graph.edges.filter(e => routeStatus(e)).length : statusCounts[key as RouteStatus];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-[var(--bg-base)] text-[var(--text-muted)] border-[var(--border-base)] hover:text-[var(--text-main)]'}`}
              >
                {key === 'all' ? t('liveHq.filterAll', 'All routes') : key === 'short' ? t('liveHq.filterShort', 'Short') : key === 'tight' ? t('liveHq.filterTight', 'Tight') : t('liveHq.filterCovered', 'Covered')}
                <span className="ml-1 font-mono opacity-80">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="relative border border-[var(--border-base)] rounded-xl overflow-hidden bg-[var(--bg-base)]"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--border-subtle) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }}
      >
        <svg
          ref={svgRef}
          className="w-full h-[420px] block select-none"
          style={{ userSelect: 'none', touchAction: 'none' }}
          onDoubleClick={handleBackgroundClick}
        >
          <g ref={zoomLayerRef}>
            {/* Edges */}
            <g>
              {graph.edges.map((edge, edgeIdx) => {
                const src = positions[edge.from];
                const dst = positions[edge.to];
                if (!src || !dst) return null;
                const l = simLinksRef.current.find(x => x.id === edge.id);
                const color = l ? edgeColor(l) : '#6366f1';
                const pathId = `sc-flow-${edgeIdx}`;
                const path = curvePath(src.x, src.y, dst.x, dst.y);
                const filterDim = Boolean(matchingEdgeIds && !matchingEdgeIds.has(edge.id));
                const traceDim = Boolean(trace.edges && !trace.edges.has(edge.id));
                const dimmed = filterDim || traceDim;
                const isEdgeSelected = edge.id === selectedEdgeId;
                return (
                  <g key={edge.id} opacity={filterDim ? 0.2 : traceDim ? 0.08 : 1}>
                    <path
                      id={pathId}
                      d={path}
                      fill="none"
                      stroke={color}
                      strokeWidth={isEdgeSelected ? 3 : trace.edges ? 2.5 : 1.5}
                      strokeDasharray={edge.kind === 'delivery' ? '4 4' : undefined}
                      opacity={0.55}
                    />
                    {/* Fat invisible hit area so edges can be hovered and clicked */}
                    <path
                      d={path}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={16}
                      pointerEvents="stroke"
                      className="cursor-pointer"
                      onMouseEnter={() => {
                        setHoveredEdgeId(edge.id);
                        setHoveredId(null);
                        setTipPos(worldToScreen((src.x + dst.x) / 2, (src.y + dst.y) / 2));
                      }}
                      onMouseLeave={() => setHoveredEdgeId(current => (current === edge.id ? null : current))}
                      onClick={(e) => { e.stopPropagation(); handleEdgeClick(edge.id); }}
                    />
                    {!prefersReducedMotion && !dimmed && (
                      <circle r={3} fill={color} opacity={0.9}>
                        <animateMotion
                          dur={`${edge.kind === 'route' ? (edge.fulfillable ? 3 : edge.partial ? 4.5 : 2.5) : 5}s`}
                          begin={`${(edgeIdx % 5) * 0.5}s`}
                          repeatCount="indefinite"
                        >
                          <mpath href={`#${pathId}`} xlinkHref={`#${pathId}`} />
                        </animateMotion>
                      </circle>
                    )}
                  </g>
                );
              })}
            </g>

            {/* Nodes */}
            <g>
              {allNodes.map(node => {
                const pos = positions[node.id];
                if (!pos) return null;
                const KindIcon = node.kind === 'store' ? null : KIND_ICONS[node.kind];
                const biz = node.kind === 'store' ? businessByAddress.get(node.address) : undefined;
                // Factories and other support sites have no storefront icon, so fall
                // back to a fitting glyph instead of a bare question mark.
                const rawType = (biz?.rawType || biz?.type || '').toLowerCase();
                const FallbackIcon = KindIcon || (rawType.includes('factory') ? Factory : node.kind === 'store' ? Store : null);
                const isSelected = node.id === selectedId;
                const isHovered = node.id === hoveredId;
                const filterDim = Boolean(matchingNodeIds && !matchingNodeIds.has(node.id));
                const traceDim = Boolean(trace.nodes && !trace.nodes.has(node.id));
                const ring = isSelected || isHovered;
                const status = nodeStatus.get(node.id);
                const isPinned = pinnedIds.has(node.id);
                return (
                  <g
                    key={node.id}
                    className="flow-node cursor-grab"
                    transform={`translate(${pos.x},${pos.y})`}
                    opacity={filterDim ? 0.3 : traceDim ? 0.15 : 1}
                    onPointerDown={(e) => handleNodePointerDown(e, node.id)}
                    onMouseEnter={() => {
                      setHoveredId(node.id);
                      setHoveredEdgeId(null);
                      setTipPos(worldToScreen(pos.x, pos.y));
                    }}
                    onMouseLeave={() => setHoveredId(current => (current === node.id ? null : current))}
                  >
                    {status && status !== 'covered' && (
                      <rect x={-26} y={-26} width={52} height={52} rx={15} fill="none" stroke={STATUS_COLOR[status]} strokeWidth={2.5} opacity={0.65} />
                    )}
                    {ring && <rect x={-30} y={-30} width={60} height={60} rx={17} fill={NODE_BG[node.kind]} opacity={0.22} />}
                    <rect
                      x={-22}
                      y={-22}
                      width={44}
                      height={44}
                      rx={12}
                      fill={NODE_BG[node.kind]}
                      stroke={ring ? '#fff' : 'rgba(255,255,255,0.7)'}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                      style={{ transition: 'stroke 150ms ease-out' }}
                    />
                    {biz?.logo?.base64 ? (
                      <foreignObject x={-16} y={-16} width={32} height={32}>
                        <div {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as any)} style={{ width: 32, height: 32 }}>
                          <BusinessLogo business={biz} sizeClass="w-8 h-8" />
                        </div>
                      </foreignObject>
                    ) : node.icon ? (
                      <image href={node.icon} x={-16} y={-16} width={32} height={32} preserveAspectRatio="xMidYMid meet" />
                    ) : FallbackIcon ? (
                      <g transform="translate(-12,-12)" className="text-white">
                        <FallbackIcon width={24} height={24} />
                      </g>
                    ) : (
                      <text y={4} textAnchor="middle" style={{ fill: '#fff', fontSize: 12, fontWeight: 700 }}>{'?'}</text>
                    )}
                    {isPinned && <circle cx={17} cy={-17} r={4.5} fill="#f59e0b" stroke="#fff" strokeWidth={1.5} />}
                    <text y={34} textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: 11 }}>{node.name}</text>
                  </g>
                );
              })}
            </g>
          </g>
        </svg>

        {panels.map(panel => {
          const node = allNodes.find(n => n.id === panel.id);
          if (!node) return null;
          const edges = graph.edges.filter(e => e.from === panel.id || e.to === panel.id);
          return (
            <SupplyChainDetailCard
              key={panel.id}
              node={node}
              edges={edges}
              allNodes={allNodes}
              position={panel.pos}
              zIndex={panel.z}
              onMove={(pos) => movePanel(panel.id, pos)}
              onFocus={() => bringToFront(panel.id)}
              onClose={() => closePanel(panel.id)}
              businesses={businesses}
              warehouses={warehouses}
              deliveryContracts={deliveryContracts}
              isPinned={panel.pinned}
              onTogglePin={() => togglePanelPin(panel.id)}
            />
          );
        })}

        {/* Hover tooltip */}
        {tipPos && (hoveredEdge || hoveredId) && (
          <div
            className="fixed z-[60] pointer-events-none px-2.5 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xl text-[11px]"
            style={{ left: tipPos.x, top: tipPos.y - 10, transform: 'translate(-50%, -100%)' }}
          >
            {hoveredEdge ? (
              <>
                <div className="font-bold text-[var(--text-main)]">
                  {nodeById.get(hoveredEdge.from)?.name} {'->'} {nodeById.get(hoveredEdge.to)?.name}
                </div>
                <div className="text-[var(--text-muted)]">
                  {statusLabel(routeStatus(hoveredEdge))}
                  {routeStatus(hoveredEdge) ? ' · ' : ''}
                  {hoveredEdge.items.length} {t('liveHq.itemsWord', 'items')}
                </div>
              </>
            ) : hoveredId ? (
              <>
                <div className="font-bold text-[var(--text-main)]">{nodeById.get(hoveredId)?.name}</div>
                <div className="text-[var(--text-muted)] capitalize">
                  {nodeById.get(hoveredId)?.kind} · {graph.edges.filter(e => e.kind === 'route' && (e.from === hoveredId || e.to === hoveredId)).length} {t('liveHq.routesWord', 'routes')}
                </div>
                {nodeStatus.get(hoveredId) && nodeStatus.get(hoveredId) !== 'covered' && (
                  <div className="font-semibold" style={{ color: STATUS_COLOR[nodeStatus.get(hoveredId) as RouteStatus] }}>
                    {nodeStatus.get(hoveredId) === 'short' ? t('liveHq.someShort', 'some routes short') : t('liveHq.someTight', 'some routes tight')}
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Legend */}
      <SupplyChainFlowLegend />
    </div>
  );
}
