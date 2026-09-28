import { useEffect, useRef } from 'react';

export default function Visualizer({ audio, isPlaying }) {
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let running = true;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      if (!running) return;
      rafRef.current = requestAnimationFrame(draw);

      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      // Fade for trail effect
      ctx.fillStyle = 'rgba(2, 3, 8, 0.22)';
      ctx.fillRect(0, 0, w, h);

      const freq = audio && audio.analyser ? audio.getFrequencyData() : null;
      const wave = audio && audio.analyser ? audio.getWaveformData() : null;

      phaseRef.current += 0.03;

      const bars = 64;
      const barW = w / bars;

      for (let i = 0; i < bars; i++) {
        let amp;
        if (freq && isPlaying) {
          const idx = Math.floor((i / bars) * freq.length * 0.6);
          amp = freq[idx] / 255;
        } else {
          // Idle gentle animation
          amp = 0.08 + 0.06 * Math.sin(phaseRef.current + i * 0.35);
        }

        const barH = Math.max(2, amp * h * 0.75);
        const x = i * barW;
        const y = h - barH;

        const hue = (i / bars) * 300 + phaseRef.current * 30;
        const grad = ctx.createLinearGradient(0, y, 0, h);
        grad.addColorStop(0, `hsla(${hue}, 95%, 65%, 0.95)`);
        grad.addColorStop(1, `hsla(${hue + 40}, 95%, 45%, 0.15)`);

        ctx.fillStyle = grad;
        ctx.fillRect(x + 1, y, barW - 2, barH);
      }

      // Waveform overlay
      if (wave && isPlaying) {
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < wave.length; i++) {
          const x = (i / wave.length) * w;
          const v = (wave[i] - 128) / 128;
          const y = h / 2 + v * h * 0.15;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    };

    draw();

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [audio, isPlaying]);

  return (
    <div className="viz-wrap">
      <div className="viz-overlay">
        <span>SPECTRUM · RGB</span>
        <span>{isPlaying ? 'LIVE' : 'IDLE'}</span>
      </div>
      <canvas ref={canvasRef} className="viz-canvas" />
    </div>
  );
}
