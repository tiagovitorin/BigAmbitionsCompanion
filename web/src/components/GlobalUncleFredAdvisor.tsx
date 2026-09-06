'use client';

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useLiveSync } from '@/context/LiveSyncContext';
import { UncleFredAdvisor } from './UncleFredAdvisor';
import { getUncleFredSettings } from '@/lib/uncleFredStorage';
import { BusinessStoreTelemetry } from '@/lib/uncleFredAi';

export function GlobalUncleFredAdvisor() {
  const pathname = usePathname();
  const { state } = useLiveSync();

  const {
    isConnected,
    playerCash,
    unpaidTaxes,
    totalLoans,
    gameHour,
    gameDay,
    businesses,
    ownedRealEstate,
    weeklyRevenueTotal,
    weeklyExpensesTotal
  } = state;

  const weeklyNetProfit = (weeklyRevenueTotal || 0) - (weeklyExpensesTotal || 0);

  // Compute top performer if businesses exist
  const topPerformer = useMemo(() => {
    if (!businesses || businesses.length === 0) return undefined;
    return [...businesses].sort((a, b) => (b.weeklyProfit ?? b.dailyProfit ?? 0) - (a.weeklyProfit ?? a.dailyProfit ?? 0))[0];
  }, [businesses]);

  // Transform live businesses into BusinessStoreTelemetry format for Uncle Fred AI
  const businessesList: BusinessStoreTelemetry[] = useMemo(() => {
    if (!isConnected || !businesses || businesses.length === 0) return [];

    const savedSettings = getUncleFredSettings();
    const period = savedSettings.contextPeriod || '7d';

    return businesses.map(b => {
      const rev = b.weeklyRevenue ?? b.dailyRevenue ?? 0;
      const prof = b.weeklyProfit ?? b.dailyProfit ?? 0;

      const history = b.orderHistory || [];
      const sliceCount = period === '3d' ? 3 : period === '7d' ? 7 : period === '14d' ? 14 : history.length;
      const periodLabel = period === '3d' ? '3d' : period === '7d' ? '7d' : period === '14d' ? '14d' : `${history.length}d`;
      const recentOrders = sliceCount > 0 ? history.slice(-sliceCount) : history;
      const activeDaysCount = Math.max(1, recentOrders.length);

      const salesMap = new Map<string, { name: string; soldPeriod: number; cost: number }>();
      recentOrders.forEach((order: any) => {
        (order.itemSales || []).forEach((item: any) => {
          const raw = item.itemName || item.rawItemName || 'Item';
          const clean = raw.replace(/^ba:itemname_/i, '').replace(/^itemname_/i, '').trim();
          if (clean.toLowerCase().includes('bag') || item.amountSold <= 0) return;

          const existing = salesMap.get(clean) || { name: clean, soldPeriod: 0, cost: item.totalWholesalePrice || 0 };
          existing.soldPeriod += item.amountSold;
          salesMap.set(clean, existing);
        });
      });

      const stockMap = new Map<string, number>();
      (b.retailPrices || []).forEach(rp => {
        const clean = (rp.displayName || rp.rawItemName || '')
          .replace(/^ba:itemname_/i, '')
          .replace(/^itemname_/i, '')
          .trim();
        stockMap.set(clean.toLowerCase(), rp.inStoreStock ?? 0);
      });

      const recentSales = Array.from(salesMap.values())
        .sort((a, b) => b.soldPeriod - a.soldPeriod)
        .slice(0, 6)
        .map(s => {
          const dailyAvg = s.soldPeriod / activeDaysCount;
          const stock = stockMap.get(s.name.toLowerCase());
          const daysStockLeft = (stock !== undefined && dailyAvg > 0) ? Number((stock / dailyAvg).toFixed(1)) : undefined;
          return {
            name: s.name,
            soldPeriod: s.soldPeriod,
            periodLabel,
            dailyAvg: Number(dailyAvg.toFixed(1)),
            stock,
            daysStockLeft
          };
        });

      return {
        id: b.id,
        name: b.name || 'Store',
        type: b.type || b.rawType,
        address: b.address,
        district: b.district,
        revenue: rev,
        profit: prof,
        margin: rev > 0 ? Math.round((prof / rev) * 100) : undefined,
        rentPerWeek: b.weeklyRent,
        customerSatisfaction: b.customerSatisfaction,
        satisfactionBreakdown: b.satisfactionBreakdown,
        trafficIndex: b.promotion?.trafficIndex,
        marketingPct: b.promotion?.marketing,
        activeCampaignsCount: b.promotion?.activeCampaigns ?? b.marketingCampaignsCount,
        customerCapacity: b.customerCapacity,
        todayCustomerCount: b.todayCustomerCount,
        staffOnDuty: b.staffOnDuty,
        openHoursPerWeek: b.openHoursPerWeek,
        scheduledShiftHoursPerWeek: b.scheduledShiftHoursPerWeek,
        cleanlinessRating: b.cleanliness,
        recentSales,
        retailPrices: (b.retailPrices || []).map(p => ({
          name: p.displayName,
          currentPrice: p.currentPrice,
          wholesalePrice: p.wholesalePrice,
          marketPrice: p.marketReferencePrice,
          maxCeiling: p.maxMarketCeiling,
          stock: p.inStoreStock
        })),
        scheduleDays: (b.scheduleWeek || []).map(s => ({
          day: s.day,
          isOpen: s.isOpen,
          openHours: s.openHours,
          startHour: s.startHour,
          endHour: s.endHour,
          shiftsCount: s.shifts?.length || 0,
          shiftWorkers: s.shifts?.map(w => `${w.employeeName} (${w.role || 'Staff'}, ${w.startHour}:00-${w.endHour}:00)`)
        })),
        peakHours: (b.hourReports || [])
          .filter(h => h.customers > 0)
          .sort((a, b) => b.customers - a.customers)
          .slice(0, 3)
      };
    });
  }, [isConnected, businesses]);

  const districtFootprint = useMemo(() => {
    if (!businesses) return {};
    return businesses.reduce((acc, b) => {
      const dist = b.district || 'NYC';
      acc[dist] = (acc[dist] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [businesses]);

  return (
    <UncleFredAdvisor
      isConnected={isConnected}
      currentPage={pathname}
      playerCash={playerCash || 0}
      unpaidTaxes={unpaidTaxes || 0}
      totalLoans={totalLoans || 0}
      currentHour={gameHour || 8}
      currentDay={gameDay || 1}
      saveTotalDays={gameDay || 1}
      businessesCount={businesses?.length || 0}
      topPerformerName={topPerformer?.name}
      empireMargin={weeklyRevenueTotal > 0 ? Math.round((weeklyNetProfit / weeklyRevenueTotal) * 100) : 0}
      ownedRealEstateCount={ownedRealEstate?.length || 0}
      districtFootprint={districtFootprint}
      businessesList={businessesList}
    />
  );
}
