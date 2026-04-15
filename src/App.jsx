import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TooltipProvider } from "@/components/ui/tooltip";
import Sidebar from "@/components/Sidebar";
import StatsCards from "@/components/StatsCards";
import ScanZone from "@/components/ScanZone";
import AnalyticsChart from "@/components/AnalyticsChart";
import RecentScans from "@/components/RecentScans";
import HeroPage from "@/components/HeroPage";
import RepairPlan from "@/components/RepairPlan";
import {
  Bell,
  Search,
  User,
  ScanLine,
} from "lucide-react";

function Header({ activeTab }) {
  const [searchFocused, setSearchFocused] = useState(false);

  const titles = {
    dashboard: { title: "Command Center", sub: "Infrastructure monitoring & damage intelligence" },
    scan: { title: "New Scan", sub: "Upload & analyze structural damage" },
    "repair-plan": { title: "Repair Plan", sub: "Priority actions & cost estimation" },
    analytics: { title: "Analytics", sub: "Damage trends & pattern analysis" },
    history: { title: "Scan History", sub: "Past inspections & reports" },
    settings: { title: "Settings", sub: "System configuration" },
  };

  const { title, sub } = titles[activeTab] || titles.dashboard;

  return (
    <header className="flex items-center justify-between px-8 py-5 border-b border-zinc-800/30 bg-zinc-950/50 backdrop-blur-sm">
      <div>
        <motion.h2
          className="text-2xl font-extrabold text-white tracking-tight"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          key={title}
        >
          {title}
        </motion.h2>
        <p className="text-sm text-zinc-500 mt-0.5 font-medium">
          {sub}
        </p>
      </div>

      <div className="flex items-center gap-4">
        {/* Live indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20">
          <motion.div
            className="w-2 h-2 rounded-full bg-emerald-400"
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span className="text-[11px] text-emerald-400 font-semibold tracking-wide">LIVE</span>
        </div>

        {/* Search */}
        <motion.div
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-colors ${
            searchFocused
              ? "border-emerald-500/50 bg-zinc-800/80"
              : "border-zinc-800/50 bg-zinc-900/30"
          }`}
          animate={{ width: searchFocused ? 300 : 220 }}
        >
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            type="text"
            placeholder="Search scans..."
            className="bg-transparent text-sm text-zinc-300 outline-none w-full placeholder-zinc-600"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </motion.div>

        {/* Notifications */}
        <motion.button
          className="relative p-2.5 rounded-xl bg-zinc-900/30 border border-zinc-800/50 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell className="w-5 h-5" />
          <motion.div
            className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-red-500 border-2 border-zinc-950"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.button>

        {/* Profile */}
        <motion.button
          className="flex items-center gap-3 px-4 py-2 rounded-xl bg-zinc-900/30 border border-zinc-800/50 hover:border-zinc-700 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <User className="w-4 h-4 text-black" />
          </div>
          <div className="text-left">
            <span className="text-sm text-white font-semibold block leading-tight">Inspector</span>
            <span className="text-[10px] text-zinc-500">Municipal Dept.</span>
          </div>
        </motion.button>
      </div>
    </header>
  );
}

function DashboardView() {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <StatsCards />
      <ScanZone />
      <AnalyticsChart />
      <RecentScans />
    </motion.div>
  );
}

function PlaceholderView({ title, icon }) {
  return (
    <motion.div
      className="flex flex-col items-center justify-center h-[60vh]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <motion.div
        className="w-20 h-20 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mb-6"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <ScanLine className="w-8 h-8 text-zinc-600" />
      </motion.div>
      <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
      <p className="text-sm text-zinc-500">Coming soon</p>
    </motion.div>
  );
}

function Dashboard({ activeTab, setActiveTab }) {
  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/3 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/3 rounded-full blur-3xl" />
      </div>

      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Header activeTab={activeTab} />
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && <DashboardView key="dashboard" />}
            {activeTab === "scan" && (
              <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ScanZone />
              </motion.div>
            )}
            {activeTab === "analytics" && (
              <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AnalyticsChart />
              </motion.div>
            )}
            {activeTab === "history" && (
              <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RecentScans />
              </motion.div>
            )}
            {activeTab === "repair-plan" && (
              <motion.div key="repair-plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <RepairPlan />
              </motion.div>
            )}
            {activeTab === "settings" && (
              <PlaceholderView key="settings" title="Settings" />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function App() {
  const [showHero, setShowHero] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <TooltipProvider>
      {showHero ? (
        <HeroPage onEnter={() => { console.log('HERO ENTER CLICKED'); setShowHero(false); }} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Dashboard activeTab={activeTab} setActiveTab={setActiveTab} />
        </motion.div>
      )}
    </TooltipProvider>
  );
}

export default App;
