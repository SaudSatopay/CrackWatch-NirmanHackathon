import { useState } from 'react';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import CrackAnalysis from './components/CrackAnalysis';
import AlertTimeline from './components/AlertTimeline';
import './index.css';

export default function App() {
  const [activeView, setActiveView] = useState('MONITOR');

  return (
    <div className="h-screen w-screen bg-void flex flex-col overflow-hidden relative">
      {/* Global scanning line */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        <div
          className="absolute w-full h-[1px] opacity-[0.04]"
          style={{
            background: 'linear-gradient(90deg, transparent, #00E5CC, transparent)',
            animation: 'scanline 6s linear infinite',
          }}
        />
      </div>

      {/* Noise texture overlay */}
      <div className="absolute inset-0 pointer-events-none z-40 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          animation: 'noise-shift 0.3s steps(4) infinite',
        }}
      />

      <TopBar activeView={activeView} setActiveView={setActiveView} />

      <main className="flex-1 min-h-0">
        {activeView === 'MONITOR' && <Dashboard />}
        {activeView === 'ANALYSIS' && <CrackAnalysis />}
        {activeView === 'TIMELINE' && <AlertTimeline />}
      </main>

      {/* Bottom status bar */}
      <footer className="h-6 bg-concrete border-t border-crack flex items-center px-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 bg-stable" style={{ animation: 'dot-pulse 3s ease-in-out infinite' }} />
            <span className="text-[8px] text-fossil tracking-[0.06em]">61/64 SENSORS ACTIVE</span>
          </div>
          <span className="text-[8px] text-crack">|</span>
          <span className="text-[8px] text-fossil tracking-[0.06em]">SCAN INTERVAL: 250ms</span>
          <span className="text-[8px] text-crack">|</span>
          <span className="text-[8px] text-fossil tracking-[0.06em]">BUFFER: 98.2%</span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[8px] text-fossil tracking-[0.06em]">CRACKWATCH v4.2.1 // STRUCTURAL MONITORING SYSTEM</span>
          <div className="w-1 h-1 bg-fault" style={{ animation: 'dot-pulse 1.5s ease-in-out infinite' }} />
        </div>
      </footer>
    </div>
  );
}
