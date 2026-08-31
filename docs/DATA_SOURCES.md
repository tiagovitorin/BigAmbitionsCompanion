# Big Ambitions Data Sources & Authority Hierarchy

## 1. Hierarchy of Truth

```
[Level 1: Authoritative Truth]
Live Game Memory & Addressable ScriptableObjects (Extracted via MelonLoader)
               ↓
[Level 2: Engine Implementation & Math]
Decompiled Assemblies in /Managed (Algorithm formulas, constants, constraints)
               ↓
[Level 3: Secondary External References]
Community databases (e.g., BiggerAmbitions.com, Steam Guides, Wiki)
```

## 2. In-Game Data Location Details
* **Unity Addressables Catalogs:** Packaged within `Big Ambitions_Data/StreamingAssets/aa/StandaloneWindows64/`.
* **Runtime Registries:** Loaded via `BigAmbitions.SaveSystem.AddressableLoader.RegisterAll()`:
  - `ItemsGetter.AllItems`
  - `BusinessTypeHelper.AllBusinessTypes`
  - `FactoriesHelper.AllRecipes`
  - `FactoryWorkstationHelper.AllFactoryWorkstations`
  - `BuildingHelper.AllBuildings`
  - `CustomerDemandHelper.AllCustomerDemands`
  - `NeighborhoodHelper.AllNeighborhoods`
  - `SkillHelper.AllSkills`

## 3. Discrepancy Protocol
Whenever game internal data conflicts with third-party community websites:
1. Decompiled assembly logic is inspected to understand internal computation.
2. Extracted memory values are verified.
3. The discrepancy is documented in `KNOWN_ISSUES.md` and `PROJECT_STATE.md`.
4. The authoritative in-game value is adopted.
