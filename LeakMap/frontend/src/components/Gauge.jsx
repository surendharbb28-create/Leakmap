import { scoreToColor } from '../utils';

// A compact radial gauge for headline metrics (Wall Health, avg confidence).
// Pure SVG — no extra chart library needed for a single-value readout.
export default function Gauge({ value, label, size = 108, thickness = 10, invert = false }) {
  const hasValue = typeof value === 'number' && !Number.isNaN(value);
  const pct = hasValue ? Math.max(0, Math.min(100, value)) : 0;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);
  // Wall Health is "higher is better" (green), so invert the color ramp
  // relative to a raw risk score (where higher is worse / red).
  const color = hasValue ? scoreToColor(invert ? 100 - pct : pct) : '#3A454C';

  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#2A343A"
          strokeWidth={thickness}
        />
        {hasValue && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s ease' }}
          />
        )}
      </svg>
      <div className="flex flex-col">
        <div className="font-mono text-3xl font-bold leading-none" style={{ color: hasValue ? color : '#8B99A0' }}>
          {hasValue ? `${Math.round(pct)}%` : '—'}
        </div>
        {label && <div className="text-[11px] text-textDim uppercase tracking-wide mt-1.5">{label}</div>}
      </div>
    </div>
  );
}
