import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Camera, BarChart3 } from 'lucide-react';
import MapPage from './pages/MapPage';
import ReportPage from './pages/ReportPage';
import StatsPage from './pages/StatsPage';

const tabs = [
  { id: 'map', label: 'Map', icon: MapPin },
  { id: 'report', label: 'Report', icon: Camera },
  { id: 'stats', label: 'Dashboard', icon: BarChart3 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('map');

  return (
    <div className="h-[100dvh] w-screen bg-[#131315] flex flex-col overflow-hidden">
      {/* Content — full width on mobile */}
      <main className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'map' && (
            <motion.div key="map" className="h-full" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <MapPage />
            </motion.div>
          )}
          {activeTab === 'report' && (
            <motion.div key="report" className="h-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
              <ReportPage />
            </motion.div>
          )}
          {activeTab === 'stats' && (
            <motion.div key="stats" className="h-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <StatsPage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom navigation */}
      <nav className="relative z-50 bg-[#0e0e10] border-t border-white/[0.06] safe-bottom">
        <div className="flex items-stretch">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 relative transition-colors"
              >
                {isActive && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-x-3 inset-y-1 rounded-xl bg-[#4edea3]/[0.08]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <tab.icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-[#4edea3]' : 'text-[#bbcabf]/40'}`} />
                <span className={`text-[10px] font-semibold relative z-10 transition-colors ${isActive ? 'text-[#4edea3]' : 'text-[#bbcabf]/40'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
