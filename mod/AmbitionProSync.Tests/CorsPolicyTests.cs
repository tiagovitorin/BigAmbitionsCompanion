using AmbitionProSync;
using Xunit;

namespace AmbitionProSync.Tests
{
    public class CorsPolicyTests
    {
        [Theory]
        // The dashboard the project actually ships and advertises.
        [InlineData("https://bigambitionscompanion.vercel.app")]
        // Local development server, any port.
        [InlineData("http://localhost:3000")]
        [InlineData("http://localhost:8080")]
        [InlineData("http://127.0.0.1:3000")]
        [InlineData("http://[::1]:3000")]
        public void AllowsKnownDashboardOrigins(string origin)
        {
            Assert.True(CorsPolicy.IsAllowed(origin));
            Assert.Equal(origin, CorsPolicy.ResolveAllowOrigin(origin));
        }

        [Theory]
        // Look-alike hosts that a naive substring check would wrongly accept.
        [InlineData("https://bigambitionscompanion.vercel.app.attacker.test")]
        [InlineData("https://evil-bigambitionscompanion.vercel.app.example.com")]
        [InlineData("https://localhost.attacker.test")]
        [InlineData("https://127.0.0.1.attacker.test")]
        [InlineData("https://example.com")]
        public void RejectsUnknownAndLookalikeOrigins(string origin)
        {
            Assert.False(CorsPolicy.IsAllowed(origin));
            // A rejected origin must get no Access-Control-Allow-Origin header at all,
            // rather than a mismatched one.
            Assert.Null(CorsPolicy.ResolveAllowOrigin(origin));
        }

        [Theory]
        [InlineData("not-a-url")]
        [InlineData("file://")]
        [InlineData("ftp://bigambitionscompanion.vercel.app")]
        public void RejectsMalformedOrNonHttpOrigins(string origin)
        {
            Assert.False(CorsPolicy.IsAllowed(origin));
            Assert.Null(CorsPolicy.ResolveAllowOrigin(origin));
        }

        [Theory]
        [InlineData(null)]
        [InlineData("")]
        public void AllowsNonBrowserClientsWithNoOriginHeader(string origin)
        {
            // curl and the mod's own diagnostics send no Origin header.
            Assert.True(CorsPolicy.IsAllowed(origin));
            Assert.Equal("*", CorsPolicy.ResolveAllowOrigin(origin));
        }

        [Fact]
        public void OriginComparisonIsCaseInsensitiveOnHost()
        {
            Assert.True(CorsPolicy.IsAllowed("https://BigAmbitionsCompanion.Vercel.App"));
        }
    }
}
