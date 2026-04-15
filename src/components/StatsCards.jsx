import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ScanLine,
  AlertTriangle,
  CheckCircle,
  Activity,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

function AnimatedCounter({ target, duration = 2000, prefix = "", suffix = "" }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

const stats = [
  {
    label: "Total Scans",
    value: 1247,
    change: "+12.5%",
    trend: "up",
    icon: ScanLine,
    color: "emerald",
    gradient: "from-emerald-500/20 to-emerald-500/0",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
  {
    label: "Cracks Detected",
    value: 89,
    change: "+3.2%",
    trend: "up",
    icon: AlertTriangle,
    color: "red",
    gradient: "from-red-500/20 to-red-500/0",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
  },
  {
    label: "Clear Scans",
    value: 1158,
    change: "+15.8%",
    trend: "up",
    icon: CheckCircle,
    color: "cyan",
    gradient: "from-cyan-500/20 to-cyan-500/0",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
  },
  {
    label: "Accuracy Rate",
    value: 98.7,
    change: "+0.3%",
    trend: "up",
    icon: Activity,
    color: "violet",
    gradient: "from-violet-500/20 to-violet-500/0",
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-400",
    suffix: "%",
    decimals: true,
  },
];

export default function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
        >
          <motion.div
            className="relative overflow-hidden rounded-xl bg-zinc-900/50 border border-zinc-800/50 p-4 group cursor-pointer"
            whileHover={{ scale: 1.02, borderColor: "rgba(255,255,255,0.1)" }}
            transition={{ duration: 0.2 }}
          >
            {/* Background gradient */}
            <div
              className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${stat.gradient} opacity-50 blur-2xl group-hover:opacity-80 transition-opacity`}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`flex items-center justify-center w-9 h-9 rounded-lg ${stat.iconBg}`}
                >
                  <stat.icon className={`w-4.5 h-4.5 ${stat.iconColor}`} />
                </div>
                <div
                  className={`flex items-center gap-1 text-xs font-medium ${
                    stat.trend === "up" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {stat.trend === "up" ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {stat.change}
                </div>
              </div>

              <div className="text-2xl font-bold text-white tracking-tight">
                <AnimatedCounter
                  target={stat.value}
                  suffix={stat.suffix || ""}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">{stat.label}</p>
            </div>

            {/* Animated bottom bar */}
            <motion.div
              className={`absolute bottom-0 left-0 h-[2px] bg-gradient-to-r ${
                stat.color === "emerald"
                  ? "from-emerald-500 to-emerald-500/0"
                  : stat.color === "red"
                  ? "from-red-500 to-red-500/0"
                  : stat.color === "cyan"
                  ? "from-cyan-500 to-cyan-500/0"
                  : "from-violet-500 to-violet-500/0"
              }`}
              initial={{ width: "0%" }}
              animate={{ width: "60%" }}
              transition={{ delay: i * 0.1 + 0.5, duration: 1 }}
            />
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}
