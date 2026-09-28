// Adaptive Buffer Manager — recommends buffer size per device
export function recommendBuffer(device, networkJitter = 0.2) {
  const base = device?.state?.bufferMs ?? device?.estimatedLatencyMs ?? 120;
  // Jitter factor 0..1 (0 = stable, 1 = unstable)
  const jitterFactor = Math.max(0, Math.min(1, networkJitter));
  const recommended = base * (1 + jitterFactor * 0.5);
  const min = 60;
  const max = device?.maxBufferMs ?? 220;
  return Math.max(min, Math.min(max, recommended));
}

export function bufferStatus(bufferMs, maxBufferMs) {
  const ratio = bufferMs / maxBufferMs;
  if (ratio > 0.95) return { status: 'err', label: 'Buffer near capacity' };
  if (ratio > 0.75) return { status: 'warn', label: 'Buffer high' };
  return { status: 'ok', label: 'Buffer healthy' };
}
