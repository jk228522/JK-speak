export default function CalibrationPanel({ devices, onCalibrate }) {
  const hasDevices = devices.length > 0;
  return (
    <div className="card">
      <h2><span className="dot" /> Calibration</h2>
      <p className="muted" style={{ marginBottom: 12 }}>
        Measures and corrects per-device offset & drift against the master clock.
        Run after all devices are connected.
      </p>
      <button
        className="btn primary full"
        onClick={onCalibrate}
        disabled={!hasDevices}
      >
        {hasDevices ? '🎯 Run Calibration' : 'Add devices first'}
      </button>
    </div>
  );
}
