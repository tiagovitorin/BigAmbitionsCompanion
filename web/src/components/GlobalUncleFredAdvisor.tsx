'use client';

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useLiveSync } from '@/context/LiveSyncContext';
import { UncleFredAdvisor } from './UncleFredAdvisor';
import { BusinessStoreTelemetry } from '@/lib/uncleFredAi';

const BANK_NAMES: Record<string, string> = {
  '6 Secondavenue': 'Vantander Bank',
  '17 Fourthavenue': 'Jensen Capital'
};

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
    warehouses,
    employees,
    vehicles,
    boats,
    loans,
    logisticsPlans,
    recruitmentCampaigns,
    weeklyRevenueTotal,
    weeklyExpensesTotal,
    weeklyRevenueHistory,
    dailyRevenueTotal,
    dailyExpensesTotal,
    gameVariables
  } = state;

  const weeklyNetProfit = (weeklyRevenueTotal || 0) - (weeklyExpensesTotal || 0);
  const daysPerYear = gameVariables?.daysPerYear ?? 60;

  // Compute top performer if businesses exist
  const topPerformer = useMemo(() => {
    if (!businesses || businesses.length === 0) return undefined;
    return [...businesses].sort((a, b) => (b.weeklyProfit ?? b.dailyProfit ?? 0) - (a.weeklyProfit ?? a.dailyProfit ?? 0))[0];
  }, [businesses]);

  // High-density, pre-aggregated store ledger (one compact object per store)
  const businessesList: BusinessStoreTelemetry[] = useMemo(() => {
    if (!isConnected || !businesses || businesses.length === 0) return [];

    return businesses.map(b => {
      const rev = b.weeklyRevenue ?? b.dailyRevenue ?? 0;
      const prof = b.weeklyProfit ?? b.dailyProfit ?? 0;

      let lowestPillar: { name: string; score: number } | undefined;
      if (b.satisfactionBreakdown) {
        const pillars = [
          { name: 'Customer Service', score: b.satisfactionBreakdown.customerService },
          { name: 'Cleanliness', score: b.satisfactionBreakdown.cleanliness },
          { name: 'Pricing', score: b.satisfactionBreakdown.pricing },
          { name: 'Facility', score: b.satisfactionBreakdown.facility }
        ].filter((p): p is { name: string; score: number } => typeof p.score === 'number');
        if (pillars.length > 0) {
          lowestPillar = pillars.reduce((a, c) => (c.score < a.score ? c : a));
        }
      }

      const openHours = b.openHoursPerWeek ?? 0;
      const scheduledHours = b.scheduledShiftHoursPerWeek ?? 0;
      const unstaffedPeak = openHours > 0 && scheduledHours < openHours;

      const salesMap = new Map<string, number>();
      (b.orderHistory || []).forEach((order: any) => {
        (order.itemSales || []).forEach((item: any) => {
          const raw = item.itemName || item.rawItemName || 'Item';
          const clean = raw.replace(/^ba:itemname_/i, '').trim();
          if (!clean || clean.toLowerCase().includes('bag')) return;
          salesMap.set(clean, (salesMap.get(clean) || 0) + (item.amountSold || 0));
        });
      });
      const topSellerNames = Array.from(salesMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([name]) => name);

      const outOfStockCount = (b.retailPrices || []).filter(rp => (rp.inStoreStock ?? 0) <= 0).length;

      return {
        id: b.id,
        name: b.name || 'Store',
        type: b.type || b.rawType,
        district: b.district,
        revenue: rev,
        profit: prof,
        margin: rev > 0 ? Math.round((prof / rev) * 100) : undefined,
        customerSatisfaction: b.customerSatisfaction,
        lowestPillar,
        trafficIndex: b.promotion?.trafficIndex,
        unstaffedPeak,
        topSellerNames,
        outOfStockCount
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

  const todayNetProfit = (dailyRevenueTotal || 0) - (dailyExpensesTotal || 0);
  const revenueTrend = (weeklyRevenueHistory || []).slice(-7).map(e => e.revenue);
  const taxDeadlineDay = Math.ceil((gameDay || 1) / daysPerYear) * daysPerYear;

  const totalDebt = (loans || []).reduce((acc, l) => acc + (l.remainingAmount ?? l.totalAmount ?? 0), 0);
  const firstLoan = (loans || [])[0];
  const debtBankName = firstLoan?.bankAddress ? (BANK_NAMES[firstLoan.bankAddress] || firstLoan.bankAddress) : undefined;

  const totalEmployees = employees?.length || 0;
  const avgMorale = totalEmployees > 0
    ? Math.round(employees.reduce((acc, e) => acc + (e.satisfaction || 0), 0) / totalEmployees)
    : undefined;

  const logisticsAutomationActive = (logisticsPlans || []).length > 0;

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
      todayNetProfit={todayNetProfit}
      revenueTrend={revenueTrend}
      taxDeadlineDay={taxDeadlineDay}
      totalDebt={totalDebt}
      debtBankName={debtBankName}
      warehouseCount={warehouses?.length || 0}
      vehicleCount={(vehicles?.length || 0) + (boats?.length || 0)}
      logisticsAutomationActive={logisticsAutomationActive}
      totalEmployees={totalEmployees}
      avgMorale={avgMorale}
      activeRecruitmentCampaigns={recruitmentCampaigns?.length || 0}
    />
  );
}
