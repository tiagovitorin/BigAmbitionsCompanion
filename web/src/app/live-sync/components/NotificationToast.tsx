'use client';

import Link from 'next/link';
import { Bell, ArrowUpRight } from 'lucide-react';
import { LiveBusinessData, LiveEmployeeData, LiveWarehouseData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';

export interface ToastAlert {
  id?: string;
  location: string;
  type: string;
  message: string;
  severity?: string;
}

interface NotificationToastProps {
  activeToast: ToastAlert;
  onDismiss: () => void;
  businesses: LiveBusinessData[];
  warehouses: LiveWarehouseData[];
  employees: LiveEmployeeData[];
}

export default function NotificationToast({ activeToast, onDismiss, businesses, warehouses, employees }: NotificationToastProps) {
  const { t } = useTranslation();
  const targetBiz = businesses.find(b => b.name.toLowerCase() === activeToast.location.toLowerCase() || activeToast.location.toLowerCase().includes(b.name.toLowerCase()));
  const targetWarehouse = warehouses.find(w => w.address.toLowerCase() === activeToast.location.toLowerCase() || activeToast.location.toLowerCase().includes(w.address.toLowerCase()));
  const isStaffAlert = activeToast.type === 'satisfaction' || activeToast.type === 'complaint';
  const targetEmployee = isStaffAlert || !targetBiz
    ? employees.find(e => e.name.toLowerCase() === activeToast.location.toLowerCase() || activeToast.location.toLowerCase().includes(e.name.toLowerCase()))
    : null;

  const destinationUrl = targetBiz
    ? `/live-sync?view=stores&store=${targetBiz.id}`
    : (isStaffAlert || targetEmployee)
    ? `/live-sync?view=staff&staff=${encodeURIComponent(targetEmployee ? targetEmployee.name : activeToast.location)}`
    : targetWarehouse
    ? `/live-sync?view=logistics`
    : null;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 animate-in slide-in-from-top-6 fade-in duration-300 pointer-events-auto">
      <div className="p-4 rounded-2xl bg-white dark:bg-[#1E1B18] border border-[var(--border-strong)] shadow-2xl flex items-start gap-3.5 backdrop-blur-md">
        <div className={`p-2 rounded-xl shrink-0 ${activeToast.severity === 'critical' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'}`}>
          <Bell className="w-5 h-5 animate-bounce" />
        </div>

        {destinationUrl ? (
          <Link
            href={destinationUrl}
            onClick={onDismiss}
            className="flex-1 space-y-0.5 text-xs text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--text-main)] text-sm group-hover:text-emerald-500 transition-colors flex items-center gap-1">
                  <span>{activeToast.location}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
                <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-subtle)]">
                  {activeToast.type}
                </span>
              </div>
            </div>
            <p className="text-[var(--text-muted)] text-xs leading-relaxed line-clamp-2 group-hover:text-[var(--text-main)] transition-colors">
              {activeToast.message}
            </p>
          </Link>
        ) : (
          <div className="flex-1 space-y-0.5 text-xs text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[var(--text-main)] text-sm">{activeToast.location}</span>
                <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[var(--text-subtle)]">
                  {activeToast.type}
                </span>
              </div>
            </div>
            <p className="text-[var(--text-muted)] text-xs leading-relaxed line-clamp-2">
              {activeToast.message}
            </p>
          </div>
        )}

        <button
          onClick={onDismiss}
          className="text-[var(--text-subtle)] hover:text-[var(--text-main)] text-base leading-none p-1 cursor-pointer shrink-0"
          title={t('liveHq.dismiss', 'Dismiss')}
        >
          &times;
        </button>
      </div>
    </div>
  );
}
