import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
          borderRadius: '8px',
          color: 'white',
          fontWeight: 900,
          fontSize: '18px',
          fontFamily: 'sans-serif',
          letterSpacing: '-1px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}
      >
        BA
      </div>
    ),
    {
      ...size,
    }
  );
}
