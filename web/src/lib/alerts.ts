import { LiveBusinessData, LiveEmployeeData, LiveOperationalAlert, LiveWarehouseData } from '@/context/LiveSyncContext';
import rawBusinesses from '@/data/businesses.json';
import { getCanonicalProductKey, getItemImageSrc } from './products';
import { buildAmenityReport } from './amenities';
import { getStoreSupplies, isBagItem, BAG_CRITICAL_RUNOUT_DAYS } from './storeSupplies';
import { PROFITABLE_HOUR_MULTIPLIER, CLOSED_PEAK_DAY_MULTIPLIER, WAREHOUSE_RUNWAY_CRITICAL_DAYS, ALERT_MATERIALITY_SHARE, ALERT_MATERIALITY_FLOOR, ALERT_CONDENSE_AT } from './thresholds';
import rawRecipes from '@/data/recipes.json';

// recipe id -> output raw item name, for detecting goods manufactured on-site.
const RECIPE_OUTPUT_RAW = new Map<string, string>(
  (rawRecipes as unknown as any[]).map(recipe => [recipe.id, recipe.output?.raw_id ?? ''])
);

export interface Opportunity {
  id: string;
  title: string;
  location: string;
  current: string;
  recommended: string;
  weeklyImpact: number | null;
  category: string;
  description: string;
}

export interface ActionItem {
  id: string;
  location: string;
  category: string;
  message: string;
  isAlert: boolean;
  severity: 'critical' | 'warning' | 'opportunity';
  priorityRank: number;
  impactScore: number | null;
  btnLabel: string;
  linkUrl: string;
  targetBiz?: LiveBusinessData;
  itemImg: string;
  // Dollar value of the finding when one is measurable. Findings carrying a worth
  // below the materiality gate are counted at the foot of the feed, not read out.
  worth?: number | null;
}

export interface OverviewDerivedData {
  criticalStores: LiveBusinessData[];
  warningStores: LiveBusinessData[];
  healthyStores: LiveBusinessData[];
  topPerformers: LiveBusinessData[];
  lowestPerformers: LiveBusinessData[];
  unifiedActionFeed: ActionItem[];
  // Findings too small to be worth a line, counted rather than shown.
  minorCount: number;
  minorWorth: number;
}

// How many storefronts to surface at each end of the profit ranking.
const PERFORMER_COUNT = 3;

// Localized display label for an opportunity/alert category. The category value
// itself stays the stable English key used for filtering.
const CATEGORY_LABEL_KEYS: Record<string, string> = {
  Pricing: 'liveHq.catPricing',
  Workforce: 'liveHq.catWorkforce',
  Operations: 'liveHq.catOperations',
  Marketing: 'liveHq.catMarketing',
  Scheduling: 'liveHq.catScheduling',
  'Operating Hours': 'liveHq.catOperatingHours',
  Stock: 'liveHq.catStock'
};

export function opportunityCategoryLabel(
  category: string | null | undefined,
  t: (key: string, fallback?: string) => string
): string {
  if (!category) return '';
  const key = CATEGORY_LABEL_KEYS[category];
  return key ? t(key, category) : category;
}

export interface AlertFilterOptions {
  storeLowStockThresholdHours: number;
  warehouseRunwayWarningDays: number;
  ignoreManufacturedRunwayAlerts: boolean;
  showZeroStockWarnings: boolean;
  unstaffedShiftAlerts: boolean;
  lowEmployeeHappinessAlerts: boolean;
  taxLoanPaymentRiskAlerts: boolean;
  showCleanlinessAlerts: boolean;
}

// A site that serves customers over a counter. Factories, warehouses, depots and head
// office are not storefronts: they have no cashiers and never "lose a sale" to an
// unstaffed hour, so they must never raise a cashier-coverage finding.
const NON_STOREFRONT_MARKERS = ['headquarter', 'hq', 'factory', 'warehouse', 'depot', 'storage'];

export function isStorefront(business: LiveBusinessData): boolean {
  const haystack = `${business.rawType || ''} ${business.type || ''}`.toLowerCase();
  return !NON_STOREFRONT_MARKERS.some(marker => haystack.includes(marker));
}

export function synthesizeOperationalAlerts(
  operationalAlerts: LiveOperationalAlert[],
  businesses: LiveBusinessData[],
  employees: LiveEmployeeData[],
  warehouses: LiveWarehouseData[],
  dismissedAlerts: string[],
  options: AlertFilterOptions
): LiveOperationalAlert[] {
  const list = (operationalAlerts || []).filter(alert => {
    // Per-category toggles: drop alert families the player has disabled.
    // All mod-emitted low-stock alerts are dropped entirely - store shelf and
    // warehouse runway alerts are re-derived below so each management domain
    // respects its own configurable threshold and never duplicates.
    if (alert.type === 'lowstock') return false;
    if (!options.unstaffedShiftAlerts && alert.type === 'unstaffed') return false;
    if (!options.lowEmployeeHappinessAlerts && (alert.type === 'satisfaction' || alert.type === 'complaint')) return false;
    if (!options.taxLoanPaymentRiskAlerts && alert.type === 'tax') return false;
    if (!options.showCleanlinessAlerts && alert.type === 'maintenance') return false;
    return true;
  });

  businesses.forEach(b => {
    if (!isStorefront(b)) return;
    if (!b.scheduleWeek) return;
    const unstaffedDaysList: { day: string; hours: number[] }[] = [];

    b.scheduleWeek.forEach((sd: any) => {
      if (!sd.isOpen) return;
      const missingHours: number[] = [];

      for (let h = 0; h < 24; h++) {
        const isHourActuallyOpen = Array.isArray(sd.hoursOpen) && sd.hoursOpen.length === 24
          ? !!sd.hoursOpen[h]
          : (sd.startHour !== undefined && sd.endHour !== undefined && sd.startHour !== -1 && h >= sd.startHour && h < sd.endHour);

        if (!isHourActuallyOpen) continue;

        const activeCashiers = (sd.shifts || []).filter((s: any) => {
          if (h < s.startHour || h >= s.endHour) return false;
          const empObj = employees.find(e => e.id === s.employeeId || e.name === s.employeeName);
          const skill = (s.skillName || empObj?.primarySkillName || '').toLowerCase();
          const role = (s.role || '').toLowerCase();
          const station = ((s as any).stationName || '').toLowerCase();
          if (role === 'cleaner' || skill.includes('clean') || station.includes('clean')) return false;
          if (role === 'security' || skill.includes('security') || skill.includes('guard') || station.includes('security')) return false;
          if (role === 'logistics' || skill.includes('logistic') || skill.includes('driver') || station.includes('logistic')) return false;
          return true;
        });

        if (activeCashiers.length === 0) {
          missingHours.push(h);
        }
      }

      if (missingHours.length > 0) {
        unstaffedDaysList.push({ day: sd.day.slice(0, 3), hours: missingHours });
      }
    });

    const hasWholeStoreUnstaffed = list.some(a => a.type === 'unstaffed' && a.location === b.name);
    if (options.unstaffedShiftAlerts && !hasWholeStoreUnstaffed && unstaffedDaysList.length > 0) {
      const totalMissingCount = unstaffedDaysList.reduce((acc, d) => acc + d.hours.length, 0);
      list.unshift({
        id: `unstaffed_open_${b.id}`,
        location: b.name,
        type: 'unstaffed',
        severity: 'critical',
        message: `Store is open with 0 cashiers assigned across ${totalMissingCount} hours on ${unstaffedDaysList.map(d => `${d.day} (${d.hours.map(h => `${h}h`).join(', ')})`).join(', ')}. Customers walk out with zero sales.`
      });
    }
  });

  // Stock alerts are aggregated to one per store so a lean operation does not
  // drown the feed in dozens of per-product rows. Only open stores are flagged
  // (a store that runs out overnight at closing is expected and not nagging).
  businesses.forEach(b => {
    if (!isStorefront(b)) return;
    if (!b.retailPrices || b.retailPrices.length === 0) return;

    const salesList = (b.todayOrderSales || b.todayItemSales || []);
    const stockouts: string[] = [];
    const lows: { title: string; units: number; hours: number | null }[] = [];

    b.retailPrices.forEach(rp => {
      const cleanTitle = (rp.displayName || rp.rawItemName || '')
        .replace(/^ba:itemname_/i, '')
        .replace(/^itemname_/i, '')
        .trim();

      const isService = rp.isServiceProduct ||
        cleanTitle.toLowerCase().includes('fee') ||
        cleanTitle.toLowerCase().includes('hourly') ||
        cleanTitle.toLowerCase().includes('charge') ||
        cleanTitle.toLowerCase().includes('ticket');
      const isBag = cleanTitle.toLowerCase().includes('bag');
      if (isService || isBag) return;

      const stockUnits = (rp as any).inStoreStock ?? 0;
      const targetKey = getCanonicalProductKey(rp.rawItemName, cleanTitle);
      const matchedSale = salesList.find(
        (s: any) => {
          const sKey = getCanonicalProductKey(s.rawItemName, s.itemName);
          return sKey === targetKey ||
                 s.itemName.toLowerCase() === cleanTitle.toLowerCase() ||
                 s.itemName.toLowerCase().includes(cleanTitle.toLowerCase()) ||
                 cleanTitle.toLowerCase().includes(s.itemName.toLowerCase());
        }
      );
      const dailySold = matchedSale ? matchedSale.amountSold : 0;

      if (b.isOpenNow && stockUnits === 0) {
        if (options.showZeroStockWarnings) stockouts.push(cleanTitle);
        return;
      }

      if (stockUnits > 0 && options.storeLowStockThresholdHours > 0) {
        if (b.isOpenNow && dailySold > 0) {
          const hoursLeft = Math.max(1, Math.round((stockUnits / dailySold) * 24));
          if (hoursLeft <= options.storeLowStockThresholdHours) {
            lows.push({ title: cleanTitle, units: stockUnits, hours: hoursLeft });
          }
        } else if (b.isOpenNow && stockUnits < 10) {
          // Open but not selling this period and nearly empty: likely a stock setup gap.
          lows.push({ title: cleanTitle, units: stockUnits, hours: null });
        }
      }
    });

    if (stockouts.length > 0) {
      const preview = stockouts.slice(0, 3).join(', ');
      const extra = stockouts.length - 3;
      list.push({
        id: `stockout_${b.id || b.streetName}`,
        location: b.name,
        type: 'lowstock',
        severity: 'critical',
        message: `${stockouts.length} product${stockouts.length > 1 ? 's are' : ' is'} out of stock: ${preview}${extra > 0 ? ` +${extra} more` : ''}`
      });
    } else if (lows.length > 0) {
      const sorted = [...lows].sort((a, c) => (a.hours ?? 99) - (c.hours ?? 99));
      const preview = sorted.slice(0, 3).map(l => l.hours != null ? `${l.title} (~${l.hours}h)` : `${l.title} (${l.units} left)`).join(', ');
      const extra = sorted.length - 3;
      list.push({
        id: `lowstock_${b.id || b.streetName}`,
        location: b.name,
        type: 'lowstock',
        severity: 'warning',
        message: `${sorted.length} product${sorted.length > 1 ? 's' : ''} low: ${preview}${extra > 0 ? ` +${extra} more` : ''}`
      });
    }
  });

  // Checkout supplies (paper/plastic bags) never appear in retailPrices, so they
  // are checked separately. Running out stops bagging at the register entirely,
  // which is more severe than a single product running out, so a bag at zero or
  // under one day of runway is raised even if no other product is low.
  businesses.forEach(b => {
    if (!isStorefront(b)) return;
    if (!b.isOpenNow) return;
    const supplies = getStoreSupplies(b);
    if (supplies.length === 0) return;

    const out = supplies.filter(s => s.quantity <= 0);
    const low = supplies.filter(s => s.quantity > 0 && s.runoutDays != null && s.runoutDays <= BAG_CRITICAL_RUNOUT_DAYS);

    if (out.length > 0 && options.showZeroStockWarnings) {
      list.push({
        id: `bagstock_${b.id || b.streetName}`,
        location: b.name,
        type: 'lowstock',
        severity: 'critical',
        message: `${out.map(s => s.displayName).join(', ')} out of stock. Checkout cannot bag purchases, which stops sales.`
      });
    } else if (low.length > 0 && options.storeLowStockThresholdHours > 0) {
      list.push({
        id: `bagstock_${b.id || b.streetName}`,
        location: b.name,
        type: 'lowstock',
        severity: 'warning',
        message: `${low.map(s => `${s.displayName} (~${s.runoutDays!.toFixed(1)}d)`).join(', ')} almost out. Restock before checkout stalls.`
      });
    }
  });

  // Warehouse runway alerts: one per warehouse. Critical when any stocked item is at or
  // under WAREHOUSE_RUNWAY_CRITICAL_DAYS of runway; a reorder warning fires when items
  // fall inside the player-configured warehouseRunwayWarningDays. Off (0) disables all
  // warehouse runway alerts, including criticals.
  (warehouses || []).forEach(w => {
    if (options.warehouseRunwayWarningDays <= 0) return;

    // Products manufactured on-site replenish themselves, so an empty finished-goods
    // shelf is not a supply risk. Exclude them unless the player opts back in.
    const manufactured = new Set<string>();
    (w.machines || []).forEach(machine => {
      if (!machine.selectedRecipeId) return;
      const output = RECIPE_OUTPUT_RAW.get(machine.selectedRecipeId);
      if (output) manufactured.add(output);
    });

    const items = (w.stock || []).filter(it =>
      (it.weeklyConsumption || 0) > 0 &&
      it.daysLeft != null &&
      it.daysLeft >= 0 &&
      !(options.ignoreManufacturedRunwayAlerts && manufactured.has(it.rawItemName))
    );
    if (items.length === 0) return;

    const critical = items
      .filter(it => it.daysLeft <= WAREHOUSE_RUNWAY_CRITICAL_DAYS)
      .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0));
    const warning = options.warehouseRunwayWarningDays > 0
      ? items
          .filter(it => it.daysLeft > WAREHOUSE_RUNWAY_CRITICAL_DAYS && it.daysLeft <= options.warehouseRunwayWarningDays)
          .sort((a, b) => (a.daysLeft ?? 0) - (b.daysLeft ?? 0))
      : [];

    if (critical.length > 0) {
      const preview = critical.slice(0, 3).map(it => it.itemName).join(', ');
      const extra = critical.length - 3;
      list.push({
        id: `warehouse_critical_${w.id || w.address}`,
        location: `Warehouse: ${w.address}`,
        type: 'lowstock',
        severity: 'critical',
        message: `${critical.length} product${critical.length > 1 ? 's' : ''} at or under ${WAREHOUSE_RUNWAY_CRITICAL_DAYS}d runway: ${preview}${extra > 0 ? ` +${extra} more` : ''}`
      });
    } else if (warning.length > 0) {
      const preview = warning.slice(0, 3).map(it => it.itemName).join(', ');
      const extra = warning.length - 3;
      list.push({
        id: `warehouse_warning_${w.id || w.address}`,
        location: `Warehouse: ${w.address}`,
        type: 'lowstock',
        severity: 'warning',
        message: `${warning.length} product${warning.length > 1 ? 's' : ''} under ${options.warehouseRunwayWarningDays}d runway: ${preview}${extra > 0 ? ` +${extra} more` : ''}`
      });
    }
  });

  return list.filter(a => !dismissedAlerts.includes(a.id || a.location + a.message));
}

export function computeOpportunities(
  businesses: LiveBusinessData[],
  employees: LiveEmployeeData[]
): Opportunity[] {
  const opps: Opportunity[] = [];

  businesses.forEach(b => {
    if (!isStorefront(b)) return;

    // 1. Pricing Optimization Levers
    if (b.retailPrices) {
      b.retailPrices.forEach(rp => {
        // Checkout supplies (paper/plastic bags) and service fees are not sellable
        // products, so they must never raise a price optimization lever.
        const label = (rp.displayName || rp.rawItemName || '')
          .replace('ba:itemname_', '')
          .replace('ba:item_', '')
          .replace(/_/g, ' ')
          .trim()
          .toLowerCase();
        const isService = rp.isServiceProduct ||
          label.includes('fee') ||
          label.includes('hourly') ||
          label.includes('charge') ||
          label.includes('ticket');
        if (isService || isBagItem(rp.rawItemName, rp.displayName)) return;

        const diff = rp.optimalPrice - rp.currentPrice;
        const overDiff = rp.currentPrice - rp.optimalPrice;
        if (diff > 0.15) {
          const cleanTitle = (rp.displayName || rp.rawItemName)
            .replace('ba:itemname_', '')
            .replace('ba:item_', '')
            .replace(/_/g, ' ')
            .trim();
          opps.push({
            id: `pricing_${b.id}_${rp.rawItemName}`,
            title: `Optimize ${cleanTitle} Price`,
            location: b.name,
            current: `$${rp.currentPrice.toFixed(2)}`,
            recommended: `$${rp.optimalPrice.toFixed(2)}`,
            weeklyImpact: null,
            category: 'Pricing',
            description: `Raise price to match market willingness to pay without losing demand.`
          });
        } else if (overDiff >= 0.15 && (rp.optimalPrice > 0 ? (overDiff / rp.optimalPrice) >= 0.01 : true)) {
          // A price above the optimal loses sales and lowers the store's price
          // satisfaction, so it is a lever even when it is still under the ceiling.
          const cleanTitle = (rp.displayName || rp.rawItemName).replace(/_/g, ' ');
          const aboveCeiling = rp.currentPrice > rp.maxMarketCeiling;
          opps.push({
            id: `overpriced_${b.id}_${rp.rawItemName}`,
            title: `Lower ${cleanTitle} Price`,
            location: b.name,
            current: `$${rp.currentPrice.toFixed(2)}`,
            recommended: `$${rp.optimalPrice.toFixed(2)}`,
            weeklyImpact: null,
            category: 'Pricing',
            description: aboveCeiling
              ? `Price is above the optimal and the district ceiling, costing sales and price satisfaction.`
              : `Price is above the optimal, which costs sales and lowers the price satisfaction rating.`
          });
        }
      });
    }

    // 2. Customer Service & Cashier Skill Lever
    if (b.satisfactionBreakdown && b.satisfactionBreakdown.customerService < 80) {
      opps.push({
        id: `service_${b.id}`,
        title: `Train Cashiers to 100% Skill`,
        location: b.name,
        current: `${b.satisfactionBreakdown.customerService}% CS`,
        recommended: `100% Vocational Skill`,
        weeklyImpact: null,
        category: 'Workforce',
        description: `Customer service score is pulling down overall store satisfaction.`
      });
    }

    // 3. Cleanliness & Dirty Store Alert Lever
    if (b.satisfactionBreakdown && b.satisfactionBreakdown.cleanliness < 75) {
      opps.push({
        id: `clean_${b.id}`,
        title: `Schedule Dedicated Cleaning Shift`,
        location: b.name,
        current: `${b.satisfactionBreakdown.cleanliness}% Cleanliness`,
        recommended: `100% Cleanliness`,
        weeklyImpact: null,
        category: 'Operations',
        description: `Dirty store reduces customer retention and satisfaction rating.`
      });
    }

    // 4. Marketing & Traffic Expansion Lever
    if (b.promotion && b.promotion.marketing === 0) {
      opps.push({
        id: `marketing_${b.id}`,
        title: `Launch District Marketing Campaign`,
        location: b.name,
        current: `0% Marketing`,
        recommended: `Increase Foot Traffic`,
        weeklyImpact: null,
        category: 'Marketing',
        description: `Store relies solely on natural foot traffic; marketing can unlock additional foot traffic.`
      });
    }

    // 4b. Missing Customer Amenities (unmet customer demands lower satisfaction)
    const amenities = buildAmenityReport(b);
    if (amenities && amenities.missing.length > 0) {
      const missingNames = amenities.missing.map(m => m.name).join(', ');
      opps.push({
        id: `amenities_${b.id}`,
        title: `Provide Missing Amenities (${missingNames})`,
        location: b.name,
        current: `${amenities.fulfilledCount}/${amenities.requiredCount} met`,
        recommended: `Provide all ${amenities.requiredCount}`,
        weeklyImpact: null,
        category: 'Operations',
        description: `Customers want ${missingNames}. Unmet customer demands lower the store's facility satisfaction and send customers away.`
      });
    }

    // 4c. Checkout supplies (paper/plastic bags). These are consumed but never
    // sold, so they never show up as pricing levers; running out stops bagging.
    const supplies = getStoreSupplies(b);
    if (supplies.length > 0) {
      const criticalSupplies = supplies.filter(
        s => s.quantity <= 0 || (s.runoutDays != null && s.runoutDays <= BAG_CRITICAL_RUNOUT_DAYS)
      );
      if (criticalSupplies.length > 0) {
        const names = criticalSupplies.map(s => s.displayName).join(', ');
        const current = criticalSupplies
          .map(s => `${s.displayName}: ${s.quantity}${s.runoutDays != null ? ` (~${s.runoutDays.toFixed(1)}d)` : ''}`)
          .join(', ');
        opps.push({
          id: `bags_${b.id}`,
          title: `Restock Checkout Supplies (${names})`,
          location: b.name,
          current,
          recommended: `Restock ${names}`,
          weeklyImpact: null,
          category: 'Stock',
          description: `Checkout cannot bag purchases without ${names}, which stops sales.`
        });
      }
    }

    // 5. Consolidated Unstaffed Open Hours Gaps & Unopened Windows per Store (Accurate Hourly Sum)
    if (b.scheduleWeek) {
      const cleanRawType = (b.rawType || b.type || '').replace('ba:businesstype_', '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const staticDef = (rawBusinesses as any[]).find(sbd => {
        const sbdClean = (sbd.raw_id || sbd.id || '').replace('ba:businesstype_', '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return sbdClean === cleanRawType || sbd.name.toLowerCase() === b.type.toLowerCase();
      });

      const peakHours: number[] = staticDef?.operating_schedule?.peak_hours || [12, 13, 18, 19];
      const hourlyCurve: number[] = staticDef?.operating_schedule?.hourly_multipliers || Array(24).fill(0.5);
      const dayMultipliers: Record<string, number> = staticDef?.operating_schedule?.day_multipliers || {};

      const unstaffedDaysMap: { day: string; hours: number[] }[] = [];
      let totalUnstaffedHoursCount = 0;

      const closedPeakDaysList: string[] = [];

      b.scheduleWeek.forEach((sd: any) => {
        const dayFactor = dayMultipliers[sd.day] || 1.0;

        if (sd.isOpen) {
          const missingHours: number[] = [];

          for (let h = 0; h < 24; h++) {
            const isHourActuallyOpen = Array.isArray(sd.hoursOpen) && sd.hoursOpen.length === 24
              ? !!sd.hoursOpen[h]
              : (sd.startHour !== undefined && sd.endHour !== undefined && sd.startHour !== -1 && h >= sd.startHour && h < sd.endHour);

            if (!isHourActuallyOpen) continue;

            const activeCashiers = (sd.shifts || []).filter((s: any) => {
              if (h < s.startHour || h >= s.endHour) return false;
              const empObj = employees.find(e => e.id === s.employeeId || e.name === s.employeeName);
              const skill = (s.skillName || empObj?.primarySkillName || '').toLowerCase();
              const role = (s.role || '').toLowerCase();
              const station = ((s as any).stationName || '').toLowerCase();
              if (role === 'cleaner' || skill.includes('clean') || station.includes('clean')) return false;
              if (role === 'security' || skill.includes('security') || skill.includes('guard') || station.includes('security')) return false;
              if (role === 'logistics' || skill.includes('logistic') || skill.includes('driver') || station.includes('logistic')) return false;
              return true;
            });

            if (activeCashiers.length === 0) {
              missingHours.push(h);
              totalUnstaffedHoursCount++;
            }
          }

          if (missingHours.length > 0) {
            unstaffedDaysMap.push({ day: sd.day.slice(0, 3), hours: missingHours });
          }
        } else {
          if (dayFactor >= CLOSED_PEAK_DAY_MULTIPLIER) {
            closedPeakDaysList.push(sd.day.slice(0, 3));
          }
        }
      });

      if (unstaffedDaysMap.length > 0) {
        opps.push({
          id: `unstaffed_open_${b.id}`,
          title: `Staff Open Shifts on ${unstaffedDaysMap.map(d => d.day).join(', ')}`,
          location: b.name,
          current: `0 cashiers across ${totalUnstaffedHoursCount} open hrs`,
          recommended: `Assign cashiers`,
          weeklyImpact: null,
          category: 'Scheduling',
          description: `Store is open with 0 cashiers across ${totalUnstaffedHoursCount} open hours on ${unstaffedDaysMap.map(d => `${d.day} (${d.hours.map(h => `${h}h`).join(', ')})`).join(', ')}. Customers walk out with zero sales.`
        });
      }

      if (closedPeakDaysList.length > 0) {
        opps.push({
          id: `peak_closed_${b.id}`,
          title: `Open on High-Traffic Days (${closedPeakDaysList.join(', ')})`,
          location: b.name,
          current: `Closed all day`,
          recommended: `Open rush window (${peakHours[0]}:00-${peakHours[peakHours.length - 1] + 1}:00)`,
          weeklyImpact: null,
          category: 'Operating Hours',
          description: `${closedPeakDaysList.join(', ')} have strong customer traffic in ${b.district}. Opening during peak hours unlocks extra market sales.`
        });
      }

      const recommendedWindow = staticDef?.operating_schedule?.recommended_opening_window;
      if (recommendedWindow) {
        const nonOptimalDays: { day: string; missingHours: number[] }[] = [];
        b.scheduleWeek.forEach(sd => {
          if (sd.isOpen) {
            const dayFactor = dayMultipliers[sd.day] ?? 0.85;
            const profitableHours: number[] = [];
            for (let h = 0; h < 24; h++) {
              if ((hourlyCurve[h] || 0) * dayFactor >= PROFITABLE_HOUR_MULTIPLIER) {
                profitableHours.push(h);
              }
            }

            const missing = profitableHours.filter(h => {
              const isOpen = Array.isArray(sd.hoursOpen) && sd.hoursOpen.length === 24
                ? !!sd.hoursOpen[h]
                : (sd.startHour !== undefined && sd.endHour !== undefined && sd.startHour !== -1 && h >= sd.startHour && h < sd.endHour);
              return !isOpen;
            });

            if (missing.length > 0) {
              nonOptimalDays.push({ day: sd.day.slice(0, 3), missingHours: missing });
            }
          }
        });

        if (nonOptimalDays.length > 0) {
          const totalMissingHoursCount = nonOptimalDays.reduce((acc, d) => acc + d.missingHours.length, 0);
          opps.push({
            id: `suboptimal_window_${b.id}`,
            title: `Expand Operating Hours on ${nonOptimalDays.map(d => d.day).join(', ')}`,
            location: b.name,
            current: `${totalMissingHoursCount} profitable rush hrs closed`,
            recommended: `${recommendedWindow} (Compendium Benchmark)`,
            weeklyImpact: null,
            category: 'Operating Hours',
            description: `Store is closed during profitable rush hours on ${nonOptimalDays.map(d => `${d.day} (${d.missingHours.map(h => `${h}h`).join(', ')})`).join(', ')}. Opening during these hours captures significant demand.`
          });
        }
      }
    }
  });

  return opps.sort((a, b) => (b.weeklyImpact ?? 0) - (a.weeklyImpact ?? 0));
}

export function deriveOverviewData(
  businesses: LiveBusinessData[],
  activeAlerts: LiveOperationalAlert[],
  opportunities: Opportunity[],
  avgDailyProfit: number = 0
): OverviewDerivedData {
  const matchesAlertLocation = (alertLoc: string, bizName: string) => {
    const aClean = (alertLoc || '').toLowerCase().trim();
    const bClean = (bizName || '').toLowerCase().trim();
    return aClean === bClean || aClean.includes(bClean) || bClean.includes(aClean);
  };

  // Rankings and health only ever describe storefronts. A factory or warehouse has no
  // counter sales, so it would otherwise win "lowest performer" every time.
  const storefronts = businesses.filter(isStorefront);

  const criticalStores = storefronts.filter(b =>
    activeAlerts.some(a => matchesAlertLocation(a.location, b.name) && (a.severity === 'critical' || a.type === 'unstaffed'))
  );
  const warningStores = storefronts.filter(b =>
    !criticalStores.some(cb => cb.id === b.id) &&
    activeAlerts.some(a => matchesAlertLocation(a.location, b.name) && a.severity === 'warning')
  );
  const healthyStores = storefronts.filter(b =>
    !criticalStores.some(cb => cb.id === b.id) && !warningStores.some(wb => wb.id === b.id)
  );

  const storesWithProfits = [...storefronts].sort((a, b) => {
    const pA = a.dailyProfit !== undefined ? a.dailyProfit : (a.weeklyProfit ? Math.round(a.weeklyProfit / 7) : 0);
    const pB = b.dailyProfit !== undefined ? b.dailyProfit : (b.weeklyProfit ? Math.round(b.weeklyProfit / 7) : 0);
    return pB - pA;
  });
  const topPerformers = storesWithProfits.slice(0, PERFORMER_COUNT);
  const lowestPerformers = [...storesWithProfits].reverse().slice(0, PERFORMER_COUNT);

  const alertActionItems: ActionItem[] = activeAlerts.map(a => {
    const targetBiz = businesses.find(b => matchesAlertLocation(a.location, b.name));
    const isCrit = a.severity === 'critical' || a.type === 'unstaffed';
    const fixTab = a.type === 'unstaffed' ? 'schedule' : a.type === 'lowstock' ? 'pricing' : 'overview';
    const btnLabel = a.type === 'unstaffed' ? 'Resolve Shift' : a.type === 'lowstock' ? 'Restock / Price' : 'Inspect';
    const linkUrl = targetBiz ? `/live-sync?view=stores&store=${targetBiz.id}&tab=${fixTab}` : '/live-sync?view=stores';

    let itemImg = '';
    if (a.type === 'lowstock') {
      const itemMatch = a.message.match(/warning:\s*([a-zA-Z0-9\s]+?)\s+has\s+only/i);
      if (itemMatch && itemMatch[1]) {
        itemImg = getItemImageSrc(itemMatch[1]);
      }
    }

    return {
      id: a.id || `alert_${a.location}_${a.type}`,
      location: a.location,
      category: a.type === 'unstaffed' ? 'Scheduling' : a.type === 'lowstock' ? 'Stock' : 'Operations',
      message: a.message,
      isAlert: true,
      severity: isCrit ? ('critical' as const) : ('warning' as const),
      priorityRank: isCrit ? 1 : 2,
      impactScore: isCrit ? 1000000 : 100000,
      btnLabel,
      linkUrl,
      targetBiz,
      itemImg
    };
  });

  // A store losing money is dollar-denominated, so it is the finding family the
  // materiality gate can act on today. A site that cannot trade at all is never
  // counted away, which is handled by the critical alert family above.
  const lossActionItems: ActionItem[] = businesses
    .filter(b => !b.isHeadquarters && (b.dailyProfit ?? 0) < 0)
    .map(b => {
      const worth = Math.abs(b.dailyProfit);
      return {
        id: `loss_${b.id}`,
        location: b.name,
        category: 'Operations',
        message: `Lost $${worth.toLocaleString()} yesterday`,
        isAlert: true,
        severity: 'warning' as const,
        priorityRank: 2,
        impactScore: null,
        btnLabel: 'Inspect',
        linkUrl: `/live-sync?view=stores&store=${b.id}&tab=overview`,
        targetBiz: b,
        itemImg: '',
        worth
      };
    });

  // Opportunities are grouped by cause: three or more levers of the same kind at one
  // site are one finding with one fix, not a row per product.
  const oppActionItems = condenseOpportunities(opportunities, businesses, matchesAlertLocation);

  const gate = Math.max(avgDailyProfit * ALERT_MATERIALITY_SHARE, ALERT_MATERIALITY_FLOOR);

  const criticalActionItems = alertActionItems.filter(item => item.severity === 'critical');
  const rest = [
    ...alertActionItems.filter(item => item.severity !== 'critical'),
    ...lossActionItems,
    ...oppActionItems
  ].sort((a, b) => {
    if (a.priorityRank !== b.priorityRank) return a.priorityRank - b.priorityRank;
    return (b.impactScore ?? 0) - (a.impactScore ?? 0);
  });

  // Materiality gate: a finding with a measurable dollar worth below the gate is
  // counted at the foot of the feed, never read out as a line.
  const minor: ActionItem[] = [];
  const visible: ActionItem[] = [];
  for (const item of rest) {
    if (item.severity !== 'critical' && item.worth != null && Math.abs(item.worth) < gate) {
      minor.push(item);
    } else {
      visible.push(item);
    }
  }

  const remainingSlots = Math.max(0, 4 - criticalActionItems.length);
  const unifiedActionFeed = [
    ...criticalActionItems,
    ...visible.slice(0, remainingSlots)
  ];

  return {
    criticalStores,
    warningStores,
    healthyStores,
    topPerformers,
    lowestPerformers,
    unifiedActionFeed,
    minorCount: minor.length,
    minorWorth: minor.reduce((sum, item) => sum + Math.abs(item.worth ?? 0), 0)
  };
}

// Collapse repeated same-cause opportunities at one site into a single line. Below
// the condensation count each lever is shown individually so the specific fix is
// still visible.
function condenseOpportunities(
  opportunities: Opportunity[],
  businesses: LiveBusinessData[],
  matchesLocation: (location: string, bizName: string) => boolean
): ActionItem[] {
  const byCause = new Map<string, Opportunity[]>();
  for (const op of opportunities) {
    const key = `${op.location}\u0000${op.category}`;
    const list = byCause.get(key);
    if (list) list.push(op);
    else byCause.set(key, [op]);
  }

  const out: ActionItem[] = [];
  for (const group of byCause.values()) {
    const first = group[0];
    const targetBiz = businesses.find(b => matchesLocation(first.location, b.name));
    const fixTab = first.category === 'Pricing' ? 'pricing' : (first.category === 'Scheduling' || first.category === 'Operating Hours') ? 'schedule' : 'overview';
    const linkUrl = targetBiz ? `/live-sync?view=stores&store=${targetBiz.id}&tab=${fixTab}` : '/live-sync?view=stores';

    if (group.length >= ALERT_CONDENSE_AT) {
      out.push({
        id: `opp_group_${first.location}_${first.category}`,
        location: first.location,
        category: first.category,
        message: `${group.length} ${first.category.toLowerCase()} levers at ${first.location}: ${first.title}`,
        isAlert: false,
        severity: 'opportunity',
        priorityRank: 3,
        impactScore: null,
        btnLabel: 'Optimize',
        linkUrl,
        targetBiz,
        itemImg: first.category === 'Pricing' ? getItemImageSrc(first.title) : ''
      });
      continue;
    }

    for (const op of group) {
      out.push({
        id: op.id,
        location: op.location,
        category: op.category,
        message: `${op.title}${op.current && op.recommended ? ` (${op.current} -> ${op.recommended})` : ''}`,
        isAlert: false,
        severity: 'opportunity',
        priorityRank: 3,
        impactScore: op.weeklyImpact,
        btnLabel: 'Optimize',
        linkUrl,
        targetBiz,
        itemImg: op.category === 'Pricing' ? getItemImageSrc(op.title) : ''
      });
    }
  }
  return out;
}
