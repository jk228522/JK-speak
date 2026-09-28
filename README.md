# MultiSpeaker

Synchronized multi-device audio control for up to **5 Bluetooth speakers**.
Web-based control surface with Master Clock, Adaptive Sync, Drift Detection, and per-device capability reporting.

## Features
- Bluetooth discovery (Web Bluetooth API) with **simulated device fallback**
- Per-device capability detection (codecs, LE Audio heuristic, latency)
- Master Clock as single source of truth
- Adaptive Buffer Manager & Drift Detector
- Per-device Calibration
- RGB Audio Visualizer (Web Audio API)
- Liquid Glass UI
- Honest Limitation Report — no silent failures

## Local development
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Deploy
Push to `main` — GitHub Actions will build and deploy to GitHub Pages automatically.
Make sure in **Settings → Pages**, source is set to **GitHub Actions**.

## Browser support
- ✅ Chrome / Edge (Web Bluetooth)
- ⚠️ Safari / Firefox: Bluetooth unavailable → simulated devices used
- 🔒 Requires HTTPS or `localhost` for Web Bluetooth

## Notes on real speaker sync
True sample-accurate sync across independent Bluetooth sinks requires
**native APIs** (Android `LE Audio` / `AudioTrack` with timestamped writes).
This web version provides the control surface, sync math, and monitoring;
the native bridge would be added in the Android companion build.
