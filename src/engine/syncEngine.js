// Sync Engine — tracks per-device offset, drift, buffer
export class SyncEngine {
  constructor(masterClock) {
    this.clock = masterClock;
    this.devices = new Map();
  }

  registerDevice(id, seed) {
    const r = seed !== undefined ? seed : Math.random();
    this.devices.set(id, {
      // Initial offset ±60ms
      offset: (r - 0.5) * 0.12,
      // Drift ±6ms per second
      driftPerSec: (Math.random() - 0.5) * 0.012,
      // Buffer 90-220ms
      bufferMs: 90 + Math.random() * 130,
      // Last correction timestamp
      lastCorrected: performance.now()
    });
  }

  unregisterDevice(id) {
    this.devices.delete(id);
  }

  getDeviceState(id, masterTime) {
    const d = this.devices.get(id);
    if (!d) return null;

    const elapsed = Math.max(0, masterTime);
    const drift = d.driftPerSec * elapsed;
    const position = masterTime + d.offset + drift;
    const latencyMs = d.bufferMs + Math.abs(d.offset + drift) * 1000;

    return {
      position,
      offset: d.offset,
      drift,
      bufferMs: d.bufferMs,
      latencyMs,
      driftMs: drift * 1000,
      offsetMs: d.offset * 1000
    };
  }

  applyCorrection(id) {
    const d = this.devices.get(id);
    if (!d) return;
    // Smooth correction: pull offset 85% toward zero
    d.offset = d.offset * 0.15;
    d.driftPerSec = d.driftPerSec * 0.5;
    d.lastCorrected = performance.now();
  }

  broadcastSeek(_time) {
    // In a native implementation this would push a seek command
    // to each connected device. In browser we only adjust bookkeeping.
    this.devices.forEach((d) => {
      d.lastCorrected = performance.now();
    });
  }
}
