# Website Architecture & Frontend Vision

## 1. Core Principles
- **Data-Driven & Authoritative:** Every number traces directly back to extracted game mechanics and formulas.
- **Fast, Reactive UI:** Instant filtering, multi-column sorting, live recalculation as inputs adjust.
- **Modular Planning Tools:** Interactive builders for factories, retail stores, logistics networks, and enterprise scheduling.

## 2. Tech Stack Selection
* **Frontend:** React 19 / Next.js / TypeScript / Tailwind CSS.
* **State Management & Calculation:** Zustand + pure TypeScript simulation engines.
* **Data Visualization & Graphs:** React Flow (for visual factory production graphs and supply routes), Recharts (for hourly revenue and break-even curves).
* **Database & Search:** Client-side Fuse.js / SQLite WASM for instant, sub-millisecond offline searches.

## 3. High-Value Application Modules
1. **Interactive Compendium & Explorer:**
   - Unified search across all Goods, Furniture, Businesses, Buildings, Vehicles, and Staff.
   - Cross-linking (e.g. clicking an item shows which stores sell it, which factory recipes produce it, which machines craft it, and what shelves hold it).
2. **Factory Production Planner & Graph Visualizer:**
   - Visual node editor to construct multi-stage production chains.
   - Automatic input ingredient calculator, machine count sizing, and employee skill profit optimizer.
3. **Store Builder & Revenue Simulator:**
   - Floor space allocation, shelf placement vs. customer demand cap, hourly staffing requirements, profit/hour projection.
4. **Logistics & Warehouse Optimizer:**
   - Driver route scheduling, pallet space management, delivery thresholds.
5. **Business ROI & Expansion Advisor:**
   - Compare starting businesses by initial capital ($20k, $100k, $500k, $2M+) with expected payback period.
