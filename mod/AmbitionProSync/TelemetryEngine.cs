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
        public const string MOD_VERSION = "2.3.0";
        public const int HTTP_PORT = 8765;

        private static HttpListener _httpListener;
        private static Thread _listenerThread;
        private static bool _isRunning = false;
        private static string _cachedTelemetryJson = "{}";
        private static readonly object _lock = new object();
        private static float _lastUpdateTime = 0f;
        private static volatile bool _requestPending = true; // Start true so initial state is available immediately

        // Logo cache: maps logoShape string to base64 data string. Avoids synchronous disk I/O and base64 re-encoding every cycle.
        private static readonly Dictionary<string, string> _logoCache = new Dictionary<string, string>();

        // Market price cache: maps "rawItem_district" to cached (wholesalePrice, marketRefPrice, optimalPrice, maxAcceptablePrice)
        private static readonly Dictionary<string, (float wholesale, float marketRef, float optimal, float maxAcceptable)> _priceSuggestionCache = new Dictionary<string, (float, float, float, float)>();
        private static int _lastPriceCacheDay = -1;

        // WorkShift & ScheduleDay reflection cache: maps Type to cached property/field accessors
        private static System.Reflection.FieldInfo[] _cachedWsFields = null;
        private static System.Reflection.PropertyInfo[] _cachedWsProps = null;
        private static System.Reflection.FieldInfo[] _cachedSdFields = null;
        private static System.Reflection.PropertyInfo[] _cachedSdProps = null;
        private static System.Reflection.FieldInfo _cachedSdSlotsField = null;
        private static System.Reflection.PropertyInfo _cachedSdSlotsProp = null;
        private static bool _sdSlotsLookupDone = false;
        private static System.Reflection.FieldInfo[] _cachedEmpFields = null;

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
                var origin = context.Request.Headers["Origin"];
                // Allow dynamic companion webapp origin (Vercel, localhost, custom domains) or wildcard
                response.Headers.Add("Access-Control-Allow-Origin", string.IsNullOrEmpty(origin) ? "*" : origin);
                response.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS");
                response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Access-Control-Request-Private-Network, Origin, Accept");
                response.Headers.Add("Access-Control-Allow-Private-Network", "true");
                response.Headers.Add("Access-Control-Max-Age", "86400"); // Cache preflight for 24h

                if (context.Request.HttpMethod == "OPTIONS")
                {
                    response.StatusCode = 204;
                    response.Close();
                    return;
                }

                // Strictly enforce GET-only read endpoints (Zero write/POST/PUT mutations allowed)
                if (context.Request.HttpMethod != "GET")
                {
                    response.StatusCode = 405; // Method Not Allowed
                    response.Close();
                    return;
                }

                _requestPending = true;

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
            // Only rebuild telemetry if a web client has actually requested data, and throttle to 2.0s
            // This provides smooth real-time updates while eliminating micro-stutters completely
            if (!_requestPending) return;
            if (Time.unscaledTime - _lastUpdateTime < 2.0f) return;
            _lastUpdateTime = Time.unscaledTime;
            _requestPending = false;

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

            // Map Financial Statements for History & Totals
            FinancialSummary latestFin = null;
            var past7DayFins = new List<FinancialSummary>();
            var allFinSummaries = new List<FinancialSummary>();

            if (save.financialSummaries != null && save.financialSummaries.Count > 0)
            {
                latestFin = save.financialSummaries[save.financialSummaries.Count - 1];
                int startIdx = Math.Max(0, save.financialSummaries.Count - 7);
                for (int i = startIdx; i < save.financialSummaries.Count; i++)
                {
                    past7DayFins.Add(save.financialSummaries[i]);
                }
                allFinSummaries.AddRange(save.financialSummaries);
            }

            var businesses = new List<object>();
            var residences = new List<object>();
            var ownedRealEstate = new List<object>();
            var employees = new List<object>();
            var loans = new List<object>();
            var warehouses = new List<object>();
            var operationalAlerts = new List<object>();
            var weeklyRevenueHistory = new List<object>();

            // Pre-index employees into O(1) fast lookup dictionaries to scale effortlessly with 1000+ employees
            var empById = new Dictionary<string, EmployeeInstance>();
            var empCountByAddress = new Dictionary<string, int>();
            if (save.EmployeeInstances != null)
            {
                foreach (var e in save.EmployeeInstances)
                {
                    if (e == null) continue;
                    if (!string.IsNullOrEmpty(e.id))
                    {
                        empById[e.id] = e;
                    }
                    if (e.assignedAddress != null && !string.IsNullOrEmpty(e.assignedAddress.streetName))
                    {
                        string addrKey = $"{e.assignedAddress.streetName}_{e.assignedAddress.streetNumber}";
                        empCountByAddress[addrKey] = empCountByAddress.TryGetValue(addrKey, out int c) ? c + 1 : 1;
                    }
                }
            }

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
                    bool isHeadquarters = bType.Contains("headquarters") || bType.Contains("hq") || bType == "ba:businesstype_headquarters";

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

                    // Headquarters are dedicated management offices, not consumer retail/service storefronts.
                    // Account for rent expense and bypass businesses storefront collection completely.
                    if (isHeadquarters)
                    {
                        totalDailyBusinessExp += b.RentPerDay;
                        continue;
                    }

                    // Commercial Business Accounting
                    float bizSales = 0f;
                    float bizProfit = 0f;
                    float bizSalaries = 0f;
                    float bizWeeklySales = 0f;
                    float bizWeeklyProfit = 0f;
                    var bizRevenueHistory = new List<object>();

                    // 1. Calculate 7-day weekly totals
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

                    // 2. Build full revenue history from all available financial summaries (for 7d, 60d, all-time charts)
                    if (allFinSummaries.Count > 0)
                    {
                        foreach (var f in allFinSummaries)
                        {
                            if (f.businessIncomeStatements == null) continue;
                            var s = f.businessIncomeStatements.Find(st => st.Address != null && st.Address.streetName == b.StreetName && st.Address.streetNumber == b.StreetNumber);
                            bizRevenueHistory.Add(new
                            {
                                dayNumber  = f.dayNumber,
                                revenue    = (double)Math.Round(s?.TotalSales ?? 0f),
                                profit     = (double)Math.Round(s?.TotalProfit ?? 0f),
                                salaries   = (double)Math.Round(s?.SalaryExpenses ?? 0f),
                                rent       = (double)Math.Round(s?.RentExpenses ?? 0f),
                                ongoing    = (double)Math.Round(s?.TotalOngoing ?? 0f),
                                expenses   = (double)Math.Round((s?.SalaryExpenses ?? 0f) + (s?.RentExpenses ?? 0f) + (s?.TotalOngoing ?? 0f))
                            });
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
                    var fullOrderHistory = new List<object>();
                    int todayCustomerCount = 0;
                    var todayItemSoldCounts = new Dictionary<string, int>();

                    if (b.orderHistory != null && b.orderHistory.Count > 0)
                    {
                        // Process all order history entries for product sales and customer history
                        foreach (var orderEntry in b.orderHistory)
                        {
                            if (orderEntry == null) continue;

                            var itemsList = new List<object>();
                            if (orderEntry.itemSales != null)
                            {
                                foreach (var item in orderEntry.itemSales)
                                {
                                    if (item.itemName.Contains("paperbag") || item.itemName.Contains("plasticbag")) continue;
                                    itemsList.Add(new
                                    {
                                        itemName = FormatItemName(item.itemName),
                                        rawItemName = item.itemName,
                                        amountSold = item.amountSold,
                                        totalPrice = (double)item.totalPrice,
                                        totalWholesalePrice = (double)item.totalWholesalePrice
                                    });
                                }
                            }

                            fullOrderHistory.Add(new
                            {
                                dayNumber = orderEntry.dayNumber,
                                totalCustomers = orderEntry.totalCustomers,
                                totalRevenue = (double)orderEntry.totalRevenue,
                                itemSales = itemsList
                            });
                        }

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

                                    if (!todayItemSoldCounts.ContainsKey(s.itemName))
                                    {
                                        todayItemSoldCounts[s.itemName] = 0;
                                    }
                                    todayItemSoldCounts[s.itemName] += s.amountSold;

                                    todayOrderSales.Add(new
                                    {
                                        itemName = FormatItemName(s.itemName),
                                        rawItemName = s.itemName,
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

                        // Extract clean logo shape icon (PNG) only with in-memory caching
                        // Avoids synchronous disk I/O and base64 re-encoding every single second
                        if (!string.IsNullOrEmpty(logoShape))
                        {
                            if (_logoCache.TryGetValue(logoShape, out string cachedLogo))
                            {
                                logoBase64 = cachedLogo;
                            }
                            else
                            {
                                try
                                {
                                    string customPath = LogoHelper.GetCustomIconPath(logoShape);
                                    string builtInPath = Path.Combine(LogoHelper.GetBuildInIconsFolder(), logoShape + ".png");
                                    string targetPath = File.Exists(customPath) ? customPath : (File.Exists(builtInPath) ? builtInPath : null);

                                    if (targetPath != null && File.Exists(targetPath))
                                    {
                                        byte[] pngBytes = File.ReadAllBytes(targetPath);
                                        logoBase64 = "data:image/png;base64," + Convert.ToBase64String(pngBytes);
                                        _logoCache[logoShape] = logoBase64;
                                    }
                                }
                                catch { }
                            }
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
                        var availableProducts = b.cachedAvailableProducts ?? b.GetListOfItemsForSale();

                        foreach (var rp in b.retailPrices)
                        {
                            string rawName = rp.itemName ?? "";
                            // Include paperbags, but skip internal bag flags
                            if (rawName.Contains("isbag")) continue;

                            // STRICT FILTER: Only include products that the business actually sells (has shelves/active for sale)
                            // Note: paperbags might not be in cachedAvailableProducts, so let paperbag pass through if in retailPrices
                            bool isBagItem = rawName.Contains("paperbag") || rawName.Contains("plasticbag");
                            if (!isBagItem && availableProducts != null && availableProducts.Count > 0 && !availableProducts.Contains(rawName))
                            {
                                continue;
                            }

                            string cleanName = FormatItemName(rawName);
                            
                            float marketRefPrice = 0f;
                            float maxAcceptablePrice = 0f;
                            float optimalPrice = 0f;
                            float wholesalePrice = 0f;

                            // Cache market & district price calculations per (item, district) to prevent repetitive calculations
                            string priceCacheKey = $"{rawName}_{rawDistrictKey}";
                            if (save.Day != _lastPriceCacheDay)
                            {
                                _priceSuggestionCache.Clear();
                                _lastPriceCacheDay = save.Day;
                            }

                            if (_priceSuggestionCache.TryGetValue(priceCacheKey, out var cachedPricing))
                            {
                                wholesalePrice = cachedPricing.wholesale;
                                marketRefPrice = cachedPricing.marketRef;
                                optimalPrice = cachedPricing.optimal;
                                maxAcceptablePrice = cachedPricing.maxAcceptable;
                            }
                            else
                            {
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

                                // 1. Precise District Market Reference Price
                                try
                                {
                                    float calculatedRef = ItemHelper.GetMarketReferencePrice(rawName, rawDistrictKey);
                                    if (calculatedRef > 0f) marketRefPrice = calculatedRef;
                                }
                                catch { }

                                // 2. Strict Maximum Acceptable Price across all social classes visiting this neighborhood
                                try
                                {
                                    float calculatedMax = ItemHelper.CalculateMaxAcceptablePriceByNeighborhood(rawName, rawDistrictKey);
                                    if (calculatedMax > 0f && calculatedMax < 9999f)
                                    {
                                        maxAcceptablePrice = (float)(Math.Floor(calculatedMax * 100.0) / 100.0);
                                    }
                                }
                                catch { }

                                // 3. Optimal Target Price
                                if (maxAcceptablePrice > 0f)
                                {
                                    optimalPrice = maxAcceptablePrice;
                                }
                                else
                                {
                                    try
                                    {
                                        var (sMin, sMax) = PricingManagerHelper.ComputeSuggestion(rawName, rawDistrictKey, 1.0f, 0f);
                                        if (sMax > 0f) optimalPrice = (float)(Math.Floor(sMax * 100.0) / 100.0);
                                    }
                                    catch { }

                                    if (optimalPrice <= 0f)
                                    {
                                        optimalPrice = wholesalePrice > 0f ? (float)Math.Round(wholesalePrice * 2.0f, 2) : rp.price;
                                    }
                                    maxAcceptablePrice = (float)Math.Round(optimalPrice * 1.15f, 2);
                                }

                                _priceSuggestionCache[priceCacheKey] = (wholesalePrice, marketRefPrice, optimalPrice, maxAcceptablePrice);
                            }

                            int currentShelfStock = storeInventoryCounts.ContainsKey(rawName) ? storeInventoryCounts[rawName] : 0;
                            bool isServiceProduct = rawName.Contains("fee") || rawName.Contains("charge") || rawName.Contains("ticket") || rawName.Contains("hourly");

                            // Calculate daily sales burn rate for this item to determine < 24h runout
                            int dailySold = 0;
                            if (todayItemSoldCounts.ContainsKey(rawName)) dailySold = todayItemSoldCounts[rawName];
                            else if (todayItemSoldCounts.ContainsKey(cleanName)) dailySold = todayItemSoldCounts[cleanName];

                            if (!isHeadquarters && !isServiceProduct && currentShelfStock == 0 && !b.temporarilyClosed)
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
                            else if (!isHeadquarters && !isServiceProduct && currentShelfStock > 0)
                            {
                                bool isLow = false;
                                string lowMsg = $"Low stock warning: {cleanName} has only {currentShelfStock} units left on shelves.";

                                if (dailySold > 0)
                                {
                                    float daysRemaining = (float)currentShelfStock / dailySold;
                                    if (daysRemaining < 1.0f)
                                    {
                                        isLow = true;
                                        int hoursRemaining = Math.Max(1, (int)Math.Round(daysRemaining * 24f));
                                        lowMsg = $"Low stock warning: {cleanName} has only {currentShelfStock} units left (~{hoursRemaining}h remaining). Restock soon!";
                                    }
                                }
                                else if (currentShelfStock < 15)
                                {
                                    isLow = true;
                                }

                                if (isLow)
                                {
                                    operationalAlerts.Add(new
                                    {
                                        id = "lowstock_store_" + b.StreetName + "_" + rawName,
                                        type = "lowstock",
                                        severity = "warning",
                                        location = bName,
                                        message = lowMsg
                                    });
                                }
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
                                inStoreStock = currentShelfStock,
                                isServiceProduct = isServiceProduct
                            });
                        }
                    }

                    // Count active staff assigned to this building in O(1) time
                    int staffCount = 0;
                    string bAddrKey = $"{b.StreetName}_{b.StreetNumber}";
                    empCountByAddress.TryGetValue(bAddrKey, out staffCount);

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

                                    // 1. Check WorkShift and ScheduleDay properties for Station/Workstation/Appliance (cached reflection)
                                    try
                                    {
                                        if (_cachedWsFields == null)
                                        {
                                            var wsType = ws.GetType();
                                            _cachedWsFields = wsType.GetFields();
                                            _cachedWsProps = wsType.GetProperties();
                                        }

                                        foreach (var f in _cachedWsFields)
                                        {
                                            string fVal = f.GetValue(ws)?.ToString() ?? "";
                                            string fvLower = fVal.ToLower();
                                            if (fvLower.Contains("clean")) { empRole = "cleaner"; empSkill = "Cleaning"; stationName = fVal; }
                                            else if (fvLower.Contains("security") || fvLower.Contains("guard")) { empRole = "security"; empSkill = "Security"; stationName = fVal; }
                                            else if (fvLower.Contains("logistic") || fvLower.Contains("driver") || fvLower.Contains("delivery")) { empRole = "logistics"; empSkill = "Logistics"; stationName = fVal; }
                                            else if (fvLower.Contains("office") || fvLower.Contains("law") || fvLower.Contains("program") || fvLower.Contains("web")) { empRole = "office"; empSkill = "Office / Tech"; stationName = fVal; }
                                            else if (fvLower.Contains("cashier") || fvLower.Contains("register")) { empRole = "cashier"; empSkill = "Customer Service"; stationName = fVal; }
                                        }

                                        foreach (var p in _cachedWsProps)
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
                                        if (_cachedSdFields == null)
                                        {
                                            var sdType = sd.GetType();
                                            _cachedSdFields = sdType.GetFields();
                                            _cachedSdProps = sdType.GetProperties();
                                        }
                                        foreach (var sdf in _cachedSdFields)
                                        {
                                            string sdfVal = sdf.GetValue(sd)?.ToString() ?? "";
                                            string sdfLower = sdfVal.ToLower();
                                            if (sdfLower.Contains("clean")) { empRole = "cleaner"; empSkill = "Cleaning"; stationName = sdfVal; }
                                            else if (sdfLower.Contains("security") || sdfLower.Contains("guard")) { empRole = "security"; empSkill = "Security"; stationName = sdfVal; }
                                        }
                                        foreach (var sdp in _cachedSdProps)
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

                                    // 2. Cross-reference employee character data via O(1) hash table lookup
                                    if (!string.IsNullOrEmpty(ws.employeeId) && empById.TryGetValue(ws.employeeId, out var foundEmp))
                                    {
                                        if (foundEmp != null)
                                        {
                                            if (foundEmp.characterData != null && !string.IsNullOrEmpty(foundEmp.characterData.name))
                                            {
                                                empName = foundEmp.characterData.name;
                                            }

                                            // Check employee assigned job/profession or primary skill if role was still default
                                            try
                                            {
                                                if (_cachedEmpFields == null)
                                                {
                                                    _cachedEmpFields = foundEmp.GetType().GetFields();
                                                }
                                                foreach (var ef in _cachedEmpFields)
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

                            // In Big Ambitions ScheduleDay:
                            // Check whether each individual hour (0..23) is open via opening hours slots or reflection
                            bool[] hoursOpenMap = new bool[24];
                            try
                            {
                                if (!_sdSlotsLookupDone)
                                {
                                    var sdType = sd.GetType();
                                    _cachedSdSlotsField = sdType.GetField("openingHoursSlots") ?? sdType.GetField("openingHours") ?? sdType.GetField("slots") ?? sdType.GetField("hoursSlots");
                                    _cachedSdSlotsProp = sdType.GetProperty("OpeningHoursSlots") ?? sdType.GetProperty("OpeningHours") ?? sdType.GetProperty("Slots");
                                    _sdSlotsLookupDone = true;
                                }

                                object slotsObj = null;
                                if (_cachedSdSlotsField != null) slotsObj = _cachedSdSlotsField.GetValue(sd);
                                else if (_cachedSdSlotsProp != null) slotsObj = _cachedSdSlotsProp.GetValue(sd);

                                bool foundSlots = false;
                                if (slotsObj is System.Collections.IEnumerable enumSlots)
                                {
                                    foreach (var slot in enumSlots)
                                    {
                                        if (slot == null) continue;
                                        var st = slot.GetType();
                                        var sf = st.GetField("startingHour") ?? st.GetField("startHour");
                                        var ef = st.GetField("endingHour") ?? st.GetField("endHour");
                                        var sp = st.GetProperty("StartingHour") ?? st.GetProperty("StartHour");
                                        var ep = st.GetProperty("EndingHour") ?? st.GetProperty("EndHour");

                                        int sH = -1;
                                        int eH = -1;
                                        if (sf != null) sH = Convert.ToInt32(sf.GetValue(slot));
                                        else if (sp != null) sH = Convert.ToInt32(sp.GetValue(slot));

                                        if (ef != null) eH = Convert.ToInt32(ef.GetValue(slot));
                                        else if (ep != null) eH = Convert.ToInt32(ep.GetValue(slot));

                                        if (sH >= 0 && eH >= 0)
                                        {
                                            foundSlots = true;
                                            for (int h = sH; h < eH && h < 24; h++)
                                            {
                                                hoursOpenMap[h] = true;
                                            }
                                        }
                                    }
                                }

                                if (!foundSlots && sd.isOpen)
                                {
                                    if (shifts.Count > 0)
                                    {
                                        foreach (var ws in sd.workShifts)
                                        {
                                            for (int h = ws.startingHour; h < ws.endingHour && h < 24; h++)
                                            {
                                                hoursOpenMap[h] = true;
                                            }
                                        }
                                    }
                                }
                            }
                            catch {}

                            int dayStartHour = -1;
                            int dayEndHour = -1;
                            for (int h = 0; h < 24; h++)
                            {
                                if (hoursOpenMap[h])
                                {
                                    if (dayStartHour == -1) dayStartHour = h;
                                    dayEndHour = h + 1;
                                }
                            }
                            if (dayStartHour == -1) { dayStartHour = 0; dayEndHour = 0; }

                            scheduleWeek.Add(new
                            {
                                day = sd.day.ToString(),
                                isOpen = sd.isOpen,
                                openHours = dayOpenHours,
                                startHour = dayStartHour,
                                endHour = dayEndHour,
                                hoursOpen = hoursOpenMap,
                                shiftHours = dayShiftHours,
                                shifts = shifts
                            });
                        }
                    }

                    if (!isHeadquarters && totalOpenHoursPerWeek > 0 && scheduledShiftHoursPerWeek == 0)
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
                        isHeadquarters = isHeadquarters,
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
                        revenueHistory = bizRevenueHistory,
                        
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
                        scheduleWeek = scheduleWeek,
                        orderHistory = fullOrderHistory
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
                modVersion = MOD_VERSION,
                lastHeartbeat = DateTime.UtcNow.ToString("o"),
                gameDay = save.Day,
                gameHour = save.Hour,
                gameMinute = (int)save.Minute,
                playerCash = (double)Math.Round(save.Money),
                bankBalance = (double)Math.Round(save.Money),
                totalLoans = (double)Math.Round(totalLoanBalance),
                netWorth = (double)Math.Round(save.Money - totalLoanBalance),
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

            ThreadPool.QueueUserWorkItem(_ =>
            {
                try
                {
                    string newJson = JsonConvert.SerializeObject(telemetryData);
                    lock (_lock)
                    {
                        _cachedTelemetryJson = newJson;
                    }
                }
                catch (Exception ex)
                {
                    LogWarn($"Background serialization error: {ex.Message}");
                }
            });
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
