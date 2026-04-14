import { useAnimatedValue } from '../hooks/useAnimatedValue';

const SEVERITY_COLORS = {
  fault: 'bg-fault',
  sensor: 'bg-sensor',
  magma: 'bg-magma',
  stable: 'bg-stable',
  ember: 'bg-ember',
};

export default function StatCard({ label, value, unit, accent = 'sensor', decimals = 1 }) {
  const animated = useAnimatedValue(value);

  return (
    <div className="bg-concrete border border-crack p-4 relative overflow-hidden group hover:border-fossil transition-colors duration-300"
      style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}>
      {/* Accent bar */}
      <div className={`absolute top-0 left-0 w-[2px] h-full ${SEVERITY_COLORS[accent] || 'bg-sensor'}`} />

      {/* Label */}
      <div className="text-[9px] font-medium tracking-[0.1em] uppercase text-fossil mb-2 pl-2">
        {label}
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1 pl-2" style={{ animation: 'data-flicker 6s step-end infinite' }}>
        <span className="text-[28px] font-bold text-limestone leading-none tabular-nums">
          {typeof value === 'number' ? animated.toFixed(decimals) : value}
        </span>
        {unit && <span className="text-[11px] text-fossil font-medium">{unit}</span>}
      </div>

      {/* Subtle scan line on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute w-full h-[1px] bg-sensor/10" style={{ animation: 'scanline 2s linear infinite' }} />
      </div>
    </div>
  );
}
