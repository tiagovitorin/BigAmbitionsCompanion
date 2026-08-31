# Big Ambitions Reverse Engineering Findings

## 1. Engine & Runtime Architecture
- **Engine:** Unity (Mono runtime, x86_64 Windows).
- **Core Namespace Structure:**
  - `BigAmbitions`: Game controllers, managers, business simulation, save system, UI.
  - `BigAmbitions.Items`: Items, furniture properties, cargo instances, tags, shelves.
  - `BigAmbitions.Factories`: Recipes, factory workstations, machines, workers.
  - `BigAmbitions.Characters`: Employees, skills, personality, salary negotiations.
  - `BigAmbitions.Neighborhoods`: City districts, customer demand distributions.
  - `BigAmbitions.SaveSystem`: Save game serialization, Addressable asset loaders.
  - `BigAmbitions.ModAPI`: Official in-game mod hooks and configuration options.

---

## 2. Addressable Asset Pipeline (`AddressableLoader.cs`)
The game registers and loads all primary definitions through `Addressables.LoadAssetsAsync<T>(label)`:

| Type | Addressable Label | Runtime Helper / Registry | Notes |
|---|---|---|---|
| `TagDatabase` | `TagDatabases` | `TagDatabaseHelper` | Global taxonomy for item & business tags |
| `Item` | `Items` | `BigAmbitions.Items.ItemsGetter` | Products, furniture, food, retail goods |
| `Recipe` | `FactoryRecipes` | `FactoriesHelper` | Factory crafting recipes & inputs/outputs |
| `FactoryWorkstation` | `FactoryWorkstations` | `FactoryWorkstationHelper` | Workstation machine requirements |
| `BusinessType` | `BusinessTypes` | `BusinessTypeHelper` | Stores, offices, restaurants, requirements |
| `Building` | `BuildingsDefinitions` | `BuildingHelper` | City map buildings, square meters, rent |
| `BuildingSizeData` | `BuildingSizes` | `BuildingSizeHelper` | Size classifications & limits |
| `VehicleType` | `VehicleTypes` | `VehicleTypeHelper` | Delivery vans, trucks, passenger cars |
| `CustomerDemand` | `CustomerDemand` | `CustomerDemandHelper` | Hourly / district demand distributions |
| `NeighborhoodData` | `Neighborhoods` | `NeighborhoodHelper` | Garment District, Hell's Kitchen, Midtown, etc. |
| `SkillData` | `Skills` | `SkillHelper` | Employee skills, training, efficacy |
| `JobDemand` | `JobDemands` | `JobDemandHelper` | Role salary demands & education |
| `SpecialRival` | `Rivals` | `RivalsHelper` | AI rival corporations |
| `DiplomaData` | `Diploma` | `EducationHelper` | University degrees & requirements |
| `InvestmentFundData` | `InvestmentFunds` | `InvestmentFundHelper` | Stock & investment funds |

---

## 3. Critical Simulation Formulas Discovered

### A. Factory Worker Skill Scaling
In `BigAmbitions.Factories.Recipes.Recipe.GetScaledOutputAmount(float employeeFactorySkill)`:
$$\text{SkillFactor} = \frac{\frac{\text{employeeFactorySkill}}{2} + 50}{100}$$
$$\text{ScaledOutput} = \text{round}(\text{output.amount} \times \text{SkillFactor})$$
* **0% Skill:** $50\%$ base output.
* **50% Skill:** $75\%$ base output.
* **100% Skill:** $100\%$ base output (double the base at 0%!).

### B. Optimal Providers Formula
In `BigAmbitions.Items.Item.GetOptimalProviders()`:
$$\text{OptimalProviders} = \min\left(\left\lceil\sqrt{\frac{1300}{\text{DefaultMarketPrice}}}\right\rceil, 7\right)$$

### C. Business Product Impact
In `BusinessType.GetProductImpact(string itemName)`:
- Primary items have impact factor $\ge 1.0$.
- Non-primary / secondary items default to $0.025$ ($2.5\%$).

---

## 4. Reverse Engineering Roadmap
- [ ] Map complete customer checkout / waiting line throughput.
- [ ] Document employee salary negotiation acceptance curves (`AI.Employees.SalaryNegotiation`).
- [ ] Extract warehouse logistics distribution logic (`WarehouseSlotController`, logistics managers).
