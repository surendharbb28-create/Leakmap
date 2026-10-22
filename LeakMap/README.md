# LeakMap — Firebase Edition

AI-powered leak detection: ESP32 handheld scanner → Firebase Realtime
Database → React dashboard. No local server, no database to install —
Firebase replaces the Django + MongoDB backend from the earlier version.

```
LeakMap/
  frontend/   React + Vite + Tailwind CSS + Chart.js + Firebase SDK
  esp32/      ESP32 firmware (Arduino sketch) — pushes straight to Firebase
```

## Architecture

```
ESP32 (moisture / MLX90614 thermal / acoustic sensors)
   |  HTTPS PUT to Firebase Realtime Database: /live.json
   |  (no IP address needed on the dashboard side — works over the internet,
   |   not just local WiFi)
   v
Firebase Realtime Database
   /live            <- ESP32 overwrites this continuously (current reading)
   /scans/{id}      <- every captured, scored reading (the permanent log)
   /latest/{zone}   <- most recent scored reading per zone (drives the wall map)
   |
   v
React dashboard (real-time listeners, no polling)
   - Live Wall Map, Zone Detail, History charts, CSV export
   - Leak Confidence Score computed client-side (logistic regression,
     same approach as the earlier Django version — just running in the
     browser instead of on a server)
```

**Why this shape:** the ESP32 only ever does one simple thing — push its
current reading to one fixed path. It doesn't need to know about zones,
scoring, or history; all of that logic lives in the React app, which reads
and writes Firebase directly. This is simpler to get right on embedded
hardware than trying to make the ESP32 talk to a custom REST API reliably.

## 1. Firebase setup (one-time, in the Firebase console)

1. Go to your project → **Realtime Database** → **Rules**, and set:
   ```json
   {
     "rules": {
       ".read": true,
       ".write": true
     }
   }
   ```
   This is intentionally open (no auth) so both the ESP32 and the browser
   can read/write without a login step — appropriate for a demo, **not**
   for a real deployment. See "Securing this for real" below.

2. Confirm the region in your database URL matches what's in the code
   (`asia-southeast1` in this project, per the config you provided).

The Firebase config (API key, project ID, etc.) is already filled in at
`frontend/src/firebase.js` and `esp32/esp32_leakmap_scanner.ino`. Firebase
web API keys are meant to be public — they identify your project, they
don't grant access on their own. Your **Rules** are what control access,
which is why step 1 matters.

## 2. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The top bar shows "Firebase connected" once
it's linked up — this happens automatically, no configuration needed.

## 3. ESP32 setup

Open `esp32/esp32_leakmap_scanner.ino` in the Arduino IDE:

1. Install the **Adafruit MLX90614 Library** (Library Manager)
2. Fill in `WIFI_SSID` / `WIFI_PASSWORD`
3. Adjust `MOISTURE_PIN` / `ACOUSTIC_PIN` if your wiring differs
4. Upload, then open Serial Monitor (115200 baud) — you should see
   `Firebase push OK (200): {...}` roughly every 1.5 seconds

That's it — no IP address to enter anywhere. The dashboard picks up the
live reading automatically because it's listening to the same Firebase
path. The ESP32 and the laptop/phone running the dashboard don't even need
to be on the same WiFi network — just both need internet access.

## Using it

1. On the Dashboard tab, click a zone on the wall map (e.g. `B2`)
2. Confirm the live reading at the top is updating
3. Click **Capture at B2** — this scores the current reading and writes it
   to Firebase; the zone lights up on the map
4. Click **Confirmed Leak** or **No Leak** on the zone card — this is your
   ground truth, and it retrains the model
5. Repeat for a few zones; check the Analytics tab to watch the model
   status flip from "Heuristic default" to "Trained (logistic regression)"
   once you've labeled 3+ examples of each class

## The AI model, honestly

`frontend/src/prediction.js` trains a logistic regression classifier
(3 features: moisture, thermal delta, acoustic — pure JS, no ML library)
on whatever labeled scans exist in Firebase, entirely in the browser.

**Cold start:** with fewer than 3 labeled examples in *both* the "leak" and
"dry" classes, there's nothing to train on — scores fall back to a fixed
weighted formula (45% moisture / 35% thermal / 20% acoustic). Once enough
labels exist, every capture (and every re-label) retrains the model fresh
and re-scores all currently-displayed zones.

Worth stating plainly in a report: 3+3 labeled samples is a *very* small
training set. This demonstrates the learning loop correctly but isn't
robust the way a model trained on hundreds of real, lab-verified wet/dry
readings would be. If you want something stronger for submission, collect
a proper labeled dataset from a controlled test rig before demo day, rather
than relying purely on labels gathered live during the demo.

## Securing this for real (beyond the demo)

Right now, anyone with your database URL can read or write your data —
fine for a college project, not for anything real. To harden it later:

- Switch Realtime Database rules to require Firebase Authentication
  (`.read`/`.write`: `"auth != null"`), and have the ESP32 authenticate
  with a service account or a long-lived database secret instead of
  writing anonymously
- Restrict the API key in Google Cloud Console to your specific app/domain
- Consider Firestore instead of Realtime Database if you later want more
  structured querying or per-document security rules

## What's intentionally not built yet

- **Authentication / user roles** — open read/write for the demo (see above)
- **PDF export** — CSV export is implemented; PDF would need `jsPDF` on
  the frontend
- **Offline queuing on the ESP32** — if WiFi drops mid-push, that one
  reading is simply lost; the next push 1.5s later will succeed once
  connectivity returns. Fine for a demo, worth hardening for real use.

## Troubleshooting

- **Dashboard never shows "Firebase connected"** — check the browser
  console for errors; double check `databaseURL` in `firebase.js` matches
  your project exactly, including region.
- **ESP32 Serial Monitor shows "Firebase push FAILED"** — check WiFi
  credentials, and check your Realtime Database Rules are set to allow
  writes (`.write: true` for the demo).
- **Dashboard shows a live reading but Capture does nothing** — make sure
  you've selected a zone on the wall map first (the Capture button is
  disabled until you do).
