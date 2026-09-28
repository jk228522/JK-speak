function fmt(t) {
  if (!isFinite(t) || t < 0) t = 0;
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlaybackControls({
  isPlaying,
  position,
  duration,
  onPlay,
  onPause,
  onSeek
}) {
  const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;

  const handleBarClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <div className="card">
      <h2><span className="dot" /> Master Timeline</h2>

      <div className="big-time">{fmt(position)}</div>

      <div className="controls" style={{ marginTop: 16 }}>
        <div className="timeline" onClick={handleBarClick}>
          <div className="timeline-fill" style={{ width: `${pct}%` }} />
        </div>

        <div className="time-labels">
          <span>{fmt(position)}</span>
          <span>{fmt(duration)}</span>
        </div>

        <div className="controls-row">
          <button
            className="btn btn-icon"
            onClick={() => onSeek(Math.max(0, position - 10))}
            title="Back 10s"
          >⏪</button>

          {isPlaying ? (
            <button className="btn primary btn-icon" onClick={onPause} title="Pause">⏸</button>
          ) : (
            <button className="btn primary btn-icon" onClick={onPlay} title="Play">▶</button>
          )}

          <button
            className="btn btn-icon"
            onClick={() => onSeek(Math.min(duration, position + 10))}
            title="Forward 10s"
          >⏩</button>
        </div>
      </div>
    </div>
  );
}
