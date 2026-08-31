# Master Plan: Big Ambitions Tool & Live HQ Platform

## Phase 0: Project Reconnaissance (COMPLETED)
- [x] Inspect decompiled assemblies in `/Managed`
- [x] Identify code architecture, namespaces, and dependency graphs
- [x] Survey existing website capabilities, data schemas, and gaps
- [x] Check local developer tooling (.NET SDK, Python, Node.js, Steam install path)
- [x] Establish documentation suite under `/docs`

---

## Phase 1: Reverse Engineering & Core Simulation Mechanics (COMPLETED)
- [x] Document all relevant game classes, ScriptableObjects, and enum registries
- [x] Map relationship graphs (Business <-> Requirements <-> Products <-> Suppliers <-> Factories <-> Logistics)
- [x] Extract simulation math:
  - Foot-traffic calculation & customer generation logic (`CustomerEntriesCalculator.cs`)
  - Hourly & daily curves (`HourlyFactorMultiplier`, `DayFactorMultiplier`)
  - Factory production cycle times, worker skill scaling (`GetScaledOutputAmount`), and machine visuals
  - Building pricing formulas & neighborhood demographics
  - Employee demands, satisfaction, and happiness modifiers

---

## Phase 2: Data Discovery (COMPLETED)
- [x] Determine data storage mechanism (Unity Addressables + ScriptableObjects)
- [x] Identify all 23 Addressable labels (`Items`, `BusinessTypes`, `FactoryRecipes`, `FactoryWorkstations`, `BuildingsDefinitions`, `BuildingSizes`, `VehicleTypes`, `CustomerDemands`, `Neighborhoods`, `Skills`, `JobDemands`, `TagDatabases`, `InvestmentFunds`, `Diploma`, `BuildingTypes`, `HappinessModifiers`, `SpecialRivals`, etc.)
- [x] Verify Addressables loader lifecycle (`AddressableLoader.cs`)

---

## Phase 3: Extraction Strategy Formulation (COMPLETED)
- [x] Select official native first-party `BAModAPI` mod extraction as the primary authoritative pipeline
- [x] Establish automated build & deploy pipeline targeting `ModsLocal`

---

## Phase 4: Build the Extraction Pipeline (COMPLETED)
- [x] Created `/extractor/BigAmbitionsDataExtractor/` mod in C# (`net472` target)
- [x] Implemented comprehensive DTO serialization for all 15+ game data domains
- [x] Executed automated game extraction pass
- [x] Exported 100% complete dataset into `/data/raw/` (791 items, 44 businesses with 24h curves, 62 recipes, 885 buildings, 59 happiness modifiers, 35 job demands, full English localization)

---

## Phase 5: Normalization, Enrichment & SQLite Schema (COMPLETED)
- [x] Built Python/TypeScript normalization pipeline (`scripts/normalize.py`)
- [x] Mapped all localized names (`localization_en.json`) to entities
- [x] Generated bidirectional cross-reference indices (Item <-> Business <-> Recipe <-> Machine <-> Shelf)
- [x] Computed derived analytics (margins, production cost per unit, break-even hourly foot traffic)
- [x] Generated `/data/normalized/*.json` and populated `data/bigambitions.sqlite`

---

## Phase 6: Calculation & Simulation Engine (COMPLETED)
- [x] Product margin & price elasticity calculator (`pricing.ts`)
- [x] Optimal opening hours & shift profitability optimizer (`retail.ts`)
- [x] Visual multi-tier factory chain optimizer (`factory.ts`)
- [x] Warehouse logistics & driver route throughput solver (`logistics.ts`)
- [x] Retail store equipment & shelf capacity planner (`store-planner.ts`)
- [x] 100% automated test suite passing

---

## Phase 7: Web Application Architecture (COMPLETED)
- [x] Modern web frontend with Next.js 15, React 19, and Tailwind CSS in `/web`
- [x] WCAG AA compliant light and dark themes with zero theme flash
- [x] Full-width desktop density layout (`AppShell`, `Sidebar`, `Navbar`)
- [x] Global client-side fuzzy search across products, stores, addresses, and suppliers
- [x] Integrated Vercel Analytics and Speed Insights

---

## Phase 8: Interactive Planners & Compendium Tools (COMPLETED)
- [x] **Items & Products Catalog** (`/items`): 791 verified items with category filtering and supplier matrices
- [x] **Business Demand Explorer** (`/businesses`): 44 businesses with 24h traffic curves and opening hour windows
- [x] **Store & Office Builder** (`/builder`): Interactive grid layout planner with equipment footprint & customer capacity math
- [x] **Dynamic Selling Price Advisor** (`/pricing`): District customer demographics, market ceilings, and satisfaction curves
- [x] **Factory Production Optimizer** (`/factories`): Worker skill scaling (0-100%), BOM calculator, and 24h profit metrics
- [x] **Real Estate Database** (`/real-estate`): 885 NYC buildings with rent, purchase price, traffic index, and district filters
- [x] **Wholesale Suppliers Directory** (`/suppliers`): 18 suppliers with delivery fees, volume tiers, and order catalogs
- [x] **Vehicle Dealership Catalog** (`/vehicles`): Full NYC dealerships, prices, cargo capacities, and speed ratings
- [x] **Marketing Planner** (`/marketing`): Campaign traffic multipliers and agency requirements
- [x] **Methodology & Formula Pipeline** (`/about`): Exact decompiled formulas and data extraction pipeline documentation

---

## Phase 9: Real-Time Live HQ Bridge & Mod Architecture (COMPLETED)
- [x] **Dual-Target C# Mod Architecture:**
  - **Steam Workshop Native Mod:** `BigAmbitionsCompanionMod.dll` using first-party `BAModAPI` lifecycle
  - **MelonLoader Standalone Mod:** `AmbitionProSync.dll` for standalone installations
- [x] **Security & Non-Destructive Guarantees:**
  - 100% Offline loopback listening strictly on `http://127.0.0.1:8765/`
  - Read-only memory sampling from `SaveGameManager` with zero disk writes
  - Strictly GET-only and OPTIONS endpoints (zero POST/PUT handlers)
  - CORS origin verification restricting cross-origin access to companion webapp
  - Sub-second asynchronous polling with <0.1% CPU overhead
- [x] **Live HQ Web Command Deck (`/live-sync`):**
  - **7x24 Workforce Shift Matrix:** Hourly breakdown for cashiers, cleaners, and security with unstaffed walkout detection
  - **Supply Chain & Warehouses:** Storage box inventory tracking, daily burn rate drain forecasting, and delivery fleet routing
  - **Treasury & CFO Finance Suite:** Real-time liquid cash, bank balances, tax deductions, and weekly P&L analytics
  - **Real Estate Portfolio:** Residential and commercial property valuations, tenant rent collections, and net ROI
  - **Live Diagnostic Bridge:** Real-time netstat terminal verification and latency monitoring
- [x] **Security & Architecture Transparency Page (`/live-architecture`):** Full technical transparency, verified binary SHA-256 hashes, and loopback netstat instructions
