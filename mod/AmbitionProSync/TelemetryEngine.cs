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
        public const string MOD_VERSION = "2.4.0";
        public const int HTTP_PORT = 8765;

        private static HttpListener _httpListener;
        private static Thread _listenerThread;
        private static bool _isRunning = false;
        private static string _cachedTelemetryJson = "{}";
        private static byte[] _cachedTelemetryBytes = Encoding.UTF8.GetBytes("{}");
        private static readonly object _lock = new object();
        private static float _lastUpdateTime = 0f;
        private static volatile bool _requestPending = true; // Start true so initial state is available immediately
        private static float _lastClientRequestTime = 0f; // Track client activity to avoid polling when idle

        // Logo cache: maps logoShape string to base64 data string. Avoids synchronous disk I/O and base64 re-encoding every cycle.
        private static readonly Dictionary<string, string> _logoCache = new Dictionary<string, string>();

        // Static string caches to eliminate heap churn on repetitively formatted names
        private static readonly Dictionary<string, string> _streetAddressCache = new Dictionary<string, string>();
        private static readonly Dictionary<string, string> _districtNameCache = new Dictionary<string, string>();
        private static readonly Dictionary<string, string> _businessTypeCache = new Dictionary<string, string>();
        private static readonly Dictionary<string, string> _itemNameCache = new Dictionary<string, string>();
        private static readonly Dictionary<string, string> _skillNameCache = new Dictionary<string, string>();
        private static readonly Dictionary<string, string> _demandNameCache = new Dictionary<string, string>();

        // Market price cache: maps "rawItem_district" to cached (wholesalePrice, marketRefPrice, optimalPrice, maxAcceptablePrice)
        private static readonly Dictionary<string, (float wholesale, float marketRef, float optimal, float maxAcceptable)> _priceSuggestionCache = new Dictionary<string, (float, float, float, float)>();
        private static int _lastPriceCacheDay = -1;

        // Daily snapshot cache: financial summaries and 7-day history are day-scoped and only roll over at midnight.
        // Rebuilding them every poll cycle is the dominant allocation/GC cost on large saves, so cache per game day.
        private static int _lastFinancialDay = -1;
        private static FinancialSummary _cachedLatestFin = null;
        private static readonly List<FinancialSummary> _cachedPast7DayFins = new List<FinancialSummary>();
        private static readonly List<FinancialSummary> _cachedAllFinSummaries = new List<FinancialSummary>();
        private static readonly Dictionary<string, FinancialSummary.BusinessIncomeStatement> _cachedLatestStmtByAddress = new Dictionary<string, FinancialSummary.BusinessIncomeStatement>();
        private static readonly Dictionary<string, FinancialSummary.BusinessIncomeStatement> _cachedStmtByDayAndAddress = new Dictionary<string, FinancialSummary.BusinessIncomeStatement>();
        private static readonly List<object> _cachedWeeklyRevenueHistory = new List<object>();
        private static float _cachedTotalWeeklyBusinessRev = 0f;
        private static float _cachedTotalWeeklyBusinessExp = 0f;

        // Per-business daily revenue history cache: keyed by business address, cleared on day rollover.
        private static readonly Dictionary<string, List<object>> _revenueHistoryCache = new Dictionary<string, List<object>>();

        // Sync scheduling: the web client tells the mod how often it wants fresh telemetry via the ?sync= query parameter.
        // Interval modes rebuild at _syncIntervalMs; "hourly" rebuilds once per in-game hour; "daily" once per in-game day.
        private enum SyncModeKind { Interval, Hourly, Daily }
        private static SyncModeKind _syncModeKind = SyncModeKind.Interval;
        private static int _syncIntervalMs = 2000;
        private static int _lastSyncedDay = -1;
        private static int _lastSyncedHour = -1;
        private const int MIN_SYNC_INTERVAL_MS = 500;

        // Midnight rollover handling: the game runs its midnight save + daily processing when the day rolls over.
        // Defer the sync a few real seconds so the save finishes first and the data we read is up to date.
        private static bool _midnightSyncPending = false;
        private static float _midnightSyncStartTime = 0f;
        private const float MIDNIGHT_SYNC_DELAY_SECONDS = 2.5f;

        // On-demand mod diagnostics export (player-triggered from the companion).
        // Requested over HTTP on a background thread, built on the game's main thread next Update(),
        // then fetched by the web client and attached to bug reports. Runs once per request only.
        private static bool _exportDiagnosticsRequested = false;
        private static bool _exportDiagnosticsReady = false;
        private static byte[] _cachedDiagnosticsBytes = new byte[0];
        private static long _lastTelemetryBuildMs = 0;
        private static readonly List<long> _telemetryBuildSamples = new List<long>();

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

                // On-demand diagnostics: the companion first calls ?export=diagnostics to request a build
                // (executed on the main thread in Update()), then polls ?diagnostics=1 until it is ready.
                string exportParam = context.Request.QueryString["export"];
                string diagnosticsFetch = context.Request.QueryString["diagnostics"];

                if (!string.IsNullOrEmpty(diagnosticsFetch))
                {
                    byte[] diagBytes;
                    lock (_lock)
                    {
                        diagBytes = _exportDiagnosticsReady ? _cachedDiagnosticsBytes : null;
                    }
                    response.ContentType = "application/json";
                    if (diagBytes != null && diagBytes.Length > 0)
                    {
                        response.StatusCode = 200;
                        response.ContentLength64 = diagBytes.Length;
                        using (var output = response.OutputStream) output.Write(diagBytes, 0, diagBytes.Length);
                    }
                    else
                    {
                        byte[] pending = Encoding.UTF8.GetBytes("{\"status\":\"pending\"}");
                        response.StatusCode = 404;
                        response.ContentLength64 = pending.Length;
                        using (var output = response.OutputStream) output.Write(pending, 0, pending.Length);
                    }
                    response.Close();
                    return;
                }

                if (!string.IsNullOrEmpty(exportParam) && exportParam.Equals("diagnostics", StringComparison.OrdinalIgnoreCase))
                {
                    // Built on the main thread to keep Unity object access safe.
                    _exportDiagnosticsRequested = true;
                    byte[] ack = Encoding.UTF8.GetBytes("{\"status\":\"building\"}");
                    response.ContentType = "application/json";
                    response.StatusCode = 202;
                    response.ContentLength64 = ack.Length;
                    using (var output = response.OutputStream) output.Write(ack, 0, ack.Length);
                    response.Close();
                    return;
                }

                // The web client advertises its desired sync cadence via ?sync=<ms>, ?sync=hourly, or ?sync=daily.
                // This lets the mod skip expensive rebuilds when the user only wants hourly or daily snapshots.
                string syncParam = context.Request.QueryString["sync"];
                if (!string.IsNullOrEmpty(syncParam))
                {
                    if (syncParam.Equals("daily", StringComparison.OrdinalIgnoreCase))
                    {
                        _syncModeKind = SyncModeKind.Daily;
                    }
                    else if (syncParam.Equals("hourly", StringComparison.OrdinalIgnoreCase))
                    {
                        _syncModeKind = SyncModeKind.Hourly;
                    }
                    else if (int.TryParse(syncParam, out int syncMs) && syncMs > 0)
                    {
                        _syncModeKind = SyncModeKind.Interval;
                        _syncIntervalMs = Math.Max(syncMs, MIN_SYNC_INTERVAL_MS);
                    }
                }

                _requestPending = true;
                _lastClientRequestTime = Time.unscaledTime;

                byte[] buffer;
                lock (_lock)
                {
                    buffer = _cachedTelemetryBytes;
                }

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
            // No active save: cancel any pending midnight sync and reset sync state for the next city load.
            if (SaveGameManager.Current == null)
            {
                _midnightSyncPending = false;
                _lastSyncedDay = -1;
                _lastSyncedHour = -1;
                return;
            }

            // A delayed midnight sync was scheduled: wait a few real seconds so the game finishes its
            // midnight save + daily processing before rebuilding telemetry.
            if (_midnightSyncPending)
            {
                if (Time.unscaledTime - _midnightSyncStartTime >= MIDNIGHT_SYNC_DELAY_SECONDS)
                {
                    _midnightSyncPending = false;
                    CommitSync();
                }
                return;
            }

            // On-demand diagnostics export (player-triggered via the companion).
            if (_exportDiagnosticsRequested)
            {
                _exportDiagnosticsRequested = false;
                try
                {
                    BuildDiagnosticsExport();
                }
                catch (Exception ex)
                {
                    LogWarn($"Diagnostics export failed: {ex.Message}");
                    _exportDiagnosticsReady = false;
                }
            }

            // Only rebuild telemetry when a web client is actively polling.
            if (!_requestPending) return;

            // Daily mode: rebuild once per in-game day, deferring the midnight rollover for the save process.
            if (_syncModeKind == SyncModeKind.Daily)
            {
                _requestPending = false;
                int currentDay = SaveGameManager.Current.Day;
                if (currentDay == _lastSyncedDay) return;

                if (_lastSyncedDay == -1)
                {
                    // First sync for this save: build immediately so the dashboard has data right away.
                    CommitSync();
                }
                else
                {
                    BeginMidnightSync();
                }
                return;
            }

            // Hourly mode: rebuild once per in-game hour, deferring only the midnight hour rollover.
            if (_syncModeKind == SyncModeKind.Hourly)
            {
                _requestPending = false;
                int currentDay = SaveGameManager.Current.Day;
                int currentHour = SaveGameManager.Current.Hour;

                if (currentDay != _lastSyncedDay)
                {
                    if (_lastSyncedDay == -1)
                    {
                        CommitSync();
                    }
                    else
                    {
                        BeginMidnightSync();
                    }
                    return;
                }

                if (currentHour == _lastSyncedHour) return;
                CommitSync();
                return;
            }

            // Interval mode: rebuild at the configured cadence (default 2.0s).
            if (Time.unscaledTime - _lastUpdateTime < _syncIntervalMs / 1000f) return;
            _lastUpdateTime = Time.unscaledTime;
            _requestPending = false;

            try
            {
                var sw = System.Diagnostics.Stopwatch.StartNew();
                UpdateTelemetryJson();
                sw.Stop();
                RecordTelemetryBuild(sw.ElapsedMilliseconds);
            }
            catch (Exception ex)
            {
                LogWarn($"Telemetry update error: {ex.Message}");
            }
        }

        private static void BeginMidnightSync()
        {
            _midnightSyncPending = true;
            _midnightSyncStartTime = Time.unscaledTime;
        }

        private static void CommitSync()
        {
            _lastSyncedDay = SaveGameManager.Current.Day;
            _lastSyncedHour = SaveGameManager.Current.Hour;
            try
            {
                var sw = System.Diagnostics.Stopwatch.StartNew();
                UpdateTelemetryJson();
                sw.Stop();
                RecordTelemetryBuild(sw.ElapsedMilliseconds);
            }
            catch (Exception ex)
            {
                LogWarn($"Telemetry update error: {ex.Message}");
            }
        }

        private static void RefreshFinancialCache(GameInstance save)
        {
            _lastFinancialDay = save.Day;
            _cachedLatestFin = null;
            _cachedPast7DayFins.Clear();
            _cachedAllFinSummaries.Clear();
            _cachedLatestStmtByAddress.Clear();
            _cachedStmtByDayAndAddress.Clear();
            _cachedWeeklyRevenueHistory.Clear();
            _cachedTotalWeeklyBusinessRev = 0f;
            _cachedTotalWeeklyBusinessExp = 0f;
            _revenueHistoryCache.Clear();

            if (save.financialSummaries == null || save.financialSummaries.Count == 0) return;

            _cachedLatestFin = save.financialSummaries[save.financialSummaries.Count - 1];
            if (_cachedLatestFin.businessIncomeStatements != null)
            {
                foreach (var s in _cachedLatestFin.businessIncomeStatements)
                {
                    if (s?.Address?.streetName != null)
                    {
                        _cachedLatestStmtByAddress[$"{s.Address.streetName}_{s.Address.streetNumber}"] = s;
                    }
                }
            }

            int startIdx = Math.Max(0, save.financialSummaries.Count - 7);
            for (int i = startIdx; i < save.financialSummaries.Count; i++)
            {
                _cachedPast7DayFins.Add(save.financialSummaries[i]);
            }
            _cachedAllFinSummaries.AddRange(save.financialSummaries);

            foreach (var f in _cachedAllFinSummaries)
            {
                if (f.businessIncomeStatements == null) continue;
                foreach (var s in f.businessIncomeStatements)
                {
                    if (s?.Address?.streetName != null)
                    {
                        _cachedStmtByDayAndAddress[$"{f.dayNumber}_{s.Address.streetName}_{s.Address.streetNumber}"] = s;
                    }
                }
            }

            // 7-day revenue trend (day-scoped, computed once per game day)
            foreach (var fin in _cachedPast7DayFins)
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

                _cachedWeeklyRevenueHistory.Add(new
                {
                    dayNumber = fin.dayNumber,
                    revenue = (double)Math.Round(dRev),
                    profit = (double)Math.Round(fin.totalProfit)
                });
                _cachedTotalWeeklyBusinessRev += dRev;
                _cachedTotalWeeklyBusinessExp += dExp;
            }
        }

        private static void UpdateTelemetryJson()
        {
            var save = SaveGameManager.Current;
            if (save == null) return;

            // Map Financial Statements for History & Totals (day-scoped, cached at midnight rollover)
            if (_lastFinancialDay != save.Day)
            {
                RefreshFinancialCache(save);
            }
            FinancialSummary latestFin = _cachedLatestFin;
            var past7DayFins = _cachedPast7DayFins;
            var allFinSummaries = _cachedAllFinSummaries;
            var latestStmtByAddress = _cachedLatestStmtByAddress;
            var stmtByDayAndAddress = _cachedStmtByDayAndAddress;

            var businesses = new List<object>();
            var residences = new List<object>();
            var ownedRealEstate = new List<object>();
            var emptyLeasedSpaces = new List<object>();
            var employees = new List<object>();
            var loans = new List<object>();
            var warehouses = new List<object>();
            var operationalAlerts = new List<object>();
            var weeklyRevenueHistory = _cachedWeeklyRevenueHistory;

            var vehicles = new List<object>();
            var boats = new List<object>();
            var investments = new List<object>();
            var rivals = new List<object>();
            var specialRivals = new List<object>();
            var marketEvents = new List<object>();
            var productMarket = new List<object>();
            var buildingsForSale = new List<object>();
            var candidateEmployees = new List<object>();
            var recruitmentCampaigns = new List<object>();
            var deliveryContracts = new List<object>();
            var furnitureDeliveryContracts = new List<object>();
            var foodDeliveryContracts = new List<object>();
            var vehicleDeliveryContracts = new List<object>();
            var movingServiceContracts = new List<object>();
            var interiorInstallationContracts = new List<object>();
            var importPartnerships = new List<object>();
            var diplomas = new List<object>();
            var todoTasks = new List<object>();
            var jobInstances = new List<object>();
            var logisticsPlans = new List<object>();
            var headhunterPlans = new List<object>();
            var hrPlans = new List<object>();
            var pricingPlans = new List<object>();
            var contacts = new List<object>();
            var healthInsuranceOffers = new List<object>();
            var salaryNegotiations = new List<object>();
            var happinessModifiers = new List<object>();
            var neighbourhoodStats = new List<object>();
            var playerIncomeHistory = new List<object>();
            var playerBusinessCountHistory = new List<object>();
            var foodDeliveryOffers = new List<object>();

            // Pre-index employees into O(1) fast lookup dictionaries to scale effortlessly with 1000+ employees
            var empById = new Dictionary<string, EmployeeInstance>();
            var empCountByAddress = new Dictionary<string, int>();
            var empResolvedInfo = new Dictionary<string, (string name, string role, string skill, int skillLevel)>();
            if (save.EmployeeInstances != null)
            {
                foreach (var e in save.EmployeeInstances)
                {
                    if (e == null) continue;
                    if (!string.IsNullOrEmpty(e.id))
                    {
                        empById[e.id] = e;

                        string eName = (e.characterData != null && !string.IsNullOrEmpty(e.characterData.name)) ? e.characterData.name : "Staff";
                        string eRole = "cashier";
                        string eSkill = "Customer Service";
                        int eSkillLevel = 50;
                        try
                        {
                            string rawSkill = e.GetPrimarySkill();
                            string fSkill = FormatSkillName(rawSkill);
                            eSkill = fSkill;
                            eSkillLevel = (int)Math.Round(e.GetSkillValue(rawSkill));
                            string sLower = rawSkill.ToLower();
                            if (sLower.Contains("clean")) { eRole = "cleaner"; eSkill = "Cleaning"; }
                            else if (sLower.Contains("security") || sLower.Contains("guard")) { eRole = "security"; eSkill = "Security"; }
                            else if (sLower.Contains("logistic") || sLower.Contains("driver")) { eRole = "logistics"; eSkill = "Logistics"; }
                            else if (sLower.Contains("office") || sLower.Contains("law") || sLower.Contains("program") || sLower.Contains("web")) { eRole = "office"; eSkill = "Office / Tech"; }
                        }
                        catch { }

                        empResolvedInfo[e.id] = (eName, eRole, eSkill, eSkillLevel);
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
            float totalWeeklyBusinessRev = _cachedTotalWeeklyBusinessRev;
            float totalWeeklyBusinessExp = _cachedTotalWeeklyBusinessExp;

            float totalDailyResidentialRev = 0f;
            float totalDailyResidentialExp = 0f;
            float totalWeeklyResidentialRev = 0f;
            float totalWeeklyResidentialExp = 0f;

            // 1. PROCESS OWNED REAL ESTATE PORTFOLIO
            if (save.realEstate != null)
            {
                foreach (var re in save.realEstate)
                {
                    if (re == null || re.address == null) continue;
                    string street = re.address.streetName ?? "";
                    int number = re.address.streetNumber;
                    string formattedAddr = FormatStreetAddress(street, number);

                    string reNeighborhood = "";
                    string reBuildingType = "";
                    try
                    {
                        var reBuilding = re.Building;
                        if (reBuilding != null)
                        {
                            reNeighborhood = reBuilding.Neighbourhood ?? "";
                            reBuildingType = reBuilding.BuildingType ?? "";
                        }
                    }
                    catch { }

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
                        district = FormatDistrictName(reNeighborhood),
                        rawDistrict = reNeighborhood,
                        buildingTypeName = FormatBuildingTypeName(reBuildingType),
                        totalSqm = re.totalSqm,
                        occupancyPct = re.OccupancyPercentage,
                        pricePerSqm = (double)Math.Round(re.pricePerSqm, 2),
                        dailyRevenue = (double)Math.Round(dailyIncome, 2),
                        weeklyRevenue = (double)Math.Round(weeklyIncome, 2),
                        dailyTaxes = (double)Math.Round(taxes, 2),
                        weeklyTaxes = (double)Math.Round(weeklyTaxes, 2),
                        weeklyNet = (double)Math.Round(netWeekly, 2),
                        purchasePrice = (double)Math.Round(re.purchasePrice, 2),
                        purchaseDay = re.purchaseDay,
                        occupancy = (double)Math.Round(re.occupancy, 2),
                        maxOccupancy = re.MaxOccupancy,
                        pendingPricePerSqm = (double)Math.Round(re.pendingPricePerSqm, 2),
                        daysUntilUpdatingPricePerSqm = re.daysUntilUpdatingPricePerSqm
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
                    string buildingTypeKey = "";
                    int sqm = 0;
                    try
                    {
                        var cachedBuilding = b.BuildingCached;
                        if (cachedBuilding != null)
                        {
                            if (string.IsNullOrEmpty(rawDistrictKey)) rawDistrictKey = cachedBuilding.Neighbourhood;
                            buildingTypeKey = cachedBuilding.BuildingType ?? "";
                        }
                    }
                    catch { }
                    if (string.IsNullOrEmpty(rawDistrictKey))
                    {
                        rawDistrictKey = street;
                    }
                    string displayDistrict = FormatDistrictName(rawDistrictKey);
                    string displayBuildingType = FormatBuildingTypeName(buildingTypeKey);
                    try { sqm = BuildingHelper.GetBuildingSquareMeters(b.Address); } catch { }
                    bool isOwnedByPlayer = b.BuildingOwnedByPlayer;

                    // Classify by the building's real type (like the game's own ledger:
                    // FinancialSummaryHelper keys residential vs business on BuildingType),
                    // never by whether the space happens to have an active business.
                    bool isWarehouse = buildingTypeKey == "ba:buildingtype_warehouse" || bType.Contains("warehouse") || (b is Warehouse);
                    bool isResidence = buildingTypeKey == "ba:buildingtype_residential";
                    bool isHeadquarters = bType.Contains("headquarters") || bType.Contains("hq") || bType == "ba:businesstype_headquarters";

                    if (isResidence)
                    {
                        float weeklyRent = b.RentPerDay * 7f;
                        // Only leased (not owned) residences are a rent expense, mirroring BusinessHelper.RunDaily.
                        if (!isOwnedByPlayer)
                        {
                            totalDailyResidentialExp += b.RentPerDay;
                            totalWeeklyResidentialExp += weeklyRent;
                        }

                        residences.Add(new
                        {
                            id = street + "_" + number,
                            address = formattedAddr,
                            streetName = street,
                            streetNumber = number,
                            type = displayBuildingType,
                            district = displayDistrict,
                            rawDistrict = rawDistrictKey,
                            sqm = sqm,
                            isOwned = isOwnedByPlayer,
                            rentPerDay = (double)b.RentPerDay,
                            rentPerWeek = (double)Math.Round(weeklyRent),
                            status = isOwnedByPlayer ? "Owned" : "Rented",
                            sinceDay = b.creationDay
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
                                    int qty = BuildingHelper.CountResourcesInPallets(warehouseObj.Address, prod);
                                    int weeklyConsumption = warehouseObj.GetProductConsumption(prod);
                                    int weeklyDeliveries = warehouseObj.GetProductDeliveries(prod);
                                    int daysLeft = weeklyConsumption > 0 ? (int)Math.Floor((float)qty / (weeklyConsumption / 7f)) : -1;

                                    int boxSize = 1;
                                    try { var it = BigAmbitions.Items.ItemsGetter.GetByName(prod); if (it != null && it.boxSize > 0) boxSize = it.boxSize; } catch { }
                                    int boxes = boxSize > 0 ? (int)Math.Ceiling((double)qty / (double)boxSize) : 0;

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
                                        units = qty,
                                        boxes = boxes,
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

                    // Unused leased commercial space: the player rents a non-residential building but has
                    // no active business inside it. The game still charges rent every day, but nothing is
                    // earning, so surface it as a rent leak instead of a residence.
                    bool hasNoBusiness = string.IsNullOrEmpty(bType) || bType == "ba:businesstype_empty";
                    if (hasNoBusiness)
                    {
                        float leakWeeklyRent = b.RentPerDay * 7f;
                        // Daily business rent is accumulated locally; weekly business figures come from the
                        // game's own cached financial summaries, which already include this rent.
                        totalDailyBusinessExp += b.RentPerDay;
                        emptyLeasedSpaces.Add(new
                        {
                            id = street + "_" + number,
                            address = formattedAddr,
                            streetName = street,
                            streetNumber = number,
                            type = displayBuildingType,
                            district = displayDistrict,
                            rawDistrict = rawDistrictKey,
                            sqm = sqm,
                            rentPerDay = (double)b.RentPerDay,
                            rentPerWeek = (double)Math.Round(leakWeeklyRent),
                            sinceDay = b.creationDay
                        });
                        continue;
                    }

                    // Commercial Business Accounting
                    float bizSales = 0f;
                    float bizProfit = 0f;
                    float bizSalaries = 0f;
                    float bizWeeklySales = 0f;
                    float bizWeeklyProfit = 0f;
                    var bizRevenueHistory = new List<object>();

                    // 1. Calculate 7-day weekly totals via pre-indexed O(1) dictionary lookups
                    string bAddressKey = $"{b.StreetName}_{b.StreetNumber}";
                    if (past7DayFins.Count > 0)
                    {
                        foreach (var f in past7DayFins)
                        {
                            if (stmtByDayAndAddress.TryGetValue($"{f.dayNumber}_{bAddressKey}", out var s))
                            {
                                bizWeeklySales += s.TotalSales;
                                bizWeeklyProfit += s.TotalProfit;
                            }
                        }
                    }

                    // 2. Build full revenue history from pre-indexed dictionary (for 7d, 60d, all-time charts).
                    //    This is day-scoped (financial summaries roll over at midnight), so cache per business per day.
                    if (allFinSummaries.Count > 0)
                    {
                        if (!_revenueHistoryCache.TryGetValue(bAddressKey, out bizRevenueHistory))
                        {
                            bizRevenueHistory = new List<object>();
                            foreach (var f in allFinSummaries)
                            {
                                stmtByDayAndAddress.TryGetValue($"{f.dayNumber}_{bAddressKey}", out var s);
                                bizRevenueHistory.Add(new
                                {
                                    dayNumber  = f.dayNumber,
                                    revenue    = (double)Math.Round(s?.TotalSales ?? 0f),
                                    profit     = (double)Math.Round(s?.TotalProfit ?? 0f),
                                    salaries   = (double)Math.Round(s?.SalaryExpenses ?? 0f),
                                    rent       = (double)Math.Round(s?.RentExpenses ?? 0f),
                                    ongoing    = (double)Math.Round(s?.TotalOngoing ?? 0f),
                                    marketing  = (double)Math.Round(s?.MarketingExpenses ?? 0f),
                                    theft      = (double)Math.Round(s?.Theft ?? 0f),
                                    licensingFees = (double)Math.Round(s?.LicensingFees ?? 0f),
                                    resources  = (double)Math.Round(s?.TotalResources ?? 0f),
                                    expenses   = (double)Math.Round((s?.SalaryExpenses ?? 0f) + (s?.RentExpenses ?? 0f) + (s?.TotalOngoing ?? 0f))
                                });
                            }
                            _revenueHistoryCache[bAddressKey] = bizRevenueHistory;
                        }
                    }

                    if (latestStmtByAddress.TryGetValue(bAddressKey, out var stmt))
                    {
                        bizSales = stmt.TotalSales;
                        bizProfit = stmt.TotalProfit;
                        bizSalaries = stmt.SalaryExpenses;
                    }

                    var todayOrderSales = new List<object>();
                    var hourReports = new List<object>();
                    var fullOrderHistory = new List<object>();
                    int todayCustomerCount = 0;
                    var todayItemSoldCounts = new Dictionary<string, int>();

                    if (b.orderHistory != null && b.orderHistory.Count > 0)
                    {
                        // Bound order history traversal to the most recent 14 days to ensure predictable, sub-millisecond execution in late-game saves
                        int orderStartIdx = Math.Max(0, b.orderHistory.Count - 14);
                        for (int oi = orderStartIdx; oi < b.orderHistory.Count; oi++)
                        {
                            var orderEntry = b.orderHistory[oi];
                            if (orderEntry == null) continue;

                            var itemsList = new List<object>();
                            var consumablesList = new List<object>();
                            if (orderEntry.itemSales != null)
                            {
                                foreach (var item in orderEntry.itemSales)
                                {
                                    if (item.itemName.Contains("paperbag") || item.itemName.Contains("plasticbag"))
                                    {
                                        consumablesList.Add(new
                                        {
                                            rawItemName = item.itemName,
                                            itemName = FormatItemName(item.itemName),
                                            amountSold = item.amountSold
                                        });
                                        continue;
                                    }
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
                                itemSales = itemsList,
                                consumablesSales = consumablesList
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

                                    // 1. Resolve employee character data & job role via pre-indexed O(1) dictionary lookup (zero reflection)
                                    if (!string.IsNullOrEmpty(ws.employeeId) && empResolvedInfo.TryGetValue(ws.employeeId, out var resolved))
                                    {
                                        empName = resolved.name;
                                        empRole = resolved.role;
                                        empSkill = resolved.skill;
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
                            // Check whether each individual hour (0..23) is open via native IsOpenAtHour(h)
                            bool[] hoursOpenMap = new bool[24];
                            try
                            {
                                if (sd.isOpen)
                                {
                                    for (int h = 0; h < 24; h++)
                                    {
                                        hoursOpenMap[h] = sd.IsOpenAtHour(h);
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

                    var marketingCampaigns = new List<object>();
                    if (b.marketingCampaigns != null)
                    {
                        foreach (var mc in b.marketingCampaigns)
                        {
                            if (mc == null) continue;
                            marketingCampaigns.Add(new
                            {
                                type = mc.marketingTypeName.ToString(),
                                enabled = mc.enabled,
                                agencyAddress = mc.agencyAddress != null ? FormatStreetAddress(mc.agencyAddress.streetName, mc.agencyAddress.streetNumber) : ""
                            });
                        }
                    }

                    float marketingExpensesPerDay = 0f;
                    float marketingEfficiency = 0f;
                    try { marketingExpensesPerDay = (float)Math.Round(b.GetDailyMarketingExpenses(), 2); } catch { }
                    try { marketingEfficiency = (float)Math.Round(b.GetMarketingEfficiency(), 2); } catch { }

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
                        inventory = storeInventoryCounts.Select(kv => new { rawItemName = kv.Key, quantity = kv.Value }).ToList(),
                        todayCustomerCount = todayCustomerCount,
                        todayItemSales = todayOrderSales,
                        hourReports = hourReports,
                        scheduleWeek = scheduleWeek,
                        orderHistory = fullOrderHistory,
                        marketingCampaigns = marketingCampaigns,
                        marketingExpensesPerDay = marketingExpensesPerDay,
                        marketingEfficiency = marketingEfficiency,
                        stolenItemsCost = (double)Math.Round(b.stolenItemsCost, 2),
                        lastDeposit = (double)Math.Round(b.lastDeposit, 2),
                        takenOver = b.takenOver,
                        creationDay = b.creationDay,
                        businessDescription = b.BusinessDescription ?? "",
                        lastDayOnSale = b.lastDayOnSale
                    });
                }
            }

            // 2b. PROCESS EXTENDED PORTFOLIO: VEHICLES, INVESTMENTS, RIVALS, MARKET & OPERATIONS DATA
            // Build a set of warehouse-assigned vehicle ids (logistics fleet) so the web app can
            // distinguish automated delivery vehicles from personal player vehicles.
            var warehouseAssignedVehicleIds = new HashSet<string>();
            if (save.BuildingRegistrations != null)
            {
                foreach (var b in save.BuildingRegistrations)
                {
                    if (b is Warehouse w && w.vehicleSlots != null)
                    {
                        foreach (var slot in w.vehicleSlots)
                        {
                            if (slot != null && !string.IsNullOrEmpty(slot.vehicleInstanceId))
                            {
                                warehouseAssignedVehicleIds.Add(slot.vehicleInstanceId);
                            }
                        }
                    }
                }
            }

            if (save.VehicleInstances != null)
            {
                foreach (var v in save.VehicleInstances)
                {
                    if (v == null) continue;
                    var cargoItems = new List<object>();
                    if (v.cargoInstances != null)
                    {
                        foreach (var c in v.cargoInstances)
                        {
                            if (c == null || string.IsNullOrEmpty(c.itemName)) continue;
                            cargoItems.Add(new
                            {
                                itemName = FormatItemName(c.itemName),
                                rawItemName = c.itemName,
                                amount = c.amount
                            });
                        }
                    }

                    float repairCost = 0f;
                    float sellingPrice = 0f;
                    try { repairCost = (float)Math.Round(v.CalculateRepairCost(), 2); } catch { }
                    try { sellingPrice = (float)Math.Round(v.GetSellingPrice(), 2); } catch { }

                    // Read LIVE fuel and condition from the spawned controller when available. The
                    // serialized VehicleInstance.fuel is only written on save/refuel, so it goes
                    // stale while the player is driving. Fall back to the serialized values for
                    // despawned (parked) vehicles, where the controller is null.
                    float liveFuel = v.fuel;
                    float liveCondition = v.damage;
                    try
                    {
                        var controller = VehicleHelper.GetVehicleController(v);
                        if (controller != null)
                        {
                            liveFuel = controller.GetCurrentFuel();
                            liveCondition = controller.GetCurrentCondition();
                        }
                    }
                    catch { }

                    float maxFuel = 0f;
                    try { maxFuel = v.VehicleType != null ? v.VehicleType.maxFuel : 0f; } catch { }

                    bool isWarehouseAssigned = warehouseAssignedVehicleIds.Contains(v.id);
                    float fuelPct = maxFuel > 0f ? (float)Math.Round(Mathf.Clamp(liveFuel / maxFuel * 100f, 0f, 100f)) : 0f;
                    float damagePct = (float)Math.Round(Mathf.Clamp01(liveCondition) * 100f);
                    float dirtinessPct = (float)Math.Round(Mathf.Clamp01(v.dirtiness) * 100f);

                    vehicles.Add(new
                    {
                        id = v.id,
                        vehicleType = v.vehicleTypeName,
                        fuel = fuelPct,
                        maxFuel = maxFuel,
                        damage = damagePct,
                        dirtiness = dirtinessPct,
                        isWarehouseAssigned = isWarehouseAssigned,
                        parkingState = v.parkingState.ToString(),
                        parkingNeighbourhood = v.parkingNeighbourhood ?? "",
                        unpaidParkingAmount = (double)Math.Round(v.unpaidParkingAmount, 2),
                        parkingTickets = v.parkingTickets != null ? v.parkingTickets.Count : 0,
                        streetName = v.streetName ?? "",
                        streetNumber = v.streetNumber,
                        cargo = cargoItems,
                        repairCost = repairCost,
                        sellingPrice = sellingPrice
                    });
                }
            }

            if (save.playerBoats != null)
            {
                foreach (var b in save.playerBoats)
                {
                    if (b == null) continue;
                    boats.Add(new
                    {
                        id = b.id,
                        type = b.type.ToString(),
                        color = b.boatColorName ?? "",
                        nextMaintenanceDay = b.nextMaintenanceDay
                    });
                }
            }

            if (save.investmentFunds != null)
            {
                foreach (var f in save.investmentFunds)
                {
                    if (f == null) continue;
                    investments.Add(new
                    {
                        name = f.name ?? "",
                        initialDeposit = (double)Math.Round(f.initialDeposit, 2),
                        additionalInvestment = (double)Math.Round(f.additionalInvestment, 2),
                        withdrawal = (double)Math.Round(f.withdrawal, 2),
                        interestPayment = (double)Math.Round(f.interestPayment, 2),
                        isAutoInvesting = f.isAutoInvesting,
                        autoInvestment = (double)Math.Round(f.autoInvestment, 2),
                        currentValue = (double)Math.Round(f.CurrentValue, 2)
                    });
                }
            }

            if (save.rivalStates != null)
            {
                foreach (var r in save.rivalStates)
                {
                    if (r == null) continue;
                    var incomeHist = new List<object>();
                    if (r.weeklyIncomeHistory != null)
                    {
                        foreach (var entry in r.weeklyIncomeHistory)
                        {
                            if (entry == null) continue;
                            incomeHist.Add(new { day = entry.Item1, income = (double)Math.Round(entry.Item2) });
                        }
                    }
                    var businessHist = new List<object>();
                    if (r.numberOfBusinessesHistory != null)
                    {
                        foreach (var entry in r.numberOfBusinessesHistory)
                        {
                            if (entry == null) continue;
                            businessHist.Add(new { day = entry.Item1, count = entry.Item2 });
                        }
                    }
                    rivals.Add(new
                    {
                        rivalId = r.rivalId ?? "",
                        weeklyIncomeHistory = incomeHist,
                        numberOfBusinessesHistory = businessHist
                    });
                }
            }

            if (save.specialRivalStates != null)
            {
                foreach (var r in save.specialRivalStates)
                {
                    if (r == null) continue;
                    specialRivals.Add(new
                    {
                        rivalId = r.rivalId ?? "",
                        isActive = r.isActive,
                        isDefeated = r.isDefeated,
                        completedTimelineEntries = r.completedTimelineEntryIds != null ? r.completedTimelineEntryIds.Count : 0
                    });
                }
            }

            if (save.marketEvents != null)
            {
                foreach (var me in save.marketEvents)
                {
                    if (me == null) continue;
                    marketEvents.Add(new
                    {
                        type = me.type.ToString(),
                        itemName = me.itemName ?? "",
                        neighbourhood = me.neighbourhood ?? "",
                        startDay = me.startDay,
                        durationInDays = me.durationInDays,
                        demandImpact = me.demandImpact,
                        stopped = me.stopped,
                        isActive = me.IsActive,
                        businessTypeName = me.businessTypeName ?? "",
                        rivalName = me.rivalName ?? ""
                    });
                }
            }

            if (save.productMarketEntries != null)
            {
                foreach (var p in save.productMarketEntries)
                {
                    if (p == null) continue;
                    var demandList = new List<object>();
                    if (p.demandValues != null)
                    {
                        foreach (var d in p.demandValues)
                        {
                            if (d == null) continue;
                            demandList.Add(new
                            {
                                neighborhood = d.neighborhood ?? "",
                                demand = d.demand,
                                providers = d.providers,
                                lastDaySold = d.lastDaySold,
                                hasPlayerMonopoly = d.hasPlayerMonopoly
                            });
                        }
                    }
                    productMarket.Add(new
                    {
                        itemName = p.itemName ?? "",
                        importPriceIndex = (double)Math.Round(p.importPriceIndex, 2),
                        demand = demandList
                    });
                }
            }

            if (save.buildingsForSale != null)
            {
                foreach (var b in save.buildingsForSale)
                {
                    if (b == null || b.address == null) continue;
                    float pricePerSqm = 0f;
                    try { pricePerSqm = (float)Math.Round(b.PricePerSquareMeter, 2); } catch { }
                    buildingsForSale.Add(new
                    {
                        address = FormatStreetAddress(b.address.streetName, b.address.streetNumber),
                        streetName = b.address.streetName ?? "",
                        streetNumber = b.address.streetNumber,
                        buildingPrice = (double)Math.Round(b.buildingPrice, 2),
                        squareMeters = b.squareMeters,
                        acceptOfferRate = (double)Math.Round(b.acceptOfferRate, 2),
                        pricePerSqm = pricePerSqm
                    });
                }
            }

            if (save.CandidateEmployeeInstances != null)
            {
                foreach (var c in save.CandidateEmployeeInstances)
                {
                    if (c == null) continue;
                    string cSkill = "Customer Service";
                    int cSkillLevel = 0;
                    try
                    {
                        cSkill = FormatSkillName(c.GetPrimarySkill());
                        cSkillLevel = (int)Math.Round(c.GetSkillValue(c.GetPrimarySkill()));
                    }
                    catch { }
                    int hoursUntilExpiring = 0;
                    bool fromJobBoard = false;
                    string sourceAddress = "";
                    if (c.candidateInfo != null)
                    {
                        hoursUntilExpiring = c.candidateInfo.hoursUntilExpiring;
                        fromJobBoard = c.candidateInfo.fromJobBoard;
                        if (c.candidateInfo.sourceAddress != null)
                        {
                            sourceAddress = FormatStreetAddress(c.candidateInfo.sourceAddress.streetName, c.candidateInfo.sourceAddress.streetNumber);
                        }
                    }
                    candidateEmployees.Add(new
                    {
                        id = c.id,
                        name = (c.characterData != null && !string.IsNullOrEmpty(c.characterData.name)) ? c.characterData.name : "Candidate",
                        primarySkill = cSkill,
                        skillLevel = cSkillLevel,
                        hourlyWage = (double)Math.Round(c.hourlyWage, 2),
                        satisfaction = (int)Math.Round(c.satisfaction),
                        hoursUntilExpiring = hoursUntilExpiring,
                        fromJobBoard = fromJobBoard,
                        sourceAddress = sourceAddress
                    });
                }
            }

            if (save.RecruitmentCampaigns != null)
            {
                foreach (var rc in save.RecruitmentCampaigns)
                {
                    if (rc == null) continue;
                    recruitmentCampaigns.Add(new
                    {
                        agencyAddress = rc.agencyAddress != null ? FormatStreetAddress(rc.agencyAddress.streetName, rc.agencyAddress.streetNumber) : "",
                        businessAddress = rc.businessAddress != null ? FormatStreetAddress(rc.businessAddress.streetName, rc.businessAddress.streetNumber) : "",
                        skillName = rc.skillRequirement != null ? FormatSkillName(rc.skillRequirement.skillName) : "",
                        skillPercentage = rc.skillRequirement != null ? rc.skillRequirement.percentage : 0f,
                        amountOfCandidates = rc.amountOfCandidates,
                        candidatesFound = rc.candidatesFound,
                        price = (double)Math.Round(rc.price, 2),
                        fullTime = rc.fullTime,
                        partTime = rc.partTime,
                        finished = rc.finished
                    });
                }
            }

            if (save.DeliveryContracts != null)
            {
                foreach (var dc in save.DeliveryContracts)
                {
                    if (dc == null) continue;
                    var items = new List<object>();
                    if (dc.items != null)
                    {
                        foreach (var it in dc.items)
                        {
                            if (it == null) continue;
                            items.Add(new
                            {
                                itemName = FormatItemName(it.itemName),
                                rawItemName = it.itemName,
                                amount = it.amount,
                                amountOrderedThisWeek = it.amountOrderedThisWeek,
                                amountOrderedLastWeek = it.amountOrderedLastWeek
                            });
                        }
                    }
                    float totalPerDelivery = 0f;
                    try { totalPerDelivery = (float)Math.Round(dc.TotalPricePerDelivery, 2); } catch { }

                    string supplierName = "";
                    try
                    {
                        var wholesaleReg = dc.wholesaleAddress != null ? BuildingHelper.GetBuildingRegistration(dc.wholesaleAddress) : null;
                        supplierName = wholesaleReg != null ? (wholesaleReg.BusinessName ?? "") : "";
                    }
                    catch { }

                    deliveryContracts.Add(new
                    {
                        enabled = dc.enabled,
                        isUrgentOrder = dc.isUrgentOrder,
                        nextDeliveryDay = dc.nextDeliveryDay,
                        repeatingOrder = dc.repeatingOrder,
                        wholesaleAddress = dc.wholesaleAddress != null ? FormatStreetAddress(dc.wholesaleAddress.streetName, dc.wholesaleAddress.streetNumber) : "",
                        supplierName = supplierName,
                        businessAddress = dc.businessAddress != null ? FormatStreetAddress(dc.businessAddress.streetName, dc.businessAddress.streetNumber) : "",
                        deliveryFee = (double)Math.Round(dc.deliveryFee, 2),
                        totalPricePerDelivery = totalPerDelivery,
                        items = items
                    });
                }
            }

            if (save.FurnitureDeliveryContracts != null)
            {
                foreach (var fc in save.FurnitureDeliveryContracts)
                {
                    if (fc == null) continue;
                    furnitureDeliveryContracts.Add(new
                    {
                        fromAddress = fc.fromAddress != null ? FormatStreetAddress(fc.fromAddress.streetName, fc.fromAddress.streetNumber) : "",
                        toAddress = fc.toAddress != null ? FormatStreetAddress(fc.toAddress.streetName, fc.toAddress.streetNumber) : "",
                        itemCount = fc.itemsToDeliver != null ? fc.itemsToDeliver.Count : 0,
                        dayOfDelivery = fc.dayOfDelivery,
                        hourOfDelivery = fc.hourOfDelivery,
                        deliveryFee = (double)Math.Round(fc.deliveryFee, 2)
                    });
                }
            }

            if (save.FoodDeliveryContracts != null)
            {
                foreach (var fc in save.FoodDeliveryContracts)
                {
                    if (fc == null) continue;
                    foodDeliveryContracts.Add(new
                    {
                        toAddress = fc.toAddress != null ? FormatStreetAddress(fc.toAddress.streetName, fc.toAddress.streetNumber) : "",
                        itemCount = fc.itemsToDeliver != null ? fc.itemsToDeliver.Count : 0,
                        dayOfDelivery = fc.dayOfDelivery,
                        hourOfDelivery = fc.hourOfDelivery,
                        deliveryFee = (double)Math.Round(fc.deliveryFee, 2)
                    });
                }
            }

            if (save.vehicleDeliveryContracts != null)
            {
                foreach (var vc in save.vehicleDeliveryContracts)
                {
                    if (vc == null) continue;
                    vehicleDeliveryContracts.Add(new
                    {
                        vehicleTypeName = vc.vehicleTypeName ?? "",
                        vehicleColor = vc.vehicleColor ?? "",
                        deliveryDay = vc.deliveryDay,
                        deliveryHour = vc.deliveryHour,
                        deliveryAddress = vc.deliveryAddress != null ? FormatStreetAddress(vc.deliveryAddress.streetName, vc.deliveryAddress.streetNumber) : "",
                        deliveryPrice = (double)Math.Round(vc.deliveryPrice, 2)
                    });
                }
            }

            if (save.movingServiceContracts != null)
            {
                foreach (var mc in save.movingServiceContracts)
                {
                    if (mc == null) continue;
                    movingServiceContracts.Add(new
                    {
                        originAddress = mc.originMovingAddress != null ? FormatStreetAddress(mc.originMovingAddress.streetName, mc.originMovingAddress.streetNumber) : "",
                        destinationAddress = mc.destinationMovingAddress != null ? FormatStreetAddress(mc.destinationMovingAddress.streetName, mc.destinationMovingAddress.streetNumber) : "",
                        movingDay = mc.movingDay,
                        movingHour = mc.movingHour,
                        transferBizManSettings = mc.transferBizManSettings
                    });
                }
            }

            if (save.interiorInstallationFirmContracts != null)
            {
                foreach (var ic in save.interiorInstallationFirmContracts)
                {
                    if (ic == null) continue;
                    interiorInstallationContracts.Add(new
                    {
                        installationAddress = ic.addressToDoTheInstallation != null ? FormatStreetAddress(ic.addressToDoTheInstallation.streetName, ic.addressToDoTheInstallation.streetNumber) : "",
                        designName = ic.designName ?? "",
                        isBlueprint = ic.isBlueprint,
                        dayOfInstallation = ic.dayOfInstallation,
                        businessTypeName = ic.businessTypeName ?? ""
                    });
                }
            }

            if (save.importPartnerships != null)
            {
                foreach (var ip in save.importPartnerships)
                {
                    if (ip == null) continue;

                    var products = new List<object>();
                    if (ip.products != null)
                    {
                        foreach (var prod in ip.products)
                        {
                            if (prod == null || string.IsNullOrEmpty(prod.itemName)) continue;

                            float prodPrice = 0f;
                            try { prodPrice = (float)Math.Round(prod.Price, 2); } catch { }

                            products.Add(new
                            {
                                itemName = FormatItemName(prod.itemName),
                                rawItemName = prod.itemName,
                                amount = prod.amount,
                                amountOrderedThisWeek = prod.amountOrderedThisWeek,
                                assignedWarehouse = prod.assignedWarehouse != null ? FormatStreetAddress(prod.assignedWarehouse.streetName, prod.assignedWarehouse.streetNumber) : "",
                                price = prodPrice
                            });
                        }
                    }

                    float nextDeliveryTotal = 0f;
                    try { nextDeliveryTotal = (float)Math.Round(ip.NextDeliveryTotal, 2); } catch { }

                    string supplierName = "";
                    try
                    {
                        var importReg = ip.importAddress != null ? BuildingHelper.GetBuildingRegistration(ip.importAddress) : null;
                        supplierName = importReg != null ? (importReg.BusinessName ?? "") : "";
                    }
                    catch { }

                    importPartnerships.Add(new
                    {
                        id = ip.id,
                        headquartersAddress = ip.headquartersAddress != null ? FormatStreetAddress(ip.headquartersAddress.streetName, ip.headquartersAddress.streetNumber) : "",
                        importAddress = ip.importAddress != null ? FormatStreetAddress(ip.importAddress.streetName, ip.importAddress.streetNumber) : "",
                        supplierName = supplierName,
                        employeeInstanceId = ip.employeeInstanceId ?? "",
                        nextDeliveryDay = ip.nextDeliveryDay,
                        isRepeatingOrder = ip.isRepeatingOrder,
                        isActive = ip.isActive,
                        isUrgentOrder = ip.isUrgentOrder,
                        nextDeliveryTotal = nextDeliveryTotal,
                        productsCount = products.Count,
                        products = products
                    });
                }
            }

            if (save.PlayerDiplomas != null)
            {
                foreach (var d in save.PlayerDiplomas)
                {
                    if (d == null) continue;
                    diplomas.Add(new
                    {
                        name = d.name.ToString(),
                        minutesStudied = d.minutesStudied,
                        completed = d.completed
                    });
                }
            }

            if (save.TodoTasks != null)
            {
                foreach (var t in save.TodoTasks)
                {
                    if (t == null) continue;
                    todoTasks.Add(new
                    {
                        id = t.id,
                        type = t.type.ToString(),
                        address = t.address != null ? FormatStreetAddress(t.address.streetName, t.address.streetNumber) : "",
                        itemName = t.itemName != null ? FormatItemName(t.itemName) : "",
                        priority = t.priority.ToString(),
                        remainingDays = t.remainingDays
                    });
                }
            }

            if (save.JobInstances != null)
            {
                foreach (var j in save.JobInstances)
                {
                    if (j == null) continue;
                    jobInstances.Add(new
                    {
                        address = j.address != null ? FormatStreetAddress(j.address.streetName, j.address.streetNumber) : "",
                        hired = j.hired,
                        fired = j.fired,
                        warnings = j.warnings,
                        lastWarningDay = j.lastWarningDay,
                        hiringDay = j.hiringDay,
                        firedDay = j.firedDay
                    });
                }
            }

            if (save.logisticsManagerPlans != null)
            {
                foreach (var p in save.logisticsManagerPlans)
                {
                    if (p == null) continue;

                    var destinations = new List<object>();
                    if (p.destinations != null)
                    {
                        foreach (var dest in p.destinations)
                        {
                            if (dest == null || dest.deliveryTargetAddress == null) continue;

                            var stockTargets = new List<object>();
                            if (dest.stockTargets != null)
                            {
                                foreach (var st in dest.stockTargets)
                                {
                                    if (st == null || string.IsNullOrEmpty(st.itemName)) continue;
                                    stockTargets.Add(new
                                    {
                                        itemName = FormatItemName(st.itemName),
                                        rawItemName = st.itemName,
                                        targetAmount = st.targetAmount
                                    });
                                }
                            }

                            string destBusinessName = "";
                            try
                            {
                                var destReg = BuildingHelper.GetBuildingRegistration(dest.deliveryTargetAddress);
                                destBusinessName = destReg != null ? (destReg.BusinessName ?? "") : "";
                            }
                            catch { }

                            destinations.Add(new
                            {
                                deliveryTargetAddress = FormatStreetAddress(dest.deliveryTargetAddress.streetName, dest.deliveryTargetAddress.streetNumber),
                                businessName = destBusinessName,
                                stockTargets = stockTargets
                            });
                        }
                    }

                    int maxDestinations = 0;
                    try { maxDestinations = p.MaxDestinations; } catch { }

                    logisticsPlans.Add(new
                    {
                        id = p.id,
                        assignedEmployeeId = p.assignedEmployeeId ?? "",
                        driverAssigned = !string.IsNullOrEmpty(p.assignedEmployeeId),
                        isFactory = p.isFactory,
                        targetAddress = p.targetAddress != null ? FormatStreetAddress(p.targetAddress.streetName, p.targetAddress.streetNumber) : "",
                        destinationsCount = destinations.Count,
                        maxDestinations = maxDestinations,
                        destinations = destinations
                    });
                }
            }

            if (save.headhunterPlans != null)
            {
                foreach (var p in save.headhunterPlans)
                {
                    if (p == null) continue;
                    headhunterPlans.Add(new
                    {
                        id = p.id,
                        assignedEmployeeId = p.assignedEmployeeId ?? "",
                        isRecruiting = p.isRecruiting,
                        skillRecruiting = FormatSkillName(p.skillRecruiting),
                        skillValueTarget = (double)Math.Round(p.skillValueTarget, 2),
                        automaticallyReplaceOnRetire = p.automaticallyReplaceOnRetire,
                        automaticallyReplaceOnResign = p.automaticallyReplaceOnResign
                    });
                }
            }

            if (save.hrManagerPlans != null)
            {
                foreach (var p in save.hrManagerPlans)
                {
                    if (p == null) continue;
                    hrPlans.Add(new
                    {
                        id = p.id,
                        assignedEmployeeId = p.assignedEmployeeId ?? "",
                        assignedEmployeesCount = p.assignedEmployees != null ? p.assignedEmployees.Count : 0,
                        replaceAbsentEmployees = p.replaceAbsentEmployees,
                        trainingTarget = p.trainingTarget,
                        hasHealthInsurance = p.healthInsurancePlan != null
                    });
                }
            }

            if (save.pricingManagerPlans != null)
            {
                foreach (var p in save.pricingManagerPlans)
                {
                    if (p == null) continue;
                    pricingPlans.Add(new
                    {
                        id = p.id,
                        assignedEmployeeId = p.assignedEmployeeId ?? "",
                        supervisedNeighborhood = p.supervisedNeighborhood ?? "",
                        manuallyPricedItemsCount = p.manuallyPricedItems != null ? p.manuallyPricedItems.Count : 0,
                        nextUpdateDay = p.nextUpdateDay,
                        nextUpdateHour = p.nextUpdateHour
                    });
                }
            }

            if (save.Contacts != null)
            {
                foreach (var c in save.Contacts)
                {
                    if (c == null) continue;
                    int unread = 0;
                    try { unread = c.NumberOfUnreadMessages; } catch { }
                    contacts.Add(new
                    {
                        category = c.category.ToString(),
                        unreadMessages = unread
                    });
                }
            }

            if (save.healthInsurancePlanOffers != null)
            {
                foreach (var o in save.healthInsurancePlanOffers)
                {
                    if (o == null) continue;
                    healthInsuranceOffers.Add(new
                    {
                        hrManagerPlanId = o.hrManagerPlanId ?? "",
                        planType = o.planType.ToString(),
                        dayToSendOffer = o.dayToSendOffer,
                        negotiationFinished = o.negotiationFinished,
                        accepted = o.accepted,
                        initialOfferPrice = (double)Math.Round(o.initialOfferPrice, 2)
                    });
                }
            }

            if (save.candidateSalaryNegotiations != null)
            {
                foreach (var n in save.candidateSalaryNegotiations)
                {
                    if (n == null) continue;
                    salaryNegotiations.Add(new
                    {
                        id = n.id,
                        isRival = n.isRival,
                        isPoached = n.isPoached,
                        hourlyWage = (double)Math.Round(n.hourlyWage, 2),
                        signingBonus = (double)Math.Round(n.signingBonus, 2),
                        completed = n.completed,
                        accepted = n.accepted,
                        mood = n.mood
                    });
                }
            }

            if (save.happinessModifiers != null)
            {
                foreach (var hm in save.happinessModifiers)
                {
                    if (hm == null) continue;
                    happinessModifiers.Add(new
                    {
                        type = hm.type ?? "",
                        hoursLeft = hm.hoursLeft,
                        hideDuration = hm.hideDuration
                    });
                }
            }

            if (save.NeighbourhoodStats != null)
            {
                foreach (var ns in save.NeighbourhoodStats)
                {
                    if (ns == null) continue;
                    neighbourhoodStats.Add(new
                    {
                        name = ns.name ?? "",
                        nextNewBusinessDay = ns.nextNewBusinessDay,
                        nextResidentialSwapDay = ns.nextResidentialSwapDay,
                        nextWarehouseSwapDay = ns.nextWarehouseSwapDay,
                        nextForceShutdownDay = ns.nextForceShutdownDay
                    });
                }
            }

            if (save.playerWeeklyIncomeHistory != null)
            {
                foreach (var entry in save.playerWeeklyIncomeHistory)
                {
                    if (entry == null) continue;
                    playerIncomeHistory.Add(new { day = entry.Item1, income = (double)Math.Round(entry.Item2) });
                }
            }

            if (save.playerNumberOfBusinessesHistory != null)
            {
                foreach (var entry in save.playerNumberOfBusinessesHistory)
                {
                    if (entry == null) continue;
                    playerBusinessCountHistory.Add(new { day = entry.Item1, count = entry.Item2 });
                }
            }

            if (save.foodDeliveryOffers != null)
            {
                foreach (var o in save.foodDeliveryOffers)
                {
                    if (o == null) continue;
                    bool expired = false;
                    try { expired = o.IsExpired(); } catch { }
                    foodDeliveryOffers.Add(new
                    {
                        pickupAddress = o.pickupAddress != null ? FormatStreetAddress(o.pickupAddress.streetName, o.pickupAddress.streetNumber) : "",
                        destinationAddress = o.destinationAddress != null ? FormatStreetAddress(o.destinationAddress.streetName, o.destinationAddress.streetNumber) : "",
                        itemsCount = o.items != null ? o.items.Count : 0,
                        deliveryReward = (double)Math.Round(o.deliveryReward, 2),
                        timeLimitMinutes = o.timeLimitMinutes,
                        isExpired = expired
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

                    if (!string.IsNullOrEmpty(emp.id) && empResolvedInfo.TryGetValue(emp.id, out var resolved))
                    {
                        primarySkill = resolved.skill;
                        empRole = resolved.role;
                        skillPct = resolved.skillLevel;
                    }
                    else
                    {
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
                    }

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

                    float bonusAmount = 0f;
                    try { bonusAmount = (float)Math.Round(emp.GetBonusAmount(), 2); } catch { }

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
                        workedHoursToday = emp.workedHoursToday,
                        workedHoursThisWeek = emp.workedHoursThisWeek,
                        workedDays = emp.workedDays,
                        ageYears = emp.Years,
                        gender = emp.characterData != null ? emp.characterData.gender.ToString() : "",
                        isAbsent = emp.isAbsent,
                        isComplaining = isComplaining,
                        isTraining = emp.IsTraining,
                        isBeingReplaced = emp.isBeingReplaced,
                        poached = emp.poached,
                        poachedByRivalId = emp.poachedByRivalId ?? "",
                        nextSickDay = emp.nextSickDay,
                        bonusAmount = bonusAmount,
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
                        dailyInterest = l.dailyInterest,
                        bankAddress = l.bankAddress != null ? FormatStreetAddress(l.bankAddress.streetName, l.bankAddress.streetNumber) : "",
                        paidAmount = (double)Math.Round(l.PaidAmount, 2)
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

            object gameVariablesObj = null;
            if (save.gameVariables != null)
            {
                gameVariablesObj = new
                {
                    difficulty = save.gameVariables.difficulty.ToString(),
                    taxPercentage = save.gameVariables.taxPercentage,
                    daysPerYear = save.gameVariables.daysPerYear,
                    marketPriceMultiplier = (double)Math.Round(save.gameVariables.marketPriceMultiplier, 4),
                    employeeHourlySalaryMultiplier = (double)Math.Round(save.gameVariables.employeeHourlySalaryMultiplier, 4),
                    bankInterestMultiplier = (double)Math.Round(save.gameVariables.bankInterestMultiplier, 4),
                    rivalsDifficultyMultiplier = (double)Math.Round(save.gameVariables.rivalsDifficultyMultiplier, 4),
                    disableVehicleDamage = save.gameVariables.disableVehicleDamage,
                    disableVehicleFuel = save.gameVariables.disableVehicleFuel,
                    startingMoney = save.gameVariables.startingMoney
                };
            }

            object achievementsObj = null;
            if (save.achievementsData != null)
            {
                var a = save.achievementsData;
                achievementsObj = new
                {
                    totalGasCost = (double)Math.Round(a.totalGasCost, 2),
                    totalRepairCost = (double)Math.Round(a.totalRepairCost, 2),
                    taxesPaid = (double)Math.Round(a.taxesPaid, 2),
                    totalInteriorDesignerCost = (double)Math.Round(a.totalInteriorDesignerCost, 2),
                    totalCasinoWin = (double)Math.Round(a.totalCasinoWin, 2),
                    taxiRides = a.taxiRides,
                    hospitalization = a.hospitalization,
                    parkingTickets = a.parkingTickets,
                    casinoBoatVisits = a.casinoBoatVisits,
                    doctorsAppointments = a.doctorsAppointments,
                    goodsProducedInFactories = a.goodsProducedInFactories,
                    privateDriverRides = a.privateDriverRides,
                    golfHighScore = a.golfHighScore,
                    tennisMatchesWon = a.tennisMatchesWon,
                    golfCartHit = a.golfCartHit,
                    destroyedSandCastle = a.destroyedSandCastle
                };
            }

            object financialTotalsObj = null;
            if (latestFin != null)
            {
                financialTotalsObj = new
                {
                    dayNumber = latestFin.dayNumber,
                    totalBusinessProfit = (double)Math.Round(latestFin.totalBusinessProfit, 2),
                    totalLoanExpenses = (double)Math.Round(latestFin.totalLoanExpenses, 2),
                    totalHealthInsuranceExpenses = (double)Math.Round(latestFin.totalHealthInsuranceExpenses, 2),
                    totalHeadhunterReplacementFees = (double)Math.Round(latestFin.totalHeadhunterReplacementFees, 2),
                    totalRealEstate = (double)Math.Round(latestFin.totalRealEstate, 2),
                    negativeInterestRates = (double)Math.Round(latestFin.negativeInterestRates, 2),
                    parkingFees = (double)Math.Round(latestFin.parkingFees, 2),
                    salaryIncome = (double)Math.Round(latestFin.salaryIncome, 2),
                    totalResidentialExpenses = (double)Math.Round(latestFin.totalResidentialExpenses, 2),
                    totalUnassignedStaffWages = (double)Math.Round(latestFin.totalUnassignedStaffWages, 2),
                    totalProfit = (double)Math.Round(latestFin.totalProfit, 2)
                };
            }

            var midnightBankBalances = new List<object>();
            if (save.midnightBankBalances != null)
            {
                for (int i = 0; i < save.midnightBankBalances.Count; i++)
                {
                    midnightBankBalances.Add((double)Math.Round(save.midnightBankBalances[i], 2));
                }
            }

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
                playerStreetName = save.CurrentStreetName ?? "",
                playerStreetNumber = save.CurrentStreetNumber,
                activeVehicleId = save.ActiveVehicleId ?? "",
                numberOfDoctorOperations = save.numberOfDoctorOperations,
                currentBackTaxes = (double)Math.Round(save.currentBackTaxes, 2),
                gamblingWinnings = (double)Math.Round(save.CurrentTaxPeriodGamblingWinnings, 2),
                gamblingLosses = (double)Math.Round(save.CurrentTaxPeriodGamblingLosses, 2),
                hasCinemaTheaterTicket = save.hasCinemaTheaterTicket,
                energyGeneratedFromConsumables = (double)Math.Round(save.EnergyGeneratedFromConsumables, 2),
                currentActivityHappinessPerHour = (double)Math.Round(save.currentActivityHappinessPerHour, 4),
                midnightBankBalances = midnightBankBalances,
                
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
                emptyLeasedSpaces = emptyLeasedSpaces,
                warehouses = warehouses,
                employees = employees,
                loans = loans,
                operationalAlerts = operationalAlerts,

                // Extended Portfolio & Operations
                gameVariables = gameVariablesObj,
                achievements = achievementsObj,
                financialTotals = financialTotalsObj,
                vehicles = vehicles,
                boats = boats,
                investments = investments,
                rivals = rivals,
                specialRivals = specialRivals,
                marketEvents = marketEvents,
                productMarket = productMarket,
                buildingsForSale = buildingsForSale,
                candidateEmployees = candidateEmployees,
                recruitmentCampaigns = recruitmentCampaigns,
                deliveryContracts = deliveryContracts,
                furnitureDeliveryContracts = furnitureDeliveryContracts,
                foodDeliveryContracts = foodDeliveryContracts,
                vehicleDeliveryContracts = vehicleDeliveryContracts,
                movingServiceContracts = movingServiceContracts,
                interiorInstallationContracts = interiorInstallationContracts,
                importPartnerships = importPartnerships,
                diplomas = diplomas,
                todoTasks = todoTasks,
                jobInstances = jobInstances,
                logisticsPlans = logisticsPlans,
                headhunterPlans = headhunterPlans,
                hrPlans = hrPlans,
                pricingPlans = pricingPlans,
                contacts = contacts,
                healthInsuranceOffers = healthInsuranceOffers,
                salaryNegotiations = salaryNegotiations,
                happinessModifiers = happinessModifiers,
                neighbourhoodStats = neighbourhoodStats,
                playerIncomeHistory = playerIncomeHistory,
                playerBusinessCountHistory = playerBusinessCountHistory,
                foodDeliveryOffers = foodDeliveryOffers
            };

            ThreadPool.QueueUserWorkItem(_ =>
            {
                try
                {
                    string newJson = JsonConvert.SerializeObject(telemetryData);
                    byte[] newBytes = Encoding.UTF8.GetBytes(newJson);
                    lock (_lock)
                    {
                        _cachedTelemetryJson = newJson;
                        _cachedTelemetryBytes = newBytes;
                    }
                }
                catch (Exception ex)
                {
                    LogWarn($"Background serialization error: {ex.Message}");
                }
            });
        }

        private static void RecordTelemetryBuild(long ms)
        {
            _lastTelemetryBuildMs = ms;
            _telemetryBuildSamples.Add(ms);
            if (_telemetryBuildSamples.Count > 30) _telemetryBuildSamples.RemoveAt(0);
        }

        private static void BuildDiagnosticsExport()
        {
            var save = SaveGameManager.Current;
            if (save == null)
            {
                _exportDiagnosticsReady = false;
                return;
            }

            var data = new Dictionary<string, object>
            {
                { "capturedAt", DateTime.UtcNow.ToString("o") },
                { "modVersion", MOD_VERSION },
                { "gameDay", save.Day },
                { "gameHour", save.Hour },
                { "syncMode", _syncModeKind.ToString() },
                { "syncIntervalMs", _syncIntervalMs },
                { "lastTelemetryBuildMs", _lastTelemetryBuildMs }
            };
            try { data["gameVersion"] = Application.version; } catch { }

            // Rolling telemetry build-time stats (not just a single sample).
            long statMin = _lastTelemetryBuildMs, statMax = _lastTelemetryBuildMs, statSum = _lastTelemetryBuildMs;
            int sampleCount = _telemetryBuildSamples.Count;
            if (sampleCount > 0)
            {
                statMin = _telemetryBuildSamples[0];
                statMax = _telemetryBuildSamples[0];
                statSum = 0;
                foreach (var s in _telemetryBuildSamples)
                {
                    if (s < statMin) statMin = s;
                    if (s > statMax) statMax = s;
                    statSum += s;
                }
            }
            long statAvg = sampleCount > 0 ? (long)Math.Round(statSum / (double)sampleCount) : _lastTelemetryBuildMs;
            data["telemetryBuildMs"] = new
            {
                last = _lastTelemetryBuildMs,
                min = statMin,
                avg = statAvg,
                max = statMax,
                samples = sampleCount
            };

            string cachedTelemetry = _cachedTelemetryJson;
            data["lastTelemetryKb"] = !string.IsNullOrEmpty(cachedTelemetry) ? (int)Math.Round(cachedTelemetry.Length / 1024.0) : 0;

            var regs = save.BuildingRegistrations;
            int rented = 0;
            long orderHistoryTotal = 0;
            long retailPricesTotal = 0;
            var rentedStores = new List<object>();

            // Per-business staff load is one of the biggest scaling costs (skill/role resolution).
            var employeeByAddress = new Dictionary<string, int>(StringComparer.Ordinal);
            if (save.EmployeeInstances != null)
            {
                foreach (var e in save.EmployeeInstances)
                {
                    if (e == null || e.assignedAddress == null || string.IsNullOrEmpty(e.assignedAddress.streetName)) continue;
                    string key = e.assignedAddress.streetName + "_" + e.assignedAddress.streetNumber;
                    employeeByAddress[key] = employeeByAddress.TryGetValue(key, out int c) ? c + 1 : 1;
                }
            }

            if (regs != null)
            {
                int[] orderHistoryBuckets = new int[6]; // 0, 1-49, 50-249, 250-999, 1000-4999, 5000+
                foreach (var r in regs)
                {
                    if (!r.RentedByPlayer) continue;
                    rented++;
                    int oh = r.orderHistory?.Count ?? 0;
                    orderHistoryTotal += oh;
                    retailPricesTotal += r.retailPrices?.Count ?? 0;

                    if (oh <= 0) orderHistoryBuckets[0]++;
                    else if (oh < 50) orderHistoryBuckets[1]++;
                    else if (oh < 250) orderHistoryBuckets[2]++;
                    else if (oh < 1000) orderHistoryBuckets[3]++;
                    else if (oh < 5000) orderHistoryBuckets[4]++;
                    else orderHistoryBuckets[5]++;

                    int empAssigned = 0;
                    string empKey = (r.StreetName ?? "") + "_" + r.StreetNumber;
                    if (employeeByAddress.TryGetValue(empKey, out int ec)) empAssigned = ec;

                    rentedStores.Add(new
                    {
                        address = FormatStreetAddress(r.StreetName ?? "", r.StreetNumber),
                        businessType = r.businessTypeName ?? "",
                        orderHistoryCount = oh,
                        retailPriceCount = r.retailPrices?.Count ?? 0,
                        employeeCount = empAssigned,
                        creationDay = r.creationDay
                    });
                }
                data["orderHistoryDistribution"] = orderHistoryBuckets;

                // Warehouse weight: stocked product entries and pallets add per-sync work.
                int warehouseCount = 0, warehouseProductEntries = 0, warehousePallets = 0;
                foreach (var r in regs)
                {
                    if (!r.RentedByPlayer) continue;
                    var warehouseObj = r as Warehouse;
                    if (warehouseObj == null) continue;
                    warehouseCount++;
                    try
                    {
                        foreach (var prod in warehouseObj.GetProducts())
                        {
                            warehouseProductEntries++;
                            int pallets = BuildingHelper.CountResourcesInPallets(warehouseObj.Address, prod);
                            if (pallets > 0) warehousePallets += pallets;
                        }
                    }
                    catch { }
                }
                data["warehouses"] = warehouseCount;
                data["warehouseProductEntries"] = warehouseProductEntries;
                data["warehousePallets"] = warehousePallets;
            }

            data["buildingRegistrations"] = regs?.Count ?? 0;
            data["businessesRented"] = rented;
            data["financialSummaries"] = save.financialSummaries?.Count ?? 0;
            data["employees"] = save.EmployeeInstances?.Count ?? 0;
            data["realEstate"] = save.realEstate?.Count ?? 0;
            data["orderHistoryTotalEntries"] = orderHistoryTotal;
            data["retailPricesTotalEntries"] = retailPricesTotal;
            // Business summaries capped so the file stays small even on giant saves.
            data["businesses"] = rentedStores.Count > 200 ? rentedStores.GetRange(0, 200) : rentedStores;

            // Approx on-disk save size (newest .hsg under the save folder) - useful context for "big save".
            try
            {
                var saveDir = new System.IO.DirectoryInfo(System.IO.Path.Combine(Application.persistentDataPath, "SaveGames"));
                if (saveDir.Exists)
                {
                    System.IO.FileInfo newest = null;
                    foreach (var f in saveDir.GetFiles("*.hsg", System.IO.SearchOption.AllDirectories))
                    {
                        if (newest == null || f.LastWriteTimeUtc > newest.LastWriteTimeUtc) newest = f;
                    }
                    if (newest != null)
                    {
                        // Deliberately no file name: .hsg files are often named after the player's save
                        // (SaveGameName), which can contain a real name. Only harmless metadata is shared.
                        data["saveFileKb"] = (int)Math.Round(newest.Length / 1024.0);
                        data["saveFileModifiedUtc"] = newest.LastWriteTimeUtc.ToString("o");
                    }
                }
            }
            catch { }

            // Player.log path for crash debugging. It lives under the Windows user folder
            // (potentially a real name), so we only expose the part from LocalLow onward -
            // no username, no placeholder that could be mistaken for one.
            string playerLogActual = System.IO.Path.Combine(Application.persistentDataPath, "Player.log");
            data["playerLogExists"] = System.IO.File.Exists(playerLogActual);
            string playerLogPath = playerLogActual;
            try
            {
                int idx = playerLogPath.IndexOf("LocalLow", StringComparison.OrdinalIgnoreCase);
                if (idx > 0)
                {
                    playerLogPath = playerLogPath.Substring(idx);
                }
                else
                {
                    string user = Environment.UserName;
                    if (!string.IsNullOrEmpty(user)) playerLogPath = playerLogPath.Replace(user, "[redacted]");
                }
            }
            catch { }
            data["playerLogPath"] = playerLogPath;

            string json = JsonConvert.SerializeObject(data, Formatting.None);
            data["diagnosticsKb"] = (int)Math.Round(json.Length / 1024.0);
            json = JsonConvert.SerializeObject(data, Formatting.None);

            byte[] bytes = Encoding.UTF8.GetBytes(json);
            lock (_lock)
            {
                _cachedDiagnosticsBytes = bytes;
            }
            _exportDiagnosticsReady = true;
        }

        private static string FormatStreetAddress(string street, int number)
        {
            if (string.IsNullOrEmpty(street)) return "Unknown Address";
            string key = $"{street}_{number}";
            if (_streetAddressCache.TryGetValue(key, out string cached)) return cached;
            string result;
            try
            {
                // Prefer the game's own runtime-localized street display name so the web app
                // matches exactly what the player sees in-game (e.g. "45 3rd Street").
                string display = Streets.AddressHelper.GetStreetNameLocalized(street);
                if (string.IsNullOrEmpty(display) || display == street)
                {
                    result = FallbackFormatStreetAddress(street, number);
                }
                else
                {
                    result = $"{number} {display}";
                }
            }
            catch (Exception ex)
            {
                LogWarn($"Street address localization failed for '{street}': {ex.Message}");
                result = FallbackFormatStreetAddress(street, number);
            }
            _streetAddressCache[key] = result;
            return result;
        }

        private static string FallbackFormatStreetAddress(string street, int number)
        {
            string clean = street.Replace("ba:street_", "").Replace("_", " ");
            string titled = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(clean);
            return $"{number} {titled}";
        }

        private static string FormatDistrictName(string district)
        {
            if (string.IsNullOrEmpty(district)) return "New York City";
            if (_districtNameCache.TryGetValue(district, out string cached)) return cached;
            string clean = district.Replace("ba:neighborhood_", "").Replace("ba:district_", "").Replace("_", " ");
            string result;
            if (clean.Equals("garmentdistrict", StringComparison.OrdinalIgnoreCase)) result = "Garment District";
            else if (clean.Equals("hellskitchen", StringComparison.OrdinalIgnoreCase)) result = "Hell's Kitchen";
            else if (clean.Equals("murrayhill", StringComparison.OrdinalIgnoreCase)) result = "Murray Hill";
            else if (clean.Equals("midtown", StringComparison.OrdinalIgnoreCase)) result = "Midtown";
            else result = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(clean);
            _districtNameCache[district] = result;
            return result;
        }

        private static string FormatBuildingTypeName(string bType)
        {
            if (string.IsNullOrEmpty(bType)) return "Commercial";
            string clean = bType.Replace("ba:buildingtype_", "");
            if (clean.Equals("residential", StringComparison.OrdinalIgnoreCase)) return "Residence";
            return System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(clean);
        }

        private static string FormatBusinessTypeName(string bType)
        {
            if (_businessTypeCache.TryGetValue(bType, out string cached)) return cached;
            string clean = bType.Replace("ba:businesstype_", "").ToLowerInvariant();
            string result;
            switch (clean)
            {
                case "fastfood":
                case "fastfoodrestaurant":
                    result = "Fast Food Restaurant";
                    break;
                case "coffeeshop":
                    result = "Coffee Shop";
                    break;
                case "supermarket":
                    result = "Supermarket";
                    break;
                case "electronicsstore":
                    result = "Electronics Store";
                    break;
                case "clothingstore":
                    result = "Clothing Store";
                    break;
                case "jewelrystore":
                    result = "Jewelry Store";
                    break;
                case "liquorstore":
                    result = "Liquor Store";
                    break;
                case "florist":
                    result = "Florist";
                    break;
                case "bookstore":
                    result = "Bookstore";
                    break;
                case "giftshop":
                    result = "Gift Shop";
                    break;
                case "lawfirm":
                    result = "Law Firm";
                    break;
                case "webdevelopmentagency":
                    result = "Web Dev Agency";
                    break;
                case "graphicdesignagency":
                case "graphicdesigner":
                    result = "Graphic Design Agency";
                    break;
                default:
                    result = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(clean.Replace("_", " "));
                    break;
            }
            _businessTypeCache[bType] = result;
            return result;
        }

        private static string FormatItemName(string raw)
        {
            if (string.IsNullOrEmpty(raw)) return "";
            if (_itemNameCache.TryGetValue(raw, out string cached)) return cached;
            string clean = raw.Replace("ba:itemname_", "").Replace("ba:item_", "").Replace("ba:item", "").Replace("_", " ");
            string result = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(clean);
            _itemNameCache[raw] = result;
            return result;
        }

        private static string FormatSkillName(string raw)
        {
            if (string.IsNullOrEmpty(raw)) return "General";
            if (_skillNameCache.TryGetValue(raw, out string cached)) return cached;
            string clean = raw.Replace("ba:skill_", "").Replace("_", " ");
            string result = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(clean);
            _skillNameCache[raw] = result;
            return result;
        }

        private static string FormatDemandName(string raw)
        {
            if (string.IsNullOrEmpty(raw)) return "";
            if (_demandNameCache.TryGetValue(raw, out string cached)) return cached;
            string clean = raw.Replace("ba:jobdemand_", "").Replace("ba:demand_", "").Replace("_", " ");
            string result = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(clean);
            _demandNameCache[raw] = result;
            return result;
        }
    }
}
