import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { scoreToColor } from '../utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Side-by-side average Leak Confidence per zone across all captured scans —
// the fastest way to see which parts of the wall are trending worse than
// others, rather than reading one zone at a time off the wall map.
export default function ZoneComparisonChart({ ranking }) {
  if (!ranking || ranking.length === 0) {
    return (
      <div className="bg-panel border border-line rounded-xl p-5">
        <h2 className="font-mono text-xs uppercase tracking-wider text-textDim mb-3">Zone Comparison</h2>
        <p className="text-sm text-textDim">No scans yet — this fills in once zones have been captured.</p>
      </div>
    );
  }

  // Sort by zone id for a stable, readable axis (A1, A2, ... D4) rather
  // than by risk, which would jump around every time the ranking changes.
  const sorted = [...ranking].sort((a, b) => a.zone.localeCompare(b.zone));

  const data = {
    labels: sorted.map((z) => z.zone),
    datasets: [
      {
        label: 'Avg Leak Confidence',
        data: sorted.map((z) => z.avgConfidence),
        backgroundColor: sorted.map((z) => scoreToColor(z.avgConfidence)),
        borderRadius: 3,
        maxBarThickness: 28,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1B2328',
        borderColor: '#2A343A',
        borderWidth: 1,
        titleFont: { family: 'IBM Plex Mono', size: 11 },
        bodyFont: { family: 'IBM Plex Mono', size: 11 },
        padding: 10,
        callbacks: {
          afterLabel: (ctx) => `${sorted[ctx.dataIndex].scans} scan${sorted[ctx.dataIndex].scans === 1 ? '' : 's'}`,
        },
      },
    },
    scales: {
      x: { ticks: { color: '#8B99A0', font: { family: 'IBM Plex Mono', size: 10 } }, grid: { display: false } },
      y: {
        min: 0,
        max: 100,
        ticks: { color: '#8B99A0', font: { size: 10 } },
        grid: { color: '#2A343A' },
      },
    },
  };

  return (
    <div className="bg-panel border border-line rounded-xl p-5">
      <h2 className="font-mono text-xs uppercase tracking-wider text-textDim mb-4">
        Zone Comparison — Avg Leak Confidence
      </h2>
      <div className="h-52">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
