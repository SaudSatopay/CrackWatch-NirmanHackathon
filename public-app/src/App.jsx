import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Camera, BarChart3, Home } from 'lucide-react';
import MapPage from './pages/MapPage';
import ReportPage from './pages/ReportPage';
import StatsPage from './pages/StatsPage';

const tabs = [
  { id: 'map', label: 'Map', icon: Map },
  { id: 'report', label: 'Report', icon: Camera },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('map');

  return (
    <div className="h-[100dvh] w-screen bg-[#131315] flex flex-col overflow-hidden relative max-w-[430px] mx-auto">
      {/* Ambient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-[#4edea3]/[0.04] rounded-full blur-[80px]" />
        <div className="absolute bottom-[20%] left-[-10%] w-[200px] h-[200px] bg-[#5de6ff]/[0.03] rounded-full blur-[60px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-5 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[#e5e1e4] tracking-tight">
            CRACK<span className="text-[#4edea3]">WATCH</span>
          </h1>
          <p className="text-[10px] text-[#bbcabf] tracking-widest uppercase font-medium">Public Report</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
          <span className="text-[10px] text-[#4edea3] font-semibold">LIVE</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 min-h-0 relative z-10">
        <AnimatePresence mode="wait">
          {activeTab === 'map' && (
            <motion.div key="map" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <MapPage />
            </motion.div>
          )}
          {activeTab === 'report' && (
            <motion.div key="report" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ReportPage />
            </motion.div>
          )}
          {activeTab === 'stats' && (
            <motion.div key="stats" className="h-full" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <StatsPage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom tab bar — mobile style */}
      <nav className="relative z-10 px-4 pb-2 pt-2 bg-[#0e0e10]/90 backdrop-blur-md border-t border-[rgba(60,74,66,0.15)]">
        <div className="flex justify-around">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all ${
                  isActive ? 'text-[#4edea3]' : 'text-[#bbcabf]/50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-semibold">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 w-12 h-0.5 bg-[#4edea3] rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
