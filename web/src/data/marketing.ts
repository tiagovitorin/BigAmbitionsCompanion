export interface MarketingCampaignType {
  id: string;
  name: string;
  category: 'Internet' | 'Billboard';
  pricePerDay: number;
  sqmReach: number;
  availableAt: ('CityAds' | "McCain's eMarketing")[];
}

export interface BuildingSize {
  id: string;
  name: string;
  squareMeters: number;
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

// Exact physical building sizes in Big Ambitions, sourced from BuildingSizeData
// (data/raw/building_sizes.json). Zero-area sizes (boat/parking) are excluded.
export const BUILDING_SIZES: BuildingSize[] = [
  { id: 'b', name: '54 m²', squareMeters: 54 },
  { id: 'a', name: '75 m²', squareMeters: 75 },
  { id: 'f', name: '96 m²', squareMeters: 96 },
  { id: 'l', name: '204 m²', squareMeters: 204 },
  { id: 'c', name: '225 m²', squareMeters: 225 },
  { id: 'd', name: '285 m²', squareMeters: 285 },
  { id: 'n', name: '589 m²', squareMeters: 589 },
  { id: 'k', name: '660 m²', squareMeters: 660 },
  { id: 'h', name: '690 m²', squareMeters: 690 },
  { id: 'm', name: '1,000 m²', squareMeters: 1000 },
  { id: 'i', name: '1,292 m²', squareMeters: 1292 },
  { id: 'e', name: '1,887 m²', squareMeters: 1887 },
  { id: 'g', name: '2,000 m²', squareMeters: 2000 },
  { id: 'p', name: '2,184 m²', squareMeters: 2184 },
  { id: 'q', name: '2,610 m²', squareMeters: 2610 },
  { id: 't', name: '8,496 m²', squareMeters: 8496 }
];

export const MARKETING_AGENCIES = [
  {
    name: 'CityAds',
    district: "Hell's Kitchen",
    address: '5 2nd Avenue',
    offerings: 'All 6 Campaign Types (Internet & Billboards)',
    taxDeductible: true
  },
  {
    name: "McCain's eMarketing",
    district: "Hell's Kitchen",
    address: '17 3rd Avenue',
    offerings: 'Internet Campaigns Only (Small, Medium, Large)',
    taxDeductible: true
  }
];
