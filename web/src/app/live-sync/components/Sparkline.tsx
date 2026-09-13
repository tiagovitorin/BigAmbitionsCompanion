'use client';

// Lightweight inline sparkline (no chart library), for dense table rows.
export default function Sparkline({
  data,
  width = 68,
  height = 22,
  color
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length < 2) return <span style={{ display: 'inline-block', width, height }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pad = 3;
  const points = data
    .map((v, i) => `${(i * step).toFixed(1)},${(height - pad - ((v - min) / range) * (height - pad * 2)).toFixed(1)}`)
    .join(' ');
  const trendingUp = data[data.length - 1] >= data[0];
  const stroke = color ?? (trendingUp ? '#10b981' : '#f43f5e');
  return (
    <svg width={width} height={height} className="block" aria-hidden="true">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
