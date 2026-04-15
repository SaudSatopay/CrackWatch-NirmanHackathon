import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Clock, CheckCircle, AlertTriangle, Share2, Shield } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Demo stats for hackathon (shown when no API data)
const DEMO_STATS = {
  total_reports: 847,
  fixed: 523,
  in_progress: 89,
  acknowledged: 67,
  pending: 168,
  performance_score: 80.1,
  total_estimated_cost: 4250000,
  total_estimated_cost_formatted: "₹42,50,000",
};

function AnimatedNumber({ value, duration = 1500 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return;
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.floor(num * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <span>{display.toLocaleString('en-IN')}</span>;
}

function ScoreRing({ score }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  const color = score > 70 ? '#4edea3' : score > 40 ? '#ffb95f' : '#ffb4ab';

  return (
    <div className="relative w-32 h-32 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#1c1b1d" strokeWidth="6" />
        <motion.circle
          cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold" style={{ color }}>{score}%</span>
        <span className="text-[9px] text-[#bbcabf] uppercase tracking-wider">Score</span>
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState(DEMO_STATS);

  useEffect(() => {
    fetch(`${API_URL}/public/stats`)
      .then(r => r.json())
      .then(data => {
        if (data.total_reports > 0) setStats(data);
      })
      .catch(() => {});
  }, []);

  const fixRate = stats.total_reports > 0 ? ((stats.fixed / stats.total_reports) * 100).toFixed(1) : 0;

  return (
    <div className="h-full overflow-y-auto px-4 py-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Government Transparency</h2>
          <p className="text-[11px] text-[#bbcabf]">Public accountability dashboard</p>
        </div>
        <button className="p-2 rounded-xl bg-[#1c1b1d] text-[#bbcabf]">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Performance Score Ring */}
      <motion.div
        className="bg-[#1c1b1d] rounded-2xl p-5 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-[10px] text-[#bbcabf] uppercase tracking-widest font-bold mb-3">Government Performance</p>
        <ScoreRing score={stats.performance_score} />
        <p className="text-xs text-[#bbcabf] mt-3">
          {stats.performance_score > 70 ? 'Performing above average' : stats.performance_score > 40 ? 'Needs improvement' : 'Critical — action needed'}
        </p>
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Reports', value: stats.total_reports, icon: BarChart3, color: '#e5e1e4' },
          { label: 'Fixed', value: stats.fixed, icon: CheckCircle, color: '#4edea3' },
          { label: 'Pending', value: stats.pending, icon: AlertTriangle, color: '#ffb4ab' },
          { label: 'In Progress', value: stats.in_progress, icon: Clock, color: '#5de6ff' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            className="bg-[#1c1b1d] rounded-xl p-3.5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
              <span className="text-[10px] text-[#bbcabf] uppercase tracking-wider font-medium">{stat.label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: stat.color }}>
              <AnimatedNumber value={stat.value} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Fix Rate Bar */}
      <motion.div
        className="bg-[#1c1b1d] rounded-2xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] text-[#bbcabf] font-bold uppercase tracking-wider">Fix Rate</span>
          <span className="text-sm font-bold text-[#4edea3]">{fixRate}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-[#0e0e10] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#4edea3] to-[#10b981]"
            initial={{ width: 0 }}
            animate={{ width: `${fixRate}%` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-[#bbcabf]/60">
          <span>{stats.fixed} fixed</span>
          <span>{stats.pending} unfixed</span>
        </div>
      </motion.div>

      {/* Cost & Impact */}
      <motion.div
        className="bg-[#1c1b1d] rounded-2xl p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-[#ffb95f]" />
          <span className="text-[11px] text-[#bbcabf] font-bold uppercase tracking-wider">Estimated Repair Cost</span>
        </div>
        <div className="text-2xl font-bold text-white">
          {stats.total_estimated_cost_formatted || `₹${stats.total_estimated_cost?.toLocaleString('en-IN')}`}
        </div>
        <p className="text-[10px] text-[#bbcabf] mt-1">Total cost to fix all reported damages</p>
      </motion.div>

      {/* Transparency message */}
      <div className="text-center py-3">
        <p className="text-[10px] text-[#bbcabf]/50">
          Data is public. Government is accountable.
        </p>
        <p className="text-[10px] text-[#4edea3]/50 font-semibold">
          CRACKWATCH — Smart Infrastructure for All
        </p>
      </div>
    </div>
  );
}
