import { detectPlatformCapabilities } from '../engine/capabilityDetector.js';

export default function LimitationReport({ devices, logs }) {
  const platform = detectPlatformCapabilities();

  const perDevice = devices.map((d) => {
    const notes = [];
    if (!d.leAudio) notes.push('LE Audio not available — using A2DP/SBC fallback.');
    if ((d.codecs || []).every((c) => c !== 'LC3')) notes.push('LC3 codec not detected.');
    if (d.estimatedLatencyMs > 160) notes.push('High estimated latency.');
    if (notes.length === 0) notes.push('No known limitations.');
    return { id: d.id, name: d.name, notes };
  });

  return (
    <div className="card">
      <h2><span className="dot" /> Limitation Report</h2>

      <div className="muted" style={{ marginBottom: 10 }}>
        <b style={{ color: 'var(--text)' }}>Platform:</b> {platform.note}
      </div>

      <div style={{ marginBottom: 12 }}>
        <span className={`badge ${platform.btSupported ? 'ok' : 'err'}`}>
          Bluetooth: {platform.btSupported ? 'Available' : 'Unavailable'}
        </span>{' '}
        <span className={`badge ${platform.leAudioAvailable ? 'ok' : 'warn'}`}>
          LE Audio: {platform.leAudioAvailable ? 'Available' : 'Limited'}
        </span>
      </div>

      {perDevice.length === 0 ? (
        <div className="empty">No devices connected.</div>
      ) : (
        <div className="device-list" style={{ marginBottom: 14 }}>
          {perDevice.map((d) => (
            <div key={d.id} className="device">
              <div className="device-name">{d.name}</div>
              <ul style={{ paddingLeft: 16, fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                {d.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ marginTop: 6 }}><span className="dot" /> Event Log</h2>
      <div className="logs">
        {logs.length === 0 ? (
          <div className="log">Awaiting events…</div>
        ) : (
          logs.slice().reverse().map((l, i) => (
            <div key={i} className={`log ${l.level}`}>
              [{l.t}] {l.msg}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
