import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScanLine,
  LayoutDashboard,
  Upload,
  BarChart3,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
} from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Upload, label: "New Scan", id: "scan" },
  { icon: Zap, label: "Repair Plan", id: "repair-plan" },
  { icon: BarChart3, label: "Analytics", id: "analytics" },
  { icon: History, label: "History", id: "history" },
  { icon: Settings, label: "Settings", id: "settings" },
];

export default function Sidebar({ activeTab, onTabChange }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative flex flex-col h-screen bg-zinc-950 border-r border-zinc-800/50 overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 relative z-10">
        <motion.div
          className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <ScanLine className="w-5 h-5 text-emerald-400" />
          <motion.div
            className="absolute inset-0 rounded-xl bg-emerald-400/20"
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-sm font-bold text-white tracking-wide">
                CRACK<span className="text-emerald-400">DETECT</span>
              </h1>
              <p className="text-[10px] text-zinc-500 tracking-widest uppercase">
                AI Vision System
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status indicator */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-3 mb-4 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
          >
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <span className="text-[11px] text-emerald-400 font-medium">
                System Active
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
                isActive
                  ? "text-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg bg-emerald-500/10 border border-emerald-500/20"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon
                className={`relative z-10 w-4.5 h-4.5 ${
                  isActive ? "text-emerald-400" : ""
                }`}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    className="relative z-10"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-3">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent border border-emerald-500/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white">
                  Pro Plan
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Unlimited scans with AI-powered detection
              </p>
              <div className="mt-2 flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] text-amber-400 font-medium">
                  247 scans remaining
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse toggle */}
        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors cursor-pointer"
          whileTap={{ scale: 0.95 }}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs">Collapse</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.aside>
  );
}
