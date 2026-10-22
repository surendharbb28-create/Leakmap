import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { scoreToColor } from '../utils';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

// A compact inline trend line for a single zone's Leak Confidence history —
// no axes, no legend, just shape. Lives inside ZoneCard so a zone's
// trajectory (rising, falling, flat) is visible at a glance without
// switching to the Analytics tab.
export default function ZoneTrend({ records }) {
  if (!records || records.length < 2) {
    return (
      <div className="text-[11px] text-textDim py-3 text-center border border-dashed border-line rounded-md">
        Trend appears after 2+ captures for this zone
      </div>
    );
  }

  const values = records.map((r) => r.confidence);
  const latest = values[values.length - 1];
  const first = values[0];
  const delta = latest - first;
  const lineColor = scoreToColor(latest);

  const data = {
    labels: records.map((_, i) => i),
    datasets: [
      {
        data: values,
        borderColor: lineColor,
        backgroundColor: 'transparent',
        tension: 0.35,
        pointRadius: 0,
        borderWidth: 1.75,
        fill: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: { display: false, min: 0, max: 100 },
    },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-textDim uppercase tracking-wide">
          Confidence trend ({records.length} scans)
        </span>
        <span className="text-[11px] font-mono" style={{ color: delta === 0 ? '#8B99A0' : delta > 0 ? '#D94F4F' : '#2F8F72' }}>
          {delta === 0 ? '—' : delta > 0 ? `▲ +${delta}` : `▼ ${delta}`}
        </span>
      </div>
      <div style={{ height: 44 }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
