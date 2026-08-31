# Project Task Tracker (TODO)

## Phase 5: Normalization, Enrichment & Database (COMPLETED)
- [x] Build Python normalization script (`scripts/normalize.py`)
- [x] Map localized names to all IDs from `localization_en.json`
- [x] Generate cross-references (Items <-> Businesses <-> Recipes <-> Workstations <-> Shelves)
- [x] Compute financial metrics (margins, recipe BOM costs, unit manufacturing cost, building valuations)
- [x] Export clean JSON schemas to `/data/normalized/`
- [x] Populate SQLite database `/data/bigambitions.sqlite` with indexes

## Phase 6: Pure TypeScript Calculation Engine (COMPLETED)
- [x] Build `@bigambitions/engine` package targeting ES2022 / NodeNext
- [x] Implement `pricing.ts` (Dynamic pricing, monopoly bonus, elasticity satisfaction curves)
- [x] Implement `retail.ts` (Hourly traffic simulator, opening window optimizer)
- [x] Implement `factory.ts` (Worker skill output scaling, BOM cost, machine requirements, 24h P&L)
- [x] Implement `logistics.ts` (Vehicle capacities, delivery trips, labor cost per box)
- [x] Implement `store-planner.ts` (Register checkout flow, queue limits, shopping basket requirements)
- [x] Run 100% automated test suite (`engine/tests/engine.test.js` - 5/5 passing)

## Phase 7: Web Application Foundation (COMPLETED)
- [x] Initialize Next.js 15 / React 19 / Tailwind CSS application in `/web`
- [x] Implement modern dark-mode responsive layout & glassmorphic navigation
- [x] Build executive KPI Dashboard (`/`)
- [x] Build Items & Products Compendium (`/items`) with modals & cross-references
- [x] Build Business Types & Hourly Multiplier Explorer (`/businesses`)
- [x] Build Interactive Factory Production & Skill Slider Planner (`/factories`)
- [x] Build Dynamic Pricing & Monopoly Advisor (`/pricing`)
- [x] Build NYC Real Estate & Building Database (`/real-estate`)
- [x] Build Live Game Sync Companion UI (`/live-sync`)
- [x] Pre-render and validate 10/10 production static pages (`npm run build` passing)

## Active Sprint: Phase 8 & Phase 9
- [ ] Phase 8: Advanced Visual Store Builder & Supply Chain Network Optimizer
- [ ] Phase 9: In-Game Companion Mod (`BigAmbitionsLiveSync` WebSocket Bridge)
