'use client';

import { DollarSign, AlertTriangle, CheckCircle2, Clock, Receipt } from 'lucide-react';
import { LiveDeliveryContractData, LiveImportPartnershipData } from '@/context/LiveSyncContext';
import { useTranslation } from '@/context/LanguageContext';

interface PurchaseOrderRadarProps {
  deliveryContracts: LiveDeliveryContractData[];
  importPartnerships: LiveImportPartnershipData[];
  playerCash: number;
  gameDay: number;
}

interface OrderRow {
  key: string;
  supplierName: string;
  nextDeliveryDay: number;
  total: number;
  items: { rawItemName: string; itemName: string; amount: number }[];
}

export default function PurchaseOrderRadar({ deliveryContracts, importPartnerships, playerCash, gameDay }: PurchaseOrderRadarProps) {
  const { t, tGame } = useTranslation();

  const orders: OrderRow[] = [
    ...importPartnerships
      .filter(ip => ip.isActive)
      .map(ip => ({
        key: `ip-${ip.id}`,
        supplierName: ip.supplierName || ip.importAddress,
        nextDeliveryDay: ip.nextDeliveryDay,
        total: ip.nextDeliveryTotal || 0,
        items: (ip.products || []).map(p => ({ rawItemName: p.rawItemName, itemName: p.itemName, amount: p.amount }))
      })),
    ...deliveryContracts
      .filter(dc => dc.enabled)
      .map(dc => ({
        key: `dc-${dc.wholesaleAddress}-${dc.businessAddress}`,
        supplierName: dc.supplierName || dc.wholesaleAddress,
        nextDeliveryDay: dc.nextDeliveryDay,
        total: dc.totalPricePerDelivery || 0,
        items: (dc.items || []).map(i => ({ rawItemName: i.rawItemName, itemName: i.itemName, amount: i.amount }))
      }))
  ].sort((a, b) => a.nextDeliveryDay - b.nextDeliveryDay);

  const upcomingTotal = orders.reduce((acc, o) => acc + o.total, 0);
  const risk: 'safe' | 'tight' | 'shortfall' = upcomingTotal === 0 ? 'safe' : playerCash >= upcomingTotal * 1.5 ? 'safe' : playerCash >= upcomingTotal ? 'tight' : 'shortfall';

  if (orders.length === 0) {
    return null;
  }

  const daysUntil = (nextDay: number) => {
    const diff = nextDay - gameDay;
    if (diff <= 0) return t('liveHq.dueToday', 'Today');
    return t('liveHq.inDays', 'in {n}d').replace('{n}', String(diff));
  };

  return (
    <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
        <Receipt className="w-4 h-4 text-emerald-500" />
        <span>{t('liveHq.purchaseOrderRadar', 'Purchase Order Radar')}</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
          <div className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.upcomingOrders', 'Upcoming Orders')}</div>
          <div className="font-mono font-bold text-[var(--text-main)] text-lg mt-1">${upcomingTotal.toLocaleString()}</div>
        </div>
        <div className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
          <div className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.cashOnHand', 'Cash On Hand')}</div>
          <div className="font-mono font-bold text-[var(--text-main)] text-lg mt-1">${playerCash.toLocaleString()}</div>
        </div>
        <div className={`p-3 rounded-xl border ${risk === 'safe' ? 'bg-emerald-500/10 border-emerald-500/30' : risk === 'tight' ? 'bg-amber-500/10 border-amber-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
          <div className="text-[10px] uppercase font-bold text-[var(--text-subtle)]">{t('liveHq.riskLevel', 'Risk Level')}</div>
          <div className={`font-bold flex items-center gap-1.5 mt-1 ${risk === 'safe' ? 'text-emerald-600 dark:text-emerald-400' : risk === 'tight' ? 'text-amber-600 dark:text-amber-400' : 'text-rose-500'}`}>
            {risk === 'safe' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>
              {risk === 'safe' ? t('liveHq.riskSafe', 'Safe') : risk === 'tight' ? t('liveHq.riskTight', 'Tight') : t('liveHq.riskShortfall', 'Shortfall')}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 text-xs">
        {orders.map(o => (
          <div key={o.key} className="p-2.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[var(--text-main)] truncate flex items-center gap-1.5">
                <DollarSign className="w-3 h-3 text-emerald-500 shrink-0" />
                {o.supplierName}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-[var(--text-subtle)] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {daysUntil(o.nextDeliveryDay)}
                </span>
                <span className="font-mono font-bold text-[var(--text-main)]">${o.total.toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-[var(--text-muted)]">
              {o.items.slice(0, 6).map((it, i) => (
                <span key={i} className="truncate">
                  {tGame(it.rawItemName, it.itemName)} x{it.amount.toLocaleString()}
                  {i < Math.min(o.items.length, 6) - 1 ? ',' : ''}
                </span>
              ))}
              {o.items.length > 6 && <span className="text-[var(--text-subtle)]">+{o.items.length - 6}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
