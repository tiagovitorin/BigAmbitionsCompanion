# Changelog

All notable changes to the **Big Ambitions Companion** project (Game Mod + Web App) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), with clear component tagging (`[Mod]`, `[Web]`, `[Shared]`) tailored for GitHub developers and contributors.

---

## [2.5.0] - 2026-09-13

### Features
- `[Web]` Demo Mode now shows a full, deterministic Day 96 empire generated from the same world the local mock serves, and it is regenerated automatically on every build so it always matches the mock.
- `[Web]` The Supply Chain Flow map node panel is rebuilt as a larger, scrollable detail card with real, per-node insights. Stores show daily revenue/profit, satisfaction, a covered/tight/short supply health summary, the worst shortages before the next delivery, checkout supply (bag) runway, inbound routes and contracts, and the top sellers of the last 7 days. Warehouses show SKUs, units, inbound imports, a stock-runway watch list with bars, and outbound coverage including which stores it is shorting. Importers and wholesalers show their orders/deliveries per target, totals and next delivery day. It also has a pin toggle and a jump to the relevant Live HQ page.
- `[Web]` Every car, truck, van and boat now has a real, colour-tinted render baked offline from the game's own 3D models (previously only 128px showcase thumbnails were available, and the electric scooter had no art at all). The renders are transparent, much sharper, and the paint colour comes from the game's own vehicle-colour palette.
- `[Web]` Market Demand is now a decision tool rather than a bare heatmap: a KPI strip (strong markets, your coverage of them, whitespace count, and the single best untapped product), an Opportunity score on the "Not selling yet" list (demand relative to how many rivals already sell it), factual signal badges for a would-be monopoly, a cheap import price, and long-unsold "hype-primed" products, a best-neighbourhood marker per business type, and a new Neighbourhoods tab that ranks districts by unserved strong demand so expansion targets are obvious.
- `[Web]` Store-by-Store Unit Economics is now a real contribution-margin dashboard: a summary strip (combined weekly revenue, contribution margin, weekly profit, and how many storefronts are losing money), a 14-day revenue sparkline per store, sortable columns, and a full P&L breakdown per storefront (revenue, cost of goods, contribution, rent, labour, other, profit), each net margin compared against the median of its business type, with a blended totals row.
- `[Web]` The Chains & Brands page is now a portfolio dashboard rather than a bare list: the page title shows in the top header bar (like every other view), followed by four working KPI cards (combined revenue with its week-on-week move, combined profit with how many chains are profitable, overall margin with a gauge and the best-margin chain, and the top contributor by profit with its share), and a sortable table where every chain row carries its own inline profit bar (green up, red down) alongside its brand logo, composition (shops, depots, factories, offices), net margin, week-on-week change, and share of total profit.
- `[Web]` The top header now shows the correct page title for every Live HQ view, including all the newly split pages (Chains, Purchase Orders, Depot Draw, Income Statement, and so on).
- `[Mod]` Telemetry now includes each building's currently fulfilled customer demands (`cachedFulfilledCustomerDemands`).
- `[Mod]` Owned real estate now reports its market value and the neighborhood market rent per square meter, and buildings for sale now include their neighborhood and building type.
- `[Web]` The Properties page is now built around real estate as a portfolio: a "Real Estate Net Worth" strip and a Rental Portfolio table with occupancy bars, rent per sqm against the neighborhood market rate (below / at / above), pending rent changes, weekly net, annual ROI, and market value vs cost, plus a Market Watch section listing buildings for sale priced against your own portfolio average.
- `[Web]` Each store now has a Customer Amenities checklist: every amenity its business type asks for (music, employee uniforms, interior design, toilet, sink, and so on), marked met or missing. Missing amenities also raise an Operations lever in the Decision Analyzer.
- `[Web]` The Decision Analyzer now has a Hype Exposure panel: what each running hype wave is worth, measured against the shop's own pre-wave trading or a same-kind shop where no wave is running, and an honest "no baseline" when neither exists.
- `[Mod]` Factory telemetry now includes every assembly machine's workstation, selected recipe and priority.
- `[Web]` Logistics now has a "Factory Production & Feed" panel: each factory's lines (machines x the recipe's rated hourly output x 24), how fully each line is staffed out of 168 hours a week, and the raw-material draw per day and per week that keeps the lines fed.
- `[Web]` The Decision Analyzer now has a Market Demand grid: strong-demand counts by business type per neighbourhood (with a ring marking where you already run that type) and a ranked "Not selling yet" list of strongly-demanded products you do not sell in that neighbourhood.
- `[Web]` Logistics now has a "Depot Draw & Ordering" panel: idle stock held far beyond what flows through it, and each weekly import order checked against the warehouse's measured draw (covered / tight / short). It is separated into a collapsible card per warehouse with a warehouse filter, a priority filter, and sorting.
- `[Mod]` Telemetry now carries the last 14 days of hourly customer readings per store, the customer-service counters with their per-hour capacity, and each work shift's posted counter and type (cleaning duty vs station post).
- `[Web]` The store's weekly schedule matrix now has a Schedule / Capacity view toggle; the Capacity view is a heatmap of measured customers versus staffed counter capacity versus the building's door cap, with at-ceiling and idle hours highlighted.
- `[Web]` Cash Flow Reconciliation rebuilt on the game's own cash history: a profit-vs-cash chart and a plain-English takeaway showing how much profit was reinvested into stock and setup, available on first load (no browser-side ledger or waiting).
- `[Web]` Fleet Vitality now shows the top three and bottom three storefronts side by side instead of a single best and worst.
- `[Web]` Uncle Fred's floating bubble is now draggable and glides to the nearest side border, remembers its position between pages, and resets to the bottom-right corner on a full refresh.
- `[Web]` Uncle Fred's chat now opens toward the free side (to the right when he sits on the left, to the left when he sits on the right), and the widget returns to its exact resting spot when the chat closes or the window is resized.
- `[Web]` Dragging Uncle Fred while his chat is open now tucks the panel away for the move and reopens it once he settles on the border.

### Improvements
- `[Web]` The standalone (MelonLoader) download button now opens the latest GitHub Release instead of downloading a bundled zip, so it always points at the newest version.
- `[Web]` Uncle Fred now knows about the systems Live HQ surfaced: each store's ledger flags when checkout supplies (paper bags) are about to run out, the empire ledger gained an "HQ & Management" line (headquarters + HR/pricing/headhunter plan counts), and the workforce line shows health-insurance and HR-manager coverage. Per-store lines also include rent, capacity, and staff on duty. His prompt gained matching guidance (restock bags, what a Headquarters unlocks). His output token cap was raised to 8192 and recent chat history to 8 turns.
- `[Web]` Removed the per-unit cost line under checkout supplies in the store's Active Prices & Margins table.
- `[Web]` The Decision Analyzer no longer raises "Optimize price" levers for checkout supplies (paper/plastic bags) or service fees, which cannot be sold. The category filter also gained the missing Operating Hours and Stock entries, and the category labels are now localized.
- `[Web]` People view staff now show the real workplace name in the "Business" column instead of a street address. Warehouse staff match the warehouse stream (e.g. "Lagerhaus") and HQ staff match a new headquarters stream, both shown as plain text with no link. The mod now emits an `headquarters` array (name, address, rent) instead of silently skipping HQ buildings, so the actual HQ name is available.
- `[Web]` Headquarters staff on the People view now show the HQ name in the "Business" column instead of its street address (and are not linked, since HQ is not a storefront). HQ buildings are filtered out of the business lists, so the telemetry context now keeps a separate `headquarters` stream instead of discarding HQ entirely, and the view falls back to "Headquarters" when the building has no name.
- `[Web]` On the People view, the "Assigned Location" column is now "Business": it shows the employee's business name linked to that business's command room instead of the raw street address. The mod reports the assigned address, so the row is matched to the business by address (and by name for the demo data).
- `[Web]` Uncle Fred is now chat-only. The random coaching speech bubbles, their pop-up timer, the static fallback tips, and the related in-chat tip injection have been removed; he opens from the floating avatar and only answers when you ask. The "Occasional In-Game Speech Bubbles" setting and the coaching-tips prompt section (which cost extra tokens) are gone too, and the "Show Uncle Fred Bubble" setting now reads "Show Uncle Fred".
- `[Web]` Wrapped the remaining hardcoded Uncle Fred strings (API-key validation errors and the store link tooltip) in translations.
- `[Web]` The People view's "Weekly Cost" column now sorts by the real weekly cost (hourly wage x contracted hours) instead of the hourly wage, so a cheap worker with many hours correctly costs more than an expensive one with few. The figure comes from the game's own `weeklyWages`, falling back to wage x hours.
- `[Web]` The People view's "HR & Benefits" column is now two columns: "HR Manager" and "Benefits" (health insurance). The HR manager's name is a link that clears the filters, scrolls to that employee's row and highlights it.
- `[Mod]` Employee telemetry now includes each worker's assigned HR manager and health insurance plan, resolved from the game's HR manager plans (`assignedHrManagerPlanId` -> `HrManagerPlan.HrManagerInstance` and `healthInsurancePlan.planType`). The People view's HR & Benefits column now syncs real values instead of always showing Unassigned / No insurance.
- `[Web]` Supply Chain Flow node panels are now free-floating windows: drag their header to move them anywhere, and the pin button keeps a window open. Escape or a click anywhere outside the windows closes every unpinned one, so pinned windows can stay open side by side while you compare stores and warehouses.
- `[Web]` Fixed clicking a node on the Supply Chain Flow map not opening its detail window. The map captures the pointer on the SVG while dragging, which makes the browser retarget the click away from the node, so a press that does not move is now treated as a click in the pointerup handler. Dragging is unchanged.
- `[Web]` Item icons in the store's Active Prices & Margins table now come from the game's own extracted icon catalogue (`game_item_icons.json`, 748 items) instead of a short hardcoded pattern list, so products like Fresh Food, Frozen Food and Energy Drink show their real icon.
- `[Web]` Checkout supplies (paper and plastic bags) are now tracked across Live HQ. They appear in the store's Active Prices & Margins table with on-hand stock, measured daily usage, a runout estimate and the game's wholesale cost per unit (they stay free to customers), a store's Inventory Status flips to Stockout or Low Buffer when its bags run out, and an open store with no bags raises a critical restock alert and an Analyzer lever. Bags have no sell price, but running out stops bagging at the register, so they are treated as critical stock rather than a hidden supply.
- `[Web]` Fixed the sidebar rows for Items Database, Real Estate Portfolio and Vehicles & Fleet sitting taller than every other nav row (their inner link was stacking an extra min-height on top of the row padding).
- `[Web]` Vehicle specs on the Vehicles page are now the game's own values, extracted from the game's vehicle types (price, cargo, fuel, top speed, auto-park, tax/luxury flags, hand-truck/flatbed support, required driver skill and delivery routes) instead of hand-written estimates. The curated bits that are not in the save (display name, category, dealership, art, description) are kept.
- `[Web]` The Vehicles page now lists boats alongside cars (a Boats entry in the filter dropdown, no separate tab) with their in-game prices (Speedboat, Yacht, and the tax-deductible Luxury Yacht). The hand cart and dolly were removed (they are temporary equipment, not vehicles) and the electric scooter is flagged as rent-only with a badge and a rental price label. The tax badge now correctly reads "Tax Deductible".
- `[Web]` The About page was rebuilt around data provenance instead of an invented reverse-engineering story. It now states plainly that Big Ambitions ships managed C# assemblies (not IL2CPP), shows the real three-step pipeline (read the game, normalize with scripts/normalize.py, bundle as static data), lists the datasets and exact record counts (690 items, 44 businesses, 885 buildings, 62 recipes, 20 vehicles), and shows the actual formulas behind the calculators (social-class price index with a monopoly bonus, marketing reach, and factory skill scaling). The formulas that did not match the code were corrected and the unverifiable "AssetStudio / Schema Parser" and "Source Unity Class" claims were removed.
- `[Web]` The Live Architecture page was rebuilt around the real system architecture rather than a settings guide: the four-layer pipeline (game, mod bridge, loopback transport, web app) with its optional side services, the building blocks (the shared C# telemetry engine, the loopback HttpListener, the dual Steam Workshop / MelonLoader targets, the Next.js frontend, the game compendium, Uncle Fred AI, online voice, and reports), a step-by-step refresh flow, the tech stack, and the safety and privacy boundary. The voice is now described correctly as an online, serverless text-to-speech engine (local only as a development fallback), and the stale v2.2.0 build and made-up binary hashes were removed.
- `[Web]` Live HQ navigation is now a grouped, always-visible tree in the sidebar instead of flat links: Dashboard, Stores (All Stores, Chains & Brands), Workforce, Supply Chain (Network, Warehouses, Production, Fleet), Property (Private Residences, Owned Investments, Unused Leased Spaces), Money (Income Statement, Cash Flow Reconciliation, Tax Position, Store Unit Economics, Investment Funds), Intelligence (Decision Analyzer, Hype Exposure, Market Demand), and Setup & Support. Each panel that used to be stacked on one long page now has its own focused page, and the business page has Overview / Performance / Pricing / Schedule sections.
- `[Web]` Factory Production & Feed now costs each resource at the game's own wholesale price (per unit and per day), with a total feed cost per day and week for a full 24/7 run; resources the game does not price are listed but left out of the total rather than guessed.
- `[Web]` The "Suboptimal Locations Requiring Attention" table is more compact and now scrolls within its card, with the column header pinned while you scroll.
- `[Web]` On Chains & Brands, every shop listed under a chain is now clickable and opens that business's own page.
- `[Web]` The business page is now one scrollable page with clear section separators (Overview, Performance, Pricing, Schedule) instead of swapping between four separate tab pages; the sidebar business items scroll to each section and a scroll-spy highlights the section you are viewing. Legacy `?tab=` deep links (from alerts) still jump to the right section.
- `[Web]` The supply chain is no longer six thin pages. It is now one page with anchored sections (Network, Warehouses, Production, Fleet): the sidebar items take you there and smooth-scroll to each section, and a scroll-spy highlights it. The flow map and the purchase order radar sit together under Network, and warehouse inventory now sits with depot draw, where they belong.
- `[Web]` The sidebar keeps its scroll-anchor section items only for pages that are long enough to need them. Supply Chain still has Network / Warehouses / Production / Fleet, but Property is now a single sidebar item (with a total holdings count) because the page is short enough to read in one go.
- `[Web]` Every sidebar button now shares one uniform row height, so rows with badges no longer sit taller than rows without them.
- `[Web]` Settings > General now has a "Show Uncle Fred Bubble" toggle, so you can hide the floating Uncle Fred helper and bring him back whenever you want.
- `[Web]` Money is no longer five thin pages. Income Statement, Cash Flow Reconciliation, and Tax Position are now one "Finance & Treasury" page (the treasury KPI strip on top, then the three reports stacked with sidebar anchors); Store Unit Economics and Investment Funds remain their own pages.
- `[Web]` Investment Funds is now its own dashboard page (Money > Investment Funds): a portfolio summary (value, cost basis, unrealized gain, interest today), a filled area performance chart you can filter to any single fund or "All funds", shown side-by-side with a portfolio allocation donut, and per-fund tiles with a balance sparkline, a risk badge, return %, and the fund's yearly return cycle (each cycle bar has a hover tooltip, and the cycle has a "?" explaining it). A Cards/List view switcher turns the tiles into a compact table. It uses the game's own recorded fund history and catalog data, with no forward projections.
- `[Mod]` Investment fund telemetry now includes each fund's day-by-day development history, its risk tier, and its yearly market-change cycle (from the game's InvestmentFundHelper / InvestmentFundData).
- `[Web]` Fixed the sidebar's last section link (Investment Funds) not scrolling or highlighting properly: the scroll-spy now selects the last section when the page is scrolled to the bottom, and jumping to a section on another page waits for it to mount instead of firing once too early.
- `[Web]` The Tax Position "Recommended Minimum Cash Reserve" is no longer an arbitrary week of costs: it is now your outstanding tax bill plus any projected operating shortfall up to the next filing day, and it is shown as a whole dollar amount.
- `[Web]` Replaced the overloaded sparkles icon around the app with icons that match what each control actually does (wallet for the reserve, smile for satisfaction, radar/target for the analyzer, and so on).
- `[Web]` The Supply Chain Flow map got a big visual upgrade: nodes freely rearrange as a force graph, edges are curved and carry animated particles moving in the delivery direction (colour = fulfillment), hovering or selecting a node traces its routes while everything else dims, and a Fit to view button frames the whole graph. It respects reduced-motion and was split into smaller components.
- `[Web]` You can now drag a supply cluster on the map: the node you grab leads and its connected nodes chase it like a string of balloons (each hop trails the one ahead) before settling wherever you drop it, rather than the whole cluster sliding rigidly. Double-click still pins a single node.
- `[Web]` The Supply Chain Flow map now spreads its nodes horizontally on wide screens and vertically on tall ones, so more of the graph is visible at once, and separate supply clusters are arranged on a ring so they never overlap.
- `[Web]` The Supply Chain Flow map is now far more interactive: hover a node or an edge for a quick tooltip, click an edge to isolate it, select a node to trace its whole upstream and downstream chain, grey out everything except short / tight / covered routes, search and fly to any store or depot, and double-click a node to pin it where you drop it (positions and pins are remembered across refreshes). Problem routes get a colored alert ring and a legend explains the colours.
- `[Web]` Opening a business now shows it in the sidebar as a bordered "Active Business" card directly under All Stores (logo, name, type, and its Overview / Performance / Pricing / Schedule tabs stacked vertically) instead of loose links that read like top-level navigation, and the card slides open when it appears and slides closed when you leave the business.
- `[Web]` Dropdowns, modals and panels now animate as intended: the `animate-in` fade / zoom / slide classes were previously inert because the Tailwind animation plugin was missing from the build.
- `[Web]` The Hype Exposure panel now shows a before/while comparison (two bars on one scale with a "+$X/day extra" callout and a plain sentence) instead of a dense paragraph.
- `[Web]` Purchase Order Radar is now organized by delivery day (collapsible day cards with a day total), with a source filter (imports / store deliveries), sorting, and collapse-all.
- `[Web]` Supply Chain Flow store nodes now show the player's own designed business logo when they have one (falling back to the business-type icon), and item rows fall back to a generic package icon when the game has no icon for the item.
- `[Web]` Purchase Order Radar now shows where each order is headed (the warehouse or store), by name.
- `[Mod]` Warehouse telemetry now includes the warehouse's own name (previously only the address); `[Web]` Warehouse Inventory and Depot Draw & Ordering now show that name instead of the street address.
- `[Web]` Settings > Alerts now presents every alert control with a colored icon and a one-line description, so what each toggle does is clear at a glance.

### Fixed
- `[Web]` Fixed Demo Mode dropping back to the "connect" state after a moment (an in-flight offline poll could override the demo telemetry).
- `[Web]` A supply-only chain (like the "Support & production" group of factories, depots and head office) no longer reports a week-on-week movement; with no shops to compare it now shows "Insufficient data", and the same follows on any save where a catch-all group has no trading sites.
- `[Web]` The Chains & Brands "Support & production" row now shows a factory glyph instead of a stray fast-food storefront icon (the shared business-icon fallback has no factory/warehouse entry).
- `[Web]` Supply Chain Flow now shows a factory glyph for factories (and a storefront glyph for other unlisted business types) instead of a bare question mark.
- `[Web]` Store pricing now flags a price above the optimal as High (it loses sales and lowers price satisfaction) and raises a "Lower Price" lever in the Analyzer, and the capacity view renders zero-customer hours as a grey dash rather than green.
- `[Web]` Store rankings, the Stores directory, the Decision Analyzer, and the Store-by-Store Unit Economics table now consider storefronts only; factories, warehouses, depots, and head office are excluded.
- `[Web]` The Stores list is now a single scrollable list with a sticky header instead of paginated pages (both table and grid views).
- `[Web]` Dragging Uncle Fred no longer triggers the browser's native image drag.
- `[Web]` Opening or closing Uncle Fred's chat no longer shifts the widget; it is anchored by the avatar's corner so the panel grows and shrinks without jumping.
- `[Web]` Fixed the sidebar keeping a Supply Chain or Property section highlighted after you left that page; the highlight now only applies while that page is actually open.
- `[Mod]` Business expense history now uses the game's real cost formula. `expenses` is `TotalResources + TotalOngoing` (previously salaries and rent were counted twice, because the game's `TotalOngoing` already includes both, and the cost of goods sold was missing), and the 7-day empire expense aggregate was corrected the same way, so `revenue - expenses` now equals the game's `TotalProfit` on the business history chart.
- `[Web]` Factory "output now" (the live per-hour figure) no longer inflates: it only counts shifts on the current game day of the week instead of summing the same hour across every scheduled day (which multi-counted a Monday-Friday line by up to 5x).
- `[Web]` Tax timing now includes the game's 20-day grace period (`TaxHelper.DaysToPayOnFirstWarning`). The Finance & Treasury strip and the Tax Position panel show the real payment deadline (a Day 60 bill is due Day 80) and the recommended cash reserve covers any projected shortfall up to that deadline.
- `[Web]` Factory export-rate estimates now average over the remaining window days after dropping a one-off bulk-shipment day (dividing by `span - 1`), so the ongoing rate is not deflated by the full window.

### Bug Fixes
- `[Web]` The Hype Exposure page (`?view=hype`) no longer renders a blank page when no hype wave is running; it now shows an empty state explaining that waves will appear here once one starts.

---

## [v2.4.0] - 2026-09-09

### Features
- `[Mod]` Expanded telemetry payload with vehicles, boats, investments, rivals, market events, product market demand, buildings for sale, candidate employees, recruitment campaigns, delivery contracts, diplomas, todo tasks, and manager plans (logistics, headhunter, HR, pricing).
- `[Mod]` Added game difficulty/multiplier settings, achievements, neighborhood stats, happiness modifiers, and native player income/business-count history to telemetry.
- `[Mod]` Enriched employee (worked hours, training, poach/replacement status, age, gender, bonus), loan (bank, paid amount), real estate (occupancy, pending price), and business (marketing detail, theft, deposit, takeover) telemetry.
- `[Web]` Added TypeScript interfaces for all new telemetry streams (schema parity with the mod).
- `[Shared]` Property and business addresses now match the game's own street names and format across live telemetry and the web compendium (for example "45 3rd Street" instead of "Thirdstreet 45").
- `[Mod]` Residences are now classified by the building's real type (like the game's ledger) instead of "has no business", and empty leased commercial spaces are reported as a new `emptyLeasedSpaces` stream so players can find rent they are wasting.
- `[Web]` Rebuilt the Residences view into Private Residences, Owned Investment Properties, and an "Unused Leased Spaces" rent-leak section with real district, size, and ownership data (no more fabricated labels).

### Improvements
- `[Mod]` Added `BigAmbitions.Neighborhoods` assembly reference to support neighborhood stats export.
- `[Mod]` Address formatting now resolves street names through the game's runtime localization (`AddressHelper`), so telemetry matches the in-game UI exactly, with a clean number-first fallback.
- `[Mod]` Residence and owned-property telemetry now includes neighborhood/district, building type, size, owned-vs-rented, and lease start day.
- `[Web]` Real estate compendium data regenerated with game-localized street display names via the data extractor's new street names dump.
- `[Web]` Reworked the Settings experience: a new settings button with a first-run hint sits in the top navigation, the modal is organized into General / Connection / Alerts tabs, alert sound and pop-up banners moved into the unified settings store (with legacy migration), and previously non-functional alert toggles (zero-stock, unstaffed shifts, employee morale, tax warnings) are now actually wired to the alert engine.
- `[Web]` Alert engine rebalance: stock alerts are aggregated to one per store (no more dozens of per-product rows), only apply while a store is actually open, no longer duplicate between mod and web, and low-stock warnings now respect a precise threshold that can be set to Off.
- `[Web]` Added notification noise controls: Do Not Disturb (silences pop-ups/sound, feed stays live), "only interrupt for critical alerts", and a toast cooldown, all persisted per user.
- `[Web]` Bug reports are now self-sufficient by default: every bug report auto-attaches a privacy-scrubbed telemetry snapshot, performance/crash reports surface a save-file helper with an explicit consent checkbox, and screenshots can be pasted straight from the clipboard.
- `[Mod]` Added an on-demand diagnostics export (`?export=diagnostics`) that generates a small, privacy-scrubbed summary straight from the running save (empire scale, order-history sizes, and the measured mod build time) with zero impact on the normal sync loop.
- `[Web]` Lag, crash, and wrong-number reports now require the generated `mod-diagnostics.json` (with a contents preview + consent), while save files remain an optional manual add.
- `[Mod]` Enriched the on-demand diagnostics export with per-store staff loads, warehouse product/pallet weight, rolling telemetry build-time stats (min/avg/max), approximate save-file size, and the Player.log path for crash debugging.
- `[Web]` Bug and suggestion reports now land as tagged forum posts in dedicated Bug/Suggestion Discord forums (bot-delivered) with a webhook fallback so a report is never lost.
- `[Mod]` Diagnostics are privacy-safe by default: no save filename is shared and the Player.log path is trimmed to `LocalLow\...` onward (no Windows username).
- `[Web]` The Analyzer now shows factual current-to-recommended lever data instead of fabricated "Potential Weekly Gain" figures, with a documented non-monetary urgency score.
- `[Web]` Workforce list is now a single scrollable table (pagination removed), "Market Intelligence & Rivals" is behind a "Soon" card on the Analyzer, and the Logistics page shows a "Work in Progress" banner.
- `[Web]` UX polish: every modal closes on Escape, the notifications popover closes on outside click, and the Settings tabs slide smoothly.

### Fixed
- `[Web]` Warehouse "Reorder Runway" set to Off now disables ALL warehouse runway alerts (critical alerts previously kept firing).
- `[Web]` Refreshing Live HQ no longer flashes a stale "connected" state before the connection is revalidated.
- `[Web]` Removed misleading dead settings ("Pause When Tab Inactive", "Pricing Satisfaction Floor") that had no effect.

---

## [v2.3.1] - 2026-09-05

### Fixed
- `[Web]` Fixed false positive mod version check mismatch warning.

### Features
- `[Web]` Added panoramic city skyline hero banner component to the home landing page.

### Improvements
- `[Web]` Updated vector/PNG brand logo and favicon assets across navigation bar and tabs.
- `[Mod]` Updated Steam Workshop preview artwork (`preview.png`).

---

## [v2.3.0] - 2026-09-05

### Features
- `[Shared]` Added in-app Bug Report tool with automated diagnostic snapshot and save game folder helper.
- `[Mod]` Added business financial history, daily customer volume, and sales order data export to telemetry payload.
- `[Mod]` Added player custom business logo shape and sign color export from save files.
- `[Web]` Added interactive financial history charts and business performance breakdown.
- `[Web]` Added player custom business logos rendered directly in store headers and lists.
- `[Web]` Added deep-linking from staff issue alert toasts directly to the target employee in the staff table.

### Improvements
- `[Web]` Restricted store stockout warning detection strictly to products with physical retail shelves.
- `[Web]` Refined neighborhood price ceiling elasticity algorithm.
- `[Web]` Staff alert selection automatically highlights and scrolls to matching employees.
- `[Mod]` Optimized JSON serialization to reduce telemetry loop memory allocations.

### Fixed
- `[Shared]` Fixed Headquarters being misclassified in business count and retail pricing tables.
- `[Web]` Fixed false unstaffed store alerts triggered by off-hour preparation and cleaning shifts.
- `[Web]` Fixed negative net worth formatting to properly display `-$X` rather than `$-X`.
- `[Web]` Fixed bug report modal backdrop dismiss on outside click.
- `[Web]` Fixed clipboard copy action falling back on non-HTTPS origins.

### Removed
- `[Web]` Removed service fees and non-physical goods from inventory stockout warnings.

---

## [v2.2.1] - 2026-09-02

### Features
- `[Web]` Added Unstaffed Open Hours alert detection in Decision Analyzer.
- `[Web]` Added Suboptimal Schedule suggestions based on peak customer rush windows.
- `[Web]` Added alert toast notifications with optional audio chime.
- `[Web]` Added audio mute and notification preference controls.

### Improvements
- `[Web]` Implemented automatic reconnection on page refresh without manual user intervention.
- `[Web]` Standardized telemetry polling interval to 1.5s default.
- `[Web]` Added threshold slider controls for customer satisfaction alerts.
- `[Mod]` Hardened local HTTP listener origin validation and security checks.
- `[Mod]` Optimized telemetry packet byte size for local loopback transfer.

### Fixed
- `[Web]` Fixed page layout flickering and hydration flashes when reloading `/live-sync`.
- `[Web]` Fixed runtime navigation crash caused by `isLiveWorkspace` evaluation order.

### Removed
- `[Web]` Removed legacy manual "Check Connection" button requirement.

---

## [v2.2.0] - 2026-08-31

### Features
- `[Shared]` Initial release of dual-target Live HQ Telemetry Bridge (Steam Workshop API + MelonLoader).
- `[Mod]` Embedded zero-dependency HTTP micro-server binding to `127.0.0.1:8765`.
- `[Web]` Interactive Store Builder, Factory Production Optimizer, and Dynamic Pricing Advisor.
- `[Web]` Live HQ Command Deck with 7x24 staff scheduling, hourly rush radar, and supply chain tracking.