import { scoreToColor, formatTime } from '../utils';
import { IconAlertTriangle } from './Icons.jsx';

// Surfaces every zone currently at or above the risk threshold, worst
// first. `zones` is a flat array of the latest reading per zone —
// { zone, confidence, status, time }. Used on both the Dashboard (a quick
// glance) and Analytics (the full list).
export default function AlertsPanel({ zones, threshold = 60, title = 'Active Alerts', compact = false }) {
  const atRisk = zones
    .filter((z) => typeof z.confidence === 'number' && z.confidence >= threshold)
    .sort((a, b) => b.confidence - a.confidence);

  return (
    <div className="bg-panel border border-line rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-xs uppercase tracking-wider text-textDim flex items-center gap-2">
          <IconAlertTriangle width={14} height={14} className={atRisk.length ? 'text-danger' : 'text-textDim'} />
          {title}
        </h2>
        <span
          className="font-mono text-[11px] px-2 py-0.5 rounded-full border"
          style={{
            color: atRisk.length ? '#D94F4F' : '#2F8F72',
            borderColor: atRisk.length ? 'rgba(217,79,79,0.4)' : 'rgba(47,143,114,0.4)',
          }}
        >
          {atRisk.length} zone{atRisk.length === 1 ? '' : 's'}
        </span>
      </div>

      {atRisk.length === 0 ? (
        <p className="text-sm text-textDim">
          No zones above the {threshold}% confidence threshold — wall looks clear.
        </p>
      ) : (
        <div className={compact ? 'space-y-2' : 'space-y-2 max-h-64 overflow-y-auto pr-1'}>
          {atRisk.map((z) => (
            <div
              key={z.zone}
              className="flex items-center justify-between gap-3 bg-panelAlt border border-line rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: scoreToColor(z.confidence) }}
                />
                <div className="min-w-0">
                  <div className="font-mono text-sm font-semibold">{z.zone}</div>
                  {z.time && <div className="text-[10.5px] text-textDim truncate">{formatTime(z.time)}</div>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-[10.5px] uppercase text-textDim">{z.status}</span>
                <span
                  className="font-mono text-sm font-bold"
                  style={{ color: scoreToColor(z.confidence) }}
                >
                  {z.confidence}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
