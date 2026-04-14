import { useState, useEffect, useRef } from 'react';
import { generateWaveform } from '../data/mockData';

export default function Waveform({ label = 'SEISMIC', accent = '#00E5CC', intensity = 1, height = 60 }) {
  const canvasRef = useRef(null);
  const dataRef = useRef(generateWaveform(300, intensity));
  const offsetRef = useRef(0);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();

    const draw = () => {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      const data = dataRef.current;
      const offset = offsetRef.current;

      // Grid lines
      ctx.strokeStyle = '#1E1E22';
      ctx.lineWidth = 0.5;
      for (let y = 0; y < h; y += h / 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Center line
      ctx.strokeStyle = '#252529';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Waveform glow
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.15;
      ctx.filter = 'blur(3px)';
      ctx.beginPath();
      for (let i = 0; i < w; i++) {
        const idx = (i + Math.floor(offset)) % data.length;
        const val = data[idx] * (h * 0.35);
        if (i === 0) ctx.moveTo(i, h / 2 + val);
        else ctx.lineTo(i, h / 2 + val);
      }
      ctx.stroke();

      // Waveform main
      ctx.filter = 'none';
      ctx.globalAlpha = 1;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < w; i++) {
        const idx = (i + Math.floor(offset)) % data.length;
        const val = data[idx] * (h * 0.35);
        if (i === 0) ctx.moveTo(i, h / 2 + val);
        else ctx.lineTo(i, h / 2 + val);
      }
      ctx.stroke();

      // Sweep line
      const sweepX = (offset * 2) % w;
      ctx.strokeStyle = accent;
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sweepX, 0);
      ctx.lineTo(sweepX, h);
      ctx.stroke();
      ctx.globalAlpha = 1;

      offsetRef.current += 0.5;

      // Add new random data occasionally
      if (Math.random() > 0.97) {
        const spike = (Math.random() - 0.5) * 2 * intensity;
        dataRef.current[Math.floor(Math.random() * data.length)] = spike;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [accent, intensity]);

  return (
    <div className="bg-concrete border border-crack relative overflow-hidden"
      style={{ clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)' }}>
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-crack">
        <div className="w-[2px] h-2.5" style={{ background: accent }} />
        <span className="text-[8px] font-semibold tracking-[0.12em] uppercase text-stone">{label}</span>
      </div>
      <canvas ref={canvasRef} className="w-full" style={{ height: `${height}px` }} />
    </div>
  );
}
