# Project State: Big Ambitions Tool

**Last Updated:** 2026-08-29
**Current Phase:** Full Design System Rebuild Complete (`design.txt`) -> Phase 8 (Interactive Planners & Live Bridge)

---

## 1. Executive Summary & Milestones
- **Raw Extraction (`/data/raw/`):** 100% of all 23 Addressable asset groups extracted.
- **Normalized Datasets (`/data/normalized/`):** Fully cleaned, localized, cross-referenced JSON records.
- **Relational SQLite Database (`/data/bigambitions.sqlite`):** Indexed SQLite tables for ultra-fast queries across Items, Businesses, Recipes, Buildings, and Neighborhoods.
- **TypeScript Calculation & Simulation Engine (`/engine/`):** Pure, framework-agnostic mathematical library with 100% unit test coverage.
- **Complete Rebuild of Web Frontend (`/web/`):** Rebuilt from scratch strictly adhering to [`design.txt`](file:///C:/Users/tiago/Desktop/CODING%20PROJECTS/BigAmbitionsTool/design.txt):
  - **Zero Card Wrappers:** Eliminated artificial container boxes around tables, forms, and statistics.
  - **Full Desktop Viewport:** True desktop-first data density using full screen width (`w-full` with 2rem horizontal padding).
  - **Mature Typography & Alignment:** Hierarchy driven by size, weight, and spacing rather than all-caps monospace tags.
  - **First-Class Table Typography:** Border-collapse data tables with tabular-nums monospace currency formatting.
  - **Flash-Free Light & Dark Themes:** Seamless CSS variables system (`--bg-main`, `--bg-sidebar`, `--border-default`, etc.) with inline theme persistence script to eliminate theme flashes.

---

## 2. Web Application Overview (`/web/src/app/`)

| Page / Route | Layout & Design Implementation |
|---|---|
| [`/` (Overview)](file:///C:/Users/tiago/Desktop/CODING%20PROJECTS/BigAmbitionsTool/web/src/app/page.tsx) | Clean horizontal statistics strip with vertical dividers (`791 Items | 44 Businesses | 62 Recipes | 885 Buildings`), wide factory recipes table, retail margin table, and district demographic matrix. |
| [`/items`](file:///C:/Users/tiago/Desktop/CODING%20PROJECTS/BigAmbitionsTool/web/src/app/items/page.tsx) | Full-width data table of 791 items with multi-column sorting, category tab filter bar, wholesale, retail, margin %, and vendor cross-references. |
| [`/businesses`](file:///C:/Users/tiago/Desktop/CODING%20PROJECTS/BigAmbitionsTool/web/src/app/businesses/page.tsx) | Master-detail split layout with left business list and right 24-hour demand chart, day-of-week multipliers, and operating hours. |
| [`/factories`](file:///C:/Users/tiago/Desktop/CODING%20PROJECTS/BigAmbitionsTool/web/src/app/factories/page.tsx) | Interactive factory production calculator with worker skill slider (0–100%), workstation scaling, 24h P&L table, and bill of materials. |
| [`/pricing`](file:///C:/Users/tiago/Desktop/CODING%20PROJECTS/BigAmbitionsTool/web/src/app/pricing/page.tsx) | Dynamic pricing advisor with district demographic weighting, monopoly bonus toggle (+30%), and interactive customer satisfaction elasticity bar. |
| [`/real-estate`](file:///C:/Users/tiago/Desktop/CODING%20PROJECTS/BigAmbitionsTool/web/src/app/real-estate/page.tsx) | Full-width property database of 885 NYC buildings with address search, district filters, floor area ($m^2$), traffic index, daily rent, and purchase prices. |
| [`/live-sync`](file:///C:/Users/tiago/Desktop/CODING%20PROJECTS/BigAmbitionsTool/web/src/app/live-sync/page.tsx) | Real-time companion bridge page (`ws://127.0.0.1:34567`) with connection status and live stream catalog. |
