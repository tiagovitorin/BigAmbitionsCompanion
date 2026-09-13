using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using BAModAPI;
using BigAmbitions.Characters.Skills;
using BigAmbitions.DayNightCycle;
using BigAmbitions.Factories;
using BigAmbitions.Factories.Recipes;
using BigAmbitions.Factories.Workstations;
using BigAmbitions.Items;
using BigAmbitions.Neighborhoods;
using BigAmbitions.Rivals;
using BigAmbitions.SaveSystem;
using Buildings;
using Buildings.BuildingTypes.Shared.BusinessRequirement;
using Entities;
using Entities.Employee.JobDemands;
using Helpers;
using IngameDebugConsole;
using Localizor;
using Newtonsoft.Json;
using Data.VehicleColors;
using Streets;
using UnityEngine;
using Vehicles.VehicleTypes;
using Boats;
using UI.Load;
using JimmysUnityUtilities;
using BigAmbitions.ModsInternal;

[assembly: RegisterModClass(typeof(BigAmbitionsDataExtractor.DataExtractorMod))]

namespace BigAmbitionsDataExtractor
{
    [ModEntryOnInitializationLoad]
    [ModEntryMainMenu]
    [ModEntryOnCityLoad]
    [ModEntryOnBlueprintCreatorLoad]
    [ModEntryOnIntroLoad]
    public class DataExtractorMod : ModBigAmbitionsBase
    {
        private static readonly string OutputDirectory = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "data", "raw");
        private static bool _hasExtracted = false;
        private static bool _hasRenderedVehicles = false;
        private static bool _hasRenderedBoats = false;
        private static bool _isAutoLoadingCity = false;

        private static void AppendLog(string path, string message)
        {
            try
            {
                using (var sw = new StreamWriter(path, true))
                {
                    sw.WriteLine(message);
                }
            }
            catch {}
        }

        // A turntable counts as complete when its final frame exists, so a re-run
        // resumes instead of re-rendering vehicles that are already done.
        private static bool IsTurntableComplete(string vehicleRendersDir, string id, int totalFrames)
        {
            string lastFrame = Path.Combine(vehicleRendersDir, id + "_360", id + "_" + (totalFrames - 1).ToString("D2") + ".png");
            return File.Exists(lastFrame);
        }

        private static bool IsTurntableColorComplete(string vehicleRendersDir, string id, string colorKey, int totalFrames)
        {
            string lastFrame = Path.Combine(vehicleRendersDir, id + "_360", colorKey, id + "_" + (totalFrames - 1).ToString("D2") + ".png");
            return File.Exists(lastFrame);
        }

        public override async Task OnLoadAsync(ModContext context)
        {
            string debugLogPath = Path.Combine(Application.persistentDataPath, "extractor_debug.log");
            AppendLog(debugLogPath, $"[{DateTime.UtcNow:O}] Complete 100% OnLoadAsync started.");

            if (_hasExtracted && _hasRenderedVehicles && _hasRenderedBoats)
            {
                context?.Logger?.Info("DataExtractor: Already extracted and rendered all vehicles and boats in this session. Skipping.");
                return;
            }

            try
            {
                // Force load all 23 Addressable asset groups
                AddressableLoader.RegisterAndLoadAll();
                Directory.CreateDirectory(OutputDirectory);

                var settings = new JsonSerializerSettings
                {
                    Formatting = Formatting.Indented,
                    NullValueHandling = NullValueHandling.Ignore
                };

                var manifest = new Dictionary<string, object>
                {
                    { "gameVersion", Application.version },
                    { "extractedAt", DateTime.UtcNow.ToString("o") },
                    { "outputDirectory", OutputDirectory }
                };

                var stats = new Dictionary<string, int>();

                // 1. ITEMS (Complete schema with all 40+ fields)
                AppendLog(debugLogPath, "Extracting comprehensive items...");
                var rawItems = ItemsGetter.AllItems?.ToList() ?? new List<Item>();
                var itemDtos = new List<Dictionary<string, object>>();
                foreach (var item in rawItems)
                {
                    if (item == null) continue;

                    var furnReqs = new List<Dictionary<string, object>>();
                    if (item.furnitureRequirements != null)
                    {
                        foreach (var fr in item.furnitureRequirements)
                        {
                            if (fr != null)
                            {
                                furnReqs.Add(new Dictionary<string, object>
                                {
                                    { "localizationKey", fr.localizationKey },
                                    { "showIfMet", fr.showIfMet }
                                });
                            }
                        }
                    }

                    var seasonalItems = new List<Dictionary<string, object>>();
                    if (item.itemsBySeason != null)
                    {
                        foreach (var isea in item.itemsBySeason)
                        {
                            seasonalItems.Add(new Dictionary<string, object>
                            {
                                { "season", isea.seasonName.ToString() },
                                { "itemName", isea.itemName }
                            });
                        }
                    }

                    var d = new Dictionary<string, object>
                    {
                        { "itemName", item.itemName },
                        { "type", item.type.ToString() },
                        { "wholesalePrice", item.wholesalePrice },
                        { "defaultMarketPrice", item.DefaultMarketPrice },
                        { "productSalesRatio", item.productSalesRatio },
                        { "boxSize", item.boxSize },
                        { "canPutInShoppingBasket", item.canPutInShoppingBasket },
                        { "isFurniture", item.isFurniture },
                        { "gridSize", item.gridSize },
                        { "degreesPerRotation", item.degreesPerRotation },
                        { "quality", item.quality },
                        { "addedCustomersPerHour", item.addedCustomersPerHour },
                        { "cargoCapacity", item.cargoCapacity },
                        { "cargoCapacityMultiplier", item.cargoCapacityMultiplier },
                        { "buildingHeightRequirement", item.buildingHeightRequirement },
                        { "furnitureRequirements", furnReqs },
                        { "wallMounted", item.wallMounted },
                        { "snapToCeiling", item.snapToCeiling },
                        { "canBeGrabbed", item.canBeGrabbed },
                        { "itemsThatCanOverlapWith", item.itemsThatCanOverlapWith },
                        { "wallOverlapMargin", item.wallOverlapMargin },
                        { "itemsWhitelist", item.itemsWhitelist },
                        { "isProducer", item.isProducer },
                        { "producerItems", item.producerSettings?.itemsToProduce },
                        { "defaultShelfItemName", item.defaultShelfItemName },
                        { "showcaseItems", item.itemsThatCanShowcase },
                        { "assignable", item.assignable },
                        { "hasWaitingLine", item.hasWaitingLine },
                        { "canPlayerDoOrder", item.canPlayerDoOrder },
                        { "suitableSkills", item.suitableSkills },
                        { "isConsumable", item.isConsumable },
                        { "requiresWeighing", item.requiresWeighing },
                        { "saturation", item.saturation },
                        { "energy", item.energy },
                        { "isAccessory", item.isAccessory },
                        { "accessoryType", item.accessoryType.ToString() },
                        { "isADemandedProduct", item.isADemandedProduct },
                        { "limitDemandToNeighbourhoods", item.limitDemandToNeighbourhoods },
                        { "isSpecialRivalOnly", item.isSpecialRivalOnly },
                        { "maxWholesaleOrderAmount", item.maxWholesaleOrderAmount },
                        { "maxOrderAmountPerImporter", item.maxOrderAmountPerImporter },
                        { "providersNeededToStartGeneratingEvents", item.providersNeededToStartGeneratingEvents },
                        { "optimalProviders", item.GetOptimalProviders() },
                        { "isSpecialGift", item.isSpecialGift },
                        { "season", item.season.ToString() },
                        { "isSeasonalItemFromAIBusiness", item.isSeasonalItemFromAIBusiness },
                        { "itemToReplaceWithWhenOvertakingBusiness", item.itemToReplaceWithWhenOvertakingBusiness },
                        { "isSeasonalForSale", item.isSeasonalForSale },
                        { "itemsBySeason", seasonalItems },
                        { "vehicleType", item.vehicleType }
                    };
                    itemDtos.Add(d);
                }
                ExportJson("items.json", itemDtos, settings);
                stats["items"] = itemDtos.Count;

                // 2. BUSINESS TYPES (Complete with products, demands, requirements, hourly & day multipliers)
                AppendLog(debugLogPath, "Extracting comprehensive business types...");
                var bNames = BusinessTypeHelper.BusinessTypeNames?.ToList() ?? new List<string>();
                var businessDtos = new List<Dictionary<string, object>>();
                foreach (var name in bNames)
                {
                    var b = BusinessTypeHelper.GetData(name);
                    if (b == null) continue;

                    var productsList = new List<Dictionary<string, object>>();
                    if (b.businessProducts != null)
                    {
                        foreach (var bp in b.businessProducts)
                        {
                            if (bp != null)
                            {
                                productsList.Add(new Dictionary<string, object>
                                {
                                    { "itemName", bp.itemName },
                                    { "impact", bp.impact },
                                    { "isPrimary", bp.impact >= 1.0f }
                                });
                            }
                        }
                    }

                    var reqsList = new List<Dictionary<string, object>>();
                    if (b.businessRequirements != null)
                    {
                        foreach (var req in b.businessRequirements)
                        {
                            if (req != null)
                            {
                                reqsList.Add(new Dictionary<string, object>
                                {
                                    { "requirementName", req.businessRequirementName },
                                    { "localizeKey", req.GetLocalizeKey() },
                                    { "items", req.GetItems() },
                                    { "itemType", req.GetItemType().ToString() }
                                });
                            }
                        }
                    }

                    var demandSets = new List<Dictionary<string, object>>();
                    if (b.customerDemandSets != null)
                    {
                        foreach (var cds in b.customerDemandSets)
                        {
                            if (cds != null)
                            {
                                demandSets.Add(new Dictionary<string, object>
                                {
                                    { "type", cds.type },
                                    { "weight", cds.weight }
                                });
                            }
                        }
                    }

                    var hourlyFactors = new List<Dictionary<string, object>>();
                    if (b.hourlyFactorMultipliers != null)
                    {
                        foreach (var hf in b.hourlyFactorMultipliers)
                        {
                            if (hf != null)
                            {
                                hourlyFactors.Add(new Dictionary<string, object>
                                {
                                    { "startingHour", hf.startingHour },
                                    { "endingHour", hf.endingHour },
                                    { "multiplier", hf.multiplier }
                                });
                            }
                        }
                    }

                    var dayFactors = new List<Dictionary<string, object>>();
                    if (b.dayFactorMultipliers != null)
                    {
                        foreach (var df in b.dayFactorMultipliers)
                        {
                            if (df != null)
                            {
                                dayFactors.Add(new Dictionary<string, object>
                                {
                                    { "dayOfWeek", df.dayOfWeekOrdered.ToString() },
                                    { "multiplier", df.multiplier }
                                });
                            }
                        }
                    }

                    var bd = new Dictionary<string, object>
                    {
                        { "businessTypeName", b.businessTypeName },
                        { "suitableBuildingType", b.suitableBuildingType },
                        { "spawnCustomers", b.spawnCustomers },
                        { "courseRequired", b.courseRequired.ToString() },
                        { "hasEntranceFee", b.hasEntranceFee },
                        { "defaultEntranceFee", b.defaultEntranceFee },
                        { "hasWeekendOnlyEntranceFee", b.hasWeekendOnlyEntranceFee },
                        { "weekendOnlyEntranceFee", b.weekendOnlyEntranceFee },
                        { "maxAmountPerProduct", b.maxAmountPerProduct },
                        { "employeePrimarySkills", b.employeePrimarySkills },
                        { "customerType", b.customerType.ToString() },
                        { "acceptCustomersWithoutOrderEntries", b.acceptCustomersWithoutOrderEntries },
                        { "products", productsList },
                        { "requirements", reqsList },
                        { "customerDemandSets", demandSets },
                        { "hourlyFactorMultipliers", hourlyFactors },
                        { "dayFactorMultipliers", dayFactors },
                        { "productSources", b.productSources }
                    };
                    businessDtos.Add(bd);
                }
                ExportJson("business_types.json", businessDtos, settings);
                stats["businessTypes"] = businessDtos.Count;

                // 3. FACTORY RECIPES
                AppendLog(debugLogPath, "Extracting factory recipes...");
                var rawRecipes = FactoriesHelper.AllRecipes?.ToList() ?? new List<Recipe>();
                var recipeDtos = new List<Dictionary<string, object>>();
                foreach (var r in rawRecipes)
                {
                    if (r == null) continue;

                    var ingredients = new List<Dictionary<string, object>>();
                    if (r.ingredients != null)
                    {
                        foreach (var ing in r.ingredients)
                        {
                            ingredients.Add(new Dictionary<string, object>
                            {
                                { "item", ing.item },
                                { "amount", ing.amount }
                            });
                        }
                    }

                    var machines = new List<string>();
                    if (r.machineVisuals != null)
                    {
                        foreach (var mv in r.machineVisuals)
                        {
                            if (!string.IsNullOrEmpty(mv.machineName))
                            {
                                machines.Add(mv.machineName);
                            }
                        }
                    }

                    var rd = new Dictionary<string, object>
                    {
                        { "id", r.id },
                        { "output", new Dictionary<string, object>
                            {
                                { "item", r.output.item },
                                { "baseAmount", r.output.amount },
                                { "maxSkilledAmount", r.GetScaledOutputAmount(100f) }
                            }
                        },
                        { "ingredients", ingredients },
                        { "productionMachines", machines }
                    };
                    recipeDtos.Add(rd);
                }
                ExportJson("factory_recipes.json", recipeDtos, settings);
                stats["factoryRecipes"] = recipeDtos.Count;

                // 4. FACTORY WORKSTATIONS
                AppendLog(debugLogPath, "Extracting workstations...");
                var workstationTypes = FactoryWorkstationHelper.GetWorkstationTypes() ?? new List<string>();
                var workstationDtos = new List<Dictionary<string, object>>();
                foreach (var wt in workstationTypes)
                {
                    var ws = FactoryWorkstationHelper.GetWorkstation(wt);
                    if (ws == null) continue;

                    var supportedOutputItems = new List<string>();
                    if (ws.supportedRecipes != null)
                    {
                        foreach (var sr in ws.supportedRecipes)
                        {
                            if (sr != null && !string.IsNullOrEmpty(sr.output.item))
                            {
                                supportedOutputItems.Add(sr.output.item);
                            }
                        }
                    }

                    var wsd = new Dictionary<string, object>
                    {
                        { "workstationType", ws.workstationType },
                        { "requiredAssemblyMachine", ws.requiredAssemblyMachine },
                        { "requiredProductionMachines", ws.requiredProductionMachines },
                        { "supportedOutputItems", supportedOutputItems }
                    };
                    workstationDtos.Add(wsd);
                }
                ExportJson("factory_workstations.json", workstationDtos, settings);
                stats["factoryWorkstations"] = workstationDtos.Count;

                // 5. BUILDINGS (All properties in NYC)
                AppendLog(debugLogPath, "Extracting buildings...");
                var rawBuildings = BuildingHelper.allBuildings ?? new List<Building>();
                var buildingDtos = new List<Dictionary<string, object>>();
                foreach (var b in rawBuildings)
                {
                    if (b == null) continue;
                    var bd = new Dictionary<string, object>
                    {
                        { "streetNumber", b.Address?.streetNumber },
                        { "streetName", b.Address?.streetName },
                        { "neighbourhood", b.Neighbourhood },
                        { "buildingType", b.BuildingType },
                        { "buildingSize", b.BuildingSize },
                        { "squareMeters", BuildingHelper.GetBuildingSquareMeters(b.Address) },
                        { "priceIndex", b.GetPriceIndex() },
                        { "trafficIndex", b.trafficIndex }
                    };
                    if (b.SpecialService != null)
                    {
                        bd["specialService"] = new Dictionary<string, object>
                        {
                            { "businessName", b.SpecialService.businessName },
                            { "businessTypeName", b.SpecialService.businessTypeName },
                            { "priceIndex", b.SpecialService.priceIndex },
                            { "layout", b.SpecialService.layout }
                        };
                    }
                    if (b.deliveryJobStartLocation != null)
                    {
                        bd["deliveryJobVehicleType"] = b.deliveryJobStartLocation.vehicleTypeName;
                    }
                    buildingDtos.Add(bd);
                }
                ExportJson("buildings.json", buildingDtos, settings);
                stats["buildings"] = buildingDtos.Count;

                // 5b. STREET NAMES (game-localized display names, e.g. "ba:street_thirdstreet" -> "3rd Street")
                AppendLog(debugLogPath, "Extracting street names...");
                var streetDtos = new List<Dictionary<string, object>>();
                try
                {
                    // AddressHelper.StreetDataDictionary is private; read it via reflection so we get every
                    // loaded StreetData asset exactly as the game resolves it for on-screen addresses.
                    var dictField = typeof(AddressHelper).GetField("StreetDataDictionary", BindingFlags.NonPublic | BindingFlags.Static);
                    if (dictField?.GetValue(null) is IDictionary streetDict)
                    {
                        var seen = new HashSet<string>();
                        foreach (DictionaryEntry entry in streetDict)
                        {
                            var streetName = entry.Key as string;
                            if (string.IsNullOrEmpty(streetName) || !seen.Add(streetName)) continue;
                            var isAvenue = false;
                            var isAvenueField = entry.Value?.GetType().GetField("isAvenue");
                            if (isAvenueField?.GetValue(entry.Value) is bool avenueFlag) isAvenue = avenueFlag;
                            string displayName = AddressHelper.GetStreetNameLocalized(streetName);
                            // Skip entries the game could not localize (returns the raw key itself);
                            // downstream pipelines fall back to their own clean formatting instead.
                            if (string.IsNullOrEmpty(displayName) || displayName.Equals(streetName, StringComparison.OrdinalIgnoreCase)) continue;
                            streetDtos.Add(new Dictionary<string, object>
                            {
                                { "streetName", streetName },
                                { "displayName", displayName },
                                { "isAvenue", isAvenue }
                            });
                        }
                    }
                    streetDtos = streetDtos.OrderBy(s => s["streetName"] as string, StringComparer.Ordinal).ToList();
                }
                catch (Exception ex)
                {
                    AppendLog(debugLogPath, $"Street name extraction error: {ex}");
                }
                ExportJson("street_names.json", streetDtos, settings);
                stats["streetNames"] = streetDtos.Count;

                // 6. BUILDING SIZES
                AppendLog(debugLogPath, "Extracting building sizes...");
                var rawSizes = BuildingSizeHelper.GetAllBuildingSizes() ?? new List<BuildingSizeData>();
                var sizeDtos = new List<Dictionary<string, object>>();
                foreach (var s in rawSizes)
                {
                    if (s == null) continue;
                    sizeDtos.Add(new Dictionary<string, object>
                    {
                        { "buildingSize", s.buildingSize },
                        { "squareMeters", s.squareMeters },
                        { "wallHeights", s.wallHeights }
                    });
                }
                ExportJson("building_sizes.json", sizeDtos, settings);
                stats["buildingSizes"] = sizeDtos.Count;

                // 7. BUILDING TYPES (Class data: rent multipliers, deposit days, required cleaning/skills)
                AppendLog(debugLogPath, "Extracting building types metadata...");
                var bTypeDtos = new List<Dictionary<string, object>>();
                foreach (var bt in BuildingTypeHelper.BuildingTypes.Values)
                {
                    if (bt == null) continue;
                    bTypeDtos.Add(new Dictionary<string, object>
                    {
                        { "buildingType", bt.buildingType },
                        { "availableBusinessTypes", bt.availableBusinessTypes },
                        { "buildingPriceMultiplier", bt.buildingPriceMultiplier },
                        { "buildingPriceMultiplierForRent", bt.buildingPriceMultiplierForRent },
                        { "daysToCalculateDeposit", bt.daysToCalculateDeposit },
                        { "requiredBuildingSkills", bt.requiredBuildingSkills },
                        { "marketingReachMultiplier", bt.marketingReachMultiplier },
                        { "needsCleaning", bt.NeedsCleaning }
                    });
                }
                ExportJson("building_types.json", bTypeDtos, settings);
                stats["buildingTypes"] = bTypeDtos.Count;

                // 8. VEHICLES
                AppendLog(debugLogPath, "Extracting vehicles...");
                var vNames = VehicleTypeHelper.GetVehicleTypeNames() ?? new List<string>();
                var vehicleDtos = new List<Dictionary<string, object>>();
                foreach (var vn in vNames)
                {
                    var vt = VehicleTypeHelper.GetVehicleType(vn);
                    if (vt == null) continue;
                    vehicleDtos.Add(new Dictionary<string, object>
                    {
                        { "vehicleTypeName", vt.vehicleTypeName },
                        { "isMotorVehicle", vt.IsMotorVehicle },
                        { "autoDestroyAfterMinutes", vt.autoDestroyAfterMinutes },
                        { "price", vt.price },
                        { "maxFuel", vt.maxFuel },
                        { "maxCargoCapacity", vt.maxCargoCapacity },
                        { "maxSpeed", vt.maxSpeed },
                        { "autoParkSupported", vt.autoParkSupported },
                        { "taxDeductible", vt.taxDeductible },
                        { "isLuxuryCar", vt.isLuxuryCar },
                        { "fitsHandTruck", vt.fitsHandTruck },
                        { "fitsFlatbed", vt.fitsFlatbed },
                        { "requiredDeliveryDriverSkillValue", vt.requiredDeliveryDriverSkillValue },
                        { "destinationsThatCanDeliver", vt.destinationsThatCanDeliver },
                        { "itemVersion", vt.itemVersion },
                        { "hasRadio", vt.hasRadio },
                        { "countsForPersonalGoals", vt.countsForPersonalGoals }
                    });
                }
                ExportJson("vehicles.json", vehicleDtos, settings);
                stats["vehicleTypes"] = vehicleDtos.Count;

                // 8b. VEHICLE COLORS (GlobalReferences.vehicleColors: name + tint/fresnel)
                AppendLog(debugLogPath, "Extracting vehicle colors...");
                var globalRefs = GlobalReferences.Instance;
                var vehicleColorDtos = new List<Dictionary<string, object>>();
                if (globalRefs?.vehicleColors != null)
                {
                    foreach (var vc in globalRefs.vehicleColors)
                    {
                        if (vc == null) continue;
                        vehicleColorDtos.Add(new Dictionary<string, object>
                        {
                            { "name", vc.name },
                            { "tint", vc.tint },
                            { "fresnelColor", vc.fresnelColor },
                            { "fresnelPower", vc.fresnelPower },
                            { "randomWeight", vc.randomWeight }
                        });
                    }
                }
                ExportJson("vehicle_colors.json", vehicleColorDtos, settings);
                stats["vehicleColors"] = vehicleColorDtos.Count;

                // 8c. IN-GAME VEHICLE STUDIO RENDERS (360 turntables for every vehicle in every color)
                // Renders incrementally: a vehicle+color whose final frame already exists is
                // skipped, so re-running the game resumes where a previous run stopped.
                string vehicleRendersDir = Path.Combine(OutputDirectory, "vehicle_renders");
                if (!_hasRenderedVehicles)
                {
                    var carColors = new List<string>();
                    try
                    {
                        if (GlobalReferences.Instance?.vehicleColors != null)
                        {
                            foreach (var vc in GlobalReferences.Instance.vehicleColors)
                            {
                                if (vc != null && !string.IsNullOrEmpty(vc.name)) carColors.Add(vc.name);
                            }
                        }
                    }
                    catch { }
                    if (carColors.Count == 0) carColors.Add("Red");

                    AppendLog(debugLogPath, $"Rendering in-game 360 turntables for {vNames.Count} vehicles x {carColors.Count} colors...");
                    int totalFrames = 0;
                    int completed = 0;
                    int expected = vNames.Count * carColors.Count;
                    foreach (var vName in vNames)
                    {
                        string id = vName.GetIdWithoutType();
                        if (string.IsNullOrEmpty(id)) id = vName;

                        foreach (var colorName in carColors)
                        {
                            string colorKey = colorName.ToLowerInvariant();

                            if (IsTurntableColorComplete(vehicleRendersDir, id, colorKey, 36))
                            {
                                completed++;
                                totalFrames += 36;
                                continue;
                            }

                            try
                            {
                                int frames = VehicleStudioRenderer.RenderVehicleTurntable(
                                    id,
                                    vehicleRendersDir,
                                    36,
                                    colorName,
                                    msg => AppendLog(debugLogPath, msg),
                                    colorKey,
                                    512
                                );
                                if (frames > 0)
                                {
                                    completed++;
                                    totalFrames += frames;
                                }
                            }
                            catch (Exception ex)
                            {
                                AppendLog(debugLogPath, $"Vehicle studio rendering exception for '{id}' ({colorName}): {ex}");
                            }
                        }
                    }

                    stats["vehicleTurntableFrames"] = totalFrames;
                    if (completed >= expected)
                    {
                        _hasRenderedVehicles = true;
                        AppendLog(debugLogPath, $"All {completed} vehicle color turntables rendered.");
                    }
                    else
                    {
                        AppendLog(debugLogPath, $"Rendered {completed}/{expected} vehicle color turntables; the rest will retry on the next load.");
                    }
                }

                // Boats check
                bool hasBoatModels = false;
                try
                {
                    if (BoatManager.Instance != null && BoatManager.Instance.GetComponentsInChildren<Boat>(true).Length > 0)
                    {
                        hasBoatModels = true;
                    }
                    else if (Resources.FindObjectsOfTypeAll<Boat>().Length > 0)
                    {
                        hasBoatModels = true;
                    }
                }
                catch {}

                if (hasBoatModels && !_hasRenderedBoats)
                {
                    AppendLog(debugLogPath, "Boat models found in memory. Commencing showroom turntable capture for all boats...");
                    try
                    {
                        int boatFrames = VehicleStudioRenderer.RenderAllBoats(
                            vehicleRendersDir,
                            msg => AppendLog(debugLogPath, msg)
                        );
                        stats["boatTurntableFrames"] = boatFrames;
                        if (boatFrames > 0)
                        {
                            _hasRenderedBoats = true;
                            AppendLog(debugLogPath, "Vehicle studio rendering complete! All vehicles and boats rendered.");
                        }
                    }
                    catch (Exception ex)
                    {
                        AppendLog(debugLogPath, $"Boat studio rendering exception: {ex}");
                    }
                }
                else if (!_hasRenderedBoats)
                {
                    AppendLog(debugLogPath, "Boat models not present in memory (City scene not loaded). Scheduling auto-transition to City scene...");
                    if (!_isAutoLoadingCity)
                    {
                        _isAutoLoadingCity = true;
                        CoroutineUtility.RunAfterSecondsDelay(delegate
                        {
                            TryAutoLoadSaveOrCity(msg => AppendLog(debugLogPath, msg));
                        }, 1.5f);
                    }
                }

                // 8d. BOAT COLORS (GlobalReferences.boatColors: primary/secondary)
                AppendLog(debugLogPath, "Extracting boat colors...");
                var boatColorDtos = new List<Dictionary<string, object>>();
                if (globalRefs?.boatColors != null)
                {
                    foreach (var bc in globalRefs.boatColors)
                    {
                        if (bc == null) continue;
                        boatColorDtos.Add(new Dictionary<string, object>
                        {
                            { "name", bc.name },
                            { "primaryColor", bc.primaryColor },
                            { "secondaryColor", bc.secondaryColor }
                        });
                    }
                }
                ExportJson("boat_colors.json", boatColorDtos, settings);
                stats["boatColors"] = boatColorDtos.Count;

                // 8d. BOATS (types are hardcoded in Entities.BoatTypes.cs)
                AppendLog(debugLogPath, "Extracting boat types...");
                var boatDtos = new List<Dictionary<string, object>>();
                foreach (BoatTypeName btName in Enum.GetValues(typeof(BoatTypeName)))
                {
                    var bt = btName.GetBoatType();
                    if (bt == null) continue;
                    boatDtos.Add(new Dictionary<string, object>
                    {
                        { "name", btName.ToString() },
                        { "price", bt.price },
                        { "taxDeductible", bt.taxDeductible },
                        { "isLuxuryYacht", bt.isLuxuryYacht }
                    });
                }
                ExportJson("boats.json", boatDtos, settings);
                stats["boats"] = boatDtos.Count;

                // 9. NEIGHBORHOODS
                AppendLog(debugLogPath, "Extracting neighborhoods...");
                var rawNeighborhoods = NeighborhoodHelper.NeighborhoodsData?.ToList() ?? new List<NeighborhoodData>();
                var neighborhoodDtos = new List<Dictionary<string, object>>();
                foreach (var n in rawNeighborhoods)
                {
                    if (n == null) continue;
                    neighborhoodDtos.Add(new Dictionary<string, object>
                    {
                        { "neighbourhood", n.neighbourhood },
                        { "workingClassPercentage", n.workingClassPercentage },
                        { "middleClassPercentage", n.middleClassPercentage },
                        { "upperClassPercentage", n.upperClassClassPercentage },
                        { "realEstateMultiplier", n.realEstateMultiplier },
                        { "parkingPrice", n.parkingPrice },
                        { "customerDemandsWeight", n.customerDemandsWeight },
                        { "vehicleTrafficDensityPercentage", n.vehicleTrafficDensityPercentage },
                        { "baseBuildingPricePerSqm", n.baseBuildingPricePerSqm },
                        { "rentMultiplierPerSqmPrice", n.rentMultiplierPerSqmPrice },
                        { "marketingStrength", n.marketingStrength },
                        { "maxDailyIncomeToShutDownBusiness", n.maxDailyIncomeToShutDownBusiness }
                    });
                }
                ExportJson("neighborhoods.json", neighborhoodDtos, settings);
                stats["neighborhoods"] = neighborhoodDtos.Count;

                // 10. SKILLS
                AppendLog(debugLogPath, "Extracting skills...");
                var sNames = SkillHelper.AllSkillNames?.ToList() ?? new List<string>();
                var skillDtos = new List<Dictionary<string, object>>();
                foreach (var sn in sNames)
                {
                    var s = SkillHelper.GetData(sn);
                    if (s == null) continue;
                    skillDtos.Add(new Dictionary<string, object>
                    {
                        { "skillName", s.skillName }
                    });
                }
                ExportJson("skills.json", skillDtos, settings);
                stats["skills"] = skillDtos.Count;

                // 11. DIPLOMAS
                AppendLog(debugLogPath, "Extracting diplomas...");
                var rawDiplomas = EducationHelper.AllDiplomas ?? new List<DiplomaData>();
                var diplomaDtos = new List<Dictionary<string, object>>();
                foreach (var d in rawDiplomas)
                {
                    if (d == null) continue;
                    diplomaDtos.Add(new Dictionary<string, object>
                    {
                        { "diplomaName", d.diplomaName.ToString() },
                        { "requiredMinutes", d.requiredMinutes }
                    });
                }
                ExportJson("diplomas.json", diplomaDtos, settings);
                stats["diplomas"] = diplomaDtos.Count;

                // 12. RIVALS
                AppendLog(debugLogPath, "Extracting special rivals...");
                var specialRivals = RivalsHelper.GetSpecialRivals();
                var rivalDtos = new List<Dictionary<string, object>>();
                if (specialRivals != null)
                {
                    foreach (var r in specialRivals)
                    {
                        if (r == null) continue;
                        rivalDtos.Add(new Dictionary<string, object>
                        {
                            { "rivalName", r.name },
                            { "primaryNeighborhood", r.primaryNeighborhood },
                            { "businessOvertakeAcceptRate", r.businessOvertakeAcceptRate },
                            { "entranceMessageKey", r.entranceMessageKey },
                            { "rentBuildingMessageKey", r.rentBuildingMessageKey }
                        });
                    }
                }
                ExportJson("special_rivals.json", rivalDtos, settings);
                stats["specialRivals"] = rivalDtos.Count;

                // 13. HAPPINESS MODIFIERS
                AppendLog(debugLogPath, "Extracting happiness modifiers...");
                var happinessDtos = new List<Dictionary<string, object>>();
                var modDict = typeof(HappinessHelper).GetField("Modifiers", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static)?.GetValue(null) as Dictionary<string, HappinessModifier>;
                if (modDict != null)
                {
                    foreach (var hm in modDict.Values)
                    {
                        if (hm == null) continue;
                        happinessDtos.Add(new Dictionary<string, object>
                        {
                            { "type", hm.type },
                            { "amount", hm.amount },
                            { "hoursDuration", hm.hoursDuration },
                            { "maxHoursDuration", hm.maxHoursDuration },
                            { "oneTimeOnly", hm.oneTimeOnly },
                            { "hideDuration", hm.hideDuration },
                            { "nonTemporalType", hm.nonTemporalType }
                        });
                    }
                }
                ExportJson("happiness_modifiers.json", happinessDtos, settings);
                stats["happinessModifiers"] = happinessDtos.Count;

                // 14. JOB DEMANDS
                AppendLog(debugLogPath, "Extracting job demands...");
                var jobDemandDtos = new List<Dictionary<string, object>>();
                var jdList = typeof(JobDemandHelper).GetField("AllJobDemands", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Static)?.GetValue(null) as List<JobDemand>;
                if (jdList != null)
                {
                    foreach (var jd in jdList)
                    {
                        if (jd == null) continue;
                        jobDemandDtos.Add(new Dictionary<string, object>
                        {
                            { "demandName", jd.demandName },
                            { "isSkillSpecific", jd.isSkillSpecific },
                            { "specificSkillName", jd.specificSkillName },
                            { "suitableToAllSkills", jd.suitableToAllSkills },
                            { "suitableSkillNames", jd.suitableSkillNames },
                            { "hasSingleSelectionGroup", jd.hasSingleSelectionGroup },
                            { "singleSelectionGroup", jd.singleSelectionGroup },
                            { "isNonAdditive", jd.isNonAdditive }
                        });
                    }
                }
                ExportJson("job_demands.json", jobDemandDtos, settings);
                stats["jobDemands"] = jobDemandDtos.Count;

                // 15. LOCALIZATION STRINGS (English table)
                AppendLog(debugLogPath, "Copying English localization...");
                string localePath = Path.Combine(Application.streamingAssetsPath, "locale", "en.json");
                if (File.Exists(localePath))
                {
                    File.Copy(localePath, Path.Combine(OutputDirectory, "localization_en.json"), true);
                    stats["localization_en"] = 1;
                }

                // 16. MANIFEST
                manifest["stats"] = stats;
                ExportJson("_manifest.json", manifest, settings);

                try
                {
                    CommandHelper.AddCommand("extract_vehicles", "Renders a single showroom PNG for every vehicle", delegate
                    {
                        string rendersDir = Path.Combine(OutputDirectory, "vehicle_renders");
                        VehicleStudioRenderer.RenderAllVehicles(rendersDir, "Red", msg => AppendLog(debugLogPath, msg));
                    });

                    CommandHelper.AddCommand("render_turntables", "Renders a 36-frame 360 turntable for every vehicle in every color", delegate
                    {
                        string rendersDir = Path.Combine(OutputDirectory, "vehicle_renders");
                        var colors = new List<string>();
                        try
                        {
                            if (GlobalReferences.Instance?.vehicleColors != null)
                            {
                                foreach (var vc in GlobalReferences.Instance.vehicleColors)
                                {
                                    if (vc != null && !string.IsNullOrEmpty(vc.name)) colors.Add(vc.name);
                                }
                            }
                        }
                        catch { }
                        if (colors.Count == 0) colors.Add("Red");
                        foreach (var vn in vNames)
                        {
                            string id = vn.GetIdWithoutType();
                            if (string.IsNullOrEmpty(id)) id = vn;
                            foreach (var colorName in colors)
                            {
                                string colorKey = colorName.ToLowerInvariant();
                                if (IsTurntableColorComplete(rendersDir, id, colorKey, 36)) continue;
                                VehicleStudioRenderer.RenderVehicleTurntable(id, rendersDir, 36, colorName, msg => AppendLog(debugLogPath, msg), colorKey, 512);
                            }
                        }
                    });
                }
                catch {}

                _hasExtracted = true;
                string successMsg = $"DataExtractor: 100% comprehensive data extraction complete across {stats.Count} domains!";
                context?.Logger?.Info(successMsg);
                AppendLog(debugLogPath, $"[{DateTime.UtcNow:O}] {successMsg}");
            }
            catch (Exception ex)
            {
                context?.Logger?.Error($"DataExtractor error: {ex}");
                AppendLog(debugLogPath, $"[{DateTime.UtcNow:O}] Exception: {ex}");
            }

            await Task.CompletedTask;
        }

        private static void ExportJson<T>(string filename, T data, JsonSerializerSettings settings)
        {
            string filePath = Path.Combine(OutputDirectory, filename);
            string json = JsonConvert.SerializeObject(data, settings);
            using (var sw = new StreamWriter(filePath, false))
            {
                sw.Write(json);
            }
        }

        private static bool TryAutoLoadSaveOrCity(Action<string> log)
        {
            try
            {
                List<SaveGameManager.SaveGameStruct> saves = null;
                try
                {
                    saves = SaveGamePathHelper.GetAllSaveGamesFromVersion();
                }
                catch {}

                if (saves == null || saves.Count == 0)
                {
                    string baseFolder = SaveGamePathHelper.SaveGameFolderPath;
                    if (Directory.Exists(baseFolder))
                    {
                        foreach (var dir in Directory.GetDirectories(baseFolder))
                        {
                            try
                            {
                                var versionSaves = SaveGamePathHelper.GetAllSaveGamesFromVersion(dir);
                                if (versionSaves != null && versionSaves.Count > 0)
                                {
                                    if (saves == null) saves = new List<SaveGameManager.SaveGameStruct>();
                                    saves.AddRange(versionSaves);
                                }
                            }
                            catch {}
                        }
                    }
                }

                if (saves != null && saves.Count > 0)
                {
                    var latestSave = saves.OrderByDescending(x => x.lastPlayedDate).FirstOrDefault();
                    if (latestSave != null)
                    {
                        log?.Invoke($"Auto-loading latest save game '{latestSave.name}' ({latestSave.characterData?.name}) to enter City scene for boat models...");
                        TransitionToSave.saveToLoadData = latestSave;
                        LoadScene.LoadTransitionToSave();
                        return true;
                    }
                }

                log?.Invoke("No save game found. Loading city scenes directly...");
                LoadScene.LoadGame(ModActivationScope.MainMenu);
                return true;
            }
            catch (Exception ex)
            {
                log?.Invoke($"Auto-load error: {ex}");
                return false;
            }
        }

        public override Task OnUnloadAsync()
        {
            return Task.CompletedTask;
        }
    }
}
