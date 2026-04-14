import { useState, useEffect } from 'react';
import { SENSOR_GRID } from '../data/mockData';

const STATUS_STYLES = {
  nominal: { bg: 'bg-sensor/10', dot: 'bg-sensor', text: 'text-sensor' },
  warning: { bg: 'bg-ember/10', dot: 'bg-ember', text: 'text-ember' },
  alert: { bg: 'bg-magma/10', dot: 'bg-magma', text: 'text-magma' },
};

export default function SensorGrid() {
  const [sensors, setSensors] = useState(SENSOR_GRID);
  const [hoveredSensor, setHoveredSensor] = useState(null);

  useEffect(() => {
    const id = setInterval(() => {
      setSensors(prev => prev.map(s => ({
        ...s,
        strain: +(s.strain + (Math.random() - 0.5) * 5).toFixed(1),
        temp: +(s.temp + (Math.random() - 0.5) * 0.3).toFixed(1),
        lastPing: Date.now(),
      })));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const alertCount = sensors.filter(s => s.status === 'alert').length;
  const warnCount = sensors.filter(s => s.status === 'warning').length;

  return (
    <div className="bg-concrete border border-crack relative overflow-hidden"
      style={{ clipPath: 'polygon(8px 0, 100% 0, 100% 100%, 0 100%, 0 8px)' }}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-crack">
        <div className="flex items-center gap-2">
          <div className="w-[2px] h-3 bg-sensor" />
          <span className="text-[9px] font-semibold tracking-[0.12em] uppercase text-stone">
            SENSOR ARRAY
          </span>
        </div>
        <div className="flex gap-3">
          <span className="text-[9px] text-magma">{alertCount} FAULT</span>
          <span className="text-[9px] text-ember">{warnCount} WARN</span>
          <span className="text-[9px] text-sensor">{64 - alertCount - warnCount} OK</span>
        </div>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-8 gap-[2px]">
          {sensors.map(sensor => {
            const style = STATUS_STYLES[sensor.status];
            return (
              <div
                key={sensor.id}
                className={`${style.bg} p-1.5 cursor-crosshair relative group transition-all duration-300 hover:scale-110 hover:z-10`}
                onMouseEnter={() => setHoveredSensor(sensor)}
                onMouseLeave={() => setHoveredSensor(null)}
              >
                <div className="flex items-center justify-center">
                  <div className={`w-1.5 h-1.5 ${style.dot}`}
                    style={sensor.status === 'alert' ? { animation: 'dot-pulse 1s ease-in-out infinite' } : {}} />
                </div>
                <div className={`text-[6px] text-center mt-0.5 ${style.text} opacity-60`}>
                  {sensor.strain.toFixed(0)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tooltip */}
        {hoveredSensor && (
          <div className="mt-3 p-2 bg-slab border border-crack">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-semibold text-limestone">{hoveredSensor.id}</span>
              <span className={`text-[8px] font-semibold tracking-[0.1em] uppercase ${STATUS_STYLES[hoveredSensor.status].text}`}>
                {hoveredSensor.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <div className="text-[8px] text-fossil">STRAIN</div>
              <div className="text-[9px] text-limestone text-right">{hoveredSensor.strain} <span className="text-fossil">με</span></div>
              <div className="text-[8px] text-fossil">TEMP</div>
              <div className="text-[9px] text-limestone text-right">{hoveredSensor.temp} <span className="text-fossil">°C</span></div>
              <div className="text-[8px] text-fossil">GRID</div>
              <div className="text-[9px] text-limestone text-right">{String.fromCharCode(65 + hoveredSensor.row)}{hoveredSensor.col + 1}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
