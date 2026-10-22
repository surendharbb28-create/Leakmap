function hexToRgb(hex) {
  const v = hex.replace('#', '');
  return [parseInt(v.substr(0, 2), 16), parseInt(v.substr(2, 2), 16), parseInt(v.substr(4, 2), 16)];
}

function mix(hexA, hexB, t) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bch = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bch})`;
}

// Same gradient used across the whole product: safe (teal) -> warn (amber) -> danger (red)
export function scoreToColor(score) {
  const t = Math.max(0, Math.min(100, score)) / 100;
  if (t < 0.5) return mix('#2F8F72', '#E8A33D', t / 0.5);
  return mix('#E8A33D', '#D94F4F', (t - 0.5) / 0.5);
}

export function verdictFor(score) {
  if (score < 30) return { text: 'No significant anomaly', color: '#2F8F72' };
  if (score < 60) return { text: 'Elevated — monitor zone', color: '#E8A33D' };
  return { text: 'High confidence leak signature', color: '#D94F4F' };
}

// Simple trailing moving average — used to smooth the Wall Health line into
// a readable trend instead of a jagged raw signal.
export function movingAverage(values, window = 5) {
  return values.map((_, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = values.slice(start, i + 1).filter((v) => typeof v === 'number' && !Number.isNaN(v));
    if (slice.length === 0) return null;
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

// Average of a numeric field across a list of records, ignoring
// missing/null values (older records may predate a field). Returns null
// when there's nothing to average.
export function avgField(records, field) {
  const vals = records.map((r) => r[field]).filter((v) => typeof v === 'number' && !Number.isNaN(v));
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// Groups scan records by zone and returns, per zone, the chronological
// (oldest -> newest) list of records. `history` is expected newest-first
// (as subscribeScans delivers it), so each zone's list is reversed.
export function groupByZone(history) {
  const byZone = {};
  history.forEach((r) => {
    if (!byZone[r.zone]) byZone[r.zone] = [];
    byZone[r.zone].push(r);
  });
  Object.keys(byZone).forEach((z) => byZone[z].reverse());
  return byZone;
}

// The single most recent record for each zone, from a newest-first history
// array. Used to answer "what does the wall look like right now" without a
// second Firebase read of /latest.
export function latestPerZone(history) {
  const seen = {};
  const out = [];
  for (const r of history) {
    if (!seen[r.zone]) {
      seen[r.zone] = true;
      out.push(r);
    }
  }
  return out;
}

// Average wall health per zone, sorted best -> worst. Used for "Best Zone /
// Worst Zone" callouts and the zone-comparison bar chart.
export function zoneHealthRanking(history) {
  const byZone = groupByZone(history);
  return Object.entries(byZone)
    .map(([zone, records]) => ({
      zone,
      avgHealth: Math.round(avgField(records, 'wallHealth')),
      avgConfidence: Math.round(avgField(records, 'confidence')),
      scans: records.length,
    }))
    .sort((a, b) => b.avgHealth - a.avgHealth);
}

export function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return iso;
  }
}
