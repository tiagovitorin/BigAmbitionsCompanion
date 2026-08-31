# Architecture & Technical Decisions (ADR)

## DECISION-001: Data Extraction Strategy
* **Date:** 2026-08-29
* **Status:** Superseded by DECISION-004
* **Context:** Big Ambitions stores game data (items, recipes, business parameters, buildings, prices) in Unity Addressables as compiled `ScriptableObject` assets rather than plain JSON/XML files in the game directory.
* **Alternatives Considered:**
  1. *Static DLL Reflection:* DLLs contain class definitions and method signatures, but NOT the actual asset data instances.
  2. *Static AssetBundle Parsing:* Addressables use complex catalog structures; parsing binary assets statically often loses custom serialization logic and tag lookups.
  3. *MelonLoader Runtime Mod Extraction:* Runs in memory after Addressables resolve.

---

## DECISION-002: Preservation of Raw vs. Normalized Data
* **Date:** 2026-08-29
* **Status:** Accepted
* **Context:** Raw extracted data reflects Unity internal field names, IDs, and raw multipliers. Normalization is needed for frontend consumption, but raw fidelity must never be lost.
* **Decision:** Establish a strict two-stage data pipeline:
  - `/data/raw/`: Direct, unmodified JSON outputs from the game engine.
  - `/data/normalized/`: Cleaned, validated, typed, localized, and cross-referenced JSON/SQLite schemas.
* **Rationale:** Allows re-running normalization and schema migrations at any time without having to re-extract from the game if normalization logic evolves.

---

## DECISION-003: Decoupled Simulation & Calculation Engine
* **Date:** 2026-08-29
* **Status:** Accepted
* **Context:** Calculations like factory outputs, employee salary negotiations, store revenue, and warehouse throughput should not be embedded inside UI components.
* **Decision:** Implement the simulation logic in pure, framework-agnostic TypeScript/JavaScript modules with unit tests.
* **Rationale:** Enables calculation logic to run in the browser, in Node.js scripts, in CLI benchmarks, or on an API server with identical deterministic results.

---

## DECISION-004: First-Party Native Mod Architecture (`BAModAPI`)
* **Date:** 2026-08-29
* **Status:** Accepted
* **Context:** Big Ambitions 1.0 includes native first-party mod loading (`BAModAPI` via `HGModLoader.cs` and `ModsLocal/`).
* **Decision:** Build all extractor mods and live telemetry companions using native `BAModAPI` rather than third-party injectors (MelonLoader / BepInEx).
* **Rationale:** Zero external dependencies, no risk of game anti-cheat or launcher crashes, native async lifecycle support (`[ModEntryOnCityLoad]`, `[ModEntryMainMenu]`), and seamless plug-and-play installation for any player.

---

## DECISION-005: Live Game Telemetry & Companion Sync Bridge (`BigAmbitionsLiveSync`)
* **Date:** 2026-08-29
* **Status:** Accepted
* **Context:** Players want real-time companion features on the website (live store inventory alerts, second-screen financial dashboards, employee strike warnings, automated supply chain reorder recommendations).
* **Decision:** Implement a lightweight local WebSocket server (`ws://127.0.0.1:34567`) inside a dedicated native companion mod (`BigAmbitionsLiveSync`):
  1. The mod hooks into `SaveGameManager.Current`, `BuildingManager.Instance`, and `FinancialSummaryHelper` during active gameplay (`[ModEntryOnCityLoad]`).
  2. Every in-game hour (or on-demand), the mod pushes a compact JSON telemetry delta to connected WebSocket clients.
  3. The website frontend automatically detects and connects to `ws://127.0.0.1:34567` (with zero cloud latency or privacy issues).
* **Rationale:** Enables a "Second Screen" experience where users play on one monitor and view live analytics, optimization recommendations, and logistics warnings on another.
