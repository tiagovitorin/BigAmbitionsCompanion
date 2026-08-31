# Big Ambitions Companion

A business management suite, dynamic pricing calculator, factory production planner, and live game telemetry bridge for Big Ambitions.

- **Web Application:** [bigambitionscompanion.vercel.app](https://bigambitionscompanion.vercel.app)
- **Supported Game Versions:** Big Ambitions Early Access (v0.6+ / v0.7+)
- **License:** MIT

---

## Overview

Big Ambitions Companion provides tools and calculators to help manage and scale businesses in Big Ambitions. It includes economic models for retail pricing and factory manufacturing, complete item and building databases, and an optional telemetry mod that streams live save game data to a web dashboard on a secondary screen.

---

## Core Features

- **Dynamic Pricing Calculator (`/pricing`):** Calculates optimal customer satisfaction pricing based on district demographics (Midtown, Garment District, Hell's Kitchen, Murray Hill), wholesale baseline costs, and market demand curves.
- **Factory Production Planner (`/factories`):** Models input bill-of-materials, machine counts, worker skill levels (0% to 100%), and daily logistics requirements across all 62 production recipes.
- **Real Estate Database (`/real-estate`):** Search and filter all 885 properties across New York by district, square meters, daily rent, and purchase price.
- **Item & Business Directory (`/items`, `/businesses`):** Wholesale import pricing, retail margins, supplier delivery schedules, and recommended store traffic hours.
- **Live HQ Telemetry Bridge (`/live-sync`):** Connects to a running game session to display real-time cash balance, daily revenue, 7-day employee schedules, and store alerts.

---

## Mod Architecture & Telemetry

The companion mod reads current game state and serves a local JSON endpoint for the web interface. Both Steam Workshop and standalone releases are compiled from a single shared engine.

```
Big Ambitions Game Process
  │
  ├── Steam Workshop Mod (Big Ambitions Mod API)
  │     └── Telemetry Engine (Shared C# Core)
  │
  └── MelonLoader Standalone (Optional Mod Loader)
        └── Telemetry Engine (Shared C# Core)
              │
              └── HTTP JSON Server (http://127.0.0.1:8765/)
                    │
                    └── Web Dashboard (bigambitionscompanion.vercel.app)
```

### Telemetry Security & Privacy

- **Localhost Only:** The mod binds strictly to `127.0.0.1:8765`. No data is ever sent to external servers or cloud services.
- **Read-Only:** The telemetry engine only reads in-memory game state (financials, employee shifts, store inventory). It cannot modify save files or alter game state.
- **Minimal Overhead:** Telemetry updates run asynchronously at regular intervals with negligible CPU impact.

---

## Installation

### Option 1: Steam Workshop (Recommended)
1. Subscribe to **Big Ambitions Companion (Live HQ)** on the Steam Workshop.
2. Launch Big Ambitions and ensure the mod is enabled in the in-game Mods menu.
3. Open [bigambitionscompanion.vercel.app/live-sync](https://bigambitionscompanion.vercel.app/live-sync) in your browser.

### Option 2: Standalone (MelonLoader)
1. Install MelonLoader for Big Ambitions.
2. Download `AmbitionProSync-Mod.zip` from the GitHub Releases page.
3. Extract `AmbitionProSync.dll` into your game's `Mods/` folder.
4. Launch the game and open the Live HQ dashboard.

*Note for Google Chrome users:* If the dashboard does not connect, click the tune/sliders icon on the left side of Chrome's address bar and set **"Apps on device"** to **On** to permit localhost connections.

---

## Building from Source

### Prerequisites
- Node.js 18+ and npm
- .NET SDK (target runtime `net472`)

### Web Application
```bash
cd web
npm install
npm run dev
```

### Mod Dual-Target Build Script
To build both the Steam Workshop and MelonLoader packages:
```powershell
powershell -ExecutionPolicy Bypass -File .\build-mods.ps1
```
- MelonLoader archive: `web/public/downloads/AmbitionProSync-Mod.zip`
- Steam Workshop package: `dist/SteamWorkshop/BigAmbitionsCompanion/`

---

## License

MIT License. See `LICENSE` for details.