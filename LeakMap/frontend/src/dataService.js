import { ref, onValue, set, push, update, remove, get } from 'firebase/database';
import { db } from './firebase.js';
import { scoreZone, wallHealth, statusLabel } from './prediction.js';

// ---------- Realtime subscriptions ----------

// ESP32 overwrites /live continuously with its current sensor reading.
// No IP address needed on the frontend at all — this works from anywhere
// with internet access, not just the same WiFi network as the scanner.
export function subscribeLive(callback) {
  return onValue(ref(db, 'live'), (snap) => callback(snap.val()));
}

// /latest/{zoneId} — one denormalized record per zone, drives the wall map.
export function subscribeLatest(callback) {
  return onValue(ref(db, 'latest'), (snap) => {
    callback(snap.val() || {});
  });
}

// /scans — every captured reading, newest first once sorted client-side.
export function subscribeScans(callback) {
  return onValue(ref(db, 'scans'), (snap) => {
    const val = snap.val() || {};
    const rows = Object.entries(val).map(([id, data]) => ({ id, ...data }));
    rows.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
    callback(rows);
  });
}

// Special Firebase path that reports this client's own connection state.
export function subscribeConnection(callback) {
  return onValue(ref(db, '.info/connected'), (snap) => callback(Boolean(snap.val())));
}

// ---------- Writes ----------

// Called when the user hits "Capture at Zone X". Reads current labeled
// scans to train/score, then writes a new record to /scans and mirrors it
// into /latest/{zone}.
export async function captureZone(zoneId, reading) {
  const scansSnap = await get(ref(db, 'scans'));
  const scansVal = scansSnap.val() || {};
  const scans = Object.values(scansVal);

  const { score, method } = scoreZone(reading, scans);
  const health = wallHealth(score);

  const record = {
    zone: zoneId,
    moisture: reading.moisture,
    thermalDelta: reading.thermalDelta,
    acoustic: reading.acoustic,
    airTemp: reading.airTemp ?? null,
    humidity: reading.humidity ?? null,
    label: 'unknown',
    confidence: score,
    wallHealth: health,
    status: statusLabel(score),
    scoreMethod: method,
    time: new Date().toISOString(),
  };

  const newRef = push(ref(db, 'scans'));
  await set(newRef, record);
  await set(ref(db, `latest/${zoneId}`), { ...record, scanId: newRef.key });
  return { id: newRef.key, ...record };
}

// Ground-truth labeling: updates the scan record's label, retrains, and
// re-scores every zone currently shown on the wall map so the whole map
// reflects the freshly trained model — not just the zone just labeled.
export async function labelScan(scanId, label) {
  await update(ref(db, `scans/${scanId}`), { label });
  await rescoreEverything();
}

async function rescoreEverything() {
  const scansSnap = await get(ref(db, 'scans'));
  const scansVal = scansSnap.val() || {};
  const scanEntries = Object.entries(scansVal);
  const scans = scanEntries.map(([id, data]) => ({ id, ...data }));

  const latestSnap = await get(ref(db, 'latest'));
  const latestVal = latestSnap.val() || {};

  const updates = {};
  for (const [zoneId, zoneData] of Object.entries(latestVal)) {
    const { score, method } = scoreZone(zoneData, scans);
    const health = wallHealth(score);
    updates[`latest/${zoneId}/confidence`] = score;
    updates[`latest/${zoneId}/wallHealth`] = health;
    updates[`latest/${zoneId}/status`] = statusLabel(score);
    updates[`latest/${zoneId}/scoreMethod`] = method;

    // keep the matching /scans record in sync too, if we can find it
    if (zoneData.scanId) {
      updates[`scans/${zoneData.scanId}/confidence`] = score;
      updates[`scans/${zoneData.scanId}/wallHealth`] = health;
      updates[`scans/${zoneData.scanId}/status`] = statusLabel(score);
      updates[`scans/${zoneData.scanId}/scoreMethod`] = method;
    }
  }
  if (Object.keys(updates).length > 0) {
    await update(ref(db), updates);
  }
}

export async function clearAllHistory() {
  await remove(ref(db, 'scans'));
  await remove(ref(db, 'latest'));
}

export async function getCurrentModelStatus() {
  const scansSnap = await get(ref(db, 'scans'));
  const scansVal = scansSnap.val() || {};
  const scans = Object.values(scansVal);
  const dataset = scans.filter((s) => s.label === 'leak' || s.label === 'dry');
  const positives = dataset.filter((s) => s.label === 'leak').length;
  const negatives = dataset.filter((s) => s.label === 'dry').length;
  const { model } = scoreZone({ moisture: 0, thermalDelta: 0, acoustic: 0 }, scans);
  return { trained: Boolean(model), samples: dataset.length, positives, negatives, model };
}
