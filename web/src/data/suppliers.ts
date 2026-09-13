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
    district: "Hell's Kitchen",
    address: '18 1st Street',
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
    district: 'Garment District',
    address: '37 1st Street',
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
    address: '4 6th Avenue',
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
    district: 'Lower Manhattan',
    address: '13 12th Street',
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
    district: 'Midtown',
    address: '1 6th Street',
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
    address: '4 25th Street',
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
    district: 'Garment District',
    address: '1 Pier',
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
    district: 'Garment District',
    address: '2 Pier',
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
    district: 'Murray Hill',
    address: '3 Pier',
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
    district: 'Murray Hill',
    address: '4 Pier',
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
    district: 'Lower Manhattan',
    address: '7 Pier',
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
    district: 'Lower Manhattan',
    address: '8 Pier',
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
    district: 'Lower Manhattan',
    address: '6 Pier',
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
    district: 'Lower Manhattan',
    address: '9 Pier',
    description: 'Global agricultural commodities importer handling raw seeds (apple, banana, carrot), cigar papers, and popcorn kernels.',
    deliveryMethod: 'Ocean Port Delivery to Warehouse',
    requiresPurchasingAgent: true,
    minOrderRequirement: 'Max 25,000 units/order',
    categories: ['Crop Seeds', 'Cigar & Cigarette Papers', 'Popcorn Kernels', 'Raw Commodities']
  },

  // 4 Retail Equipment & Store Fixture Stores
  {
    id: 'square-appliances',
    name: 'Square Appliances',
    type: 'Retail Equipment Vendor',
    district: "Hell's Kitchen",
    address: '16 4th Avenue',
    description: 'Commercial cooking appliances, bakery display showcases, wine racks, cash counters, and refrigerated display coolers.',
    deliveryMethod: 'Direct Store Purchase',
    requiresPurchasingAgent: false,
    categories: ['Cooking Grills & Ovens', 'Display Coolers', 'Bakery Showcases', 'Wine Shelves']
  },
  {
    id: 'aj-pederson-sons',
    name: 'AJ Pederson & Son',
    type: 'Retail Equipment Vendor',
    district: 'Garment District',
    address: '13 5th Avenue',
    description: 'Cash registers, conveyor checkout counters, security cameras, lockers, and business computers.',
    deliveryMethod: 'Direct Store Purchase',
    requiresPurchasingAgent: false,
    categories: ['Cash Registers', 'Checkout Counters', 'Computers & Tech', 'Security Cameras']
  },
  {
    id: 'ikea-city-furniture',
    name: 'IKA BOHAG',
    type: 'Retail Equipment Vendor',
    district: 'Garment District',
    address: '50 4th Street',
    description: 'Tables, chairs, storage cabinets, modular sinks, bathroom stalls, and customer seating.',
    deliveryMethod: 'Direct Store Purchase',
    requiresPurchasingAgent: false,
    categories: ['Office Desks', 'Chairs & Seating', 'Restroom Stalls', 'Tables']
  },
  {
    id: 'city-office-supplies',
    name: "Mr. Scott's Office Supplies",
    type: 'Retail Equipment Vendor',
    district: 'Lower Manhattan',
    address: '39 4th Avenue',
    description: 'Office accessories, loudspeakers, trash bins, graphic tablets, and ergonomic chairs.',
    deliveryMethod: 'Direct Store Purchase',
    requiresPurchasingAgent: false,
    categories: ['Loudspeakers & Audio', 'Trash Bins', 'Graphic Tablets', 'Accessories']
  }
];
