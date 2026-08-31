# Big Ambitions Assemblies Directory Reference

The `/Managed` directory contains decompiled C# source representations of all game and engine assemblies:

## 1. Core Game Assemblies
* **`BigAmbitions`**: Core game logic, `GameManager`, `BuildingManager`, `CityManager`, `SaveGameManager`, `BusinessType`, `Customer`, `Employee`, `AdManager`, `EconoView`, `BizMan`, `UI.*`.
* **`BigAmbitions.Items`**: `Item`, `ItemType`, `CargoInstance`, `ShelfItem`, `AttachmentPoint`, `ItemsGetter`.
* **`BigAmbitions.Factories`**: `Recipe`, `RecipeItem`, `RecipeMachineVisual`, `FactoryWorkstation`, `Producer`.
* **`BigAmbitions.Characters`**: `CharacterData`, `AppearanceSetter`, `Skills.*`, `SalaryNegotiation`.
* **`BigAmbitions.Neighborhoods`**: `NeighborhoodData`, `StreetData`, `AddressHelper`.
* **`BigAmbitions.ModAPI`**: `ModOption`, `OptionsService`, Mod settings UI and hooks.
* **`BigAmbitions.AI`**: Pedestrian, customer, citizen, and employee behavioral trees.
* **`BigAmbitions.PlacementSystem`**: Furniture grid, snap-to-wall, indoor placement rules.
* **`BigAmbitions.InteriorDesigner`**: Store/office/warehouse blueprints and interior tools.

## 2. Infrastructure & Serialization
* **`Unity.Addressables` & `Unity.ResourceManager`**: Dynamic content catalogs and async asset retrieval.
* **`Newtonsoft.Json`**: Json.NET engine used for game saves and mod serialization.
* **`OdinSerializer`**: Binary/JSON serialization engine for complex Unity graphs.
* **`NaughtyAttributes.Core`**: Unity inspector attributes used across ScriptableObjects.
* **`Google.OrTools` & `Google.Protobuf`**: Operations research library used for AI routing/optimization.

## 3. Unity Engine Modules
* `UnityEngine.CoreModule`, `UnityEngine.UI`, `UnityEngine.AIModule` (NavMesh), `UnityEngine.InputSystem`, `Unity.TextMeshPro`.
