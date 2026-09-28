import DeviceCard from './DeviceCard.jsx';

export default function BluetoothPanel({
  devices,
  max,
  onAdd,
  onRemove,
  onFile,
  selectedFileName
}) {
  const disabled = devices.length >= max;
  return (
    <div className="card">
      <h2><span className="dot" /> Devices</h2>

      <button
        className="btn primary full"
        onClick={onAdd}
        disabled={disabled}
        style={{ marginBottom: 12 }}
      >
        {disabled ? `Max ${max} reached` : '+ Add Bluetooth Device'}
      </button>

      <label className="file-label" style={{ marginBottom: 14 }}>
        {selectedFileName ? `🎵 ${selectedFileName}` : '📁 Load audio file (optional)'}
        <input type="file" accept="audio/*" onChange={onFile} />
      </label>

      {devices.length === 0 ? (
        <div className="empty">
          No devices yet. Add up to {max} Bluetooth speakers to begin.
        </div>
      ) : (
        <div className="device-list">
          {devices.map((d) => (
            <DeviceCard key={d.id} device={d} onRemove={() => onRemove(d.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
