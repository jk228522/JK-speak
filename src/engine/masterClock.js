// Master Clock — single source of truth for playback time
export class MasterClock {
  constructor() {
    this.startTime = null;
    this.isRunning = false;
    this.listeners = new Set();
  }

  start() {
    if (this.isRunning) return;
    const offset = this.startTime !== null
      ? performance.now() - this.startTime
      : 0;
    this.startTime = performance.now() - offset;
    this.isRunning = true;
    this._notify();
  }

  pause() {
    if (!this.isRunning) return;
    this.isRunning = false;
    this._notify();
  }

  reset() {
    this.startTime = null;
    this.isRunning = false;
    this._notify();
  }

  setTime(seconds) {
    this.startTime = performance.now() - seconds * 1000;
    this.isRunning = true;
    this._notify();
  }

  now() {
    if (this.startTime === null) return 0;
    const elapsed = (performance.now() - this.startTime) / 1000;
    return elapsed < 0 ? 0 : elapsed;
  }

  subscribe(fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  _notify() {
    const t = this.now();
    this.listeners.forEach((fn) => {
      try { fn(t, this.isRunning); } catch (_) { /* noop */ }
    });
  }
}
