import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, X, Navigation, AlertTriangle, Clock, CheckCircle, ChevronUp } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const STATUS = {
  submitted:    { color: '#ff6b6b', bg: '#ff6b6b15', label: 'Not Fixed',    icon: AlertTriangle, dot: '🔴' },
  acknowledged: { color: '#ffa94d', bg: '#ffa94d15', label: 'Acknowledged', icon: Clock,         dot: '🟠' },
  in_progress:  { color: '#74c0fc', bg: '#74c0fc15', label: 'In Progress',  icon: Clock,         dot: '🔵' },
  fixed:        { color: '#69db7c', bg: '#69db7c15', label: 'Fixed',        icon: CheckCircle,   dot: '🟢' },
};

function severityColor(s) {
  if (s >= 70) return '#ff6b6b';
  if (s >= 40) return '#ffa94d';
  return '#69db7c';
}

const DEMO = [
  { id: 'RPT-001', latitude: 19.0330, longitude: 73.0297, location_name: 'Ghodbunder Road, Thane', damage_type: 'Pothole', severity: 82, status: 'submitted', upvotes: 23, defect_count: 3, reporter: 'Rahul M.', description: 'Massive pothole near bus stop, bikes at risk', timestamp: '2026-04-13T09:42:00Z' },
  { id: 'RPT-002', latitude: 19.0176, longitude: 73.0596, location_name: 'Panvel Station Road', damage_type: 'Alligator Crack', severity: 65, status: 'in_progress', upvotes: 12, defect_count: 2, reporter: 'Priya S.', description: 'Road surface breaking apart near railway crossing', timestamp: '2026-04-12T14:07:00Z' },
  { id: 'RPT-003', latitude: 19.0450, longitude: 73.0200, location_name: 'Mumbai-Pune Expressway KM 42', damage_type: 'Pothole', severity: 91, status: 'submitted', upvotes: 47, defect_count: 5, reporter: 'Amit K.', description: 'Multiple deep potholes, caused 2 accidents last week', timestamp: '2026-04-11T08:23:00Z' },
  { id: 'RPT-004', latitude: 19.0280, longitude: 73.0450, location_name: 'Amity University Road', damage_type: 'Transverse Crack', severity: 28, status: 'fixed', upvotes: 5, defect_count: 1, reporter: 'Saud V.', description: 'Minor crack near university gate', timestamp: '2026-04-10T17:50:00Z' },
  { id: 'RPT-005', latitude: 19.0550, longitude: 73.0100, location_name: 'Kalamboli Flyover', damage_type: 'Pothole', severity: 73, status: 'acknowledged', upvotes: 18, defect_count: 2, reporter: 'Neha D.', description: 'Pothole on flyover causing traffic slowdown', timestamp: '2026-04-09T11:30:00Z' },
  { id: 'RPT-006', latitude: 19.0100, longitude: 73.0700, location_name: 'Old Panvel Bridge', damage_type: 'Alligator Crack', severity: 87, status: 'submitted', upvotes: 34, defect_count: 4, reporter: 'Vikram T.', description: 'Bridge surface severely cracked, structural concern', timestamp: '2026-04-08T06:15:00Z' },
  { id: 'RPT-007', latitude: 19.0380, longitude: 73.0350, location_name: 'Kharghar Sector 12', damage_type: 'Surface Spalling', severity: 45, status: 'in_progress', upvotes: 8, defect_count: 1, reporter: 'Anjali R.', description: 'Concrete surface peeling off on main road', timestamp: '2026-04-13T20:00:00Z' },
  { id: 'RPT-008', latitude: 19.0600, longitude: 73.0050, location_name: 'Belapur CBD', damage_type: 'Longitudinal Crack', severity: 38, status: 'fixed', upvotes: 3, defect_count: 1, reporter: 'Kiran P.', description: 'Long crack along road, was fixed last week', timestamp: '2026-04-07T15:45:00Z' },
];

function FlyTo({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 15, { duration: 0.8 }); }, [center]);
  return null;
}

export default function MapPage() {
  const [reports, setReports] = useState(DEMO);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const [flyTo, setFlyTo] = useState(null);
  const [upvoted, setUpvoted] = useState(new Set());

  useEffect(() => {
    fetch(`${API_URL}/public/reports/map/detail`).then(r => r.json()).then(d => {
      if (d.reports?.length) setReports(prev => [...prev, ...d.reports]);
    }).catch(() => {});
  }, []);

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);
  const counts = {
    all: reports.length,
    submitted: reports.filter(r => r.status === 'submitted').length,
    in_progress: reports.filter(r => r.status === 'in_progress' || r.status === 'acknowledged').length,
    fixed: reports.filter(r => r.status === 'fixed').length,
  };

  const handleUpvote = async (report) => {
    if (upvoted.has(report.id)) return;
    // Optimistic update
    setReports(prev => prev.map(r => r.id === report.id ? { ...r, upvotes: r.upvotes + 1 } : r));
    setSelected(prev => prev?.id === report.id ? { ...prev, upvotes: prev.upvotes + 1 } : prev);
    setUpvoted(prev => new Set([...prev, report.id]));
    // API call
    try { await fetch(`${API_URL}/public/reports/${report.id}/upvote`, { method: 'POST' }); } catch {}
  };

  const daysAgo = (ts) => {
    const d = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
    return d === 0 ? 'Today' : d === 1 ? '1 day ago' : `${d} days ago`;
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Header bar */}
      <div className="absolute top-0 left-0 right-0 z-[1000] px-4 pt-3 pb-2 bg-gradient-to-b from-[#131315] via-[#131315]/90 to-transparent">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight" style={{ fontFamily: 'Space Grotesk' }}>
              CRACK<span className="text-[#4edea3]">WATCH</span>
            </h1>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#4edea3]/10 border border-[#4edea3]/20">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
            <span className="text-[10px] text-[#4edea3] font-bold">LIVE</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All', count: counts.all },
            { key: 'submitted', label: 'Unfixed', count: counts.submitted, color: '#ff6b6b' },
            { key: 'in_progress', label: 'In Progress', count: counts.in_progress, color: '#74c0fc' },
            { key: 'fixed', label: 'Fixed', count: counts.fixed, color: '#69db7c' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                filter === f.key ? 'bg-white/10 text-white' : 'bg-white/[0.03] text-white/40'
              }`}
            >
              {f.color && <span className="w-1.5 h-1.5 rounded-full" style={{ background: f.color }} />}
              {f.count} {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <MapContainer center={[19.035, 73.035]} zoom={13} className="h-full w-full" zoomControl={false}>
          <FlyTo center={flyTo} />
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

          {filtered.map(r => {
            const cfg = STATUS[r.status] || STATUS.submitted;
            const isSelected = selected?.id === r.id;
            return (
              <CircleMarker
                key={r.id}
                center={[r.latitude, r.longitude]}
                radius={isSelected ? 14 : r.severity > 70 ? 11 : r.severity > 40 ? 9 : 7}
                pathOptions={{
                  color: cfg.color,
                  fillColor: cfg.color,
                  fillOpacity: isSelected ? 0.5 : r.status === 'submitted' ? 0.35 : 0.15,
                  weight: isSelected ? 3 : 2,
                }}
                eventHandlers={{
                  click: () => {
                    setSelected(r);
                    setFlyTo([r.latitude, r.longitude]);
                  },
                }}
              />
            );
          })}
        </MapContainer>
      </div>

      {/* Selected report bottom sheet */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-14 left-0 right-0 z-[1000] mx-3"
          >
            <div className="bg-[#1c1b1d]/95 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/[0.06] shadow-2xl shadow-black/50">
              {/* Handle + Close */}
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <div className="w-8 h-1 rounded-full bg-white/10 mx-auto" />
                <button onClick={() => setSelected(null)} className="absolute right-3 top-3 p-1 rounded-full bg-white/5">
                  <X className="w-4 h-4 text-white/40" />
                </button>
              </div>

              <div className="px-4 pb-4">
                {/* Photo */}
                {selected.annotated_image && (
                  <div className="rounded-xl overflow-hidden mb-3 h-36 bg-[#0e0e10]">
                    <img
                      src={`data:image/jpeg;base64,${selected.annotated_image}`}
                      alt="Damage"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Type + Status */}
                <div className="flex items-start justify-between mb-1">
                  <h3 className="text-base font-bold text-white" style={{ fontFamily: 'Space Grotesk' }}>{selected.damage_type}</h3>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: STATUS[selected.status]?.bg, color: STATUS[selected.status]?.color }}>
                    {STATUS[selected.status]?.dot} {STATUS[selected.status]?.label}
                  </span>
                </div>

                {/* Location + time */}
                <p className="text-[12px] text-white/50 mb-3">{selected.location_name} · {daysAgo(selected.timestamp)}</p>

                {/* Description */}
                {selected.description && (
                  <p className="text-[12px] text-white/60 mb-3 leading-relaxed">{selected.description}</p>
                )}

                {/* Cost estimate */}
                {selected.cost_estimated > 0 && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#ffa94d]/[0.06] mb-3">
                    <span className="text-[11px] text-white/40">Est. Repair Cost</span>
                    <span className="text-sm font-bold text-[#ffa94d]">₹{selected.cost_estimated?.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {/* Severity bar */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Severity</span>
                    <span className="text-sm font-bold" style={{ color: severityColor(selected.severity) }}>{selected.severity}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${severityColor(selected.severity)}88, ${severityColor(selected.severity)})` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${selected.severity}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-white/[0.03] rounded-xl p-2.5 text-center">
                    <div className="text-lg font-bold text-white">{selected.defect_count}</div>
                    <div className="text-[9px] text-white/30 font-medium uppercase">Defects</div>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-2.5 text-center">
                    <div className="text-lg font-bold text-[#4edea3]">{selected.upvotes}</div>
                    <div className="text-[9px] text-white/30 font-medium uppercase">Upvotes</div>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-2.5 text-center">
                    <div className="text-lg font-bold text-white/70">{selected.reporter?.split(' ')[0]}</div>
                    <div className="text-[9px] text-white/30 font-medium uppercase">Reporter</div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <motion.button
                    onClick={() => handleUpvote(selected)}
                    disabled={upvoted.has(selected.id)}
                    className={`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      upvoted.has(selected.id)
                        ? 'bg-[#4edea3]/10 text-[#4edea3]'
                        : 'bg-gradient-to-r from-[#4edea3] to-[#10b981] text-[#002113]'
                    }`}
                    whileTap={{ scale: 0.97 }}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    {upvoted.has(selected.id) ? 'Upvoted!' : 'Upvote This'}
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      window.open(`https://www.google.com/maps/dir/?api=1&destination=${selected.latitude},${selected.longitude}`, '_blank');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-white/70 font-medium text-sm flex items-center gap-1.5"
                    whileTap={{ scale: 0.97 }}
                  >
                    <Navigation className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
