import { useState, useEffect, useMemo } from 'react';
import Charts from '../components/Charts.jsx';
import History from '../components/History.jsx';
import AlertsPanel from '../components/AlertsPanel.jsx';
import ZoneComparisonChart from '../components/ZoneComparisonChart.jsx';
import { subscribeScans, clearAllHistory, getCurrentModelStatus } from '../dataService.js';
import { avgField, latestPerZone, zoneHealthRanking } from '../utils.js';

export default function Analytics() {
  const [history, setHistory] = useState([]);
  const [modelStatus, setModelStatus] = useState(null);

  useEffect(() => {
    const unsub = subscribeScans(setHistory);
    return unsub;
  }, []);

  useEffect(() => {
    // recompute model status whenever the scan list changes
    getCurrentModelStatus().then(setModelStatus).catch(() => {});
  }, [history]);

  async function handleClear() {
    await clearAllHistory();
  }

  const zonesScanned = new Set(history.map((h) => h.zone)).size;
  const avgHealth = history.length
    ? Math.round(history.reduce((s, h) => s + h.wallHealth, 0) / history.length)
    : null;
  const highRiskZones = [...new Set(history.filter((h) => h.confidence >= 60).map((h) => h.zone))];

  // Ranking + "current state of the wall" are derived once per history
  // change, then reused by the alerts panel, the comparison chart, and the
  // best/worst callouts below — one pass over the data for all three.
  const ranking = useMemo(() => zoneHealthRanking(history), [history]);
  const currentZoneStates = useMemo(() => latestPerZone(history), [history]);
  const bestZone = ranking.length ? ranking[0] : null;
  const worstZone = ranking.length ? ranking[ranking.length - 1] : null;

  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Total Scans" value={history.length} />
        <MiniStat label="Zones Scanned" value={zonesScanned} />
        <MiniStat label="Avg Wall Health" value={avgHealth !== null ? `${avgHealth}%` : '—'} />
        <MiniStat label="High-Risk Zones" value={highRiskZones.length} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat label="Avg Moisture" value={history.length ? `${(avgField(history, 'moisture') ?? 0).toFixed(1)}%` : '—'} />
        <MiniStat label="Avg Thermal Δ" value={history.length ? `${(avgField(history, 'thermalDelta') ?? 0).toFixed(2)}°C` : '—'} />
        <MiniStat label="Best Zone" value={bestZone ? bestZone.zone : '—'} sub={bestZone ? `${bestZone.avgHealth}% health` : null} color="#2F8F72" />
        <MiniStat label="Worst Zone" value={worstZone ? worstZone.zone : '—'} sub={worstZone ? `${worstZone.avgHealth}% health` : null} color="#D94F4F" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ZoneComparisonChart ranking={ranking} />
        <AlertsPanel zones={currentZoneStates} threshold={60} title="Zones Above 60% Confidence" />
      </div>

      <div className="bg-panel border border-line rounded-xl p-5">
        <h2 className="font-mono text-xs uppercase tracking-wider text-textDim mb-4">AI Model</h2>
        {modelStatus ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-sm">
            <div>
              <div className="text-[11px] text-textDim uppercase mb-1">Status</div>
              <div style={{ color: modelStatus.trained ? '#2F8F72' : '#E8A33D' }}>
                {modelStatus.trained ? 'Trained (logistic regression)' : 'Heuristic default'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-textDim uppercase mb-1">Samples</div>
              <div>{modelStatus.samples} ({modelStatus.positives} leak / {modelStatus.negatives} dry)</div>
            </div>
            <div>
              <div className="text-[11px] text-textDim uppercase mb-1">Weights</div>
              <div className="text-xs">
                {modelStatus.model ? modelStatus.model.w.map((w) => w.toFixed(2)).join(' / ') : 'fixed: 0.45 / 0.35 / 0.20'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-textDim uppercase mb-1">Bias</div>
              <div className="text-xs">{modelStatus.model ? modelStatus.model.b.toFixed(2) : '—'}</div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-textDim">Loading…</p>
        )}
        <p className="text-[11px] text-textDim mt-3">
          Label at least 3 leak and 3 no-leak zones on the Dashboard to activate the trained model.
        </p>
      </div>

      <Charts history={history} />
      <History history={history} onClear={handleClear} />
    </div>
  );
}

function MiniStat({ label, value, sub, color }) {
  return (
    <div className="bg-panel border border-line rounded-xl p-4">
      <div className="text-[11px] text-textDim uppercase tracking-wide mb-1">{label}</div>
      <div className="font-mono text-xl font-bold" style={color ? { color } : undefined}>{value}</div>
      {sub && <div className="text-[10.5px] text-textDim mt-1">{sub}</div>}
    </div>
  );
}
