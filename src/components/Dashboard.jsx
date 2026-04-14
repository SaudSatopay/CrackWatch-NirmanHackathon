import { useState } from 'react';
import { STATS } from '../data/mockData';
import { useLiveValue } from '../hooks/useAnimatedValue';
import StatCard from './StatCard';
import CrackMap from './CrackMap';
import Heatmap from './Heatmap';
import SensorGrid from './SensorGrid';
import Waveform from './Waveform';

export default function Dashboard() {
  const [selectedCrack, setSelectedCrack] = useState(null);

  const integrity = useLiveValue(STATS.structuralIntegrity, 0.002, 3000);
  const avgProp = useLiveValue(STATS.avgPropagation, 0.05, 4000);
  const maxStrain = useLiveValue(STATS.maxStrain, 0.01, 2500);
  const temp = useLiveValue(STATS.ambientTemp, 0.02, 5000);

  return (
    <div className="h-full flex flex-col gap-[2px] p-[2px] overflow-hidden">
      {/* Top stats row */}
      <div className="grid grid-cols-6 gap-[2px] shrink-0">
        <StatCard label="Structural Integrity" value={integrity} unit="%" accent="stable" />
        <StatCard label="Active Cracks" value={STATS.totalCracks} unit="" accent="fault" decimals={0} />
        <StatCard label="Critical" value={STATS.criticalCount} unit="" accent="magma" decimals={0} />
        <StatCard label="Avg Propagation" value={avgProp} unit="mm/hr" accent="ember" decimals={2} />
        <StatCard label="Peak Strain" value={maxStrain} unit="με" accent="sensor" />
        <StatCard label="Ambient Temp" value={temp} unit="°C" accent="sensor" />
      </div>

      {/* Main content */}
      <div className="flex-1 grid grid-cols-4 gap-[2px] min-h-0">
        {/* Crack map — takes 2 cols */}
        <div className="col-span-2 min-h-0">
          <CrackMap onSelectCrack={setSelectedCrack} selectedCrack={selectedCrack} />
        </div>

        {/* Right side panels */}
        <div className="flex flex-col gap-[2px] min-h-0">
          <div className="flex-1 min-h-0">
            <Heatmap />
          </div>
        </div>

        <div className="flex flex-col gap-[2px] min-h-0">
          <div className="flex-1 min-h-0">
            <SensorGrid />
          </div>
        </div>
      </div>

      {/* Bottom waveforms */}
      <div className="grid grid-cols-3 gap-[2px] shrink-0">
        <Waveform label="STRAIN GAUGE — ZONE A" accent="#FF6B2C" intensity={1} height={70} />
        <Waveform label="ACOUSTIC EMISSION" accent="#00E5CC" intensity={0.6} height={70} />
        <Waveform label="VIBRATION ANALYSIS" accent="#FF4444" intensity={1.3} height={70} />
      </div>

      {/* Selected crack info bar */}
      {selectedCrack && (
        <div className="bg-slab border border-crack px-4 py-2 flex items-center gap-6 shrink-0"
          style={{ animation: 'fault-pulse 2s ease-in-out infinite' }}>
          <span className="text-[10px] font-bold text-limestone">{selectedCrack.id}</span>
          <span className="text-[9px] text-stone">
            Zone {selectedCrack.zone} — {selectedCrack.length}mm @ {selectedCrack.angle}°
          </span>
          <span className={`text-[9px] font-semibold uppercase ${
            selectedCrack.severity === 'critical' ? 'text-magma' :
            selectedCrack.severity === 'warning' ? 'text-ember' : 'text-fossil'
          }`}>
            {selectedCrack.severity}
          </span>
          <span className="text-[9px] text-fault">
            {selectedCrack.propagationRate} mm/hr
          </span>
          <button onClick={() => setSelectedCrack(null)}
            className="ml-auto text-[9px] text-fossil hover:text-limestone border border-crack px-2 py-0.5 bg-transparent cursor-pointer transition-colors">
            DISMISS
          </button>
        </div>
      )}
    </div>
  );
}
