'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
}

// Small themed dropdown (no native select), self-contained open/close + outside click.
// Shared by the Logistics panels so their toolbars look and behave the same.
export default function FilterDropdown({
  icon: Icon,
  value,
  options,
  onChange
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const current = options.find(o => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border-base)] bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] text-xs font-semibold text-[var(--text-main)] transition-colors cursor-pointer"
      >
        <Icon className="w-3.5 h-3.5 text-[var(--text-subtle)] shrink-0" />
        <span className="truncate max-w-36">{current?.label ?? ''}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-40 min-w-44 max-h-64 overflow-y-auto rounded-xl border border-[var(--border-base)] bg-[var(--bg-surface)] shadow-2xl p-1 space-y-0.5">
          {options.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setOpen(false); }}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                option.value === value ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
