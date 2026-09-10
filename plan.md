# Live Sync Refactor Plan

Target file: `web/src/app/live-sync/page.tsx` (7327 lines, single monolith).

Goal: break the monolith into a slim orchestrator `page.tsx` plus modular view/panel components under `web/src/app/live-sync/components/`, with recurring matchers and formatters moved to `web/src/lib/`. No new behavior, no visual changes. Every phase must leave `npx tsc --noEmit` green (run from `web/`).

---

## 1. Sections, Tabs & Panels Identified

### A. Module-level helpers & standalone components (top of file)

| # | Item | Lines | Description |
|---|------|-------|-------------|
| 1 | `renderBusinessLogo` | 95-160 | Resolves a store icon: custom in-game logo (base64 + mask) or static `/images/storeicons/*.png` by business type. Returns JSX. |
| 2 | `getItemImageSrc` | 162-207 | Resolves item thumbnail: keyword match then fallback lookup in `items.json`. Returns image path or `''`. |
| 3 | `DAYS_ORDER` | 209 | Weekday ordering constant used by schedule views. |
| 4 | `EmpireProfitSparkline` | 212-283 | Memoized 7-day profit SVG sparkline with dollar delta vs 7 days ago. |
| 5 | `ScheduleMatrixTable` | 287-779 | 7x24 shift coverage heatmap with per-cell break-even analysis, hover tooltip, and legend popover. Currently a self-contained function component. |

### B. Shared overlays / gateways (rendered before any view)

| # | Item | Lines | Description |
|---|------|-------|-------------|
| 6 | Notification toast | 1776-1846 | Top-center smartphone-style toast banner with deep-link destination. |
| 7 | Operations deck header | 1848-2079 | Page title, LIVE/OFFLINE/DEMO pill, live game clock, notification bell dropdown (with sound/banner toggles), "Check Connection" button, exit-demo button. |
| 8 | Mod version mismatch banner | 2081-2104 | Warning banner when `state.modVersion !== EXPECTED_MOD_VERSION` with download link. |
| 9 | Offline onboarding / diagnostic gateway | 2106-2410 | Shown when not connected: diagnostic terminal log stream, demo-mode banner, PNA permission banner, "mod connected - load a save" tip, and the main connect card (Steam/GitHub install options, launch + connect, browser permission instructions). |
| 10 | Store contextual alerts | 2413-2468 | Per-store alert strip shown only inside the command room. |

### C. Dedicated store command room (`activeStore` set)

| # | Item | Lines | Description |
|---|------|-------|-------------|
| 11 | Store command header + KPI | 2470-2519 | Store name/type/address, weekly sales/profit/score KPI panes. |
| 12 | Satisfaction + marketing panes | 2521-2586 | Satisfaction pillars grid and traffic multiplier grid. |
| 13 | `BusinessHistoryGraph` | 2589-2590 | Multi-metric performance graph (already a shared component). |
| 14 | Pricing & margins + expansion | 2592-2841 | Active product pricing table (with runout badges) and catalog expansion opportunities list. |
| 15 | Operating schedule advisory | 2843-3019 | Unstaffed-open, staffed-closed, closed-peak-day, suboptimal-window advisory cards. |
| 16 | `ScheduleMatrixTable` usage | 3021-3026 | Renders the 7x24 matrix inside the command room. |

### D. View tabs (driven by `currentView` search param)

| # | View | Lines | Description |
|---|------|-------|-------------|
| 17 | `overview` - Executive Overview | 3030-3489 | Status strip (net worth, cash, today profit, 7D sparkline, taxes, loans), Empire Action Radar feed, financial flow + fleet vitality dual panel. |
| 18 | `stores` - Commercial Storefronts | 3491-4146 | KPI ribbon, filter/search/toolbar, dense table view, card grid view, pagination. |
| 19 | `residences` - Real Estate | 4148-4710 | Wealth/lifestyle ribbon, subtab pills, filter toolbar, table + grid views, pagination. |
| 20 | `staff` - Workforce | 4712-5379 | Workforce metrics ribbon, filter/search toolbar, dense sortable staff table, pagination, highlight-on-navigate. |
| 21 | `logistics` - Logistics | 5381-5408 | Placeholder "Feature In Progress" card. The full logistics UI (5409-6182) is dead code gated behind `{false && ...}`. |
| 22 | `finance` - Finance & Treasury | 6184-6599 | Treasury/runway KPI strip, income statement, IRS tax + loan amortization panels, store-by-store unit economics leaderboard. |
| 23 | `analyzer` - Decision Analyzer | 6601-7205 | Top-3 quick wins strip, filter/search toolbar, suboptimal-stores accordion table. |
| 24 | `mod` - Mod Telemetry | 7207-7295 | Mod description, Steam/GitHub download cards, bug report callout. |

### E. Page wrapper

| # | Item | Lines | Description |
|---|------|-------|-------------|
| 25 | `LiveSyncDashboardPage` | 7305-7327 | Default export wrapping `LiveSyncDashboardContent` in `<Suspense>` (required for `useSearchParams`). |

---

## 2. Proposed Component Breakdown

### Shared utilities -> `web/src/lib/`

| File | Contents | ~Lines |
|------|----------|--------|
| `web/src/lib/products.ts` | `getCanonicalProductKey` (moved from `BusinessHistoryGraph.tsx`), `getItemImageSrc`, item-keyword matchers. | 140 |
| `web/src/lib/schedule.ts` | `DAYS_ORDER`, default day/hourly multipliers and peak hours, `parseRecommendedWindow`, `isHourOpenForSchedule`, shift role classifiers (`isCashier`/`isCleaner`/`isSecurity`/`isLogistics`), break-even helpers. | 180 |
| `web/src/lib/alerts.ts` | Pure selectors: `synthesizeOperationalAlerts`, `computeOpportunities`, `deriveOverviewData`, low-stock message parsing. | 260 |
| `web/src/lib/finance.ts` | P&L / treasury derivations (COGS, burn rate, runway, tax cycle, loan amortization). | 120 |

### View/panel components -> `web/src/app/live-sync/components/`

| File | Extracted from | ~Lines |
|------|----------------|--------|
| `BusinessLogo.tsx` | `renderBusinessLogo` | 90 |
| `EmpireProfitSparkline.tsx` | `EmpireProfitSparkline` | 85 |
| `ScheduleMatrixTable.tsx` | `ScheduleMatrixTable` (main 7x24 grid renderer + cell map) | 300 |
| `ScheduleMatrixTooltip.tsx` | hover tooltip logic/JSX (split from matrix) | 140 |
| `ScheduleMatrixLegend.tsx` | legend popover (split from matrix) | 110 |
| `NotificationToast.tsx` | toast JSX | 90 |
| `OperationsHeader.tsx` | deck header incl. clock + bell + toggles | 250 |
| `NotificationsDropdown.tsx` | bell dropdown panel (split out of header) | 160 |
| `ModVersionBanner.tsx` | version mismatch banner | 30 |
| `OfflineGateway.tsx` | diagnostic terminal + demo banner + PNA + connect card | 330 |
| `StoreContextualAlerts.tsx` | per-store alert strip | 70 |
| `StoreCommandRoom.tsx` | command header + KPI + satisfaction/marketing | 350 |
| `StorePricingPanel.tsx` | active prices & margins table | 230 |
| `StoreExpansionPanel.tsx` | expansion opportunities | 150 |
| `StoreScheduleAdvisory.tsx` | operating schedule advisory cards | 210 |
| `OverviewView.tsx` | Executive Overview | 400 |
| `StoresView.tsx` | stores KPI ribbon + toolbar (orchestrates table/grid) | 400 |
| `StoresTable.tsx` | stores dense table + pagination | 300 |
| `StoresGrid.tsx` | stores card grid + pagination | 160 |
| `ResidencesView.tsx` | real estate ribbon + subtabs + toolbar | 380 |
| `ResidencesTable.tsx` | real estate table + pagination | 230 |
| `ResidencesGrid.tsx` | real estate card grid + pagination | 120 |
| `StaffView.tsx` | workforce ribbon + toolbar (orchestrates table) | 380 |
| `StaffTable.tsx` | staff table + pagination | 260 |
| `LogisticsView.tsx` | placeholder card only (dead code deleted) | 40 |
| `FinanceView.tsx` | treasury KPI strip + layout (orchestrates sub-panels) | 200 |
| `FinanceIncomeStatement.tsx` | P&L income statement | 220 |
| `FinanceTaxPanel.tsx` | IRS tax + loan amortization panels | 180 |
| `FinanceUnitEconomics.tsx` | store-by-store leaderboard | 120 |
| `AnalyzerView.tsx` | quick wins strip + toolbar (orchestrates table) | 400 |
| `AnalyzerTable.tsx` | suboptimal stores accordion table | 300 |
| `ModView.tsx` | mod telemetry card | 90 |

`page.tsx` becomes a slim orchestrator (~250-300 lines): it keeps the shared `LiveSyncDashboardContent` state, hooks, and `useMemo` calls (delegating heavy logic to `lib/alerts.ts` and `lib/finance.ts`), then renders `OperationsHeader`, `ModVersionBanner`, `OfflineGateway`, and switches on `currentView` to render one view component (or `StoreCommandRoom` when `activeStore` is set).

### 400-line hard limit

GEMINI.md caps new components at ~400 lines. The view components listed at or near 400 lines (`OverviewView`, `StoresView`, `StaffView`, `AnalyzerView`) will likely cross that once imports and TypeScript prop types are added. Rule: if any view component exceeds 400 lines during implementation, extract its filter/search toolbar into a sibling `*Toolbar.tsx` file (for example `StoresToolbar.tsx`, `StaffToolbar.tsx`, `AnalyzerToolbar.tsx`) before continuing, and stop adding to that file. The 400-line limit is per file, not per view.

### State & hook ownership

Pagination state, search input state, and filter/dropdown/sort/view-mode state are owned by the view component that uses them and must move out of `page.tsx` into that view component. Examples: `storeSearchQuery`/`storePage`/`storeSortBy` live in `StoresView.tsx`, `staffSearchQuery`/`staffPage` live in `StaffView.tsx`, `analyzerSearch`/`analyzerFilter*` live in `AnalyzerView.tsx`.

`page.tsx` keeps only state that is shared across multiple views or that crosses the whole dashboard:

- Connection/telemetry state and session flags (`handshakeActive`, `hasCompletedHandshake`, `dismissedAlerts`, notification toggles + toast).
- `smoothClock` and its interpolation/pause-detection refs (used by the header and the overview).
- `activeStore` / `activeStoreDef` resolution (derived from `selectedStoreId` + `businesses`, consumed by the command room).
- Derived-data selectors (`activeAlerts`, `opportunities`, `overviewDerivedData`, `sortedBusinesses`, `unstockedProductOpportunities`) because they are consumed by more than one view (overview radar, analyzer, store command room, and the notification dropdown).

Any state consumed by only one view component is declared with `useState` inside that component, not lifted into `page.tsx`.

---

## 3. Phased Execution Plan

Each phase adds 3-5 files and only then is `page.tsx` re-wired to consume them, so `npx tsc --noEmit` passes after every phase.

### Phase 1 - Shared utilities + leaf primitives (no behavior change)
1. `web/src/lib/products.ts`
2. `web/src/lib/schedule.ts`
3. `web/src/app/live-sync/components/BusinessLogo.tsx`
4. `web/src/app/live-sync/components/EmpireProfitSparkline.tsx`

Also update `web/src/components/BusinessHistoryGraph.tsx` to import `getCanonicalProductKey` from `lib/products.ts` and delete its local copy. Standalone and testable: new files import only existing contexts/data, so `tsc` stays green.

### Phase 2 - Shared overlays & gateways
1. `components/ModVersionBanner.tsx`
2. `components/NotificationToast.tsx`
3. `components/NotificationsDropdown.tsx`
4. `components/OperationsHeader.tsx`
5. `components/OfflineGateway.tsx`

Wire these into `page.tsx` (replace inline JSX). Test with `tsc`.

### Phase 3 - Store command room
1. `components/StoreContextualAlerts.tsx`
2. `components/StoreCommandRoom.tsx`
3. `components/StorePricingPanel.tsx`
4. `components/StoreExpansionPanel.tsx`
5. `components/StoreScheduleAdvisory.tsx`

Wire into `page.tsx` (the `activeStore` branch). Test with `tsc`.

### Phase 4a - Schedule matrix split
1. `components/ScheduleMatrixTable.tsx`
2. `components/ScheduleMatrixTooltip.tsx`
3. `components/ScheduleMatrixLegend.tsx`

Wire the command room's matrix usage (import from `./components/ScheduleMatrixTable`, delete the local `ScheduleMatrixTable` function). Test with `tsc`.

### Phase 4b - Overview + Stores
1. `components/OverviewView.tsx`
2. `components/StoresView.tsx`
3. `components/StoresTable.tsx`
4. `components/StoresGrid.tsx`

Wire the overview and stores branches. Test with `tsc`.

### Phase 5 - Residences + Staff
1. `components/ResidencesView.tsx`
2. `components/ResidencesTable.tsx`
3. `components/ResidencesGrid.tsx`
4. `components/StaffView.tsx`
5. `components/StaffTable.tsx`

Wire the residences and staff branches. Test with `tsc`.

### Phase 6a - Finance + lib selectors
1. `web/src/lib/finance.ts`
2. `web/src/lib/alerts.ts` (promote derived-data selectors out of `page.tsx`)
3. `components/FinanceView.tsx`
4. `components/FinanceIncomeStatement.tsx`
5. `components/FinanceTaxPanel.tsx`
6. `components/FinanceUnitEconomics.tsx`

Wire the finance branch and switch `page.tsx` derived-data `useMemo` calls to the new lib selectors. Test with `tsc`.

### Phase 6b - Analyzer + Mod + Logistics
1. `components/AnalyzerView.tsx`
2. `components/AnalyzerTable.tsx`
3. `components/ModView.tsx`
4. `components/LogisticsView.tsx` (placeholder; delete the `{false && ...}` dead logistics block here)

Wire the analyzer, mod, and logistics branches. Test with `tsc`.

### Phase 7 - Cleanup & verification
1. Confirm the dead logistics code block (lines 5409-6182) was removed in Phase 6b.
2. Confirm `page.tsx` is a slim orchestrator; delete any now-unused inline helpers/imports.
3. Run `npx tsc --noEmit` from `web/`; run the app and spot-check each tab and the store command room for identical behavior.

---

## 4. Shared Utility Functions -> `web/src/lib/`

| Function / constant | Destination | Phase |
|---------------------|-------------|-------|
| `getCanonicalProductKey` | `products.ts` (also imported by `BusinessHistoryGraph.tsx`) | 1 |
| `getItemImageSrc` | `products.ts` | 1 |
| `DAYS_ORDER` | `schedule.ts` | 1 |
| Day/hourly multiplier + peak-hour defaults | `schedule.ts` | 1 |
| `parseRecommendedWindow` (regex `HH:00 - HH:00`) | `schedule.ts` | 1 |
| `isHourOpenForSchedule` (hoursOpen array vs start/end vs shifts fallback) | `schedule.ts` | 1 |
| Shift role classifiers (`isCashier`, `isCleaner`, `isSecurity`, `isLogistics`) | `schedule.ts` | 1 |
| Break-even / unprofitable-hour cell computation | `schedule.ts` | 1 |
| Alert synthesis (low-stock / unstaffed / stockout message parsing) | `alerts.ts` | 6a |
| Opportunity derivation (pricing, service, cleanliness, marketing, scheduling, operating hours) | `alerts.ts` | 6a |
| Overview derived data (health segmentation, top/lowest performer, unified action feed) | `alerts.ts` | 6a |
| Finance derivations (COGS, burn rate, runway, tax cycle, loan amortization) | `finance.ts` | 6a |

Note: `renderBusinessLogo` becomes the `BusinessLogo` component (returns JSX) rather than a `lib/` pure function.

---

## 5. Estimated Token Cost Per Phase (rough)

Estimates cover generated code plus the `page.tsx` wiring edits in each phase.

| Phase | Scope | Est. tokens |
|-------|-------|-------------|
| 1 | lib utilities + 2 leaf components + `BusinessHistoryGraph` import update | ~3,500 |
| 2 | 5 shared overlay/gateway components + header wiring | ~4,500 |
| 3 | 5 store-command-room components + branch wiring | ~4,500 |
| 4a | schedule matrix split (3 files) + wiring | ~3,500 |
| 4b | overview + stores (4 files) + wiring | ~3,500 |
| 5 | residences + staff (5 files) + wiring | ~5,000 |
| 6a | finance + lib selectors + wiring | ~4,500 |
| 6b | analyzer + mod + logistics + dead-code removal + wiring | ~3,500 |
| 7 | dead-code cleanup + final verification | ~1,000 |

Total rough estimate: ~32,500 tokens of generated/written output, with the largest single-file cost being the schedule matrix split (main grid ~300 lines + tooltip ~140 lines + legend ~110 lines, moved largely verbatim).
