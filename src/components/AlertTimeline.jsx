import { useState, useEffect, useRef } from 'react';
import { ALERTS, generateWaveform } from '../data/mockData';
import Waveform from './Waveform';

const SEVERITY_STYLES = {
  critical: { bar: '#FF4444', bg: 'rgba(255,68,68,0.04)', text: 'text-magma', badge: 'bg-magma/15 text-magma' },
  warning: { bar: '#FF9142', bg: 'rgba(255,145,66,0.03)', text: 'text-ember', badge: 'bg-ember/15 text-ember' },
  minor: { bar: '#4A4944', bg: 'transparent', text: 'text-fossil', badge: 'bg-fossil/15 text-fossil' },
  nominal: { bar: '#00E5CC', bg: 'transparent', text: 'text-sensor', badge: 'bg-sensor/15 text-sensor' },
};

const TYPE_LABELS = {
  PROPAGATION: 'PROP',
  NEW_CRACK: 'NEW',
  SENSOR_FAULT: 'SENS',
  THRESHOLD: 'THRS',
  ENVIRONMENT: 'ENV',
  SYSTEM: 'SYS',
};

function SeismicStrip() {
  const canvasRef = useRef(null);
  const dataRef = useRef(generateWaveform(500, 0.8));
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
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      const data = dataRef.current;
      const offset = offsetRef.current;

      // Paper-like background lines
      ctx.strokeStyle = '#1E1E22';
      ctx.lineWidth = 0.3;
      for (let y = 0; y < h; y += 8) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }

      // Draw multiple channels
      const channels = 3;
      const channelHeight = h / channels;

      const colors = ['#FF6B2C', '#00E5CC', '#FF4444'];
      const intensities = [1, 0.6, 1.3];

      for (let ch = 0; ch < channels; ch++) {
        const cy = channelHeight * ch + channelHeight / 2;
        const color = colors[ch];
        const intensity = intensities[ch];

        // Channel separator
        if (ch > 0) {
          ctx.strokeStyle = '#252529';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, channelHeight * ch);
          ctx.lineTo(w, channelHeight * ch);
          ctx.stroke();
        }

        // Channel label
        ctx.fillStyle = '#4A4944';
        ctx.font = '8px JetBrains Mono';
        ctx.fillText(`CH${ch + 1}`, 4, channelHeight * ch + 12);

        // Glow
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.08;
        ctx.filter = 'blur(4px)';
        ctx.beginPath();
        for (let i = 0; i < w; i++) {
          const idx = (i + Math.floor(offset * (1 + ch * 0.3))) % data.length;
          const val = data[idx] * channelHeight * 0.35 * intensity;
          if (i === 0) ctx.moveTo(i, cy + val);
          else ctx.lineTo(i, cy + val);
        }
        ctx.stroke();

        // Main line
        ctx.filter = 'none';
        ctx.globalAlpha = 0.8;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        for (let i = 0; i < w; i++) {
          const idx = (i + Math.floor(offset * (1 + ch * 0.3))) % data.length;
          const val = data[idx] * channelHeight * 0.35 * intensity;
          if (i === 0) ctx.moveTo(i, cy + val);
          else ctx.lineTo(i, cy + val);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Time markers at bottom
      ctx.fillStyle = '#4A4944';
      ctx.font = '7px JetBrains Mono';
      const now = new Date();
      for (let i = 0; i < 8; i++) {
        const x = (i / 7) * w;
        const t = new Date(now.getTime() - (7 - i) * 3600000);
        ctx.fillText(t.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }), x + 2, h - 3);
      }

      offsetRef.current += 0.3;

      // Random spikes
      if (Math.random() > 0.98) {
        const idx = Math.floor(Math.random() * data.length);
        dataRef.current[idx] = (Math.random() - 0.5) * 3;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

function AlertItem({ alert, isNew }) {
  const style = SEVERITY_STYLES[alert.severity];
  const time = new Date(alert.time);
  const timeStr = time.toLocaleTimeString('en-US', { hour12: false });

  return (
    <div
      className="border border-crack relative group hover:border-fossil transition-all duration-300"
      style={{
        background: style.bg,
        animation: isNew ? 'fault-pulse 2s ease-in-out infinite' : undefined,
        clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)',
      }}
    >
      {/* Severity bar */}
      <div className="absolute top-0 left-0 w-[2px] h-full" style={{ background: style.bar }} />

      <div className="p-3 pl-4">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className={`text-[8px] font-bold tracking-[0.1em] uppercase px-1.5 py-0.5 ${style.badge}`}>
              {TYPE_LABELS[alert.type]}
            </span>
            <span className={`text-[8px] font-semibold tracking-[0.08em] uppercase ${style.text}`}>
              {alert.severity}
            </span>
            {alert.crackId && (
              <span className="text-[9px] text-sensor font-medium">{alert.crackId}</span>
            )}
          </div>
          <span className="text-[9px] text-fossil tabular-nums">{timeStr}</span>
        </div>
        <p className="text-[11px] text-stone leading-relaxed m-0">
          {alert.message}
        </p>
      </div>
    </div>
  );
}

export default function AlertTimeline() {
  const [filter, setFilter] = useState('ALL');
  const filters = ['ALL', 'CRITICAL', 'WARNING', 'MINOR'];

  const filtered = ALERTS.filter(a =>
    filter === 'ALL' || a.severity.toUpperCase() === filter
  );

  return (
    <div className="h-full flex flex-col gap-[2px] p-[2px] overflow-hidden">
      {/* Seismic strip — full width */}
      <div className="h-52 bg-concrete border border-crack shrink-0"
        style={{ clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 0 100%, 0 12px)' }}>
        <div className="flex items-center justify-between px-4 py-2 border-b border-crack">
          <div className="flex items-center gap-2">
            <div className="w-[2px] h-3 bg-fault" />
            <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-stone">
              MULTI-CHANNEL SEISMOGRAPH
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-[2px] bg-fault" /><span className="text-[7px] text-fossil">CH1 STRAIN</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-[2px] bg-sensor" /><span className="text-[7px] text-fossil">CH2 ACOUSTIC</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-[2px] bg-magma" /><span className="text-[7px] text-fossil">CH3 VIBRATION</span>
            </div>
          </div>
        </div>
        <div className="h-[calc(100%-32px)]">
          <SeismicStrip />
        </div>
      </div>

      <div className="flex-1 flex gap-[2px] min-h-0">
        {/* Alert list */}
        <div className="flex-1 bg-concrete border border-crack flex flex-col"
          style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-crack shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-[2px] h-3 bg-ember" />
              <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-stone">
                EVENT LOG
              </span>
              <span className="text-[9px] text-fossil">({filtered.length})</span>
            </div>
            <div className="flex gap-[2px]">
              {filters.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-2 py-0.5 text-[8px] font-medium tracking-[0.08em] uppercase border cursor-pointer transition-all
                    ${filter === f
                      ? 'border-fault text-fault bg-fault/5'
                      : 'border-crack text-fossil bg-transparent hover:text-stone'
                    }`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-[2px]">
            {filtered.map((alert, i) => (
              <AlertItem key={alert.id} alert={alert} isNew={i === 0} />
            ))}
          </div>
        </div>

        {/* Side panel — waveforms */}
        <div className="w-64 flex flex-col gap-[2px] shrink-0">
          <Waveform label="STRAIN GAUGE AVG" accent="#FF6B2C" intensity={1} height={90} />
          <Waveform label="ACOUSTIC EMISSION" accent="#00E5CC" intensity={0.6} height={90} />
          <Waveform label="VIBRATION FREQ" accent="#FF4444" intensity={1.4} height={90} />

          {/* Stats summary */}
          <div className="flex-1 bg-concrete border border-crack p-3"
            style={{ clipPath: 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-[2px] h-2.5 bg-sensor" />
              <span className="text-[8px] font-semibold tracking-[0.12em] uppercase text-stone">24HR SUMMARY</span>
            </div>
            <div className="space-y-2">
              {[
                { label: 'EVENTS', value: '47', accent: 'text-limestone' },
                { label: 'CRITICAL', value: '8', accent: 'text-magma' },
                { label: 'AVG INTERVAL', value: '31m', accent: 'text-sensor' },
                { label: 'PEAK STRAIN', value: '423.7 με', accent: 'text-fault' },
                { label: 'TREND', value: 'ESCALATING', accent: 'text-magma' },
              ].map(({ label, value, accent }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-[8px] text-fossil tracking-[0.08em]">{label}</span>
                  <span className={`text-[10px] font-semibold ${accent}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
