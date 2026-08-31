'use client';

import { useState, useMemo, useEffect, Suspense, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutGrid, 
  Store, 
  Briefcase, 
  Users, 
  Package, 
  DollarSign, 
  Sparkles, 
  Receipt, 
  ShoppingCart, 
  MapPin, 
  Check, 
  ShieldCheck, 
  AlertTriangle,
  Sliders,
  CheckCircle2,
  HelpCircle,
  ShoppingBag,
  Info,
  X,
  Printer,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Truck,
  Minus,
  Plus,
  Coffee,
  Share2,
  Copy
} from 'lucide-react';

import rawBusinesses from '@/data/businesses.json';
import rawItems from '@/data/items.json';
import gameIconsRaw from '@/data/game_item_icons.json';

const gameIcons: Record<string, string> = gameIconsRaw;

// Robust Alias Table for In-Game Equipment & Fixture Icons
const FIXTURE_ICON_ALIASES: Record<string, string> = {
  tobaccoshelf: 'tobaccoshelf1',
  wineshelf: 'metalshelf',
  singlebookshelf: 'largebookshelf',
  clothingrack: 'clothingrack',
  bakeryshowcase: 'bakeryshowcase',
  productdisplaytable: 'productdisplaytable',
  productdisplaystandtiered: 'angledwoodendisplaystand',
  jewelryfloorshowcase: 'illuminatedshowcase01',
  productpanel: 'signstaffonly',
  roundedshelf: 'modernshelfhorizontal',
  concessionsdisplaycase: 'bakeryshowcase',
  slushimachine: 'automatedfryingmachine',
  hairdressershelf: 'modernshelfhorizontal',
  securitysign: 'signstaffonly',
  securitypanel: 'securitycamera',
  securitycameraroof: 'securitycamera',
  flatwoodendisplaystand: 'flatwoodendisplaystand',
  woodenproductcrate: 'flatwoodendisplaystand',
  standingdigitalscale: 'standingdigitalscale',
  loudspeaker4: 'loudspeaker4',
  trashbin: 'trashbin',
  toiletstall: 'toiletstall',
  sinkmodular: 'sinkmodular',
  table1: 'table1',
  regularchair: 'regularchair',
  officedesk1: 'officedesk1',
  officedesk2left: 'officedesk2left',
  multipurposechair: 'armchairluxury',
  officechair: 'officechair',
  officechair2: 'officechair2',
  largemeetingtable: 'roundtable',
  standardfridge: 'standardfridge',
  watercooler: 'watercooler',
  cheapcoffeemachine: 'cheapcoffeemachine',
  printer: 'printer'
};

// Helper to retrieve official item/fixture thumbnail
function getFixtureImage(nameOrId: string, directId?: string): string | null {
  if (!nameOrId && !directId) return null;
  const idKey = (directId || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const nameKey = (nameOrId || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // 1. Check direct icon match by idKey
  if (idKey && gameIcons[idKey]) return gameIcons[idKey];
  // 2. Check alias by idKey
  if (idKey && FIXTURE_ICON_ALIASES[idKey] && gameIcons[FIXTURE_ICON_ALIASES[idKey]]) {
    return gameIcons[FIXTURE_ICON_ALIASES[idKey]];
  }

  // 3. Check direct icon match by nameKey
  if (gameIcons[nameKey]) return gameIcons[nameKey];
  // 4. Check alias by nameKey
  if (FIXTURE_ICON_ALIASES[nameKey] && gameIcons[FIXTURE_ICON_ALIASES[nameKey]]) {
    return gameIcons[FIXTURE_ICON_ALIASES[nameKey]];
  }

  // 5. Substring search in game icons
  const target = idKey || nameKey;
  for (const [k, v] of Object.entries(gameIcons)) {
    if (k.includes(target) || target.includes(k)) {
      return v;
    }
  }

  return null;
}

// In-game equipment database with exact prices and cargo sizes
interface EquipmentDefinition {
  id: string;
  name: string;
  store: 'Square Appliances' | 'AJ Pederson & Sons' | 'City Office Supplies' | 'IKEA / City Furniture';
  district: string;
  price: number;
  cargo: number;
}

const EQUIPMENT_DB: Record<string, EquipmentDefinition> = {
  // Appliances & Cooking (Square Appliances & Displays)
  industrialgrill: { id: 'industrialgrill', name: 'Industrial Grill', store: 'Square Appliances', district: "Hell's Kitchen", price: 2800, cargo: 2 },
  industrialfryermachine: { id: 'industrialfryermachine', name: 'Industrial Fryer Machine', store: 'Square Appliances', district: "Hell's Kitchen", price: 4400, cargo: 1 },
  hotdoggrill: { id: 'hotdoggrill', name: 'Hotdog Grill', store: 'Square Appliances', district: "Hell's Kitchen", price: 2200, cargo: 1 },
  pizzaoven: { id: 'pizzaoven', name: 'Pizza Oven', store: 'Square Appliances', district: "Hell's Kitchen", price: 10756, cargo: 1 },
  saladbar: { id: 'saladbar', name: 'Salad Bar', store: 'Square Appliances', district: "Hell's Kitchen", price: 4000, cargo: 1 },
  icecreamcounter: { id: 'icecreamcounter', name: 'Ice Cream Counter', store: 'Square Appliances', district: "Hell's Kitchen", price: 1800, cargo: 1 },
  drinksfridge: { id: 'drinksfridge', name: 'Drinks Fridge', store: 'Square Appliances', district: "Hell's Kitchen", price: 875, cargo: 1 },
  flatwoodendisplaystand: { id: 'flatwoodendisplaystand', name: 'Display Stand (Wooden)', store: 'Square Appliances', district: "Hell's Kitchen", price: 400, cargo: 1 },
  woodenproductcrate: { id: 'woodenproductcrate', name: 'Wooden Product Crate', store: 'Square Appliances', district: "Hell's Kitchen", price: 150, cargo: 1 },
  standingdigitalscale: { id: 'standingdigitalscale', name: 'Standing Digital Scale', store: 'Square Appliances', district: "Hell's Kitchen", price: 250, cargo: 1 },
  storageshelf: { id: 'storageshelf', name: 'Storage Shelf', store: 'Square Appliances', district: "Hell's Kitchen", price: 1200, cargo: 1 },

  // Cash Register, Checkouts, Lockers, Security & Operations (AJ Pederson & Sons)
  cashregister: { id: 'cashregister', name: 'Cash Register', store: 'AJ Pederson & Sons', district: 'Garment District', price: 900, cargo: 1 },
  checkoutcounterleft: { id: 'checkoutcounterleft', name: 'Checkout Counter (Left)', store: 'AJ Pederson & Sons', district: 'Garment District', price: 2300, cargo: 1 },
  stackofshoppingbaskets: { id: 'stackofshoppingbaskets', name: 'Stack Of Shopping Baskets', store: 'AJ Pederson & Sons', district: 'Garment District', price: 200, cargo: 1 },
  counter1: { id: 'counter1', name: 'Cabinet with Drawers', store: 'AJ Pederson & Sons', district: 'Garment District', price: 470, cargo: 1 },
  cleaningstation: { id: 'cleaningstation', name: 'Cleaning Station', store: 'AJ Pederson & Sons', district: 'Garment District', price: 100, cargo: 1 },
  uniformlocker: { id: 'uniformlocker', name: 'Uniform Locker', store: 'AJ Pederson & Sons', district: 'Garment District', price: 1950, cargo: 1 },
  securityguardlocker: { id: 'securityguardlocker', name: 'Security Guard Locker', store: 'AJ Pederson & Sons', district: 'Garment District', price: 2000, cargo: 1 },
  securitysign: { id: 'securitysign', name: 'Security Sign', store: 'AJ Pederson & Sons', district: 'Garment District', price: 25, cargo: 1 },
  securitypanel: { id: 'securitypanel', name: 'Security Panel', store: 'AJ Pederson & Sons', district: 'Garment District', price: 1200, cargo: 1 },
  securitycameraroof: { id: 'securitycameraroof', name: 'Security Camera (Dome)', store: 'AJ Pederson & Sons', district: 'Garment District', price: 2700, cargo: 1 },

  // Satisfaction & Furniture (City Office Supplies & IKEA / Furniture)
  loudspeaker4: { id: 'loudspeaker4', name: 'JayBeeel Loudspeaker (Small)', store: 'City Office Supplies', district: 'Midtown', price: 80, cargo: 1 },
  trashbin: { id: 'trashbin', name: 'Trash Bin', store: 'City Office Supplies', district: 'Midtown', price: 30, cargo: 1 },
  toiletstall: { id: 'toiletstall', name: 'Bathroom Stall', store: 'IKEA / City Furniture', district: "Hell's Kitchen", price: 2100, cargo: 1 },
  sinkmodular: { id: 'sinkmodular', name: 'Modular Sink', store: 'IKEA / City Furniture', district: "Hell's Kitchen", price: 850, cargo: 1 },
  table1: { id: 'table1', name: 'Standard Table', store: 'IKEA / City Furniture', district: "Hell's Kitchen", price: 300, cargo: 1 },
  regularchair: { id: 'regularchair', name: 'Regular Chair', store: 'IKEA / City Furniture', district: "Hell's Kitchen", price: 100, cargo: 1 },

  // Retail Displays
  wineshelf: { id: 'wineshelf', name: 'Wooden Wine Shelf Display', store: 'Square Appliances', district: "Hell's Kitchen", price: 600, cargo: 1 },
  tobaccoshelf: { id: 'tobaccoshelf', name: 'Secured Tobacco Showcase Shelf', store: 'Square Appliances', district: "Hell's Kitchen", price: 500, cargo: 1 },
  clothingrack: { id: 'clothingrack', name: 'Clothing Garment Rack', store: 'Square Appliances', district: "Hell's Kitchen", price: 350, cargo: 1 },
  singlebookshelf: { id: 'singlebookshelf', name: 'Wooden Bookshelf Stand', store: 'Square Appliances', district: "Hell's Kitchen", price: 400, cargo: 1 },
  bakeryshowcase: { id: 'bakeryshowcase', name: 'Glass Bakery Showcase Display', store: 'Square Appliances', district: "Hell's Kitchen", price: 650, cargo: 1 },
  industrialcoffeemachine: { id: 'industrialcoffeemachine', name: 'Industrial Espresso Machine', store: 'Square Appliances', district: "Hell's Kitchen", price: 2800, cargo: 1 },
  productdisplaytable: { id: 'productdisplaytable', name: 'Display Table (Product)', store: 'Square Appliances', district: "Hell's Kitchen", price: 3250, cargo: 1 },
  productdisplaystandtiered: { id: 'productdisplaystandtiered', name: 'Tiered Fresh Flower Stand', store: 'Square Appliances', district: "Hell's Kitchen", price: 400, cargo: 1 },
  jewelryfloorshowcase: { id: 'jewelryfloorshowcase', name: 'Illuminated Jewelry Floor Showcase', store: 'Square Appliances', district: "Hell's Kitchen", price: 1200, cargo: 1 },
  productpanel: { id: 'productpanel', name: 'Product Display Wall Panel', store: 'Square Appliances', district: "Hell's Kitchen", price: 350, cargo: 1 },
  roundedshelf: { id: 'roundedshelf', name: 'Rounded Deluxe Gift Shelf', store: 'Square Appliances', district: "Hell's Kitchen", price: 550, cargo: 1 },
  concessionsdisplaycase: { id: 'concessionsdisplaycase', name: 'Concessions Glass Display Case', store: 'Square Appliances', district: "Hell's Kitchen", price: 800, cargo: 1 },
  slushimachine: { id: 'slushimachine', name: 'Commercial Slushie Machine', store: 'Square Appliances', district: "Hell's Kitchen", price: 1100, cargo: 1 },
  hairdressershelf: { id: 'hairdressershelf', name: 'Hair Stylist Product Wall Shelf', store: 'Square Appliances', district: "Hell's Kitchen", price: 350, cargo: 1 },

  // Office Desks & Tables
  officedesk1: { id: 'officedesk1', name: 'Standard Office Desk', store: 'City Office Supplies', district: 'Midtown', price: 800, cargo: 1 },
  officedesk2left: { id: 'officedesk2left', name: 'Executive Office Desk', store: 'City Office Supplies', district: 'Midtown', price: 2200, cargo: 1 },
  
  // Office Chairs
  multipurposechair: { id: 'multipurposechair', name: 'Multipurpose Chair', store: 'IKEA / City Furniture', district: "Hell's Kitchen", price: 1200, cargo: 1 },
  officechair: { id: 'officechair', name: 'Ergonomic Office Chair', store: 'City Office Supplies', district: 'Midtown', price: 1000, cargo: 1 },
  officechair2: { id: 'officechair2', name: 'Stump Mesh Office Chair', store: 'City Office Supplies', district: 'Midtown', price: 2200, cargo: 1 },

  // Computers
  computer: { id: 'computer', name: 'Standard Computer', store: 'AJ Pederson & Sons', district: 'Garment District', price: 900, cargo: 1 },
  desktopcomputer: { id: 'desktopcomputer', name: 'ZanaMan Desktop PC', store: 'AJ Pederson & Sons', district: 'Garment District', price: 1250, cargo: 1 },
  laptop: { id: 'laptop', name: 'Business Laptop', store: 'AJ Pederson & Sons', district: 'Garment District', price: 1400, cargo: 1 },
  gamingcomputer: { id: 'gamingcomputer', name: 'High-End Workstation PC', store: 'AJ Pederson & Sons', district: 'Garment District', price: 1500, cargo: 1 },

  // Employee Accessories
  graphictablet: { id: 'graphictablet', name: 'Graphic Tablet', store: 'AJ Pederson & Sons', district: 'Garment District', price: 400, cargo: 1 },
  graphictabletwithscreen: { id: 'graphictabletwithscreen', name: 'Graphic Tablet (with Screen)', store: 'AJ Pederson & Sons', district: 'Garment District', price: 1200, cargo: 1 },
  computermonitor: { id: 'computermonitor', name: 'Secondary Computer Monitor', store: 'AJ Pederson & Sons', district: 'Garment District', price: 175, cargo: 1 },
  mousepad: { id: 'mousepad', name: 'Ergonomic Mouse Pad', store: 'City Office Supplies', district: 'Midtown', price: 90, cargo: 1 },
  calculator: { id: 'calculator', name: 'Desktop Calculator', store: 'City Office Supplies', district: 'Midtown', price: 10, cargo: 1 },
  deskcalendar: { id: 'deskcalendar', name: 'Desk Calendar', store: 'City Office Supplies', district: 'Midtown', price: 25, cargo: 1 },
  deskglobe: { id: 'deskglobe', name: 'Decorative Desk Globe', store: 'City Office Supplies', district: 'Midtown', price: 60, cargo: 1 },

  // Office Breakroom & Demands
  largemeetingtable: { id: 'largemeetingtable', name: 'Large Conference Meeting Table', store: 'City Office Supplies', district: 'Midtown', price: 1200, cargo: 2 },
  standardfridge: { id: 'standardfridge', name: 'Breakroom Standard Fridge', store: 'Square Appliances', district: "Hell's Kitchen", price: 1800, cargo: 1 },
  watercooler: { id: 'watercooler', name: 'Water Cooler Dispenser', store: 'AJ Pederson & Sons', district: 'Garment District', price: 130, cargo: 1 },
  cheapcoffeemachine: { id: 'cheapcoffeemachine', name: 'Office Coffee Machine', store: 'AJ Pederson & Sons', district: 'Garment District', price: 400, cargo: 1 },
  printer: { id: 'printer', name: 'Network Laser Multifunction Printer', store: 'City Office Supplies', district: 'Midtown', price: 3250, cargo: 1 }
};

// Item ID to required Display Furniture mapping
const PRODUCT_TO_EQUIPMENT_MAP: Record<string, { equipmentId: string }> = {
  burger: { equipmentId: 'industrialgrill' },
  frenchfries: { equipmentId: 'industrialfryermachine' },
  hotdog: { equipmentId: 'hotdoggrill' },
  pizza: { equipmentId: 'pizzaoven' },
  salad: { equipmentId: 'saladbar' },
  chickenkabobskewer: { equipmentId: 'industrialgrill' },
  kabob: { equipmentId: 'industrialgrill' },
  icecream: { equipmentId: 'icecreamcounter' },
  freshfood: { equipmentId: 'saladbar' },
  frozenfood: { equipmentId: 'icecreamcounter' },
  sodacan: { equipmentId: 'drinksfridge' },
  energydrink: { equipmentId: 'drinksfridge' },
  apple: { equipmentId: 'woodenproductcrate' },
  banana: { equipmentId: 'woodenproductcrate' },
  carrot: { equipmentId: 'woodenproductcrate' },
  lettuce: { equipmentId: 'woodenproductcrate' },
  pear: { equipmentId: 'woodenproductcrate' },
  tomato: { equipmentId: 'woodenproductcrate' },
  croissant: { equipmentId: 'bakeryshowcase' },
  cupcake: { equipmentId: 'bakeryshowcase' },
  donut: { equipmentId: 'bakeryshowcase' },
  cupofcoffee: { equipmentId: 'industrialcoffeemachine' },
  cupoftea: { equipmentId: 'industrialcoffeemachine' },
  bottleofwine: { equipmentId: 'wineshelf' },
  beer: { equipmentId: 'drinksfridge' },
  whisky: { equipmentId: 'wineshelf' },
  margarita: { equipmentId: 'drinksfridge' },
  martini: { equipmentId: 'drinksfridge' },
  cigar: { equipmentId: 'tobaccoshelf' },
  cigarette: { equipmentId: 'tobaccoshelf' },
  classiccheapfemaleclothing: { equipmentId: 'clothingrack' },
  classiccheapmaleclothing: { equipmentId: 'clothingrack' },
  classicexpensivefemaleclothing: { equipmentId: 'clothingrack' },
  classicexpensivemaleclothing: { equipmentId: 'clothingrack' },
  moderncheapfemaleclothing: { equipmentId: 'clothingrack' },
  moderncheapmaleclothing: { equipmentId: 'clothingrack' },
  modernexpensivefemaleclothing: { equipmentId: 'clothingrack' },
  modernexpensivemaleclothing: { equipmentId: 'clothingrack' },
  cheapflower: { equipmentId: 'productdisplaystandtiered' },
  expensiveflower: { equipmentId: 'productdisplaystandtiered' },
  expensiveflowers: { equipmentId: 'productdisplaystandtiered' },
  cheapgift: { equipmentId: 'productpanel' },
  expensivegift: { equipmentId: 'roundedshelf' },
  cheapjewelry: { equipmentId: 'jewelryfloorshowcase' },
  expensivejewelry: { equipmentId: 'jewelryfloorshowcase' },
  smartphone1: { equipmentId: 'productdisplaytable' },
  smartphone2: { equipmentId: 'productdisplaytable' },
  smartwatch1: { equipmentId: 'jewelryfloorshowcase' },
  smartwatch2: { equipmentId: 'jewelryfloorshowcase' },
  earbuds01: { equipmentId: 'productdisplaytable' },
  headphones01: { equipmentId: 'productdisplaytable' },
  novel: { equipmentId: 'singlebookshelf' },
  youngnovel: { equipmentId: 'singlebookshelf' },
  motivationalbook: { equipmentId: 'singlebookshelf' },
  technicalmanual: { equipmentId: 'singlebookshelf' },
  picturebook: { equipmentId: 'singlebookshelf' },
  limitededitionbook: { equipmentId: 'singlebookshelf' },
  umbrella: { equipmentId: 'productpanel' },
  popcorn: { equipmentId: 'concessionsdisplaycase' },
  cottoncandy: { equipmentId: 'concessionsdisplaycase' },
  slushi: { equipmentId: 'slushimachine' },
  cheeseplatter: { equipmentId: 'concessionsdisplaycase' },
  haircareproduct: { equipmentId: 'hairdressershelf' }
};

// Blacklist of non-player businesses
const EXCLUDED_BUSINESS_IDS = new Set([
  'bank', 'clinic', 'hospital', 'irs', 'school', 'truckgarage', 'cardealership',
  'movingservice', 'privatedriverservice', 'wholesalestore', 'furniturestore',
  'appliancestore', 'empty', 'headquarters', 'factory', 'casino', 'gasstation',
  'importexport', 'interiorinstallationfirm', 'marketingagency', 'officesupplystore',
  'recruitmentagency', 'warehouse'
]);

function BuilderContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'fastfoodrestaurant';

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deskDropdownOpen, setDeskDropdownOpen] = useState(false);
  const [chairDropdownOpen, setChairDropdownOpen] = useState(false);
  const [computerDropdownOpen, setComputerDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Checked/scratched off items in the shopping receipt (interactive checklist)
  const [scratchedItems, setScratchedItems] = useState<Record<string, boolean>>({});

  // Close custom dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Playable businesses
  const playableBusinesses = useMemo(() => {
    return rawBusinesses.filter(b => !EXCLUDED_BUSINESS_IDS.has(b.id));
  }, []);

  const [selectedBusinessId, setSelectedBusinessId] = useState(initialType);
  const selectedBusiness = useMemo(() => {
    return playableBusinesses.find(b => b.id === selectedBusinessId) || playableBusinesses[0];
  }, [playableBusinesses, selectedBusinessId]);

  const isOffice = selectedBusiness.suitable_building_type === 'office';

  // Customer Capacity Selection (15, 30, 40, 75 for standard retail)
  const availableCapacities = useMemo(() => {
    if (selectedBusiness.id === 'cinema' || selectedBusiness.id === 'theater') {
      return [100, 125, 150, 175, 200];
    }
    if (isOffice) {
      return [4, 8, 10, 50];
    }
    return [15, 30, 40, 75];
  }, [selectedBusiness, isOffice]);

  const initialCapacityParam = parseInt(searchParams.get('capacity') || searchParams.get('cap') || '0', 10);

  const [capacity, setCapacity] = useState<number>(() => {
    if (initialCapacityParam > 0) return initialCapacityParam;
    return 15;
  });

  useEffect(() => {
    if (initialCapacityParam > 0 && availableCapacities.includes(initialCapacityParam)) {
      setCapacity(initialCapacityParam);
    } else if (!availableCapacities.includes(capacity)) {
      setCapacity(availableCapacities[0]);
    }
  }, [availableCapacities, initialCapacityParam]);

  // General Settings Inputs
  const [cleaningStationQty, setCleaningStationQty] = useState(1);
  const [storageShelvesQty, setStorageShelvesQty] = useState(3);
  const [uniformLockerQty, setUniformLockerQty] = useState(1);
  const [customerSatisfaction, setCustomerSatisfaction] = useState(true);
  const [goodSecurity, setGoodSecurity] = useState(true);

  // Office Specific Customizations State
  const [selectedDeskId, setSelectedDeskId] = useState<'officedesk1' | 'table1' | 'officedesk2left'>('officedesk1');
  const [selectedChairId, setSelectedChairId] = useState<'regularchair' | 'multipurposechair' | 'officechair' | 'officechair2'>('officechair');
  const [selectedComputerId, setSelectedComputerId] = useState<'computer' | 'desktopcomputer' | 'laptop' | 'gamingcomputer'>('computer');
  
  // Office Accessories (per employee/workstation)
  const [officeAccessories, setOfficeAccessories] = useState<Record<string, boolean>>({
    computermonitor: true,
    mousepad: true,
    calculator: false,
    deskcalendar: false,
    deskglobe: false,
    graphictablet: false,
    graphictabletwithscreen: false
  });

  // Office Breakroom & Demands (per office)
  const [officeAmenities, setOfficeAmenities] = useState<Record<string, boolean>>({
    largemeetingtable: true,
    standardfridge: true,
    watercooler: true,
    cheapcoffeemachine: true
  });

  const toggleOfficeAccessory = (id: string) => {
    setOfficeAccessories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleOfficeAmenity = (id: string) => {
    setOfficeAmenities(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Goods Selection state
  const [selectedProducts, setSelectedProducts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const map: Record<string, boolean> = {};
    if (selectedBusiness.products && selectedBusiness.products.length > 0) {
      selectedBusiness.products.forEach((p: any) => {
        map[p.id] = true;
      });
    }
    setSelectedProducts(map);
  }, [selectedBusiness]);

  const toggleProduct = (id: string) => {
    setSelectedProducts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleScratchedItem = (itemKey: string) => {
    setScratchedItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey]
    }));
  };

  // Build the complete, exact item receipt list matching BiggerAmbitions scaling formulas 1:1 across 15, 30, 40, 75
  const calculatedItems = useMemo(() => {
    const itemsMap: Record<string, { equipment: EquipmentDefinition; qty: number }> = {};

    const addItem = (equipmentId: string, count: number) => {
      if (count <= 0) return;
      const equip = EQUIPMENT_DB[equipmentId];
      if (!equip) return;
      if (!itemsMap[equipmentId]) {
        itemsMap[equipmentId] = { equipment: equip, qty: 0 };
      }
      itemsMap[equipmentId].qty += count;
    };

    if (!isOffice) {
      // 1. Goods & Display Equipment
      const checkedProductIds = Object.keys(selectedProducts).filter(k => selectedProducts[k]);
      let hasProduce = false;

      const equipmentCounts: Record<string, number> = {};

      checkedProductIds.forEach(pId => {
        const cleanId = pId.toLowerCase().replace(/[^a-z0-9]/g, '');
        const mapEntry = PRODUCT_TO_EQUIPMENT_MAP[cleanId];
        const equipId = mapEntry ? mapEntry.equipmentId : 'flatwoodendisplaystand';
        equipmentCounts[equipId] = (equipmentCounts[equipId] || 0) + 1;

        if (['apple', 'banana', 'carrot', 'lettuce', 'pear', 'tomato'].includes(cleanId)) {
          hasProduce = true;
        }
      });

      // Scale each equipment item according to customer capacity
      Object.entries(equipmentCounts).forEach(([equipId, count]) => {
        if (equipId === 'woodenproductcrate') {
          const qty = capacity <= 15 ? 2 : capacity <= 30 ? 4 : capacity <= 40 ? 6 : 10;
          addItem('woodenproductcrate', qty);
        } else if (equipId === 'industrialgrill') {
          const qty = capacity <= 15 ? 2 : capacity <= 40 ? 4 : 8;
          addItem('industrialgrill', qty);
        } else if (['industrialfryermachine', 'hotdoggrill', 'icecreamcounter'].includes(equipId)) {
          const qty = capacity <= 30 ? 1 : capacity <= 40 ? 2 : 3;
          addItem(equipId, qty);
        } else if (['pizzaoven', 'saladbar', 'drinksfridge'].includes(equipId)) {
          const qty = capacity <= 15 ? 1 : capacity <= 40 ? 2 : 4;
          addItem(equipId, qty);
        } else if (equipId === 'productdisplaytable') {
          // 6 electronic items * multiplier: 15->2 (12 tables), 30->3 (18 tables), 40->4 (24 tables), 75->8 (48 tables)
          const multiplier = capacity <= 15 ? 2 : capacity <= 30 ? 3 : capacity <= 40 ? 4 : 8;
          addItem('productdisplaytable', count * multiplier);
        } else {
          const qty = capacity <= 15 ? 1 : capacity <= 40 ? 2 : 3;
          addItem(equipId, count * qty);
        }
      });

      // Special display stand & digital scale for produce
      if (hasProduce) {
        const produceStands = capacity <= 15 ? 1 : capacity <= 30 ? 2 : capacity <= 40 ? 3 : 5;
        addItem('flatwoodendisplaystand', produceStands);
        addItem('standingdigitalscale', produceStands);
      }

      // 2. Point of Sale: Cash Registers vs Checkout Counters & Shopping Baskets
      const isSelfService = selectedBusiness.customer_type === 'SelfService';

      if (isSelfService) {
        // Self-service stores (Electronics, Grocery, Clothing, Bookstore, Liquor, Florist)
        // Shopping Baskets: 15->1, 30->1, 40->2, 75->3
        const basketsQty = capacity <= 30 ? 1 : capacity <= 40 ? 2 : 3;
        addItem('stackofshoppingbaskets', basketsQty);

        // Checkouts:
        // 15 cap -> 1 Cash Register + 1 Drawer Cabinet
        // 30 cap -> 1 Checkout Counter Left (no extra cabinet)
        // 40 cap -> 1 Checkout Counter Left + 1 Cash Register + 1 Drawer Cabinet
        // 75 cap -> 3 Checkout Counter Left
        if (capacity <= 15) {
          addItem('cashregister', 1);
          addItem('counter1', 1);
        } else if (capacity <= 30) {
          addItem('checkoutcounterleft', 1);
        } else if (capacity <= 40) {
          addItem('checkoutcounterleft', 1);
          addItem('cashregister', 1);
          addItem('counter1', 1);
        } else {
          addItem('checkoutcounterleft', 3);
        }
      } else {
        // Full-service stores (Fast food, Coffee, Restaurant)
        const registerQty = capacity <= 15 ? 1 : capacity <= 40 ? 2 : 4;
        addItem('cashregister', registerQty);
        const drawerCabinets = capacity <= 15 ? 5 : capacity <= 30 ? 9 : capacity <= 40 ? 11 : 20;
        addItem('counter1', drawerCabinets);
      }

      // 3. General Operations
      addItem('cleaningstation', cleaningStationQty);
      addItem('storageshelf', storageShelvesQty);
      addItem('uniformlocker', uniformLockerQty);

      // 4. Customer Satisfaction Morale Furniture
      if (customerSatisfaction) {
        addItem('loudspeaker4', 1);
        addItem('trashbin', 1);
        addItem('toiletstall', 1);
        addItem('sinkmodular', 1);

        if (selectedBusiness.id.includes('food') || selectedBusiness.id.includes('coffee') || selectedBusiness.id.includes('restaurant')) {
          const tableCount = capacity <= 15 ? 1 : capacity <= 40 ? 2 : 4;
          addItem('table1', tableCount);
          addItem('regularchair', tableCount * 4);
        }
      }

      // 5. Security & Loss Prevention Equipment (when Good Security is ON)
      if (goodSecurity) {
        // In Big Ambitions, stores selling high-value goods (like electronics, jewelry, expensive clothing) require loss prevention equipment
        const requiresFullSecurity = selectedBusiness.employee_primary_skills?.includes('securityguard') || selectedBusiness.id === 'electronicsstore' || selectedBusiness.id === 'jewelrystore';

        if (requiresFullSecurity) {
          // Security Guard Lockers: 2
          addItem('securityguardlocker', 2);
          // Security Sign: 1
          addItem('securitysign', 1);
          // Security Panels: 15->2, 30->2, 40->2, 75->4
          const panelQty = capacity <= 40 ? 2 : 4;
          addItem('securitypanel', panelQty);
          // Dome Cameras: 15->2, 30->3, 40->4, 75->6
          const cameraQty = capacity <= 15 ? 2 : capacity <= 30 ? 3 : capacity <= 40 ? 4 : 6;
          addItem('securitycameraroof', cameraQty);
        }
      }
    } else {
      // OFFICE PLAN
      // 1. Workstation Core Hardware (Desks, Chairs, PCs)
      addItem(selectedDeskId, capacity);
      addItem(selectedChairId, capacity);
      addItem(selectedComputerId, capacity);

      // 2. Network Printers (1 per ~10 workstations)
      addItem('printer', Math.max(1, Math.ceil(capacity / 10)));

      // 3. Employee Equipment & Desk Accessories
      Object.entries(officeAccessories).forEach(([accId, enabled]) => {
        if (enabled) {
          addItem(accId, capacity);
        }
      });

      // 4. General Operations
      addItem('cleaningstation', cleaningStationQty);
      addItem('uniformlocker', uniformLockerQty);

      // 5. Breakroom & Amenities Demands
      Object.entries(officeAmenities).forEach(([amenityId, enabled]) => {
        if (enabled) {
          addItem(amenityId, 1);
        }
      });

      // 6. Bathroom Sanitation & Morale
      if (customerSatisfaction) {
        addItem('toiletstall', Math.max(1, Math.ceil(capacity / 20)));
        addItem('sinkmodular', Math.max(1, Math.ceil(capacity / 20)));
        addItem('trashbin', 1);
        addItem('loudspeaker4', 1);
      }
    }

    return Object.values(itemsMap);
  }, [
    isOffice,
    selectedBusiness,
    capacity,
    selectedProducts,
    selectedDeskId,
    selectedChairId,
    selectedComputerId,
    officeAccessories,
    officeAmenities,
    cleaningStationQty,
    storageShelvesQty,
    uniformLockerQty,
    customerSatisfaction,
    goodSecurity
  ]);

  // Total Summary KPIs
  const totalPrice = useMemo(() => {
    return calculatedItems.reduce((sum, it) => sum + (it.equipment.price * it.qty), 0);
  }, [calculatedItems]);

  const totalCargo = useMemo(() => {
    return calculatedItems.reduce((sum, it) => sum + (it.equipment.cargo * it.qty), 0);
  }, [calculatedItems]);

  const totalUnits = useMemo(() => {
    return calculatedItems.reduce((sum, it) => sum + it.qty, 0);
  }, [calculatedItems]);
  // Remaining capital and cargo left to transport as items are scratched
  const { remainingPrice, remainingCargo } = useMemo(() => {
    let price = 0;
    let cargo = 0;
    calculatedItems.forEach(it => {
      const isScratched = scratchedItems[`${it.equipment.store === 'Square Appliances' ? 'Square Appliances & Displays' : it.equipment.store === 'AJ Pederson & Sons' ? 'AJ Pederson & Sons (Appliances & Registers)' : it.equipment.store}_${it.equipment.id}`];
      if (!isScratched) {
        price += it.equipment.price * it.qty;
        cargo += it.equipment.cargo * it.qty;
      }
    });
    return { remainingPrice: price, remainingCargo: cargo };
  }, [calculatedItems, scratchedItems]);

  // Recommended Full-Time Staff Calculation (accouting for CS, Security Guards, Cleaners)
  const staffingRecommended = useMemo(() => {
    const isSelfService = selectedBusiness.customer_type === 'SelfService';
    const hasSecurity = goodSecurity && (selectedBusiness.employee_primary_skills?.includes('securityguard') || selectedBusiness.id === 'electronicsstore' || selectedBusiness.id === 'jewelrystore');

    if (isSelfService) {
      const cs = capacity <= 30 ? 2 : capacity <= 40 ? 4 : 6;
      const security = hasSecurity ? 4 : 0;
      const cleaning = 2;
      return { cs, security, cleaning };
    } else {
      const cs = capacity <= 15 ? 3 : capacity <= 40 ? 6 : 11;
      const security = hasSecurity ? 4 : 0;
      const cleaning = 3;
      return { cs, security, cleaning };
    }
  }, [capacity, selectedBusiness, goodSecurity]);

  // Grouped by NYC Supplier Store for Grocery Receipt
  const shoppingReceiptGrouped = useMemo(() => {
    const stores: Record<string, { storeName: string; district: string; items: Array<{ id: string; name: string; qty: number; unitPrice: number; total: number; cargo: number }> }> = {
      'Square Appliances': { storeName: 'Square Appliances & Displays', district: "Hell's Kitchen", items: [] },
      'AJ Pederson & Sons': { storeName: 'AJ Pederson & Sons (Appliances & Registers)', district: 'Garment District', items: [] },
      'IKEA / City Furniture': { storeName: 'IKEA / City Furniture', district: "Hell's Kitchen", items: [] },
      'City Office Supplies': { storeName: 'City Office Supplies', district: 'Midtown', items: [] },
    };

    calculatedItems.forEach(it => {
      const targetStore = stores[it.equipment.store] || stores['Square Appliances'];
      targetStore.items.push({
        id: it.equipment.id,
        name: it.equipment.name,
        qty: it.qty,
        unitPrice: it.equipment.price,
        total: it.equipment.price * it.qty,
        cargo: it.equipment.cargo * it.qty
      });
    });

    return Object.values(stores).filter(s => s.items.length > 0);
  }, [calculatedItems]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-violet-500" />
            <span>Setup Builder</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Calculate equipment, furniture fixtures, cargo size, and supplier shopping receipts.
          </p>
        </div>

        {/* Big Action Button: View Shopping Receipt Popup */}
        <button
          onClick={() => setShowReceiptModal(true)}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2.5 self-start sm:self-auto shrink-0 group cursor-pointer"
        >
          <Receipt className="w-4 h-4 text-emerald-200 group-hover:scale-110 transition-transform" />
          <span>Shopping Receipt ({shoppingReceiptGrouped.length} Stores • ${totalPrice.toLocaleString()})</span>
        </button>
      </div>

      {/* Main Responsive Grid Layout (Two columns on desktop, clean spacing) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Business & Capacity Selection + Live KPIs */}
        <div className="lg:col-span-5 space-y-6">
          {/* Business & Capacity Card */}
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-[var(--text-main)] pb-2 border-b border-[var(--border-subtle)] flex items-center gap-2">
              <Store className="w-4 h-4 text-violet-500" />
              <span>Target Business &amp; Size</span>
            </h2>

            {/* Custom Modern Dropdown Menu */}
            <div className="space-y-1.5 relative" ref={dropdownRef}>
              <label className="text-xs font-semibold text-[var(--text-main)]">Business Type</label>
              
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] hover:border-violet-500 rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-main)] font-semibold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>{selectedBusiness.name} ({selectedBusiness.suitable_building_type === 'office' ? 'Office' : 'Retail'})</span>
                <ChevronDown className={`w-4 h-4 text-[var(--text-subtle)] transition-transform ${dropdownOpen ? 'rotate-180 text-violet-500' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-2xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                  {playableBusinesses.map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        setSelectedBusinessId(b.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        b.id === selectedBusiness.id
                          ? 'bg-violet-500 text-white font-bold'
                          : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                      }`}
                    >
                      <span>{b.name}</span>
                      <span className={`text-[10px] uppercase font-mono ${b.id === selectedBusiness.id ? 'text-white/80' : 'text-[var(--text-subtle)]'}`}>
                        {b.suitable_building_type === 'office' ? 'Office' : 'Retail'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Discrete Customer Capacity Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-main)] flex items-center justify-between">
                <span>Customer Capacity</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                  {capacity} {isOffice ? 'Workstations / Clients' : 'Max Capacity'}
                </span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {availableCapacities.map(cap => {
                  const isSelected = capacity === cap;
                  return (
                    <button
                      key={cap}
                      onClick={() => setCapacity(cap)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-violet-500/10 border-violet-500 text-violet-700 dark:bg-[var(--primary-bg)] dark:border-[var(--primary)] dark:text-[var(--primary)] font-extrabold shadow-xs'
                          : 'bg-[var(--bg-base)] border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      <div className="text-xs font-bold">{cap} Customers</div>
                      <div className="text-[10px] text-[var(--text-subtle)] mt-0.5">
                        {isOffice ? `${cap} Desks & PCs` : `${cap <= 15 ? '1' : cap <= 40 ? '2' : '4'} Registers Req.`}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Instant Real-Time Live Status Dashboard */}
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider text-[var(--text-subtle)]">
              Instant Setup Summary
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
                <span className="text-[10px] text-[var(--text-subtle)] uppercase font-semibold">Total Setup Cost</span>
                <div className="text-lg font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                  ${totalPrice.toLocaleString()}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
                <span className="text-[10px] text-[var(--text-subtle)] uppercase font-semibold">Cargo Load Required</span>
                <div className="text-lg font-extrabold font-mono text-sky-500 mt-0.5 flex items-center gap-1.5">
                  <Truck className="w-4 h-4" />
                  <span>{totalCargo} Units</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
                <span className="text-[10px] text-[var(--text-subtle)] uppercase font-semibold">Total Equipment Units</span>
                <div className="text-base font-bold font-mono text-[var(--text-main)] mt-0.5">
                  {totalUnits} Items
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
                <span className="text-[10px] text-[var(--text-subtle)] uppercase font-semibold">Staffing Needed</span>
                <div className="text-xs font-bold font-mono text-indigo-500 mt-0.5">
                  {staffingRecommended.cs} CS {staffingRecommended.security > 0 ? `/ ${staffingRecommended.security} Guards ` : ''}/ {staffingRecommended.cleaning} Cleaners
                </div>
              </div>
            </div>

            {/* Quick Button to Pop open the Receipt */}
            <button
              onClick={() => setShowReceiptModal(true)}
              className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>Open Grocery-Style Shopping Receipt</span>
            </button>
          </div>
        </div>

        {/* Right Column: Instant Live Inputs */}
        <div id="builder-equipment-pane" className="lg:col-span-7 space-y-6">
          {/* General Operations & Satisfaction Toggle */}
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-[var(--text-main)] pb-2 border-b border-[var(--border-subtle)] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-violet-500" />
              <span>Operational Equipment &amp; Upgrades</span>
            </h2>

            {/* 100% Satisfaction Toggle */}
            <button
              type="button"
              onClick={() => setCustomerSatisfaction(!customerSatisfaction)}
              className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                customerSatisfaction
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-[var(--text-main)] shadow-xs dark:bg-[var(--emerald-bg)] dark:border-[var(--emerald-border)]'
                  : 'bg-[var(--bg-base)] border-[var(--border-base)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
              }`}
            >
              <div>
                <div className="text-xs font-bold flex items-center gap-2">
                  <span>100% Customer Satisfaction Morale</span>
                  {customerSatisfaction && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-emerald-600/20 text-emerald-700 dark:text-[var(--emerald-accent)] border border-emerald-500/30">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[var(--text-subtle)] mt-0.5">
                  Includes Loudspeakers, Trash Bins, Modular Sinks, Bathroom Stalls &amp; Seating
                </div>
              </div>
            </button>

            {/* Security Toggle */}
            {!isOffice && (
              <button
                type="button"
                onClick={() => setGoodSecurity(!goodSecurity)}
                className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  goodSecurity
                    ? 'bg-sky-500/10 border-sky-500/40 text-[var(--text-main)] shadow-xs dark:bg-[var(--indigo-bg)] dark:border-[var(--indigo-border)]'
                    : 'bg-[var(--bg-base)] border-[var(--border-base)] text-[var(--text-muted)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div>
                  <div className="text-xs font-bold flex items-center gap-2">
                    <span>100% Loss Prevention Pack</span>
                    {goodSecurity && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-sky-600/20 text-sky-700 dark:text-[var(--indigo-accent)] border border-sky-500/30">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--text-subtle)] mt-0.5">
                    Prevents shoplifting losses across all rush hours
                  </div>
                </div>
              </button>
            )}

            {/* Clean, Simple Numeric Inputs without Price Clutter */}
            {!isOffice && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* Cleaning Station Stepper */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Cleaning Station</label>
                  <div className="flex items-center rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] p-1">
                    <button
                      type="button"
                      onClick={() => setCleaningStationQty(Math.max(0, cleaningStationQty - 1))}
                      className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] text-[var(--text-main)] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      aria-label="Decrease Cleaning Station"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={cleaningStationQty}
                      onChange={(e) => setCleaningStationQty(Math.max(0, Math.min(5, Number(e.target.value) || 0)))}
                      className="w-full bg-transparent text-center text-xs font-mono font-bold text-[var(--text-main)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setCleaningStationQty(Math.min(5, cleaningStationQty + 1))}
                      className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] text-[var(--text-main)] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      aria-label="Increase Cleaning Station"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Storage Shelves Stepper */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Storage Shelves</label>
                  <div className="flex items-center rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] p-1">
                    <button
                      type="button"
                      onClick={() => setStorageShelvesQty(Math.max(0, storageShelvesQty - 1))}
                      className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] text-[var(--text-main)] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      aria-label="Decrease Storage Shelves"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={storageShelvesQty}
                      onChange={(e) => setStorageShelvesQty(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
                      className="w-full bg-transparent text-center text-xs font-mono font-bold text-[var(--text-main)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setStorageShelvesQty(Math.min(20, storageShelvesQty + 1))}
                      className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] text-[var(--text-main)] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      aria-label="Increase Storage Shelves"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Uniform Locker Stepper */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-muted)]">Uniform Locker</label>
                  <div className="flex items-center rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] p-1">
                    <button
                      type="button"
                      onClick={() => setUniformLockerQty(Math.max(0, uniformLockerQty - 1))}
                      className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] text-[var(--text-main)] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      aria-label="Decrease Uniform Locker"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={uniformLockerQty}
                      onChange={(e) => setUniformLockerQty(Math.max(0, Math.min(5, Number(e.target.value) || 0)))}
                      className="w-full bg-transparent text-center text-xs font-mono font-bold text-[var(--text-main)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setUniformLockerQty(Math.min(5, uniformLockerQty + 1))}
                      className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] text-[var(--text-main)] flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      aria-label="Increase Uniform Locker"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Goods & Services Checklist (For Retail Stores) */}
          {!isOffice ? (
            <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <div>
                  <h2 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-500" />
                    <span>Goods &amp; Services to Stock</span>
                  </h2>
                </div>

                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() => {
                      const map: Record<string, boolean> = {};
                      if (selectedBusiness.products) {
                        selectedBusiness.products.forEach((p: any) => map[p.id] = true);
                      }
                      setSelectedProducts(map);
                    }}
                    className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Select All
                  </button>
                  <span>•</span>
                  <button
                    onClick={() => setSelectedProducts({})}
                    className="font-semibold text-rose-500 hover:underline cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Goods Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                {(selectedBusiness.products && selectedBusiness.products.length > 0 ? selectedBusiness.products : rawItems.slice(0, 20)).map((p: any) => {
                  const isChecked = !!selectedProducts[p.id];
                  const cleanId = p.id.toLowerCase().replace(/[^a-z0-9]/g, '');
                  const mapped = PRODUCT_TO_EQUIPMENT_MAP[cleanId];
                  const equipDef = mapped ? EQUIPMENT_DB[mapped.equipmentId] : null;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProduct(p.id)}
                      className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-[var(--text-main)] font-semibold shadow-xs dark:bg-[var(--emerald-bg)] dark:border-[var(--emerald-border)]'
                          : 'bg-[var(--bg-base)] border-[var(--border-base)] text-[var(--text-muted)] hover:border-[var(--border-strong)] opacity-60'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="text-xs truncate font-bold flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {isChecked && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-emerald-600/20 text-emerald-700 dark:text-[var(--emerald-accent)] border border-emerald-500/30">
                              Stocked
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[var(--text-subtle)] truncate mt-0.5 font-normal">
                          Requires: {equipDef ? equipDef.name : 'Standard Display Stand'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* OFFICE DEDICATED WORKSPACE: Workstations, Hardware Models, Accessories & Demands */
            <div className="space-y-6">
              {/* 1. Workstation Core Hardware (Desks, Chairs, Computers) */}
              <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-5">
                <h2 className="text-sm font-bold text-[var(--text-main)] pb-2 border-b border-[var(--border-subtle)] flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-violet-500" />
                  <span>Workstation Hardware ({capacity} Desks &amp; PCs)</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Desk Selection Custom Dropdown */}
                  <div className="space-y-1.5 relative">
                    <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Desk Model</label>
                    <button
                      type="button"
                      onClick={() => {
                        setDeskDropdownOpen(!deskDropdownOpen);
                        setChairDropdownOpen(false);
                        setComputerDropdownOpen(false);
                      }}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] hover:border-violet-500 rounded-xl px-3 py-2.5 text-xs text-[var(--text-main)] font-semibold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="truncate">
                        {selectedDeskId === 'officedesk1' && 'Standard Office Desk ($800)'}
                        {selectedDeskId === 'table1' && 'Standard Table ($300)'}
                        {selectedDeskId === 'officedesk2left' && 'Executive Desk ($2,200)'}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] shrink-0 transition-transform ${deskDropdownOpen ? 'rotate-180 text-violet-500' : ''}`} />
                    </button>

                    {deskDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {[
                          { id: 'officedesk1', label: 'Standard Office Desk', price: 800 },
                          { id: 'table1', label: 'Standard Table', price: 300 },
                          { id: 'officedesk2left', label: 'Executive Desk', price: 2200 }
                        ].map(d => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => {
                              setSelectedDeskId(d.id as any);
                              setDeskDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                              selectedDeskId === d.id
                                ? 'bg-violet-500 text-white font-bold'
                                : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                            }`}
                          >
                            <span>{d.label}</span>
                            <span className="font-mono text-[10px] opacity-80">${d.price}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Chair Selection Custom Dropdown */}
                  <div className="space-y-1.5 relative">
                    <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Chair Model</label>
                    <button
                      type="button"
                      onClick={() => {
                        setChairDropdownOpen(!chairDropdownOpen);
                        setDeskDropdownOpen(false);
                        setComputerDropdownOpen(false);
                      }}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] hover:border-violet-500 rounded-xl px-3 py-2.5 text-xs text-[var(--text-main)] font-semibold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="truncate">
                        {selectedChairId === 'officechair' && 'Ergonomic Office Chair ($1,000)'}
                        {selectedChairId === 'regularchair' && 'Regular Chair ($100)'}
                        {selectedChairId === 'multipurposechair' && 'Multipurpose Chair ($1,200)'}
                        {selectedChairId === 'officechair2' && 'Stump Mesh Chair ($2,200)'}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] shrink-0 transition-transform ${chairDropdownOpen ? 'rotate-180 text-violet-500' : ''}`} />
                    </button>

                    {chairDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {[
                          { id: 'officechair', label: 'Ergonomic Office Chair', price: 1000 },
                          { id: 'regularchair', label: 'Regular Chair', price: 100 },
                          { id: 'multipurposechair', label: 'Multipurpose Chair', price: 1200 },
                          { id: 'officechair2', label: 'Stump Mesh Office Chair', price: 2200 }
                        ].map(c => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedChairId(c.id as any);
                              setChairDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                              selectedChairId === c.id
                                ? 'bg-violet-500 text-white font-bold'
                                : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                            }`}
                          >
                            <span>{c.label}</span>
                            <span className="font-mono text-[10px] opacity-80">${c.price}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Computer Selection Custom Dropdown */}
                  <div className="space-y-1.5 relative">
                    <label className="text-[11px] font-semibold text-[var(--text-muted)] uppercase">Computer Rig</label>
                    <button
                      type="button"
                      onClick={() => {
                        setComputerDropdownOpen(!computerDropdownOpen);
                        setDeskDropdownOpen(false);
                        setChairDropdownOpen(false);
                      }}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] hover:border-violet-500 rounded-xl px-3 py-2.5 text-xs text-[var(--text-main)] font-semibold flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="truncate">
                        {selectedComputerId === 'computer' && 'Standard Computer ($900)'}
                        {selectedComputerId === 'desktopcomputer' && 'ZanaMan Desktop PC ($1,250)'}
                        {selectedComputerId === 'laptop' && 'Business Laptop ($1,400)'}
                        {selectedComputerId === 'gamingcomputer' && 'High-End PC Rig ($1,500)'}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-subtle)] shrink-0 transition-transform ${computerDropdownOpen ? 'rotate-180 text-violet-500' : ''}`} />
                    </button>

                    {computerDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-40 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {[
                          { id: 'computer', label: 'Standard Computer', price: 900 },
                          { id: 'desktopcomputer', label: 'ZanaMan Desktop PC', price: 1250 },
                          { id: 'laptop', label: 'Business Laptop', price: 1400 },
                          { id: 'gamingcomputer', label: 'High-End PC Rig', price: 1500 }
                        ].map(comp => (
                          <button
                            key={comp.id}
                            type="button"
                            onClick={() => {
                              setSelectedComputerId(comp.id as any);
                              setComputerDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                              selectedComputerId === comp.id
                                ? 'bg-violet-500 text-white font-bold'
                                : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                            }`}
                          >
                            <span>{comp.label}</span>
                            <span className="font-mono text-[10px] opacity-80">${comp.price}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Employee Desk Equipment Demands (Per Employee) */}
              <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                  <div>
                    <h2 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-500" />
                      <span>Employee Desk Equipment &amp; Accessories</span>
                    </h2>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      Equips accessories across all {capacity} workstation desks.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'computermonitor', name: 'Secondary Computer Monitor', price: 175 },
                    { id: 'mousepad', name: 'Ergonomic Mouse Pad', price: 90 },
                    { id: 'graphictablet', name: 'Graphic Tablet', price: 400 },
                    { id: 'graphictabletwithscreen', name: 'Graphic Tablet (with Screen)', price: 1200 },
                    { id: 'calculator', name: 'Desktop Calculator', price: 10 },
                    { id: 'deskcalendar', name: 'Desk Calendar', price: 25 },
                    { id: 'deskglobe', name: 'Decorative Desk Globe', price: 60 },
                  ].map(acc => {
                    const isChecked = !!officeAccessories[acc.id];
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => toggleOfficeAccessory(acc.id)}
                        className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-violet-500/10 border-violet-500/40 text-[var(--text-main)] font-semibold shadow-xs dark:bg-[var(--primary-bg)] dark:border-[var(--primary)]'
                            : 'bg-[var(--bg-base)] border-[var(--border-base)] text-[var(--text-muted)] hover:border-[var(--border-strong)] opacity-60'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="text-xs truncate font-bold flex items-center gap-1.5">
                            <span>{acc.name}</span>
                            {isChecked && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-violet-600/20 text-violet-700 dark:text-[var(--primary)] border border-violet-500/30">
                                {capacity}x Added
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[var(--text-subtle)] truncate mt-0.5 font-normal">
                            ${acc.price} ea • ${(acc.price * capacity).toLocaleString()} total
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Office Breakroom Demands & Amenities */}
              <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-[var(--text-main)] pb-2 border-b border-[var(--border-subtle)] flex items-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-500" />
                  <span>Breakroom &amp; Office Demands</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'largemeetingtable', name: 'Large Conference Table', price: 1200 },
                    { id: 'standardfridge', name: 'Breakroom Standard Fridge', price: 1800 },
                    { id: 'watercooler', name: 'Water Cooler Dispenser', price: 130 },
                    { id: 'cheapcoffeemachine', name: 'Office Coffee Machine', price: 400 },
                  ].map(amenity => {
                    const isChecked = !!officeAmenities[amenity.id];
                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => toggleOfficeAmenity(amenity.id)}
                        className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-amber-500/10 border-amber-500/40 text-[var(--text-main)] font-semibold shadow-xs dark:bg-[var(--amber-bg)] dark:border-[var(--amber-border)]'
                            : 'bg-[var(--bg-base)] border-[var(--border-base)] text-[var(--text-muted)] hover:border-[var(--border-strong)] opacity-60'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <div className="text-xs truncate font-bold flex items-center gap-1.5">
                            <span>{amenity.name}</span>
                            {isChecked && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-amber-600/20 text-amber-700 dark:text-[var(--amber-accent)] border border-amber-500/30">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[var(--text-subtle)] truncate mt-0.5 font-normal">
                            ${amenity.price.toLocaleString()}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* POPUP MODAL: GROCERY SHOPPING RECEIPT WITH INTERACTIVE SCRATCH-OFF CHECKLIST */}
      {showReceiptModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-3xl bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Procurement Order &amp; Shopping List</h3>
                  <p className="text-xs text-slate-300">
                    {selectedBusiness.name} • {capacity} Customers Capacity
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sticky Grand Total & Remaining Capital Banner on Top */}
            <div className="p-4 sm:p-6 bg-[var(--bg-surface)] border-b border-[var(--border-base)] shrink-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-sky-500/10 border border-emerald-500/30 shadow-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-subtle)]">Total Budget</span>
                  <div className="text-xl font-extrabold font-mono text-[var(--text-main)] mt-0.5">
                    ${totalPrice.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[var(--text-subtle)] mt-0.5">Total Setup Cost</div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Capital Left to Spend</span>
                  <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ${remainingPrice.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-0.5 font-medium">
                    ${(totalPrice - remainingPrice).toLocaleString()} spent ({Math.round(((totalPrice - remainingPrice) / (totalPrice || 1)) * 100)}%)
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">Cargo Left to Transport</span>
                  <div className="text-xl font-extrabold font-mono text-sky-600 dark:text-sky-400 mt-0.5">
                    {remainingCargo} / {totalCargo} Units
                  </div>
                  <div className="text-[10px] text-sky-700 dark:text-sky-300 mt-0.5 font-medium">
                    {totalCargo - remainingCargo} cargo transported
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body: Scrollable Scratch-off Checklist */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">

              {/* Grouped Supplier Receipts */}
              {shoppingReceiptGrouped.map((storeData, idx) => {
                const storeSubtotal = storeData.items.reduce((s, it) => s + it.total, 0);
                const storeCargo = storeData.items.reduce((s, it) => s + it.cargo, 0);
                
                // Check if all items in this store are already scratched
                const allStoreScratched = storeData.items.every(it => scratchedItems[`${storeData.storeName}_${it.id}`]);

                return (
                  <div
                    key={storeData.storeName}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      allStoreScratched 
                        ? 'bg-[var(--bg-surface)] border-[var(--border-subtle)] opacity-60' 
                        : 'bg-[var(--bg-base)] border-[var(--border-base)] shadow-xs'
                    }`}
                  >
                    {/* Store Title with Scratch Entire Store Button */}
                    <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)] gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-violet-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[var(--text-main)] flex items-center gap-2">
                            <span>{storeData.storeName}</span>
                            {allStoreScratched && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-emerald-600 text-white">
                                All Bought
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[var(--text-subtle)] flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-violet-500" />
                            <span>{storeData.district}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right hidden sm:block">
                          <div className="text-xs font-mono font-extrabold text-emerald-600 dark:text-emerald-400">
                            ${storeSubtotal.toLocaleString()}
                          </div>
                          <div className="text-[10px] font-mono text-[var(--text-subtle)]">
                            {storeCargo} Cargo Units
                          </div>
                        </div>

                        {/* Button to Scratch/Unscratch Entire Store */}
                        <button
                          type="button"
                          onClick={() => {
                            setScratchedItems(prev => {
                              const next = { ...prev };
                              storeData.items.forEach(it => {
                                next[`${storeData.storeName}_${it.id}`] = !allStoreScratched;
                              });
                              return next;
                            });
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            allStoreScratched
                              ? 'bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                          }`}
                        >
                          {allStoreScratched ? 'Uncheck Store' : 'Buy All Store Items'}
                        </button>
                      </div>
                    </div>

                    {/* Interactive Scratch-off Items List */}
                    <div className="space-y-1.5">
                      {storeData.items.map((item) => {
                        const itemKey = `${storeData.storeName}_${item.id}`;
                        const isScratched = !!scratchedItems[itemKey];
                        const imgUrl = getFixtureImage(item.name, item.id);

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleScratchedItem(itemKey)}
                            className={`w-full text-left flex items-center justify-between text-xs py-2 px-3 rounded-xl border transition-all cursor-pointer ${
                              isScratched
                                ? 'bg-[var(--bg-surface)] border-[var(--border-subtle)] opacity-40 line-through text-[var(--text-muted)]'
                                : 'bg-[var(--bg-surface)] border-[var(--border-base)] hover:border-violet-500/50 text-[var(--text-main)] shadow-xs'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {imgUrl && (
                                <div className="w-7 h-7 rounded-lg bg-[var(--bg-base)] border border-[var(--border-base)] p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={imgUrl} alt={item.name} className="w-full h-full object-contain" />
                                </div>
                              )}
                              <span className={`font-mono font-bold ${isScratched ? 'text-[var(--text-muted)]' : 'text-violet-600 dark:text-violet-400'}`}>
                                {item.qty}x
                              </span>
                              <span className="font-medium">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-3 font-mono">
                              <span className="text-[11px] text-[var(--text-subtle)] font-medium">{item.cargo} Cargo</span>
                              <span className="font-bold">${item.total.toLocaleString()}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[var(--bg-surface)] border-t border-[var(--border-base)] flex items-center justify-between shrink-0">
              <button
                onClick={() => setScratchedItems({})}
                className="text-xs font-semibold text-[var(--text-subtle)] hover:text-rose-500 transition-colors cursor-pointer"
              >
                Reset Checklist
              </button>

              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Done / Close List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--text-muted)]">Loading store builder...</div>}>
      <BuilderContent />
    </Suspense>
  );
}
