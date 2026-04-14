import { useState, useEffect } from 'react';
import { generateHeatmap } from '../data/mockData';

function getHeatColor(val) {
  if (val > 0.8) return '#FF4444';
  if (val > 0.6) return '#FF6B2C';
  if (val > 0.4) return '#FF9142';
  if (val > 0.2) return '#1C1C20';
  return '#141416';
}

function getHeatOpacity(val) {
  return 0.3 + val * 0.7;
}

export default function Heatmap() {
  const [data, setData] = useState(generateHeatmap);
  const [hoveredCell, setHoveredCell] = useState(null);

  useEffect(() => {
    const id = setInterval(() => {
      setData(prev => prev.map(row =>
        row.map(v => Math.min(1, Math.max(0, v + (Math.random() - 0.5) * 0.05)))
      ));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-concrete border border-crack relative overflow-hidden"
      style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-crack">
        <div className="w-[2px] h-3 bg-ember" />
        <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-stone">
          SEVERITY HEATMAP
        </span>
      </div>

      <div className="p-3">
        <svg viewBox="0 0 100 100" className="w-full aspect-square">
          {data.map((row, ri) =>
            row.map((val, ci) => (
              <g key={`${ri}-${ci}`}
                onMouseEnter={() => setHoveredCell({ r: ri, c: ci, val })}
                onMouseLeave={() => setHoveredCell(null)}
                className="cursor-crosshair"
              >
                <rect
                  x={ci * 12.5}
                  y={ri * 12.5}
                  width={12}
                  height={12}
                  fill={getHeatColor(val)}
                  opacity={getHeatOpacity(val)}
                  className="transition-all duration-500"
                />
                {/* Cell border */}
                <rect
                  x={ci * 12.5}
                  y={ri * 12.5}
                  width={12}
                  height={12}
                  fill="none"
                  stroke="#1E1E22"
                  strokeWidth={0.3}
                />
                {/* Hot cell glow */}
                {val > 0.6 && (
                  <rect
                    x={ci * 12.5 + 1}
                    y={ri * 12.5 + 1}
                    width={10}
                    height={10}
                    fill={getHeatColor(val)}
                    opacity={0.1}
                    style={{ filter: 'blur(3px)', animation: 'pulse-glow 2s ease-in-out infinite' }}
                  />
                )}
              </g>
            ))
          )}

          {/* Hover tooltip */}
          {hoveredCell && (
            <g>
              <rect
                x={hoveredCell.c * 12.5 - 1}
                y={hoveredCell.r * 12.5 - 1}
                width={14}
                height={14}
                fill="none"
                stroke="#E8E6E1"
                strokeWidth={0.4}
                strokeDasharray="2 1"
              />
            </g>
          )}
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-between mt-2 px-1">
          <span className="text-[8px] text-fossil">LOW</span>
          <div className="flex-1 mx-2 h-1.5 bg-gradient-to-r from-concrete via-ember to-magma" />
          <span className="text-[8px] text-fossil">CRITICAL</span>
        </div>

        {hoveredCell && (
          <div className="mt-2 text-[9px] text-stone text-center">
            Zone {String.fromCharCode(65 + hoveredCell.r)}{hoveredCell.c + 1} — Stress: {(hoveredCell.val * 100).toFixed(0)}%
          </div>
        )}
      </div>
    </div>
  );
}
