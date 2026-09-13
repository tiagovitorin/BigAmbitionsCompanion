// Shared geometry and colour helpers for the supply chain flow map.

import type { SupplyChainNode, SupplyChainEdge } from './logistics';

export type NodeKind = SupplyChainNode['kind'];
export type Position = { x: number; y: number };

export const NODE_BG: Record<NodeKind, string> = {
  importer: '#0ea5e9',
  wholesaler: '#8b5cf6',
  warehouse: '#f59e0b',
  store: '#10b981'
};

export function hash01(text: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

// A small deterministic starting scatter. The force simulation then arranges the
// nodes freely; only the rendered positions get stretched to match the container.
export function seedScatter(id: string): Position {
  return {
    x: (hash01(`${id}:x`) - 0.5) * 500,
    y: (hash01(`${id}:y`) - 0.5) * 500
  };
}

// How far to stretch the settled layout along each axis. On a wide container the
// nodes spread horizontally; on a tall one vertically. Stretching only increases
// distances, so nodes never overlap more than the free layout already allows.
export function layoutStretch(wide: boolean): { kx: number; ky: number } {
  return wide ? { kx: 1.7, ky: 1 } : { kx: 1, ky: 1.7 };
}

export function edgeColor(edge: Pick<SupplyChainEdge, 'kind' | 'fulfillable' | 'partial'>): string {
  if (edge.kind === 'route') {
    if (edge.fulfillable) return '#10b981';
    if (edge.partial) return '#f59e0b';
    return '#f43f5e';
  }
  if (edge.kind === 'import') return '#0ea5e9';
  return '#8b5cf6';
}

// A quadratic bezier between two points, bowed perpendicular to the line so several
// edges sharing the same pair of columns do not stack on top of each other.
export function curvePath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const bend = Math.min(70, len * 0.16);
  const cx = (x1 + x2) / 2 - (dy / len) * bend;
  const cy = (y1 + y2) / 2 + (dx / len) * bend;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}
