import { scoreToColor, verdictFor, formatTime } from '../utils';
import ZoneTrend from './ZoneTrend.jsx';

export default function ZoneCard({ zoneId, data, onLabel, trend }) {
  if (!zoneId) {
    return (
      <div className="bg-panel border border-line rounded-xl p-5">
        <h2 className="font-mono text-xs uppercase tracking-wider text-textDim mb-3">Zone Detail</h2>
        <p className="text-sm text-textDim leading-relaxed">
          Click a zone on the map to inspect its latest reading.
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-panel border border-line rounded-xl p-5">
        <h2 className="font-mono text-xs uppercase tracking-wider text-textDim mb-3">Zone Detail</h2>
        <p className="text-sm text-textDim leading-relaxed">
          Zone <b className="text-text">{zoneId}</b> selected — no scan data yet.
        </p>
      </div>
    );
  }

  const verdict = verdictFor(data.confidence);
  const hasAirTemp = typeof data.airTemp === 'number' && data.airTemp !== 0;
  const hasHumidity = typeof data.humidity === 'number' && data.humidity !== 0;

  return (
    <div className="bg-panel border border-line rounded-xl p-5">
      <h2 className="font-mono text-xs uppercase tracking-wider text-textDim mb-3">Zone Detail</h2>

      <div className="font-mono text-2xl font-bold mb-1">{data.zone}</div>
      <div className="font-mono text-xs mb-4" style={{ color: verdict.color }}>
        {verdict.text}
      </div>

      <Row label="Moisture" value={`${data.moisture.toFixed(1)}%`} pct={(data.moisture / 60) * 100} />
      <Row label="Thermal Δ vs ambient" value={`+${data.thermalDelta.toFixed(2)}°C`} pct={(data.thermalDelta / 5) * 100} />
      <Row label="Acoustic index" value={Math.round(data.acoustic)} pct={(data.acoustic / 70) * 100} />
      {(hasAirTemp || hasHumidity) && (
        <div className="grid grid-cols-2 gap-3 py-3 border-b border-line font-mono">
          <div>
            <div className="text-[11px] text-textDim">Air Temp</div>
            <div className="text-sm font-semibold">{hasAirTemp ? `${data.airTemp.toFixed(1)}°C` : '—'}</div>
          </div>
          <div>
            <div className="text-[11px] text-textDim">Humidity</div>
            <div className="text-sm font-semibold">{hasHumidity ? `${data.humidity.toFixed(1)}%` : '—'}</div>
          </div>
        </div>
      )}

      <div className="text-center py-4">
        <div className="font-mono text-5xl font-bold" style={{ color: scoreToColor(data.confidence) }}>
          {data.confidence}
        </div>
        <div className="font-mono text-[11px] text-textDim mt-1">
          LEAK CONFIDENCE ({data.scoreMethod === 'model' ? 'trained model' : 'heuristic'})
        </div>
      </div>

      <div className="font-mono text-[11px] text-textDim mb-4">
        Last updated {formatTime(data.time)} · Wall health {data.wallHealth}%
      </div>

      <div className="border-t border-line pt-4 mb-4">
        <ZoneTrend records={trend} />
      </div>

      <div className="border-t border-line pt-4">
        <div className="text-xs text-textDim mb-2">Ground truth (trains the model)</div>
        <div className="flex gap-2">
          <button
            onClick={() => onLabel(zoneId, 'leak')}
            className="font-mono text-xs font-semibold px-3 py-2 rounded-md border border-line bg-panelAlt hover:border-danger hover:text-danger"
          >
            Confirmed Leak
          </button>
          <button
            onClick={() => onLabel(zoneId, 'dry')}
            className="font-mono text-xs font-semibold px-3 py-2 rounded-md border border-line bg-panelAlt hover:border-safe hover:text-safe"
          >
            No Leak
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, pct }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="flex justify-between items-center py-2 border-b border-line">
      <div className="flex-1 pr-3">
        <div className="text-xs text-textDim">{label}</div>
        <div className="h-1 bg-panelAlt rounded mt-1.5 overflow-hidden">
          <div className="h-full rounded" style={{ width: `${clamped}%`, background: scoreToColor(clamped) }} />
        </div>
      </div>
      <div className="font-mono text-sm font-semibold">{value}</div>
    </div>
  );
}
