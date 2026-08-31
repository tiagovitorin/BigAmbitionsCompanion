import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Big Ambitions Companion | Compendium Suite & Live HQ';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '80px',
          background: 'linear-gradient(145deg, #090d16 0%, #0f172a 50%, #042f2e 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Header Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '16px',
              fontWeight: 900,
              fontSize: '28px',
              letterSpacing: '-1px',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
            }}
          >
            BA
          </div>
          <div
            style={{
              fontSize: '24px',
              color: '#94a3b8',
              fontWeight: 600,
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            Big Ambitions Companion
          </div>
        </div>

        {/* Center Main Copy */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px' }}>
          <div
            style={{
              fontSize: '60px',
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#ffffff',
              letterSpacing: '-1.5px',
            }}
          >
            The Ultimate Companion &amp; Live Telemetry Suite
          </div>
          <div
            style={{
              fontSize: '28px',
              color: '#cbd5e1',
              fontWeight: 400,
              lineHeight: 1.4,
            }}
          >
            Optimize store pricing, calculate factory production pipelines, explore real estate, and sync live game telemetry in real-time.
          </div>
        </div>

        {/* Footer Feature Tags */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            color: '#64748b',
            fontSize: '20px',
            fontWeight: 600,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399' }}>
            ✓ 791 Items &amp; Wholesale Suppliers
          </div>
          <div style={{ color: '#475569' }}>•</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8' }}>
            ✓ Dynamic Pricing Advisor
          </div>
          <div style={{ color: '#475569' }}>•</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a78bfa' }}>
            ✓ Live Game HQ Sync
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
