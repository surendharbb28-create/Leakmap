import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { movingAverage, avgField } from '../utils.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { labels: { color: '#8B99A0', font: { family: 'IBM Plex Mono', size: 11 }, boxWidth: 12, usePointStyle: true, pointStyle: 'line' } },
    tooltip: {
      backgroundColor: '#1B2328',
      borderColor: '#2A343A',
      borderWidth: 1,
      titleFont: { family: 'IBM Plex Mono', size: 11 },
      bodyFont: { family: 'IBM Plex Mono', size: 11 },
      padding: 10,
    },
  },
  scales: {
    x: { ticks: { color: '#8B99A0', font: { size: 10 } }, grid: { color: '#2A343A' } },
    y: { ticks: { color: '#8B99A0', font: { size: 10 } }, grid: { color: '#2A343A' } },
  },
};

export default function Charts({ history }) {
  // history comes newest-first — reverse for a left-to-right timeline
  const chrono = [...history].reverse();
  const labels = chrono.map((h) => new Date(h.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const confidenceSeries = chrono.map((h) => h.confidence);
  const wallHealthSeries = chrono.map((h) => h.wallHealth);
  const wallHealthAvg = movingAverage(wallHealthSeries, 5);
  const confidenceAvg = movingAverage(confidenceSeries, 5);

  const data = {
    labels,
    datasets: [
      {
        label: 'Leak Confidence',
        data: confidenceSeries,
        borderColor: '#D94F4F',
        backgroundColor: 'rgba(217,79,79,0.12)',
        tension: 0.3,
        pointRadius: 2,
      },
      {
        label: 'Wall Health',
        data: wallHealthSeries,
        borderColor: '#2F8F72',
        backgroundColor: 'rgba(47,143,114,0.12)',
        tension: 0.3,
        pointRadius: 2,
      },
      {
        label: 'Confidence (5-scan avg)',
        data: confidenceAvg,
        borderColor: '#E8873D',
        borderDash: [5, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.35,
      },
      {
        label: 'Wall Health (5-scan avg)',
        data: wallHealthAvg,
        borderColor: '#5B8FE8',
        borderDash: [5, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.35,
      },
    ],
  };

  const moistureSeries = chrono.map((h) => h.moisture);
  const moistureAvg = movingAverage(moistureSeries, 5);

  const thermalData = {
    labels,
    datasets: [
      {
        label: 'Thermal Δ (°C)',
        data: chrono.map((h) => h.thermalDelta),
        borderColor: '#E8A33D',
        backgroundColor: 'rgba(232,163,61,0.15)',
        tension: 0.3,
        pointRadius: 2,
      },
      {
        label: 'Moisture (%)',
        data: moistureSeries,
        borderColor: '#5B8FE8',
        backgroundColor: 'rgba(91,143,232,0.15)',
        tension: 0.3,
        pointRadius: 2,
      },
      {
        label: 'Moisture (5-scan avg)',
        data: moistureAvg,
        borderColor: '#8B99A0',
        borderDash: [5, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.35,
      },
    ],
  };

  const hasEnvData = chrono.some((h) => typeof h.airTemp === 'number' && h.airTemp !== 0);

  const envData = {
    labels,
    datasets: [
      {
        label: 'Air Temp (°C)',
        data: chrono.map((h) => (typeof h.airTemp === 'number' && h.airTemp !== 0 ? h.airTemp : null)),
        borderColor: '#E8873D',
        backgroundColor: 'rgba(232,135,61,0.12)',
        tension: 0.3,
        pointRadius: 2,
        spanGaps: true,
      },
      {
        label: 'Humidity (%)',
        data: chrono.map((h) => (typeof h.humidity === 'number' && h.humidity !== 0 ? h.humidity : null)),
        borderColor: '#3DB8E8',
        backgroundColor: 'rgba(61,184,232,0.12)',
        tension: 0.3,
        pointRadius: 2,
        spanGaps: true,
      },
    ],
  };

  if (history.length === 0) {
    return (
      <div className="bg-panel border border-line rounded-xl p-5">
        <h2 className="font-mono text-xs uppercase tracking-wider text-textDim mb-3">History Trends</h2>
        <p className="text-sm text-textDim">No scan history yet — capture some zones first.</p>
      </div>
    );
  }

  return (
    <div className="bg-panel border border-line rounded-xl p-5">
      <h2 className="font-mono text-xs uppercase tracking-wider text-textDim mb-4">History Trends</h2>

      <ChartSection
        title="Leak Confidence & Wall Health"
        stats={[
          { label: 'Avg Confidence', value: `${Math.round(avgField(chrono, 'confidence') ?? 0)}%` },
          { label: 'Peak Confidence', value: `${Math.max(...confidenceSeries)}%` },
          { label: 'Avg Wall Health', value: `${Math.round(avgField(chrono, 'wallHealth') ?? 0)}%` },
        ]}
      >
        <Line data={data} options={baseOptions} />
      </ChartSection>

      <ChartSection
        title="Sensor Readings"
        stats={[
          { label: 'Avg Moisture', value: `${(avgField(chrono, 'moisture') ?? 0).toFixed(1)}%` },
          { label: 'Avg Thermal Δ', value: `${(avgField(chrono, 'thermalDelta') ?? 0).toFixed(2)}°C` },
          { label: 'Avg Acoustic', value: `${Math.round(avgField(chrono, 'acoustic') ?? 0)}` },
        ]}
      >
        <Line data={thermalData} options={baseOptions} />
      </ChartSection>

      <div>
        <h3 className="font-mono text-[11px] uppercase tracking-wider text-textDim mb-3">Ambient Conditions</h3>
        {hasEnvData ? (
          <>
            <div className="flex gap-6 mb-3 font-mono text-[11px] text-textDim">
              <span>Avg Air Temp: <span className="text-text">{(avgField(chrono, 'airTemp') ?? 0).toFixed(1)}°C</span></span>
              <span>Avg Humidity: <span className="text-text">{(avgField(chrono, 'humidity') ?? 0).toFixed(1)}%</span></span>
            </div>
            <div className="h-56">
              <Line data={envData} options={baseOptions} />
            </div>
          </>
        ) : (
          <p className="text-xs text-textDim">
            No air temperature / humidity data captured yet — this fills in once scans include the DHT11 reading.
          </p>
        )}
      </div>
    </div>
  );
}

// Wraps a chart with a title row and a strip of quick summary stats
// (avg / peak) — turns a bare line chart into something that reads like a
// section of a proper monitoring report.
function ChartSection({ title, stats, children }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h3 className="font-mono text-[11px] uppercase tracking-wider text-textDim">{title}</h3>
        <div className="flex gap-4 font-mono text-[11px] text-textDim">
          {stats.map((s) => (
            <span key={s.label}>
              {s.label}: <span className="text-text">{s.value}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="h-56">{children}</div>
    </div>
  );
}
