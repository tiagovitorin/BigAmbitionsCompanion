'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Factory, 
  Settings, 
  DollarSign, 
  Layers, 
  TrendingUp, 
  Clock, 
  Users, 
  CheckCircle2, 
  PackageCheck,
  Search,
  Truck,
  Boxes,
  ArrowRight,
  Package,
  Sparkles,
  Info,
  ChevronRight,
  Store,
  Wallet,
  Scale,
  Check,
  ChevronDown,
  ArrowUpDown,
  Filter,
  Share2
} from 'lucide-react';

import rawRecipes from '@/data/recipes.json';
import rawItems from '@/data/items.json';
import rawBusinesses from '@/data/businesses.json';
import rawBuildings from '@/data/buildings.json';
import purchaseMatrixRaw from '@/data/purchase_matrix.json';
import gameIconsRaw from '@/data/game_item_icons.json';
import { calculateFactoryProduction, calculateWorkerSkillFactor } from '@/lib/engine';
import { useSettings } from '@/context/SettingsContext';

const gameIcons: Record<string, string> = gameIconsRaw;
const purchaseMatrix: Record<string, { boxSize: number; suppliers: { supplier: string; pricePerBox: number }[] }> = purchaseMatrixRaw;

function getItemImageUrl(nameOrId: string): string | null {
  if (!nameOrId) return null;
  const clean = nameOrId.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (gameIcons[clean]) return gameIcons[clean];
  if (gameIcons[nameOrId]) return gameIcons[nameOrId];
  return null;
}

const MACHINE_SPECS: Record<string, { name: string; cost: number; sizeSqm: number }> = {
  hydroponicplanter: { name: 'Hydroponic Planter', cost: 15000, sizeSqm: 8 },
  foodassemblymachine: { name: 'Food Assembly Machine', cost: 22000, sizeSqm: 12 },
  industrialsewingmachine: { name: 'Industrial Sewing Machine', cost: 18000, sizeSqm: 6 },
  fabriccuttingtable: { name: 'Fabric Cutting Table', cost: 12000, sizeSqm: 10 },
  electroniccomponentsassembler: { name: 'Electronics Assembly Machine', cost: 35000, sizeSqm: 14 },
  circuitboardprinter: { name: 'Circuit Board Printer', cost: 40000, sizeSqm: 16 },
  metalcraftingbench: { name: 'Metal Crafting Bench', cost: 16000, sizeSqm: 8 },
  cuttingsawstation: { name: 'Industrial Cutting Saw', cost: 14000, sizeSqm: 8 },
  fluidbottlingmachine: { name: 'Fluid Bottling Machine', cost: 28000, sizeSqm: 14 },
  fluidmixingvat: { name: 'Fluid Mixing Vat', cost: 25000, sizeSqm: 12 },
  jewelrycraftingstation: { name: 'Jewelry Crafting Station', cost: 30000, sizeSqm: 8 },
  precisionlasercutter: { name: 'Precision Laser Cutter', cost: 45000, sizeSqm: 12 },
  standardstation: { name: 'Assembly Workstation', cost: 15000, sizeSqm: 8 },
  kilnmachine: { name: 'Industrial Kiln Machine', cost: 24000, sizeSqm: 10 },
  lasercuttingmachine: { name: 'Laser Cutting Machine', cost: 32000, sizeSqm: 10 },
  consumergoodsassemblymachine: { name: 'Consumer Goods Assembler', cost: 28000, sizeSqm: 12 },
  industrialblendingmachine: { name: 'Industrial Blending Machine', cost: 20000, sizeSqm: 10 },
  bottlingmachine: { name: 'Bottling Machine', cost: 22000, sizeSqm: 12 },
  automatedbakingmachine: { name: 'Automated Baking Machine', cost: 26000, sizeSqm: 12 }
};

function getMachineSpec(raw: string) {
  const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (MACHINE_SPECS[clean]) return MACHINE_SPECS[clean];
  
  // Format readable fallback
  const readable = raw
    .replace(/machine/gi, ' Machine')
    .replace(/([A-Z])/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim();
  
  const titleCased = readable.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return { name: titleCased, cost: 22000, sizeSqm: 10 };
}

function FactoriesContent() {
  const searchParams = useSearchParams();
  const rawRecipeParam = searchParams.get('recipe') || searchParams.get('item') || '';
  const initialSkillParam = searchParams.get('skill');
  const initialWorkstationsParam = searchParams.get('workstations');
  const initialShiftsParam = searchParams.get('shifts');
  const initialWageParam = searchParams.get('wage');
  const initialBufferParam = searchParams.get('buffer');
  const initialTabParam = searchParams.get('tab') as 'arbitrage' | 'storage' | 'logistics' | 'capital' | null;

  const matchedRecipe = useMemo(() => {
    if (!rawRecipeParam) return rawRecipes[0];
    // Exact ID match first (including un-corrupted base64)
    const exact = rawRecipes.find(r => r.id === rawRecipeParam || r.id === decodeURIComponent(rawRecipeParam));
    if (exact) return exact;

    const q = rawRecipeParam.toLowerCase();
    return rawRecipes.find(r => 
      r.output.id.toLowerCase() === q || 
      r.output.name.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q)
    ) || rawRecipes[0];
  }, [rawRecipeParam]);

  const initialDemandParam = searchParams.get('demand');

  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(() => {
    return matchedRecipe?.id || rawRecipes[0]?.id || '';
  });

  const selectedRecipe = useMemo(() => {
    return rawRecipes.find(r => r.id === selectedRecipeId) || rawRecipes[0];
  }, [selectedRecipeId]);

  // Helper to determine accurate default daily unit consumption per store for each product category
  const getDefaultStoreDemand = (recipe: typeof rawRecipes[0]) => {
    const name = recipe.output.name.toLowerCase();
    const price = recipe.output.unit_market_price;

    if (name.includes('paper bag') || name.includes('paperbag')) {
      return { demand: 1500, reason: 'High-traffic retail cash registers consume vast quantities of Paper Bags (~1,500/day across busy supermarkets & department stores).' };
    }
    if (name.includes('apple') || name.includes('banana') || name.includes('salad') || name.includes('fries') || name.includes('hotdog') || name.includes('soda') || name.includes('coffee') || name.includes('croissant') || name.includes('burger') || name.includes('donut') || name.includes('cupcake')) {
      return { demand: 500, reason: 'Fast-moving groceries, beverages, and fresh food sell high daily volumes (~500 units/day per retail store).' };
    }
    if (price > 500 || name.includes('watch') || name.includes('jewelry') || name.includes('gold') || name.includes('diamond') || name.includes('ring') || name.includes('phone') || name.includes('smartphone')) {
      return { demand: 60, reason: 'High-ticket luxury jewelry and premium electronics sell ~60 units/day per specialized boutique.' };
    }
    if (price > 100 || name.includes('clothing') || name.includes('suit') || name.includes('dress') || name.includes('earbuds') || name.includes('headphones')) {
      return { demand: 120, reason: 'Mid-to-premium fashion apparel and personal audio move ~120 units/day per retail location.' };
    }
    if (name.includes('cigar') || name.includes('wine') || name.includes('beer') || name.includes('liqueur') || name.includes('whisky')) {
      return { demand: 300, reason: 'Liquor and tobacco stores maintain steady high foot traffic (~300 units/day).' };
    }
    return { demand: 250, reason: 'Standard general merchandise stores sell ~250 units/day at steady traffic.' };
  };

  const defaultDemandObj = useMemo(() => getDefaultStoreDemand(selectedRecipe), [selectedRecipe]);

  const [customStoreDemand, setCustomStoreDemand] = useState<number>(() => {
    return initialDemandParam ? Math.max(10, Math.min(5000, Number(initialDemandParam))) : defaultDemandObj.demand;
  });
  const [workerSkill, setWorkerSkill] = useState<number>(() => {
    return initialSkillParam ? Math.max(0, Math.min(100, Number(initialSkillParam))) : 100;
  });
  const [workstations, setWorkstations] = useState<number>(() => {
    return initialWorkstationsParam ? Math.max(1, Math.min(8, Number(initialWorkstationsParam))) : 1;
  });
  const [shiftsPerDay, setShiftsPerDay] = useState<number>(() => {
    return initialShiftsParam ? Math.max(1, Math.min(3, Number(initialShiftsParam))) : 3;
  });
  const [hourlyWage, setHourlyWage] = useState<number>(() => {
    return initialWageParam ? Math.max(15, Math.min(50, Number(initialWageParam))) : 25;
  });
  const [bufferDays, setBufferDays] = useState<number>(() => {
    return initialBufferParam ? Math.max(1, Math.min(7, Number(initialBufferParam))) : 3;
  });
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'arbitrage' | 'storage' | 'logistics' | 'capital'>(() => {
    return (initialTabParam && ['arbitrage', 'storage', 'logistics', 'capital'].includes(initialTabParam)) 
      ? initialTabParam 
      : 'arbitrage';
  });

  // Automatically update store demand default when user selects a different recipe (unless overridden via URL)
  useEffect(() => {
    if (!initialDemandParam) {
      setCustomStoreDemand(defaultDemandObj.demand);
    }
  }, [selectedRecipeId, defaultDemandObj.demand, initialDemandParam]);

  // Synchronize when searchParams update from external link navigation
  useEffect(() => {
    if (matchedRecipe && matchedRecipe.id) {
      setSelectedRecipeId(matchedRecipe.id);
    }
  }, [matchedRecipe]);

  // Synchronize URL query params whenever simulation parameters change so going back in history restores state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (selectedRecipeId) params.set('recipe', selectedRecipeId);
    if (workerSkill !== 100) params.set('skill', workerSkill.toString());
    if (workstations !== 1) params.set('workstations', workstations.toString());
    if (shiftsPerDay !== 3) params.set('shifts', shiftsPerDay.toString());
    if (hourlyWage !== 25) params.set('wage', hourlyWage.toString());
    if (bufferDays !== 3) params.set('buffer', bufferDays.toString());
    if (customStoreDemand !== defaultDemandObj.demand) params.set('demand', customStoreDemand.toString());
    if (activeTab !== 'arbitrage') params.set('tab', activeTab);

    const queryString = params.toString();
    const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [selectedRecipeId, workerSkill, workstations, shiftsPerDay, hourlyWage, bufferDays, customStoreDemand, defaultDemandObj.demand, activeTab]);

  // Find output item in items.json for retail box size and wholesale pricing data
  const outputItemData = useMemo(() => {
    const rawOutputId = selectedRecipe.output.id || selectedRecipe.output.raw_id?.replace('ba:itemname_', '');
    const cleanOutputName = selectedRecipe.output.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return rawItems.find(i => 
      i.id === rawOutputId || 
      i.name.toLowerCase() === selectedRecipe.output.name.toLowerCase() ||
      i.name.toLowerCase().replace(/[^a-z0-9]/g, '') === cleanOutputName
    ) || null;
  }, [selectedRecipe]);

  // Group recipes by industry category
  const categorizedRecipes = useMemo(() => {
    return rawRecipes.map(r => {
      let category = 'General';
      const machines = r.production_machines.join(' ').toLowerCase();
      const outputName = r.output.name.toLowerCase();

      if (machines.includes('hydroponic') || outputName.includes('apple') || outputName.includes('banana') || outputName.includes('salad') || outputName.includes('food') || outputName.includes('fries') || outputName.includes('hotdog')) {
        category = 'Agriculture & Food';
      } else if (machines.includes('sewing') || outputName.includes('clothing') || outputName.includes('dress') || outputName.includes('suit') || outputName.includes('shirt')) {
        category = 'Textiles & Fashion';
      } else if (machines.includes('electronic') || machines.includes('circuit') || outputName.includes('phone') || outputName.includes('watch') || outputName.includes('earbuds') || outputName.includes('tech')) {
        category = 'Electronics & Tech';
      } else if (machines.includes('jewelry') || machines.includes('laser') || outputName.includes('ring') || outputName.includes('necklace') || outputName.includes('bracelet') || outputName.includes('jewelry') || outputName.includes('gold') || outputName.includes('silver')) {
        category = 'Jewelry & Luxury';
      } else if (machines.includes('fluid') || machines.includes('bottling') || outputName.includes('soda') || outputName.includes('beer') || outputName.includes('wine') || outputName.includes('liqueur')) {
        category = 'Beverages & Liquids';
      }

      return { ...r, category };
    });
  }, []);

  type FactorySortOption = 'profit_desc' | 'profit_asc' | 'name_asc' | 'output_desc' | 'machines_asc';

  const [sortOption, setSortOption] = useState<FactorySortOption>('profit_desc');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const categoryLabelMap: Record<string, string> = {
    all: 'All Industries',
    'Agriculture & Food': 'Agriculture & Food',
    'Electronics & Tech': 'Electronics & Tech',
    'Textiles & Fashion': 'Textiles & Fashion',
    'Jewelry & Luxury': 'Jewelry & Luxury',
    'Beverages & Liquids': 'Beverages & Liquids'
  };

  const sortLabelMap: Record<FactorySortOption, string> = {
    profit_desc: 'Profit: High to Low',
    profit_asc: 'Profit: Low to High',
    name_asc: 'Alphabetical: A-Z',
    output_desc: 'Batch Size: Large to Small',
    machines_asc: 'Machines: Fewest to Most'
  };

  const filteredRecipes = useMemo(() => {
    const list = categorizedRecipes.filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || 
                            r.output.name.toLowerCase().includes(search.toLowerCase());
      const matchesCat = activeCategory === 'all' || r.category === activeCategory;
      return matchesSearch && matchesCat;
    });

    return list.sort((a, b) => {
      if (sortOption === 'profit_desc') {
        return (b.economics.gross_profit_per_batch_skilled || 0) - (a.economics.gross_profit_per_batch_skilled || 0);
      }
      if (sortOption === 'profit_asc') {
        return (a.economics.gross_profit_per_batch_skilled || 0) - (b.economics.gross_profit_per_batch_skilled || 0);
      }
      if (sortOption === 'name_asc') {
        return a.output.name.localeCompare(b.output.name);
      }
      if (sortOption === 'output_desc') {
        return (b.output.max_skilled_amount || 0) - (a.output.max_skilled_amount || 0);
      }
      if (sortOption === 'machines_asc') {
        return a.production_machines.length - b.production_machines.length;
      }
      return 0;
    });
  }, [categorizedRecipes, search, activeCategory, sortOption]);

  const operatingHours = shiftsPerDay * 8;

  // Complete Production Engine calculations
  const production = useMemo(() => {
    const machinesCount = Math.max(1, selectedRecipe.production_machines.length);
    const totalSimultaneousStations = machinesCount * workstations;

    const base = calculateFactoryProduction({
      recipe: selectedRecipe as any,
      workerSkillPct: workerSkill,
      workerHourlyWage: hourlyWage,
      workstationsCount: workstations
    });

    const hourlyBatches = workstations * 1.0;
    const hourlyUnits = base.hourlyProduction.unitsProduced;
    const hourlyIngCost = base.hourlyProduction.totalIngredientCost;
    // Each machine in the line requires 1 dedicated worker simultaneously
    const hourlyWageCost = totalSimultaneousStations * hourlyWage;
    const hourlyRev = base.hourlyProduction.grossRevenue;

    const dailyUnits = hourlyUnits * operatingHours;
    const dailyIngCost = hourlyIngCost * operatingHours;
    const dailyWageCost = hourlyWageCost * operatingHours;
    const dailyRev = hourlyRev * operatingHours;
    const dailyNet = dailyRev - dailyIngCost - dailyWageCost;

    const weeklyUnits = dailyUnits * 7;
    const weeklyIngCost = dailyIngCost * 7;
    const weeklyWageCost = dailyWageCost * 7;
    const weeklyRev = dailyRev * 7;
    const weeklyNet = dailyNet * 7;

    // Staffing Slots
    const workerSlotsPerShift = totalSimultaneousStations;
    const totalDailyWorkerSlots = workerSlotsPerShift * shiftsPerDay;
    const fullTimeEmployeesNeeded = Math.ceil((totalDailyWorkerSlots * 8 * 7) / 40); // 40h work week

    // Unit Economics
    const totalDailyCost = dailyIngCost + dailyWageCost;
    const manufacturedUnitCost = dailyUnits > 0 ? totalDailyCost / dailyUnits : 0;
    
    // In-game wholesale pricing: if available in items.json use it, else standard importer baseline (50% of retail price)
    const wholesalePrice = (outputItemData?.financials.wholesale_price && outputItemData.financials.wholesale_price > 0)
      ? outputItemData.financials.wholesale_price
      : selectedRecipe.output.unit_market_price * 0.50;

    const retailPrice = selectedRecipe.output.unit_market_price;
    const unitSavingsVsWholesale = Math.max(0, wholesalePrice - manufacturedUnitCost);
    const savingsPercentage = wholesalePrice > 0 ? (unitSavingsVsWholesale / wholesalePrice) * 100 : 0;

    // Daily & Weekly Arbitrage Gain vs Buying Wholesale
    const dailyWholesalePurchaseCost = dailyUnits * wholesalePrice;
    const dailyArbitrageSavings = dailyWholesalePurchaseCost - totalDailyCost;
    const weeklyArbitrageSavings = dailyArbitrageSavings * 7;

    // Storage & Pallet Sizing
    // In Big Ambitions, 1 Pallet Shelf holds 4 pallets. 1 Pallet holds 16 cargo boxes = 64 boxes per Pallet Shelf.
    const BOXES_PER_PALLET_SHELF = 64;

    const boxSize = outputItemData?.retail_properties.box_size && outputItemData.retail_properties.box_size > 0
      ? outputItemData.retail_properties.box_size 
      : 500;

    const dailyBoxesProduced = Math.max(1, Math.ceil(dailyUnits / boxSize));
    const outputPalletShelvesNeeded = Math.max(1, Math.ceil((dailyBoxesProduced * bufferDays) / BOXES_PER_PALLET_SHELF));

    // Ingredient Pallets needed
    let totalIngredientBoxesDaily = 0;
    selectedRecipe.ingredients.forEach(ing => {
      const matrixEntry = purchaseMatrix[ing.name];
      const ingBoxSize = matrixEntry?.boxSize || (ing.amount >= 50 ? 1000 : 500);
      const ingDailyUnits = ing.amount * operatingHours * workstations;
      totalIngredientBoxesDaily += Math.max(0.05, ingDailyUnits / ingBoxSize);
    });

    const ingredientPalletShelvesNeeded = Math.max(1, Math.ceil((totalIngredientBoxesDaily * bufferDays) / BOXES_PER_PALLET_SHELF));
    const totalPalletShelvesNeeded = outputPalletShelvesNeeded + ingredientPalletShelvesNeeded;

    // Machine Infrastructure & Capital Setup Cost
    let machinesCost = 0;
    let machinesFootprintSqm = 0;
    selectedRecipe.production_machines.forEach(mId => {
      const spec = getMachineSpec(mId);
      machinesCost += spec.cost * workstations;
      machinesFootprintSqm += spec.sizeSqm * workstations;
    });

    const inputStationCost = 25000;
    const outputStationCost = 25000;
    const palletShelvesCost = totalPalletShelvesNeeded * 2500;
    const oneWeekRawMaterialsCapital = weeklyIngCost;
    const oneWeekWagesCapital = weeklyWageCost;

    const totalTurnkeyCapital = inputStationCost + outputStationCost + machinesCost + palletShelvesCost + oneWeekRawMaterialsCapital + oneWeekWagesCapital;
    const totalWarehouseFloorSqm = Math.ceil(machinesFootprintSqm + (totalPalletShelvesNeeded * 6) + 40); // +40sqm for stations & aisles

    // Minimum Warehouse Recommendation
    let recommendedWarehouseSize = 'Small (75 m²)';
    if (totalWarehouseFloorSqm > 500) recommendedWarehouseSize = 'Massive XL (660-800 m²)';
    else if (totalWarehouseFloorSqm > 200) recommendedWarehouseSize = 'Large L (285-450 m²)';
    else if (totalWarehouseFloorSqm > 75) recommendedWarehouseSize = 'Medium M (150-200 m²)';

    // Dynamic Store Demand & Fleet Logistics (Configured dynamically per category with slider adjustment)
    const effectiveStoreDailyDemand = Math.max(1, customStoreDemand);
    const demandReason = defaultDemandObj.reason;

    const retailStoresSupported = dailyUnits > 0 ? Math.max(1, Math.floor(dailyUnits / effectiveStoreDailyDemand)) : 1;
    // 1 Freight truck holds 24 boxes, 1 Cargo Van holds 8 boxes. Drivers can complete ~4 delivery loops per 8h shift.
    const dailyFreightTruckTrips = Math.max(1, Math.ceil(dailyBoxesProduced / 24));
    const deliveryDriversNeeded = Math.max(1, Math.ceil(dailyFreightTruckTrips / 4));

    return {
      ...base,
      customDaily: {
        operatingHours,
        unitsProduced: dailyUnits,
        totalIngredientCost: dailyIngCost,
        totalWageCost: dailyWageCost,
        grossRevenue: dailyRev,
        netProfit: dailyNet
      },
      weeklyProduction: {
        unitsProduced: weeklyUnits,
        totalIngredientCost: weeklyIngCost,
        totalWageCost: weeklyWageCost,
        grossRevenue: weeklyRev,
        netProfit: weeklyNet
      },
      arbitrage: {
        manufacturedUnitCost,
        wholesalePrice,
        retailPrice,
        unitSavingsVsWholesale,
        savingsPercentage,
        dailyArbitrageSavings,
        weeklyArbitrageSavings,
        dailyWholesalePurchaseCost
      },
      storage: {
        boxSize,
        dailyBoxesProduced,
        outputPalletShelvesNeeded,
        ingredientPalletShelvesNeeded,
        totalPalletShelvesNeeded,
        palletShelvesCost,
        totalWarehouseFloorSqm,
        recommendedWarehouseSize
      },
      logistics: {
        retailStoresSupported,
        avgStoreDailySales: effectiveStoreDailyDemand,
        demandReason,
        dailyBoxesProduced,
        dailyFreightTruckTrips,
        deliveryDriversNeeded
      },
      capital: {
        inputStationCost,
        outputStationCost,
        machinesCost,
        palletShelvesCost,
        oneWeekRawMaterialsCapital,
        oneWeekWagesCapital,
        totalTurnkeyCapital
      }
    };
  }, [selectedRecipe, outputItemData, workerSkill, hourlyWage, workstations, operatingHours, bufferDays, customStoreDemand, defaultDemandObj]);

  const outputIcon = getItemImageUrl(selectedRecipe.output.id || selectedRecipe.output.name);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
          <Factory className="w-5 h-5 text-indigo-500" />
          <span>Factory Optimizer</span>
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Manufacturing line simulator, turnkey launch capital, make vs. buy arbitrage, pallet sizing, and store fleet logistics.
        </p>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Recipe Catalog Selector */}
        <div className="lg:col-span-4 p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <span className="text-xs font-bold text-[var(--text-main)]">Crafting Recipes</span>
            <span className="text-[11px] font-mono text-[var(--text-subtle)]">{filteredRecipes.length} recipes</span>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-[var(--text-subtle)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recipes (e.g. Earbuds, Phone, Burger)..."
              className="w-full bg-[var(--bg-base)] border border-[var(--border-base)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-main)] focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Clean Dual Filter Bar: Industry Dropdown & Sorting Dropdown */}
          <div className="grid grid-cols-2 gap-2 pb-1">
            {/* Industry Category Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setCategoryDropdownOpen(!categoryDropdownOpen);
                  setSortDropdownOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center justify-between transition-colors cursor-pointer ${
                  activeCategory !== 'all'
                    ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-600 dark:text-indigo-400'
                    : 'bg-[var(--bg-base)] border-[var(--border-base)] text-[var(--text-main)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  <Filter className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span className="truncate">{activeCategory === 'all' ? 'All Industries' : activeCategory.split(' ')[0]}</span>
                </div>
                <ChevronDown className={`w-3 h-3 text-[var(--text-subtle)] shrink-0 transition-transform duration-150 ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {categoryDropdownOpen && (
                <div className="absolute left-0 top-full mt-1 z-50 w-52 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl shadow-xl p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  {Object.keys(categoryLabelMap).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat);
                        setCategoryDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors flex items-center justify-between cursor-pointer ${
                        activeCategory === cat
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                      }`}
                    >
                      <span className="truncate">{categoryLabelMap[cat]}</span>
                      {activeCategory === cat && <Check className="w-3 h-3 text-white shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sorting Filter Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setSortDropdownOpen(!sortDropdownOpen);
                  setCategoryDropdownOpen(false);
                }}
                className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] text-[11px] font-bold text-[var(--text-main)] flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <ArrowUpDown className="w-3 h-3 text-indigo-500 shrink-0" />
                  <span className="truncate">{sortLabelMap[sortOption]}</span>
                </div>
                <ChevronDown className={`w-3 h-3 text-[var(--text-subtle)] shrink-0 transition-transform duration-150 ${sortDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {sortDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 w-48 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-xl shadow-xl p-1 space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                  {(Object.keys(sortLabelMap) as FactorySortOption[]).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => {
                        setSortOption(opt);
                        setSortDropdownOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors flex items-center justify-between cursor-pointer ${
                        sortOption === opt
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)]'
                      }`}
                    >
                      <span className="truncate">{sortLabelMap[opt]}</span>
                      {sortOption === opt && <Check className="w-3 h-3 text-white shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recipe List */}
          <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredRecipes.map((r) => {
              const isSelected = r.id === selectedRecipe.id;
              const icon = getItemImageUrl(r.output.id || r.output.name);

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setSelectedRecipeId(r.id);
                    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                      setTimeout(() => {
                        document.getElementById('factory-details-pane')?.scrollIntoView({ behavior: 'smooth' });
                      }, 50);
                    }
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : 'hover:bg-[var(--bg-surface-hover)] text-[var(--text-main)] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                      {icon ? (
                        <img src={icon} alt={r.output.name} className="w-full h-full object-contain" />
                      ) : (
                        <Package className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-indigo-500'}`} />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="truncate font-semibold">{r.output.name}</div>
                      <div className={`text-[10px] ${isSelected ? 'text-indigo-100' : 'text-[var(--text-subtle)]'}`}>
                        {r.production_machines.length} Machine{r.production_machines.length > 1 ? 's' : ''} • {r.ingredients.length} Inputs
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    {r.output.unit_market_price > 0 ? (
                      <>
                        <span className={`text-[11px] font-mono font-bold block ${
                          isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          +${r.economics.gross_profit_per_batch_skilled.toLocaleString()}
                        </span>
                        <span className={`text-[9px] font-mono block ${
                          isSelected ? 'text-indigo-100 opacity-80' : 'text-[var(--text-subtle)]'
                        }`}>
                          /batch
                        </span>
                      </>
                    ) : (
                      <>
                        <span className={`text-[11px] font-mono font-bold block ${
                          isSelected ? 'text-white' : 'text-sky-500'
                        }`}>
                          Store Supply
                        </span>
                        <span className={`text-[9px] font-mono block ${
                          isSelected ? 'text-indigo-100 opacity-80' : 'text-[var(--text-subtle)]'
                        }`}>
                          In-house utility
                        </span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Simulation Controls & Results */}
        <div id="factory-details-pane" className="lg:col-span-8 space-y-5">
          {/* Active Recipe Header & Key Turnkey Strip */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] p-1.5 flex items-center justify-center shrink-0">
                  {outputIcon ? (
                    <img src={outputIcon} alt={selectedRecipe.output.name} className="w-full h-full object-contain" />
                  ) : (
                    <Package className="w-6 h-6 text-[var(--text-muted)]" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-bold text-[var(--text-main)]">{selectedRecipe.name}</h2>
                  <div className="text-xs text-[var(--text-muted)] mt-0.5 flex flex-wrap items-center gap-2">
                    <span>Output: <strong className="text-[var(--text-main)]">{selectedRecipe.output.name}</strong></span>
                    <span>•</span>
                    {selectedRecipe.output.unit_market_price > 0 ? (
                      <span>Retail Price: <strong className="text-emerald-600 font-mono">${selectedRecipe.output.unit_market_price.toFixed(2)}/unit</strong></span>
                    ) : (
                      <span>Wholesale Market Value: <strong className="text-sky-600 dark:text-sky-400 font-mono">${production.arbitrage.wholesalePrice.toFixed(2)}/unit</strong> (Internal Store Supply)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] text-[var(--text-main)] text-xs font-semibold text-center self-start sm:self-auto">
                <span className="font-mono font-bold text-sm block text-emerald-600 dark:text-emerald-400">
                  {production.outputPerBatch} units
                </span>
                <span className="text-[10px] text-[var(--text-subtle)]">Per Machine Batch</span>
              </div>
            </div>

            {/* Turnkey Launch Capital Highlight Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-sky-500/10 to-emerald-500/10 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Turnkey Launch Capital Required</span>
                  </span>
                  <div className="relative group cursor-pointer inline-flex items-center">
                    <Info className="w-3 h-3 text-indigo-500/70 hover:text-indigo-600 transition-colors" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col w-64 p-2.5 rounded-xl bg-slate-900 text-white text-[11px] font-normal shadow-xl border border-slate-700 z-50 pointer-events-none">
                      <span className="font-bold text-indigo-300 mb-1">Turnkey Capital Formula:</span>
                      <span>Stations ($50k) + {workstations}x Line Equipment (${(production.capital.machinesCost / 1000).toFixed(0)}k) + Shelves (${(production.capital.palletShelvesCost / 1000).toFixed(0)}k) + 1 Week Operating Working Capital.</span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Total bank balance needed to purchase all equipment and fund week 1 operations.
                </p>
              </div>

              <div className="sm:text-right shrink-0">
                <span className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400 block">
                  ${Math.round(production.capital.totalTurnkeyCapital).toLocaleString()}
                </span>
                <span className="text-[10px] text-[var(--text-subtle)]">
                  Min. Space: <strong className="text-[var(--text-main)]">{production.storage.totalWarehouseFloorSqm} m²</strong> ({production.storage.recommendedWarehouseSize})
                </span>
              </div>
            </div>

            {/* Production Line Pipeline */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[var(--text-main)] flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Production Line</span>
                  </span>
                  <div className="relative group cursor-pointer inline-flex items-center">
                    <Info className="w-3 h-3 text-[var(--text-subtle)] hover:text-indigo-500 transition-colors" />
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col w-64 p-2.5 rounded-xl bg-slate-900 text-white text-[11px] font-normal shadow-xl border border-slate-700 z-50 pointer-events-none">
                      <span className="font-bold text-indigo-300 mb-1">Station Flow:</span>
                      <span>Click any machine to inspect its equipment specs in the database. Raw ingredients move from Input Station through sequential machines to Output Station.</span>
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-[var(--text-subtle)] flex items-center gap-1">
                  <Users className="w-3 h-3 text-indigo-500" />
                  <span>{selectedRecipe.production_machines.length * workstations} workers/shift • ~{Math.ceil((selectedRecipe.production_machines.length * workstations * shiftsPerDay * 8 * 7) / 40)} staff total</span>
                </span>
              </div>

              {/* Clickable Pipeline Visualizer */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 pt-0.5">
                <Link
                  href="/items?search=Input Station"
                  className="p-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[11px] flex items-center justify-between sm:justify-start gap-1.5 shrink-0 transition-colors group cursor-pointer"
                >
                  <span className="font-semibold text-[var(--text-main)] group-hover:text-indigo-500">Input Station</span>
                  <span className="text-[10px] font-mono text-[var(--text-subtle)]">$25k</span>
                </Link>
                <ArrowRight className="hidden sm:block w-3 h-3 text-[var(--text-subtle)] shrink-0 opacity-60" />

                {selectedRecipe.production_machines.map((machineId, idx) => {
                  const spec = getMachineSpec(machineId);
                  return (
                    <div key={idx} className="contents sm:flex sm:items-center sm:gap-1.5">
                      <Link
                        href={`/items?search=${encodeURIComponent(spec.name.replace(' Machine', '').replace(' Station', ''))}`}
                        className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-[11px] flex items-center justify-between sm:justify-start gap-2 shrink-0 transition-colors group cursor-pointer"
                      >
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline">{spec.name}</span>
                        <span className="text-[10px] font-mono text-indigo-500/80">${(spec.cost / 1000).toFixed(0)}k</span>
                      </Link>
                      <ArrowRight className="hidden sm:block w-3 h-3 text-[var(--text-subtle)] shrink-0 opacity-60" />
                    </div>
                  );
                })}

                <Link
                  href="/items?search=Output Station"
                  className="p-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-[11px] flex items-center justify-between sm:justify-start gap-1.5 shrink-0 transition-colors group cursor-pointer"
                >
                  <span className="font-semibold text-[var(--text-main)] group-hover:text-indigo-500">Output Station</span>
                  <span className="text-[10px] font-mono text-[var(--text-subtle)]">$25k</span>
                </Link>
              </div>
            </div>

            {/* Interactive Sliders: Skill, Stations, Shifts, Wages, Buffer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
              {/* Skill Slider */}
              <div className="space-y-1.5 p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-[var(--text-main)]">Worker Skill</span>
                    <div className="relative group cursor-pointer inline-flex items-center">
                      <Info className="w-2.5 h-2.5 text-[var(--text-subtle)] hover:text-indigo-500" />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col w-52 p-2 rounded-xl bg-slate-900 text-white text-[10px] shadow-xl border border-slate-700 z-50 pointer-events-none">
                        <span>0% skill gives 0.5x yield. 100% skill gives maximum 1.0x full recipe batch yield.</span>
                      </div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-indigo-500">{workerSkill}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={workerSkill}
                  onChange={(e) => setWorkerSkill(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="text-[10px] text-[var(--text-subtle)]">
                  Yield: <span className="font-mono font-bold text-[var(--text-main)]">{production.workerSkillFactor.toFixed(2)}x</span>
                </div>
              </div>

              {/* Workstations Count */}
              <div className="space-y-1.5 p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-[var(--text-main)]">Machine Lines</span>
                    <div className="relative group cursor-pointer inline-flex items-center">
                      <Info className="w-2.5 h-2.5 text-[var(--text-subtle)] hover:text-indigo-500" />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col w-52 p-2 rounded-xl bg-slate-900 text-white text-[10px] shadow-xl border border-slate-700 z-50 pointer-events-none">
                        <span>Parallel machine lines running concurrently in the warehouse.</span>
                      </div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-indigo-500">{workstations} Line{workstations > 1 ? 's' : ''}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={workstations}
                  onChange={(e) => setWorkstations(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="text-[10px] text-[var(--text-subtle)]">
                  Concurrent setups
                </div>
              </div>

              {/* Shifts Operating per Day */}
              <div className="space-y-1.5 p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-[var(--text-main)]">Operating Hours</span>
                    <div className="relative group cursor-pointer inline-flex items-center">
                      <Info className="w-2.5 h-2.5 text-[var(--text-subtle)] hover:text-sky-500" />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col w-52 p-2 rounded-xl bg-slate-900 text-white text-[10px] shadow-xl border border-slate-700 z-50 pointer-events-none">
                        <span>1 Shift = 8h/day, 2 Shifts = 16h/day, 3 Shifts = 24h continuous 24/7 production.</span>
                      </div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-sky-500">{shiftsPerDay * 8}h / day</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="3"
                  value={shiftsPerDay}
                  onChange={(e) => setShiftsPerDay(Number(e.target.value))}
                  className="w-full accent-sky-500 cursor-pointer"
                />
                <div className="text-[10px] text-[var(--text-subtle)]">
                  {shiftsPerDay === 1 ? '1 Shift (8h)' : shiftsPerDay === 2 ? '2 Shifts (16h)' : '3 Shifts (24h 24/7)'}
                </div>
              </div>

              {/* Wage Slider */}
              <div className="space-y-1.5 p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-[var(--text-main)]">Hourly Wage</span>
                    <div className="relative group cursor-pointer inline-flex items-center">
                      <Info className="w-2.5 h-2.5 text-[var(--text-subtle)] hover:text-emerald-500" />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:flex flex-col w-52 p-2 rounded-xl bg-slate-900 text-white text-[10px] shadow-xl border border-slate-700 z-50 pointer-events-none">
                        <span>Hourly compensation paid per active machine operator.</span>
                      </div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-emerald-500">${hourlyWage}/hr</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="50"
                  value={hourlyWage}
                  onChange={(e) => setHourlyWage(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <div className="text-[10px] text-[var(--text-subtle)]">
                  Payroll: <span className="font-mono font-bold text-[var(--text-main)]">${Math.round(production.customDaily.totalWageCost).toLocaleString()}/d</span>
                </div>
              </div>

              {/* Buffer Days for Pallets */}
              <div className="space-y-1.5 p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)]">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-[var(--text-main)]">Pallet Buffer</span>
                    <div className="relative group cursor-pointer inline-flex items-center">
                      <Info className="w-2.5 h-2.5 text-[var(--text-subtle)] hover:text-amber-500" />
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:flex flex-col w-56 p-2 rounded-xl bg-slate-900 text-white text-[10px] shadow-xl border border-slate-700 z-50 pointer-events-none">
                        <span>Days of finished goods &amp; raw ingredients stored on shelves to prevent stockouts during delivery cycles.</span>
                      </div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-amber-500">{bufferDays} Days</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="7"
                  value={bufferDays}
                  onChange={(e) => setBufferDays(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <div className="text-[10px] text-[var(--text-subtle)]">
                  Safety stock buffer
                </div>
              </div>
            </div>
          </div>

          {/* Module Navigation Tabs */}
          <div className="flex items-center gap-1.5 border-b border-[var(--border-subtle)] pb-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('arbitrage')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'arbitrage'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Make vs. Buy</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('capital')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'capital'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Launch Budget</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('storage')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'storage'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Storage &amp; Sizing</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('logistics')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                activeTab === 'logistics'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Fleet &amp; Logistics</span>
            </button>
          </div>

          {/* TAB 1: MAKE VS BUY ARBITRAGE */}
          {activeTab === 'arbitrage' && (
            <div className="space-y-4">
              {/* Unit Economics Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-1">
                  <span className="text-[10px] text-[var(--text-subtle)] uppercase font-semibold block">Manufactured Unit Cost</span>
                  <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ${production.arbitrage.manufacturedUnitCost.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-[var(--text-subtle)]">Ingredients + wages</div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-1">
                  <span className="text-[10px] text-[var(--text-subtle)] uppercase font-semibold block">Wholesale Import Price</span>
                  <div className="text-xl font-extrabold font-mono text-[var(--text-main)] mt-0.5">
                    ${production.arbitrage.wholesalePrice.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-[var(--text-subtle)]">From Harbor / NY Distro</div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-1">
                  <span className="text-[10px] text-[var(--text-subtle)] uppercase font-semibold block">Cost Savings per Unit</span>
                  <div className="text-xl font-extrabold font-mono text-sky-500 mt-0.5">
                    +${production.arbitrage.unitSavingsVsWholesale.toFixed(2)} <span className="text-xs font-normal">({production.arbitrage.savingsPercentage.toFixed(0)}%)</span>
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold">vs. buying wholesale</div>
                </div>
              </div>

              {/* Profit Gain / Supply Cost Savings Summary Card */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>{selectedRecipe.output.unit_market_price > 0 ? 'Manufacturing Arbitrage Yield' : 'In-House Store Supply Savings'}</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {selectedRecipe.output.unit_market_price > 0 
                      ? 'In-house production savings vs purchasing wholesale from NY Distro / Harbor:'
                      : 'Operating expenditure saved by self-manufacturing checkout bags vs buying from Metro Wholesale:'}
                  </p>
                </div>

                <div className="sm:text-right shrink-0">
                  <span className="text-base font-mono font-extrabold text-emerald-600 dark:text-emerald-400 block">
                    +${Math.round(production.arbitrage.weeklyArbitrageSavings).toLocaleString()} / week
                  </span>
                  <span className="text-[10px] text-[var(--text-subtle)]">
                    (+${Math.round(production.arbitrage.dailyArbitrageSavings).toLocaleString()}/day {selectedRecipe.output.unit_market_price > 0 ? 'margin' : 'cost saved'})
                  </span>
                </div>
              </div>

              {/* Bill of Materials (BOM) & Supply Chain Procurement */}
              <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                  <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Bill of Materials (BOM)</span>
                  </h3>
                  <span className="text-[10px] font-mono text-[var(--text-subtle)]">
                    {selectedRecipe.ingredients.length} Inputs
                  </span>
                </div>

                <div className="border border-[var(--border-base)] rounded-xl overflow-hidden bg-[var(--bg-base)]">
                  <table className="w-full text-xs">
                    <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase">
                      <tr>
                        <th className="py-2.5 px-3 text-left">Ingredient Component</th>
                        <th className="py-2.5 px-2 text-right">Per Batch</th>
                        <th className="py-2.5 px-2 text-right">Daily Needed</th>
                        <th className="py-2.5 px-2 text-right">Weekly Needed</th>
                        <th className="py-2.5 px-3 text-right">Primary Vendor / Port</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                      {selectedRecipe.ingredients.map((input) => {
                        const dailyQty = input.amount * operatingHours * workstations;
                        const weeklyQty = dailyQty * 7;
                        const iconSrc = getItemImageUrl(input.id || input.name);
                        const matrixEntry = purchaseMatrix[input.name];
                        const primarySupplier = matrixEntry?.suppliers?.[0]?.supplier || 'Import Port / Wholesaler';

                        return (
                          <tr key={input.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                            <td className="py-2.5 px-3 font-sans font-semibold text-[var(--text-main)]">
                              <Link
                                href={`/items?search=${encodeURIComponent(input.name)}`}
                                className="flex items-center gap-2 hover:text-indigo-500 transition-colors group cursor-pointer"
                              >
                                <div className="w-6 h-6 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-0.5 flex items-center justify-center shrink-0 overflow-hidden">
                                  {iconSrc ? (
                                    <img src={iconSrc} alt={input.name} className="w-full h-full object-contain" />
                                  ) : (
                                    <Package className="w-3 h-3 text-indigo-500 opacity-70" />
                                  )}
                                </div>
                                <span className="capitalize group-hover:underline">{input.name}</span>
                              </Link>
                            </td>
                            <td className="py-2.5 px-2 text-right font-bold text-[var(--text-main)]">
                              {input.amount}x
                            </td>
                            <td className="py-2.5 px-2 text-right text-[var(--text-muted)]">
                              {Math.round(dailyQty).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-2 text-right font-bold text-indigo-600 dark:text-indigo-400">
                              {Math.round(weeklyQty).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-sans text-[11px] text-[var(--text-subtle)]">
                              {primarySupplier}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TURNKEY LAUNCH BUDGET (DETAILED SHOPPING LIST) */}
          {activeTab === 'capital' && (
            <div className="space-y-4">
              {/* Grand Total Turnkey Budget Highlight Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-1">
                  <span className="text-[10px] text-[var(--text-subtle)] uppercase font-semibold block">Equipment Shopping Total</span>
                  <div className="text-xl font-extrabold font-mono text-[var(--text-main)] mt-0.5">
                    ${(production.capital.inputStationCost + production.capital.outputStationCost + production.capital.machinesCost + production.capital.palletShelvesCost).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[var(--text-subtle)]">Stations, machines &amp; shelves</div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-1">
                  <span className="text-[10px] text-[var(--text-subtle)] uppercase font-semibold block">Week 1 Operating Reserve</span>
                  <div className="text-xl font-extrabold font-mono text-indigo-500 mt-0.5">
                    ${Math.round(production.capital.oneWeekRawMaterialsCapital + production.capital.oneWeekWagesCapital).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[var(--text-subtle)]">7-day ingredients + payroll</div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-emerald-500/30 bg-emerald-500/5 shadow-xs space-y-1">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">Total Launch Capital Required</span>
                  <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    ${Math.round(production.capital.totalTurnkeyCapital).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold">100% turnkey ready</div>
                </div>
              </div>

              {/* Comprehensive Shopping & Procurement Checklist */}
              <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-indigo-500" />
                    <div>
                      <h3 className="font-bold text-[var(--text-main)]">Equipment &amp; Setup Shopping Checklist</h3>
                      <span className="text-[10px] text-[var(--text-subtle)] block">Complete procurement itemization with store locations</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--text-subtle)]">
                    {2 + selectedRecipe.production_machines.length + 1} items to purchase
                  </span>
                </div>

                <div className="border border-[var(--border-base)] rounded-xl overflow-hidden bg-[var(--bg-base)]">
                  <table className="w-full text-xs">
                    <thead className="bg-[var(--bg-surface)] border-b border-[var(--border-base)] text-[10px] font-bold text-[var(--text-subtle)] uppercase">
                      <tr>
                        <th className="py-2.5 px-3 text-left">Equipment / Expense</th>
                        <th className="py-2.5 px-2 text-left">Where to Buy</th>
                        <th className="py-2.5 px-2 text-right">Qty</th>
                        <th className="py-2.5 px-2 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                      {/* Input Station */}
                      <tr className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                        <td className="py-2.5 px-3 font-sans font-semibold text-[var(--text-main)]">
                          <Link href="/items?search=Input Station" className="hover:text-indigo-500 hover:underline">
                            Input Station
                          </Link>
                        </td>
                        <td className="py-2.5 px-2 font-sans text-[11px] text-[var(--text-subtle)]">Factory Supply Depot (57 5th Ave)</td>
                        <td className="py-2.5 px-2 text-right text-[var(--text-main)]">1</td>
                        <td className="py-2.5 px-2 text-right text-[var(--text-muted)]">$25,000</td>
                        <td className="py-2.5 px-3 text-right font-bold text-[var(--text-main)]">${production.capital.inputStationCost.toLocaleString()}</td>
                      </tr>

                      {/* Production Machines */}
                      {selectedRecipe.production_machines.map((mId, idx) => {
                        const spec = getMachineSpec(mId);
                        return (
                          <tr key={idx} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                            <td className="py-2.5 px-3 font-sans font-semibold text-[var(--text-main)]">
                              <Link href={`/items?search=${encodeURIComponent(spec.name.replace(' Machine', ''))}`} className="hover:text-indigo-500 hover:underline">
                                {spec.name}
                              </Link>
                            </td>
                            <td className="py-2.5 px-2 font-sans text-[11px] text-[var(--text-subtle)]">Factory Supply Depot (57 5th Ave)</td>
                            <td className="py-2.5 px-2 text-right text-[var(--text-main)]">{workstations}</td>
                            <td className="py-2.5 px-2 text-right text-[var(--text-muted)]">${spec.cost.toLocaleString()}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-[var(--text-main)]">${(spec.cost * workstations).toLocaleString()}</td>
                          </tr>
                        );
                      })}

                      {/* Output Station */}
                      <tr className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                        <td className="py-2.5 px-3 font-sans font-semibold text-[var(--text-main)]">
                          <Link href="/items?search=Output Station" className="hover:text-indigo-500 hover:underline">
                            Output Station
                          </Link>
                        </td>
                        <td className="py-2.5 px-2 font-sans text-[11px] text-[var(--text-subtle)]">Factory Supply Depot (57 5th Ave)</td>
                        <td className="py-2.5 px-2 text-right text-[var(--text-main)]">1</td>
                        <td className="py-2.5 px-2 text-right text-[var(--text-muted)]">$25,000</td>
                        <td className="py-2.5 px-3 text-right font-bold text-[var(--text-main)]">${production.capital.outputStationCost.toLocaleString()}</td>
                      </tr>

                      {/* Pallet Shelves */}
                      <tr className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                        <td className="py-2.5 px-3 font-sans font-semibold text-[var(--text-main)]">
                          <Link href="/items?search=Pallet Shelf" className="hover:text-indigo-500 hover:underline">
                            Pallet Shelves (4 Pallets / 64 Boxes capacity)
                          </Link>
                        </td>
                        <td className="py-2.5 px-2 font-sans text-[11px] text-[var(--text-subtle)]">Factory Supply Depot / Wholesale</td>
                        <td className="py-2.5 px-2 text-right text-[var(--text-main)]">{production.storage.totalPalletShelvesNeeded}</td>
                        <td className="py-2.5 px-2 text-right text-[var(--text-muted)]">$2,500</td>
                        <td className="py-2.5 px-3 text-right font-bold text-[var(--text-main)]">${production.capital.palletShelvesCost.toLocaleString()}</td>
                      </tr>

                      {/* Working Capital Row 1: Raw Materials */}
                      <tr className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                        <td className="py-2.5 px-3 font-sans font-semibold text-[var(--text-main)]">
                          Week 1 Raw Materials Buffer (7 Days)
                        </td>
                        <td className="py-2.5 px-2 font-sans text-[11px] text-[var(--text-subtle)]">Port Importers / Wholesalers</td>
                        <td className="py-2.5 px-2 text-right text-[var(--text-main)]">7 days</td>
                        <td className="py-2.5 px-2 text-right text-[var(--text-muted)]">${Math.round(production.customDaily.totalIngredientCost).toLocaleString()}/d</td>
                        <td className="py-2.5 px-3 text-right font-bold text-[var(--text-main)]">${Math.round(production.capital.oneWeekRawMaterialsCapital).toLocaleString()}</td>
                      </tr>

                      {/* Working Capital Row 2: Payroll */}
                      <tr className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                        <td className="py-2.5 px-3 font-sans font-semibold text-[var(--text-main)]">
                          Week 1 Worker Payroll Reserve (7 Days)
                        </td>
                        <td className="py-2.5 px-2 font-sans text-[11px] text-[var(--text-subtle)]">{selectedRecipe.production_machines.length * workstations * shiftsPerDay} total shift slots</td>
                        <td className="py-2.5 px-2 text-right text-[var(--text-main)]">7 days</td>
                        <td className="py-2.5 px-2 text-right text-[var(--text-muted)]">${Math.round(production.customDaily.totalWageCost).toLocaleString()}/d</td>
                        <td className="py-2.5 px-3 text-right font-bold text-[var(--text-main)]">${Math.round(production.capital.oneWeekWagesCapital).toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: STORAGE & WAREHOUSE SIZING */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-1">
                  <span className="text-[10px] text-[var(--text-subtle)] uppercase font-semibold block">Total Pallet Shelves Needed</span>
                  <div className="text-xl font-extrabold font-mono text-amber-500 mt-0.5">
                    {production.storage.totalPalletShelvesNeeded} Shelves
                  </div>
                  <div className="text-[10px] text-[var(--text-subtle)]">${production.storage.palletShelvesCost.toLocaleString()} investment</div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-1">
                  <span className="text-[10px] text-[var(--text-subtle)] uppercase font-semibold block">Raw Ingredients Storage</span>
                  <div className="text-xl font-extrabold font-mono text-[var(--text-main)] mt-0.5">
                    {production.storage.ingredientPalletShelvesNeeded} Shelves
                  </div>
                  <div className="text-[10px] text-[var(--text-subtle)]">For {bufferDays}-day delivery buffer</div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-1">
                  <span className="text-[10px] text-[var(--text-subtle)] uppercase font-semibold block">Finished Goods Storage</span>
                  <div className="text-xl font-extrabold font-mono text-indigo-500 mt-0.5">
                    {production.storage.outputPalletShelvesNeeded} Shelves
                  </div>
                  <div className="text-[10px] text-[var(--text-subtle)]">For {bufferDays}-day output buffer</div>
                </div>
              </div>

              {/* Warehouse Property Recommendation & Matches */}
              <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                  <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
                    <Boxes className="w-3.5 h-3.5 text-sky-500" />
                    <span>Calculated Warehouse Space &amp; In-Game Available Properties</span>
                  </h3>
                  <span className="text-[10px] font-mono text-[var(--text-subtle)]">Calculated from physical footprints</span>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-[var(--text-main)]">
                      Minimum Floor Area Required: <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{production.storage.totalWarehouseFloorSqm} m²</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Calculated as: {selectedRecipe.production_machines.length * workstations * 12}m² (machines) + {production.storage.totalPalletShelvesNeeded * 6}m² (shelves) + 40m² (input/output stations &amp; walking lanes).
                    </p>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <span className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 font-bold text-indigo-600 dark:text-indigo-400 block text-xs">
                      {production.storage.recommendedWarehouseSize}
                    </span>
                  </div>
                </div>

                {/* Available In-Game Warehouses from Database */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-[var(--text-main)] block">Matching In-Game Warehouses:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {rawBuildings
                      .filter(b => b.building_type === 'warehouse' && b.square_meters >= production.storage.totalWarehouseFloorSqm)
                      .slice(0, 4)
                      .map((b) => (
                        <Link
                          key={b.id}
                          href={`/real-estate?search=${encodeURIComponent(b.address)}`}
                          className="p-2.5 rounded-xl bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-base)] flex items-center justify-between text-xs transition-colors group cursor-pointer"
                        >
                          <div>
                            <div className="font-semibold text-[var(--text-main)] group-hover:text-indigo-500">{b.address}</div>
                            <div className="text-[10px] text-[var(--text-subtle)]">{b.neighborhood_name} • {b.square_meters} m²</div>
                          </div>
                          <div className="text-right font-mono text-[11px]">
                            <span className="font-bold text-emerald-600 block">${Math.round(b.estimated_daily_rent).toLocaleString()}/d</span>
                            <span className="text-[9px] text-[var(--text-subtle)]">${(b.estimated_purchase_price / 1000000).toFixed(2)}M buy</span>
                          </div>
                        </Link>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: STORE FLEET & DELIVERY LOGISTICS */}
          {activeTab === 'logistics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Retail Stores Supplied with Slick Integrated Demand Slider */}
                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-subtle)] uppercase font-semibold block">Retail Stores Supplied</span>
                    {customStoreDemand !== defaultDemandObj.demand && (
                      <button
                        type="button"
                        onClick={() => setCustomStoreDemand(defaultDemandObj.demand)}
                        className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Reset ({defaultDemandObj.demand} u/d)
                      </button>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                      {production.logistics.retailStoresSupported} Store{production.logistics.retailStoresSupported > 1 ? 's' : ''}
                    </div>
                    <span className="text-[11px] font-mono text-[var(--text-subtle)] font-semibold">
                      {customStoreDemand.toLocaleString()} u/d
                    </span>
                  </div>

                  {/* Slick Inline Slider */}
                  <div className="space-y-1 pt-0.5">
                    <input
                      type="range"
                      min="20"
                      max={selectedRecipe.output.name.toLowerCase().includes('paper bag') ? 4000 : 1500}
                      step={selectedRecipe.output.name.toLowerCase().includes('paper bag') ? 50 : 10}
                      value={customStoreDemand}
                      onChange={(e) => setCustomStoreDemand(Number(e.target.value))}
                      className="w-full h-1 bg-[var(--bg-base)] accent-emerald-500 cursor-pointer block"
                    />
                    <div className="flex justify-between text-[9px] text-[var(--text-subtle)] font-mono">
                      <span>20/d</span>
                      <span className="truncate max-w-[120px] text-center">{defaultDemandObj.demand} default</span>
                      <span>{selectedRecipe.output.name.toLowerCase().includes('paper bag') ? '4k' : '1.5k'}/d</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-1">
                  <span className="text-[10px] text-[var(--text-subtle)] uppercase font-semibold block">Daily Cargo Volume</span>
                  <div className="text-xl font-extrabold font-mono text-[var(--text-main)] mt-0.5">
                    {production.logistics.dailyBoxesProduced} Boxes / day
                  </div>
                  <div className="text-[10px] text-[var(--text-subtle)]">Box size: {production.storage.boxSize} units</div>
                </div>

                <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-1">
                  <span className="text-[10px] text-[var(--text-subtle)] uppercase font-semibold block">Delivery Drivers Needed</span>
                  <div className="text-xl font-extrabold font-mono text-sky-500 mt-0.5">
                    {production.logistics.deliveryDriversNeeded} Drivers
                  </div>
                  <div className="text-[10px] text-[var(--text-subtle)]">~{production.logistics.dailyFreightTruckTrips} Freight runs/day</div>
                </div>
              </div>

              {/* Logistics Manager & Driver Routing Instructions */}
              <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-base)] shadow-xs space-y-2 text-xs">
                <h3 className="text-xs font-bold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-sky-500" />
                  <span>Logistics Manager &amp; Driver Setup</span>
                </h3>
                <div className="p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-base)] space-y-2 text-[11px] text-[var(--text-muted)]">
                  <p>1. <strong>HQ Purchasing Agent:</strong> Create repeating delivery contracts from the primary port/wholesaler to this factory warehouse with target stock set to {Math.round(production.customDaily.unitsProduced * bufferDays).toLocaleString()} units.</p>
                  <p>2. <strong>HQ Logistics Manager:</strong> Route finished goods from the factory output station to your retail stores with minimum target shelf inventories.</p>
                  <p>3. <strong>Warehouse Delivery Vehicle:</strong> Assign {production.logistics.deliveryDriversNeeded} Delivery Driver(s) with Freight Truck(s) (24-box cargo) directly to the warehouse.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FactoriesPage() {
  return (
    <Suspense fallback={
      <div className="w-full space-y-8 p-6 sm:p-8 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          <div className="h-4 w-96 bg-slate-100 dark:bg-slate-800/60 rounded" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 h-96 bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-[var(--border-base)]" />
          <div className="lg:col-span-8 h-96 bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-[var(--border-base)]" />
        </div>
      </div>
    }>
      <FactoriesContent />
    </Suspense>
  );
}