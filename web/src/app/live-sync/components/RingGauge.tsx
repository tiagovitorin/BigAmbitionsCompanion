'use client';

interface RingGaugeProps {
  value: number;
  color: string;
  size?: number;
  stroke?: number;
  label?: string;
}

// Compact circular gauge used in dense production rows.
export default function RingGauge({ value, color, size = 38, stroke = 3.5, label }: RingGaugeProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--bg-base)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${circumference * clamped} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fontSize={size * 0.3}
        fontWeight={700}
        fill="var(--text-main)"
        fontFamily="ui-monospace, monospace"
      >
        {label ?? `${Math.round(clamped * 100)}`}
      </text>
    </svg>
  );
}
