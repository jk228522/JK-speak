import { computeDrift } from '../engine/driftDetector.js';
import { bufferStatus } from '../engine/adaptiveBuffer.js';

export default function DeviceCard({ device, onRemove }) {
  const drift = device.state
    ? computeDrift(device.state, device.state.position - device.state.position + (device.state.position - device.state.position))
    : null;

  // Compute drift vs master (approximate; master time not available here —
  // we display relative offset and drift values from state)
  const offsetMs = device.state?.offsetMs ?? 0;
  const driftMs = device.state?.driftMs ?? 0;
  const latencyMs = device.state?.latencyMs ?? device.estimatedLatencyMs ?? 0;
  const bufferMs = device.state?.bufferMs ?? 0;
  const bStatus = bufferStatus(bufferMs, device.maxBufferMs || 220);

  const driftAbs = Math.abs(offsetMs + driftMs);
  const driftTag = driftAbs > 100 ? 'err' : driftAbs > 35 ? 'warn' : 'ok';

  return (
    <div className="device">
      <div className="device-head">
        <div className="device-name" title={device.name}>{device.name}</div>
        <button className="remove-btn" onClick={onRemove} title="Remove">✕</button>
      </div>

      <div className="device-tags">
        <span className={`tag ${device.leAudio ? 'ok' : 'warn'}`}>
          {device.leAudio ? 'LE Audio' : 'A2DP'}
        </span>
        {(device.codecs || []).slice(0, 2).map((c) => (
          <span key={c} className="tag">{c}</span>
        ))}
        <span className={`tag ${driftTag}`}>
          {driftTag === 'ok' ? 'In Sync' : driftTag === 'warn' ? 'Drifting' : 'Out of Sync'}
        </span>
      </div>

      <div className="device-metrics">
        <div className="metric">Latency <b>{latencyMs.toFixed(0)} ms</b></div>
        <div className="metric">Buffer <b>{bufferMs.toFixed(0)} ms</b></div>
        <div className="metric">Offset <b>{offsetMs.toFixed(1)} ms</b></div>
        <div className="metric">Drift <b>{driftMs.toFixed(1)} ms</b></div>
      </div>

      {bStatus.status !== 'ok' && (
        <div className={`tag ${bStatus.status}`} style={{ alignSelf: 'flex-start' }}>
          {bStatus.label}
        </div>
      )}
    </div>
  );
}
