# Changelog

All notable changes to the **Big Ambitions Companion** project (Game Mod + Web App) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), with clear component tagging (`[Mod]`, `[Web]`, `[Shared]`) tailored for GitHub developers and contributors.

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