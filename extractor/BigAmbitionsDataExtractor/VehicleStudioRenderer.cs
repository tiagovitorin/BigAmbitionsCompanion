using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using BigAmbitions.SaveSystem;
using Controllers;
using Data.VehicleColors;
using Helpers;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.HighDefinition;
using Vehicles.VehicleTypes;
using NWH.WheelController3D;
using Boats;
using Entities;

namespace BigAmbitionsDataExtractor
{
    public static class VehicleStudioRenderer
    {
        private static readonly Vector3 StudioPosition = new Vector3(0f, 5000f, 0f);
        private const int StudioPanelLayer = 29;

        private static readonly Dictionary<string, string> CanonicalColors = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "anselmoaf90", "Red" },
            { "bima320", "Red" },
            { "deliverytruck", "Black" },
            { "electricscooter", "Black" },
            { "ferdinand112", "Grey" },
            { "freighttruckt1", "White" },
            { "honzamimic", "Red" },
            { "limo", "Black" },
            { "luxuryyacht", "White" },
            { "mersaididash", "White" },
            { "mersaidimgagt", "Yellow" },
            { "mersaidis500", "Black" },
            { "missamvillian", "Grey" },
            { "petrollsfanton", "Black" },
            { "speedboat", "White" },
            { "umcdesert", "White" },
            { "umcdesertdeliveryjob", "White" },
            { "umcnunavut", "Black" },
            { "vordpony", "Blue" },
            { "vordtiaravic", "Yellow" },
            { "vordv150", "Red" },
            { "yacht", "White" },
            { "flatbed", "Grey" },
            { "handtruck", "Red" }
        };

        private static readonly Dictionary<string, string> ShowcasePrefabNames = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "anselmoaf90", "AnselmoAF90Showcase" },
            { "bima320", "Bima320Showcase" },
            { "deliverytruck", "DeliveryTruckShowcase" },
            { "ferdinand112", "Ferdinand112Showcase" },
            { "freighttruckt1", "FreightTruckT1Showcase" },
            { "honzamimic", "HonzaMimicShowcase" },
            { "limo", "LimoShowcase" },
            { "mersaididash", "MersaidiDashShowcase" },
            { "mersaidimgagt", "MersaidiMGAGTShowcase" },
            { "mersaidis500", "MersaidiS500Showcase" },
            { "missamvillian", "MissamVillianShowcase" },
            { "petrollsfanton", "PetrollsFantonShowcase" },
            { "umcdesert", "UMCDesertShowcase" },
            { "umcdesertdeliveryjob", "UMCDesertShowcase" },
            { "umcnunavut", "UMCNunavutShowcase" },
            { "vordpony", "VordPonyShowcase" },
            { "vordtiaravic", "VordTiaraVicShowcase" },
            { "vordv150", "VordV150Showcase" }
        };

        private static Texture FindSkyTexture(Action<string> log)
        {
            try
            {
                // 1. Check existing active HD reflection probes in the scene
                var probes = UnityEngine.Object.FindObjectsOfType<HDAdditionalReflectionData>();
                foreach (var p in probes)
                {
                    if (p != null && p.gameObject.name != "StudioReflectionProbe")
                    {
                        Texture tex = p.texture ?? p.customTexture ?? p.bakedTexture;
                        if (tex != null)
                        {
                            log?.Invoke($"Found sky texture from scene reflection probe '{p.name}': {tex.name} ({tex.GetType().Name})");
                            return tex;
                        }
                    }
                }

                // 2. Check legacy ReflectionProbes
                var legacyProbes = UnityEngine.Object.FindObjectsOfType<ReflectionProbe>();
                foreach (var lp in legacyProbes)
                {
                    if (lp != null && lp.gameObject.name != "StudioReflectionProbe")
                    {
                        Texture tex = lp.bakedTexture ?? lp.customBakedTexture;
                        if (tex != null)
                        {
                            log?.Invoke($"Found sky texture from legacy ReflectionProbe '{lp.name}': {tex.name}");
                            return tex;
                        }
                    }
                }

                // 3. Check TimeOfDayController volume profiles
                var tod = UnityEngine.Object.FindObjectOfType<TimeOfDayController>();
                if (tod != null)
                {
                    var dayVolProp = typeof(TimeOfDayController).GetField("dayVolume", BindingFlags.NonPublic | BindingFlags.Instance);
                    if (dayVolProp != null)
                    {
                        var dayVol = dayVolProp.GetValue(tod) as VolumeProfile;
                        if (dayVol != null && dayVol.TryGet<HDRISky>(out var dayHdri) && dayHdri.hdriSky != null && dayHdri.hdriSky.value != null)
                        {
                            var cb = dayHdri.hdriSky.value as Cubemap;
                            if (cb != null)
                            {
                                log?.Invoke("Found sky cubemap in TimeOfDayController.dayVolume: " + cb.name);
                                return cb;
                            }
                        }
                    }

                    var profilesField = typeof(TimeOfDayController).GetField("postProcessingVolumeProfiles", BindingFlags.NonPublic | BindingFlags.Instance);
                    if (profilesField != null)
                    {
                        var profiles = profilesField.GetValue(tod) as VolumeProfile[];
                        if (profiles != null)
                        {
                            foreach (var p in profiles)
                            {
                                if (p != null && p.TryGet<HDRISky>(out var hdri) && hdri.hdriSky != null && hdri.hdriSky.value != null)
                                {
                                    var cb = hdri.hdriSky.value as Cubemap;
                                    if (cb != null)
                                    {
                                        log?.Invoke("Found sky cubemap in TimeOfDayController profile: " + cb.name);
                                        return cb;
                                    }
                                }
                            }
                        }
                    }
                }

                // 4. Check Resources for Cubemaps in memory
                var allCubemaps = Resources.FindObjectsOfTypeAll<Cubemap>();
                foreach (var cm in allCubemaps)
                {
                    if (cm == null) continue;
                    string name = cm.name.ToLower();
                    if (name.Contains("sky") || name.Contains("day") || name.Contains("cloud") || name.Contains("noon") || name.Contains("sun"))
                    {
                        log?.Invoke("Found candidate sky cubemap in memory: " + cm.name);
                        return cm;
                    }
                }

                if (allCubemaps.Length > 0)
                {
                    log?.Invoke("Using fallback cubemap in memory: " + allCubemaps[0].name);
                    return allCubemaps[0];
                }
            }
            catch (Exception ex)
            {
                log?.Invoke("Error finding sky texture: " + ex.Message);
            }
            return null;
        }

        private static Mesh GenerateCycloramaMesh(Bounds bounds)
        {
            Mesh mesh = new Mesh();
            mesh.name = "ShowroomCycloramaArena";

            int radialSegments = 72;
            int floorRings = 8;
            int curveRings = 14;
            int wallRings = 6;
            int totalRings = floorRings + curveRings + wallRings;

            float modelRadius = bounds.extents.magnitude;
            float fovRad = 28f * Mathf.Deg2Rad;
            float distance = (modelRadius / Mathf.Sin(fovRad * 0.5f)) * 1.05f;

            float floorRadius = Mathf.Max(26.0f, modelRadius * 2.2f);
            float outerRadius = Mathf.Max(50.0f, distance * 1.6f);
            outerRadius = Mathf.Max(outerRadius, floorRadius + 20f);
            float curveHeight = Mathf.Max(12.0f, distance * 0.3f);
            float wallTopHeight = Mathf.Max(38.0f, distance * 0.9f);
            wallTopHeight = Mathf.Max(wallTopHeight, curveHeight + 15f);

            float[] ringR = new float[totalRings + 1];
            float[] ringY = new float[totalRings + 1];

            // Flat floor rings
            for (int i = 0; i <= floorRings; i++)
            {
                float t = (float)i / floorRings;
                ringR[i] = t * floorRadius;
                ringY[i] = 0f;
            }

            // Smooth curve transition rings
            for (int i = 1; i <= curveRings; i++)
            {
                float t = (float)i / curveRings;
                ringR[floorRings + i] = Mathf.Lerp(floorRadius, outerRadius, t);
                ringY[floorRings + i] = (1.0f - Mathf.Cos(t * Mathf.PI * 0.5f)) * curveHeight;
            }

            // Vertical wall rings
            for (int i = 1; i <= wallRings; i++)
            {
                float t = (float)i / wallRings;
                ringR[floorRings + curveRings + i] = outerRadius;
                ringY[floorRings + curveRings + i] = curveHeight + t * (wallTopHeight - curveHeight);
            }

            int vertCount = (totalRings + 1) * (radialSegments + 1);
            Vector3[] vertices = new Vector3[vertCount];
            Vector2[] uvs = new Vector2[vertCount];

            for (int ir = 0; ir <= totalRings; ir++)
            {
                float r = ringR[ir];
                float y = ringY[ir];

                for (int iseg = 0; iseg <= radialSegments; iseg++)
                {
                    float angle = (float)iseg / radialSegments * Mathf.PI * 2.0f;
                    float x = Mathf.Sin(angle) * r;
                    float z = Mathf.Cos(angle) * r;

                    int idx = ir * (radialSegments + 1) + iseg;
                    vertices[idx] = new Vector3(x, y, z);
                    uvs[idx] = new Vector2((float)iseg / radialSegments, (float)ir / totalRings);
                }
            }

            int[] triangles = new int[totalRings * radialSegments * 6];
            int triIdx = 0;

            for (int ir = 0; ir < totalRings; ir++)
            {
                for (int iseg = 0; iseg < radialSegments; iseg++)
                {
                    int curr = ir * (radialSegments + 1) + iseg;
                    int next = curr + 1;
                    int above = (ir + 1) * (radialSegments + 1) + iseg;
                    int aboveNext = above + 1;

                    // Facing upward/inward
                    triangles[triIdx++] = curr;
                    triangles[triIdx++] = above;
                    triangles[triIdx++] = next;

                    triangles[triIdx++] = next;
                    triangles[triIdx++] = above;
                    triangles[triIdx++] = aboveNext;
                }
            }

            mesh.vertices = vertices;
            mesh.uv = uvs;
            mesh.triangles = triangles;
            mesh.RecalculateNormals();
            mesh.RecalculateBounds();

            return mesh;
        }

        private struct PointKey : IEquatable<PointKey>
        {
            public readonly int X;
            public readonly int Y;
            public readonly int Z;

            public PointKey(float x, float y, float z)
            {
                X = (int)Math.Round(x * 2000.0);
                Y = (int)Math.Round(y * 2000.0);
                Z = (int)Math.Round(z * 2000.0);
            }

            public bool Equals(PointKey other) => X == other.X && Y == other.Y && Z == other.Z;
            public override bool Equals(object obj) => obj is PointKey other && Equals(other);
            public override int GetHashCode()
            {
                unchecked
                {
                    int hash = 17;
                    hash = hash * 31 + X;
                    hash = hash * 31 + Y;
                    hash = hash * 31 + Z;
                    return hash;
                }
            }
        }

        private static void SmoothMeshNormals(GameObject root)
        {
            var filters = root.GetComponentsInChildren<MeshFilter>(true);
            foreach (var mf in filters)
            {
                if (mf == null || mf.sharedMesh == null) continue;
                string mfName = mf.name.ToLower();
                if (mfName.Contains("wheel") || mfName.Contains("glass") || mfName.Contains("window") || mfName.Contains("windshield") || mfName.Contains("lens") || mfName.Contains("collider") || mfName.Contains("shadow")) continue;

                try
                {
                    Mesh mesh = UnityEngine.Object.Instantiate(mf.sharedMesh);
                    Vector3[] verts = mesh.vertices;
                    Vector3[] norms = mesh.normals;
                    if (verts == null || norms == null || verts.Length == 0 || norms.Length == 0) continue;

                    var posToVertIndices = new Dictionary<PointKey, List<int>>();
                    for (int i = 0; i < verts.Length; i++)
                    {
                        var key = new PointKey(verts[i].x, verts[i].y, verts[i].z);
                        if (!posToVertIndices.TryGetValue(key, out var list))
                        {
                            list = new List<int>(4);
                            posToVertIndices[key] = list;
                        }
                        list.Add(i);
                    }

                    Vector3[] smoothedNorms = new Vector3[norms.Length];
                    for (int i = 0; i < verts.Length; i++)
                    {
                        var key = new PointKey(verts[i].x, verts[i].y, verts[i].z);
                        var list = posToVertIndices[key];
                        Vector3 ni = norms[i];
                        Vector3 acc = ni;

                        for (int k = 0; k < list.Count; k++)
                        {
                            int otherIdx = list[k];
                            if (otherIdx == i) continue;
                            Vector3 no = norms[otherIdx];
                            // Angle-aware Auto Smooth: only average normals within ~53 degrees
                            if (Vector3.Dot(ni, no) >= 0.60f)
                            {
                                acc += no;
                            }
                        }

                        smoothedNorms[i] = acc.sqrMagnitude > 1e-6f ? acc.normalized : ni;
                    }

                    mesh.normals = smoothedNorms;
                    mesh.RecalculateTangents();
                    mf.sharedMesh = mesh;
                }
                catch {}
            }
        }

        private static string Capitalize(string s)
        {
            if (string.IsNullOrEmpty(s)) return s;
            if (s.Length == 1) return s.ToUpperInvariant();
            return char.ToUpperInvariant(s[0]) + s.Substring(1);
        }

        private static GameObject FindVehicleOrBoatPrefab(string id, Action<string> log, out bool isBoat, out string loadedModelName)
        {
            isBoat = false;
            loadedModelName = null;
            string idLower = id.ToLowerInvariant();

            // 1. Check if it's a known boat (speedboat, yacht, luxuryyacht)
            if (idLower == "speedboat" || idLower == "yacht" || idLower == "luxuryyacht")
            {
                isBoat = true;
                log?.Invoke($"Searching for boat source model for '{id}'...");

                // A. Check BoatManager.Instance children
                try
                {
                    if (BoatManager.Instance != null)
                    {
                        var boats = BoatManager.Instance.GetComponentsInChildren<Boat>(true);
                        log?.Invoke($"BoatManager.Instance found with {boats.Length} boats in scene.");
                        foreach (var b in boats)
                        {
                            if (b != null && string.Equals(b.boatTypeName.ToString(), id, StringComparison.OrdinalIgnoreCase))
                            {
                                loadedModelName = $"BoatManager/{b.gameObject.name}";
                                log?.Invoke($"Found boat '{id}' under BoatManager.Instance: {loadedModelName}");
                                return b.gameObject;
                            }
                        }
                    }
                    else
                    {
                        log?.Invoke("BoatManager.Instance is null at this point.");
                    }
                }
                catch (Exception ex)
                {
                    log?.Invoke($"BoatManager query notice: {ex.Message}");
                }

                // B. Check all Boat components across all loaded scenes and assets
                try
                {
                    var allBoats = Resources.FindObjectsOfTypeAll<Boat>();
                    log?.Invoke($"Resources.FindObjectsOfTypeAll<Boat> found {allBoats.Length} total boat instances.");
                    foreach (var b in allBoats)
                    {
                        if (b != null && string.Equals(b.boatTypeName.ToString(), id, StringComparison.OrdinalIgnoreCase))
                        {
                            loadedModelName = $"SceneBoat/{b.gameObject.name}";
                            log?.Invoke($"Found boat '{id}' via Resources.FindObjectsOfTypeAll<Boat>: {loadedModelName}");
                            return b.gameObject;
                        }
                    }
                }
                catch (Exception ex)
                {
                    log?.Invoke($"Resources.FindObjectsOfTypeAll<Boat> notice: {ex.Message}");
                }

                // C. Check all BoatController components
                try
                {
                    var allControllers = Resources.FindObjectsOfTypeAll<BoatController>();
                    log?.Invoke($"Resources.FindObjectsOfTypeAll<BoatController> found {allControllers.Length} total controllers.");
                    foreach (var bc in allControllers)
                    {
                        if (bc != null)
                        {
                            bool match = false;
                            try
                            {
                                var boatComp = bc.GetComponent<Boat>() ?? bc.GetComponentInParent<Boat>();
                                if (boatComp != null && string.Equals(boatComp.boatTypeName.ToString(), id, StringComparison.OrdinalIgnoreCase))
                                {
                                    match = true;
                                }
                            }
                            catch {}

                            if (!match && bc.gameObject != null && bc.gameObject.name.IndexOf(id, StringComparison.OrdinalIgnoreCase) >= 0)
                            {
                                match = true;
                            }

                            if (match)
                            {
                                loadedModelName = $"BoatController/{bc.gameObject.name}";
                                log?.Invoke($"Found boat '{id}' via BoatController: {loadedModelName}");
                                return bc.gameObject;
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    log?.Invoke($"Resources.FindObjectsOfTypeAll<BoatController> notice: {ex.Message}");
                }

                // D. Try PrefabHelper candidate paths
                string[] boatPrefabNames = new string[]
                {
                    id,
                    id + "Showcase",
                    "Boats/" + id,
                    "Boats/" + id + "Showcase",
                    "Vehicles/Boats/" + id,
                    "Boat_" + id,
                    Capitalize(id),
                    Capitalize(id) + "Showcase",
                    "Boats/" + Capitalize(id),
                    "Boats/" + Capitalize(id) + "Showcase",
                    "LuxuryYacht",
                    "LuxuryYachtShowcase",
                    "Boats/LuxuryYacht",
                    "Boats/LuxuryYachtShowcase",
                    "Speedboat",
                    "SpeedboatShowcase",
                    "Boats/Speedboat",
                    "Boats/SpeedboatShowcase",
                    "Yacht",
                    "YachtShowcase",
                    "Boats/Yacht",
                    "Boats/YachtShowcase"
                };

                foreach (var cName in boatPrefabNames)
                {
                    try
                    {
                        var p = PrefabHelper.LoadPrefabAssetByName(cName);
                        if (p != null)
                        {
                            loadedModelName = $"Prefab/{cName}";
                            log?.Invoke($"Loaded boat prefab via PrefabHelper: {loadedModelName}");
                            return p;
                        }
                    }
                    catch {}
                }

                // E. Search all GameObjects in memory by name
                try
                {
                    var allGos = Resources.FindObjectsOfTypeAll<GameObject>();
                    foreach (var go in allGos)
                    {
                        if (go == null) continue;
                        string gName = go.name.ToLowerInvariant();
                        if (gName == idLower || gName == idLower + "showcase" || gName == "boat_" + idLower || gName.StartsWith(idLower + "("))
                        {
                            if (go.GetComponentInChildren<Renderer>(true) != null)
                            {
                                loadedModelName = $"MemoryGO/{go.name}";
                                log?.Invoke($"Found boat GameObject in memory with renderers: {loadedModelName}");
                                return go;
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    log?.Invoke($"Resources.FindObjectsOfTypeAll<GameObject> notice: {ex.Message}");
                }
            }

            // 2. Search for land vehicles
            if (ShowcasePrefabNames.TryGetValue(id, out string showcaseName))
            {
                var p = PrefabHelper.LoadPrefabAssetByName(showcaseName);
                if (p != null)
                {
                    loadedModelName = showcaseName;
                    return p;
                }
            }

            var pShowcase = PrefabHelper.LoadPrefabAssetByName(id + "Showcase");
            if (pShowcase != null)
            {
                loadedModelName = id + "Showcase";
                return pShowcase;
            }

            var pPlayer = PrefabHelper.LoadPrefabAssetByName("Vehicles/PlayerVehicles/" + id);
            if (pPlayer != null)
            {
                loadedModelName = "Vehicles/PlayerVehicles/" + id;
                return pPlayer;
            }

            var pVeh = PrefabHelper.LoadPrefabAssetByName("Vehicles/" + id);
            if (pVeh != null)
            {
                loadedModelName = "Vehicles/" + id;
                return pVeh;
            }

            var pDirect = PrefabHelper.LoadPrefabAssetByName(id);
            if (pDirect != null)
            {
                loadedModelName = id;
                return pDirect;
            }

            return null;
        }

        public static int RenderAllVehicles(string outputDir, string defaultColorName = "Red", Action<string> log = null)
        {
            if (string.IsNullOrEmpty(outputDir))
            {
                log?.Invoke("VehicleStudioRenderer: Output directory is null or empty.");
                return 0;
            }

            Directory.CreateDirectory(outputDir);

            // Also copy directly to local web assets directory and repository data folder if they exist
            string webVehiclesDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                "Desktop", "BigAmbitionsTool", "web", "public", "images", "vehicles"
            );
            bool exportToWeb = Directory.Exists(Path.GetDirectoryName(webVehiclesDir));
            if (exportToWeb)
            {
                Directory.CreateDirectory(webVehiclesDir);
            }

            string repoRendersDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                "Desktop", "BigAmbitionsTool", "data", "raw", "vehicle_renders"
            );
            bool exportToRepo = Directory.Exists(Path.GetDirectoryName(repoRendersDir));
            if (exportToRepo)
            {
                Directory.CreateDirectory(repoRendersDir);
            }

            GameObject studioRoot = null;
            Camera camera = null;
            RenderTexture renderTexture = null;
            Volume volume = null;
            VolumeProfile profile = null;
            int renderedCount = 0;

            try
            {
                log?.Invoke("Setting up off-screen vehicle showroom studio at " + StudioPosition + "...");
                studioRoot = new GameObject("VehicleStudioRoot");
                studioRoot.transform.position = StudioPosition;

                // 1. Studio Post-Process Volume (Exposure & Tonemapping calibration)
                GameObject volumeObj = new GameObject("StudioVolume");
                volumeObj.transform.SetParent(studioRoot.transform);
                volume = volumeObj.AddComponent<Volume>();
                volume.isGlobal = true;
                volume.priority = 1000f;

                profile = ScriptableObject.CreateInstance<VolumeProfile>();
                volume.profile = profile;

                var exposure = profile.Add<Exposure>(true);
                exposure.mode.overrideState = true;
                exposure.mode.value = ExposureMode.Fixed;
                exposure.fixedExposure.overrideState = true;
                exposure.fixedExposure.value = 10.4f;

                var bloom = profile.Add<Bloom>(true);
                bloom.intensity.overrideState = true;
                bloom.intensity.value = 0.08f;
                bloom.threshold.overrideState = true;
                bloom.threshold.value = 1.0f;

                var tonemapping = profile.Add<Tonemapping>(true);
                tonemapping.mode.overrideState = true;
                tonemapping.mode.value = TonemappingMode.ACES;

                var whiteBalance = profile.Add<WhiteBalance>(true);
                whiteBalance.temperature.overrideState = true;
                whiteBalance.temperature.value = 0f;
                whiteBalance.tint.overrideState = true;
                whiteBalance.tint.value = 0f;

                var ssr = profile.Add<ScreenSpaceReflection>(true);
                ssr.enabled.overrideState = true;
                ssr.enabled.value = false;

                var shadowSettings = profile.Add<HDShadowSettings>(true);
                shadowSettings.maxShadowDistance.overrideState = true;
                shadowSettings.maxShadowDistance.value = 60f;

                var ao = profile.Add<ScreenSpaceAmbientOcclusion>(true);
                ao.intensity.overrideState = true;
                ao.intensity.value = 0.0f;

                // Visual Environment and Sky configuration for realistic showroom reflections
                var visualEnv = profile.Add<VisualEnvironment>(true);
                visualEnv.skyAmbientMode.overrideState = true;
                visualEnv.skyAmbientMode.value = SkyAmbientMode.Dynamic;

                Texture skyTexture = FindSkyTexture(log);
                if (skyTexture is Cubemap skyCubemap)
                {
                    visualEnv.skyType.overrideState = true;
                    visualEnv.skyType.value = 1; // 1 = HDRISky

                    var hdriSky = profile.Add<HDRISky>(true);
                    hdriSky.hdriSky.overrideState = true;
                    hdriSky.hdriSky.value = skyCubemap;
                    hdriSky.exposure.overrideState = true;
                    hdriSky.exposure.value = 1.0f;
                    hdriSky.multiplier.overrideState = true;
                    hdriSky.multiplier.value = 1.5f;
                    hdriSky.rotation.overrideState = true;
                    hdriSky.rotation.value = 45f;
                }
                else
                {
                    visualEnv.skyType.overrideState = true;
                    visualEnv.skyType.value = 3; // 3 = GradientSky
                }

                var gradSky = profile.Add<GradientSky>(true);
                gradSky.top.overrideState = true;
                gradSky.top.value = new Color(0.86f, 0.89f, 0.93f) * 1.4f;
                gradSky.middle.overrideState = true;
                gradSky.middle.value = new Color(0.82f, 0.84f, 0.88f) * 1.1f;
                gradSky.bottom.overrideState = true;
                gradSky.bottom.value = new Color(0.75f, 0.77f, 0.81f) * 0.9f;
                gradSky.gradientDiffusion.overrideState = true;
                gradSky.gradientDiffusion.value = 1.0f;
                gradSky.exposure.overrideState = true;
                gradSky.exposure.value = 1.0f;
                gradSky.multiplier.overrideState = true;
                gradSky.multiplier.value = 1.2f;

                // 2. Studio Camera (Framing, HDRP settings, and Dither elimination)
                GameObject camObj = new GameObject("StudioCamera");
                camObj.transform.SetParent(studioRoot.transform);
                camera = camObj.AddComponent<Camera>();
                camera.cameraType = CameraType.Game;
                camera.clearFlags = CameraClearFlags.Color;
                camera.backgroundColor = new Color(0.82f, 0.84f, 0.87f);
                camera.cullingMask = -1 & ~(1 << StudioPanelLayer);
                camera.fieldOfView = 28f;
                camera.nearClipPlane = 0.1f;
                camera.farClipPlane = 1000f;

                var hdCam = camObj.AddComponent<HDAdditionalCameraData>();
                hdCam.clearColorMode = HDAdditionalCameraData.ClearColorMode.Color;
                hdCam.backgroundColorHDR = new Color(0.82f, 0.84f, 0.87f);
                hdCam.antialiasing = HDAdditionalCameraData.AntialiasingMode.SubpixelMorphologicalAntiAliasing;
                hdCam.SMAAQuality = HDAdditionalCameraData.SMAAQualityLevel.High;
                hdCam.volumeLayerMask = -1;
                hdCam.probeLayerMask = -1;

                // Custom FrameSettings: Disable dithering, screen space shadow dithering, and noisy SSAO
                hdCam.customRenderingSettings = true;
                hdCam.renderingPathCustomFrameSettings.SetEnabled(FrameSettingsField.Dithering, false);
                hdCam.renderingPathCustomFrameSettings.SetEnabled(FrameSettingsField.ScreenSpaceShadows, false);
                hdCam.renderingPathCustomFrameSettings.SetEnabled(FrameSettingsField.ContactShadows, false);
                hdCam.renderingPathCustomFrameSettings.SetEnabled(FrameSettingsField.SSAO, false);
                hdCam.renderingPathCustomFrameSettings.SetEnabled(FrameSettingsField.LightLayers, true);

                var frameMask = hdCam.renderingPathCustomFrameSettingsOverrideMask;
                frameMask.mask[(uint)FrameSettingsField.Dithering] = true;
                frameMask.mask[(uint)FrameSettingsField.ScreenSpaceShadows] = true;
                frameMask.mask[(uint)FrameSettingsField.ContactShadows] = true;
                frameMask.mask[(uint)FrameSettingsField.SSAO] = true;
                frameMask.mask[(uint)FrameSettingsField.LightLayers] = true;
                hdCam.renderingPathCustomFrameSettingsOverrideMask = frameMask;

                // 3. RenderTexture with 2x SSAA Super-Sampling (2048x2048 render -> 1024x1024 output)
                int targetResolution = 1024;
                int renderResolution = 2048;
                renderTexture = new RenderTexture(renderResolution, renderResolution, 24, RenderTextureFormat.ARGB32);
                renderTexture.filterMode = FilterMode.Bilinear;
                renderTexture.antiAliasing = 1;
                renderTexture.Create();

                // Cache available vehicle colors
                var colorCache = new Dictionary<string, VehicleColor>(StringComparer.OrdinalIgnoreCase);
                if (GlobalReferences.Instance?.vehicleColors != null)
                {
                    foreach (var vc in GlobalReferences.Instance.vehicleColors)
                    {
                        if (vc != null && !string.IsNullOrEmpty(vc.name))
                        {
                            colorCache[vc.name] = vc;
                        }
                    }
                }

                // Get all vehicle types
                var vNames = VehicleTypeHelper.GetVehicleTypeNames() ?? new List<string>();
                log?.Invoke($"Found {vNames.Count} vehicle types to render in studio.");

                foreach (var vName in vNames)
                {
                    string id = vName.GetIdWithoutType();
                    if (string.IsNullOrEmpty(id))
                    {
                        id = vName;
                    }

                    log?.Invoke($"Starting vehicle [{renderedCount + 1}/{vNames.Count}]: {id}...");

                    try
                    {
                        // Try loading high-poly Showcase prefab first, then fallback to PlayerVehicles
                        GameObject prefab = null;
                        string loadedPrefabName = null;

                        if (ShowcasePrefabNames.TryGetValue(id, out string showcaseName))
                        {
                            prefab = PrefabHelper.LoadPrefabAssetByName(showcaseName);
                            if (prefab != null) loadedPrefabName = showcaseName;
                        }

                        if (prefab == null)
                        {
                            prefab = PrefabHelper.LoadPrefabAssetByName(id + "Showcase");
                            if (prefab != null) loadedPrefabName = id + "Showcase";
                        }

                        if (prefab == null)
                        {
                            prefab = PrefabHelper.LoadPrefabAssetByName("Vehicles/PlayerVehicles/" + id);
                            if (prefab != null) loadedPrefabName = "Vehicles/PlayerVehicles/" + id;
                        }

                        if (prefab == null)
                        {
                            prefab = PrefabHelper.LoadPrefabAssetByName("Vehicles/" + id);
                            if (prefab != null) loadedPrefabName = "Vehicles/" + id;
                        }

                        if (prefab == null)
                        {
                            prefab = PrefabHelper.LoadPrefabAssetByName(id);
                            if (prefab != null) loadedPrefabName = id;
                        }

                        if (prefab == null)
                        {
                            log?.Invoke($"Warning: Could not load prefab for vehicle '{vName}' (id: '{id}'). Skipping.");
                            continue;
                        }

                        log?.Invoke($"Loaded prefab '{loadedPrefabName}' for vehicle '{id}'.");

                        // Instantiate at studio position
                        GameObject vehicleObj = UnityEngine.Object.Instantiate(prefab, StudioPosition, Quaternion.identity);
                        vehicleObj.name = "RenderVehicle_" + id;

                        // Hide price tag, sale sign, canvas, interaction UI, or store stickers that may be on showcase prefabs
                        foreach (var child in vehicleObj.GetComponentsInChildren<Transform>(true))
                        {
                            if (child == vehicleObj.transform) continue;
                            string cName = child.name;
                            if (cName.IndexOf("Price", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                cName.IndexOf("Sale", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                cName.IndexOf("Tag", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                cName.IndexOf("Sign", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                cName.IndexOf("Sticker", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                cName.IndexOf("Canvas", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                cName.IndexOf("Billboard", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                cName.IndexOf("Prompt", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                cName.IndexOf("Interact", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                cName.IndexOf("Buy", StringComparison.OrdinalIgnoreCase) >= 0)
                            {
                                child.gameObject.SetActive(false);
                            }
                        }

                        // Disable physics and sound
                        var rb = vehicleObj.GetComponent<Rigidbody>();
                        if (rb != null)
                        {
                            rb.isKinematic = true;
                            rb.useGravity = false;
                        }

                        var audioSources = vehicleObj.GetComponentsInChildren<AudioSource>(true);
                        foreach (var audio in audioSources)
                        {
                            if (audio != null)
                            {
                                audio.Stop();
                                audio.enabled = false;
                            }
                        }

                        // Disable any prefab lights (spotlights, flares)
                        var vehicleLights = vehicleObj.GetComponentsInChildren<Light>(true);
                        foreach (var l in vehicleLights)
                        {
                            if (l != null) l.enabled = false;
                        }

                        // Disable physics colliders
                        var colliders = vehicleObj.GetComponentsInChildren<Collider>(true);
                        foreach (var c in colliders)
                        {
                            if (c != null) c.enabled = false;
                        }

                        // Strictly force highest LOD (LOD 0) and disable all lower LOD renderers
                        var lodGroups = vehicleObj.GetComponentsInChildren<LODGroup>(true);
                        foreach (var lod in lodGroups)
                        {
                            if (lod == null) continue;
                            lod.fadeMode = LODFadeMode.None;
                            lod.ForceLOD(0);
                            var lods = lod.GetLODs();
                            for (int i = 0; i < lods.Length; i++)
                            {
                                bool isLOD0 = (i == 0);
                                if (lods[i].renderers != null)
                                {
                                    foreach (var r in lods[i].renderers)
                                    {
                                        if (r != null) r.enabled = isLOD0;
                                    }
                                }
                            }
                            UnityEngine.Object.DestroyImmediate(lod);
                        }

                        // Disable collider proxy meshes, bounding boxes, and loose lower-LOD meshes
                        var allRenderers = vehicleObj.GetComponentsInChildren<Renderer>(true);
                        foreach (var r in allRenderers)
                        {
                            if (r == null) continue;
                            string goName = r.gameObject.name;
                            string parentName = r.transform.parent != null ? r.transform.parent.name : "";

                            if (r is ParticleSystemRenderer || r is TrailRenderer)
                            {
                                r.enabled = false;
                                continue;
                            }

                            if (goName.IndexOf("Collider", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                parentName.IndexOf("Collider", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                goName.IndexOf("Trigger", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                goName.IndexOf("Proxy", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                goName.IndexOf("BBox", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                goName.IndexOf("Bounds", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                goName.IndexOf("Shadow Caster", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                goName.IndexOf("ShadowCaster", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                goName.IndexOf("GroundIndicator", StringComparison.OrdinalIgnoreCase) >= 0)
                            {
                                r.enabled = false;
                                continue;
                            }

                            if ((goName.IndexOf("_lod1", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                 goName.IndexOf("_lod2", StringComparison.OrdinalIgnoreCase) >= 0 ||
                                 goName.IndexOf("_lod3", StringComparison.OrdinalIgnoreCase) >= 0) &&
                                goName.IndexOf("lod0", StringComparison.OrdinalIgnoreCase) < 0)
                            {
                                r.enabled = false;
                                continue;
                            }

                            r.shadowCastingMode = ShadowCastingMode.On;
                            r.receiveShadows = true;
                            r.renderingLayerMask = (uint)(LightLayerEnum.LightLayerDefault | LightLayerEnum.LightLayer1);
                        }

                        // Set global vehicle shader lighting and fresnel parameters
                        Shader.SetGlobalFloat("TimeOfDay", 12.0f);
                        Shader.SetGlobalFloat("_AmountOfLightsOn", 0.0f);
                        Shader.SetGlobalFloat("_ExtraFresnelPower", 3.0f);
                        Shader.SetGlobalColor("_ExtraFresnelColor", new Color(1.5f, 1.6f, 1.9f, 1.0f));

                        // Illuminate headlights and enhance glass reflection smoothness
                        foreach (var r in vehicleObj.GetComponentsInChildren<Renderer>(true))
                        {
                            if (r == null || !r.enabled) continue;
                            string rName = r.gameObject.name.ToLower();

                            foreach (var mat in r.materials)
                            {
                                if (mat == null) continue;
                                string matName = mat.name.ToLower();

                                if (mat.HasProperty("_FrontLightStrength"))
                                {
                                    mat.SetFloat("_FrontLightStrength", 0.45f);
                                    if (mat.HasProperty("_EmissionColor"))
                                    {
                                        mat.SetColor("_EmissionColor", new Color(0.85f, 0.88f, 0.95f, 1.0f));
                                    }
                                }

                                if (rName.Contains("glass") || rName.Contains("window") || rName.Contains("windshield") ||
                                    matName.Contains("glass") || matName.Contains("window") || matName.Contains("windshield"))
                                {
                                    if (mat.HasProperty("_Smoothness"))
                                    {
                                        mat.SetFloat("_Smoothness", 0.96f);
                                    }
                                    if (mat.HasProperty("_Metallic"))
                                    {
                                        mat.SetFloat("_Metallic", 0.05f);
                                    }
                                }
                            }
                        }

                        // Smooth vertex normals across curved body panels to eliminate faceted polygon lines
                        SmoothMeshNormals(vehicleObj);

                        string targetColorName = defaultColorName;
                        if (CanonicalColors.TryGetValue(id, out string canonColor))
                        {
                            targetColorName = canonColor;
                        }

                        VehicleColor chosenColor = null;
                        if (!colorCache.TryGetValue(targetColorName, out chosenColor))
                        {
                            colorCache.TryGetValue("Red", out chosenColor);
                        }

                        // Apply color via ShowcaseVehicleController if present
                        var showcaseCtrl = vehicleObj.GetComponent<ShowcaseVehicleController>();
                        if (showcaseCtrl != null)
                        {
                            try
                            {
                                showcaseCtrl.SetColor(targetColorName);
                                showcaseCtrl.enabled = false;
                            }
                            catch (Exception ex)
                            {
                                log?.Invoke($"ShowcaseVehicleController SetColor notice: {ex.Message}");
                            }
                        }

                        // Apply paint color and clean showroom finish via CarFeatures
                        var carFeatures = vehicleObj.GetComponentInChildren<CarFeatures>(true);
                        if (carFeatures != null)
                        {
                            if (carFeatures.driverRenderer != null)
                            {
                                carFeatures.driverRenderer.enabled = false;
                            }
                            carFeatures.SetDirtiness(0f);

                            if (chosenColor != null)
                            {
                                carFeatures.SetColor(chosenColor);
                            }
                        }

                        // Compute bounds across all active Renderers
                        Bounds bounds = new Bounds(vehicleObj.transform.position, Vector3.zero);
                        bool hasBounds = false;
                        var activeRenderers = vehicleObj.GetComponentsInChildren<Renderer>(true);
                        foreach (var r in activeRenderers)
                        {
                            if (r == null || !r.enabled) continue;
                            if (r is ParticleSystemRenderer || r is TrailRenderer) continue;

                            if (!hasBounds)
                            {
                                bounds = r.bounds;
                                hasBounds = true;
                            }
                            else
                            {
                                bounds.Encapsulate(r.bounds);
                            }
                        }

                        if (!hasBounds)
                        {
                            bounds = new Bounds(vehicleObj.transform.position, new Vector3(2f, 1.5f, 4.5f));
                        }

                        // Position camera at showroom 3/4 perspective
                        Vector3 viewDir = (vehicleObj.transform.forward * 1.35f - vehicleObj.transform.right * 0.85f + Vector3.up * 0.45f).normalized;

                        float radius = bounds.extents.magnitude;
                        float fovRad = camera.fieldOfView * Mathf.Deg2Rad;
                        float distance = (radius / Mathf.Sin(fovRad * 0.5f)) * 0.95f;

                        camObj.transform.position = bounds.center + viewDir * distance;
                        camObj.transform.LookAt(bounds.center + Vector3.up * (bounds.extents.y * 0.05f));

                        // Build physical 3D showroom studio around vehicle
                        float groundY = bounds.min.y;
                        Vector3 floorOrigin = new Vector3(bounds.center.x, groundY - 0.005f, bounds.center.z);

                        Vector3 forward = new Vector3(bounds.center.x - camObj.transform.position.x, 0f, bounds.center.z - camObj.transform.position.z).normalized;
                        Vector3 right = Vector3.Cross(Vector3.up, forward).normalized;

                        GameObject showroom = new GameObject("PhysicalShowroom");
                        showroom.transform.SetParent(studioRoot.transform);
                        showroom.transform.position = floorOrigin;

                        // A. Curved light-grey/white studio floor and backdrop (cyclorama wall)
                        GameObject cycObj = new GameObject("Cyclorama");
                        cycObj.transform.SetParent(showroom.transform);
                        cycObj.transform.localPosition = Vector3.zero;
                        var cycFilter = cycObj.AddComponent<MeshFilter>();
                        var cycRenderer = cycObj.AddComponent<MeshRenderer>();
                        cycFilter.sharedMesh = GenerateCycloramaMesh(bounds);

                        Material cycMat = new Material(Shader.Find("HDRP/Lit"));
                        cycMat.name = "ShowroomCycloramaMaterial";
                        Color studioColor = new Color(0.80f, 0.82f, 0.85f, 1.0f);
                        cycMat.SetColor("_BaseColor", studioColor);
                        cycMat.color = studioColor;
                        cycMat.SetFloat("_Metallic", 0.0f);
                        cycMat.SetFloat("_Smoothness", 0.10f);
                        cycRenderer.sharedMaterial = cycMat;
                        cycRenderer.receiveShadows = true;
                        cycRenderer.shadowCastingMode = ShadowCastingMode.Off;
                        cycRenderer.renderingLayerMask = (uint)LightLayerEnum.LightLayerDefault;

                        // B. Softbox Light Panel Material (Emissive white)
                        Material panelMat = new Material(Shader.Find("HDRP/Lit"));
                        panelMat.name = "SoftboxLightPanelMaterial";
                        panelMat.SetColor("_BaseColor", Color.white);
                        if (panelMat.HasProperty("_EmissiveColor")) panelMat.SetColor("_EmissiveColor", new Color(15f, 15f, 15f, 1f));
                        if (panelMat.HasProperty("_EmissiveIntensity")) panelMat.SetFloat("_EmissiveIntensity", 15f);
                        if (panelMat.HasProperty("_EmissionColor")) panelMat.SetColor("_EmissionColor", new Color(15f, 15f, 15f, 1f));
                        panelMat.EnableKeyword("_EMISSION");
                        panelMat.globalIlluminationFlags = MaterialGlobalIlluminationFlags.RealtimeEmissive;

                        // Overhead Main Softbox Panel
                        GameObject mainPanel = GameObject.CreatePrimitive(PrimitiveType.Cube);
                        mainPanel.name = "MainOverheadSoftbox";
                        mainPanel.transform.SetParent(showroom.transform);
                        mainPanel.layer = StudioPanelLayer;
                        UnityEngine.Object.DestroyImmediate(mainPanel.GetComponent<Collider>());
                        float panelWidth = Mathf.Max(bounds.size.x * 2.2f, 4.5f);
                        float panelLength = Mathf.Max(bounds.size.z * 1.5f, 7.5f);
                        mainPanel.transform.position = bounds.center + Vector3.up * (bounds.extents.y + 2.8f);
                        mainPanel.transform.rotation = Quaternion.LookRotation(forward, Vector3.up);
                        mainPanel.transform.localScale = new Vector3(panelWidth, 0.05f, panelLength);
                        var mrMain = mainPanel.GetComponent<MeshRenderer>();
                        mrMain.sharedMaterial = panelMat;
                        mrMain.shadowCastingMode = ShadowCastingMode.Off;

                        // Front Angled Softbox (Reflects across windshield and hood)
                        GameObject frontPanel = GameObject.CreatePrimitive(PrimitiveType.Cube);
                        frontPanel.name = "FrontAngledSoftbox";
                        frontPanel.transform.SetParent(showroom.transform);
                        frontPanel.layer = StudioPanelLayer;
                        UnityEngine.Object.DestroyImmediate(frontPanel.GetComponent<Collider>());
                        frontPanel.transform.position = bounds.center + forward * (bounds.extents.z + 3.2f) + Vector3.up * (bounds.extents.y + 2.8f);
                        frontPanel.transform.rotation = Quaternion.LookRotation(-forward, Vector3.up) * Quaternion.Euler(38f, 0f, 0f);
                        frontPanel.transform.localScale = new Vector3(Mathf.Max(bounds.size.x * 2.0f, 4.0f), 0.05f, 2.5f);
                        var mrFront = frontPanel.GetComponent<MeshRenderer>();
                        mrFront.sharedMaterial = panelMat;
                        mrFront.shadowCastingMode = ShadowCastingMode.Off;

                        // Left Flank Strip Softbox
                        GameObject leftPanel = GameObject.CreatePrimitive(PrimitiveType.Cube);
                        leftPanel.name = "LeftStripSoftbox";
                        leftPanel.transform.SetParent(showroom.transform);
                        leftPanel.layer = StudioPanelLayer;
                        UnityEngine.Object.DestroyImmediate(leftPanel.GetComponent<Collider>());
                        leftPanel.transform.position = bounds.center - right * (bounds.extents.x + 2.6f) + Vector3.up * (bounds.extents.y + 1.4f);
                        leftPanel.transform.rotation = Quaternion.LookRotation(forward, Vector3.up) * Quaternion.Euler(0f, 0f, 35f);
                        leftPanel.transform.localScale = new Vector3(0.05f, 1.3f, Mathf.Max(bounds.size.z * 1.4f, 7.0f));
                        var mrLeft = leftPanel.GetComponent<MeshRenderer>();
                        mrLeft.sharedMaterial = panelMat;
                        mrLeft.shadowCastingMode = ShadowCastingMode.Off;

                        // Right Flank Strip Softbox
                        GameObject rightPanel = GameObject.CreatePrimitive(PrimitiveType.Cube);
                        rightPanel.name = "RightStripSoftbox";
                        rightPanel.transform.SetParent(showroom.transform);
                        rightPanel.layer = StudioPanelLayer;
                        UnityEngine.Object.DestroyImmediate(rightPanel.GetComponent<Collider>());
                        rightPanel.transform.position = bounds.center + right * (bounds.extents.x + 2.6f) + Vector3.up * (bounds.extents.y + 1.4f);
                        rightPanel.transform.rotation = Quaternion.LookRotation(forward, Vector3.up) * Quaternion.Euler(0f, 0f, -35f);
                        rightPanel.transform.localScale = new Vector3(0.05f, 1.3f, Mathf.Max(bounds.size.z * 1.4f, 7.0f));
                        var mrRight = rightPanel.GetComponent<MeshRenderer>();
                        mrRight.sharedMaterial = panelMat;
                        mrRight.shadowCastingMode = ShadowCastingMode.Off;

                        // C. Studio Lights
                        // 1. Overhead Down Light (Produces deep, soft contact shadows onto floor)
                        GameObject overheadLightObj = new GameObject("OverheadDownLight");
                        overheadLightObj.transform.SetParent(showroom.transform);
                        overheadLightObj.transform.position = bounds.center + Vector3.up * 8.0f;
                        overheadLightObj.transform.rotation = Quaternion.Euler(68f, 30f, 0f);
                        Light overheadLight = overheadLightObj.AddComponent<Light>();
                        overheadLight.type = LightType.Directional;
                        overheadLight.color = new Color(1.0f, 0.99f, 0.98f);
                        overheadLight.shadows = LightShadows.Soft;
                        var hdOverhead = overheadLightObj.AddComponent<HDAdditionalLightData>();
                        hdOverhead.intensity = 15000f;
                        hdOverhead.normalBias = 0.5f;
                        hdOverhead.slopeBias = 0.5f;
                        hdOverhead.EnableShadows(true);
                        hdOverhead.SetShadowResolutionOverride(true);
                        hdOverhead.SetShadowResolution(4096);
                        hdOverhead.SetShadowDimmer(0.94f);
                        hdOverhead.SetPCSSParams(blockerSampleCount: 32, filterSampleCount: 64, minFilterSize: 0.003f, radiusScaleForSoftness: 0.4f);
                        hdOverhead.lightlayersMask = LightLayerEnum.LightLayerDefault | LightLayerEnum.LightLayer1;

                        // 2. Key Light (Front-Left, illuminating front grille, hood, and driver side)
                        GameObject keyLightObj = new GameObject("StudioKeyLight");
                        keyLightObj.transform.SetParent(showroom.transform);
                        keyLightObj.transform.position = bounds.center + viewDir * 5f + Vector3.up * 3f;
                        keyLightObj.transform.rotation = Quaternion.Euler(22f, 138f, 0f);
                        Light keyLight = keyLightObj.AddComponent<Light>();
                        keyLight.type = LightType.Directional;
                        keyLight.color = new Color(1.0f, 0.98f, 0.95f);
                        keyLight.shadows = LightShadows.None;
                        var hdKeyLight = keyLightObj.AddComponent<HDAdditionalLightData>();
                        hdKeyLight.intensity = 11000f;
                        hdKeyLight.EnableShadows(false);
                        hdKeyLight.lightlayersMask = LightLayerEnum.LightLayer1;

                        // 3. Fill Light (Front-Right, softening shadows without secondary floor shadow)
                        GameObject fillLightObj = new GameObject("StudioFillLight");
                        fillLightObj.transform.SetParent(showroom.transform);
                        fillLightObj.transform.rotation = Quaternion.Euler(18f, 65f, 0f);
                        Light fillLight = fillLightObj.AddComponent<Light>();
                        fillLight.type = LightType.Directional;
                        fillLight.color = new Color(0.93f, 0.96f, 1.0f);
                        fillLight.shadows = LightShadows.None;
                        var hdFillLight = fillLightObj.AddComponent<HDAdditionalLightData>();
                        hdFillLight.intensity = 3000f;
                        hdFillLight.EnableShadows(false);
                        hdFillLight.lightlayersMask = LightLayerEnum.LightLayer1;

                        // 4. Rim Light (Rear-Right, contour highlight)
                        GameObject rimLightObj = new GameObject("StudioRimLight");
                        rimLightObj.transform.SetParent(showroom.transform);
                        rimLightObj.transform.rotation = Quaternion.Euler(25f, -35f, 0f);
                        Light rimLight = rimLightObj.AddComponent<Light>();
                        rimLight.type = LightType.Directional;
                        rimLight.color = Color.white;
                        rimLight.shadows = LightShadows.None;
                        var hdRimLight = rimLightObj.AddComponent<HDAdditionalLightData>();
                        hdRimLight.intensity = 2500f;
                        hdRimLight.EnableShadows(false);
                        hdRimLight.lightlayersMask = LightLayerEnum.LightLayer1;

                        // 5. Bounce Light (Shooting upward into wheels, tires, and underbody)
                        GameObject bounceLightObj = new GameObject("StudioBounceLight");
                        bounceLightObj.transform.SetParent(showroom.transform);
                        bounceLightObj.transform.rotation = Quaternion.Euler(-35f, 138f, 0f);
                        Light bounceLight = bounceLightObj.AddComponent<Light>();
                        bounceLight.type = LightType.Directional;
                        bounceLight.color = new Color(0.90f, 0.93f, 0.98f);
                        bounceLight.shadows = LightShadows.None;
                        var hdBounceLight = bounceLightObj.AddComponent<HDAdditionalLightData>();
                        hdBounceLight.intensity = 900f;
                        hdBounceLight.EnableShadows(false);
                        hdBounceLight.lightlayersMask = LightLayerEnum.LightLayer1;

                        // D. Reflection Probe centered on car
                        GameObject probeObj = new GameObject("StudioReflectionProbe");
                        probeObj.transform.SetParent(showroom.transform);
                        probeObj.transform.position = bounds.center + Vector3.up * (bounds.extents.y * 0.5f);
                        var probe = probeObj.AddComponent<ReflectionProbe>();
                        probe.refreshMode = ReflectionProbeRefreshMode.EveryFrame;
                        Vector3 probeSize = bounds.size + new Vector3(40f, 30f, 40f);
                        probe.size = probeSize;
                        probe.importance = 100;

                        var hdProbe = probeObj.AddComponent<HDAdditionalReflectionData>();
                        hdProbe.influenceVolume.shape = InfluenceShape.Box;
                        hdProbe.influenceVolume.boxSize = probeSize;
                        hdProbe.multiplier = 1.8f;
                        hdProbe.weight = 1.0f;

                        if (skyTexture != null)
                        {
                            probe.mode = ReflectionProbeMode.Custom;
                            hdProbe.mode = ProbeSettings.Mode.Custom;
                            hdProbe.customTexture = skyTexture;
                            hdProbe.SetTexture(ProbeSettings.Mode.Custom, skyTexture);
                            probe.customBakedTexture = skyTexture;
                        }
                        else
                        {
                            probe.mode = ReflectionProbeMode.Realtime;
                            hdProbe.mode = ProbeSettings.Mode.Realtime;
                            try
                            {
                                probe.RenderProbe();
                            }
                            catch {}
                        }

                        // E. Beauty Render in Showroom Studio (2x SSAA Super-Sampling)
                        camera.targetTexture = renderTexture;
                        camera.Render();

                        RenderTexture downsampleRt = RenderTexture.GetTemporary(targetResolution, targetResolution, 0, RenderTextureFormat.ARGB32);
                        downsampleRt.filterMode = FilterMode.Bilinear;
                        Graphics.Blit(renderTexture, downsampleRt);

                        RenderTexture.active = downsampleRt;
                        Texture2D texFinal = new Texture2D(targetResolution, targetResolution, TextureFormat.RGB24, false);
                        texFinal.ReadPixels(new Rect(0, 0, targetResolution, targetResolution), 0, 0);
                        texFinal.Apply();

                        byte[] pngBytes = texFinal.EncodeToPNG();

                        UnityEngine.Object.DestroyImmediate(texFinal);
                        RenderTexture.ReleaseTemporary(downsampleRt);
                        camera.targetTexture = null;
                        RenderTexture.active = null;

                        // Save PNG to target directories
                        string outPath = Path.Combine(outputDir, id + ".png");
                        File.WriteAllBytes(outPath, pngBytes);

                        if (exportToWeb)
                        {
                            string webPath = Path.Combine(webVehiclesDir, id + ".png");
                            File.WriteAllBytes(webPath, pngBytes);
                        }

                        if (exportToRepo)
                        {
                            string repoPath = Path.Combine(repoRendersDir, id + ".png");
                            File.WriteAllBytes(repoPath, pngBytes);
                        }

                        renderedCount++;
                        log?.Invoke($"Rendered [{renderedCount}/{vNames.Count}]: {id}.png ({pngBytes.Length / 1024} KB)");

                        // Cleanup vehicle and showroom
                        UnityEngine.Object.DestroyImmediate(vehicleObj);
                        UnityEngine.Object.DestroyImmediate(showroom);
                    }
                    catch (Exception ex)
                    {
                        log?.Invoke($"Error rendering vehicle '{vName}': {ex.Message}");
                    }
                }

                log?.Invoke($"Vehicle studio rendering complete! Successfully rendered {renderedCount} vehicles.");
            }
            catch (Exception ex)
            {
                log?.Invoke($"Studio rendering error: {ex}");
            }
            finally
            {
                if (renderTexture != null)
                {
                    renderTexture.Release();
                    UnityEngine.Object.DestroyImmediate(renderTexture);
                }
                if (profile != null)
                {
                    UnityEngine.Object.DestroyImmediate(profile);
                }
                if (studioRoot != null)
                {
                    UnityEngine.Object.DestroyImmediate(studioRoot);
                }
            }

            return renderedCount;
        }

        public static int RenderVehicleTurntable(string vehicleId, string outputDir, int totalFrames = 36, string defaultColorName = "Red", Action<string> log = null, string colorKey = null, int targetResolution = 1024)
        {
            if (string.IsNullOrEmpty(vehicleId))
            {
                vehicleId = "anselmoaf90";
            }
            if (string.IsNullOrEmpty(outputDir))
            {
                log?.Invoke("VehicleStudioRenderer: Output directory is null or empty.");
                return 0;
            }

            // When a colorKey is supplied the frames live in a per-color subfolder
            // (<id>_360/<color>/) and that exact color is forced (no canonical swap).
            string turntableFolderName = vehicleId + "_360";
            string colorSegment = colorKey ?? string.Empty;
            string turntableOutputDir = Path.Combine(outputDir, turntableFolderName, colorSegment);
            Directory.CreateDirectory(turntableOutputDir);

            string webVehiclesDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                "Desktop", "BigAmbitionsTool", "web", "public", "images", "vehicles"
            );
            bool exportToWeb = Directory.Exists(Path.GetDirectoryName(webVehiclesDir));
            string webTurntableDir = null;
            if (exportToWeb)
            {
                webTurntableDir = Path.Combine(webVehiclesDir, turntableFolderName, colorSegment);
                Directory.CreateDirectory(webTurntableDir);
            }

            string repoRendersDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                "Desktop", "BigAmbitionsTool", "data", "raw", "vehicle_renders"
            );
            bool exportToRepo = Directory.Exists(Path.GetDirectoryName(repoRendersDir));
            string repoTurntableDir = null;
            if (exportToRepo)
            {
                repoTurntableDir = Path.Combine(repoRendersDir, turntableFolderName, colorSegment);
                Directory.CreateDirectory(repoTurntableDir);
            }

            GameObject studioRoot = null;
            Camera camera = null;
            RenderTexture renderTexture = null;
            Volume volume = null;
            VolumeProfile profile = null;
            int renderedFrames = 0;

            try
            {
                log?.Invoke($"Setting up off-screen turntable studio for '{vehicleId}' ({totalFrames} frames) at {StudioPosition}...");
                studioRoot = new GameObject("VehicleStudioRoot");
                studioRoot.transform.position = StudioPosition;

                // 1. Studio Post-Process Volume (Exposure & Tonemapping calibration)
                GameObject volumeObj = new GameObject("StudioVolume");
                volumeObj.transform.SetParent(studioRoot.transform);
                volume = volumeObj.AddComponent<Volume>();
                volume.isGlobal = true;
                volume.priority = 1000f;

                profile = ScriptableObject.CreateInstance<VolumeProfile>();
                volume.profile = profile;

                var exposure = profile.Add<Exposure>(true);
                exposure.mode.overrideState = true;
                exposure.mode.value = ExposureMode.Fixed;
                exposure.fixedExposure.overrideState = true;
                exposure.fixedExposure.value = 10.4f;

                var bloom = profile.Add<Bloom>(true);
                bloom.intensity.overrideState = true;
                bloom.intensity.value = 0.08f;
                bloom.threshold.overrideState = true;
                bloom.threshold.value = 1.0f;

                var tonemapping = profile.Add<Tonemapping>(true);
                tonemapping.mode.overrideState = true;
                tonemapping.mode.value = TonemappingMode.ACES;

                var whiteBalance = profile.Add<WhiteBalance>(true);
                whiteBalance.temperature.overrideState = true;
                whiteBalance.temperature.value = 0f;
                whiteBalance.tint.overrideState = true;
                whiteBalance.tint.value = 0f;

                var ssr = profile.Add<ScreenSpaceReflection>(true);
                ssr.enabled.overrideState = true;
                ssr.enabled.value = false;

                var shadowSettings = profile.Add<HDShadowSettings>(true);
                shadowSettings.maxShadowDistance.overrideState = true;
                shadowSettings.maxShadowDistance.value = 60f;

                var ao = profile.Add<ScreenSpaceAmbientOcclusion>(true);
                ao.intensity.overrideState = true;
                ao.intensity.value = 0.0f;

                var visualEnv = profile.Add<VisualEnvironment>(true);
                visualEnv.skyAmbientMode.overrideState = true;
                visualEnv.skyAmbientMode.value = SkyAmbientMode.Dynamic;

                Texture skyTexture = FindSkyTexture(log);

                // 2. Camera Setup (HDRP High Quality)
                GameObject camObj = new GameObject("VehicleStudioCamera");
                camObj.transform.SetParent(studioRoot.transform);
                camera = camObj.AddComponent<Camera>();
                camera.cameraType = CameraType.Game;
                camera.clearFlags = CameraClearFlags.Color;
                camera.backgroundColor = new Color(0.82f, 0.84f, 0.87f);
                camera.cullingMask = -1 & ~(1 << StudioPanelLayer);
                camera.fieldOfView = 28f;
                camera.nearClipPlane = 0.1f;
                camera.farClipPlane = 1000f;

                var hdCam = camObj.AddComponent<HDAdditionalCameraData>();
                hdCam.clearColorMode = HDAdditionalCameraData.ClearColorMode.Color;
                hdCam.backgroundColorHDR = new Color(0.82f, 0.84f, 0.87f);
                hdCam.antialiasing = HDAdditionalCameraData.AntialiasingMode.SubpixelMorphologicalAntiAliasing;
                hdCam.SMAAQuality = HDAdditionalCameraData.SMAAQualityLevel.High;
                hdCam.volumeLayerMask = -1;
                hdCam.probeLayerMask = -1;

                hdCam.customRenderingSettings = true;
                hdCam.renderingPathCustomFrameSettings.SetEnabled(FrameSettingsField.Dithering, false);
                hdCam.renderingPathCustomFrameSettings.SetEnabled(FrameSettingsField.ScreenSpaceShadows, false);
                hdCam.renderingPathCustomFrameSettings.SetEnabled(FrameSettingsField.ContactShadows, false);
                hdCam.renderingPathCustomFrameSettings.SetEnabled(FrameSettingsField.SSAO, false);
                hdCam.renderingPathCustomFrameSettings.SetEnabled(FrameSettingsField.LightLayers, true);

                var frameMask = hdCam.renderingPathCustomFrameSettingsOverrideMask;
                frameMask.mask[(uint)FrameSettingsField.Dithering] = true;
                frameMask.mask[(uint)FrameSettingsField.ScreenSpaceShadows] = true;
                frameMask.mask[(uint)FrameSettingsField.ContactShadows] = true;
                frameMask.mask[(uint)FrameSettingsField.SSAO] = true;
                frameMask.mask[(uint)FrameSettingsField.LightLayers] = true;
                hdCam.renderingPathCustomFrameSettingsOverrideMask = frameMask;

                // 3. RenderTexture with 2x SSAA Super-Sampling
                int renderResolution = targetResolution * 2;
                renderTexture = new RenderTexture(renderResolution, renderResolution, 24, RenderTextureFormat.ARGB32);
                renderTexture.filterMode = FilterMode.Bilinear;
                renderTexture.antiAliasing = 1;
                renderTexture.Create();

                // 4. Load vehicle or boat model
                bool isBoat = false;
                string loadedModelName = null;
                GameObject prefab = FindVehicleOrBoatPrefab(vehicleId, log, out isBoat, out loadedModelName);

                if (prefab == null)
                {
                    log?.Invoke($"Warning: Could not load model for '{vehicleId}'. Cannot render turntable.");
                    return 0;
                }

                log?.Invoke($"Loaded model '{loadedModelName}' for turntable '{vehicleId}' (isBoat: {isBoat}).");

                // Instantiate at studio position
                GameObject vehicleObj = UnityEngine.Object.Instantiate(prefab, StudioPosition, Quaternion.identity);
                vehicleObj.name = (isBoat ? "TurntableBoat_" : "TurntableVehicle_") + vehicleId;
                vehicleObj.SetActive(true);

                if (isBoat)
                {
                    var boatBehaviors = vehicleObj.GetComponentsInChildren<MonoBehaviour>(true);
                    foreach (var mb in boatBehaviors)
                    {
                        if (mb == null) continue;
                        mb.enabled = false;
                    }
                }

                // Hide stickers, price tags, UI
                foreach (var child in vehicleObj.GetComponentsInChildren<Transform>(true))
                {
                    if (child == vehicleObj.transform) continue;
                    string cName = child.name;

                    if (Vector3.Distance(child.position, StudioPosition) > 80f)
                    {
                        log?.Invoke($"Disabling distant child transform '{child.name}' at {child.position}");
                        child.gameObject.SetActive(false);
                        continue;
                    }

                    if (cName.IndexOf("Price", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("Sale", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("Tag", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("Sign", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("Sticker", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("Canvas", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("Billboard", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("Prompt", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("Interact", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("Buy", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("POI", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("PointOfInterest", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("Icon", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("Marker", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("Guider", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("Sleep", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("Waypoint", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("Driver", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("Player", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("Character", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("Avatar", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("CityMap", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("MiniMap", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("Map", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("Terrain", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("Sky", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        cName.IndexOf("World", StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        child.gameObject.SetActive(false);
                    }
                }

                // Disable physics & audio
                var rbs = vehicleObj.GetComponentsInChildren<Rigidbody>(true);
                foreach (var rb in rbs)
                {
                    if (rb != null)
                    {
                        rb.isKinematic = true;
                        rb.useGravity = false;
                    }
                }

                var audioSources = vehicleObj.GetComponentsInChildren<AudioSource>(true);
                foreach (var audio in audioSources)
                {
                    if (audio != null)
                    {
                        audio.Stop();
                        audio.enabled = false;
                    }
                }

                var vehicleLights = vehicleObj.GetComponentsInChildren<Light>(true);
                foreach (var l in vehicleLights)
                {
                    if (l != null) l.enabled = false;
                }

                var colliders = vehicleObj.GetComponentsInChildren<Collider>(true);
                foreach (var c in colliders)
                {
                    if (c != null) c.enabled = false;
                }

                // Force LOD 0
                var lodGroups = vehicleObj.GetComponentsInChildren<LODGroup>(true);
                foreach (var lod in lodGroups)
                {
                    if (lod == null) continue;
                    lod.fadeMode = LODFadeMode.None;
                    lod.ForceLOD(0);
                    var lods = lod.GetLODs();
                    for (int i = 0; i < lods.Length; i++)
                    {
                        bool isLOD0 = (i == 0);
                        if (lods[i].renderers != null)
                        {
                            foreach (var r in lods[i].renderers)
                            {
                                if (r != null)
                                {
                                    r.enabled = isLOD0;
                                    if (isLOD0) r.gameObject.SetActive(true);
                                }
                            }
                        }
                    }
                    UnityEngine.Object.DestroyImmediate(lod);
                }

                var allRenderers = vehicleObj.GetComponentsInChildren<Renderer>(true);
                foreach (var r in allRenderers)
                {
                    if (r == null) continue;
                    string goName = r.gameObject.name;
                    string parentName = r.transform.parent != null ? r.transform.parent.name : "";

                    if (r is ParticleSystemRenderer || r is TrailRenderer)
                    {
                        r.enabled = false;
                        continue;
                    }

                    if (goName.IndexOf("Collider", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        parentName.IndexOf("Collider", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        goName.IndexOf("Trigger", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        goName.IndexOf("Proxy", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        goName.IndexOf("BBox", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        goName.IndexOf("Bounds", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        goName.IndexOf("Shadow Caster", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        goName.IndexOf("ShadowCaster", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        goName.IndexOf("GroundIndicator", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        goName.IndexOf("Water", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        goName.IndexOf("Wake", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        goName.IndexOf("Splash", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        goName.IndexOf("Foam", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        goName.IndexOf("Wave", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        goName.IndexOf("Ripple", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        goName.IndexOf("Ocean", StringComparison.OrdinalIgnoreCase) >= 0 ||
                        goName.IndexOf("Buoy", StringComparison.OrdinalIgnoreCase) >= 0)
                    {
                        r.enabled = false;
                        continue;
                    }

                    if ((goName.IndexOf("_lod1", StringComparison.OrdinalIgnoreCase) >= 0 ||
                         goName.IndexOf("_lod2", StringComparison.OrdinalIgnoreCase) >= 0 ||
                         goName.IndexOf("_lod3", StringComparison.OrdinalIgnoreCase) >= 0) &&
                        goName.IndexOf("lod0", StringComparison.OrdinalIgnoreCase) < 0)
                    {
                        r.enabled = false;
                        continue;
                    }

                    r.shadowCastingMode = ShadowCastingMode.On;
                    r.receiveShadows = true;
                    r.renderingLayerMask = (uint)(LightLayerEnum.LightLayerDefault | LightLayerEnum.LightLayer1);
                }

                Shader.SetGlobalFloat("TimeOfDay", 12.0f);
                Shader.SetGlobalFloat("_AmountOfLightsOn", 0.0f);
                Shader.SetGlobalFloat("_ExtraFresnelPower", 3.0f);
                Shader.SetGlobalColor("_ExtraFresnelColor", new Color(1.5f, 1.6f, 1.9f, 1.0f));

                foreach (var r in vehicleObj.GetComponentsInChildren<Renderer>(true))
                {
                    if (r == null || !r.enabled) continue;
                    string rName = r.gameObject.name.ToLower();

                    foreach (var mat in r.materials)
                    {
                        if (mat == null) continue;
                        string matName = mat.name.ToLower();

                        if (mat.HasProperty("_FrontLightStrength"))
                        {
                            mat.SetFloat("_FrontLightStrength", 0.45f);
                            if (mat.HasProperty("_EmissionColor"))
                            {
                                mat.SetColor("_EmissionColor", new Color(0.85f, 0.88f, 0.95f, 1.0f));
                            }
                        }

                        if (rName.Contains("glass") || rName.Contains("window") || rName.Contains("windshield") ||
                            matName.Contains("glass") || matName.Contains("window") || matName.Contains("windshield"))
                        {
                            if (mat.HasProperty("_Smoothness")) mat.SetFloat("_Smoothness", 0.96f);
                            if (mat.HasProperty("_Metallic")) mat.SetFloat("_Metallic", 0.05f);
                        }
                    }
                }

                SmoothMeshNormals(vehicleObj);

                string targetColorName = defaultColorName;
                if (colorKey == null && CanonicalColors.TryGetValue(vehicleId, out string canonColor))
                {
                    targetColorName = canonColor;
                }

                if (isBoat)
                {
                    BoatColor chosenBoatColor = null;
                    if (GlobalReferences.Instance?.boatColors != null)
                    {
                        foreach (var bc in GlobalReferences.Instance.boatColors)
                        {
                            if (bc != null && string.Equals(bc.name, targetColorName, StringComparison.OrdinalIgnoreCase))
                            {
                                chosenBoatColor = bc;
                                break;
                            }
                        }
                    }

                    Color32 primColor = chosenBoatColor != null ? chosenBoatColor.primaryColor : new Color32(255, 255, 255, 255);
                    Color32 secColor = chosenBoatColor != null ? chosenBoatColor.secondaryColor : new Color32(171, 171, 171, 255);

                    var boatColorSetter = vehicleObj.GetComponentInChildren<BoatColorSetter>(true);
                    if (boatColorSetter != null && chosenBoatColor != null)
                    {
                        try { boatColorSetter.SetColor(chosenBoatColor); } catch {}
                    }

                    var mpb = new MaterialPropertyBlock();
                    int maskRed = Shader.PropertyToID("_MaskColorRed");
                    int maskGreen = Shader.PropertyToID("_MaskColorGreen");
                    foreach (var r in vehicleObj.GetComponentsInChildren<Renderer>(true))
                    {
                        if (r == null || !r.enabled) continue;
                        r.GetPropertyBlock(mpb);
                        mpb.SetColor(maskRed, primColor);
                        mpb.SetColor(maskGreen, secColor);
                        r.SetPropertyBlock(mpb);
                    }
                    log?.Invoke($"Applied boat color '{targetColorName}' to '{vehicleId}'.");
                }
                else
                {
                    VehicleColor chosenColor = null;
                    if (GlobalReferences.Instance?.vehicleColors != null)
                    {
                        foreach (var vc in GlobalReferences.Instance.vehicleColors)
                        {
                            if (vc != null && string.Equals(vc.name, targetColorName, StringComparison.OrdinalIgnoreCase))
                            {
                                chosenColor = vc;
                                break;
                            }
                        }
                    }

                    var showcaseCtrl = vehicleObj.GetComponent<ShowcaseVehicleController>();
                    if (showcaseCtrl != null)
                    {
                        try
                        {
                            showcaseCtrl.SetColor(targetColorName);
                            showcaseCtrl.enabled = false;
                        }
                        catch (Exception ex)
                        {
                            log?.Invoke($"ShowcaseVehicleController SetColor notice: {ex.Message}");
                        }
                    }

                    var carFeatures = vehicleObj.GetComponentInChildren<CarFeatures>(true);
                    if (carFeatures != null)
                    {
                        if (carFeatures.driverRenderer != null) carFeatures.driverRenderer.enabled = false;
                        carFeatures.SetDirtiness(0f);
                        if (chosenColor != null) carFeatures.SetColor(chosenColor);
                    }
                }

                // Compute bounding box
                Bounds bounds = new Bounds(vehicleObj.transform.position, Vector3.zero);
                bool hasBounds = false;
                var activeRenderers = vehicleObj.GetComponentsInChildren<Renderer>(true);
                foreach (var r in activeRenderers)
                {
                    if (r == null || !r.enabled) continue;
                    if (r is ParticleSystemRenderer || r is TrailRenderer) continue;

                    Bounds rBounds = r.bounds;
                    if (Vector3.Distance(rBounds.center, StudioPosition) > 65f)
                    {
                        var mf = r.GetComponent<MeshFilter>();
                        if (mf != null && mf.sharedMesh != null)
                        {
                            Vector3 worldCenter = r.transform.TransformPoint(mf.sharedMesh.bounds.center);
                            Vector3 worldSize = Vector3.Scale(mf.sharedMesh.bounds.size, r.transform.lossyScale);
                            rBounds = new Bounds(worldCenter, worldSize);
                        }
                    }

                    // Drop far-away scene geometry that leaked in as children (e.g. the
                    // casino yacht's wall flags). The vehicle's own root renderer is the
                    // LOD0 model and must never be dropped: large models such as the
                    // luxury yacht (about 77 units long) exceed the size threshold, and
                    // removing them left the frames empty.
                    bool isRootRenderer = r.transform == vehicleObj.transform;
                    if (Vector3.Distance(rBounds.center, StudioPosition) > 65f || (!isRootRenderer && rBounds.size.magnitude > 150f))
                    {
                        log?.Invoke($"Ignoring and disabling outlier renderer '{r.gameObject.name}' (center {rBounds.center}, size {rBounds.size})");
                        r.enabled = false;
                        continue;
                    }

                    if (!hasBounds)
                    {
                        bounds = rBounds;
                        hasBounds = true;
                    }
                    else
                    {
                        bounds.Encapsulate(rBounds);
                    }
                }
                log?.Invoke($"Studio object '{vehicleId}' calculated bounds: center {bounds.center}, extents {bounds.extents}, size {bounds.size}");

                if (!hasBounds)
                {
                    bounds = new Bounds(vehicleObj.transform.position, new Vector3(2f, 1.5f, 4.5f));
                }

                // Create Turntable Pivot centered on vehicle bounding box (X and Z at center, Y at ground contact min.y)
                GameObject turntablePivot = new GameObject("TurntablePivot");
                turntablePivot.transform.SetParent(studioRoot.transform);
                turntablePivot.transform.position = new Vector3(bounds.center.x, bounds.min.y, bounds.center.z);
                turntablePivot.transform.rotation = Quaternion.identity;
                vehicleObj.transform.SetParent(turntablePivot.transform, true);

                // Camera setup: framed with bounding sphere clearance so vehicle never clips at any rotation angle (1.05x safety factor)
                Vector3 viewDir = (vehicleObj.transform.forward * 1.35f - vehicleObj.transform.right * 0.85f + Vector3.up * 0.45f).normalized;
                float radius = bounds.extents.magnitude;
                float fovRad = camera.fieldOfView * Mathf.Deg2Rad;
                float distance = (radius / Mathf.Sin(fovRad * 0.5f)) * 1.05f;

                camera.farClipPlane = Mathf.Max(1000f, distance * 2.5f);

                camObj.transform.position = bounds.center + viewDir * distance;
                camObj.transform.LookAt(bounds.center + Vector3.up * (bounds.extents.y * 0.05f));

                // Physical 3D showroom studio
                float groundY = bounds.min.y;
                Vector3 floorOrigin = new Vector3(bounds.center.x, groundY - 0.005f, bounds.center.z);
                Vector3 forward = new Vector3(bounds.center.x - camObj.transform.position.x, 0f, bounds.center.z - camObj.transform.position.z).normalized;
                Vector3 right = Vector3.Cross(Vector3.up, forward).normalized;

                GameObject showroom = new GameObject("PhysicalShowroom");
                showroom.transform.SetParent(studioRoot.transform);
                showroom.transform.position = floorOrigin;

                // Cyclorama
                GameObject cycObj = new GameObject("Cyclorama");
                cycObj.transform.SetParent(showroom.transform);
                cycObj.transform.localPosition = Vector3.zero;
                var cycFilter = cycObj.AddComponent<MeshFilter>();
                var cycRenderer = cycObj.AddComponent<MeshRenderer>();
                cycFilter.sharedMesh = GenerateCycloramaMesh(bounds);

                Material cycMat = new Material(Shader.Find("HDRP/Lit"));
                cycMat.name = "ShowroomCycloramaMaterial";
                Color studioColor = new Color(0.80f, 0.82f, 0.85f, 1.0f);
                cycMat.SetColor("_BaseColor", studioColor);
                cycMat.color = studioColor;
                cycMat.SetFloat("_Metallic", 0.0f);
                cycMat.SetFloat("_Smoothness", 0.10f);
                cycRenderer.sharedMaterial = cycMat;
                cycRenderer.receiveShadows = true;
                cycRenderer.shadowCastingMode = ShadowCastingMode.Off;
                cycRenderer.renderingLayerMask = (uint)LightLayerEnum.LightLayerDefault;

                // Softbox Panels
                Material panelMat = new Material(Shader.Find("HDRP/Lit"));
                panelMat.name = "SoftboxLightPanelMaterial";
                panelMat.SetColor("_BaseColor", Color.white);
                if (panelMat.HasProperty("_EmissiveColor")) panelMat.SetColor("_EmissiveColor", new Color(15f, 15f, 15f, 1f));
                if (panelMat.HasProperty("_EmissiveIntensity")) panelMat.SetFloat("_EmissiveIntensity", 15f);
                if (panelMat.HasProperty("_EmissionColor")) panelMat.SetColor("_EmissionColor", new Color(15f, 15f, 15f, 1f));
                panelMat.EnableKeyword("_EMISSION");
                panelMat.globalIlluminationFlags = MaterialGlobalIlluminationFlags.RealtimeEmissive;

                // Main Overhead Panel
                GameObject mainPanel = GameObject.CreatePrimitive(PrimitiveType.Cube);
                mainPanel.name = "MainOverheadSoftbox";
                mainPanel.transform.SetParent(showroom.transform);
                mainPanel.layer = StudioPanelLayer;
                UnityEngine.Object.DestroyImmediate(mainPanel.GetComponent<Collider>());
                float panelWidth = Mathf.Max(bounds.size.x * 2.2f, 4.5f);
                float panelLength = Mathf.Max(bounds.size.z * 1.5f, 7.5f);
                mainPanel.transform.position = bounds.center + Vector3.up * (bounds.extents.y + Mathf.Max(2.8f, bounds.extents.y * 0.5f));
                mainPanel.transform.rotation = Quaternion.LookRotation(forward, Vector3.up);
                mainPanel.transform.localScale = new Vector3(panelWidth, 0.05f, panelLength);
                var mrMain = mainPanel.GetComponent<MeshRenderer>();
                mrMain.sharedMaterial = panelMat;
                mrMain.shadowCastingMode = ShadowCastingMode.Off;

                // Front Softbox
                GameObject frontPanel = GameObject.CreatePrimitive(PrimitiveType.Cube);
                frontPanel.name = "FrontAngledSoftbox";
                frontPanel.transform.SetParent(showroom.transform);
                frontPanel.layer = StudioPanelLayer;
                UnityEngine.Object.DestroyImmediate(frontPanel.GetComponent<Collider>());
                frontPanel.transform.position = bounds.center + forward * (bounds.extents.z + Mathf.Max(3.2f, bounds.extents.z * 0.4f)) + Vector3.up * (bounds.extents.y + Mathf.Max(2.8f, bounds.extents.y * 0.5f));
                frontPanel.transform.rotation = Quaternion.LookRotation(-forward, Vector3.up) * Quaternion.Euler(38f, 0f, 0f);
                frontPanel.transform.localScale = new Vector3(Mathf.Max(bounds.size.x * 2.0f, 4.0f), 0.05f, Mathf.Max(bounds.size.z * 0.35f, 2.5f));
                var mrFront = frontPanel.GetComponent<MeshRenderer>();
                mrFront.sharedMaterial = panelMat;
                mrFront.shadowCastingMode = ShadowCastingMode.Off;

                // Left Panel
                GameObject leftPanel = GameObject.CreatePrimitive(PrimitiveType.Cube);
                leftPanel.name = "LeftStripSoftbox";
                leftPanel.transform.SetParent(showroom.transform);
                leftPanel.layer = StudioPanelLayer;
                UnityEngine.Object.DestroyImmediate(leftPanel.GetComponent<Collider>());
                leftPanel.transform.position = bounds.center - right * (bounds.extents.x + Mathf.Max(2.6f, bounds.extents.x * 0.35f)) + Vector3.up * (bounds.extents.y + Mathf.Max(1.4f, bounds.extents.y * 0.25f));
                leftPanel.transform.rotation = Quaternion.LookRotation(forward, Vector3.up) * Quaternion.Euler(0f, 0f, 35f);
                leftPanel.transform.localScale = new Vector3(0.05f, Mathf.Max(bounds.size.y * 0.8f, 1.3f), Mathf.Max(bounds.size.z * 1.4f, 7.0f));
                var mrLeft = leftPanel.GetComponent<MeshRenderer>();
                mrLeft.sharedMaterial = panelMat;
                mrLeft.shadowCastingMode = ShadowCastingMode.Off;

                // Right Panel
                GameObject rightPanel = GameObject.CreatePrimitive(PrimitiveType.Cube);
                rightPanel.name = "RightStripSoftbox";
                rightPanel.transform.SetParent(showroom.transform);
                rightPanel.layer = StudioPanelLayer;
                UnityEngine.Object.DestroyImmediate(rightPanel.GetComponent<Collider>());
                rightPanel.transform.position = bounds.center + right * (bounds.extents.x + Mathf.Max(2.6f, bounds.extents.x * 0.35f)) + Vector3.up * (bounds.extents.y + Mathf.Max(1.4f, bounds.extents.y * 0.25f));
                rightPanel.transform.rotation = Quaternion.LookRotation(forward, Vector3.up) * Quaternion.Euler(0f, 0f, -35f);
                rightPanel.transform.localScale = new Vector3(0.05f, Mathf.Max(bounds.size.y * 0.8f, 1.3f), Mathf.Max(bounds.size.z * 1.4f, 7.0f));
                var mrRight = rightPanel.GetComponent<MeshRenderer>();
                mrRight.sharedMaterial = panelMat;
                mrRight.shadowCastingMode = ShadowCastingMode.Off;

                // Studio Lights
                // Overhead
                GameObject overheadLightObj = new GameObject("OverheadDownLight");
                overheadLightObj.transform.SetParent(showroom.transform);
                overheadLightObj.transform.position = bounds.center + Vector3.up * Mathf.Max(8.0f, bounds.extents.y * 2.5f);
                overheadLightObj.transform.rotation = Quaternion.Euler(68f, 30f, 0f);
                Light overheadLight = overheadLightObj.AddComponent<Light>();
                overheadLight.type = LightType.Directional;
                overheadLight.color = new Color(1.0f, 0.99f, 0.98f);
                overheadLight.shadows = LightShadows.Soft;
                var hdOverhead = overheadLightObj.AddComponent<HDAdditionalLightData>();
                hdOverhead.intensity = 15000f;
                hdOverhead.normalBias = 0.5f;
                hdOverhead.slopeBias = 0.5f;
                hdOverhead.EnableShadows(true);
                hdOverhead.SetShadowResolutionOverride(true);
                hdOverhead.SetShadowResolution(4096);
                hdOverhead.SetShadowDimmer(0.94f);
                hdOverhead.SetPCSSParams(blockerSampleCount: 32, filterSampleCount: 64, minFilterSize: 0.003f, radiusScaleForSoftness: 0.4f);
                hdOverhead.lightlayersMask = LightLayerEnum.LightLayerDefault | LightLayerEnum.LightLayer1;

                // Key Light
                GameObject keyLightObj = new GameObject("StudioKeyLight");
                keyLightObj.transform.SetParent(showroom.transform);
                keyLightObj.transform.position = bounds.center + viewDir * Mathf.Max(5f, radius * 0.8f) + Vector3.up * Mathf.Max(3f, bounds.extents.y * 1.2f);
                keyLightObj.transform.rotation = Quaternion.Euler(22f, 138f, 0f);
                Light keyLight = keyLightObj.AddComponent<Light>();
                keyLight.type = LightType.Directional;
                keyLight.color = new Color(1.0f, 0.98f, 0.95f);
                keyLight.shadows = LightShadows.None;
                var hdKeyLight = keyLightObj.AddComponent<HDAdditionalLightData>();
                hdKeyLight.intensity = 11000f;
                hdKeyLight.EnableShadows(false);
                hdKeyLight.lightlayersMask = LightLayerEnum.LightLayer1;

                // Fill Light
                GameObject fillLightObj = new GameObject("StudioFillLight");
                fillLightObj.transform.SetParent(showroom.transform);
                fillLightObj.transform.rotation = Quaternion.Euler(18f, 65f, 0f);
                Light fillLight = fillLightObj.AddComponent<Light>();
                fillLight.type = LightType.Directional;
                fillLight.color = new Color(0.93f, 0.96f, 1.0f);
                fillLight.shadows = LightShadows.None;
                var hdFillLight = fillLightObj.AddComponent<HDAdditionalLightData>();
                hdFillLight.intensity = 3000f;
                hdFillLight.EnableShadows(false);
                hdFillLight.lightlayersMask = LightLayerEnum.LightLayer1;

                // Rim Light
                GameObject rimLightObj = new GameObject("StudioRimLight");
                rimLightObj.transform.SetParent(showroom.transform);
                rimLightObj.transform.rotation = Quaternion.Euler(25f, -35f, 0f);
                Light rimLight = rimLightObj.AddComponent<Light>();
                rimLight.type = LightType.Directional;
                rimLight.color = Color.white;
                rimLight.shadows = LightShadows.None;
                var hdRimLight = rimLightObj.AddComponent<HDAdditionalLightData>();
                hdRimLight.intensity = 2500f;
                hdRimLight.EnableShadows(false);
                hdRimLight.lightlayersMask = LightLayerEnum.LightLayer1;

                // Bounce Light
                GameObject bounceLightObj = new GameObject("StudioBounceLight");
                bounceLightObj.transform.SetParent(showroom.transform);
                bounceLightObj.transform.rotation = Quaternion.Euler(-35f, 138f, 0f);
                Light bounceLight = bounceLightObj.AddComponent<Light>();
                bounceLight.type = LightType.Directional;
                bounceLight.color = new Color(0.90f, 0.93f, 0.98f);
                bounceLight.shadows = LightShadows.None;
                var hdBounceLight = bounceLightObj.AddComponent<HDAdditionalLightData>();
                hdBounceLight.intensity = 900f;
                hdBounceLight.EnableShadows(false);
                hdBounceLight.lightlayersMask = LightLayerEnum.LightLayer1;

                // Reflection Probe
                GameObject probeObj = new GameObject("StudioReflectionProbe");
                probeObj.transform.SetParent(showroom.transform);
                probeObj.transform.position = bounds.center + Vector3.up * (bounds.extents.y * 0.5f);
                var probe = probeObj.AddComponent<ReflectionProbe>();
                probe.refreshMode = ReflectionProbeRefreshMode.EveryFrame;
                Vector3 probeSize = bounds.size + new Vector3(Mathf.Max(40f, bounds.size.x * 1.5f), Mathf.Max(30f, bounds.size.y * 1.5f), Mathf.Max(40f, bounds.size.z * 1.5f));
                probe.size = probeSize;
                probe.importance = 100;

                var hdProbe = probeObj.AddComponent<HDAdditionalReflectionData>();
                hdProbe.influenceVolume.shape = InfluenceShape.Box;
                hdProbe.influenceVolume.boxSize = probeSize;
                hdProbe.multiplier = 1.8f;
                hdProbe.weight = 1.0f;

                if (skyTexture != null)
                {
                    probe.mode = ReflectionProbeMode.Custom;
                    hdProbe.mode = ProbeSettings.Mode.Custom;
                    hdProbe.customTexture = skyTexture;
                    hdProbe.SetTexture(ProbeSettings.Mode.Custom, skyTexture);
                    probe.customBakedTexture = skyTexture;
                }
                else
                {
                    probe.mode = ReflectionProbeMode.Realtime;
                    hdProbe.mode = ProbeSettings.Mode.Realtime;
                    try { probe.RenderProbe(); } catch {}
                }

                log?.Invoke($"Studio initialized. Commencing 360-degree turntable capture ({totalFrames} frames) for '{vehicleId}'...");

                // 5. Turntable Render Loop
                float stepAngle = 360f / (float)totalFrames;
                for (int frame = 0; frame < totalFrames; frame++)
                {
                    float angle = frame * stepAngle;
                    turntablePivot.transform.rotation = Quaternion.Euler(0f, angle, 0f);

                    camera.targetTexture = renderTexture;
                    camera.Render();

                    RenderTexture downsampleRt = RenderTexture.GetTemporary(targetResolution, targetResolution, 0, RenderTextureFormat.ARGB32);
                    downsampleRt.filterMode = FilterMode.Bilinear;
                    Graphics.Blit(renderTexture, downsampleRt);

                    RenderTexture.active = downsampleRt;
                    Texture2D texFinal = new Texture2D(targetResolution, targetResolution, TextureFormat.RGB24, false);
                    texFinal.ReadPixels(new Rect(0, 0, targetResolution, targetResolution), 0, 0);
                    texFinal.Apply();

                    byte[] pngBytes = texFinal.EncodeToPNG();

                    UnityEngine.Object.DestroyImmediate(texFinal);
                    RenderTexture.ReleaseTemporary(downsampleRt);
                    camera.targetTexture = null;
                    RenderTexture.active = null;

                    string frameFileName = $"{vehicleId}_{frame:D2}.png";

                    File.WriteAllBytes(Path.Combine(turntableOutputDir, frameFileName), pngBytes);

                    if (exportToWeb && webTurntableDir != null)
                    {
                        File.WriteAllBytes(Path.Combine(webTurntableDir, frameFileName), pngBytes);
                    }

                    if (exportToRepo && repoTurntableDir != null)
                    {
                        File.WriteAllBytes(Path.Combine(repoTurntableDir, frameFileName), pngBytes);
                    }

                    // The static catalogue icon is only written for the default (non-color) render.
                    if (frame == 0 && colorKey == null)
                    {
                        File.WriteAllBytes(Path.Combine(outputDir, vehicleId + ".png"), pngBytes);
                        if (exportToWeb) File.WriteAllBytes(Path.Combine(webVehiclesDir, vehicleId + ".png"), pngBytes);
                        if (exportToRepo) File.WriteAllBytes(Path.Combine(repoRendersDir, vehicleId + ".png"), pngBytes);
                    }

                    renderedFrames++;
                    if (renderedFrames % 6 == 0 || renderedFrames == totalFrames)
                    {
                        log?.Invoke($"Turntable progress [{renderedFrames}/{totalFrames}]: angle {angle:F0} deg, frame {frameFileName}");
                    }
                }

                // Cleanup vehicle, pivot, showroom
                UnityEngine.Object.DestroyImmediate(turntablePivot);
                UnityEngine.Object.DestroyImmediate(showroom);

                log?.Invoke($"Turntable capture complete: Generated {renderedFrames} turntable frames for {vehicleId}.");
            }
            catch (Exception ex)
            {
                log?.Invoke($"Turntable studio rendering error: {ex}");
            }
            finally
            {
                if (renderTexture != null)
                {
                    renderTexture.Release();
                    UnityEngine.Object.DestroyImmediate(renderTexture);
                }
                if (profile != null)
                {
                    UnityEngine.Object.DestroyImmediate(profile);
                }
                if (studioRoot != null)
                {
                    UnityEngine.Object.DestroyImmediate(studioRoot);
                }
            }

            return renderedFrames;
        }

        public static int RenderAllBoats(string outputDir, Action<string> log = null)
        {
            if (string.IsNullOrEmpty(outputDir))
            {
                log?.Invoke("VehicleStudioRenderer.RenderAllBoats: Output directory is null or empty.");
                return 0;
            }

            string[] boatIds = new string[] { "speedboat", "yacht", "luxuryyacht" };
            int totalFramesRendered = 0;

            // Boats use their own primary/secondary palette (GlobalReferences.boatColors).
            var boatColorNames = new List<string>();
            try
            {
                if (GlobalReferences.Instance?.boatColors != null)
                {
                    foreach (var bc in GlobalReferences.Instance.boatColors)
                    {
                        if (bc != null && !string.IsNullOrEmpty(bc.name)) boatColorNames.Add(bc.name);
                    }
                }
            }
            catch { }
            if (boatColorNames.Count == 0) boatColorNames.Add("White");

            log?.Invoke($"Starting photographic showroom studio rendering for {boatIds.Length} boats x {boatColorNames.Count} colors...");

            foreach (string boatId in boatIds)
            {
                foreach (string colorName in boatColorNames)
                {
                    try
                    {
                        string colorKey = colorName.ToLowerInvariant();
                        string lastFrame = Path.Combine(Path.Combine(outputDir, boatId + "_360", colorKey), boatId + "_35.png");
                        if (File.Exists(lastFrame))
                        {
                            log?.Invoke($"Turntable frames for boat '{boatId}' ({colorName}) already exist. Skipping.");
                            totalFramesRendered += 36;
                            continue;
                        }

                        log?.Invoke($"Starting showroom rendering for boat '{boatId}' ({colorName})...");
                        int frames = RenderVehicleTurntable(
                            boatId,
                            outputDir,
                            36,
                            colorName,
                            log,
                            colorKey,
                            512
                        );
                        totalFramesRendered += frames;
                        log?.Invoke($"Completed showroom turntable for '{boatId}' ({colorName}): {frames} frames generated.");
                    }
                    catch (Exception ex)
                    {
                        log?.Invoke($"Error rendering boat '{boatId}' ({colorName}): {ex}");
                    }
                }
            }

            log?.Invoke($"All boats studio rendering complete! Total frames across all boats: {totalFramesRendered}.");
            return totalFramesRendered;
        }
    }
}
