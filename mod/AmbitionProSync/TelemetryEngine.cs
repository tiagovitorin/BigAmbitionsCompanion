using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading;
using Buildings.BuildingTypes.Shared.Dirtiness;
using Buildings.Office.Headquarters;
using Entities;
using Entities.Employee.JobDemands;
using Helpers;
using Newtonsoft.Json;
using UnityEngine;

namespace AmbitionProSync
{
    /// <summary>
    /// Shared Telemetry Engine: Core logic that powers both Steam Workshop Native Mod and MelonLoader Standalone Mod.
    /// Handles in-memory caching, Big Ambitions game reflection, and the local HTTP micro-server on port 8765.
    /// </summary>
    public static class TelemetryEngine
    {
        public const string MOD_VERSION = "2.2.0";
        public const int HTTP_PORT = 8765;

        private static HttpListener _httpListener;
        private static Thread _listenerThread;
        private static bool _isRunning = false;
        private static string _cachedTelemetryJson = "{}";
        private static readonly object _lock = new object();
        private static float _lastUpdateTime = 0f;

        public static Action<string> LogInfo = (msg) => Debug.Log($"[AmbitionProSync] {msg}");
        public static Action<string> LogWarn = (msg) => Debug.LogWarning($"[AmbitionProSync] {msg}");
        public static Action<string> LogErr  = (msg) => Debug.LogError($"[AmbitionProSync] {msg}");

        public static void Initialize(string loaderType = "Standalone")
        {
            LogInfo($"Big Ambitions Companion Live HQ Mod v{MOD_VERSION} initializing via {loaderType}...");
            StartHttpServer();
        }

        public static void Shutdown()
        {
            _isRunning = false;
            try
            {
                _httpListener?.Stop();
                _httpListener?.Close();
                LogInfo("HTTP telemetry server stopped.");
            }
            catch (Exception ex)
            {
                LogErr($"Error stopping HTTP telemetry server: {ex.Message}");
            }
        }

        private static void StartHttpServer()
        {
            try
            {
                _isRunning = true;
                _httpListener = new HttpListener();
                _httpListener.Prefixes.Add($"http://127.0.0.1:{HTTP_PORT}/");
                _httpListener.Prefixes.Add($"http://localhost:{HTTP_PORT}/");
                _httpListener.Start();

                _listenerThread = new Thread(ListenHttpRequests)
                {
                    IsBackground = true
                };
                _listenerThread.Start();
                LogInfo($"Live HQ HTTP server listening on http://127.0.0.1:{HTTP_PORT}/");
            }
            catch (Exception ex)
            {
                LogErr($"Failed to start Live HQ HTTP server: {ex.Message}");
            }
        }

        private static void ListenHttpRequests()
        {
            while (_isRunning && _httpListener != null && _httpListener.IsListening)
            {
                try
                {
                    var context = _httpListener.GetContext();
                    ThreadPool.QueueUserWorkItem((_) => ProcessRequest(context));
                }
                catch
                {
                    // Server stopped
                }
            }
        }

        private static void ProcessRequest(HttpListenerContext context)
        {
            try
            {
                var response = context.Response;

                response.Headers.Add("Access-Control-Allow-Origin", "*");
                response.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS");
                response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Access-Control-Request-Private-Network");
                response.Headers.Add("Access-Control-Allow-Private-Network", "true");

                if (context.Request.HttpMethod == "OPTIONS")
                {
                    response.StatusCode = 204;
                    response.Close();
                    return;
                }

                string json;
                lock (_lock)
                {
                    json = _cachedTelemetryJson;
                }

                byte[] buffer = Encoding.UTF8.GetBytes(json);
                response.ContentType = "application/json";
                response.ContentLength64 = buffer.Length;
                response.StatusCode = 200;

                using (var output = response.OutputStream)
                {
                    output.Write(buffer, 0, buffer.Length);
                }
            }
            catch
            {
                // Client disconnected
            }
        }

        public static void Update()
        {
            if (Time.time - _lastUpdateTime < 0.5f) return;
            _lastUpdateTime = Time.time;

            if (SaveGameManager.Current == null) return;

            try
            {
                UpdateTelemetryJson();
            }
            catch (Exception ex)
            {
                LogWarn($"Telemetry update error: {ex.Message}");
            }
        }

        private static void UpdateTelemetryJson()
        {
            var save = SaveGameManager.Current;
            if (save == null) return;

            // Map Past 7 Days Financial Statements for Weekly Totals
            FinancialSummary latestFin = null;
            var past7DayFins = new List<FinancialSummary>();

            if (save.financialSummaries != null && save.financialSummaries.Count > 0)
            {
                latestFin = save.financialSummaries[save.financialSummaries.Count - 1];
                int startIdx = Math.Max(0, save.financialSummaries.Count - 7);
                for (int i = startIdx; i < save.financialSummaries.Count; i++)
                {
                    past7DayFins.Add(save.financialSummaries[i]);
                }
            }

            var businesses = new List<object>();
            var residences = new List<object>();
            var ownedRealEstate = new List<object>();
            var employees = new List<object>();
            var loans = new List<object>();
            var warehouses = new List<object>();
            var operationalAlerts = new List<object>();
            var weeklyRevenueHistory = new List<object>();

            float totalDailyBusinessRev = 0f;
            float totalDailyBusinessExp = 0f;
            float totalWeeklyBusinessRev = 0f;
            float totalWeeklyBusinessExp = 0f;

            float totalDailyResidentialRev = 0f;
            float totalDailyResidentialExp = 0f;
            float totalWeeklyResidentialRev = 0f;
            float totalWeeklyResidentialExp = 0f;

            // 7-day revenue trend
            foreach (var fin in past7DayFins)
            {
                float dRev = 0f;
                float dExp = 0f;
                if (fin.businessIncomeStatements != null)
                {
                    foreach (var s in fin.businessIncomeStatements)
                    {
                        dRev += s.TotalSales;
                        dExp += s.TotalOngoing + s.RentExpenses + s.SalaryExpenses;
                    }
                }

                if (fin.realEstateStatements != null)
                {
                    foreach (var reStmt in fin.realEstateStatements)
                    {
                        dRev += reStmt.Amount;
                    }
                }

                if (fin.residentialStatements != null)
                {
                    foreach (var resStmt in fin.residentialStatements)
                    {
                        dExp += resStmt.Amount;
                    }
                }

                weeklyRevenueHistory.Add(new
                {
                    dayNumber = fin.dayNumber,
                    revenue = (double)Math.Round(dRev),
                    profit = (double)Math.Round(fin.totalProfit)
                });
                totalWeeklyBusinessRev += dRev;
                totalWeeklyBusinessExp += dExp;
            }

            // 1. PROCESS OWNED REAL ESTATE PORTFOLIO
            if (save.realEstate != null)
            {
                foreach (var re in save.realEstate)
                {
                    if (re == null || re.address == null) continue;
                    string street = re.address.streetName ?? "";
                    int number = re.address.streetNumber;
                    string formattedAddr = FormatStreetAddress(street, number);
                    
                    float dailyIncome = re.DailyIncome;
                    float weeklyIncome = dailyIncome * 7f;
                    float taxes = re.TaxesAmount;
                    float weeklyTaxes = taxes * 7f;
                    float netWeekly = weeklyIncome - weeklyTaxes;

                    totalDailyResidentialRev += dailyIncome;
                    totalWeeklyResidentialRev += weeklyIncome;
                    totalDailyResidentialExp += taxes;
                    totalWeeklyResidentialExp += weeklyTaxes;

                    ownedRealEstate.Add(new
                    {
                        id = street + "_" + number,
                        address = formattedAddr,
                        streetName = street,
                        streetNumber = number,
                        totalSqm = re.totalSqm,
                        occupancyPct = re.OccupancyPercentage,
                        pricePerSqm = (double)Math.Round(re.pricePerSqm, 2),
                        dailyRevenue = (double)Math.Round(dailyIncome, 2),
                        weeklyRevenue = (double)Math.Round(weeklyIncome, 2),
                        dailyTaxes = (double)Math.Round(taxes, 2),
                        weeklyTaxes = (double)Math.Round(weeklyTaxes, 2),
                        weeklyNet = (double)Math.Round(netWeekly, 2),
                        purchasePrice = (double)Math.Round(re.purchasePrice, 2),
                        purchaseDay = re.purchaseDay
                    });
                }
            }

            // 2. PROCESS PLAYER BUILDINGS, RESIDENCES & WAREHOUSES
            if (save.BuildingRegistrations != null)
            {
                foreach (var b in save.BuildingRegistrations)
                {
                    if (!b.RentedByPlayer) continue;

                    string bType = b.businessTypeName ?? "";
                    string street = b.StreetName ?? "";
                    int number = b.StreetNumber;
                    string formattedAddr = FormatStreetAddress(street, number);
                    
                    // Keep exact raw neighborhood key for internal Pricing API calls
                    string rawDistrictKey = b.Neighborhood ?? "";
                    if (string.IsNullOrEmpty(rawDistrictKey))
                    {
                        rawDistrictKey = b.BuildingCached != null ? b.BuildingCached.Neighbourhood : street;
                    }
                    string displayDistrict = FormatDistrictName(rawDistrictKey);

                    bool isWarehouse = bType.Contains("warehouse") || (b is Warehouse);
                    bool isResidence = bType.Contains("residential") || bType.Contains("apartment") || bType.Contains("house") || string.IsNullOrEmpty(bType) || bType == "ba:businesstype_empty";

                    if (isResidence)
                    {
                        float weeklyRent = b.RentPerDay * 7f;
                        totalDailyResidentialExp += b.RentPerDay;
                        totalWeeklyResidentialExp += weeklyRent;

                        residences.Add(new
                        {
                            id = street + "_" + number,
                            address = formattedAddr,
                            streetName = street,
                            streetNumber = number,
                            type = "Leased Residence / Apartment",
                            rentPerDay = (double)b.RentPerDay,
                            rentPerWeek = (double)Math.Round(weeklyRent),
                            status = "Expense (Primary Residence)"
                        });
                        continue;
                    }

                    if (isWarehouse)
                    {
                        var warehouseObj = b as Warehouse;
                        var warehouseStock = new List<object>();

                        if (warehouseObj != null)
                        {
                            try
                            {
                                foreach (var prod in warehouseObj.GetProducts())
                                {
                                    if (prod.Contains("paperbag") || prod.Contains("plasticbag")) continue;

                                    int qty = BuildingHelper.CountResourcesInPallets(warehouseObj.Address, prod);
                                    int weeklyConsumption = warehouseObj.GetProductConsumption(prod);
                                    int weeklyDeliveries = warehouseObj.GetProductDeliveries(prod);
                                    int daysLeft = weeklyConsumption > 0 ? (int)Math.Floor((float)qty / (weeklyConsumption / 7f)) : -1;

                                    if (daysLeft >= 0 && daysLeft <= 2)
                                    {
                                        operationalAlerts.Add(new
                                        {
                                            id = "lowstock_wh_" + prod,
                                            type = "lowstock",
                                            severity = "critical",
                                            location = "Warehouse: " + formattedAddr,
                                            message = $"Low stock alert: {FormatItemName(prod)} has only {daysLeft} day(s) of pallet inventory left."
                                        });
                                    }

                                    warehouseStock.Add(new
                                    {
                                        itemName = FormatItemName(prod),
                                        rawItemName = prod,
                                        quantity = qty,
                                        weeklyConsumption = weeklyConsumption,
                                        weeklyDeliveries = weeklyDeliveries,
                                        daysLeft = daysLeft
                                    });
                                }
                            }
                            catch { }
                        }

                        warehouses.Add(new
                        {
                            id = street + "_" + number,
                            address = formattedAddr,
                            type = "Logistics Warehouse",
                            rentPerDay = (double)b.RentPerDay,
                            rentPerWeek = (double)Math.Round(b.RentPerDay * 7f),
                            assignedVehicles = warehouseObj != null ? warehouseObj.GetNumberOfAssignedCars() : 0,
                            stock = warehouseStock
                        });
                        totalDailyBusinessExp += b.RentPerDay;
                        continue;
                    }

                    // Commercial Business Accounting
                    float bizSales = 0f;
                    float bizProfit = 0f;
                    float bizSalaries = 0f;
                    float bizWeeklySales = 0f;
                    float bizWeeklyProfit = 0f;

                    if (past7DayFins.Count > 0)
                    {
                        foreach (var f in past7DayFins)
                        {
                            if (f.businessIncomeStatements == null) continue;
                            var s = f.businessIncomeStatements.Find(st => st.Address != null && st.Address.streetName == b.StreetName && st.Address.streetNumber == b.StreetNumber);
                            if (s != null)
                            {
                                bizWeeklySales += s.TotalSales;
                                bizWeeklyProfit += s.TotalProfit;
                            }
                        }
                    }

                    if (latestFin != null && latestFin.businessIncomeStatements != null)
                    {
                        var stmt = latestFin.businessIncomeStatements.Find(s => s.Address != null && s.Address.streetName == b.StreetName && s.Address.streetNumber == b.StreetNumber);
                        if (stmt != null)
                        {
                            bizSales = stmt.TotalSales;
                            bizProfit = stmt.TotalProfit;
                            bizSalaries = stmt.SalaryExpenses;
                        }
                    }

                    var todayOrderSales = new List<object>();
                    var hourReports = new List<object>();
                    int todayCustomerCount = 0;

                    if (b.orderHistory != null && b.orderHistory.Count > 0)
                    {
                        var todayOrder = b.orderHistory[b.orderHistory.Count - 1];
                        if (todayOrder != null)
                        {
                            todayCustomerCount = todayOrder.totalCustomers;

                            if (todayOrder.itemSales != null)
                            {
                                if (bizSales == 0f)
                                {
                                    bizSales = todayOrder.itemSales.Sum(s => s.totalPrice);
                                    bizProfit = bizSales - todayOrder.itemSales.Sum(s => s.totalWholesalePrice);
                                }

                                foreach (var s in todayOrder.itemSales)
                                {
                                    if (s.itemName.Contains("paperbag") || s.itemName.Contains("plasticbag")) continue;

                                    todayOrderSales.Add(new
                                    {
                                        itemName = FormatItemName(s.itemName),
                                        amountSold = s.amountSold,
                                        totalPrice = (double)s.totalPrice,
                                        totalWholesalePrice = (double)s.totalWholesalePrice
                                    });
                                }
                            }

                            if (todayOrder.hourReports != null)
                            {
                                foreach (var hr in todayOrder.hourReports)
                                {
                                    hourReports.Add(new
                                    {
                                        hour = hr.hour,
                                        customers = hr.customers
                                    });
                                }
                            }
                        }
                    }

                    totalDailyBusinessRev += bizSales;
                    totalDailyBusinessExp += b.RentPerDay + bizSalaries;

                    string readableType = FormatBusinessTypeName(bType);
                    string bName = string.IsNullOrEmpty(b.BusinessName) ? readableType : b.BusinessName;

                    // Extract Custom Logo Settings & Base64 Custom/Built-in Logo
                    string logoShape = "";
                    string logoBase64 = "";
                    string logoBgHex = "#FFFFFF";
                    string logoIconHex = "#000000";

                    if (b.logoSettings != null)
                    {
                        logoShape = b.logoSettings.logoShape ?? "";
                        try
                        {
                            Color bgCol = b.logoSettings.backgroundColor;
                            logoBgHex = $"#{ColorUtility.ToHtmlStringRGB(bgCol)}";
                        }
                        catch { }

                        try
                        {
                            Color iconCol = b.logoSettings.logoColor;
                            logoIconHex = $"#{ColorUtility.ToHtmlStringRGB(iconCol)}";
                        }
                        catch { }

                        // 1. Try loading rendered business logo directly from Player Save Directory
                        try
                        {
                            string playerLogoDir = LogoHelper.GetPlayerBusinessLogoPath(b.BusinessName);
                            if (!string.IsNullOrEmpty(playerLogoDir) && Directory.Exists(playerLogoDir))
                            {
                                string[] candidateFiles = new string[]
                                {
                                    Path.Combine(playerLogoDir, "Logo_128x128.png"),
                                    Path.Combine(playerLogoDir, "Logo_128x128.jpg"),
                                    Path.Combine(playerLogoDir, "Logo_64x64.png"),
                                    Path.Combine(playerLogoDir, "Logo_64x64.jpg"),
                                    Path.Combine(playerLogoDir, "Logo_256x256.png"),
                                    Path.Combine(playerLogoDir, "Logo_256x256.jpg")
                                };

                                foreach (var f in candidateFiles)
                                {
                                    if (File.Exists(f))
                                    {
                                        byte[] bytes = File.ReadAllBytes(f);
                                        string mime = f.EndsWith(".jpg") ? "image/jpeg" : "image/png";
                                        logoBase64 = $"data:{mime};base64," + Convert.ToBase64String(bytes);
                                        break;
                                    }
                                }
                            }
                        }
                        catch { }

                        // 2. Fallback to raw custom icon shape or built-in icon shape if rendered composite isn't present
                        if (string.IsNullOrEmpty(logoBase64))
                        {
                            try
                            {
                                if (!string.IsNullOrEmpty(logoShape))
                                {
                                    string customPath = LogoHelper.GetCustomIconPath(logoShape);
                                    string builtInPath = Path.Combine(LogoHelper.GetBuildInIconsFolder(), logoShape + ".png");
                                    string targetPath = File.Exists(customPath) ? customPath : (File.Exists(builtInPath) ? builtInPath : null);

                                    if (targetPath != null && File.Exists(targetPath))
                                    {
                                        byte[] pngBytes = File.ReadAllBytes(targetPath);
                                        logoBase64 = "data:image/png;base64," + Convert.ToBase64String(pngBytes);
                                    }
                                }
                            }
                            catch { }
                        }
                    }

                    // Compute Exact In-Game Price Suggestions with raw district key
                    var currentRetailPrices = new List<object>();
                    var storeInventoryCounts = new Dictionary<string, int>();

                    if (b.itemInstances != null)
                    {
                        foreach (var itemInst in b.itemInstances.Values)
                        {
                            if (itemInst.cargoInstances != null)
                            {
                                foreach (var cargo in itemInst.cargoInstances)
                                {
                                    if (!string.IsNullOrEmpty(cargo.itemName))
                                    {
                                        if (!storeInventoryCounts.ContainsKey(cargo.itemName))
                                        {
                                            storeInventoryCounts[cargo.itemName] = 0;
                                        }
                                        storeInventoryCounts[cargo.itemName] += cargo.amount;
                                    }
                                }
                            }
                        }
                    }

                    if (b.retailPrices != null)
                    {
                        foreach (var rp in b.retailPrices)
                        {
                            string rawName = rp.itemName ?? "";
                            if (rawName.Contains("paperbag") || rawName.Contains("plasticbag") || rawName.Contains("isbag")) continue;

                            string cleanName = FormatItemName(rawName);
                            
                            float marketRefPrice = 0f;
                            float maxAcceptablePrice = 0f;
                            float optimalPrice = 0f;
                            float wholesalePrice = 0f;

                            try
                            {
                                var itemObj = BigAmbitions.Items.ItemsGetter.GetByName(rawName);
                                if (itemObj != null)
                                {
                                    wholesalePrice = itemObj.GetWholesalePrice();
                                    marketRefPrice = itemObj.DefaultMarketPrice;
                                }
                            }
                            catch { }

                            // 1. Precise Raw District Calculation
                            try
                            {
                                float calculatedRef = ItemHelper.GetMarketReferencePrice(rawName, rawDistrictKey);
                                if (calculatedRef > 0f) marketRefPrice = calculatedRef;
                            }
                            catch { }

                            try
                            {
                                float calculatedMax = ItemHelper.CalculateMaxAcceptablePriceByNeighborhood(rawName, rawDistrictKey);
                                if (calculatedMax > 0f && calculatedMax < 9999f) maxAcceptablePrice = calculatedMax;
                            }
                            catch { }

                            try
                            {
                                var (sMin, sMax) = PricingManagerHelper.ComputeSuggestion(rawName, rawDistrictKey, 1.0f, 0f);
                                if (sMax > 0f) optimalPrice = sMax;
                            }
                            catch { }

                            // Fallback if raw lookup failed
                            if (optimalPrice <= 0f)
                            {
                                optimalPrice = maxAcceptablePrice > 0f ? maxAcceptablePrice : (wholesalePrice > 0f ? wholesalePrice * 2.2f : rp.price);
                            }
                            if (maxAcceptablePrice <= 0f)
                            {
                                maxAcceptablePrice = (float)Math.Round(optimalPrice * 1.15f, 2);
                            }

                            int currentShelfStock = storeInventoryCounts.ContainsKey(rawName) ? storeInventoryCounts[rawName] : 0;

                            if (currentShelfStock == 0 && !b.temporarilyClosed)
                            {
                                operationalAlerts.Add(new
                                {
                                    id = "out_of_stock_" + b.StreetName + "_" + rawName,
                                    type = "lowstock",
                                    severity = "critical",
                                    location = bName,
                                    message = $"Store stockout: {cleanName} is completely out of stock on shelves while store is open."
                                });
                            }
                            else if (currentShelfStock > 0 && currentShelfStock < 10)
                            {
                                operationalAlerts.Add(new
                                {
                                    id = "lowstock_store_" + b.StreetName + "_" + rawName,
                                    type = "lowstock",
                                    severity = "warning",
                                    location = bName,
                                    message = $"Low store stock: {cleanName} has only {currentShelfStock} units left on shelves."
                                });
                            }

                            currentRetailPrices.Add(new
                            {
                                rawItemName = rawName,
                                displayName = cleanName,
                                currentPrice = (double)Math.Round(rp.price, 2),
                                wholesalePrice = (double)Math.Round(wholesalePrice, 2),
                                marketReferencePrice = (double)Math.Round(marketRefPrice, 2),
                                optimalPrice = (double)Math.Round(optimalPrice, 2),
                                maxMarketCeiling = (double)Math.Round(maxAcceptablePrice, 2),
                                inStoreStock = currentShelfStock
                            });
                        }
                    }

                    // Count active staff assigned to this building
                    int staffCount = 0;
                    if (save.EmployeeInstances != null)
                    {
                        staffCount = save.EmployeeInstances.FindAll(e => e.assignedAddress != null && e.assignedAddress.streetName == b.StreetName && e.assignedAddress.streetNumber == b.StreetNumber).Count;
                    }

                    // Extract Full 7-Day Schedule Matrix with Shift Coverages
                    var scheduleWeek = new List<object>();
                    int totalOpenHoursPerWeek = 0;
                    int scheduledShiftHoursPerWeek = 0;

                    if (b.scheduleDays != null)
                    {
                        foreach (var sd in b.scheduleDays)
                        {
                            var shifts = new List<object>();
                            int dayOpenHours = 0;
                            int dayShiftHours = 0;

                            if (sd.isOpen)
                            {
                                dayOpenHours = sd.GetHoursOpen;
                                totalOpenHoursPerWeek += dayOpenHours;
                            }

                            if (sd.workShifts != null)
                            {
                                foreach (var ws in sd.workShifts)
                                {
                                    int dur = ws.endingHour - ws.startingHour;
                                    dayShiftHours += dur;
                                    scheduledShiftHoursPerWeek += dur;

                                    string empName = "Staff";
                                    string empSkill = "Customer Service";
                                    string empRole = "cashier";

                                    string stationName = "";

                                    // 1. Check WorkShift and ScheduleDay properties for Station/Workstation/Appliance (e.g. "Cleaning Station", "Cash Register", "Security Desk")
                                    try
                                    {
                                        var wsType = ws.GetType();

                                        foreach (var f in wsType.GetFields())
                                        {
                                            string fVal = f.GetValue(ws)?.ToString() ?? "";
                                            string fvLower = fVal.ToLower();
                                            if (fvLower.Contains("clean")) { empRole = "cleaner"; empSkill = "Cleaning"; stationName = fVal; }
                                            else if (fvLower.Contains("security") || fvLower.Contains("guard")) { empRole = "security"; empSkill = "Security"; stationName = fVal; }
                                            else if (fvLower.Contains("logistic") || fvLower.Contains("driver") || fvLower.Contains("delivery")) { empRole = "logistics"; empSkill = "Logistics"; stationName = fVal; }
                                            else if (fvLower.Contains("office") || fvLower.Contains("law") || fvLower.Contains("program") || fvLower.Contains("web")) { empRole = "office"; empSkill = "Office / Tech"; stationName = fVal; }
                                            else if (fvLower.Contains("cashier") || fvLower.Contains("register")) { empRole = "cashier"; empSkill = "Customer Service"; stationName = fVal; }
                                        }

                                        foreach (var p in wsType.GetProperties())
                                        {
                                            if (p.CanRead && p.GetIndexParameters().Length == 0)
                                            {
                                                string pVal = p.GetValue(ws, null)?.ToString() ?? "";
                                                string pvLower = pVal.ToLower();
                                                if (pvLower.Contains("clean")) { empRole = "cleaner"; empSkill = "Cleaning"; stationName = pVal; }
                                                else if (pvLower.Contains("security") || pvLower.Contains("guard")) { empRole = "security"; empSkill = "Security"; stationName = pVal; }
                                                else if (pvLower.Contains("logistic") || pvLower.Contains("driver") || pvLower.Contains("delivery")) { empRole = "logistics"; empSkill = "Logistics"; stationName = pVal; }
                                                else if (pvLower.Contains("office") || pvLower.Contains("law") || pvLower.Contains("program") || pvLower.Contains("web")) { empRole = "office"; empSkill = "Office / Tech"; stationName = pVal; }
                                                else if (pvLower.Contains("cashier") || pvLower.Contains("register")) { empRole = "cashier"; empSkill = "Customer Service"; stationName = pVal; }
                                            }
                                        }

                                        // Also check parent ScheduleDay workstation / station name if present
                                        var sdType = sd.GetType();
                                        foreach (var sdf in sdType.GetFields())
                                        {
                                            string sdfVal = sdf.GetValue(sd)?.ToString() ?? "";
                                            string sdfLower = sdfVal.ToLower();
                                            if (sdfLower.Contains("clean")) { empRole = "cleaner"; empSkill = "Cleaning"; stationName = sdfVal; }
                                            else if (sdfLower.Contains("security") || sdfLower.Contains("guard")) { empRole = "security"; empSkill = "Security"; stationName = sdfVal; }
                                        }
                                        foreach (var sdp in sdType.GetProperties())
                                        {
                                            if (sdp.CanRead && sdp.GetIndexParameters().Length == 0)
                                            {
                                                string sdpVal = sdp.GetValue(sd, null)?.ToString() ?? "";
                                                string sdpLower = sdpVal.ToLower();
                                                if (sdpLower.Contains("clean")) { empRole = "cleaner"; empSkill = "Cleaning"; stationName = sdpVal; }
                                                else if (sdpLower.Contains("security") || sdpLower.Contains("guard")) { empRole = "security"; empSkill = "Security"; stationName = sdpVal; }
                                            }
                                        }
                                    }
                                    catch { }

                                    // 2. Cross-reference employee character data if available
                                    if (!string.IsNullOrEmpty(ws.employeeId) && save.EmployeeInstances != null)
                                    {
                                        var foundEmp = save.EmployeeInstances.Find(e => e.id == ws.employeeId);
                                        if (foundEmp != null)
                                        {
                                            if (foundEmp.characterData != null && !string.IsNullOrEmpty(foundEmp.characterData.name))
                                            {
                                                empName = foundEmp.characterData.name;
                                            }

                                            // Check employee assigned job/profession or primary skill if role was still default
                                            try
                                            {
                                                var empObjType = foundEmp.GetType();
                                                foreach (var ef in empObjType.GetFields())
                                                {
                                                    string efVal = ef.GetValue(foundEmp)?.ToString() ?? "";
                                                    string efLower = efVal.ToLower();
                                                    if (efLower.Contains("clean")) { empRole = "cleaner"; empSkill = "Cleaning"; }
                                                    else if (efLower.Contains("security") || efLower.Contains("guard")) { empRole = "security"; empSkill = "Security"; }
                                                }

                                                if (empRole == "cashier")
                                                {
                                                    string rawPrimary = foundEmp.GetPrimarySkill();
                                                    string fSkill = FormatSkillName(rawPrimary);
                                                    string skillLower = (fSkill + " " + rawPrimary).ToLower();
                                                    if (skillLower.Contains("clean")) { empRole = "cleaner"; empSkill = "Cleaning"; }
                                                    else if (skillLower.Contains("security") || skillLower.Contains("guard")) { empRole = "security"; empSkill = "Security"; }
                                                    else if (skillLower.Contains("logistic") || skillLower.Contains("driver")) { empRole = "logistics"; empSkill = "Logistics"; }
                                                    else if (skillLower.Contains("office") || skillLower.Contains("law") || skillLower.Contains("program") || skillLower.Contains("web")) { empRole = "office"; empSkill = "Office / Tech"; }
                                                    else { empSkill = fSkill; }
                                                }
                                            }
                                            catch { }
                                        }
                                    }

                                    shifts.Add(new
                                    {
                                        startHour = ws.startingHour,
                                        endHour = ws.endingHour,
                                        employeeId = ws.employeeId,
                                        employeeName = empName,
                                        stationName = stationName,
                                        role = empRole,
                                        skillName = empSkill,
                                        duration = dur
                                    });
                                }
                            }

                            int dayStartHour = 8;
                            int dayEndHour = 22;

                            try
                            {
                                // In Big Ambitions ScheduleDay:
                                // Check fields openingHour, closingHour, openFrom, openTo, or hours
                                var t = sd.GetType();
                                var openField = t.GetField("openingHour") ?? t.GetField("openFrom") ?? t.GetField("startHour");
                                var closeField = t.GetField("closingHour") ?? t.GetField("openTo") ?? t.GetField("endHour");
                                var openProp = t.GetProperty("OpeningHour") ?? t.GetProperty("OpenFrom") ?? t.GetProperty("StartHour");
                                var closeProp = t.GetProperty("ClosingHour") ?? t.GetProperty("OpenTo") ?? t.GetProperty("EndHour");

                                if (openField != null) dayStartHour = Convert.ToInt32(openField.GetValue(sd));
                                else if (openProp != null) dayStartHour = Convert.ToInt32(openProp.GetValue(sd));

                                if (closeField != null) dayEndHour = Convert.ToInt32(closeField.GetValue(sd));
                                else if (closeProp != null) dayEndHour = Convert.ToInt32(closeProp.GetValue(sd));
                            }
                            catch {}

                            scheduleWeek.Add(new
                            {
                                day = sd.day.ToString(),
                                isOpen = sd.isOpen,
                                openHours = dayOpenHours,
                                startHour = dayStartHour,
                                endHour = dayEndHour,
                                shiftHours = dayShiftHours,
                                shifts = shifts
                            });
                        }
                    }

                    if (totalOpenHoursPerWeek > 0 && scheduledShiftHoursPerWeek == 0)
                    {
                        operationalAlerts.Add(new
                        {
                            id = "unstaffed_" + b.StreetName + "_" + b.StreetNumber,
                            type = "unstaffed",
                            severity = "warning",
                            location = bName,
                            message = $"{bName} is open {totalOpenHoursPerWeek}h/week with zero scheduled shifts."
                        });
                    }

                    // Native Cleanliness Check & Alert
                    int cleanPct = 100;
                    try
                    {
                        float calculatedClean = BuildingCleanlinessHelper.GetCleanliness(b);
                        cleanPct = Mathf.Clamp(Mathf.RoundToInt(calculatedClean), 0, 100);
                    }
                    catch
                    {
                        if (b.satisfaction != null) cleanPct = b.satisfaction.cleanliness;
                    }

                    if (cleanPct < 70 && !b.temporarilyClosed)
                    {
                        operationalAlerts.Add(new
                        {
                            id = "dirty_store_" + b.StreetName + "_" + b.StreetNumber,
                            type = "maintenance",
                            severity = "warning",
                            location = bName,
                            message = $"{bName} cleanliness has dropped to {cleanPct}%. Assign cleaning shifts or clean store to prevent customer churn."
                        });
                    }

                    int overallSat = 85;
                    int csSat = 85;
                    int priceSat = 85;
                    int facilitySat = 85;

                    if (b.satisfaction != null)
                    {
                        overallSat = b.satisfaction.overall;
                        csSat = b.satisfaction.customerService;
                        priceSat = b.satisfaction.pricing;
                        facilitySat = b.satisfaction.facility;
                        cleanPct = b.satisfaction.cleanliness;
                    }

                    int trafficIndex = 0;
                    int marketingIndex = 0;
                    int totalPromotion = 0;

                    if (b.promotion != null)
                    {
                        trafficIndex = b.promotion.trafficIndex;
                        marketingIndex = b.promotion.marketing;
                        totalPromotion = b.promotion.total;
                    }

                    businesses.Add(new
                    {
                        id = street + "_" + number,
                        name = bName,
                        type = readableType,
                        rawType = bType,
                        address = formattedAddr,
                        streetName = street,
                        streetNumber = number,
                        district = displayDistrict,
                        rawDistrict = rawDistrictKey,
                        dailyRevenue = (double)Math.Round(bizSales),
                        dailyProfit = (double)Math.Round(bizProfit),
                        weeklyRevenue = (double)Math.Round(bizWeeklySales > 0 ? bizWeeklySales : bizSales * 7f),
                        weeklyProfit = (double)Math.Round(bizWeeklyProfit > 0 ? bizWeeklyProfit : bizProfit * 7f),
                        weeklyRent = (double)Math.Round(b.RentPerDay * 7f),
                        
                        logo = new
                        {
                            shape = logoShape,
                            base64 = logoBase64,
                            bgHex = logoBgHex,
                            iconHex = logoIconHex
                        },

                        customerSatisfaction = overallSat,
                        satisfactionBreakdown = new
                        {
                            overall = overallSat,
                            customerService = csSat,
                            cleanliness = cleanPct,
                            pricing = priceSat,
                            facility = facilitySat
                        },

                        promotion = new
                        {
                            trafficIndex = trafficIndex,
                            marketing = marketingIndex,
                            total = totalPromotion,
                            activeCampaigns = b.marketingCampaigns != null ? b.marketingCampaigns.Count : 0
                        },

                        customerCapacity = b.customerCapacity,
                        isOpenNow = !b.temporarilyClosed,
                        staffOnDuty = staffCount,
                        openHoursPerWeek = totalOpenHoursPerWeek,
                        scheduledShiftHoursPerWeek = scheduledShiftHoursPerWeek,
                        cleanliness = cleanPct,
                        securityPct = (int)Math.Round(b.securityLevelPercentage * 100f),
                        retailPrices = currentRetailPrices,
                        todayCustomerCount = todayCustomerCount,
                        todayItemSales = todayOrderSales,
                        hourReports = hourReports,
                        scheduleWeek = scheduleWeek
                    });
                }
            }

            // 3. PROCESS EMPLOYEES & WORKFORCE DEMANDS
            float totalWagesPerHour = 0f;
            if (save.EmployeeInstances != null)
            {
                foreach (var emp in save.EmployeeInstances)
                {
                    totalWagesPerHour += emp.hourlyWage;
                    string workLoc = emp.assignedAddress != null ? FormatStreetAddress(emp.assignedAddress.streetName, emp.assignedAddress.streetNumber) : "Unassigned";
                    string empName = (emp.characterData != null && !string.IsNullOrEmpty(emp.characterData.name)) ? emp.characterData.name : "Employee";
                    
                    int skillPct = 50;
                    string primarySkill = "Customer Service";
                    string empRole = "cashier";

                    try
                    {
                        string rawSkill = emp.GetPrimarySkill();
                        primarySkill = FormatSkillName(rawSkill);
                        skillPct = (int)Math.Round(emp.GetSkillValue(rawSkill));

                        string sLower = rawSkill.ToLower();
                        if (sLower.Contains("clean")) { empRole = "cleaner"; primarySkill = "Cleaning"; }
                        else if (sLower.Contains("security") || sLower.Contains("guard")) { empRole = "security"; primarySkill = "Security"; }
                        else if (sLower.Contains("logistic") || sLower.Contains("driver")) { empRole = "logistics"; primarySkill = "Logistics"; }
                        else if (sLower.Contains("office") || sLower.Contains("law") || sLower.Contains("program") || sLower.Contains("web")) { empRole = "office"; primarySkill = "Office / Tech"; }
                        else { empRole = "cashier"; }
                    }
                    catch { }

                    var demandList = new List<object>();
                    if (emp.demands != null)
                    {
                        foreach (var d in emp.demands)
                        {
                            demandList.Add(new
                            {
                                name = FormatDemandName(d),
                                rawName = d
                            });
                        }
                    }

                    bool isComplaining = emp.complaintData != null && emp.complaintData.isComplaining;
                    if (isComplaining)
                    {
                        operationalAlerts.Add(new
                        {
                            id = "complaint_" + emp.id,
                            type = "complaint",
                            severity = "critical",
                            location = empName,
                            message = $"{empName} has an active workplace complaint. Consider granting a bonus or addressing demands."
                        });
                    }

                    if (emp.satisfaction < 70)
                    {
                        operationalAlerts.Add(new
                        {
                            id = "satisfaction_" + emp.id,
                            type = "satisfaction",
                            severity = "warning",
                            location = empName,
                            message = $"{empName}'s satisfaction is low ({Math.Round(emp.satisfaction)}%). Risk of quit notice."
                        });
                    }

                    employees.Add(new
                    {
                        id = emp.id,
                        name = empName,
                        role = empRole,
                        wage = (double)Math.Round(emp.hourlyWage, 2),
                        weeklyWages = (double)Math.Round(emp.hourlyWage * emp.assignedWeeklyHours, 2),
                        satisfaction = (int)Math.Round(emp.satisfaction),
                        primarySkillName = primarySkill,
                        skillLevel = skillPct,
                        workingLocation = workLoc,
                        weeklyHours = emp.assignedWeeklyHours,
                        isAbsent = emp.isAbsent,
                        isComplaining = isComplaining,
                        daysHired = save.Day - emp.dayHired,
                        demands = demandList
                    });
                }
            }

            // 4. PROCESS LOANS
            float totalLoanBalance = 0f;
            float totalWeeklyLoanPayments = 0f;
            if (save.Loans != null)
            {
                foreach (var l in save.Loans)
                {
                    totalLoanBalance += l.remainingAmount;
                    totalWeeklyLoanPayments += l.dailyPayment * 7f;
                    loans.Add(new
                    {
                        totalAmount = (double)Math.Round(l.totalAmount),
                        remainingAmount = (double)Math.Round(l.remainingAmount),
                        dailyPayment = (double)l.dailyPayment,
                        weeklyPayment = (double)Math.Round(l.dailyPayment * 7f),
                        dailyInterest = l.dailyInterest
                    });
                }
            }

            // 5. TAX PERIOD DEDUCTIONS & UNPAID TAXES
            float totalTaxDeductions = 0f;
            if (save.currentTaxPeriodDeductibleExpenses != null)
            {
                foreach (var t in save.currentTaxPeriodDeductibleExpenses)
                {
                    totalTaxDeductions += t.amount;
                }
            }

            double unpaidTaxesAmount = 0.0;
            if (save.currentUnpaidTaxes != null)
            {
                unpaidTaxesAmount = (double)Math.Round(save.currentUnpaidTaxes.totalToPay);
                if (unpaidTaxesAmount > 0)
                {
                    operationalAlerts.Add(new
                    {
                        id = "taxes_due",
                        type = "tax",
                        severity = "warning",
                        location = "City Tax Authority",
                        message = $"You have ${unpaidTaxesAmount:N0} in unpaid taxes awaiting payment."
                    });
                }
            }

            // Total Unified Empire Accounting
            double overallWeeklyRevenue = totalWeeklyBusinessRev + totalWeeklyResidentialRev;
            double overallWeeklyExpenses = totalWeeklyBusinessExp + totalWeeklyResidentialExp;

            var telemetryData = new
            {
                isConnected = true,
                modVersion = "2.2.0",
                lastHeartbeat = DateTime.UtcNow.ToString("o"),
                gameDay = save.Day,
                gameHour = save.Hour,
                gameMinute = (int)save.Minute,
                playerCash = (double)Math.Round(save.Money),
                bankBalance = (double)Math.Round(save.Money),
                totalLoans = (double)Math.Round(totalLoanBalance),
                netWorth = (double)Math.Round(save.NetWorth),
                playerHappiness = (int)Math.Round(save.Happiness),
                playerEnergy = (int)Math.Round(save.Energy),
                playerHunger = (int)Math.Round(save.Hunger),
                
                // Daily Economics
                dailyRevenueTotal = (double)Math.Round(totalDailyBusinessRev + totalDailyResidentialRev),
                dailyExpensesTotal = (double)Math.Round(totalDailyBusinessExp + totalDailyResidentialExp),
                dailyBusinessRevenue = (double)Math.Round(totalDailyBusinessRev),
                dailyResidentialRevenue = (double)Math.Round(totalDailyResidentialRev),

                // Weekly Economics (Unified Empire Model)
                weeklyRevenueTotal = (double)Math.Round(overallWeeklyRevenue),
                weeklyExpensesTotal = (double)Math.Round(overallWeeklyExpenses),
                weeklyBusinessRevenue = (double)Math.Round(totalWeeklyBusinessRev),
                weeklyBusinessProfit = (double)Math.Round(totalWeeklyBusinessRev - totalWeeklyBusinessExp),
                weeklyResidentialRevenue = (double)Math.Round(totalWeeklyResidentialRev),
                weeklyResidentialExpenses = (double)Math.Round(totalWeeklyResidentialExp),
                weeklyResidentialNet = (double)Math.Round(totalWeeklyResidentialRev - totalWeeklyResidentialExp),

                // Workforce & Treasury
                totalEmployees = save.EmployeeInstances != null ? save.EmployeeInstances.Count : 0,
                totalHourlyPayroll = (double)Math.Round(totalWagesPerHour, 2),
                weeklyPayrollTotal = (double)Math.Round(save.EmployeeInstances != null ? save.EmployeeInstances.Sum(e => e.hourlyWage * e.assignedWeeklyHours) : 0, 2),
                taxDeductibleExpenses = (double)Math.Round(totalTaxDeductions),
                unpaidTaxes = unpaidTaxesAmount,

                // Entities & Portfolios
                weeklyRevenueHistory = weeklyRevenueHistory,
                businesses = businesses,
                residences = residences,
                ownedRealEstate = ownedRealEstate,
                warehouses = warehouses,
                employees = employees,
                loans = loans,
                operationalAlerts = operationalAlerts
            };

            string newJson = JsonConvert.SerializeObject(telemetryData);
            lock (_lock)
            {
                _cachedTelemetryJson = newJson;
            }
        }

        private static string FormatStreetAddress(string street, int number)
        {
            if (string.IsNullOrEmpty(street)) return "Unknown Address";
            string clean = street.Replace("ba:street_", "").Replace("_", " ");
            return System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(clean) + " " + number;
        }

        private static string FormatDistrictName(string district)
        {
            if (string.IsNullOrEmpty(district)) return "New York City";
            string clean = district.Replace("ba:neighborhood_", "").Replace("ba:district_", "").Replace("_", " ");
            if (clean.Equals("garmentdistrict", StringComparison.OrdinalIgnoreCase)) return "Garment District";
            if (clean.Equals("hellskitchen", StringComparison.OrdinalIgnoreCase)) return "Hell's Kitchen";
            if (clean.Equals("murrayhill", StringComparison.OrdinalIgnoreCase)) return "Murray Hill";
            if (clean.Equals("midtown", StringComparison.OrdinalIgnoreCase)) return "Midtown";
            return System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(clean);
        }

        private static string FormatBusinessTypeName(string bType)
        {
            string clean = bType.Replace("ba:businesstype_", "").ToLowerInvariant();
            switch (clean)
            {
                case "fastfood":
                case "fastfoodrestaurant":
                    return "Fast Food Restaurant";
                case "coffeeshop":
                    return "Coffee Shop";
                case "supermarket":
                    return "Supermarket";
                case "electronicsstore":
                    return "Electronics Store";
                case "clothingstore":
                    return "Clothing Store";
                case "jewelrystore":
                    return "Jewelry Store";
                case "liquorstore":
                    return "Liquor Store";
                case "florist":
                    return "Florist";
                case "bookstore":
                    return "Bookstore";
                case "giftshop":
                    return "Gift Shop";
                case "lawfirm":
                    return "Law Firm";
                case "webdevelopmentagency":
                    return "Web Dev Agency";
                case "graphicdesignagency":
                case "graphicdesigner":
                    return "Graphic Design Agency";
                default:
                    return System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(clean.Replace("_", " "));
            }
        }

        private static string FormatItemName(string raw)
        {
            if (string.IsNullOrEmpty(raw)) return "";
            string clean = raw.Replace("ba:itemname_", "").Replace("ba:item_", "").Replace("ba:item", "").Replace("_", " ");
            return System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(clean);
        }

        private static string FormatSkillName(string raw)
        {
            if (string.IsNullOrEmpty(raw)) return "General";
            string clean = raw.Replace("ba:skill_", "").Replace("_", " ");
            return System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(clean);
        }

        private static string FormatDemandName(string raw)
        {
            if (string.IsNullOrEmpty(raw)) return "";
            string clean = raw.Replace("ba:jobdemand_", "").Replace("ba:demand_", "").Replace("_", " ");
            return System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(clean);
        }
    }
}
