'use client';

import { ReactNode } from 'react';

export interface PropertyTableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface PropertyTableProps {
  columns: PropertyTableColumn[];
  // Each row is an array of cells matching the columns order.
  rows: ReactNode[][];
  rowKey: (index: number) => string;
  empty?: ReactNode;
  maxHeightClass?: string;
  accent?: 'default' | 'rose';
}

function cellAlign(align?: 'left' | 'center' | 'right'): string {
  if (align === 'right') return 'text-right';
  if (align === 'center') return 'text-center';
  return 'text-left';
}

// The single table shell used by every property section, so residences,
// investments, vacant leases and market listings all read as one system.
export default function PropertyTable({
  columns,
  rows,
  rowKey,
  empty,
  maxHeightClass = 'max-h-[560px]',
  accent = 'default'
}: PropertyTableProps) {
  const shellClass = accent === 'rose'
    ? 'rounded-2xl bg-rose-500/5 border border-rose-500/30 shadow-xs overflow-hidden'
    : 'rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm overflow-hidden';

  if (rows.length === 0 && empty) {
    return <div className={shellClass}>{empty}</div>;
  }

  return (
    <div className={shellClass}>
      <div className={`overflow-auto ${maxHeightClass}`}>
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase select-none">
            <tr>
              {columns.map(col => (
                <th key={col.key} className={`py-2.5 px-4 whitespace-nowrap ${cellAlign(col.align)} ${col.className ?? ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {rows.map((row, index) => (
              <tr key={rowKey(index)} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                {columns.map((col, colIndex) => (
                  <td key={col.key} className={`py-2.5 px-4 align-middle text-[var(--text-muted)] ${cellAlign(col.align)}`}>
                    {row[colIndex]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
