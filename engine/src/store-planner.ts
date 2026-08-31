/**
 * Big Ambitions Store Layout & Equipment Capacity Planner
 */

import { NormalizedBusiness } from './types.js';

export interface StoreEquipmentPlanInput {
  business: NormalizedBusiness;
  targetDailyCustomers: number;
  openHoursCount?: number; // default 12 hours
}

export interface EquipmentRecommendation {
  furnitureType: string;
  recommendedCount: number;
  reason: string;
}

export interface StoreEquipmentPlanResult {
  businessName: string;
  targetDailyCustomers: number;
  peakCustomersPerHour: number;
  recommendedRegisters: number;
  recommendedShoppingBaskets: number;
  requiredChecklist: string[];
  equipmentRecommendations: EquipmentRecommendation[];
}

/**
 * Calculates optimal furniture and register counts to prevent customer queue walkouts.
 */
export function planStoreEquipment(input: StoreEquipmentPlanInput): StoreEquipmentPlanResult {
  const { business, targetDailyCustomers, openHoursCount = 12 } = input;

  const avgPerHour = targetDailyCustomers / openHoursCount;
  // Peak hour is typically ~1.6x of daily average
  const peakPerHour = Math.ceil(avgPerHour * 1.6);

  // Each checkout counter / cash register with a 100% skill employee handles ~30 customers/hour
  const registerThroughputPerHour = 30;
  const recommendedRegisters = Math.max(1, Math.ceil(peakPerHour / registerThroughputPerHour));

  // Shopping baskets for self-service stores (need at least peakPerHour * 1.25)
  const recommendedBaskets = business.customer_type === 'SelfService' 
    ? Math.max(1, Math.ceil((peakPerHour * 1.25) / 15)) // Each stack holds ~15 baskets
    : 0;

  const recommendations: EquipmentRecommendation[] = [
    {
      furnitureType: 'Checkout Counter / Cash Register',
      recommendedCount: recommendedRegisters,
      reason: `Sufficient for peak rush of ${peakPerHour} customers/hour without queue overflow`
    }
  ];

  if (business.customer_type === 'SelfService') {
    recommendations.push({
      furnitureType: 'Stack of Shopping Baskets',
      recommendedCount: recommendedBaskets,
      reason: `Required for self-service customer flow during peak periods`
    });
  }

  const checklist: string[] = [];
  for (const req of business.requirements as any[]) {
    if (req.localizeKey) {
      checklist.push(req.localizeKey);
    }
  }

  return {
    businessName: business.name,
    targetDailyCustomers,
    peakCustomersPerHour: peakPerHour,
    recommendedRegisters,
    recommendedShoppingBaskets: recommendedBaskets,
    requiredChecklist: checklist,
    equipmentRecommendations: recommendations
  };
}
