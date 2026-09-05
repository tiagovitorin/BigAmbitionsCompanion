# Changelog

All notable changes to the **Big Ambitions Companion** project (Game Mod + Web App) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), with clear component tagging (`[Mod]`, `[Web]`, `[Shared]`) tailored for GitHub developers and contributors.

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