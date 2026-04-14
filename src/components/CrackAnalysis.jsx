import { useState, useEffect, useRef } from 'react';
import { CRACKS, generateTimeSeriesData } from '../data/mockData';
import Waveform from './Waveform';

const SEVERITY_COLOR = { critical: '#FF4444', warning: '#FF9142', minor: '#4A4944' };
const PATTERNS = ['Linear Tension', 'Branching Dendritic', 'Shear Diagonal', 'Map/Pattern', 'Alligator Fatigue'];

function MicroscopeView({ crack }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const w = rect.width;
    const h = rect.height;

    ctx.fillStyle = '#0A0A0B';
    ctx.fillRect(0, 0, w, h);

    // Draw microscopic crack detail
    const color = SEVERITY_COLOR[crack.severity];

    // Micro grid
    ctx.strokeStyle = '#1E1E22';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Main crack path with texture
    ctx.strokeStyle = color;
    ctx.lineWidth = crack.width * 2;
    ctx.beginPath();
    let cx = w * 0.1;
    let cy = h * 0.5;
    ctx.moveTo(cx, cy);
    for (let i = 0; i < 30; i++) {
      cx += w * 0.028;
      cy += (Math.random() - 0.5) * 15;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Glow layer
    ctx.globalAlpha = 0.1;
    ctx.lineWidth = crack.width * 8;
    ctx.filter = 'blur(6px)';
    ctx.stroke();
    ctx.filter = 'none';
    ctx.globalAlpha = 1;

    // Micro branches
    for (let i = 0; i < 15; i++) {
      const bx = w * 0.15 + Math.random() * w * 0.7;
      const by = h * 0.3 + Math.random() * h * 0.4;
      const angle = Math.random() * Math.PI * 2;
      const len = 5 + Math.random() * 20;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.2 + Math.random() * 0.3;
      ctx.lineWidth = 0.3 + Math.random() * 0.7;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx + Math.cos(angle) * len, by + Math.sin(angle) * len);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Stress tensor arrows
    for (let i = 0; i < 6; i++) {
      const ax = w * 0.2 + i * w * 0.12;
      const ay = h * 0.2;
      const ay2 = h * 0.8;
      ctx.strokeStyle = '#00E5CC';
      ctx.globalAlpha = 0.25;
      ctx.lineWidth = 1;

      // Down arrow
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay + 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax - 3, ay + 12); ctx.lineTo(ax, ay + 15); ctx.lineTo(ax + 3, ay + 12); ctx.stroke();

      // Up arrow
      ctx.beginPath(); ctx.moveTo(ax, ay2); ctx.lineTo(ax, ay2 - 15); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ax - 3, ay2 - 12); ctx.lineTo(ax, ay2 - 15); ctx.lineTo(ax + 3, ay2 - 12); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Scale bar
    ctx.fillStyle = '#7A7872';
    ctx.font = '9px JetBrains Mono';
    ctx.fillText('100μm', w - 55, h - 10);
    ctx.strokeStyle = '#7A7872';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(w - 55, h - 15); ctx.lineTo(w - 10, h - 15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w - 55, h - 18); ctx.lineTo(w - 55, h - 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w - 10, h - 18); ctx.lineTo(w - 10, h - 12); ctx.stroke();

    // Crosshair
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

  }, [crack]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
}

function TimeSeriesChart({ data }) {
  const svgWidth = 500;
  const svgHeight = 100;
  const maxStrain = Math.max(...data.map(d => d.strain));
  const minStrain = Math.min(...data.map(d => d.strain));

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * svgWidth;
    const y = svgHeight - ((d.strain - minStrain) / (maxStrain - minStrain)) * svgHeight * 0.8 - svgHeight * 0.1;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
      {/* Grid */}
      {[0.25, 0.5, 0.75].map(t => (
        <line key={t} x1={0} y1={svgHeight * t} x2={svgWidth} y2={svgHeight * t}
          stroke="#1E1E22" strokeWidth={0.5} />
      ))}
      {/* Glow */}
      <polyline points={points} fill="none" stroke="#FF6B2C" strokeWidth={3} opacity={0.1}
        style={{ filter: 'blur(4px)' }} />
      {/* Line */}
      <polyline points={points} fill="none" stroke="#FF6B2C" strokeWidth={1.2} />
      {/* Threshold line */}
      <line x1={0} y1={svgHeight * 0.15} x2={svgWidth} y2={svgHeight * 0.15}
        stroke="#FF4444" strokeWidth={0.5} strokeDasharray="4 4" opacity={0.5} />
      <text x={svgWidth - 60} y={svgHeight * 0.15 - 3} fill="#FF4444" fontSize="7"
        fontFamily="JetBrains Mono" opacity={0.6}>THRESHOLD</text>
    </svg>
  );
}

export default function CrackAnalysis() {
  const [selectedCrack, setSelectedCrack] = useState(CRACKS[0]);
  const [timeData] = useState(() => generateTimeSeriesData(24));

  const color = SEVERITY_COLOR[selectedCrack.severity];
  const pattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];

  return (
    <div className="h-full flex flex-col gap-[2px] overflow-auto p-[2px]">
      {/* Crack selector bar */}
      <div className="bg-concrete border border-crack px-4 py-2 flex items-center gap-[2px] shrink-0">
        <span className="text-[9px] text-fossil tracking-[0.1em] uppercase mr-3">SELECT FRACTURE:</span>
        {CRACKS.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedCrack(c)}
            className={`px-3 py-1 text-[10px] font-medium border cursor-pointer transition-all duration-200
              ${selectedCrack.id === c.id
                ? 'border-l-2 text-limestone bg-slab'
                : 'border-crack text-stone bg-transparent hover:text-limestone hover:bg-slab/50'
              }`}
            style={selectedCrack.id === c.id ? { borderLeftColor: SEVERITY_COLOR[c.severity] } : {}}
          >
            {c.id}
          </button>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-3 gap-[2px] min-h-0">
        {/* Microscope view */}
        <div className="col-span-2 bg-concrete border border-crack flex flex-col"
          style={{ clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 0 100%, 0 12px)' }}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-crack shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-[2px] h-3" style={{ background: color }} />
              <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-stone">
                MICROSCOPIC ANALYSIS — {selectedCrack.id}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-fossil">50x MAG</span>
              <div className="w-1.5 h-1.5" style={{ background: color, animation: 'dot-pulse 1.5s ease-in-out infinite' }} />
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <MicroscopeView crack={selectedCrack} />
          </div>
        </div>

        {/* Right panel — crack properties */}
        <div className="flex flex-col gap-[2px]">
          {/* Properties */}
          <div className="bg-concrete border border-crack p-4 flex-1"
            style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-[2px] h-3" style={{ background: color }} />
              <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-stone">
                FRACTURE PROPERTIES
              </span>
            </div>

            <div className="space-y-3">
              {[
                { label: 'SEVERITY', value: selectedCrack.severity.toUpperCase(), color },
                { label: 'LENGTH', value: `${selectedCrack.length} mm`, color: '#E8E6E1' },
                { label: 'WIDTH', value: `${selectedCrack.width} mm`, color: '#E8E6E1' },
                { label: 'ANGLE', value: `${selectedCrack.angle}°`, color: '#E8E6E1' },
                { label: 'PROP. RATE', value: `${selectedCrack.propagationRate} mm/hr`, color: selectedCrack.propagationRate > 0.5 ? '#FF4444' : '#E8E6E1' },
                { label: 'ZONE', value: selectedCrack.zone, color: '#00E5CC' },
                { label: 'PATTERN', value: pattern, color: '#E8E6E1' },
                { label: 'DETECTED', value: new Date(selectedCrack.detected).toLocaleDateString(), color: '#7A7872' },
              ].map(({ label, value, color: c }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-[8px] text-fossil tracking-[0.08em] uppercase">{label}</span>
                  <span className="text-[11px] font-semibold" style={{ color: c }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Severity bar */}
            <div className="mt-4 pt-3 border-t border-crack">
              <div className="text-[8px] text-fossil tracking-[0.08em] uppercase mb-1.5">STRUCTURAL RISK</div>
              <div className="w-full h-2 bg-void relative">
                <div
                  className="h-full transition-all duration-1000"
                  style={{
                    width: `${selectedCrack.severity === 'critical' ? 85 : selectedCrack.severity === 'warning' ? 50 : 15}%`,
                    background: `linear-gradient(90deg, ${color}, ${color}88)`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Mini waveform */}
          <Waveform
            label={`STRAIN — ${selectedCrack.zone}`}
            accent={color}
            intensity={selectedCrack.severity === 'critical' ? 1.5 : 0.7}
            height={80}
          />
        </div>
      </div>

      {/* Bottom — time series */}
      <div className="h-32 bg-concrete border border-crack shrink-0"
        style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}>
        <div className="flex items-center gap-2 px-4 py-2 border-b border-crack">
          <div className="w-[2px] h-2.5 bg-fault" />
          <span className="text-[8px] font-semibold tracking-[0.12em] uppercase text-stone">
            24HR STRAIN HISTORY — {selectedCrack.id}
          </span>
        </div>
        <div className="h-[calc(100%-28px)] px-2">
          <TimeSeriesChart data={timeData} />
        </div>
      </div>
    </div>
  );
}
