/**
 * Big Ambitions Retail & Opening Hours Simulation Engine
 * Implements exact simulation equations from CustomerEntriesCalculator.cs
 */

import { NormalizedBusiness, NormalizedBuilding, NormalizedNeighborhood } from './types.js';

export interface RetailSimulationInput {
  business: NormalizedBusiness;
  building: NormalizedBuilding;
  neighborhood: NormalizedNeighborhood;
  marketingPct?: number; // 0 - 100%
  customerSatisfaction?: number; // 0 - 100% (default 100)
  employeeHourlyWage?: number; // default $18/hr
  employeesPerShift?: number; // default 1
  averageBasketValue?: number; // estimated average cart size ($)
  grossMarginPct?: number; // default 60%
}

export interface HourlySimulationDetail {
  hour: number;
  hourFormatted: string;
  trafficMultiplier: number;
  expectedCustomers: number;
  grossRevenue: number;
  wageCost: number;
  rentCost: number;
  netOperatingProfit: number;
  isProfitable: boolean;
}

export interface RetailSimulationResult {
  businessName: string;
  buildingAddress: string;
  squareMeters: number;
  dailyRent: number;
  storeCapacity: number;
  hourlyDetails: HourlySimulationDetail[];
  totalDailyCustomers: number;
  totalDailyRevenue: number;
  totalDailyWages: number;
  totalDailyNetProfit: number;
  optimalOpeningWindow: {
    openHour: number;
    closeHour: number;
    windowFormatted: string;
    optimizedDailyProfit: number;
    profitGainVs24_7: number;
  };
}

/**
 * Simulates 24-hour retail operations and solves for optimal opening hours.
 */
export function simulateRetailStore(input: RetailSimulationInput): RetailSimulationResult {
  const {
    business,
    building,
    neighborhood,
    marketingPct = 100,
    customerSatisfaction = 100,
    employeeHourlyWage = 18.0,
    employeesPerShift = 1,
    averageBasketValue = 25.0,
    grossMarginPct = 60.0
  } = input;

  const sqm = building.square_meters;
  const storeCapacity = Math.max(10, Math.round(sqm * 0.75));
  const dailyRent = building.estimated_daily_rent;
  const hourlyRent = dailyRent / 24;

  // Promotion Multiplier from CustomerEntriesCalculator.cs:
  // Base 0.50 + 0.75 * (promotionTotal / 100)
  const promotionMultiplier = 0.50 + 0.75 * (marketingPct / 100);
  const satisfactionMultiplier = (customerSatisfaction - 50) / 100 + 1.0;

  const hourlyMultipliers = business.operating_schedule.hourly_multipliers;
  const hourlyDetails: HourlySimulationDetail[] = [];

  let total24hCustomers = 0;
  let total24hRevenue = 0;
  let total24hWages = 0;
  let total24hProfit = 0;

  for (let hour = 0; hour < 24; hour++) {
    const hourMult = hourlyMultipliers[hour] || 0.0;
    const hourFormatted = `${hour.toString().padStart(2, '0')}:00`;

    // Customer volume per hour
    const expectedCustomers = Math.ceil(
      storeCapacity * promotionMultiplier * satisfactionMultiplier * hourMult
    );

    const grossRevenue = Math.round(expectedCustomers * averageBasketValue * 100) / 100;
    const grossProfit = grossRevenue * (grossMarginPct / 100);
    const wageCost = employeesPerShift * employeeHourlyWage;
    const netProfit = Math.round((grossProfit - wageCost - hourlyRent) * 100) / 100;
    const isProfitable = netProfit > 0;

    hourlyDetails.push({
      hour,
      hourFormatted,
      trafficMultiplier: hourMult,
      expectedCustomers,
      grossRevenue,
      wageCost,
      rentCost: Math.round(hourlyRent * 100) / 100,
      netOperatingProfit: netProfit,
      isProfitable
    });

    total24hCustomers += expectedCustomers;
    total24hRevenue += grossRevenue;
    total24hWages += wageCost;
    total24hProfit += netProfit;
  }

  // Find continuous optimal opening window that maximizes total daily net profit
  let bestProfit = -Infinity;
  let bestOpen = 8;
  let bestClose = 20;

  for (let openH = 0; openH < 24; openH++) {
    for (let closeH = openH + 4; closeH <= 24; closeH++) {
      let windowProfit = -dailyRent; // Rent is fixed daily overhead
      for (let h = openH; h < closeH; h++) {
        const d = hourlyDetails[h];
        const grossProfit = d.grossRevenue * (grossMarginPct / 100);
        windowProfit += grossProfit - d.wageCost;
      }
      if (windowProfit > bestProfit) {
        bestProfit = windowProfit;
        bestOpen = openH;
        bestClose = closeH;
      }
    }
  }

  const roundedBestProfit = Math.round(bestProfit * 100) / 100;
  const profitGain = Math.round((roundedBestProfit - total24hProfit) * 100) / 100;

  return {
    businessName: business.name,
    buildingAddress: building.address,
    squareMeters: sqm,
    dailyRent,
    storeCapacity,
    hourlyDetails,
    totalDailyCustomers: total24hCustomers,
    totalDailyRevenue: Math.round(total24hRevenue * 100) / 100,
    totalDailyWages: Math.round(total24hWages * 100) / 100,
    totalDailyNetProfit: Math.round(total24hProfit * 100) / 100,
    optimalOpeningWindow: {
      openHour: bestOpen,
      closeHour: bestClose,
      windowFormatted: `${bestOpen.toString().padStart(2, '0')}:00 - ${bestClose.toString().padStart(2, '0')}:00`,
      optimizedDailyProfit: roundedBestProfit,
      profitGainVs24_7: Math.max(0, profitGain)
    }
  };
}
