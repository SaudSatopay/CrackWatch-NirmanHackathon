import { motion } from "framer-motion";
import { User, Shield, Bell, MapPin, LogOut, ChevronRight, Moon, Globe, HardDrive } from "lucide-react";

export default function SettingsPage({ user, onLogout }) {
  return (
    <motion.div className="space-y-6 max-w-2xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Profile card */}
      <div className="bg-white/[0.03] rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
            <User className="w-7 h-7 text-black" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">{user?.name || "Inspector"}</h3>
            <p className="text-sm text-white/40">{user?.department || "Municipal Department"}</p>
            <p className="text-xs text-emerald-400/60 font-mono mt-0.5">{user?.role || "government"}</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">ACTIVE</span>
        </div>
      </div>

      {/* Settings sections */}
      <div className="bg-white/[0.03] rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
        <p className="px-5 py-3 text-[10px] text-white/30 uppercase tracking-[0.15em] font-bold">General</p>
        {[
          { icon: Moon, label: "Dark Mode", value: "Always On", locked: true },
          { icon: Globe, label: "Language", value: "English" },
          { icon: Bell, label: "Notifications", value: "Enabled" },
          { icon: MapPin, label: "Default Region", value: "Mumbai, Maharashtra" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
              <item.icon className="w-4 h-4 text-white/40" />
            </div>
            <span className="flex-1 text-sm text-white/70 font-medium">{item.label}</span>
            <span className="text-xs text-white/30">{item.value}</span>
            <ChevronRight className="w-4 h-4 text-white/15" />
          </div>
        ))}
      </div>

      <div className="bg-white/[0.03] rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
        <p className="px-5 py-3 text-[10px] text-white/30 uppercase tracking-[0.15em] font-bold">System</p>
        {[
          { icon: HardDrive, label: "AI Model", value: "YOLOv8s-RDD + CrackSeg (Local)" },
          { icon: Shield, label: "API Status", value: "Healthy", color: "text-emerald-400" },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3.5">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
              <item.icon className="w-4 h-4 text-white/40" />
            </div>
            <span className="flex-1 text-sm text-white/70 font-medium">{item.label}</span>
            <span className={`text-xs ${item.color || 'text-white/30'}`}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Logout */}
      <motion.button
        onClick={onLogout}
        className="w-full py-3.5 rounded-xl bg-[#ff6b6b]/5 border border-[#ff6b6b]/10 text-[#ff6b6b] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#ff6b6b]/10 transition-colors"
        whileTap={{ scale: 0.98 }}
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </motion.button>

      <p className="text-center text-[10px] text-white/10">CRACKWATCH v1.1.0 — NIRMAN Hackathon 2026</p>
    </motion.div>
  );
}
