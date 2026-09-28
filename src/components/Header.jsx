export default function Header({ deviceCount, max, btSupported }) {
  const isFull = deviceCount >= max;
  return (
    <header className="header">
      <div>
        <h1>MultiSpeaker</h1>
        <div className="subtitle">Synchronized playback for up to {max} speakers</div>
      </div>
      <div className="badges">
        <span className={`badge ${isFull ? 'warn' : 'ok'}`}>
          {deviceCount} / {max} devices
        </span>
        <span className={`badge ${btSupported ? 'ok' : 'err'}`}>
          {btSupported ? 'Web Bluetooth ✓' : 'No Bluetooth'}
        </span>
        <span className="badge">Adaptive Sync</span>
      </div>
    </header>
  );
}
