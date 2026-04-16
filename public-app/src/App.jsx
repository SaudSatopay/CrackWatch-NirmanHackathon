import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Camera, BarChart3, ScanLine, ArrowRight, User, LogOut, Video, Navigation, Trophy } from 'lucide-react';
import MapPage from './pages/MapPage';
import ReportPage from './pages/ReportPage';
import StatsPage from './pages/StatsPage';
import LiveScanPage from './pages/LiveScanPage';
import NavigatePage from './pages/NavigatePage';
import GamificationPage from './pages/GamificationPage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const tabs = [
  { id: 'map', label: 'Map', icon: MapPin },
  { id: 'report', label: 'Report', icon: Camera },
  { id: 'game', label: 'Rewards', icon: Trophy },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
  { id: 'logout', label: 'Exit', icon: LogOut },
];

function CitizenLogin({ onLogin }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', name.trim());
      const res = await fetch(`${API_URL}/auth/register`, { method: 'POST', body: fd });
      const data = await res.json();
      localStorage.setItem('crackwatch_citizen', JSON.stringify(data));
      onLogin(data);
    } catch {
      // Offline fallback — let them in anyway
      const data = { name: name.trim(), role: 'citizen', token: 'offline' };
      localStorage.setItem('crackwatch_citizen', JSON.stringify(data));
      onLogin(data);
    }
    setLoading(false);
  };

  return (
    <div className="h-[100dvh] bg-[#131315] flex flex-col px-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[10%] right-[-10%] w-[300px] h-[300px] bg-[#4edea3]/[0.04] rounded-full blur-[80px]" />
      </div>

      {/* Push content to center vertically */}
      <div className="flex-1" />

      <motion.div className="relative z-10 w-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-[#4edea3]/10 border border-[#4edea3]/20 flex items-center justify-center mx-auto mb-5">
            <ScanLine className="w-8 h-8 text-[#4edea3]" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
            CRACK<span className="text-[#4edea3]">WATCH</span>
          </h1>
          <p className="text-sm text-white/40 mt-2">Report road damage in your area</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[11px] text-white/40 uppercase tracking-[0.15em] font-bold mb-2 block">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-5 py-4 rounded-2xl bg-white/[0.05] text-white text-base outline-none placeholder-white/20 focus:ring-2 focus:ring-[#4edea3]/30 border border-white/[0.06]"
              autoFocus
            />
          </div>

          <motion.button
            type="submit"
            disabled={!name.trim() || loading}
            className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 ${
              name.trim() ? 'bg-gradient-to-r from-[#4edea3] to-[#10b981] text-[#002113] shadow-lg shadow-[#4edea3]/20' : 'bg-white/[0.04] text-white/20'
            }`}
            whileTap={name.trim() ? { scale: 0.98 } : {}}
          >
            {loading ? <div className="w-5 h-5 border-2 border-[#002113] border-t-transparent rounded-full animate-spin" /> : <>Get Started <ArrowRight className="w-5 h-5" /></>}
          </motion.button>
        </form>
      </motion.div>

      <div className="flex-1" />

      <p className="text-center text-[11px] text-white/15 pb-8">No account needed · Your reports help fix roads</p>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('crackwatch_citizen');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('map');

  const handleLogout = () => {
    localStorage.removeItem('crackwatch_citizen');
    localStorage.removeItem('crackwatch_upvotes');
    setUser(null);
  };

  if (!user) {
    return <CitizenLogin onLogin={setUser} />;
  }

  return (
    <div className="h-[100dvh] w-screen bg-[#131315] flex flex-col overflow-hidden">
      <main className="flex-1 min-h-0 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'map' && (
            <motion.div key="map" className="h-full" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}>
              <MapPage userName={user.name} />
            </motion.div>
          )}
          {activeTab === 'navigate' && (
            <motion.div key="navigate" className="h-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <NavigatePage />
            </motion.div>
          )}
          {activeTab === 'report' && (
            <motion.div key="report" className="h-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
              <ReportPage userName={user.name} />
            </motion.div>
          )}
          {activeTab === 'game' && (
            <motion.div key="game" className="h-full" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }}>
              <GamificationPage userName={user?.name} />
            </motion.div>
          )}
          {activeTab === 'stats' && (
            <motion.div key="stats" className="h-full" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <StatsPage />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="relative z-50 bg-[#0e0e10] border-t border-white/[0.06]">
        <div className="flex items-stretch">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => tab.id === 'logout' ? handleLogout() : setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 relative transition-colors ${tab.id === 'logout' ? 'opacity-60' : ''}`}
              >
                {isActive && (
                  <motion.div layoutId="tab-bg" className="absolute inset-x-3 inset-y-1 rounded-xl bg-[#4edea3]/[0.08]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <tab.icon className={`w-5 h-5 relative z-10 ${isActive ? 'text-[#4edea3]' : 'text-[#bbcabf]/40'}`} />
                <span className={`text-[10px] font-semibold relative z-10 ${isActive ? 'text-[#4edea3]' : 'text-[#bbcabf]/40'}`}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
