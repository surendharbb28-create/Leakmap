import { useState } from 'react';
import { scoreToColor } from '../utils';
import { environmentalScore } from '../prediction.js';

// Fixed reference grid — zones only light up once Firebase has data for
// them; empty cells represent zones that haven't been scanned yet.
const ROWS = ['A', 'B', 'C', 'D'];
const COLS = [1, 2, 3, 4];

export default function WallMap({ latestByZone, selectedZone, onSelect }) {
  // 'env' = color by raw sensor readings (moisture/thermal/humidity), no ML.
  // 'confidence' = color by the trained/heuristic Leak Confidence score.
  const [mode, setMode] = useState('env');

  return (
    <div className="bg-panel border border-line rounded-xl p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-mono text-xs uppercase tracking-wider text-textDim">
          Live Wall Map
        </h2>
        <div className="flex border border-line rounded-md overflow-hidden font-mono text-[10.5px]">
          <button
            onClick={() => setMode('env')}
            className={`px-2.5 py-1 transition-colors ${mode === 'env' ? 'bg-panelAlt text-text' : 'text-textDim hover:text-text'}`}
          >
            Environmental
          </button>
          <button
            onClick={() => setMode('confidence')}
            className={`px-2.5 py-1 border-l border-line transition-colors ${mode === 'confidence' ? 'bg-panelAlt text-text' : 'text-textDim hover:text-text'}`}
          >
            AI Confidence
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {ROWS.map((row) =>
          COLS.map((col) => {
            const zoneId = `${row}${col}`;
            const data = latestByZone[zoneId];
            const hasData = Boolean(data);
            const isSelected = selectedZone === zoneId;
            const score = hasData ? (mode === 'env' ? environmentalScore(data) : data.confidence) : null;

            return (
              <button
                key={zoneId}
                onClick={() => onSelect(zoneId)}
                className={`cell-hover aspect-square rounded-md border text-[11px] font-mono flex items-end justify-start p-1.5 transition-transform ${
                  isSelected ? 'ring-2 ring-text' : ''
                }`}
                style={{
                  background: hasData ? scoreToColor(score) : '#202A30',
                  borderColor: hasData ? 'transparent' : '#2A343A',
                  borderStyle: hasData ? 'solid' : 'dashed',
                  color: hasData ? 'rgba(0,0,0,0.65)' : '#8B99A0',
                }}
                title={
                  hasData
                    ? `${zoneId} — ${mode === 'env' ? 'environmental score' : 'AI confidence'} ${score}`
                    : `${zoneId} — no data yet`
                }
              >
                {zoneId}
              </button>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-2 mt-4 font-mono text-[11px] text-textDim">
        <span>0</span>
        <div className="flex-1 h-2 rounded" style={{ background: 'linear-gradient(90deg, #2F8F72, #E8A33D, #D94F4F)' }} />
        <span>100</span>
      </div>
      <p className="text-[11px] text-textDim mt-2 leading-relaxed">
        {mode === 'env'
          ? 'Color = Environmental Risk Index — moisture, thermal Δ and humidity, no AI model involved.'
          : 'Color = Leak Confidence Score (trained model or heuristic).'}{' '}
        Dashed cells have no scan yet.
      </p>
    </div>
  );
}
