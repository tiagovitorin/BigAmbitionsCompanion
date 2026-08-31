# Master Plan: Big Ambitions Tool & Platform

## Phase 0: Project Reconnaissance (COMPLETED)
- [x] Inspect decompiled assemblies in `/Managed`
- [x] Identify code architecture, namespaces, and dependency graphs
- [x] Survey existing website (BiggerAmbitions.com) capabilities, data schemas, and gaps
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

## Phase 5: Normalization, Enrichment & SQLite Schema (NEXT)
- [ ] Build Python/TypeScript normalization pipeline (`scripts/normalize.py` / `.ts`)
- [ ] Map all localized names (`localization_en.json`) to entities
- [ ] Generate bidirectional cross-reference indices (Item <-> Business <-> Recipe <-> Machine <-> Shelf)
- [ ] Compute derived analytics (margins, production cost per unit, break-even hourly foot traffic)
- [ ] Generate `/data/normalized/*.json` and populate `data/bigambitions.sqlite`

---

## Phase 6: Calculation & Simulation Engine (Pure TypeScript)
- [ ] Product margin & price elasticity calculator
- [ ] Optimal opening hours & shift profitability optimizer (using `hourlyFactorMultipliers`)
- [ ] Visual multi-tier factory chain optimizer
- [ ] Warehouse logistics & driver route throughput solver
- [ ] Retail store equipment & shelf capacity planner

---

## Phase 7: Web Application Architecture (Next.js 15 + React + Tailwind CSS)
- [ ] Initialize modern web frontend project with dark/light themes and responsive UI
- [ ] Implement fast client-side SQLite/JSON querying layer
- [ ] Design interactive compendium tables with instant search, multi-filters, and modal views

---

## Phase 8: Interactive Planners & Visual Tools
- [ ] **Interactive Database Browser** (Items, Furniture, Businesses, Vehicles, Real Estate, Recipes)
- [ ] **Visual Factory Builder** (node-based production chain visualizer & recipe bottleneck analyzer)
- [ ] **Store Layout & Shift Planner** (equipment placement, shelf requirements, opening hour scheduler)
- [ ] **Supply Chain & Logistics Network Solver** (importers -> central warehouses -> delivery routes -> stores)
- [ ] **Financial Expansion & Investment Advisor**

---

## Phase 9: Real-Time Game Sync & Live Companion Mod (`BigAmbitionsLiveSync`)
- [ ] Build first-party companion telemetry mod (`BigAmbitionsLiveSync.dll`):
  - Lightweight embedded WebSocket / HTTP telemetry server (`ws://localhost:34567`)
  - Streams real-time game state while playing:
    - Current cash, daily profits, and net worth
    - Store inventory levels & out-of-stock alerts
    - Warehouse pallet capacities & pending delivery status
    - Employee satisfaction, shift coverage, and strike warnings
    - Competitor rival attacks and market share changes
- [ ] Build Web Companion Live Mode on the website:
  - Automatic "Connect to Local Game" toggle via WebSocket
  - Real-time overlay widgets (Second Screen Companion)
  - Live store inventory alerts & auto-reorder recommendations
