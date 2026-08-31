export interface MarketingCampaignType {
  id: string;
  name: string;
  category: 'Internet' | 'Billboard';
  pricePerDay: number;
  sqmReach: number;
  availableAt: ('CityAds' | "McCain's eMarketing")[];
}

export interface BuildingSizeTier {
  id: string;
  name: string; // "Small", "Medium", "Large", "Mega", "Cinema/Theater"
  squareMeters: number;
  retailCap: number | null;
  officeCap: number | null;
  entertainmentCap: number | null;
}

export const MARKETING_CAMPAIGNS: MarketingCampaignType[] = [
  {
    id: 'SmallInternet',
    name: 'Small Internet Campaign',
    category: 'Internet',
    pricePerDay: 100,
    sqmReach: 20,
    availableAt: ['CityAds', "McCain's eMarketing"]
  },
  {
    id: 'MediumInternet',
    name: 'Medium Internet Campaign',
    category: 'Internet',
    pricePerDay: 250,
    sqmReach: 40,
    availableAt: ['CityAds', "McCain's eMarketing"]
  },
  {
    id: 'LargeInternet',
    name: 'Large Internet Campaign',
    category: 'Internet',
    pricePerDay: 500,
    sqmReach: 60,
    availableAt: ['CityAds', "McCain's eMarketing"]
  },
  {
    id: 'SmallBillboard',
    name: 'Small Billboard Campaign',
    category: 'Billboard',
    pricePerDay: 500,
    sqmReach: 100,
    availableAt: ['CityAds']
  },
  {
    id: 'MediumBillboard',
    name: 'Medium Billboard Campaign',
    category: 'Billboard',
    pricePerDay: 2500,
    sqmReach: 250,
    availableAt: ['CityAds']
  },
  {
    id: 'LargeBillboard',
    name: 'Large Billboard Campaign',
    category: 'Billboard',
    pricePerDay: 6000,
    sqmReach: 600,
    availableAt: ['CityAds']
  }
];

// Exact physical building sizes in Big Ambitions
export const BUILDING_SIZE_TIERS: BuildingSizeTier[] = [
  {
    id: '75',
    name: '75 m²',
    squareMeters: 75,
    retailCap: 15,
    officeCap: 4,
    entertainmentCap: null
  },
  {
    id: '225',
    name: '225 m²',
    squareMeters: 225,
    retailCap: 30,
    officeCap: 8,
    entertainmentCap: null
  },
  {
    id: '285',
    name: '285 m²',
    squareMeters: 285,
    retailCap: 50,
    officeCap: 10,
    entertainmentCap: null
  },
  {
    id: '660',
    name: '660 m²',
    squareMeters: 660,
    retailCap: null,
    officeCap: 50,
    entertainmentCap: null
  },
  {
    id: '1000',
    name: '1,000 m²',
    squareMeters: 1000,
    retailCap: 75,
    officeCap: null,
    entertainmentCap: null
  },
  {
    id: '2000',
    name: '2,000 m²',
    squareMeters: 2000,
    retailCap: null,
    officeCap: null,
    entertainmentCap: 200
  }
];

export const MARKETING_AGENCIES = [
  {
    name: 'CityAds',
    district: "Hell's Kitchen",
    address: '5 2nd Ave',
    offerings: 'All 6 Campaign Types (Internet & Billboards)',
    taxDeductible: true
  },
  {
    name: "McCain's eMarketing",
    district: "Hell's Kitchen",
    address: '17 3rd Ave',
    offerings: 'Internet Campaigns Only (Small, Medium, Large)',
    taxDeductible: true
  }
];

export function calculateCampaignReachPct(sqmReach: number, squareMeters: number): number {
  if (!squareMeters || squareMeters <= 0) return 0;
  return Math.min(100, Math.round((sqmReach / squareMeters) * 100));
}

export function calculateMarketingEfficiency(selectedCampaignIds: string[], squareMeters: number): number {
  if (!squareMeters || squareMeters <= 0) return 0;
  const totalSqmReach = selectedCampaignIds.reduce((sum, id) => {
    const campaign = MARKETING_CAMPAIGNS.find(c => c.id === id);
    return sum + (campaign ? campaign.sqmReach : 0);
  }, 0);

  const rawPct = (totalSqmReach / squareMeters) * 100;
  return Math.min(100, Math.round(rawPct));
}

export function calculateTotalDailyCost(selectedCampaignIds: string[]): number {
  return selectedCampaignIds.reduce((sum, id) => {
    const campaign = MARKETING_CAMPAIGNS.find(c => c.id === id);
    return sum + (campaign ? campaign.pricePerDay : 0);
  }, 0);
}

export function calculateTotalPromotion(trafficIndex: number, marketingEfficiencyPct: number, marketingStrength: number): number {
  const boost = marketingEfficiencyPct * marketingStrength;
  return Math.min(100, Math.round(trafficIndex + boost));
}

// Find optimal lowest-cost combination of campaigns that achieves 100% efficiency (or maximum reach if building exceeds campaign total)
export function findCheapest100PercentMix(squareMeters: number): string[] {
  let bestMix: string[] = [];
  let minCost = Infinity;
  let maxReach = 0;
  let minCostForMaxReach = Infinity;

  // Generate all 2^6 = 64 combinations
  const totalCombos = 1 << MARKETING_CAMPAIGNS.length;
  for (let i = 1; i < totalCombos; i++) {
    const currentMix: string[] = [];
    let currentCost = 0;
    let currentReach = 0;

    for (let bit = 0; bit < MARKETING_CAMPAIGNS.length; bit++) {
      if ((i & (1 << bit)) !== 0) {
        const camp = MARKETING_CAMPAIGNS[bit];
        currentMix.push(camp.id);
        currentCost += camp.pricePerDay;
        currentReach += camp.sqmReach;
      }
    }

    // Exact 100% or above threshold
    if (currentReach >= squareMeters) {
      if (currentCost < minCost) {
        minCost = currentCost;
        bestMix = currentMix;
      } else if (currentCost === minCost && currentMix.length < bestMix.length) {
        bestMix = currentMix;
      }
    }

    // Track best possible reach in case squareMeters > total possible reach (1,070 m²)
    if (currentReach > maxReach) {
      maxReach = currentReach;
      minCostForMaxReach = currentCost;
    }
  }

  // If squareMeters is greater than the sum of all campaigns (e.g. 2000 m² mega venues), return all campaigns for max coverage
  if (bestMix.length === 0) {
    return MARKETING_CAMPAIGNS.map(c => c.id);
  }

  return bestMix;
}
