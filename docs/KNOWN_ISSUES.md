# Known Issues, Nuances & Discrepancy Log

## 1. Engine & Data Nuances
- **Addressables Deferred Loading:** In Big Ambitions, some Addressables are loaded in stages (`RegisterMainMenu` vs. `RegisterAll` vs. `RegisterBlueprintCreator`). The data extractor must invoke `AddressableLoader.RegisterAndLoadAll()` or wait for complete scene initialization to ensure 100% of assets are populated in memory.
- **Circular References in ScriptableObjects:** Certain Unity ScriptableObjects contain circular references (e.g. Workstation -> Recipe -> Machine Visual -> Workstation). The JSON serializer must be configured with `ReferenceLoopHandling.Ignore` and select projection to ensure clean, readable output files.

## 2. Community Site Discrepancies (BiggerAmbitions.com)
- **Hardcoded Skill Multipliers:** BiggerAmbitions.com displays "100% Output" for recipes without specifying the mathematical scaling curve ($0.5 \times \text{skill} + 50\%$).
- **Missing Impact Breakdown:** Community lists do not clearly delineate primary vs. secondary products in business configurations.
