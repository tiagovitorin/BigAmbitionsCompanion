using System;

namespace AmbitionProSync
{
    /// <summary>
    /// Origin allow-list for the Live HQ loopback telemetry server.
    /// Deliberately free of Unity and game dependencies so it can be unit tested standalone.
    /// </summary>
    public static class CorsPolicy
    {
        /// <summary>Hosts the Live HQ dashboard is served from.</summary>
        private static readonly string[] AllowedHosts =
        {
            "bigambitionscompanion.vercel.app",
            "tiagovitorin.github.io"
        };

        /// <summary>
        /// Resolves the Access-Control-Allow-Origin value for a request, or null when the origin
        /// is not allowed - in which case no CORS headers should be sent at all. Returning a
        /// mismatched origin (as the previous implementation did) only produces a confusing
        /// browser-side CORS failure on an otherwise successful response.
        /// </summary>
        public static string ResolveAllowOrigin(string origin)
        {
            if (string.IsNullOrEmpty(origin)) return "*";
            return IsAllowed(origin) ? origin : null;
        }

        public static bool IsAllowed(string origin)
        {
            // Non-browser clients (curl, the mod's own diagnostics) send no Origin header.
            if (string.IsNullOrEmpty(origin)) return true;

            Uri uri;
            if (!Uri.TryCreate(origin, UriKind.Absolute, out uri)) return false;
            if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps) return false;

            // The dashboard may be served from a local dev server on any port. Uri.IsLoopback
            // covers localhost, 127.0.0.0/8 and ::1 without hand-rolled host matching - and
            // unlike comparing Uri.Host it behaves the same on .NET Framework and .NET, which
            // normalise IPv6 hosts differently ("[::1]" vs "[0000:...:0001]").
            if (uri.IsLoopback) return true;

            // Compare the parsed host, never a substring of the raw origin: "localhost" as a
            // substring also matches an attacker-controlled "https://localhost.example.com".
            foreach (string allowed in AllowedHosts)
            {
                if (string.Equals(uri.Host, allowed, StringComparison.OrdinalIgnoreCase)) return true;
            }

            return false;
        }
    }
}
