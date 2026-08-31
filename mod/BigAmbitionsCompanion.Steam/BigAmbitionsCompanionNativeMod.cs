using System;
using System.Threading.Tasks;
using BAModAPI;
using UnityEngine;

[assembly: RegisterModClass(typeof(AmbitionProSync.BigAmbitionsCompanionNativeMod))]

namespace AmbitionProSync
{
    /// <summary>
    /// Steam Workshop Native Mod Entry for Big Ambitions Companion Live HQ.
    /// Loaded natively by Big Ambitions mod loader upon city initialization.
    /// </summary>
    [ModEntryOnCityLoad]
    public class BigAmbitionsCompanionNativeMod : ModBigAmbitionsBase
    {
        private GameObject _updaterObject;

        public override Task OnLoadAsync(ModContext context)
        {
            if (context?.Logger != null)
            {
                TelemetryEngine.LogInfo = (msg) => context.Logger.Info($"[BigAmbitionsCompanion] {msg}");
                TelemetryEngine.LogWarn = (msg) => context.Logger.Warn($"[BigAmbitionsCompanion] {msg}");
                TelemetryEngine.LogErr  = (msg) => context.Logger.Error($"[BigAmbitionsCompanion] {msg}");
            }
            else
            {
                TelemetryEngine.LogInfo = (msg) => Debug.Log($"[BigAmbitionsCompanion] {msg}");
                TelemetryEngine.LogWarn = (msg) => Debug.LogWarning($"[BigAmbitionsCompanion] {msg}");
                TelemetryEngine.LogErr  = (msg) => Debug.LogError($"[BigAmbitionsCompanion] {msg}");
            }

            TelemetryEngine.Initialize("Steam Workshop Native Mod");

            // Attach a persistent Unity MonoBehaviour for per-frame telemetry updates
            if (_updaterObject == null)
            {
                _updaterObject = new GameObject("BigAmbitionsCompanion_Updater");
                UnityEngine.Object.DontDestroyOnLoad(_updaterObject);
                _updaterObject.AddComponent<TelemetryUpdaterComponent>();
            }

            return Task.CompletedTask;
        }

        public override Task OnUnloadAsync()
        {
            TelemetryEngine.Shutdown();

            if (_updaterObject != null)
            {
                UnityEngine.Object.Destroy(_updaterObject);
                _updaterObject = null;
            }

            return Task.CompletedTask;
        }
    }

    /// <summary>
    /// Lightweight MonoBehaviour attached to persistent Unity scene hierarchy to trigger Update() cycles.
    /// </summary>
    public class TelemetryUpdaterComponent : MonoBehaviour
    {
        private void Update()
        {
            TelemetryEngine.Update();
        }

        private void OnDestroy()
        {
            TelemetryEngine.Shutdown();
        }
    }
}