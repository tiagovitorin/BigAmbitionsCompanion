'use client';

import { SquareParking } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useAnimatedNumber } from '@/lib/useAnimatedNumber';

// A 270-degree dial that opens at the bottom (like a real dashboard gauge).
const DIAL_START = 135;
const DIAL_SWEEP = 270;

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  if (endAngle <= startAngle) return '';
  const start = polar(cx, cy, r, startAngle);
  const end = polar(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

interface DialProps {
  fraction: number;
  color: string;
  endLabels?: [string, string];
}

function Dial({ fraction, color, endLabels }: DialProps) {
  const cx = 50;
  const cy = 50;
  const r = 36;
  const clamped = Math.max(0, Math.min(1, fraction));
  const valueEnd = DIAL_START + DIAL_SWEEP * clamped;
  const needle = polar(cx, cy, 27, valueEnd);
  const ticks = Array.from({ length: 13 }, (_, i) => i / 12);

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <path
        d={arcPath(cx, cy, r, DIAL_START, DIAL_START + DIAL_SWEEP)}
        fill="none"
        strokeWidth="6.5"
        strokeLinecap="round"
        style={{ stroke: 'var(--border-base)' }}
      />
      {ticks.map((t, i) => {
        const angle = DIAL_START + DIAL_SWEEP * t;
        const outer = polar(cx, cy, r + 5, angle);
        const inner = polar(cx, cy, r - 1, angle);
        const major = i % 3 === 0;
        return (
          <line
            key={i}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            strokeWidth={major ? 1.8 : 1}
            strokeLinecap="round"
            style={{ stroke: major ? 'var(--text-subtle)' : 'var(--border-base)' }}
          />
        );
      })}
      {clamped > 0.001 && (
        <path
          d={arcPath(cx, cy, r, DIAL_START, valueEnd)}
          fill="none"
          strokeWidth="6.5"
          strokeLinecap="round"
          style={{ stroke: color, filter: `drop-shadow(0 0 3px ${color})` }}
        />
      )}
      <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} strokeWidth="2.6" strokeLinecap="round" style={{ stroke: color }} />
      <circle cx={cx} cy={cy} r="4.5" strokeWidth="1.6" style={{ stroke: color, fill: 'var(--bg-base)' }} />
      {endLabels && (
        <>
          <text x={polar(cx, cy, r + 10, DIAL_START).x} y={polar(cx, cy, r + 10, DIAL_START).y + 3} textAnchor="middle" fontSize="8" fontFamily="monospace" style={{ fill: 'var(--text-subtle)' }}>
            {endLabels[0]}
          </text>
          <text x={polar(cx, cy, r + 10, DIAL_START + DIAL_SWEEP).x} y={polar(cx, cy, r + 10, DIAL_START + DIAL_SWEEP).y + 3} textAnchor="middle" fontSize="8" fontFamily="monospace" style={{ fill: 'var(--text-subtle)' }}>
            {endLabels[1]}
          </text>
        </>
      )}
    </svg>
  );
}

const SEGMENT_POLYGONS = [
  '8,4 32,4 28,8 12,8', // a
  '33,5 33,35 29,31 29,9', // b
  '33,37 33,67 29,63 29,41', // c
  '8,68 32,68 28,64 12,64', // d
  '7,37 7,67 11,63 11,41', // e
  '7,5 7,35 11,31 11,9', // f
  '8,36 12,32 28,32 32,36 28,40 12,40' // g
];

// Segments in a,b,c,d,e,f,g order.
const DIGIT_SEGMENTS: Record<string, number[]> = {
  '0': [1, 1, 1, 1, 1, 1, 0],
  '1': [0, 1, 1, 0, 0, 0, 0],
  '2': [1, 1, 0, 1, 1, 0, 1],
  '3': [1, 1, 1, 1, 0, 0, 1],
  '4': [0, 1, 1, 0, 0, 1, 1],
  '5': [1, 0, 1, 1, 0, 1, 1],
  '6': [1, 0, 1, 1, 1, 1, 1],
  '7': [1, 1, 1, 0, 0, 0, 0],
  '8': [1, 1, 1, 1, 1, 1, 1],
  '9': [1, 1, 1, 1, 0, 1, 1]
};

function Digit({ char }: { char: string }) {
  const segments = DIGIT_SEGMENTS[char] ?? [];
  return (
    <svg viewBox="0 0 40 72" className="h-full w-auto">
      {SEGMENT_POLYGONS.map((points, i) => {
        const on = segments[i] === 1;
        return (
          <polygon
            key={i}
            points={points}
            style={{ fill: on ? 'var(--rose-accent)' : 'var(--border-subtle)', filter: on ? 'drop-shadow(0 0 2.5px var(--rose-accent))' : undefined }}
          />
        );
      })}
    </svg>
  );
}

interface VehicleDashboardProps {
  cargo: number;
  speed: number;
  fuel: number;
  autoPark: boolean;
  maxSpeed: number;
  maxFuel: number;
}

// Dashboard cluster for the selected vehicle. Values ease between vehicles so the
// needles and digits travel from the previous reading instead of jumping.
export default function VehicleDashboard({ cargo, speed, fuel, autoPark, maxSpeed, maxFuel }: VehicleDashboardProps) {
  const { t } = useTranslation();
  const animatedSpeed = useAnimatedNumber(speed);
  const animatedFuel = useAnimatedNumber(fuel);
  const animatedCargo = useAnimatedNumber(cargo);

  const safeMaxSpeed = Math.max(1, maxSpeed);
  const safeMaxFuel = Math.max(1, maxFuel);
  const speedFraction = animatedSpeed / safeMaxSpeed;
  const fuelFraction = animatedFuel / safeMaxFuel;

  const cargoValue = Math.max(0, Math.min(99, Math.round(animatedCargo)));
  const digits = cargoValue.toString().padStart(2, '0').split('');

  return (
    <div className="relative overflow-hidden w-full rounded-2xl border border-[var(--border-base)] bg-[var(--bg-base)] px-4 pt-6 pb-4">
      {/* Half-moon dashboard hood */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-6 top-3 bottom-0 rounded-t-[100%] bg-black/10 ring-1 ring-inset ring-black/10 dark:bg-black/30 dark:ring-white/5"
      />
      <div className="relative flex flex-wrap md:flex-nowrap items-end justify-center gap-2 md:gap-3">
      {/* Cargo: small 7-segment display */}
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <div className="h-10 lg:h-12 flex items-center gap-1">
          <Digit char={digits[0]} />
          <Digit char={digits[1]} />
        </div>
        <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-subtle)]">{t('vehicles.boxes', 'boxes')}</span>
      </div>

      {/* Top Speed: the biggest gauge */}
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <div className="relative w-36 h-36 lg:w-44 lg:h-44">
          <Dial fraction={speedFraction} color="var(--sky-accent)" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-1">
            <span className="font-mono font-bold text-[var(--text-main)] leading-none text-2xl lg:text-3xl tabular-nums">{Math.round(animatedSpeed)}</span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-subtle)] mt-0.5">{t('vehicles.mph', 'mph')}</span>
          </div>
        </div>
      </div>

      {/* Fuel: medium gauge, smaller than top speed. Lifted so its arc bottom
          lines up with the speedometer's arc bottom. */}
      <div className="flex flex-col items-center gap-1.5 shrink-0 mb-3 lg:mb-4">
        <div className="relative w-24 h-24 lg:w-28 lg:h-28">
          <Dial fraction={fuelFraction} color="#fbbf24" endLabels={['E', 'F']} />
          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-0.5">
            <span className="font-mono font-bold text-[var(--text-main)] leading-none text-lg lg:text-xl tabular-nums">{Math.round(animatedFuel)}</span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-subtle)] mt-0.5">L</span>
          </div>
        </div>
      </div>

      {/* Auto-Park: same footprint as cargo */}
      <div className="flex flex-col items-center gap-1.5 shrink-0">
        <div className="h-10 lg:h-12 flex items-center justify-center">
          <SquareParking
            className="w-8 h-8 lg:w-10 lg:h-10 transition-all duration-300"
            style={{
              color: autoPark ? '#34d399' : 'var(--text-subtle)',
              filter: autoPark ? 'drop-shadow(0 0 7px rgba(52,211,153,0.85))' : 'none'
            }}
          />
        </div>
      </div>
      </div>
    </div>
  );
}
