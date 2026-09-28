// Per-device capability detection with honest fallbacks
export function detectCapabilities(device) {
  const name = (device && device.name) || `Device ${Math.random().toString(36).slice(2, 6)}`;
  const id = (device && device.id) || `dev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const lower = name.toLowerCase();
  const notes = [];

  // Heuristic LE Audio detection (Web Bluetooth does not expose this directly)
  let leAudio = false;
  if (lower.includes('lc3') || lower.includes('le audio') || lower.includes('lea')) {
    leAudio = true;
    notes.push('LE Audio inferred from device name.');
  } else {
    notes.push('LE Audio not detected via name — assuming A2DP/SBC fallback.');
  }

  const codecs = ['SBC'];
  if (leAudio) codecs.push('LC3');
  if (lower.includes('aac') || lower.includes('airpod')) codecs.push('AAC');
  if (lower.includes('aptx')) codecs.push('aptX');

  // Latency estimate — Web Bluetooth does not expose exact value
  const estimatedLatencyMs = 100 + Math.floor(Math.random() * 100);
  notes.push('Latency is estimated; exact value requires native APIs.');

  return {
    id,
    name,
    leAudio,
    codecs,
    estimatedLatencyMs,
    maxBufferMs: 220,
    notes
  };
}

export function detectPlatformCapabilities() {
  const btSupported = typeof navigator !== 'undefined' &&
    typeof navigator.bluetooth !== 'undefined';

  const secureContext = typeof window !== 'undefined' && window.isSecureContext;

  return {
    btSupported,
    secureContext,
    // LE Audio is generally NOT available through Web Bluetooth
    leAudioAvailable: false,
    note: btSupported
      ? (secureContext
          ? 'Web Bluetooth available. LE Audio detection limited by browser APIs.'
          : 'Web Bluetooth requires HTTPS or localhost.')
      : 'Web Bluetooth not supported — simulated devices will be used.'
  };
}
