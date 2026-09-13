'use client';

import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Ship, Store, Truck, Warehouse, Pin, X } from 'lucide-react';
import type { LiveBusinessData, LiveWarehouseData, LiveDeliveryContractData } from '@/context/LiveSyncContext';
import type { SupplyChainNode, SupplyChainEdge } from '@/lib/logistics';
import { NODE_BG } from '@/lib/supplyChainFlow';
import { useTranslation } from '@/context/LanguageContext';
import SupplyChainStoreDetail from './SupplyChainStoreDetail';
import SupplyChainWarehouseDetail from './SupplyChainWarehouseDetail';
import SupplyChainSupplierDetail from './SupplyChainSupplierDetail';

export const SUPPLY_PANEL_WIDTH = 460;

interface SupplyChainDetailCardProps {
  node: SupplyChainNode;
  edges: SupplyChainEdge[];
  allNodes: SupplyChainNode[];
  position: { x: number; y: number };
  onClose: () => void;
  businesses: LiveBusinessData[];
  warehouses: LiveWarehouseData[];
  deliveryContracts: LiveDeliveryContractData[];
  isPinned?: boolean;
  onTogglePin?: () => void;
  // Free-floating window controls: drag the header to move it, click to raise it.
  zIndex?: number;
  onMove?: (pos: { x: number; y: number }) => void;
  onFocus?: () => void;
}

const KIND_ICON = {
  importer: Ship,
  wholesaler: Truck,
  warehouse: Warehouse,
  store: Store
} as const;

// Floating, scrollable, draggable detail panel for a selected supply chain node.
// The header is the drag handle; the pin button keeps the window open when the
// user clicks elsewhere or presses Escape. The body content is chosen by node kind.
export default function SupplyChainDetailCard({
  node,
  edges,
  allNodes,
  position,
  onClose,
  businesses,
  warehouses,
  deliveryContracts,
  isPinned,
  onTogglePin,
  zIndex = 50,
  onMove,
  onFocus
}: SupplyChainDetailCardProps) {
  const { t } = useTranslation();
  const KindIcon = KIND_ICON[node.kind];
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const kindLabel = node.kind === 'store'
    ? t('liveHq.supplyNodeStore', 'Store')
    : node.kind === 'warehouse'
      ? t('liveHq.supplyNodeWarehouse', 'Warehouse')
      : node.kind === 'importer'
        ? t('liveHq.supplyNodeImporter', 'Importer')
        : t('liveHq.supplyNodeWholesaler', 'Wholesaler');

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const width = Math.min(SUPPLY_PANEL_WIDTH, vw - 24);
  const maxHeight = Math.min(vh * 0.72, 640);

  const handleHeaderPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('button')) return;
    if (!onMove) return;
    dragRef.current = { startX: event.clientX, startY: event.clientY, origX: position.x, origY: position.y };
    const onPointerMove = (moveEvent: PointerEvent) => {
      const d = dragRef.current;
      if (!d || !onMove) return;
      const nx = Math.min(Math.max(d.origX + moveEvent.clientX - d.startX, 8), Math.max(8, window.innerWidth - width - 8));
      const ny = Math.min(Math.max(d.origY + moveEvent.clientY - d.startY, 8), Math.max(8, window.innerHeight - 60));
      onMove({ x: nx, y: ny });
    };
    const onPointerUp = () => {
      dragRef.current = null;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  return (
    <div
      data-supply-panel
      className="fixed flex flex-col rounded-xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-2xl text-xs"
      style={{ left: position.x, top: position.y, width, maxHeight, zIndex }}
      onPointerDown={onFocus}
    >
      <div
        className="flex items-start justify-between gap-2 p-3 pb-2.5 border-b border-[var(--border-subtle)] select-none"
        style={{ cursor: onMove ? 'move' : 'default' }}
        onPointerDown={handleHeaderPointerDown}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: NODE_BG[node.kind] }}
          >
            <KindIcon className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <div className="font-bold text-[var(--text-main)] text-[13px] truncate">{node.name}</div>
            <div className="text-[10px] text-[var(--text-subtle)] truncate">
              {kindLabel} <span className="opacity-60">·</span> {node.address}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-0.5 shrink-0">
          {onTogglePin && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onTogglePin}
              title={isPinned ? t('liveHq.unpinWindow', 'Unpin window') : t('liveHq.pinWindow', 'Pin window')}
              className={`p-1 rounded cursor-pointer transition-colors ${
                isPinned
                  ? 'text-amber-500 hover:text-amber-600'
                  : 'text-[var(--text-subtle)] hover:text-[var(--text-main)]'
              }`}
            >
              <Pin className="w-3.5 h-3.5" fill={isPinned ? 'currentColor' : 'none'} />
            </button>
          )}
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onClose}
            className="p-1 rounded text-[var(--text-subtle)] hover:text-[var(--text-main)] cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {node.kind === 'store' ? (
          <SupplyChainStoreDetail node={node} edges={edges} allNodes={allNodes} businesses={businesses} />
        ) : node.kind === 'warehouse' ? (
          <SupplyChainWarehouseDetail node={node} edges={edges} allNodes={allNodes} warehouses={warehouses} />
        ) : (
          <SupplyChainSupplierDetail
            node={node}
            edges={edges}
            allNodes={allNodes}
            deliveryContracts={deliveryContracts}
          />
        )}
      </div>
    </div>
  );
}
