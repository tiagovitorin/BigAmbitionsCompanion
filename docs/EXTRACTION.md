# Data Extraction Pipeline Specification

## 1. Pipeline Architecture

```
[Big Ambitions Game + MelonLoader]
               │
               ▼ (On Initialization / Keypress F9)
[BigAmbitionsDataExtractor Mod]
               │
               ▼ (Serializes objects cleanly via Newtonsoft.Json)
[/data/raw/*.json]
  ├── items.json
  ├── business_types.json
  ├── factory_recipes.json
  ├── factory_workstations.json
  ├── buildings.json
  ├── vehicles.json
  ├── customer_demands.json
  ├── neighborhoods.json
  ├── skills.json
  └── tags.json
               │
               ▼ (Normalization & Enrichment Script)
[/data/normalized/*.json & SQLite Database]
```

## 2. Mod Design (`/extractor/BigAmbitionsDataExtractor`)
- **Framework:** MelonLoader (.NET 6 / .NET Framework 4.7.2 / Mono compatible).
- **Target Assemblies Referenced:**
  - `MelonLoader.dll`
  - `UnityEngine.CoreModule.dll`
  - `BigAmbitions.dll`
  - `BigAmbitions.Items.dll`
  - `BigAmbitions.Factories.dll`
  - `Newtonsoft.Json.dll`
- **Output Target:** `data/raw/`

## 3. Data Extraction Contract
Each raw dump must include metadata headers:
```json
{
  "_meta": {
    "gameVersion": "1.0+",
    "extractedAt": "2026-08-29T10:00:00Z",
    "extractorVersion": "1.0.0",
    "recordCount": 150
  },
  "data": [ ... ]
}
```
