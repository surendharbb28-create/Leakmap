import { useState, useEffect, useMemo } from 'react';
import WallMap from '../components/WallMap.jsx';
import ZoneCard from '../components/ZoneCard.jsx';
import Gauge from '../components/Gauge.jsx';
import StatCard from '../components/StatCard.jsx';
import AlertsPanel from '../components/AlertsPanel.jsx';
import { subscribeLive, subscribeLatest, subscribeScans, captureZone, labelScan } from '../dataService.js';
import { groupByZone } from '../utils.js';
import { IconThermometer, IconDroplet, IconWaveform, IconShield, IconGrid, IconClock, IconActivity } from '../components/Icons.jsx';

const RISK_COLOR = { LOW: '#2F8F72', MODERATE: '#E8A33D', HIGH: '#E8873D', CRITICAL: '#D94F4F', '—': '#8B99A0' };

export default function Home() {
  const [latestByZone, setLatestByZone] = useState({});
  const [selectedZone, setSelectedZone] = useState(null);
  const [liveReading, setLiveReading] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [scans, setScans] = useState([]);

  // Real-time: no polling, no IP address — Firebase pushes updates to us
  // the moment the ESP32 writes /live or a capture writes /latest.
  useEffect(() => {
    const unsubLive = subscribeLive(setLiveReading);
    const unsubLatest = subscribeLatest(setLatestByZone);
    const unsubScans = subscribeScans(setScans);
    return () => { unsubLive(); unsubLatest(); unsubScans(); };
  }, []);

  // Per-zone chronological scan history, for the trend sparkline in
  // ZoneCard — computed client-side from the same /scans data Analytics
  // uses, so no extra Firebase reads are needed.
  const scansByZone = useMemo(() => groupByZone(scans), [scans]);

  async function handleCapture() {
    if (!selectedZone || !liveReading) return;
    setCapturing(true);
    try {
      await captureZone(selectedZone, liveReading);
      setStatusMsg(`Captured ${selectedZone}.`);
    } catch (err) {
      setStatusMsg('Capture failed: ' + err.message);
    } finally {
      setCapturing(false);
    }
  }

  async function handleLabel(zoneId, label) {
    const data = latestByZone[zoneId];
    if (!data || !data.scanId) return;
    try {
      await labelScan(data.scanId, label);
      setStatusMsg(`Labeled ${zoneId} as ${label.toUpperCase()}. Model retrained.`);
    } catch (err) {
      setStatusMsg('Labeling failed: ' + err.message);
    }
  }

  const zoneList = Object.values(latestByZone);
  const avgHealth = zoneList.length
    ? Math.round(zoneList.reduce((s, z) => s + z.wallHealth, 0) / zoneList.length)
    : null;
  const maxConfidence = zoneList.length ? Math.max(...zoneList.map((z) => z.confidence)) : null;
  const riskLabel =
    maxConfidence === null ? '—' :
    maxConfidence < 30 ? 'LOW' :
    maxConfidence < 60 ? 'MODERATE' :
    maxConfidence < 80 ? 'HIGH' : 'CRITICAL';

  const hasAirTemp = liveReading && typeof liveReading.airTemp === 'number' && liveReading.airTemp !== 0;
  const hasHumidity = liveReading && typeof liveReading.humidity === 'number' && liveReading.humidity !== 0;

  return (
    <div>
      {/* Headline row: wall health gauge + key readouts */}
      <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-4 mb-6">
        <div className="bg-panel border border-line rounded-xl p-5 flex items-center">
          <Gauge value={avgHealth} label="Wall Health" invert size={104} thickness={9} />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Leak Risk" value={riskLabel} color={RISK_COLOR[riskLabel]} icon={IconShield} />
          <StatCard label="Zones Scanned" value={zoneList.length} icon={IconGrid} sub="of 16 wall zones" />
          <StatCard
            label="Air Temperature"
            value={hasAirTemp ? `${liveReading.airTemp.toFixed(1)}°C` : '—'}
            icon={IconThermometer}
            sub="ambient · DHT11"
          />
          <StatCard
            label="Humidity"
            value={hasHumidity ? `${liveReading.humidity.toFixed(1)}%` : '—'}
            icon={IconDroplet}
            sub="ambient · DHT11"
          />
        </div>
      </div>

      {/* Secondary readouts: live sensor detail + total captured scans */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Moisture"
          value={liveReading ? `${liveReading.moisture.toFixed(1)}%` : '—'}
          icon={IconDroplet}
          sub="live · capacitive probe"
        />
        <StatCard
          label="Thermal Δ"
          value={liveReading ? `+${liveReading.thermalDelta.toFixed(2)}°C` : '—'}
          icon={IconThermometer}
          sub="live · MLX90614 IR"
        />
        <StatCard
          label="Acoustic Index"
          value={liveReading ? Math.round(liveReading.acoustic) : '—'}
          icon={IconWaveform}
          sub="live · piezo sensor"
        />
        <StatCard
          label="Total Scans Logged"
          value={scans.length}
          icon={IconActivity}
          sub="all zones, all time"
        />
      </div>

      {/* Live scanner feed */}
      <div className="bg-panel border border-line rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="relative flex h-2.5 w-2.5">
            {liveReading && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: '#2F8F72' }} />
            )}
            <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: liveReading ? '#2F8F72' : '#8B99A0' }} />
          </span>

          {liveReading ? (
            <div className="flex items-center gap-4 flex-wrap font-mono text-xs text-textDim">
              <span className="flex items-center gap-1.5"><IconDroplet width={13} height={13} /> {liveReading.moisture.toFixed(1)}% moist</span>
              <span className="flex items-center gap-1.5"><IconThermometer width={13} height={13} /> +{liveReading.thermalDelta.toFixed(2)}°C Δ</span>
              <span className="flex items-center gap-1.5"><IconWaveform width={13} height={13} /> {Math.round(liveReading.acoustic)} acou.</span>
              {hasAirTemp && <span className="flex items-center gap-1.5"><IconThermometer width={13} height={13} /> {liveReading.airTemp.toFixed(1)}°C air</span>}
              {hasHumidity && <span className="flex items-center gap-1.5"><IconDroplet width={13} height={13} /> {liveReading.humidity.toFixed(1)}% RH</span>}
              {liveReading.ts && (
                <span className="flex items-center gap-1.5 opacity-70"><IconClock width={13} height={13} /> scanner up {formatUptime(liveReading.ts)}</span>
              )}
            </div>
          ) : (
            <span className="font-mono text-xs text-textDim">Waiting for scanner to publish a reading to Firebase (/live)…</span>
          )}

          <button
            onClick={handleCapture}
            disabled={!selectedZone || !liveReading || capturing}
            className="font-mono text-xs font-semibold px-4 py-2 rounded-md bg-warn text-black disabled:opacity-40 ml-auto transition-opacity"
          >
            {capturing ? 'Capturing…' : `⬤ Capture at ${selectedZone || '…'}`}
          </button>
        </div>
        {statusMsg && (
          <div className="font-mono text-[11px] text-textDim mt-3 pt-3 border-t border-line">{statusMsg}</div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <WallMap latestByZone={latestByZone} selectedZone={selectedZone} onSelect={setSelectedZone} />
        <ZoneCard
          zoneId={selectedZone}
          data={selectedZone ? latestByZone[selectedZone] : null}
          onLabel={handleLabel}
          trend={selectedZone ? scansByZone[selectedZone] : null}
        />
      </div>

      <AlertsPanel zones={zoneList} threshold={60} title="Active Alerts — Zones Above 60% Confidence" />
    </div>
  );
}

// The ESP32 reports millis() as `ts` — its own uptime, not wall-clock time.
// Format it as a short duration rather than a bogus timestamp.
function formatUptime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
