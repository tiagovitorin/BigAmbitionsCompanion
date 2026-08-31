# Project State: Big Ambitions Tool & Live HQ Platform

**Last Updated:** 2026-09-01  
**Current Status:** Production Release v2.2.0 Live  
**Web Application:** [https://bigambitionscompanion.vercel.app/](https://bigambitionscompanion.vercel.app/)  
**Steam Workshop:** [Item #3793615072](https://steamcommunity.com/sharedfiles/filedetails/?id=3793615072)  
**GitHub Repository:** [tiagovitorin/BigAmbitionsCompanion](https://github.com/tiagovitorin/BigAmbitionsCompanion)

---

## 1. System Architecture Summary
- **Compendium Layer:** Next.js 15 App Router static generation with zero client-side hydration flashes.
- **Engine Layer:** Pure TypeScript math package (`@bigambitions/engine`) modeling all decompiled game formulas.
- **Live HQ Telemetry Bridge:** Dual-target C# mod compiled for Steam Workshop (BAModAPI) and MelonLoader, running a GET-only local loopback micro-server (`127.0.0.1:8765`) with zero cloud telemetry and zero disk writes.
- **Observability:** Integrated Vercel Analytics and Core Web Vitals Speed Insights.

---

## 2. Web Application Routes & Modules

| Route | Module Description |
|---|---|
| `/` | Executive KPI Overview: 4-part summary strip, top grossing recipes, high margin products, and district demographics. |
| `/items` | Comprehensive Catalog: 791 verified items with category filter tabs, wholesale/retail prices, margins, and supplier matrices. |
| `/businesses` | Business Demand Explorer: 44 business types with 24h hourly curves, recommended operating windows, and day multipliers. |
| `/builder` | Store & Office Builder: Interactive layout grid planner with equipment footprints, register flow, and capacity calculators. |
| `/pricing` | Dynamic Pricing Advisor: Demographic class weighting, monopoly bonuses (+30%), and customer satisfaction elasticity curves. |
| `/factories` | Factory Production Optimizer: Worker skill scaling (0-100%), workstation throughput, BOM breakdown, and 24h P&L. |
| `/real-estate` | NYC Property Database: 885 buildings with square meterage ($m^2$), traffic index, rent, and purchase prices. |
| `/suppliers` | Wholesale Suppliers Directory: 18 commercial suppliers with delivery fees, volume tiers, and order catalogs. |
| `/vehicles` | Vehicle Dealerships Catalog: Dealership locations, purchase prices, cargo box capacities, and speed ratings. |
| `/marketing` | Marketing Campaign Planner: Traffic boost multipliers and agency requirements. |
| `/about` | Methodology & Extraction Pipeline: Decompiled game formulas and data discovery documentation. |
| `/live-architecture` | Security & Trust Architecture: GET-only assertion, CORS origin rules, SHA-256 release hashes, and loopback terminal verification. |
| `/live-sync` | Live HQ Command Deck: Real-time 7x24 workforce scheduling, supply chain box burn rates, and CFO treasury suite. |
