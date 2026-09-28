// Audio Engine — Web Audio playback + analyser for visualizer
export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.analyser = null;
    this.gainNode = null;
    this.source = null;
    this.audioEl = null;
    this.oscillator = null;
    this.isPlaying = false;
    this.fileName = '';
    this._freqData = null;
  }

  async init() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) throw new Error('Web Audio API not supported.');
    this.ctx = new Ctx();
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0.7;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
    this._freqData = new Uint8Array(this.analyser.frequencyBinCount);
  }

  async loadFile(file) {
    await this.init();

    // Stop any existing playback
    this.pause();
    if (this.audioEl) {
      try { URL.revokeObjectURL(this.audioEl.src); } catch (_) {}
      this.audioEl = null;
      this.source = null;
    }
    this.stopTone();

    const url = URL.createObjectURL(file);
    const el = new Audio();
    el.src = url;
    el.crossOrigin = 'anonymous';
    el.preload = 'auto';

    // Wait for metadata so duration is known
    await new Promise((resolve, reject) => {
      const onLoaded = () => { cleanup(); resolve(); };
      const onError = () => { cleanup(); reject(new Error('Failed to load audio file.')); };
      const cleanup = () => {
        el.removeEventListener('loadedmetadata', onLoaded);
        el.removeEventListener('error', onError);
      };
      el.addEventListener('loadedmetadata', onLoaded);
      el.addEventListener('error', onError);
      setTimeout(() => { cleanup(); resolve(); }, 3000);
    });

    this.audioEl = el;
    try {
      this.source = this.ctx.createMediaElementSource(el);
      this.source.connect(this.gainNode);
    } catch (err) {
      // Fallback: play without analyser path
      el.volume = 0.8;
    }
    this.fileName = file.name;
  }

  async startTone() {
    await this.init();
    if (this.oscillator) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 110;

    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.25;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 40;
    lfo.connect(lfoGain).connect(osc.frequency);
    lfo.start();

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    osc.connect(filter).connect(this.gainNode);
    osc.start();
    this.oscillator = { osc, lfo };
  }

  stopTone() {
    if (this.oscillator) {
      try { this.oscillator.osc.stop(); } catch (_) {}
      try { this.oscillator.lfo.stop(); } catch (_) {}
      try { this.oscillator.osc.disconnect(); } catch (_) {}
      try { this.oscillator.lfo.disconnect(); } catch (_) {}
      this.oscillator = null;
    }
  }

  async play() {
    await this.init();
    if (this.ctx.state === 'suspended') {
      try { await this.ctx.resume(); } catch (_) {}
    }
    if (this.audioEl) {
      try { await this.audioEl.play(); } catch (_) {}
    }
    this.isPlaying = true;
  }

  pause() {
    if (this.audioEl) {
      try { this.audioEl.pause(); } catch (_) {}
    }
    this.isPlaying = false;
  }

  seek(t) {
    if (this.audioEl && isFinite(t)) {
      try { this.audioEl.currentTime = Math.max(0, t); } catch (_) {}
    }
  }

  currentTime() {
    return this.audioEl ? this.audioEl.currentTime : 0;
  }

  duration() {
    return this.audioEl && isFinite(this.audioEl.duration)
      ? this.audioEl.duration
      : 180;
  }

  getFrequencyData() {
    if (!this.analyser || !this._freqData) return null;
    this.analyser.getByteFrequencyData(this._freqData);
    return this._freqData;
  }

  getWaveformData() {
    if (!this.analyser) return null;
    const data = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(data);
    return data;
  }
}
