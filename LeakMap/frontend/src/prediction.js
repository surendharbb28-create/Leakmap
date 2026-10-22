// Client-side Leak Confidence prediction engine.
//
// With no backend server, this logic runs in the browser: a small logistic
// regression classifier trained on whatever labeled scans exist in
// Firebase, with a fixed weighted-formula fallback for the cold-start case
// (not enough labeled data yet).

const MIN_SAMPLES_PER_CLASS = 3;
const LEARNING_RATE = 0.5;
const EPOCHS = 800;

export function computeFeatures(reading) {
  return [
    Math.min(1, (reading.moisture || 0) / 60),
    Math.min(1, (reading.thermalDelta || 0) / 5),
    Math.min(1, (reading.acoustic || 0) / 70),
  ];
}

function sigmoid(z) {
  if (z < -60) return 0;
  if (z > 60) return 1;
  return 1 / (1 + Math.exp(-z));
}

// dataset: [{ x:[m,t,a], label: 0|1 }, ...]
export function trainModel(dataset) {
  const positives = dataset.filter((d) => d.label === 1);
  const negatives = dataset.filter((d) => d.label === 0);
  if (positives.length < MIN_SAMPLES_PER_CLASS || negatives.length < MIN_SAMPLES_PER_CLASS) {
    return null;
  }

  let w = [0, 0, 0];
  let b = 0;
  const n = dataset.length;

  for (let e = 0; e < EPOCHS; e++) {
    let gw = [0, 0, 0];
    let gb = 0;
    dataset.forEach((d) => {
      const z = w[0]*d.x[0] + w[1]*d.x[1] + w[2]*d.x[2] + b;
      const pred = sigmoid(z);
      const err = pred - d.label;
      gw[0] += err*d.x[0]; gw[1] += err*d.x[1]; gw[2] += err*d.x[2];
      gb += err;
    });
    w[0] -= LEARNING_RATE*gw[0]/n; w[1] -= LEARNING_RATE*gw[1]/n; w[2] -= LEARNING_RATE*gw[2]/n;
    b -= LEARNING_RATE*gb/n;
  }

  return { w, b, samples: n, positives: positives.length, negatives: negatives.length };
}

export function scoreWithModel(reading, model) {
  const x = computeFeatures(reading);
  const z = model.w[0]*x[0] + model.w[1]*x[1] + model.w[2]*x[2] + model.b;
  const p = sigmoid(z);
  return Math.round(Math.max(0, Math.min(100, p * 100)));
}

export function scoreHeuristic(reading) {
  const x = computeFeatures(reading);
  const score = 100 * (0.45*x[0] + 0.35*x[1] + 0.20*x[2]);
  return Math.round(Math.max(0, Math.min(100, score)));
}

// scans: array of Firebase scan records (may include unlabeled ones)
export function buildTrainingSet(scans) {
  return scans
    .filter((s) => s.label === 'leak' || s.label === 'dry')
    .map((s) => ({ x: computeFeatures(s), label: s.label === 'leak' ? 1 : 0 }));
}

// Main entry point: scores a reading using the trained model if enough
// labeled data exists in `scans`, else the heuristic fallback.
// Returns { score, method, model }.
export function scoreZone(reading, scans) {
  const dataset = buildTrainingSet(scans);
  const model = trainModel(dataset);
  if (model) {
    return { score: scoreWithModel(reading, model), method: 'model', model };
  }
  return { score: scoreHeuristic(reading), method: 'heuristic', model: null };
}

export function wallHealth(score) {
  return Math.round(100 - score);
}

export function statusLabel(score) {
  if (score < 30) return 'LOW';
  if (score < 60) return 'MODERATE';
  if (score < 80) return 'HIGH';
  return 'CRITICAL';
}

// ---------------------------------------------------------------------
// Environmental Risk Index
// ---------------------------------------------------------------------
// A second, purely sensor-driven score for coloring the wall map — no ML
// involved, just moisture + thermal delta + ambient humidity. Useful
// before enough labeled scans exist to train the model, or whenever you
// want the raw sensor picture rather than a prediction.
//
// Same 0.45 / 0.35 / 0.20 weighting as scoreHeuristic() above, with
// humidity taking the third slot instead of acoustic.
const MOISTURE_SATURATION = 60;  // % — reading at/above this = max risk
const THERMAL_SATURATION = 5;    // °C delta — at/above this = max risk
const HUMIDITY_BASELINE = 50;    // % RH — normal indoor air, contributes 0 risk
const HUMIDITY_SATURATION = 90;  // % RH — at/above this = max risk

export function environmentalScore(reading) {
  const moisture = reading.moisture || 0;
  const thermalDelta = reading.thermalDelta || 0;
  const humidity = typeof reading.humidity === 'number' && reading.humidity !== 0 ? reading.humidity : HUMIDITY_BASELINE;

  const moistureNorm = Math.min(1, moisture / MOISTURE_SATURATION);
  const thermalNorm = Math.min(1, thermalDelta / THERMAL_SATURATION);
  const humidityNorm = Math.min(1, Math.max(0, (humidity - HUMIDITY_BASELINE) / (HUMIDITY_SATURATION - HUMIDITY_BASELINE)));

  const score = 100 * (0.45 * moistureNorm + 0.35 * thermalNorm + 0.20 * humidityNorm);
  return Math.round(Math.max(0, Math.min(100, score)));
}
