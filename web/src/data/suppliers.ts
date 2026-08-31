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
    { id: "emp_1", name: "Sarah Jenkins", wage: 24, weeklyWages: 960, satisfaction: 92, primarySkillName: "Cashier", skillLevel: 100, workingLocation: "Ambition Mart Midtown", weeklyHours: 40 },
    { id: "emp_2", name: "Michael Chang", wage: 22, weeklyWages: 880, satisfaction: 88, primarySkillName: "Cashier", skillLevel: 95, workingLocation: "Ambition Mart Midtown", weeklyHours: 40 },
    { id: "emp_3", name: "David Vance", wage: 20, weeklyWages: 800, satisfaction: 85, primarySkillName: "Cashier", skillLevel: 85, workingLocation: "Ambition Mart Midtown", weeklyHours: 40 },
    { id: "emp_4", name: "Elena Rostova", wage: 21, weeklyWages: 840, satisfaction: 90, primarySkillName: "Cashier", skillLevel: 90, workingLocation: "Ambition Mart Midtown", weeklyHours: 40 },
    { id: "emp_5", name: "Carlos Gomez", wage: 18, weeklyWages: 720, satisfaction: 95, primarySkillName: "Cleaning", skillLevel: 100, workingLocation: "Ambition Mart Midtown", weeklyHours: 40 },
    { id: "emp_6", name: "Marcus Kane", wage: 26, weeklyWages: 1040, satisfaction: 94, primarySkillName: "Security", skillLevel: 100, workingLocation: "Ambition Mart Midtown", weeklyHours: 40 },
    { id: "emp_7", name: "Victoria Sterling", wage: 32, weeklyWages: 1600, satisfaction: 96, primarySkillName: "Cashier", skillLevel: 100, workingLocation: "Crown & Carat Jewelers", weeklyHours: 50 },
    { id: "emp_8", name: "Jameson Blake", wage: 28, weeklyWages: 1400, satisfaction: 91, primarySkillName: "Security", skillLevel: 100, workingLocation: "Crown & Carat Jewelers", weeklyHours: 50 },
    { id: "emp_9", name: "Toby Maguire", wage: 19, weeklyWages: 950, satisfaction: 80, primarySkillName: "Cashier", skillLevel: 82, workingLocation: "Burger Haven Kitchen", weeklyHours: 50 },
    { id: "emp_10", name: "Lucas Vance", wage: 17, weeklyWages: 340, satisfaction: 82, primarySkillName: "Cashier", skillLevel: 75, workingLocation: "Burger Haven Kitchen", weeklyHours: 20 },
    { id: "emp_11", name: "Dmitri Volkov", wage: 25, weeklyWages: 1000, satisfaction: 94, primarySkillName: "Delivery Driver", skillLevel: 100, workingLocation: "2 11th Avenue", weeklyHours: 40 },
    { id: "emp_12", name: "Andre Rossi", wage: 27, weeklyWages: 1080, satisfaction: 90, primarySkillName: "Delivery Driver", skillLevel: 100, workingLocation: "18 Maritime Way", weeklyHours: 40 },
    { id: "emp_13", name: "Rachel Adams", wage: 29, weeklyWages: 1160, satisfaction: 95, primarySkillName: "Purchasing Agent", skillLevel: 100, workingLocation: "18 Maritime Way", weeklyHours: 40 }
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
      message: "Luxury Gold Watch is priced at $1,250.00 — optimal satisfaction price is $1,420.00 (+$1,360/wk potential profit)."
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

