using MelonLoader;

[assembly: MelonInfo(typeof(AmbitionProSync.AmbitionProSyncMelonMod), "BigAmbitionsCompanion", AmbitionProSync.TelemetryEngine.MOD_VERSION, "AmbitionPro")]
[assembly: MelonGame("Hovgaard Games", "Big Ambitions")]

namespace AmbitionProSync
{
    /// <summary>
    /// MelonLoader entry point for Big Ambitions Companion Live HQ.
    /// Bridges MelonLoader lifecycle callbacks to the shared TelemetryEngine.
    /// </summary>
    public class AmbitionProSyncMelonMod : MelonMod
    {
        public override void OnInitializeMelon()
        {
            TelemetryEngine.LogInfo = (msg) => MelonLogger.Msg(msg);
            TelemetryEngine.LogWarn = (msg) => MelonLogger.Warning(msg);
            TelemetryEngine.LogErr  = (msg) => MelonLogger.Error(msg);

            TelemetryEngine.Initialize("MelonLoader");
        }

        public override void OnDeinitializeMelon()
        {
            TelemetryEngine.Shutdown();
        }

        public override void OnUpdate()
        {
            TelemetryEngine.Update();
        }
    }
}
