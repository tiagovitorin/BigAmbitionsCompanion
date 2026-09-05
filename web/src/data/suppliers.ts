export interface SupplierDefinition {
  id: string;
  name: string;
  type: 'Wholesaler' | 'Importer' | 'Retail Equipment Vendor';
  district: string;
  address: string;
  description: string;
  deliveryMethod: 'Weekly In-Store Delivery Contract' | 'Ocean Port Delivery to Warehouse' | 'Direct Store Purchase';
  requiresPurchasingAgent: boolean;
  minOrderRequirement?: string;
  categories: string[];
}

export const SUPPLIERS_DB: SupplierDefinition[] = [
  // 6 District Wholesalers
  {
    id: 'metro-wholesale',
    name: 'Metro Wholesale',
    type: 'Wholesaler',
    district: 'Garment District',
    address: '2 5th Avenue',
    description: 'Premier district wholesaler. Visit in-person to sign weekly direct delivery contracts for beverages, snacks, grocery, paper bags, and retail goods directly to store shelves.',
    deliveryMethod: 'Weekly In-Store Delivery Contract',
    requiresPurchasingAgent: false,
    minOrderRequirement: 'Max 5,000 units/order',
    categories: ['Beverages & Alcohol', 'Fresh & Packaged Food', 'Retail Basics', 'Packaging Boxes']
  },
  {
    id: 'ny-distro-inc',
    name: 'NY Distro inc',
    type: 'Wholesaler',
    district: "Hell's Kitchen",
    address: '14 11th Avenue',
    description: 'High-capacity distributor specialized in supermarket goods, cleaning supplies, restaurant ingredients, and fast-food consumables.',
    deliveryMethod: 'Weekly In-Store Delivery Contract',
    requiresPurchasingAgent: false,
    minOrderRequirement: 'Max 5,000 units/order',
    categories: ['Fast Food Ingredients', 'Restaurant Goods', 'Supermarket Produce', 'Cleaning Supplies']
  },
  {
    id: 'total-produce-trading',
    name: 'Total Produce Trading',
    type: 'Wholesaler',
    district: 'Murray Hill',
    address: '8 3rd Avenue',
    description: 'Specialized grocery, fresh fruit, vegetable, and bakery wholesaler supplying midtown retail locations.',
    deliveryMethod: 'Weekly In-Store Delivery Contract',
    requiresPurchasingAgent: false,
    minOrderRequirement: 'Max 5,000 units/order',
    categories: ['Fresh Produce', 'Fruits & Vegetables', 'Bakery', 'Coffee & Tea']
  },
  {
    id: 'hudson-wholesale',
    name: 'Hudson Wholesale',
    type: 'Wholesaler',
    district: 'Midtown',
    address: '24 8th Avenue',
    description: 'Midtown retail distributor for convenience goods, packaged snacks, drinks, and florist supplies.',
    deliveryMethod: 'Weekly In-Store Delivery Contract',
    requiresPurchasingAgent: false,
    minOrderRequirement: 'Max 5,000 units/order',
    categories: ['Convenience Goods', 'Flowers', 'Drinks', 'Tobacco Products']
  },
  {
    id: 'stockco',
    name: 'Stockco',
    type: 'Wholesaler',
    district: 'Lower Manhattan',
    address: '10 Wall Street',
    description: 'Financial district general merchant wholesaler handling quick reorders for retail stores across lower Manhattan.',
    deliveryMethod: 'Weekly In-Store Delivery Contract',
    requiresPurchasingAgent: false,
    minOrderRequirement: 'Max 5,000 units/order',
    categories: ['Retail Merchandise', 'Office Accessories', 'Groceries', 'Beverages']
  },
  {
    id: 'titans-of-industry-supply',
    name: 'Titans Of Industry Supply',
    type: 'Wholesaler',
    district: 'Industry City',
    address: '32 39th Street',
    description: 'Industrial zone wholesale distributor supplying both industrial materials and bulk retail goods.',
    deliveryMethod: 'Weekly In-Store Delivery Contract',
    requiresPurchasingAgent: false,
    minOrderRequirement: 'Max 5,000 units/order',
    categories: ['Industrial Parts', 'Packaged Goods', 'Raw Materials', 'Retail Supplies']
  },

  // 8 Ocean Harbor Port Importers
  {
    id: 'jetcargo-imports',
    name: 'JetCargo Imports',
    type: 'Importer',
    district: 'Lower Manhattan / South Port',
    address: 'Pier 18, South Street Seaport',
    description: 'Global air & sea freight importer specialized in electronics, smart devices, burgers, croissants, energy drinks, and luxury goods.',
    deliveryMethod: 'Ocean Port Delivery to Warehouse',
    requiresPurchasingAgent: true,
    minOrderRequirement: 'Max 25,000 units/order',
    categories: ['Smartphones & Tablets', 'Bakery & Fast Food', 'Electronics', 'Jewelry', 'Watches & Tech']
  },
  {
    id: 'seaside-internationals',
    name: 'SeaSide Internationals',
    type: 'Importer',
    district: 'Lower Manhattan Harbor',
    address: 'Pier 7, Battery Park South',
    description: 'Fresh agricultural produce, cotton candy, and florist supplier. Imports fresh cut flowers, exotic seeds, and produce.',
    deliveryMethod: 'Ocean Port Delivery to Warehouse',
    requiresPurchasingAgent: true,
    minOrderRequirement: 'Max 25,000 units/order',
    categories: ['Fresh Flowers', 'Seeds & Raw Crops', 'Fresh Produce', 'Cotton Candy']
  },
  {
    id: 'united-ocean-import',
    name: 'United Ocean Import',
    type: 'Importer',
    district: 'Industry City / Brooklyn Terminal',
    address: 'Terminal Wharf 4',
    description: 'Large-volume bulk ocean freight carrier handling imported wines, beer, spirits, packaged cheese platters, and cigars.',
    deliveryMethod: 'Ocean Port Delivery to Warehouse',
    requiresPurchasingAgent: true,
    minOrderRequirement: 'Max 25,000 units/order',
    categories: ['Wine & Liquor', 'Tobacco & Cigars', 'Beer', 'Cheese Platters']
  },
  {
    id: 'bluestone-imports',
    name: 'BlueStone Imports',
    type: 'Importer',
    district: 'Industry City',
    address: 'Dock 9, Maritime Way',
    description: 'Specialty textile and apparel importer distributing male & female designer clothing, cheap gifts, formal wear, and footwear.',
    deliveryMethod: 'Ocean Port Delivery to Warehouse',
    requiresPurchasingAgent: true,
    minOrderRequirement: 'Max 25,000 units/order',
    categories: ['Male & Female Clothing', 'Footwear', 'Cheap Gifts', 'Fashion Accessories']
  },
  {
    id: 'maritime-freight-line',
    name: 'Maritime Freight Line',
    type: 'Importer',
    district: 'Industry City Port',
    address: 'Wharf 12, Pierhead Road',
    description: 'Industrial raw materials, metals, capacitors, batteries, and manufacturing hardware importer for factory assembly lines.',
    deliveryMethod: 'Ocean Port Delivery to Warehouse',
    requiresPurchasingAgent: true,
    minOrderRequirement: 'Max 25,000 units/order',
    categories: ['Industrial Parts', 'Steel & Metal', 'Capacitors', 'Circuit Boards', 'Batteries']
  },
  {
    id: 'aquatic-bay-cargo',
    name: 'Aquatic Bay Cargo',
    type: 'Importer',
    district: 'Lower Manhattan / South Port',
    address: 'Pier 22, Ocean Terminal',
    description: 'General merchandise ocean carrier handling expensive gifts, jewelry, souvenirs, novelties, and household accessories.',
    deliveryMethod: 'Ocean Port Delivery to Warehouse',
    requiresPurchasingAgent: true,
    minOrderRequirement: 'Max 25,000 units/order',
    categories: ['Expensive Gifts', 'Jewelry', 'Souvenirs', 'Home Decor']
  },
  {
    id: 'lunar-tide-shipments',
    name: 'Lunar Tide Shipments',
    type: 'Importer',
    district: 'Industry City Port',
    address: 'Pier 31, Terminal Island',
    description: 'Specialty food ingredients, butter, dough, cola flavoring, and baking components importer.',
    deliveryMethod: 'Ocean Port Delivery to Warehouse',
    requiresPurchasingAgent: true,
    minOrderRequirement: 'Max 25,000 units/order',
    categories: ['Baking Mix', 'Butter & Dough', 'Chicken Breast', 'Food Ingredients']
  },
  {
    id: 'global-harvest-traders',
    name: 'Global Harvest Traders',
    type: 'Importer',
    district: 'Lower Manhattan Port',
    address: 'Wharf 3, Hudson Reach',
    description: 'Global agricultural commodities importer handling raw seeds (apple, banana, carrot), cigar papers, and popcorn kernels.',
    deliveryMethod: 'Ocean Port Delivery to Warehouse',
    requiresPurchasingAgent: true,
    minOrderRequirement: 'Max 25,000 units/order',
    categories: ['Crop Seeds', 'Cigar & Cigarette Papers', 'Popcorn Kernels', 'Raw Commodities']
  },

  // 4 Retail Equipment & Store Fixture Stores
  {
    id: 'square-appliances',
    name: 'Square Appliances & Displays',
    type: 'Retail Equipment Vendor',
    district: "Hell's Kitchen",
    address: '8 10th Avenue',
    description: 'Commercial cooking appliances, bakery display showcases, wine racks, cash counters, and refrigerated display coolers.',
    deliveryMethod: 'Direct Store Purchase',
    requiresPurchasingAgent: false,
    categories: ['Cooking Grills & Ovens', 'Display Coolers', 'Bakery Showcases', 'Wine Shelves']
  },
  {
    id: 'aj-pederson-sons',
    name: 'AJ Pederson & Sons',
    type: 'Retail Equipment Vendor',
    district: 'Garment District',
    address: '15 7th Avenue',
    description: 'Cash registers, conveyor checkout counters, security cameras, lockers, and business computers.',
    deliveryMethod: 'Direct Store Purchase',
    requiresPurchasingAgent: false,
    categories: ['Cash Registers', 'Checkout Counters', 'Computers & Tech', 'Security Cameras']
  },
  {
    id: 'ikea-city-furniture',
    name: 'IKEA / City Furniture',
    type: 'Retail Equipment Vendor',
    district: "Hell's Kitchen",
    address: '22 11th Avenue',
    description: 'Tables, chairs, storage cabinets, modular sinks, bathroom stalls, and customer seating.',
    deliveryMethod: 'Direct Store Purchase',
    requiresPurchasingAgent: false,
    categories: ['Office Desks', 'Chairs & Seating', 'Restroom Stalls', 'Tables']
  },
  {
    id: 'city-office-supplies',
    name: 'City Office Supplies',
    type: 'Retail Equipment Vendor',
    district: 'Midtown',
    address: '5 44th Street',
    description: 'Office accessories, loudspeakers, trash bins, graphic tablets, and ergonomic chairs.',
    deliveryMethod: 'Direct Store Purchase',
    requiresPurchasingAgent: false,
    categories: ['Loudspeakers & Audio', 'Trash Bins', 'Graphic Tablets', 'Accessories']
  }
];

// Rich, hyper-realistic game save data for Demo Mode Preview
export const DEMO_TELEMETRY_STATE = {
  isConnected: true,
  modVersion: "2.2.0",
  lastHeartbeat: new Date().toISOString(),
  gameDay: 42,
  gameHour: 14,
  gameMinute: 35,
  playerCash: 34850,
  bankBalance: 489200,
  totalLoans: 120000,
  netWorth: 1845000,
  playerHappiness: 88,
  playerEnergy: 74,
  playerHunger: 12,

  // Daily Economics
  dailyRevenueTotal: 38450,
  dailyExpensesTotal: 14200,
  dailyBusinessRevenue: 36200,
  dailyResidentialRevenue: 2250,

  // Unified Weekly Economics
  weeklyRevenueTotal: 254800,
  weeklyExpensesTotal: 96400,
  weeklyBusinessRevenue: 239050,
  weeklyBusinessProfit: 142650,
  weeklyResidentialRevenue: 15750,
  weeklyResidentialExpenses: 4200,
  weeklyResidentialNet: 11550,

  // Workforce & Treasury
  totalEmployees: 28,
  totalHourlyPayroll: 620,
  weeklyPayrollTotal: 41200,
  taxDeductibleExpenses: 32000,
  unpaidTaxes: 14850,

  weeklyRevenueHistory: [
    { dayNumber: 36, dayName: 'Mon', revenue: 32100, expenses: 13500, profit: 18600 },
    { dayNumber: 37, dayName: 'Tue', revenue: 34200, expenses: 13800, profit: 20400 },
    { dayNumber: 38, dayName: 'Wed', revenue: 33900, expenses: 13600, profit: 20300 },
    { dayNumber: 39, dayName: 'Thu', revenue: 36800, expenses: 14100, profit: 22700 },
    { dayNumber: 40, dayName: 'Fri', revenue: 41500, expenses: 14900, profit: 26600 },
    { dayNumber: 41, dayName: 'Sat', revenue: 44200, expenses: 15200, profit: 29000 },
    { dayNumber: 42, dayName: 'Sun', revenue: 38450, expenses: 14200, profit: 24250 },
  ],

  businesses: [
    {
      id: "biz_midtown_supermarket",
      name: "Ambition Mart Midtown",
      type: "Supermarket",
      rawType: "ba:businesstype_supermarket",
      address: "14 5th Avenue",
      streetName: "5th Avenue",
      streetNumber: 14,
      district: "Midtown",
      dailyRevenue: 18650,
      dailyProfit: 10420,
      weeklyRevenue: 124000,
      weeklyProfit: 68500,
      weeklyRent: 6800,
      customerSatisfaction: 96,
      satisfactionBreakdown: {
        overall: 96,
        customerService: 100,
        cleanliness: 95,
        pricing: 92,
        facility: 98
      },
      customerCapacity: 50,
      isOpenNow: true,
      staffOnDuty: 4,
      openHoursPerWeek: 112,
      scheduledShiftHoursPerWeek: 448,
      cleanliness: 98,
      securityPct: 100,
      marketingCampaignsCount: 2,
      todayCustomerCount: 612,
      logo: {
        shape: "supermarket",
        base64: "",
        bgHex: "#059669",
        iconHex: "#FFFFFF"
      },
      revenueHistory: [
        {
          dayNumber: 8,
          revenue: 1190,
          profit: -273,
          salaries: 300,
          rent: 971,
          ongoing: 192,
          expenses: 1463
        },
        {
          dayNumber: 9,
          revenue: 1450,
          profit: -95,
          salaries: 350,
          rent: 971,
          ongoing: 224,
          expenses: 1545
        },
        {
          dayNumber: 10,
          revenue: 1690,
          profit: 71,
          salaries: 400,
          rent: 971,
          ongoing: 248,
          expenses: 1619
        },
        {
          dayNumber: 11,
          revenue: 1970,
          profit: 220,
          salaries: 500,
          rent: 971,
          ongoing: 279,
          expenses: 1750
        },
        {
          dayNumber: 12,
          revenue: 2710,
          profit: 800,
          salaries: 600,
          rent: 971,
          ongoing: 339,
          expenses: 1910
        },
        {
          dayNumber: 13,
          revenue: 3230,
          profit: 1115,
          salaries: 750,
          rent: 971,
          ongoing: 394,
          expenses: 2115
        },
        {
          dayNumber: 14,
          revenue: 3040,
          profit: 797,
          salaries: 850,
          rent: 971,
          ongoing: 422,
          expenses: 2243
        },
        {
          dayNumber: 15,
          revenue: 3560,
          profit: 1177,
          salaries: 950,
          rent: 971,
          ongoing: 462,
          expenses: 2383
        },
        {
          dayNumber: 16,
          revenue: 4230,
          profit: 1617,
          salaries: 1100,
          rent: 971,
          ongoing: 542,
          expenses: 2613
        },
        {
          dayNumber: 17,
          revenue: 4780,
          profit: 1952,
          salaries: 1250,
          rent: 971,
          ongoing: 607,
          expenses: 2828
        },
        {
          dayNumber: 18,
          revenue: 5000,
          profit: 2049,
          salaries: 1350,
          rent: 971,
          ongoing: 630,
          expenses: 2951
        },
        {
          dayNumber: 19,
          revenue: 5950,
          profit: 2803,
          salaries: 1500,
          rent: 971,
          ongoing: 676,
          expenses: 3147
        },
        {
          dayNumber: 20,
          revenue: 6870,
          profit: 3474,
          salaries: 1650,
          rent: 971,
          ongoing: 775,
          expenses: 3396
        },
        {
          dayNumber: 21,
          revenue: 6500,
          profit: 2884,
          salaries: 1800,
          rent: 971,
          ongoing: 845,
          expenses: 3616
        },
        {
          dayNumber: 22,
          revenue: 6990,
          profit: 3211,
          salaries: 1950,
          rent: 971,
          ongoing: 858,
          expenses: 3779
        },
        {
          dayNumber: 23,
          revenue: 7460,
          profit: 3477,
          salaries: 2100,
          rent: 971,
          ongoing: 912,
          expenses: 3983
        },
        {
          dayNumber: 24,
          revenue: 8460,
          profit: 4209,
          salaries: 2250,
          rent: 971,
          ongoing: 1030,
          expenses: 4251
        },
        {
          dayNumber: 25,
          revenue: 9060,
          profit: 4589,
          salaries: 2400,
          rent: 971,
          ongoing: 1100,
          expenses: 4471
        },
        {
          dayNumber: 26,
          revenue: 10020,
          profit: 5397,
          salaries: 2550,
          rent: 971,
          ongoing: 1102,
          expenses: 4623
        },
        {
          dayNumber: 27,
          revenue: 10620,
          profit: 5783,
          salaries: 2700,
          rent: 971,
          ongoing: 1166,
          expenses: 4837
        },
        {
          dayNumber: 28,
          revenue: 10280,
          profit: 5156,
          salaries: 2850,
          rent: 971,
          ongoing: 1303,
          expenses: 5124
        },
        {
          dayNumber: 29,
          revenue: 11400,
          profit: 6060,
          salaries: 3000,
          rent: 971,
          ongoing: 1369,
          expenses: 5340
        },
        {
          dayNumber: 30,
          revenue: 11340,
          profit: 5810,
          salaries: 3200,
          rent: 971,
          ongoing: 1359,
          expenses: 5530
        },
        {
          dayNumber: 31,
          revenue: 12000,
          profit: 6244,
          salaries: 3350,
          rent: 971,
          ongoing: 1435,
          expenses: 5756
        },
        {
          dayNumber: 32,
          revenue: 13320,
          profit: 7258,
          salaries: 3500,
          rent: 971,
          ongoing: 1591,
          expenses: 6062
        },
        {
          dayNumber: 33,
          revenue: 15210,
          profit: 8890,
          salaries: 3700,
          rent: 971,
          ongoing: 1649,
          expenses: 6320
        },
        {
          dayNumber: 34,
          revenue: 15030,
          profit: 8581,
          salaries: 3850,
          rent: 971,
          ongoing: 1628,
          expenses: 6449
        },
        {
          dayNumber: 35,
          revenue: 13740,
          profit: 6999,
          salaries: 4050,
          rent: 971,
          ongoing: 1720,
          expenses: 6741
        },
        {
          dayNumber: 36,
          revenue: 15400,
          profit: 8400,
          salaries: 4200,
          rent: 971,
          ongoing: 1829,
          expenses: 7000
        },
        {
          dayNumber: 37,
          revenue: 16200,
          profit: 8900,
          salaries: 4200,
          rent: 971,
          ongoing: 2129,
          expenses: 7300
        },
        {
          dayNumber: 38,
          revenue: 15900,
          profit: 8750,
          salaries: 4200,
          rent: 971,
          ongoing: 1979,
          expenses: 7150
        },
        {
          dayNumber: 39,
          revenue: 17400,
          profit: 9600,
          salaries: 4200,
          rent: 971,
          ongoing: 2629,
          expenses: 7800
        },
        {
          dayNumber: 40,
          revenue: 19800,
          profit: 11100,
          salaries: 4600,
          rent: 971,
          ongoing: 3129,
          expenses: 8700
        },
        {
          dayNumber: 41,
          revenue: 21200,
          profit: 12000,
          salaries: 4800,
          rent: 971,
          ongoing: 3429,
          expenses: 9200
        },
        {
          dayNumber: 42,
          revenue: 18650,
          profit: 10420,
          salaries: 4400,
          rent: 971,
          ongoing: 2859,
          expenses: 8230
        }
      ],
      orderHistory: [
        {
          dayNumber: 8,
          totalCustomers: 45,
          totalRevenue: 1190,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 25,
              totalPrice: 138,
              totalWholesalePrice: 31
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 16,
              totalPrice: 224,
              totalWholesalePrice: 61
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 18,
              totalPrice: 117,
              totalWholesalePrice: 20
            }
          ]
        },
        {
          dayNumber: 9,
          totalCustomers: 54,
          totalRevenue: 1450,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 30,
              totalPrice: 165,
              totalWholesalePrice: 38
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 19,
              totalPrice: 266,
              totalWholesalePrice: 72
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 22,
              totalPrice: 143,
              totalWholesalePrice: 24
            }
          ]
        },
        {
          dayNumber: 10,
          totalCustomers: 61,
          totalRevenue: 1690,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 34,
              totalPrice: 187,
              totalWholesalePrice: 43
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 21,
              totalPrice: 294,
              totalWholesalePrice: 80
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 25,
              totalPrice: 163,
              totalWholesalePrice: 28
            }
          ]
        },
        {
          dayNumber: 11,
          totalCustomers: 71,
          totalRevenue: 1970,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 39,
              totalPrice: 215,
              totalWholesalePrice: 49
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 25,
              totalPrice: 350,
              totalWholesalePrice: 95
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 29,
              totalPrice: 189,
              totalWholesalePrice: 32
            }
          ]
        },
        {
          dayNumber: 12,
          totalCustomers: 96,
          totalRevenue: 2710,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 53,
              totalPrice: 292,
              totalWholesalePrice: 66
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 34,
              totalPrice: 476,
              totalWholesalePrice: 129
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 39,
              totalPrice: 254,
              totalWholesalePrice: 43
            }
          ]
        },
        {
          dayNumber: 13,
          totalCustomers: 113,
          totalRevenue: 3230,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 62,
              totalPrice: 341,
              totalWholesalePrice: 78
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 40,
              totalPrice: 560,
              totalWholesalePrice: 152
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 46,
              totalPrice: 299,
              totalWholesalePrice: 51
            }
          ]
        },
        {
          dayNumber: 14,
          totalCustomers: 105,
          totalRevenue: 3040,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 58,
              totalPrice: 319,
              totalWholesalePrice: 73
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 37,
              totalPrice: 518,
              totalWholesalePrice: 141
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 43,
              totalPrice: 280,
              totalWholesalePrice: 47
            }
          ]
        },
        {
          dayNumber: 15,
          totalCustomers: 123,
          totalRevenue: 3560,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 68,
              totalPrice: 374,
              totalWholesalePrice: 85
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 43,
              totalPrice: 602,
              totalWholesalePrice: 163
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 50,
              totalPrice: 325,
              totalWholesalePrice: 55
            }
          ]
        },
        {
          dayNumber: 16,
          totalCustomers: 145,
          totalRevenue: 4230,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 80,
              totalPrice: 440,
              totalWholesalePrice: 100
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 51,
              totalPrice: 714,
              totalWholesalePrice: 194
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 59,
              totalPrice: 384,
              totalWholesalePrice: 65
            }
          ]
        },
        {
          dayNumber: 17,
          totalCustomers: 163,
          totalRevenue: 4780,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 90,
              totalPrice: 495,
              totalWholesalePrice: 113
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 57,
              totalPrice: 798,
              totalWholesalePrice: 217
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 67,
              totalPrice: 436,
              totalWholesalePrice: 74
            }
          ]
        },
        {
          dayNumber: 18,
          totalCustomers: 170,
          totalRevenue: 5000,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 94,
              totalPrice: 517,
              totalWholesalePrice: 118
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 59,
              totalPrice: 826,
              totalWholesalePrice: 224
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 70,
              totalPrice: 455,
              totalWholesalePrice: 77
            }
          ]
        },
        {
          dayNumber: 19,
          totalCustomers: 201,
          totalRevenue: 5950,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 111,
              totalPrice: 611,
              totalWholesalePrice: 139
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 70,
              totalPrice: 980,
              totalWholesalePrice: 266
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 82,
              totalPrice: 533,
              totalWholesalePrice: 90
            }
          ]
        },
        {
          dayNumber: 20,
          totalCustomers: 232,
          totalRevenue: 6870,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 128,
              totalPrice: 704,
              totalWholesalePrice: 160
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 81,
              totalPrice: 1134,
              totalWholesalePrice: 308
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 95,
              totalPrice: 618,
              totalWholesalePrice: 105
            }
          ]
        },
        {
          dayNumber: 21,
          totalCustomers: 219,
          totalRevenue: 6500,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 120,
              totalPrice: 660,
              totalWholesalePrice: 150
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 77,
              totalPrice: 1078,
              totalWholesalePrice: 293
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 90,
              totalPrice: 585,
              totalWholesalePrice: 99
            }
          ]
        },
        {
          dayNumber: 22,
          totalCustomers: 235,
          totalRevenue: 6990,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 129,
              totalPrice: 710,
              totalWholesalePrice: 161
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 82,
              totalPrice: 1148,
              totalWholesalePrice: 312
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 96,
              totalPrice: 624,
              totalWholesalePrice: 106
            }
          ]
        },
        {
          dayNumber: 23,
          totalCustomers: 250,
          totalRevenue: 7460,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 138,
              totalPrice: 759,
              totalWholesalePrice: 173
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 88,
              totalPrice: 1232,
              totalWholesalePrice: 334
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 103,
              totalPrice: 670,
              totalWholesalePrice: 113
            }
          ]
        },
        {
          dayNumber: 24,
          totalCustomers: 283,
          totalRevenue: 8460,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 156,
              totalPrice: 858,
              totalWholesalePrice: 195
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 99,
              totalPrice: 1386,
              totalWholesalePrice: 376
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 116,
              totalPrice: 754,
              totalWholesalePrice: 128
            }
          ]
        },
        {
          dayNumber: 25,
          totalCustomers: 303,
          totalRevenue: 9060,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 167,
              totalPrice: 919,
              totalWholesalePrice: 209
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 106,
              totalPrice: 1484,
              totalWholesalePrice: 403
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 124,
              totalPrice: 806,
              totalWholesalePrice: 136
            }
          ]
        },
        {
          dayNumber: 26,
          totalCustomers: 334,
          totalRevenue: 10020,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 184,
              totalPrice: 1012,
              totalWholesalePrice: 230
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 117,
              totalPrice: 1638,
              totalWholesalePrice: 445
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 137,
              totalPrice: 891,
              totalWholesalePrice: 151
            }
          ]
        },
        {
          dayNumber: 27,
          totalCustomers: 354,
          totalRevenue: 10620,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 195,
              totalPrice: 1073,
              totalWholesalePrice: 244
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 124,
              totalPrice: 1736,
              totalWholesalePrice: 471
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 145,
              totalPrice: 943,
              totalWholesalePrice: 160
            }
          ]
        },
        {
          dayNumber: 28,
          totalCustomers: 343,
          totalRevenue: 10280,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 189,
              totalPrice: 1040,
              totalWholesalePrice: 236
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 120,
              totalPrice: 1680,
              totalWholesalePrice: 456
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 141,
              totalPrice: 917,
              totalWholesalePrice: 155
            }
          ]
        },
        {
          dayNumber: 29,
          totalCustomers: 379,
          totalRevenue: 11400,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 208,
              totalPrice: 1144,
              totalWholesalePrice: 260
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 133,
              totalPrice: 1862,
              totalWholesalePrice: 505
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 155,
              totalPrice: 1008,
              totalWholesalePrice: 171
            }
          ]
        },
        {
          dayNumber: 30,
          totalCustomers: 377,
          totalRevenue: 11340,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 207,
              totalPrice: 1139,
              totalWholesalePrice: 259
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 132,
              totalPrice: 1848,
              totalWholesalePrice: 502
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 155,
              totalPrice: 1008,
              totalWholesalePrice: 171
            }
          ]
        },
        {
          dayNumber: 31,
          totalCustomers: 399,
          totalRevenue: 12000,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 219,
              totalPrice: 1205,
              totalWholesalePrice: 274
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 140,
              totalPrice: 1960,
              totalWholesalePrice: 532
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 164,
              totalPrice: 1066,
              totalWholesalePrice: 180
            }
          ]
        },
        {
          dayNumber: 32,
          totalCustomers: 442,
          totalRevenue: 13320,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 243,
              totalPrice: 1337,
              totalWholesalePrice: 304
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 155,
              totalPrice: 2170,
              totalWholesalePrice: 589
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 181,
              totalPrice: 1177,
              totalWholesalePrice: 199
            }
          ]
        },
        {
          dayNumber: 33,
          totalCustomers: 505,
          totalRevenue: 15210,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 278,
              totalPrice: 1529,
              totalWholesalePrice: 348
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 177,
              totalPrice: 2478,
              totalWholesalePrice: 673
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 207,
              totalPrice: 1346,
              totalWholesalePrice: 228
            }
          ]
        },
        {
          dayNumber: 34,
          totalCustomers: 498,
          totalRevenue: 15030,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 274,
              totalPrice: 1507,
              totalWholesalePrice: 343
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 174,
              totalPrice: 2436,
              totalWholesalePrice: 661
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 204,
              totalPrice: 1326,
              totalWholesalePrice: 224
            }
          ]
        },
        {
          dayNumber: 35,
          totalCustomers: 455,
          totalRevenue: 13740,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 250,
              totalPrice: 1375,
              totalWholesalePrice: 313
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 159,
              totalPrice: 2226,
              totalWholesalePrice: 604
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 187,
              totalPrice: 1216,
              totalWholesalePrice: 206
            }
          ]
        },
        {
          dayNumber: 36,
          totalCustomers: 510,
          totalRevenue: 15400,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 280,
              totalPrice: 1540,
              totalWholesalePrice: 350
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 180,
              totalPrice: 2520,
              totalWholesalePrice: 684
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 210,
              totalPrice: 1365,
              totalWholesalePrice: 231
            }
          ]
        },
        {
          dayNumber: 37,
          totalCustomers: 535,
          totalRevenue: 16200,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 295,
              totalPrice: 1622,
              totalWholesalePrice: 368
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 190,
              totalPrice: 2660,
              totalWholesalePrice: 722
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 220,
              totalPrice: 1430,
              totalWholesalePrice: 242
            }
          ]
        },
        {
          dayNumber: 38,
          totalCustomers: 520,
          totalRevenue: 15900,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 290,
              totalPrice: 1595,
              totalWholesalePrice: 362
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 185,
              totalPrice: 2590,
              totalWholesalePrice: 703
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 215,
              totalPrice: 1397,
              totalWholesalePrice: 236
            }
          ]
        },
        {
          dayNumber: 39,
          totalCustomers: 570,
          totalRevenue: 17400,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 310,
              totalPrice: 1705,
              totalWholesalePrice: 387
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 200,
              totalPrice: 2800,
              totalWholesalePrice: 760
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 235,
              totalPrice: 1527,
              totalWholesalePrice: 258
            }
          ]
        },
        {
          dayNumber: 40,
          totalCustomers: 640,
          totalRevenue: 19800,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 340,
              totalPrice: 1870,
              totalWholesalePrice: 425
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 225,
              totalPrice: 3150,
              totalWholesalePrice: 855
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 260,
              totalPrice: 1690,
              totalWholesalePrice: 286
            }
          ]
        },
        {
          dayNumber: 41,
          totalCustomers: 685,
          totalRevenue: 21200,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 360,
              totalPrice: 1980,
              totalWholesalePrice: 450
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 240,
              totalPrice: 3360,
              totalWholesalePrice: 912
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 280,
              totalPrice: 1820,
              totalWholesalePrice: 308
            }
          ]
        },
        {
          dayNumber: 42,
          totalCustomers: 612,
          totalRevenue: 18650,
          itemSales: [
            {
              itemName: "Fresh Soda Can",
              rawItemName: "soda",
              amountSold: 320,
              totalPrice: 1760,
              totalWholesalePrice: 400
            },
            {
              itemName: "Deluxe Burger",
              rawItemName: "burger",
              amountSold: 210,
              totalPrice: 2940,
              totalWholesalePrice: 798
            },
            {
              itemName: "Crispy French Fries",
              rawItemName: "frenchfries",
              amountSold: 245,
              totalPrice: 1592,
              totalWholesalePrice: 269
            }
          ]
        }
      ],
      retailPrices: [
        { rawItemName: "soda", displayName: "Fresh Soda Can", currentPrice: 5.50, wholesalePrice: 1.25, marketReferencePrice: 4.50, optimalPrice: 6.25, maxMarketCeiling: 7.20, inStoreStock: 1420 },
        { rawItemName: "burger", displayName: "Deluxe Burger", currentPrice: 14.00, wholesalePrice: 3.80, marketReferencePrice: 12.00, optimalPrice: 16.50, maxMarketCeiling: 18.00, inStoreStock: 480 },
        { rawItemName: "frenchfries", displayName: "Crispy French Fries", currentPrice: 6.50, wholesalePrice: 1.10, marketReferencePrice: 5.00, optimalPrice: 7.20, maxMarketCeiling: 8.50, inStoreStock: 860 },
        { rawItemName: "paperbag", displayName: "Paper Bags", currentPrice: 0.00, wholesalePrice: 0.15, marketReferencePrice: 0.00, optimalPrice: 0.00, maxMarketCeiling: 0.00, inStoreStock: 2400 }
      ],
      todayItemSales: [
        { itemName: "Fresh Soda Can", amountSold: 320, totalPrice: 1760, totalWholesalePrice: 400 },
        { itemName: "Deluxe Burger", amountSold: 210, totalPrice: 2940, totalWholesalePrice: 798 },
        { itemName: "Crispy French Fries", amountSold: 245, totalPrice: 1592, totalWholesalePrice: 269 }
      ],
      scheduleWeek: [
        {
          day: "Monday",
          isOpen: true,
          openHours: 16,
          startHour: 7,
          endHour: 23,
          shiftHours: 64,
          shifts: [
            { startHour: 7, endHour: 15, employeeId: "emp_1", employeeName: "Sarah Jenkins", role: "Customer Service", skillName: "Cashier", duration: 8 },
            { startHour: 7, endHour: 15, employeeId: "emp_2", employeeName: "Michael Chang", role: "Customer Service", skillName: "Cashier", duration: 8 },
            { startHour: 15, endHour: 23, employeeId: "emp_3", employeeName: "David Vance", role: "Customer Service", skillName: "Cashier", duration: 8 },
            { startHour: 15, endHour: 23, employeeId: "emp_4", employeeName: "Elena Rostova", role: "Customer Service", skillName: "Cashier", duration: 8 },
            { startHour: 8, endHour: 16, employeeId: "emp_5", employeeName: "Carlos Gomez", role: "Cleaning Station", skillName: "Cleaning", duration: 8 },
            { startHour: 10, endHour: 18, employeeId: "emp_6", employeeName: "Marcus Kane", role: "Security Desk", skillName: "Security", duration: 8 }
          ]
        },
        {
          day: "Tuesday",
          isOpen: true,
          openHours: 16,
          startHour: 7,
          endHour: 23,
          shiftHours: 64,
          shifts: [
            { startHour: 7, endHour: 15, employeeId: "emp_1", employeeName: "Sarah Jenkins", role: "Customer Service", skillName: "Cashier", duration: 8 },
            { startHour: 7, endHour: 15, employeeId: "emp_2", employeeName: "Michael Chang", role: "Customer Service", skillName: "Cashier", duration: 8 },
            { startHour: 15, endHour: 23, employeeId: "emp_3", employeeName: "David Vance", role: "Customer Service", skillName: "Cashier", duration: 8 },
            { startHour: 15, endHour: 23, employeeId: "emp_4", employeeName: "Elena Rostova", role: "Customer Service", skillName: "Cashier", duration: 8 }
          ]
        },
        {
          day: "Wednesday",
          isOpen: true,
          openHours: 16,
          startHour: 7,
          endHour: 23,
          shiftHours: 64,
          shifts: [
            { startHour: 7, endHour: 15, employeeId: "emp_1", employeeName: "Sarah Jenkins", role: "Customer Service", skillName: "Cashier", duration: 8 },
            { startHour: 15, endHour: 23, employeeId: "emp_3", employeeName: "David Vance", role: "Customer Service", skillName: "Cashier", duration: 8 }
          ]
        },
        {
          day: "Thursday",
          isOpen: true,
          openHours: 16,
          startHour: 7,
          endHour: 23,
          shiftHours: 64,
          shifts: [
            { startHour: 7, endHour: 15, employeeId: "emp_1", employeeName: "Sarah Jenkins", role: "Customer Service", skillName: "Cashier", duration: 8 },
            { startHour: 15, endHour: 23, employeeId: "emp_3", employeeName: "David Vance", role: "Customer Service", skillName: "Cashier", duration: 8 }
          ]
        },
        {
          day: "Friday",
          isOpen: true,
          openHours: 16,
          startHour: 7,
          endHour: 23,
          shiftHours: 64,
          shifts: [
            { startHour: 7, endHour: 15, employeeId: "emp_1", employeeName: "Sarah Jenkins", role: "Customer Service", skillName: "Cashier", duration: 8 },
            { startHour: 7, endHour: 15, employeeId: "emp_2", employeeName: "Michael Chang", role: "Customer Service", skillName: "Cashier", duration: 8 },
            { startHour: 15, endHour: 23, employeeId: "emp_3", employeeName: "David Vance", role: "Customer Service", skillName: "Cashier", duration: 8 }
          ]
        },
        {
          day: "Saturday",
          isOpen: true,
          openHours: 16,
          startHour: 7,
          endHour: 23,
          shiftHours: 64,
          shifts: [
            { startHour: 7, endHour: 15, employeeId: "emp_1", employeeName: "Sarah Jenkins", role: "Customer Service", skillName: "Cashier", duration: 8 },
            { startHour: 7, endHour: 15, employeeId: "emp_2", employeeName: "Michael Chang", role: "Customer Service", skillName: "Cashier", duration: 8 },
            { startHour: 15, endHour: 23, employeeId: "emp_3", employeeName: "David Vance", role: "Customer Service", skillName: "Cashier", duration: 8 },
            { startHour: 15, endHour: 23, employeeId: "emp_4", employeeName: "Elena Rostova", role: "Customer Service", skillName: "Cashier", duration: 8 }
          ]
        },
        {
          day: "Sunday",
          isOpen: true,
          openHours: 16,
          startHour: 7,
          endHour: 23,
          shiftHours: 64,
          shifts: [
            { startHour: 7, endHour: 15, employeeId: "emp_1", employeeName: "Sarah Jenkins", role: "Customer Service", skillName: "Cashier", duration: 8 },
            { startHour: 15, endHour: 23, employeeId: "emp_3", employeeName: "David Vance", role: "Customer Service", skillName: "Cashier", duration: 8 }
          ]
        }
      ]
    },
    {
      id: "biz_garment_jewelry",
      name: "Crown & Carat Jewelers",
      type: "Jewelry Store",
      rawType: "ba:businesstype_jewelrystore",
      address: "6 7th Avenue",
      streetName: "7th Avenue",
      streetNumber: 6,
      district: "Garment District",
      dailyRevenue: 12800,
      dailyProfit: 7100,
      weeklyRevenue: 78000,
      weeklyProfit: 45200,
      weeklyRent: 5200,
      customerSatisfaction: 89,
      satisfactionBreakdown: {
        overall: 89,
        customerService: 94,
        cleanliness: 98,
        pricing: 78,
        facility: 92
      },
      customerCapacity: 30,
      isOpenNow: true,
      staffOnDuty: 2,
      openHoursPerWeek: 70,
      scheduledShiftHoursPerWeek: 140,
      cleanliness: 100,
      securityPct: 100,
      marketingCampaignsCount: 1,
      todayCustomerCount: 142,
      logo: {
        shape: "jewelry",
        base64: "",
        bgHex: "#38BDF8",
        iconHex: "#FFFFFF"
      },
      revenueHistory: [
        {
          dayNumber: 30,
          revenue: 4000,
          profit: 1253,
          salaries: 1400,
          rent: 742,
          ongoing: 605,
          expenses: 2747
        },
        {
          dayNumber: 31,
          revenue: 5000,
          profit: 1946,
          salaries: 1550,
          rent: 742,
          ongoing: 762,
          expenses: 3054
        },
        {
          dayNumber: 32,
          revenue: 5500,
          profit: 2214,
          salaries: 1700,
          rent: 742,
          ongoing: 844,
          expenses: 3286
        },
        {
          dayNumber: 33,
          revenue: 8600,
          profit: 4951,
          salaries: 1850,
          rent: 742,
          ongoing: 1057,
          expenses: 3649
        },
        {
          dayNumber: 34,
          revenue: 10300,
          profit: 6249,
          salaries: 2050,
          rent: 742,
          ongoing: 1259,
          expenses: 4051
        },
        {
          dayNumber: 35,
          revenue: 8500,
          profit: 4240,
          salaries: 2200,
          rent: 742,
          ongoing: 1318,
          expenses: 4260
        },
        {
          dayNumber: 36,
          revenue: 10500,
          profit: 5800,
          salaries: 2400,
          rent: 742,
          ongoing: 1558,
          expenses: 4700
        },
        {
          dayNumber: 37,
          revenue: 11200,
          profit: 6200,
          salaries: 2400,
          rent: 742,
          ongoing: 1858,
          expenses: 5000
        },
        {
          dayNumber: 38,
          revenue: 10800,
          profit: 6000,
          salaries: 2400,
          rent: 742,
          ongoing: 1658,
          expenses: 4800
        },
        {
          dayNumber: 39,
          revenue: 11900,
          profit: 6600,
          salaries: 2400,
          rent: 742,
          ongoing: 2158,
          expenses: 5300
        },
        {
          dayNumber: 40,
          revenue: 13400,
          profit: 7500,
          salaries: 2600,
          rent: 742,
          ongoing: 2558,
          expenses: 5900
        },
        {
          dayNumber: 41,
          revenue: 14200,
          profit: 8000,
          salaries: 2700,
          rent: 742,
          ongoing: 2858,
          expenses: 6200
        },
        {
          dayNumber: 42,
          revenue: 12800,
          profit: 7100,
          salaries: 2500,
          rent: 742,
          ongoing: 2458,
          expenses: 5700
        }
      ],
      orderHistory: [
        {
          dayNumber: 30,
          totalCustomers: 43,
          totalRevenue: 4000,
          itemSales: [
            {
              itemName: "Luxury Gold Watch",
              rawItemName: "expensivejewelry",
              amountSold: 2,
              totalPrice: 2500,
              totalWholesalePrice: 1040
            },
            {
              itemName: "Silver Pendant",
              rawItemName: "cheapjewelry",
              amountSold: 5,
              totalPrice: 900,
              totalWholesalePrice: 325
            }
          ]
        },
        {
          dayNumber: 31,
          totalCustomers: 55,
          totalRevenue: 5000,
          itemSales: [
            {
              itemName: "Luxury Gold Watch",
              rawItemName: "expensivejewelry",
              amountSold: 3,
              totalPrice: 3750,
              totalWholesalePrice: 1560
            },
            {
              itemName: "Silver Pendant",
              rawItemName: "cheapjewelry",
              amountSold: 7,
              totalPrice: 1260,
              totalWholesalePrice: 455
            }
          ]
        },
        {
          dayNumber: 32,
          totalCustomers: 61,
          totalRevenue: 5500,
          itemSales: [
            {
              itemName: "Luxury Gold Watch",
              rawItemName: "expensivejewelry",
              amountSold: 3,
              totalPrice: 3750,
              totalWholesalePrice: 1560
            },
            {
              itemName: "Silver Pendant",
              rawItemName: "cheapjewelry",
              amountSold: 8,
              totalPrice: 1440,
              totalWholesalePrice: 520
            }
          ]
        },
        {
          dayNumber: 33,
          totalCustomers: 97,
          totalRevenue: 8600,
          itemSales: [
            {
              itemName: "Luxury Gold Watch",
              rawItemName: "expensivejewelry",
              amountSold: 4,
              totalPrice: 5000,
              totalWholesalePrice: 2080
            },
            {
              itemName: "Silver Pendant",
              rawItemName: "cheapjewelry",
              amountSold: 10,
              totalPrice: 1800,
              totalWholesalePrice: 650
            }
          ]
        },
        {
          dayNumber: 34,
          totalCustomers: 116,
          totalRevenue: 10300,
          itemSales: [
            {
              itemName: "Luxury Gold Watch",
              rawItemName: "expensivejewelry",
              amountSold: 5,
              totalPrice: 6250,
              totalWholesalePrice: 2600
            },
            {
              itemName: "Silver Pendant",
              rawItemName: "cheapjewelry",
              amountSold: 12,
              totalPrice: 2160,
              totalWholesalePrice: 780
            }
          ]
        },
        {
          dayNumber: 35,
          totalCustomers: 96,
          totalRevenue: 8500,
          itemSales: [
            {
              itemName: "Luxury Gold Watch",
              rawItemName: "expensivejewelry",
              amountSold: 5,
              totalPrice: 6250,
              totalWholesalePrice: 2600
            },
            {
              itemName: "Silver Pendant",
              rawItemName: "cheapjewelry",
              amountSold: 14,
              totalPrice: 2520,
              totalWholesalePrice: 910
            }
          ]
        },
        {
          dayNumber: 36,
          totalCustomers: 120,
          totalRevenue: 10500,
          itemSales: [
            {
              itemName: "Luxury Gold Watch",
              rawItemName: "expensivejewelry",
              amountSold: 6,
              totalPrice: 7500,
              totalWholesalePrice: 3120
            },
            {
              itemName: "Silver Pendant",
              rawItemName: "cheapjewelry",
              amountSold: 16,
              totalPrice: 3000,
              totalWholesalePrice: 1040
            }
          ]
        },
        {
          dayNumber: 37,
          totalCustomers: 128,
          totalRevenue: 11200,
          itemSales: [
            {
              itemName: "Luxury Gold Watch",
              rawItemName: "expensivejewelry",
              amountSold: 7,
              totalPrice: 8750,
              totalWholesalePrice: 3640
            },
            {
              itemName: "Silver Pendant",
              rawItemName: "cheapjewelry",
              amountSold: 13,
              totalPrice: 2450,
              totalWholesalePrice: 845
            }
          ]
        },
        {
          dayNumber: 38,
          totalCustomers: 122,
          totalRevenue: 10800,
          itemSales: [
            {
              itemName: "Luxury Gold Watch",
              rawItemName: "expensivejewelry",
              amountSold: 6,
              totalPrice: 7500,
              totalWholesalePrice: 3120
            },
            {
              itemName: "Silver Pendant",
              rawItemName: "cheapjewelry",
              amountSold: 18,
              totalPrice: 3300,
              totalWholesalePrice: 1170
            }
          ]
        },
        {
          dayNumber: 39,
          totalCustomers: 135,
          totalRevenue: 11900,
          itemSales: [
            {
              itemName: "Luxury Gold Watch",
              rawItemName: "expensivejewelry",
              amountSold: 7,
              totalPrice: 8750,
              totalWholesalePrice: 3640
            },
            {
              itemName: "Silver Pendant",
              rawItemName: "cheapjewelry",
              amountSold: 17,
              totalPrice: 3150,
              totalWholesalePrice: 1105
            }
          ]
        },
        {
          dayNumber: 40,
          totalCustomers: 148,
          totalRevenue: 13400,
          itemSales: [
            {
              itemName: "Luxury Gold Watch",
              rawItemName: "expensivejewelry",
              amountSold: 8,
              totalPrice: 10000,
              totalWholesalePrice: 4160
            },
            {
              itemName: "Silver Pendant",
              rawItemName: "cheapjewelry",
              amountSold: 18,
              totalPrice: 3400,
              totalWholesalePrice: 1170
            }
          ]
        },
        {
          dayNumber: 41,
          totalCustomers: 155,
          totalRevenue: 14200,
          itemSales: [
            {
              itemName: "Luxury Gold Watch",
              rawItemName: "expensivejewelry",
              amountSold: 9,
              totalPrice: 11250,
              totalWholesalePrice: 4680
            },
            {
              itemName: "Silver Pendant",
              rawItemName: "cheapjewelry",
              amountSold: 16,
              totalPrice: 2950,
              totalWholesalePrice: 1040
            }
          ]
        },
        {
          dayNumber: 42,
          totalCustomers: 142,
          totalRevenue: 12800,
          itemSales: [
            {
              itemName: "Luxury Gold Watch",
              rawItemName: "expensivejewelry",
              amountSold: 8,
              totalPrice: 10000,
              totalWholesalePrice: 4160
            },
            {
              itemName: "Silver Pendant",
              rawItemName: "cheapjewelry",
              amountSold: 15,
              totalPrice: 2700,
              totalWholesalePrice: 975
            }
          ]
        }
      ],
      retailPrices: [
        { rawItemName: "expensivejewelry", displayName: "Luxury Gold Watch", currentPrice: 1250.00, wholesalePrice: 520.00, marketReferencePrice: 1100.00, optimalPrice: 1420.00, maxMarketCeiling: 1650.00, inStoreStock: 45 },
        { rawItemName: "cheapjewelry", displayName: "Silver Pendant", currentPrice: 180.00, wholesalePrice: 65.00, marketReferencePrice: 150.00, optimalPrice: 210.00, maxMarketCeiling: 245.00, inStoreStock: 120 }
      ],
      todayItemSales: [
        { itemName: "Luxury Gold Watch", amountSold: 8, totalPrice: 10000, totalWholesalePrice: 4160 },
        { itemName: "Silver Pendant", amountSold: 15, totalPrice: 2700, totalWholesalePrice: 975 }
      ],
      scheduleWeek: [
        {
          day: "Monday",
          isOpen: true,
          openHours: 10,
          startHour: 9,
          endHour: 19,
          shiftHours: 20,
          shifts: [
            { startHour: 9, endHour: 19, employeeId: "emp_7", employeeName: "Victoria Sterling", role: "Customer Service", skillName: "Cashier", duration: 10 },
            { startHour: 9, endHour: 19, employeeId: "emp_8", employeeName: "Jameson Blake", role: "Security Desk", skillName: "Security", duration: 10 }
          ]
        },
        {
          day: "Tuesday",
          isOpen: true,
          openHours: 10,
          startHour: 9,
          endHour: 19,
          shiftHours: 20,
          shifts: [
            { startHour: 9, endHour: 19, employeeId: "emp_7", employeeName: "Victoria Sterling", role: "Customer Service", skillName: "Cashier", duration: 10 }
          ]
        },
        {
          day: "Wednesday",
          isOpen: true,
          openHours: 10,
          startHour: 9,
          endHour: 19,
          shiftHours: 20,
          shifts: [
            { startHour: 9, endHour: 19, employeeId: "emp_7", employeeName: "Victoria Sterling", role: "Customer Service", skillName: "Cashier", duration: 10 }
          ]
        },
        {
          day: "Thursday",
          isOpen: true,
          openHours: 10,
          startHour: 9,
          endHour: 19,
          shiftHours: 20,
          shifts: [
            { startHour: 9, endHour: 19, employeeId: "emp_7", employeeName: "Victoria Sterling", role: "Customer Service", skillName: "Cashier", duration: 10 }
          ]
        },
        {
          day: "Friday",
          isOpen: true,
          openHours: 10,
          startHour: 9,
          endHour: 19,
          shiftHours: 20,
          shifts: [
            { startHour: 9, endHour: 19, employeeId: "emp_7", employeeName: "Victoria Sterling", role: "Customer Service", skillName: "Cashier", duration: 10 }
          ]
        },
        {
          day: "Saturday",
          isOpen: true,
          openHours: 10,
          startHour: 9,
          endHour: 19,
          shiftHours: 20,
          shifts: [
            { startHour: 9, endHour: 19, employeeId: "emp_7", employeeName: "Victoria Sterling", role: "Customer Service", skillName: "Cashier", duration: 10 }
          ]
        },
        {
          day: "Sunday",
          isOpen: false,
          openHours: 0,
          shiftHours: 0,
          shifts: []
        }
      ]
    },
    {
      id: "biz_hellskitchen_fastfood",
      name: "Burger Haven Kitchen",
      type: "Fast Food Restaurant",
      rawType: "ba:businesstype_fastfoodrestaurant",
      address: "22 10th Avenue",
      streetName: "10th Avenue",
      streetNumber: 22,
      district: "Hell's Kitchen",
      dailyRevenue: 4750,
      dailyProfit: 2100,
      weeklyRevenue: 37050,
      weeklyProfit: 17400,
      weeklyRent: 3400,
      customerSatisfaction: 94,
      satisfactionBreakdown: {
        overall: 94,
        customerService: 96,
        cleanliness: 92,
        pricing: 98,
        facility: 90
      },
      customerCapacity: 30,
      isOpenNow: true,
      staffOnDuty: 2,
      openHoursPerWeek: 84,
      scheduledShiftHoursPerWeek: 168,
      cleanliness: 95,
      securityPct: 75,
      marketingCampaignsCount: 1,
      todayCustomerCount: 290,
      logo: {
        shape: "fastfood",
        base64: "",
        bgHex: "#F97316",
        iconHex: "#FFFFFF"
      },
      revenueHistory: [
        {
          dayNumber: 20,
          revenue: 990,
          profit: 83,
          salaries: 300,
          rent: 485,
          ongoing: 122,
          expenses: 907
        },
        {
          dayNumber: 21,
          revenue: 930,
          profit: -23,
          salaries: 325,
          rent: 485,
          ongoing: 143,
          expenses: 953
        },
        {
          dayNumber: 22,
          revenue: 1070,
          profit: 56,
          salaries: 375,
          rent: 485,
          ongoing: 154,
          expenses: 1014
        },
        {
          dayNumber: 23,
          revenue: 1270,
          profit: 176,
          salaries: 425,
          rent: 485,
          ongoing: 184,
          expenses: 1094
        },
        {
          dayNumber: 24,
          revenue: 1540,
          profit: 356,
          salaries: 475,
          rent: 485,
          ongoing: 224,
          expenses: 1184
        },
        {
          dayNumber: 25,
          revenue: 1620,
          profit: 372,
          salaries: 525,
          rent: 485,
          ongoing: 238,
          expenses: 1248
        },
        {
          dayNumber: 26,
          revenue: 2050,
          profit: 728,
          salaries: 575,
          rent: 485,
          ongoing: 262,
          expenses: 1322
        },
        {
          dayNumber: 27,
          revenue: 2470,
          profit: 1043,
          salaries: 625,
          rent: 485,
          ongoing: 317,
          expenses: 1427
        },
        {
          dayNumber: 28,
          revenue: 2100,
          profit: 576,
          salaries: 700,
          rent: 485,
          ongoing: 339,
          expenses: 1524
        },
        {
          dayNumber: 29,
          revenue: 2360,
          profit: 775,
          salaries: 750,
          rent: 485,
          ongoing: 350,
          expenses: 1585
        },
        {
          dayNumber: 30,
          revenue: 2760,
          profit: 1065,
          salaries: 800,
          rent: 485,
          ongoing: 410,
          expenses: 1695
        },
        {
          dayNumber: 31,
          revenue: 3030,
          profit: 1219,
          salaries: 875,
          rent: 485,
          ongoing: 451,
          expenses: 1811
        },
        {
          dayNumber: 32,
          revenue: 3010,
          profit: 1151,
          salaries: 925,
          rent: 485,
          ongoing: 449,
          expenses: 1859
        },
        {
          dayNumber: 33,
          revenue: 3870,
          profit: 1882,
          salaries: 1000,
          rent: 485,
          ongoing: 503,
          expenses: 1988
        },
        {
          dayNumber: 34,
          revenue: 4370,
          profit: 2242,
          salaries: 1075,
          rent: 485,
          ongoing: 568,
          expenses: 2128
        },
        {
          dayNumber: 35,
          revenue: 3460,
          profit: 1286,
          salaries: 1125,
          rent: 485,
          ongoing: 564,
          expenses: 2174
        },
        {
          dayNumber: 36,
          revenue: 4100,
          profit: 1800,
          salaries: 1200,
          rent: 485,
          ongoing: 615,
          expenses: 2300
        },
        {
          dayNumber: 37,
          revenue: 4400,
          profit: 1950,
          salaries: 1200,
          rent: 485,
          ongoing: 765,
          expenses: 2450
        },
        {
          dayNumber: 38,
          revenue: 4200,
          profit: 1850,
          salaries: 1200,
          rent: 485,
          ongoing: 665,
          expenses: 2350
        },
        {
          dayNumber: 39,
          revenue: 4600,
          profit: 2050,
          salaries: 1200,
          rent: 485,
          ongoing: 865,
          expenses: 2550
        },
        {
          dayNumber: 40,
          revenue: 5200,
          profit: 2350,
          salaries: 1300,
          rent: 485,
          ongoing: 1065,
          expenses: 2850
        },
        {
          dayNumber: 41,
          revenue: 5600,
          profit: 2550,
          salaries: 1400,
          rent: 485,
          ongoing: 1165,
          expenses: 3050
        },
        {
          dayNumber: 42,
          revenue: 4750,
          profit: 2100,
          salaries: 1250,
          rent: 485,
          ongoing: 915,
          expenses: 2650
        }
      ],
      orderHistory: [
        {
          dayNumber: 20,
          totalCustomers: 58,
          totalRevenue: 990,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 38,
              totalPrice: 361,
              totalWholesalePrice: 106
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 43,
              totalPrice: 204,
              totalWholesalePrice: 39
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 52,
              totalPrice: 182,
              totalWholesalePrice: 21
            }
          ]
        },
        {
          dayNumber: 21,
          totalCustomers: 55,
          totalRevenue: 930,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 36,
              totalPrice: 342,
              totalWholesalePrice: 101
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 41,
              totalPrice: 195,
              totalWholesalePrice: 37
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 50,
              totalPrice: 175,
              totalWholesalePrice: 20
            }
          ]
        },
        {
          dayNumber: 22,
          totalCustomers: 63,
          totalRevenue: 1070,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 41,
              totalPrice: 390,
              totalWholesalePrice: 115
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 47,
              totalPrice: 223,
              totalWholesalePrice: 42
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 57,
              totalPrice: 200,
              totalWholesalePrice: 23
            }
          ]
        },
        {
          dayNumber: 23,
          totalCustomers: 75,
          totalRevenue: 1270,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 49,
              totalPrice: 466,
              totalWholesalePrice: 137
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 56,
              totalPrice: 266,
              totalWholesalePrice: 50
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 68,
              totalPrice: 238,
              totalWholesalePrice: 27
            }
          ]
        },
        {
          dayNumber: 24,
          totalCustomers: 91,
          totalRevenue: 1540,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 59,
              totalPrice: 561,
              totalWholesalePrice: 165
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 67,
              totalPrice: 318,
              totalWholesalePrice: 60
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 82,
              totalPrice: 287,
              totalWholesalePrice: 33
            }
          ]
        },
        {
          dayNumber: 25,
          totalCustomers: 96,
          totalRevenue: 1620,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 62,
              totalPrice: 589,
              totalWholesalePrice: 174
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 71,
              totalPrice: 337,
              totalWholesalePrice: 64
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 86,
              totalPrice: 301,
              totalWholesalePrice: 34
            }
          ]
        },
        {
          dayNumber: 26,
          totalCustomers: 122,
          totalRevenue: 2050,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 79,
              totalPrice: 751,
              totalWholesalePrice: 221
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 90,
              totalPrice: 428,
              totalWholesalePrice: 81
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 110,
              totalPrice: 385,
              totalWholesalePrice: 44
            }
          ]
        },
        {
          dayNumber: 27,
          totalCustomers: 147,
          totalRevenue: 2470,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 96,
              totalPrice: 912,
              totalWholesalePrice: 269
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 109,
              totalPrice: 518,
              totalWholesalePrice: 98
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 132,
              totalPrice: 462,
              totalWholesalePrice: 53
            }
          ]
        },
        {
          dayNumber: 28,
          totalCustomers: 125,
          totalRevenue: 2100,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 81,
              totalPrice: 770,
              totalWholesalePrice: 227
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 93,
              totalPrice: 442,
              totalWholesalePrice: 84
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 113,
              totalPrice: 396,
              totalWholesalePrice: 45
            }
          ]
        },
        {
          dayNumber: 29,
          totalCustomers: 140,
          totalRevenue: 2360,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 91,
              totalPrice: 865,
              totalWholesalePrice: 255
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 104,
              totalPrice: 494,
              totalWholesalePrice: 94
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 126,
              totalPrice: 441,
              totalWholesalePrice: 50
            }
          ]
        },
        {
          dayNumber: 30,
          totalCustomers: 164,
          totalRevenue: 2760,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 107,
              totalPrice: 1017,
              totalWholesalePrice: 300
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 121,
              totalPrice: 575,
              totalWholesalePrice: 109
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 148,
              totalPrice: 518,
              totalWholesalePrice: 59
            }
          ]
        },
        {
          dayNumber: 31,
          totalCustomers: 181,
          totalRevenue: 3030,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 118,
              totalPrice: 1121,
              totalWholesalePrice: 330
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 134,
              totalPrice: 637,
              totalWholesalePrice: 121
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 163,
              totalPrice: 571,
              totalWholesalePrice: 65
            }
          ]
        },
        {
          dayNumber: 32,
          totalCustomers: 180,
          totalRevenue: 3010,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 117,
              totalPrice: 1112,
              totalWholesalePrice: 328
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 133,
              totalPrice: 632,
              totalWholesalePrice: 120
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 162,
              totalPrice: 567,
              totalWholesalePrice: 65
            }
          ]
        },
        {
          dayNumber: 33,
          totalCustomers: 231,
          totalRevenue: 3870,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 150,
              totalPrice: 1425,
              totalWholesalePrice: 420
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 171,
              totalPrice: 812,
              totalWholesalePrice: 154
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 208,
              totalPrice: 728,
              totalWholesalePrice: 83
            }
          ]
        },
        {
          dayNumber: 34,
          totalCustomers: 261,
          totalRevenue: 4370,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 170,
              totalPrice: 1615,
              totalWholesalePrice: 476
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 193,
              totalPrice: 917,
              totalWholesalePrice: 174
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 235,
              totalPrice: 823,
              totalWholesalePrice: 94
            }
          ]
        },
        {
          dayNumber: 35,
          totalCustomers: 207,
          totalRevenue: 3460,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 135,
              totalPrice: 1283,
              totalWholesalePrice: 378
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 153,
              totalPrice: 727,
              totalWholesalePrice: 138
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 186,
              totalPrice: 651,
              totalWholesalePrice: 74
            }
          ]
        },
        {
          dayNumber: 36,
          totalCustomers: 245,
          totalRevenue: 4100,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 160,
              totalPrice: 1520,
              totalWholesalePrice: 448
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 180,
              totalPrice: 855,
              totalWholesalePrice: 162
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 220,
              totalPrice: 770,
              totalWholesalePrice: 88
            }
          ]
        },
        {
          dayNumber: 37,
          totalCustomers: 260,
          totalRevenue: 4400,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 170,
              totalPrice: 1615,
              totalWholesalePrice: 476
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 195,
              totalPrice: 926,
              totalWholesalePrice: 175
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 235,
              totalPrice: 822,
              totalWholesalePrice: 94
            }
          ]
        },
        {
          dayNumber: 38,
          totalCustomers: 250,
          totalRevenue: 4200,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 165,
              totalPrice: 1567,
              totalWholesalePrice: 462
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 185,
              totalPrice: 878,
              totalWholesalePrice: 166
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 225,
              totalPrice: 787,
              totalWholesalePrice: 90
            }
          ]
        },
        {
          dayNumber: 39,
          totalCustomers: 275,
          totalRevenue: 4600,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 180,
              totalPrice: 1710,
              totalWholesalePrice: 504
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 205,
              totalPrice: 973,
              totalWholesalePrice: 184
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 250,
              totalPrice: 875,
              totalWholesalePrice: 100
            }
          ]
        },
        {
          dayNumber: 40,
          totalCustomers: 310,
          totalRevenue: 5200,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 200,
              totalPrice: 1900,
              totalWholesalePrice: 560
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 230,
              totalPrice: 1092,
              totalWholesalePrice: 207
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 280,
              totalPrice: 980,
              totalWholesalePrice: 112
            }
          ]
        },
        {
          dayNumber: 41,
          totalCustomers: 335,
          totalRevenue: 5600,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 220,
              totalPrice: 2090,
              totalWholesalePrice: 616
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 250,
              totalPrice: 1187,
              totalWholesalePrice: 225
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 300,
              totalPrice: 1050,
              totalWholesalePrice: 120
            }
          ]
        },
        {
          dayNumber: 42,
          totalCustomers: 290,
          totalRevenue: 4750,
          itemSales: [
            {
              itemName: "Classic Cheeseburger",
              rawItemName: "burger",
              amountSold: 190,
              totalPrice: 1805,
              totalWholesalePrice: 532
            },
            {
              itemName: "Seasoned Fries",
              rawItemName: "frenchfries",
              amountSold: 215,
              totalPrice: 1021,
              totalWholesalePrice: 193
            },
            {
              itemName: "Fountain Soda",
              rawItemName: "soda",
              amountSold: 260,
              totalPrice: 910,
              totalWholesalePrice: 104
            }
          ]
        }
      ],
      retailPrices: [
        { rawItemName: "burger", displayName: "Classic Cheeseburger", currentPrice: 9.50, wholesalePrice: 2.80, marketReferencePrice: 8.50, optimalPrice: 11.25, maxMarketCeiling: 13.00, inStoreStock: 350 },
        { rawItemName: "frenchfries", displayName: "Seasoned Fries", currentPrice: 4.75, wholesalePrice: 0.90, marketReferencePrice: 4.00, optimalPrice: 5.50, maxMarketCeiling: 6.50, inStoreStock: 500 },
        { rawItemName: "soda", displayName: "Fountain Soda", currentPrice: 3.50, wholesalePrice: 0.40, marketReferencePrice: 3.00, optimalPrice: 4.25, maxMarketCeiling: 5.00, inStoreStock: 800 }
      ],
      todayItemSales: [
        { itemName: "Classic Cheeseburger", amountSold: 185, totalPrice: 1757, totalWholesalePrice: 518 },
        { itemName: "Seasoned Fries", amountSold: 210, totalPrice: 997, totalWholesalePrice: 189 },
        { itemName: "Fountain Soda", amountSold: 260, totalPrice: 910, totalWholesalePrice: 104 }
      ],
      scheduleWeek: [
        {
          day: "Monday",
          isOpen: true,
          openHours: 12,
          startHour: 11,
          endHour: 23,
          shiftHours: 24,
          shifts: [
            { startHour: 11, endHour: 23, employeeId: "emp_9", employeeName: "Toby Maguire", role: "Customer Service", skillName: "Cashier", duration: 12 }
          ]
        },
        {
          day: "Tuesday",
          isOpen: true,
          openHours: 12,
          startHour: 11,
          endHour: 23,
          shiftHours: 24,
          shifts: [
            { startHour: 11, endHour: 23, employeeId: "emp_9", employeeName: "Toby Maguire", role: "Customer Service", skillName: "Cashier", duration: 12 }
          ]
        },
        {
          day: "Wednesday",
          isOpen: true,
          openHours: 12,
          startHour: 11,
          endHour: 23,
          shiftHours: 16,
          shifts: [
            { startHour: 15, endHour: 23, employeeId: "emp_9", employeeName: "Toby Maguire", role: "Customer Service", skillName: "Cashier", duration: 8 }
          ]
        },
        {
          day: "Thursday",
          isOpen: true,
          openHours: 12,
          startHour: 11,
          endHour: 23,
          shiftHours: 16,
          shifts: [
            { startHour: 15, endHour: 23, employeeId: "emp_9", employeeName: "Toby Maguire", role: "Customer Service", skillName: "Cashier", duration: 8 }
          ]
        },
        {
          day: "Friday",
          isOpen: true,
          openHours: 12,
          startHour: 11,
          endHour: 23,
          shiftHours: 24,
          shifts: [
            { startHour: 11, endHour: 23, employeeId: "emp_9", employeeName: "Toby Maguire", role: "Customer Service", skillName: "Cashier", duration: 12 },
            { startHour: 17, endHour: 23, employeeId: "emp_10", employeeName: "Lucas Vance", role: "Customer Service", skillName: "Cashier", duration: 6 }
          ]
        },
        {
          day: "Saturday",
          isOpen: true,
          openHours: 12,
          startHour: 11,
          endHour: 23,
          shiftHours: 24,
          shifts: [
            { startHour: 11, endHour: 23, employeeId: "emp_9", employeeName: "Toby Maguire", role: "Customer Service", skillName: "Cashier", duration: 12 },
            { startHour: 17, endHour: 23, employeeId: "emp_10", employeeName: "Lucas Vance", role: "Customer Service", skillName: "Cashier", duration: 6 }
          ]
        },
        {
          day: "Sunday",
          isOpen: true,
          openHours: 12,
          startHour: 11,
          endHour: 23,
          shiftHours: 24,
          shifts: [
            { startHour: 11, endHour: 23, employeeId: "emp_9", employeeName: "Toby Maguire", role: "Customer Service", skillName: "Cashier", duration: 12 }
          ]
        }
      ]
    }
  ],

  residences: [
    {
      id: "res_midtown_loft",
      address: "12 44th Street",
      streetName: "44th Street",
      streetNumber: 12,
      type: "Luxury Penthouse",
      rentPerDay: 500,
      rentPerWeek: 3500,
      status: "Rented"
    }
  ],

  ownedRealEstate: [
    {
      id: "bld_hellskitchen_commercial",
      address: "4 10th Avenue",
      streetName: "10th Avenue",
      streetNumber: 4,
      district: "Hell's Kitchen",
      totalSqm: 850,
      occupancyPct: 100,
      purchasePrice: 1250000,
      dailyRevenue: 1200,
      dailyTaxes: 180,
      weeklyRevenue: 8400,
      weeklyTaxes: 1260,
      weeklyNet: 7140
    }
  ],

  warehouses: [
    {
      id: "wh_hellskitchen_main",
      address: "2 11th Avenue",
      type: "Medium Warehouse (450m²)",
      rentPerDay: 850,
      rentPerWeek: 5950,
      assignedVehicles: 3,
      stock: [
        { itemName: "Fresh Soda Can", rawItemName: "soda", quantity: 8400, weeklyConsumption: 9500, weeklyDeliveries: 10000, daysLeft: 6.2 },
        { itemName: "Deluxe Burger", rawItemName: "burger", quantity: 720, weeklyConsumption: 3800, weeklyDeliveries: 1200, daysLeft: 1.3 },
        { itemName: "Paper Bags", rawItemName: "paperbag", quantity: 18000, weeklyConsumption: 14800, weeklyDeliveries: 15000, daysLeft: 8.5 },
        { itemName: "French Fries", rawItemName: "frenchfries", quantity: 1100, weeklyConsumption: 4200, weeklyDeliveries: 2000, daysLeft: 1.8 },
        { itemName: "Luxury Gold Watch", rawItemName: "expensivejewelry", quantity: 120, weeklyConsumption: 60, weeklyDeliveries: 70, daysLeft: 14.0 }
      ]
    },
    {
      id: "wh_industry_city_hub",
      address: "18 Maritime Way",
      type: "Large Industrial Hub (1,000m²)",
      rentPerDay: 1400,
      rentPerWeek: 9800,
      assignedVehicles: 4,
      stock: [
        { itemName: "Smartphone Pro", rawItemName: "smartphone", quantity: 450, weeklyConsumption: 280, weeklyDeliveries: 300, daysLeft: 11.2 },
        { itemName: "Designer Handbag", rawItemName: "expensiveclothing", quantity: 85, weeklyConsumption: 140, weeklyDeliveries: 50, daysLeft: 2.1 },
        { itemName: "Fine Red Wine", rawItemName: "expensivewine", quantity: 340, weeklyConsumption: 190, weeklyDeliveries: 200, daysLeft: 12.5 },
        { itemName: "Fresh Croissant", rawItemName: "croissant", quantity: 320, weeklyConsumption: 1800, weeklyDeliveries: 600, daysLeft: 1.2 }
      ]
    }
  ],

  employees: [
    { id: "emp_1", name: "Sarah Jenkins", wage: 24, weeklyWages: 960, satisfaction: 92, primarySkillName: "Cashier", skillLevel: 100, workingLocation: "Ambition Mart Midtown", weeklyHours: 40, hrManager: "Elena Rostova", healthInsurance: "Gold Health Insurance", demands: [{ name: "Gold Health Insurance", rawName: "ba:demand_gold_insurance" }] },
    { id: "emp_2", name: "Michael Chang", wage: 22, weeklyWages: 880, satisfaction: 88, primarySkillName: "Cashier", skillLevel: 95, workingLocation: "Ambition Mart Midtown", weeklyHours: 40, hrManager: "Elena Rostova", healthInsurance: "Gold Health Insurance", demands: [{ name: "Max 40h/week", rawName: "ba:demand_max_hours_40" }] },
    { id: "emp_3", name: "David Vance", wage: 20, weeklyWages: 800, satisfaction: 85, primarySkillName: "Cashier", skillLevel: 85, workingLocation: "Ambition Mart Midtown", weeklyHours: 40, hrManager: "Elena Rostova", healthInsurance: "Silver Health Insurance", demands: [{ name: "Silver Health Insurance", rawName: "ba:demand_silver_insurance" }] },
    { id: "emp_4", name: "Elena Rostova", wage: 34, weeklyWages: 1360, satisfaction: 95, primarySkillName: "Human Resources", skillLevel: 100, workingLocation: "Ambition HQ Suite", weeklyHours: 40, hrManager: "Unassigned", healthInsurance: "None", demands: [{ name: "Executive Desk", rawName: "ba:demand_executive_desk" }] },
    { id: "emp_5", name: "Carlos Gomez", wage: 18, weeklyWages: 720, satisfaction: 95, primarySkillName: "Cleaning", skillLevel: 100, workingLocation: "Ambition Mart Midtown", weeklyHours: 40, hrManager: "Elena Rostova", healthInsurance: "Silver Health Insurance", demands: [] },
    { id: "emp_6", name: "Marcus Kane", wage: 26, weeklyWages: 1040, satisfaction: 94, primarySkillName: "Security", skillLevel: 100, workingLocation: "Ambition Mart Midtown", weeklyHours: 40, hrManager: "Elena Rostova", healthInsurance: "Gold Health Insurance", demands: [{ name: "Gold Health Insurance", rawName: "ba:demand_gold_insurance" }] },
    { id: "emp_7", name: "Victoria Sterling", wage: 32, weeklyWages: 1600, satisfaction: 96, primarySkillName: "Cashier", skillLevel: 100, workingLocation: "Crown & Carat Jewelers", weeklyHours: 50, hrManager: "Elena Rostova", healthInsurance: "Gold Health Insurance", demands: [{ name: "Gold Health Insurance", rawName: "ba:demand_gold_insurance" }, { name: "Higher Wage", rawName: "ba:demand_wage_increase" }] },
    { id: "emp_8", name: "Jameson Blake", wage: 28, weeklyWages: 1400, satisfaction: 91, primarySkillName: "Security", skillLevel: 100, workingLocation: "Crown & Carat Jewelers", weeklyHours: 50, hrManager: "Elena Rostova", healthInsurance: "Gold Health Insurance", demands: [{ name: "Gold Health Insurance", rawName: "ba:demand_gold_insurance" }] },
    { id: "emp_9", name: "Toby Maguire", wage: 19, weeklyWages: 950, satisfaction: 80, primarySkillName: "Cashier", skillLevel: 82, workingLocation: "Burger Haven Kitchen", weeklyHours: 50, hrManager: "Elena Rostova", healthInsurance: "Bronze Health Insurance", demands: [{ name: "Bronze Health Insurance", rawName: "ba:demand_bronze_insurance" }, { name: "Max 40h/week", rawName: "ba:demand_max_hours_40" }] },
    { id: "emp_10", name: "Lucas Vance", wage: 17, weeklyWages: 340, satisfaction: 82, primarySkillName: "Cashier", skillLevel: 75, workingLocation: "Burger Haven Kitchen", weeklyHours: 20, hrManager: "Unassigned", healthInsurance: "None", demands: [{ name: "Flexible Schedule", rawName: "ba:demand_flexible_schedule" }] },
    { id: "emp_11", name: "Dmitri Volkov", wage: 25, weeklyWages: 1000, satisfaction: 94, primarySkillName: "Delivery Driver", skillLevel: 100, workingLocation: "2 11th Avenue", weeklyHours: 40, hrManager: "Elena Rostova", healthInsurance: "Silver Health Insurance", demands: [{ name: "Silver Health Insurance", rawName: "ba:demand_silver_insurance" }] },
    { id: "emp_12", name: "Andre Rossi", wage: 27, weeklyWages: 1080, satisfaction: 90, primarySkillName: "Delivery Driver", skillLevel: 100, workingLocation: "18 Maritime Way", weeklyHours: 40, hrManager: "Elena Rostova", healthInsurance: "Silver Health Insurance", demands: [{ name: "Silver Health Insurance", rawName: "ba:demand_silver_insurance" }] },
    { id: "emp_13", name: "Rachel Adams", wage: 29, weeklyWages: 1160, satisfaction: 95, primarySkillName: "Purchasing Agent", skillLevel: 100, workingLocation: "18 Maritime Way", weeklyHours: 40, hrManager: "Elena Rostova", healthInsurance: "Gold Health Insurance", demands: [{ name: "Gold Health Insurance", rawName: "ba:demand_gold_insurance" }, { name: "Max 40h/week", rawName: "ba:demand_max_hours_40" }] }
  ],

  loans: [
    { totalAmount: 150000, remainingAmount: 120000, dailyPayment: 1450, weeklyPayment: 10150, dailyInterest: 65 }
  ],

  operationalAlerts: [
    {
      id: "alert_rush_fastfood",
      type: "unstaffed" as const,
      severity: "critical" as const,
      location: "Burger Haven Kitchen",
      message: "Unstaffed peak rush on Wednesday & Thursday (12:00-14:00). Estimated lost revenue: $1,400/wk."
    },
    {
      id: "alert_underpriced_jewelry",
      type: "satisfaction" as const,
      severity: "warning" as const,
      location: "Crown & Carat Jewelers",
      message: "Luxury Gold Watch is priced at $1,250.00: optimal satisfaction price is $1,420.00 (+$1,360/wk potential profit)."
    },
    {
      id: "alert_wh_stock_soda",
      type: "lowstock" as const,
      severity: "warning" as const,
      location: "2 11th Avenue Warehouse",
      message: "Soda Can stock reaches reorder threshold in 2.1 days."
    }
  ]
};

