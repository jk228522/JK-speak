import { useCallback, useEffect, useRef, useState } from 'react';
import { MasterClock } from './engine/masterClock.js';
import { BluetoothManager } from './engine/bluetoothManager.js';
import { detectCapabilities } from './engine/capabilityDetector.js';
import { SyncEngine } from './engine/syncEngine.js';
import { AudioEngine } from './audio/audioEngine.js';

import Header from './components/Header.jsx';
import BluetoothPanel from './components/BluetoothPanel.jsx';
import PlaybackControls from './components/PlaybackControls.jsx';
import Visualizer from './components/Visualizer.jsx';
import CalibrationPanel from './components/CalibrationPanel.jsx';
import LimitationReport from './components/LimitationReport.jsx';

const MAX_DEVICES = 5;

export default function App() {
  const clockRef = useRef(null);
  const syncRef = useRef(null);
  const audioRef = useRef(null);
  const btRef = useRef(null);

  if (!clockRef.current) clockRef.current = new MasterClock();
  if (!syncRef.current) syncRef.current = new SyncEngine(clockRef.current);
  if (!audioRef.current) audioRef.current = new AudioEngine();
  if (!btRef.current) btRef.current = new BluetoothManager();

  const [devices, setDevices] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(180);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [logs, setLogs] = useState([]);
  const [btSupported, setBtSupported] = useState(false);

  useEffect(() => {
    setBtSupported(BluetoothManager.isSupported());
  }, []);

  const log = useCallback((msg, level = 'info') => {
    setLogs((prev) => [...prev.slice(-99), {
      t: new Date().toLocaleTimeString(),
      msg,
      level
    }]);
  }, []);

  // Animation frame loop for position updates
  useEffect(() => {
    let raf = 0;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const t = clockRef.current.now();
      setPosition(t);

      // Update device states
      setDevices((prev) => {
        if (prev.length === 0) return prev;
        return prev.map((d) => {
          const s = syncRef.current.getDeviceState(d.id, t);
          return { ...d, state: s };
        });
      });

      // Auto-stop at end of audio
      const d = audioRef.current.duration();
      if (isPlaying && t >= d) {
        audioRef.current.pause();
        clockRef.current.pause();
        setIsPlaying(false);
        log('Playback finished', 'info');
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [isPlaying, log]);

  const addDeviceInternal = useCallback((caps) => {
    syncRef.current.registerDevice(caps.id);
    setDevices((prev) => [...prev, { ...caps, state: null }]);
  }, []);

  const addSimulatedDevice = useCallback(() => {
    setDevices((prev) => {
      if (prev.length >= MAX_DEVICES) return prev;
      const n = prev.length + 1;
      const caps = {
        id: `sim-${Date.now()}-${n}`,
        name: `Simulated Speaker ${n}`,
        leAudio: Math.random() > 0.5,
        codecs: ['SBC', Math.random() > 0.5 ? 'LC3' : 'AAC'],
        estimatedLatencyMs: 100 + Math.floor(Math.random() * 120),
        maxBufferMs: 220,
        notes: ['Simulated device (Web Bluetooth unavailable).']
      };
      syncRef.current.registerDevice(caps.id);
      log(`Added simulated device: ${caps.name}`, 'info');
      return [...prev, { ...caps, state: null }];
    });
  }, [log]);

  const handleAddDevice = useCallback(async () => {
    if (devices.length >= MAX_DEVICES) {
      log(`Max ${MAX_DEVICES} devices reached.`, 'warn');
      return;
    }
    if (!btSupported) {
      log('Web Bluetooth unavailable — adding simulated device.', 'warn');
      addSimulatedDevice();
      return;
    }
    try {
      const device = await btRef.current.requestDevice();
      const caps = detectCapabilities(device);
      addDeviceInternal(caps);
      log(`Added device: ${caps.name}`, 'success');
    } catch (err) {
      if (err && (err.name === 'NotFoundError' || /cancel/i.test(err.message || ''))) {
        log('Device selection cancelled.', 'info');
      } else {
        log(`Add failed: ${err.message}. Using simulated device.`, 'warn');
        addSimulatedDevice();
      }
    }
  }, [devices.length, btSupported, addDeviceInternal, addSimulatedDevice, log]);

  const handleRemoveDevice = useCallback((id) => {
    syncRef.current.unregisterDevice(id);
    setDevices((prev) => prev.filter((d) => d.id !== id));
    log(`Removed device ${id}`, 'info');
  }, [log]);

  const handlePlay = useCallback(async () => {
    if (isPlaying) return;
    try {
      await audioRef.current.init();
      if (!audioRef.current.audioEl && !audioRef.current.oscillator) {
        await audioRef.current.startTone();
      }
      const d = audioRef.current.duration();
      if (isFinite(d) && d > 0) setDuration(d);
      await audioRef.current.play();
      clockRef.current.start();
      setIsPlaying(true);
      syncRef.current.broadcastSeek(clockRef.current.now());
      log('▶ Playback started', 'success');
    } catch (err) {
      log(`Play failed: ${err.message}`, 'error');
    }
  }, [isPlaying, log]);

  const handlePause = useCallback(() => {
    audioRef.current.pause();
    clockRef.current.pause();
    setIsPlaying(false);
    log('⏸ Playback paused', 'info');
  }, [log]);

  const handleSeek = useCallback((t) => {
    const clamped = Math.max(0, Math.min(duration, t));
    const wasPlaying = isPlaying;

    if (wasPlaying) {
      audioRef.current.pause();
      clockRef.current.pause();
    }

    audioRef.current.seek(clamped);
    clockRef.current.setTime(clamped);
    syncRef.current.broadcastSeek(clamped);

    if (wasPlaying) {
      audioRef.current.play();
    }
    setPosition(clamped);
    setIsPlaying(wasPlaying);
    log(`Seek → ${clamped.toFixed(2)}s`, 'info');
  }, [duration, isPlaying, log]);

  const handleFile = useCallback(async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      await audioRef.current.loadFile(file);
      setSelectedFileName(file.name);
      const d = audioRef.current.duration();
      if (isFinite(d) && d > 0) setDuration(d);
      log(`Loaded audio: ${file.name}`, 'success');
    } catch (err) {
      log(`Failed to load file: ${err.message}`, 'error');
    }
  }, [log]);

  const handleCalibrate = useCallback(() => {
    devices.forEach((d) => syncRef.current.applyCorrection(d.id));
    log('🎯 Calibration applied — offsets nudged toward master.', 'success');
  }, [devices, log]);

  return (
    <div className="app">
      <Header
        deviceCount={devices.length}
        max={MAX_DEVICES}
        btSupported={btSupported}
      />

      <div className="layout">
        <div className="col">
          <BluetoothPanel
            devices={devices}
            max={MAX_DEVICES}
            onAdd={handleAddDevice}
            onRemove={handleRemoveDevice}
            onFile={handleFile}
            selectedFileName={selectedFileName}
          />
          <CalibrationPanel devices={devices} onCalibrate={handleCalibrate} />
        </div>

        <div className="col">
          <Visualizer audio={audioRef.current} isPlaying={isPlaying} />
          <PlaybackControls
            isPlaying={isPlaying}
            position={position}
            duration={duration}
            onPlay={handlePlay}
            onPause={handlePause}
            onSeek={handleSeek}
          />
        </div>

        <div className="col">
          <LimitationReport devices={devices} logs={logs} />
        </div>
      </div>
    </div>
  );
}
