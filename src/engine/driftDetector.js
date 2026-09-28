// Drift Detector — measures deviation between each device and master clock
export function computeDrift(deviceState, masterTime) {
  if (!deviceState) {
    return { driftMs: 0, status: 'unknown' };
  }
  const driftMs = (deviceState.position - masterTime) * 1000;
  const abs = Math.abs(driftMs);

  let status = 'ok';
  if (abs > 100) status = 'err';
  else if (abs > 35) status = 'warn';

  return { driftMs, status };
}

export function summarizeSync(devices, masterTime) {
  if (!devices || devices.length === 0) {
    return { worst: 0, avg: 0, status: 'idle' };
  }
  let worst = 0;
  let sum = 0;
  let count = 0;
  devices.forEach((d) => {
    if (!d.state) return;
    const drift = Math.abs((d.state.position - masterTime) * 1000);
    worst = Math.max(worst, drift);
    sum += drift;
    count += 1;
  });
  const avg = count ? sum / count : 0;
  let status = 'ok';
  if (worst > 100) status = 'err';
  else if (worst > 35) status = 'warn';
  return { worst, avg, status };
}
