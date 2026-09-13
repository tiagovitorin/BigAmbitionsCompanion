'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { ChevronDown, Search } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { LiveBusinessData } from '@/context/LiveSyncContext';
import BusinessLogo from '@/app/live-sync/components/BusinessLogo';

// Searchable dropdown shown under "Active Business" so the player can jump to another
// store straight from the sidebar. Portaled to the body so the sidebar cannot clip it.
export default function StoreSwitcher({ stores, activeId, section }: { stores: LiveBusinessData[]; activeId: string; section?: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const active = stores.find(store => store.id === activeId);

  useEffect(() => {
    if (!open) return;

    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const width = Math.max(rect.width, 240);
      setPos({ top: rect.bottom + 6, left: Math.min(rect.left, window.innerWidth - width - 8), width });
    };
    place();

    const onDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    const onScroll = (event: Event) => {
      // Ignore scrolls inside the menu itself (the list scrolls); close on outside scroll.
      if (menuRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const onResize = () => setOpen(false);

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? stores.filter(store =>
          (store.name || '').toLowerCase().includes(q) ||
          (store.type || '').toLowerCase().includes(q) ||
          (store.district || '').toLowerCase().includes(q) ||
          (store.address || '').toLowerCase().includes(q))
      : stores;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [stores, query]);

  const select = (id: string) => {
    setOpen(false);
    setQuery('');
    const tab = section ? `&tab=${section.replace(/^store-/, '')}` : '';
    router.push(`/live-sync?view=stores&store=${encodeURIComponent(id)}${tab}`);
  };

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(current => !current)}
        className="w-full flex items-center gap-2 px-1 py-0.5 rounded-lg hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer text-left"
      >
        {active ? <BusinessLogo business={active} sizeClass="w-6 h-6" /> : null}
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold text-[var(--text-main)] truncate">{active?.name ?? ''}</div>
          <div className="text-[9px] text-[var(--text-subtle)] truncate">{active?.type ?? ''}</div>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && pos && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[100] rounded-xl border border-[var(--border-base)] bg-[var(--bg-surface)] shadow-2xl p-1.5 space-y-1"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
        >
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-subtle)] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              autoFocus
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={t('nav.storeSearch', 'Search stores')}
              className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] text-xs text-[var(--text-main)] placeholder-[var(--text-subtle)] focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-0.5">
            {filtered.map(store => {
              const isActive = store.id === activeId;
              return (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => select(store.id)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                    isActive ? 'bg-emerald-600 text-white font-semibold' : 'text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  <BusinessLogo business={store} sizeClass="w-6 h-6" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{store.name}</span>
                    <span className="block truncate text-[9px] opacity-70">{store.type}{store.district ? ` · ${store.district}` : ''}</span>
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-2 py-2 text-[11px] text-[var(--text-subtle)]">{t('nav.storeSearchNone', 'No stores found')}</div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
