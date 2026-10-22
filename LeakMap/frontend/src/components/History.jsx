import { useState, useMemo } from 'react';
import { scoreToColor, formatTime } from '../utils';

function exportCsv(history) {
  if (history.length === 0) return;
  let csv = 'zone,moisture,thermalDelta,acoustic,confidence,wallHealth,status,label,scoreMethod,time\n';
  history.forEach((r) => {
    csv += `${r.zone},${r.moisture},${r.thermalDelta},${r.acoustic},${r.confidence},${r.wallHealth},${r.status},${r.label},${r.scoreMethod},${r.time}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leakmap_history.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function History({ history, onClear }) {
  const [zoneFilter, setZoneFilter] = useState('all');
  const zones = useMemo(() => [...new Set(history.map((h) => h.zone))].sort(), [history]);
  const filtered = zoneFilter === 'all' ? history : history.filter((h) => h.zone === zoneFilter);

  return (
    <div className="bg-panel border border-line rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="font-mono text-xs uppercase tracking-wider text-textDim">
          Scan History {zoneFilter !== 'all' && <span className="text-text normal-case">— {zoneFilter}</span>}
        </h2>
        <div className="flex gap-2 items-center">
          {zones.length > 0 && (
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="font-mono text-[11px] px-2 py-1.5 rounded-md border border-line bg-panelAlt text-text"
            >
              <option value="all">All zones</option>
              {zones.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
          )}
          <button
            onClick={() => exportCsv(filtered)}
            className="font-mono text-[11px] px-3 py-1.5 rounded-md border border-line bg-panelAlt text-text"
          >
            ⬇ Export CSV
          </button>
          <button
            onClick={onClear}
            className="font-mono text-[11px] px-3 py-1.5 rounded-md border border-danger text-danger"
          >
            Clear History
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-textDim">No scans recorded yet.</p>
      ) : (
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full font-mono text-[11.5px]">
            <thead>
              <tr className="text-left text-textDim border-b border-line sticky top-0 bg-panel">
                <th className="py-1.5 pr-2">Zone</th>
                <th className="py-1.5 pr-2">Moist%</th>
                <th className="py-1.5 pr-2">ΔT</th>
                <th className="py-1.5 pr-2">Acou.</th>
                <th className="py-1.5 pr-2">Score</th>
                <th className="py-1.5 pr-2">Label</th>
                <th className="py-1.5 pr-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-line"
                  style={r.confidence >= 60 ? { background: 'rgba(217,79,79,0.06)' } : undefined}
                >
                  <td className="py-1.5 pr-2">{r.zone}</td>
                  <td className="py-1.5 pr-2">{r.moisture.toFixed(1)}</td>
                  <td className="py-1.5 pr-2">{r.thermalDelta.toFixed(2)}</td>
                  <td className="py-1.5 pr-2">{Math.round(r.acoustic)}</td>
                  <td className="py-1.5 pr-2 font-semibold" style={{ color: scoreToColor(r.confidence) }}>
                    {r.confidence}
                  </td>
                  <td className="py-1.5 pr-2 uppercase">{r.label}</td>
                  <td className="py-1.5 pr-2 text-textDim">{formatTime(r.time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
