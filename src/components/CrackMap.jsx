import { useState, useRef, useEffect } from 'react';
import { CRACKS } from '../data/mockData';

const SEVERITY_COLOR = {
  critical: '#FF4444',
  warning: '#FF9142',
  minor: '#4A4944',
};

function CrackLine({ crack, isSelected, onClick }) {
  const len = crack.length * 0.4;
  const rad = (crack.angle * Math.PI) / 180;
  const x2 = crack.x + Math.cos(rad) * len * 0.5;
  const y2 = crack.y + Math.sin(rad) * len * 0.5;
  const x1 = crack.x - Math.cos(rad) * len * 0.5;
  const y1 = crack.y - Math.sin(rad) * len * 0.5;
  const color = SEVERITY_COLOR[crack.severity];

  // Generate jagged crack path
  const points = [];
  const segments = 12;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const bx = x1 + (x2 - x1) * t;
    const by = y1 + (y2 - y1) * t;
    const perpX = -Math.sin(rad);
    const perpY = Math.cos(rad);
    const jitter = i === 0 || i === segments ? 0 : (Math.random() - 0.5) * crack.width * 1.5;
    points.push(`${bx + perpX * jitter},${by + perpY * jitter}`);
  }

  return (
    <g onClick={() => onClick(crack)} className="cursor-pointer">
      {/* Glow */}
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={crack.width * 2.5}
        opacity={0.15}
        style={{ filter: 'blur(4px)' }}
      />
      {/* Main crack line */}
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={crack.width * 0.8}
        strokeLinecap="round"
        strokeDasharray="500"
        style={{ animation: 'crack-grow 2s ease-out forwards' }}
      />
      {/* Branching micro-cracks */}
      {crack.severity === 'critical' && Array.from({ length: 3 }).map((_, i) => {
        const t = 0.3 + i * 0.25;
        const bx = x1 + (x2 - x1) * t;
        const by = y1 + (y2 - y1) * t;
        const branchAngle = rad + (Math.random() - 0.5) * 1.5;
        const branchLen = 2 + Math.random() * 4;
        return (
          <line
            key={i}
            x1={bx} y1={by}
            x2={bx + Math.cos(branchAngle) * branchLen}
            y2={by + Math.sin(branchAngle) * branchLen}
            stroke={color}
            strokeWidth={0.3}
            opacity={0.5}
          />
        );
      })}
      {/* Selection ring */}
      {isSelected && (
        <circle cx={crack.x} cy={crack.y} r={6} fill="none" stroke={color} strokeWidth={0.5}
          strokeDasharray="2 2" opacity={0.8}>
          <animateTransform attributeName="transform" type="rotate"
            from={`0 ${crack.x} ${crack.y}`} to={`360 ${crack.x} ${crack.y}`} dur="4s" repeatCount="indefinite" />
        </circle>
      )}
      {/* ID label */}
      <text x={crack.x + 4} y={crack.y - 4} fill={color} fontSize="2.5" fontFamily="JetBrains Mono" opacity={0.7}>
        {crack.id}
      </text>
    </g>
  );
}

export default function CrackMap({ onSelectCrack, selectedCrack }) {
  const svgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.max(0.5, Math.min(4, z * delta)));
  };

  const handleMouseDown = (e) => {
    setDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPan(p => ({
      x: p.x + (e.clientX - lastPos.current.x) / zoom,
      y: p.y + (e.clientY - lastPos.current.y) / zoom,
    }));
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => setDragging(false);

  useEffect(() => {
    const el = svgRef.current;
    if (el) el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el?.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="bg-concrete border border-crack relative overflow-hidden h-full"
      style={{ clipPath: 'polygon(12px 0, 100% 0, 100% 100%, 0 100%, 0 12px)' }}>
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-crack">
        <div className="flex items-center gap-2">
          <div className="w-[2px] h-3 bg-fault" />
          <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-stone">
            STRUCTURAL TOPOLOGY — LIVE
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-fossil">{zoom.toFixed(1)}x</span>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            className="text-[9px] text-stone hover:text-sensor border border-crack px-2 py-0.5 bg-transparent cursor-pointer transition-colors">
            RESET
          </button>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className="w-full h-[calc(100%-36px)] select-none"
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g transform={`translate(${50 + pan.x}, ${50 + pan.y}) scale(${zoom}) translate(-50, -50)`}>
          {/* Grid */}
          {Array.from({ length: 11 }).map((_, i) => (
            <g key={i}>
              <line x1={i * 10} y1={0} x2={i * 10} y2={100} stroke="#1E1E22" strokeWidth={0.2} />
              <line x1={0} y1={i * 10} x2={100} y2={i * 10} stroke="#1E1E22" strokeWidth={0.2} />
            </g>
          ))}

          {/* Zone labels */}
          {['A', 'B', 'C'].map((letter, ri) =>
            Array.from({ length: 8 }, (_, ci) => (
              <text key={`${letter}${ci}`} x={ci * 12.5 + 6.25} y={ri * 33.3 + 16}
                fill="#1E1E22" fontSize="3" textAnchor="middle" fontFamily="JetBrains Mono">
                {letter}{ci + 1}
              </text>
            ))
          )}

          {/* Sensor points */}
          {Array.from({ length: 64 }).map((_, i) => {
            const row = Math.floor(i / 8);
            const col = i % 8;
            return (
              <circle key={i} cx={col * 12.5 + 6.25} cy={row * 12.5 + 6.25} r={0.6}
                fill="#00E5CC" opacity={0.15} />
            );
          })}

          {/* Cracks */}
          {CRACKS.map(crack => (
            <CrackLine
              key={crack.id}
              crack={crack}
              isSelected={selectedCrack?.id === crack.id}
              onClick={onSelectCrack}
            />
          ))}

          {/* Propagation vectors on critical cracks */}
          {CRACKS.filter(c => c.severity === 'critical').map(crack => {
            const rad = (crack.angle * Math.PI) / 180;
            const tipX = crack.x + Math.cos(rad) * crack.length * 0.2;
            const tipY = crack.y + Math.sin(rad) * crack.length * 0.2;
            return (
              <g key={`prop-${crack.id}`}>
                <circle cx={tipX} cy={tipY} r={3} fill="none" stroke="#FF4444" strokeWidth={0.2}
                  opacity={0.3} strokeDasharray="1 1">
                  <animate attributeName="r" from="2" to="6" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                </circle>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Overlay noise texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          animation: 'noise-shift 0.5s steps(5) infinite',
        }}
      />
    </div>
  );
}
